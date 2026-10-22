// v1.0 (plan TV.8a, D475, D492): the redrawn portraits of eight contract species. The same method
// as draw-monster.ts (small shapes in palette colors, deterministic, committed as PNGs); each
// function here is used by its own species only, so no picture marked Keep can change.
import { C, Canvas, seedRolls } from './pixel';
import { CX, eyes } from './portrait-parts';

/** Bies: a bark-brown woodland devil, curved horns, long pointed fangs. */
export const bies = (c: Canvas): void => {
  const hide = [C.rust, C.brown, C.brownDark] as const;
  // Curving horns sweeping out and up, tips turned back in.
  const horn: readonly (readonly [number, number, number])[] = [
    [CX - 11, 24, 4],
    [CX - 17, 21, 4],
    [CX - 22, 15, 3],
    [CX - 23, 8, 3],
    [CX - 20, 3, 2],
    [CX - 16, 1, 1],
  ];
  c.mirrored((set) => {
    horn.forEach(([x, y, w], i) => {
      const n = horn[i + 1];
      if (!n) return;
      for (let t = 0; t <= 8; t++) {
        const px = x + ((n[0] - x) * t) / 8;
        const py = y + ((n[1] - y) * t) / 8;
        const wd = w + ((n[2] - w) * t) / 8;
        for (let k = 0; k < Math.round(wd); k++) {
          set(Math.round(px) + k, Math.round(py), k === 0 ? C.bone : k === 1 ? C.ash : C.stone);
        }
      }
    });
  });
  // The head: a long goat face, lit on the left.
  c.ellipse(CX, 33, 15, 18, (x, y) =>
    x < 26 ? hide[0] : x > 38 ? hide[2] : y < 24 ? hide[0] : hide[1],
  );
  c.rect(CX - 14, 23, 28, 4, C.wine);
  // Ears, low and back.
  c.mirrored((set) => {
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 3; j++) set(CX - 16 - i, 28 + j + Math.floor(i / 2), hide[1]);
  });
  // Slit eyes.
  eyes(c, 28, 9, 5, 2, C.gold);
  c.mirrored((set) => {
    set(CX - 11, 28, C.ink);
    set(CX - 11, 29, C.ink);
  });
  // Muzzle, nostrils, a wide mouth with fangs top and bottom.
  c.ellipse(CX, 42, 9, 8, (x) => (x < 28 ? C.clay : x > 36 ? hide[1] : C.rust));
  c.mirrored((set) => {
    set(CX - 3, 39, C.ink);
    set(CX - 3, 40, C.ink);
  });
  c.rect(CX - 9, 46, 18, 2, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 7; j++) {
      set(CX - 7, 46 + j, C.frost);
      if (j < 5) set(CX - 6, 46 + j, C.bone);
    }
    for (let j = 0; j < 4; j++) set(CX - 4, 44 - j + 2, C.frost);
  });
  // Goat beard, ragged.
  c.mirrored((set) => {
    for (let j = 0; j < 12; j++)
      for (let i = 0; i < 4 - Math.floor(j / 3); i++) set(CX - i, 50 + j, C.wine);
  });
  // Moss on the brow and an ember.
  const r = seedRolls('bies');
  for (let i = 0; i < 10; i++) c.set(CX - 12 + r() * 24, 22 + r() * 3, r() < 0.5 ? C.moss : C.pine);
  c.mirrored((set) => {
    set(CX - 22, 54, C.orange);
    set(CX - 19, 58, C.gold);
  });
};

