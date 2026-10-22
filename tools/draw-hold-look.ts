// GDD §5.15.6, §9.19 (D457): the two looks of the hold scene that belong to the ending, each a
// 160 × 64 transparent layer stacked on `scene.hold.<age>` like the cosmetics. The frost lies along
// the foot of the walls from Act VI's start until Remember Them is chosen; after it the frost is
// gone and a lamp glows in one window. Drawn in code, in the palette, with a fixed seed.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import type { AgeId } from '../src/content/ages';
import { SCENE_H, SCENE_W } from './draw-cosmetics';
import { C, Canvas } from './pixel';

export { SCENE_H };

/** The panes of the window the lamp sits in (measured from each scene image): x, y of a 6 × 6 box. */
const WINDOW: Record<AgeId, readonly [number, number]> = {
  hamlet: [37, 37],
  keep: [21, 37],
  citadel: [21, 37],
  bastion: [101, 21],
};

/** The ground line of every hold scene: grass starts at this row. */
const GROUND = 48;

/** The scene's own picture, read to find where the roofs and tops are. */
const sceneOf = (age: AgeId): PNG =>
  PNG.sync.read(readFileSync(new URL(`../public/assets/scenes/hold-${age}.png`, import.meta.url)));

const OUTLINE = [0x47, 0x2d, 0x3c];

/**
 * v1.0 (TV.10b): clean rime frost, not a noisy band. It lies on what the weather would settle on:
 * the tops of roofs, trees and towers (a solid cap with a few short icicles under the edge), the
 * sills and ledges (a broken white line on the ink), the foot of the walls, and the edges of the
 * path where the grass meets it. Nothing is scattered at random across the ground.
 */
export const drawFrost = (age: AgeId): Canvas => {
  const c = new Canvas(SCENE_W);
  const scene = sceneOf(age);
  const at = (x: number, y: number): number => (y * SCENE_W + x) * 4;
  const opaque = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < SCENE_W && y < SCENE_H && (scene.data[at(x, y) + 3] ?? 0) > 0;
  const isOutline = (x: number, y: number): boolean =>
    opaque(x, y) && OUTLINE.every((v, k) => scene.data[at(x, y) + k] === v);
  const hex = (x: number, y: number): string =>
    [0, 1, 2].map((k) => (scene.data[at(x, y) + k] ?? 0).toString(16).padStart(2, '0')).join('');
  for (let x = 0; x < SCENE_W; x++) {
    // The top of whatever stands up: a cap two pixels deep under the outline, and an icicle every fifth column.
    let top = 0;
    while (top < GROUND && !opaque(x, top)) top++;
    if (top < GROUND - 8) {
      const first = isOutline(x, top) ? top + 1 : top;
      if (!isOutline(x, first)) c.set(x, first, C.frost);
      if (!isOutline(x, first + 1)) c.set(x, first + 1, x % 3 === 0 ? C.ice : C.frost);
      if (x % 5 === 2 && !isOutline(x, first + 2)) c.set(x, first + 2, C.ice);
    }
  }
  for (let y = 4; y < GROUND; y++)
    for (let x = 0; x < SCENE_W; x++) {
      // Ledges and sills: a run of outline with open air or a pane above and wall below.
      if (!isOutline(x, y) || isOutline(x, y - 1) || isOutline(x, y + 1)) continue;
      let run = 0;
      while (isOutline(x + run, y) && !isOutline(x + run, y - 1) && !isOutline(x + run, y + 1))
        run++;
      if (run >= 4) for (let k = 0; k < run; k++) if ((x + k) % 3 !== 2) c.set(x + k, y, C.frost);
      x += Math.max(0, run - 1);
    }
  // The foot of the walls: two rows of rime where the walls meet the ground, broken by the doors.
  for (let x = 0; x < SCENE_W; x++) {
    if (opaque(x, GROUND - 1) && !isOutline(x, GROUND - 1)) c.set(x, GROUND - 1, C.frost);
    if (opaque(x, GROUND - 2) && !isOutline(x, GROUND - 2) && x % 4 !== 1)
      c.set(x, GROUND - 2, C.ice);
  }
  // The ground: a frost line along the top of the grass, and along each edge of the path.
  for (let x = 0; x < SCENE_W; x++) {
    if (opaque(x, GROUND)) c.set(x, GROUND, x % 6 === 4 ? C.ice : C.frost);
    for (let y = GROUND + 1; y < SCENE_H; y++) {
      if (!opaque(x, y) || !opaque(x - 1, y)) continue;
      // Only a long straight edge counts (the path), not a tuft or a flower.
      const edge = (yy: number): boolean =>
        opaque(x, yy) && opaque(x - 1, yy) && hex(x, yy) !== hex(x - 1, yy);
      if ([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].every((d) => y + d >= SCENE_H || edge(y + d))) {
        c.set(x, y, C.frost);
        c.set(x - 1, y, C.ice);
      }
    }
  }
  return c;
};

export const drawLamp = (age: AgeId): Canvas => {
  const c = new Canvas(SCENE_W);
  const [x, y] = WINDOW[age];
  c.rect(x, y, 6, 6, C.gold);
  c.rect(x + 2, y, 2, 6, C.orange);
  c.set(x, y, C.cream);
  c.set(x + 4, y, C.cream);
  c.set(x + 1, y + 1, C.cream);
  c.set(x + 5, y + 1, C.cream);
  return c;
};
