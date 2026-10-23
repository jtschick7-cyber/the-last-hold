// Plan TL.2 (GDD §5.1.5, technical design §19.3, D501, D502): the four piece states, the looks, the
// wall connections and the grid view; and S11: no rule reads the layout.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AGE_IDS, type AgeId } from '../../src/content/ages';
import { BUILDING_IDS } from '../../src/content/buildings';
import { HOLD_PIECE_IDS, PIECES, type HoldPieceId } from '../../src/content/hold-layout';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { canonicalLayout, pieceDef } from '../../src/core/systems/layout-catalog';
import {
  buildHoldGridView,
  footprint,
  getPieceStatus,
  isPieceUnlocked,
  pieceTier,
  wallConnectionMask,
} from '../../src/core/systems/layout';

const MAX = 99;
/** A Bastion hold with every building at a high count or level and the canonical layout. */
const full = (age: AgeId = 'bastion'): GameState => {
  const s = createNewGame('layout', 0);
  s.cycle.age = age;
  for (const id of BUILDING_IDS) s.buildings[id] = MAX;
  s.layout = canonicalLayout();
  return s;
};
const statusCounts = (s: GameState): Record<string, number> => {
  const out: Record<string, number> = { locked: 0, active: 0, 'dormant-ring': 0, tray: 0 };
  for (const id of HOLD_PIECE_IDS)
    out[getPieceStatus(s, id)] = (out[getPieceStatus(s, id)] ?? 0) + 1;
  return out;
};

describe('unlocking (D501)', () => {
  it.each(PIECES.map((p) => [p.id, p.building, p.unlockAt] as const))(
    '%s unlocks at %s %i, and not one before',
    (id, building, at) => {
      const s = createNewGame('u', 0);
      s.buildings[building] = at - 1;
      expect(isPieceUnlocked(s, id)).toBe(id === 'hearth-hall' && at - 1 >= 1);
      s.buildings[building] = at;
      expect(isPieceUnlocked(s, id)).toBe(true);
    },
  );

  it('a new game has only the Hearth Hall, the starting Farm and Camp, and nothing else unlocked', () => {
    const s = createNewGame('n', 0);
    expect(HOLD_PIECE_IDS.filter((id) => isPieceUnlocked(s, id))).toEqual([
      'hearth-hall',
      'farm-1',
      'woodcutter-1',
    ]);
  });
});

describe('the four states (M2)', () => {
  it('are exclusive and cover all 40 pieces at every Rank', () => {
    for (const age of AGE_IDS) {
      const c = statusCounts(full(age));
      expect(c.locked).toBe(0);
      expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(HOLD_PIECE_IDS.length);
    }
  });

  it('give 13, 32, 36 and 40 active pieces at Hamlet, Keep, Citadel and Bastion (canonical layout)', () => {
    expect(AGE_IDS.map((a) => statusCounts(full(a)).active)).toEqual([13, 32, 36, 40]);
    expect(AGE_IDS.map((a) => statusCounts(full(a))['dormant-ring'])).toEqual([27, 8, 4, 0]);
  });

  it('keep every Citadel defense active at Citadel and the row-0 ones dormant until Bastion (M1)', () => {
    const citadel = full('citadel');
    for (const id of [
      ...Array.from({ length: 8 }, (_, i) => `wall-${i + 1}`),
      'watchtower-1',
      'watchtower-2',
    ])
      expect(getPieceStatus(citadel, id as HoldPieceId), id).toBe('active');
    for (const id of ['wall-9', 'wall-10', 'wall-11', 'watchtower-3'] as const) {
      expect(getPieceStatus(citadel, id), id).toBe('dormant-ring');
      expect(getPieceStatus(full('bastion'), id), id).toBe('active');
    }
  });

  it('keeps the Hearth Hall active at every Rank (M4)', () => {
    for (const age of AGE_IDS) expect(getPieceStatus(full(age), 'hearth-hall')).toBe('active');
  });

  it('is locked until built, even with a saved place; unplaced and built is tray', () => {
    const s = full();
    s.buildings.mill = 0;
    expect(getPieceStatus(s, 'mill')).toBe('locked');
    s.buildings.mill = 1;
    delete s.layout.placed.mill;
    expect(getPieceStatus(s, 'mill')).toBe('tray');
  });

  it('never moves a saved place (reading changes nothing)', () => {
    const s = full('hamlet');
    const before = structuredClone(s.layout);
    buildHoldGridView(s);
    for (const id of HOLD_PIECE_IDS) getPieceStatus(s, id);
    expect(s.layout).toEqual(before);
  });

  it('counts a 2 × 2 piece out of the clearing if any of its tiles is outside', () => {
    const s = full('hamlet');
    s.layout.placed['hearth-hall'] = { x: 5, y: 5 }; // would cover (6,6): outside Hamlet
    expect(getPieceStatus(s, 'hearth-hall')).toBe('dormant-ring');
    expect(footprint(pieceDef('hearth-hall'), { x: 5, y: 5 })).toHaveLength(4);
  });
});

