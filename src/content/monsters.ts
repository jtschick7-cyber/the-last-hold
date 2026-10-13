import { type DamageType, type FamilyId, type LocationId } from './damage';

// GDD §8.3: the 12 monsters, identified for free in v0.2. Stats are at the
// monster's base tier; each tier above it scales Health and Might by
// monster.statGrowth and Armor by monster.armorGrowth (GDD §7.4). Speed doesn't
// scale. Abilities are data here; core/combat (T2.7) gives them their effect.
// Clue tags and drops arrive with the bestiary in v0.3.

export const MONSTER_IDS = [
  'wolf',
  'kikimora',
  'upyr',
  'rusalka',
  'poludnitsa',
  'vodyanoy',
  'draugr',
  'bies',
  'leshy',
  'strzyga',
  'huldra',
  'nix',
] as const;
export type MonsterId = (typeof MONSTER_IDS)[number];

/** Every ability's numbers, exactly as GDD §8.3 words them (turn-meter form, G4). */
export type MonsterAbility =
  | {
      readonly kind: 'hamstring';
      readonly name: 'Hamstring';
      /** Chance per hit; the roll is drawn only if the attack hit (GDD §5.5). */
      readonly chance: number;
      readonly speedCut: number;
      /** The target's own next actions. */
      readonly actions: number;
    }
  | { readonly kind: 'spoil'; readonly name: 'Spoil' }
  | { readonly kind: 'bloodfeast'; readonly name: 'Bloodfeast'; readonly healFraction: number }
  | {
      readonly kind: 'drowningSong';
      readonly name: 'Drowning Song';
      /** On its 1st action and every `every` after (1st, 5th, 9th…). */
      readonly every: number;
    }
  | {
      readonly kind: 'noonHeat';
      readonly name: 'Noon Heat';
      readonly maxHealthFraction: number;
      /** A Frost Pot suppresses it for this many of the monster's next actions. */
      readonly frostSuppressActions: number;
    }
  | {
      readonly kind: 'dragUnder';
      readonly name: 'Drag Under';
      readonly every: number;
      readonly nextHitMult: number;
    }
  | { readonly kind: 'barrowGrip'; readonly name: 'Barrow-Grip'; readonly every: number }
  | {
      readonly kind: 'swell';
      readonly name: 'Swell';
      readonly belowHealth: number;
      readonly armorBonus: number;
    }
  | { readonly kind: 'malice'; readonly name: 'Malice'; readonly mightPerAction: number }
  | { readonly kind: 'leadAstray'; readonly name: 'Lead Astray'; readonly chance: number }
  | { readonly kind: 'rootWall'; readonly name: 'Root-Wall'; readonly regenFraction: number }
  | { readonly kind: 'secondSoul'; readonly name: 'Second Soul'; readonly reviveFraction: number }
  | {
      readonly kind: 'enthrall';
      readonly name: 'Enthrall';
      readonly every: number;
      readonly healFraction: number;
    }
  | {
      readonly kind: 'riverhorse';
      readonly name: 'Riverhorse';
      /** The carried-off hunter returns after this many of the Nix's actions. */
      readonly awayActions: number;
      readonly healthLossFraction: number;
    };

export interface MonsterDef {
  readonly id: MonsterId;
  readonly name: string;
  readonly family: FamilyId;
  readonly locations: readonly LocationId[];
  /** First and last tier it can appear at; the first is its base tier t₀. */
  readonly tiers: readonly [number, number];
  readonly health: number;
  readonly might: number;
  readonly armor: number;
  readonly speed: number;
  /** Attacks per action. */
  readonly attacks: number;
  /** Multiplier on incoming damage of each type; 0 is immune (GDD §5.5). */
  readonly resist: Readonly<Record<DamageType, number>>;
  readonly abilities: readonly MonsterAbility[];
}

const resist = (
  steel: number,
  silver: number,
  fire: number,
  frost: number,
  rune: number,
  venom: number,
): Readonly<Record<DamageType, number>> => ({ steel, silver, fire, frost, rune, venom });

