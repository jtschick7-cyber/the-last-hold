// GDD §6.2 (v1.5, D598): how the three Breach rows judge made-up Tactician runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import { breachAutoHoldsCheck, breachBadCostsCheck, breachTacticianCheck } from './v015';

const pt = (variant: string, median: number) => ({ variant, median, p10: 0, p90: 0, band: 'held' });
const run = (
  o: { auto?: number; v5?: number; tact?: number; maxAuto?: number; maxBad?: number } = {},
  start = 'mon',
): RunResult =>
  ({
    spec: { policy: 'tactician', seed: 'a', start, days: 14 },
    breach: {
      stands: [],
      probe: {
        samples: 100,
        points: [
          pt('auto', o.auto ?? 15),
          pt('tactician', o.tact ?? 15),
          pt('bad', 14),
          pt('v5', o.v5 ?? 15),
        ],
        max: { auto: pt('auto', o.maxAuto ?? 17), bad: pt('bad', o.maxBad ?? 16) },
      },
    },
  }) as unknown as RunResult;
const five = (make: (i: number) => RunResult): RunResult[] => [0, 1, 2, 3, 4].map(make);

describe('breach-auto-holds (row A)', () => {
  it('passes at 12 or more and within 1 of the version 5 rules', () => {
    expect(breachAutoHoldsCheck.judge(five(() => run())).pass).toBe(true);
    expect(breachAutoHoldsCheck.judge(five(() => run({ auto: 12, v5: 13 }))).pass).toBe(true);
  });
  it('fails below 12, or more than 1 under the version 5 rules', () => {
    expect(breachAutoHoldsCheck.judge(five(() => run({ auto: 11, v5: 11 }))).pass).toBe(false);
    expect(breachAutoHoldsCheck.judge(five(() => run({ auto: 14, v5: 16 }))).pass).toBe(false);
  });
  it('needs the Tactician runs', () => {
    expect(breachAutoHoldsCheck.judge([]).pass).toBe(false);
  });
});

describe('breach-tactician-not-worse (row B)', () => {
  it('passes when level or ahead, fails when behind', () => {
    expect(breachTacticianCheck.judge(five(() => run())).pass).toBe(true);
    expect(breachTacticianCheck.judge(five(() => run({ tact: 16 }))).pass).toBe(true);
    expect(breachTacticianCheck.judge(five(() => run({ tact: 14 }))).pass).toBe(false);
  });
  it('takes the median of the seeds', () => {
    expect(breachTacticianCheck.judge(five((i) => run({ tact: i === 0 ? 10 : 15 }))).pass).toBe(
      true,
    );
  });
});

describe('breach-bad-costs (row C)', () => {
  it('passes when the bad layout holds at least 1 wave fewer at the max point', () => {
    expect(breachBadCostsCheck.judge(five(() => run())).pass).toBe(true);
    expect(breachBadCostsCheck.judge(five(() => run({ maxAuto: 17, maxBad: 15 }))).pass).toBe(true);
  });
  it('fails when the layout does not matter', () => {
    expect(breachBadCostsCheck.judge(five(() => run({ maxAuto: 17, maxBad: 17 }))).pass).toBe(
      false,
    );
  });
});
