// GDD §5.1.5 and §9.21 (v1.1, D504, S7): the Hold grid's count-building plots (three densities each:
// 1–4 owned a single structure, 5–14 a pair, 15 or more a cluster; the Silver Seam two) and the grid
// versions of the four hold cosmetics. 32 px unless noted, drawn in code in the palette, ground left clear.
import { C, Canvas } from './pixel';

export const PLOT_BUILDINGS = ['cottage', 'farm', 'woodcutter', 'mine', 'herb-garden'] as const;
export type PlotBuilding = (typeof PLOT_BUILDINGS)[number];
export type Density = 1 | 2 | 3;
export const DENSITIES: readonly Density[] = [1, 2, 3];

/** Where the structures of a plot stand: one in the middle, two on a diagonal, four in a cluster. */
const SPOTS: Record<Density, readonly (readonly [number, number])[]> = {
  1: [[16, 18]],
  2: [
    [10, 14],
    [22, 22],
  ],
  3: [
    [9, 12],
    [23, 12],
    [9, 24],
    [23, 24],
  ],
};

type Part = (c: Canvas, cx: number, cy: number, size: number) => void;

const cottage: Part = (c, cx, cy, s) => {
  const w = s === 1 ? 7 : 5;
  c.rect(cx - w, cy - 2, w * 2, 8, C.cream);
  c.rect(cx - w, cy + 5, w * 2, 1, C.sand);
  c.polygon(
    [
      [cx, cy - 8 + (s === 1 ? 0 : 2)],
      [cx + w + 1, cy - 2],
      [cx - w - 1, cy - 2],
    ],
    (x) => (x < cx ? C.orange : C.red),
  );
  c.rect(cx - 1, cy + 2, 2, 4, C.brownDark);
};

const field: Part = (c, cx, cy, s) => {
  const w = s === 1 ? 9 : s === 2 ? 6 : 5;
  c.rect(cx - w, cy - 5, w * 2, 11, C.brown);
  for (let x = cx - w + 1; x < cx + w; x += 3) {
    c.rect(x, cy - 4, 1, 9, C.rust);
    c.set(x, cy - 3, C.lime);
    c.set(x, cy, C.grass);
    c.set(x, cy + 3, C.lime);
  }
  if (s === 1) {
    c.rect(cx, cy - 8, 1, 6, C.brownDark); // a scarecrow
    c.rect(cx - 2, cy - 7, 5, 1, C.brownDark);
    c.set(cx, cy - 9, C.sand);
  }
};

const camp: Part = (c, cx, cy, s) => {
  c.rect(cx - 5, cy + 2, 10, 3, C.brown); // a log
  c.rect(cx - 5, cy + 2, 10, 1, C.rust);
  c.rect(cx + 4, cy + 2, 1, 3, C.sand);
  c.rect(cx - 3, cy - 3, 5, 5, C.brownDark); // a stump
  c.rect(cx - 3, cy - 3, 5, 1, C.sand);
  if (s !== 3) c.rect(cx + 3, cy - 6, 1, 7, C.ash); // an axe
};

const pit: Part = (c, cx, cy, s) => {
  c.rect(cx - 6, cy - 2, 12, 9, C.coal);
  c.rect(cx - 4, cy, 8, 7, C.ink);
  c.rect(cx - 6, cy - 4, 12, 2, C.brownDark);
  c.rect(cx - 6, cy - 4, 2, 11, C.brown);
  c.rect(cx + 4, cy - 4, 2, 11, C.brown);
  if (s === 1) c.set(cx + 2, cy + 5, C.gold); // a glint of ore
  c.rect(cx - 7, cy + 7, 14, 1, C.stone);
};