/** Huldra: a forest woman seen from the front, golden hair, a leaf crown, hollow bark down one cheek. */
export const huldra = (c: Canvas): void => {
  const hair = [C.gold, C.sand, C.clay] as const;
  const r = seedRolls('huldra');
  // Hair behind and falling in two long locks past the shoulders.
  c.ellipse(CX, 24, 17, 19, hair[1]);
  c.polygon(
    [
      [13, 26],
      [21, 26],
      [20, 62],
      [8, 62],
    ],
    hair[1],
  );
  c.polygon(
    [
      [43, 26],
      [51, 26],
      [56, 62],
      [44, 62],
    ],
    hair[1],
  );
  for (let i = 0; i < 130; i++) {
    const x = 8 + r() * 48;
    const y = 8 + r() * 54;
    if (c.get(x, y) === hair[1]) c.set(x, y, r() < 0.55 ? hair[0] : hair[2]);
  }
  // Shoulders: a moss gown with a bark collar, and a bare neck.
  c.ellipse(CX, 66, 24, 14, C.moss);
  c.ellipse(CX, 66, 24, 14, (x, y) => (y < 56 ? null : (x + y) % 5 === 0 ? C.pine : C.moss));
  c.rect(CX - 5, 44, 10, 10, C.clay);
  c.polygon(
    [
      [CX - 11, 52],
      [CX + 11, 52],
      [CX + 8, 60],
      [CX - 8, 60],
    ],
    C.brown,
  );
  // The face: cream on the left, bark on the right, a hollow between.
  c.ellipse(CX, 29, 11, 14, (x) => (x > CX + 3 ? C.rust : C.cream));
  c.rect(CX + 3, 20, 5, 17, C.brownDark);
  c.rect(CX + 4, 22, 3, 13, C.ink);
  c.set(CX + 5, 30, C.moss);
  c.set(CX + 6, 33, C.moss);
  for (let j = 18; j < 40; j += 4) c.line(CX + 8, j, CX + 11, j + 2, C.brown, 1);
  // A crown of leaves.
  for (let i = 0; i < 7; i++) {
    const x = CX - 12 + i * 4;
    const y = 14 + Math.abs(i - 3);
    c.rect(x, y - 2, 3, 3, i % 2 ? C.grass : C.moss);
    c.set(x + 1, y - 3, C.lime);
  }
  c.set(CX - 2, 12, C.rose);
  // Eyes: moss-green on the lit side, a hollow on the bark side. Lips.
  c.rect(CX - 8, 27, 4, 3, C.moss);
  c.set(CX - 7, 28, C.ink);
  c.rect(CX - 1, 27, 3, 2, C.ink);
  c.rect(CX - 4, 38, 7, 2, C.rose);
  // The cow's tail curling out beside her.
  c.line(58, 62, 61, 50, C.brown, 2);
  c.ellipse(61, 48, 2, 4, C.brownDark);
};

/** Kikimora: a gaunt marsh hag, narrow crooked yellow eyes, a hooked nose, a tattered shawl. */
export const kikimora = (c: Canvas): void => {
  const hair = [C.stone, C.coal, C.ink] as const;
  const r = seedRolls('kikimora');
  // Stringy hair falling past the face.
  c.ellipse(CX, 28, 19, 23, hair[1]);
  c.polygon(
    [
      [13, 30],
      [22, 30],
      [21, 62],
      [9, 62],
    ],
    hair[1],
  );
  c.polygon(
    [
      [42, 30],
      [51, 30],
      [55, 62],
      [43, 62],
    ],
    hair[1],
  );
  for (let i = 0; i < 130; i++) {
    const x = 9 + r() * 46;
    const y = 6 + r() * 56;
    if (c.get(x, y) === hair[1]) c.set(x, y, r() < 0.5 ? hair[0] : hair[2]);
  }
  // A narrow, bony face with hollow cheeks.
  c.ellipse(CX, 29, 11, 16, (x, y) => (y > 40 ? C.ash : x < 28 ? C.bone : C.ash));
  c.mirrored((set) => {
    for (let j = 0; j < 8; j++) set(CX - 9 + Math.floor(j / 3), 31 + j, C.stone);
  });
  // Narrow, crooked yellow eyes (the outer corners lift), small dark pupils.
  c.mirrored((set) => {
    for (let i = 0; i < 5; i++) set(CX - 5 - i, 26 - Math.floor(i / 2) + (i === 0 ? 0 : 0), C.gold);
    for (let i = 0; i < 4; i++) set(CX - 5 - i, 27 - Math.floor(i / 2), C.sand);
    set(CX - 7, 26, C.ink);
    for (let i = 0; i < 6; i++) set(CX - 5 - i, 24 - Math.floor(i / 3), C.ink);
  });
  // A long hooked, beak-like nose.
  c.rect(CX - 1, 28, 3, 9, C.ash);
  c.rect(CX - 1, 28, 1, 9, C.bone);
  c.polygon(
    [
      [CX - 1, 36],
      [CX + 3, 36],
      [CX + 2, 41],
      [CX, 40],
    ],
    C.stone,
  );
  c.set(CX + 1, 41, C.coal);
  // A thin, down-turned mouth.
  c.rect(CX - 5, 45, 10, 1, C.ink);
  c.set(CX - 6, 46, C.ink);
  c.set(CX + 5, 46, C.ink);
  c.rect(CX - 2, 47, 4, 1, C.blood);
  // A swamp-shawl with a torn, ragged edge, and the spindle behind her.
  c.line(54, 10, 48, 60, C.brown, 2);
  c.ellipse(54, 10, 3, 3, C.bone);
  c.rect(10, 52, 44, 12, C.moss);
  for (let x = 10; x < 54; x += 3) c.rect(x, 52 + 8 + Math.floor(r() * 5), 3, 6, C.pine);
  for (let i = 0; i < 40; i++) c.set(10 + r() * 44, 52 + r() * 12, r() < 0.5 ? C.pine : C.grass);
  for (let x = 10; x < 54; x += 3) {
    const cut = Math.floor(r() * 5);
    c.rect(x, 60 + cut, 3, 4 - cut, null);
  }
};

