import { alternateTraits } from '../../content/delves/alternate-traits';
import { COSMETIC_IDS, LATE_HOURS_LEVELS, type CosmeticId } from '../../content/delves/shop';
import { HUNTER_IDS, hunters, type HunterId } from '../../content/hunters';
import { balance } from '../../content/balance';
import type { Explained } from '../breakdown/breakdown';
import { ok, refuse, type ApplyResult } from '../commands/types';
import type { GameState } from '../state/game-state';
import { hunterStatus } from '../systems/hunters';
import { offlineCap } from '../systems/offline-cap';
import { num } from '../balance-access';

// GDD §5.10.8 (D259, D260): the Riftglass shop on the Rank screen. Costs are the tunable
// `riftglass.shop.*` keys. Every purchase is Riftglass on hand, kept forever (it survives the
// Long Night); the alternate traits are sidegrades, switched freely while a hunter is free.

const costs = () => balance.riftglass.shop;

/** The next level of Late hours costs this (30 / 45 / 60 / 75 / 90); null when all five are bought. */
export const lateHoursCost = (state: GameState): Explained | null => {
  const level = state.delve.shop.lateHours;
  const price = costs().lateHours.value[level];
  if (level >= LATE_HOURS_LEVELS || price === undefined) return null;
  return {
    value: price,
    breakdown: {
      label: `Late hours, level ${level + 1}`,
      value: price,
      formula: `level ${level + 1} of ${LATE_HOURS_LEVELS}`,
      key: 'riftglass.shop.lateHours',
    },
  };
};

export const traitCost = (): number => costs().trait.value;
export const cosmeticCost = (): number => costs().cosmetic.value;

const short = (state: GameState, cost: number): string | null =>
  state.delve.riftglass < cost
    ? `That costs ${cost} Riftglass; you have ${state.delve.riftglass}.`
    : null;

const known = (id: unknown): id is HunterId =>
  typeof id === 'string' && (HUNTER_IDS as readonly string[]).includes(id);

// Each purchase has a `…Problem` (why it cannot be bought now, or null) that its buy function and
// the shop screen both use, so what the screen says is what the command would refuse.

export const lateHoursProblem = (state: GameState): string | null => {
  const cost = lateHoursCost(state);
  if (!cost) return 'Late hours is at its last level.';
  if (offlineCap(state).value >= num('offline.ceiling'))
    return 'Your offline cap is already at the 24 hour ceiling.';
  return short(state, cost.value);
};

export const buyLateHours = (state: GameState): ApplyResult => {
  const problem = lateHoursProblem(state);
  const cost = lateHoursCost(state);
  if (problem || !cost) return refuse(problem ?? 'Late hours is at its last level.');
  state.delve.riftglass -= cost.value;
  state.delve.shop.lateHours += 1;
  return ok;
};

export const traitProblem = (state: GameState, id: HunterId): string | null => {
  if (!known(id) || !state.hunters[id]) return 'That hunter is not at the hold.';
  if (state.delve.shop.traitsBought.includes(id))
    return `${hunters[id].shortName}'s other trait is already bought.`;
  if (!alternateTraits.some((a) => a.hunter === id)) return 'That hunter has no other trait.';
  return short(state, traitCost());
};

/** Unlocks one hunter's alternate second trait (D260). */
export const buyAlternateTrait = (state: GameState, id: HunterId): ApplyResult => {
  const problem = traitProblem(state, id);
  if (problem) return refuse(problem);
  state.delve.riftglass -= traitCost();
  state.delve.shop.traitsBought.push(id);
  return ok;
};

export const switchProblem = (
  state: GameState,
  id: HunterId,
  alternate: boolean,
): string | null => {
  if (!known(id) || !state.hunters[id]) return 'That hunter is not at the hold.';
  if (!state.delve.shop.traitsBought.includes(id)) return 'That trait has not been bought.';
  const status = hunterStatus(state, id);
  if (status === 'on-contract') return `${hunters[id].shortName} is on a contract.`;
  if (status === 'in-delve') return `${hunters[id].shortName} is in a Delve.`;
  const on = state.delve.shop.traitsActive.includes(id);
  if (on === alternate) return alternate ? 'Already using it.' : 'Already using the first one.';
  return null;
};

/** Switches a hunter between their two second traits, while they are not on a contract or in a run (D260). */
export const switchTrait = (state: GameState, id: HunterId, alternate: boolean): ApplyResult => {
  const problem = switchProblem(state, id, alternate);
  if (problem) return refuse(problem);
  const active = state.delve.shop.traitsActive;
  state.delve.shop.traitsActive = alternate ? [...active, id] : active.filter((h) => h !== id);
  return ok;
};

export const cosmeticProblem = (state: GameState, id: CosmeticId): string | null => {
  if (!(COSMETIC_IDS as readonly string[]).includes(id)) return 'That is not in the shop.';
  if (state.delve.shop.cosmetics.includes(id)) return 'Already bought.';
  return short(state, cosmeticCost());
};

export const buyCosmetic = (state: GameState, id: CosmeticId): ApplyResult => {
  const problem = cosmeticProblem(state, id);
  if (problem) return refuse(problem);
  state.delve.riftglass -= cosmeticCost();
  state.delve.shop.cosmetics.push(id);
  return ok;
};

export const chosenStartProblem = (state: GameState): string | null =>
  state.delve.shop.chosenStart ? 'Already bought.' : short(state, costs().chosenStart.value);

export const buyChosenStart = (state: GameState): ApplyResult => {
  const problem = chosenStartProblem(state);
  if (problem) return refuse(problem);
  state.delve.riftglass -= costs().chosenStart.value;
  state.delve.shop.chosenStart = true;
  return ok;
};

export const rerollProblem = (state: GameState): string | null =>
  state.delve.shop.reroll ? 'Already bought.' : short(state, costs().reroll.value);

export const buyReroll = (state: GameState): ApplyResult => {
  const problem = rerollProblem(state);
  if (problem) return refuse(problem);
  state.delve.riftglass -= costs().reroll.value;
  state.delve.shop.reroll = true;
  return ok;
};
