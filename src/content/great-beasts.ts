import type { MonsterAbility } from './monsters';
import type { DamageType, FamilyId } from './damage';
import type { IngredientId } from './ingredients';

// GDD §8.13 (v0.9, D358–D361, D365, D381): the three Great Beasts, the world bosses. They are not
// bestiary entries (D369): they never count toward knowledge, the bestiary count, a Legendary's
// milestone, a Delve relic or the Forgotten's count. Stats are at base tier 3; the pool (shared
// Health) is `boss.poolBase`, set in balance.ts, not here. Every number below is tunable content
// (GDD §8 header) and a first sketch for the simulator (plan T9.13). The quarries of the Legendary
// Hunts use the same shapes (hunts.ts).

export const BOSS_IDS = [
  'lindworm-of-velk-fjord',
  'barrow-king',
  'mother-of-the-river',
  'thorn-stag',
  'beacon-bane',
] as const;
export type BossId = (typeof BOSS_IDS)[number];

/** Each Great Beast's and quarry's ability numbers, exactly as GDD §8.13 and §8.14 word them. */
export type EventAbility =
  /** Drowning Song and Barrow-Grip are the existing abilities, with these beasts' own numbers. */
  | Extract<MonsterAbility, { readonly kind: 'drowningSong' | 'barrowGrip' }>
  /** Every `every`th action, its attack holds the target (they lose their next action). */
  | { readonly kind: 'coil'; readonly name: 'Coil'; readonly every: number }
  /** On its 1st action and every `every` after, instead of attacking, every hunter's meter is knocked back. */
  | {
      readonly kind: 'fjordRoar';
      readonly name: 'Fjord Roar';
      readonly every: number;
      readonly knockBack: number;
    }
  /** On each of its actions, every standing hunter loses this share of max Health as Frost, ignoring Armor. */
  | {
      readonly kind: 'graveChill';
      readonly name: 'Grave Chill';
      readonly maxHealthFraction: number;
    }
  /** Every `every`th action, instead of attacking, every hunter's meter is knocked back. */
  | {
      readonly kind: 'weirPull';
      readonly name: 'Weir-Pull';
      readonly every: number;
      readonly knockBack: number;
    }
  /** Every `every`th action, instead of attacking, a throw hits every standing hunter (a direct attack each; Armor applies). */
  | { readonly kind: 'boulderToss'; readonly name: 'Boulder Toss'; readonly every: number }
  /** Regenerates this share of max Health on each of its actions. */
  | { readonly kind: 'mossMend'; readonly name: 'Moss-Mend'; readonly regenFraction: number }
  /** On its 1st action and every `every` after, the hunter with the highest Might loses their next action. */
  | { readonly kind: 'nightWeight'; readonly name: 'Night-Weight'; readonly every: number }
  /** Its first hit on each hunter ruins that hunter's unused potion. */
  | { readonly kind: 'quickDark'; readonly name: 'Quick Dark' }
  /** Passive: while it stands, every hunter's crit chance is this many points lower. */
  | { readonly kind: 'illLuck'; readonly name: 'Ill Luck'; readonly critCut: number }
  /** On each of its actions, this chance that one random hunter loses their next action. */
  | { readonly kind: 'misfortune'; readonly name: 'Misfortune'; readonly chance: number }
  /** Every `every`th action, holds the fastest standing hunter (loses their next action) (D631). */
  | { readonly kind: 'thornSnare'; readonly name: 'Thorn-Snare'; readonly every: number }
  /** Every `every`th action, instead of attacking once, lashes every standing hunter with direct attacks (D631). */
  | { readonly kind: 'brambleSweep'; readonly name: 'Bramble-Sweep'; readonly every: number }
  /** On each of its actions, every standing hunter loses this share of max Health as Fire, ignoring Armor (D631). */
  | {
      readonly kind: 'pitchFlare';
      readonly name: 'Pitch-Flare';
      readonly maxHealthFraction: number;
    }
  /** Every `every`th action, cuts healing received by `healCut` on highest-Might standing hunter for `actions` actions (D631). */
  | {
      readonly kind: 'curseBrand';
      readonly name: 'Curse-Brand';
      readonly every: number;
      readonly healCut: number;
      readonly actions: number;
    };

export interface EventCreature {
  readonly name: string;
  /** The family it counts as for oils, traits and bane lines only (D369). */
  readonly family: FamilyId;
  /** Direct attack damage type (defaults to `'steel'`, D631). */
  readonly damage?: DamageType;
  /** Might, Armor and Speed at base tier 3; Attacks per action. */
  readonly might: number;
  readonly armor: number;
  readonly speed: number;
  readonly attacks: number;
  readonly resist: Readonly<Record<DamageType, number>>;
  readonly abilities: readonly EventAbility[];
  /** Paid at the milestones and the kill (a Great Beast) or on a replay win (a quarry). */
  readonly reagent: IngredientId;
  /** The Great Beasts shelf's "What it was" line and the hunter's notebook line (GDD §9.17). */
  readonly whatItWas: string;
  readonly notebook: string;
}

