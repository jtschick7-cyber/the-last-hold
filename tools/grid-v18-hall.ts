import { C, Canvas } from './pixel';
import {
  applyWineOutline,
  deriveFrostOverlay,
  drawArchedDoor,
  drawAshlarWall,
  drawMullionedWindow,
  drawShingledRoof,
} from './grid-v18-kit';

export const HALL_RANKS = ['hamlet', 'keep', 'citadel', 'bastion'] as const;
export type HallRank = (typeof HALL_RANKS)[number];

/** Shared doorway & left-window bounding boxes so HoldGrid overlays drop cleanly on top. */
export const HALL_DOOR_BOX = { x: 27, y: 44, w: 10, h: 18 } as const;
export const HALL_LAMP_BOX = { x: 14, y: 38, w: 6, h: 7 } as const;
const RIGHT_WINDOW_BOX = { x: 44, y: 38, w: 6, h: 7 } as const;

function drawBanner(c: Canvas, x: number, y: number, w: number, h: number): void {
  c.rect(x, y, 1, h + 4, C.bone);
  c.set(x, y - 1, C.gold);
  for (let j = 0; j < h; j++) {
    for (let i = 1; i <= w; i++) {
      const notch = i === w && (j === 0 || j === h - 1);
      if (notch) continue;
      if (j === 0 || i === 1) c.set(x + i, y + j, C.orange);
      else if (j === 2 && i >= 3 && i <= w - 2) c.set(x + i, y + j, C.gold);
      else c.set(x + i, y + j, j === h - 1 ? C.blood : C.red);
    }
  }
}

function drawSteppedPlinth(c: Canvas, x0: number, x1: number, y: number): void {
  c.rect(x0, y, x1 - x0 + 1, 2, C.coal);
  c.rect(x0, y, x1 - x0 + 1, 1, C.stone);
  c.rect(HALL_DOOR_BOX.x - 1, y, HALL_DOOR_BOX.w + 2, 2, C.ash);
  c.rect(HALL_DOOR_BOX.x, y + 1, HALL_DOOR_BOX.w, 1, C.stone);
}

function drawBattlementRow(c: Canvas, x0: number, x1: number, y: number, step = 6): void {
  c.rect(x0, y + 2, x1 - x0 + 1, 3, C.slate);
  c.rect(x0, y + 2, x1 - x0 + 1, 1, C.stone);
  for (let x = x0; x <= x1 - 3; x += step) {
    c.rect(x, y, 4, 3, C.stone);
    c.rect(x, y, 4, 1, C.bone);
    c.set(x, y + 1, C.ash);
    c.rect(x + 1, y + 2, 2, 1, C.slate);
  }
}

function drawChimney(c: Canvas, x: number, topY: number, botY: number): void {
  c.rect(x, topY, 6, botY - topY + 1, C.stone);
  drawAshlarWall(c, x, topY + 2, 6, botY - topY - 1, { rowH: 4, colW: 4, seed: 29 });
  c.rect(x - 1, topY, 8, 2, C.ash);
  c.rect(x - 1, topY, 8, 1, C.bone);
  c.set(x + 2, topY + 1, C.orange);
}

function drawHamlet(c: Canvas): void {
  drawChimney(c, 45, 9, 28);
  // Gabled timber & cedar-shingle roof
  drawShingledRoof(c, 6, 57, 13, 32, { palette: 'red', taper: 20, scallops: true });
  c.rect(8, 32, 48, 2, C.brownDark);
  // Half-timbered upper loft (y = 34..43)
  c.rect(10, 34, 44, 10, C.cream);
  for (let x = 10; x <= 53; x++) {
    c.set(x, 34, C.brownDark);
    if (x % 2 === 1) c.set(x, 35, C.sand);
  }
  c.rect(10, 42, 44, 2, C.clay);
  // Heavy oak posts & diagonal braces
  for (const px of [10, 23, 39, 52]) {
    c.rect(px, 34, 2, 28, C.brownDark);
    c.rect(px, 34, 1, 28, C.brown);
  }
  c.line(12, 36, 17, 42, C.brown, 1);
  c.line(51, 36, 46, 42, C.brown, 1);

  // Fitted oak horizontal log ground story (y = 44..60)
  for (let y = 44; y <= 60; y++) {
    const seam = y % 4 === 0;
    const tone = seam ? C.brownDark : y % 4 === 1 ? C.rust : C.brown;
    c.rect(10, y, 44, 1, tone);
  }
  for (const px of [10, 23, 39, 52]) {
    c.rect(px, 44, 2, 17, C.brownDark);
    c.rect(px, 44, 1, 17, C.clay);
  }

  drawSteppedPlinth(c, 10, 53, 60);
  drawArchedDoor(c, HALL_DOOR_BOX.x, HALL_DOOR_BOX.y, HALL_DOOR_BOX.w, HALL_DOOR_BOX.h);
  drawMullionedWindow(c, HALL_LAMP_BOX.x, HALL_LAMP_BOX.y, HALL_LAMP_BOX.w, HALL_LAMP_BOX.h);
  drawMullionedWindow(
    c,
    RIGHT_WINDOW_BOX.x,
    RIGHT_WINDOW_BOX.y,
    RIGHT_WINDOW_BOX.w,
    RIGHT_WINDOW_BOX.h,
    true,
  );
}

