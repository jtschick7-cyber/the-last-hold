import { applyWineOutline, mixHash } from './grid-v18-kit';
import { C, Canvas } from './pixel';

export const BATCH2_PLOT_FAMILIES = ['cottage', 'farm', 'woodcutter', 'mine'] as const;
export type Batch2PlotFamily = (typeof BATCH2_PLOT_FAMILIES)[number];

/** Draws a cottage homestead with plaster walls, timber trim, red gable, and stone base. */
function drawLittleCottage(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  doorLeft: boolean,
  chimneySide: 'left' | 'right',
): void {
  const roofH = Math.max(5, Math.floor(h * 0.45));
  const wallY = y + roofH;
  const wallH = h - roofH;
  const cx = x + Math.floor(w / 2);

  // Lime-plaster walls with timber corner posts and stone plinth
  c.rect(x + 1, wallY, w - 2, wallH, C.cream);
  c.rect(x + 1, wallY, w - 2, 1, C.sand);
  c.rect(x + 1, wallY + wallH - 2, w - 2, 2, C.stone);
  c.rect(x + 1, wallY, 1, wallH - 1, C.brownDark);
  c.rect(x + w - 2, wallY, 1, wallH - 1, C.brownDark);
  c.rect(x + 1, wallY + Math.floor(wallH * 0.45), w - 2, 1, C.brown);

  // Brick chimney pot anchored into roof slope
  const chX = chimneySide === 'right' ? x + w - 4 : x + 2;
  c.rect(chX, y - 2, 2, roofH + 2, C.brown);
  c.rect(chX, y - 2, 2, 1, C.clay);
  c.set(chX, y - 3, C.ash);

  // Terracotta pitched gable roof with subtle shingle steps
  for (let row = 0; row < roofH; row++) {
    const ry = y + row;
    const span = Math.max(2, Math.round((w * (row + 1)) / roofH));
    const rx0 = cx - Math.floor(span / 2);
    for (let rx = rx0; rx < rx0 + span; rx++) {
      const n = mixHash(rx, ry, 71 + x);
      const col =
        row === 0
          ? C.clay
          : row === roofH - 1
            ? C.wine
            : n === 0
              ? C.clay
              : n === 1
                ? C.red
                : C.rust;
      c.set(rx, ry, col);
    }
  }
  c.rect(cx - 1, y, 2, 1, C.sand);

  // Door + lit cottage window
  const doorW = Math.min(3, Math.max(2, Math.floor(w / 5)));
  const doorH = Math.min(4, Math.max(3, wallH - 2));
  const doorX = doorLeft ? x + 3 : x + w - 3 - doorW;
  const winX = doorLeft ? x + w - 5 : x + 3;
  c.rect(doorX, wallY + wallH - doorH, doorW, doorH, C.brownDark);
  c.rect(doorX, wallY + wallH - doorH, doorW, 1, C.brown);
  if (w >= 11) {
    c.rect(winX, wallY + 2, 2, 2, C.gold);
  }
}

function drawCottage(c: Canvas, density: 1 | 2 | 3): void {
  if (density === 1) {
    drawLittleCottage(c, 8, 10, 16, 16, true, 'right');
    // Grounded doorstep stone + tucked flower planter box along front plinth
    c.rect(10, 25, 4, 2, C.ash);
    c.rect(17, 24, 6, 3, C.brown);
    c.rect(17, 23, 6, 2, C.moss);
    c.set(18, 23, C.gold);
    c.set(21, 23, C.red);
    return;
  }

  if (density === 2) {
    // Flagged doorstep path + picket fence joining two cottages directly without an oval plate
    c.rect(8, 18, 10, 8, C.stone);
    c.rect(9, 19, 8, 6, C.ash);
    c.rect(5, 20, 7, 2, C.brown);
    drawLittleCottage(c, 3, 6, 13, 14, false, 'left');
    drawLittleCottage(c, 15, 13, 14, 15, true, 'right');
    c.rect(17, 27, 4, 2, C.ash);
    return;
  }

  // Density 3: 3-cottage hamlet joined cleanly via central flagstone lane & front shrub beds
  c.rect(10, 14, 12, 10, C.stone);
  c.rect(12, 15, 8, 8, C.ash);
  drawLittleCottage(c, 2, 6, 12, 12, false, 'left');
  drawLittleCottage(c, 18, 6, 12, 12, true, 'right');
  drawLittleCottage(c, 8, 15, 16, 14, true, 'right');
  c.rect(11, 28, 4, 2, C.ash);
  c.rect(5, 25, 3, 3, C.moss);
  c.rect(24, 25, 3, 3, C.moss);
}

