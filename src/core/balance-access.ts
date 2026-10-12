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

/** A numeric constant's value; throws if the key holds a list or a table. */
export const num = (key: BalanceKey): number => {
  const { value } = constantAt(key);
  if (typeof value !== 'number') throw new TypeError(`Balance key ${key} is not a number.`);
  return value;
};
