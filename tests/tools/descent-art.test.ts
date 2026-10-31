// Plan TD.5 (D565, S12): The Unlit's portrait and battle sprite and the Descent's three banners are
// drawn in code, have manifest rows, match their generator, sizes and the palette, and are numbered on
// their own 1 to 5 without moving the v1.0 or v1.1 numbers.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  assetById,
  descentSceneId,
  UNLIT_PORTRAIT_ID,
  UNLIT_SPRITE_ID,
} from '../../src/content/assets';
import { currentHashes, numberedAssets, v14Numbered } from '../../tools/contact-sheet-data';
import { DESCENT_SCENE_H, drawDescentScene, drawUnlitFrames } from '../../tools/draw-descent';
import { PALETTE_HEX } from '../../tools/pixel';
import { stripPng } from '../../tools/sprite-frames';

const cases = [
  { row: UNLIT_PORTRAIT_ID, drawn: null, size: [64, 64] },
  {
    row: UNLIT_SPRITE_ID,
    drawn: () => stripPng(drawUnlitFrames()),
    size: [160, 32],
  },
  ...([1, 2, 3] as const).map((n) => ({
    row: descentSceneId(n),
    drawn: () => drawDescentScene(n).toPng(DESCENT_SCENE_H),
    size: [160, 64],
  })),
];

const fileOf = (row: string): string => {
  const entry = assetById.get(row);
  if (entry?.source !== 'generated') throw new Error(`${row} is not a generated row`);
  return entry.file;
};

describe('the v1.4 art', () => {
  it.each(cases)('$row matches its generator, its manifest size and the palette', (c) => {
    expect(assetById.get(c.row)?.size, c.row).toEqual(c.size);
    const name = fileOf(c.row);
    const file = readFileSync(new URL(`../../public/assets/${name}`, import.meta.url));
    if (c.drawn) {
      expect(file.equals(c.drawn()), `${name} is stale: rerun tools/gen-descent.ts`).toBe(true);
    }
    const png = PNG.sync.read(file);
    expect([png.width, png.height], c.row).toEqual(c.size);
    let drawn = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      if ((png.data[i + 3] ?? 0) === 0) continue;
      drawn++;
      const hex = [0, 1, 2]
        .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
        .join('');
      expect(PALETTE_HEX.has(hex), `${name} pixel ${i / 4}: ${hex}`).toBe(true);
    }
    expect(drawn, `${name} is not blank`).toBeGreaterThan(100);
  });

  it('draws three different banners', () => {
    const px = [1, 2, 3].map((n) => JSON.stringify(drawDescentScene(n as 1 | 2 | 3).px));
    expect(new Set(px).size).toBe(3);
  });

  it('gives The Unlit a strip of five different frames', () => {
    const f = drawUnlitFrames();
    const keys = Object.values(f).map((c) => JSON.stringify(c.px));
    expect(new Set(keys).size).toBe(5);
  });

  it('is numbered 1 to 5 on its own and leaves the v1.0 sequence alone', () => {
    expect(v14Numbered.map((x) => x.n)).toEqual([1, 2, 3, 4, 5]);
    expect(v14Numbered.map((x) => x.asset.id)).toEqual(cases.map((c) => c.row));
    const v10 = new Set(numberedAssets.map((x) => x.asset.id));
    for (const c of cases) expect(v10.has(c.row), c.row).toBe(false);
  });
});

describe('the approved v1.4 pictures are frozen (S12)', () => {
  const recorded = JSON.parse(
    readFileSync(new URL('../../art-src/v1.4-hashes.json', import.meta.url), 'utf8'),
  ) as Record<string, string>;

  it('records a hash for each of the five and nothing else', () => {
    expect(Object.keys(recorded).sort()).toEqual(cases.map((c) => c.row).sort());
  });

  it('matches the recorded hash for every one of them', () => {
    const now = currentHashes();
    for (const [id, hash] of Object.entries(recorded)) expect(now[id], id).toBe(hash);
  });
});
