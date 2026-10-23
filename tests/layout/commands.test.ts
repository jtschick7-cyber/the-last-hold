// Plan TL.3 (GDD §5.1.5, technical design §19.3, D502): the layout commands, blueprint protection,
// auto-placement and the Long Night.
import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../src/content/buildings';
import {
  CANONICAL_LAYOUT,
  HOLD_PIECE_IDS,
  type GridCoord,
  type HoldPieceId,
} from '../../src/content/hold-layout';
import { apply } from '../../src/core/commands/apply';
import type { Command } from '../../src/core/commands/types';
import { resetForNewCycle } from '../../src/core/long-night/reset';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { canonicalLayout } from '../../src/core/systems/layout-catalog';
import { autoPlaceUnlocked } from '../../src/core/systems/layout-place';
import { buildHoldGridView, getPieceStatus } from '../../src/core/systems/layout';

const run = (s: GameState, cmd: Command) => apply(s, cmd, s.time);
const place = (s: GameState, pieceId: HoldPieceId, x: number, y: number) =>
  run(s, { type: 'layout.place', pieceId, x, y });
const at = (s: GameState, id: HoldPieceId) => s.layout.placed[id];
const must = (s: GameState, id: HoldPieceId): GridCoord => {
  const c = s.layout.placed[id];
  if (!c) throw new Error(`${id} is not placed`);
  return c;
};
const rich = (): GameState => {
  const s = createNewGame('t', 0);
  s.resources = { food: 1e12, wood: 1e12, iron: 1e12, silver: 1e12 };
  return s;
};
/** A Keep hold with every building high and the canonical layout. */
const full = (age: GameState['cycle']['age'] = 'bastion'): GameState => {
  const s = createNewGame('f', 0);
  s.cycle.age = age;
  for (const id of BUILDING_IDS) s.buildings[id] = 99;
  s.layout = canonicalLayout();
  return s;
};
const tiles = (s: GameState): string[] =>
  Object.entries(s.layout.placed).map(([id, c]) => `${id}@${c.x},${c.y}`);

describe('layout.place', () => {
  it('moves a piece to a free tile', () => {
    const s = full();
    expect(place(s, 'mill', 6, 6).ok).toBe(true);
    expect(at(s, 'mill')).toEqual({ x: 6, y: 6 });
  });

  it('swaps two pieces', () => {
    const s = full();
    const smithy = must(s, 'smithy');
    const mill = at(s, 'mill');
    expect(place(s, 'mill', smithy.x, smithy.y).ok).toBe(true);
    expect(at(s, 'mill')).toEqual(smithy);
    expect(at(s, 'smithy')).toEqual(mill);
  });

  it('sends the piece under a tray piece to the tray', () => {
    const s = full();
    run(s, { type: 'layout.unplace', pieceId: 'mill' });
    const smithy = must(s, 'smithy');
    expect(place(s, 'mill', smithy.x, smithy.y).ok).toBe(true);
    expect(getPieceStatus(s, 'smithy')).toBe('tray');
  });

  it('refuses the Hearth Hall tiles, locked rings, locked pieces and bad tiles', () => {
    const s = full('keep');
    for (const [x, y] of [
      [3, 3],
      [4, 4],
      [0, 0], // outside the Keep clearing
      [7, 1],
      [-1, 2],
      [2.5, 2],
    ])
      expect(place(s, 'mill', x ?? 0, y ?? 0).ok, `${x},${y}`).toBe(false);
    const n = createNewGame('n', 0);
    expect(place(n, 'mill', 2, 2).ok).toBe(false); // not built
    expect(at(s, 'mill')).toEqual(CANONICAL_LAYOUT.mill);
  });

  it('a refused command changes nothing', () => {
    const s = full('keep');
    const before = structuredClone(s.layout);
    place(s, 'mill', 0, 0);
    place(s, 'hearth-hall', 5, 5);
    expect(s.layout).toEqual(before);
  });

  it('puts a tray piece on a free tile', () => {
    const s = full();
    run(s, { type: 'layout.unplace', pieceId: 'mill' });
    expect(place(s, 'mill', 6, 6).ok).toBe(true);
    expect(at(s, 'mill')).toEqual({ x: 6, y: 6 });
  });
});

