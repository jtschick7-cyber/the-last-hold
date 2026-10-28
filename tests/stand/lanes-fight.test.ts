// Plan TB.5 (technical design §23.4, GDD §5.9.3, §5.9.11): the stand fight reads the lane table.
// Absent: the version 5 path, bit for bit. Present: each wave gets its lane's wall cut and volley.
import { describe, expect, it } from 'vitest';
import { num } from '../../src/core/balance-access';
import { runStand, standTaken, type StandInput } from '../../src/core/stand/engine';
import { standInputOf } from '../../src/core/stand/replay';
import type { LaneTable } from '../../src/core/state/lane-table';
import { laneOf, volley, wallCut } from '../../src/core/systems/breach';
import { snap } from '../combat/helpers';

const SIX = (['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const).map((id) =>
  snap(id, { level: 8, weapon: 'iron-blade' }),
);
const K = {
  coverOwn: 0.5,
  coverNeighbour: 0.25,
  depthStep: 0.25,
  depthMax: 2,
  towerReach: [1, 0.5, 0.25],
  volleyScale: 1,
};
const table = (pieces: number[], towerCols: number[] = [], k = {}): LaneTable => ({
  pieces,
  towerCols,
  k: { ...K, ...k },
});
const input = (over: Partial<StandInput> = {}): StandInput => ({
  seed: 'test:stand:1',
  threat: 0,
  party: SIX,
  prep: { oils: {}, potions: {}, bombs: [] },
  bombs: {},
  defenses: { walls: 0, watchtower: 0 },
  relics: [],
  knowledge: {},
  log: true,
  ...over,
});
/** What a wave's fight did, without the Breach breakdown a version 6 wave also carries. */
const fights = (r: ReturnType<typeof runStand>) =>
  r.waves.map(({ wave, startHealth, bombs, fight }) => ({ wave, startHealth, bombs, fight }));

describe('equality with version 5 (technical design §23.4)', () => {
  it('(1) Walls and Watchtower at level 0: any table gives the version 5 stand', () => {
    for (const t of [table([0, 0, 0, 0, 0, 0, 0, 0]), table([3, 0, 1, 2, 0, 0, 3, 1], [2, 3, 6])]) {
      for (const threat of [0, 60]) {
        const v5 = runStand(input({ threat, relics: ['iron-shutter'] }));
        const v6 = runStand(input({ threat, relics: ['iron-shutter'], lanes: t }));
        expect(fights(v6)).toEqual(fights(v5));
        expect(v6.wavesHeld).toBe(v5.wavesHeld);
      }
    }
  });

  it('(2) no towers, no depth, full cover in every lane: the version 5 stand', () => {
    const full = table([1, 1, 1, 1, 1, 1, 1, 1], [], { depthStep: 0 });
    for (const walls of [3, 10, 15]) {
      const defenses = { walls, watchtower: 0 };
      const v5 = runStand(input({ defenses, relics: ['iron-shutter'] }));
      const v6 = runStand(input({ defenses, relics: ['iron-shutter'], lanes: full }));
      expect(fights(v6)).toEqual(fights(v5));
    }
  });

  it('a table with no counted pieces is not the version 5 stand: Walls cover only the ruined edge', () => {
    const none = table([0, 0, 0, 0, 0, 0, 0, 0]);
    const defenses = { walls: 15, watchtower: 0 };
    const v5 = runStand(input({ defenses }));
    const v6 = runStand(input({ defenses, lanes: none }));
    expect(fights(v6)).not.toEqual(fights(v5));
    expect(v6.wavesHeld).toBeLessThanOrEqual(v5.wavesHeld);
    for (const w of v6.waves) {
      const cut = w.breach?.wallCut.value ?? -1;
      expect(cut).toBeLessThan(15 * num('walls.takenPerLevel'));
    }
  });
});

describe('each wave takes its lane’s numbers', () => {
  const t = table([2, 0, 1, 3, 0, 0, 1, 0], [3, 6]);
  const defenses = { walls: 12, watchtower: 9 };
  const r = runStand(input({ defenses, lanes: t }));

  it('the wall cut and the volley are the lane’s, from the stand seed', () => {
    expect(r.waves.length).toBeGreaterThan(3);
    for (const w of r.waves) {
      const c = laneOf('test:stand:1', w.wave.n);
      expect(w.breach?.lane).toBe(c);
      expect(w.breach?.wallCut.value).toBe(wallCut(t, defenses.walls, c).value);
      expect(w.breach?.volley.value).toBe(volley(t, defenses.watchtower, c).value);
      const first = w.fight.log[0];
      const v = volley(t, defenses.watchtower, c).value;
      if (v > 0) {
        expect(first?.kind).toBe('volley');
        expect(first?.text).toContain(`Steel ${v}`);
      } else expect(first?.kind).not.toBe('volley');
    }
  });

  it('the Walls line carries the cover and depth lines from the same function', () => {
    for (const w of r.waves) {
      const labels = JSON.stringify(w.breach?.wallCut.breakdown);
      expect(labels).toContain('Cover:');
      expect(labels).toContain('Walls: −');
    }
    const stacked = r.waves.find((w) => (t.pieces[laneOf('test:stand:1', w.wave.n)] ?? 0) > 1);
    expect(JSON.stringify(stacked?.breach?.wallCut.breakdown)).toContain('Stacked pieces');
  });

  it('a version 5 stand carries no Breach lines', () => {
    for (const w of runStand(input({ defenses })).waves) expect(w.breach).toBeUndefined();
  });

  it('the species, tiers and dice do not change with the table', () => {
    const v5 = runStand(input({ defenses }));
    expect(r.waves.map((w) => w.wave)).toEqual(
      v5.waves.slice(0, r.waves.length).map((w) => w.wave),
    );
  });

  it('is fixed by its inputs and a record with the table rebuilds the same waves', () => {
    expect(runStand(input({ defenses, lanes: t }))).toEqual(r);
    const rec = {
      seed: 'test:stand:1',
      threat: 0,
      party: SIX,
      prep: { oils: {}, potions: {}, bombs: [] },
      bombs: {},
      defenses,
      relics: [],
      knowledge: {},
      alchemy: 0,
      lanes: t,
    } as never;
    expect(standInputOf(rec).lanes).toEqual(t);
    expect(runStand(standInputOf(rec))).toEqual(r);
    const old = { ...(rec as object), lanes: undefined } as never;
    expect('lanes' in standInputOf(old)).toBe(false);
  });

  it('the log rebuild uses the saved numbers, not the current balance (k is on the table)', () => {
    const loud = table(t.pieces, t.towerCols, { volleyScale: 2 });
    const a = runStand(input({ defenses, lanes: t }));
    const b = runStand(input({ defenses, lanes: loud }));
    expect(b.waves[0]?.breach?.volley.value).toBeGreaterThanOrEqual(
      a.waves[0]?.breach?.volley.value ?? 0,
    );
    expect(runStand(input({ defenses, lanes: t }))).toEqual(a);
  });
});

describe('the 75% cap still holds (GDD §7.4)', () => {
  it('counts how often depth plus Iron Shutter, Shieldwall and Banked Smoke bind it', () => {
    // A deep wall in every column (3 pieces: depth 2) with full cover: the wall cut is 1.5 × 2% a level.
    const deep = table([3, 3, 3, 3, 3, 3, 3, 3]);
    const shieldwall = 0.1; // content/traits.ts
    const bankedSmoke = 0.2; // content/use-skills.ts
    const rows = [0, 1, 2, 3, 4, 5, 6, 7].map((c) => {
      const cut = wallCut(deep, 15, c).value;
      const party = standTaken({ walls: 0, watchtower: 0 }, ['iron-shutter'], cut);
      return party + shieldwall + bankedSmoke;
    });
    const binds = rows.filter((x) => x > num('combat.takenCap')).length;
    // 0.45 + 0.05 + 0.1 + 0.2 = 0.8 in every lane: the cap binds in all 8, and only the cap limits it.
    expect(binds).toBe(8);
    expect(Math.max(...rows)).toBeGreaterThan(num('combat.takenCap'));
    // Depth alone, with Walls at 10 and no relic, stays under the cap in every lane.
    expect(wallCut(deep, 10, 0).value + 0.3).toBeLessThan(num('combat.takenCap'));
    // And the stand itself still runs under it.
    const r = runStand(
      input({ defenses: { walls: 15, watchtower: 0 }, lanes: deep, relics: ['iron-shutter'] }),
    );
    expect(r.wavesHeld).toBeGreaterThan(0);
  });
});
