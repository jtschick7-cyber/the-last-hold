import { CURSED_FAMILY } from './cursed';
import type { HunterDef } from './hunters';
import type { TraitDef } from './traits';

// GDD §8.5 (v0.5, D154): Arvid Netmender and his two traits. Content only (plan
// T5.1): hunters and traits are saved state, so they join HUNTER_IDS and
// TRAIT_IDS after the v4 → v5 migration (T5.3); T5.5 gives the traits their
// effect. He unlocks when Act III begins, so he can't arrive in v0.5 (a debug
// action adds him for testing, T5.5).

export const V05_TRAIT_IDS = ['shield-companion', 'old-wright'] as const;
export type V05TraitId = (typeof V05_TRAIT_IDS)[number];

export type V05TraitEffect =
  /** While the holder stands, the party member with the lowest % Health takes this much less (taken%; ties by slot). */
  | { readonly kind: 'lowestHealthTakenWhileStanding'; readonly amount: number }
  | {
      readonly kind: 'mightVsFamily';
      readonly family: typeof CURSED_FAMILY.id;
      readonly amount: number;
    };

export interface V05TraitDef extends Omit<TraitDef, 'id' | 'effect' | 'activeFrom'> {
  readonly id: V05TraitId;
  readonly effect: V05TraitEffect;
  readonly activeFrom: 'v0.5';
}

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

export interface V05HunterDef extends Omit<HunterDef, 'id' | 'traits' | 'unlock'> {
  readonly id: 'arvid';
  readonly traits: readonly [V05TraitId, V05TraitId];
  /** GDD §8.5: when Act III begins (lore-secrets §10). */
  readonly unlock: { readonly kind: 'actBegins'; readonly act: number };
}

export const arvid: V05HunterDef = {
  id: 'arvid',
  name: 'Arvid Netmender',
  shortName: 'Arvid',
  role: 'vanguard',
  damage: 'rune',
  origin: 'highland',
  traits: ['shield-companion', 'old-wright'],
  unlock: { kind: 'actBegins', act: 3 },
  stats: { health: 175, might: 12, armor: 9, speed: 7 },
  recruitPrice: 0,
  story: true,
  // GDD §8.5: a grey beard in two braids, a fisherman's knit cap, a scarred leather
  // collar, a faint rune-mark on the axe haft. The braids and the rune-mark need
  // new portrait parts; T5.13 draws them.
  portrait: {
    skin: 'light',
    face: 'square',
    hair: 'short',
    hairColor: 'grey',
    beard: 'full',
    headgear: 'cap',
    headgearColor: 'grey',
    collar: 'leather',
    clothColor: 'blue',
    weapon: 'axe',
    mark: 'scar',
  },
  bio: "Velkvik net-mender, fifty-one, with a runed axe he won't talk about. Says he's too old for this. Hasn't missed a fight.",
  sketch:
    "Velkvik net-mender, 51, who keeps a runed axe he won't talk about. Says he's too old for this. Hasn't missed a fight.",
};
