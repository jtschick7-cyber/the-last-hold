import { BOSS_IDS, type BossId, type EventCreature } from './great-beasts';
import type { DamageType } from './damage';
import type { LegendaryHunterId } from './hunters-v09';
import type { RoleId } from './hunters';
import type { TraitId } from './traits';

// GDD §5.12.6, §8.14 (v0.9, D362, D380, D381): the three Legendary Hunts. Each has a quarry, three
// tracks and one legendary hunter. Quarry stats are at base tier 3; a track's tier is
// `hunt.trackTiers` and its points are `hunt.trackPoints` (balance.ts). Numbers are tunable content.

export const HUNT_IDS = ['stoneback', 'mara', 'likho'] as const;
export type HuntId = (typeof HUNT_IDS)[number];

export const QUARRY_IDS = [
  'stoneback-fell-troll',
  'mara-of-kettle-barrow',
  'likho-one-eyed',
] as const;
export type QuarryId = (typeof QUARRY_IDS)[number];

/** The six creatures of the Events shelf: three Great Beasts and three quarries (GDD §8.13, §8.14). */
export const EVENT_CREATURE_IDS = [...BOSS_IDS, ...QUARRY_IDS] as const;
export type EventCreatureId = BossId | QuarryId;

export const TRACK_IDS = [
  'stoneback-1',
  'stoneback-2',
  'stoneback-3',
  'mara-1',
  'mara-2',
  'mara-3',
  'likho-1',
  'likho-2',
  'likho-3',
] as const;
export type TrackId = (typeof TRACK_IDS)[number];

/** Who may come on a track: a hunter must meet it (GDD §8.14). */
export type TrackRestriction =
  | { readonly kind: 'roles'; readonly roles: readonly RoleId[] }
  | { readonly kind: 'damage'; readonly types: readonly DamageType[] }
  /** Has any of these traits. */
  | { readonly kind: 'traits'; readonly traits: readonly TraitId[] };

export interface TrackDef {
  readonly id: TrackId;
  readonly name: string;
  /** I, II or III: also the index into `hunt.trackTiers` and `hunt.trackPoints`. */
  readonly number: 1 | 2 | 3;
  readonly restriction: TrackRestriction;
  /** The line shown on the picker, as the GDD words who may come. */
  readonly restrictionText: string;
}

export interface QuarryDef extends EventCreature {
  readonly id: QuarryId;
  readonly health: number;
}

export interface HuntDef {
  readonly id: HuntId;
  /** A plain label for sheets ("The Stoneback hunt"); not a proper name of its own. */
  readonly label: string;
  readonly quarry: QuarryId;
  readonly hunter: LegendaryHunterId;
  readonly tracks: readonly [TrackDef, TrackDef, TrackDef];
  /** The line on the unlock sheet (GDD §8.14). */
  readonly unlockLine: string;
}

const resist = (
  steel: number,
  silver: number,
  fire: number,
  frost: number,
  rune: number,
  venom: number,
): Readonly<Record<DamageType, number>> => ({ steel, silver, fire, frost, rune, venom });

export const quarries: Readonly<Record<QuarryId, QuarryDef>> = {
  'stoneback-fell-troll': {
    id: 'stoneback-fell-troll',
    name: 'Stoneback the Fell Troll',
    family: 'beasts-and-wilds',
    health: 1100,
    might: 30,
    armor: 12,
    speed: 6,
    attacks: 1,
    resist: resist(0.75, 1.0, 1.5, 0.75, 1.25, 0.5),
    abilities: [
      { kind: 'boulderToss', name: 'Boulder Toss', every: 4 },
      { kind: 'mossMend', name: 'Moss-Mend', regenFraction: 0.03 },
    ],
    reagent: 'wolf-fang',
    whatItWas:
      'A hill-troll half turned to rock by a dawn he took for a friend. He still guards the pass; he has forgotten what from.',
    notebook:
      "Throws boulders at all of you at once, and mends between throws. Fire and rune hurt him. Out-damage the mending or don't bother.",
  },
  'mara-of-kettle-barrow': {
    id: 'mara-of-kettle-barrow',
    name: 'The Mara of Kettle Barrow',
    family: 'field-and-forest-spirits',
    health: 700,
    might: 22,
    armor: 3,
    speed: 14,
    attacks: 2,
    resist: resist(1.0, 1.5, 1.0, 1.0, 1.25, 0.5),
    abilities: [
      { kind: 'nightWeight', name: 'Night-Weight', every: 4 },
      { kind: 'quickDark', name: 'Quick Dark' },
    ],
    reagent: 'thornwood',
    whatItWas:
      'The weight on a sleeper’s chest, grown a body. She has sat on one sleeper a night, for more nights than the barrow has stones.',
    notebook:
      'Sits on whoever hits hardest, and spoils the first potion she touches. Silver bites. Keep a second plan.',
  },
  'likho-one-eyed': {
    id: 'likho-one-eyed',
    name: 'Likho the One-Eyed',
    family: 'cursed',
    health: 900,
    might: 26,
    armor: 6,
    speed: 12,
    attacks: 1,
    resist: resist(1.0, 1.25, 0.75, 1.5, 1.0, 0.75),
    abilities: [
      { kind: 'illLuck', name: 'Ill Luck', critCut: 10 },
      { kind: 'misfortune', name: 'Misfortune', chance: 0.15 },
    ],
    reagent: 'rime-salt',
    whatItWas:
      'Misfortune given one eye and a long coat. It follows whoever laughs last, and it has not yet been out-waited.',
    notebook:
      'Everything goes slightly wrong around him: a missed blow, a lost turn. Frost and silver. Take the steady ones and expect a few lost turns.',
  },
};

