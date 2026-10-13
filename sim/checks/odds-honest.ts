import { honestyProbe } from '../honesty';
import type { ContractRecord } from '../run';
import { ENGAGEMENT } from '../targets';
import type { Check } from './types';

// GDD §6.3 #4: across the simulated contracts, each 10-point odds bucket's real
// win rate lands within ±5 points of the odds the launch panel showed (the mean
// shown odds in that bucket). A bucket with fewer than MIN_PER_BUCKET contracts
// is reported but not judged: too few to say.
const { text, contracts, tolerancePoints, enforcedFrom } = ENGAGEMENT.oddsHonest;
const MIN_PER_BUCKET = 40;
const BUCKETS = 10;
const FULL_RUN_DAYS = 14;
/** Matchups the probe builds (each played many times): enough that every odds bucket has a crowd. */
const PROBE_MATCHUPS = 400;

/** The check, with its probe passed in so tests can use a made-up one. */
export const makeOddsHonestCheck = (probeOf: () => ContractRecord[]): Check => ({
  id: 'odds-honest',
  enforcedFrom,
  judge: (runs) => {
    // The simulated player's own contracts, plus a probe built to cover the whole odds
    // range (the player rarely takes a coin-flip), judged together (sim/honesty.ts).
    const played: ContractRecord[] = runs.flatMap((r) => [...r.contracts]);
    // Only the full suite pays for the probe; the fast set runs three days.
    const probe = runs.some((r) => r.spec.days >= FULL_RUN_DAYS) ? probeOf() : [];
    const all: ContractRecord[] = [...played, ...probe];
    const lines = [
      `${all.length} fights: ${played.length} contracts played by the simulated player + ${probe.length} from the odds probe (the check asks for ${contracts} contracts)`,
    ];
    let pass: boolean | null = all.length >= contracts ? true : null;
    if (all.length < contracts) lines.push('too few contracts to judge: run more seeds or days');
    for (let b = 0; b < BUCKETS; b++) {
      const inBucket = all.filter(
        (c) => Math.min(BUCKETS - 1, Math.floor(c.winChance * BUCKETS)) === b,
      );
      if (inBucket.length === 0) continue;
      const shown = inBucket.reduce((s, c) => s + c.winChance, 0) / inBucket.length;
      const real = inBucket.filter((c) => c.success).length / inBucket.length;
      const off = Math.abs(real - shown) * 100;
      const judged = inBucket.length >= MIN_PER_BUCKET && pass !== null;
      const ok = off <= tolerancePoints;
      if (judged) pass = (pass ?? true) && ok;
      lines.push(
        `${b * 10}–${b * 10 + 10}%: shown ${(shown * 100).toFixed(1)}%, real ${(real * 100).toFixed(1)}% ` +
          `(${inBucket.length} contracts) ${judged ? (ok ? '✓' : '✗') : '(too few)'}`,
      );
    }
    return { id: 'odds-honest', text, pass, lines };
  },
});

export const oddsHonestCheck: Check = makeOddsHonestCheck(() => honestyProbe(PROBE_MATCHUPS));
