import { ages } from '../../content/ages';
import { BUILDING_IDS, buildings } from '../../content/buildings';
import { SILVER_BUCKETS } from '../../content/buckets';
import { JOB_IDS, jobs } from '../../content/jobs';
import { resources, type ResourceId } from '../../content/resources';
import { num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
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

const ageBonuses = (state: GameState): Bonus[] => {
  const up = ages[state.cycle.age].ageUp;
  return up
    ? [
        {
          bucket: 'age',
          label: ages[state.cycle.age].name,
          value: num(up.allProductionKey),
          key: up.allProductionKey,
        },
      ]
    : [];
};

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

/** Production of one resource per minute, with its breakdown. */
export const productionRate = (state: GameState, resource: ResourceId): Explained => {
  const job = JOB_IDS.find((j) => jobs[j].produces === resource);
  if (!job) return { value: 0, breakdown: { label: `${resource} per minute`, value: 0 } };
  const def = jobs[job];
  const count = state.peasants.jobs[job];
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
