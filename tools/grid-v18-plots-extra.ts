import { applyWineOutline, mixHash } from './grid-v18-kit';
import { C, Canvas } from './pixel';

export const BATCH3_PLOT_FAMILIES = ['herb-garden', 'silver-seam'] as const;
export type Batch3PlotFamily = (typeof BATCH3_PLOT_FAMILIES)[number];

type BlossomKind = 'yarrow' | 'mugwort' | 'juniper';

/** Draws a bold multi-pixel botanical blossom cluster inside a leafy herb bed. */
function drawHerbBlossom(c: Canvas, x: number, y: number, kind: BlossomKind): void {
  if (kind === 'yarrow') {
    // White yarrow umbel dome with warm cream center
    c.rect(x - 1, y, 3, 2, C.frost);
    c.set(x, y - 1, C.frost);
    c.set(x, y, C.cream);
    c.set(x, y + 2, C.grass);
    return;
  }
  if (kind === 'mugwort') {
    // Upright purple mugwort spire with rose/pink crown tip
    c.rect(x, y - 2, 2, 3, C.orchid);
    c.set(x, y - 3, C.pink);
    c.set(x + 1, y - 2, C.rose);
    c.set(x, y + 1, C.moss);
    return;
  }
  // Blue juniper bough berries
  c.rect(x - 1, y, 3, 2, C.pine);
  c.set(x - 1, y, C.blue);
  c.set(x + 1, y, C.cyan);
  c.set(x, y + 1, C.ice);
  c.set(x, y - 1, C.blue);
}

/**
 * Draws a sculpted top-left lit raised wooden herb planter overflowing with dense foliage.
 */
function drawRaisedHerbBed(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  clusters: readonly (readonly [number, number, BlossomKind])[],
): void {
  const plankTop = y + h - 4;
  // Soil base and front timber fascia
  c.rect(x + 1, y + 1, w - 2, h - 2, C.brownDark);
  c.rect(x, plankTop, w, 4, C.rust);
  c.rect(x, plankTop + 2, w, 2, C.brown);
  c.rect(x, plankTop + 3, w, 1, C.brownDark);
  for (let px = x + 4; px < x + w - 1; px += 4) {
    c.rect(px, plankTop, 1, 3, C.brownDark);
  }
  // Sunlit top rim and sturdy corner posts with iron corner caps
  c.rect(x + 1, y, w - 2, 1, C.clay);
  c.rect(x + 1, plankTop - 1, w - 2, 1, C.sand);
  c.rect(x, y - 1, 2, h + 1, C.brown);
  c.rect(x + w - 2, y - 1, 2, h + 1, C.brownDark);
  c.set(x, y - 1, C.clay);
  c.set(x + w - 2, y - 1, C.rust);
  c.set(x, plankTop + 1, C.slate);
  c.set(x + w - 1, plankTop + 1, C.slate);

  // Layered botanical herb mounds surging above rim & draping over front fascia
  for (let py = y - 1; py <= plankTop; py++) {
    for (let px = x + 1; px <= x + w - 2; px++) {
      if (py === y - 1 && (px % 3 === 0 || mixHash(px, py, seed) % 3 === 0)) continue;
      if (py === plankTop && mixHash(px, py, seed + 5) % 4 !== 0) continue;
      const shade =
        py < y + 1
          ? C.lime
          : py < y + Math.floor(h * 0.48)
            ? (px + py) % 3 === 0
              ? C.lime
              : C.grass
            : px > x + w - 4
              ? C.pine
              : (mixHash(px, py, seed) & 1) === 0
                ? C.moss
                : C.grass;
      c.set(px, py, shade);
    }
  }

  for (const [ox, oy, kind] of clusters) {
    drawHerbBlossom(c, x + ox, y + oy, kind);
  }
}

/** Draws a warm flagstone garden walk segment connecting raised herb beds cleanly. */
function drawStoneStepping(c: Canvas, x: number, y: number, w: number, h: number): void {
  c.rect(x, y, w, h, C.slate);
  c.rect(x, y, w - 1, h - 1, C.stone);
  c.rect(x, y, Math.max(1, w - 2), 1, C.ash);
}

