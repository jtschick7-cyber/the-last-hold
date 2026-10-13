import { balance, type BalanceKey, type Constant } from '../content/balance';

// Reads a GDD §7 constant by its dotted key, so breakdowns can name the key
// they used (technical design §5.4).
export const constantAt = (key: BalanceKey): Constant<unknown> => {
  let node: unknown = balance;
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown>)[part];
  }
  return node as Constant<unknown>;
};

// The balance table is a build-time constant, so a looked-up value never changes;
// combat reads constants in its hot loop, where splitting the key each time is slow.
const cache = new Map<BalanceKey, number>();

/** A numeric constant's value; throws if the key holds a list or a table. */
export const num = (key: BalanceKey): number => {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const { value } = constantAt(key);
  if (typeof value !== 'number') throw new TypeError(`Balance key ${key} is not a number.`);
  cache.set(key, value);
  return value;
};
