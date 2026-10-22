// Plan T9.16 (GDD §8.13, §8.14, §9.12): the art of the three Great Beasts and the three quarries,
// drawn in code like the monsters: a 64 px portrait and a 32 px battle sprite each, in palette
// colors. A sprite faces left. Each has its one telling feature, as the GDD's "What it was" lines say.
import type { EventCreatureId } from '../src/content/hunts';
import { C, Canvas, seedRolls } from './pixel';
import { SPRITE_SIZE } from './sprite-frames';
import { biped, shaded, wisp, type Ramp } from './sprite-parts';

const CX = 32;

type Backdrop = readonly [dark: string, mid: string, light: string];

const BACKDROP: Record<EventCreatureId, Backdrop> = {
  'lindworm-of-velk-fjord': [C.night, C.blue, C.cyan],
  'barrow-king': [C.plum, C.night, C.slate],
  'mother-of-the-river': [C.night, C.blue, C.ice],
  'stoneback-fell-troll': [C.ink, C.coal, C.stone],
  'mara-of-kettle-barrow': [C.ink, C.plum, C.violet],
  'likho-one-eyed': [C.ink, C.wine, C.rust],
};

// ---------------------------------------------------------------- portraits (64 px)

const lindworm = (c: Canvas): void => {
  const scale: Ramp = [C.ice, C.cyan, C.blue];
  // A coil of neck rising behind, then the long head turned left.
  for (let i = 0; i < 4; i++)
    shaded(c, 40 + (i % 2) * 6, 56 - i * 9, 12, 6, [C.ash, C.stone, C.coal]);
  shaded(c, 30, 28, 15, 11, scale);
  c.ellipse(16, 32, 11, 6, (_x, y) => (y < 31 ? scale[0] : scale[1]));
  c.rect(6, 34, 20, 3, C.blood);
  for (let x = 8; x < 24; x += 3) c.rect(x, 33, 1, 3, C.frost);
  // Horns, a fin down the neck, the golden eye.
  c.line(34, 18, 40, 6, C.bone, 2);
  c.line(26, 19, 28, 9, C.bone, 2);
  for (let y = 40; y < 58; y += 4) c.rect(50, y, 5, 2, C.cyan);
  c.rect(23, 26, 4, 3, C.gold);
  c.set(24, 27, C.ink);
  c.rect(8, 29, 2, 1, C.ink);
};

const barrowKing = (c: Canvas): void => {
  const r = seedRolls('barrow-king');
  // v1.0 (TV.9a): chainmail under dark barrow-fur, a pale skull, a tarnished bronze crown with
  // uneven spikes, rime on its edges.
  c.ellipse(CX, 64, 28, 15, C.coal);
  for (let y = 50; y < 64; y += 2)
    for (let x = 6; x < 58; x += 2) c.set(x + (y % 4 === 0 ? 1 : 0), y, C.stone);
  c.ellipse(CX, 52, 24, 5, C.brownDark);
  for (let i = 0; i < 70; i++) c.set(8 + r() * 48, 47 + r() * 9, r() < 0.5 ? C.ink : C.brown);
  c.rect(CX - 14, 50, 28, 3, C.dusk);
  c.ellipse(CX, 32, 14, 17, (x, y) => (y < 22 ? C.frost : x < 26 || x > 38 ? C.ash : C.bone));
  c.rect(CX - 8, 44, 16, 8, C.bone);
  for (let x = CX - 7; x < CX + 8; x += 3) c.rect(x, 45, 1, 6, C.coal);
  c.mirrored((set) => {
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) set(CX - 11 + i, 26 + j, C.ink);
    set(CX - 9, 28, C.cyan);
    set(CX - 8, 28, C.ice);
  });
  c.rect(CX - 1, 36, 2, 4, C.ink);
  c.line(CX + 8, 22, CX + 11, 30, C.stone, 1);
  // The crown: a worn band and spikes of unequal height, one snapped off.
  c.rect(CX - 15, 13, 30, 6, C.rust);
  c.rect(CX - 15, 13, 30, 1, C.clay);
  c.rect(CX - 15, 18, 30, 1, C.brown);
  for (const [x, h] of [
    [-15, 6],
    [-8, 3],
    [-2, 9],
    [5, 4],
    [11, 7],
  ] as const) {
    c.polygon(
      [
        [CX + x, 13],
        [CX + x + 5, 13],
        [CX + x + (h === 3 ? 4 : 2), 13 - h],
      ],
      C.rust,
    );
    c.line(CX + x, 13, CX + x + 2, 13 - h, C.clay, 1);
  }
  for (let i = 0; i < 14; i++)
    c.set(CX - 14 + r() * 28, 13 + r() * 6, r() < 0.5 ? C.moss : C.brownDark);
  for (const [x, y] of [
    [-13, 7],
    [-2, 4],
    [12, 6],
    [-6, 12],
    [8, 12],
  ] as const)
    c.set(CX + x, y, C.ice);
  c.set(CX + 5, 15, C.red);
};

