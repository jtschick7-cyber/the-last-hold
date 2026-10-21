// Plan T8.15 (D320): the suite split into CI shards and put back together gives exactly the results
// of a single-machine run, so splitting can never change a row.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runSequential } from './parallel';
import {
  combineShards,
  readShards,
  SHARD_IDS,
  shardOf,
  specsOfShard,
  writeShard,
  type ShardFile,
} from './shards';
import { buildSpecs } from './specs';

// One policy from each shard (Opening, Standard, Heavy), one start, one seed, one day: short (the
// check must stay under 90 s), but through the Opening and the catch-up, and every shard gets a run.
const all = buildSpecs({
  policies: ['opening', 'standard', 'heavy'],
  days: 1,
  seeds: 1,
  starts: ['mon'],
  // The fast shape (stop at the first moments), so Standard does not play its 42 days of the full suite.
  fast: true,
});
// Played once and shared, so the tests below don't each pay for the same runs.
const whole = runSequential(all);

describe('the simulator shards (D320)', () => {
  it('give every run of the real suite to exactly one shard, in the list order', () => {
    const full = buildSpecs({
      policies: ['opening', 'light', 'standard', 'heavy', 'delver', 'eventer', 'orderer'],
      days: 14,
      seeds: 5,
      starts: ['mon', 'sat'],
      fast: false,
    });
    expect(full).toHaveLength(55); // 4 policies × 2 starts × 5 seeds + the Delver's, the Eventer's and the Orderer's 5 Monday runs each
    const parts = SHARD_IDS.map((s) => specsOfShard(full, s));
    expect(parts.flat()).toHaveLength(full.length);
    expect(new Set(parts.flat().map((s) => JSON.stringify(s))).size).toBe(full.length);
    for (const s of SHARD_IDS)
      expect(specsOfShard(full, s).every((r) => shardOf(r) === s)).toBe(true);
    // The Eventer is its own shard (plan T9.12): five Monday runs, so no other job grows.
    expect(specsOfShard(full, 'events')).toHaveLength(5);
    expect(specsOfShard(full, 'events').every((r) => r.policy === 'eventer')).toBe(true);
    // No other share is more than a third bigger than a fair one, so no job is far slower than the rest.
    // The Orderer is its own shard too (v0.10, D417): five Monday runs.
    expect(specsOfShard(full, 'orders')).toHaveLength(5);
    expect(specsOfShard(full, 'orders').every((r) => r.policy === 'orderer')).toBe(true);
    const others = parts.filter((_, i) => SHARD_IDS[i] !== 'events' && SHARD_IDS[i] !== 'orders');
    for (const p of others) expect(p.length).toBeLessThanOrEqual((45 / others.length) * 1.34);
  });

  it('played as shards and combined, equals one machine playing the whole list', () => {
    // The `long` shard is played again on its own, the way its CI job plays it; the other two shards
    // are cut from the whole play (all runs are independent and deterministic, D169), so the test
    // stays short. The full-suite equality is also checked by hand when the shards change.
    const shards: ShardFile[] = SHARD_IDS.map((shard) => ({
      shard,
      runs:
        shard === 'long'
          ? runSequential(specsOfShard(all, shard))
          : whole.filter((r) => shardOf(r.spec) === shard),
    }));
    expect(combineShards(all, shards)).toEqual(whole);
  }, 30_000);

  it('goes through files on disk without changing a thing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'shards-'));
    try {
      const shard = SHARD_IDS[0];
      const file: ShardFile = {
        shard,
        runs: whole.filter((r) => shardOf(r.spec) === shard),
      };
      writeShard(dir, file);
      expect(readShards(dir)).toEqual([file]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses a missing, repeated or foreign run, so a lost shard cannot pass as green', () => {
    const runs = whole;
    const byShard = (id: (typeof SHARD_IDS)[number]): ShardFile => ({
      shard: id,
      runs: runs.filter((r) => shardOf(r.spec) === id),
    });
    const good = SHARD_IDS.map(byShard);
    expect(() => combineShards(all, good)).not.toThrow();
    expect(() => combineShards(all, good.slice(1))).toThrow(/missing/);
    const first = good[0];
    if (!first) throw new Error('no shard');
    expect(() => combineShards(all, [...good, first])).toThrow(/more than one shard/);
    const foreign = {
      ...first,
      runs: [
        ...first.runs,
        { ...(runs[0] as object), spec: { ...(runs[0]?.spec as object), seed: 'x' } },
      ],
    };
    expect(() => combineShards(all, [foreign as ShardFile, ...good.slice(1)])).toThrow(
      /hold \d+ runs/,
    );
  });
});
