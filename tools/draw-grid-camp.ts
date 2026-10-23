// GDD §9.12 and §9.21 (v1.1, D504; redrawn at TL.6c on the owner's marks): the Woodcutter's Camp
// plot at three densities: a stump with an axe and cut logs; a stump and a pyramid of logs; a busy
// yard with cordwood piles, a stump and a timber shelter. 32 px, drawn in code in the palette.
import { C, Canvas } from './pixel';
import { STRAW, roof } from './draw-grid-kit';

/** The round end of a log: bark, pale wood, a ring and a heart. */
const logEnd = (c: Canvas, x: number, y: number): void => {
  c.ellipse(x, y, 3, 3, C.brown);
  c.ellipse(x, y, 2, 2, C.sand);
  c.ellipse(x, y, 1, 1, C.clay);
  c.set(x, y, C.cream);
};

/** A stack of log ends, widest row at the bottom, narrowing upward. */
const pyramid = (c: Canvas, cx: number, base: number, rows: number): void => {
  for (let r = 0; r < rows; r++) {
    const n = rows - r;
    for (let i = 0; i < n; i++) logEnd(c, Math.round(cx + (i - (n - 1) / 2) * 6), base - r * 5);
  }
};

/** A cut log lying on its side, its round end toward the viewer's right. */
const cutLog = (c: Canvas, x: number, y: number, len: number): void => {
  c.rect(x, y, len, 5, C.brown);
  c.rect(x, y, len, 1, C.rust);
  c.rect(x, y + 4, len, 1, C.brownDark);
  c.rect(x + len - 1, y, 1, 5, C.sand);
  c.set(x + len - 1, y + 2, C.clay);
};

/** A chopping stump: a lighter top with growth rings, bark sides. */
const stump = (c: Canvas, cx: number, cy: number): void => {
  c.rect(cx - 4, cy, 8, 6, C.brownDark);
  c.rect(cx - 4, cy + 5, 8, 1, C.wine);
  c.rect(cx + 2, cy, 2, 6, C.wine);
  c.ellipse(cx, cy, 4, 2.5, C.sand);
  c.ellipse(cx, cy, 2.5, 1.5, C.clay);
  c.set(cx, cy, C.cream);
};

/** An axe wedged in the top of a stump: a diagonal handle and a flared steel blade. */
const axe = (c: Canvas, cx: number, cy: number): void => {
  for (let k = 0; k < 8; k++) c.set(cx + 1 + Math.floor(k * 0.8), cy - 1 - k, C.brown);
  c.set(cx + 1, cy - 1, C.brownDark);
  c.rect(cx - 2, cy - 3, 3, 3, C.ash); // the blade, flaring toward the cut
  c.rect(cx - 3, cy - 2, 1, 3, C.bone);
  c.set(cx - 2, cy - 1, C.bone);
  c.set(cx + 1, cy - 4, C.stone);
};

export const drawCamp = (d: 1 | 2 | 3): Canvas => {
  const c = new Canvas(32);
  if (d === 1) {
    stump(c, 12, 20);
    axe(c, 12, 20);
    cutLog(c, 17, 22, 11);
    cutLog(c, 15, 28, 11);
  } else if (d === 2) {
    stump(c, 9, 22);
    axe(c, 9, 22);
    cutLog(c, 2, 28, 9);
    pyramid(c, 23, 28, 3);
  } else {
    // The shelter: a roof on two posts with a sawbuck and logs underneath.
    for (const px of [15, 28]) c.rect(px, 5, 2, 11, C.brownDark);
    roof(c, 13, 0, 18, 5, STRAW);
    c.rect(18, 11, 1, 5, C.brown);
    c.rect(24, 11, 1, 5, C.brown);
    c.rect(17, 12, 9, 1, C.brownDark);
    cutLog(c, 17, 9, 9);
    // Cordwood piles and the chopping stump.
    for (let r = 0; r < 3; r++) for (let i = 0; i < 2; i++) logEnd(c, 4 + i * 6, 17 + r * 5);
    pyramid(c, 25, 29, 3);
    stump(c, 14, 24);
    axe(c, 14, 24);
  }
  c.outline(C.wine);
  return c;
};
