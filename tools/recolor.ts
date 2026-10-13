// Technical design §12.2: maps every pixel of a pack PNG to the nearest palette
// color (OKLab) and writes the result to public/assets/. Originals stay in
// art-src/ for re-runs. Pixels under half opacity become fully transparent;
// the rest become opaque, keeping pixel art crisp.
//
// The command line is tools/recolor-cli.ts.
import { PNG } from 'pngjs';
import { nearestIn } from './color/oklab';

const OPAQUE_FROM = 128;

/** Recolors an RGBA PNG in memory; returns the new PNG bytes. */
export const recolorPng = (input: Buffer, palette: readonly string[]): Buffer => {
  const img = PNG.sync.read(input);
  const nearest = nearestIn(palette);
  for (let i = 0; i < img.data.length; i += 4) {
    const alpha = img.data[i + 3] ?? 0;
    if (alpha < OPAQUE_FROM) {
      img.data.fill(0, i, i + 4);
      continue;
    }
    const [r, g, b] = nearest([img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0]);
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = 255;
  }
  return PNG.sync.write(img);
};
