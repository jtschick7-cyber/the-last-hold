import type { FamilyId } from './damage';
import type { GearId } from './gear';

// GDD §5.11.1–§5.11.2, §5.11.7 (v0.8, D304–D307): items. Every weapon and armor piece of §5.3.6
// (src/content/gear.ts) is the base of an item; today's pieces are Common items with exactly
// today's numbers (D308). Loot adds Fine, Rare and Heroic items with bonus lines. The sizes of
// the lines are `loot.lines` in balance.ts. Content outside the saved-state id lists until
// T8.5 (D171).

export const ITEM_RARITY_IDS = ['common', 'fine', 'rare', 'heroic'] as const;
export type ItemRarity = (typeof ITEM_RARITY_IDS)[number];

export interface ItemRarityDef {
  readonly id: ItemRarity;
  readonly name: string;
  /** Bonus lines on an item of this rarity (D305). */
  readonly lines: number;
}

export const itemRarities: Readonly<Record<ItemRarity, ItemRarityDef>> = {
  common: { id: 'common', name: 'Common', lines: 0 },
  fine: { id: 'fine', name: 'Fine', lines: 1 },
  rare: { id: 'rare', name: 'Rare', lines: 2 },
  heroic: { id: 'heroic', name: 'Heroic', lines: 3 },
};

/** The rarities loot can roll; Common items are crafted, never dropped. */
export const LOOT_RARITY_IDS = ['fine', 'rare', 'heroic'] as const satisfies readonly ItemRarity[];
export type LootRarity = (typeof LOOT_RARITY_IDS)[number];

export const BONUS_LINE_IDS = ['might', 'health', 'armor', 'speed', 'crit', 'bane'] as const;
export type BonusLineId = (typeof BONUS_LINE_IDS)[number];

/** The combat bucket a line goes into (GDD §5.0). */
export type LineBucket = 'stat%' | 'flat' | 'crit' | 'outgoing%';

export interface BonusLineDef {
  readonly id: BonusLineId;
  /** What the line improves, as the picker shows it ("Might", "Armor"; a bane line names its family). Not a proper noun. */
  readonly label: string;
  readonly bucket: LineBucket;
  /** How its size from `loot.lines` reads: a percentage, a flat amount, or points of chance. */
  readonly unit: 'percent' | 'flat' | 'points';
  /** A bane line is rolled for one of the five contract families (D328 (2)). */
  readonly rollsFamily: boolean;
}

export const bonusLines: Readonly<Record<BonusLineId, BonusLineDef>> = {
  might: { id: 'might', label: 'Might', bucket: 'stat%', unit: 'percent', rollsFamily: false },
  health: {
    id: 'health',
    label: 'max Health',
    bucket: 'stat%',
    unit: 'percent',
    rollsFamily: false,
  },
  armor: { id: 'armor', label: 'Armor', bucket: 'flat', unit: 'flat', rollsFamily: false },
  speed: { id: 'speed', label: 'Speed', bucket: 'flat', unit: 'flat', rollsFamily: false },
  crit: { id: 'crit', label: 'crit chance', bucket: 'crit', unit: 'points', rollsFamily: false },
  bane: {
    id: 'bane',
    label: 'damage against one family',
    bucket: 'outgoing%',
    unit: 'percent',
    rollsFamily: true,
  },
};

/** What the Smithy crafts from scratch (D304); everything else is reached by rework or loot. */
export const CRAFT_FROM_SCRATCH: readonly GearId[] = ['iron-blade', 'hide-armor'];

/**
 * Rework one tier up (D304): the cost is the next tier's step cost in gear.ts, and the item keeps
 * its bonus lines. The Wright's Blade is reached only by rework and never drops.
 */
export const reworkNext: Readonly<Record<GearId, GearId | null>> = {
  'iron-blade': 'steel-blade',
  'steel-blade': 'silvered-blade',
  'silvered-blade': 'wrights-blade',
  'wrights-blade': null,
  'hide-armor': 'mail',
  mail: 'emberwright-plate',
  'emberwright-plate': null,
};

export interface LootBase {
  readonly tier: number;
  readonly weapon: GearId;
  readonly armor: GearId;
}

/** The base piece a contract of this tier drops, weapon or armor half each (D305, D328 (1)). */
export const lootBases: readonly LootBase[] = [
  { tier: 1, weapon: 'iron-blade', armor: 'hide-armor' },
  { tier: 2, weapon: 'iron-blade', armor: 'hide-armor' },
  { tier: 3, weapon: 'steel-blade', armor: 'mail' },
  { tier: 4, weapon: 'silvered-blade', armor: 'mail' },
  { tier: 5, weapon: 'silvered-blade', armor: 'emberwright-plate' },
];

/** A Delve guardian beaten drops one of these (GDD §5.10.7, D316), by `delve.guardianLootWeights`. */
export const guardianLootBases: readonly GearId[] = ['silvered-blade', 'emberwright-plate'];

/** A family a bane line can roll (D328 (2)); the five contract families. */
export type BaneFamily = FamilyId;
