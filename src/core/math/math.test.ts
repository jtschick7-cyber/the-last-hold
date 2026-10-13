// Plan T1.2 (technical design §7.4): the portable helpers must agree with the
// non-portable reference formulas, which are computed here in the test only.
import { describe, expect, it } from 'vitest';
import { geometricCost, intPow, maxAffordable } from './index';

const relErr = (a: number, b: number): number => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);

describe('intPow', () => {
  const bases = [1.15, 1.75, 1.6, 2.2, 1.35, 1.5, 2, 10, 0.5, 1];
  const exponents = [0, 1, 2, 3, 7, 10, 25, 50, 100, 200];

  it.each(bases.flatMap((b) => exponents.map((n) => [b, n] as const)))(
    'intPow(%d, %d) matches Math.pow within 1e-12 relative',
    (b, n) => {
      expect(relErr(intPow(b, n), Math.pow(b, n))).toBeLessThan(1e-12);
    },
  );

  it('is exact for small integer powers', () => {
    expect(intPow(2, 10)).toBe(1024);
    expect(intPow(10, 15)).toBe(1e15);
    expect(intPow(7, 0)).toBe(1);
    expect(intPow(0, 0)).toBe(1);
  });

  it('handles negative exponents', () => {
    expect(intPow(2, -3)).toBe(0.125);
  });

  it('refuses fractional exponents', () => {
    expect(() => intPow(2, 0.5)).toThrow(RangeError);
  });
});

describe('geometricCost', () => {
  it('matches GDD §5.1.2: buying k costs base × r^n × (r^k − 1)/(r − 1)', () => {
    // The first Farm bought is your 2nd: 40 × 1.15 = 46 wood (GDD §5.1.2).
    expect(geometricCost(40 * 1.15, 1.15, 1)).toBeCloseTo(46, 10);
    // Two copies: 46 + 52.9.
    expect(geometricCost(46, 1.15, 2)).toBeCloseTo(46 + 46 * 1.15, 10);
    expect(geometricCost(46, 1.15, 0)).toBe(0);
  });
});

describe('maxAffordable', () => {
  // The GDD's definition, computed with Math.log (allowed in tests only).
  const gddFormula = (next: number, r: number, funds: number): number =>
    Math.floor(Math.log(1 + (funds * (r - 1)) / next) / Math.log(r));

  const cases: [next: number, r: number, funds: number][] = [];
  for (const r of [1.15, 1.75]) {
    for (const next of [10, 25, 46, 80, 150, 1234.5, 1e6]) {
      for (const funds of [0, 5, 9.99, 10, 46, 100, 999, 12_345, 1e6, 3.7e8, 1e15, 4.2e30]) {
        cases.push([next, r, funds]);
      }
    }
  }

  it.each(cases)('next=%d r=%d funds=%d matches the GDD log formula', (next, r, funds) => {
    const k = maxAffordable(next, r, funds);
    // The log formula can land a hair either side of an exact boundary; the
    // search's own invariant is authoritative there, so check both.
    expect(geometricCost(next, r, k)).toBeLessThanOrEqual(funds);
    expect(geometricCost(next, r, k + 1)).toBeGreaterThan(funds);
    expect(Math.abs(k - gddFormula(next, r, funds))).toBeLessThanOrEqual(
      onBoundary(next, r, funds, k) ? 1 : 0,
    );
  });

  it('returns 0 when even one is too expensive', () => {
    expect(maxAffordable(46, 1.15, 45.99)).toBe(0);
  });

  it('counts an exact fit', () => {
    expect(maxAffordable(10, 2, 30)).toBe(2); // 10 + 20
    expect(maxAffordable(10, 2, 29.99)).toBe(1);
  });

  it('refuses r ≤ 1 and non-positive costs', () => {
    expect(() => maxAffordable(10, 1, 100)).toThrow(RangeError);
    expect(() => maxAffordable(0, 1.15, 100)).toThrow(RangeError);
  });
});

/** True when funds sit within 1e-9 relative of a cost boundary next to k. */
const onBoundary = (next: number, r: number, funds: number, k: number): boolean =>
  [k, k + 1].some((j) => relErr(geometricCost(next, r, j), funds) < 1e-9);
