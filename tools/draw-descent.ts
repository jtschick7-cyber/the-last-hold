// GDD §9.12, §9.24 (v1.4, D565): the Descent's five pictures, drawn in code in the 32-colour palette:
// The Unlit's 64 px portrait and 32 px battle sprite, and the three 160 × 64 px stage banners. The
// Unlit is the cold left behind when someone is burned and forgotten (lore §6): a tall hooded cold with
// a crown of rime, calm eyes, threads of draught below, and one small warm spark kept at its heart.
// The banners carry no lettering: the rime on the last wall only suggests writing.
import { C, Canvas, seedRolls } from './pixel';
import { CX } from './portrait-parts';
import { SPRITE_SIZE } from './sprite-frames';

export const DESCENT_SCENE_W = 160;
export const DESCENT_SCENE_H = 64;

/** The 64 px portrait: a deep blue-black ground, the hooded cold, rime crown, threads, a spark. */
export const drawUnlitPortrait = (): Canvas => {
  const c = new Canvas(64);
  // Ground: a stone dark with a pale seep of cold behind the head.
  c.rect(0, 0, 64, 64, C.ink);
  c.rect(0, 0, 64, 46, C.night);
  c.ellipse(CX, 24, 30, 24, C.plum);
  c.ellipse(CX, 24, 22, 17, C.slate);
  // The shoulders and hood: a wide, still shape of cold that tapers upward into the hood.
  c.polygon(
    [
      [6, 64],
      [12, 44],
      [22, 36],
      [24, 22],
      [CX, 8],
      [40, 22],
      [42, 36],
      [52, 44],
      [58, 64],
    ],
    (x, y) => {
      const d = Math.abs(x - CX);
      if (y < 30 && d > 6) return C.violet;
      return d > 20 ? C.plum : d > 11 ? C.violet : C.dusk;
    },
  );
  // The face-hollow: a dark oval with a pale edge, nothing in it but two calm eyes.
  c.ellipse(CX, 28, 8, 11, C.ink);
  c.ellipse(CX, 28, 7, 10, C.night);
  c.mirrored((set) => {
    set(CX - 4, 26, C.ice);
    set(CX - 3, 26, C.frost);
    set(CX - 4, 27, C.cyan);
  });
  // Rime crown: tall frost shards rising from the hood, tallest at the middle.
  const shards: readonly [number, number, number][] = [
    [CX, 8, 9],
    [CX - 5, 12, 7],
    [CX + 5, 12, 7],
    [CX - 10, 17, 6],
    [CX + 10, 17, 6],
    [CX - 15, 24, 4],
    [CX + 15, 24, 4],
  ];
  for (const [x, y, h] of shards) {
    for (let j = 0; j < h; j++) {
      c.set(x, y - j + 2, j < h - 2 ? C.ice : C.frost);
      if (j < h - 3) c.set(x + 1, y - j + 3, C.cyan);
    }
    c.set(x, y - h + 2, C.frost);
  }
  // Frost along the shoulders.
  const roll = seedRolls('unlit-portrait');
  for (let i = 0; i < 46; i++) {
    const x = 8 + Math.floor(roll() * 48);
    const y = 42 + Math.floor(roll() * 20);
    if (c.get(x, y) !== null && c.get(x, y) !== C.ink) c.set(x, y, roll() < 0.5 ? C.ice : C.dusk);
  }
  // Threads of draught hanging from the hem, uneven, fading into the dark.
  for (let x = 12; x < 54; x += 3) {
    const len = 6 + Math.floor(roll() * 8);
    for (let j = 0; j < len; j++)
      c.set(x + (j % 5 === 3 ? 1 : 0), 50 + j, j < len / 2 ? C.dusk : C.slate);
  }
  // The small thing it was: one warm spark kept low in the chest, the only warm colour.
  c.rect(CX - 1, 47, 2, 2, C.gold);
  c.set(CX, 46, C.sand);
  c.set(CX - 2, 48, C.orange);
  return c;
};

