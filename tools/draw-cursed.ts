// Plan T5.13 (technical design §12.3): the portraits of the four Cursed of the ruins
// (GDD §8.3), the same method as draw-monster.ts: small shapes in palette colors,
// deterministic, committed as PNGs. The family backdrop (ink, wine, rust) is drawn by
// drawMonster; each function here draws one creature on top of it.

import { C, Canvas, seedRolls } from './pixel';

const CX = 32;

/** Gloam-moths: a dark lantern the swarm has eaten the light out of, moths all round it. */
export const gloamMoths = (c: Canvas): void => {
  const r = seedRolls('gloam-moths');
  // The lantern: iron cap and ring, dark glass in a cage, a dead wick.
  c.rect(30, 12, 4, 5, C.coal);
  c.rect(24, 17, 16, 3, C.stone);
  c.rect(25, 20, 14, 24, C.ink);
  c.rect(27, 21, 10, 22, C.coal);
  for (const x of [26, 31, 37]) c.line(x, 20, x, 43, C.stone, 1);
  c.rect(31, 33, 2, 6, C.ink);
  c.rect(24, 44, 16, 3, C.stone);
  // The moths: pale wings, a dark body, a bright dot for an eye. Kept clear of the lantern.
  const moth = (x: number, y: number, big: boolean): void => {
    const w = big ? 3 : 2;
    c.ellipse(x - w, y, w, 1.8, C.bone);
    c.ellipse(x + w, y, w, 1.8, C.bone);
    c.ellipse(x - w, y + 1, w - 0.6, 1.2, C.ash);
    c.ellipse(x + w, y + 1, w - 0.6, 1.2, C.ash);
    c.rect(x, y - 1, 1, 3, C.ink);
    c.set(x, y - 1, C.gold);
  };
  let placed = 0;
  for (let tries = 0; placed < 15 && tries < 400; tries++) {
    const x = 8 + r() * 48;
    const y = 8 + r() * 48;
    const nearLantern = x > 18 && x < 46 && y > 8 && y < 50;
    const insideBackdrop = ((x - CX) / 27) ** 2 + ((y - 32) / 28) ** 2 < 1;
    if (nearLantern || !insideBackdrop) continue;
    moth(x, y, placed % 3 === 0);
    placed++;
  }
  // A few more drifting over the glass, thin and grey.
  for (const [x, y] of [
    [32, 26],
    [29, 38],
    [36, 40],
  ] as const) {
    c.set(x - 1, y, C.ash);
    c.set(x + 1, y, C.ash);
    c.set(x, y, C.ink);
  }
};

/** Ribbonshade: a thin pale shape standing in a forge doorway, a blue ribbon at its wrist. */
export const ribbonshade = (c: Canvas): void => {
  // v1.0 (TV.8a): a hunched, sorrowful wraith in ash-dark cloth, the hooded shade of its sprite.
  c.polygon(
    [
      [32, 6],
      [41, 9],
      [45, 19],
      [53, 32],
      [57, 48],
      [60, 63],
      [4, 63],
      [7, 48],
      [11, 32],
      [19, 19],
      [23, 9],
    ],
    (x, y) => (x < 18 || y < 14 ? C.violet : x > 46 ? C.ink : C.plum),
  );
  c.polygon(
    [
      [32, 12],
      [38, 15],
      [42, 24],
      [48, 36],
      [52, 52],
      [12, 52],
      [16, 36],
      [22, 24],
      [26, 15],
    ],
    (x) => (x > 40 ? C.ink : C.plum),
  );
  // The bowed head: a pale, blank, narrow mask, tipped forward, with sad hollow eyes.
  c.ellipse(CX, 26, 8, 11, (x) => (x > 35 ? C.ash : C.bone));
  c.rect(26, 24, 4, 4, C.ink);
  c.rect(34, 24, 4, 4, C.ink);
  c.set(26, 28, C.ink);
  c.set(37, 28, C.ink);
  c.set(28, 26, C.orange);
  c.set(35, 26, C.orange);
  c.rect(28, 34, 1, 5, C.ash);
  c.rect(35, 34, 1, 4, C.ash);
  // Heavy sloped shoulders and two long arms ending in singed hands at the middle.
  c.polygon(
    [
      [19, 38],
      [26, 36],
      [26, 56],
      [22, 58],
    ],
    C.stone,
  );
  c.polygon(
    [
      [45, 38],
      [38, 36],
      [38, 56],
      [42, 58],
    ],
    C.coal,
  );
  c.rect(22, 56, 6, 6, C.ash);
  c.rect(36, 56, 6, 6, C.stone);
  for (const [x, y] of [
    [22, 62],
    [24, 63],
    [27, 62],
    [37, 63],
    [39, 62],
    [41, 63],
  ] as const)
    c.set(x, y, C.orange);
  for (const [x, y] of [
    [24, 62],
    [40, 62],
  ] as const)
    c.set(x, y, C.gold);
  // Embers along the hood's edge.
  for (const [x, y] of [
    [23, 12],
    [41, 12],
    [10, 36],
    [54, 36],
  ] as const)
    c.set(x, y, C.orange);
  // The blue ribbon at its right wrist, stitched in pale thread, its end hanging.
  c.rect(35, 52, 7, 4, C.blue);
  c.rect(35, 52, 7, 1, C.cyan);
  for (let x = 36; x < 42; x += 2) c.set(x, 54, C.frost);
  c.rect(40, 56, 3, 8, C.blue);
  c.rect(40, 56, 1, 8, C.cyan);
  for (let y = 57; y < 63; y += 2) c.set(41, y, C.frost);
};