export const monsters: Readonly<Record<MonsterId, MonsterDef>> = {
  // GDD calls this "Gloam Wolf", which is an Elder Scrolls Online creature
  // (GDD §2.3 process rule). "Gaunt Wolf" is Claude's proposal, pending Q6/D69;
  // the id stays neutral so a rename never touches saves.
  wolf: {
    id: 'wolf',
    name: 'Gaunt Wolf',
    family: 'beasts-and-wilds',
    locations: ['forest', 'field', 'river', 'barrow'],
    tiers: [1, 2],
    health: 120,
    might: 10,
    armor: 2,
    speed: 14,
    attacks: 2,
    resist: resist(1.0, 1.0, 1.25, 1.0, 1.0, 1.25),
    abilities: [{ kind: 'hamstring', name: 'Hamstring', chance: 0.25, speedCut: 0.3, actions: 3 }],
  },
  kikimora: {
    id: 'kikimora',
    name: 'Kikimora',
    family: 'field-and-forest-spirits',
    locations: ['forest', 'field', 'river'],
    tiers: [1, 2],
    health: 110,
    might: 12,
    armor: 3,
    speed: 13,
    attacks: 1,
    resist: resist(1.0, 1.25, 1.5, 0.75, 1.0, 0.5),
    abilities: [{ kind: 'spoil', name: 'Spoil' }],
  },
  upyr: {
    id: 'upyr',
    name: 'Upyr',
    family: 'restless-dead',
    locations: ['field', 'barrow'],
    tiers: [2, 3],
    health: 170,
    might: 16,
    armor: 4,
    speed: 10,
    attacks: 1,
    resist: resist(0.75, 1.5, 1.25, 0.75, 1.25, 0),
    abilities: [{ kind: 'bloodfeast', name: 'Bloodfeast', healFraction: 0.5 }],
  },
  rusalka: {
    id: 'rusalka',
    name: 'Rusalka',
    family: 'water-spirits',
    locations: ['river'],
    tiers: [2, 3],
    health: 150,
    might: 14,
    armor: 2,
    speed: 12,
    attacks: 1,
    resist: resist(1.0, 1.5, 0.75, 1.25, 1.0, 0.5),
    abilities: [{ kind: 'drowningSong', name: 'Drowning Song', every: 4 }],
  },
  poludnitsa: {
    id: 'poludnitsa',
    name: 'Poludnitsa',
    family: 'field-and-forest-spirits',
    locations: ['field'],
    tiers: [2, 4],
    health: 160,
    might: 15,
    armor: 3,
    speed: 11,
    attacks: 1,
    resist: resist(1.0, 1.25, 0.25, 1.75, 1.0, 0.75),
    abilities: [
      { kind: 'noonHeat', name: 'Noon Heat', maxHealthFraction: 0.03, frostSuppressActions: 3 },
    ],
  },
  vodyanoy: {
    id: 'vodyanoy',
    name: 'Vodyanoy',
    family: 'water-spirits',
    locations: ['river'],
    tiers: [3, 5],
    health: 230,
    might: 20,
    armor: 7,
    speed: 7,
    attacks: 1,
    resist: resist(0.75, 1.25, 0.5, 1.5, 1.0, 1.0),
    abilities: [{ kind: 'dragUnder', name: 'Drag Under', every: 3, nextHitMult: 2 }],
  },
  draugr: {
    id: 'draugr',
    name: 'Draugr',
    family: 'restless-dead',
    locations: ['barrow'],
    tiers: [3, 5],
    health: 260,
    might: 22,
    armor: 9,
    speed: 6,
    attacks: 1,
    resist: resist(0.75, 1.5, 1.5, 0.25, 1.25, 0),
    abilities: [
      { kind: 'barrowGrip', name: 'Barrow-Grip', every: 3 },
      { kind: 'swell', name: 'Swell', belowHealth: 0.5, armorBonus: 0.5 },
    ],
  },
  bies: {
    id: 'bies',
    name: 'Bies',
    family: 'beasts-and-wilds',
    locations: ['forest', 'field'],
    tiers: [3, 5],
    health: 220,
    might: 18,
    armor: 5,
    speed: 12,
    attacks: 1,
    resist: resist(1.0, 1.0, 1.25, 1.0, 1.5, 0.75),
    abilities: [{ kind: 'malice', name: 'Malice', mightPerAction: 0.05 }],
  },
  leshy: {
    id: 'leshy',
    name: 'Leshy',
    family: 'field-and-forest-spirits',
    locations: ['forest'],
    tiers: [4, 5],
    health: 320,
    might: 20,
    armor: 8,
    speed: 8,
    attacks: 1,
    resist: resist(0.75, 1.0, 1.75, 0.75, 1.25, 0.5),
    abilities: [
      { kind: 'leadAstray', name: 'Lead Astray', chance: 0.15 },
      { kind: 'rootWall', name: 'Root-Wall', regenFraction: 0.05 },
    ],
  },
  strzyga: {
    id: 'strzyga',
    name: 'Strzyga',
    family: 'restless-dead',
    locations: ['barrow', 'field'],
    tiers: [4, 5],
    health: 240,
    might: 24,
    armor: 5,
    speed: 13,
    attacks: 1,
    resist: resist(0.75, 1.5, 1.0, 1.0, 1.5, 0.5),
    abilities: [{ kind: 'secondSoul', name: 'Second Soul', reviveFraction: 0.4 }],
  },
  huldra: {
    id: 'huldra',
    name: 'Huldra',
    family: 'field-and-forest-spirits',
    locations: ['forest', 'field'],
    tiers: [2, 4],
    health: 150,
    might: 15,
    armor: 3,
    speed: 12,
    attacks: 1,
    resist: resist(1.0, 1.25, 1.25, 1.0, 1.0, 0.75),
    abilities: [{ kind: 'enthrall', name: 'Enthrall', every: 4, healFraction: 0.1 }],
  },
  nix: {
    id: 'nix',
    name: 'Nix',
    family: 'water-spirits',
    locations: ['river'],
    tiers: [3, 5],
    health: 210,
    might: 19,
    armor: 4,
    speed: 13,
    attacks: 1,
    resist: resist(1.0, 1.25, 0.75, 1.5, 1.0, 0.5),
    abilities: [
      { kind: 'riverhorse', name: 'Riverhorse', awayActions: 3, healthLossFraction: 0.2 },
    ],
  },
};
