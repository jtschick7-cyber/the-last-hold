import type { Seed128 } from './cyrb128';

// Technical design §7.1: sfc32, a small 32-bit PRNG whose 128-bit state
// serializes as four unsigned integers. Only exactly specified integer
// operations are used, so outputs match across engines.
export interface Sfc32 {
  /** The next value in [0, 1). */
  next(): number;
  /** The current state, for saving and resuming a stream. */
  state(): Seed128;
}

const TWO_POW_32 = 4294967296;

export const sfc32 = (seed: Seed128): Sfc32 => {
  let [a, b, c, d] = seed;
  const nextUint = (): number => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };
  return {
    next: () => nextUint() / TWO_POW_32,
    state: () => [a >>> 0, b >>> 0, c >>> 0, d >>> 0],
  };
};
