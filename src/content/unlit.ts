import { balance } from './balance';
import type { DamageType } from './damage';

// GDD §8.3 (v1.4, D560): The Unlit, Stage 3 of the Descent. A Deep creature fought nowhere else, so it
// is flagged `descentOnly` and kept OUT of MONSTER_IDS, GUARDIAN_IDS and the bestiary: no Delve guardian
// draw, contract list, stand pool or Forgotten count can reach it (the Delve guardians sit outside the
// saved-state id lists the same way, D171). Stats are at its base tier (5); the fight scales Health and
// Might by tier as §7.4 (TD.4a). Health reads `descent.unlitBaseHealth` (calibrated in TD.9, D577).

export type UnlitAbility =
  /** On each of its actions every standing hunter loses this share of max Health as Frost (ignores Armor; `taken%` applies) and has their turn meter knocked back; Halvar's Smoke-Lunged halves both. */
  | {
      readonly kind: 'firstCold';
      readonly name: 'First Cold';
      readonly maxHealthFraction: number;
      readonly meterKnockBack: number;
      readonly smokeLungedFactor: number;
    }
  /** Every `every`th action its attack hits every standing hunter (Armor applies) and inflicts Chill. */
  | {
      readonly kind: 'heavyDark';
      readonly name: 'Heavy Dark';
      readonly every: number;
      readonly chill: { readonly healingLoss: number; readonly actions: number };
    };

export interface UnlitDef {
  readonly id: 'unlit';
  readonly name: 'The Unlit';
  readonly family: 'deep';
  /** Never drawn by anything that picks species. */
  readonly descentOnly: true;
  readonly baseTier: 5;
  readonly health: number;
  readonly might: number;
  readonly armor: number;
  readonly speed: number;
  readonly attacks: number;
  readonly resist: Readonly<Record<DamageType, number>>;
  readonly abilities: readonly UnlitAbility[];
  /** A Saltburst cancels the first trigger of either ability and blocks both for this many actions. */
  readonly saltburstBlockActions: number;
  /** The Bestiary's Great Beasts shelf, once Stage 3 is reached (GDD §5.12.8). */
  readonly whatItWas: string;
  readonly blurb: string;
}

export const unlit: UnlitDef = {
  id: 'unlit',
  name: 'The Unlit',
  family: 'deep',
  descentOnly: true,
  baseTier: 5,
  health: balance.descent.unlitBaseHealth.value,
  might: 42,
  armor: 12,
  speed: 10,
  attacks: 1,
  resist: { steel: 0.75, silver: 1.25, fire: 1.5, frost: 0, rune: 1.5, venom: 0 },
  abilities: [
    {
      kind: 'firstCold',
      name: 'First Cold',
      maxHealthFraction: 0.03,
      meterKnockBack: 15,
      smokeLungedFactor: 0.5,
    },
    {
      kind: 'heavyDark',
      name: 'Heavy Dark',
      every: 3,
      chill: { healingLoss: 0.5, actions: 2 },
    },
  ],
  saltburstBlockActions: 3,
  whatItWas:
    'What was under the hill before the first fire was lit. It has no name of its own; the order named it for what it lacked.',
  blurb:
    "Drains everyone's warmth and pace on every turn, and every third blow sweeps the whole line. Bring fire, rune-work, and every hunter you have.",
};