export interface BossDef extends EventCreature {
  readonly id: BossId;
}

const resist = (
  steel: number,
  silver: number,
  fire: number,
  frost: number,
  rune: number,
  venom: number,
): Readonly<Record<DamageType, number>> => ({ steel, silver, fire, frost, rune, venom });

export const bosses: Readonly<Record<BossId, BossDef>> = {
  'lindworm-of-velk-fjord': {
    id: 'lindworm-of-velk-fjord',
    name: 'The Lindworm of Velk Fjord',
    family: 'beasts-and-wilds',
    might: 38,
    armor: 10,
    speed: 9,
    attacks: 2,
    resist: resist(0.75, 1.0, 1.5, 0.5, 1.0, 1.25),
    abilities: [
      { kind: 'coil', name: 'Coil', every: 3 },
      { kind: 'fjordRoar', name: 'Fjord Roar', every: 5, knockBack: 20 },
    ],
    reagent: 'wolf-fang',
    whatItWas:
      "A long grey worm that lay in the fjord mouth until the herring ran thin. Velkvik says it was always there; Velkvik's grandmothers say it wasn't.",
    notebook:
      "It holds you still, then roars, and everyone's footing goes. Bring fire, and someone who can cover the lost turns. Expect to be back tomorrow.",
  },
  'barrow-king': {
    id: 'barrow-king',
    name: 'The Barrow-King',
    family: 'restless-dead',
    might: 55,
    armor: 12,
    speed: 6,
    attacks: 1,
    resist: resist(0.75, 1.5, 1.25, 0.5, 1.25, 0.25),
    abilities: [
      { kind: 'barrowGrip', name: 'Barrow-Grip', every: 3 },
      { kind: 'graveChill', name: 'Grave Chill', maxHealthFraction: 0.015 },
    ],
    reagent: 'grave-dust',
    whatItWas:
      "A chieftain buried with his hall around him. The barrow doors were sealed with iron, and the iron didn't hold.",
    notebook:
      "The cold gets in whether he hits you or not. Steel does little; silver and rune work do the damage. Rest your Mender, because she'll need it.",
  },
  'mother-of-the-river': {
    id: 'mother-of-the-river',
    name: 'The Mother of the River',
    family: 'water-spirits',
    might: 45,
    armor: 14,
    speed: 11,
    attacks: 2,
    resist: resist(1.0, 1.25, 0.5, 1.5, 1.0, 0.25),
    abilities: [
      { kind: 'drowningSong', name: 'Drowning Song', every: 4 },
      { kind: 'weirPull', name: 'Weir-Pull', every: 4, knockBack: 25 },
    ],
    reagent: 'river-pearl',
    whatItWas:
      "The river's eldest drowned, who kept the others in order. The mills below her pools stopped grinding the year she woke.",
    notebook:
      "Sings the one with the thinnest armour to sleep, and shoves everyone's pace back. Frost and silver. She finds the weak one, so there's no point hiding them.",
  },
  'thorn-stag': {
    id: 'thorn-stag',
    name: 'The Thorn-Stag',
    family: 'field-and-forest-spirits',
    might: 42,
    armor: 11,
    speed: 10,
    attacks: 1,
    resist: resist(1.5, 1.0, 1.25, 0.75, 1.0, 0.5),
    abilities: [
      { kind: 'thornSnare', name: 'Thorn-Snare', every: 3 },
      { kind: 'brambleSweep', name: 'Bramble-Sweep', every: 4 },
    ],
    reagent: 'thornwood',
    whatItWas:
      'An ironwood hart crowned with the boundary thorns a village planted against the winter woods, grown tall enough to walk them back.',
    notebook:
      'Snares the quickest on foot every third turn and sweeps the whole line on the fourth. Steel and fire bite deepest; frost and poison barely scratch the bark.',
  },
  'beacon-bane': {
    id: 'beacon-bane',
    name: 'The Beacon-Bane',
    family: 'cursed',
    damage: 'fire',
    might: 44,
    armor: 9,
    speed: 9,
    attacks: 2,
    resist: resist(0.75, 1.0, 0.25, 1.25, 1.5, 1.25),
    abilities: [
      { kind: 'pitchFlare', name: 'Pitch-Flare', maxHealthFraction: 0.015 },
      { kind: 'curseBrand', name: 'Curse-Brand', every: 4, healCut: 0.5, actions: 2 },
    ],
    reagent: 'noon-poppy',
    whatItWas:
      'An iron signal-brazier that stood above a fell pass until the night nobody came to bank it, walking now on three charred legs with pitch still dripping.',
    notebook:
      'Strikes with live fire, scorches everyone between blows, and brands your hardest hitter so heals only take at half measure. Bring rune, frost, or venom — steel glances off.',
  },
};
