import { intPow } from './int-pow';

// GDD §5.1.2: k copies of a building whose next copy costs `next` cost
// next × (r^k − 1)/(r − 1). The GDD defines the most you can afford as
// floor(log(1 + funds·(r−1)/next) / log r). Math.log isn't portable (technical
// design §7.4), so we search for the largest k whose total cost fits instead.

/** Total cost of k copies when the next one costs `next` and each later one r× more. */
export const geometricCost = (next: number, r: number, k: number): number =>
  (next * (intPow(r, k) - 1)) / (r - 1);

// Far beyond anything the economy reaches; stops runaway searches on bad input.
const MAX_K = 1_000_000;

/** The largest k with geometricCost(next, r, k) ≤ funds (0 if not even one fits). */
export const maxAffordable = (next: number, r: number, funds: number): number => {
  if (!(r > 1)) throw new RangeError(`maxAffordable needs r > 1, got ${r}.`);
  if (!(next > 0)) throw new RangeError(`maxAffordable needs a positive cost, got ${next}.`);
  const fits = (k: number): boolean => geometricCost(next, r, k) <= funds;
  if (!fits(1)) return 0;
  // Exponential search for an upper bound that doesn't fit…
  let lo = 1;
  let hi = 2;
  while (fits(hi)) {
    lo = hi;
    hi *= 2;
    if (hi > MAX_K) return MAX_K;
  }
  // …then binary search: lo always fits, hi never does.
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
};