/** Nix: a dark river horse in profile (facing left), a streaming mane, glowing cyan eyes. */
export const nix = (c: Canvas): void => {
  const r = seedRolls('nix');
  // The mane, behind the head and falling in wet strands.
  c.polygon(
    [
      [36, 6],
      [52, 8],
      [58, 26],
      [56, 46],
      [58, 62],
      [44, 62],
      [46, 44],
      [40, 28],
    ],
    C.night,
  );
  for (let i = 0; i < 90; i++) {
    const x = 38 + r() * 20;
    const y = 8 + r() * 54;
    if (c.get(x, y) === C.night) {
      const q = r();
      c.set(x, y, q < 0.35 ? C.cyan : q < 0.65 ? C.blue : q < 0.75 ? C.ice : C.night);
    }
  }
  // Drips off the end of the mane.
  for (const x of [46, 50, 54, 57]) c.rect(x, 58 + Math.floor(r() * 3), 1, 4, C.ice);
  // The head: long, narrow, dark, lit along the bridge.
  c.polygon(
    [
      [30, 11],
      [42, 13],
      [47, 26],
      [45, 40],
      [36, 47],
      [24, 50],
      [13, 47],
      [10, 39],
      [17, 31],
      [23, 19],
    ],
    (x, y) => (x > 41 ? C.plum : y > 41 ? C.violet : x < 22 && y > 34 ? C.slate : C.dusk),
  );
  c.polygon(
    [
      [30, 12],
      [35, 13],
      [24, 24],
      [17, 33],
      [11, 40],
      [11, 38],
      [17, 31],
      [23, 19],
    ],
    C.dusk,
  );
  // Two pricked ears.
  c.polygon(
    [
      [33, 12],
      [36, 1],
      [40, 13],
    ],
    C.slate,
  );
  c.polygon(
    [
      [39, 13],
      [44, 3],
      [45, 17],
    ],
    C.violet,
  );
  // The eye, glowing cyan, and a nostril, a mouth line, a drop on the chin.
  c.rect(28, 22, 4, 3, C.cyan);
  c.set(29, 23, C.frost);
  c.set(27, 22, C.ice);
  c.rect(13, 42, 2, 2, C.ink);
  c.line(12, 47, 24, 49, C.ink, 1);
  c.rect(18, 52, 1, 3, C.ice);
  c.rect(15, 56, 1, 2, C.ice);
  // A frill of water-weed under the jaw.
  for (let x = 28; x < 46; x += 3) c.rect(x, 47 + (x % 2), 2, 4, C.pine);
};

