import {
  CONNECTION_BITS,
  type CLEARING_BOUNDS,
  GRID_COLS,
  GRID_ROWS,
} from '../src/content/hold-layout';
import { C, Canvas } from './pixel';
import { mixHash } from './grid-v18-kit';

export type ClearingBounds = (typeof CLEARING_BOUNDS)[keyof typeof CLEARING_BOUNDS];

export type GroundKind = 'grass' | 'earth' | 'flags';
export type BorderKind = 'forest' | 'ruin';
export type GhostKind = 'locked' | 'dormant';

/** Draws a single 2x3 grass blade tuft wrapped toroidally on a 32x32 tile. */
function setToroidal(c: Canvas, x: number, y: number, col: string): void {
  const n = c.size;
  const wx = ((x % n) + n) % n;
  const wy = ((y % n) + n) % n;
  c.set(wx, wy, col);
}

function drawGroundGrass(c: Canvas): void {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const n = mixHash(x, y, 101) % 32;
      const patch = mixHash(Math.floor(x / 6), Math.floor(y / 6), 202) % 7;
      if (patch === 0 && n < 18) c.set(x, y, C.pine);
      else if (n === 0) c.set(x, y, C.grass);
      else if (n === 1) c.set(x, y, C.pine);
      else c.set(x, y, C.moss);
    }
  }
  // Softly grouped frontier grass blades & restrained clover buds (toroidal)
  const tufts: readonly (readonly [number, number, boolean])[] = [
    [4, 6, false],
    [15, 3, true],
    [26, 8, false],
    [9, 17, false],
    [21, 15, false],
    [29, 21, true],
    [6, 27, false],
    [18, 26, false],
  ];
  for (const [tx, ty, flower] of tufts) {
    setToroidal(c, tx, ty, C.pine);
    setToroidal(c, tx + 1, ty, C.pine);
    setToroidal(c, tx, ty - 1, C.grass);
    setToroidal(c, tx + 1, ty - 1, C.grass);
    if (flower) {
      setToroidal(c, tx, ty - 2, C.sand);
      setToroidal(c, tx + 1, ty - 2, C.cream);
    }
  }
}

function drawGroundEarth(c: Canvas): void {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      // Smooth coarse compacted-soil blobs instead of high-frequency 1px static
      const blob = mixHash(Math.floor(x / 3), Math.floor(y / 2), 305) % 8;
      const fine = mixHash(x, y, 307) % 18;
      if (blob <= 2) c.set(x, y, fine === 0 ? C.coal : C.brown);
      else if (blob === 3) c.set(x, y, fine < 4 ? C.rust : C.brown);
      else if (blob === 4) c.set(x, y, C.brownDark);
      else c.set(x, y, fine === 0 ? C.brownDark : C.brown);
    }
  }
  // Muted embedded field stones & compacted rut pockets wrapped toroidally
  const pebbles: readonly (readonly [number, number])[] = [
    [5, 5],
    [16, 10],
    [28, 4],
    [10, 20],
    [23, 18],
    [18, 29],
  ];
  for (const [px, py] of pebbles) {
    setToroidal(c, px, py, C.stone);
    setToroidal(c, px + 1, py, C.coal);
    setToroidal(c, px, py + 1, C.brownDark);
  }
}

