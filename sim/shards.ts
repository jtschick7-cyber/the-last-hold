import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RunResult, RunSpec } from './run';

// Plan T8.15 (D320): the full simulator suite is split into shards that CI plays as parallel jobs
// (sim.yml), then one more job combines their results and judges every row. A shard is a fixed
// share of the very same run list the single-machine suite plays (`buildSpecs`), so the combined
// results are exactly what one machine would have produced: same runs, seeds and rows.

export const SHARD_IDS = ['long', 'rest', 'heavy', 'events'] as const;
export type ShardId = (typeof SHARD_IDS)[number];

/**
 * Which shard plays a run. `long` holds the runs that go on through the Long Nights (Standard and
 * the Delver), `heavy` the Heavy player, `rest` the Opening and the Light player: three shares of
 * about the same size, so no job is much slower than another. The Eventer (v0.9, GDD §6.1) is its
 * own shard, `events`, so no other job grows (plan T9.12).
 */
export const shardOf = (spec: RunSpec): ShardId =>
  spec.policy === 'eventer'
    ? 'events'
    : spec.policy === 'standard' || spec.policy === 'delver'
      ? 'long'
      : spec.policy === 'heavy'
        ? 'heavy'
        : 'rest';

export const specsOfShard = (all: readonly RunSpec[], shard: ShardId): RunSpec[] =>
  all.filter((s) => shardOf(s) === shard);

/** What a shard job writes: the specs it was given and what they gave. */
export interface ShardFile {
  readonly shard: ShardId;
  readonly runs: readonly RunResult[];
}

export const writeShard = (dir: string, file: ShardFile): string => {
  const path = join(dir, `${file.shard}.json`);
  writeFileSync(path, JSON.stringify(file));
  return path;
};

export const readShards = (dir: string): ShardFile[] =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as ShardFile);

const same = (a: RunSpec, b: RunSpec): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Puts the shards' results back in the order of the full run list. Refuses (with a reason) when a
 * run is missing, repeated or not part of the list, so a lost shard can never pass for a green run.
 */
export const combineShards = (
  all: readonly RunSpec[],
  shards: readonly ShardFile[],
): RunResult[] => {
  const got = shards.flatMap((s) => s.runs);
  const out = all.map((spec) => {
    const found = got.filter((r) => same(r.spec, spec));
    if (found.length === 0)
      throw new Error(
        `The run ${spec.policy}/${spec.start}/${spec.seed} is missing from the shards.`,
      );
    if (found.length > 1)
      throw new Error(
        `The run ${spec.policy}/${spec.start}/${spec.seed} is in more than one shard.`,
      );
    return found[0] as RunResult;
  });
  if (got.length !== all.length)
    throw new Error(`The shards hold ${got.length} runs; the suite has ${all.length}.`);
  return out;
};
