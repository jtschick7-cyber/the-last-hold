// Technical design §8 (D18): how numbers appear on screen.
// - Display always floors, so the UI never shows "100" for 99.7 when a cost is
//   100 [JC 8]. Affordability uses exact values; this file is display only.
// - Suffixes are chosen by comparing against thresholds, never log10 (§7.4).

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'] as const;
const SCIENTIFIC_FROM = 21; // 1e21 and above: scientific notation

// Powers of ten parsed from decimal literals: each is the correctly rounded
// double, identical in every engine (unlike 10 ** k or repeated × 10).
const POW10: readonly number[] = Array.from({ length: 309 }, (_, k) => Number(`1e${k}`));
const pow10 = (k: number): number => POW10[k] ?? Number.POSITIVE_INFINITY;

/** The decimal exponent e with 10^e ≤ x < 10^(e+1), for finite x ≥ 1. */
const exponentOf = (x: number): number => {
  let e = 0;
  while (e < 308 && x >= pow10(e + 1)) e++;
  return e;
};

/** The first three significant digits of x (100–999), floored. */
const threeDigits = (x: number, e: number): number => {
  const sig = Math.floor(x / pow10(e - 2));
  // Division can land a hair below 100 or at 1000 for huge e; x's exponent is
  // already known, so clamp into range rather than show the wrong digit count.
  return Math.min(999, Math.max(100, sig));
};

/** "1.23", "12.3" or "123" from three digits and where the point goes. */
const placePoint = (digits: number, intDigits: 1 | 2 | 3): string => {
  const s = String(digits);
  return intDigits === 3 ? s : `${s.slice(0, intDigits)}.${s.slice(intDigits)}`;
};

/**
 * Truncates a non-negative number to `decimals` places as a string, without the
 * rounding toFixed does: toFixed(10) first absorbs float noise (1.13 → "1.1300000000"),
 * then the extra digits are cut, not rounded.
 */
const truncateDecimals = (x: number, decimals: number): string => {
  const [int = '0', frac = ''] = x.toFixed(10).split('.');
  return decimals === 0 ? int : `${int}.${frac.slice(0, decimals)}`;
};

const nonFinite = (x: number): string | null => {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Number.POSITIVE_INFINITY) return '∞';
  if (x === Number.NEGATIVE_INFINITY) return '-∞';
  return null;
};

const formatMagnitude = (x: number): string => {
  if (x < 1000) return String(Math.floor(x));
  const e = exponentOf(x);
  const digits = threeDigits(x, e);
  if (e >= SCIENTIFIC_FROM) return `${placePoint(digits, 1)}e${e}`;
  const tier = Math.floor(e / 3);
  const intDigits = ((e % 3) + 1) as 1 | 2 | 3;
  return `${placePoint(digits, intDigits)}${SUFFIXES[tier] ?? ''}`;
};

/** An amount: "847", "1.23K", "45.6M", "789Qa", "1.23e21". */
export const formatNumber = (x: number): string => {
  const bad = nonFinite(x);
  if (bad !== null) return bad;
  return x < 0 ? `-${formatMagnitude(-x)}` : formatMagnitude(x);
};

/** A rate: like formatNumber, but rates under 10 keep one decimal ("4.5"). */
export const formatRate = (x: number): string => {
  const bad = nonFinite(x);
  if (bad !== null) return bad;
  const abs = Math.abs(x);
  const body = abs < 10 ? truncateDecimals(abs, 1) : formatMagnitude(abs);
  return x < 0 ? `-${body}` : body;
};

/** An exact value for breakdown sheets: thousands separators, up to 2 decimals. */
export const formatExact = (x: number): string => {
  const bad = nonFinite(x);
  if (bad !== null) return bad;
  if (Math.abs(x) >= 1e21) return formatNumber(x);
  const [int = '0', frac = ''] = truncateDecimals(Math.abs(x), 2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const trimmed = frac.replace(/0+$/, '');
  const body = trimmed ? `${grouped}.${trimmed}` : grouped;
  return x < 0 && body !== '0' ? `-${body}` : body;
};
