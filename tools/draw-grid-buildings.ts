// GDD §5.1.5 and §9.21 (v1.1, D504): the Hold grid's level buildings, three looks each (Tier I to
// III), and the Trophy Hall. 32 px, drawn in code in the palette, with the ground left clear so the
// tile under them shows. Each tier is larger or richer than the last, and never smaller.
import { C, Canvas } from './pixel';
import { drawBarracks, drawSawpit } from './draw-grid-yard';
import { BLUE, RED, SLATE, STRAW, chimney, door, roof, wall, window } from './draw-grid-kit';

export const LEVEL_BUILDINGS = [
  'mill',
  'sawpit',
  'smithy',
  'bell-tower',
  'barracks',
  'lodge',
  'alchemist',
] as const;
export type LevelBuilding = (typeof LEVEL_BUILDINGS)[number];
export type Tier = 1 | 2 | 3;
export const TIERS: readonly Tier[] = [1, 2, 3];

const drawMill = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const h = 10 + t * 3;
  wall(c, 12, 30 - h, 9, h, t === 3 ? C.stone : C.cream, t === 3 ? C.slate : C.sand);
  roof(c, 11, 30 - h - 5, 11, 5, t === 1 ? STRAW : RED);
  door(c, 15, 25);
  const cx = 16;
  const cy = 30 - h - 1;
  const arm = 5 + t * 2;
  if (t === 1) {
    // TL.6a: four long wooden blades in an X, clear of the tower, not stubs.
    for (const [dx, dy] of [
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ] as const)
      for (let k = 2; k <= 9; k++) {
        c.set(cx + dx * k, cy + dy * k, k > 5 ? C.bone : C.brown);
        if (k > 5) c.set(cx + dx * k + dx, cy + dy * k, C.cream);
      }
  } else
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const)
      for (let k = 3; k <= arm; k++)
        c.set(cx + dx * k, cy + dy * k, k > arm - 3 ? C.bone : C.brown);
  if (t >= 2)
    for (const [dx, dy] of [
      [1, 1],
      [-1, -1],
    ] as const)
      for (let k = 3; k <= arm - 2; k++) c.set(cx + dx * k, cy + dy * k, C.brown);
  c.rect(cx - 1, cy - 1, 3, 3, C.brownDark);
  if (t === 3) {
    wall(c, 3, 24, 8, 6, C.stone, C.slate); // a store shed
    roof(c, 2, 20, 10, 4, RED);
  }
  c.outline(C.wine);
  return c;
};

const drawSmithy = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const w = 14 + t * 3;
  const x = Math.floor((32 - w) / 2);
  wall(c, x, 16, w, 14, t === 1 ? C.brown : C.stone, t === 1 ? C.brownDark : C.slate);
  roof(c, x - 1, 9, w + 2, 7, t === 1 ? STRAW : SLATE);
  chimney(c, x + w - 6, 3, 8, true);
  if (t === 3) chimney(c, x + 3, 5, 6, false);
  door(c, x + 3, 23, 5, 7);
  c.rect(x + w - 8, 22, 5, 3, C.ink); // the forge mouth, lit
  c.rect(x + w - 7, 23, 3, 2, t === 3 ? C.gold : C.orange);
  c.rect(x + w - 9, 26, 7, 2, C.coal); // anvil
  c.rect(x + w - 8, 25, 5, 1, C.ash);
  c.outline(C.wine);
  return c;
};

const drawBellTower = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const h = 8 + t * 5;
  const wood = t === 1;
  wall(c, 12, 30 - h, 9, h, wood ? C.brown : C.stone, wood ? C.brownDark : C.slate);
  c.rect(11, 30 - h - 2, 11, 2, wood ? C.brownDark : C.coal);
  c.rect(14, 30 - h + 2, 5, 5, C.ink); // belfry opening
  c.rect(15, 30 - h + 3, 3, 3, C.gold); // the bell
  c.set(16, 30 - h + 6, C.cream);
  roof(c, 10, 30 - h - 7, 13, 5, t === 3 ? BLUE : RED);
  c.set(16, 30 - h - 9, C.gold);
  c.set(16, 30 - h - 8, C.gold);
  door(c, 15, 25, 3, 5);
  if (t === 3) c.rect(13, 20, 7, 1, C.coal);
  c.outline(C.wine);
  return c;
};