/** Draws a clay apothecary pot with sprouting green herb leaves. */
function drawHerbPot(c: Canvas, x: number, y: number): void {
  c.rect(x, y + 2, 4, 4, C.rust);
  c.rect(x, y + 2, 2, 3, C.clay);
  c.rect(x - 1, y + 1, 6, 1, C.sand);
  c.rect(x, y + 5, 4, 1, C.brownDark);
  c.set(x, y, C.grass);
  c.set(x + 1, y - 1, C.lime);
  c.set(x + 2, y, C.moss);
  c.set(x + 3, y - 1, C.grass);
}

export function drawHerbGardenV18(density: 1 | 2 | 3 = 1): Canvas {
  const c = new Canvas(32);

  if (density === 1) {
    // Tier 1: one stout raised oak planter + stepping stone ledge + terracotta pot & jug
    drawStoneStepping(c, 5, 25, 22, 2);
    drawStoneStepping(c, 9, 12, 14, 3);
    drawHerbPot(c, 8, 9);
    // Copper watering pitcher resting on upper stone apron
    c.rect(19, 9, 4, 4, C.clay);
    c.rect(19, 9, 2, 2, C.sand);
    c.rect(23, 10, 2, 2, C.rust);
    c.line(17, 10, 19, 11, C.sand);
    drawRaisedHerbBed(c, 5, 14, 22, 12, 301, [
      [4, 2, 'yarrow'],
      [11, 2, 'mugwort'],
      [17, 3, 'juniper'],
    ]);
    applyWineOutline(c);
    return c;
  }

  if (density === 2) {
    // Tier 2: paired staggered raised herb planters linked by diagonal garden flagstones
    drawStoneStepping(c, 10, 14, 12, 4);
    drawStoneStepping(c, 15, 11, 8, 4);
    drawHerbPot(c, 21, 9);
    drawRaisedHerbBed(c, 3, 5, 16, 11, 317, [
      [4, 2, 'yarrow'],
      [9, 2, 'mugwort'],
      [13, 4, 'juniper'],
    ]);
    drawRaisedHerbBed(c, 12, 17, 17, 11, 331, [
      [4, 3, 'juniper'],
      [9, 2, 'yarrow'],
      [13, 3, 'mugwort'],
    ]);
    applyWineOutline(c);
    return c;
  }

  // Tier 3 (v1.1 Redraw fix): terraced U-court of lush raised planters + arched herb-drying trellis
  drawStoneStepping(c, 6, 14, 20, 5);
  drawStoneStepping(c, 13, 18, 6, 10);
  // Timber herb-drying trellis framing the upper terraced bed
  c.rect(5, 3, 2, 4, C.brownDark);
  c.rect(25, 3, 2, 4, C.brownDark);
  c.rect(5, 2, 22, 2, C.brown);
  c.rect(6, 2, 20, 1, C.clay);
  // Hanging dried apothecary sprigs beneath crossbar
  for (const [hx, col] of [
    [9, C.orchid],
    [13, C.lime],
    [18, C.frost],
    [22, C.rose],
  ] as const) {
    c.rect(hx, 4, 2, 2, C.moss);
    c.set(hx + 1, 5, col);
  }
  drawRaisedHerbBed(c, 4, 6, 24, 9, 349, [
    [4, 2, 'yarrow'],
    [10, 3, 'mugwort'],
    [15, 2, 'juniper'],
    [20, 2, 'yarrow'],
  ]);
  drawRaisedHerbBed(c, 3, 17, 12, 11, 367, [
    [3, 3, 'yarrow'],
    [8, 2, 'mugwort'],
  ]);
  drawRaisedHerbBed(c, 17, 17, 12, 11, 383, [
    [3, 2, 'juniper'],
    [8, 3, 'mugwort'],
  ]);
  drawHerbPot(c, 14, 22);
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
