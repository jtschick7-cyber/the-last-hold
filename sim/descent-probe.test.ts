// Plan TD.8b: the Descent probe measures only: it changes no constant and is deterministic.
import { describe, expect, it } from 'vitest';
import { constantAt, num } from '../src/core/balance-access';
import { createNewGame } from '../src/core/state/new-game';
import { PROBE_PROFILES, probeDescent, shippedDescentGrid } from './descent-probe';
import { buildEndgameRoster } from './descent-roster';

const hold = () => {
  const s = createNewGame('descent-probe', 0);
  buildEndgameRoster(s, 'minimal');
  return s;
};

describe('probeDescent', () => {
  it('is deterministic, one cell per roster for the shipped values, and leaves the constants alone', () => {
    const tiers = JSON.stringify(constantAt('descent.stageTiers').value);
    const health = num('descent.unlitBaseHealth');
    const a = probeDescent(hold(), 8);
    expect(JSON.stringify(a)).toBe(JSON.stringify(probeDescent(hold(), 8)));
    for (const p of PROBE_PROFILES) {
      expect(a.cells[p]).toHaveLength(1);
      expect(a.cells[p][0]).toHaveLength(1);
      const c = a.cells[p][0]?.[0];
      expect(c?.samples).toBe(8);
      expect(c?.wins).toBeLessThanOrEqual(8);
    }
    expect(JSON.stringify(constantAt('descent.stageTiers').value)).toBe(tiers);
    expect(num('descent.unlitBaseHealth')).toBe(health);
    expect(shippedDescentGrid().unlitHealth).toEqual([health]);
  });

  it('a harder grid point never wins more often for the same roster and dice', () => {
    const p = probeDescent(hold(), 12, {
      tiers: [[5, 6, 7]],
      unlitHealth: [1000, 4500, 40000],
    });
    const w = (h: number) => p.cells.maxed[0]?.[h]?.wins ?? -1;
    expect(w(0)).toBeGreaterThanOrEqual(w(1));
    expect(w(1)).toBeGreaterThanOrEqual(w(2));
    // A huge Unlit leaves Health on it; a tiny one is beaten.
    expect(p.cells.maxed[0]?.[2]?.unlitLeft.median).toBeGreaterThan(0);
  });

  it('the Hamlet starter and zeroed rosters are no stronger than their full versions', () => {
    const p = probeDescent(hold(), 12, { tiers: [[9, 10, 11]], unlitHealth: [4500] });
    const wins = (k: (typeof PROBE_PROFILES)[number]) => p.cells[k][0]?.[0]?.wins ?? -1;
    expect(wins('maxed-zeroed')).toBeLessThanOrEqual(wins('maxed'));
    expect(wins('hamlet')).toBeLessThanOrEqual(wins('maxed'));
  });
});
