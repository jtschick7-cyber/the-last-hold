// Plan T9.16 (GDD §8.13, §8.14, §9.12): the art of the three Great Beasts and the three quarries,
// drawn in code like the monsters: a 64 px portrait and a 32 px battle sprite each, in palette
// colors. A sprite faces left. Each has its one telling feature, as the GDD's "What it was" lines say.
import type { EventCreatureId } from '../src/content/hunts';
import { C, Canvas } from './pixel';
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
  // Grave-cloth shoulders, a pale skull, a crown of old gold with a point broken off.
  c.ellipse(CX, 62, 26, 14, (_x, y) => (y < 54 ? C.slate : C.plum));
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
  c.rect(CX - 15, 13, 30, 6, C.gold);
  c.rect(CX - 15, 13, 30, 1, C.sand);
  for (const x of [-15, -7, 1, 9]) c.rect(CX + x, 7, 5, 6, C.gold);
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
  // A wide, low head of grey stone, moss in its seams, a heavy brow, two short tusks.
  c.ellipse(CX, 34, 25, 24, (x, y) =>
    y < 22 ? rock[0] : (x * 3 + y) % 11 === 0 ? C.ink : y > 44 ? rock[2] : rock[1],
  );
  c.rect(CX - 22, 24, 44, 5, rock[2]);
  for (const [x, y, w] of [
    [14, 14, 8],
    [40, 12, 10],
    [26, 48, 7],
    [46, 42, 6],
  ] as const)
    c.rect(x, y, w, 3, C.moss);
  for (const [x, y] of [
    [16, 15],
    [44, 13],
    [28, 49],
  ] as const)
    c.set(x, y, C.lime);
  c.mirrored((set) => {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) set(CX - 14 + i, 31 + j, C.ink);
    set(CX - 13, 32, C.orange);
    set(CX - 12, 32, C.gold);
  });
  c.rect(CX - 3, 36, 6, 8, rock[2]);
  c.rect(CX - 14, 50, 28, 6, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 7; j++) set(CX - 10, 44 + j, C.bone);
    for (let j = 0; j < 6; j++) set(CX - 9, 45 + j, C.frost);
  });
};

const mara = (c: Canvas): void => {
  // A hood of near-black violet, a white face with nothing in it but two red points, long hair
  // spilling out of the hood, and a bony hand held to the chin.
  c.ellipse(CX, 34, 26, 30, (_x, y) => (y < 20 ? C.violet : y > 46 ? C.ink : C.plum));
  for (let x = 12; x < 53; x += 5) c.line(x, 40, x + ((x % 10) - 5), 63, C.ink, 2);
  c.ellipse(CX, 32, 11, 14, (_x, y) => (y < 26 ? C.frost : C.bone));
  c.mirrored((set) => {
    set(CX - 6, 29, C.red);
    set(CX - 5, 29, C.blood);
  });
  c.rect(CX - 3, 40, 6, 1, C.coal);
  c.rect(CX + 10, 46, 3, 14, C.bone);
  for (let i = 0; i < 4; i++) c.rect(CX + 8 + i * 2, 42 + (i % 2), 1, 5, C.ash);
};

const likho = (c: Canvas): void => {
  // A gaunt face of rags and tallow, one big eye in the middle of the forehead, a loose grin.
  c.ellipse(CX, 36, 22, 26, (_x, y) => (y < 20 ? C.clay : y > 46 ? C.rust : C.sand));
  c.ellipse(CX, 12, 24, 12, C.brownDark);
  for (let x = 10; x < 54; x += 4) c.line(x, 8, x - 3 + (x % 7), 26, C.ink, 1);
  c.mirrored((set) => {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) set(CX - 18 + i, 36 + j, C.coal);
  });
  c.ellipse(CX, 28, 7, 6, C.frost);
  c.ellipse(CX, 28, 4, 4, C.red);
  c.rect(CX - 1, 27, 3, 3, C.ink);
  c.rect(CX, 27, 1, 1, C.frost);
  c.rect(CX - 1, 36, 2, 7, C.rust);
  c.rect(CX - 12, 48, 24, 3, C.ink);
  for (let x = CX - 10; x < CX + 11; x += 4) c.rect(x, 47, 2, 3, C.bone);
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
  wisp(c, 5, 14, [C.ice, C.cyan, C.blue], C.night);
  // Hair running down both sides like weed in a current.
  for (const x of [9, 22]) c.line(x, 8, x + (x < 16 ? -1 : 1), 28, C.blue, 2);
  c.rect(14, 5, 5, 4, C.frost);
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
  wisp(c, 4, 15, [C.violet, C.plum, C.ink], C.red);
  c.ellipse(16, 8, 5, 5, C.plum);
  c.ellipse(15, 9, 3, 3, C.frost);
  c.set(14, 9, C.red);
  c.set(16, 9, C.red);
  for (const x of [8, 11, 21, 24]) c.line(x, 14, x - 1, 29, C.ink, 1);
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
