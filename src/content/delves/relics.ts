import type { AgeId } from '../ages';
import type { FamilyId } from '../damage';
import type { GuardianId } from './guardians';

// GDD §8.10a (D261): six Delve relics, kept forever. Their effects work ONLY inside Delves, so
// they never touch contracts, the Last Stand or the hold; there are no relic slots. Each is
// found by whichever of its two sources comes first: a Delve one and an idle one (D20).
// Content outside the saved-state id lists until T7.5 (D171).

export const DELVE_RELIC_IDS = [
  'spindle-whorl',
  'cold-iron-nail',
  'rift-lantern',
  'bell-clapper',
  'salt-ring',
  'horn-spoon',
] as const;
export type DelveRelicId = (typeof DELVE_RELIC_IDS)[number];

export type DelveRelicEffect =
  | { readonly kind: 'mightPct'; readonly amount: number }
  | { readonly kind: 'takenPct'; readonly amount: number }
  /** Percentage points added to the recovery between floors. */
  | { readonly kind: 'recoveryPoints'; readonly amount: number }
  /** The first offer of each run shows this many blessings instead of `delve.offers`. */
  | { readonly kind: 'firstOfferSize'; readonly value: number }
  | { readonly kind: 'guardianHealthPct'; readonly amount: number }
  /** Guardians drop this many more units. */
  | { readonly kind: 'guardianDropBonus'; readonly amount: number };

export type DelveSource =
  /** The first guardian beaten in a run that started at this Rank. */
  | { readonly kind: 'firstGuardianAtRank'; readonly age: AgeId }
  | { readonly kind: 'guardianDefeated'; readonly guardian: GuardianId };

export type IdleSource =
  | { readonly kind: 'familyStudied'; readonly family: FamilyId }
  | { readonly kind: 'recipeBookComplete' };

export interface DelveRelicDef {
  readonly id: DelveRelicId;
  readonly name: string;
  readonly effect: DelveRelicEffect;
  /** The effect as GDD §8.10a gives it. */
  readonly text: string;
  readonly delveSource: DelveSource;
  readonly idleSource: IdleSource;
  /** One-line description. Proposed draft (lore §29): the owner approves or edits it. */
  readonly line: string;
}

export const delveRelics: Readonly<Record<DelveRelicId, DelveRelicDef>> = {
  'spindle-whorl': {
    id: 'spindle-whorl',
    name: 'Spindle Whorl',
    effect: { kind: 'mightPct', amount: 0.05 },
    text: '+5% Might',
    delveSource: { kind: 'firstGuardianAtRank', age: 'keep' },
    idleSource: { kind: 'familyStudied', family: 'field-and-forest-spirits' },
    line: "A clay weight off a spinner's spindle, still warm in the palm.",
  },
  'cold-iron-nail': {
    id: 'cold-iron-nail',
    name: 'Cold Iron Nail',
    effect: { kind: 'takenPct', amount: 0.05 },
    text: '−5% damage taken',
    delveSource: { kind: 'firstGuardianAtRank', age: 'citadel' },
    idleSource: { kind: 'familyStudied', family: 'restless-dead' },
    line: 'A horseshoe nail, hammered straight. The cold slides off it.',
  },
  'rift-lantern': {
    id: 'rift-lantern',
    name: 'Rift Lantern',
    effect: { kind: 'recoveryPoints', amount: 0.1 },
    text: '+10 points of recovery between floors',
    delveSource: { kind: 'firstGuardianAtRank', age: 'bastion' },
    idleSource: { kind: 'familyStudied', family: 'water-spirits' },
    line: 'A horn lantern that lights only below the hearthstone.',
  },
  'bell-clapper': {
    id: 'bell-clapper',
    name: 'Bell Clapper',
    effect: { kind: 'firstOfferSize', value: 4 },
    text: 'The first offer of each run shows 4 blessings instead of 3',
    delveSource: { kind: 'guardianDefeated', guardian: 'unlits-breath' },
    idleSource: { kind: 'familyStudied', family: 'beasts-and-wilds' },
    line: 'The tongue of a bell, without the bell. It still wants to ring.',
  },
  'salt-ring': {
    id: 'salt-ring',
    name: 'Salt Ring',
    effect: { kind: 'guardianHealthPct', amount: -0.1 },
    text: 'Guardians have 10% less Health',
    delveSource: { kind: 'guardianDefeated', guardian: 'the-forgotten' },
    idleSource: { kind: 'familyStudied', family: 'cursed' },
    line: 'A ring of rime salt that never melts, wrapped in thread.',
  },
  'horn-spoon': {
    id: 'horn-spoon',
    name: 'Horn Spoon',
    effect: { kind: 'guardianDropBonus', amount: 1 },
    text: 'Guardians drop 1 more unit',
    delveSource: { kind: 'guardianDefeated', guardian: 'dross-tide' },
    idleSource: { kind: 'recipeBookComplete' },
    line: "A goatherd's spoon. Whatever it's dipped in, it brings back a little more.",
  },
};
