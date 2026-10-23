// Plan TL.5a (GDD §9.12, §9.21, D504, S3): the grid's ground art is exactly what its drawers draw,
// in the palette, at the manifest's sizes; and no v1.0 picture changed.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  assetById,
  forestTileId,
  ghostTileId,
  groundTileId,
  gridStripId,
  ruinTileId,
} from '../../src/content/assets';
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
    else expect(transparent).toBeGreaterThan(png.width * png.height * 0.8);
  });

  it('the ghosts differ from each other, and the ground looks differ', () => {
    expect(drawGhost('locked').px).not.toEqual(drawGhost('dormant').px);
    expect(new Set(GROUND_LOOKS.map((l) => drawGround(l).px.join())).size).toBe(3);
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
