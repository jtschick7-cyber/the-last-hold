// Plan TB.3 (technical design §23.2, GDD §5.9.11, §7.15, D580–D583): the lane list, the counted
// pieces, cover, depth, the wall cut, the shared volley and their breakdowns. Nothing is wired into
// combat yet. The expected numbers are worked out by hand here, in the order of technical design §23.2.
import { describe, expect, it } from 'vitest';
import { BREACH_TEXT } from '../../src/content/breach-text';
import { balance } from '../../src/content/balance';
import type { HoldPieceId } from '../../src/content/hold-layout';
import type { GameState } from '../../src/core/state/game-state';
import type { LaneTable } from '../../src/core/state/lane-table';
import { createNewGame } from '../../src/core/state/new-game';
import { seeded } from '../../src/core/rng';
import { standSeed, waveList } from '../../src/core/stand/waves';
import {
  countedPieces,
  cover,
  extra,
  laneOf,
  laneTableFor,
  laneView,
  lanesFor,
  volley,
  wallCut,
} from '../../src/core/systems/breach';

const K = {
  coverOwn: 0.5,
  coverNeighbour: 0.25,
  depthStep: 0.25,
  depthMax: 2,
  towerReach: [1, 0.5, 0.25],
  volleyScale: 1,
};
const table = (
  pieces: number[],
  towerCols: number[] = [],
  k: Partial<typeof K> = {},
): LaneTable => ({
  pieces,
  towerCols,
  k: { ...K, ...k },
});
const LANES = [0, 1, 2, 3, 4, 5, 6, 7];

/** A Bastion hold with every defense unlocked and nothing placed. */
const hold = (placed: Partial<Record<HoldPieceId, { x: number; y: number }>>): GameState => {
  const s = createNewGame('breach-seed', 0);
  s.cycle.age = 'bastion';
  s.buildings.walls = 15;
  s.buildings.watchtower = 15;
  s.layout.placed = { 'hearth-hall': { x: 3, y: 3 }, ...placed } as GameState['layout']['placed'];
  return s;
};

describe('the lane of a wave (D580, technical design §7.2)', () => {
  // Worked once from the stream `${standSeed}:lane:${n}` (n counted from 1, as the species picks
  // count) and checked in.
  const WORKED: Record<string, number[]> = {
    'alpha:stand:1': [5, 6, 2, 0, 6, 3, 6, 6, 1, 7, 1, 7, 5, 4, 2, 5, 0, 5, 1, 3, 5, 3, 2, 1],
    '4820c83083220787:stand:2': [
      4, 1, 1, 3, 6, 5, 3, 0, 7, 6, 1, 7, 6, 6, 0, 5, 3, 0, 0, 5, 3, 1, 2, 1,
    ],
    'zz9:stand:3': [2, 0, 0, 6, 7, 1, 3, 3, 6, 1, 6, 5, 6, 4, 2, 5, 0, 2, 5, 4, 5, 4, 6, 0],
  };

  it.each(Object.entries(WORKED))('%s: wave 1 to 24 take the worked lanes', (seed, lanes) => {
    expect(lanes.map((_, i) => laneOf(seed, i + 1))).toEqual(lanes);
    expect(lanesFor(seed, lanes.length)).toEqual(lanes);
  });

  it('is floor(roll × 8) from the lane stream, and the same on every call', () => {
    for (let n = 1; n <= 40; n++) {
      const want = Math.floor(seeded(`alpha:stand:1:lane:${n}`).next() * 8);
      expect(laneOf('alpha:stand:1', n)).toBe(want);
      expect(laneOf('alpha:stand:1', n)).toBe(laneOf('alpha:stand:1', n));
    }
  });

  it('counts waves from 1, as the species picks do', () => {
    expect(waveList('alpha:stand:1', 3).map((w) => w.n)).toEqual([1, 2, 3]);
  });

  it("leaves the stand's species picks byte for byte as they were (the lane stream is separate)", () => {
    const pinned: Record<string, string[]> = {
      'alpha:stand:1': [
        '2:ribbonshade',
        '2:kikimora',
        '3:huldra',
        '3:poludnitsa',
        '4:huldra',
        '4:poludnitsa',
        '5:nix',
        '5:vodyanoy',
        '6:leshy',
        '6:anvil-wight',
        '7:leshy',
        '7:strzyga',
      ],
      '4820c83083220787:stand:2': [
        '2:poludnitsa',
        '2:gloam-moths',
        '3:ribbonshade',
        '3:anvil-wight',
        '4:draugr',
        '4:vodyanoy',
        '5:strzyga',
        '5:vodyanoy',
        '6:leshy',
        '6:strzyga',
        '7:vodyanoy',
        '7:strzyga',
      ],
    };
    for (const [seed, list] of Object.entries(pinned)) {
      lanesFor(seed, 12); // asking for lanes first changes nothing
      expect(waveList(seed, 12).map((w) => `${w.tier}:${w.monster}`)).toEqual(list);
    }
  });
});

