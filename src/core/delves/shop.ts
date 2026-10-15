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

const pay = (state: GameState, cost: number): ApplyResult | null =>
  state.delve.riftglass < cost
    ? refuse(`That costs ${cost} Riftglass; you have ${state.delve.riftglass}.`)
    : null;

export const buyLateHours = (state: GameState): ApplyResult => {
  const cost = lateHoursCost(state);
  if (!cost) return refuse('Late hours is at its last level.');
  if (offlineCap(state).value >= num('offline.ceiling'))
    return refuse('Your offline cap is already at the 24 hour ceiling.');
  const short = pay(state, cost.value);
  if (short) return short;
  state.delve.riftglass -= cost.value;
  state.delve.shop.lateHours += 1;
  return ok;
};

const known = (id: unknown): id is HunterId =>
  typeof id === 'string' && (HUNTER_IDS as readonly string[]).includes(id);

/** Unlocks one hunter's alternate second trait (D260). */
export const buyAlternateTrait = (state: GameState, id: HunterId): ApplyResult => {
  if (!known(id) || !state.hunters[id]) return refuse('That hunter is not at the hold.');
  if (state.delve.shop.traitsBought.includes(id))
    return refuse(`${hunters[id].shortName}'s other trait is already bought.`);
  if (!alternateTraits.some((a) => a.hunter === id))
    return refuse('That hunter has no other trait.');
  const short = pay(state, traitCost());
  if (short) return short;
  state.delve.riftglass -= traitCost();
  state.delve.shop.traitsBought.push(id);
  return ok;
};

/** Switches a hunter between their two second traits, while they are not on a contract or in a run (D260). */
export const switchTrait = (state: GameState, id: HunterId, alternate: boolean): ApplyResult => {
  if (!known(id) || !state.hunters[id]) return refuse('That hunter is not at the hold.');
  if (!state.delve.shop.traitsBought.includes(id)) return refuse('That trait has not been bought.');
  const status = hunterStatus(state, id);
  if (status === 'on-contract') return refuse(`${hunters[id].shortName} is on a contract.`);
  if (status === 'in-delve') return refuse(`${hunters[id].shortName} is in a Delve.`);
  const active = state.delve.shop.traitsActive;
  const on = active.includes(id);
  if (on === alternate)
    return refuse(alternate ? 'Already using it.' : 'Already using the first one.');
  state.delve.shop.traitsActive = alternate ? [...active, id] : active.filter((h) => h !== id);
  return ok;
};

export const buyCosmetic = (state: GameState, id: CosmeticId): ApplyResult => {
  if (!(COSMETIC_IDS as readonly string[]).includes(id)) return refuse('That is not in the shop.');
  if (state.delve.shop.cosmetics.includes(id)) return refuse('Already bought.');
  const short = pay(state, cosmeticCost());
  if (short) return short;
  state.delve.riftglass -= cosmeticCost();
  state.delve.shop.cosmetics.push(id);
  return ok;
};

export const buyChosenStart = (state: GameState): ApplyResult => {
  if (state.delve.shop.chosenStart) return refuse('Already bought.');
  const short = pay(state, costs().chosenStart.value);
  if (short) return short;
  state.delve.riftglass -= costs().chosenStart.value;
  state.delve.shop.chosenStart = true;
  return ok;
};

export const buyReroll = (state: GameState): ApplyResult => {
  if (state.delve.shop.reroll) return refuse('Already bought.');
  const short = pay(state, costs().reroll.value);
  if (short) return short;
  state.delve.riftglass -= costs().reroll.value;
  state.delve.shop.reroll = true;
  return ok;
};