/** Draws weathered split-rail oak posts & top/bottom fence bars cleanly connected. */
function drawSplitRailFence(c: Canvas, x0: number, x1: number, y: number): void {
  c.rect(x0, y + 1, x1 - x0 + 1, 1, C.brown);
  c.rect(x0, y + 3, x1 - x0 + 1, 1, C.brownDark);
  for (let px = x0; px <= x1; px += 5) {
    c.rect(px, y, 2, 5, C.brownDark);
    c.set(px, y, C.sand);
  }
  c.rect(x1 - 1, y, 2, 5, C.brownDark);
  c.set(x1 - 1, y, C.sand);
}

function drawWheatField(
  c: Canvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  seed: number,
  sproutMix = false,
): void {
  c.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, C.brownDark);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const h = mixHash(x, y, seed);
      const isFurrow = (y - y0) % 3 === 2;
      if (isFurrow && h % 3 === 0) {
        c.set(x, y, C.brown);
      } else if (sproutMix && x < x0 + Math.floor((x1 - x0) * 0.4)) {
        c.set(x, y, h % 2 === 0 ? C.grass : C.lime);
      } else if ((x + y) % 2 === 0 || h < 2) {
        c.set(x, y, h === 0 ? C.cream : h === 1 ? C.gold : C.sand);
      } else {
        c.set(x, y, h === 2 ? C.gold : C.orange);
      }
    }
  }
}

function drawHaystack(c: Canvas, cx: number, bottomY: number, r: number): void {
  for (let dy = 0; dy <= r + 1; dy++) {
    const ry = bottomY - dy;
    const span = Math.max(1, Math.round((r * (r + 2 - dy)) / (r + 1)));
    for (let dx = -span; dx <= span; dx++) {
      const col = dy >= r ? C.cream : dx > 0 ? C.orange : dy % 2 === 0 ? C.gold : C.sand;
      c.set(cx + dx, ry, col);
    }
  }
  c.rect(cx - r, bottomY, r * 2 + 1, 1, C.brown);
}

function drawScarecrow(c: Canvas, cx: number, footY: number): void {
  // Timber cross post anchored into wheat with arms rising above rear fence horizon
  c.rect(cx, footY - 13, 1, 14, C.brownDark);
  c.rect(cx - 5, footY - 10, 11, 1, C.brown);
  // Straw sleeve tufts at crossbar tips
  c.rect(cx - 6, footY - 10, 2, 2, C.gold);
  c.rect(cx + 5, footY - 10, 2, 2, C.gold);
  // Bright terracotta crimson patched coat
  c.rect(cx - 2, footY - 10, 5, 5, C.red);
  c.rect(cx - 1, footY - 9, 3, 3, C.rust);
  c.rect(cx - 1, footY - 5, 3, 1, C.gold);
  // Burlap head & wide conical straw hat cleanly contrasting above the fence rail
  c.rect(cx - 1, footY - 13, 3, 3, C.sand);
  c.rect(cx - 4, footY - 14, 9, 1, C.gold);
  c.rect(cx - 2, footY - 15, 5, 1, C.brownDark);
  c.rect(cx - 1, footY - 16, 3, 1, C.cream);
}

function drawFarm(c: Canvas, density: 1 | 2 | 3): void {
  if (density === 1) {
    // Compact kitchen garden patch: soil furrows, green shoots, starter wheat & bushel basket
    drawSplitRailFence(c, 5, 25, 13);
    drawWheatField(c, 6, 17, 24, 27, 101, true);
    c.rect(5, 17, 1, 11, C.brownDark);
    c.rect(25, 17, 1, 11, C.brownDark);
    c.rect(6, 27, 19, 1, C.brownDark);
    c.rect(21, 24, 5, 4, C.brown);
    c.rect(22, 23, 3, 2, C.gold);
    return;
  }

  if (density === 2) {
    // Medium harvest plot + tall conical haystack breaking silhouette above rear rail
    drawSplitRailFence(c, 4, 27, 10);
    drawWheatField(c, 5, 14, 26, 27, 202);
    drawHaystack(c, 10, 14, 4);
    c.rect(4, 14, 1, 14, C.brownDark);
    c.rect(27, 14, 1, 14, C.brownDark);
    c.rect(5, 28, 22, 1, C.brownDark);
    return;
  }

  // Density 3: expansive unified golden field + twin corner haystacks + elevated proud scarecrow
  drawSplitRailFence(c, 3, 28, 10);
  drawWheatField(c, 3, 14, 28, 28, 303);
  c.rect(2, 14, 1, 15, C.brownDark);
  c.rect(29, 14, 1, 15, C.brownDark);
  c.rect(3, 29, 26, 1, C.brownDark);
  drawHaystack(c, 7, 18, 4);
  drawHaystack(c, 25, 26, 3);
  drawScarecrow(c, 16, 18);
}

