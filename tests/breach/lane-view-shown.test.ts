// Plan TB.8a (GDD §9.25): the lane view says whether the strip shows (Bastion on, not before) and how
// many upcoming waves its dots and list look at, so the screen decides neither.
import { describe, expect, it } from 'vitest';
import { num } from '../../src/core/balance-access';
import { createNewGame } from '../../src/core/state/new-game';
import { laneView } from '../../src/core/systems/breach';

describe('the lane view', () => {
  it('is shown at Bastion and not at any Rank before it', () => {
    for (const age of ['hamlet', 'keep', 'citadel'] as const) {
      const s = createNewGame('view-seed', 0);
      s.cycle.age = age;
      expect(laneView(s).shown, age).toBe(false);
    }
    const s = createNewGame('view-seed', 0);
    s.cycle.age = 'bastion';
    expect(laneView(s).shown).toBe(true);
  });

  it('carries the wave count and puts each upcoming wave in exactly one lane', () => {
    const s = createNewGame('view-seed', 0);
    s.cycle.age = 'bastion';
    const v = laneView(s);
    expect(v.waveCount).toBe(num('breach.suggestWaves'));
    const all = v.lanes.flatMap((l) => l.waves).sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: v.waveCount }, (_, i) => i + 1));
  });

  it('is rebuilt when the Rank changes (the memo key holds it)', () => {
    const s = createNewGame('view-seed', 0);
    s.cycle.age = 'citadel';
    expect(laneView(s).shown).toBe(false);
    s.cycle.age = 'bastion';
    expect(laneView(s).shown).toBe(true);
  });
});
