import { arvid } from './hunters-v05';
import type { DamageType } from './damage';
import type { KnowledgeLevel } from './knowledge';
import type { MonsterId } from './monsters';
import type { TraitId } from './traits';

// GDD §5.3 and §8.5: ten hand-authored hunters (v0.3 added Stanko and Herdis, Q12). Stats are level-1 base values
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
  'stanko',
  'herdis',
  'arvid', // v0.5 (D154)
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

/**
 * GDD §8.5 role baselines at level 1. Hunters vary from the baseline by up to ±10% or
 * 1 point per stat, whichever is larger (so Armor and Speed may move by 1; D102).
 */
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
  | {
      readonly kind: 'buildingLevel';
      readonly building: 'smithy' | 'hunters-lodge';
      readonly level: number;
    }
  /** A species reaches a knowledge level (GDD §5.3.1 "bestiary progress"). */
  | { readonly kind: 'knowledgeLevel'; readonly monster: MonsterId; readonly level: KnowledgeLevel }
  | { readonly kind: 'bountySilverEarned'; readonly amount: number }
  /** When this act begins (Arvid, Act III; v0.5). */
  | { readonly kind: 'actBegins'; readonly act: number };

export type Origin = 'highland' | 'lowland' | 'wanderer';

/**
 * The parts of a hunter's generated portrait (GDD §9.12, technical design §12.3):
 * face, hair, beard, headgear, collar and a weapon silhouette, each a layer, drawn
 * by tools/gen-portraits.ts in palette colors. Swapping the art means replacing the
 * PNG; changing a part here and regenerating redraws just that hunter.
 */
