// GDD §9.12 and §9.21 (v1.1, D504; redrawn at TL.6b on the owner's marks): the Barracks, a martial
// timber-and-stone hall that is plainly not a cottage, and the Sawpit, a log on trestles under a saw.
// 32 px, three tiers each, drawn in code in the palette; each tier is larger or richer than the last.
import { C, Canvas } from './pixel';
import { SLATE, STRAW, door, roof, wall, window, type Roof } from './draw-grid-kit';

type Tier = 1 | 2 | 3;

/** Spears on a rack: two posts, a crossbar, shafts with iron heads. */
const rack = (c: Canvas, x: number, y: number, spears: number): void => {
  c.rect(x, y + 3, 1, 8, C.brownDark);
  c.rect(x + 5, y + 3, 1, 8, C.brownDark);
  c.rect(x, y + 5, 6, 1, C.brown);
  for (let i = 0; i < spears; i++) {
    const sx = x + 1 + i * 2;
    c.rect(sx, y + 1 + (i % 2), 1, 9 - (i % 2), C.brown);
    c.set(sx, y + (i % 2), C.ash);
    c.set(sx, y + 1 + (i % 2), C.bone);
  }
};

const shield = (c: Canvas, x: number, y: number): void => {
  c.rect(x, y, 5, 5, C.red);
  c.rect(x + 1, y + 5, 3, 1, C.red);
  c.set(x + 2, y + 6, C.red);
  c.rect(x + 2, y + 1, 1, 4, C.gold);
  c.rect(x + 1, y + 2, 3, 1, C.gold);
};

/** A straw target: bone and red rings. */
const target = (c: Canvas, x: number, y: number): void => {
  c.ellipse(x, y, 3, 3, C.bone);
  c.ellipse(x, y, 2, 2, C.red);
  c.set(x, y, C.gold);
};

export const drawBarracks = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const w = 16 + t * 4;
  const x = Math.floor((32 - w) / 2);
  const roofColor: Roof = t === 1 ? SLATE : { top: C.slate, shade: C.ink };
  // The hall: timber framing with plaster between, a stone course from Tier II.
  wall(c, x, 15, w, 15, C.cream, C.sand);
  for (let px = x; px < x + w; px += 5) c.rect(px, 15, 1, 15, C.brownDark);
  c.rect(x + w - 1, 15, 1, 15, C.brownDark);
  c.rect(x, 15, w, 2, C.brownDark);
  c.rect(x, 21, w, 1, C.brown);
  if (t >= 2) {
    c.rect(x, 24, w, 6, C.stone);
    for (let px = x + 1; px < x + w; px += 4) c.rect(px, 24, 1, 6, C.slate);
    c.rect(x, 27, w, 1, C.slate);
    c.rect(x, 24, w, 1, C.ash);
  }
  roof(c, x - 1, 8, w + 2, 7, roofColor);
  if (t >= 2) c.rect(x - 1, 14, w + 2, 1, C.brownDark); // a reinforced eave beam
  if (t === 3) for (let px = x; px < x + w - 2; px += 4) c.rect(px, 12, 3, 3, C.stone); // crenellated eaves
  const dx = x + Math.floor(w / 2) - 5;
  door(c, dx, 22, 4, 8);
  window(c, x + 2, 19);
  rack(c, dx + 6, 19, t === 1 ? 2 : 3);
  if (t === 2) target(c, x + w - 4, 20);
  if (t === 3) {
    shield(c, dx - 1, 16); // the hall's emblem over the door
    c.rect(x + w - 4, 1, 1, 10, C.brownDark); // the red-and-gold banner
    c.rect(x + w - 3, 2, 5, 4, C.red);
    c.rect(x + w - 3, 5, 3, 1, C.red);
    c.set(x + w - 1, 3, C.gold);
    c.set(x + w - 2, 3, C.gold);
  }
  c.outline(C.wine);
  return c;
};

const log = (c: Canvas, x: number, y: number, w: number): void => {
  c.rect(x, y, w, 5, C.brown);
  c.rect(x, y, w, 1, C.rust);
  c.rect(x, y + 4, w, 1, C.brownDark);
  c.rect(x + w - 1, y, 1, 5, C.sand);
  c.set(x + w - 1, y + 2, C.clay);
};

const trestle = (c: Canvas, x: number, y: number, h: number): void => {
  for (let k = 0; k < h; k++) {
    c.set(x - Math.floor(k / 3), y + k, C.brownDark);
    c.set(x + 2 + Math.floor(k / 3), y + k, C.brownDark);
  }
  c.rect(x - 1, y, 5, 1, C.brown);
};

/** A pit saw: a long blade between two handles, standing in the log. */
const pitSaw = (c: Canvas, x: number, y: number): void => {
  c.rect(x, y - 7, 3, 1, C.brownDark);
  c.rect(x, y + 6, 3, 1, C.brownDark);
  c.rect(x + 1, y - 6, 1, 12, C.ash);
  for (let k = 0; k < 12; k += 2) c.set(x + 2, y - 6 + k, C.bone);
};

const planks = (c: Canvas, x: number, y: number, rows: number, w: number): void => {
  for (let i = 0; i < rows; i++) {
    c.rect(x, y - i * 2, w, 2, i % 2 === 0 ? C.sand : C.cream);
    c.rect(x, y - i * 2 + 1, w, 1, C.clay);
  }
};

export const drawSawpit = (t: Tier): Canvas => {
  const c = new Canvas(32);
  if (t === 1) {
    // A log on two trestles with a pit saw through it, sawn planks beside.
    trestle(c, 6, 20, 9);
    trestle(c, 19, 20, 9);
    log(c, 3, 15, 22);
    pitSaw(c, 13, 17);
    planks(c, 26, 29, 3, 5);
  } else if (t === 2) {
    // An open-sided canopy over the cutting frame, a larger stack of lumber.
    for (const px of [3, 24]) c.rect(px, 8, 2, 22, C.brownDark);
    roof(c, 1, 2, 26, 6, STRAW);
    c.rect(2, 8, 24, 1, C.brown);
    trestle(c, 7, 22, 8);
    trestle(c, 19, 22, 8);
    log(c, 5, 17, 18);
    pitSaw(c, 13, 18);
    planks(c, 27, 29, 4, 5);
  } else {
    // A full saw-shed: roofed, a circular blade biting a log, tall stacks of planks.
    for (const px of [2, 20]) c.rect(px, 8, 2, 22, C.brownDark);
    roof(c, 0, 1, 24, 7, STRAW);
    c.rect(1, 8, 22, 2, C.brown);
    trestle(c, 6, 22, 8);
    trestle(c, 15, 22, 8);
    log(c, 4, 17, 17);
    c.ellipse(12, 17, 4, 4, C.ash); // the circular blade
    c.ellipse(12, 17, 1, 1, C.ink);
    for (let k = 0; k < 8; k++)
      c.set(12 + Math.round(4 * Math.cos(k * 0.8)), 17 + Math.round(4 * Math.sin(k * 0.8)), C.bone);
    planks(c, 25, 29, 7, 6);
    planks(c, 25, 15, 2, 6);
  }
  c.outline(C.wine);
  return c;
};
