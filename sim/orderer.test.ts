// Plan T10.17 (GDD §6.1, D417): the Orderer plays the Orders; nobody else does.
import { describe, expect, it } from 'vitest';
import { ORDER_IDS } from '../src/content/orders';
import { orderLines } from './report';
import { runOne } from './run';
import { combineShards, shardOf, specsOfShard } from './shards';
import { buildSpecs } from './specs';

describe('the Orderer run', () => {
  it('plays a 3-cycle run in 60 s or less and fills its Orders record', () => {
    const began = performance.now();
    const r = runOne({
      policy: 'orderer',
      seed: 'sim-1',
      start: 'mon',
      days: 7,
      minCycles: 3,
      maxDays: 42,
    });
    expect((performance.now() - began) / 1000).toBeLessThanOrEqual(60);
    expect(r.cyclesDone).toBeGreaterThanOrEqual(3);
    const o = r.orders;
    expect(o).toBeDefined();
    if (!o) return;
    // The Orders open one at a time and the Orderer finishes every opening scene it sees.
    expect(o.opened.length).toBeGreaterThanOrEqual(2);
    expect(o.openings.length).toBeGreaterThanOrEqual(2);
    expect(o.openings.some((x) => x.seated)).toBe(true);
    // Chapters come in each Order's own order, from the Orderer's reading, never twice.
    for (const id of ORDER_IDS) {
      const ns = o.chapters.filter((c) => c.order === id).map((c) => c.n);
      expect(ns).toEqual([...ns].sort((a, b) => a - b));
      expect(new Set(ns).size).toBe(ns.length);
      expect(ns.length).toBe(o.final.chaptersRead[id]);
    }
    expect(o.chapters.length).toBeGreaterThan(0);
    // It chose seats at each new warden, never more than the seats there were.
    expect(o.seatsByCycle.length).toBeGreaterThanOrEqual(2);
    for (const x of o.seatsByCycle) expect(x.seats.length).toBeLessThanOrEqual(3);
    // Every stand it made is recorded with the Threat it met.
    expect(o.stands.length).toBeGreaterThanOrEqual(3);
    for (const s of o.stands) expect(s.embers).toBeGreaterThan(0);
    // Delves ran (so the Quenchers' Delve source is exercised once they have come).
    expect(r.delve.runs.length).toBeGreaterThan(0);
    // The report line says what happened.
    expect(orderLines([r])[0]).toContain('chapters');
  }, 90_000);

  it('is the same run twice', () => {
    const spec = { policy: 'orderer', seed: 'sim-2', start: 'mon', days: 3 } as const;
    expect(runOne(spec)).toEqual(runOne(spec));
  }, 90_000);

  it('never gives a run to another policy to play, and has its own shard', () => {
    const all = buildSpecs({
      policies: ['standard', 'orderer'],
      days: 14,
      seeds: 5,
      starts: ['mon', 'sat'],
      fast: false,
    });
    const mine = all.filter((s) => s.policy === 'orderer');
    expect(mine).toHaveLength(5); // the Monday seeds only (D417)
    expect(mine.every((s) => s.start === 'mon' && s.untilContent === true)).toBe(true);
    expect(specsOfShard(all, 'orders')).toEqual(mine);
    expect(all.filter((s) => shardOf(s) !== 'orders').every((s) => s.policy !== 'orderer')).toBe(
      true,
    );
    expect(() => combineShards(all, [])).toThrow();
  });
});