/** Anvil-wight: a dead smith's face under a leather cap, over a cold anvil, hammer raised. */
export const anvilWight = (c: Canvas): void => {
  // Iron-hide shoulders, riveted.
  c.ellipse(CX, 60, 26, 14, C.ink);
  c.ellipse(CX, 60, 24.5, 12.5, (x) => (x > 38 ? C.coal : x < 22 ? C.stone : C.slate));
  for (const x of [16, 24, 40, 48]) c.set(x, 52, C.ash);
  // The anvil: face, waist and a horn, in front of the shoulders.
  c.rect(14, 50, 36, 5, C.ink);
  c.rect(15, 50, 34, 3, C.ash);
  c.rect(15, 50, 12, 1, C.frost);
  c.rect(24, 55, 16, 4, C.coal);
  c.rect(20, 59, 24, 4, C.ink);
  c.rect(21, 59, 22, 2, C.stone);
  c.line(14, 51, 8, 53, C.ink, 3);
  // The hammer, raised behind the head on the right.
  c.line(48, 8, 52, 44, C.ink, 4);
  c.line(49, 8, 53, 44, C.brown, 2);
  c.rect(44, 2, 14, 9, C.ink);
  c.rect(45, 3, 12, 7, C.coal);
  c.rect(45, 3, 12, 2, C.stone);
  // The head: gaunt, grey, a dead man's jaw, and a smith's leather cap.
  c.ellipse(CX, 30, 12, 15, (x, y) => (y > 38 ? C.stone : x < 28 ? C.bone : C.ash));
  c.rect(CX - 8, 38, 16, 8, C.coal);
  c.rect(CX - 4, 44, 8, 2, C.ink);
  for (let x = CX - 6; x <= CX + 5; x += 3) c.rect(x, 40, 1, 4, C.bone);
  c.ellipse(CX, 17, 13, 8, C.ink);
  c.ellipse(CX, 17, 11.5, 6.5, C.brownDark);
  c.rect(CX - 13, 20, 26, 3, C.ink);
  c.rect(CX - 12, 20, 24, 2, C.brown);
  // Sockets that still glow like banked coals.
  c.mirrored((set) => {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) set(CX - 8 + i, 26 + j, C.ink);
    set(CX - 7, 27, C.orange);
    set(CX - 6, 28, C.gold);
  });
  c.set(CX - 1, 33, C.coal);
  c.set(CX, 34, C.coal);
  // Sparks off the anvil.
  for (const [x, y] of [
    [18, 46],
    [44, 47],
    [48, 42],
    [12, 44],
  ] as const)
    c.set(x, y, C.gold);
};

/** Rimewrought: iron in the shape of a man twice too tall, rimed white, a cold light in its visor. */
export const rimewrought = (c: Canvas): void => {
  const r = seedRolls('rimewrought');
  // Wide shoulders and a great barrel helm.
  c.ellipse(CX, 62, 30, 16, C.ink);
  c.ellipse(CX, 62, 28.5, 14.5, (x) => (x > 40 ? C.coal : x < 22 ? C.stone : C.slate));
  c.rect(CX - 15, 6, 30, 42, C.ink);
  for (let y = 7; y < 47; y++)
    for (let x = CX - 14; x < CX + 14; x++)
      c.set(x, y, x > CX + 6 ? C.coal : x < CX - 6 ? C.stone : C.slate);
  c.rect(CX - 14, 7, 28, 3, C.ash);
  // Plate seams and rivets.
  c.rect(CX - 14, 26, 28, 1, C.ink);
  c.rect(CX - 14, 38, 28, 1, C.ink);
  c.rect(CX - 1, 7, 2, 19, C.ink);
  for (const x of [CX - 12, CX - 8, CX + 7, CX + 11]) c.set(x, 12, C.ash);
  // The visor slit and the cold light in it.
  c.rect(CX - 11, 18, 22, 5, C.ink);
  c.rect(CX - 9, 19, 18, 3, C.blue);
  c.rect(CX - 7, 20, 14, 1, C.ice);
  // Breath-holes below, and rime hanging off the chin as icicles.
  for (let i = 0; i < 5; i++) c.set(CX - 6 + i * 3, 30, C.ink);
  for (const [x, len] of [
    [CX - 10, 6],
    [CX - 5, 9],
    [CX, 5],
    [CX + 5, 8],
    [CX + 10, 4],
  ] as const) {
    c.line(x, 47, x, 47 + len, C.ice, 1);
    c.set(x, 47 + len, C.frost);
  }
  // Rime: white crust gathered in the seams and on top.
  for (let i = 0; i < 70; i++) {
    const x = CX - 14 + r() * 28;
    const y = 7 + r() * 40;
    if (c.get(x, y) !== C.ink) c.set(x, y, r() < 0.5 ? C.frost : C.ice);
  }
  for (let i = 0; i < 40; i++) c.set(4 + r() * 56, 50 + r() * 12, r() < 0.5 ? C.frost : C.ice);
};