const mother = (c: Canvas): void => {
  const water: Ramp = [C.ice, C.cyan, C.blue];
  // Long river-weed hair falling past the shoulders, a still pale face, glass-bright eyes.
  c.ellipse(CX, 30, 22, 26, (x, y) =>
    (x + y) % 5 === 0 ? water[0] : y > 44 ? water[2] : water[1],
  );
  for (let x = 12; x < 53; x += 4) c.line(x, 34, x + ((x % 8) - 4), 63, water[x % 8 ? 2 : 1], 2);
  c.ellipse(CX, 30, 11, 14, (_x, y) => (y < 24 ? C.frost : y > 38 ? C.bone : C.cream));
  c.mirrored((set) => {
    for (let i = 0; i < 4; i++) set(CX - 8 + i, 28, C.night);
    set(CX - 7, 29, C.cyan);
    set(CX - 6, 29, C.ice);
  });
  c.rect(CX - 2, 38, 4, 1, C.rose);
  for (const [x, y] of [
    [10, 52],
    [50, 48],
    [8, 20],
    [55, 16],
  ] as const)
    c.rect(x, y, 2, 3, C.frost);
};

const stoneback = (c: Canvas): void => {
  const rock: Ramp = [C.ash, C.stone, C.coal];
  const r = seedRolls('stoneback');
  // v1.0 (TV.9a): a craggy head of grey stone, a heavy overhanging brow ridge, mossy shoulders.
  c.ellipse(CX, 66, 30, 14, (x, y) =>
    (x * 5 + y * 3) % 13 === 0 ? C.ink : y < 56 ? rock[0] : rock[1],
  );
  for (const [x, y, w] of [
    [8, 56, 8],
    [20, 54, 6],
    [38, 55, 9],
    [50, 57, 6],
    [28, 60, 5],
  ] as const) {
    c.rect(x, y, w, 3, C.moss);
    c.rect(x + 1, y, Math.max(2, w - 3), 1, C.grass);
  }
  const pts: [number, number][] = [];
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 0.4;
    pts.push([CX + Math.cos(t) * 24 * k, 31 + Math.sin(t) * 24 * k]);
  }
  c.polygon(pts, (x, y) =>
    y < 20 ? rock[0] : (x * 3 + y) % 11 === 0 ? C.ink : y > 44 ? rock[2] : rock[1],
  );
  for (const [x, y, w] of [
    [14, 12, 8],
    [40, 10, 9],
    [46, 44, 6],
  ] as const)
    c.rect(x, y, w, 3, C.moss);
  for (const [x, y] of [
    [16, 13],
    [44, 11],
    [48, 45],
  ] as const)
    c.set(x, y, C.lime);
  c.line(18, 18, 24, 30, C.ink, 1);
  c.line(46, 20, 42, 28, C.ink, 1);
  // The brow: a thick ridge jutting out over deep sockets.
  c.rect(CX - 23, 23, 46, 3, rock[0]);
  c.rect(CX - 23, 26, 46, 6, rock[2]);
  c.rect(CX - 21, 32, 42, 1, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) set(CX - 15 + i, 33 + j, C.ink);
    set(CX - 14, 34, C.orange);
    set(CX - 13, 34, C.gold);
  });
  c.rect(CX - 3, 36, 6, 8, rock[2]);
  c.rect(CX - 14, 50, 28, 6, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 7; j++) set(CX - 10, 44 + j, C.bone);
    for (let j = 0; j < 6; j++) set(CX - 9, 45 + j, C.frost);
  });
};

