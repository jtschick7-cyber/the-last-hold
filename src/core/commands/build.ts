import { BUILDING_IDS, buildings, type BuildingId } from '../../content/buildings';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import type { GameState } from '../state/game-state';
import { isAvailable, maxLevelNow } from '../systems/ages';
import { buildingCost, canAfford, copyLimit, maxAffordableCount } from '../systems/costs';
import { syncBoardOpen } from '../contracts/board';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.1.2: construction is instant; pacing comes from costs.

const pay = (state: GameState, bundle: Record<ResourceId, number>): void => {
  for (const r of RESOURCE_IDS) state.resources[r] -= bundle[r];
};

const known = (id: unknown): id is BuildingId =>
  typeof id === 'string' && (BUILDING_IDS as readonly string[]).includes(id);

export const buy = (state: GameState, id: BuildingId, count: number | 'max'): ApplyResult => {
  if (!known(id)) return refuse('That building does not exist.');
  const def = buildings[id];
  if (def.kind !== 'count') return refuse(`${def.name} is upgraded, not bought.`);
  if (!isAvailable(state, def)) return refuse(`${def.name} isn't available at this Rank.`);
  const k = count === 'max' ? maxAffordableCount(state, id) : count;
  if (!Number.isInteger(k) || k < 1) {
    return count === 'max'
      ? refuse(`Can't afford a ${def.name} yet.`)
      : refuse('Buy at least one.');
  }
  const limit = copyLimit(id);
  if (limit !== null && state.buildings[id] + k > limit) {
    return refuse(
      limit === 1 ? `${def.name} can be built once.` : `At most ${limit} ${def.name}s.`,
    );
  }
  const cost = buildingCost(state, id, k).bundle;
  if (!canAfford(state, cost)) return refuse(`Not enough resources for ${k} × ${def.name}.`);
  pay(state, cost);
  state.buildings[id] += k;
  state.stats.buildingsBought += k;
  syncBoardOpen(state); // the first Mine opens the contract board (GDD §5.4.1)
  return ok;
};

export const upgrade = (state: GameState, id: BuildingId): ApplyResult => {
  if (!known(id)) return refuse('That building does not exist.');
  const def = buildings[id];
  if (def.kind !== 'level') return refuse(`${def.name} can't be upgraded.`);
  if (!isAvailable(state, def)) return refuse(`${def.name} isn't available at this Rank.`);
  if (state.buildings[id] >= maxLevelNow(state, id)) {
    return refuse(`${def.name} is at its highest level for this Rank.`);
  }
  const cost = buildingCost(state, id).bundle;
  if (!canAfford(state, cost)) return refuse(`Not enough resources for ${def.name}.`);
  pay(state, cost);
  state.buildings[id] += 1;
  state.stats.buildingsBought += 1;
  return ok;
};
