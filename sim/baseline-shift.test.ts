import { describe, expect, it } from 'vitest';
import { baselineShift, type Baseline } from './report';
import { MOMENTS } from './run';

// D589 (5): the report says how many moments equal the accepted baseline and lists each that moved.
const row = (v: number | null): Record<(typeof MOMENTS)[number], number | null> =>
  Object.fromEntries(MOMENTS.map((m) => [m, v])) as never;
const base = (v: number | null): Baseline => ({
  milestone: 'x',
  rulesVersion: 5,
  groups: { 'a/mon': row(v) },
  checks: {},
});

describe('baselineShift', () => {
  it('counts every moment as the same when nothing moved', () => {
    expect(baselineShift(base(5), base(5).groups)).toEqual({
      same: MOMENTS.length,
      total: MOMENTS.length,
      moved: [],
    });
  });

  it('lists a moment that moved, and one that was never reached', () => {
    const now = base(5).groups;
    (now['a/mon'] as Record<string, number | null>)[MOMENTS[0] as string] = 7;
    (now['a/mon'] as Record<string, number | null>)[MOMENTS[1] as string] = null;
    const r = baselineShift(base(5), now);
    expect(r.same).toBe(MOMENTS.length - 2);
    expect(r.moved).toHaveLength(2);
    expect(r.moved[0]).toContain(`a/mon ${MOMENTS[0]}`);
  });

  it('ignores a group the baseline does not have', () => {
    expect(baselineShift(base(5), { 'b/mon': row(1) }).total).toBe(0);
  });
});
