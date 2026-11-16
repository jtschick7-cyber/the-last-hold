import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { C, Canvas } from './pixel';
import { packPng } from './png-pack';

/** Deterministic integer hash for pixel-art masonry, grass tufts, and mortar variation. */
export function mixHash(x: number, y: number, seed: number): number {
  let h =
    (Math.imul(x + 17, 374761393) +
      Math.imul(y + 31, 668265263) +
      Math.imul(seed + 7, 2147483647)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Stamps src canvas onto dst canvas at (ox, oy), skipping transparent pixels. */
export function stampCanvas(dst: Canvas, src: Canvas, ox = 0, oy = 0, maxH = src.size): void {
  for (let y = 0; y < maxH; y++) {
    for (let x = 0; x < src.size; x++) {
      const c = src.get(x, y);
      if (c !== null) dst.set(ox + x, oy + y, c);
    }
  }
}

/** Draws a top-left lit ashlar masonry block surface within (x, y, w, h). */
export function drawAshlarWall(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  options: { rowH?: number; colW?: number; dark?: boolean; seed?: number } = {},
): void {
  const rowH = options.rowH ?? 5;
  const colW = options.colW ?? 8;
  const seed = options.seed ?? 11;
  const dark = options.dark ?? false;

  for (let j = 0; j < h; j++) {
    const course = Math.floor(j / rowH);
    const inRow = j % rowH;
    const xShift = (course % 2) * Math.floor(colW / 2);
    for (let i = 0; i < w; i++) {
      const col = Math.floor((i + xShift) / colW);
      const inCol = (i + xShift) % colW;
      const gx = x + i;
      const gy = y + j;

      if (inRow === rowH - 1 || inCol === colW - 1) {
        c.set(gx, gy, dark ? C.plum : C.slate);
        continue;
      }

      const roll = mixHash(col, course, seed) % 12;
      if (inRow === 0 && j < Math.floor(h * 0.45)) {
        c.set(gx, gy, dark ? C.stone : roll < 5 ? C.bone : C.ash);
      } else if (inCol === 0) {
        c.set(gx, gy, dark ? C.stone : C.ash);
      } else if (roll < 3) {
        c.set(gx, gy, dark ? C.slate : C.stone);
      } else if (roll < 8) {
        c.set(gx, gy, dark ? C.coal : roll === 4 ? C.ash : C.stone);
      } else {
        c.set(gx, gy, dark ? C.slate : C.ash);
      }
    }
  }
}

/** Draws scalloped Heraldic Blue Slate or Terracotta roof tiles matching v1.6 Hold scenes. */
export function drawShingledRoof(
  c: Canvas,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  options: {
    palette: 'blue' | 'red' | 'wood';
    taper?: number;
    scallops?: boolean;
  },
): void {
  const height = Math.max(1, y1 - y0 + 1);
  const taper = options.taper ?? 0;
  const scallops = options.scallops ?? true;

  const tones =
    options.palette === 'blue'
      ? { ridge: C.ice, light: C.blue, mid: C.night, shadow: C.plum, trim: C.bone }
      : options.palette === 'red'
        ? { ridge: C.gold, light: C.orange, mid: C.red, shadow: C.blood, trim: C.cream }
        : { ridge: C.sand, light: C.clay, mid: C.rust, shadow: C.brown, trim: C.cream };

  for (let y = y0; y <= y1; y++) {
    const t = height === 1 ? 0 : (y - y0) / (height - 1);
    const inset = Math.round((1 - t) * taper);
    const lx = x0 + inset;
    const rx = x1 - inset;
    const course = Math.floor((y - y0) / 4);
    const inCourse = (y - y0) % 4;
    const shift = (course % 2) * 3;

    for (let x = lx; x <= rx; x++) {
      if (y === y0) {
        c.set(x, y, tones.ridge);
      } else if (y === y1) {
        c.set(x, y, tones.shadow);
      } else if (inCourse === 3) {
        c.set(x, y, tones.shadow);
      } else if (scallops && inCourse === 1 && (x + shift) % 6 === 2) {
        c.set(x, y, x - lx < (rx - lx) * 0.6 ? tones.trim : tones.light);
      } else if (inCourse === 0 && t < 0.65) {
        c.set(x, y, tones.light);
      } else if (x === lx || (x - lx < 3 && t < 0.7)) {
        c.set(x, y, tones.light);
      } else {
        c.set(x, y, t > 0.78 ? tones.shadow : tones.mid);
      }
    }
  }
}

/** Draws a framed arched oak doorway centered within (x, y, w, h). */
export function drawArchedDoor(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  options: { stoneArch?: boolean } = {},
): void {
  const frameCol = options.stoneArch ? C.slate : C.brownDark;
  const trimCol = options.stoneArch ? C.ash : C.rust;
  c.rect(x, y + 1, w, h - 1, C.wine);
  c.rect(x + 1, y + 2, w - 2, h - 2, frameCol);
  c.rect(x + 1, y, w - 2, 2, trimCol);
  c.set(x, y + 1, trimCol);
  c.set(x + w - 1, y + 1, frameCol);

  // Carved plank door interior
  for (let j = 2; j < h; j++) {
    for (let i = 2; i < w - 2; i++) {
      if (j === 2 && (i === 2 || i === w - 3)) {
        c.set(x + i, y + j, trimCol);
        continue;
      }
      const centerSplit = i === Math.floor(w / 2);
      const brace = j === 5 || j === h - 4;
      if (centerSplit) c.set(x + i, y + j, C.wine);
      else if (brace) c.set(x + i, y + j, C.brownDark);
      else c.set(x + i, y + j, i % 2 === 0 ? C.brown : C.rust);
    }
  }
  // Brass studs / handles
  c.set(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) + 1, C.gold);
  c.set(x + Math.floor(w / 2) + 1, y + Math.floor(h / 2) + 1, C.gold);
}

/** Draws a warm mullioned casement window inside (x, y, w, h). */
export function drawMullionedWindow(
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  lit = false,
): void {
  c.rect(x, y, w, h, C.wine);
  for (let j = 1; j < h - 1; j++) {
    for (let i = 1; i < w - 1; i++) {
      const mullion = i === Math.floor(w / 2) || j === Math.floor(h / 2);
      if (mullion) {
        c.set(x + i, y + j, C.brown);
      } else if (lit) {
        c.set(x + i, y + j, j < h - 2 ? C.gold : C.orange);
      } else {
        c.set(x + i, y + j, j === 1 ? C.blue : C.night);
      }
    }
  }
  c.rect(x, y + h - 1, w, 1, C.ash);
}

/** Derives crisp winter snow caps, merlon drifts & icicles along silhouette ledges. */
export function deriveFrostOverlay(base: Canvas, minRoofY = 0, maxRoofY = base.size - 1): Canvas {
  const out = new Canvas(base.size);
  const n = base.size;
  for (let x = 0; x < n; x++) {
    let snowCaps = 0;
    for (let y = minRoofY; y <= maxRoofY; y++) {
      const col = base.get(x, y);
      const above = y > 0 ? base.get(x, y - 1) : null;
      if (snowCaps < 2 && col !== null && col !== C.wine && above === C.wine) {
        const up2 = y > 1 ? base.get(x, y - 2) : null;
        if (up2 === null || snowCaps === 0) {
          out.set(x, y - 1, C.ice);
          out.set(x, y, C.frost);
          if (y + 1 < n && base.get(x, y + 1) !== null) {
            out.set(x, y + 1, x % 3 === 0 ? C.ice : C.frost);
          }
          snowCaps++;
        }
      }
      // Subtle eave icicles on exposed shadowed roof soffits
      if (
        x % 5 === 2 &&
        y > minRoofY + 6 &&
        y <= maxRoofY &&
        (col === C.plum || col === C.brownDark)
      ) {
        const below = y + 1 < n ? base.get(x, y + 1) : null;
        if (below !== null && below !== C.plum && below !== C.brownDark) {
          out.set(x, y, C.frost);
          out.set(x, y + 1, C.ice);
        }
      }
    }
    // Sill & base drift snow along the bottom plinth
    for (let y = n - 2; y >= Math.floor(n * 0.88); y--) {
      const col = base.get(x, y);
      const below = y + 1 < n ? base.get(x, y + 1) : null;
      if (col !== null && (below === null || below === C.wine)) {
        out.set(x, y, x % 2 === 0 ? C.frost : C.ice);
        break;
      }
    }
  }
  return out;
}

/** Losslessly packs a Canvas PNG buffer via tools/png-pack and writes to disk. */
export function writePackedPng(
  dir: string,
  filename: string,
  canvas: Canvas,
  height: number = canvas.size,
): { name: string; path: string; w: number; h: number; buffer: Buffer; sha256: string } {
  mkdirSync(dir, { recursive: true });
  const raw = canvas.toPng(height);
  const packed = packPng(raw);
  const buffer = packed !== null && packed.length <= raw.length ? packed : raw;
  const fullPath = resolve(dir, filename);
  writeFileSync(fullPath, buffer);
  const png = PNG.sync.read(buffer);
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  return { name: filename, path: fullPath, w: png.width, h: png.height, buffer, sha256 };
}

/** Adds an internal 1 px C.wine silhouette outline only outside existing pixels. */
export function applyWineOutline(c: Canvas): void {
  c.outline(C.wine);
}
