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

/** Draws a rich turned-soil patch with chamfered corners and subtle loam ridge lines. */
function drawLoamBed(
  c: Canvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  seed: number,
): void {
  c.rect(x0 + 1, y0, x1 - x0 - 1, y1 - y0 + 1, C.brownDark);
  c.rect(x0, y0 + 1, x1 - x0 + 1, y1 - y0 - 1, C.brownDark);
  for (let y = y0 + 1; y <= y1 - 1; y++) {
    if ((y - y0) % 3 === 1) {
      for (let x = x0 + 1; x <= x1 - 1; x++) {
        if (mixHash(x, y, seed) <= 1) c.set(x, y, C.brown);
      }
    }
  }
}

/** Draws an organic nodding wheat tuft (green/olive lower stem + curved golden grain plume). */
function drawWheatTuft(c: Canvas, bx: number, by: number, lean: -1 | 1, tall: boolean): void {
  // Grounded leaf blades & stem
  c.set(bx, by, C.moss);
  c.set(bx + lean, by, C.grass);
  c.set(bx, by - 1, C.grass);
  c.set(bx + lean, by - 1, C.sand);
  // Nodding golden grain head
  c.set(bx + lean, by - 2, C.gold);
  c.set(bx + lean * 2, by - 2, C.gold);
  c.set(bx, by - 2, C.orange);
  if (tall) {
    c.set(bx + lean, by - 3, C.cream);
    c.set(bx + lean * 2, by - 3, C.gold);
  } else {
    c.set(bx + lean, by - 2, C.cream);
  }
}

/** Draws staggered botanical wheat tufts across turned loam (no flat wall stripes or grid boxes). */
function drawTuftedWheatRows(
  c: Canvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  seed: number,
): void {
  drawLoamBed(c, x0, y0, x1, y1, seed);
  let rowIdx = 0;
  for (let by = y0 + 3; by <= y1 - 1; by += 4) {
    const startX = x0 + 2 + (rowIdx % 2) * 2;
    for (let bx = startX; bx <= x1 - 3; bx += 4) {
      const h = mixHash(bx, by, seed);
      drawWheatTuft(c, bx, by, 1, h !== 2);
    }
    rowIdx++;
  }
}

/** Draws a plump thatched conical hayrick with layered straw skirts & twine crown. */
function drawHaystack(c: Canvas, cx: number, bottomY: number, r: number): void {
  for (let dy = 0; dy <= r + 2; dy++) {
    const ry = bottomY - dy;
    const span = Math.max(1, Math.round((r * (r + 3 - dy)) / (r + 2)));
    for (let dx = -span; dx <= span; dx++) {
      const col =
        dy >= r + 1
          ? C.cream
          : dy === 2
            ? C.brown
            : dx > 1
              ? C.orange
              : (dx + dy) % 2 === 0
                ? C.gold
                : C.sand;
      c.set(cx + dx, ry, col);
    }
  }
  c.rect(cx - r, bottomY, r * 2 + 1, 1, C.brownDark);
}

/** Draws a waist-tied upright harvest wheat sheaf. */
function drawBoundSheaf(c: Canvas, cx: number, bottomY: number): void {
  c.rect(cx - 2, bottomY - 5, 5, 2, C.gold);
  c.rect(cx - 1, bottomY - 6, 3, 1, C.cream);
  c.rect(cx - 1, bottomY - 3, 3, 1, C.brown);
  c.rect(cx - 2, bottomY - 2, 5, 3, C.sand);
  c.rect(cx - 1, bottomY - 1, 3, 2, C.gold);
}

/** Draws a small pitched timber grain crib / threshing shed anchoring Tier 3 farms. */
function drawHarvestShed(c: Canvas, x: number, y: number): void {
  for (let r = 0; r < 4; r++) {
    const span = 3 + r * 2;
    const rx = x + 4 - Math.floor(span / 2);
    c.rect(rx, y + r, span, 1, r === 0 ? C.clay : r === 3 ? C.wine : C.rust);
  }
  c.rect(x + 1, y + 4, 7, 5, C.brown);
  c.rect(x + 2, y + 5, 5, 4, C.sand);
  c.rect(x + 3, y + 6, 3, 3, C.brownDark);
}

