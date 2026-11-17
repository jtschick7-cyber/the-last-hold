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
  /** +`armorBonus` Armor (stat%) and −`takenCut` all damage taken (taken%) until the holder's `untilAction`-th action. */
  | {
      readonly kind: 'armorUntilAction';
      readonly armorBonus: number;
      readonly takenCut: number;
      readonly untilAction: number;
    }
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
  /** Triggers on the monster's first ability: `damage` (`damageType`), cancels it, and blocks abilities for `blockActions`. */
  | {
      readonly kind: 'saltburst';
      readonly damage: number;
      readonly damageType: DamageType;
      readonly blockActions: number;
    }
  /** v0.6 / v1.9: the holder takes −`takenCut` Fire and −`frostCut` Frost damage and +`mightBonus` Might for the whole fight. */
  | {
      readonly kind: 'fireTaken';
      readonly takenCut: number;
      readonly frostCut: number;
      readonly mightBonus: number;
    }
  /** v0.6 / v1.9: the holder's hit chance +`hitChance` and crit chance +`critChance` (shares) for the whole fight. */
  | { readonly kind: 'hitChance'; readonly hitChance: number; readonly critChance: number }
  /** v0.6 / v1.9: prevents `uses` ability-lost actions and grants +`mightBonus` Might for the whole fight. */
  | { readonly kind: 'steadfast'; readonly uses: number; readonly mightBonus: number }
  /** v0.6 / v1.9: at tick 1 the monster loses `lostActions` actions and becomes Shrouded for `shroudActions` actions. */
  | {
      readonly kind: 'smoke';
      readonly lostActions: number;
      readonly shroudActions: number;
      readonly hitBonus: number;
      readonly critBonus: number;
      readonly dealtBonus: number;
    };

/**
 * How a brew's recipe is built from carriers of its property (GDD §5.8.2, D198, D633):
 * an oil or potion is 3 units from two different carriers, 2 of one and 1 of the other;
 * a bomb (including Saltburst from v1.9) is 1 unit of a carrier plus a resource.
 */
export type RecipeShape =
  | { readonly kind: 'split'; readonly major: number; readonly minor: number }
  | { readonly kind: 'single'; readonly units: number; readonly resources: ResourceBundle }
  | { readonly kind: 'double'; readonly units: number; readonly resources: ResourceBundle };

const SPLIT: RecipeShape = { kind: 'split', major: 2, minor: 1 };
const withWood: RecipeShape = { kind: 'single', units: 1, resources: { wood: 1 } };

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
  /** How any recipe for it is built from the carriers the book knows (GDD §5.8.2). */
  readonly shape: RecipeShape;
}

