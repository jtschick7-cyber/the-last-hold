// GDD §5.15.6, §9.19 (D457): the two looks of the hold scene that belong to the ending, each a
// 160 × 64 transparent layer stacked on `scene.hold.<age>` like the cosmetics. The frost lies along
// the foot of the walls from Act VI's start until Remember Them is chosen; after it the frost is
// gone and a lamp glows in one window. Drawn in code, in the palette, with a fixed seed.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import type { AgeId } from '../src/content/ages';
import { SCENE_H, SCENE_W } from './draw-cosmetics';
import { C, Canvas, seedRolls } from './pixel';

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

export const drawFrost = (age: AgeId): Canvas => {
  const c = new Canvas(SCENE_W);
  const roll = seedRolls(`hold-frost:${age}`);
  const scene = sceneOf(age);
  const opaque = (x: number, y: number): boolean =>
    (scene.data[(y * SCENE_W + x) * 4 + 3] ?? 0) > 0;
  const isOutline = (x: number, y: number): boolean =>
    OUTLINE.every((v, k) => scene.data[(y * SCENE_W + x) * 4 + k] === v);
  for (let x = 0; x < SCENE_W; x++) {
    // The tops of the roofs, trees and towers: a cap of rime under the outline, ragged below.
    let top = 0;
    while (top < GROUND && !opaque(x, top)) top++;
    if (top < GROUND - 8) {
      const first = isOutline(x, top) ? top + 1 : top;
      for (let d = 0; d < 4; d++) {
        if (isOutline(x, first + d)) continue;
        if (roll() < 0.95 - d * 0.22) c.set(x, first + d, roll() < 0.2 ? C.ice : C.frost);
      }
    }
    // The foot of the walls: rime piled thickest nearest the ground.
    for (let y = GROUND - 5; y < GROUND; y++) {
      if (roll() < 0.55 + (y - (GROUND - 5)) * 0.1) c.set(x, y, roll() < 0.25 ? C.ice : C.frost);
    }
    // On the ground in front, thinning out.
    for (let y = GROUND; y < GROUND + 10; y++) {
      if (roll() < 0.85 - (y - GROUND) * 0.07) c.set(x, y, roll() < 0.3 ? C.ice : C.frost);
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
