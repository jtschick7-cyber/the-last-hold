// GDD §5.1.5 and §9.21 (v1.1, D504): the Hold grid's level buildings, three looks each (Tier I to
// III), and the Trophy Hall. 32 px, drawn in code in the palette, with the ground left clear so the
// tile under them shows. Each tier is larger or richer than the last, and never smaller.
import { C, Canvas } from './pixel';

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

type Roof = { top: string; shade: string };
const RED: Roof = { top: C.orange, shade: C.red };
const BLUE: Roof = { top: C.blue, shade: C.night };
const SLATE: Roof = { top: C.slate, shade: C.plum };
const STRAW: Roof = { top: C.gold, shade: C.sand };

/** A wall block with a lit top edge and a shaded foot. */
const wall = (
  c: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  body: string,
  shade: string,
): void => {
  c.rect(x, y, w, h, body);
  c.rect(x, y + h - 1, w, 1, shade);
  c.rect(x + w - 1, y, 1, h, shade);
};

/** A hip roof drawn as stacked rows, narrowing upward, with a lit left half. */
const roof = (c: Canvas, x: number, y: number, w: number, h: number, r: Roof): void => {
  for (let row = 0; row < h; row++) {
    const inset = Math.floor(((h - 1 - row) * 3) / 4) === 0 ? 0 : Math.floor((h - 1 - row) / 2);
    const left = x + inset;
    const width = w - inset * 2;
    c.rect(left, y + row, width, 1, row % 3 === 2 ? r.shade : r.top);
    c.set(left + width - 1, y + row, r.shade);
  }
};

const door = (c: Canvas, x: number, y: number, w = 4, h = 6): void => {
  c.rect(x, y, w, h, C.brownDark);
  c.rect(x, y, w, 1, C.brown);
  c.set(x + w - 2, y + Math.floor(h / 2), C.gold);
};

const chimney = (c: Canvas, x: number, y: number, h: number, smoke: boolean): void => {
  c.rect(x, y, 3, h, C.stone);
  c.rect(x, y, 3, 1, C.ash);
  if (smoke) {
    c.set(x + 1, y - 2, C.ash);
    c.set(x + 2, y - 4, C.bone);
    c.set(x, y - 6, C.ash);
  }
};

const window = (c: Canvas, x: number, y: number, lit = false): void => {
  c.rect(x, y, 3, 3, lit ? C.gold : C.night);
  c.set(x, y, lit ? C.cream : C.blue);
};

const drawMill = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const h = 10 + t * 3;
  wall(c, 12, 30 - h, 9, h, t === 3 ? C.stone : C.cream, t === 3 ? C.slate : C.sand);
  roof(c, 11, 30 - h - 5, 11, 5, t === 1 ? STRAW : RED);
  door(c, 15, 25);
  const cx = 16;
  const cy = 30 - h - 1;
  const arm = 5 + t * 2;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const)
    for (let k = 3; k <= arm; k++) c.set(cx + dx * k, cy + dy * k, k > arm - 3 ? C.bone : C.brown);
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

const drawSawpit = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const logs = (x: number, y: number, n: number): void => {
    for (let i = 0; i < n; i++) {
      c.rect(x, y - i * 3, 12, 3, C.brown);
      c.rect(x, y - i * 3, 12, 1, C.rust);
      c.rect(x + 10, y - i * 3, 2, 3, C.sand);
    }
  };
  logs(3, 29, t === 1 ? 1 : t === 2 ? 2 : 3);
  // The saw frame over a pit.
  c.rect(17, 14, 2, 15, C.brownDark);
  c.rect(27, 14, 2, 15, C.brownDark);
  c.rect(17, 14, 12, 2, C.brown);
  c.rect(19, 18, 8, 1, C.ash); // the blade
  c.rect(19, 24, 8, 4, C.ink);
  if (t >= 2) {
    roof(c, 15, 8, 16, 6, STRAW);
    c.rect(17, 14, 12, 1, C.sand);
  }
  if (t === 3) {
    logs(18, 29, 1);
    c.rect(4, 6, 8, 1, C.stone);
    c.rect(3, 7, 10, 5, C.ash); // a stone grindwheel in front
    c.rect(6, 8, 4, 3, C.stone);
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

const drawBarracks = (t: Tier): Canvas => {
  const c = new Canvas(32);
  const w = 16 + t * 4;
  const x = Math.floor((32 - w) / 2);
  wall(c, x, 15, w, 15, C.cream, C.sand);
  c.rect(x, 15, w, 2, C.brown);
  roof(c, x - 1, 8, w + 2, 7, t === 1 ? RED : BLUE);
  door(c, x + Math.floor(w / 2) - 2, 22, 4, 8);
  window(c, x + 2, 20);
  if (t >= 2) window(c, x + w - 5, 20);
  if (t === 3) {
    c.rect(x + w - 4, 1, 1, 10, C.brownDark); // a banner pole
    c.rect(x + w - 3, 2, 5, 4, C.red);
    c.rect(x + w - 3, 5, 3, 1, C.red);
    c.set(x + w - 1, 3, C.gold);
  }
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
    c.ellipse(x + 3, 6, 3, 3, C.cyan); // a hanging flask
    c.rect(x + 2, 2, 3, 2, C.ice);
    c.set(x + 2, 5, C.frost);
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
