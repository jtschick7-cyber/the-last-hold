// v1.7 (plan VB.8, D605): the owner's round 1 redraws of Batch 4 (#31 Lindworm, #33 Mother of the
// River, #34 Fell-Troll, #35 Mara, #36 Likho, #39 Dross-Tide, #40 The Unlit). All face left, are
// drawn at 32 px in Zughy-32 with an ink outline whose lowest row sits on the y = 30 ground line,
// and use deliberate fold lines and highlights rather than speckle. Each also draws its own lunge
// flourish in the room the 4 px lunge leaves in front of it (tools/sprite-batch4.ts).
import { C, Canvas } from './pixel';
import { dots, ellipseM, has, lit, minus, N, polyM, sep, spk, tubeM, union } from './sprite-kit';

const strokes = (
  c: Canvas,
  col: string,
  lines: readonly (readonly [number, number, number, number])[],
): void => {
  for (const [x0, y0, x1, y1] of lines) c.line(x0, y0, x1, y1, col);
};
/** The frontmost (lowest x) painted pixel on row `y`, so a flourish can start at the attacker's front. */
const frontAt = (c: Canvas, y: number): number => {
  for (let x = 0; x < N; x++) if (c.get(x, y) !== null) return x;
  return N;
};

// #31 Lindworm of Velk Fjord: a horned fjord-blue sea-serpent rearing over its coils, tail curled up.
export const lindworm = (): Canvas => {
  const c = new Canvas(N);
  const body = tubeM([
    [14, 13, 3.2],
    [15, 17, 3.5],
    [17, 21, 4],
    [20, 24.5, 4.4],
    [24, 25, 4.4],
    [28, 22, 3.6],
    [30, 17, 2.6],
    [29, 12, 1.8],
    [26, 10, 1],
  ]);
  lit(c, body, {
    mid: C.blue,
    light: C.cyan,
    dark: C.night,
    top: C.cyan,
    left: C.blue,
    bottom: C.night,
  });
  // pale belly plates down the front of the neck and under the coils
  for (let y = 13; y <= 29; y++)
    for (let x = 0; x < N; x++) {
      if (!has(body, x, y)) continue;
      const front = !has(body, x - 1, y) && x <= 19;
      const under = !has(body, x, y + 1) && x >= 17 && x <= 27;
      if (front || under) c.set(x, y, y % 2 === 0 ? C.bone : C.ash);
    }
  // dorsal fins along the back
  for (let x = 14; x <= 30; x++)
    for (let y = 8; y <= 24; y++)
      if (has(body, x, y) && !has(body, x, y - 1) && x % 3 === 0) {
        c.set(x, y - 1, C.ice);
        c.set(x, y - 2, C.frost);
      }
  // scale flecks
  dots(c, C.night, [
    [16, 19],
    [19, 23],
    [22, 21],
    [25, 23],
    [27, 20],
    [29, 16],
  ]);
  dots(c, C.ice, [
    [17, 16],
    [21, 22],
    [24, 22],
    [28, 19],
  ]);
  // the head: long snout, hanging jaw, horn and ice mane
  const head = union(
    ellipseM(13, 8, 4.8, 3.8),
    polyM([
      [7, 7],
      [10, 5],
      [14, 5],
      [14, 10],
      [8, 10],
    ]),
  );
  lit(c, head, { mid: C.blue, light: C.ice, dark: C.night, top: C.cyan, left: C.ice });
  const jaw = polyM([
    [8, 11],
    [14, 11],
    [14, 13],
    [10, 13],
  ]);
  lit(c, jaw, { mid: C.bone, light: C.frost, dark: C.ash });
  c.rect(8, 9, 6, 1, C.ink);
  c.rect(8, 10, 6, 1, C.blood);
  dots(c, C.frost, [
    [8, 9],
    [10, 9],
    [12, 9],
    [9, 10],
    [11, 10],
    [13, 10],
  ]);
  dots(c, C.rose, [
    [10, 10],
    [11, 10],
  ]);
  c.rect(11, 6, 2, 2, C.gold);
  dots(c, C.ink, [[11, 7]]);
  dots(c, C.orange, [[12, 7]]);
  dots(c, C.ink, [
    [10, 5],
    [11, 5],
    [12, 5],
    [8, 7],
  ]);
  strokes(c, C.bone, [[13, 4, 16, 1]]);
  dots(c, C.frost, [[16, 1]]);
  strokes(c, C.ice, [
    [15, 6, 21, 2],
    [16, 8, 22, 6],
  ]);
  strokes(c, C.cyan, [[15, 7, 20, 5]]);
  dots(c, C.frost, [
    [21, 2],
    [22, 6],
  ]);
  c.outline(C.ink);
  return c;
};
export const lindwormFlourish = (l: Canvas): void => {
  // frost breath roaring from the open mouth
  const mx = frontAt(l, 10) - 1;
  for (let i = 0; i <= mx; i++) {
    const x = mx - i;
    const spread = Math.floor(i / 2);
    for (let y = 8 - spread; y <= 12 + spread; y++)
      if ((x + y) % 2 === 0) l.set(x, y, i < 2 ? C.frost : i < 4 ? C.ice : C.cyan);
  }
  dots(l, C.frost, [
    [0, 6],
    [1, 14],
    [0, 11],
  ]);
};

