import { PNG } from 'pngjs';
import { palette } from '../src/content/palette';

// A tiny pixel canvas for the portrait generators (technical design §12.3).
// Everything is drawn in palette colors, by name, so no pixel can leave the
// palette (tests/tools/portraits.test.ts checks this on the written files).

if (!palette) throw new Error('Choose a palette first (src/content/palette.ts).');

/** Zughy 32 colors by the role they play in the portraits. */
export const C = {
  ink: '302c2e',
  wine: '472d3c',
  plum: '39314b',
  violet: '564064',
  slate: '4f546b',
  dusk: '827094',
  night: '394778',
  blue: '3978a8',
  cyan: '28ccdf',
  ice: '8aebf1',
  frost: 'dff6f5',
  bone: 'cfc6b8',
  ash: 'a0938e',
  stone: '7d7071',
  coal: '5a5353',
  brownDark: '5e3643',
  brown: '7a444a',
  rust: 'a05b53',
  clay: 'bf7958',
  sand: 'eea160',
  cream: 'f4cca1',
  lime: 'b6d53c',
  grass: '71aa34',
  moss: '397b44',
  pine: '3c5956',
  gold: 'f4b41b',
  orange: 'f47e1b',
  red: 'e6482e',
  blood: 'a93b3b',
  rose: 'cd6093',
  pink: 'ffaeb6',
  orchid: '8e478c',
} as const;
export type ColorName = keyof typeof C;

const SIZE = 64;

export class Canvas {
  readonly px: (string | null)[] = Array.from({ length: SIZE * SIZE }, () => null);

  set(x: number, y: number, c: string | null): void {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= SIZE || iy >= SIZE) return;
    this.px[iy * SIZE + ix] = c;
  }

  get(x: number, y: number): string | null {
    return this.px[Math.round(y) * SIZE + Math.round(x)] ?? null;
  }

  fill(c: string | null): void {
    this.px.fill(c);
  }

  rect(x: number, y: number, w: number, h: number, c: string | null): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** A filled ellipse; `shade(x, y)` may return a different color per pixel. */
  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    c: string | ((x: number, y: number) => string | null),
  ): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'string' ? c : c(x, y));
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string, width = 1): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1;
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      for (let j = 0; j < width; j++) for (let k = 0; k < width; k++) this.set(x + j, y + k, c);
    }
  }

  /** Runs `draw` once as given and once mirrored left to right, for symmetric parts. */
  mirrored(draw: (set: (x: number, y: number, c: string) => void) => void): void {
    draw((x, y, c) => {
      this.set(x, y, c);
      this.set(SIZE - 1 - x, y, c);
    });
  }

  /** Draws a dark outline one pixel outside every filled pixel that touches empty space. */
  outline(c: string): void {
    const next = [...this.px];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (this.px[y * SIZE + x] !== null) continue;
        const touches = [
          this.px[y * SIZE + x - 1],
          this.px[y * SIZE + x + 1],
          this.px[(y - 1) * SIZE + x],
          this.px[(y + 1) * SIZE + x],
        ].some((n) => n !== undefined && n !== null);
        if (touches) next[y * SIZE + x] = c;
      }
    }
    this.px.splice(0, this.px.length, ...next);
  }

  toPng(): Buffer {
    const png = new PNG({ width: SIZE, height: SIZE });
    this.px.forEach((hex, i) => {
      const o = i * 4;
      if (hex === null) return;
      png.data[o] = parseInt(hex.slice(0, 2), 16);
      png.data[o + 1] = parseInt(hex.slice(2, 4), 16);
      png.data[o + 2] = parseInt(hex.slice(4, 6), 16);
      png.data[o + 3] = 255;
    });
    return PNG.sync.write(png);
  }
}

/** A deterministic 0–1 stream from a text seed, so a part's small variations never change. */
export const seedRolls = (seed: string): (() => number) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
};

export const PALETTE_HEX: ReadonlySet<string> = new Set(palette.colors);
