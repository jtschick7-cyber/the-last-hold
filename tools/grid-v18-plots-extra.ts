import { applyWineOutline, mixHash } from './grid-v18-kit';
import { C, Canvas } from './pixel';

export const BATCH3_PLOT_FAMILIES = ['herb-garden', 'silver-seam'] as const;
export type Batch3PlotFamily = (typeof BATCH3_PLOT_FAMILIES)[number];

type HerbSpecies = 'yarrow' | 'mugwort' | 'juniper';

/** Draws an organic sculpted multi-leaf herb clump crowned with distinct blossoms (never box fill). */
function drawHerbPlant(c: Canvas, cx: number, footY: number, species: HerbSpecies): void {
  // Asymmetric sculpted leaf rosette (dark pine shadow bottom-right, grass/lime leaves arching upward)
  for (const [dx, dy, col] of [
    [-3, -1, C.moss],
    [-2, -2, C.grass],
    [-1, -2, C.lime],
    [0, -1, C.moss],
    [1, -2, C.grass],
    [2, -1, C.pine],
    [-2, 0, C.pine],
    [-1, 0, C.moss],
    [0, 0, C.moss],
    [1, 0, C.pine],
    [2, 0, C.pine],
    [0, -3, C.grass],
  ] as const) {
    c.set(cx + dx, footY + dy, col);
  }

  if (species === 'yarrow') {
    // Tall arching stems crowned with two snowy white + warm cream umbel florets
    c.set(cx - 1, footY - 3, C.grass);
    c.set(cx + 1, footY - 3, C.moss);
    c.rect(cx - 2, footY - 5, 3, 2, C.frost);
    c.set(cx - 1, footY - 5, C.cream);
    c.rect(cx + 1, footY - 4, 2, 2, C.frost);
    c.set(cx + 1, footY - 4, C.cream);
    return;
  }

  if (species === 'mugwort') {
    // Feathery dark-sage stalks tipped with vivid purple-rose mugwort spires
    c.rect(cx - 1, footY - 4, 1, 2, C.grass);
    c.rect(cx + 1, footY - 3, 1, 2, C.moss);
    c.rect(cx - 1, footY - 6, 2, 3, C.orchid);
    c.set(cx - 1, footY - 7, C.pink);
    c.set(cx, footY - 6, C.rose);
    c.rect(cx + 1, footY - 5, 2, 2, C.orchid);
    c.set(cx + 1, footY - 6, C.rose);
    return;
  }

  // Evergreen blue juniper bough dusted with luminous cobalt & ice berries
  c.set(cx - 2, footY - 3, C.moss);
  c.set(cx + 1, footY - 3, C.pine);
  c.set(cx - 1, footY - 4, C.lime);
  c.set(cx - 1, footY - 2, C.cyan);
  c.set(cx, footY - 3, C.blue);
  c.set(cx + 1, footY - 2, C.ice);
  c.set(cx + 2, footY - 1, C.blue);
}

/**
 * Draws an organic curved cobblestone-and-loam garden bed (rounded soil + irregular stone rim).
 */
function drawStoneHerbPlot(
  c: Canvas,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
): void {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const n = mixHash(x, y, seed) % 7;
      const dist = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (dist <= 0.78) {
        c.set(x, y, n === 0 ? C.brown : C.brownDark);
      } else if (dist <= 1.02 + (n === 1 ? 0.08 : 0)) {
        const isSunlit = x < cx && y < cy + 1;
        c.set(x, y, isSunlit ? (n < 3 ? C.ash : C.stone) : n < 2 ? C.plum : C.slate);
      }
    }
  }
}

/**
 * Draws a rustic chamfered oak-curbed planter overflowing organically beyond its thin timber rails.
 */
