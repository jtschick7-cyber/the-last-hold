// Writes the committed portrait PNGs; the drawing lives in draw-hunter.ts so tests can reuse it.
// Run: npx vite-node tools/gen-portraits.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { HUNTER_IDS, hunters } from '../src/content/hunters';
import { drawHunter } from './draw-hunter';

const out = new URL('../public/assets/portraits/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const id of HUNTER_IDS) {
  writeFileSync(new URL(`${id}.png`, out), drawHunter(hunters[id].portrait).toPng());
  console.log(`portrait.hunter.${id} → public/assets/portraits/${id}.png`);
}
