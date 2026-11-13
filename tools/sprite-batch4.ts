// v1.7 (plan VB.8, D605): authors the 10 Batch 4 battle sprite strips (#31-#40, all facing left):
// the 6 Event Creatures, the 3 Deep Guardians and The Unlit. Every sprite is drawn once at 32 px in
// Zughy-32 colours with an ink outline whose lowest row sits on the y = 30 ground line, then
// `framesOf` (tools/sprite-frames.ts) makes idle2, hit and downed, and each sprite adds its own
// lunge flourish (a claw, breath, strike or curse) in the room the 4 px lunge leaves in front of it.
// Run: npx vite-node tools/sprite-batch4.ts -- --write   (writes art-src/v1.7-staging/, never public/assets/)
import { mkdirSync, writeFileSync } from 'node:fs';
import { packPng } from './png-pack';
import { C, Canvas } from './pixel';
import { framesOf, stripPng } from './sprite-frames';
import {
  ellipseM,
  has,
  lit,
  N,
  polyM,
  sep,
  spk,
  dots,
  tubeM,
  union,
  minus,
  type Lit,
} from './sprite-kit';
import {
  drossFlourish,
  drossTide,
  fellTroll,
  fellTrollFlourish,
  likho,
  likhoFlourish,
  lindworm,
  lindwormFlourish,
  mara,
  maraFlourish,
  motherFlourish,
  motherOfTheRiver,
  unlit,
  unlitFlourish,
} from './sprite-batch4-redraws';

// ---------------------------------------------------------------------------------------------
// #32 Barrow-King: a skeletal king in a ragged mantle, crown askew, rusted sword held out front.
const barrowKing = (): Canvas => {
  const c = new Canvas(N);
  const cloak = polyM([
    [12, 13],
    [20, 13],
    [24, 19],
    [26, 29],
    [11, 29],
    [11, 20],
  ]);
  lit(c, minus(cloak, ellipseM(15, 29, 1, 0.8)), {
    mid: C.plum,
    light: C.violet,
    dark: C.wine,
    tex: (x, y) => (spk(x, y, 9) ? C.wine : null),
  });
  for (const x of [13, 17, 20, 23]) c.set(x, 29, null); // ragged hem
  for (const x of [15, 19, 22]) c.set(x, 28, C.wine);
  // exposed ribs
  c.rect(13, 14, 6, 6, C.ink);
  for (const y of [14, 16, 18]) c.rect(13, y, 6, 1, C.bone);
  c.rect(15, 14, 1, 6, C.ash);
  // belt of rusted iron
  c.rect(11, 22, 14, 1, C.rust);
  dots(c, C.gold, [[17, 22]]);
  // skull
  const skull = union(
    ellipseM(15, 9, 4, 4.4),
    polyM([
      [12, 11],
      [18, 11],
      [17, 13],
      [13, 13],
    ]),
  );
  lit(c, skull, { mid: C.bone, light: C.frost, dark: C.ash });
  c.rect(12, 8, 2, 3, C.ink);
  c.rect(16, 8, 2, 3, C.ink);
  dots(c, C.cyan, [
    [12, 9],
    [16, 9],
  ]);
  dots(c, C.ice, [
    [12, 8],
    [16, 8],
  ]);
  dots(c, C.ink, [[15, 11]]);
  for (const x of [13, 15, 17]) c.set(x, 13, C.ink); // teeth gaps
  // crown
  c.rect(11, 4, 9, 2, C.gold);
  dots(c, C.orange, [
    [11, 5],
    [14, 5],
    [19, 5],
  ]);
  dots(c, C.red, [[15, 4]]);
  for (const [x, y] of [
    [11, 3],
    [13, 2],
    [15, 3],
    [17, 2],
    [19, 3],
  ] as const) {
    c.set(x, y, C.gold);
    c.set(x, y - 1, C.ice);
  }
  // sword arm and rusted blade
  const sleeve = polyM([
    [12, 15],
    [14, 15],
    [11, 22],
    [9, 22],
  ]);
  lit(c, sleeve, { mid: C.violet, light: C.dusk, dark: C.plum });
  c.rect(8, 6, 1, 12, C.ice);
  c.rect(9, 7, 1, 10, C.slate);
  dots(c, C.frost, [
    [8, 6],
    [8, 9],
    [8, 13],
  ]);
  c.rect(6, 18, 5, 1, C.gold);
  c.rect(8, 19, 2, 3, C.bone);
  c.rect(8, 22, 1, 1, C.brown);
  c.outline(C.ink);
  return c;
};
const barrowKingFlourish = (l: Canvas): void => {
  // a wide ghost-light slash arcing in front of the blade
  const arc: readonly (readonly [number, number])[] = [
    [3, 4],
    [2, 6],
    [1, 8],
    [1, 10],
    [1, 12],
    [1, 14],
    [2, 16],
    [3, 18],
  ];
  arc.forEach(([x, y], i) => {
    l.set(x, y, i % 2 === 0 ? C.frost : C.cyan);
    l.set(x + 1, y, C.ice);
  });
  dots(l, C.ice, [
    [0, 6],
    [0, 15],
  ]);
};

