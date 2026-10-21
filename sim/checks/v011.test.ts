// GDD §6.2 v0.11 (D469): how the reachability row judges made-up Standard runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import { rememberingReachableCheck } from './v011';

const run = (cycle: number | null, seed = 'a', policy = 'standard', start = 'mon'): RunResult =>
  ({
    spec: { policy, seed, start, days: 14 },
    ending: {
      first: null,
      namesAndStand: cycle === null ? null : { hours: 400, cycle },
      atEnd: { names: 40, species: 9, speciesTotal: 16, missing: [], standApplied: true },
    },
  }) as unknown as RunResult;

const seeds = (cycles: (number | null)[]): RunResult[] => cycles.map((c, i) => run(c, `s${i}`));

describe('the Remembering reachability row', () => {
  it('passes when the median seed is by cycle 6 (the measured 6, 6, 6, 6, 7)', () => {
    expect(rememberingReachableCheck.judge(seeds([6, 6, 6, 6, 7])).pass).toBe(true);
  });

  it('fails when the median is later', () => {
    expect(rememberingReachableCheck.judge(seeds([6, 7, 7, 7, 7])).pass).toBe(false);
  });

  it('counts a seed that never gets there as later than any N', () => {
    expect(rememberingReachableCheck.judge(seeds([6, 6, 6, null, null])).pass).toBe(true);
    const r = rememberingReachableCheck.judge(seeds([6, 6, null, null, null]));
    expect(r.pass).toBe(false);
    expect(r.lines.join('\n')).toContain('never');
  });

  it('judges only the Monday Standard runs', () => {
    const mix = [...seeds([6, 6, 6]), run(9, 'x', 'delver'), run(9, 'y', 'standard', 'sat')];
    expect(rememberingReachableCheck.judge(mix).pass).toBe(true);
  });

  it('says it needs the runs when there are none, and is not judged in the fast set', () => {
    expect(rememberingReachableCheck.judge([]).pass).toBe(false);
    const fast = {
      ...run(6),
      spec: { policy: 'standard', seed: 'a', start: 'mon', days: 14, stopAt: [] },
    };
    expect(rememberingReachableCheck.judge([fast as unknown as RunResult]).pass).toBeNull();
  });
});
