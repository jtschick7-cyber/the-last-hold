import type { BalanceKey } from '../balance';

// GDD §5.10.8 (D259): the Riftglass shop on the Rank screen, beside The Hearth. Costs are
// tunable keys in balance.ts (`riftglass.shop.*`), not numbers here. Content outside the
// saved-state id lists until T7.5 (D171).

export type ShopKind = 'convenience' | 'sidegrade' | 'cosmetic' | 'delve-only';

export const COSMETIC_IDS = [
  'gatehouse-banners',
  'wall-lanterns',
  'carved-hearth-hall-door',
  'watchtower-bell',
] as const;
export type CosmeticId = (typeof COSMETIC_IDS)[number];

export interface ShopItemDef {
  readonly id: string;
  readonly kind: ShopKind;
  readonly costKey: BalanceKey;
  /** What it does, as GDD §5.10.8 gives it. */
  readonly text: string;
}

/** A named item of the shop. The alternate trait is bought per hunter and has no name of its own. */
export interface NamedShopItem extends ShopItemDef {
  readonly name: string;
}

export const LATE_HOURS_LEVELS = 5;

export const shopItems: readonly NamedShopItem[] = [
  {
    id: 'late-hours',
    name: 'Late hours',
    kind: 'convenience',
    costKey: 'riftglass.shop.lateHours',
    text: '+1 h offline cap per level, inside the 24 h ceiling',
  },
  {
    id: 'gatehouse-banners',
    name: 'Gatehouse banners',
    kind: 'cosmetic',
    costKey: 'riftglass.shop.cosmetic',
    text: 'Cosmetic only (the hold scene)',
  },
  {
    id: 'wall-lanterns',
    name: 'Wall lanterns',
    kind: 'cosmetic',
    costKey: 'riftglass.shop.cosmetic',
    text: 'Cosmetic only (the hold scene)',
  },
  {
    id: 'carved-hearth-hall-door',
    name: 'Carved Hearth Hall door',
    kind: 'cosmetic',
    costKey: 'riftglass.shop.cosmetic',
    text: 'Cosmetic only (the hold scene)',
  },
  {
    id: 'watchtower-bell',
    name: 'Watchtower bell',
    kind: 'cosmetic',
    costKey: 'riftglass.shop.cosmetic',
    text: 'Cosmetic only (the hold scene)',
  },
  {
    id: 'chosen-start',
    name: 'Chosen start',
    kind: 'delve-only',
    costKey: 'riftglass.shop.chosenStart',
    text: "At a run's start, pick a patron and take 1 of 3 Faint blessings from it",
  },
  {
    id: 'reroll',
    name: 'Re-roll',
    kind: 'delve-only',
    costKey: 'riftglass.shop.reroll',
    text: "Once per run, replace an offer's three cards with three new ones",
  },
];

/** One alternate second trait per hunter, bought once; they then switch freely (D260). */
export const alternateTraitItem: ShopItemDef = {
  id: 'alternate-trait',
  kind: 'sidegrade',
  costKey: 'riftglass.shop.trait',
  text: "Unlocks that hunter's alternate second trait; switch freely while the hunter isn't on a contract or in a run",
};