function drawOakFrameBed(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
): void {
  // Chamfered turned dark apothecary loam inside slender split-oak curbing
  c.rect(x + 1, y, w - 2, h, C.brownDark);
  c.rect(x, y + 1, w, h - 2, C.brownDark);
  for (let px = x + 2; px < x + w - 2; px++) {
    for (let py = y + 1; py < y + h - 1; py++) {
      if (mixHash(px, py, seed) % 5 === 0) c.set(px, py, C.brown);
    }
  }
  // Thin top sunlit rail & shaded front board + sturdy chamfered corner pegs
  c.rect(x + 1, y, w - 2, 1, C.clay);
  c.rect(x + 1, y + h - 2, w - 2, 1, C.rust);
  c.rect(x + 1, y + h - 1, w - 2, 1, C.brown);
  for (const [px, col] of [
    [x, C.sand],
    [x + w - 1, C.brown],
  ] as const) {
    c.rect(px, y, 1, h - 1, col);
    c.set(px, y + h - 1, C.brownDark);
  }
}

/** Draws a small terracotta pot tucked along a garden edge. */
function drawTerracottaPot(c: Canvas, x: number, y: number): void {
  c.rect(x, y + 2, 3, 3, C.rust);
  c.rect(x, y + 2, 2, 2, C.clay);
  c.rect(x - 1, y + 1, 5, 1, C.sand);
  c.set(x + 1, y, C.grass);
  c.set(x + 2, y - 1, C.lime);
}

/** Draws a pitched timber apothecary herb-drying gable sheltering hanging herb bundles. */
function drawDryingShelter(c: Canvas, x: number, y: number): void {
  for (let row = 0; row < 4; row++) {
    const span = 3 + row * 3;
    const rx = x + 6 - Math.floor(span / 2);
    c.rect(rx, y + row, span, 1, row === 0 ? C.sand : row === 3 ? C.wine : C.clay);
  }
  c.rect(x + 1, y + 4, 1, 7, C.brownDark);
  c.rect(x + 10, y + 4, 1, 7, C.brownDark);
  c.rect(x + 2, y + 8, 8, 3, C.brown);
  c.rect(x + 2, y + 8, 8, 1, C.sand);
  // Hanging dried bundles (white yarrow, purple mugwort, sage) + small glass bell cloche
  c.rect(x + 3, y + 4, 2, 3, C.orchid);
  c.set(x + 3, y + 6, C.pink);
  c.rect(x + 6, y + 4, 2, 3, C.moss);
  c.set(x + 7, y + 6, C.frost);
  c.rect(x + 8, y + 6, 2, 2, C.ice);
  c.set(x + 8, y + 6, C.frost);
}