/** The base battle frame, 32 px, facing left, outlined; the strip is made by `framesOf`. */
export const drawUnlitSprite = (): Canvas => {
  const c = new Canvas(SPRITE_SIZE);
  // Hem: threads of cold, not feet.
  for (const [x, len] of [
    [8, 4],
    [11, 6],
    [14, 3],
    [17, 7],
    [20, 4],
    [23, 5],
  ] as const)
    for (let j = 0; j < len; j++) c.set(x, 26 + j, j < 3 ? C.dusk : C.slate);
  // Body: a tall hooded shape that widens toward the hem.
  c.polygon(
    [
      [6, 27],
      [9, 15],
      [11, 8],
      [15, 4],
      [20, 7],
      [22, 15],
      [26, 27],
    ],
    (x, y) => (x < 13 ? C.dusk : y < 14 || x < 18 ? C.violet : C.plum),
  );
  // Hood hollow, turned left, with one pale eye.
  c.ellipse(13, 12, 3, 4, C.ink);
  c.set(11, 11, C.frost);
  c.set(11, 12, C.ice);
  // Rime crown.
  for (const [x, y, h] of [
    [15, 4, 4],
    [12, 6, 3],
    [18, 6, 3],
    [9, 9, 2],
    [21, 9, 2],
  ] as const)
    for (let j = 0; j < h; j++) c.set(x, y - j, j === h - 1 ? C.frost : C.ice);
  // A reaching arm of cold, toward the foe.
  c.line(9, 17, 3, 21, C.dusk, 2);
  c.set(2, 22, C.ice);
  // The warm spark.
  c.set(15, 18, C.gold);
  c.set(15, 19, C.orange);
  c.outline(C.ink);
  return c;
};

type Scene = (c: Canvas) => void;

const W = DESCENT_SCENE_W;
const H = DESCENT_SCENE_H;

/** Stage 1, The Crack: a split in the rock running down the middle, cold light seeping out. */
const crack: Scene = (c) => {
  const roll = seedRolls('descent-stage-1');
  c.rect(0, 0, W, H, C.coal);
  c.rect(0, 0, W, 18, C.ink);
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(roll() * W);
    const y = Math.floor(roll() * H);
    c.set(x, y, roll() < 0.5 ? C.stone : C.ink);
  }
  // Floor of broken stone.
  c.rect(0, 52, W, 12, C.ink);
  c.rect(0, 52, W, 1, C.stone);
  // The crack: a jagged dark gap, wider toward the foot, with a pale seep inside it.
  let x = 78;
  for (let y = 0; y < 52; y++) {
    x += Math.round(roll() * 2 - 1);
    x = Math.max(70, Math.min(88, x));
    const half = 2 + Math.floor(y / 11);
    c.rect(x - half - 1, y, half * 2 + 2, 1, C.stone);
    c.rect(x - half, y, half * 2, 1, C.night);
    c.rect(x - 1, y, 2, 1, y % 6 < 3 ? C.cyan : C.ice);
    if (y % 9 === 0) c.set(x - half - 2, y, C.ash);
  }
  // Cold light on the floor beneath it.
  c.ellipse(x, 56, 16, 3, C.blue);
  c.ellipse(x, 56, 8, 2, C.ice);
  // Frost on the rock, thickest nearest the crack.
  for (let i = 0; i < 70; i++) {
    const fx = Math.floor(roll() * W);
    const fy = Math.floor(roll() * 52);
    const near = Math.abs(fx - x) < 34;
    if (near || roll() < 0.15) c.set(fx, fy, roll() < 0.5 ? C.dusk : C.ice);
  }
  // Cold breath drifting out of the crack.
  for (let i = 0; i < 6; i++) c.line(x + 3, 40 - i * 5, x + 14 + i * 3, 36 - i * 5, C.slate, 1);
};

