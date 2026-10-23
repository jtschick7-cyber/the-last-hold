// Writes the v1.1 grid art that TL.5a draws (plan TL.5a, D504): ground, forest, ruin, ghosts and the
// two border strips. The drawing lives in draw-layout-grid so tests can redraw and compare.
// Run: npx vite-node tools/gen-layout-grid.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  drawForest,
  drawGhost,
  drawGround,
  drawRuin,
  drawStripPng,
  FOREST_LOOKS,
  GHOST_LOOKS,
  GROUND_LOOKS,
  RUIN_LOOKS,
  STRIP_EDGES,
} from './draw-layout-grid';

const root = new URL('../public/assets/', import.meta.url);
const write = (file: string, png: Buffer): void => {
  const url = new URL(file, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, png);
  console.log(`public/assets/${file}`);
};

for (const l of GROUND_LOOKS) write(`grid/ground-${l}.png`, drawGround(l).toPng());
for (const l of FOREST_LOOKS) write(`grid/forest-${l}.png`, drawForest(l).toPng());
for (const l of RUIN_LOOKS) write(`grid/ruin-${l}.png`, drawRuin(l).toPng());
for (const l of GHOST_LOOKS) write(`grid/ghost-${l}.png`, drawGhost(l).toPng());
for (const e of STRIP_EDGES) write(`grid/strip-${e}.png`, drawStripPng(e));
