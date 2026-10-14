import type { DamageType, FamilyId } from './damage';
import type { IngredientId } from './ingredients';
import type { ResourceBundle } from './resources';

// GDD §5.7, §5.8.5 and §8.7: the nine v0.3 consumables, with the recipes the book
// starts with, and the six v0.6 brews (D201), whose recipes come from discovery (the
// properties table, properties.ts; `recipe` is null). Per-item numbers live here (D44);
// the oil's family bonus is a balance constant (oil.familyBonus). Core combat gives
// each `effect` its meaning.

export const CONSUMABLE_IDS = [
  'grave-oil',
  'drowned-bane-oil',
  'thornbane-oil',
  'mending-draught',
  'hardwood-tonic',
  'quickfoot-tincture',
  'fire-pot',
  'frost-pot',
  'saltburst',
  // v0.6 (D201)
  'hidebane-oil',
  'wrights-oil',
  'coldwater-draught',
  'owl-eye-drops',
  'steadfast-draught',
  'poppy-smoke',
] as const;
export type ConsumableId = (typeof CONSUMABLE_IDS)[number];

export type ConsumableKind = 'oil' | 'potion' | 'bomb';

export type ConsumableEffect =
  /** Coats the weapon for the whole fight: +oil.familyBonus damage vs one family. */
  | { readonly kind: 'oil'; readonly family: FamilyId }
  /** Once, when the holder falls below `belowHealth`: heal `healFraction` of max Health. */
  | { readonly kind: 'heal'; readonly belowHealth: number; readonly healFraction: number }
  /** +`armorBonus` Armor (stat%) until the holder's `untilAction`-th action. */
  | { readonly kind: 'armorUntilAction'; readonly armorBonus: number; readonly untilAction: number }
  /** +`speedBonus` Speed (stat%) for the whole fight. */
  | { readonly kind: 'speedWholeFight'; readonly speedBonus: number }
  /** At tick 1: `initial` damage, then `perAction` on each of the monster's next `actions`. */
  | {
      readonly kind: 'burn';
      readonly damageType: DamageType;
      readonly initial: number;
      readonly perAction: number;
      readonly actions: number;
    }
  /** At tick 1: `initial` damage, then −`speedCut` Speed for the monster's next `actions`. */
  | {
      readonly kind: 'chill';
      readonly damageType: DamageType;
      readonly initial: number;
      readonly speedCut: number;
      readonly actions: number;
    }
  /** Triggers on the monster's first ability: cancels it, blocks abilities for `blockActions`. */
  | { readonly kind: 'saltburst'; readonly blockActions: number }
  /** v0.6: the holder takes −`takenCut` Fire damage for the whole fight (taken%, inside the cap). */
  | { readonly kind: 'fireTaken'; readonly takenCut: number }
  /** v0.6: the holder's hit chance +`hitChance` (a share, 0.10 = 10 points) for the whole fight. */
  | { readonly kind: 'hitChance'; readonly hitChance: number }
  /** v0.6: the first time an ability would cost the holder an action, it doesn't (other effects stay). */
  | { readonly kind: 'steadfast'; readonly uses: number }
  /** v0.6: at tick 1 the monster loses its next `lostActions` actions. */
  | { readonly kind: 'smoke'; readonly lostActions: number };

export interface Recipe {
  readonly ingredients: Readonly<Partial<Record<IngredientId, number>>>;
  /** Basic resources, for the two recipes that use wood or silver (GDD §5.7). */
  readonly resources: ResourceBundle;
}

export interface ConsumableDef {
  readonly id: ConsumableId;
  readonly name: string;
  readonly kind: ConsumableKind;
  readonly effect: ConsumableEffect;
  /** Player-facing effect line (GDD §5.7 wording). */
  readonly summary: string;
  /** The recipe the book starts with; null for a v0.6 brew, which must be discovered (GDD §5.8.2). */
  readonly recipe: Recipe | null;
}

