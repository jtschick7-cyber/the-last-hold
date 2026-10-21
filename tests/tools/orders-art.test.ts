// Plan T10.15 (Q36 (a), D427): the Orders' marks, the card's icon and the opening-scene placeholders
// are drawn in code, have manifest rows, match their generator and stay in the palette.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { assetById, ORDERS_ICON, orderMarkId, orderSceneId } from '../../src/content/assets';
import { ORDER_IDS } from '../../src/content/orders';
import {
  drawOrderMark,
  drawOrderScene,
  drawOrdersIcon,
  ORDER_SCENE_H,
} from '../../tools/draw-orders';
import { PALETTE_HEX } from '../../tools/pixel';

const cases = [
  { row: ORDERS_ICON, drawn: () => drawOrdersIcon().toPng() },
  ...ORDER_IDS.flatMap((id) => [
    { row: orderMarkId(id), drawn: () => drawOrderMark(id).toPng() },
    { row: orderSceneId(id), drawn: () => drawOrderScene(id).toPng(ORDER_SCENE_H) },
  ]),
];

const fileOf = (row: string): string => {
  const entry = assetById.get(row);
  if (entry?.source !== 'generated') throw new Error(`${row} is not a generated row`);
  return entry.file;
};

describe('the v0.10 art', () => {
  it('has a generated row for the card icon, and a mark and a scene for each Order', () => {
    expect(cases).toHaveLength(1 + ORDER_IDS.length * 2);
    for (const c of cases) expect(assetById.get(c.row)?.source, c.row).toBe('generated');
  });

  it.each(cases)('$row matches its generator, its manifest size and the palette', (c) => {
    const name = fileOf(c.row);
    const file = readFileSync(new URL(`../../public/assets/${name}`, import.meta.url));
    expect(file.equals(c.drawn()), `${name} is stale: rerun tools/gen-sprites.ts`).toBe(true);
    const png = PNG.sync.read(file);
    expect([png.width, png.height], c.row).toEqual([...(assetById.get(c.row)?.size ?? [])]);
    for (let i = 0; i < png.data.length; i += 4) {
      if ((png.data[i + 3] ?? 0) === 0) continue;
      const hex = [0, 1, 2]
        .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
        .join('');
      expect(PALETTE_HEX.has(hex), `${name} pixel ${i / 4}: ${hex}`).toBe(true);
    }
  });

  it('draws each Order differently', () => {
    const marks = new Set(ORDER_IDS.map((id) => drawOrderMark(id).toPng().toString('base64')));
    const scenes = new Set(ORDER_IDS.map((id) => drawOrderScene(id).toPng().toString('base64')));
    expect([marks.size, scenes.size]).toEqual([ORDER_IDS.length, ORDER_IDS.length]);
  });
});
