// Plan T8.15 (D320): the suite split into CI shards and put back together gives exactly the results
// of a single-machine run, so splitting can never change a row.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POLICY_IDS } from '../src/core/policies';
import { CHECKS } from './checks';
import { runSequential, runSpecs } from './parallel';
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

// Every policy, one start, one seed, one day: short, but through the Opening and the catch-up, and
// every shard gets at least one run.
const all = buildSpecs({
  policies: POLICY_IDS,
  days: 1,
  seeds: 1,
  starts: ['mon'],
  fast: false,
});
// Played once and shared, so the tests below don't each pay for the same runs.
const whole = runSequential(all);

describe('the simulator shards (D320)', () => {
  it('give every run of the real suite to exactly one shard, in the list order', () => {
    const full = buildSpecs({
      policies: POLICY_IDS,
      days: 14,
      seeds: 5,
      starts: ['mon', 'sat'],
      fast: false,
    });
    expect(full).toHaveLength(45); // 4 policies × 2 starts × 5 seeds + the Delver's 5 Monday runs
    const parts = SHARD_IDS.map((s) => specsOfShard(full, s));
    expect(parts.flat()).toHaveLength(full.length);
    expect(new Set(parts.flat().map((s) => JSON.stringify(s))).size).toBe(full.length);
    for (const s of SHARD_IDS)
      expect(specsOfShard(full, s).every((r) => shardOf(r) === s)).toBe(true);
    // No share is more than a third bigger than a fair one, so no job is far slower than the rest.
    for (const p of parts)
      expect(p.length).toBeLessThanOrEqual((full.length / SHARD_IDS.length) * 1.34);
  });

  it('played as shards and combined, equals one machine playing the whole list', async () => {
    const shards: ShardFile[] = [];
    for (const shard of SHARD_IDS) {
      const mine = specsOfShard(all, shard);
      shards.push({ shard, runs: await runSpecs(mine, 2) });
    }
    const combined = combineShards(all, shards);
    expect(combined).toEqual(whole);
    // Judged the same way, every row gives the same answer from either.
    const judge = (runs: typeof whole) => CHECKS.map((c) => c.judge(runs));
    expect(judge(combined)).toEqual(judge(whole));
  }, 180_000);

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