export const hunts: Readonly<Record<HuntId, HuntDef>> = {
  stoneback: {
    id: 'stoneback',
    label: 'Stoneback',
    quarry: 'stoneback-fell-troll',
    hunter: 'gest-tall-torch',
    tracks: [
      {
        id: 'stoneback-1',
        name: 'The Toll Road',
        number: 1,
        restriction: { kind: 'roles', roles: ['vanguard', 'striker'] },
        restrictionText: 'Vanguards and Strikers only',
      },
      {
        id: 'stoneback-2',
        name: 'Cold Iron',
        number: 2,
        restriction: { kind: 'damage', types: ['steel', 'rune'] },
        restrictionText: 'Steel or Rune damage only',
      },
      {
        id: 'stoneback-3',
        name: 'The Old Hands',
        number: 3,
        restriction: { kind: 'traits', traits: ['quick', 'hard-to-kill'] },
        restrictionText: 'Hunters with the Quick or Hard to kill trait',
      },
    ],
    unlockLine:
      "Gest Tall-Torch has come down from the pass with a pine torch over his shoulder. 'The road's clear,' he says. 'I thought I'd see who cleared it.'",
  },
  mara: {
    id: 'mara',
    label: 'Mara',
    quarry: 'mara-of-kettle-barrow',
    hunter: 'radmila-of-the-reeds',
    tracks: [
      {
        id: 'mara-1',
        name: 'The Waking',
        number: 1,
        restriction: { kind: 'roles', roles: ['striker', 'mender'] },
        restrictionText: 'Strikers and Menders only',
      },
      {
        id: 'mara-2',
        name: 'Candle and Salt',
        number: 2,
        restriction: { kind: 'damage', types: ['fire', 'frost', 'silver'] },
        restrictionText: 'Fire, Frost or Silver damage only',
      },
      {
        id: 'mara-3',
        name: 'Sitting Up',
        number: 3,
        restriction: {
          kind: 'traits',
          traits: ['hard-to-kill', 'lantern-bearer', 'tracker', 'bonesetter'],
        },
        restrictionText:
          'Hunters with the Hard to kill, Lantern-bearer, Tracker or Bonesetter trait',
      },
    ],
    unlockLine:
      "Radmila of the Reeds has put a silver spoon under every pillow in the barracks before anyone could ask. 'Sleep,' she says. 'I'll sit.'",
  },
  likho: {
    id: 'likho',
    label: 'Likho',
    quarry: 'likho-one-eyed',
    hunter: 'ragnhild-eye-taker',
    tracks: [
      {
        id: 'likho-1',
        name: 'One Eye Open',
        number: 1,
        restriction: { kind: 'roles', roles: ['mender', 'vanguard'] },
        restrictionText: 'Menders and Vanguards only',
      },
      {
        id: 'likho-2',
        name: 'A Cold Reckoning',
        number: 2,
        restriction: { kind: 'damage', types: ['venom', 'frost', 'silver'] },
        restrictionText: 'Venom, Frost or Silver damage only',
      },
      {
        id: 'likho-3',
        name: 'The Counting',
        number: 3,
        restriction: {
          kind: 'traits',
          traits: ['grave-warden', 'wolf-friend', 'old-wright', 'fen-born', 'fell-born'],
        },
        restrictionText:
          'Hunters with the Grave-warden, Wolf-friend, Old Wright, Fen-born or Fell-born trait',
      },
    ],
    unlockLine:
      "Ragnhild the Eye-Taker has come in from the fells with a cord at her belt. She doesn't say how many knots it has. 'Likho's the one-eyed one now,' she says. 'You're welcome.'",
  },
};
