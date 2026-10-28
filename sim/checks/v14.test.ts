// GDD §5.15.10 (v1.4, D577): how the two Descent rows judge made-up Vigilant runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import { descentLearnedMattersCheck, descentVictoryCheck } from './v14';

const cell = (wins: number, downed = 6, cleared = 3, p90 = 3) => ({
  wins,
  samples: 100,
  stagesCleared: { median: cleared, p10: 0, p90 },
  downed: { median: downed, p10: 0, p90: 14 },
  unlitLeft: { median: 0, p10: 0, p90: 0, reached: 100 },
});
const run = (
  o: { maxed?: number; downed?: number; zeroed?: number; hamlet?: ReturnType<typeof cell> } = {},
  seed = 'a',
  start = 'mon',
): RunResult =>
  ({
    spec: { policy: 'vigilant', seed, start, days: 14 },
    vigil: {
      descent: {
        cells: {
          maxed: [[cell(o.maxed ?? 82, o.downed ?? 6)]],
          minimal: [[cell(0)]],
          'maxed-zeroed': [[cell(o.zeroed ?? 0)]],
          'minimal-zeroed': [[cell(0)]],
          hamlet: [[o.hamlet ?? cell(0, 2, 0, 0)]],
        },
      },
    },
  }) as unknown as RunResult;
const five = (make: (i: number) => RunResult): RunResult[] => [0, 1, 2, 3, 4].map(make);

describe('descent-victory', () => {
  it('passes inside both bands', () => {
    expect(descentVictoryCheck.judge(five(() => run())).pass).toBe(true);
    expect(descentVictoryCheck.judge(five(() => run({ maxed: 50, downed: 2 }))).pass).toBe(true);
    expect(descentVictoryCheck.judge(five(() => run({ maxed: 85, downed: 8 }))).pass).toBe(true);
  });
  it('fails when the win rate is too high or too low', () => {
    expect(descentVictoryCheck.judge(five(() => run({ maxed: 86 }))).pass).toBe(false);
    expect(descentVictoryCheck.judge(five(() => run({ maxed: 49 }))).pass).toBe(false);
  });
  it('fails when the median hunters downed is outside 2 to 8', () => {
    expect(descentVictoryCheck.judge(five(() => run({ downed: 1 }))).pass).toBe(false);
    expect(descentVictoryCheck.judge(five(() => run({ downed: 9 }))).pass).toBe(false);
  });
  it('takes the median of the seeds, so one odd seed does not fail it', () => {
    const rs = five((i) => run({ maxed: i === 0 ? 100 : 80 }));
    expect(descentVictoryCheck.judge(rs).pass).toBe(true);
  });
});

describe('descent-learned-matters', () => {
  it('passes with a gap of 25 points or more and a Hamlet party that cannot clear Stage 1', () => {
    expect(descentLearnedMattersCheck.judge(five(() => run({ maxed: 80, zeroed: 55 }))).pass).toBe(
      true,
    );
  });
  it('fails with a gap of less than 25 points', () => {
    expect(descentLearnedMattersCheck.judge(five(() => run({ maxed: 80, zeroed: 56 }))).pass).toBe(
      false,
    );
  });
  it('fails when the Hamlet party clears a stage or wins on any seed', () => {
    const rs = five((i) => run(i === 2 ? { hamlet: cell(0, 2, 1, 1) } : {}));
    expect(descentLearnedMattersCheck.judge(rs).pass).toBe(false);
    const won = five((i) => run(i === 2 ? { hamlet: cell(1, 2, 0, 0) } : {}));
    expect(descentLearnedMattersCheck.judge(won).pass).toBe(false);
  });
});

describe('both rows', () => {
  it('are not judged in the fast set, and say so when the probe is missing', () => {
    for (const c of [descentVictoryCheck, descentLearnedMattersCheck]) {
      expect(c.judge([]).pass).toBe(false);
      const fast = {
        ...run(),
        spec: { policy: 'vigilant', seed: 'a', start: 'mon', days: 14, stopAt: [] },
      };
      expect(c.judge([fast as unknown as RunResult]).pass).toBeNull();
    }
  });
  it('judge only the Monday Vigilant runs', () => {
    const sat = run({ maxed: 0 }, 'x', 'sat');
    expect(descentVictoryCheck.judge([...five(() => run()), sat]).pass).toBe(true);
  });
});