function drawKeep(c: Canvas): void {
  drawChimney(c, 47, 5, 25);
  // Blue heraldic slate gable roof
  drawShingledRoof(c, 6, 57, 10, 28, { palette: 'blue', taper: 20, scallops: true });
  c.rect(31, 6, 2, 4, C.bone);
  c.rect(30, 7, 4, 1, C.ash);
  c.rect(7, 28, 50, 2, C.plum);

  // Jetty timber & plaster gallery (y = 29..36)
  c.rect(9, 29, 46, 8, C.sand);
  c.rect(9, 29, 46, 2, C.cream);
  c.rect(9, 36, 46, 2, C.brownDark);
  for (const px of [9, 20, 31, 42, 53]) {
    c.rect(px, 29, 2, 8, C.brown);
    c.set(px, 37, C.clay);
  }
  // Decorative heraldic shields along the jetty
  c.rect(25, 31, 3, 3, C.blue);
  c.rect(36, 31, 3, 3, C.red);

  // Dressed stone lower keep (y = 38..60)
  drawAshlarWall(c, 10, 38, 44, 22, { rowH: 5, colW: 8, seed: 43 });
  // Corner stone quoins
  for (let y = 38; y <= 58; y += 5) {
    c.rect(10, y, 3, 4, C.bone);
    c.rect(51, y, 3, 4, C.slate);
  }

  drawSteppedPlinth(c, 10, 53, 60);
  drawArchedDoor(c, HALL_DOOR_BOX.x, HALL_DOOR_BOX.y, HALL_DOOR_BOX.w, HALL_DOOR_BOX.h, {
    stoneArch: true,
  });
  drawMullionedWindow(c, HALL_LAMP_BOX.x, HALL_LAMP_BOX.y, HALL_LAMP_BOX.w, HALL_LAMP_BOX.h);
  drawMullionedWindow(
    c,
    RIGHT_WINDOW_BOX.x,
    RIGHT_WINDOW_BOX.y,
    RIGHT_WINDOW_BOX.w,
    RIGHT_WINDOW_BOX.h,
  );
}

function drawTurret(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  bannerSide: 'left' | 'right',
): void {
  const roofBottom = y + 11;
  drawShingledRoof(c, x - 1, x + w, y + 3, roofBottom, {
    palette: 'red',
    taper: Math.floor(w / 2) - 1,
    scallops: false,
  });
  c.rect(x + Math.floor(w / 2), y, 1, 3, C.gold);
  if (bannerSide === 'left') {
    drawBanner(c, x + Math.floor(w / 2) - 4, y - 1, 4, 4);
  } else {
    drawBanner(c, x + Math.floor(w / 2), y - 1, 5, 4);
  }
  drawBattlementRow(c, x, x + w - 1, roofBottom + 1, 4);
  drawAshlarWall(c, x + 1, roofBottom + 6, w - 2, h - (roofBottom + 6) + y, {
    rowH: 5,
    colW: 5,
    seed: 71,
  });
  // Narrow arrow slits
  const slitX = x + Math.floor(w / 2);
  for (const sy of [roofBottom + 10, roofBottom + 24]) {
    c.rect(slitX - 1, sy, 3, 6, C.wine);
    c.rect(slitX, sy + 1, 1, 4, sy > 30 ? C.orange : C.ink);
  }
}

function drawCitadel(c: Canvas): void {
  // Left/center grand stone hall
  drawShingledRoof(c, 7, 44, 14, 28, { palette: 'blue', taper: 12, scallops: true });
  drawBattlementRow(c, 7, 43, 29, 6);
  drawAshlarWall(c, 8, 34, 36, 26, { rowH: 5, colW: 8, seed: 57 });

  // Dominant Citadel corner keep on the right
  drawTurret(c, 42, 4, 17, 56, 'right');

  // Plinth, gatehouse doorway, and windows
  drawSteppedPlinth(c, 8, 58, 60);
  drawArchedDoor(c, HALL_DOOR_BOX.x, HALL_DOOR_BOX.y, HALL_DOOR_BOX.w, HALL_DOOR_BOX.h, {
    stoneArch: true,
  });
  drawMullionedWindow(c, HALL_LAMP_BOX.x, HALL_LAMP_BOX.y, HALL_LAMP_BOX.w, HALL_LAMP_BOX.h);
  drawMullionedWindow(c, 39, 38, 5, 7);
}

