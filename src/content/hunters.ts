import type { DamageType } from './damage';
import type { MonsterId } from './monsters';
import type { TraitId } from './traits';

// GDD §5.3 and §8.5: eight hand-authored hunters. Stats are level-1 base values
// (gear and traits are added by the selectors, GDD §5.3.2). Recruitment prices
// are fixed silver prices (G5); the two starting hunters are free.

export const HUNTER_IDS = [
  'halvar',
  'zora',
  'ostap',
  'bjarna',
  'vesna',
  'radek',
  'sigrun',
  'toma',
] as const;
export type HunterId = (typeof HUNTER_IDS)[number];

export const ROLE_IDS = ['vanguard', 'mender', 'striker'] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export interface Stats {
  readonly health: number;
  readonly might: number;
  readonly armor: number;
  readonly speed: number;
}

/** GDD §8.5 role baselines at level 1 (hunters vary by up to ±10% per stat). */
export const roleBaselines: Readonly<Record<RoleId, Stats>> = {
  vanguard: { health: 160, might: 12, armor: 8, speed: 8 },
  striker: { health: 100, might: 20, armor: 3, speed: 12 },
  mender: { health: 110, might: 10, armor: 4, speed: 10 },
};

export const roleNames: Readonly<Record<RoleId, string>> = {
  vanguard: 'Vanguard',
  mender: 'Mender',
  striker: 'Striker',
};

/** When a hunter arrives as a candidate (GDD §8.5 "Unlock"). */
export type HunterUnlock =
  | { readonly kind: 'start' }
  | { readonly kind: 'contractSuccesses'; readonly count: number }
  | { readonly kind: 'successAtLocation'; readonly location: 'river' }
  | { readonly kind: 'defeatMonster'; readonly monster: MonsterId }
  | { readonly kind: 'buildingLevel'; readonly building: 'smithy'; readonly level: number }
  | { readonly kind: 'bountySilverEarned'; readonly amount: number };

export type Origin = 'highland' | 'lowland' | 'wanderer';

export interface HunterDef {
  readonly id: HunterId;
  readonly name: string;
  readonly shortName: string;
  readonly role: RoleId;
  readonly damage: DamageType;
  readonly origin: Origin;
  readonly traits: readonly [TraitId, TraitId];
  readonly unlock: HunterUnlock;
  readonly stats: Stats;
  /** Silver. 0 for the two starting hunters. */
  readonly recruitPrice: number;
  /** Story hunters never die: a Reckless death roll becomes Grievously Wounded (GDD §5.3.7). */
  readonly story: boolean;
  /** The public line (setting-primer §5): all anyone in the hold knows, no secrets. */
  readonly bio: string;
  /** The GDD §8.5 design sketch, which may hint at lore; not shown to the player. */
  readonly sketch: string;
}

