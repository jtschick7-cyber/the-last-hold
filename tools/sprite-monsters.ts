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
  c.rimmedDowned = true; // v1.0 (TV.8a): the dark cloak keeps a rim when downed
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
  // v1.0 (TV.8a): a lighter rim on the cloak's top and left edge, so it reads on a dark ground.
  const cloak = new Set<string>([C.plum, C.night, C.ink]);
  const edges: [number, number][] = [];
  for (let y = 10; y < 18; y++)
    for (let x = 0; x < 32; x++) {
      const v = c.get(x, y);
      if (v === null || !cloak.has(v)) continue;
      if (c.get(x, y - 1) === null || c.get(x - 1, y) === null) edges.push([x, y]);
    }
  for (const [x, y] of edges) c.set(x, y, C.dusk);
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

/** A moth seen from above: a thin body, two wings each of a big upper and a small lower lobe, an eye on each. */
const moth = (c: Canvas, cx: number, cy: number, s: number): void => {
  for (const dir of [-1, 1]) {
    // Upper wing: a triangle sweeping up and out.
    for (let dy = 0; dy <= s; dy++) {
      const reach = Math.round((s + 2) * (1 - dy / (s + 1)));
      for (let i = 1; i <= reach + 1; i++) {
        const edge = i === reach + 1 || dy === s;
        c.set(cx + dir * i, cy - dy, edge ? C.plum : dy < 2 ? C.dusk : C.violet);
      }
    }
    // Lower wing: smaller, tucked below.
    for (let dy = 1; dy <= Math.max(2, s - 1); dy++) {
      const reach = Math.round(s * (1 - dy / (s + 1)));
      for (let i = 1; i <= reach + 1; i++)
        c.set(cx + dir * i, cy + dy, i === reach + 1 ? C.plum : C.orchid);
    }
    c.set(cx + dir * Math.max(2, Math.floor(s / 2) + 1), cy - Math.floor(s / 2), C.gold);
    // Feathered antennae.
    c.set(cx + dir, cy - 3, C.ash);
    c.set(cx + dir * 2, cy - 4, C.ash);
  }
  c.rect(cx, cy - 3, 1, 7, C.ink);
  c.set(cx, cy - 2, C.gold);
};

const gloamMoths = (c: Canvas): void => {
  // One big moth in front and a flutter of small ones behind it, dust drifting down from the wings.
  moth(c, 10, 7, 2);
  moth(c, 23, 9, 2);
  moth(c, 8, 22, 2);
  moth(c, 24, 24, 2);
  moth(c, 16, 17, 5);
  const r = seedRolls('moth-dust');
  for (let i = 0; i < 14; i++) c.set(5 + r() * 22, 20 + r() * 10, r() < 0.5 ? C.orchid : C.dusk);
};

const ribbonshade = (c: Canvas): void => {
  // A hooded shade with a pale blank mask for a face.
  wisp(c, 4, 15, [C.violet, C.plum, C.ink], C.ink);
  c.ellipse(16, 9, 3, 4, C.bone);
  c.rect(14, 8, 2, 1, C.ink);
  c.rect(17, 8, 2, 1, C.ink);
  c.set(16, 12, C.ash);
  // The ribbon winds twice around it and streams away in a long wave, bright against the dark.
  for (const y of [14, 18, 22]) {
    c.line(11, y, 21, y + 3, C.red, 2);
    c.line(11, y + 1, 21, y + 4, C.blood, 1);
  }
  const pts: readonly (readonly [number, number])[] = [
    [11, 14],
    [8, 11],
    [5, 13],
    [3, 9],
    [1, 11],
  ];
  pts.forEach(([x, y], i) => {
    const next = pts[i + 1];
    if (!next) return;
    c.line(x, y, next[0], next[1], C.red, 2);
    c.line(x, y + 2, next[0], next[1] + 2, C.blood, 1);
  });
  c.set(1, 9, C.pink);
  c.set(3, 8, C.pink);
};