function drawGroundFlags(c: Canvas): void {
  // Varied-width dark courthouse flagstones so grey masonry stands out cleanly
  const rows = [
    { y0: 0, h: 8, splitX: [0, 12, 23] },
    { y0: 8, h: 8, splitX: [4, 15, 25] },
    { y0: 16, h: 8, splitX: [2, 10, 21] },
    { y0: 24, h: 8, splitX: [6, 17, 27] },
  ] as const;

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    if (!row) continue;
    const firstSplit = row.splitX[0] ?? 0;
    for (let dy = 0; dy < row.h; dy++) {
      const y = row.y0 + dy;
      for (let x = 0; x < 32; x++) {
        const isVJoint = row.splitX.some((sx) => x === sx);
        if (dy === 0 || isVJoint) {
          c.set(x, y, C.ink);
          continue;
        }
        const stoneId = row.splitX.findIndex((sx, idx) => {
          const next = row.splitX[(idx + 1) % row.splitX.length] ?? 0;
          return idx < row.splitX.length - 1 ? x > sx && x < next : x > sx || x < firstSplit;
        });
        const variant = mixHash(Math.max(0, stoneId), rowIdx, 409) % 5;
        const leftOfJoint = row.splitX.some((sx) => (x + 31) % 32 === sx);
        if (dy === 1) {
          c.set(x, y, variant === 0 || leftOfJoint ? C.stone : C.slate);
        } else if (dy === row.h - 1) {
          c.set(x, y, C.plum);
        } else {
          const grain = mixHash(x, y, 419) % 16;
          if (grain === 0) c.set(x, y, C.ink);
          else c.set(x, y, variant === 1 || leftOfJoint ? C.slate : C.coal);
        }
      }
    }
  }
}

/** Draws a seamlessly tileable 32x32 clearing ground tile. */
export function drawGroundV18(kind: GroundKind): Canvas {
  const c = new Canvas(32);
  if (kind === 'grass') drawGroundGrass(c);
  else if (kind === 'earth') drawGroundEarth(c);
  else drawGroundFlags(c);
  return c;
}

/** Draws a miniature pixel spruce tree centered at (cx, baseY) inside a 32x32 canvas. */
function drawPineTree(c: Canvas, cx: number, baseY: number, tiers: number, shadeShift = 0): void {
  c.rect(cx - 1, baseY - 2, 2, 3, C.brownDark);
  c.set(cx - 1, baseY - 1, C.brown);
  for (let t = 0; t < tiers; t++) {
    const ty = baseY - 3 - t * 4;
    const halfW = tiers + 2 - t;
    for (let dy = 0; dy < 4; dy++) {
      const y = ty - dy;
      const span = Math.max(0, halfW - dy);
      for (let dx = -span; dx <= span; dx++) {
        const px = cx + dx;
        const py = y;
        if (dx < 0 && dy > 0 && shadeShift === 0) c.set(px, py, C.grass);
        else if (dx === -span || (dy === 0 && dx < 0)) c.set(px, py, C.moss);
        else if (dx === span && dy === 0) c.set(px, py, C.ink);
        else c.set(px, py, C.pine);
      }
    }
  }
  c.set(cx, baseY - 3 - tiers * 4, C.moss);
}

/** Computes a deterministic 4-neighbor clearing-edge mask (N=1, E=2, S=4, W=8) per grid cell. */
export function computeClearingEdgeMasks(bounds: ClearingBounds): number[][] {
  const masks: number[][] = [];
  const inside = (x: number, y: number): boolean =>
    x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;

  for (let y = 0; y < GRID_ROWS; y++) {
    const row: number[] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      if (inside(x, y)) {
        row.push(0);
        continue;
      }
      let m = 0;
      if (y > 0 && inside(x, y - 1)) m |= CONNECTION_BITS.n;
      if (x < GRID_COLS - 1 && inside(x + 1, y)) m |= CONNECTION_BITS.e;
      if (y < GRID_ROWS - 1 && inside(x, y + 1)) m |= CONNECTION_BITS.s;
      if (x > 0 && inside(x - 1, y)) m |= CONNECTION_BITS.w;
      row.push(m);
    }
    masks.push(row);
  }
  return masks;
}

