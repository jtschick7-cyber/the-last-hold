// GDD §5.1.5, §5.15.6 and §9.21 (v1.1, D504, D457): the 2 × 2 Hearth Hall on the Hold grid, 64 px,
// at each Rank, drawn in code in the palette. The door and the lit window sit in the same place at
// every Rank so the Carved Door and the lamp are one overlay each; the frost follows each roofline,
// so it is drawn from the Rank's own picture.
import type { AgeId } from '../src/content/ages';
import { C, Canvas } from './pixel';

const N = 64;
/** Fixed at every Rank: the door (x, y, w, h) and the window the lamp lights (x, y, w, h). */
export const HALL_DOOR = [27, 44, 10, 18] as const;
export const HALL_WINDOW = [14, 38, 6, 7] as const;
const HALL_WINDOW2 = [44, 38, 6, 7] as const;

const block = (
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
  c.rect(x + w - 2, y, 2, h, shade);
};

const gable = (
  c: Canvas,
  x0: number,
  x1: number,
  base: number,
  rise: number,
  top: string,
  shade: string,
): void => {
  const mid = (x0 + x1) / 2;
  for (let row = 0; row < rise; row++) {
    const half = ((x1 - x0) / 2) * ((row + 1) / rise);
    const left = Math.round(mid - half);
    const right = Math.round(mid + half);
    c.rect(left, base - rise + row, right - left, 1, row % 4 === 3 ? shade : top);
    c.set(right - 1, base - rise + row, shade);
  }
};

const stoneFace = (c: Canvas, x: number, y: number, w: number, h: number): void => {
  block(c, x, y, w, h, C.stone, C.slate);
  for (let yy = y + 3; yy < y + h; yy += 4) c.rect(x, yy, w, 1, C.slate);
  for (let yy = y; yy < y + h - 1; yy += 4)
    for (let xx = x + ((yy - y) % 8 === 0 ? 3 : 7); xx < x + w - 2; xx += 8)
      c.set(xx, yy + 1, C.slate);
  c.rect(x, y, w, 1, C.ash);
};

const door = (c: Canvas): void => {
  const [x, y, w, h] = HALL_DOOR;
  c.rect(x, y, w, h, C.brownDark);
  c.rect(x + 1, y - 1, w - 2, 1, C.brownDark); // a rounded head
  c.rect(x + 4, y, 1, h, C.brown);
  c.set(x + 3, y + 9, C.gold);
  c.set(x + 6, y + 9, C.gold);
};

const windows = (c: Canvas): void => {
  for (const [x, y, w, h] of [HALL_WINDOW, HALL_WINDOW2]) {
    c.rect(x, y, w, h, C.night);
    c.rect(x + 2, y, 1, h, C.ink);
    c.rect(x, y + 3, w, 1, C.ink);
    c.rect(x - 1, y + h, w + 2, 1, C.coal);
  }
};

const banner = (c: Canvas, x: number, y: number): void => {
  c.rect(x, y, 1, 14, C.brownDark);
  c.rect(x + 1, y + 1, 7, 6, C.red);
  c.rect(x + 1, y + 6, 5, 2, C.red);
  c.set(x + 4, y + 3, C.gold);
};

const tower = (c: Canvas, x: number, top: number, w: number, roofTop: string): void => {
  stoneFace(c, x, top, w, N - 2 - top);
  gable(c, x - 2, x + w + 2, top, 8, roofTop, C.night);
  c.rect(x + w / 2 - 1, top + 6, 2, 5, C.ink);
};

export const HALL_RANKS: readonly AgeId[] = ['hamlet', 'keep', 'citadel', 'bastion'];

