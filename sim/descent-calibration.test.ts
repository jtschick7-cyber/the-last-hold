// Plan TD.8b: the calibration table reads the probe's cells, pooled over seeds.
import { describe, expect, it } from 'vitest';
import { calibrationMarkdown, pool } from './descent-calibration';
import { PROBE_PROFILES, type DescentCell, type DescentProbe } from './descent-probe';
import type { RunResult } from './run';

const cell = (wins: number, downed: number): DescentCell => ({
  wins,
  samples: 100,
  stagesCleared: { median: 3, p10: 2, p90: 3 },
  downed: { median: downed, p10: downed - 1, p90: downed + 2 },
  unlitLeft: { median: 0, p10: 0, p90: 0, reached: 90 },
});
const run = (seed: string, wins: number): RunResult =>
  ({
    spec: { seed },
    vigil: {
      descent: {
        samples: 100,
        grid: { tiers: [[5, 6, 7]], unlitHealth: [4500] },
        cells: Object.fromEntries(PROBE_PROFILES.map((p) => [p, [[cell(wins, 4)]]])),
      } as unknown as DescentProbe,
    },
  }) as unknown as RunResult;

describe('calibration table', () => {
  it('pools the win rate over every practice run and takes medians of the rest', () => {
    const v = pool([cell(50, 2), cell(70, 4), cell(90, 6)]);
    expect(v.winRate).toBeCloseTo(0.7);
    expect(v.downed).toBe(4);
    expect(v.downedLow).toBe(1);
    expect(v.downedHigh).toBe(8);
  });

  it('writes one block per grid point with a row for each roster', () => {
    const md = calibrationMarkdown([run('a', 60), run('b', 80)]);
    expect(md).toContain('### Stage tiers 5, 6, 7 · Unlit base Health 4500');
    for (const name of ['Minimal gate-open', 'Maxed endgame', 'Hamlet starter party'])
      expect(md).toContain(name);
    expect(md).toContain('| 70% |');
  });

  it('says so when no run reached a stand', () => {
    expect(calibrationMarkdown([])).toContain('nothing to report');
  });
});
