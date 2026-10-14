import type { FamilyId } from './damage';
import type { ConsumableId, ConsumableKind } from './consumables';

// GDD §5.8.5 (v0.6, D201): the six new brews. Content only (plan T6.1a): they join
// CONSUMABLE_IDS, the stores and combat in T6.3–T6.5, once the v5 → v6 migration
// lets the saved state hold them. Per-brew numbers live here, as every earlier
// consumable's do (GDD §7.8). Recipes aren't listed: from v0.6 they come from the
// properties table (properties.ts) and the shapes in GDD §5.8.2.

export const V06_BREW_IDS = [
  'hidebane-oil',
  'wrights-oil',
  'coldwater-draught',
  'owl-eye-drops',
  'steadfast-draught',
  'poppy-smoke',
] as const;
export type V06BrewId = (typeof V06_BREW_IDS)[number];

/** Every brew a property can name: the nine v0.3 consumables and the six new ones. */
export type BrewId = ConsumableId | V06BrewId;

export type V06BrewEffect =
  /** Coats the weapon for the whole fight: +oil.familyBonus damage vs one family. */
  | { readonly kind: 'oil'; readonly family: FamilyId }
  /** The holder takes −`takenCut` Fire damage for the whole fight (taken%, inside the cap). */
  | { readonly kind: 'fireTaken'; readonly takenCut: number }
  /** The holder's hit chance +`hitChance` (a share, 0.10 = 10 points) for the whole fight. */
  | { readonly kind: 'hitChance'; readonly hitChance: number }
  /** The first time an ability would cost the holder an action, it doesn't (other effects stay). */
  | { readonly kind: 'steadfast'; readonly uses: number }
  /** At tick 1 the monster loses its next `lostActions` actions. */
  | { readonly kind: 'smoke'; readonly lostActions: number };

export interface V06BrewDef {
  readonly id: V06BrewId;
  readonly name: string;
  readonly kind: ConsumableKind;
  readonly effect: V06BrewEffect;
  /** Player-facing effect line (GDD §5.8.5 wording). */
  readonly summary: string;
}

export const v06Brews: Readonly<Record<V06BrewId, V06BrewDef>> = {
  'hidebane-oil': {
    id: 'hidebane-oil',
    name: 'Hidebane Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'beasts-and-wilds' },
    summary: '+35% damage vs Beasts & Wilds.',
  },
  'wrights-oil': {
    id: 'wrights-oil',
    name: "Wright's Oil",
    kind: 'oil',
    effect: { kind: 'oil', family: 'cursed' },
    summary: '+35% damage vs the Cursed.',
  },
  'coldwater-draught': {
    id: 'coldwater-draught',
    name: 'Coldwater Draught',
    kind: 'potion',
    effect: { kind: 'fireTaken', takenCut: 0.4 },
    summary: 'The holder takes −40% Fire damage for the whole fight.',
  },
  'owl-eye-drops': {
    id: 'owl-eye-drops',
    name: 'Owl-Eye Drops',
    kind: 'potion',
    effect: { kind: 'hitChance', hitChance: 0.1 },
    summary: "+10 points to the holder's hit chance for the whole fight.",
  },
  'steadfast-draught': {
    id: 'steadfast-draught',
    name: 'Steadfast Draught',
    kind: 'potion',
    effect: { kind: 'steadfast', uses: 1 },
    summary:
      "The first time a monster's ability would cost the holder an action, it doesn't; its other effects still apply.",
  },
  'poppy-smoke': {
    id: 'poppy-smoke',
    name: 'Poppy Smoke',
    kind: 'bomb',
    effect: { kind: 'smoke', lostActions: 1 },
    summary: 'At tick 1: the monster loses its next action.',
  },
};
