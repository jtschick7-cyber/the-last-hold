// GDD §9.12 (D265): the 32 px battle sprites of the 16 contract species and the three Deep
// guardians. A family picks the template and the colors; a species adds its head, its extras and
// its one telling feature (the same ones its 64 px portrait has). Every sprite faces left.
import type { FamilyId } from '../src/content/damage';
import { GUARDIAN_IDS, type GuardianId } from '../src/content/delves/guardians';
import { MONSTER_IDS, monsters, type MonsterId } from '../src/content/monsters';
import { C, Canvas, seedRolls } from './pixel';
import { biped, quadruped, shaded, wisp, type Ramp } from './sprite-parts';
import { SPRITE_SIZE } from './sprite-frames';

const FUR = {
  ash: [C.ash, C.stone, C.coal],
  dark: [C.brown, C.brownDark, C.wine],
  bone: [C.frost, C.bone, C.ash],
  moss: [C.grass, C.moss, C.pine],
  water: [C.ice, C.cyan, C.blue],
  dead: [C.dusk, C.slate, C.plum],
  pale: [C.frost, C.bone, C.ash],
} as const satisfies Record<string, Ramp>;

const wolf = (c: Canvas): void =>
  quadruped(c, { fur: FUR.ash, eye: C.gold, head: 'wolf', belly: C.stone });

const bies = (c: Canvas): void => {
  quadruped(c, { fur: [C.rust, C.brown, C.brownDark], eye: C.orange, head: 'horned' });
  // A row of dark bristles down the spine.
  for (let x = 12; x < 25; x += 2) c.set(x, 12 + Math.floor(x / 12), C.wine);
};

const nix = (c: Canvas): void => {
  quadruped(c, { fur: FUR.pale, eye: C.cyan, head: 'horse', mane: FUR.water });
  // Water running off the belly.
  for (const [x, y] of [
    [12, 26],
    [17, 25],
    [22, 27],
    [15, 29],
  ] as const)
    c.set(x, y, C.ice);
};

const kikimora = (c: Canvas): void => {
  biped(c, {
    cloth: [C.rust, C.brown, C.brownDark],
    skin: [C.ash, C.stone, C.coal],
    eye: C.red,
    width: 8,
    height: 9,
    stoop: 3,
    hair: 'long',
    hairRamp: [C.bone, C.ash, C.stone],
    item: 'spindle',
  });
};

const poludnitsa = (c: Canvas): void => {
  biped(c, {
    cloth: [C.frost, C.bone, C.ash],
    skin: [C.cream, C.sand, C.clay],
    eye: C.blue,
    width: 8,
    height: 12,
    skirt: true,
    hair: 'long',
    hairRamp: [C.gold, C.sand, C.clay],
    item: 'scythe',
    itemRamp: [C.ice, C.brown, C.brownDark],
  });
};

const leshy = (c: Canvas): void => {
  biped(c, {
    cloth: [C.moss, C.pine, C.ink],
    skin: [C.brown, C.brownDark, C.wine],
    eye: C.lime,
    width: 12,
    height: 12,
    hair: 'antlers',
    hairRamp: [C.sand, C.clay, C.rust],
    item: 'branch',
  });
  // Moss and leaves on the shoulders.
  const r = seedRolls('leshy-sprite');
  for (let i = 0; i < 14; i++) c.set(10 + r() * 12, 11 + r() * 7, r() < 0.5 ? C.grass : C.lime);
};

const huldra = (c: Canvas): void => {
  biped(c, {
    cloth: [C.grass, C.moss, C.pine],
    skin: [C.cream, C.sand, C.clay],
    eye: C.moss,
    width: 8,
    height: 11,
    skirt: true,
    hair: 'long',
    hairRamp: [C.gold, C.sand, C.clay],
  });
  // The cow's tail, and a crown of small flowers.
  c.line(24, 26, 28, 19, C.brown, 2);
  c.ellipse(28, 18, 2, 3, C.brownDark);
  for (let i = 0; i < 4; i++) c.set(13 + i * 2, 3, i % 2 ? C.rose : C.frost);
};

const upyr = (c: Canvas): void => {
  biped(c, {
    cloth: [C.plum, C.night, C.ink],
    skin: [C.frost, C.bone, C.ash],
    eye: C.red,
    width: 11,
    height: 12,
    stoop: 2,
    hair: 'none',
  });
  c.rect(14, 10, 1, 2, C.frost);
  c.rect(16, 10, 1, 2, C.frost);
  c.rect(8, 14, 2, 1, C.blood);
};