const anvilWight = (c: Canvas): void => {
  // v1.0 (TV.8a): a hunched smith's wight at its anvil, hammer raised. Facing left.
  c.rimmedDowned = true;
  const skin = [C.ash, C.stone, C.coal] as const;
  // The anvil: face, horn, waist and foot.
  c.rect(4, 19, 10, 3, C.stone);
  c.rect(4, 19, 10, 1, C.bone);
  c.rect(3, 20, 2, 2, C.stone);
  c.rect(6, 22, 5, 3, C.coal);
  c.rect(5, 25, 8, 3, C.coal);
  c.rect(5, 25, 8, 1, C.stone);
  // Legs and feet, then the hunched back and chest.
  c.rect(17, 24, 4, 5, C.wine);
  c.rect(22, 24, 4, 5, C.wine);
  c.rect(16, 28, 5, 1, C.coal);
  c.rect(21, 28, 5, 1, C.coal);
  c.ellipse(21, 19, 6, 6, C.coal);
  c.ellipse(23, 14, 5, 5, C.wine);
  c.ellipse(22, 15, 4, 3, C.coal);
  // The bowed head, a heavy brow and ember eyes.
  c.ellipse(16, 13, 4, 4, (_x, y) => (y < 12 ? skin[0] : y > 14 ? skin[2] : skin[1]));
  c.rect(12, 12, 5, 1, C.coal);
  c.set(14, 13, C.orange);
  c.set(17, 13, C.orange);
  // The arm and the hammer coming down on the anvil.
  c.line(19, 15, 15, 16, C.stone, 2);
  c.line(15, 16, 11, 9, C.brown, 1);
  c.rect(7, 5, 7, 4, C.ash);
  c.rect(7, 5, 7, 1, C.frost);
  c.rect(7, 8, 7, 1, C.stone);
  // The forge still lit in its chest, and a spark off the anvil.
  c.rect(18, 18, 3, 3, C.orange);
  c.set(19, 19, C.gold);
  c.set(6, 16, C.gold);
  c.set(10, 17, C.orange);
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
  // A draught where there is no window: bands of cold air curling through the air, and nothing in them.
  for (let y = 1; y < 30; y++) {
    const mid = 16 + Math.round(Math.sin(y / 3.2) * 5);
    const half = 3 + Math.round(Math.sin(y / 5.1 + 1) * 2) + (y > 20 ? 1 : 0);
    const band = y % 4;
    c.rect(
      mid - half,
      y,
      half * 2,
      1,
      band === 0 ? C.frost : band === 1 ? C.ice : band === 2 ? C.dusk : C.slate,
    );
    c.set(mid - half, y, C.slate);
    c.set(mid + half - 1, y, C.night);
  }
  // A hollow at its heart, and breath streaming off to one side.
  c.ellipse(16, 14, 2, 3, C.ink);
  c.set(16, 12, C.night);
  for (const [x, y] of [
    [5, 9],
    [7, 8],
    [4, 15],
    [6, 16],
    [4, 22],
    [26, 6],
    [27, 18],
    [24, 25],
  ] as const)
    c.set(x, y, C.frost);
  for (let x = 4; x < 10; x++) c.set(x, 12 + (x % 2), C.ice);
};

const forgottenFigure = (
  c: Canvas,
  cx: number,
  top: number,
  w: number,
  tone: readonly [string, string, string],
): void => {
  const h = 29 - top;
  c.ellipse(cx, top + 3, 3, 4, tone[0]);
  c.rect(cx - Math.floor(w / 2), top + 7, w, h - 7, tone[1]);
  c.rect(cx - Math.floor(w / 2), top + 7, w, 2, tone[0]);
  c.rect(cx - Math.floor(w / 2), 26, w, 4, tone[2]);
  c.line(cx - Math.floor(w / 2), top + 9, cx - Math.floor(w / 2) - 1, top + h - 4, tone[1], 1);
  c.line(cx + Math.floor(w / 2), top + 9, cx + Math.floor(w / 2) + 1, top + h - 4, tone[2], 1);
};

const theForgotten = (c: Canvas): void => {
  // A crowd of shapes with nobody's face: three figures, the near one tallest, none with a feature.
  forgottenFigure(c, 8, 8, 6, [C.stone, C.coal, C.ink]);
  forgottenFigure(c, 24, 7, 6, [C.stone, C.coal, C.ink]);
  forgottenFigure(c, 16, 1, 10, [C.bone, C.ash, C.stone]);
  // Where a face should be, only a smooth pale oval and a little less dark.
  c.set(16, 5, C.ash);
};

const drossTide = (c: Canvas): void => {
  // Slag that walks: a heaped body with a crest curling over like a wave, on two stumps, one
  // heavy arm reaching, a seam of heat through it.
  c.rect(10, 24, 5, 6, C.coal);
  c.rect(19, 24, 5, 6, C.brownDark);
  shaded(c, 17, 16, 10, 9, [C.rust, C.brown, C.brownDark]);
  // The crest: a lip of slag curling forward over the top.
  c.ellipse(10, 8, 6, 3, C.rust);
  c.rect(4, 8, 6, 3, C.brown);
  c.set(3, 10, C.brownDark);
  c.ellipse(19, 8, 5, 3, C.brown);
  // The reaching arm.
  c.line(9, 17, 3, 22, C.brown, 3);
  c.rect(1, 22, 4, 4, C.brownDark);
  // Cracks of heat.
  c.line(14, 10, 16, 16, C.orange, 1);
  c.line(16, 16, 13, 22, C.orange, 1);
  c.line(16, 16, 22, 19, C.orange, 1);
  c.set(15, 13, C.gold);
  c.set(15, 19, C.gold);
  c.set(7, 14, C.orange);
  c.set(8, 14, C.gold);
  // Drips.
  c.set(6, 27, C.orange);
  c.set(26, 22, C.orange);
  c.set(27, 25, C.rust);
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
