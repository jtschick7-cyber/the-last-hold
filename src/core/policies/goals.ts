import { ages } from '../../content/ages';
import { BUILDING_IDS, buildings, type BuildingId } from '../../content/buildings';
import { JOB_IDS, jobs } from '../../content/jobs';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { num } from '../balance-access';
import type { GameState } from '../state/game-state';
import { ageUpStatus, isAvailable, maxLevelNow } from '../systems/ages';
import { buildingCost, canAfford, timeToAfford } from '../systems/costs';
import { housing } from '../systems/housing';
import { productionRate } from '../systems/production';
import { settleCost } from '../systems/settle';
import { MS_PER_SECOND } from '../time';

// What the simulated player knows about its goal, the next Age-up (GDD §6.1,
// D60). Payback alone can't see it: under the locked weights every job is
// worth the same per worker, so the cheapest slots always win and the iron and
// silver the Age-up needs never come. These helpers name what the goal needs.

export type Bundle = Record<ResourceId, number>;

export const emptyBundle = (): Bundle =>
  Object.fromEntries(RESOURCE_IDS.map((r) => [r, 0])) as Bundle;

export const addBundles = (a: Bundle, b: Bundle): Bundle =>
  Object.fromEntries(RESOURCE_IDS.map((r) => [r, a[r] + b[r]])) as Bundle;

/** Whether one more copy or level could be bought in this Age, ignoring cost. */
export const buildable = (state: GameState, id: BuildingId): boolean => {
  const def = buildings[id];
  if (def.kind === 'unique' || !isAvailable(state, def)) return false;
  if (def.kind === 'level') return state.buildings[id] < maxLevelNow(state, id);
  return !def.maxCountKey || state.buildings[id] < num(def.maxCountKey);
};

/** Affordable while leaving `reserve` untouched in every resource the cost uses. */
export const affordableWith = (state: GameState, cost: Bundle, reserve = emptyBundle()): boolean =>
  canAfford(state, cost) &&
  RESOURCE_IDS.every((r) => cost[r] <= 0 || state.resources[r] - cost[r] >= reserve[r]);

/** Buildable and affordable with `reserve` left over. */
export const affordable = (state: GameState, id: BuildingId, reserve = emptyBundle()): boolean =>
  buildable(state, id) && affordableWith(state, buildingCost(state, id).bundle, reserve);

const ageUpCost = (state: GameState): Bundle => {
  const status = ageUpStatus(state);
  const cost = status ? (ages[status.to].ageUp?.cost ?? {}) : {};
  return Object.fromEntries(RESOURCE_IDS.map((r) => [r, cost[r] ?? 0])) as Bundle;
};

/** The next Age-up still needs silver the hold doesn't have. */
export const silverWanted = (state: GameState): boolean =>
  ageUpCost(state).silver > state.resources.silver;

/** Buildings (or levels) the next Age-up requires that the hold lacks. */
export const missingRequirements = (state: GameState): BuildingId[] => {
  const status = ageUpStatus(state);
  const req = status ? (ages[status.to].ageUp?.requires.buildings ?? {}) : {};
  return BUILDING_IDS.filter((id) => state.buildings[id] < (req[id] ?? 0));
};

/** Resources the Age-up still needs that the hold doesn't produce at all. */
export const unproduced = (state: GameState): ResourceId[] => {
  const cost = ageUpCost(state);
  return RESOURCE_IDS.filter(
    (r) => cost[r] > state.resources[r] && productionRate(state, r).value <= 0,
  );
};

/** The building that gives a resource's job its slots (Mine for iron). */
export const slotBuildingFor = (r: ResourceId): BuildingId | undefined => {
  const job = JOB_IDS.find((j) => jobs[j].produces === r);
  return BUILDING_IDS.find((id) =>
    buildings[id].effects.some((e) => e.kind === 'jobSlots' && e.job === job),
  );
};

const producesSilver = (id: BuildingId): boolean => slotBuildingFor('silver') === id;

/** First producers still missing: a building whose job makes an unproduced resource. */
export const missingProducers = (state: GameState): BuildingId[] =>
  unproduced(state).flatMap((r) => {
    const id = slotBuildingFor(r);
    return id && state.buildings[id] === 0 ? [id] : [];
  });

/** The food it costs to settle a peasant in every empty bed. */
const settlingFood = (state: GameState): number => {
  let food = 0;
  for (let p = state.peasants.total; p < housing(state).value; p++) food += settleCost(p).value;
  return food;
};

/**
 * The Age-up resource furthest from affordable at current rates, counting the
 * food that settling empty beds will take. Silver is left out: its Seams are capped (G1), so more slots can't speed it up.
 */
export const bottleneck = (state: GameState): ResourceId | null => {
  // Auto-settle will spend food on every empty bed first, so that food is
  // still needed too (D62).
  const cost = { ...ageUpCost(state) };
  if (state.peasants.autoSettle) cost.food += settlingFood(state);
  let worst: ResourceId | null = null;
  let worstMinutes = 0;
  for (const r of RESOURCE_IDS) {
    const short = cost[r] - state.resources[r];
    if (r === 'silver' || short <= 0) continue;
    const rate = productionRate(state, r).value;
    const minutes = rate > 0 ? short / rate : Number.POSITIVE_INFINITY;
    if (minutes > worstMinutes) {
      worst = r;
      worstMinutes = minutes;
    }
  }
  return worst;
};

/**
 * GDD §6.1: once the Age-up's requirements are met and its cost is affordable
 * by the check-in after next, the policy saves for it.
 */
export const shouldSave = (state: GameState, horizonMs: number): boolean => {
  const status = ageUpStatus(state);
  if (!status || !status.requirements.every((r) => r.met)) return false;
  const seconds = timeToAfford(state, ageUpCost(state), (r) => productionRate(state, r).value);
  return seconds !== null && seconds * MS_PER_SECOND <= horizonMs;
};

/**
 * What other purchases must leave untouched: the cost of the first producer of
 * a resource the Age-up needs (the first Mine). Silver Seams are bought as soon
 * as affordable but not saved for. A fresh game's first purchase is never held
 * back, so the Opening still starts with a Cottage (GDD §5.1.4).
 */
export const reserveFor = (state: GameState): Bundle => {
  if (state.stats.buildingsBought === 0) return emptyBundle();
  const firstOf = missingProducers(state).filter((id) => !producesSilver(id));
  return firstOf.reduce(
    (sum, id) => addBundles(sum, buildingCost(state, id).bundle),
    emptyBundle(),
  );
};
