// Plan T2.10: the contract board (GDD §5.4.1, §3.3, §8.3.1).
import { describe, expect, it } from 'vitest';
import { LOCATION_IDS } from '../../src/content/damage';
import { monsters } from '../../src/content/monsters';
import { villages } from '../../src/content/villages';
import {
  candidatesFor,
  generateContract,
  highestUnlockedTier,
} from '../../src/core/contracts/board';
import { advance } from '../../src/core/sim';
import { createNewGame } from '../../src/core/state/new-game';
import { HOUR, T0, hamletWithMine, keepRich, run } from './helpers';

describe('opening and refilling', () => {
  it('is closed until the first Mine is built, then opens with a contract at once', () => {
    const s = createNewGame('b', T0);
    advance(s, T0 + 10 * HOUR);
    expect(s.board.opened).toBe(false);
    expect(s.board.open).toHaveLength(0);

    const t = createNewGame('b', T0);
    t.resources.wood = 1000;
    t.resources.food = 1000;
    expect(run(t, { type: 'build.buy', building: 'mine', count: 1 }).ok).toBe(true);
    expect(t.board.opened).toBe(true);
    advance(t, T0);
    expect(t.board.open).toHaveLength(1);
    expect(t.board.open[0]?.arrivedAt).toBe(T0);
  });

  it('then brings one contract every 2 hours, up to a cap of 6, and waits when full', () => {
    const s = hamletWithMine();
    advance(s, T0 + 1 * HOUR);
    expect(s.board.open).toHaveLength(1);
    advance(s, T0 + 2 * HOUR);
    expect(s.board.open).toHaveLength(2);
    advance(s, T0 + 9 * HOUR);
    expect(s.board.open).toHaveLength(5);
    advance(s, T0 + 100 * HOUR);
    expect(s.board.open).toHaveLength(6);
    expect(s.board.nextArrivalAt).toBeNull();
    expect(s.board.open.map((c) => c.arrivedAt)).toEqual(
      [0, 2, 4, 6, 8, 10].map((h) => T0 + h * HOUR),
    );
  });

  it('contracts never expire, and ids never repeat', () => {
    const s = hamletWithMine();
    advance(s, T0 + 300 * HOUR);
    expect(s.board.open).toHaveLength(6);
    expect(new Set(s.board.open.map((c) => c.id)).size).toBe(6);
    advance(s, T0 + 3000 * HOUR);
    expect(s.board.open.map((c) => c.id)).toEqual(['c0', 'c1', 'c2', 'c3', 'c4', 'c5']);
  });

  it('declining is free; the slot refills 2 hours after it opens, not instantly', () => {
    const s = hamletWithMine();
    advance(s, T0 + 100 * HOUR);
    expect(s.board.open).toHaveLength(6);
    const before = { ...s.resources };
    expect(run(s, { type: 'contract.decline', contract: 'c2' }).ok).toBe(true);
    expect(s.resources).toEqual(before);
    expect(s.board.open).toHaveLength(5);
    expect(s.board.nextArrivalAt).toBe(s.time + 2 * HOUR);
    advance(s, s.time + 1 * HOUR);
    expect(s.board.open).toHaveLength(5);
    advance(s, s.time + 1 * HOUR);
    expect(s.board.open).toHaveLength(6);
    expect(s.board.open.some((c) => c.id === 'c6')).toBe(true);
  });

  it('refuses to decline a contract that is not there', () => {
    const s = hamletWithMine();
    expect(run(s, { type: 'contract.decline', contract: 'nope' }).ok).toBe(false);
  });

  it('a Mine bought before the migration opens the board on the first advance', () => {
    const s = hamletWithMine();
    s.board.opened = true;
    s.board.nextArrivalAt = s.time;
    advance(s, s.time);
    expect(s.board.open).toHaveLength(1);
  });
});

describe('generation (GDD §5.4.1)', () => {
  it('Hamlet contracts are tier 1 only', () => {
    const s = hamletWithMine('h');
    advance(s, T0 + 100 * HOUR);
    expect(s.board.open.every((c) => c.tier === 1)).toBe(true);
    s.board.tierWins = [99, 99, 99, 99, 99];
    expect(highestUnlockedTier(s)).toBe(1); // capped by the Rank
  });

  it('tier t+1 unlocks after 3 successes at tier t, up to the Keep cap of 5', () => {
    const s = keepRich();
    const tiers = (wins: number[]) => {
      s.board.tierWins = wins;
      return highestUnlockedTier(s);
    };
    expect(tiers([0, 0, 0, 0, 0])).toBe(1);
    expect(tiers([2, 9, 9, 9, 9])).toBe(1);
    expect(tiers([3, 0, 0, 0, 0])).toBe(2);
    expect(tiers([3, 3, 2, 0, 0])).toBe(3);
    expect(tiers([3, 3, 3, 3, 3])).toBe(5);
  });

  it('is fixed by the seed: the same arrival makes the same contract', () => {
    const a = generateContract(keepRich('x'), 7, T0);
    const b = generateContract(keepRich('x'), 7, T0);
    expect(a).toEqual(b);
    expect(generateContract(keepRich('y'), 7, T0)).not.toEqual(a);
  });

  it('every generated contract has a village that offers its place, and a species that can be there', () => {
    const s = keepRich('cover');
    for (let i = 0; i < 1500; i++) {
      const c = generateContract(s, i, T0);
      expect(villages[c.village].locations).toContain(c.location);
      expect(LOCATION_IDS).toContain(c.location);
      const m = monsters[c.monster];
      expect(m.locations).toContain(c.location);
      expect(c.tier).toBeGreaterThanOrEqual(m.tiers[0]);
      expect(c.tier).toBeLessThanOrEqual(m.tiers[1]);
      expect(candidatesFor(c.location, c.tier)).toContain(c.monster);
    }
  });

  it('barrow contracts start at tier 2', () => {
    const s = keepRich('barrow');
    let barrows = 0;
    for (let i = 0; i < 1500; i++) {
      const c = generateContract(s, i, T0);
      if (c.location === 'barrow') {
        barrows += 1;
        expect(c.tier).toBeGreaterThanOrEqual(2);
      }
    }
    expect(barrows).toBeGreaterThan(50);
  });

  it('mixes tiers 60% at the highest unlocked tier and 40% spread over the lower ones', () => {
    const s = keepRich('mix');
    s.board.tierWins = [3, 3, 0, 0, 0]; // tiers 1–3 unlocked
    const n = 4000;
    const counts = new Map<number, number>();
    for (let i = 0; i < n; i++) {
      const t = generateContract(s, i, T0).tier;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const share = (t: number): number => (counts.get(t) ?? 0) / n;
    expect(share(3)).toBeGreaterThan(0.56);
    expect(share(3)).toBeLessThan(0.64);
    expect(share(1)).toBeGreaterThan(0.16);
    expect(share(1)).toBeLessThan(0.24);
    expect(share(2)).toBeGreaterThan(0.16);
    expect(share(2)).toBeLessThan(0.24);
    expect(share(4) + share(5)).toBe(0);
  });
});