describe('the Hearth Hall (M4)', () => {
  it('moves only within 2..4 × 2..4', () => {
    const s = full();
    for (const [x, y] of [
      [1, 3],
      [5, 3],
      [3, 1],
      [3, 5],
    ])
      expect(place(s, 'hearth-hall', x ?? 0, y ?? 0).ok, `${x},${y}`).toBe(false);
    expect(at(s, 'hearth-hall')).toEqual({ x: 3, y: 3 });
    expect(place(s, 'hearth-hall', 2, 2).ok).toBe(true);
    expect(at(s, 'hearth-hall')).toEqual({ x: 2, y: 2 });
  });

  it('puts the pieces it covers into the tiles it leaves', () => {
    const s = full();
    // Hall (3,3)-(4,4) → (2,2)-(3,3): covers (2,2) silver-seam-2, (3,2) smithy, (2,3) mill; leaves (4,3), (3,4), (4,4).
    expect(place(s, 'hearth-hall', 2, 2).ok).toBe(true);
    const moved = ['silver-seam-2', 'smithy', 'mill'] as const;
    const spots = moved.map((id) => must(s, id)).map((c) => `${c.x},${c.y}`);
    expect([...spots].sort()).toEqual(['3,4', '4,3', '4,4']);
    // No two pieces share a tile, and the Hall's tiles are free.
    const all = new Set<string>();
    for (const id of HOLD_PIECE_IDS) {
      const c = must(s, id);
      const size = id === 'hearth-hall' ? 2 : 1;
      for (let dx = 0; dx < size; dx++)
        for (let dy = 0; dy < size; dy++) {
          const k = `${c.x + dx},${c.y + dy}`;
          expect(all.has(k), `${id} overlaps at ${k}`).toBe(false);
          all.add(k);
        }
    }
    expect(buildHoldGridView(s).tray).toEqual([]);
  });

  it('cannot be unplaced', () => {
    const s = full();
    expect(run(s, { type: 'layout.unplace', pieceId: 'hearth-hall' }).ok).toBe(false);
    expect(at(s, 'hearth-hall')).toEqual({ x: 3, y: 3 });
  });
});

describe('unplace, clear, auto-arrange and ghosts', () => {
  it('unplace sends a built piece to the tray and refuses a locked or a missing one', () => {
    const s = full();
    expect(run(s, { type: 'layout.unplace', pieceId: 'mill' }).ok).toBe(true);
    expect(getPieceStatus(s, 'mill')).toBe('tray');
    expect(run(s, { type: 'layout.unplace', pieceId: 'mill' }).ok).toBe(false);
    const n = createNewGame('n', 0);
    expect(run(n, { type: 'layout.unplace', pieceId: 'mill' }).ok).toBe(false);
  });

  it('clear keeps only the Hearth Hall; built pieces wait in the tray', () => {
    const s = full('keep');
    place(s, 'hearth-hall', 2, 4);
    expect(run(s, { type: 'layout.clear' }).ok).toBe(true);
    expect(s.layout.placed).toEqual({ 'hearth-hall': { x: 2, y: 4 } });
    expect(buildHoldGridView(s).tray).toHaveLength(39); // every built piece but the Hall
    expect(s.layout.showGhosts).toBe(true);
  });

  it('auto-arrange restores the canonical layout', () => {
    const s = full();
    run(s, { type: 'layout.clear' });
    expect(run(s, { type: 'layout.autoArrange' }).ok).toBe(true);
    expect(s.layout.placed).toEqual(CANONICAL_LAYOUT);
  });

  it('auto-arrange puts a built piece whose canonical spot is closed on the first free open tile', () => {
    const s = createNewGame('a', 0);
    s.buildings.walls = 1; // four wall segments, canonical row 1: closed at the Hamlet
    s.buildings.mill = 1;
    run(s, { type: 'layout.autoArrange' });
    expect(at(s, 'mill')).toEqual(CANONICAL_LAYOUT.mill);
    for (const w of ['wall-1', 'wall-2', 'wall-3', 'wall-4'] as const)
      expect(getPieceStatus(s, w)).toBe('tray'); // a Hamlet clearing has no defense tile
    expect(at(s, 'farm-1')).toEqual(CANONICAL_LAYOUT['farm-1']);
  });

  it('sets the ghosts, and refuses a non-boolean', () => {
    const s = full();
    expect(run(s, { type: 'layout.setShowGhosts', showGhosts: false }).ok).toBe(true);
    expect(s.layout.showGhosts).toBe(false);
    expect(run(s, { type: 'layout.setShowGhosts', showGhosts: 'no' as never }).ok).toBe(false);
    expect(s.layout.showGhosts).toBe(false);
  });
});

