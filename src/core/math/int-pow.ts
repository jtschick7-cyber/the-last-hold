// Technical design §7.4: Math.pow and ** are only approximately specified, so
// engines may differ in the last bit. Every GDD exponent is a whole number, so
// repeated squaring (multiplication only, exactly specified) replaces them.
export const intPow = (base: number, n: number): number => {
  if (!Number.isInteger(n)) throw new RangeError(`intPow needs a whole-number exponent, got ${n}.`);
  if (n < 0) return 1 / intPow(base, -n);
  let result = 1;
  let b = base;
  let e = n;
  while (e > 0) {
    if (e % 2 === 1) result *= b;
    e = Math.floor(e / 2);
    if (e > 0) b *= b;
  }
  return result;
};