const draugr = (c: Canvas): void => {
  biped(c, {
    cloth: [C.ice, C.blue, C.night],
    skin: [C.ice, C.slate, C.night],
    eye: C.cyan,
    width: 13,
    height: 12,
    hair: 'helm',
    hairRamp: [C.ash, C.stone, C.coal],
    item: 'sword',
    itemRamp: [C.ice, C.stone, C.coal],
  });
  // Rime on the shoulders.
  for (let x = 10; x < 23; x += 2) c.set(x, 11 + (x % 3 === 0 ? 1 : 0), C.frost);
};

const strzyga = (c: Canvas): void => {
  biped(c, {
    cloth: [C.orchid, C.violet, C.plum],
    skin: [C.ash, C.stone, C.coal],
    eye: C.gold,
    width: 8,
    height: 10,
    stoop: 2,
    hair: 'long',
    hairRamp: [C.dusk, C.violet, C.plum],
  });
  // Owl wings folded behind the shoulders, and a feathered hem.
  c.ellipse(23, 17, 4, 8, [C.violet, C.plum, C.ink][1] ?? C.plum);
  for (let y = 12; y < 24; y += 2) c.set(25, y, C.dusk);
  for (let x = 11; x < 21; x += 2) c.set(x, 24, C.dusk);
};

const rusalka = (c: Canvas): void => {
  biped(c, {
    cloth: [C.ice, C.cyan, C.blue],
    skin: [C.frost, C.bone, C.ash],
    eye: C.cyan,
    width: 8,
    height: 12,
    skirt: true,
    hair: 'long',
    hairRamp: [C.cyan, C.blue, C.night],
    lift: 1,
  });
  for (const [x, y] of [
    [11, 24],
    [20, 26],
    [14, 28],
  ] as const)
    c.set(x, y, C.frost);
};

const vodyanoy = (c: Canvas): void => {
  // A heavy, hunched old thing the color of pond water, webbed hands, a beard of reeds.
  shaded(c, 16, 21, 11, 8, [C.grass, C.moss, C.pine]);
  c.rect(8, 27, 5, 3, C.pine);
  c.rect(19, 27, 5, 3, C.pine);
  shaded(c, 12, 12, 6, 5, [C.lime, C.grass, C.moss]);
  c.set(9, 11, C.gold);
  c.set(13, 11, C.gold);
  c.rect(8, 15, 7, 2, C.blood);
  // The reed beard.
  for (let x = 8; x < 15; x += 2) c.line(x, 17, x - 1, 22, C.moss, 1);
  // Webbed hands, one forward.
  c.rect(3, 22, 5, 3, C.moss);
  c.set(3, 25, C.lime);
  c.set(5, 25, C.lime);
  c.set(7, 25, C.lime);
};

const gloamMoths = (c: Canvas): void => {
  // A cloud of five: each a body and two wings, dust falling from them.
  const moth = (cx: number, cy: number, s: number): void => {
    c.ellipse(cx - s, cy, s, s + 1, C.violet);
    c.ellipse(cx + s, cy, s, s + 1, C.plum);
    c.rect(cx, cy - 1, 1, 3, C.ink);
    c.set(cx - 1, cy - 2, C.gold);
    c.set(cx + 1, cy - 2, C.gold);
  };
  moth(10, 10, 3);
  moth(22, 8, 3);
  moth(16, 17, 4);
  moth(8, 23, 3);
  moth(24, 22, 3);
  const r = seedRolls('moth-dust');
  for (let i = 0; i < 12; i++) c.set(6 + r() * 20, 14 + r() * 15, C.orchid);
};

const ribbonshade = (c: Canvas): void => {
  wisp(c, 5, 14, [C.violet, C.plum, C.ink], C.red);
  // A long red ribbon streaming from where a hand should be.
  for (let i = 0; i < 18; i++)
    c.set(
      8 - Math.floor(i / 3) + (i % 2),
      16 + Math.floor(Math.sin(i / 2) * 2) + Math.floor(i / 4),
      C.blood,
    );
  c.line(6, 14, 2, 20, C.red, 1);
};