/** Poludnitsa: the noon sun behind a white veil, a deep brow shadow, hollow eyes, a sickle. */
export const poludnitsa = (c: Canvas): void => {
  c.ellipse(CX, 24, 26, 26, C.orange);
  c.ellipse(CX, 24, 21, 21, C.gold);
  c.ellipse(CX, 24, 15, 15, C.cream);
  for (let a = 0; a < 16; a++) {
    const x = CX + Math.round(Math.cos((a * Math.PI) / 8) * 29);
    const y = 24 + Math.round(Math.sin((a * Math.PI) / 8) * 29);
    c.line(
      CX + Math.round(Math.cos((a * Math.PI) / 8) * 24),
      24 + Math.round(Math.sin((a * Math.PI) / 8) * 24),
      x,
      y,
      C.gold,
      1,
    );
  }
  // The veil and the pale, sun-bleached face.
  c.ellipse(CX, 32, 16, 28, C.frost);
  c.rect(CX - 15, 44, 30, 20, C.frost);
  c.mirrored((set) => {
    for (let j = 0; j < 20; j++) set(CX - 15 - (j % 5 === 0 ? 1 : 0), 44 + j, C.bone);
  });
  c.ellipse(CX, 28, 10, 13, C.cream);
  // The noon shadow under the brow: a dark hollow around each eye, deep and bare, a stare with a glint.
  c.rect(CX - 10, 22, 20, 1, C.sand);
  c.mirrored((set) => {
    for (let j = 0; j < 7; j++)
      for (let i = 0; i < 9; i++) {
        const dx = i - 4;
        const dy = j - 3;
        if (dx * dx * 0.6 + dy * dy <= 11)
          set(CX - 11 + i, 23 + j, j < 2 ? C.rust : j < 5 ? C.brown : C.rust);
      }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) set(CX - 9 + i, 25 + j, C.ink);
    set(CX - 8, 26, C.frost);
  });
  c.rect(CX - 1, 31, 2, 4, C.sand);
  c.rect(CX - 3, 37, 6, 1, C.rust);
  // Wheat on the left.
  for (const x of [6, 12]) {
    c.line(x, 63, x, 40, C.sand, 1);
    for (let j = 0; j < 6; j++) c.set(x + (j % 2 ? 1 : -1), 40 + j * 2, C.gold);
  }
  // The curved blade of a harvesting sickle held in front, handle low on the right.
  for (let a = -75; a <= 105; a += 2) {
    const rad = (a * Math.PI) / 180;
    const x = 46 + Math.cos(rad) * 15;
    const y = 46 + Math.sin(rad) * 16;
    const k = a > 60 ? 2 : 4;
    for (let t = 0; t < k; t++)
      c.set(x - t, y, t === 0 ? C.frost : t === 1 ? C.bone : t === 2 ? C.ash : C.stone);
  }
  c.line(46, 62, 56, 63, C.brown, 3);
  c.line(46, 61, 56, 62, C.rust, 1);
};

