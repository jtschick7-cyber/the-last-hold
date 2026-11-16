// Plan TB.12 & T18.12: the calibration grid only tries values the rules allow (GDD §7.15–§7.16).
import { describe, expect, it } from 'vitest';
import { LEVELS, SWEEPS, V18_LAYOUT_SCALES, V18_SWEEPS } from './breach-calibration';

describe('the Breach calibration grid', () => {
  it('names the three level points of the plan', () => {
    expect(LEVELS.map((l) => [l.name, l.walls, l.tower])).toEqual([
      ['low', 1, 1],
      ['mid', 8, 8],
      ['max', 15, 15],
    ]);
  });

  it('keeps every cover split summing to 1, tower reach in quarters and volley scale in hundredths', () => {
    for (const s of SWEEPS) {
      const v = s.values;
      if ('breach.coverOwn' in v)
        expect(
          Math.round(
            ((v['breach.coverOwn'] as number) + 2 * (v['breach.coverNeighbour'] as number)) * 100,
          ),
        ).toBe(100);
      if ('breach.towerReach' in v)
        for (const r of v['breach.towerReach'] as number[]) expect((r * 4) % 1).toBe(0);
      if ('breach.volleyScale' in v)
        expect(
          Math.abs(
            (v['breach.volleyScale'] as number) * 100 -
              Math.round((v['breach.volleyScale'] as number) * 100),
          ),
        ).toBeLessThan(1e-9);
      if ('breach.depthMax' in v) expect(Number.isInteger(v['breach.depthMax'])).toBe(true);
    }
  });

  it('keeps v1.8 Breach and Layout calibration sweeps within valid non-negative bounds', () => {
    expect(V18_LAYOUT_SCALES.length).toBeGreaterThanOrEqual(4);
    for (const s of V18_SWEEPS) {
      for (const [k, v] of Object.entries(s.values)) {
        expect(typeof v, k).toBe('number');
        expect(v as number, k).toBeGreaterThanOrEqual(0);
        if (k === 'layout.wardedThreatCut' || k === 'layout.adjBrew') {
          expect(v as number, k).toBeLessThan(1);
        }
      }
    }
  });
});