export function drawHerbGardenV18(density: 1 | 2 | 3 = 1): Canvas {
  const c = new Canvas(32);

  if (density === 1) {
    // Tier 1: cobblestone spiral herb bed bursting with yarrow, mugwort & juniper + potting post + copper can
    drawStoneHerbPlot(c, 16, 21, 9.5, 5.5, 301);
    // Slender timber herb trellis stake with hanging dried herb bundle on left stone edge
    c.rect(7, 8, 2, 13, C.brownDark);
    c.rect(7, 8, 1, 12, C.brown);
    c.rect(6, 9, 5, 1, C.clay);
    c.rect(9, 10, 2, 3, C.orchid);
    c.set(9, 12, C.pink);
    // Copper watering can nested on right stone rim
    c.rect(21, 15, 4, 4, C.clay);
    c.rect(21, 15, 2, 2, C.sand);
    c.rect(25, 16, 1, 2, C.rust);
    c.line(19, 16, 21, 17, C.sand);
    // Three distinct sculpted botanical clumps planted inside the rounded dark-loam bed
    drawHerbPlant(c, 11, 22, 'mugwort');
    drawHerbPlant(c, 16, 20, 'yarrow');
    drawHerbPlant(c, 21, 23, 'juniper');
    drawHerbPlant(c, 15, 25, 'juniper');
    applyWineOutline(c);
    return c;
  }

  if (density === 2) {
    // Tier 2: paired stone-kerbed & wattle-framed terraced herb beds + climbing arbor + harvest basket
    // Rounded natural mossy garden stepping stones linking upper and lower beds
    drawStoneHerbPlot(c, 15, 16, 3.5, 2.2, 311);
    drawStoneHerbPlot(c, 10, 12, 7.2, 4.8, 319);
    drawStoneHerbPlot(c, 20, 22, 8.2, 5.2, 329);

    // Light willow arbor pole flanking upper bed
    c.rect(4, 5, 1, 8, C.brown);
    c.rect(14, 4, 1, 6, C.brown);
    c.line(4, 5, 14, 4, C.clay);
    c.set(8, 4, C.lime);
    c.set(10, 4, C.pink);

    // Wicker herb-harvester basket tucked cleanly beside stone bridge
    c.rect(20, 13, 5, 4, C.sand);
    c.rect(20, 15, 5, 2, C.rust);
    c.rect(21, 12, 3, 2, C.grass);
    c.set(22, 12, C.frost);
    c.set(23, 13, C.orchid);

    // Sculpted herbs surging across both garden terraces
    drawHerbPlant(c, 7, 13, 'mugwort');
    drawHerbPlant(c, 12, 12, 'yarrow');
    drawHerbPlant(c, 10, 15, 'juniper');
    drawHerbPlant(c, 16, 22, 'yarrow');
    drawHerbPlant(c, 21, 20, 'mugwort');
    drawHerbPlant(c, 24, 24, 'juniper');
    drawHerbPlant(c, 19, 25, 'yarrow');
    applyWineOutline(c);
    return c;
  }

  // Tier 3 (v1.1 Redraw + batch 3 refine): monastic crossroads apothecary garden — drying shed, stone sundial core & three billowing oak-framed herb beds
  drawStoneHerbPlot(c, 15, 16, 4.8, 4.2, 341);
  // Warm bronze garden sundial pedestal grounding the flagstone crossroads
  c.rect(14, 14, 3, 3, C.stone);
  c.set(14, 14, C.ash);
  c.rect(15, 13, 1, 2, C.clay);
  c.set(15, 12, C.gold);

  drawOakFrameBed(c, 16, 6, 13, 8, 353);
  drawOakFrameBed(c, 3, 17, 12, 11, 367);
  drawOakFrameBed(c, 17, 17, 12, 11, 383);
  drawDryingShelter(c, 2, 3);
  drawTerracottaPot(c, 14, 22);

  // Abundant overlapping herbaceous mounds overflowing the oak rails with bold blossoms
  drawHerbPlant(c, 19, 9, 'yarrow');
  drawHerbPlant(c, 24, 9, 'mugwort');
  drawHerbPlant(c, 22, 13, 'juniper');
  drawHerbPlant(c, 27, 12, 'yarrow');
  drawHerbPlant(c, 6, 19, 'mugwort');
  drawHerbPlant(c, 11, 19, 'yarrow');
  drawHerbPlant(c, 7, 25, 'juniper');
  drawHerbPlant(c, 12, 26, 'yarrow');
  drawHerbPlant(c, 20, 19, 'juniper');
  drawHerbPlant(c, 25, 19, 'mugwort');
  drawHerbPlant(c, 22, 25, 'yarrow');
  drawHerbPlant(c, 26, 25, 'juniper');

  applyWineOutline(c);
  return c;
}

/**
 * Draws a sculpted jagged basalt crag cloven by a branching glowing silver/ice-blue ore vein.
 */
function drawCraggySilverOutcrop(
  c: Canvas,
  poly: readonly (readonly [number, number])[],
  ridgeLine: readonly (readonly [number, number])[],
  veinMain: readonly (readonly [number, number])[],
  veinBranches: readonly (readonly (readonly [number, number])[])[],
  seed: number,
): void {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const midX = (minX + maxX) * 0.52;
  const midY = (minY + maxY) * 0.5;

  c.polygon(poly, (x, y) => {
    const strata = mixHash(x, Math.floor(y / 2), seed) % 6;
    if (y > maxY - 2.5 || (x > midX + 3 && y > midY - 1)) return strata === 0 ? C.slate : C.plum;
    if (x < midX - 1 && y < midY + 2) return strata < 2 ? C.stone : C.slate;
    if (x > midX + 1) return strata === 0 ? C.ink : C.coal;
    return strata === 0 ? C.stone : C.coal;
  });

  // Sunlit sharp top-left cliff ridges
  for (let i = 0; i + 1 < ridgeLine.length; i++) {
    const [x0, y0] = ridgeLine[i] as readonly [number, number];
    const [x1, y1] = ridgeLine[i + 1] as readonly [number, number];
    c.line(x0, y0, x1, y1, C.ash);
  }

  // Deep recessed rock fissure framing the branching silver seam
  const carveVein = (pts: readonly (readonly [number, number])[], brightCore: boolean): void => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i] as readonly [number, number];
      const [x1, y1] = pts[i + 1] as readonly [number, number];
      c.line(x0 - 1, y0, x1 - 1, y1, C.ink);
      c.line(x0 + 1, y0, x1 + 1, y1, C.night);
    }
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i] as readonly [number, number];
      const [x1, y1] = pts[i + 1] as readonly [number, number];
      c.line(x0, y0, x1, y1, C.blue);
      if (brightCore) c.line(x0, y0, x1, y1, C.cyan);
    }
    for (let i = 0; i < pts.length; i++) {
      const [vx, vy] = pts[i] as readonly [number, number];
      c.set(vx, vy, i % 2 === 0 ? C.frost : C.ice);
    }
  };

  carveVein(veinMain, true);
  for (const branch of veinBranches) {
    carveVein(branch, false);
  }
}