describe('auto-placement (M2, S6)', () => {
  it('a new game places the starting Farm and Camp, nearest the middle first', () => {
    const s = createNewGame('n', 0);
    expect(tiles(s)).toEqual(['hearth-hall@3,3', 'farm-1@3,2', 'woodcutter-1@4,2']);
    expect(buildHoldGridView(s).tray).toEqual([]);
  });

  it('a bought building takes the next free tile by distance, then y, then x', () => {
    const s = rich();
    run(s, { type: 'build.buy', building: 'cottage', count: 1 });
    expect(at(s, 'cottage-1')).toEqual({ x: 2, y: 3 });
    run(s, { type: 'build.buy', building: 'cottage', count: 1 });
    expect(at(s, 'cottage-1')).toEqual({ x: 2, y: 3 }); // already placed: not moved
  });

  it('a piece that unlocks keeps its saved spot: active when free and cleared', () => {
    const s = createNewGame('b', 0);
    s.layout.placed.mill = { x: 5, y: 5 }; // a blueprint from an earlier cycle
    s.resources = { food: 1e9, wood: 1e9, iron: 1e9, silver: 1e9 };
    run(s, { type: 'build.upgrade', building: 'mill' });
    expect(at(s, 'mill')).toEqual({ x: 5, y: 5 });
    expect(getPieceStatus(s, 'mill')).toBe('active');
  });

  it('a piece whose saved spot is in a closed ring becomes dormant and keeps the blueprint', () => {
    const s = createNewGame('d', 0);
    s.layout.placed.mill = { x: 6, y: 6 };
    s.resources = { food: 1e9, wood: 1e9, iron: 1e9, silver: 1e9 };
    run(s, { type: 'build.upgrade', building: 'mill' });
    expect(at(s, 'mill')).toEqual({ x: 6, y: 6 });
    expect(getPieceStatus(s, 'mill')).toBe('dormant-ring');
    expect(buildHoldGridView(s).tray).toEqual([]);
  });

  it('never overwrites a saved coordinate, and a free-tile search never takes a blueprint tile', () => {
    const s = createNewGame('p', 0);
    // A blueprint holds (3,2), the nearest free tile; the Farm and Camp are re-placed around it.
    s.layout.placed = { 'hearth-hall': { x: 3, y: 3 }, sawpit: { x: 3, y: 2 } };
    const before = structuredClone(s.layout.placed);
    autoPlaceUnlocked(s);
    for (const [id, c] of Object.entries(before))
      expect(s.layout.placed[id as HoldPieceId]).toEqual(c);
    expect(at(s, 'farm-1')).toEqual({ x: 4, y: 2 });
  });

  it('a piece the player sent to the tray stays there when something else is bought', () => {
    const s = rich();
    run(s, { type: 'layout.unplace', pieceId: 'farm-1' });
    run(s, { type: 'build.buy', building: 'cottage', count: 1 });
    expect(getPieceStatus(s, 'farm-1')).toBe('tray');
    expect(getPieceStatus(s, 'cottage-1')).toBe('active');
  });

  it('puts defenses on row 1 west to east, then the row 2 wings, then row 0', () => {
    const s = createNewGame('w', 0);
    s.cycle.age = 'bastion';
    s.buildings.walls = 15;
    s.buildings.watchtower = 15;
    autoPlaceUnlocked(s);
    const pos = (id: HoldPieceId) => must(s, id);
    // Towers come first in the catalog, so they take row 1's west end when all unlock together.
    expect(
      ['watchtower-1', 'watchtower-2', 'watchtower-3'].map((id) => pos(id as HoldPieceId)),
    ).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]);
    expect(pos('wall-1')).toEqual({ x: 3, y: 1 });
    expect(pos('wall-5')).toEqual({ x: 7, y: 1 });
    expect(pos('wall-6')).toEqual({ x: 0, y: 2 });
    expect(pos('wall-7')).toEqual({ x: 7, y: 2 });
    expect(pos('wall-8')).toEqual({ x: 0, y: 0 });
    expect(pos('wall-11')).toEqual({ x: 3, y: 0 });
  });

  it('a defense with no open defense tile waits in the tray (row 0 before the Bastion)', () => {
    const s = createNewGame('w', 0);
    s.cycle.age = 'citadel';
    s.buildings.walls = 15;
    s.buildings.watchtower = 15;
    autoPlaceUnlocked(s);
    // Row 1 and the wings hold ten: the three towers and walls 1–7. The rest wait for row 0.
    expect(buildHoldGridView(s).tray).toEqual(['wall-8', 'wall-9', 'wall-10', 'wall-11']);
  });
});