/** Builds deterministic clearing-border tile ('forest' | 'ruin') with optional N/E/S/W edge transitions. */
export function buildClearingBorderTile(kind: BorderKind, variant: 1 | 2, edgeMask = 0): Canvas {
  const c = new Canvas(32);
  // Deep woodland/ruin twilight carpet base
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const h = mixHash(x, y, kind === 'forest' ? 501 + variant : 601 + variant) % 16;
      if (kind === 'forest') {
        c.set(x, y, h < 3 ? C.ink : h < 6 ? C.moss : C.pine);
      } else {
        c.set(x, y, h < 3 ? C.ink : h < 6 ? C.moss : C.coal);
      }
    }
  }

  if (kind === 'forest') {
    if (variant === 1) {
      drawPineTree(c, 8, 17, 3, 1);
      drawPineTree(c, 22, 16, 3, 0);
      drawPineTree(c, 15, 29, 3, 0);
    } else {
      drawPineTree(c, 21, 14, 2, 1);
      drawPineTree(c, 9, 25, 3, 0);
      drawPineTree(c, 23, 29, 3, 0);
    }
  } else {
    const blocks =
      variant === 1
        ? [
            { x: 4, y: 6, w: 12, h: 7 },
            { x: 18, y: 11, w: 9, h: 6 },
            { x: 7, y: 20, w: 17, h: 8 },
          ]
        : [
            { x: 6, y: 5, w: 15, h: 7 },
            { x: 4, y: 17, w: 10, h: 8 },
            { x: 17, y: 19, w: 11, h: 8 },
          ];
    for (const b of blocks) {
      c.rect(b.x, b.y, b.w, b.h, C.wine);
      c.rect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, C.slate);
      c.rect(b.x + 1, b.y + 1, b.w - 2, 2, C.stone);
      c.rect(b.x + 2, b.y + 1, Math.max(2, b.w - 6), 1, C.ash);
      // Moss creeping over broken corners
      c.set(b.x + 1, b.y + b.h - 2, C.moss);
      c.set(b.x + 2, b.y + b.h - 2, C.grass);
    }
  }

  // Organic scalloped meadow transitions facing active clearing cells (N=1, E=2, S=4, W=8)
  if ((edgeMask & CONNECTION_BITS.n) !== 0) {
    for (let x = 0; x < 32; x++) {
      const depth = 2 + (mixHash(x, 1, 611) % 3);
      for (let d = 0; d < depth; d++) c.set(x, d, d === 0 ? C.moss : C.grass);
    }
  }
  if ((edgeMask & CONNECTION_BITS.s) !== 0) {
    for (let x = 0; x < 32; x++) {
      const depth = 2 + (mixHash(x, 2, 612) % 3);
      for (let d = 0; d < depth; d++) c.set(x, 31 - d, d === 0 ? C.moss : C.grass);
    }
  }
  if ((edgeMask & CONNECTION_BITS.w) !== 0) {
    for (let y = 0; y < 32; y++) {
      const depth = 2 + (mixHash(y, 3, 613) % 3);
      for (let d = 0; d < depth; d++) c.set(d, y, d === 0 ? C.moss : C.grass);
    }
  }
  if ((edgeMask & CONNECTION_BITS.e) !== 0) {
    for (let y = 0; y < 32; y++) {
      const depth = 2 + (mixHash(y, 4, 614) % 3);
      for (let d = 0; d < depth; d++) c.set(31 - d, y, d === 0 ? C.moss : C.grass);
    }
  }
  return c;
}

/** Draws 32x32 boundary survey overlays for locked and dormant future Rank cells. */
export function drawGhostV18(kind: GhostKind): Canvas {
  const c = new Canvas(32);
  const stroke = kind === 'locked' ? C.slate : C.sand;
  const corner = kind === 'locked' ? C.ash : C.cream;
  const shadow = kind === 'locked' ? C.ink : C.brownDark;

  for (let i = 2; i < 30; i += 4) {
    c.rect(i, 2, 2, 1, stroke);
    c.rect(i, 29, 2, 1, stroke);
    c.rect(2, i, 1, 2, stroke);
    c.rect(29, i, 1, 2, stroke);
  }
  const corners: readonly (readonly [number, number])[] = [
    [1, 1],
    [28, 1],
    [1, 28],
    [28, 28],
  ];
  for (const [cx, cy] of corners) {
    c.rect(cx, cy, 3, 3, shadow);
    c.rect(cx, cy, 2, 2, corner);
  }
  return c;
}