export interface PortraitSpec {
  readonly skin: 'light' | 'warm' | 'tan' | 'deep';
  readonly face: 'broad' | 'oval' | 'narrow' | 'square';
  readonly hair: 'none' | 'short' | 'long' | 'braid' | 'cropped';
  readonly hairColor: 'black' | 'brown' | 'auburn' | 'blond' | 'grey' | 'white';
  readonly beard: 'none' | 'stubble' | 'short' | 'full' | 'braided';
  readonly headgear: 'none' | 'cap' | 'hood' | 'scarf' | 'band' | 'knit';
  readonly headgearColor: 'brown' | 'green' | 'blue' | 'red' | 'grey' | 'violet';
  readonly collar: 'cloth' | 'fur' | 'leather' | 'scarred-leather' | 'plate' | 'mail';
  readonly clothColor: 'brown' | 'green' | 'blue' | 'red' | 'grey' | 'violet';
  readonly weapon:
    'axe' | 'boathook' | 'staff' | 'spear' | 'satchel' | 'shovel' | 'hammer' | 'kettle' | 'knife';
  /** Soot on the face (Halvar), a scar, and similar single marks; `rune` is drawn on the axe haft (Arvid). */
  readonly mark?: 'soot' | 'scar' | 'frost' | 'rune';
}

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
  readonly portrait: PortraitSpec;
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
    portrait: {
      skin: 'warm',
      face: 'broad',
      hair: 'short',
      hairColor: 'grey',
      beard: 'full',
      headgear: 'cap',
      headgearColor: 'brown',
      collar: 'fur',
      clothColor: 'brown',
      weapon: 'axe',
      mark: 'soot',
    },
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
    portrait: {
      skin: 'light',
      face: 'oval',
      hair: 'braid',
      hairColor: 'brown',
      beard: 'none',
      headgear: 'scarf',
      headgearColor: 'blue',
      collar: 'cloth',
      clothColor: 'blue',
      weapon: 'boathook',
    },
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
    portrait: {
      skin: 'warm',
      face: 'narrow',
      hair: 'short',
      hairColor: 'white',
      beard: 'short',
      headgear: 'cap',
      headgearColor: 'grey',
      collar: 'cloth',
      clothColor: 'green',
      weapon: 'staff',
    },
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
    portrait: {
      skin: 'light',
      face: 'broad',
      hair: 'braid',
      hairColor: 'blond',
      beard: 'none',
      headgear: 'hood',
      headgearColor: 'blue',
      collar: 'fur',
      clothColor: 'grey',
      weapon: 'spear',
      mark: 'frost',
    },
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
    portrait: {
      skin: 'tan',
      face: 'oval',
      hair: 'long',
      hairColor: 'black',
      beard: 'none',
      headgear: 'scarf',
      headgearColor: 'green',
      collar: 'cloth',
      clothColor: 'green',
      weapon: 'satchel',
    },
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
    portrait: {
      skin: 'tan',
      face: 'square',
      hair: 'cropped',
      hairColor: 'brown',
      beard: 'stubble',
      headgear: 'hood',
      headgearColor: 'grey',
      collar: 'leather',
      clothColor: 'grey',
      weapon: 'shovel',
    },
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
    portrait: {
      skin: 'light',
      face: 'narrow',
      hair: 'cropped',
      hairColor: 'auburn',
      beard: 'none',
      headgear: 'band',
      headgearColor: 'red',
      collar: 'leather',
      clothColor: 'red',
      weapon: 'hammer',
      mark: 'scar',
    },
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
    stats: { health: 150, might: 12, armor: 7, speed: 8 },
    recruitPrice: 600,
    story: true,
    portrait: {
      skin: 'deep',
      face: 'oval',
      hair: 'short',
      hairColor: 'black',
      beard: 'short',
      headgear: 'cap',
      headgearColor: 'violet',
      collar: 'cloth',
      clothColor: 'violet',
      weapon: 'kettle',
    },
    bio: 'Tinker and talker, with opinions about every price at the hold.',
    sketch: 'Tinker and talker. Has opinions about every price at the hold.',
  },
  stanko: {
    id: 'stanko',
    name: 'Stanko Sleepless',
    shortName: 'Stanko',
    role: 'striker',
    damage: 'venom',
    origin: 'lowland',
    traits: ['wolf-friend', 'quick'],
    unlock: { kind: 'knowledgeLevel', monster: 'wolf', level: 'studied' },
    stats: { health: 95, might: 21, armor: 3, speed: 12 },
    recruitPrice: 450,
    story: false,
    portrait: {
      skin: 'tan',
      face: 'narrow',
      hair: 'long',
      hairColor: 'black',
      beard: 'stubble',
      headgear: 'none',
      headgearColor: 'brown',
      collar: 'fur',
      clothColor: 'brown',
      weapon: 'knife',
      mark: 'scar',
    },
    bio: 'Kozly Hollow goatherd who raised a wolf pup with his flock. Says the grey ones aren’t wolves anymore, and he’d know.',
    sketch:
      "Sits up nights with a knife dipped in something he keeps in a goat's horn. Nobody in the Hollow has seen him sleep.",
  },
  herdis: {
    id: 'herdis',
    name: 'Herdis Strayfinder',
    shortName: 'Herdis',
    role: 'mender',
    damage: 'frost',
    origin: 'highland',
    traits: ['tracker', 'hard-to-kill'],
    unlock: { kind: 'buildingLevel', building: 'hunters-lodge', level: 1 },
    stats: { health: 120, might: 9, armor: 4, speed: 10 },
    recruitPrice: 300,
    story: false,
    portrait: {
      skin: 'light',
      face: 'square',
      hair: 'long',
      hairColor: 'auburn',
      beard: 'none',
      headgear: 'hood',
      headgearColor: 'violet',
      collar: 'fur',
      clothColor: 'green',
      weapon: 'staff',
      mark: 'frost',
    },
    bio: 'Has kept Ravenfell’s sheep alive since she was nine, and found every one that strayed. Says hunters are easier: they tell you where it hurts.',
    sketch:
      'Can follow a week-old track across bare rock. The iron heel of her crook is rime-salted, an old Ravenfell habit against things that walk at night.',
  },
  arvid,
};
