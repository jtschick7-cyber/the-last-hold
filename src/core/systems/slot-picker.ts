import { families } from '../../content/damage';
import { gear, type GearDef, type GearId, type GearSlot } from '../../content/gear';
import { hunters, type HunterId } from '../../content/hunters';
import { bonusLines, CRAFT_FROM_SCRATCH, ITEM_RARITY_IDS, reworkNext } from '../../content/items';
import { LEGENDARY_IDS, legendaries, type LegendaryId } from '../../content/legendaries';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { roundHalfUp } from '../combat/build';
import { gearCost } from '../skills/hooks';
import type { GameState } from '../state/game-state';
import type { ItemLine, ItemState } from '../state/item-state';
import { canAfford } from './costs';
import { gearLock } from './hunters';
import { itemById, itemName } from './items';
import { owned, wornBy } from './legendaries';
import { storesFull } from './loot';
import { busyReason } from './talents';

// GDD §9.16 (v0.8, D326): the data behind the slot picker and the keepsake picker. The screens only
// draw it; the refusal words here are the ones the commands give, because the commands call
// `payProblem` too.

const FULL = 'Stores is full. Salvage something first.';

/** Why a gear piece can't be paid for now (Smithy, Rank, resources), or null. */
export const payProblem = (state: GameState, id: GearId): string | null => {
  const g = gear[id];
  const lock = gearLock(state, g);
  if (lock) return `The ${g.name} ${lock}.`;
  const { cost } = gearCost(state, g); // after Smithing (GDD §5.8.6)
  if (!canAfford(state, cost)) return `Not enough resources for ${g.name}.`;
  return null;
};

/** One bonus line in words: "+5% Might", "+1 Armor", "+3% crit chance", "+8% damage against Cursed". */
export const lineText = (l: ItemLine): string => {
  const def = bonusLines[l.kind];
  const size = def.unit === 'flat' ? `+${l.size}` : `+${roundHalfUp(l.size * 100)}%`;
  const label = l.family ? def.label.replace('one family', families[l.family].name) : def.label;
  return `${size} ${label}`;
};

/** What a base piece gives on its own, in words: "+8 Might · +1 Armor · Silver sub-hit". */
export const baseText = (g: GearDef): string => {
  const parts: string[] = [];
  if (g.might > 0) parts.push(`+${g.might} Might`);
  if (g.armor > 0) parts.push(`+${g.armor} Armor`);
  if (g.silverSubHit) parts.push('Silver sub-hit');
  if (g.runeSubHit) parts.push('Rune sub-hit');
  if (g.fireTakenReduction > 0)
    parts.push(`−${roundHalfUp(g.fireTakenReduction * 100)}% Fire taken`);
  return parts.join(' · ');
};

export interface ItemView {
  readonly id: string;
  readonly name: string;
  readonly rarity: ItemState['rarity'];
  readonly slot: GearSlot;
  /** The base piece, for its icon. */
  readonly gear: GearId;
  readonly base: string;
  readonly lines: readonly string[];
}

export const itemView = (item: ItemState): ItemView => ({
  id: item.id,
  name: itemName(item.rarity, item.base),
  rarity: item.rarity,
  slot: gear[item.base].slot,
  gear: item.base,
  base: baseText(gear[item.base]),
  lines: item.lines.map(lineText),
});

/** Everything an item adds, as numbers keyed by what they improve (for the "difference" lines). */
const effects = (item: ItemState | null): Map<string, number> => {
  const out = new Map<string, number>();
  const add = (k: string, v: number): void => void out.set(k, (out.get(k) ?? 0) + v);
  if (!item) return out;
  const g = gear[item.base];
  add('Might', g.might);
  add('Armor', g.armor);
  if (g.silverSubHit) add('Silver sub-hit', 1);
  if (g.runeSubHit) add('Rune sub-hit', 1);
  if (g.fireTakenReduction > 0) add('Fire taken', -roundHalfUp(g.fireTakenReduction * 100));
  for (const l of item.lines) {
    const def = bonusLines[l.kind];
    const name = l.family ? `damage against ${families[l.family].name}` : def.label;
    if (def.unit === 'flat') add(name, l.size);
    else add(`% ${name}`, roundHalfUp(l.size * 100));
  }
  return out;
};

const signed = (n: number): string => (n > 0 ? `+${n}` : `−${-n}`);

