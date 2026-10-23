// GDD §9.12 and §9.21 (v1.1, D504; redrawn at TL.6b on the owner's marks): the Mine, a timbered
// tunnel mouth in dark rock with rails and ore, and the Silver Seam, a craggy outcrop split by a
// branching vein of bright silver. 32 px, drawn in code in the palette, ground left clear.
import { C, Canvas, seedRolls } from './pixel';

/** A craggy mound: a jagged top edge, lit upper left, shaded lower right, flecked. */
const mound = (
  c: Canvas,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  seed: string,
): void => {
  const roll = seedRolls(seed);
  const mid = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  for (let x = x0; x <= x1; x++) {
    const swell = 1 - Math.pow(Math.abs(x - mid) / half, 2);
    const edge = Math.round(bottom - (bottom - top) * Math.max(0.15, swell) + roll() * 3 - 1);
    for (let y = edge; y <= bottom; y++) {
      const shade = y - edge < 2 ? C.ash : x > mid + half / 3 ? C.coal : C.stone;
      c.set(x, y, y > bottom - 2 ? C.ink : shade);
    }
  }
  for (let i = 0; i < 26; i++) {
    const x = x0 + Math.floor(roll() * (x1 - x0));
    const y = top + 3 + Math.floor(roll() * (bottom - top - 4));
    if (c.get(x, y) !== null) c.set(x, y, roll() < 0.5 ? C.slate : C.ink);
  }
};

/** A timber-framed tunnel mouth, dark inside. */
const mouth = (c: Canvas, x: number, y: number, w: number, h: number): void => {
  c.rect(x, y, w, h, C.ink);
  c.rect(x + 1, y + h - 2, w - 2, 2, C.coal);
  c.rect(x - 1, y - 2, w + 2, 2, C.brown); // lintel
  c.rect(x - 1, y - 2, w + 2, 1, C.rust);
  c.rect(x - 1, y - 2, 2, h + 2, C.brown); // posts
  c.rect(x + w - 1, y - 2, 2, h + 2, C.brown);
  c.rect(x - 1, y + h - 1, 1, 1, C.brownDark);
};

/** Two rails with sleepers running out of the mouth toward the viewer. */
const rails = (c: Canvas, x: number, y: number, len: number): void => {
  for (let k = 0; k < len; k++) {
    c.set(x, y + k, C.ash);
    c.set(x + 5, y + k, C.ash);
    if (k % 3 === 1) c.rect(x - 1, y + k, 8, 1, C.brownDark);
  }
};

const orePile = (c: Canvas, x: number, y: number): void => {
  c.ellipse(x, y, 4, 2.5, C.stone);
  c.set(x - 1, y - 1, C.frost);
  c.set(x + 1, y, C.ice);
  c.set(x + 2, y - 1, C.gold);
};

const cart = (c: Canvas, x: number, y: number): void => {
  c.rect(x, y, 7, 4, C.brownDark);
  c.rect(x, y, 7, 1, C.brown);
  c.rect(x + 1, y - 1, 5, 1, C.stone);
  c.set(x + 3, y - 1, C.frost);
  c.set(x + 1, y + 4, C.coal);
  c.set(x + 5, y + 4, C.coal);
};

/** A hoist frame: two legs, a cross beam and a wheel. */
const headframe = (c: Canvas, x: number, y: number): void => {
  for (let k = 0; k < 9; k++) {
    c.set(x + Math.floor(k / 3), y + k, C.brown);
    c.set(x + 8 - Math.floor(k / 3), y + k, C.brown);
  }
  c.rect(x + 2, y + 2, 5, 1, C.brownDark);
  c.ellipse(x + 4, y + 1, 2, 2, C.ash);
  c.set(x + 4, y + 1, C.ink);
};

export const drawMine = (d: 1 | 2 | 3): Canvas => {
  const c = new Canvas(32);
  if (d === 1) {
    mound(c, 3, 28, 7, 24, 'mine.1');
    mouth(c, 12, 14, 8, 10);
    c.set(17, 22, C.gold); // a glint of ore
    rails(c, 13, 25, 6);
    orePile(c, 6, 27);
  } else if (d === 2) {
    mound(c, 1, 30, 5, 23, 'mine.2');
    mouth(c, 5, 13, 7, 10);
    mouth(c, 19, 13, 7, 10);
    c.rect(15, 11, 1, 3, C.brownDark); // a lantern on a hook, glowing
    c.rect(14, 14, 3, 3, C.gold);
    c.set(15, 15, C.cream);
    rails(c, 6, 24, 6);
    orePile(c, 24, 27);
  } else {
    mound(c, 0, 31, 8, 22, 'mine.3');
    headframe(c, 12, 0);
    mouth(c, 3, 13, 7, 9);
    mouth(c, 12, 12, 8, 10);
    mouth(c, 22, 13, 7, 9);
    c.set(16, 12, C.gold);
    rails(c, 13, 23, 5);
    cart(c, 3, 25);
    cart(c, 22, 26);
    orePile(c, 16, 29);
  }
  c.outline(C.wine);
  return c;
};

export const SEAM_LOOKS = [1, 2] as const;

/** A jagged outcrop; `seed` fixes its outline and its vein. */
const outcrop = (c: Canvas, cx: number, cy: number, r: number, seed: string): void => {
  const roll = seedRolls(seed);
  const pts: [number, number][] = [];
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2;
    const rr = r * (0.7 + roll() * 0.4);
    pts.push([cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * 0.9]);
  }
  c.polygon(pts, (x, y) =>
    y < cy - r / 3
      ? C.stone
      : x > cx + r / 3 && y > cy
        ? C.slate
        : y > cy + r / 2
          ? C.slate
          : C.coal,
  );
  for (let i = 0; i < 4; i++) {
    const x = Math.round(cx - r * 0.6 + roll() * r * 1.1);
    const y = Math.round(cy - r * 0.7 + roll() * r * 0.3);
    if (c.get(x, y) !== null) c.rect(x, y, 2, 1, C.ash);
  }
  // The vein: a jagged walk from the top down through the rock, with two side branches.
  let vx = cx - 1;
  const branch = (x: number, y: number, dir: number, len: number): void => {
    for (let k = 0; k < len; k++) {
      x += dir * (k % 2);
      y += 1;
      if (c.get(x, y) !== null) c.set(x, y, k % 3 === 0 ? C.frost : C.ice);
    }
  };
  for (let y = Math.round(cy - r * 0.7); y < cy + r * 0.6; y++) {
    vx += Math.floor(roll() * 3) - 1;
    if (c.get(vx, y) !== null) {
      c.set(vx, y, y % 3 === 0 ? C.frost : C.cyan);
      if (y % 3 === 1) c.set(vx + 1, y, C.ice);
    }
    if (y === Math.round(cy - r * 0.2)) branch(vx, y, 1, 5);
    if (y === Math.round(cy + r * 0.1)) branch(vx, y, -1, 4);
  }
};

/** A Silver Seam: one outcrop with a branching vein, then twin outcrops. */
export const drawSeam = (look: 1 | 2): Canvas => {
  const c = new Canvas(32);
  if (look === 1) outcrop(c, 16, 17, 11, 'seam.1');
  else {
    outcrop(c, 10, 14, 8, 'seam.2a');
    outcrop(c, 22, 22, 8, 'seam.2b');
  }
  c.outline(C.wine);
  return c;
};
