// Plan T5.15 (D169): the parallel suite gives exactly the same results as a sequential run.
import { describe, expect, it } from 'vitest';
import { runOne, type RunSpec } from './run';
import { runSequential, runSpecs } from './parallel';

// Short runs that still go through the Opening, the Keep's first contracts and the offline catch-up.
const specs: readonly RunSpec[] = [
  { policy: 'standard', seed: 'sim-1', start: 'mon', days: 1 },
  { policy: 'standard', seed: 'sim-2', start: 'sat', days: 1 },
  { policy: 'light', seed: 'sim-1', start: 'mon', days: 1 },
  { policy: 'opening', seed: 'sim-1', start: 'mon', days: 1 },
];

describe('the parallel simulator suite (D169)', () => {
  it('a run loses nothing when written as JSON, so both ways of running compare exactly', () => {
    const raw = runOne(specs[0] as RunSpec);
    expect(JSON.parse(JSON.stringify(raw))).toEqual(raw);
  });

  it('gives exactly the same results as a sequential run, in the same order', async () => {
    const sequential = runSequential(specs);
    const parallel = await runSpecs(specs, 2);
    expect(parallel).toHaveLength(specs.length);
    expect(parallel.map((r) => r.spec)).toEqual(specs);
    expect(parallel).toEqual(sequential);
  }, 120_000);

  it('with one worker it runs in this process and still matches', async () => {
    expect(await runSpecs(specs.slice(0, 2), 1)).toEqual(runSequential(specs.slice(0, 2)));
  });
});
