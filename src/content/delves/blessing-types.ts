import type { DamageType } from '../damage';
import type { PatronId } from './patrons';

// GDD §5.10.5 and §8.8 (D255, D257): a blessing lasts for one Delve run. The simple ones
// are bucket effects that go through the existing combat buckets (§5.0, taken% capped at
// 75%); the ★ ones are new rules that work only inside Delves, named by `rule`. Numbers
// live here with the content (§7.9), tunable like every ability (D44). T7.8 wires them.

export const RARITIES = ['faint', 'warm', 'bright'] as const;
export type RarityId = (typeof RARITIES)[number];
export const rarityNames: Readonly<Record<RarityId, string>> = {
  faint: 'Faint',
  warm: 'Warm',
  bright: 'Bright',
};

/** The Unlit's four drawback switches (D257), plus the two recovery ones its text needs. */
export type DrawbackSwitch =
  | 'knowledge-off'
  | 'mender-never-heals'
  | 'health-per-action'
  | 'no-riftglass'
  | 'no-recovery'
  | 'nothing-restores';

export type BlessingEffect =
  /** +share of Might (stat%) for the whole party. */
  | { readonly kind: 'mightPct'; readonly amount: number }
  | { readonly kind: 'mightPerWeaponTier'; readonly amount: number }
  | { readonly kind: 'mightPctPerRole'; readonly amount: number }
  | { readonly kind: 'mightPctBelowHealth'; readonly amount: number; readonly below: number }
  | { readonly kind: 'armorFlat'; readonly amount: number }
  | { readonly kind: 'armorPerArmorTier'; readonly amount: number }
  | { readonly kind: 'healthPct'; readonly amount: number }
  | { readonly kind: 'speedFlat'; readonly amount: number }
  | { readonly kind: 'speedPerRole'; readonly amount: number }
  /** Outgoing damage (outgoing%), optionally only for hunters with a weapon of this tier or more. */
  | { readonly kind: 'dealtPct'; readonly amount: number; readonly minWeaponTier?: number }
  | { readonly kind: 'dealtPctPerDamageType'; readonly amount: number }
  /** Damage taken (taken%), optionally only of these damage types. */
  | { readonly kind: 'takenPct'; readonly amount: number; readonly types?: readonly DamageType[] }
  | { readonly kind: 'takenPctPerRole'; readonly amount: number }
  | { readonly kind: 'takenPctOthersWhileVanguard'; readonly amount: number }
  /** The Mender's heals. */
  | { readonly kind: 'healPct'; readonly amount: number }
  | { readonly kind: 'menderThreshold'; readonly value: number }
  | { readonly kind: 'critPoints'; readonly amount: number }
  | { readonly kind: 'hitPoints'; readonly amount: number }
  /** Crits deal this multiple (the higher of this and any other applies). */
  | { readonly kind: 'critMult'; readonly value: number }
  /** Recovery between floors becomes this share of max Health (replaces `delve.recovery`). */
  | { readonly kind: 'recoverySet'; readonly value: number }
  /** Standing hunters end a floor at this share of max Health at least. */
  | { readonly kind: 'recoveryFloor'; readonly value: number }
  | { readonly kind: 'monsterSpeedPct'; readonly amount: number }
  | { readonly kind: 'monsterMightPct'; readonly amount: number }
  | { readonly kind: 'monsterHitPoints'; readonly amount: number }
  /** Every monster starts each floor with its turn meter at this value. */
  | { readonly kind: 'monsterStartMeter'; readonly value: number }
  /** Every nth action taken by the party knocks every standing monster's meter back. */
  | { readonly kind: 'knockbackEveryNth'; readonly every: number; readonly amount: number }
  /** A Delve-only switch (the Unlit's drawbacks, D257). */
  | { readonly kind: 'switch'; readonly switch: DrawbackSwitch; readonly amount?: number };

export type BlessingRuleId =
  | 'smiths-mark'
  | 'forge-welded'
  | 'one-thread'
  | 'mended-cloth'
  | 'pack-grows'
  | 'wolfs-share'
  | 'price-paid'
  | 'long-vigil'
  | 'toll'
  | 'struck-bronze';

export interface BlessingRule {
  readonly rule: BlessingRuleId;
  readonly params: Readonly<Record<string, number>>;
}

export interface BlessingDef {
  readonly id: string;
  readonly patron: PatronId;
  readonly rarity: RarityId;
  readonly name: string;
  /** The exact effect, as the GDD §8.8 gives it (no ★, no bold). */
  readonly text: string;
  /** The Unlit's cards split into the gain and the red "but…" line (D257). */
  readonly gain?: string;
  readonly drawback?: string;
  /** A new rule (★ in §8.8). */
  readonly star: boolean;
  readonly effects: readonly BlessingEffect[];
  readonly drawbacks?: readonly BlessingEffect[];
  readonly rule?: BlessingRule;
}