// #33 Mother of the River: a tall pale woman in a drowned gown, river-black hair and a reed crown.
export const motherOfTheRiver = (): Canvas => {
  const c = new Canvas(N);
  // the pool she stands in
  const pool = ellipseM(15, 28.2, 11, 1.7);
  lit(c, pool, { mid: C.cyan, light: C.frost, dark: C.blue, top: C.ice });
  // hair falling behind
  const hairBack = polyM([
    [10, 4],
    [19, 3],
    [23, 7],
    [25, 16],
    [26, 28],
    [19, 28],
    [19, 17],
    [11, 12],
    [9, 8],
  ]);
  lit(c, hairBack, { mid: C.night, light: C.blue, dark: C.plum });
  strokes(c, C.blue, [
    [22, 9, 24, 26],
    [20, 13, 22, 27],
    [24, 12, 25, 24],
  ]);
  dots(c, C.cyan, [
    [23, 12],
    [22, 18],
    [24, 21],
    [21, 24],
    [24, 16],
  ]);
  // the gown, with long folds
  const gown = polyM([
    [11, 15],
    [17, 15],
    [20, 20],
    [22, 28],
    [8, 28],
    [9, 20],
  ]);
  sep(c, gown);
  lit(c, gown, { mid: C.blue, light: C.ice, dark: C.night });
  strokes(c, C.night, [
    [13, 17, 11, 27],
    [16, 17, 17, 27],
    [19, 21, 20, 27],
  ]);
  strokes(c, C.cyan, [
    [12, 18, 10, 26],
    [15, 18, 15, 26],
  ]);
  dots(c, C.frost, [
    [11, 22],
    [14, 24],
    [18, 24],
    [9, 26],
  ]);
  c.rect(11, 17, 4, 1, C.ice); // sash
  // neck and face turned to the left
  c.rect(13, 13, 2, 3, C.bone);
  const face = ellipseM(14, 9, 3.6, 4.5);
  sep(c, face);
  lit(c, face, { mid: C.frost, light: C.frost, dark: C.bone, right: C.bone, bottom: C.bone });
  dots(c, C.ink, [
    [11, 8],
    [12, 8],
    [15, 8],
    [16, 8],
  ]);
  dots(c, C.cyan, [
    [11, 9],
    [12, 9],
    [15, 9],
    [16, 9],
  ]);
  dots(c, C.blue, [
    [12, 10],
    [16, 10],
  ]);
  dots(c, C.bone, [
    [11, 11],
    [12, 12],
  ]);
  dots(c, C.rose, [
    [12, 13],
    [13, 13],
  ]);
  // reed-and-thorn crown
  strokes(c, C.moss, [
    [11, 5, 9, 1],
    [14, 4, 14, 1],
    [17, 5, 19, 1],
    [12, 4, 11, 2],
    [16, 4, 17, 2],
  ]);
  dots(c, C.pine, [
    [10, 3],
    [18, 3],
  ]);
  dots(c, C.ice, [
    [9, 1],
    [14, 1],
    [19, 1],
    [11, 2],
    [17, 2],
  ]);
  // a lock of hair in front of the shoulder
  const lock = tubeM([
    [10, 8, 1],
    [9, 14, 1],
    [10, 21, 1],
  ]);
  sep(c, lock);
  lit(c, lock, { mid: C.night, light: C.blue, dark: C.plum });
  // the reaching arm
  const arm = polyM([
    [11, 16],
    [14, 16],
    [9, 21],
    [6, 20],
  ]);
  sep(c, arm);
  lit(c, arm, { mid: C.frost, light: C.frost, dark: C.bone });
  strokes(c, C.frost, [
    [6, 19, 4, 18],
    [6, 20, 3, 21],
    [6, 21, 4, 23],
  ]);
  dots(c, C.ice, [
    [4, 18],
    [3, 21],
    [4, 23],
  ]);
  c.outline(C.ink);
  return c;
};
export const motherFlourish = (l: Canvas): void => {
  // a rushing wave-crest of river water thrown from the open hand
  for (let i = 0; i < 7; i++) {
    const x = 2 - Math.floor(i / 3);
    l.set(x + (i % 2), 12 + i, C.ice);
    l.set(x - 1 + (i % 2), 12 + i, C.cyan);
  }
  dots(l, C.frost, [
    [1, 11],
    [0, 14],
    [1, 18],
    [0, 21],
    [2, 10],
  ]);
  dots(l, C.blue, [
    [0, 12],
    [0, 17],
    [1, 20],
  ]);
};