export const hunters: Readonly<Record<HunterId, HunterDef>> = {
  halvar: {
    id: 'halvar',
    name: 'Halvar Two-Smokes',
    shortName: 'Halvar',
    role: 'vanguard',
    damage: 'steel',
    origin: 'highland',
    traits: ['shieldwall', 'steady'],
    unlock: { kind: 'start' },
    stats: { health: 170, might: 12, armor: 8, speed: 7 },
    recruitPrice: 0,
    story: false,
    bio: 'Former charcoal-burner. Calm, enormous, and smells permanently of smoke.',
    sketch: 'Former charcoal-burner. Calm, enormous, smells permanently of smoke.',
  },
  zora: {
    id: 'zora',
    name: 'Zora Sedlak',
    shortName: 'Zora',
    role: 'striker',
    damage: 'steel',
    origin: 'lowland',
    traits: ['fen-born', 'quick'],
    unlock: { kind: 'start' },
    stats: { health: 100, might: 20, armor: 3, speed: 13 },
    recruitPrice: 0,
    story: false,
    bio: 'Ran the Dubno ferry until the river turned deadly. Fights with a boathook.',
    sketch:
      'The Ferrywoman. Ran the Dubno ferry until the river turned deadly. Fights with a boathook.',
  },
  ostap: {
    id: 'ostap',
    name: 'Old Ostap',
    shortName: 'Ostap',
    role: 'mender',
    damage: 'steel',
    origin: 'lowland',
    traits: ['bonesetter', 'hard-to-kill'],
    unlock: { kind: 'contractSuccesses', count: 1 },
    stats: { health: 115, might: 10, armor: 4, speed: 9 },
    recruitPrice: 150,
    story: true,
    bio: 'Village bonesetter, 58. Has buried two masters and a wife, and isn’t done yet.',
    sketch: "Village bonesetter, 58. Has buried two masters and a wife, and isn't done yet.",
  },
  bjarna: {
    id: 'bjarna',
    name: 'Bjarna Ice-Hand',
    shortName: 'Bjarna',
    role: 'striker',
    damage: 'frost',
    origin: 'highland',
    traits: ['cold-blooded', 'fell-born'],
    unlock: { kind: 'contractSuccesses', count: 3 },
    stats: { health: 95, might: 21, armor: 3, speed: 12 },
    recruitPrice: 400,
    story: false,
    bio: 'Velkvik fisherwoman whose rime-dipped spear never quite thaws.',
    sketch: 'Velkvik fisherwoman. Her rime-dipped spear never quite thaws.',
  },
  vesna: {
    id: 'vesna',
    name: 'Vesna of the Weir',
    shortName: 'Vesna',
    role: 'mender',
    damage: 'venom',
    origin: 'lowland',
    traits: ['herbwise', 'fen-born'],
    unlock: { kind: 'successAtLocation', location: 'river' },
    stats: { health: 105, might: 11, armor: 4, speed: 11 },
    recruitPrice: 350,
    story: false,
    bio: 'Herbwife who knows which roots heal and which ones stop hearts.',
    sketch: 'Herbwife who knows which roots heal and which ones stop hearts.',
  },
  radek: {
    id: 'radek',
    name: 'Radek the Gravedigger',
    shortName: 'Radek',
    role: 'vanguard',
    damage: 'silver',
    origin: 'lowland',
    traits: ['grave-warden', 'hard-to-kill'],
    unlock: { kind: 'defeatMonster', monster: 'upyr' },
    stats: { health: 165, might: 11, armor: 9, speed: 7 },
    recruitPrice: 500,
    story: false,
    bio: 'Has buried half of Mirograd. Lately his shovel has been silver-shod.',
    sketch: 'Has buried half of Mirograd. Lately his shovel has been silver-shod.',
  },
  sigrun: {
    id: 'sigrun',
    name: 'Sigrun Halfhand',
    shortName: 'Sigrun',
    role: 'striker',
    damage: 'fire',
    origin: 'highland',
    traits: ['fire-touched', 'lantern-bearer'],
    unlock: { kind: 'buildingLevel', building: 'smithy', level: 5 },
    stats: { health: 100, might: 22, armor: 4, speed: 11 },
    recruitPrice: 1200,
    story: true,
    bio: 'Lost a hand young and won’t say how. Knows forge-work better than she should.',
    sketch: "Exiled Emberwright apprentice who won't say why she left.",
  },
  toma: {
    id: 'toma',
    name: 'Toma Kettle',
    shortName: 'Toma',
    role: 'vanguard',
    damage: 'steel',
    origin: 'wanderer',
    traits: ['haggler', 'quick'],
    unlock: { kind: 'bountySilverEarned', amount: 2000 },
    stats: { health: 150, might: 12, armor: 7, speed: 10 },
    recruitPrice: 600,
    story: true,
    bio: 'Tinker and talker, with opinions about every price at the hold.',
    sketch: 'Tinker and talker. Has opinions about every price at the hold.',
  },
};