export const consumables: Readonly<Record<ConsumableId, ConsumableDef>> = {
  'grave-oil': {
    id: 'grave-oil',
    name: 'Grave Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'restless-dead' },
    summary: '+35% damage vs Restless Dead.',
    recipe: { ingredients: { 'grave-dust': 2, juniper: 1 }, resources: {} },
  },
  'drowned-bane-oil': {
    id: 'drowned-bane-oil',
    name: 'Drowned-Bane Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'water-spirits' },
    summary: '+35% damage vs Water Spirits.',
    recipe: { ingredients: { 'river-pearl': 2, yarrow: 1 }, resources: {} },
  },
  'thornbane-oil': {
    id: 'thornbane-oil',
    name: 'Thornbane Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'field-and-forest-spirits' },
    summary: '+35% damage vs Field & Forest Spirits.',
    recipe: { ingredients: { thornwood: 2, mugwort: 1 }, resources: {} },
  },
  'mending-draught': {
    id: 'mending-draught',
    name: 'Mending Draught',
    kind: 'potion',
    effect: { kind: 'heal', belowHealth: 0.3, healFraction: 0.4 },
    summary: 'Once, below 30% Health: heal 40% of max Health.',
    recipe: { ingredients: { yarrow: 2, honeycomb: 1 }, resources: {} },
  },
  // GDD §5.7. Once "Ironbark Tonic"; Ironbark is a Warcraft druid talent for damage
  // reduction (GDD §2.3), so the owner chose Hardwood (Q13, D96).
  'hardwood-tonic': {
    id: 'hardwood-tonic',
    name: 'Hardwood Tonic',
    kind: 'potion',
    effect: { kind: 'armorUntilAction', armorBonus: 0.3, untilAction: 5 },
    summary: "+30% Armor until the holder's 5th action.",
    recipe: { ingredients: { thornwood: 1, juniper: 2 }, resources: {} },
  },
  'quickfoot-tincture': {
    id: 'quickfoot-tincture',
    name: 'Quickfoot Tincture',
    kind: 'potion',
    effect: { kind: 'speedWholeFight', speedBonus: 0.2 },
    summary: '+20% Speed for the whole fight.',
    recipe: { ingredients: { mugwort: 2, 'hares-foot': 1 }, resources: {} },
  },
  'fire-pot': {
    id: 'fire-pot',
    name: 'Fire Pot',
    kind: 'bomb',
    effect: { kind: 'burn', damageType: 'fire', initial: 40, perAction: 10, actions: 3 },
    summary: "At tick 1: 40 Fire damage, then 10 Fire on each of the monster's next 3 actions.",
    recipe: { ingredients: { pitch: 1 }, resources: { wood: 1 } },
  },
  'frost-pot': {
    id: 'frost-pot',
    name: 'Frost Pot',
    kind: 'bomb',
    effect: { kind: 'chill', damageType: 'frost', initial: 30, speedCut: 0.3, actions: 3 },
    summary: "At tick 1: 30 Frost damage, then −30% Speed for the monster's next 3 actions.",
    recipe: { ingredients: { 'rime-salt': 1 }, resources: { wood: 1 } },
  },
  saltburst: {
    id: 'saltburst',
    name: 'Saltburst',
    kind: 'bomb',
    effect: { kind: 'saltburst', blockActions: 3 },
    summary:
      "Triggers on the monster's first ability: cancels it and blocks abilities for the monster's next 3 actions.",
    recipe: { ingredients: { 'rime-salt': 2 }, resources: { silver: 1 } },
  },
  // ---- v0.6 (GDD §5.8.5, D201) ----
  'hidebane-oil': {
    id: 'hidebane-oil',
    name: 'Hidebane Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'beasts-and-wilds' },
    summary: '+35% damage vs Beasts & Wilds.',
    recipe: null,
  },
  'wrights-oil': {
    id: 'wrights-oil',
    name: "Wright's Oil",
    kind: 'oil',
    effect: { kind: 'oil', family: 'cursed' },
    summary: '+35% damage vs the Cursed.',
    recipe: null,
  },
  'coldwater-draught': {
    id: 'coldwater-draught',
    name: 'Coldwater Draught',
    kind: 'potion',
    effect: { kind: 'fireTaken', takenCut: 0.4 },
    summary: 'The holder takes −40% Fire damage for the whole fight.',
    recipe: null,
  },
  'owl-eye-drops': {
    id: 'owl-eye-drops',
    name: 'Owl-Eye Drops',
    kind: 'potion',
    effect: { kind: 'hitChance', hitChance: 0.1 },
    summary: "+10 points to the holder's hit chance for the whole fight.",
    recipe: null,
  },
  'steadfast-draught': {
    id: 'steadfast-draught',
    name: 'Steadfast Draught',
    kind: 'potion',
    effect: { kind: 'steadfast', uses: 1 },
    summary:
      "The first time a monster's ability would cost the holder an action, it doesn't; its other effects still apply.",
    recipe: null,
  },
  'poppy-smoke': {
    id: 'poppy-smoke',
    name: 'Poppy Smoke',
    kind: 'bomb',
    effect: { kind: 'smoke', lostActions: 1 },
    summary: 'At tick 1: the monster loses its next action.',
    recipe: null,
  },
};