// #34 Stoneback Fell-Troll: a broad, mossy boulder of a troll, huge fists hanging, tusks showing.
export const fellTroll = (): Canvas => {
  const c = new Canvas(N);
  const rock = (x: number, y: number): string | null =>
    spk(x, y, 9) ? C.ash : spk(x, y, 11, 4) ? C.coal : null;
  // the far arm, hanging behind, and its fist
  const far = union(
    tubeM([
      [25, 14, 2.8],
      [28, 19, 2.6],
    ]),
    ellipseM(28.5, 23.5, 2.8, 3.4),
  );
  lit(c, far, { mid: C.coal, light: C.stone, dark: C.ink, tex: rock });
  // two thick legs with a gap between them
  const legs = union(
    polyM([
      [13, 21],
      [18, 21],
      [17, 29],
      [11, 29],
    ]),
    polyM([
      [21, 21],
      [26, 21],
      [27, 29],
      [20, 29],
    ]),
  );
  sep(c, legs);
  lit(c, legs, { mid: C.coal, light: C.stone, dark: C.ink, tex: rock });
  // a pear-shaped torso with a hump on the back
  const torso = union(ellipseM(19.5, 16, 8, 7.4), ellipseM(21.5, 10, 5.4, 4.4));
  sep(c, torso);
  lit(c, torso, { mid: C.stone, light: C.ash, dark: C.coal, top: C.bone, tex: rock });
  const belly = ellipseM(18, 19, 4, 3.2);
  lit(c, belly, { mid: C.ash, light: C.bone, dark: C.stone });
  strokes(c, C.coal, [
    [23, 10, 22, 14],
    [22, 14, 25, 19],
    [14, 15, 15, 17],
  ]);
  // the near arm swings out from the shoulder to a clenched fist
  const near = union(
    tubeM([
      [13, 13, 3],
      [10, 18, 2.8],
    ]),
    ellipseM(8.5, 23.5, 3.7, 3.5),
  );
  sep(c, near);
  lit(c, near, { mid: C.stone, light: C.bone, dark: C.coal, top: C.bone, tex: rock });
  strokes(c, C.coal, [
    [6, 22, 6, 26],
    [9, 22, 9, 27],
    [11, 23, 11, 26],
  ]);
  // the head, jutting forward from the hump
  const head = ellipseM(13, 8, 4.8, 4.2);
  sep(c, head);
  lit(c, head, { mid: C.stone, light: C.bone, dark: C.coal, top: C.bone, tex: rock });
  c.rect(8, 6, 8, 1, C.coal);
  c.rect(9, 7, 2, 1, C.ink);
  c.rect(14, 7, 2, 1, C.ink);
  dots(c, C.orange, [
    [9, 8],
    [10, 8],
    [14, 8],
    [15, 8],
  ]);
  dots(c, C.coal, [
    [12, 8],
    [12, 9],
    [13, 9],
  ]);
  c.rect(9, 12, 8, 1, C.ink);
  dots(c, C.bone, [
    [9, 11],
    [10, 11],
    [15, 11],
    [16, 11],
    [9, 10],
    [16, 10],
  ]); // tusks
  // moss on the head, shoulders, belly, knees and fists
  for (const [x, y] of [
    [11, 4],
    [12, 4],
    [14, 4],
    [16, 5],
    [13, 5],
    [20, 6],
    [21, 6],
    [24, 8],
    [25, 9],
    [26, 11],
    [18, 7],
    [10, 15],
    [11, 14],
    [6, 21],
    [7, 21],
    [13, 28],
    [24, 28],
    [14, 21],
    [27, 21],
  ] as const) {
    c.set(x, y, (x + y) % 2 === 0 ? C.grass : C.moss);
  }
  dots(c, C.lime, [
    [12, 4],
    [21, 6],
    [6, 21],
    [25, 9],
  ]);
  c.outline(C.ink);
  return c;
};
export const fellTrollFlourish = (l: Canvas): void => {
  // an earth-cracking smash: shards and dust thrown from the fist's impact
  dots(l, C.bone, [
    [3, 21],
    [2, 24],
    [1, 19],
    [4, 26],
  ]);
  dots(l, C.ash, [
    [2, 22],
    [0, 21],
    [3, 24],
    [1, 26],
    [5, 27],
    [2, 28],
  ]);
  dots(l, C.stone, [
    [1, 23],
    [0, 25],
    [3, 28],
    [4, 29],
  ]);
  dots(l, C.orange, [
    [3, 22],
    [2, 20],
  ]);
};