describe('the looks (tiers and densities)', () => {
  const at = (id: HoldPieceId, n: number): number => {
    const s = createNewGame('t', 0);
    s.buildings[pieceDef(id).building] = n;
    return pieceTier(s, id);
  };
  it.each([
    ['mill', [1, 4, 5, 10, 11, 20], [1, 1, 2, 2, 3, 3]],
    ['smithy', [1, 4, 5, 10, 11, 20], [1, 1, 2, 2, 3, 3]],
    ['bell-tower', [1, 2, 3], [1, 2, 3]],
    ['lodge', [1, 2, 3], [1, 2, 3]],
    ['barracks', [1, 2, 3, 4, 5], [1, 1, 2, 2, 3]],
    ['alchemist', [1, 2, 3, 4, 5], [1, 1, 2, 2, 3]],
    ['trophy-hall', [1], [1]],
    ['cottage-1', [1, 4, 5, 14, 15, 30], [1, 1, 2, 2, 3, 3]],
    ['woodcutter-2', [1, 4, 5, 14, 15], [1, 1, 2, 2, 3]],
    ['silver-seam-1', [1, 2], [1, 2]],
    ['wall-1', [1, 15], [1, 1]],
    ['watchtower-1', [1, 15], [1, 1]],
  ] as const)('%s', (id, levels, tiers) => {
    expect(levels.map((n) => at(id, n))).toEqual([...tiers]);
  });
});

describe('wall connections', () => {
  it('gives the right mask for all 16 neighbour patterns', () => {
    const sides: Array<[number, number, number]> = [
      [1, 0, -1], // north
      [2, 1, 0], // east
      [4, 0, 1], // south
      [8, -1, 0], // west
    ];
    for (let pattern = 0; pattern < 16; pattern++) {
      const grid = new Set<string>(['3,3']);
      for (const [bit, dx, dy] of sides) if (pattern & bit) grid.add(`${3 + dx},${3 + dy}`);
      expect(wallConnectionMask(grid, 3, 3), `pattern ${pattern}`).toBe(pattern);
    }
  });

  it('joins walls and watchtowers in the view and leaves other pieces out', () => {
    const v = buildHoldGridView(full());
    const mask = (id: HoldPieceId): number | null =>
      v.active.find((p) => p.id === id)?.mask ?? null;
    expect(mask('wall-1')).toBe(2 | 4); // (0,1): wall to the east, wall-7 to the south
    expect(mask('watchtower-1')).toBe(1 | 2 | 8); // (2,1): wall-9 north, wall-3 east, wall-2 west
    expect(mask('watchtower-3')).toBe(2 | 4 | 8); // (3,0): wall-10 east, wall-3 south, wall-9 west
    expect(mask('wall-8')).toBe(1); // (7,2): wall-6 north
    expect(mask('mill')).toBeNull();
  });

  it('does not join a wall to a dormant piece', () => {
    const v = buildHoldGridView(full('citadel')); // row 0 is not yet open
    expect(v.active.find((p) => p.id === 'watchtower-1')?.mask).toBe(2 | 8);
  });
});