/** Draws a circular pale-ringed stacked log facing the viewer. */
function drawStackedLog(c: Canvas, x: number, y: number, w: number, endRight: boolean): void {
  c.rect(x, y, w, 4, C.brown);
  c.rect(x, y, w, 1, C.brownDark);
  c.rect(x, y + 3, w, 1, C.brownDark);
  const ex = endRight ? x + w - 3 : x;
  c.rect(ex, y + 1, 3, 2, C.cream);
  c.set(ex + 1, y + 1, C.sand);
}

/** Draws a flared oak stump with pale oval cut-grain top & embedded steel axe. */
function drawStumpWithAxe(c: Canvas, cx: number, footY: number): void {
  c.rect(cx - 5, footY - 2, 11, 3, C.brownDark);
  c.rect(cx - 4, footY - 6, 9, 5, C.brown);
  c.rect(cx - 3, footY - 5, 2, 4, C.brownDark);
  c.rect(cx + 2, footY - 5, 2, 4, C.brownDark);
  c.ellipse(cx, footY - 7, 4, 2, C.cream);
  c.ellipse(cx, footY - 7, 2, 1, C.sand);

  // Embedded steel axe bit + angled diagonal oak helve
  c.rect(cx - 1, footY - 10, 3, 3, C.frost);
  c.rect(cx - 1, footY - 8, 2, 2, C.ash);
  c.line(cx, footY - 10, cx + 6, footY - 16, C.brown);
  c.line(cx + 1, footY - 10, cx + 6, footY - 15, C.brownDark);
  c.set(cx + 6, footY - 16, C.sand);
}

function drawWoodcutter(c: Canvas, density: 1 | 2 | 3): void {
  if (density === 1) {
    // Low woodchip bed directly tying stump to stacked billets (no round grass saucer rim)
    c.rect(8, 25, 16, 2, C.brownDark);
    drawStumpWithAxe(c, 10, 26);
    c.set(6, 27, C.sand);
    c.set(14, 27, C.cream);
    drawStackedLog(c, 18, 22, 9, false);
    drawStackedLog(c, 19, 19, 8, false);
    return;
  }

  if (density === 2) {
    c.rect(6, 24, 21, 3, C.brownDark);
    drawStackedLog(c, 15, 21, 12, false);
    drawStackedLog(c, 15, 17, 12, false);
    drawStackedLog(c, 17, 13, 10, false);
    drawStackedLog(c, 19, 10, 7, false);
    c.rect(24, 14, 4, 11, C.brownDark);
    c.rect(25, 15, 2, 2, C.cream);
    c.rect(25, 19, 2, 2, C.cream);
    c.rect(25, 23, 2, 2, C.cream);
    drawStumpWithAxe(c, 9, 27);
    c.set(13, 27, C.sand);
    return;
  }

  // Density 3: timber woodshed + full cordwood rick + foreground chopping block & axe
  c.rect(4, 20, 24, 7, C.brownDark);
  c.rect(3, 6, 16, 3, C.brownDark);
  c.rect(4, 5, 14, 2, C.brown);
  c.rect(4, 7, 14, 1, C.sand);
  c.rect(3, 9, 2, 12, C.brownDark);
  c.rect(17, 9, 2, 12, C.brownDark);
  drawStackedLog(c, 5, 10, 12, true);
  drawStackedLog(c, 5, 14, 12, true);
  drawStackedLog(c, 5, 18, 12, true);
  drawStackedLog(c, 20, 21, 9, false);
  drawStackedLog(c, 20, 17, 9, false);
  drawStackedLog(c, 22, 13, 7, false);
  drawStumpWithAxe(c, 10, 28);
  c.set(15, 28, C.cream);
}