/** Rusalka: a drowned girl, dark wet river-weed hair, pale shoulders, hollow mournful eyes. */
export const rusalka = (c: Canvas): void => {
  const hair = [C.moss, C.pine, C.ink] as const;
  const r = seedRolls('rusalka');
  // Long, dark, wet hair, plastered over the shoulders.
  c.ellipse(CX, 24, 19, 21, hair[1]);
  c.polygon(
    [
      [13, 26],
      [24, 26],
      [22, 62],
      [8, 62],
    ],
    hair[1],
  );
  c.polygon(
    [
      [40, 26],
      [51, 26],
      [56, 62],
      [42, 62],
    ],
    hair[1],
  );
  for (let i = 0; i < 140; i++) {
    const x = 8 + r() * 48;
    const y = 6 + r() * 56;
    if (c.get(x, y) === hair[1]) c.set(x, y, r() < 0.4 ? hair[0] : hair[2]);
  }
  // Pale drowned shoulders and neck.
  c.ellipse(CX, 66, 22, 12, (x, y) => (y < 54 ? null : x < 30 ? C.bone : C.ash));
  c.rect(CX - 5, 42, 10, 12, C.bone);
  // The face: blue-white, hollow.
  c.ellipse(CX, 29, 11, 14, (x, y) => (y > 38 ? C.bone : x < 29 ? C.frost : C.bone));
  c.rect(CX - 11, 15, 22, 5, hair[1]);
  c.set(CX - 6, 20, hair[2]);
  c.set(CX + 6, 20, hair[2]);
  // Hollow, mournful eyes: dark sockets that droop at the outer corners, a dim glint, wet tracks.
  c.mirrored((set) => {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) set(CX - 9 + i, 25 + j + (i < 1 ? 1 : 0), C.night);
    set(CX - 7, 26, C.cyan);
    set(CX - 9, 30, C.cyan);
    set(CX - 9, 31, C.cyan);
    set(CX - 8, 33, C.cyan);
  });
  c.rect(CX - 2, 31, 2, 3, C.dusk);
  c.rect(CX - 3, 38, 6, 1, C.dusk);
  c.rect(CX - 2, 39, 4, 1, C.slate);
  // Drops, and reeds in the foreground.
  c.mirrored((set) => {
    set(CX - 15, 44, C.cyan);
    set(CX - 17, 52, C.ice);
  });
  c.line(4, 62, 6, 36, C.moss, 2);
  c.line(59, 62, 57, 40, C.moss, 2);
  c.rect(4, 30, 3, 8, C.brown);
  c.rect(56, 34, 3, 8, C.brown);
};

/** Strzyga: a gaunt undead woman, dark matted hair, sunken cheeks, feral fangs. */
export const strzyga = (c: Canvas): void => {
  const r = seedRolls('strzyga');
  // Dark matted hair, hanging in rough clumps.
  c.ellipse(CX, 26, 22, 22, C.ink);
  c.polygon(
    [
      [10, 28],
      [22, 28],
      [18, 62],
      [6, 62],
    ],
    C.ink,
  );
  c.polygon(
    [
      [42, 28],
      [54, 28],
      [58, 62],
      [46, 62],
    ],
    C.ink,
  );
  for (let i = 0; i < 160; i++) {
    const x = 6 + r() * 52;
    const y = 4 + r() * 58;
    if (c.get(x, y) === C.ink) c.set(x, y, r() < 0.6 ? C.coal : C.violet);
  }
  // A gaunt face: grey, with deep cheek hollows and a bare skull-brow.
  c.ellipse(CX, 31, 15, 20, (x, y) => (y > 44 ? C.stone : x < 28 ? C.ash : C.stone));
  c.rect(CX - 14, 13, 28, 5, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 9; j++)
      for (let i = 0; i < 4 - Math.floor(j / 3); i++)
        set(CX - 11 + i + Math.floor(j / 2), 33 + j, C.coal);
  });
  c.mirrored((set) => {
    set(CX - 10, 31, C.bone);
    set(CX - 9, 30, C.bone);
  });
  // Sunken gold eyes in dark sockets, two pupils each: two souls.
  c.mirrored((set) => {
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) set(CX - 5 - i, 24 + j, C.ink);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) set(CX - 6 - i, 26 + j, C.gold);
    set(CX - 7, 26, C.ink);
    set(CX - 9, 26, C.ink);
  });
  c.mirrored((set) => {
    set(CX - 2, 33, C.coal);
    set(CX - 2, 34, C.coal);
    set(CX - 3, 36, C.coal);
  });
  // A wide, ragged mouth: two long fangs above, two below, the rest gaps.
  c.rect(CX - 8, 42, 16, 4, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 7; j++) set(CX - 6, 42 + j, C.bone);
    for (let j = 0; j < 4; j++) set(CX - 3, 42 + j, C.bone);
    for (let j = 0; j < 3; j++) set(CX - 5, 45 - j, C.frost);
  });
  c.set(CX - 1, 45, C.bone);
  c.set(CX + 1, 45, C.bone);
  c.rect(CX - 1, 46, 2, 2, C.blood);
  // The dark gown at the throat.
  c.rect(14, 54, 36, 10, C.plum);
  c.rect(CX - 7, 49, 14, 6, C.stone);
  c.mirrored((set) => {
    set(CX - 18, 58, C.violet);
    set(CX - 12, 60, C.violet);
  });
};