describe('the pieces that count (D581)', () => {
  it('counts only active walls and towers in rows 0 to 2', () => {
    const s = hold({
      'wall-1': { x: 0, y: 0 },
      'wall-2': { x: 0, y: 1 },
      'wall-3': { x: 3, y: 2 },
      'watchtower-1': { x: 3, y: 1 },
      'watchtower-2': { x: 7, y: 2 },
      'wall-4': { x: 5, y: 3 }, // row 3: no
      'wall-6': { x: 6, y: 0 },
      // wall-5 and watchtower-3 are in the Tray: no
    });
    expect(
      countedPieces(s)
        .map((p) => p.id)
        .sort(),
    ).toEqual(['wall-1', 'wall-2', 'wall-3', 'wall-6', 'watchtower-1', 'watchtower-2'].sort());
    const t = laneTableFor(s);
    expect(t.pieces).toEqual([2, 0, 0, 2, 0, 0, 1, 1]);
    expect(t.towerCols).toEqual([3, 7]);
  });

  it('gives nothing for a locked piece, a piece in a dormant ring, or a piece in rows 3 to 7', () => {
    const locked = hold({ 'wall-1': { x: 0, y: 0 }, 'wall-9': { x: 1, y: 0 } });
    locked.buildings.walls = 1; // wall-9 needs more
    expect(laneTableFor(locked).pieces).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);

    const hamlet = hold({ 'wall-1': { x: 3, y: 2 }, 'wall-2': { x: 3, y: 1 } });
    hamlet.cycle.age = 'hamlet'; // the clearing is columns 2 to 5, rows 2 to 5
    expect(laneTableFor(hamlet).pieces).toEqual([0, 0, 0, 1, 0, 0, 0, 0]);

    const deep = hold({ 'wall-1': { x: 3, y: 3 }, 'wall-2': { x: 4, y: 7 } });
    expect(laneTableFor(deep).pieces).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('counts nothing when nothing is placed, and freezes the numbers in force', () => {
    const t = laneTableFor(hold({}));
    expect(t.pieces).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(t.towerCols).toEqual([]);
    expect(t.k).toEqual({
      coverOwn: balance.breach.coverOwn.value,
      coverNeighbour: balance.breach.coverNeighbour.value,
      depthStep: balance.breach.depthStep.value,
      depthMax: balance.breach.depthMax.value,
      towerReach: balance.breach.towerReach.value,
      volleyScale: balance.breach.volleyScale.value,
    });
    expect(t.k.towerReach).not.toBe(balance.breach.towerReach.value); // a copy, never the live array
  });

  it('keeps the tower columns ascending', () => {
    const s = hold({
      'watchtower-1': { x: 6, y: 0 },
      'watchtower-2': { x: 1, y: 2 },
      'watchtower-3': { x: 3, y: 1 },
    });
    expect(laneTableFor(s).towerCols).toEqual([1, 3, 6]);
  });
});

describe('cover (D581)', () => {
  it('is own 50% plus 25% per neighbouring column, the ruined edge counting as wall', () => {
    const want = (has: boolean[], c: number): number => {
      const q =
        2 * Number(has[c]) +
        (c === 0 ? 1 : Number(has[c - 1])) +
        (c === 7 ? 1 : Number(has[c + 1]));
      return q / 4; // quarters
    };
    for (let mask = 0; mask < 256; mask++) {
      const has = LANES.map((c) => Boolean(mask & (1 << c)));
      const t = table(has.map(Number));
      for (const c of LANES) expect(cover(t, c).value, `mask ${mask} lane ${c}`).toBe(want(has, c));
    }
  });

  it('matches worked cases', () => {
    const none = table([0, 0, 0, 0, 0, 0, 0, 0]);
    expect([0, 3, 7].map((c) => cover(none, c).value)).toEqual([0.25, 0, 0.25]);
    expect(cover(table([1, 1, 1, 1, 1, 1, 1, 1]), 4).value).toBe(1);
    expect(cover(table([0, 0, 0, 1, 0, 0, 0, 0]), 3).value).toBe(0.5);
    expect(cover(table([1, 0, 0, 0, 0, 0, 0, 0]), 0).value).toBe(0.75);
    expect(cover(table([0, 0, 0, 0, 0, 0, 0, 1]), 7).value).toBe(0.75);
    expect(cover(table([0, 0, 1, 0, 0, 0, 0, 0]), 3).value).toBe(0.25);
  });

  it('has the starting values coverOwn + 2 × coverNeighbour = 1', () => {
    expect(balance.breach.coverOwn.value + 2 * balance.breach.coverNeighbour.value).toBe(1);
  });

  it('explains itself in the §9.25 lines, and the lines add up to the number', () => {
    const t = table([1, 1, 1, 0, 0, 0, 0, 1]);
    const mid = cover(t, 1);
    expect(mid.breakdown.label).toBe(BREACH_TEXT.cover(100));
    expect((mid.breakdown.children ?? []).map((l) => l.label)).toEqual([
      BREACH_TEXT.ownColumn(50),
      BREACH_TEXT.westNeighbour(25),
      BREACH_TEXT.eastNeighbour(25),
    ]);
    const west = cover(t, 0);
    expect((west.breakdown.children ?? []).map((l) => l.label)).toEqual([
      BREACH_TEXT.ownColumn(50),
      BREACH_TEXT.ruinedEdge(25),
      BREACH_TEXT.eastNeighbour(25),
    ]);
    const east = cover(table([0, 0, 0, 0, 0, 0, 0, 0]), 7);
    expect((east.breakdown.children ?? []).map((l) => l.label)).toEqual([
      BREACH_TEXT.ruinedEdge(25),
    ]);
    for (const mask of [0, 5, 77, 255])
      for (const c of LANES) {
        const tt = table(LANES.map((i) => Number(Boolean(mask & (1 << i)))));
        const r = cover(tt, c);
        const sum = (r.breakdown.children ?? []).reduce((a, l) => a + l.value, 0);
        expect(sum).toBe(r.value);
        expect(r.breakdown.value).toBe(r.value);
      }
  });
});

describe('depth (D581)', () => {
  it('is the extra pieces in a column, up to depthMax, and 0 for an empty column', () => {
    const t = table([0, 1, 2, 3, 0, 0, 0, 0]);
    expect([0, 1, 2, 3].map((c) => extra(t, c))).toEqual([0, 0, 1, 2]);
    const shallow = table([3, 2, 0, 0, 0, 0, 0, 0], [], { depthMax: 1 });
    expect([0, 1].map((c) => extra(shallow, c))).toEqual([1, 1]);
  });
});

describe('the wall cut (D581)', () => {
  it('is exactly 2% per level with full cover and no depth', () => {
    const full = table([1, 1, 1, 1, 1, 1, 1, 1]);
    for (let level = 1; level <= 15; level++)
      for (const c of LANES)
        expect(wallCut(full, level, c).value, `level ${level} lane ${c}`).toBe(0.02 * level);
  });

  it('is scaled by cover and by depth', () => {
    // level 10: 0.02 × 10 = 0.2. Lane 3 holds 3 pieces (2 extra) with both neighbours: cover 1.
    const deep = table([0, 0, 1, 3, 1, 0, 0, 0]);
    expect(wallCut(deep, 10, 3).value).toBeCloseTo(0.2 * 1 * 1.5, 12);
    // Lane 0 holds one piece, nothing at column 1: 0.5 + 0.25 (edge) = 0.75.
    expect(wallCut(table([1, 0, 0, 0, 0, 0, 0, 0]), 10, 0).value).toBeCloseTo(0.2 * 0.75, 12);
    // Lane 5 of an empty hold: no cover.
    expect(wallCut(table([0, 0, 0, 0, 0, 0, 0, 0]), 10, 5).value).toBe(0);
    // Walls level 0: nothing, whatever the pieces.
    expect(wallCut(deep, 0, 3).value).toBe(0);
  });

  it('explains itself: the Walls level, the cover, the stacking and the result', () => {
    const t = table([0, 0, 1, 3, 1, 0, 0, 0]);
    const r = wallCut(t, 10, 3);
    expect(r.breakdown.label).toBe(BREACH_TEXT.walls(30));
    expect(r.breakdown.value).toBe(r.value);
    const kids = r.breakdown.children ?? [];
    expect(kids.map((l) => l.label)).toContain(BREACH_TEXT.stacked(50));
    expect(kids.map((l) => l.label)).toContain(BREACH_TEXT.cover(100));
    // value = Walls × cover × (1 + stacking)
    const stack = kids.find((l) => l.label === BREACH_TEXT.stacked(50))?.value ?? 0;
    const cov = kids.find((l) => l.label === BREACH_TEXT.cover(100))?.value ?? 0;
    expect(r.value).toBeCloseTo(0.02 * 10 * cov * (1 + stack), 12);
    // No stacked line for a column with one piece.
    const single = wallCut(table([0, 0, 0, 1, 0, 0, 0, 0]), 10, 3);
    expect((single.breakdown.children ?? []).some((l) => l.label.startsWith('Stacked'))).toBe(
      false,
    );
  });
});

describe('the shared volley (D582, technical design §23.2)', () => {
  const lanes = (t: LaneTable, level: number) => LANES.map((c) => volley(t, level, c).value);
  const pieces = [1, 1, 1, 1, 1, 1, 1, 1];

  it("is the whole volley in a tower's own column, half one away, a quarter two away", () => {
    expect(lanes(table(pieces, [3]), 8)).toEqual([0, 40, 80, 160, 80, 40, 0, 0]);
  });

  it('shares the volley among the placed towers', () => {
    expect(lanes(table(pieces, [1, 6]), 8)).toEqual([40, 80, 40, 20, 20, 40, 80, 40]);
    expect(lanes(table(pieces, [0, 2, 2]), 3)).toEqual([30, 30, 45, 20, 10, 0, 0, 0]);
  });

  it('multiplies first, divides once and rounds down', () => {
    // Level 1 (20), three towers, lane 3: 20 × 100 × 100 ÷ 30000 = 6.67 → 6; lane 1: 20 × 75 ÷ 300 = 5.
    const t = table(pieces, [0, 3, 6]);
    expect(volley(t, 1, 3).value).toBe(6);
    expect(volley(t, 1, 1).value).toBe(5);
    for (let level = 0; level <= 15; level++)
      for (const c of LANES) expect(Number.isInteger(volley(t, level, c).value)).toBe(true);
  });

  it('follows the scale in hundredths and the reach in quarters', () => {
    expect(volley(table(pieces, [4], { volleyScale: 1.5 }), 15, 5).value).toBe(225);
    expect(volley(table(pieces, [4], { volleyScale: 0.5 }), 15, 4).value).toBe(150);
    expect(volley(table(pieces, [3], { volleyScale: 0.07 }), 8, 3).value).toBe(11); // 160 × 0.07 = 11.2
    expect(volley(table(pieces, [3], { towerReach: [1, 0.75, 0.5] }), 8, 4).value).toBe(120);
  });

  it('is 0 when no tower counts, and at Watchtower level 0', () => {
    expect(lanes(table(pieces, []), 8)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(lanes(table(pieces, [3]), 0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('explains itself: one line per counted tower and the result', () => {
    const r = volley(table(pieces, [0, 2, 2]), 3, 1);
    expect(r.breakdown.label).toBe(BREACH_TEXT.volley(30));
    expect((r.breakdown.children ?? []).map((l) => l.label)).toEqual([
      BREACH_TEXT.tower(1, 50),
      BREACH_TEXT.tower(3, 50),
      BREACH_TEXT.tower(3, 50),
    ]);
    expect(r.breakdown.value).toBe(r.value);
  });

  it('does not count a tower in the Tray, so it dilutes nobody', () => {
    const one = hold({ 'watchtower-1': { x: 3, y: 1 } });
    const withTrayTower = hold({ 'watchtower-1': { x: 3, y: 1 } }); // watchtower-2 and -3 stay in the Tray
    expect(laneTableFor(one).towerCols).toEqual([3]);
    expect(lanes(laneTableFor(withTrayTower), 15)).toEqual(
      lanes(
        table([0, 0, 0, 1, 0, 0, 0, 0], [3], { volleyScale: balance.breach.volleyScale.value }),
        15,
      ),
    );
  });

  it('never gets weaker when the Watchtower is upgraded with the new tower in the Tray', () => {
    const s = hold({ 'watchtower-1': { x: 3, y: 1 } });
    s.buildings.watchtower = 1;
    const before = lanes(laneTableFor(s), 1);
    s.buildings.watchtower = 8; // watchtower-2 unlocks, unplaced
    const after = lanes(laneTableFor(s), 8);
    after.forEach((v, c) => expect(v).toBeGreaterThanOrEqual(before[c] ?? 0));
  });
});

describe('the view for the strip (technical design §23.2)', () => {
  const placed = {
    'wall-1': { x: 0, y: 0 },
    'wall-2': { x: 0, y: 1 },
    'wall-3': { x: 3, y: 2 },
    'watchtower-1': { x: 3, y: 1 },
  } as const;

  it('has 8 lanes, numbered 1 to 8 from the west, with their waves from the real lane list', () => {
    const s = hold(placed);
    const v = laneView(s);
    expect(v.lanes.map((l) => l.lane)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const seed = standSeed(s);
    const first = lanesFor(seed, balance.breach.suggestWaves.value);
    for (const l of v.lanes)
      expect(l.waves).toEqual(first.flatMap((c, i) => (c === l.lane - 1 ? [i + 1] : [])));
    expect(v.lanes.flatMap((l) => l.waves).length).toBe(balance.breach.suggestWaves.value);
  });

  it('carries the cover, the wall cut and the volley, from the same functions', () => {
    const s = hold(placed);
    const t = laneTableFor(s);
    const v = laneView(s);
    for (const l of v.lanes) {
      const c = l.lane - 1;
      expect(l.cover.value).toBe(cover(t, c).value);
      expect(l.coverPercent).toBe(Math.round(100 * cover(t, c).value));
      expect(l.wallCut.value).toBe(wallCut(t, s.buildings.walls, c).value);
      expect(l.volley.value).toBe(volley(t, s.buildings.watchtower, c).value);
    }
    // Tower in column 4 (index 3): full reach in its own lane.
    expect(v.lanes[3]?.towerReachPercent).toBe(100);
    expect(v.lanes[4]?.towerReachPercent).toBe(50);
    expect(v.lanes[0]?.towerReachPercent).toBe(0);
  });

  it('names the pieces that cover a lane, for the lit tiles', () => {
    const v = laneView(hold(placed));
    // Lane 1 (column 0): wall-1 and wall-2 in its own column; column 1 is empty.
    expect([...(v.lanes[0]?.coverPieces ?? [])].sort()).toEqual(['wall-1', 'wall-2']);
    // Lane 3 (column 2): wall-3 and the tower in column 3 are its east neighbour.
    expect([...(v.lanes[2]?.coverPieces ?? [])].sort()).toEqual(['watchtower-1', 'wall-3'].sort());
    expect(v.lanes[3]?.towerPieces).toEqual(['watchtower-1']);
  });

  it('says when nothing counts', () => {
    expect(laneView(hold({})).none).toBe(true);
    expect(laneView(hold(placed)).none).toBe(false);
  });

  it('is rebuilt only when what it reads changes, and changes when a piece moves', () => {
    const s = hold(placed);
    const a = laneView(s);
    expect(laneView(s)).toBe(a);
    s.layout.placed['wall-3'] = { x: 6, y: 2 };
    const b = laneView(s);
    expect(b).not.toBe(a);
    expect(b.lanes[5]?.coverPercent).not.toBe(a.lanes[5]?.coverPercent);
  });

  it('does not change the layout or any other state', () => {
    const s = hold(placed);
    const copy = structuredClone(s);
    laneView(s);
    laneTableFor(s);
    expect(s).toEqual(copy);
  });
});