/** Draws faceted granite cliff mass & timber-shored arched mine adit glowing with warm lantern. */
function drawMineAdit(c: Canvas, cx: number, baseY: number, w: number, h: number): void {
  const x0 = cx - Math.floor(w / 2);
  for (let row = 0; row < h; row++) {
    const ry = baseY - h + row;
    const inset = Math.max(0, Math.floor(((h - 1 - row) * (w * 0.35)) / h));
    for (let rx = x0 + inset; rx < x0 + w - inset; rx++) {
      const n = mixHash(rx, ry, 509);
      const col =
        row < 2 ? C.ash : rx < cx - 2 ? (n === 0 ? C.ash : C.stone) : n === 0 ? C.coal : C.slate;
      c.set(rx, ry, col);
    }
  }
  const portalW = Math.max(6, Math.floor(w * 0.44));
  const px0 = cx - Math.floor(portalW / 2);
  const portalH = Math.max(5, Math.floor(h * 0.56));
  const py0 = baseY - portalH;
  c.rect(px0, py0, portalW, portalH + 1, C.ink);
  c.rect(px0 - 1, py0, 2, portalH + 1, C.brownDark);
  c.rect(px0 + portalW - 1, py0, 2, portalH + 1, C.brownDark);
  c.rect(px0 - 2, py0 - 1, portalW + 4, 2, C.brown);
  c.rect(cx - 1, py0 + 2, 2, 2, C.gold);
  c.set(cx, py0 + 2, C.cream);
}

/** Draws crisp steel track rails and wooden sleepers extending from portal. */
function drawMineRails(c: Canvas, cx: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y += 2) {
    c.rect(cx - 4, y, 9, 1, C.brownDark);
  }
  c.rect(cx - 3, y0, 1, y1 - y0 + 1, C.frost);
  c.rect(cx + 3, y0, 1, y1 - y0 + 1, C.frost);
}

function drawMine(c: Canvas, density: 1 | 2 | 3): void {
  if (density === 1) {
    drawMineAdit(c, 16, 24, 22, 16);
    c.rect(5, 24, 22, 2, C.coal);
    drawMineRails(c, 16, 22, 28);
    c.rect(4, 23, 4, 3, C.slate);
    c.set(5, 23, C.rust);
    c.set(6, 24, C.gold);
    return;
  }

  if (density === 2) {
    c.rect(4, 22, 24, 3, C.coal);
    drawMineAdit(c, 19, 24, 20, 16);
    c.rect(3, 12, 10, 11, C.stone);
    c.rect(4, 10, 7, 3, C.ash);
    c.rect(6, 13, 5, 9, C.slate);
    drawMineRails(c, 19, 21, 28);
    c.rect(6, 22, 7, 5, C.slate);
    c.rect(6, 21, 7, 1, C.ash);
    c.rect(7, 20, 5, 2, C.coal);
    c.set(9, 20, C.gold);
    c.rect(7, 27, 2, 2, C.coal);
    c.rect(10, 27, 2, 2, C.coal);
    return;
  }

  c.rect(4, 23, 24, 3, C.coal);
  drawMineAdit(c, 18, 25, 22, 15);
  c.rect(11, 4, 2, 9, C.brown);
  c.rect(19, 4, 2, 9, C.brown);
  c.rect(10, 4, 12, 2, C.brownDark);
  c.rect(14, 3, 4, 4, C.ash);
  c.rect(15, 4, 2, 2, C.coal);
  c.rect(15, 7, 1, 8, C.frost);
  c.rect(14, 12, 3, 3, C.gold);
  drawMineRails(c, 18, 22, 29);
  c.rect(4, 22, 8, 5, C.slate);
  c.rect(4, 21, 8, 1, C.frost);
  c.rect(5, 19, 6, 3, C.coal);
  c.set(7, 19, C.gold);
  c.set(9, 20, C.rust);
  c.rect(5, 27, 2, 2, C.ink);
  c.rect(9, 27, 2, 2, C.ink);
}

/**
 * Draws a crisp 32x32 Batch 2 plot archetype pixel-art sprite in 100% Zughy-32.
 */
export function drawPlotV18(family: Batch2PlotFamily, density: 1 | 2 | 3 = 1): Canvas {
  const c = new Canvas(32);
  switch (family) {
    case 'cottage':
      drawCottage(c, density);
      break;
    case 'farm':
      drawFarm(c, density);
      break;
    case 'woodcutter':
      drawWoodcutter(c, density);
      break;
    case 'mine':
      drawMine(c, density);
      break;
  }
  applyWineOutline(c);
  return c;
}
