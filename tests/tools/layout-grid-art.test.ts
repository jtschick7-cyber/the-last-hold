// Plan TL.5a (GDD §9.12, §9.21, D504, S3): the grid's ground art is exactly what its drawers draw,
// in the palette, at the manifest's sizes; and no v1.0 picture changed.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  assetById,
  forestTileId,
  GRID_COSMETIC_IDS,
  GRID_HALL_DOOR_ID,
  GRID_WALL_FROST_ID,
  gridCosmeticId,
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
import {
  DENSITIES,
  drawBanners,
  drawBorderBell,
  drawBorderLanterns,
  drawPlot,
  drawSeam,
  drawTowerBell,
  drawWallFrost,
  drawWallLantern,
  PLOT_BUILDINGS,
  SEAM_LOOKS,
} from '../../tools/draw-grid-plots';
import { currentHashes, redrawIds } from '../../tools/contact-sheet-data';
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
  // TL.5c
  ...PLOT_BUILDINGS.flatMap((b) =>
    DENSITIES.map((d) => ({
      id: gridTierId(b, d),
      file: `grid/${b}-${d}.png`,
      png: drawPlot(b, d).toPng(),
      opaque: false,
    })),
  ),
  ...SEAM_LOOKS.map((l) => ({
    id: gridTierId('silver-seam', l),
    file: `grid/silver-seam-${l}.png`,
    png: drawSeam(l).toPng(),
    opaque: false,
  })),
  {
    id: gridCosmeticId('banners'),
    file: 'grid/cosmetic-banners.png',
    png: drawBanners().toPng(16),
    opaque: false,
  },
  {
    id: gridCosmeticId('bell-tower'),
    file: 'grid/cosmetic-bell-tower.png',
    png: drawTowerBell().toPng(),
    opaque: false,
  },
  {
    id: gridCosmeticId('bell-border'),
    file: 'grid/cosmetic-bell-border.png',
    png: drawBorderBell().toPng(),
    opaque: false,
  },
  {
    id: gridCosmeticId('lanterns-wall'),
    file: 'grid/cosmetic-lanterns-wall.png',
    png: drawWallLantern().toPng(),
    opaque: false,
  },
  {
    id: gridCosmeticId('lanterns-border'),
    file: 'grid/cosmetic-lanterns-border.png',
    png: drawBorderLanterns().toPng(16),
    opaque: false,
  },
  {
    id: GRID_WALL_FROST_ID,
    file: 'grid/frost-wall.png',
    png: drawWallFrost().toPng(),
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

describe('plots and cosmetics (TL.5c)', () => {
  it('shows three densities per plot and two Silver Seam looks, all different', () => {
    for (const b of PLOT_BUILDINGS)
      expect(new Set(DENSITIES.map((d) => drawPlot(b, d).px.join())).size, b).toBe(3);
    expect(drawSeam(1).px).not.toEqual(drawSeam(2).px);
  });

  it('has a manifest row for each of the 83 pieces of the grid art (11 + 49 + 23)', () => {
    const grid = [...assetById.keys()].filter((id) => id.startsWith('grid.'));
    expect(grid).toHaveLength(83);
    for (const c of GRID_COSMETIC_IDS) expect(assetById.has(gridCosmeticId(c)), c).toBe(true);
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

describe('v1.1 pictures marked Keep are byte-identical (D475, D504)', () => {
  const recorded = JSON.parse(
    readFileSync(new URL('../../art-src/v1.1-hashes.json', import.meta.url), 'utf8'),
  ) as Record<string, string>;
  const redraw = redrawIds(
    readFileSync(new URL('../../docs/flesh-out/v1.1/art-marks.md', import.meta.url), 'utf8'),
  );
  const now = currentHashes();

  it('has a recorded hash for every grid picture', () => {
    for (const id of [...assetById.keys()].filter((i) => i.startsWith('grid.')))
      expect(recorded[id], id).toBeDefined();
  });

  it('matches the recorded hash for every picture not marked Redraw', () => {
    for (const [id, hash] of Object.entries(recorded)) {
      if (redraw.has(id)) continue;
      expect(now[id], id).toBe(hash);
    }
  });

  it('reads the owner marks: 25 Redraw', () => {
    expect(redraw.size).toBe(25);
  });
});
