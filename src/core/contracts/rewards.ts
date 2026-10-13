import type { AgeId } from '../../content/ages';
import { traits, type TraitId } from '../../content/traits';
import { constantAt, num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import { intPow } from '../math';
import type { GameState } from '../state/game-state';
import { productionRate } from '../systems/production';

// GDD §5.4: what a contract pays and costs. Each number comes with its breakdown,
// built by the same function (GDD §5.0).

/** Bounty silver: `60 × 1.6^(tier−1) × ageMult`, plus Haggler (GDD §5.4.1). The Rank production bucket does not apply. */
export const bounty = (
  tier: number,
  rank: AgeId,
  party: readonly (readonly TraitId[])[],
): Explained => {
  const base = num('bounty.base');
  const growth = num('bounty.growth');
  const rankMult =
    (constantAt('bounty.ageMult').value as Readonly<Record<string, number>>)[rank] ?? 1;
  let hagglers = 0;
  let hagglePct = 0;
  for (const t of party) {
    for (const id of t) {
      const e = traits[id].effect;
      if (e.kind === 'bountyPct') {
        hagglers += 1;
        hagglePct += e.amount;
      }
    }
  }
  const tiered = base * intPow(growth, tier - 1);
  const value = tiered * rankMult * (1 + hagglePct);
  return {
    value,
    breakdown: {
      label: 'Bounty (silver)',
      value,
      formula: `${base} × ${growth}^${tier - 1} × ${rankMult} × (1 + ${hagglePct})`,
      children: [
        { label: 'Base', value: base, key: 'bounty.base' },
        { label: 'Growth per tier', value: growth, key: 'bounty.growth' },
        { label: 'Tier', value: tier },
        { label: `Rank multiplier (${rank})`, value: rankMult, key: 'bounty.ageMult' },
        { label: `Haggler ×${hagglers}`, value: hagglePct },
      ],
    },
  };
};

/**
 * Provisions paid at launch (GDD §5.4.2, G3, Q9/D81): per hunter, the larger of the flat
 * base and `incomeMinutes` of the hold's food income, times party size and the tier growth.
 * The income term is what keeps food a real cost after the settling years.
 */
export const provisions = (state: GameState, partySize: number, tier: number): Explained => {
  const base = num('provisions.base');
  const growth = num('provisions.growth');
  const minutes =
    (constantAt('provisions.incomeMinutes').value as Readonly<Record<string, number>>)[
      state.cycle.age
    ] ?? 0;
  const income = minutes > 0 ? productionRate(state, 'food').value : 0;
  const perHunter = Math.max(base, minutes * income);
  const value = perHunter * partySize * intPow(growth, tier - 1);
  return {
    value,
    breakdown: {
      label: 'Provisions (food)',
      value,
      formula: `max(${base}, ${minutes} min × ${income} food/min) × ${partySize} × ${growth}^${tier - 1}`,
      children: [
        { label: 'Flat base per hunter', value: base, key: 'provisions.base' },
        {
          label: 'Minutes of food income per hunter',
          value: minutes,
          key: 'provisions.incomeMinutes',
        },
        { label: 'Food income per minute', value: income },
        { label: 'Party size', value: partySize },
        { label: 'Growth per tier', value: growth, key: 'provisions.growth' },
        { label: 'Tier', value: tier },
      ],
    },
  };
};

/** Trophies equal the tier (GDD §5.4.1); +1 if well prepared (v0.3). */
export const trophies = (tier: number, wellPrepared = false): number =>
  tier + (wellPrepared ? 1 : 0);

/** XP to each hunter: `20 × tier` on a success, half that on a failure (GDD §5.3.2). */
export const xpPerHunter = (tier: number, success: boolean): number => {
  const full = num('xp.perTier') * tier;
  return success ? full : full / 2;
};
