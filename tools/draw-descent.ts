// GDD §9.12, §9.24 (v1.4, D565): the Descent's five pictures, drawn in code in the 32-colour palette:
// The Unlit's 64 px portrait and 32 px battle sprite, and the three 160 × 64 px stage banners. The
// Unlit is the cold left behind when someone is burned and forgotten (lore §6): a tall hooded cold with
// a crown of rime, calm eyes, threads of draught below, and one small warm spark kept at its heart.
// The banners carry no lettering: the rime on the last wall only suggests writing.
import { C, Canvas, seedRolls } from './pixel';
import { CX } from './portrait-parts';
import { SPRITE_SIZE, framesOf, type SpriteFrame } from './sprite-frames';

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
  // The face-hollow: a void, near-black, with a faint rim, so the two pale eyes glow out of shadow.
  c.ellipse(CX, 28, 8, 11, C.plum);
  c.ellipse(CX, 28, 7, 10, C.ink);
  c.mirrored((set) => {
    set(CX - 5, 26, C.blue); // the glow around each eye
    set(CX - 4, 25, C.night);
    set(CX - 4, 27, C.night);
    set(CX - 3, 26, C.night);
    set(CX - 4, 26, C.frost);
    set(CX - 5, 27, C.cyan);
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
  const roll = seedRolls('unlit-portrait');
  // Frost dripping from the hem: short vertical threads, one pixel wide, two to five tall, never in a pattern.
  for (let x = 9; x < 56; x += 2 + Math.floor(roll() * 3)) {
    const top = 50 + Math.floor(roll() * 8);
    const len = 2 + Math.floor(roll() * 4);
    for (let j = 0; j < len; j++)
      c.set(x, top + j, j === 0 ? C.frost : j < len - 1 ? C.ice : C.dusk);
  }
  // The small thing it was: one warm spark kept low in the chest, the only warm colour.
  c.rect(CX - 1, 47, 2, 2, C.gold);
  c.set(CX, 46, C.sand);
  c.set(CX - 2, 48, C.orange);
  return c;
};

interface Pose {
  /** Sideways shift of the whole figure. */
  readonly ox: number;
  /** The upper body (hood, crown, arm) is moved by this much, on top of `ox`. */
  readonly upperDx: number;
  /** The upper body and crown sink by this many rows. */
  readonly bob: number;
  /** How far the reaching arm extends, in pixels. */
  readonly arm: number;
  /** Shifts the hem's threads, so two frames never share them. */
  readonly tendrils: 0 | 1;
}

/** One standing frame, 32 px, facing left, outlined. */
const drawStanding = (pose: Pose): Canvas => {
  const c = new Canvas(SPRITE_SIZE);
  const { ox, upperDx, bob, arm, tendrils } = pose;
  const ux = ox + upperDx;
  // Hem: threads of cold, not feet; the phase moves them in the second idle frame.
  const hem: readonly (readonly [number, number])[] =
    tendrils === 0
      ? [
          [8, 4],
          [11, 6],
          [14, 3],
          [17, 7],
          [20, 4],
          [23, 5],
        ]
      : [
          [9, 6],
          [12, 3],
          [15, 7],
          [18, 4],
          [21, 6],
          [24, 3],
        ];
  for (const [x, len] of hem)
    for (let j = 0; j < len; j++) c.set(x + ox, 26 + j, j < 3 ? C.dusk : C.slate);
  // The lower body stays put; the upper body bobs and lunges.
  c.polygon(
    [
      [6, 27],
      [8, 22],
      [24, 22],
      [26, 27],
    ].map(([x, y]) => [(x as number) + ox, y as number] as [number, number]),
    (x) => (x < 13 + ox ? C.dusk : x < 18 + ox ? C.violet : C.plum),
  );
  c.polygon(
    [
      [8, 22],
      [9, 15],
      [11, 8],
      [15, 4],
      [20, 7],
      [22, 15],
      [24, 22],
    ].map(([x, y]) => [(x as number) + ux, (y as number) + bob] as [number, number]),
    (x, y) => (x < 13 + ux ? C.dusk : y < 14 + bob || x < 18 + ux ? C.violet : C.plum),
  );
  // Hood hollow, turned left, with one pale eye.
  c.ellipse(13 + ux, 12 + bob, 3, 4, C.ink);
  c.set(11 + ux, 11 + bob, C.frost);
  c.set(11 + ux, 12 + bob, C.ice);
  // Rime crown.
  for (const [x, y, h] of [
    [15, 4, 4],
    [12, 6, 3],
    [18, 6, 3],
    [9, 9, 2],
    [21, 9, 2],
  ] as const)
    for (let j = 0; j < h; j++) c.set(x + ux, y + bob - j, j === h - 1 ? C.frost : C.ice);
  // A reaching arm of cold, toward the foe; a longer reach ends in a frost tip.
  const tipX = 4 - arm;
  c.line(9 + ux, 17 + bob, tipX + ux, 21 + bob, C.dusk, 2);
  c.set(tipX - 1 + ux, 22 + bob, C.ice);
  if (arm > 0) {
    c.set(tipX - 2 + ux, 22 + bob, C.cyan);
    c.set(tipX - 1 + ux, 21 + bob, C.cyan);
    c.set(tipX - 1 + ux, 23 + bob, C.cyan);
  }
  // The warm spark.
  c.set(15 + ux, 18 + bob, C.gold);
  c.set(15 + ux, 19 + bob, C.orange);
  c.outline(C.ink);
  return c;
};

/** The downed pose: the cloak crumpled flat along the ground, the crown's shards broken off beside it. */
const drawDowned = (): Canvas => {
  const c = new Canvas(SPRITE_SIZE);
  // A low solid mound on the bottom edge: no gaps between rows, folds laid over it.
  c.ellipse(14, 28, 12, 3.2, (x, y) => (y < 27 ? C.dusk : x < 12 ? C.violet : C.plum));
  c.rect(4, 29, 20, 2, C.plum);
  c.polygon(
    [
      [3, 28],
      [6, 25],
      [12, 24],
      [18, 25],
      [23, 28],
    ],
    (x, y) => (y < 26 ? C.dusk : x < 14 ? C.violet : C.plum),
  );
  for (const [x0, y0, x1, y1] of [
    [8, 26, 10, 30],
    [14, 25, 15, 30],
    [19, 26, 20, 30],
  ] as const)
    c.line(x0, y0, x1, y1, C.slate, 1);
  // The hood's dark hollow at the left end, one eye still open.
  c.ellipse(6, 28, 2.2, 1.8, C.ink);
  c.set(5, 28, C.ice);
  // The warm spark, nearly out.
  c.set(15, 27, C.orange);
  // Broken crown shards lying beside it, cyan and frost.
  for (const [x, y, len] of [
    [25, 30, 3],
    [28, 29, 2],
    [27, 27, 3],
  ] as const) {
    for (let j = 0; j < len; j++)
      c.set(x + j, y - (j > 1 ? 1 : 0), j === len - 1 ? C.frost : C.cyan);
  }
  c.set(24, 28, C.ice);
  c.set(30, 30, C.cyan);
  c.outline(C.ink);
  return c;
};

/** The five frames: each is drawn, not made from the base, so they differ at 1×. */
export const drawUnlitFrames = (): Record<SpriteFrame, Canvas> => {
  const base: Pose = { ox: 5, upperDx: 0, bob: 0, arm: 0, tendrils: 0 };
  const idle = drawStanding(base);
  return {
    idle,
    idle2: drawStanding({ ...base, bob: 1, tendrils: 1 }),
    lunge: drawStanding({ ...base, upperDx: -3, arm: 4 }),
    hit: framesOf(idle, 'left').hit,
    downed: drawDowned(),
  };
};

type Scene = (c: Canvas) => void;

const W = DESCENT_SCENE_W;
const H = DESCENT_SCENE_H;

const BAYER = [0, 2, 3, 1] as const;
/** A dithered blend: `t` (0 to 1) of the way from `a` to `b`, laid out in a fixed 2 × 2 pattern. */
const blend = (x: number, y: number, t: number, a: string, b: string): string =>
  t * 4 > (BAYER[(y % 2) * 2 + (x % 2)] as number) ? b : a;

/** Stage 1, The Crack: a split in the rock running down the middle, cold light seeping out. */
const crack: Scene = (c) => {
  const roll = seedRolls('descent-stage-1');
  // Rock all the way to the top, shaded in a soft dither (no seam), darkest at the very top.
  for (let y = 0; y < 52; y++)
    for (let x = 0; x < W; x++) c.set(x, y, blend(x, y, Math.min(1, y / 22), C.ink, C.coal));
  // Floor of broken stone.
  c.rect(0, 52, W, 12, C.ink);
  c.rect(0, 52, W, 1, C.stone);
  // The crack: a jagged dark gap, wider toward the foot, with a pale seep inside it.
  const spine: number[] = [];
  let x = 78;
  for (let y = 0; y < 52; y++) {
    x += Math.round(roll() * 2 - 1);
    x = Math.max(70, Math.min(88, x));
    spine.push(x);
    const half = 2 + Math.floor(y / 11);
    c.rect(x - half - 1, y, half * 2 + 2, 1, C.stone);
    c.rect(x - half, y, half * 2, 1, C.night);
    c.rect(x - 1, y, 2, 1, y % 6 < 3 ? C.cyan : C.ice);
    if (y % 9 === 0) c.set(x - half - 2, y, C.ash);
  }
  // Jagged diagonal micro-cracks branching off both sides, each a short zigzag with a frost tip.
  for (const [y0, side, len] of [
    [6, -1, 11],
    [14, 1, 13],
    [22, -1, 14],
    [30, 1, 12],
    [38, -1, 10],
    [44, 1, 9],
    [10, 1, 7],
    [34, -1, 8],
  ] as const) {
    let px = (spine[y0] as number) + side * (3 + Math.floor(y0 / 11));
    let py = y0;
    for (let i = 0; i < len; i++) {
      c.set(px, py, i % 3 === 2 ? C.slate : C.ink);
      px += side * (i % 2 === 0 ? 1 : 2);
      py += i % 3 === 1 ? 0 : 1;
    }
    c.set(px, py, C.ice);
  }
  // Cold light on the floor beneath it.
  c.ellipse(x, 56, 16, 3, C.blue);
  c.ellipse(x, 56, 8, 2, C.ice);
  // Frost on the rock, packed tight within 15 px of the crack and nowhere else.
  for (let i = 0; i < 110; i++) {
    const fy = Math.floor(roll() * 52);
    const mid = spine[fy] as number;
    const off = Math.floor((roll() + roll() - 1) * 15);
    const fx = mid + off;
    if (Math.abs(off) < 4 + Math.floor(fy / 11) + 1) continue; // keep the gap itself clear
    c.set(fx, fy, Math.abs(off) < 8 ? C.ice : C.dusk);
  }
};

/** A small anvil, horn pointing left: face, waist and base, in near-black iron with a pale edge. */
const anvil = (c: Canvas, x: number, y: number): void => {
  const iron = C.ink;
  // Horn (tapering to the left), face, then waist and base.
  c.polygon(
    [
      [x, y + 2],
      [x + 6, y],
      [x + 6, y + 4],
      [x + 4, y + 4],
    ],
    iron,
  );
  c.rect(x + 6, y, 12, 4, iron); // the face
  c.rect(x + 9, y + 4, 6, 4, iron); // the waist
  c.rect(x + 5, y + 8, 16, 4, iron); // the base
  c.rect(x + 3, y + 11, 20, 2, iron); // the foot
  // A cool edge of light along the face and the horn, so the dark shape reads against the bricks.
  c.rect(x + 6, y, 12, 1, C.slate);
  c.line(x + 1, y + 2, x + 6, y, C.slate, 1);
  c.rect(x + 5, y + 8, 16, 1, C.stone);
  // Frost sitting on it.
  c.rect(x + 8, y - 1, 5, 1, C.ice);
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
  // The seal: a great round door with rings, eight spokes, a notched rim and a star at its hub.
  c.ellipse(80, 28, 26, 26, C.slate);
  c.ellipse(80, 28, 22, 22, C.coal);
  c.ellipse(80, 28, 16, 16, C.slate);
  c.ellipse(80, 28, 12, 12, C.coal);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    const at = (r: number): [number, number] => [
      80 + Math.round(Math.cos(a) * r),
      28 + Math.round(Math.sin(a) * r),
    ];
    const [x0, y0] = at(6);
    const [x1, y1] = at(21);
    c.line(x0, y0, x1, y1, C.ash, 1);
    const [nx, ny] = at(24);
    c.rect(nx - 1, ny - 1, 2, 2, C.coal); // a notch in the rim between the spokes
  }
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8;
    c.set(80 + Math.round(Math.cos(a) * 24), 28 + Math.round(Math.sin(a) * 24), C.ash);
  }
  // The hub: a diamond with a dark centre.
  c.polygon(
    [
      [80, 21],
      [87, 28],
      [80, 35],
      [73, 28],
    ],
    C.stone,
  );
  c.polygon(
    [
      [80, 24],
      [84, 28],
      [80, 32],
      [76, 28],
    ],
    C.ink,
  );
  c.set(80, 28, C.rust);
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
  // A dead smith's anvil at the foot of the left wall, cold iron under frost.
  anvil(c, 10, 39);
};