function drawBastion(c: Canvas): void {
  // High raised central citadel hall with royal Hold standard
  drawShingledRoof(c, 13, 50, 9, 22, { palette: 'blue', taper: 12, scallops: true });
  drawBanner(c, 31, 2, 7, 5);
  drawBattlementRow(c, 12, 51, 23, 6);

  // Upper royal gallery with heraldic shields (hold-bastion.png reference)
  drawAshlarWall(c, 12, 28, 39, 8, { rowH: 4, colW: 7, seed: 83 });
  for (const sx of [21, 31, 41]) {
    c.rect(sx, 29, 3, 4, sx === 31 ? C.gold : C.blue);
    c.set(sx + 1, 30, sx === 31 ? C.red : C.ice);
  }

  // Lower bastion curtain wall
  drawAshlarWall(c, 11, 36, 42, 24, { rowH: 5, colW: 8, seed: 91 });

  // Symmetrical fortified twin corner towers
  drawTurret(c, 3, 6, 11, 54, 'right');
  drawTurret(c, 50, 6, 11, 54, 'right');

  drawSteppedPlinth(c, 3, 60, 60);
  drawArchedDoor(c, HALL_DOOR_BOX.x, HALL_DOOR_BOX.y, HALL_DOOR_BOX.w, HALL_DOOR_BOX.h, {
    stoneArch: true,
  });
  // Portcullis grille hint above bastion oak double gates
  for (let gx = HALL_DOOR_BOX.x + 2; gx <= HALL_DOOR_BOX.x + HALL_DOOR_BOX.w - 3; gx += 2) {
    c.rect(gx, HALL_DOOR_BOX.y + 3, 1, 4, C.ice);
  }
  drawMullionedWindow(c, HALL_LAMP_BOX.x, HALL_LAMP_BOX.y, HALL_LAMP_BOX.w, HALL_LAMP_BOX.h);
  drawMullionedWindow(
    c,
    RIGHT_WINDOW_BOX.x,
    RIGHT_WINDOW_BOX.y,
    RIGHT_WINDOW_BOX.w,
    RIGHT_WINDOW_BOX.h,
  );
}

/** Draws the v1.8 Hearth Hall at 64x64 px for the given Hold Rank. */
export function drawHallV18(rank: HallRank): Canvas {
  const c = new Canvas(64);
  if (rank === 'hamlet') drawHamlet(c);
  else if (rank === 'keep') drawKeep(c);
  else if (rank === 'citadel') drawCitadel(c);
  else drawBastion(c);
  applyWineOutline(c);
  return c;
}

/** Derived 64x64 carved gilded great door overlay aligned to HALL_DOOR_BOX. */
export function drawHallDoorV18(): Canvas {
  const c = new Canvas(64);
  const { x, y, w, h } = HALL_DOOR_BOX;
  c.rect(x, y + 1, w, h - 1, C.wine);
  c.rect(x + 1, y, w - 2, 1, C.gold);
  c.rect(x + 1, y + 1, 1, h - 2, C.gold);
  c.rect(x + w - 2, y + 1, 1, h - 2, C.orange);
  c.rect(x + 2, y + 2, w - 4, h - 3, C.brown);
  c.rect(x + Math.floor(w / 2), y + 2, 1, h - 3, C.wine);
  for (let sy = y + 4; sy < y + h - 2; sy += 3) {
    c.set(x + 3, sy, C.gold);
    c.set(x + w - 4, sy, C.gold);
  }
  return c;
}

/** Derived 64x64 warm lit window & brass bracket lamp overlay aligned to HALL_LAMP_BOX. */
export function drawHallLampV18(): Canvas {
  const c = new Canvas(64);
  const { x, y, w, h } = HALL_LAMP_BOX;
  c.rect(x, y, w, h, C.wine);
  c.rect(x + 1, y + 1, w - 2, h - 2, C.orange);
  c.rect(x + 2, y + 2, w - 4, h - 4, C.gold);
  c.set(x + 2, y + 2, C.cream);
  c.rect(x, y + h - 1, w, 1, C.brownDark);
  return c;
}

/** Derived 64x64 winter snow & icicle overlay traced cleanly along each rank's silhouette. */
export function drawHallFrostV18(rank: HallRank): Canvas {
  return deriveFrostOverlay(drawHallV18(rank), 1, 36);
}
