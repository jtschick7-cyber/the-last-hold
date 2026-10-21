import type { HunterDef } from './hunters';
import type { TraitDef } from './traits';

// GDD §8.5 (v0.9, D362, D368, D381): the three legendary hunters and their three traits. They
// arrive free when their hunt is unlocked (core, plan T9.8), have no letters, no recruitment price
// and no alternate trait, and are hidden from the Hunters tab until then. Numbers are tunable
// content (GDD §8 header). Portraits are the generated parts for now; the owner's art comes at
// T9.16.

export const V09_TRAIT_IDS = ['eye-taker', 'tall-torch', 'night-sitter'] as const;
export type V09TraitId = (typeof V09_TRAIT_IDS)[number];

type V09TraitDef = Omit<TraitDef, 'id'> & { readonly id: V09TraitId };

export const v09Traits: Readonly<Record<V09TraitId, V09TraitDef>> = {
  'eye-taker': {
    id: 'eye-taker',
    name: 'Eye-Taker',
    summary: '+10 points crit chance.',
    effect: { kind: 'critPoints', amount: 10 },
    activeFrom: 'v0.9',
  },
  'tall-torch': {
    id: 'tall-torch',
    name: 'Tall Torch',
    summary: 'While this Vanguard is standing, party hit chance +3 points.',
    effect: { kind: 'partyHitWhileStanding', amount: 0.03 },
    activeFrom: 'v0.9',
  },
  'night-sitter': {
    id: 'night-sitter',
    name: 'Night-Sitter',
    summary: '+20% Might vs Field & Forest Spirits.',
    effect: { kind: 'mightVsFamily', family: 'field-and-forest-spirits', amount: 0.2 },
    activeFrom: 'v0.9',
  },
};

export const LEGENDARY_HUNTER_IDS = [
  'gest-tall-torch',
  'ragnhild-eye-taker',
  'radmila-of-the-reeds',
] as const;
export type LegendaryHunterId = (typeof LEGENDARY_HUNTER_IDS)[number];

type LegendaryDef = Omit<HunterDef, 'id'> & { readonly id: LegendaryHunterId };

export const legendaryHunters: Readonly<Record<LegendaryHunterId, LegendaryDef>> = {
  'gest-tall-torch': {
    id: 'gest-tall-torch',
    name: 'Gest Tall-Torch',
    shortName: 'Gest',
    role: 'vanguard',
    damage: 'fire',
    origin: 'highland',
    traits: ['fire-touched', 'tall-torch'],
    unlock: { kind: 'huntPoints', hunt: 'stoneback' },
    stats: { health: 172, might: 12, armor: 8, speed: 7 },
    recruitPrice: 0,
    story: false,
    // GDD §8.5: a big man in a fur cap with a pine torch on his shoulder and singed knuckles.
    portrait: {
      skin: 'warm',
      face: 'broad',
      hair: 'short',
      hairColor: 'brown',
      beard: 'full',
      headgear: 'cap',
      headgearColor: 'brown',
      collar: 'fur',
      clothColor: 'brown',
      weapon: 'staff',
    },
    bio: 'Kept a pine torch burning at the head of the Stoneback pass, winter after winter, so no one would walk into the troll’s hands in the dark.',
    sketch:
      'Kept a pine torch burning at the head of the Stoneback pass, winter after winter, so no one would walk into the troll’s hands in the dark. Never learned not to fear the dark; learned to be careful of it.',
  },
  'ragnhild-eye-taker': {
    id: 'ragnhild-eye-taker',
    name: 'Ragnhild the Eye-Taker',
    shortName: 'Ragnhild',
    role: 'striker',
    damage: 'frost',
    origin: 'highland',
    traits: ['cold-blooded', 'eye-taker'],
    unlock: { kind: 'huntPoints', hunt: 'likho' },
    stats: { health: 98, might: 21, armor: 3, speed: 12 },
    recruitPrice: 0,
    story: false,
    // GDD §8.5: a lean woman in a sheepskin with a bone needle through her cap and a cord at her belt.
    portrait: {
      skin: 'light',
      face: 'narrow',
      hair: 'braid',
      hairColor: 'white',
      beard: 'none',
      headgear: 'cap',
      headgearColor: 'grey',
      collar: 'fur',
      clothColor: 'grey',
      weapon: 'knife',
      mark: 'frost',
    },
    bio: 'A fell-woman from the high pastures, said to have taken an eye from every bad thing that crossed her flock.',
    sketch:
      'A fell-woman from the high pastures, said to have taken an eye from every bad thing that crossed her flock. She keeps the count on a knotted cord and won’t say how many knots it has. Likho is one-eyed because of her; Likho remembers.',
  },
  'radmila-of-the-reeds': {
    id: 'radmila-of-the-reeds',
    name: 'Radmila of the Reeds',
    shortName: 'Radmila',
    role: 'mender',
    damage: 'silver',
    origin: 'lowland',
    traits: ['bonesetter', 'night-sitter'],
    unlock: { kind: 'huntPoints', hunt: 'mara' },
    stats: { health: 112, might: 10, armor: 4, speed: 10 },
    recruitPrice: 0,
    story: false,
    // GDD §8.5: a stout woman in marsh-green wool with a silver spoon in her apron pocket.
    portrait: {
      skin: 'tan',
      face: 'broad',
      hair: 'braid',
      hairColor: 'brown',
      beard: 'none',
      headgear: 'scarf',
      headgearColor: 'green',
      collar: 'cloth',
      clothColor: 'green',
      weapon: 'satchel',
    },
    bio: 'Marsh-wife who sat up at every sickbed below Dubno Ford, with a silver spoon under every pillow.',
    sketch:
      'Marsh-wife who sat up at every sickbed below Dubno Ford, with a silver spoon under every pillow. Says the worst thing she ever cured was loneliness, and that it came back.',
  },
};
