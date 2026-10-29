// Plan TB.4 (GDD §5.9.3, §9.25, technical design §7.2, §23.2): each wave of the stand's list carries its
// lane, fixed by the stand seed alone. The species are the ones v1.4 showed; the layout never moves a lane;
// below Bastion there is no lane.
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/new-game';
import { standPoolOf } from '../../src/core/stand/pool';
import { standSeed, waveList } from '../../src/core/stand/waves';
import { laneOf, standWaves } from '../../src/core/systems/breach';

const bastion = (seed: string) => {
  const s = createNewGame(seed, 0);
  s.cycle.age = 'bastion';
  return s;
};

describe('the stand wave list carries each wave’s lane (TB.4)', () => {
  it('gives wave n the lane laneOf(standSeed, n), on every call', () => {
    for (const seed of ['alpha', 'beta', 'zz9']) {
      const s = bastion(seed);
      const first = standWaves(s, 24);
      expect(standWaves(s, 24)).toEqual(first);
      first.forEach((w) => expect(w.lane).toBe(laneOf(standSeed(s), w.n)));
      first.forEach((w) => expect(w.lane).toBeGreaterThanOrEqual(0));
      first.forEach((w) => expect(w.lane).toBeLessThan(8));
    }
  });

  it('is not changed by any layout change', () => {
    const s = bastion('alpha');
    const before = standWaves(s, 12);
    s.layout.placed = { 'hearth-hall': { x: 3, y: 3 }, walls: { x: 0, y: 0 } } as never;
    s.buildings.walls = 15;
    s.buildings.watchtower = 15;
    expect(standWaves(s, 12)).toEqual(before);
    s.layout.placed = {} as never;
    expect(standWaves(s, 12)).toEqual(before);
  });

  it('leaves tier and species exactly as v1.4’s wave list gave them', () => {
    for (const seed of ['alpha', 'beta', 'zz9', 'gamma7']) {
      const s = bastion(seed);
      const old = waveList(standSeed(s), 12, standPoolOf(s));
      expect(standWaves(s, 12).map(({ n, tier, monster }) => ({ n, tier, monster }))).toEqual(old);
    }
  });

  it('shows no lane below Bastion', () => {
    for (const age of ['hamlet', 'keep', 'citadel'] as const) {
      const s = createNewGame('alpha', 0);
      s.cycle.age = age;
      standWaves(s, 12).forEach((w) => expect(w.lane).toBeNull());
    }
  });
});
