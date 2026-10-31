// Writes the v1.4 art (plan TD.5, D565): The Unlit's portrait and battle sprite strip, and the three
// stage banners of the Descent. The drawing lives in draw-descent.ts so tests can redraw and compare.
// Run: npx vite-node tools/gen-descent.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { drawUnlitFrames } from './draw-descent';
import { stripPng } from './sprite-frames';

const root = new URL('../public/assets/', import.meta.url);
const write = (file: string, png: Buffer): void => {
  const url = new URL(file, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, png);
  console.log(`public/assets/${file}`);
};

// The Unlit's portrait (v1.6 D600) and Descent stage banners (v1.6 D602) are frozen pixel art assets.
write('sprites/monster-unlit.png', stripPng(drawUnlitFrames()));
