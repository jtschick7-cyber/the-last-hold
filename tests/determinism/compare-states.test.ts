import { describe, expect, it } from 'vitest';
import { compareStates } from './compare-states';

describe('compareStates (technical design §6.2 rule)', () => {
  it('accepts float noise in resources and sub-ms timestamp noise', () => {
    expect(
      compareStates(
        { resources: { food: 1000 }, time: 5 },
        { resources: { food: 1000 + 1e-7 }, time: 5.9 },
      ),
    ).toEqual([]);
  });

  it('rejects real differences', () => {
    expect(
      compareStates({ resources: { food: 1000 } }, { resources: { food: 1000.01 } }),
    ).toHaveLength(1);
    expect(compareStates({ time: 0 }, { time: 2 })).toHaveLength(1);
    expect(compareStates({ peasants: { total: 7 } }, { peasants: { total: 8 } })).toHaveLength(1);
    expect(compareStates({ a: [1, 2] }, { a: [1] })).toHaveLength(1);
    expect(compareStates({ on: true }, { on: false })).toHaveLength(1);
    expect(compareStates({ a: 1 }, { a: 1, b: 2 })).toHaveLength(1);
  });
});
