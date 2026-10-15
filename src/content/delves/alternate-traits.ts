import type { DamageType, FamilyId, LocationId } from '../damage';
import type { HunterId } from '../hunters';

// GDD §8.5a (D260): each of the 11 hunters has an alternate second trait, bought once with
// Riftglass (`riftglass.shop.trait`); the hunter then switches freely between the two while
// not on a contract or in a run. The first trait never changes. Sidegrades, not upgrades; the
// simulated players never switch. Content outside the saved-state id lists until T7.5 (D171).

export type AlternateEffect =
  /** Damage taken from monster abilities (not direct attacks) is halved, after resistances, rounded half up (min 1). */
  | { readonly kind: 'abilityDamageHalved' }
  | { readonly kind: 'critPoints'; readonly amount: number }
  /** Recovery times for the other hunters of any contract he joins. */
  | { readonly kind: 'othersRecoveryTime'; readonly amount: number }
  | { readonly kind: 'mightOnLocation'; readonly location: LocationId; readonly amount: number }
  | { readonly kind: 'healthPct'; readonly amount: number }
  /** Party hit chance, in points, on contracts at this location. */
  | { readonly kind: 'partyHitOnLocation'; readonly location: LocationId; readonly points: number }
  /** Provisions for contracts this hunter joins. */
  | { readonly kind: 'provisionsPct'; readonly amount: number }
  | { readonly kind: 'dealtPctOfType'; readonly type: DamageType; readonly amount: number }
  | { readonly kind: 'armorFlat'; readonly amount: number }
  | { readonly kind: 'mightVsFamily'; readonly family: FamilyId; readonly amount: number };

export interface AlternateTraitDef {
  readonly id: string;
  readonly name: string;
  readonly hunter: HunterId | 'arvid';
  /** The second trait it can stand in for (a TRAIT_IDS entry). */
  readonly replaces: string;
  /** The exact effect, as GDD §8.5a gives it. */
  readonly text: string;
  readonly effect: AlternateEffect;
}

export const alternateTraits: readonly AlternateTraitDef[] = [
  {
    id: 'smoke-lunged',
    name: 'Smoke-Lunged',
    hunter: 'halvar',
    replaces: 'steady',
    text: 'Damage he takes from monster abilities (not direct attacks) is halved, after resistances, rounded half up (min 1)',
    effect: { kind: 'abilityDamageHalved' },
  },
  {
    id: 'long-hook',
    name: 'Long Hook',
    hunter: 'zora',
    replaces: 'quick',
    text: '+10 points crit chance',
    effect: { kind: 'critPoints', amount: 10 },
  },
  {
    id: 'splint-and-sling',
    name: 'Splint and Sling',
    hunter: 'ostap',
    replaces: 'hard-to-kill',
    text: 'Recovery times −15% for the other hunters of any contract he joins',
    effect: { kind: 'othersRecoveryTime', amount: -0.15 },
  },
  {
    id: 'fjord-born',
    name: 'Fjord-born',
    hunter: 'bjarna',
    replaces: 'fell-born',
    text: '+15% Might on river contracts',
    effect: { kind: 'mightOnLocation', location: 'river', amount: 0.15 },
  },
  {
    id: 'field-born',
    name: 'Field-born',
    hunter: 'vesna',
    replaces: 'fen-born',
    text: '+15% Might on field contracts',
    effect: { kind: 'mightOnLocation', location: 'field', amount: 0.15 },
  },
  {
    id: 'broad-back',
    name: 'Broad Back',
    hunter: 'radek',
    replaces: 'hard-to-kill',
    text: '+10% max Health (stat%)',
    effect: { kind: 'healthPct', amount: 0.1 },
  },
  {
    id: 'forge-eyed',
    name: 'Forge-Eyed',
    hunter: 'sigrun',
    replaces: 'lantern-bearer',
    text: 'Party hit chance +5 points on ruin contracts',
    effect: { kind: 'partyHitOnLocation', location: 'ruin', points: 5 },
  },
  {
    id: 'thrifty',
    name: 'Thrifty',
    hunter: 'toma',
    replaces: 'quick',
    text: 'Provisions for contracts he joins −15%',
    effect: { kind: 'provisionsPct', amount: -0.15 },
  },
  {
    id: 'dipped-knife',
    name: 'Dipped Knife',
    hunter: 'stanko',
    replaces: 'quick',
    text: '+15% Venom damage dealt (outgoing%)',
    effect: { kind: 'dealtPctOfType', type: 'venom', amount: 0.15 },
  },
  {
    id: 'rock-footed',
    name: 'Rock-Footed',
    hunter: 'herdis',
    replaces: 'hard-to-kill',
    text: '+2 Armor (flat)',
    effect: { kind: 'armorFlat', amount: 2 },
  },
  {
    id: 'fjord-axe',
    name: 'Fjord Axe',
    hunter: 'arvid',
    replaces: 'old-wright',
    text: '+20% Might vs Water Spirits',
    effect: { kind: 'mightVsFamily', family: 'water-spirits', amount: 0.2 },
  },
];
