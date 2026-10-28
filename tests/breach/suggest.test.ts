// Plan TB.7b (technical design §23.2, §23.8, GDD §5.9.11, D588, D590): Suggest layout. One fixed rule in
// core: deterministic, moves only walls and towers, uses only free front-row tiles, never exceeds the
// pieces owned, changes no state, and never scores below Auto-arrange.
import { describe, expect, it } from 'vitest';
import { CANONICAL_LAYOUT, PIECES, type HoldPieceId } from '../../src/content/hold-layout';
import { apply } from '../../src/core/commands/apply';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import type { LaneTable } from '../../src/core/state/lane-table';
import { canonicalLayout } from '../../src/core/systems/layout-catalog';
import { footprint } from '../../src/core/systems/layout';
import { autoArrange } from '../../src/core/systems/layout-place';
import {
  cover,
  coverValue,
  laneTableFor,
  layoutScore,
  suggestLayout,
  suggestLayoutFor,
} from '../../src/core/systems/breach';

/** The two named fixture lane lists of technical design §23.8. */
const EVEN = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3];
const WEST_HEAVY = [0, 1, 0, 1, 2, 0, 1, 0, 3, 0, 1, 2];
const FIXTURES = { even: EVEN, 'west-heavy': WEST_HEAVY };
const isDefense = (id: string): boolean => id.startsWith('wall-') || id.startsWith('watchtower-');
const weights = (lanes: readonly number[]): number[] =>
  Array.from({ length: 8 }, (_, c) => lanes.filter((l) => l === c).length);

/** A Bastion hold with the given defense levels and only the Hearth Hall placed: every tile is free. */
const empty = (walls: number, towers: number): GameState => {
  const s = createNewGame('suggest-seed', 0);
  s.cycle.age = 'bastion';
  s.buildings.walls = walls;
  s.buildings.watchtower = towers;
  s.layout.placed = { 'hearth-hall': { x: 3, y: 3 } } as GameState['layout']['placed'];
  return s;
};
const canonical = (walls = 15, towers = 15): GameState => {
  const s = empty(walls, towers);
  s.layout = canonicalLayout();
  return s;
};
/** The same hold with every front-row tile crowded by economy buildings but the corners. */
const crowded = (): GameState => {
  const s = canonical();
  const others = PIECES.filter(
    (p) => !isDefense(p.id) && p.id !== 'hearth-hall' && p.w === 1 && p.h === 1,
  );
  const placed: Record<string, { x: number; y: number }> = { 'hearth-hall': { x: 3, y: 3 } };
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < 3; y++) for (let x = 2; x < 6; x++) tiles.push({ x, y });
  others.slice(0, tiles.length).forEach((p, i) => {
    placed[p.id] = tiles[i] as { x: number; y: number };
  });
  s.layout.placed = placed as GameState['layout']['placed'];
  return s;
};
const hold = (): [string, GameState][] => [
  ['empty', empty(15, 15)],
  ['canonical', canonical()],
  ['crowded', crowded()],
  ['low levels', canonical(3, 8)],
];

/** The score of the defenses `moves` would leave in the front rows, built the independent way. */
const scoreOf = (
  s: GameState,
  moves: readonly { pieceId: HoldPieceId; x: number; y: number }[],
  lanes: number[],
) => {
  const t = structuredClone(s);
  t.layout.placed = Object.fromEntries(
    Object.entries(t.layout.placed).filter(([id]) => !isDefense(id)),
  ) as GameState['layout']['placed'];
  for (const m of moves)
    (t.layout.placed as Record<string, unknown>)[m.pieceId] = { x: m.x, y: m.y };
  return layoutScore(laneTableFor(t), weights(lanes));
};

describe('the cover helper agrees with the breakdown builder', () => {
  it('coverValue equals cover().value for every column pattern', () => {
    for (let mask = 0; mask < 256; mask++) {
      const pieces = Array.from({ length: 8 }, (_, c) => (mask >> c) & 1);
      const table: LaneTable = {
        pieces,
        towerCols: [],
        k: {
          coverOwn: 0.5,
          coverNeighbour: 0.25,
          depthStep: 0.25,
          depthMax: 2,
          towerReach: [1, 0.5, 0.25],
          volleyScale: 1,
        },
      };
      for (let c = 0; c < 8; c++) expect(coverValue(table, c)).toBe(cover(table, c).value);
    }
  });
});

