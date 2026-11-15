import { CONNECTION_BITS } from '../src/content/hold-layout';
import { C, Canvas } from './pixel';
import { drawArchedDoor, drawAshlarWall, mixHash } from './grid-v18-kit';

export const WALL_MASKS = Array.from({ length: 16 }, (_, i) => i);

/** Cross-section Y bounds [10..21] shared by horizontal wall runs and Watchtower E/W wings. */
export const WALL_HORIZ_Y0 = 10;
export const WALL_HORIZ_Y1 = 21;
export const WALL_VERT_X0 = 10;
export const WALL_VERT_X1 = 21;

/** Renders a seamless horizontal stone wall span (no end-caps) across x0..x1 at y=10..21. */
export function drawHorizontalWallSpan(c: Canvas, x0: number, x1: number): void {
  for (let x = x0; x <= x1; x++) {
    c.set(x, 10, C.wine);
    c.set(x, 11, x % 4 === 0 ? C.ash : C.bone);
    c.set(x, 12, x % 4 === 0 ? C.stone : C.ash);
    c.set(x, 13, C.ash);
    c.set(x, 14, C.slate);
    // Vertical ashlar masonry front face (y = 15..20)
    const course = 0;
    const blockEdge = (x + course * 3) % 6 === 0;
    const tone = mixHash(Math.floor(x / 6), 1, 811) % 3 === 0 ? C.ash : C.stone;
    c.set(x, 15, blockEdge ? C.slate : tone);
    c.set(x, 16, blockEdge ? C.slate : tone);
    c.set(x, 17, C.slate);
    c.set(x, 18, (x + 3) % 6 === 0 ? C.plum : C.stone);
    c.set(x, 19, C.coal);
    c.set(x, 20, C.plum);
    c.set(x, 21, C.wine);
  }
}

/** Renders a seamless vertical stone wall span across y0..y1 at x=10..21. */
function drawVerticalWallSpan(c: Canvas, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y++) {
    c.set(10, y, C.wine);
    c.set(11, y, y % 4 === 0 ? C.ash : C.bone);
    c.set(12, y, C.ash);
    c.set(13, y, C.stone);
    c.set(14, y, C.stone);
    c.set(15, y, y % 5 === 0 ? C.slate : C.stone);
    c.set(16, y, y % 5 === 0 ? C.slate : C.stone);
    c.set(17, y, C.slate);
    c.set(18, y, y % 4 === 0 ? C.coal : C.slate);
    c.set(19, y, C.coal);
    c.set(20, y, C.plum);
    c.set(21, y, C.wine);
  }
}

/** Draws the central dressed-stone pilaster junction capping/joining open sides cleanly. */
function drawWallCorePilaster(c: Canvas, mask: number): void {
  const hasN = (mask & CONNECTION_BITS.n) !== 0;
  const hasE = (mask & CONNECTION_BITS.e) !== 0;
  const hasS = (mask & CONNECTION_BITS.s) !== 0;
  const hasW = (mask & CONNECTION_BITS.w) !== 0;

  // Inner parapet core [10..21, 10..21]
  drawAshlarWall(c, 11, 11, 10, 10, { rowH: 4, colW: 5, seed: 823 + mask });
  // Highlight top-left parapet walk
  c.rect(11, 11, 10, 2, C.bone);
  c.rect(12, 13, 8, 2, C.ash);
  c.rect(12, 18, 9, 3, C.coal);

  // Corner coping merlons on un-joined corners for crisp silhouette reading
  c.rect(11, 11, 2, 2, hasN && hasW ? C.ash : C.bone);
  c.rect(19, 11, 2, 2, hasE ? C.ash : C.stone);
  c.rect(11, 19, 2, 2, hasS ? C.coal : C.slate);
  c.rect(19, 19, 2, 2, C.plum);

  // Crisp C.wine perimeter closure only on faces that do NOT connect outward
  if (!hasN) {
    c.rect(10, 10, 12, 1, C.wine);
    // Decorative merlon teeth on free northern coping face
    c.rect(12, 9, 3, 1, C.wine);
    c.rect(13, 10, 1, 1, C.bone);
    c.rect(17, 9, 3, 1, C.wine);
    c.rect(18, 10, 1, 1, C.ash);
  }
  if (!hasS) {
    c.rect(10, 21, 12, 1, C.wine);
  }
  if (!hasW) {
    c.rect(10, 10, 1, 12, C.wine);
  }
  if (!hasE) {
    c.rect(21, 10, 1, 12, C.wine);
  }
  // Clean 1px corner notch only at open concave corners
  if (hasN && hasW) c.set(10, 10, C.wine);
  if (hasN && hasE) c.set(21, 10, C.wine);
  if (hasS && hasW) c.set(10, 21, C.wine);
  if (hasS && hasE) c.set(21, 21, C.wine);
}

