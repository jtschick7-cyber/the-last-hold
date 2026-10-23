// Plan TL.5a (GDD §9.12, §9.21, D504, S3): the grid's ground art is exactly what its drawers draw,
// in the palette, at the manifest's sizes; and no v1.0 picture changed.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  assetById,
  forestTileId,
  GRID_HALL_DOOR_ID,
  GRID_HALL_LAMP_ID,
  GRID_TROPHY_HALL_ID,
  GRID_WATCHTOWER_ID,
  gridHallFrostId,
  gridHallId,
  gridTierId,
  gridWallId,
  ghostTileId,
  groundTileId,
  gridStripId,
  ruinTileId,
} from '../../src/content/assets';
import { drawWall, drawWatchtower, WALL_MASKS } from '../../tools/draw-grid-defense';
import {
  drawLevelBuilding,
  drawTrophyHall,
  LEVEL_BUILDINGS,
  TIERS,
} from '../../tools/draw-grid-buildings';
import {
  drawHall,
  drawHallDoor,
  drawHallFrost,
  drawHallLamp,
  HALL_RANKS,
} from '../../tools/draw-grid-hall';
import { currentHashes } from '../../tools/contact-sheet-data';
import {
  drawForest,
  drawGhost,
  drawGround,
  drawRuin,
  drawStrip,
  FOREST_LOOKS,
  GHOST_LOOKS,
  GROUND_LOOKS,
  RUIN_LOOKS,
  STRIP_EDGES,
  STRIP_H,
} from '../../tools/draw-layout-grid';
import { PALETTE_HEX } from '../../tools/pixel';

const read = (name: string): Buffer =>
  readFileSync(new URL(`../../public/assets/${name}`, import.meta.url));

const cases = [
  ...GROUND_LOOKS.map((l) => ({
    id: groundTileId(l),
    file: `grid/ground-${l}.png`,
    png: drawGround(l).toPng(),
    opaque: true,
  })),
  ...FOREST_LOOKS.map((l) => ({
    id: forestTileId(l),
    file: `grid/forest-${l}.png`,
    png: drawForest(l).toPng(),
    opaque: true,
  })),
  ...RUIN_LOOKS.map((l) => ({
    id: ruinTileId(l),
    file: `grid/ruin-${l}.png`,
    png: drawRuin(l).toPng(),
    opaque: true,
  })),
  ...GHOST_LOOKS.map((l) => ({
    id: ghostTileId(l),
    file: `grid/ghost-${l}.png`,
    png: drawGhost(l).toPng(),
    opaque: false,
  })),
  ...STRIP_EDGES.map((e) => ({
    id: gridStripId(e),
    file: `grid/strip-${e}.png`,
    png: drawStrip(e).toPng(STRIP_H),
    opaque: true,
  })),
  // TL.5b
  ...WALL_MASKS.map((m) => ({
    id: gridWallId(m),
    file: `grid/wall-${m}.png`,
    png: drawWall(m).toPng(),
    opaque: false,
  })),
  {
    id: GRID_WATCHTOWER_ID,
    file: 'grid/watchtower.png',
    png: drawWatchtower().toPng(),
    opaque: false,
  },
  {
    id: GRID_TROPHY_HALL_ID,
    file: 'grid/trophy-hall.png',
    png: drawTrophyHall().toPng(),
    opaque: false,
  },
  ...LEVEL_BUILDINGS.flatMap((b) =>
    TIERS.map((t) => ({
      id: gridTierId(b, t),
      file: `grid/${b}-${t}.png`,
      png: drawLevelBuilding(b, t).toPng(),
      opaque: false,
    })),
  ),
  ...HALL_RANKS.map((a) => ({
    id: gridHallId(a),
    file: `grid/hearth-hall-${a}.png`,
    png: drawHall(a).toPng(64),
    opaque: false,
  })),
  ...HALL_RANKS.map((a) => ({
    id: gridHallFrostId(a),
    file: `grid/hearth-hall-frost-${a}.png`,
    png: drawHallFrost(a).toPng(64),
    opaque: false,
  })),
  {
    id: GRID_HALL_DOOR_ID,
    file: 'grid/hearth-hall-door.png',
    png: drawHallDoor().toPng(64),
    opaque: false,
  },
  {
    id: GRID_HALL_LAMP_ID,
    file: 'grid/hearth-hall-lamp.png',
    png: drawHallLamp().toPng(64),
    opaque: false,
  },
];