const mara = (c: Canvas): void => {
  // v1.0 (TV.9a): a wide hood and shroud of near-black violet, a white face with two red points,
  // long hair spilling out, and one bony, gnarled hand reaching out.
  c.ellipse(CX, 34, 29, 30, (_x, y) => (y < 20 ? C.violet : y > 46 ? C.ink : C.plum));
  c.polygon(
    [
      [3, 40],
      [14, 30],
      [50, 30],
      [61, 40],
      [63, 63],
      [1, 63],
    ],
    (_x, y) => (y > 46 ? C.ink : C.plum),
  );
  for (let x = 6; x < 60; x += 5) c.line(x, 40, x + ((x % 10) - 5), 63, C.ink, 2);
  c.ellipse(CX, 32, 11, 14, (_x, y) => (y < 26 ? C.frost : C.bone));
  c.mirrored((set) => {
    set(CX - 6, 29, C.red);
    set(CX - 5, 29, C.blood);
  });
  c.rect(CX - 3, 40, 6, 1, C.coal);
  // The reaching hand: a thin forearm from the shroud, a knuckled palm, five long bent fingers.
  c.line(60, 62, 52, 46, C.ink, 4);
  c.line(60, 62, 52, 46, C.ash, 2);
  c.ellipse(50, 42, 4, 3, C.bone);
  for (const [tx, ty, bx, by] of [
    [41, 31, 44, 36],
    [44, 26, 47, 33],
    [49, 24, 50, 32],
    [55, 27, 53, 34],
    [58, 34, 55, 39],
  ] as const) {
    c.line(50, 42, bx, by, C.bone, 1);
    c.line(bx, by, tx, ty, C.bone, 1);
    c.set(bx, by, C.ash);
    c.set(tx, ty, C.stone);
  }
};

const likho = (c: Canvas): void => {
  const r = seedRolls('likho');
  // v1.0 (TV.9a): a gaunt, lopsided face of tallow, ragged uneven hair, one big eye in the forehead
  // and a mouth of jagged teeth.
  c.ellipse(CX, 37, 21, 25, (x, y) =>
    y < 20 ? C.clay : y > 47 ? C.rust : x < 26 ? C.clay : C.sand,
  );
  c.ellipse(CX - 4, 36, 17, 25, (x, y) => (y > 47 ? C.rust : x < 26 ? C.clay : C.sand));
  // Sunken cheeks, the left deeper than the right.
  c.ellipse(CX - 14, 42, 5, 8, C.rust);
  c.ellipse(CX + 13, 41, 4, 6, C.clay);
  c.rect(CX - 20, 33, 6, 3, C.coal);
  c.rect(CX + 12, 35, 5, 2, C.coal);
  // Ragged hair: strands of every length, longer on the right.
  for (let x = 8; x < 57; x += 2) {
    const len = 8 + r() * 22 + (x > 40 ? 12 : 0);
    c.line(
      x,
      4 + r() * 4,
      x + (r() - 0.5) * 6,
      4 + len,
      r() < 0.5 ? C.ink : C.brownDark,
      1 + (r() < 0.3 ? 1 : 0),
    );
  }
  c.rect(CX - 14, 12, 28, 4, C.brownDark);
  // The one eye, red as a coal, and a thin hooked nose.
  c.ellipse(CX, 28, 7, 6, C.frost);
  c.ellipse(CX, 28, 4, 4, C.red);
  c.rect(CX - 1, 27, 3, 3, C.ink);
  c.rect(CX, 27, 1, 1, C.frost);
  c.rect(CX - 1, 35, 2, 8, C.rust);
  c.set(CX + 1, 43, C.brown);
  // Jagged teeth in a wide dark mouth: some long, some broken, some gone.
  c.rect(CX - 13, 47, 26, 5, C.ink);
  for (const [x, h] of [
    [-12, 3],
    [-9, 5],
    [-6, 2],
    [-3, 6],
    [1, 0],
    [3, 4],
    [6, 5],
    [9, 2],
    [11, 3],
  ] as const) {
    if (h)
      c.polygon(
        [
          [CX + x, 47],
          [CX + x + 3, 47],
          [CX + x + 1, 47 + h],
        ],
        C.bone,
      );
  }
  for (const [x, h] of [
    [-11, 2],
    [-7, 3],
    [-2, 1],
    [4, 3],
    [8, 2],
  ] as const)
    c.polygon(
      [
        [CX + x, 51],
        [CX + x + 2, 51],
        [CX + x + 1, 51 - h],
      ],
      C.ash,
    );
  c.rect(CX - 12, 52, 24, 2, C.rust);
};