/**
 * Draws jagged basalt crags split by gleaming branching silver/ice ore veins (v1.1 Redraw fix).
 */
export function drawSilverSeamV18(look: 1 | 2 = 1): Canvas {
  const c = new Canvas(32);

  if (look === 1) {
    drawCraggySilverOutcrop(
      c,
      [
        [10, 4],
        [15, 7],
        [20, 5],
        [25, 11],
        [27, 20],
        [25, 26],
        [16, 27],
        [6, 25],
        [4, 17],
        [7, 10],
      ],
      [
        [10, 5],
        [7, 10],
        [5, 17],
      ],
      [
        [13, 6],
        [12, 11],
        [15, 16],
        [14, 21],
        [17, 25],
      ],
      [
        [
          [12, 11],
          [8, 14],
          [6, 18],
        ],
        [
          [15, 16],
          [20, 13],
          [23, 15],
        ],
        [
          [14, 21],
          [10, 23],
        ],
      ],
      401,
    );
    // Exposed gleaming silver crystal cluster at fissure base
    c.rect(16, 24, 3, 2, C.ice);
    c.set(17, 23, C.frost);
    c.set(18, 25, C.cyan);
    applyWineOutline(c);
    return c;
  }

  // Look 2: twin sharply jagged basalt outcrops with distinct silver-ice fissure networks
  drawCraggySilverOutcrop(
    c,
    [
      [6, 4],
      [12, 5],
      [16, 10],
      [15, 16],
      [8, 17],
      [3, 14],
      [4, 9],
    ],
    [
      [6, 5],
      [4, 9],
      [4, 13],
    ],
    [
      [9, 5],
      [8, 10],
      [11, 14],
      [10, 16],
    ],
    [
      [
        [8, 10],
        [5, 12],
      ],
      [
        [11, 12],
        [14, 11],
      ],
    ],
    419,
  );
  drawCraggySilverOutcrop(
    c,
    [
      [19, 13],
      [25, 14],
      [28, 21],
      [26, 27],
      [16, 27],
      [13, 22],
      [15, 17],
    ],
    [
      [19, 14],
      [15, 17],
      [14, 22],
    ],
    [
      [22, 14],
      [20, 19],
      [23, 23],
      [21, 26],
    ],
    [
      [
        [20, 19],
        [16, 21],
      ],
      [
        [22, 22],
        [26, 20],
      ],
    ],
    433,
  );
  // Angular rocky scree chunk speckled with gleaming ore in bottom-left nook
  c.rect(5, 22, 5, 4, C.slate);
  c.rect(5, 22, 4, 2, C.stone);
  c.set(6, 22, C.ash);
  c.set(7, 23, C.ice);
  c.set(8, 24, C.frost);

  applyWineOutline(c);
  return c;
}

/** Dispatches Batch 3 remaining plot variants (herb-garden 1..3, silver-seam 1..2). */
export function drawBatch3PlotV18(family: Batch3PlotFamily, density: 1 | 2 | 3 = 1): Canvas {
  return family === 'herb-garden'
    ? drawHerbGardenV18(density)
    : drawSilverSeamV18(density === 2 ? 2 : 1);
}