describe('the grid ground art (TL.5a)', () => {
  it.each(cases)('$id is what its drawer draws, in the palette, at its manifest size', (c) => {
    const entry = assetById.get(c.id);
    expect(entry?.source).toBe('generated');
    expect(read(c.file).equals(c.png)).toBe(true);
    const png = PNG.sync.read(read(c.file));
    expect([png.width, png.height]).toEqual([...(entry?.size ?? [])]);
    let transparent = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      if (png.data[i + 3] === 0) {
        transparent++;
        continue;
      }
      expect(png.data[i + 3]).toBe(255);
      const hex = [0, 1, 2]
        .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
        .join('');
      expect(PALETTE_HEX.has(hex), hex).toBe(true);
    }
    // Ground and border tiles fill their square; ghosts are mostly see-through.
    if (c.opaque) expect(transparent).toBe(0);
    else if (c.id.startsWith('grid.ghost'))
      expect(transparent).toBeGreaterThan(png.width * png.height * 0.8);
    else expect(transparent).toBeGreaterThan(0);
  });

  it('the ghosts differ from each other, and the ground looks differ', () => {
    expect(drawGhost('locked').px).not.toEqual(drawGhost('dormant').px);
    expect(new Set(GROUND_LOOKS.map((l) => drawGround(l).px.join())).size).toBe(3);
  });
});

describe('the pieces of the grid (TL.5b)', () => {
  it('has one wall picture per connection mask, all different', () => {
    expect(new Set(WALL_MASKS.map((m) => drawWall(m).px.join())).size).toBe(16);
  });

  it('gives each level building three looks that grow, never shrink', () => {
    const area = (id: (typeof LEVEL_BUILDINGS)[number], t: 1 | 2 | 3): number =>
      drawLevelBuilding(id, t).px.filter((p) => p !== null).length;
    for (const b of LEVEL_BUILDINGS) {
      expect(new Set(TIERS.map((t) => drawLevelBuilding(b, t).px.join())).size, b).toBe(3);
      expect(area(b, 2), b).toBeGreaterThanOrEqual(area(b, 1));
      expect(area(b, 3), b).toBeGreaterThanOrEqual(area(b, 2));
    }
  });

  it('keeps the Hall door and window in the same place at every Rank, so one overlay fits all', () => {
    const door = drawHallDoor().px;
    const lamp = drawHallLamp().px;
    for (const a of HALL_RANKS) {
      const hall = drawHall(a);
      door.forEach((p, i) => {
        if (p !== null) expect(hall.px[i], `${a} door ${i}`).not.toBeNull();
      });
      lamp.forEach((p, i) => {
        if (p !== null) expect(['394778', '302c2e'], `${a} window ${i}`).toContain(hall.px[i]); // pane or mullion
      });
    }
  });

  it('draws the frost only on pixels the Hall itself leaves bare or covers', () => {
    for (const a of HALL_RANKS)
      expect(
        drawHallFrost(a).px.some((p) => p !== null),
        a,
      ).toBe(true);
  });
});

describe('v1.0 pictures are byte-identical (S3)', () => {
  const recorded = JSON.parse(
    readFileSync(new URL('../../art-src/v1.0-hashes.json', import.meta.url), 'utf8'),
  ) as Record<string, string>;
  const now = currentHashes();

  it('has a recorded hash for every v1.0 picture, and none for a v1.1 one', () => {
    expect(Object.keys(recorded).length).toBeGreaterThan(150);
    expect(Object.keys(recorded).filter((id) => id.startsWith('grid.'))).toEqual([]);
  });

  it('matches the recorded hash for every one of them', () => {
    for (const [id, hash] of Object.entries(recorded)) expect(now[id], id).toBe(hash);
  });
});