const PORTRAIT: Record<EventCreatureId, (c: Canvas) => void> = {
  'lindworm-of-velk-fjord': lindworm,
  'barrow-king': barrowKing,
  'mother-of-the-river': mother,
  'stoneback-fell-troll': stoneback,
  'mara-of-kettle-barrow': mara,
  'likho-one-eyed': likho,
};

/** The 64 px portrait, in the monsters' style: a family-colored backdrop, the creature, an outline. */
export const drawCreaturePortrait = (id: EventCreatureId): Canvas => {
  const [dark, mid, light] = BACKDROP[id];
  const c = new Canvas();
  c.fill(dark);
  c.ellipse(CX, 32, 29, 30, mid);
  c.ellipse(CX, 32, 22, 23, light === C.cyan || light === C.ice ? C.blue : dark);
  c.ellipse(CX, 32, 22, 23, (x, y) => ((x + y) % 7 === 0 ? mid : dark));
  PORTRAIT[id](c);
  c.outline(C.ink);
  return c;
};

// ---------------------------------------------------------------- battle sprites (32 px, facing left)

const lindwormSprite = (c: Canvas): void => {
  const scale: Ramp = [C.ice, C.cyan, C.blue];
  // A long body in three humps along the ground, the head raised at the left.
  for (const [x, y, rx] of [
    [26, 26, 5],
    [19, 27, 5],
    [12, 26, 4],
  ] as const)
    shaded(c, x, y, rx, 3, scale);
  shaded(c, 8, 18, 3, 8, scale);
  shaded(c, 5, 11, 5, 3.5, scale);
  c.rect(1, 12, 4, 2, scale[0]);
  c.rect(1, 14, 4, 1, C.blood);
  c.set(4, 10, C.gold);
  c.line(7, 8, 9, 4, C.bone, 1);
  for (let x = 14; x < 30; x += 4) c.rect(x, 22, 1, 2, C.cyan);
  c.line(30, 27, 31, 22, scale[1], 2);
};

const barrowKingSprite = (c: Canvas): void => {
  biped(c, {
    cloth: [C.dusk, C.slate, C.plum],
    skin: [C.frost, C.bone, C.ash],
    eye: C.cyan,
    width: 12,
    height: 12,
    hair: 'helm',
    hairRamp: [C.sand, C.gold, C.clay],
    item: 'sword',
    itemRamp: [C.ice, C.brown, C.brownDark],
  });
  for (const x of [12, 15, 18]) c.rect(x, 3, 2, 3, C.gold);
};