// #35 Mara of Kettle Barrow: a hooded night-hag with a pale face in the dark and one long clawed hand.
export const mara = (): Canvas => {
  const c = new Canvas(N);
  const cloak = union(
    ellipseM(16, 9, 6.2, 7),
    polyM([
      [10, 13],
      [22, 13],
      [25, 19],
      [28, 29],
      [9, 29],
      [11, 20],
    ]),
  );
  const torn = minus(
    cloak,
    union(
      ...[10, 13, 16, 19, 22, 25, 28].map((x) =>
        polyM([
          [x, 29],
          [x + 1, 29],
          [x + 0.5, 27],
        ]),
      ),
    ),
  );
  lit(c, torn, { mid: C.plum, light: C.violet, dark: C.wine, right: C.ink, top: C.violet });
  // folds
  strokes(c, C.wine, [
    [13, 16, 11, 28],
    [17, 19, 17, 28],
    [21, 16, 24, 28],
  ]);
  strokes(c, C.ink, [
    [19, 18, 20, 27],
    [15, 21, 14, 27],
  ]);
  strokes(c, C.violet, [
    [12, 15, 10, 25],
    [16, 20, 16, 26],
    [20, 15, 22, 24],
  ]);
  // the pale face inside the hood, a rim of light around the hood's mouth
  const face = ellipseM(12.5, 9.5, 2.9, 4.2);
  sep(c, face);
  lit(c, face, { mid: C.bone, light: C.frost, dark: C.ash, right: C.ash });
  dots(c, C.red, [
    [11, 9],
    [11, 10],
    [14, 9],
    [14, 10],
  ]);
  dots(c, C.ink, [
    [11, 8],
    [14, 8],
    [12, 12],
    [13, 12],
    [12, 13],
    [13, 13],
  ]);
  dots(c, C.frost, [[10, 8]]);
  // the sleeve and the long clawed hand
  const sleeve = polyM([
    [14, 16],
    [18, 16],
    [14, 22],
    [10, 21],
  ]);
  sep(c, sleeve);
  lit(c, sleeve, { mid: C.violet, light: C.dusk, dark: C.plum });
  const arm = tubeM([
    [11, 21, 1.5],
    [8, 19.5, 1.4],
  ]);
  lit(c, arm, { mid: C.bone, light: C.frost, dark: C.ash });
  c.ellipse(7.5, 18.5, 1.8, 1.6, C.frost);
  strokes(c, C.frost, [
    [6, 17, 4, 13],
    [6, 18, 2, 16],
    [6, 19, 2, 21],
    [7, 20, 5, 24],
  ]);
  dots(c, C.ash, [
    [4, 13],
    [2, 16],
    [2, 21],
    [5, 24],
    [6, 17],
  ]);
  dots(c, C.orange, [[22, 7]]);
  c.outline(C.ink);
  c.rimmedDowned = true;
  return c;
};
export const maraFlourish = (l: Canvas): void => {
  // four raking claw-marks of cold light
  for (let i = 0; i < 4; i++) {
    const y0 = 11 + i * 3;
    l.line(4, y0, 1, y0 + 4, i % 2 === 0 ? C.frost : C.ice);
  }
  dots(l, C.red, [
    [0, 11],
    [0, 17],
    [3, 19],
  ]);
};