// ---------------------------------------------------------------------------------------------
// #37 Unlit's Breath: a draught where there is no window, coiling in cold bands, one hollow eye.
const unlitsBreath = (): Canvas => {
  const c = new Canvas(N);
  const gust = tubeM([
    [24, 5, 3.4],
    [15, 9, 4.2],
    [21, 15, 4],
    [14, 20.5, 3.6],
    [19, 25.5, 3],
    [16, 28.6, 1.3],
  ]);
  lit(c, gust, {
    mid: C.ice,
    light: C.frost,
    dark: C.blue,
    right: C.night,
    bottom: C.blue,
    tex: (x, y) => (spk(x, y, 7) ? C.cyan : spk(x, y, 9, 2) ? C.frost : null),
  });
  // swirl bands
  for (let y = 4; y <= 28; y++)
    for (let x = 8; x <= 28; x++)
      if (
        has(gust, x, y) &&
        (y + Math.floor(x / 3)) % 5 === 0 &&
        has(gust, x, y - 1) &&
        has(gust, x, y + 1)
      )
        c.set(x, y, C.blue);
  // the hollow, a window with no glass
  c.ellipse(14.5, 9, 1.8, 2.4, C.ink);
  dots(c, C.cyan, [
    [14, 8],
    [15, 10],
  ]);
  // streamers and snow-motes raked off downwind
  for (const [x0, y0, x1, y1, col] of [
    [27, 8, 31, 5, C.ice],
    [25, 14, 30, 12, C.cyan],
    [20, 24, 26, 26, C.ice],
  ] as const) {
    c.line(x0, y0, x1, y1, col);
  }
  dots(c, C.frost, [
    [30, 4],
    [29, 17],
    [28, 22],
    [27, 29],
    [10, 25],
    [10, 15],
  ]);
  c.outline(C.ink);
  return c;
};
const breathFlourish = (l: Canvas): void => {
  // a biting gale-front of ice shards driven out ahead of it
  for (let i = 0; i < 4; i++) {
    const y = 8 + i * 4;
    l.line(5, y, 1, y + (i % 2 === 0 ? 1 : -1), i % 2 === 0 ? C.frost : C.ice);
    l.set(0, y, C.cyan);
  }
  dots(l, C.frost, [
    [3, 5],
    [2, 22],
    [4, 20],
    [1, 26],
  ]);
};