const bed: Part = (c, cx, cy, s) => {
  const w = s === 1 ? 8 : 5;
  c.rect(cx - w, cy - 4, w * 2, 9, C.brownDark);
  c.rect(cx - w + 1, cy - 3, w * 2 - 2, 7, C.brown);
  for (let x = cx - w + 2; x < cx + w - 1; x += 3) {
    c.set(x, cy - 2, C.grass);
    c.set(x, cy - 1, C.moss);
    c.set(x + 1, cy + 1, C.orchid);
    c.set(x + 1, cy + 2, C.moss);
  }
  c.set(cx, cy, C.pink);
};

const PART: Record<PlotBuilding, Part> = {
  cottage,
  farm: field,
  woodcutter: camp,
  mine: pit,
  'herb-garden': bed,
};

/** TL.6a: one fenced field of ripe barley with a haystack, so a rich farm is not a grid of boxes. */
const richField = (): Canvas => {
  const c = new Canvas(32);
  c.rect(3, 9, 26, 20, C.brownDark);
  c.rect(4, 10, 24, 18, C.sand);
  for (let x = 5; x < 27; x += 2) {
    c.rect(x, 12, 1, 14, x % 4 === 1 ? C.gold : C.orange);
    c.set(x, 11, C.cream);
    c.set(x, 14, C.cream);
    c.set(x, 19, C.cream);
  }
  for (let x = 3; x < 30; x += 5) {
    c.rect(x, 7, 2, 4, C.brown); // fence posts along the top
    c.rect(x, 27, 2, 3, C.brown);
  }
  c.rect(3, 9, 26, 1, C.brown);
  c.rect(3, 28, 26, 1, C.brown);
  c.ellipse(23, 21, 5, 4, C.clay); // a haystack
  c.rect(18, 22, 11, 3, C.sand);
  c.rect(20, 18, 6, 1, C.cream);
  c.set(23, 16, C.sand);
  c.outline(C.wine);
  return c;
};

/** TL.6a: raised plank planters crowded with herbs, white, purple and blue in bloom. */
const lushBeds = (): Canvas => {
  const c = new Canvas(32);
  for (const y of [5, 18]) {
    c.rect(3, y, 26, 10, C.brown);
    c.rect(3, y + 9, 26, 1, C.brownDark);
    c.rect(3, y, 26, 1, C.rust);
    c.rect(4, y + 1, 24, 7, C.moss);
    for (let x = 4; x < 28; x += 2) {
      c.set(x, y + 2 + (x % 4 === 0 ? 0 : 1), C.grass);
      c.set(x + 1, y + 4, C.lime);
      c.set(x, y + 6, C.pine);
    }
    const bloom = [C.frost, C.orchid, C.cyan, C.frost, C.pink, C.orchid] as const;
    for (let i = 0; i < 6; i++) {
      c.set(5 + i * 4, y + 3 + (i % 2), bloom[i] ?? C.frost);
      c.set(6 + i * 4, y + 6 - (i % 2), bloom[(i + 2) % 6] ?? C.frost);
    }
    for (const x of [3, 27]) c.rect(x, y, 2, 10, C.brownDark); // corner posts
  }
  c.outline(C.wine);
  return c;
};

export const drawPlot = (b: PlotBuilding, d: Density): Canvas => {
  if (d === 3 && b === 'farm') return richField();
  if (d === 3 && b === 'herb-garden') return lushBeds();
  const c = new Canvas(32);
  const spots = SPOTS[d];
  const size = d === 1 ? 1 : d === 2 ? 2 : 3;
  for (const [x, y] of spots) PART[b](c, x, y, size);
  // A cluster shows one larger piece in the middle.
  if (d === 3 && b === 'woodcutter') c.rect(13, 14, 6, 4, C.brownDark);
  if (d === 3 && b === 'mine') c.rect(14, 14, 4, 4, C.ash);
  c.outline(C.wine);
  return c;
};