// #36 Likho One-Eyed: a gaunt, hunched crone in rags, wild black hair, one great red eye, a fanged grin.
export const likho = (): Canvas => {
  const c = new Canvas(N);
  // the far arm hangs behind her
  const far = tubeM([
    [21, 17, 1.5],
    [25, 21, 1.4],
    [25, 26, 1.3],
  ]);
  lit(c, far, { mid: C.bone, light: C.cream, dark: C.ash });
  strokes(c, C.frost, [
    [25, 27, 24, 29],
    [25, 27, 26, 29],
  ]);
  // bony legs
  const legs = union(
    tubeM([
      [16, 24, 1.6],
      [14, 28, 1.3],
    ]),
    tubeM([
      [21, 24, 1.6],
      [22, 28, 1.3],
    ]),
  );
  lit(c, legs, { mid: C.bone, light: C.cream, dark: C.ash });
  c.rect(11, 28, 4, 1, C.ash);
  c.rect(21, 28, 4, 1, C.ash);
  // the hunched body in grey rags
  const body = union(
    tubeM([
      [15, 15, 3.2],
      [18, 19, 4.2],
      [19, 23, 4.4],
    ]),
    ellipseM(21, 18, 4.2, 4),
    polyM([
      [13, 21],
      [25, 21],
      [27, 27],
      [11, 27],
    ]),
  );
  const ragged = minus(
    body,
    union(
      ...[12, 15, 18, 21, 24].map((x) =>
        polyM([
          [x, 27],
          [x + 1.5, 27],
          [x + 0.7, 25],
        ]),
      ),
    ),
  );
  lit(c, ragged, { mid: C.stone, light: C.ash, dark: C.coal });
  strokes(c, C.coal, [
    [15, 18, 14, 26],
    [19, 18, 20, 26],
    [23, 20, 24, 26],
  ]);
  strokes(c, C.ash, [
    [16, 17, 15, 24],
    [21, 17, 22, 24],
  ]);
  strokes(c, C.bone, [
    [14, 16, 17, 16],
    [15, 18, 18, 18],
  ]); // ribs through the rags
  // wild hair, behind the face
  const hair = union(
    ellipseM(14, 7.5, 6.4, 5.4),
    polyM([
      [8, 6],
      [5, 2],
      [11, 3],
    ]),
    polyM([
      [10, 3],
      [9, 0],
      [14, 2],
    ]),
    polyM([
      [15, 2],
      [18, 0],
      [19, 5],
    ]),
    polyM([
      [19, 5],
      [24, 3],
      [20, 9],
    ]),
    polyM([
      [8, 9],
      [4, 11],
      [9, 13],
    ]),
    tubeM([
      [19, 9, 1.8],
      [22, 15, 1.5],
    ]),
  );
  lit(c, hair, { mid: C.plum, light: C.violet, dark: C.ink, top: C.violet });
  strokes(c, C.ink, [
    [12, 2, 10, 8],
    [16, 2, 17, 7],
    [19, 6, 21, 10],
  ]);
  // the long neck and gaunt face
  c.rect(13, 12, 3, 4, C.ash);
  const face = ellipseM(12.5, 9, 3.7, 4.7);
  sep(c, face);
  lit(c, face, { mid: C.bone, light: C.cream, dark: C.ash, right: C.ash });
  dots(c, C.ash, [
    [9, 10],
    [9, 11],
    [10, 12],
  ]); // hollow cheek
  // the one great eye
  c.ellipse(12.5, 8.5, 2.3, 1.9, C.red);
  dots(c, C.blood, [
    [10, 8],
    [11, 10],
    [14, 10],
  ]);
  dots(c, C.ink, [
    [12, 8],
    [12, 9],
    [13, 8],
    [13, 9],
  ]);
  dots(c, C.gold, [[11, 7]]);
  strokes(c, C.ink, [[9, 5, 15, 6]]); // heavy brow
  dots(c, C.ink, [
    [9, 6],
    [15, 7],
  ]);
  // fanged grin
  c.rect(9, 12, 7, 2, C.ink);
  dots(c, C.frost, [
    [9, 12],
    [11, 12],
    [13, 12],
    [15, 12],
    [10, 13],
    [12, 13],
    [14, 13],
  ]);
  // the long reaching arm
  const arm = tubeM([
    [14, 17, 1.6],
    [11, 21, 1.4],
    [8, 25, 1.2],
  ]);
  sep(c, arm);
  lit(c, arm, { mid: C.bone, light: C.cream, dark: C.ash });
  strokes(c, C.frost, [
    [8, 25, 5, 24],
    [8, 26, 5, 27],
    [9, 26, 8, 29],
  ]);
  c.outline(C.ink);
  return c;
};
export const likhoFlourish = (l: Canvas): void => {
  // the evil eye: a red stare-beam of ill luck, and clawing hand-sparks
  for (let x = 8; x >= 0; x--)
    if (x % 2 === 0) l.set(x, 8 + (x > 4 ? 0 : 1), x > 4 ? C.red : C.blood);
  dots(l, C.orange, [
    [3, 8],
    [0, 10],
  ]);
  dots(l, C.red, [
    [4, 7],
    [2, 10],
    [1, 7],
  ]);
  dots(l, C.bone, [
    [1, 25],
    [2, 27],
    [0, 26],
  ]);
};

