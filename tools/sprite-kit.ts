// v1.7 (plan VB.8, D605): the small drawing kit behind tools/sprite-batch4.ts and
// tools/sprite-batch4-redraws.ts: masks, tubes, rim-lit fills and ink seams over the pixel Canvas.
import { SPRITE_PX } from '../src/content/assets';
import { C, Canvas } from './pixel';

export const N = SPRITE_PX;
export type Mask = boolean[];

export const mask = (draw: (c: Canvas) => void): Mask => {
  const c = new Canvas(N);
  draw(c);
  return c.px.map((v) => v !== null);
};
export const has = (m: Mask, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < N && y < N && m[y * N + x] === true;
export const union = (...ms: Mask[]): Mask =>
  ms[0]?.map((_, i) => ms.some((m) => m[i] === true)) ?? [];
export const minus = (a: Mask, b: Mask): Mask => a.map((v, i) => v && b[i] !== true);
export const ellipseM = (cx: number, cy: number, rx: number, ry: number): Mask =>
  mask((c) => c.ellipse(cx, cy, rx, ry, '1'));
export const polyM = (pts: readonly (readonly [number, number])[]): Mask =>
  mask((c) => c.polygon(pts, '1'));
export const lineM = (x0: number, y0: number, x1: number, y1: number, w = 1): Mask =>
  mask((c) => c.line(x0, y0, x1, y1, '1', w));
/** A round-ended tube along a path of [x, y, radius] points. */
export const tubeM = (pts: readonly (readonly [number, number, number])[]): Mask =>
  mask((c) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0, r0] = pts[i] as readonly [number, number, number];
      const [x1, y1, r1] = pts[i + 1] as readonly [number, number, number];
      const steps = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const r = r0 + (r1 - r0) * t;
        c.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, '1');
      }
    }
  });

export interface Lit {
  readonly mid: string;
  readonly light: string;
  readonly dark: string;
  readonly top?: string;
  readonly left?: string;
  readonly right?: string;
  readonly bottom?: string;
  readonly tex?: (x: number, y: number) => string | null;
}
/** Rim-lit fill: light from the top left, so top and left edges lift and bottom and right edges sink. */
export const lit = (c: Canvas, m: Mask, s: Lit): void => {
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (!has(m, x, y)) continue;
      let col = s.mid;
      if (!has(m, x, y - 1)) col = s.top ?? s.light;
      else if (!has(m, x - 1, y)) col = s.left ?? s.light;
      else if (!has(m, x, y + 1)) col = s.bottom ?? s.dark;
      else if (!has(m, x + 1, y)) col = s.right ?? s.dark;
      else if (s.tex) col = s.tex(x, y) ?? col;
      c.set(x, y, col);
    }
};
/** A deterministic scatter: true for about one pixel in `m`, with no diagonal stripes. */
export const spk = (x: number, y: number, m: number, k = 0): boolean =>
  ((Math.imul(x + k, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % m === 0;
export const dots = (c: Canvas, col: string, pts: readonly (readonly [number, number])[]): void => {
  for (const [x, y] of pts) c.set(x, y, col);
};

/** Ink seam: where part `m` will overlap something already painted, draw a dark edge around it first. */
export const sep = (c: Canvas, m: Mask): void => {
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (!has(m, x, y) && c.get(x, y) !== null) {
        const touches =
          has(m, x - 1, y) || has(m, x + 1, y) || has(m, x, y - 1) || has(m, x, y + 1);
        if (touches) c.set(x, y, C.ink);
      }
};
