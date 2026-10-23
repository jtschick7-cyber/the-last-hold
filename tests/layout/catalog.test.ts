// Plan TL.1 (GDD §5.1.5, D500, D501): the layout catalog is complete and the canonical layout is sound.
import { describe, expect, it } from 'vitest';
import { AGE_IDS } from '../../src/content/ages';
import { BUILDING_IDS } from '../../src/content/buildings';
import {
  CANONICAL_LAYOUT,
  GRID_SIZE,
  HALL_ANCHOR,
  HOLD_PIECE_IDS,
  PIECES,
} from '../../src/content/hold-layout';
import { clearingBounds, pieceDef } from '../../src/core/systems/layout-catalog';

const tiles = (id: (typeof HOLD_PIECE_IDS)[number]): string[] => {
  const c = CANONICAL_LAYOUT[id];
  const { w, h } = pieceDef(id);
  const out: string[] = [];
  for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < h; dy++) out.push(`${c.x + dx},${c.y + dy}`);
  return out;
};

describe('the layout catalog', () => {
  it('has one definition per piece id, in catalog order, each naming a real building', () => {
    expect(PIECES.map((p) => p.id)).toEqual([...HOLD_PIECE_IDS]);
    for (const p of PIECES) expect(BUILDING_IDS, p.id).toContain(p.building);
  });

  it('holds 40 pieces: the 2 × 2 Hearth Hall and 39 single tiles, 43 tiles in all', () => {
    expect(HOLD_PIECE_IDS).toHaveLength(40);
    expect(PIECES.filter((p) => p.w === 2 && p.h === 2).map((p) => p.id)).toEqual(['hearth-hall']);
    expect(PIECES.filter((p) => p.w === 1 && p.h === 1)).toHaveLength(39);
    expect(HOLD_PIECE_IDS.flatMap(tiles)).toHaveLength(43);
  });

  it('counts the pieces by group (D501)', () => {
    const n = (re: RegExp): number => HOLD_PIECE_IDS.filter((id) => re.test(id)).length;
    expect(n(/^(cottage|farm|woodcutter|mine|herb-garden)-/)).toBe(15);
    expect(n(/^silver-seam-/)).toBe(2);
    expect(n(/^watchtower-/)).toBe(3);
    expect(n(/^wall-/)).toBe(11);
  });

  it('unlocks plots at 1, 5 and 15 owned, Silver Seams at 1 and 2 (D501)', () => {
    const at = (id: (typeof HOLD_PIECE_IDS)[number]): number => pieceDef(id).unlockAt;
    expect(['cottage-1', 'cottage-2', 'cottage-3'].map((i) => at(i as never))).toEqual([1, 5, 15]);
    expect(at('silver-seam-1')).toBe(1);
    expect(at('silver-seam-2')).toBe(2);
    expect(pieceDef('woodcutter-2').building).toBe('woodcutters-camp');
  });

  it('unlocks Watchtowers at Lv 1, 8, 15 and Walls at Lv 1 (×4) then every 2 levels (D501)', () => {
    expect([1, 2, 3].map((i) => pieceDef(`watchtower-${i}` as never).unlockAt)).toEqual([1, 8, 15]);
    expect(
      Array.from({ length: 11 }, (_, i) => pieceDef(`wall-${i + 1}` as never).unlockAt),
    ).toEqual([1, 1, 1, 1, 3, 5, 7, 9, 11, 13, 15]);
  });

  it('has the clearings of D500: 16, 36, 48 and 64 tiles', () => {
    const size = (age: (typeof AGE_IDS)[number]): number => {
      const b = clearingBounds(age);
      return (b.maxX - b.minX + 1) * (b.maxY - b.minY + 1);
    };
    expect(AGE_IDS.map(size)).toEqual([16, 36, 48, 64]);
  });
});

describe('the canonical layout', () => {
  it('places every piece on the grid with no two pieces on one tile, leaving 21 open', () => {
    const all = HOLD_PIECE_IDS.flatMap(tiles);
    expect(new Set(all).size).toBe(all.length);
    for (const t of all) {
      const [x, y] = t.split(',').map(Number) as [number, number];
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(GRID_SIZE);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(GRID_SIZE);
    }
    expect(GRID_SIZE * GRID_SIZE - all.length).toBe(21);
  });

  it('anchors the Hearth Hall inside 2..4 × 2..4, so it is inside every Rank (M4)', () => {
    const hall = CANONICAL_LAYOUT['hearth-hall'];
    expect(hall).toEqual({ x: 3, y: 3 });
    expect(hall.x).toBeGreaterThanOrEqual(HALL_ANCHOR.min);
    expect(hall.x).toBeLessThanOrEqual(HALL_ANCHOR.max);
    const hamlet = clearingBounds('hamlet');
    expect(hall.x + 1).toBeLessThanOrEqual(hamlet.maxX);
    expect(hall.y + 1).toBeLessThanOrEqual(hamlet.maxY);
  });

  it('puts each group in the Rank that opens it (M1)', () => {
    const inside = (
      id: (typeof HOLD_PIECE_IDS)[number],
      age: (typeof AGE_IDS)[number],
    ): boolean => {
      const b = clearingBounds(age);
      return tiles(id).every((t) => {
        const [x, y] = t.split(',').map(Number) as [number, number];
        return x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
      });
    };
    const hamlet = [
      'hearth-hall',
      'silver-seam-2',
      'smithy',
      'silver-seam-1',
      'mine-1',
      'mill',
      'sawpit',
      'farm-1',
      'woodcutter-1',
      'cottage-1',
      'cottage-2',
      'farm-2',
      'woodcutter-2',
    ] as const;
    for (const id of hamlet) expect(inside(id, 'hamlet'), id).toBe(true);
    for (const id of HOLD_PIECE_IDS) {
      if (/^(wall-([1-8])|watchtower-[12])$/.test(id)) {
        expect(inside(id, 'citadel'), `${id} in Citadel`).toBe(true);
      } else if (/^(wall-(9|10|11)|watchtower-3)$/.test(id)) {
        expect(inside(id, 'citadel'), `${id} not in Citadel`).toBe(false);
        expect(inside(id, 'bastion'), `${id} in Bastion`).toBe(true);
      } else expect(inside(id, 'keep'), `${id} in Keep`).toBe(true);
    }
  });
});
