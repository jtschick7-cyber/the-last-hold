// GDD §5.1.5 and §9.21 (v1.1, D504): the Hold grid's wall segments and Watchtower, 32 px, drawn in
// code in the palette. A wall has one picture per connection mask (bits N=1, E=2, S=4, W=8) so
// neighbouring segments join into a line; the Watchtower has one picture and no connections (the
// owner, 2026-10-23).
import { CONNECTION_BITS } from '../src/content/hold-layout';
import { C, Canvas } from './pixel';

const TILE = 32;
/** The wall's top face is 10 px wide, centred, so every mask's arms meet the tile edge at the same place. */
const LO = 11;
const HI = 20;

const stoneAt = (x: number, y: number): string => {
  // Courses of 4 px with the joints staggered; the same everywhere, so adjoining tiles match.
  const course = Math.floor(y / 4);
  const joint = (x + (course % 2) * 4) % 8 === 7 || y % 4 === 3;
  return joint ? C.slate : (x + y) % 11 === 0 ? C.ash : C.stone;
};

export const WALL_MASKS = Array.from({ length: 16 }, (_, i) => i);

/** One wall segment; `mask` says which sides continue to a neighbouring wall or tower. */
export const drawWall = (mask: number): Canvas => {
  const c = new Canvas(TILE);
  const top = new Set<number>();
  const mark = (x0: number, y0: number, x1: number, y1: number): void => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) top.add(y * TILE + x);
  };
  mark(LO, LO, HI, HI); // the post
  if (mask & CONNECTION_BITS.n) mark(LO, 0, HI, LO);
  if (mask & CONNECTION_BITS.s) mark(LO, HI, HI, TILE - 1);
  if (mask & CONNECTION_BITS.w) mark(0, LO, LO, HI);
  if (mask & CONNECTION_BITS.e) mark(HI, LO, TILE - 1, HI);
  const has = (x: number, y: number): boolean => top.has(y * TILE + x);
  // The south-facing front: three rows under any top face with open ground below.
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      if (has(x, y)) continue;
      let depth = 0;
      while (depth < 3 && y - depth - 1 >= 0 && !has(x, y - depth)) depth++;
      if (depth > 0 && has(x, y - depth)) c.set(x, y, depth === 3 ? C.coal : C.slate);
    }
  for (const k of top) {
    const x = k % TILE;
    const y = Math.floor(k / TILE);
    c.set(x, y, !has(x, y - 1) && y > 0 ? C.ash : stoneAt(x, y));
  }
  // The post stands a little proud: a bone cap.
  c.rect(LO + 1, LO + 1, 8, 1, C.bone);
  c.outline(C.wine);
  return c;
};

/** The Watchtower: a stone tower with a crenellated platform and a lit slit. */
export const drawWatchtower = (): Canvas => {
  const c = new Canvas(TILE);
  c.rect(9, 12, 14, 18, C.stone); // shaft
  for (let y = 12; y < 30; y++) for (let x = 9; x < 23; x++) c.set(x, y, stoneAt(x, y));
  c.rect(9, 12, 14, 1, C.ash);
  c.rect(20, 13, 3, 17, C.slate); // shade on the east side
  c.rect(9, 29, 14, 1, C.coal);
  c.rect(7, 6, 18, 6, C.stone); // platform
  c.rect(7, 6, 18, 1, C.ash);
  c.rect(7, 11, 18, 1, C.coal);
  for (const x of [7, 12, 17, 22]) {
    c.rect(x, 2, 3, 4, C.stone);
    c.rect(x, 2, 3, 1, C.ash);
  }
  c.rect(14, 16, 3, 6, C.ink); // a slit
  c.set(15, 18, C.gold);
  c.set(15, 19, C.orange);
  c.rect(14, 25, 4, 5, C.brownDark); // a door
  c.rect(14, 25, 4, 1, C.brown);
  c.outline(C.wine);
  return c;
};