const drawLodge = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const w = 14 + t * 4;
  const x = Math.floor((32 - w) / 2);
  wall(c, x, 15, w, 15, C.brown, C.brownDark);
  for (let y = 17; y < 30; y += 3) c.rect(x, y, w, 1, C.brownDark); // log courses
  roof(c, x - 1, 8, w + 2, 7, t === 1 ? STRAW : t === 2 ? RED : SLATE);
  door(c, x + Math.floor(w / 2) - 2, 22, 4, 8);
  // Antlers over the door.
  const ax = x + Math.floor(w / 2);
  for (const d of [-1, 1] as const) {
    c.set(ax + d, 18, C.bone);
    c.set(ax + d * 2, 17, C.bone);
    c.set(ax + d * 3, 16, C.bone);
    if (t >= 2) c.set(ax + d * 2, 15, C.bone);
  }
  if (t === 3) {
    window(c, x + 2, 21, true);
    window(c, x + w - 5, 21, true);
  }
  c.outline(C.wine);
  return c;
};

const drawAlchemist = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const w = 12 + t * 2;
  const x = Math.floor((32 - w) / 2) - 3;
  wall(c, x, 17, w, 13, C.dusk, C.violet);
  roof(c, x - 1, 10, w + 2, 7, { top: C.orchid, shade: C.plum });
  door(c, x + 2, 24, 4, 6);
  window(c, x + w - 5, 21, t >= 2);
  // The kettle: green steam rising.
  c.ellipse(x + w + 5, 26, 4, 3, C.coal);
  c.rect(x + w + 2, 23, 7, 1, C.ash);
  c.set(x + w + 4, 21, C.lime);
  c.set(x + w + 6, 19, C.lime);
  c.set(x + w + 4, 17, C.grass);
  if (t >= 2) {
    c.rect(x + w - 2, 3, 3, 9, C.stone); // a flue
    c.set(x + w - 1, 1, C.lime);
  }
  if (t === 3) {
    // TL.6a: a framed glass lantern housing on the roof ridge, not a floating flask.
    c.rect(x + 2, 5, 7, 6, C.brown);
    c.rect(x + 3, 6, 5, 4, C.cyan);
    c.rect(x + 5, 6, 1, 4, C.brown);
    c.set(x + 3, 6, C.frost);
    c.polygon(
      [
        [x + 5.5, 1],
        [x + 10, 5],
        [x + 1, 5],
      ],
      C.orchid,
    );
  }
  c.outline(C.wine);
  return c;
};

const DRAW: Record<LevelBuilding, (t: Tier) => Canvas> = {
  mill: drawMill,
  sawpit: drawSawpit,
  smithy: drawSmithy,
  'bell-tower': drawBellTower,
  barracks: drawBarracks,
  lodge: drawLodge,
  alchemist: drawAlchemist,
};

export const drawLevelBuilding = (id: LevelBuilding, tier: Tier): Canvas => DRAW[id](tier);

/** The Trophy Hall: a stone hall with a mounted skull over the door and a banner. */
export const drawTrophyHall = (): Canvas => {
  const c = new Canvas(32);
  wall(c, 5, 14, 22, 16, C.stone, C.slate);
  for (let y = 18; y < 30; y += 4) c.rect(5, y, 22, 1, C.slate);
  roof(c, 4, 7, 24, 7, BLUE);
  door(c, 14, 22, 5, 8);
  c.ellipse(16, 19, 3, 2, C.bone); // the skull
  c.rect(15, 21, 3, 1, C.bone);
  c.set(15, 19, C.ink);
  c.set(17, 19, C.ink);
  for (const x of [7, 22]) {
    c.rect(x, 16, 3, 9, C.red);
    c.set(x + 1, 25, C.red);
    c.set(x + 1, 18, C.gold);
  }
  c.outline(C.wine);
  return c;
};