// #39 The Dross-Tide: slag that walks, a crusted wave of cooling iron cracked with white-hot seams.
export const drossTide = (): Canvas => {
  const c = new Canvas(N);
  const legs = union(ellipseM(14.5, 26, 3.8, 3.4), ellipseM(23.5, 26, 4, 3.4));
  lit(c, legs, { mid: C.brownDark, light: C.brown, dark: C.ink });
  // the wave: back slope on the right, the crest curling over a hollow face
  const wave = polyM([
    [30, 25],
    [30, 19],
    [27, 12],
    [22, 7],
    [16, 4],
    [10, 5],
    [7, 9],
    [8, 14],
    [11, 14],
    [12, 18],
    [11, 25],
  ]);
  sep(c, wave);
  lit(c, wave, {
    mid: C.brown,
    light: C.rust,
    dark: C.brownDark,
    top: C.clay,
    left: C.rust,
    right: C.brownDark,
    bottom: C.ink,
    tex: (x, y) => (spk(x, y, 9) ? C.brownDark : spk(x, y, 10, 3) ? C.rust : null),
  });
  // glowing seams, white-hot at the core
  const seams = [
    [21, 8, 19, 13],
    [19, 13, 23, 18],
    [23, 18, 22, 24],
    [19, 13, 15, 17],
    [15, 17, 16, 22],
    [26, 13, 25, 17],
  ] as const;
  for (const [x0, y0, x1, y1] of seams) {
    c.line(x0, y0, x1, y1, C.orange);
    c.line(x0 + 1, y0, x1 + 1, y1, C.red);
  }
  for (const [x0, y0, x1, y1] of seams) c.line(x0, y0, x1, y1, C.orange);
  dots(c, C.gold, [
    [21, 8],
    [19, 13],
    [23, 18],
    [22, 22],
    [15, 17],
    [16, 20],
    [26, 13],
    [25, 16],
  ]);
  dots(c, C.cream, [
    [19, 13],
    [23, 18],
  ]);
  // molten foam bubbling along the crest
  for (let x = 8; x <= 28; x++)
    for (let y = 3; y <= 12; y++)
      if (has(wave, x, y) && !has(wave, x, y - 1)) {
        c.set(x, y, x % 2 === 0 ? C.gold : C.orange);
        if (x % 3 === 0) c.set(x, y - 1, C.sand);
      }
  // the slag-toothed maw beneath the curl, two molten eyes burning in it
  c.polygon(
    [
      [10, 15],
      [14, 15],
      [15, 19],
      [13, 24],
      [10, 23],
    ],
    C.ink,
  );
  dots(c, C.sand, [
    [11, 16],
    [13, 16],
    [11, 22],
    [13, 22],
  ]);
  dots(c, C.gold, [
    [11, 18],
    [14, 18],
  ]);
  dots(c, C.red, [
    [12, 18],
    [13, 19],
    [12, 20],
  ]);
  dots(c, C.orange, [
    [11, 19],
    [14, 19],
  ]);
  // slag running down from the curl
  strokes(c, C.orange, [
    [8, 15, 8, 19],
    [9, 16, 9, 21],
  ]);
  dots(c, C.gold, [
    [8, 16],
    [9, 18],
    [8, 20],
  ]);
  c.outline(C.ink);
  return c;
};
export const drossFlourish = (l: Canvas): void => {
  // Settling: a spray of molten slag flung from the curling crest
  dots(l, C.orange, [
    [4, 13],
    [3, 15],
    [2, 17],
    [3, 19],
    [4, 21],
  ]);
  dots(l, C.gold, [
    [3, 14],
    [1, 16],
    [2, 20],
    [1, 12],
    [5, 18],
  ]);
  dots(l, C.red, [
    [0, 14],
    [0, 18],
    [2, 22],
    [5, 23],
  ]);
};

