import type { Constant } from '../../src/content/balance';

const isConstant = (x: unknown): x is Constant<unknown> =>
  typeof x === 'object' && x !== null && 'value' in x && 'locked' in x;

/** Every constant in balance.ts, keyed by its dotted §7 key. */
export const flattenBalance = (
  node: Record<string, unknown>,
  prefix = '',
): Map<string, Constant<unknown>> => {
  const out = new Map<string, Constant<unknown>>();
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isConstant(v)) out.set(key, v);
    else if (typeof v === 'object' && v !== null) {
      for (const [kk, vv] of flattenBalance(v as Record<string, unknown>, key)) out.set(kk, vv);
    }
  }
  return out;
};
