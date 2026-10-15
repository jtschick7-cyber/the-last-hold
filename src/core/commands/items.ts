import { gear, type GearId } from '../../content/gear';
import { hunters } from '../../content/hunters';
import { CRAFT_FROM_SCRATCH, reworkNext } from '../../content/items';
import { RESOURCE_IDS } from '../../content/resources';
import { gearCost, noteGearUpgraded } from '../skills/hooks';
import type { GameState } from '../state/game-state';
import { hunterStatus } from '../systems/hunters';
import { equipItem, itemById, makeItem, paidFor, replaceItem } from '../systems/items';
import { salvageValue, storesFull } from '../systems/loot';
import { payProblem } from '../systems/slot-picker';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.11.1, §5.11.7 (v0.8, D304, D307): the Smithy crafts and reworks, hunters equip, and Stores
// holds the rest with Salvage. A hunter on a contract or in a Delve cannot change what they wear
// (like the trait switch); items in Stores can always be worked.

const known = (state: GameState, id: unknown): id is string =>
  typeof id === 'string' && state.items.some((i) => i.id === id);

const busy = (state: GameState, hunter: keyof typeof hunters): string | null => {
  const status = hunterStatus(state, hunter);
  if (status === 'on-contract') return `${hunters[hunter].shortName} is on a contract.`;
  if (status === 'in-delve') return `${hunters[hunter].shortName} is in a Delve.`;
  return null;
};

const pay = (state: GameState, id: GearId): ApplyResult | null => {
  const problem = payProblem(state, id); // the picker shows the same words (GDD §9.16)
  if (problem) return refuse(problem);
  const { cost } = gearCost(state, gear[id]); // after Smithing (GDD §5.8.6)
  for (const r of RESOURCE_IDS) state.resources[r] -= cost[r];
  return null;
};

/** Crafts a Common Iron Blade or Hide Armor from scratch, into Stores (D304). */
export const craftItem = (state: GameState, base: unknown): ApplyResult => {
  if (!CRAFT_FROM_SCRATCH.includes(base as GearId))
    return refuse('Only the Iron Blade and Hide Armor are crafted from scratch.');
  if (storesFull(state)) return refuse('Stores is full. Salvage something first.');
  const g = gear[base as GearId];
  const refused = pay(state, g.id);
  if (refused) return refused;
  makeItem(state, g, 'common', [], paidFor(g));
  noteGearUpgraded(state, g.tier);
  return ok;
};

/** Reworks an item one tier up for the next tier's cost; it keeps its bonus lines (D304). */
export const reworkItem = (state: GameState, itemId: unknown): ApplyResult => {
  if (!known(state, itemId)) return refuse('That item does not exist.');
  const item = itemById(state, itemId);
  if (!item) return refuse('That item does not exist.');
  if (item.where) {
    const why = busy(state, item.where.hunter);
    if (why) return refuse(why);
  }
  const nextId = reworkNext[item.base];
  if (!nextId) return refuse('Already the best there is.');
  const next = gear[nextId];
  const refused = pay(state, nextId);
  if (refused) return refused;
  const step = paidFor(next);
  replaceItem(state, item, {
    ...item,
    base: nextId,
    paid: { iron: item.paid.iron + step.iron, silver: item.paid.silver + step.silver },
  });
  noteGearUpgraded(state, next.tier);
  return ok;
};

/** Puts an item from Stores on a hunter; what they wore there goes to Stores (D326). */
export const equipFromStores = (
  state: GameState,
  itemId: unknown,
  hunter: unknown,
): ApplyResult => {
  if (!known(state, itemId)) return refuse('That item does not exist.');
  const item = itemById(state, itemId);
  if (!item) return refuse('That item does not exist.');
  if (typeof hunter !== 'string' || !(hunter in hunters))
    return refuse('That hunter does not exist.');
  const id = hunter as keyof typeof hunters;
  if (!state.hunters[id]) return refuse(`${hunters[id].shortName} isn't on your roster.`);
  if (item.where) return refuse('That item is already worn. Unequip it first.');
  const why = busy(state, id);
  if (why) return refuse(why);
  equipItem(state, item, id, gear[item.base].slot);
  return ok;
};

/** Takes a worn item off, into Stores. */
export const unequipItem = (state: GameState, hunter: unknown, slot: unknown): ApplyResult => {
  if (typeof hunter !== 'string' || !(hunter in hunters))
    return refuse('That hunter does not exist.');
  const id = hunter as keyof typeof hunters;
  const h = state.hunters[id];
  if (!h) return refuse(`${hunters[id].shortName} isn't on your roster.`);
  if (slot !== 'weapon' && slot !== 'armor') return refuse('Weapon or armor.');
  const worn = itemById(state, slot === 'weapon' ? h.weapon : h.armor);
  if (!worn) return refuse('Nothing is worn there.');
  const why = busy(state, id);
  if (why) return refuse(why);
  if (storesFull(state)) return refuse('Stores is full. Salvage something first.');
  replaceItem(state, worn, { ...worn, where: null });
  if (slot === 'weapon') h.weapon = null;
  else h.armor = null;
  return ok;
};

/** Breaks an item in Stores down for a share of what went into it (D307). */
export const salvageItem = (state: GameState, itemId: unknown): ApplyResult => {
  if (!known(state, itemId)) return refuse('That item does not exist.');
  const item = itemById(state, itemId);
  if (!item) return refuse('That item does not exist.');
  if (item.where) return refuse('Take it off first: only items in Stores can be salvaged.');
  const value = salvageValue(item);
  state.resources.iron += value.iron;
  state.resources.silver += value.silver;
  state.items = state.items.filter((i) => i.id !== item.id);
  return ok;
};
