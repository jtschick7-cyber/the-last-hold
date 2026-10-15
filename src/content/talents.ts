import type { RoleId } from './hunters';

// GDD §5.11.5, §8.11 (v0.8, D313, D314): per role, 3 branches × 3 tiers, 1 point each (27 in all;
// a fully grown hunter picks 5 of their role's 9). Small plain bonuses in existing buckets. Tier 2
// opens at 2 stars and tier 3 at 4 (`talent.tierStars`); respec is free whenever the hunter isn't
// on a contract or in a Delve. Core's selectors and fight engine read `effect` (plan T8.9); the
// sheets show `text`, which is the GDD's wording word for word. Numbers are tunable, here in
// content. Content outside the saved-state id lists until T8.5 (D171).

export type TalentTier = 1 | 2 | 3;

export type TalentEffect =
  /** Flat Armor. */
  | { readonly kind: 'armorFlat'; readonly amount: number }
  /** Might, stat%. */
  | { readonly kind: 'mightPct'; readonly amount: number }
  /** Max Health, stat%. */
  | { readonly kind: 'maxHealthPct'; readonly amount: number }
  /** Crit chance, as a share (0.03 = 3 points). */
  | { readonly kind: 'critPoints'; readonly amount: number }
  | { readonly kind: 'speedFlat'; readonly amount: number }
  /** The holder takes this much less damage (taken%, inside the cap). */
  | { readonly kind: 'takenPct'; readonly amount: number }
  /** Damage dealt, outgoing%. */
  | { readonly kind: 'damageDealtPct'; readonly amount: number }
  /** While the holder stands, the other hunters take this much less damage (taken%); tiers add. */
  | { readonly kind: 'alliesTakenWhileStanding'; readonly amount: number }
  /** Monsters target the holder with this weight (instead of `target.vanguardWeight`). */
  | { readonly kind: 'targetWeight'; readonly weight: number }
  /** Damage against a Studied or Mastered species (knowledge bucket). */
  | { readonly kind: 'damageVsKnown'; readonly amount: number }
  /** Crits deal this multiple; a higher one from a trait or blessing wins. */
  | { readonly kind: 'critMult'; readonly mult: number }
  /** Hit chance, as a share (0.04 = 4 points). */
  | { readonly kind: 'hitChancePoints'; readonly amount: number }
  /** Potions the holder carries are this much stronger; tiers add. No potions in Delves (D254). */
  | { readonly kind: 'potionPower'; readonly amount: number }
  /** Healing done; tiers add. */
  | { readonly kind: 'healingDone'; readonly amount: number }
  /** The Mending Draught fires below this share of Health (instead of the potion's own 30%, consumables.ts). */
  | { readonly kind: 'mendingBelow'; readonly value: number }
  /** The holder heals anyone below this share of Health (instead of `mender.healBelow`). */
  | { readonly kind: 'healsBelow'; readonly value: number }
  /** The holder's attacks deal this share of their Might (instead of `mender.attackMult`). */
  | { readonly kind: 'attackShare'; readonly value: number };

export interface TalentBranch {
  readonly id: string;
  readonly name: string;
}

export const TALENT_BRANCHES: Readonly<Record<RoleId, readonly TalentBranch[]>> = {
  vanguard: [
    { id: 'wall', name: 'Wall' },
    { id: 'retort', name: 'Retort' },
    { id: 'warden', name: 'Warden' },
  ],
  striker: [
    { id: 'edge', name: 'Edge' },
    { id: 'hunt', name: 'Hunt' },
    { id: 'pace', name: 'Pace' },
  ],
  mender: [
    { id: 'herbs', name: 'Herbs' },
    { id: 'hands', name: 'Hands' },
    { id: 'watch', name: 'Watch' },
  ],
};

export interface TalentDef {
  /** `${role}-${branch}-${tier}`, e.g. 'vanguard-wall-1'. */
  readonly id: string;
  readonly role: RoleId;
  readonly branch: string;
  readonly tier: TalentTier;
  readonly effect: TalentEffect;
  /** The effect as GDD §8.11 words it. */
  readonly text: string;
}

const t = (
  role: RoleId,
  branch: string,
  tier: TalentTier,
  effect: TalentEffect,
  text: string,
): TalentDef => ({ id: `${role}-${branch}-${tier}`, role, branch, tier, effect, text });