/** Deterministic 16-mask stone bastion wall builder (N=1, E=2, S=4, W=8). */
export function buildWallTile(mask: number): Canvas {
  const c = new Canvas(32);
  const m = mask & 0x0f;
  if ((m & CONNECTION_BITS.w) !== 0) drawHorizontalWallSpan(c, 0, 11);
  if ((m & CONNECTION_BITS.e) !== 0) drawHorizontalWallSpan(c, 20, 31);
  if ((m & CONNECTION_BITS.n) !== 0) drawVerticalWallSpan(c, 0, 11);
  if ((m & CONNECTION_BITS.s) !== 0) drawVerticalWallSpan(c, 20, 31);
  drawWallCorePilaster(c, m);
  return c;
}

/** Draws the 32x32 bastion Watchtower with E/W wall buttress wings aligned at y=10..21. */
export function drawWatchtower(): Canvas {
  const c = new Canvas(32);
  // Seamless E/W wall wings matching buildWallTile edge-for-edge at x=0 and x=31
  drawHorizontalWallSpan(c, 0, 8);
  drawHorizontalWallSpan(c, 23, 31);

  // Watchtower dressed stone shaft (x = 8..23, y = 7..29)
  c.rect(8, 7, 16, 23, C.wine);
  drawAshlarWall(c, 9, 8, 14, 21, { rowH: 4, colW: 5, seed: 859 });
  // Left sunlight quoins & right shadow bevel
  for (let y = 9; y <= 25; y += 4) {
    c.rect(9, y, 2, 3, C.bone);
    c.rect(21, y, 2, 3, C.slate);
  }
  // Machicolated cantilevered parapet (y = 2..8, x = 7..24)
  c.rect(7, 5, 18, 4, C.wine);
  c.rect(8, 6, 16, 2, C.stone);
  c.rect(8, 5, 16, 1, C.ash);
  c.rect(8, 8, 16, 1, C.slate);
  for (const mx of [7, 13, 20]) {
    c.rect(mx, 2, 5, 4, C.wine);
    c.rect(mx + 1, 3, 3, 2, C.stone);
    c.rect(mx + 1, 3, 3, 1, C.bone);
  }

  // Lit arrow-slit watch beacon in upper shaft
  c.rect(14, 11, 4, 7, C.wine);
  c.rect(15, 12, 2, 5, C.orange);
  c.rect(15, 13, 2, 3, C.gold);
  c.set(15, 13, C.cream);

  // Recessed postern oak door & base plinth
  c.rect(8, 28, 16, 2, C.coal);
  c.rect(8, 28, 16, 1, C.stone);
  drawArchedDoor(c, 12, 20, 8, 9, { stoneArch: true });
  c.rect(8, 29, 16, 1, C.wine);
  return c;
}

/** Derived 32x32 winter frost overlay matching wall coping and sill drift. */
export function drawFrostWallV18(): Canvas {
  const c = new Canvas(32);
  c.rect(11, 10, 10, 2, C.frost);
  c.rect(12, 12, 8, 1, C.ice);
  c.set(13, 13, C.frost);
  c.set(18, 13, C.ice);
  c.rect(11, 21, 10, 1, C.frost);
  c.rect(12, 22, 8, 1, C.ice);
  return c;
}

/** Derived 32x32 iron-bracket lantern mounted to the center wall pilaster. */
export function drawCosmeticWallLanternV18(): Canvas {
  const c = new Canvas(32);
  c.rect(14, 11, 4, 6, C.wine);
  c.rect(15, 11, 2, 1, C.ash);
  c.rect(15, 12, 2, 3, C.gold);
  c.set(15, 12, C.cream);
  c.rect(15, 15, 2, 1, C.orange);
  return c;
}

/** Derived 32x32 bronze alarm bell mounted cleanly off Watchtower right parapet corbel. */
export function drawCosmeticBellTowerV18(): Canvas {
  const c = new Canvas(32);
  c.rect(22, 4, 6, 2, C.wine);
  c.rect(23, 4, 4, 1, C.rust);
  c.rect(25, 6, 3, 5, C.wine);
  c.rect(26, 6, 1, 4, C.gold);
  c.rect(25, 9, 3, 1, C.orange);
  c.set(26, 10, C.cream);
  return c;
}

/** Derived 32x32 freestanding wooden wayside bell post for border bell cosmetic. */
export function drawCosmeticBellBorderV18(): Canvas {
  const c = new Canvas(32);
  c.rect(14, 7, 4, 21, C.wine);
  c.rect(15, 8, 2, 19, C.brown);
  c.rect(11, 6, 10, 3, C.wine);
  c.rect(12, 7, 8, 1, C.rust);
  c.rect(14, 10, 4, 6, C.wine);
  c.rect(15, 11, 2, 4, C.gold);
  c.rect(14, 15, 4, 1, C.orange);
  return c;
}
