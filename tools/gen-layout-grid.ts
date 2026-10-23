// Writes the v1.1 grid art that TL.5a draws (plan TL.5a, D504): ground, forest, ruin, ghosts and the
// two border strips. The drawing lives in draw-layout-grid so tests can redraw and compare.
// Run: npx vite-node tools/gen-layout-grid.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { drawWall, drawWatchtower, WALL_MASKS } from './draw-grid-defense';
import { drawLevelBuilding, drawTrophyHall, LEVEL_BUILDINGS, TIERS } from './draw-grid-buildings';
import { drawHall, drawHallDoor, drawHallFrost, drawHallLamp, HALL_RANKS } from './draw-grid-hall';
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

// TL.5b: defenses, level buildings and the Hearth Hall.
for (const m of WALL_MASKS) write(`grid/wall-${m}.png`, drawWall(m).toPng());
write('grid/watchtower.png', drawWatchtower().toPng());
for (const b of LEVEL_BUILDINGS)
  for (const t of TIERS) write(`grid/${b}-${t}.png`, drawLevelBuilding(b, t).toPng());
write('grid/trophy-hall.png', drawTrophyHall().toPng());
for (const a of HALL_RANKS) {
  write(`grid/hearth-hall-${a}.png`, drawHall(a).toPng(64));
  write(`grid/hearth-hall-frost-${a}.png`, drawHallFrost(a).toPng(64));
}
write('grid/hearth-hall-door.png', drawHallDoor().toPng(64));
write('grid/hearth-hall-lamp.png', drawHallLamp().toPng(64));