const anvilWight = (c: Canvas): void => {
  biped(c, {
    cloth: [C.coal, C.ink, C.wine],
    skin: [C.stone, C.coal, C.ink],
    eye: C.orange,
    width: 14,
    height: 13,
    hair: 'none',
  });
  // The head is an anvil: a wide flat face, a horn, a waist.
  c.rect(8, 1, 16, 4, C.stone);
  c.rect(8, 1, 16, 1, C.ash);
  c.rect(3, 2, 5, 2, C.coal);
  c.rect(13, 5, 6, 3, C.coal);
  // The forge still lit in its chest.
  c.rect(13, 14, 5, 4, C.orange);
  c.rect(14, 15, 3, 2, C.gold);
};

const rimewrought = (c: Canvas): void => {
  // Blocks of rimed stone stacked into a figure: legs, waist, chest, a crown of ice.
  c.rect(9, 22, 6, 8, C.slate);
  c.rect(18, 22, 6, 8, C.night);
  c.rect(8, 12, 17, 11, C.blue);
  c.rect(8, 12, 17, 2, C.ice);
  c.rect(8, 21, 17, 2, C.night);
  c.rect(11, 4, 10, 8, C.ice);
  c.rect(11, 4, 10, 2, C.frost);
  for (const x of [11, 14, 17, 20]) c.rect(x, 1, 2, 3, C.frost);
  c.set(13, 8, C.night);
  c.set(18, 8, C.night);
  c.rect(3, 13, 5, 3, C.blue);
  c.rect(3, 16, 4, 6, C.ice);
  for (const [x, y] of [
    [12, 16],
    [19, 18],
    [14, 26],
  ] as const)
    c.rect(x, y, 2, 1, C.frost);
};

// The Deep (D252): a breath, a forgetting and a tide.
const unlitsBreath = (c: Canvas): void => {
  wisp(c, 2, 18, [C.slate, C.plum, C.ink], C.ice);
  const r = seedRolls('unlit-breath');
  for (let i = 0; i < 18; i++) c.set(4 + r() * 24, 3 + r() * 26, r() < 0.5 ? C.dusk : C.frost);
};

const theForgotten = (c: Canvas): void => {
  // A figure with no face, a little too tall, arms a little too long.
  c.rect(11, 12, 10, 14, C.stone);
  c.rect(11, 12, 10, 2, C.ash);
  c.rect(11, 24, 10, 6, C.coal);
  c.ellipse(16, 7, 4, 5, C.bone);
  c.line(11, 13, 9, 26, C.ash, 2);
  c.line(21, 13, 23, 26, C.stone, 2);
  c.rect(8, 26, 3, 2, C.bone);
  c.rect(22, 26, 3, 2, C.bone);
};

const drossTide = (c: Canvas): void => {
  // A wave of cooled slag, heaving, a seam of heat running through it.
  for (let x = 2; x < 30; x++) {
    const crest =
      9 + Math.round(Math.abs(Math.sin(x / 3.2)) * 5) + Math.floor(Math.abs(x - 14) / 3);
    c.rect(x, crest, 1, 30 - crest, x < 8 ? C.coal : C.brownDark);
    c.set(x, crest, C.rust);
  }
  c.rect(5, 19, 22, 2, C.brown);
  c.rect(8, 23, 16, 1, C.orange);
  c.rect(12, 24, 8, 1, C.gold);
  const r = seedRolls('dross');
  for (let i = 0; i < 10; i++) c.set(3 + r() * 26, 14 + r() * 14, C.orange);
  c.set(7, 14, C.gold);
  c.set(9, 14, C.gold);
};

const DRAW: Record<MonsterId | GuardianId, (c: Canvas) => void> = {
  wolf,
  bies,
  nix,
  kikimora,
  poludnitsa,
  leshy,
  huldra,
  upyr,
  draugr,
  strzyga,
  rusalka,
  vodyanoy,
  'gloam-moths': gloamMoths,
  ribbonshade,
  'anvil-wight': anvilWight,
  rimewrought,
  'unlits-breath': unlitsBreath,
  'the-forgotten': theForgotten,
  'dross-tide': drossTide,
};

export const SPRITE_MONSTER_IDS: readonly (MonsterId | GuardianId)[] = [
  ...MONSTER_IDS,
  ...GUARDIAN_IDS,
];

export const familyOf = (id: MonsterId | GuardianId): FamilyId | 'deep' =>
  (GUARDIAN_IDS as readonly string[]).includes(id) ? 'deep' : monsters[id as MonsterId].family;

/** The base frame of a monster or guardian: facing left, outlined. */
export const drawMonsterSprite = (id: MonsterId | GuardianId): Canvas => {
  const c = new Canvas(SPRITE_SIZE);
  DRAW[id](c);
  c.outline(C.ink);
  return c;
};