/** "+3 Might, −1 Armor": what putting `item` on changes against `worn` (GDD §9.16). */
export const itemDelta = (item: ItemState, worn: ItemState | null): string[] => {
  const a = effects(item);
  const b = effects(worn);
  const out: string[] = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const d = (a.get(k) ?? 0) - (b.get(k) ?? 0);
    if (d === 0) continue;
    if (k.endsWith('sub-hit')) out.push(d > 0 ? `adds a ${k}` : `loses its ${k}`);
    else if (k === 'Fire taken') out.push(`${signed(d)}% Fire taken`);
    else if (k.startsWith('% ')) out.push(`${signed(d)}% ${k.slice(2)}`);
    else out.push(`${signed(d)} ${k}`);
  }
  return out;
};

/** Best first: higher tier, then rarer, then the newer item. */
const bestFirst = (a: ItemState, b: ItemState): number =>
  gear[b.base].tier - gear[a.base].tier ||
  ITEM_RARITY_IDS.indexOf(b.rarity) - ITEM_RARITY_IDS.indexOf(a.rarity) ||
  b.id.localeCompare(a.id, 'en', { numeric: true });

export interface Priced {
  readonly name: string;
  readonly cost: Readonly<Record<ResourceId, number>>;
  /** Why not, in the sheet's words; null when it can be done. */
  readonly reason: string | null;
}

export interface PickerOption {
  readonly item: ItemView;
  readonly delta: readonly string[];
  readonly reason: string | null;
}

export interface SlotPicker {
  readonly slot: GearSlot;
  readonly worn: ItemView | null;
  readonly options: readonly PickerOption[];
  /** Why the worn item can't come off now (busy, or Stores full); null when it can. */
  readonly takeOff: string | null;
  readonly craft: (Priced & { readonly base: GearId }) | null;
  readonly rework: (Priced & { readonly item: string }) | null;
}

/**
 * The picker for a hunter's weapon or armor slot: Stores items that fit, best first, each with its
 * difference against what is worn; Craft (the Iron Blade or Hide Armor) and Rework (the worn item
 * one tier up) with costs, each with the reason it can't be done now.
 */
export const slotPicker = (state: GameState, id: HunterId, slot: GearSlot): SlotPicker | null => {
  const h = state.hunters[id];
  if (!h) return null;
  const worn = itemById(state, slot === 'weapon' ? h.weapon : h.armor);
  const busy = busyReason(state, id);
  const options = state.items
    .filter((i) => i.where === null && gear[i.base].slot === slot)
    .sort(bestFirst)
    .map((i) => ({ item: itemView(i), delta: itemDelta(i, worn), reason: busy }));
  const craftId = CRAFT_FROM_SCRATCH.find((g) => gear[g].slot === slot);
  const craft =
    craftId === undefined
      ? null
      : {
          base: craftId,
          name: gear[craftId].name,
          cost: gearCost(state, gear[craftId]).cost,
          reason: storesFull(state) ? FULL : payProblem(state, craftId),
        };
  const nextId = worn ? reworkNext[worn.base] : null;
  const rework =
    worn === null
      ? null
      : {
          item: worn.id,
          name: nextId ? gear[nextId].name : '',
          cost: nextId
            ? gearCost(state, gear[nextId]).cost
            : (Object.fromEntries(RESOURCE_IDS.map((r) => [r, 0])) as Record<ResourceId, number>),
          reason: busy ?? (nextId ? payProblem(state, nextId) : 'Already the best there is.'),
        };
  const takeOff = worn === null ? null : (busy ?? (storesFull(state) ? FULL : null));
  return { slot, worn: worn ? itemView(worn) : null, options, takeOff, craft, rework };
};

export interface KeepsakeOption {
  readonly id: LegendaryId;
  readonly name: string;
  readonly text: string;
  readonly foundText: string;
  readonly found: boolean;
  /** Who wears it now, by short name. */
  readonly wornBy: string | null;
  readonly worn: boolean;
  readonly reason: string | null;
}

/** The six Legendaries with the reason each can't go in this hunter's keepsake slot now. */
export const keepsakeOptions = (state: GameState, id: HunterId): KeepsakeOption[] => {
  const busy = busyReason(state, id);
  return LEGENDARY_IDS.map((l) => {
    const def = legendaries[l];
    const holder = wornBy(state, l);
    const found = owned(state, l);
    const reason = !found
      ? 'Not found yet.'
      : holder === id
        ? null
        : (busy ?? (holder ? `Worn by ${hunters[holder].shortName}. Take it off first.` : null));
    return {
      id: l,
      name: def.name,
      text: def.text,
      foundText: def.foundText,
      found,
      wornBy: holder ? hunters[holder].shortName : null,
      worn: holder === id,
      reason,
    };
  });
};
