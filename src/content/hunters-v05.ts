import { CURSED_FAMILY } from './cursed';
import type { HunterDef } from './hunters';
import type { TraitDef } from './traits';

// GDD §8.5 (v0.5, D154): Arvid Netmender and his two traits, spread into the
// hunter and trait tables (T5.5). He unlocks when Act III begins, so he can't
// arrive in v0.5; a debug action adds him for testing.

export const V05_TRAIT_IDS = ['shield-companion', 'old-wright'] as const;
export type V05TraitId = (typeof V05_TRAIT_IDS)[number];

/** Arvid's traits, as the main trait table holds them (traits.ts spreads them in). */
type V05TraitDef = Omit<TraitDef, 'id'> & { readonly id: V05TraitId };

export const v05Traits: Readonly<Record<V05TraitId, V05TraitDef>> = {
  'shield-companion': {
    id: 'shield-companion',
    name: 'Shield-companion',
    summary:
      'While this Vanguard is standing, the party member with the lowest % Health takes −15% damage.',
    effect: { kind: 'lowestHealthTakenWhileStanding', amount: 0.15 },
    activeFrom: 'v0.5',
  },
  'old-wright': {
    id: 'old-wright',
    name: 'Old Wright',
    summary: '+20% Might vs the Cursed.',
    effect: { kind: 'mightVsFamily', family: CURSED_FAMILY.id, amount: 0.2 },
    activeFrom: 'v0.5',
  },
};

export const arvid: HunterDef = {
  id: 'arvid',
  name: 'Arvid Netmender',
  shortName: 'Arvid',
  role: 'vanguard',
  damage: 'rune',
  origin: 'highland',
  traits: ['shield-companion', 'old-wright'],
  unlock: { kind: 'arrivesWithIlse', act: 3 },
  stats: { health: 175, might: 12, armor: 9, speed: 7 },
  recruitPrice: 0,
  story: true,
  // GDD §8.5: a grey beard in two braids, a fisherman's knit cap, a scarred leather
  // collar, a faint rune-mark on the axe haft (new portrait parts, drawn in T5.13).
  portrait: {
    skin: 'light',
    face: 'square',
    hair: 'short',
    hairColor: 'grey',
    beard: 'braided',
    headgear: 'knit',
    headgearColor: 'grey',
    collar: 'scarred-leather',
    clothColor: 'blue',
    weapon: 'axe',
    mark: 'rune',
  },
  bio: "Velkvik net-mender, fifty-one, with a runed axe he won't talk about. Says he's too old for this. Hasn't missed a fight.",
  sketch:
    "Velkvik net-mender, 51, who keeps a runed axe he won't talk about. Says he's too old for this. Hasn't missed a fight.",
};