// ---------------------------------------------------------------------------------------------
// #38 The Forgotten: a crowd of faceless robed shapes, the nearest bright and the last half gone.
const forgottenFigure = (
  c: Canvas,
  cx: number,
  headY: number,
  robeW: number,
  tones: Lit,
  face: string,
): void => {
  const robe = union(
    polyM([
      [cx - 3, headY + 4],
      [cx + 3, headY + 4],
      [cx + robeW, 29],
      [cx - robeW, 29],
    ]),
    ellipseM(cx, headY + 5, 4, 2.2),
  );
  sep(c, robe);
  lit(c, robe, tones);
  const head = ellipseM(cx, headY, 2.7, 3.3);
  sep(c, head);
  lit(c, head, { mid: face, light: C.frost, dark: C.ash, right: C.ash });
};
const forgotten = (): Canvas => {
  const c = new Canvas(N);
  forgottenFigure(c, 27, 11, 4, { mid: C.slate, light: C.dusk, dark: C.plum }, C.dusk);
  forgottenFigure(c, 21.5, 7, 4.5, { mid: C.coal, light: C.stone, dark: C.slate }, C.stone);
  forgottenFigure(c, 16, 10, 5, { mid: C.stone, light: C.ash, dark: C.coal }, C.ash);
  forgottenFigure(c, 10, 4, 5.5, { mid: C.ash, light: C.bone, dark: C.stone }, C.frost);
  // lost names: faint cold motes drifting off them
  dots(c, C.ice, [
    [15, 3],
    [20, 1],
    [26, 5],
    [30, 8],
    [4, 12],
    [29, 18],
  ]);
  dots(c, C.dusk, [
    [13, 24],
    [19, 22],
    [24, 25],
  ]);
  c.outline(C.ink);
  return c;
};
const forgottenFlourish = (l: Canvas): void => {
  // the whole crowd reaching at once: pale hands thrust forward out of the dark
  for (let i = 0; i < 3; i++) {
    const y = 11 + i * 4;
    l.line(5, y, 1, y - 1, C.frost);
    dots(l, C.bone, [
      [0, y - 2],
      [0, y],
      [2, y + 1],
    ]);
  }
};

// ---------------------------------------------------------------------------------------------
export interface Batch4Sprite {
  readonly file: string;
  readonly draw: () => Canvas;
  readonly flourish: (lunge: Canvas) => void;
}

export const BATCH_4_SPRITES: readonly Batch4Sprite[] = [
  { file: 'creature-lindworm-of-velk-fjord.png', draw: lindworm, flourish: lindwormFlourish },
  { file: 'creature-barrow-king.png', draw: barrowKing, flourish: barrowKingFlourish },
  { file: 'creature-mother-of-the-river.png', draw: motherOfTheRiver, flourish: motherFlourish },
  { file: 'creature-stoneback-fell-troll.png', draw: fellTroll, flourish: fellTrollFlourish },
  { file: 'creature-mara-of-kettle-barrow.png', draw: mara, flourish: maraFlourish },
  { file: 'creature-likho-one-eyed.png', draw: likho, flourish: likhoFlourish },
  { file: 'guardian-unlits-breath.png', draw: unlitsBreath, flourish: breathFlourish },
  { file: 'guardian-the-forgotten.png', draw: forgotten, flourish: forgottenFlourish },
  { file: 'guardian-dross-tide.png', draw: drossTide, flourish: drossFlourish },
  { file: 'monster-unlit.png', draw: unlit, flourish: unlitFlourish },
];

export const batch4Strip = (s: Batch4Sprite): Buffer => {
  const frames = framesOf(s.draw(), 'left');
  s.flourish(frames.lunge);
  return stripPng(frames);
};

if (process.argv.includes('--write')) {
  const outDir = new URL('../art-src/v1.7-staging/', import.meta.url);
  mkdirSync(outDir, { recursive: true });
  for (const s of BATCH_4_SPRITES) {
    const raw = batch4Strip(s);
    writeFileSync(new URL(s.file, outDir), packPng(raw) ?? raw);
    console.log(`art-src/v1.7-staging/${s.file}`);
  }
}
