// Writes the v1.4 art (plan TD.5, D565): The Unlit's portrait and battle sprite strip, and the three
// stage banners of the Descent. The drawing lives in draw-descent.ts so tests can redraw and compare.
// Run: npx vite-node tools/gen-descent.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  DESCENT_SCENE_H,
  drawDescentScene,
  drawUnlitPortrait,
  drawUnlitSprite,
} from './draw-descent';
import { framesOf, stripPng } from './sprite-frames';

const root = new URL('../public/assets/', import.meta.url);
const write = (file: string, png: Buffer): void => {
  const url = new URL(file, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, png);
  console.log(`public/assets/${file}`);
};

write('portraits/monster-unlit.png', drawUnlitPortrait().toPng());
write('sprites/monster-unlit.png', stripPng(framesOf(drawUnlitSprite(), 'left')));
for (const n of [1, 2, 3] as const)
  write(`scenes/descent-stage-${n}.png`, drawDescentScene(n).toPng(DESCENT_SCENE_H));
