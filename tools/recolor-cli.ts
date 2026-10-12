// Recolors pack PNGs to the palette (technical design §12.2).
// Run: npx vite-node tools/recolor-cli.ts -- <palette-id> <in.png> <out.png> [<in.png> <out.png> …]
// <palette-id> is "chosen" (src/content/palette.ts, once picked) or a candidate id.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { palette } from '../src/content/palette';
import { paletteCandidates } from '../src/content/palette-candidates';
import { recolorPng } from './recolor';

const paletteFor = (id: string): readonly string[] => {
  if (id === 'chosen') {
    if (!palette) throw new Error('No palette chosen yet (src/content/palette.ts).');
    return palette.colors;
  }
  const c = paletteCandidates.find((p) => p.id === id);
  if (!c) throw new Error(`Unknown palette "${id}".`);
  return c.colors;
};

const main = (): void => {
  const [id, ...files] = process.argv.slice(2).filter((a) => a !== '--');
  if (!id || files.length === 0 || files.length % 2 !== 0) {
    throw new Error('Usage: recolor-cli.ts <palette-id> <in.png> <out.png> [...]');
  }
  const colors = paletteFor(id);
  for (let i = 0; i < files.length; i += 2) {
    const [from, to] = [files[i] ?? '', files[i + 1] ?? ''];
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, recolorPng(readFileSync(from), colors));
    console.log(`${from} → ${to}`);
  }
};

main();