const motherSprite = (c: Canvas): void => {
  // v1.0 (TV.9a): a river-queen: a pale face under a crown of reeds, hair like weed down both
  // sides, and a gown that flares and ripples at the hem (not two legs).
  for (const [x, h, top] of [
    [11, 7, C.brown],
    [13, 9, C.sand],
    [16, 10, C.brown],
    [19, 9, C.sand],
    [21, 7, C.brown],
  ] as const) {
    c.line(x, 6, x + (x < 16 ? -1 : x > 16 ? 1 : 0), 6 - h + 3, C.moss, 1);
    c.rect(x + (x < 16 ? -1 : x > 16 ? 1 : 0), 6 - h + 1, 1, 2, top);
  }
  c.rect(10, 5, 12, 2, C.moss);
  c.ellipse(16, 10, 4, 4, (_x, y) => (y < 9 ? C.frost : C.cream));
  c.set(14, 10, C.night);
  c.set(18, 10, C.night);
  c.set(14, 11, C.cyan);
  c.set(18, 11, C.cyan);
  for (const x of [9, 10, 22, 23])
    c.line(x, 8, x + (x < 16 ? -1 : 1), 26, x % 2 ? C.blue : C.cyan, 1);
  c.polygon(
    [
      [13, 14],
      [19, 14],
      [25, 29],
      [7, 29],
    ],
    (x, y) => (y > 24 && (x + y) % 3 === 0 ? C.ice : y > 20 ? C.blue : x < 15 ? C.ice : C.cyan),
  );
  c.rect(7, 28, 18, 1, C.night);
  for (const x of [8, 12, 16, 20, 24]) c.set(x, 27, C.ice);
  c.line(12, 17, 10, 23, C.cyan, 2);
  c.line(20, 17, 22, 23, C.blue, 2);
  c.set(10, 24, C.frost);
  c.set(22, 24, C.frost);
};

const stonebackSprite = (c: Canvas): void => {
  biped(c, {
    cloth: [C.ash, C.stone, C.coal],
    skin: [C.ash, C.stone, C.coal],
    eye: C.orange,
    width: 14,
    height: 12,
    stoop: 3,
    hair: 'none',
    item: 'branch',
    itemRamp: [C.bone, C.stone, C.coal],
  });
  for (const [x, y] of [
    [12, 14],
    [17, 17],
    [20, 13],
  ] as const)
    c.rect(x, y, 3, 2, C.moss);
};

const maraSprite = (c: Canvas): void => {
  c.rimmedDowned = true; // v1.0 (TV.9a): a near-black cloak keeps a rim when downed
  wisp(c, 4, 15, [C.violet, C.plum, C.ink], C.red);
  c.ellipse(16, 8, 5, 5, C.plum);
  c.ellipse(15, 9, 3, 3, C.frost);
  c.set(14, 9, C.red);
  c.set(16, 9, C.red);
  for (const x of [8, 11, 21, 24]) c.line(x, 14, x - 1, 29, C.ink, 1);
  // A pale rim on the cloak's top and left edge, so it reads on a dark ground.
  const dark = new Set<string>([C.violet, C.plum, C.ink]);
  const edges: [number, number][] = [];
  for (let y = 2; y < 29; y++)
    for (let x = 0; x < 32; x++) {
      const v = c.get(x, y);
      if (v === null || !dark.has(v)) continue;
      if (c.get(x, y - 1) === null || c.get(x - 1, y) === null) edges.push([x, y]);
    }
  for (const [x, y] of edges) c.set(x, y, C.dusk);
};

const likhoSprite = (c: Canvas): void => {
  biped(c, {
    cloth: [C.rust, C.brown, C.brownDark],
    skin: [C.sand, C.clay, C.rust],
    eye: C.ink,
    width: 8,
    height: 10,
    stoop: 2,
    hair: 'long',
    hairRamp: [C.coal, C.ink, C.ink],
  });
  // One eye, in the middle of the forehead, red as a coal.
  c.set(14, 7, C.red);
  c.set(14, 8, C.red);
  c.set(15, 7, C.frost);
};

const SPRITE: Record<EventCreatureId, (c: Canvas) => void> = {
  'lindworm-of-velk-fjord': lindwormSprite,
  'barrow-king': barrowKingSprite,
  'mother-of-the-river': motherSprite,
  'stoneback-fell-troll': stonebackSprite,
  'mara-of-kettle-barrow': maraSprite,
  'likho-one-eyed': likhoSprite,
};

/** A creature facing left, outlined, at the sprite size; `framesOf(…, 'left')` makes the strip. */
export const drawCreatureSprite = (id: EventCreatureId): Canvas => {
  const c = new Canvas(SPRITE_SIZE);
  SPRITE[id](c);
  c.outline(C.ink);
  return c;
};
