// Plan T1.4 / technical design §5.1: balance.ts holds exactly the GDD §7 keys
// (D44), and its locked keys are exactly the plan §0.6 list.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { gddSection7Keys, planLockedKeys } from './doc-keys';
import { flattenBalance } from './flatten-balance';

const constants = flattenBalance(balance);
const keys = [...constants.keys()].sort();

describe('balance.ts', () => {
  it('has exactly the GDD §7 keys, in both directions', () => {
    const gdd = [...new Set(gddSection7Keys())].sort();
    expect(gdd.length).toBeGreaterThan(80); // the extractor found the tables
    expect(keys).toEqual(gdd);
  });

  it('locks exactly the plan §0.6 keys', () => {
    const patterns = planLockedKeys();
    const matchOne = (p: string, key: string): boolean =>
      p.endsWith('.*') ? key.startsWith(p.slice(0, -1)) : key === p;
    const actualLocked = keys.filter((k) => constants.get(k)?.locked);
    expect(actualLocked).toEqual(keys.filter((k) => patterns.some((p) => matchOne(p, k))));
    // Every entry in the plan's table names at least one real key.
    for (const p of patterns)
      expect(
        keys.some((k) => matchOne(p, k)),
        p,
      ).toBe(true);
  });

  it('stores durations in seconds', () => {
    expect(balance.offline.baseCap.value).toBe(12 * 3600);
    expect(balance.peasant.settleMinInterval.value).toBe(30);
  });
});
