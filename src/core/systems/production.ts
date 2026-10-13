import { AGE_IDS, ages } from '../../content/ages';
import { BUILDING_IDS, buildings } from '../../content/buildings';
import { SILVER_BUCKETS } from '../../content/buckets';
import { JOB_IDS, jobs } from '../../content/jobs';
import { resources, type ResourceId } from '../../content/resources';
import { num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { jobSlots } from './housing';
import { applyBuckets, type Bonus } from './buckets';

// GDD §5.1.1: rate_R = workers_R × baseRate_R × buckets. Rates are per minute,
// as the GDD writes them; advance() converts.

const buildingBonuses = (state: GameState, resource: ResourceId): Bonus[] =>
  BUILDING_IDS.flatMap((id) => {
    const level = state.buildings[id];
    return buildings[id].effects.flatMap((e) =>
      e.kind === 'production' && e.resource === resource && level > 0
        ? [
            {
              bucket: 'building' as const,
              label: `${buildings[id].name} level ${level}`,
              value: level * num(e.perLevelKey),
              key: e.perLevelKey,
            },
          ]
        : [],
    );
  });

/** GDD §5.1.3 (D106): each Rank reached adds its bonus to the age bucket (Citadel adds to the Keep's). */
const ageBonuses = (state: GameState): Bonus[] =>
  AGE_IDS.slice(0, AGE_IDS.indexOf(state.cycle.age) + 1).flatMap((age) => {
    const up = ages[age].ageUp;
    return up
      ? [
          {
            bucket: 'age' as const,
            label: ages[age].name,
            value: num(up.allProductionKey),
            key: up.allProductionKey,
          },
        ]
      : [];
  });

/** GDD §5.4.4: +0.5% to all production per trophy earned this cycle, once the Trophy Hall stands. */
const trophyBonuses = (state: GameState): Bonus[] => {
  const trophies = state.stats.trophies;
  return BUILDING_IDS.flatMap((id) =>
    buildings[id].effects.flatMap((e) =>
      e.kind === 'trophyBonus' && state.buildings[id] > 0 && trophies > 0
        ? [
            {
              bucket: 'trophy' as const,
              label: `${buildings[id].name}: ${trophies} trophies`,
              value: trophies * num(e.perTrophyKey),
              key: e.perTrophyKey,
            },
          ]
        : [],
    ),
  );
};

/** Production of one resource per minute, with its breakdown. `workers` overrides the job's headcount (for capacity). */
export const productionRate = (
  state: GameState,
  resource: ResourceId,
  workers?: number,
): Explained => {
  const job = JOB_IDS.find((j) => jobs[j].produces === resource);
  if (!job) return { value: 0, breakdown: { label: `${resource} per minute`, value: 0 } };
  const def = jobs[job];
  const count = workers ?? state.peasants.jobs[job];
  const perWorker = num(def.rateKey);
  const base = {
    label: `${def.name}s × base rate`,
    value: count * perWorker,
    formula: `${count} × ${perWorker}`,
    children: [
      { label: `${def.name}s`, value: count },
      { label: 'Base rate per worker', value: perWorker, key: def.rateKey },
    ],
  };
  const bonuses = [
    ...buildingBonuses(state, resource),
    ...ageBonuses(state),
    ...trophyBonuses(state),
  ];
  // G1 (D30): silver-digger output takes only the relic and event buckets.
  const result =
    resource === 'silver'
      ? applyBuckets(base, bonuses, SILVER_BUCKETS)
      : applyBuckets(base, bonuses);
  return {
    value: result.value,
    breakdown: {
      ...result.breakdown,
      label: `${resources[def.produces].name} per minute`,
      ...(resource === 'silver'
        ? { formula: 'base × relic × event (no other bonuses apply to silver)' }
        : {}),
    },
  };
};

/**
 * Food per minute if every farmer slot were filled, limited only by how many peasants the
 * hold has (GDD §5.4.2, Q11). Provisions read this instead of today's food income, so moving
 * peasants between jobs right before a launch cannot lower them.
 */
export const foodCapacity = (state: GameState): Explained => {
  const slots = jobSlots(state, 'farmer').value;
  const farmers = Math.min(slots, state.peasants.total);
  const rate = productionRate(state, 'food', farmers);
  return {
    value: rate.value,
    breakdown: {
      ...rate.breakdown,
      label: 'Food capacity per minute',
      children: [
        ...(rate.breakdown.children ?? []),
        { label: 'Farmer slots', value: slots },
        { label: 'Peasants', value: state.peasants.total },
      ],
    },
  };
};