export const consumables: Readonly<Record<ConsumableId, ConsumableDef>> = {
  'grave-oil': {
    id: 'grave-oil',
    name: 'Grave Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'restless-dead' },
    summary: '+35% damage vs Restless Dead.',
    recipe: { ingredients: { 'grave-dust': 2, juniper: 1 }, resources: {} },
    shape: SPLIT,
  },
  'drowned-bane-oil': {
    id: 'drowned-bane-oil',
    name: 'Drowned-Bane Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'water-spirits' },
    summary: '+35% damage vs Water Spirits.',
    recipe: { ingredients: { 'river-pearl': 2, yarrow: 1 }, resources: {} },
    shape: SPLIT,
  },
  'thornbane-oil': {
    id: 'thornbane-oil',
    name: 'Thornbane Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'field-and-forest-spirits' },
    summary: '+35% damage vs Field & Forest Spirits.',
    recipe: { ingredients: { thornwood: 2, mugwort: 1 }, resources: {} },
    shape: SPLIT,
  },
  'mending-draught': {
    id: 'mending-draught',
    name: 'Mending Draught',
    kind: 'potion',
    effect: { kind: 'heal', belowHealth: 0.5, healFraction: 0.45 },
    summary: 'Once, below 50% Health: heal 45% of max Health.',
    recipe: { ingredients: { yarrow: 2, honeycomb: 1 }, resources: {} },
    shape: SPLIT,
  },
  // GDD §5.7. Once "Ironbark Tonic"; Ironbark is a Warcraft druid talent for damage
  // reduction (GDD §2.3), so the owner chose Hardwood (Q13, D96).
  'hardwood-tonic': {
    id: 'hardwood-tonic',
    name: 'Hardwood Tonic',
    kind: 'potion',
    effect: { kind: 'armorUntilAction', armorBonus: 0.4, takenCut: 0.15, untilAction: 8 },
    summary: "+40% Armor and −15% all damage taken until the holder's 8th action.",
    recipe: { ingredients: { thornwood: 1, juniper: 2 }, resources: {} },
    shape: SPLIT,
  },
  'quickfoot-tincture': {
    id: 'quickfoot-tincture',
    name: 'Quickfoot Tincture',
    kind: 'potion',
    effect: { kind: 'speedWholeFight', speedBonus: 0.15 },
    summary: '+15% Speed for the whole fight.',
    recipe: { ingredients: { mugwort: 2, 'hares-foot': 1 }, resources: {} },
    shape: SPLIT,
  },
  'fire-pot': {
    id: 'fire-pot',
    name: 'Fire Pot',
    kind: 'bomb',
    effect: { kind: 'burn', damageType: 'fire', initial: 40, perAction: 10, actions: 3 },
    summary: "At tick 1: 40 Fire damage, then 10 Fire on each of the monster's next 3 actions.",
    recipe: { ingredients: { pitch: 1 }, resources: { wood: 1 } },
    shape: withWood,
  },
  'frost-pot': {
    id: 'frost-pot',
    name: 'Frost Pot',
    kind: 'bomb',
    effect: { kind: 'chill', damageType: 'frost', initial: 30, speedCut: 0.3, actions: 3 },
    summary: "At tick 1: 30 Frost damage, then −30% Speed for the monster's next 3 actions.",
    recipe: { ingredients: { 'rime-salt': 1 }, resources: { wood: 1 } },
    shape: withWood,
  },
  saltburst: {
    id: 'saltburst',
    name: 'Saltburst',
    kind: 'bomb',
    effect: { kind: 'saltburst', damage: 25, damageType: 'rune', blockActions: 3 },
    summary:
      "Triggers on the monster's first ability: 25 Rune damage, cancels it, and blocks abilities for the monster's next 3 actions.",
    recipe: { ingredients: { 'rime-salt': 1 }, resources: { silver: 1 } },
    shape: { kind: 'single', units: 1, resources: { silver: 1 } },
  },
  // ---- v0.6 (GDD §5.8.5, D201) ----
  'hidebane-oil': {
    id: 'hidebane-oil',
    name: 'Hidebane Oil',
    kind: 'oil',
    effect: { kind: 'oil', family: 'beasts-and-wilds' },
    summary: '+35% damage vs Beasts & Wilds.',
    recipe: null,
    shape: SPLIT,
  },
  'wrights-oil': {
    id: 'wrights-oil',
    name: "Wright's Oil",
    kind: 'oil',
    effect: { kind: 'oil', family: 'cursed' },
    summary: '+35% damage vs the Cursed.',
    recipe: null,
    shape: SPLIT,
  },
  'coldwater-draught': {
    id: 'coldwater-draught',
    name: 'Coldwater Draught',
    kind: 'potion',
    effect: { kind: 'fireTaken', takenCut: 0.5, frostCut: 0.3, mightBonus: 0.1 },
    summary:
      'The holder takes −50% Fire and −30% Frost damage and gains +10% Might for the whole fight.',
    recipe: null,
    shape: SPLIT,
  },
  'owl-eye-drops': {
    id: 'owl-eye-drops',
    name: 'Owl-Eye Drops',
    kind: 'potion',
    effect: { kind: 'hitChance', hitChance: 0.1, critChance: 0.1 },
    summary:
      "+10 points to the holder's hit chance and +10 points to crit chance for the whole fight.",
    recipe: null,
    shape: SPLIT,
  },
  'steadfast-draught': {
    id: 'steadfast-draught',
    name: 'Steadfast Draught',
    kind: 'potion',
    effect: { kind: 'steadfast', uses: 2, mightBonus: 0.1 },
    summary:
      'Prevents the next 2 ability-caused lost actions and grants +10% Might for the whole fight.',
    recipe: null,
    shape: SPLIT,
  },
  'poppy-smoke': {
    id: 'poppy-smoke',
    name: 'Poppy Smoke',
    kind: 'bomb',
    effect: {
      kind: 'smoke',
      lostActions: 1,
      shroudActions: 2,
      hitBonus: 0.15,
      critBonus: 0.1,
      dealtBonus: 0.15,
    },
    summary:
      'At tick 1: the monster loses its next action and is Shrouded for 2 actions (party attacks gain +15 hit, +10 crit, +15% damage).',
    recipe: null,
    shape: withWood,
  },
};
