import type { HunterId } from '../hunters';
import type { TraitEffect } from '../traits';

// GDD §8.5a (D260): each of the 11 hunters has an alternate second trait, bought once with
// Riftglass (`riftglass.shop.trait`); the hunter then switches freely between the two while
// not on a contract or in a run. The first trait never changes. Sidegrades, not upgrades; the
// simulated players never switch. Content outside the saved-state id lists until T7.5 (D171).

export const ALT_TRAIT_IDS = [
  'smoke-lunged',
  'long-hook',
  'splint-and-sling',
  'fjord-born',
  'field-born',
  'broad-back',
  'forge-eyed',
  'thrifty',
  'dipped-knife',
  'rock-footed',
  'fjord-axe',
] as const;
export type AltTraitId = (typeof ALT_TRAIT_IDS)[number];

export interface AlternateTraitDef {
  readonly id: AltTraitId;
  readonly name: string;
  readonly hunter: HunterId | 'arvid';
  /** The second trait it can stand in for (a TRAIT_IDS entry). */
  readonly replaces: string;
  /** The exact effect, as GDD §8.5a gives it. */
  readonly text: string;
  readonly effect: TraitEffect;
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
    effect: { kind: 'othersRecoveryMult', mult: 0.85 },
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
    effect: { kind: 'maxHealthPct', amount: 0.1 },
  },
  {
    id: 'forge-eyed',
    name: 'Forge-Eyed',
    hunter: 'sigrun',
    replaces: 'lantern-bearer',
    text: 'Party hit chance +5 points on ruin contracts',
    effect: { kind: 'partyHitOnLocation', location: 'ruin', amount: 0.05 },
  },
  {
    id: 'thrifty',
    name: 'Thrifty',
    hunter: 'toma',
    replaces: 'quick',
    text: 'Provisions for contracts he joins −15%',
    effect: { kind: 'provisionsMult', mult: 0.85 },
  },
  {
    id: 'dipped-knife',
    name: 'Dipped Knife',
    hunter: 'stanko',
    replaces: 'quick',
    text: '+15% Venom damage dealt (outgoing%)',
    effect: { kind: 'damageType', type: 'venom', dealt: 0.15, taken: 0 },
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
