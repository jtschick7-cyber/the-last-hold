import { BUILDING_IDS, buildings, type BuildingId } from '../../content/buildings';
import { JOB_IDS, type JobId } from '../../content/jobs';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { constantAt } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { isAvailable, maxLevelNow } from './ages';
import { buildingCost, canAfford } from './costs';
import { housing, idlePeasants, jobSlots } from './housing';
import { productionRate } from './production';

// GDD §5.1.2 (B7): one valuation shared by the ● hint and the simulator.
//   value(bundle) = Σ w_r × amount_r
//   payback(item) = value(cost) ÷ value(Δrate per min)   (lower is better)

const weights = (): Record<ResourceId, number> =>
  constantAt('value.weights').value as Record<ResourceId, number>;

export const bundleValue = (bundle: Readonly<Record<ResourceId, number>>): number => {
  const w = weights();
  return RESOURCE_IDS.reduce((s, r) => s + w[r] * bundle[r], 0);
};

/** The value of everything the hold produces per minute. */
export const rateValue = (state: GameState): number => {
  const w = weights();
  return RESOURCE_IDS.reduce((s, r) => s + w[r] * productionRate(state, r).value, 0);
};

const freeSlots = (state: GameState, job: JobId): number =>
  jobSlots(state, job).value - state.peasants.jobs[job];

/** Puts up to n peasants into the open slots worth the most, one at a time. */
const placeBest = (state: GameState, n: number): void => {
  for (let i = 0; i < n; i++) {
    let best: JobId | null = null;
    let bestGain = 0;
    const now = rateValue(state);
    for (const job of JOB_IDS) {
      if (freeSlots(state, job) < 1) continue;
      state.peasants.jobs[job] += 1;
      const gain = rateValue(state) - now;
      state.peasants.jobs[job] -= 1;
      if (gain > bestGain) {
        best = job;
        bestGain = gain;
      }
    }
    if (!best) return;
    state.peasants.jobs[best] += 1;
  }
};

/**
 * The production one more copy or level adds right now, valued (GDD §5.1.2):
 * production levels add directly; housing adds peasants placed in the best open
 * slots (0 if none are free); slot buildings count only if idle peasants wait.
 */
export const deltaRateValue = (state: GameState, id: BuildingId): number => {
  const before = rateValue(state);
  const after = structuredClone(state);
  after.buildings[id] += 1;
  // Peasants already idle take open slots first; they aren't this purchase's doing.
  const alreadyIdle = idlePeasants(state);
  const extraHousing = housing(after).value - housing(state).value;
  if (extraHousing > 0) {
    placeBest(after, alreadyIdle);
    const base = rateValue(after);
    after.peasants.total += extraHousing;
    placeBest(after, extraHousing);
    return rateValue(after) - base;
  }
  placeBest(after, alreadyIdle);
  return rateValue(after) - before;
};

/** Whether a copy or level could be bought now if affordable. */
const buildable = (state: GameState, id: BuildingId): boolean => {
  const def = buildings[id];
  if (def.kind === 'unique' || !isAvailable(state, def)) return false;
  if (def.kind === 'level') return state.buildings[id] < maxLevelNow(state, id);
  return !def.maxCountKey || state.buildings[id] < (constantAt(def.maxCountKey).value as number);
};

export const payback = (state: GameState, id: BuildingId): Explained => {
  const cost = bundleValue(buildingCost(state, id).bundle);
  const gain = deltaRateValue(state, id);
  const value = gain > 0 ? cost / gain : Number.POSITIVE_INFINITY;
  return {
    value,
    breakdown: {
      label: `Payback: ${buildings[id].name}`,
      value,
      formula: 'value(cost) ÷ value(Δrate per min)',
      children: [
        { label: 'Value of the cost', value: cost, key: 'value.weights' },
        { label: 'Value of the extra production per minute', value: gain, key: 'value.weights' },
      ],
    },
  };
};

/**
 * GDD §9.2: the ● marks the best payback among affordable options. Items that
 * add no production (Δrate = 0) never get it. Age-ups are excluded.
 */
export const bestBuy = (state: GameState): BuildingId | null => {
  let best: BuildingId | null = null;
  let bestPayback = Number.POSITIVE_INFINITY;
  for (const id of BUILDING_IDS) {
    if (!buildable(state, id) || !canAfford(state, buildingCost(state, id).bundle)) continue;
    const p = payback(state, id).value;
    if (p < bestPayback) {
      best = id;
      bestPayback = p;
    }
  }
  return best;
};
