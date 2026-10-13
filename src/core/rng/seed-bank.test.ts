import { describe, expect, it } from 'vitest';
import { seedBank, seeded } from './index';

describe('seedBank', () => {
  it('hands out streams identical to seeded(), as many times as asked', () => {
    const seeds = ['a:suggest:c1:0', 'a:suggest:c1:1', 'a:suggest:c1:2'];
    const bank = seedBank(seeds);
    seeds.forEach((s, i) => {
      for (let again = 0; again < 2; again++) {
        const fresh = bank(i);
        const reference = seeded(s);
        for (let k = 0; k < 20; k++) expect(fresh.next()).toBe(reference.next());
      }
    });
  });

  it('refuses a seed it does not have', () => {
    expect(() => seedBank(['x'])(1)).toThrow(RangeError);
  });
});