export const drawHall = (age: AgeId): Canvas => {
  const c = new Canvas(N);
  if (age === 'hamlet') {
    block(c, 9, 32, 46, 30, C.brown, C.brownDark);
    for (let x = 9; x < 55; x += 8) c.rect(x, 32, 1, 30, C.brownDark); // timber frame
    c.rect(9, 44, 46, 1, C.brownDark);
    gable(c, 6, 58, 32, 16, C.rust, C.brownDark);
    c.rect(44, 12, 5, 12, C.stone);
    c.rect(44, 12, 5, 1, C.ash);
  } else if (age === 'keep') {
    stoneFace(c, 8, 38, 48, 24);
    block(c, 8, 28, 48, 10, C.cream, C.sand);
    for (let x = 8; x < 56; x += 8) c.rect(x, 28, 1, 10, C.brown);
    gable(c, 4, 60, 28, 18, C.slate, C.plum);
    c.rect(46, 8, 5, 13, C.stone);
    c.rect(46, 8, 5, 1, C.ash);
  } else if (age === 'citadel') {
    stoneFace(c, 6, 30, 38, 32);
    gable(c, 4, 46, 30, 14, C.blue, C.night);
    tower(c, 44, 14, 14, C.red);
    banner(c, 51, 0);
    for (let x = 6; x < 44; x += 6) c.rect(x, 27, 3, 3, C.stone); // crenels
  } else {
    stoneFace(c, 14, 28, 36, 34);
    gable(c, 10, 54, 28, 12, C.blue, C.night);
    tower(c, 2, 12, 12, C.red);
    tower(c, 50, 12, 12, C.red);
    banner(c, 31, 2);
    for (let x = 14; x < 50; x += 6) c.rect(x, 25, 3, 3, C.stone);
    c.rect(26, 43, 12, 1, C.coal); // the gate arch's lintel
  }
  door(c);
  windows(c);
  c.outline(C.wine);
  return c;
};

/** The Carved Hearth Hall door: dark oak planks, bronze hinge straps, a ring at the centre. */
export const drawHallDoor = (): Canvas => {
  const c = new Canvas(N);
  const [x, y, w, h] = HALL_DOOR;
  c.rect(x + 1, y - 1, w - 2, 1, C.brownDark); // the rounded head
  c.rect(x, y, w, h, C.brownDark);
  for (const px of [x + 2, x + 5, x + 7]) c.rect(px, y, 1, h, C.brown); // plank joints
  c.rect(x, y, 1, h, C.wine);
  c.rect(x + w - 1, y, 1, h, C.wine);
  for (const py of [y + 3, y + 13]) {
    c.rect(x, py, w, 2, C.clay); // bronze straps
    c.rect(x, py + 1, w, 1, C.rust);
    for (const px of [x + 1, x + w - 2]) c.set(px, py, C.gold); // rivets
  }
  c.rect(x + 4, y + 7, 2, 2, C.gold); // the ring, with its hole
  c.set(x + 4, y + 7, C.orange);
  c.set(x + 5, y + 8, C.brownDark);
  c.set(x + 4, y + 9, C.gold);
  c.set(x + 5, y + 9, C.gold);
  return c;
};

/** After Remember Them: a lantern on the sill, the panes warm, the frame and mullions kept. */
export const drawHallLamp = (): Canvas => {
  const c = new Canvas(N);
  const [x, y, , h] = HALL_WINDOW;
  for (const [px, py, pw, ph] of [
    [x, y, 2, 3],
    [x + 3, y, 3, 3],
    [x, y + 4, 2, 3],
    [x + 3, y + 4, 3, 3],
  ] as const) {
    c.rect(px, py, pw, ph, C.orange);
    c.rect(px, py, pw, 1, C.sand);
  }
  c.rect(x + 1, y + h - 3, 4, 3, C.gold); // the lantern on the sill
  c.rect(x + 2, y + h - 2, 2, 1, C.cream);
  c.set(x + 2, y + h - 4, C.gold);
  c.set(x + 3, y + h - 4, C.gold);
  return c;
};

/** Act VI: rime on the roofline, the windows' sills and the foot of the walls, read from the Rank's own picture. */
export const drawHallFrost = (age: AgeId): Canvas => {
  const base = drawHall(age);
  const c = new Canvas(N);
  const opaque = (x: number, y: number): boolean => base.get(x, y) !== null;
  const outline = (x: number, y: number): boolean => base.get(x, y) === C.wine;
  for (let x = 0; x < N; x++) {
    let top = 0;
    while (top < N && !opaque(x, top)) top++;
    if (top >= N - 8) continue;
    const first = outline(x, top) ? top + 1 : top;
    if (!outline(x, first)) c.set(x, first, C.frost);
    if (!outline(x, first + 1)) c.set(x, first + 1, x % 3 === 0 ? C.ice : C.frost);
    if (x % 5 === 2 && !outline(x, first + 2)) c.set(x, first + 2, C.ice);
  }
  for (let x = 0; x < N; x++) {
    if (opaque(x, N - 2) && !outline(x, N - 2)) c.set(x, N - 2, C.frost);
    if (opaque(x, N - 3) && !outline(x, N - 3) && x % 4 !== 1) c.set(x, N - 3, C.ice);
  }
  return c;
};
