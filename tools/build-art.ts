// Plan T1.31a: builds every recipe in tools/art-recipes.ts. It cuts 16 px tiles
// from the pack sheets, stacks the layers, recolors to the palette (OKLab
// nearest, technical design §12.2) and writes public/assets/<file>.
// Run after unpacking the zips in art-src/ into art-src/packs/:
//   npx vite-node tools/build-art.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';
import { palette } from '../src/content/palette';
import { recipes, SHEETS, type Recipe, type SheetId } from './art-recipes';
import { recolorPng } from './recolor';

const TILE = 16;
const root = new URL('../', import.meta.url);
const sheets = new Map<SheetId, PNG>();
const sheet = (id: SheetId): PNG => {
  let png = sheets.get(id);
  if (!png) {
    png = PNG.sync.read(readFileSync(new URL(SHEETS[id].path, root)));
    sheets.set(id, png);
  }
  return png;
};

/** Composes a recipe's layers at 1×: opaque source pixels cover what's below. */
export const compose = (r: Recipe): PNG => {
  const src = sheet(r.sheet);
  const cols = SHEETS[r.sheet].cols;
  const first = r.layers[0] ?? [];
  const h = first.length * TILE;
  const w = (first[0]?.length ?? 0) * TILE;
  const out = new PNG({ width: w, height: h });
  for (const layer of r.layers) {
    layer.forEach((row, ty) =>
      row.forEach((tile, tx) => {
        if (tile === null) return;
        const sx0 = (tile % cols) * TILE;
        const sy0 = Math.floor(tile / cols) * TILE;
        for (let y = 0; y < TILE; y++) {
          for (let x = 0; x < TILE; x++) {
            const s = ((sy0 + y) * src.width + sx0 + x) * 4;
            if ((src.data[s + 3] ?? 0) < 128) continue;
            const d = ((ty * TILE + y) * w + tx * TILE + x) * 4;
            src.data.copy(out.data, d, s, s + 4);
          }
        }
      }),
    );
  }
  return out;
};

if (!palette) throw new Error('Choose a palette first (src/content/palette.ts).');
for (const r of recipes) {
  const target = new URL(`public/assets/${r.file}`, root);
  mkdirSync(dirname(target.pathname), { recursive: true });
  writeFileSync(target, recolorPng(PNG.sync.write(compose(r)), palette.colors));
  console.log(`${r.id} → public/assets/${r.file}`);
}