/** Stage 2, The Sealed Stair: steps cut in a regular measure, down toward a great round seal. */
const sealedStair: Scene = (c) => {
  c.rect(0, 0, W, H, C.ink);
  c.rect(0, 0, W, 8, C.night);
  // Walls of cut stone blocks either side.
  for (let y = 0; y < 52; y += 6) {
    const off = (y / 6) % 2 === 0 ? 0 : 8;
    for (let x = -off; x < 44; x += 16) {
      c.rect(x, y, 15, 5, C.coal);
      c.rect(x, y, 15, 1, C.stone);
    }
    for (let x = W - 44 - off; x < W; x += 16) {
      c.rect(x, y, 15, 5, C.coal);
      c.rect(x, y, 15, 1, C.stone);
    }
  }
  // The seal: a great round door of old iron-grey stone with rings and a bar, frosted.
  c.ellipse(80, 28, 26, 26, C.slate);
  c.ellipse(80, 28, 22, 22, C.coal);
  c.ellipse(80, 28, 16, 16, C.slate);
  c.ellipse(80, 28, 12, 12, C.coal);
  c.rect(52, 26, 56, 4, C.stone);
  c.rect(52, 26, 56, 1, C.ash);
  c.ellipse(80, 28, 4, 4, C.ink);
  c.set(80, 27, C.rust);
  // Frost creeping over the seal's upper rim, and a seam of cold light at its foot.
  for (let a = 200; a < 340; a += 5) {
    const px = 80 + Math.round(Math.cos((a * Math.PI) / 180) * 25);
    const py = 28 + Math.round(Math.sin((a * Math.PI) / 180) * 25);
    c.set(px, py, C.ice);
    c.set(px, py + 1, C.dusk);
  }
  c.rect(60, 52, 40, 1, C.cyan);
  // The stair: steps widening toward the viewer, each lit on its edge.
  for (let i = 0; i < 6; i++) {
    const y = 52 + i * 2;
    const inset = 30 - i * 6;
    if (y >= H) break;
    c.rect(inset, y, W - inset * 2, 2, i % 2 === 0 ? C.stone : C.coal);
    c.rect(inset, y, W - inset * 2, 1, i % 2 === 0 ? C.ash : C.stone);
  }
  // A dead smith's anvil at the foot of the left wall, cold under frost.
  c.rect(14, 44, 14, 3, C.stone);
  c.rect(14, 44, 14, 1, C.ash);
  c.rect(18, 47, 6, 5, C.coal);
  c.rect(16, 52, 10, 1, C.stone);
  c.rect(14, 43, 4, 1, C.ice);
};

/** Stage 3, Below the Seal: a wide, dry, very still floor; the rime on the far wall marks out a line. */
const belowSeal: Scene = (c) => {
  const roll = seedRolls('descent-stage-3');
  c.rect(0, 0, W, H, C.ink);
  c.rect(0, 0, W, 6, C.night);
  // The far wall, and a low pale seep along its foot.
  c.rect(0, 6, W, 34, C.coal);
  for (let i = 0; i < 80; i++) c.set(Math.floor(roll() * W), 6 + Math.floor(roll() * 34), C.ink);
  // Rime writing: a single line of short frost strokes, evenly spaced, that stops short of the edge.
  let x = 22;
  while (x < 118) {
    const w = 2 + Math.floor(roll() * 5);
    const tall = roll() < 0.4;
    c.rect(x, 18, w, 1, C.ice);
    c.rect(x, tall ? 14 : 16, 1, tall ? 8 : 6, C.frost);
    if (roll() < 0.5) c.set(x + w, 20, C.dusk);
    x += w + 3 + Math.floor(roll() * 3);
  }
  // The wide stone floor: dry flags in perspective, with a single cold glow in the middle.
  c.rect(0, 40, W, 24, C.ink);
  c.rect(0, 40, W, 1, C.stone);
  for (const y of [47, 55, 63]) c.rect(0, y, W, 1, C.coal);
  for (let k = -6; k <= 6; k++) c.line(80 + k * 6, 41, 80 + k * 22, 63, C.coal, 1);
  c.ellipse(80, 50, 30, 6, C.night);
  c.ellipse(80, 50, 18, 4, C.slate);
  c.ellipse(80, 50, 8, 2, C.dusk);
  // Cold standing at the wall's foot: a few pale threads rising.
  for (let i = 0; i < 12; i++) {
    const tx = 14 + Math.floor(roll() * 132);
    const len = 3 + Math.floor(roll() * 6);
    for (let j = 0; j < len; j++) c.set(tx, 39 - j, j < len - 1 ? C.slate : C.dusk);
  }
};

const SCENES: readonly Scene[] = [crack, sealedStair, belowSeal];

/** Stage banner n (1 to 3): 160 × 64 px, drawn on a 160 px canvas and cropped to 64 rows. */
export const drawDescentScene = (n: 1 | 2 | 3): Canvas => {
  const c = new Canvas(DESCENT_SCENE_W);
  (SCENES[n - 1] as Scene)(c);
  return c;
};