export const talents: readonly TalentDef[] = [
  // ---- Vanguard ----
  t('vanguard', 'wall', 1, { kind: 'armorFlat', amount: 1 }, '+1 Armor'),
  t('vanguard', 'wall', 2, { kind: 'maxHealthPct', amount: 0.08 }, '+8% max Health'),
  t('vanguard', 'wall', 3, { kind: 'takenPct', amount: -0.08 }, '−8% damage taken'),
  t('vanguard', 'retort', 1, { kind: 'mightPct', amount: 0.05 }, '+5% Might'),
  t('vanguard', 'retort', 2, { kind: 'critPoints', amount: 0.03 }, '+3 points crit chance'),
  t('vanguard', 'retort', 3, { kind: 'damageDealtPct', amount: 0.1 }, '+10% damage dealt'),
  t(
    'vanguard',
    'warden',
    1,
    { kind: 'alliesTakenWhileStanding', amount: -0.03 },
    'While he stands, the other hunters take −3% damage',
  ),
  t(
    'vanguard',
    'warden',
    2,
    { kind: 'targetWeight', weight: 4 },
    'Monsters target him with weight 4 instead of 3',
  ),
  t(
    'vanguard',
    'warden',
    3,
    { kind: 'alliesTakenWhileStanding', amount: -0.05 },
    'While he stands, the other hunters take −5% more damage (−8% in all with tier 1)',
  ),
  // ---- Striker ----
  t('striker', 'edge', 1, { kind: 'critPoints', amount: 0.03 }, '+3 points crit chance'),
  t(
    'striker',
    'edge',
    2,
    { kind: 'critMult', mult: 1.6 },
    'Crits deal ×1.6 instead of ×1.5 (a higher multiplier from a trait or blessing wins)',
  ),
  t('striker', 'edge', 3, { kind: 'critPoints', amount: 0.05 }, '+5 points crit chance'),
  t(
    'striker',
    'hunt',
    1,
    { kind: 'damageVsKnown', amount: 0.03 },
    '+3% damage vs a Studied or Mastered species (knowledge bucket)',
  ),
  t('striker', 'hunt', 2, { kind: 'mightPct', amount: 0.05 }, '+5% Might'),
  t('striker', 'hunt', 3, { kind: 'damageDealtPct', amount: 0.1 }, '+10% damage dealt'),
  t('striker', 'pace', 1, { kind: 'speedFlat', amount: 1 }, '+1 Speed'),
  t('striker', 'pace', 2, { kind: 'speedFlat', amount: 1 }, '+1 Speed'),
  t('striker', 'pace', 3, { kind: 'hitChancePoints', amount: 0.04 }, '+4 points hit chance'),
  // ---- Mender ----
  t(
    'mender',
    'herbs',
    1,
    { kind: 'potionPower', amount: 0.1 },
    'Potions she carries are 10% stronger',
  ),
  t(
    'mender',
    'herbs',
    2,
    { kind: 'potionPower', amount: 0.1 },
    'Potions she carries are 10% stronger more (+20% in all)',
  ),
  t(
    'mender',
    'herbs',
    3,
    { kind: 'mendingBelow', value: 0.4 },
    'Her Mending Draught fires below 40% Health instead of 30%',
  ),
  t('mender', 'hands', 1, { kind: 'healingDone', amount: 0.08 }, '+8% healing done'),
  t('mender', 'hands', 2, { kind: 'healingDone', amount: 0.08 }, '+8% healing done more (+16%)'),
  t(
    'mender',
    'hands',
    3,
    { kind: 'healsBelow', value: 0.8 },
    'She heals anyone below 80% Health (instead of 70%)',
  ),
  t('mender', 'watch', 1, { kind: 'armorFlat', amount: 1 }, '+1 Armor'),
  t('mender', 'watch', 2, { kind: 'maxHealthPct', amount: 0.08 }, '+8% max Health'),
  t(
    'mender',
    'watch',
    3,
    { kind: 'attackShare', value: 0.75 },
    'Her attacks deal 75% of her Might instead of 50%',
  ),
];

/** The nine talents of a role. */
export const talentsOf = (role: RoleId): readonly TalentDef[] =>
  talents.filter((x) => x.role === role);

export const talentById = (id: string): TalentDef | undefined => talents.find((x) => x.id === id);
