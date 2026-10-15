import { gear, type GearDef, type GearSlot } from '../../content/gear';
import type { HunterId } from '../../content/hunters';
import type { ItemRarity } from '../../content/items';
import type { GameState, HunterState } from '../state/game-state';
import type { ItemLine, ItemState } from '../state/item-state';

// GDD §5.11.1 (v0.8, plan T8.5): the item bookkeeping the rules in T8.6 build on. A hunter's
// weapon and armor are item ids; each item also records where it is, so Stores is just "nowhere".

export const itemById = (state: GameState, id: string | null): ItemState | null =>
  id === null ? null : (state.items.find((i) => i.id === id) ?? null);

/** The item a hunter wears in a slot, or null. */
export const wornItem = (state: GameState, h: HunterState, slot: GearSlot): ItemState | null =>
  itemById(state, slot === 'weapon' ? h.weapon : h.armor);

/** The gear table entry under an item: its tier and its numbers. */
export const baseOf = (item: ItemState): GearDef => gear[item.base];

/** Iron and silver in a gear piece's cost: what Salvage can return a share of (GDD §5.11.7). */
export const paidFor = (g: GearDef): ItemState['paid'] => ({
  iron: g.cost.iron ?? 0,
  silver: g.cost.silver ?? 0,
});

/** Makes an item with the next id; it starts in Stores. */
export const makeItem = (
  state: GameState,
  base: GearDef,
  rarity: ItemRarity = 'common',
  lines: readonly ItemLine[] = [],
  paid: ItemState['paid'] = paidFor(base),
): ItemState => {
  state.itemSeq += 1;
  const item: ItemState = {
    id: `i${state.itemSeq}`,
    base: base.id,
    rarity,
    lines,
    paid,
    where: null,
  };
  state.items.push(item);
  return item;
};

/** Puts an item in a hunter's slot (the slot's old item, if any, goes to Stores). */
export const equipItem = (
  state: GameState,
  item: ItemState,
  hunter: HunterId,
  slot: GearSlot,
): void => {
  const h = state.hunters[hunter];
  if (!h) throw new Error(`${hunter} is not on the roster.`);
  const old = wornItem(state, h, slot);
  if (old) replaceItem(state, old, { ...old, where: null });
  replaceItem(state, item, { ...item, where: { hunter, slot } });
  if (slot === 'weapon') h.weapon = item.id;
  else h.armor = item.id;
};

/** Swaps an item for its changed copy (items are read-only values). */
export const replaceItem = (state: GameState, from: ItemState, to: ItemState): void => {
  const i = state.items.findIndex((x) => x.id === from.id);
  if (i < 0) throw new Error(`No item ${from.id}.`);
  state.items[i] = to;
};