/** Runic strokes, 3 × 5 px each ('#' lit). Every glyph differs, so a line never repeats. */
const GLYPHS: readonly (readonly string[])[] = [
  ['#..', '#.#', '###', '#..', '#..'],
  ['.#.', '.#.', '###', '.#.', '.#.'],
  ['#.#', '#.#', '.#.', '.#.', '.#.'],
  ['###', '..#', '.#.', '#..', '###'],
  ['#..', '##.', '.##', '..#', '..#'],
  ['.##', '#..', '.#.', '..#', '##.'],
  ['#.#', '.#.', '#.#', '.#.', '#.#'],
  ['..#', '.##', '#.#', '.##', '..#'],
  ['###', '#..', '###', '..#', '#..'],
  ['.#.', '#.#', '..#', '.#.', '#..'],
  ['#..', '#..', '###', '#.#', '#.#'],
  ['##.', '..#', '.#.', '#..', '.##'],
];

const rune = (c: Canvas, x: number, y: number, g: readonly string[]): void => {
  const lit = (i: number, j: number): boolean => g[j]?.[i] === '#';
  // A soft dark-cyan halo first: every empty pixel that touches a stroke.
  for (let j = -1; j <= 5; j++)
    for (let i = -1; i <= 3; i++) {
      if (lit(i, j)) continue;
      if (lit(i - 1, j) || lit(i + 1, j) || lit(i, j - 1) || lit(i, j + 1))
        c.set(x + i, y + j, C.blue);
    }
  for (let j = 0; j < 5; j++)
    for (let i = 0; i < 3; i++) if (lit(i, j)) c.set(x + i, y + j, j === 0 ? C.frost : C.ice);
};

/** Stage 3, Below the Seal: a wide, dry, very still floor; the rime on the far wall marks out a line. */
const belowSeal: Scene = (c) => {
  const roll = seedRolls('descent-stage-3');
  c.rect(0, 0, W, H, C.ink);
  c.rect(0, 0, W, 6, C.night);
  // The far wall, shaded from dark at the ceiling to lit stone mid-wall, then dark again at its foot.
  for (let y = 6; y < 40; y++) {
    const t = y < 22 ? (y - 6) / 16 : (39 - y) / 17;
    for (let x = 0; x < W; x++)
      c.set(x, y, blend(x, y, Math.max(0, Math.min(1, t)), C.ink, C.stone));
  }
  for (let i = 0; i < 40; i++) c.set(Math.floor(roll() * W), 6 + Math.floor(roll() * 34), C.ink);
  // Rime writing: twelve different strokes in a line that stops short of the edge.
  const order = [0, 5, 2, 9, 4, 11, 1, 7, 3, 10, 6, 8];
  order.forEach((g, i) =>
    rune(c, 24 + i * 9, 16 + (i % 3 === 1 ? 1 : 0), GLYPHS[g] as readonly string[]),
  );
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
