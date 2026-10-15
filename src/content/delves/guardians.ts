import type { DamageType } from '../damage';
import type { IngredientId } from '../ingredients';

// GDD §8.3 and lore-secrets §12.2, §29 (D252): the three Deep guardians, fought alone at the
// end of a Delve run at `delve.guardianHealth` × Health on top of tier scaling. They are
// Delve-only: never on contracts or in the Last Stand in v0.7, excluded from the
// true-ending bestiary count (lore §8, JC 18). Content outside the saved-state id lists until
// T7.5 (D171). Numbers live with the monster, as every ability's do (D44).

export const GUARDIAN_IDS = ['unlits-breath', 'the-forgotten', 'dross-tide'] as const;
export type GuardianId = (typeof GUARDIAN_IDS)[number];

export type GuardianAbility =
  /** Chill: a hunter it hits receives `healingLoss` less healing for their next `actions` actions (status%, refreshes). */
  | {
      readonly kind: 'chill';
      readonly name: 'Chill';
      readonly healingLoss: number;
      readonly actions: number;
    }
  /** Drain: on each of its actions every standing hunter loses this share of max Health as Frost, ignoring Armor. */
  | { readonly kind: 'drain'; readonly name: 'Drain'; readonly maxHealthFraction: number }
  /** Nameless (passive): +Might and +Health (stat%) for each contract species not yet Studied. */
  | {
      readonly kind: 'nameless';
      readonly name: 'Nameless';
      readonly mightPerSpecies: number;
      readonly healthPerSpecies: number;
    }
  /** Settling: every `every`th action its attack hits every standing hunter (Armor applies). */
  | { readonly kind: 'settling'; readonly name: 'Settling'; readonly every: number };

export interface GuardianDef {
  readonly id: GuardianId;
  readonly name: string;
  readonly family: 'deep';
  /** Stats at the guardian's base tier (2), before `delve.guardianHealth`. */
  readonly health: number;
  readonly might: number;
  readonly armor: number;
  readonly speed: number;
  readonly attacks: number;
  /** First tier it appears at (its base tier t₀); tiers above scale it like any monster (§7.4). */
  readonly baseTier: number;
  readonly resist: Readonly<Record<DamageType, number>>;
  readonly abilities: readonly GuardianAbility[];
  /** `delve.guardianReagents` units of this drop on defeat. */
  readonly drop: IngredientId;
  /** The bestiary's "What it was" line (lore §29, approved). */
  readonly whatItWas: string;
  /** The hunter's-notebook blurb. Proposed draft (lore §29): the owner approves or edits it. */
  readonly blurb: string;
}

const resist = (
  steel: number,
  silver: number,
  fire: number,
  frost: number,
  rune: number,
  venom: number,
): Readonly<Record<DamageType, number>> => ({ steel, silver, fire, frost, rune, venom });

export const guardians: Readonly<Record<GuardianId, GuardianDef>> = {
  'unlits-breath': {
    id: 'unlits-breath',
    name: "Unlit's Breath",
    family: 'deep',
    health: 260,
    might: 14,
    armor: 2,
    speed: 12,
    attacks: 1,
    baseTier: 2,
    resist: resist(1.0, 1.0, 1.5, 0, 1.25, 0),
    abilities: [
      { kind: 'chill', name: 'Chill', healingLoss: 0.5, actions: 3 },
      { kind: 'drain', name: 'Drain', maxHealthFraction: 0.02 },
    ],
    drop: 'rime-salt',
    whatItWas: 'What it was: the warmth of someone nobody sat up with, gone cold.',
    blurb:
      "Not a beast. A draught where there's no window, and it follows you. Hunters it touches stop mending; keep them moving and keep the Mender close.",
  },
  'the-forgotten': {
    id: 'the-forgotten',
    name: 'The Forgotten',
    family: 'deep',
    health: 240,
    might: 18,
    armor: 5,
    speed: 10,
    attacks: 1,
    baseTier: 2,
    resist: resist(1.0, 1.25, 1.0, 1.0, 1.5, 0),
    abilities: [
      { kind: 'nameless', name: 'Nameless', mightPerSpecies: 0.03, healthPerSpecies: 0.03 },
    ],
    drop: 'noon-poppy',
    whatItWas: 'What it was: everyone whose name was said for the last time, and then not again.',
    blurb:
      "A crowd of shapes with nobody's face. The less you know of what's out there, the heavier it hits. Ilse says it's the only monster a library can fight.",
  },
  'dross-tide': {
    id: 'dross-tide',
    name: 'The Dross-Tide',
    family: 'deep',
    health: 320,
    might: 16,
    armor: 10,
    speed: 6,
    attacks: 1,
    baseTier: 2,
    resist: resist(0.75, 1.0, 0.5, 1.25, 1.5, 0),
    abilities: [{ kind: 'settling', name: 'Settling', every: 3 }],
    drop: 'river-pearl',
    whatItWas: "What it was: what's left in the forge when the fire is done with a thing.",
    blurb:
      'Slag that walks, slow as cooling iron. Every third swing it reaches everyone at once. Rune bites it; fire only feeds the shine.',
  },
};
