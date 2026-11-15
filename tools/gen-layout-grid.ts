// Writes the v1.1 grid art that TL.5a draws (plan TL.5a, D504): ground, forest, ruin, ghosts and the
// two border strips. The drawing lives in draw-layout-grid so tests can redraw and compare.
// Run: npx vite-node tools/gen-layout-grid.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  DENSITIES,
  drawBanners,
  drawBorderBell,
  drawBorderLanterns,
  drawPlot,
  drawSeam,
  drawTowerBell,
  drawWallFrost,
  drawWallLantern,
  PLOT_BUILDINGS,
  SEAM_LOOKS,
} from './draw-grid-plots';
import { drawWall, drawWatchtower, WALL_MASKS } from './draw-grid-defense';
import { drawLevelBuilding, drawTrophyHall, LEVEL_BUILDINGS, TIERS } from './draw-grid-buildings';
import { drawHall, drawHallDoor, drawHallFrost, drawHallLamp, HALL_RANKS } from './draw-grid-hall';
import { isV18Asset } from './contact-sheet-data';
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
const write = (id: string, file: string, png: Buffer): void => {
  if (isV18Asset(id)) return; // Preserve deployed v1.8 Zughy-32 pixel art (D623).
  const url = new URL(file, root);
  mkdirSync(new URL('./', url), { recursive: true });
  writeFileSync(url, png);
  console.log(`public/assets/${file}`);
};

for (const l of GROUND_LOOKS)
  write(`grid.ground.${l}`, `grid/ground-${l}.png`, drawGround(l).toPng());
for (const l of FOREST_LOOKS)
  write(`grid.forest.${l}`, `grid/forest-${l}.png`, drawForest(l).toPng());
for (const l of RUIN_LOOKS) write(`grid.ruin.${l}`, `grid/ruin-${l}.png`, drawRuin(l).toPng());
for (const l of GHOST_LOOKS) write(`grid.ghost.${l}`, `grid/ghost-${l}.png`, drawGhost(l).toPng());
for (const e of STRIP_EDGES) write(`grid.strip.${e}`, `grid/strip-${e}.png`, drawStripPng(e));

// TL.5b: defenses, level buildings and the Hearth Hall.
for (const m of WALL_MASKS) write(`grid.wall.${m}`, `grid/wall-${m}.png`, drawWall(m).toPng());
write('grid.watchtower', 'grid/watchtower.png', drawWatchtower().toPng());
for (const b of LEVEL_BUILDINGS)
  for (const t of TIERS)
    write(`grid.${b}.${t}`, `grid/${b}-${t}.png`, drawLevelBuilding(b, t).toPng());
write('grid.trophy-hall', 'grid/trophy-hall.png', drawTrophyHall().toPng());
for (const a of HALL_RANKS) {
  write(`grid.hearth-hall.${a}`, `grid/hearth-hall-${a}.png`, drawHall(a).toPng(64));
  write(
    `grid.hearth-hall.frost.${a}`,
    `grid/hearth-hall-frost-${a}.png`,
    drawHallFrost(a).toPng(64),
  );
}
write('grid.hearth-hall.door', 'grid/hearth-hall-door.png', drawHallDoor().toPng(64));
write('grid.hearth-hall.lamp', 'grid/hearth-hall-lamp.png', drawHallLamp().toPng(64));

// TL.5c: count-building plots and the grid cosmetics.
for (const b of PLOT_BUILDINGS)
  for (const d of DENSITIES) write(`grid.${b}.${d}`, `grid/${b}-${d}.png`, drawPlot(b, d).toPng());
for (const l of SEAM_LOOKS)
  write(`grid.silver-seam.${l}`, `grid/silver-seam-${l}.png`, drawSeam(l).toPng());
write('grid.cosmetic.banners', 'grid/cosmetic-banners.png', drawBanners().toPng(16));
write('grid.cosmetic.bell-tower', 'grid/cosmetic-bell-tower.png', drawTowerBell().toPng());
write('grid.cosmetic.bell-border', 'grid/cosmetic-bell-border.png', drawBorderBell().toPng());
write('grid.cosmetic.lanterns-wall', 'grid/cosmetic-lanterns-wall.png', drawWallLantern().toPng());
write(
  'grid.cosmetic.lanterns-border',
  'grid/cosmetic-lanterns-border.png',
  drawBorderLanterns().toPng(16),
);
write('grid.frost.wall', 'grid/frost-wall.png', drawWallFrost().toPng());