// #40 The Unlit: a tall hooded dark in pauldrons and a plate, an ice crown, two cold eyes, one rimed hand.
export const unlit = (): Canvas => {
  const c = new Canvas(N);
  const cloak = union(
    ellipseM(15.5, 10.5, 5.8, 6.6),
    polyM([
      [11, 14],
      [21, 14],
      [25, 18],
      [27, 22],
      [29, 29],
      [9, 29],
      [11, 22],
      [10, 17],
    ]),
  );
  lit(c, cloak, { mid: C.plum, light: C.slate, dark: C.wine, top: C.dusk, right: C.ink });
  strokes(c, C.wine, [
    [13, 20, 11, 28],
    [17, 21, 17, 28],
    [21, 20, 24, 28],
  ]);
  strokes(c, C.ink, [
    [19, 21, 20, 28],
    [15, 23, 14, 28],
  ]);
  strokes(c, C.slate, [
    [11, 19, 9, 27],
    [15, 23, 15, 27],
    [22, 20, 25, 27],
  ]);
  // pauldrons and chest plate
  const farPauldron = ellipseM(22, 15.5, 3.6, 2.6);
  sep(c, farPauldron);
  lit(c, farPauldron, { mid: C.slate, light: C.dusk, dark: C.night });
  const plate = polyM([
    [13, 17],
    [19, 17],
    [18, 24],
    [14, 24],
  ]);
  sep(c, plate);
  lit(c, plate, { mid: C.slate, light: C.dusk, dark: C.night });
  c.rect(11, 24, 13, 1, C.violet);
  dots(c, C.cyan, [[16, 24]]);
  dots(c, C.gold, [
    [16, 19],
    [16, 20],
  ]);
  dots(c, C.orange, [[16, 21]]);
  // the face-void with two cold eyes
  const voidM = ellipseM(14.5, 10.5, 3.3, 4.2);
  sep(c, voidM);
  lit(c, voidM, { mid: C.ink, light: C.plum, dark: C.ink, top: C.violet, left: C.plum });
  c.rect(12, 10, 2, 2, C.cyan);
  c.rect(16, 10, 2, 2, C.cyan);
  dots(c, C.frost, [
    [12, 10],
    [16, 10],
  ]);
  // the ice crown: five spikes
  const spikes = [
    [
      [11, 6],
      [13, 6],
      [10, 2],
    ],
    [
      [12, 5],
      [14, 5],
      [12, 3],
    ],
    [
      [13, 5],
      [15, 5],
      [14, 1],
    ],
    [
      [15, 5],
      [17, 5],
      [18, 1],
    ],
    [
      [17, 6],
      [19, 6],
      [21, 3],
    ],
  ] as const;
  for (const tri of spikes) {
    c.polygon(tri, C.ice);
    c.line(tri[0][0], tri[0][1], tri[2][0], tri[2][1], C.frost);
    c.set(tri[2][0], tri[2][1], C.frost);
  }
  c.rect(11, 6, 8, 1, C.cyan);
  // the near pauldron and the one rimed hand
  const nearPauldron = ellipseM(10, 17, 3.2, 2.4);
  sep(c, nearPauldron);
  lit(c, nearPauldron, { mid: C.slate, light: C.dusk, dark: C.night });
  const sleeve = polyM([
    [12, 18],
    [15, 18],
    [13, 25],
    [9, 24],
  ]);
  sep(c, sleeve);
  lit(c, sleeve, { mid: C.violet, light: C.dusk, dark: C.plum });
  c.rect(7, 23, 3, 2, C.frost);
  strokes(c, C.frost, [
    [7, 23, 5, 21],
    [7, 24, 4, 24],
    [7, 25, 5, 27],
  ]);
  dots(c, C.ice, [
    [5, 21],
    [4, 24],
    [5, 27],
  ]);
  // rime creeping up the hem, icicles below it
  for (let x = 10; x <= 28; x++) if (x % 2 === 0) c.set(x, 28, C.ice);
  for (let x = 11; x <= 27; x += 3) c.set(x, 29, C.cyan);
  dots(c, C.frost, [
    [12, 25],
    [23, 26],
    [25, 23],
    [14, 27],
  ]);
  c.outline(C.ink);
  c.rimmedDowned = true;
  return c;
};
export const unlitFlourish = (l: Canvas): void => {
  // the Unlit's cold: a spear of frost and violet dark thrust from the open hand
  for (let x = 4; x >= 0; x--) {
    const y = 23 + (x % 2);
    l.set(x, y, x > 2 ? C.frost : C.cyan);
    l.set(x, y - 1, C.violet);
  }
  dots(l, C.ice, [
    [2, 20],
    [3, 27],
    [1, 26],
    [4, 19],
  ]);
  dots(l, C.orchid, [
    [0, 21],
    [2, 28],
    [0, 27],
  ]);
};