describe('the grid view', () => {
  it('lists active pieces with their looks, ghosts only when they are on, and the tray', () => {
    const s = full('keep');
    delete s.layout.placed.mill;
    s.buildings.sawpit = 0; // locked but still in the blueprint
    const v = buildHoldGridView(s);
    expect(v.tray).toEqual(['mill']);
    expect(v.active.find((p) => p.id === 'cottage-3')?.tier).toBe(3);
    expect(v.ghosts.find((g) => g.id === 'sawpit')?.status).toBe('locked');
    expect(v.ghosts.find((g) => g.id === 'wall-9')?.status).toBe('dormant-ring');
    expect(v.activeCount).toBe(v.active.length);
    expect(v.pieceCount).toBe(40);
    s.layout.showGhosts = false;
    expect(buildHoldGridView(s).ghosts).toEqual([]);
  });

  it('never lists a dormant-ring piece in the tray (it does not count toward the badge)', () => {
    const v = buildHoldGridView(full('hamlet'));
    expect(v.tray).toEqual([]);
    expect(v.ghosts).toHaveLength(27);
  });

  it('a new game: the hall and the starting Farm and Camp on the grid, nothing in the tray', () => {
    const v = buildHoldGridView(createNewGame('new', 0));
    expect(v.active.map((p) => p.id)).toEqual(['hearth-hall', 'farm-1', 'woodcutter-1']);
    expect(v.tray).toEqual([]);
    expect(v.ghosts).toEqual([]);
    expect(v.look).toBe('plain');
  });

  it('puts the cosmetics where S7 says: border until the piece stands, then on it', () => {
    const s = createNewGame('c', 0);
    expect(buildHoldGridView(s).cosmetics).toEqual({
      door: false,
      banners: false,
      bell: null,
      lanterns: null,
    });
    s.delve.shop.cosmetics = [
      'carved-hearth-hall-door',
      'gatehouse-banners',
      'watchtower-bell',
      'wall-lanterns',
    ];
    expect(buildHoldGridView(s).cosmetics).toEqual({
      door: true,
      banners: true,
      bell: 'border',
      lanterns: 'border',
    });
    const f = full();
    f.delve.shop.cosmetics = ['watchtower-bell', 'wall-lanterns'];
    expect(buildHoldGridView(f).cosmetics).toMatchObject({ bell: 'tower', lanterns: 'walls' });
  });

  it('carries the Act VI frost and the Remembering lamp', () => {
    const s = full();
    for (const c of s.cycles) c.act = 6;
    expect(buildHoldGridView(s).look).toBe('frost');
    s.remembering.endings = [{ ending: 'remember', at: 0, cycle: 1 }];
    expect(buildHoldGridView(s).look).toBe('lamp');
  });

  it('is memoized on what it reads, and sees an in-place change', () => {
    const s = full('keep');
    const a = buildHoldGridView(s);
    expect(buildHoldGridView(s)).toBe(a);
    s.layout.placed.mill = { x: 6, y: 6 }; // in place
    const b = buildHoldGridView(s);
    expect(b).not.toBe(a);
    expect(b.active.find((p) => p.id === 'mill')).toMatchObject({ x: 6, y: 6 });
    s.buildings.walls = 1;
    expect(buildHoldGridView(s)).not.toBe(b);
  });
});

// S11 (plan TL.2): in v1.1 the layout is decorative. No file in src/core reads it except the ones on
// this list: the state, the save and the layout's own selectors. A later task that must touch another
// file adds it here on purpose, and CLAUDE.md says why that is allowed.
describe('the layout is read by no rule (S11)', () => {
  const ALLOWED = new Set([
    'commands/apply.ts',
    'commands/debug-layout.ts',
    'commands/layout.ts',
    'commands/types.ts',
    'long-night/reset.ts',
    'save/migration-v12.ts',
    'save/validate-layout.ts',
    'save/validate.ts',
    'state/game-state.ts',
    'state/layout-state.ts',
    'state/new-game.ts',
    'systems/layout-catalog.ts',
    'systems/layout-place.ts',
    'systems/layout.ts',
  ]);
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory()
        ? walk(p)
        : p.endsWith('.ts') && !p.endsWith('.test.ts')
          ? [p]
          : [];
    });
  const root = join(__dirname, '../../src/core');

  it('no other core file mentions the layout, its catalog or its content', () => {
    const offenders = walk(root)
      .map((p) => relative(root, p))
      .filter((f) => !ALLOWED.has(f))
      .filter((f) =>
        /\blayout\b|hold-layout|layout-state|layout-catalog|state\.layout/i.test(
          readFileSync(join(root, f), 'utf8'),
        ),
      );
    expect(offenders).toEqual([]);
  });

  it('the allowed list has no stale entry', () => {
    for (const f of ALLOWED) expect(() => statSync(join(root, f)), f).not.toThrow();
  });
});
