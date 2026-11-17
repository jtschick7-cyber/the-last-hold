// v1.9 (plan T19.6, D631, D635): unified 16 × 16 px Courtyard Marks in 100% Zughy-32 palette
// with C.wine outline for crisp contrast on both HoldGrid (dark) and HoldScene (light).
import { applyWineOutline } from './grid-v18-kit';
import { C, Canvas } from './pixel';

export const V19_MARK_IDS = ['thorn-antler-rack', 'beacon-iron-urn'] as const;
export type V19MarkId = (typeof V19_MARK_IDS)[number];

function drawThornAntlerRack(c: Canvas): void {
  // Carved oak mounting plaque & trophy bracket
  c.rect(5, 9, 6, 5, C.brownDark);
  c.rect(5, 9, 5, 4, C.brown);
  c.rect(6, 9, 4, 2, C.clay);
  c.rect(4, 12, 8, 2, C.rust);
  c.rect(4, 12, 6, 1, C.sand);
  c.rect(6, 9, 4, 1, C.red);
  c.rect(7, 10, 2, 2, C.gold);
  c.set(7, 10, C.cream);

  // Cleanly connected crescent antlers with crisp upright tines
  c.rect(6, 7, 4, 2, C.bone);
  c.set(7, 7, C.cream);
  c.set(9, 8, C.ash);
  for (const [x, y, col] of [
    // Left beam & tines
    [5, 8, C.bone],
    [4, 7, C.bone],
    [3, 6, C.cream],
    [2, 5, C.cream],
    [2, 4, C.bone],
    [2, 3, C.cream],
    [4, 6, C.bone],
    [4, 5, C.bone],
    [4, 4, C.cream],
    [4, 2, C.cream],
    [5, 5, C.ash],
    [6, 4, C.bone],
    [6, 3, C.bone],
    [6, 2, C.cream],
    // Right beam & tines
    [10, 8, C.ash],
    [11, 7, C.bone],
    [12, 6, C.bone],
    [13, 5, C.cream],
    [13, 4, C.bone],
    [13, 3, C.cream],
    [11, 6, C.ash],
    [11, 5, C.bone],
    [11, 4, C.bone],
    [11, 2, C.cream],
    [10, 5, C.ash],
    [9, 4, C.bone],
    [9, 3, C.bone],
    [9, 2, C.cream],
  ] as const) {
    c.set(x, y, col);
  }

  // Coiled boundary-thorn briars & single central scarlet bud
  for (const [x, y, col] of [
    [3, 5, C.grass],
    [4, 5, C.lime],
    [5, 6, C.moss],
    [6, 7, C.grass],
    [9, 7, C.grass],
    [10, 6, C.lime],
    [11, 5, C.moss],
    [12, 5, C.grass],
    [7, 8, C.red],
    [8, 8, C.red],
  ] as const) {
    c.set(x, y, col);
  }
}

function drawBeaconIronUrn(c: Canvas): void {
  // Stepped carved stone pedestal foot
  c.rect(4, 13, 8, 2, C.coal);
  c.rect(4, 13, 6, 1, C.stone);
  c.rect(5, 12, 6, 1, C.bone);

  // Tall fluted wrought-iron signal amphora / urn body with bright top-left highlight for dark ground contrast
  c.rect(5, 8, 6, 4, C.slate);
  c.rect(5, 8, 2, 4, C.ash);
  c.set(5, 8, C.bone);
  c.rect(9, 8, 2, 4, C.coal);
  c.rect(6, 6, 4, 2, C.slate);
  c.set(6, 6, C.bone);
  c.set(7, 6, C.ash);
  c.set(9, 6, C.coal);

  // Flared iron lip collar & bronze-ember belly band + gold beacon sigil
  c.rect(5, 5, 6, 1, C.bone);
  c.set(10, 5, C.slate);
  c.rect(5, 10, 6, 1, C.rust);
  c.set(5, 10, C.orange);
  c.rect(7, 9, 2, 2, C.gold);
  c.set(7, 9, C.cream);

  // Curved iron side ear-handles
  for (const [x, y, col] of [
    [3, 7, C.bone],
    [4, 6, C.ash],
    [3, 8, C.ash],
    [4, 9, C.slate],
    [12, 7, C.slate],
    [11, 6, C.slate],
    [12, 8, C.coal],
    [11, 9, C.coal],
  ] as const) {
    c.set(x, y, col);
  }

  // Smoldering pitch-ember signal flame spire rising from the urn neck
  c.rect(6, 3, 4, 2, C.red);
  c.rect(7, 2, 2, 3, C.orange);
  c.set(7, 1, C.red);
  c.set(8, 1, C.orange);
  c.set(7, 3, C.gold);
  c.set(7, 4, C.cream);
  c.set(8, 4, C.gold);
}

/** Draws a 16 × 16 px Zughy-32 Courtyard Mark with C.wine outline for v1.9. */
export function drawCourtyardMarkV19(id: V19MarkId): Canvas {
  const c = new Canvas(16);
  if (id === 'thorn-antler-rack') drawThornAntlerRack(c);
  else drawBeaconIronUrn(c);
  applyWineOutline(c);
  return c;
}
