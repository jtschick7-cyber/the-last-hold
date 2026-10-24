import type { AgeId } from '../../content/ages';
import { constantAt, num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { intPow } from '../math';
import { embersMultiplier } from '../systems/vigil';

// GDD §5.9.4 (D109):
//   wavesPart = Σ (n = 1 … waves held) perWave × waveGrowth^(n − 1)
//   Embers    = floor(rankMult × wavesPart × (1 + threatBonus × Threat) + perTrophy × trophies)
// At the v0.4 arrival only the trophies part is capped (GDD §5.9.8).

export interface EmbersInput {
  readonly rank: AgeId;
  readonly waves: number;
  readonly threat: number;
  /** Trophies earned this cycle (A7). */
  readonly trophies: number;
  /** The arrival's cap on the trophies part; null or absent = no cap. */
  readonly trophyCap?: number | null;
  /** Rising Vigil level the stand was fought at (GDD §5.9.10); absent means 0. */
  readonly vigilLevel?: number;
}

export interface EmbersPayout {
  readonly value: number;
  /** The waves part after the Rank and Threat (before the floor). */
  readonly waves: number;
  /** The trophies part after any cap. */
  readonly trophies: number;
  readonly breakdown: Breakdown;
}

export const embersPayout = (i: EmbersInput): EmbersPayout => {
  const perWave = num('embers.perWave');
  const growth = num('embers.waveGrowth');
  let wavesPart = 0;
  for (let n = 1; n <= i.waves; n++) wavesPart += perWave * intPow(growth, n - 1);
  const rankMult =
    (constantAt('embers.rankMult').value as Readonly<Record<string, number>>)[i.rank] ?? 0;
  const multiplier = embersMultiplier(i.threat, i.vigilLevel ?? 0);
  const waves = rankMult * wavesPart * multiplier.value;
  const raw = num('embers.perTrophy') * i.trophies;
  const cap = i.trophyCap ?? null;
  const trophies = cap !== null && raw > cap ? cap : raw;
  const value = Math.floor(waves + trophies);
  const children: Breakdown[] = [
    {
      label: `Waves held: ${i.waves}`,
      value: wavesPart,
      formula: `Σ ${perWave} × ${growth}^(n − 1)`,
      key: 'embers.perWave',
    },
    { label: `Rank (${i.rank})`, value: rankMult, key: 'embers.rankMult' },
    // The Threat line, then (with a level) the Rising Vigil line; they add up to the multiplier.
    ...(multiplier.breakdown.children ?? []),
    {
      label: `Trophies this cycle: ${i.trophies}`,
      value: trophies,
      formula:
        // At the cap (also when a saved, already-capped part is shown again).
        cap !== null && raw >= cap
          ? `${num('embers.perTrophy')} × trophies, capped at ${cap} for the first Long Night`
          : `${num('embers.perTrophy')} × trophies`,
      key: 'embers.perTrophy',
    },
  ];
  return {
    value,
    waves,
    trophies,
    breakdown: {
      label: 'Embers',
      value,
      formula: 'floor(waves part × Rank × Threat + trophies part)',
      children,
    },
  };
};
