// GDD §6.2 v1.3 (D546 (5), D554): how the three Rising Vigil rows judge made-up Vigilant runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import {
  risesAt,
  vigilEmbersLevelCheck,
  vigilLevelRisesCheck,
  vigilNeverMoreWavesCheck,
} from './v13';

const WAVES = [17, 16, 15, 14, 14, 12, 12, 11, 11, 10, 10];
const probe = (waves: number[], embers: number[]) => ({
  samples: 100,
  sGrid: [0.32],
  eGrid: [0.22],
  kinds: ['additive'],
  levels: 10,
  threats: [0, 1].map((i) => ({
    threat: 20 * (i + 1),
    base: {},
    waves: {
      additive: [waves.map((median) => ({ median, p10: median, p90: median, band: 'held' }))],
    },
    embers: { additive: [[embers]] },
  })),
});
const run = (
  levels: number[] = [1, 2, 3],
  waves = WAVES,
  embers = [337, 342, 338, 330],
  seed = 'a',
  start = 'mon',
): RunResult =>
  ({
    spec: { policy: 'vigilant', seed, start, days: 14 },
    vigil: {
      debugUsed: true,
      gateOpened: { hours: 450, cycle: 7 },
      stands: levels.map((level, i) => ({
        cycle: 7 + i,
        level,
        waves: 15,
        embers: 300,
        band: 'held',
        threat: 20,
      })),
      probe: probe(waves, embers),
    },
  }) as unknown as RunResult;
const five = (make: (i: number) => RunResult): RunResult[] => [0, 1, 2, 3, 4].map(make);

describe('row A: the level rises by exactly 1 per On stand', () => {
  it('passes with levels 1, 2, 3 on every seed', () => {
    expect(
      vigilLevelRisesCheck.judge(five((i) => run([1, 2, 3], WAVES, [1, 1, 1, 1], `s${i}`))).pass,
    ).toBe(true);
  });
  it('fails when a seed skips a level, has fewer stands, or has none', () => {
    for (const levels of [[1, 3, 4], [1, 2], []]) {
      const runs = [
        ...five((i) => run([1, 2, 3], WAVES, [1, 1, 1, 1], `s${i}`)).slice(1),
        run(levels),
      ];
      expect(vigilLevelRisesCheck.judge(runs).pass).toBe(false);
    }
  });
});

describe('row B: more vigil never holds more waves', () => {
  it('finds where a curve rises', () => {
    expect(risesAt([17, 16, 16, 17, 10])).toEqual([2]);
    expect(risesAt(WAVES)).toEqual([]);
  });
  it('passes on a falling curve and fails on a rising one, at either Threat point', () => {
    expect(vigilNeverMoreWavesCheck.judge(five(() => run())).pass).toBe(true);
    const rising = [17, 16, 17, 14, 14, 12, 12, 11, 11, 10, 10];
    const r = vigilNeverMoreWavesCheck.judge([
      ...five(() => run()).slice(1),
      run([1, 2, 3], rising),
    ]);
    expect(r.pass).toBe(false);
    expect(r.lines.join('\n')).toContain('rises after level 1');
  });
});

describe('row C: Embers at levels 1 to 3 stay level with level 0', () => {
  it("passes inside 5% at the stand's own Threat (the measured 1.5%, 0.3%, 2.1%)", () => {
    expect(vigilEmbersLevelCheck.judge(five(() => run())).pass).toBe(true);
  });
  it('judges the median of the seeds, not one seed', () => {
    const odd = run([1, 2, 3], WAVES, [100, 900, 900, 900], 'odd');
    expect(vigilEmbersLevelCheck.judge([...five(() => run()).slice(1), odd]).pass).toBe(true);
  });
  it('fails on a median that is 6% off', () => {
    expect(
      vigilEmbersLevelCheck.judge(five(() => run([1, 2, 3], WAVES, [300, 318, 300, 300]))).pass,
    ).toBe(false);
  });
});

describe('the three rows', () => {
  it('are not judged in the fast set, and say so when the Vigilant runs are missing', () => {
    for (const c of [vigilLevelRisesCheck, vigilNeverMoreWavesCheck, vigilEmbersLevelCheck]) {
      expect(c.judge([]).pass).toBe(false);
      const fast = {
        ...run(),
        spec: { policy: 'vigilant', seed: 'a', start: 'mon', days: 14, stopAt: [] },
      };
      expect(c.judge([fast as unknown as RunResult]).pass).toBeNull();
    }
  });
  it('judge only the Monday Vigilant runs', () => {
    const sat = run([9], WAVES, [1, 99, 1, 1], 'x', 'sat');
    expect(vigilLevelRisesCheck.judge([...five(() => run()), sat]).pass).toBe(true);
  });
});