export const SEAM_LOOKS = [1, 2] as const;
/** A Silver Seam: a rock outcrop shot through with silver; one seam, then twin seams. */
export const drawSeam = (look: 1 | 2): Canvas => {
  const c = new Canvas(32);
  const rock = (cx: number, cy: number, rx: number, ry: number): void => {
    c.ellipse(cx, cy, rx, ry, (x, y) =>
      y < cy - ry / 2 ? C.ash : x > cx + rx / 3 ? C.coal : C.stone,
    );
    for (let k = 0; k < 4; k++) {
      c.set(cx - 3 + k * 2, cy - 2 + (k % 2) * 3, C.frost);
      c.set(cx - 2 + k * 2, cy - 1 + (k % 2) * 3, C.ice);
    }
  };
  if (look === 1) rock(16, 19, 9, 7);
  else {
    rock(10, 16, 7, 6);
    rock(22, 23, 7, 6);
  }
  c.outline(C.wine);
  return c;
};

/** Gatehouse banners: two banners hang from the Lowland Gate's posts (256 × 16, over `grid.strip.south`). */
export const drawBanners = (): Canvas => {
  const c = new Canvas(256);
  const mid = 128;
  for (const x of [mid - 17, mid + 14]) {
    c.rect(x - 1, 7, 5, 8, C.red);
    c.rect(x - 1, 14, 2, 1, C.blood);
    c.rect(x + 2, 14, 2, 1, C.blood);
    c.rect(x - 1, 7, 5, 1, C.blood);
    c.set(x + 1, 10, C.gold);
    c.set(x + 1, 11, C.gold);
  }
  return c;
};

/** The Watchtower bell, hung from a bracket on the platform (32 px, over `grid.watchtower`). */
export const drawTowerBell = (): Canvas => {
  const c = new Canvas(32);
  // TL.6a: hung higher, above the east wall wing the Watchtower now has.
  c.rect(25, 3, 4, 1, C.brownDark);
  c.rect(26, 4, 2, 1, C.brownDark);
  c.polygon(
    [
      [26.5, 5],
      [29, 9],
      [24, 9],
    ],
    C.gold,
  );
  c.rect(24, 9, 5, 1, C.orange);
  c.set(26, 10, C.cream);
  return c;
};

/** The bell on a border post, before Watchtower 1 stands (32 px). */
export const drawBorderBell = (): Canvas => {
  const c = new Canvas(32);
  c.rect(15, 8, 2, 22, C.brownDark);
  c.rect(11, 8, 10, 2, C.brown);
  c.polygon(
    [
      [16, 11],
      [20, 17],
      [12, 17],
    ],
    C.gold,
  );
  c.rect(12, 17, 9, 1, C.orange);
  c.set(16, 19, C.cream);
  c.outline(C.wine);
  return c;
};

/** A lantern on a wall segment's post (32 px, over any `grid.wall.<mask>`). */
export const drawWallLantern = (): Canvas => {
  const c = new Canvas(32);
  c.rect(15, 9, 2, 1, C.brownDark);
  c.rect(14, 10, 4, 4, C.gold);
  c.rect(15, 10, 2, 4, C.orange);
  c.set(14, 10, C.cream);
  c.rect(14, 14, 4, 1, C.brownDark);
  return c;
};

/** Lanterns along the Fell Breach's foot, before any wall stands (256 × 16, over `grid.strip.north`). */
export const drawBorderLanterns = (): Canvas => {
  const c = new Canvas(256);
  for (let x = 16; x < 256; x += 32) {
    c.rect(x, 9, 1, 3, C.brownDark);
    c.rect(x - 1, 12, 3, 3, C.gold);
    c.set(x, 13, C.orange);
    c.set(x - 1, 12, C.cream);
  }
  return c;
};

/** Act VI frost on a wall segment's post, the one place every connection mask shares (32 px). */
export const drawWallFrost = (): Canvas => {
  const c = new Canvas(32);
  c.rect(12, 11, 8, 1, C.frost);
  for (const x of [12, 15, 18]) c.set(x, 12, C.ice);
  c.rect(11, 22, 10, 1, C.frost);
  for (const x of [12, 14, 17, 19]) c.set(x, 23, C.ice);
  return c;
};