/** Vodyanoy: a bloated, sinister old man of the river, sunken yellow eyes, weed beard, reed whiskers. */
export const vodyanoy = (c: Canvas): void => {
  const skin = [C.grass, C.moss, C.pine] as const;
  const r = seedRolls('vodyanoy');
  // The beard of water-weed first, so the face sits over its top.
  for (let i = 0; i < 26; i++) {
    const x = 14 + i * 1.4;
    c.line(
      x,
      40,
      x + (r() - 0.5) * 6,
      56 + r() * 8,
      i % 6 === 0 ? C.lime : i % 2 ? C.moss : C.pine,
      2,
    );
  }
  // A great, swollen round head, drowned-green, lit from the left.
  c.ellipse(CX, 28, 19, 20, (x, y) =>
    y > 40 ? skin[2] : x < 24 ? skin[0] : x > 40 ? skin[2] : skin[1],
  );
  // Long thin hair of weed down each side, bushy brows, wrinkles: an old man.
  for (const sd of [-1, 1]) {
    c.polygon(
      [
        [CX + sd * 18, 20],
        [CX + sd * 22, 24],
        [CX + sd * 24, 50],
        [CX + sd * 18, 46],
      ],
      (x, y) => ((x + y) % 4 === 0 ? C.moss : C.pine),
    );
  }
  // A bald, spotted crown with a lily pad and weed.
  c.ellipse(CX, 11, 11, 3, C.moss);
  c.ellipse(CX, 10, 11, 3, (x) => (x < 30 ? C.grass : C.moss));
  c.set(CX + 4, 9, C.pine);
  for (let i = 0; i < 18; i++) c.set(14 + r() * 36, 14 + r() * 10, r() < 0.5 ? C.pine : C.grass);
  // Heavy sunken eyes: dark bags, a small hard yellow glint, a brow that droops.
  c.mirrored((set) => {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) set(CX - 4 - i, 22 + j, C.pine);
    for (let i = 0; i < 5; i++) set(CX - 5 - i, 28, C.ink);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) set(CX - 6 - i, 24 + j, C.gold);
    set(CX - 7, 24, C.ink);
    for (let i = 0; i < 10; i++) set(CX - 3 - i, 21 + Math.floor(i / 4), C.pine);
  });
  for (let j = 0; j < 3; j++) c.rect(CX - 7, 15 + j * 2, 14, 1, C.moss);
  c.mirrored((set) => {
    for (let i = 0; i < 9; i++) set(CX - 4 - i, 20 - Math.floor(i / 4), i % 2 ? C.bone : C.ash);
    for (let j = 0; j < 4; j++) set(CX - 13, 30 + j, C.pine);
  });
  // A heavy bulbous nose and a wide, thin, sinister grin with a few blunt teeth.
  c.ellipse(CX, 34, 4, 4, C.moss);
  c.ellipse(CX - 1, 33, 3, 3, C.grass);
  c.set(CX - 2, 36, C.pine);
  c.set(CX + 2, 36, C.pine);
  c.rect(CX - 12, 41, 24, 2, C.ink);
  c.mirrored((set) => {
    set(CX - 13, 40, C.ink);
    set(CX - 14, 39, C.ink);
  });
  for (const x of [CX - 9, CX - 4, CX + 2, CX + 7]) c.rect(x, 43, 2, 2, C.bone);
  // Reed whiskers sticking out from the cheeks.
  for (const s of [-1, 1])
    for (let k = 0; k < 3; k++) {
      c.line(CX + s * 17, 36 + k * 3, CX + s * 29, 32 + k * 5, C.sand, 1);
      c.set(CX + s * 29, 32 + k * 5, C.brown);
    }
  // Water dripping off him.
  c.mirrored((set) => {
    set(CX - 22, 8, C.cyan);
    set(CX - 24, 14, C.ice);
  });
};