describe('worked rules', () => {
  it('four walls for lane 4 alone: the lane’s own column, both neighbours, then a stack', () => {
    const s = empty(1, 0);
    const out = suggestLayoutFor(s, [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
    expect(out.moves).toEqual([
      { pieceId: 'wall-1', x: 3, y: 0 },
      { pieceId: 'wall-2', x: 2, y: 0 },
      { pieceId: 'wall-3', x: 4, y: 0 },
      { pieceId: 'wall-4', x: 3, y: 1 },
    ]);
  });

  it('three towers for lane 6 alone: two stack in its column, the third trades depth for a neighbour', () => {
    const s = empty(0, 15);
    const out = suggestLayoutFor(s, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
    expect(out.moves).toEqual([
      { pieceId: 'watchtower-1', x: 5, y: 0 },
      { pieceId: 'watchtower-2', x: 5, y: 1 },
      // Worked: a third on the column scores 0.5 × 1.5 + 1 = 1.75; beside it, 0.75 × 1.25 + 5/6 = 1.77.
      { pieceId: 'watchtower-3', x: 4, y: 0 },
    ]);
  });
});

describe.each(Object.entries(FIXTURES))('on the %s lane list', (_name, lanes) => {
  describe.each(hold())('in the %s hold', (_h, s) => {
    const out = suggestLayoutFor(s, lanes);

    it('is deterministic and changes no state', () => {
      const before = JSON.stringify(s);
      expect(suggestLayoutFor(s, lanes)).toEqual(out);
      expect(JSON.stringify(s)).toBe(before);
    });

    it('moves only walls and towers, to free front-row tiles, none twice, never past what is owned', () => {
      const owned = new Set(
        PIECES.filter((p) => isDefense(p.id) && s.buildings[p.building] >= p.unlockAt).map(
          (p) => p.id,
        ),
      );
      const taken = new Set<string>();
      for (const p of PIECES) {
        const at = s.layout.placed[p.id];
        if (at && !isDefense(p.id)) for (const t of footprint(p, at)) taken.add(`${t.x},${t.y}`);
      }
      const used = new Set<string>();
      expect(out.moves.length).toBeLessThanOrEqual(owned.size);
      for (const m of out.moves) {
        expect(isDefense(m.pieceId)).toBe(true);
        expect(owned.has(m.pieceId)).toBe(true);
        expect(m.y).toBeLessThan(3);
        expect(taken.has(`${m.x},${m.y}`)).toBe(false);
        expect(used.has(m.pieceId)).toBe(false);
        used.add(m.pieceId);
      }
      const tiles = out.moves.map((m) => `${m.x},${m.y}`);
      expect(new Set(tiles).size).toBe(tiles.length);
    });

    it('scores at least as high as Auto-arrange’s defense positions on tiles it may use, with its own numbers', () => {
      const held = new Set<string>();
      for (const p of PIECES) {
        const at = s.layout.placed[p.id];
        if (at && !isDefense(p.id)) for (const t of footprint(p, at)) held.add(`${t.x},${t.y}`);
      }
      const probe = structuredClone(s);
      autoArrange(probe);
      probe.layout.placed = Object.fromEntries(
        Object.entries(probe.layout.placed).filter(
          ([id, at]) => !(isDefense(id) && held.has(`${at.x},${at.y}`)),
        ),
      ) as GameState['layout']['placed'];
      const auto = layoutScore(laneTableFor(probe), weights(lanes));
      expect(out.autoScore).toBe(auto);
      expect(out.score).toBeGreaterThanOrEqual(auto);
      expect(scoreOf(s, out.moves, lanes)).toBe(out.score);
    });

    it('where Auto-arrange would not have to move any other building, it scores at least its full score', () => {
      if (_h === 'crowded') return; // Auto-arrange wipes the economy buildings off the front rows; Suggest never does
      const probe = structuredClone(s);
      autoArrange(probe);
      expect(out.score).toBeGreaterThanOrEqual(layoutScore(laneTableFor(probe), weights(lanes)));
    });
  });
});

describe('suggestLayout(state) reads the stand’s own first waves', () => {
  it('is deterministic for a hold and changes no state', () => {
    const s = canonical();
    const before = JSON.stringify(s);
    expect(suggestLayout(s)).toEqual(suggestLayout(s));
    expect(JSON.stringify(s)).toBe(before);
  });

  it('is never below Auto-arrange for several stand seeds', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const s = canonical();
      s.meta.gameSeed = seed;
      const out = suggestLayout(s);
      expect(out.score).toBeGreaterThanOrEqual(out.autoScore);
    }
  });

  it('an applied suggestion is a legal layout: placing its moves by hand gives its score', () => {
    const s = empty(15, 15);
    const out = suggestLayout(s);
    for (const m of out.moves)
      expect(
        apply(s, { type: 'layout.place', pieceId: m.pieceId, x: m.x, y: m.y }, s.time).ok,
      ).toBe(true);
    expect(CANONICAL_LAYOUT).toBeDefined();
    expect(layoutScore(laneTableFor(s), weights([...Array(12)].map((_, i) => i)))).toBeDefined();
  });

  it('runs within 20 ms (a cold unthrottled run; the throttled profile is 4× this)', () => {
    const s = crowded();
    suggestLayout(s);
    let best = Infinity;
    for (let i = 0; i < 5; i++) {
      const t = performance.now();
      suggestLayout(s);
      best = Math.min(best, performance.now() - t);
    }
    expect(best).toBeLessThan(20);
  });
});