describe('Rank-up and the Long Night', () => {
  it('a Rank-up wakes dormant pieces and places the tray', () => {
    const s = rich();
    s.cycle.age = 'hamlet';
    s.buildings.mill = 1; // not via apply: the blueprint is set by hand
    s.layout.placed.mill = { x: 6, y: 3 }; // the Keep ring: closed at the Hamlet
    s.layout.placed.sawpit = undefined as never;
    delete s.layout.placed.sawpit;
    s.buildings.sawpit = 1; // unplaced: waits in the tray until a Rank-up
    expect(getPieceStatus(s, 'mill')).toBe('dormant-ring');
    expect(getPieceStatus(s, 'sawpit')).toBe('tray');
    const before = at(s, 'mill');
    s.cycle.age = 'keep'; // what age.up does to the clearing
    autoPlaceUnlocked(s);
    expect(getPieceStatus(s, 'mill')).toBe('active');
    expect(at(s, 'mill')).toEqual(before);
    expect(getPieceStatus(s, 'sawpit')).toBe('active');
  });

  it('age.up through apply places the tray', () => {
    const s = rich();
    s.peasants.total = 1e6;
    s.buildings.cottage = 50;
    s.buildings.mill = 3;
    s.buildings.smithy = 1;
    s.layout.placed = { 'hearth-hall': { x: 3, y: 3 }, 'farm-1': { x: 2, y: 2 } };
    delete s.layout.placed['farm-1'];
    const r = run(s, { type: 'age.up' });
    if (!r.ok) throw new Error(r.reason);
    expect(s.cycle.age).toBe('keep');
    expect(getPieceStatus(s, 'farm-1')).toBe('active');
    expect(getPieceStatus(s, 'woodcutter-1')).toBe('active');
  });

  it('the Long Night leaves the blueprint untouched and the starting buildings stand', () => {
    const s = full();
    place(s, 'mill', 6, 6);
    run(s, { type: 'layout.setShowGhosts', showGhosts: false });
    const before = structuredClone(s.layout);
    resetForNewCycle(s);
    expect(s.cycle.age).toBe('hamlet');
    expect(s.layout).toEqual(before);
    expect(getPieceStatus(s, 'farm-1')).toBe('active');
    expect(getPieceStatus(s, 'woodcutter-1')).toBe('active');
  });

  it('after the Long Night a starting building without a spot is placed', () => {
    const s = full();
    delete s.layout.placed['farm-1'];
    resetForNewCycle(s);
    expect(getPieceStatus(s, 'farm-1')).toBe('active');
  });
});

describe('decorative (S11)', () => {
  it('layout commands change nothing outside state.layout', () => {
    const cmds: Command[] = [
      { type: 'layout.place', pieceId: 'mill', x: 6, y: 6 },
      { type: 'layout.place', pieceId: 'hearth-hall', x: 2, y: 2 },
      { type: 'layout.unplace', pieceId: 'smithy' },
      { type: 'layout.autoArrange' },
      { type: 'layout.clear' },
      { type: 'layout.setShowGhosts', showGhosts: false },
    ];
    const s = full();
    const without = (g: GameState) => ({ ...g, layout: null });
    const rest = structuredClone(without(s));
    for (const c of cmds) run(s, c);
    expect(without(s)).toEqual(rest);
  });
});

describe('debug layout commands (TL.4, N4)', () => {
  it('fill Bastion shows every piece at its top look, all placed, and sets debugUsed', () => {
    const s = createNewGame('d', 0);
    expect(run(s, { type: 'debug.layoutFillBastion' }).ok).toBe(true);
    expect(s.cycle.age).toBe('bastion');
    expect(s.meta.debugUsed).toBe(true);
    const v = buildHoldGridView(s);
    expect(v.activeCount).toBe(40);
    expect(v.tray).toEqual([]);
    expect(v.ghosts).toEqual([]);
    expect(v.active.filter((p) => p.mask === null && p.tier === 3).length).toBeGreaterThan(10);
  });

  it('fill Bastion never lowers a building and lays out the canonical arrangement', () => {
    const s = createNewGame('d', 0);
    s.buildings.cottage = 40;
    s.layout.placed.mill = { x: 6, y: 6 };
    run(s, { type: 'debug.layoutFillBastion' });
    expect(s.buildings.cottage).toBe(40);
    expect(s.layout.placed).toEqual(CANONICAL_LAYOUT);
  });

  it('debug auto-arrange and clear do what the player commands do, and set debugUsed', () => {
    const s = full();
    run(s, { type: 'layout.setShowGhosts', showGhosts: true });
    expect(s.meta.debugUsed).toBe(false);
    expect(run(s, { type: 'debug.layoutClear' }).ok).toBe(true);
    expect(Object.keys(s.layout.placed)).toEqual(['hearth-hall']);
    expect(s.meta.debugUsed).toBe(true);
    const t = full();
    place(t, 'mill', 6, 6);
    expect(run(t, { type: 'debug.layoutAutoArrange' }).ok).toBe(true);
    expect(t.layout.placed).toEqual(CANONICAL_LAYOUT);
    expect(t.meta.debugUsed).toBe(true);
  });

  it('the player commands do not set debugUsed', () => {
    const s = full();
    run(s, { type: 'layout.autoArrange' });
    run(s, { type: 'layout.clear' });
    expect(s.meta.debugUsed).toBe(false);
  });
});
