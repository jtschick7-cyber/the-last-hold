import { type DamageType, type FamilyId, type LocationId } from './damage';

// GDD §8.5 traits: each with an exact numeric effect, as data. Core combat and
// the hunter selectors read `effect`; the UI shows `summary` beside the number's
// breakdown (GDD §5.0). Per-item numbers live here (D44).

export const TRAIT_IDS = [
  'shieldwall',
  'steady',
  'fen-born',
  'fell-born',
  'quick',
  'bonesetter',
  'hard-to-kill',
  'cold-blooded',
  'grave-warden',
  'fire-touched',
  'lantern-bearer',
  'haggler',
  'herbwise',
  'wolf-friend',
  'tracker',
] as const;
export type TraitId = (typeof TRAIT_IDS)[number];

export type TraitEffect =
  /** Allies (not the holder) take this much less damage while the holder stands. */
  | { readonly kind: 'alliesTakenWhileStanding'; readonly amount: number }
  | { readonly kind: 'varianceRange'; readonly lo: number; readonly hi: number }
  | { readonly kind: 'mightOnLocation'; readonly location: LocationId; readonly amount: number }
  | { readonly kind: 'speedFlat'; readonly amount: number }
  | { readonly kind: 'healingDone'; readonly amount: number }
  | { readonly kind: 'recoveryMult'; readonly mult: number }
  | { readonly kind: 'critMult'; readonly mult: number }
  | { readonly kind: 'mightVsFamily'; readonly family: FamilyId; readonly amount: number }
  | {
      readonly kind: 'damageType';
      readonly type: DamageType;
      readonly dealt: number;
      readonly taken: number;
    }
  | { readonly kind: 'partyHitOnLocation'; readonly location: LocationId; readonly amount: number }
  | { readonly kind: 'bountyPct'; readonly amount: number }
  | { readonly kind: 'potionPower'; readonly amount: number }
  /** Idle at the hold: one Lodge slot reveals clues faster (v0.3). */
  | { readonly kind: 'clueSpeed'; readonly amount: number };

export interface TraitDef {
  readonly id: TraitId;
  readonly name: string;
  readonly summary: string;
  readonly effect: TraitEffect;
  /** Milestone it starts to matter in; v0.3 and reserved traits are inert in v0.2. */
  readonly activeFrom: 'v0.2' | 'v0.3';
}

export const traits: Readonly<Record<TraitId, TraitDef>> = {
  shieldwall: {
    id: 'shieldwall',
    name: 'Shieldwall',
    summary: 'While this Vanguard is standing, allies take −10% damage.',
    effect: { kind: 'alliesTakenWhileStanding', amount: -0.1 },
    activeFrom: 'v0.2',
  },
  steady: {
    id: 'steady',
    name: 'Steady',
    summary: 'Damage variance narrowed to 0.95–1.05.',
    effect: { kind: 'varianceRange', lo: 0.95, hi: 1.05 },
    activeFrom: 'v0.2',
  },
  'fen-born': {
    id: 'fen-born',
    name: 'Fen-born',
    summary: '+15% Might on river contracts.',
    effect: { kind: 'mightOnLocation', location: 'river', amount: 0.15 },
    activeFrom: 'v0.2',
  },
  'fell-born': {
    id: 'fell-born',
    name: 'Fell-born',
    summary: '+15% Might on barrow contracts.',
    effect: { kind: 'mightOnLocation', location: 'barrow', amount: 0.15 },
    activeFrom: 'v0.2',
  },
  quick: {
    id: 'quick',
    name: 'Quick',
    summary: '+3 Speed.',
    effect: { kind: 'speedFlat', amount: 3 },
    activeFrom: 'v0.2',
  },
  bonesetter: {
    id: 'bonesetter',
    name: 'Bonesetter',
    summary: '+25% healing done.',
    effect: { kind: 'healingDone', amount: 0.25 },
    activeFrom: 'v0.2',
  },
  'hard-to-kill': {
    id: 'hard-to-kill',
    name: 'Hard to kill',
    summary: 'Recovery times −30%.',
    effect: { kind: 'recoveryMult', mult: 0.7 },
    activeFrom: 'v0.2',
  },
  'cold-blooded': {
    id: 'cold-blooded',
    name: 'Cold-blooded',
    summary: 'Crits deal ×1.75 instead of ×1.5.',
    effect: { kind: 'critMult', mult: 1.75 },
    activeFrom: 'v0.2',
  },
  'grave-warden': {
    id: 'grave-warden',
    name: 'Grave-warden',
    summary: '+20% Might vs Restless Dead.',
    effect: { kind: 'mightVsFamily', family: 'restless-dead', amount: 0.2 },
    activeFrom: 'v0.2',
  },
  'fire-touched': {
    id: 'fire-touched',
    name: 'Fire-touched',
    summary: '+20% Fire damage dealt; −20% Fire damage taken.',
    effect: { kind: 'damageType', type: 'fire', dealt: 0.2, taken: -0.2 },
    activeFrom: 'v0.2',
  },
  'lantern-bearer': {
    id: 'lantern-bearer',
    name: 'Lantern-bearer',
    summary: 'Party hit chance +5% on barrow contracts.',
    effect: { kind: 'partyHitOnLocation', location: 'barrow', amount: 0.05 },
    activeFrom: 'v0.2',
  },
  haggler: {
    id: 'haggler',
    name: 'Haggler',
    summary: '+10% bounty silver on contracts this hunter joins.',
    effect: { kind: 'bountyPct', amount: 0.1 },
    activeFrom: 'v0.2',
  },
  herbwise: {
    id: 'herbwise',
    name: 'Herbwise',
    summary: 'Potions carried by this hunter are 25% stronger.',
    effect: { kind: 'potionPower', amount: 0.25 },
    activeFrom: 'v0.3',
  },
  // Reserved for the two v0.3 hunters (GDD §8.5).
  'wolf-friend': {
    id: 'wolf-friend',
    name: 'Wolf-friend',
    summary: '+20% Might vs Beasts & Wilds.',
    effect: { kind: 'mightVsFamily', family: 'beasts-and-wilds', amount: 0.2 },
    activeFrom: 'v0.3',
  },
  tracker: {
    id: 'tracker',
    name: 'Tracker',
    summary: 'While idle at the hold, one Lodge slot reveals clues 25% faster.',
    effect: { kind: 'clueSpeed', amount: 0.25 },
    activeFrom: 'v0.3',
  },
};
