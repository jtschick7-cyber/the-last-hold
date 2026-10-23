// The small drawing helpers the grid's building pictures share (GDD §9.12, v1.1): a wall block, a roof,
// a door and a window, in the palette. Kept apart so the building files do not import each other.
import { C, Canvas } from './pixel';

export type Roof = { top: string; shade: string };
export const RED: Roof = { top: C.orange, shade: C.red };
export const BLUE: Roof = { top: C.blue, shade: C.night };
export const SLATE: Roof = { top: C.slate, shade: C.plum };
export const STRAW: Roof = { top: C.gold, shade: C.sand };

/** A wall block with a lit top edge and a shaded foot. */
export const wall = (
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  body: string,
  shade: string,
): void => {
  c.rect(x, y, w, h, body);
  c.rect(x, y + h - 1, w, 1, shade);
  c.rect(x + w - 1, y, 1, h, shade);
};

/** A hip roof drawn as stacked rows, narrowing upward, with a lit left half. */
export const roof = (c: Canvas, x: number, y: number, w: number, h: number, r: Roof): void => {
  for (let row = 0; row < h; row++) {
    const inset = Math.floor(((h - 1 - row) * 3) / 4) === 0 ? 0 : Math.floor((h - 1 - row) / 2);
    const left = x + inset;
    const width = w - inset * 2;
    c.rect(left, y + row, width, 1, row % 3 === 2 ? r.shade : r.top);
    c.set(left + width - 1, y + row, r.shade);
  }
};

export const door = (c: Canvas, x: number, y: number, w = 4, h = 6): void => {
  c.rect(x, y, w, h, C.brownDark);
  c.rect(x, y, w, 1, C.brown);
  c.set(x + w - 2, y + Math.floor(h / 2), C.gold);
};

export const chimney = (c: Canvas, x: number, y: number, h: number, smoke: boolean): void => {
  c.rect(x, y, 3, h, C.stone);
  c.rect(x, y, 3, 1, C.ash);
  if (smoke) {
    c.set(x + 1, y - 2, C.ash);
    c.set(x + 2, y - 4, C.bone);
    c.set(x, y - 6, C.ash);
  }
};

export const window = (c: Canvas, x: number, y: number, lit = false): void => {
  c.rect(x, y, 3, 3, lit ? C.gold : C.night);
  c.set(x, y, lit ? C.cream : C.blue);
};
