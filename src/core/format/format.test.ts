// Plan T1.3: the full boundary table for technical design §8.
import { describe, expect, it } from 'vitest';
import { formatDuration, formatExact, formatNumber, formatRate } from './index';

describe('formatNumber', () => {
  it.each([
    // Under 1,000: integer, floored
    [0, '0'],
    [0.99, '0'],
    [1, '1'],
    [847, '847'],
    [847.9, '847'],
    [999, '999'],
    [999.99, '999'],
    // 1e3 – 1e21: three significant digits, floored, with a suffix
    [1000, '1.00K'],
    [1001, '1.00K'],
    [1009.9, '1.00K'],
    [1010, '1.01K'],
    [1130, '1.13K'], // 1.13 × 100 is 112.999… in floating point
    [1234, '1.23K'],
    [1999, '1.99K'],
    [9999, '9.99K'],
    [10_000, '10.0K'],
    [45_678, '45.6K'],
    [99_999, '99.9K'],
    [100_000, '100K'],
    [999_499, '999K'],
    [999_500, '999K'],
    [999_999, '999K'],
    [1e6, '1.00M'],
    [45.6e6, '45.6M'],
    [1e9, '1.00B'],
    [1e12, '1.00T'],
    [1e15, '1.00Qa'],
    [789e15, '789Qa'],
    [1e18, '1.00Qi'],
    [999.999e18, '999Qi'],
    // ≥ 1e21: scientific, three significant digits
    [1e21, '1.00e21'],
    [1.23e21, '1.23e21'],
    [9.999e25, '9.99e25'],
    [1e100, '1.00e100'],
    [1.5e300, '1.50e300'],
    [Number.MAX_VALUE, '1.79e308'],
    // Negatives and non-finite values
    [-847.5, '-847'],
    [-1234, '-1.23K'],
    [Number.POSITIVE_INFINITY, '∞'],
    [Number.NaN, 'NaN'],
  ])('formatNumber(%d) → %s', (x, expected) => {
    expect(formatNumber(x)).toBe(expected);
  });

  it('never shows more than the true value at any power of ten', () => {
    for (let k = 3; k < 21; k++) {
      const justBelow = Number(`1e${k}`) * (1 - 1e-12);
      const shown = formatNumber(justBelow);
      expect(shown.startsWith('999') || shown.startsWith('99.9') || shown.startsWith('9.99')).toBe(
        true,
      );
    }
  });
});

describe('formatRate', () => {
  it.each([
    [0, '0.0'],
    [0.25, '0.2'], // silver: floored like every display (technical design §8)
    [0.3, '0.3'],
    [2, '2.0'],
    [4.5, '4.5'],
    [5.7, '5.7'],
    [9.99, '9.9'],
    [10, '10'],
    [10.9, '10'],
    [999.9, '999'],
    [1500, '1.50K'],
    [-4.5, '-4.5'],
  ])('formatRate(%d) → %s', (x, expected) => {
    expect(formatRate(x)).toBe(expected);
  });
});

describe('formatExact', () => {
  it.each([
    [0, '0'],
    [7, '7'],
    [1234, '1,234'],
    [1_234_567, '1,234,567'],
    [12_000.5, '12,000.5'],
    [99.997, '99.99'],
    [1.13, '1.13'],
    [0.25, '0.25'],
    [-1234.5, '-1,234.5'],
    [-0.001, '0'],
    [1e21, '1.00e21'],
  ])('formatExact(%d) → %s', (x, expected) => {
    expect(formatExact(x)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0s'],
    [-5, '0s'],
    [0.9, '0s'],
    [1, '1s'],
    [45, '45s'],
    [59.9, '59s'],
    [60, '1m'],
    [119, '1m'],
    [720, '12m'],
    [3599, '59m'],
    [3600, '1h'],
    [3660, '1h 1m'],
    [11_400, '3h 10m'],
    [86_399, '23h 59m'],
    [86_400, '1d'],
    [187_200, '2d 4h'],
    [12 * 3600, '12h'],
    [Number.POSITIVE_INFINITY, '∞'],
  ])('formatDuration(%d) → %s', (s, expected) => {
    expect(formatDuration(s)).toBe(expected);
  });
});