function drawScarecrow(c: Canvas, cx: number, footY: number): void {
  c.rect(cx, footY - 13, 1, 14, C.brownDark);
  c.rect(cx - 5, footY - 10, 11, 1, C.brown);
  c.rect(cx - 6, footY - 10, 2, 2, C.gold);
  c.rect(cx + 5, footY - 10, 2, 2, C.gold);
  c.rect(cx - 2, footY - 10, 5, 5, C.red);
  c.rect(cx - 1, footY - 9, 3, 3, C.rust);
  c.rect(cx - 1, footY - 5, 3, 1, C.gold);
  c.rect(cx - 1, footY - 13, 3, 3, C.sand);
  c.rect(cx - 4, footY - 14, 9, 1, C.gold);
  c.rect(cx - 2, footY - 15, 5, 1, C.brownDark);
  c.rect(cx - 1, footY - 16, 3, 1, C.cream);
}

function drawFarm(c: Canvas, density: 1 | 2 | 3): void {
  if (density === 1) {
    // Tier 1: modest chamfered loam plot behind corner fence + staggered waving wheat tufts + fork & bushel
    drawSplitRailFence(c, 5, 22, 12);
    drawTuftedWheatRows(c, 5, 16, 23, 27, 101);
    // Leaning oak hayfork beside top-right post
    c.line(24, 11, 22, 19, C.brown);
    c.rect(23, 9, 3, 2, C.ash);
    // Woven harvest bushel overflowing with golden wheat at lower-right corner
    c.rect(21, 22, 5, 5, C.brown);
    c.rect(22, 21, 3, 2, C.cream);
    c.set(23, 22, C.gold);
    return;
  }

  if (density === 2) {
    // Tier 2: upper conical hayrick + hayfork + broad open botanical wheatfield + bound sheaf
    drawSplitRailFence(c, 12, 27, 11);
    drawTuftedWheatRows(c, 3, 15, 27, 28, 202);
    drawHaystack(c, 9, 16, 4);
    c.line(14, 9, 13, 16, C.brown);
    c.rect(13, 8, 3, 2, C.ash);
    drawBoundSheaf(c, 25, 26);
    return;
  }

  // Tier 3: grain shed + hayrick + sweeping tufted golden wheatfield + rising scarecrow + laden wheelcart
  drawSplitRailFence(c, 14, 28, 11);
  drawTuftedWheatRows(c, 3, 15, 28, 29, 303);
  drawHarvestShed(c, 2, 6);
  drawHaystack(c, 12, 16, 3);
  drawScarecrow(c, 19, 20);
  drawBoundSheaf(c, 26, 20);
  // Wheeled harvest cart laden with sheaves on lower-right corner
  c.rect(19, 23, 8, 4, C.brown);
  c.rect(20, 21, 6, 3, C.gold);
  c.set(22, 21, C.cream);
  c.rect(20, 27, 2, 2, C.brownDark);
  c.rect(25, 27, 2, 2, C.brownDark);
  c.set(20, 27, C.sand);
  c.set(25, 27, C.sand);
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

  // Density 3 (clean open-air evolution of woodcutter-1 & 2): woodshed awning + stepped horizontal logs + foreground stump & axe
  // Low compact woodchip sill uniting stump on left to tall horizontal cordwood rick on right
  c.rect(8, 25, 18, 2, C.brownDark);

  // Pitched timber awning shelter at top-left (widening downward to eaves + thin posts)
  for (let row = 0; row < 4; row++) {
    const span = 4 + row * 4;
    const rx = 9 - Math.floor(span / 2);
    c.rect(
      rx,
      4 + row,
      span,
      1,
      row === 0 ? C.sand : row === 1 ? C.clay : row === 2 ? C.rust : C.brownDark,
    );
  }
  c.rect(4, 8, 1, 10, C.brownDark);
  c.rect(14, 8, 1, 10, C.brownDark);
  // Two horizontal cylindrical logs stacked cleanly beneath the shelter awning
  drawStackedLog(c, 5, 14, 9, true);
  drawStackedLog(c, 6, 10, 8, true);

  // Stepped horizontal cordwood rick on right (clean circular cut ends on left, matching D1/D2 language)
  drawStackedLog(c, 17, 21, 12, false);
  drawStackedLog(c, 17, 17, 12, false);
  drawStackedLog(c, 18, 13, 11, false);
  drawStackedLog(c, 20, 9, 8, false);
  c.rect(26, 12, 3, 11, C.brownDark);
  c.rect(27, 13, 2, 2, C.cream);
  c.rect(27, 17, 2, 2, C.cream);
  c.rect(27, 21, 2, 2, C.cream);

  // Foreground flared chopping stump + gleaming embedded axe + two split billets
  drawStumpWithAxe(c, 9, 28);
  c.set(5, 28, C.sand);
  c.set(14, 28, C.cream);
  c.rect(15, 25, 4, 2, C.sand);
  c.rect(16, 26, 3, 1, C.cream);
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
