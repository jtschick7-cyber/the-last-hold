import type { CourtyardMarkId } from '../src/content/courtyard-marks';
import { applyWineOutline } from './grid-v18-kit';
import { C, Canvas } from './pixel';

function drawFjordBoneStandard(c: Canvas): void {
  // Carved socket plinth + upright bone standard pole
  c.rect(2, 13, 4, 2, C.slate);
  c.rect(2, 13, 3, 1, C.ash);
  c.rect(3, 2, 2, 11, C.bone);
  c.rect(3, 2, 1, 11, C.cream);
  // Horned Lindworm bone finial crest
  c.set(2, 1, C.frost);
  c.set(3, 1, C.cream);
  c.set(5, 1, C.bone);
  c.set(2, 2, C.ash);
  // Fluttering crimson pennant with golden rune chevron & swallowtail notch
  c.rect(5, 3, 8, 6, C.red);
  c.rect(5, 7, 7, 2, C.blood);
  c.set(13, 4, C.red);
  c.set(13, 7, C.blood);
  // Bright trim along top fly and gold heraldic band
  c.rect(5, 3, 7, 1, C.orange);
  c.rect(6, 5, 5, 1, C.gold);
  c.rect(7, 4, 2, 3, C.gold);
  c.set(7, 5, C.cream);
  c.set(11, 5, C.cream);
}

function drawBarrowBrazier(c: Canvas): void {
  // Wide tripod iron legs + heavy riveted fire bowl
  c.rect(3, 12, 2, 3, C.coal);
  c.rect(7, 12, 2, 3, C.slate);
  c.rect(11, 12, 2, 3, C.coal);
  c.rect(2, 9, 12, 3, C.slate);
  c.rect(3, 11, 10, 2, C.coal);
  c.rect(2, 9, 12, 1, C.ash);
  c.set(3, 9, C.bone);
  c.set(4, 10, C.gold);
  c.set(8, 10, C.gold);
  c.set(11, 10, C.gold);
  // Glowing ember bed + triple roaring brazier flames
  c.rect(4, 8, 8, 1, C.red);
  c.rect(3, 5, 2, 3, C.red);
  c.rect(11, 5, 2, 3, C.red);
  c.rect(5, 4, 6, 5, C.orange);
  c.rect(6, 2, 4, 5, C.gold);
  c.rect(7, 1, 2, 2, C.orange);
  c.rect(7, 4, 2, 3, C.cream);
  c.set(4, 6, C.gold);
  c.set(11, 6, C.gold);
}

function drawRiverReedBasin(c: Canvas): void {
  // Carved river-stone trough basin with stepped plinth foot
  c.rect(4, 13, 8, 2, C.coal);
  c.rect(2, 9, 12, 4, C.slate);
  c.rect(2, 9, 12, 1, C.ash);
  c.rect(3, 9, 5, 1, C.bone);
  c.rect(3, 12, 10, 1, C.plum);
  // Shimmering river water pool brimming inside trough
  c.rect(3, 9, 10, 2, C.blue);
  c.rect(4, 9, 8, 1, C.cyan);
  c.set(5, 9, C.frost);
  c.set(9, 9, C.ice);
  // Arched river reeds and velvet cattail stalks rising from water
  c.rect(4, 5, 1, 4, C.moss);
  c.set(3, 4, C.grass);
  c.rect(6, 2, 1, 7, C.grass);
  c.rect(5, 2, 2, 3, C.rust);
  c.set(6, 1, C.cream);
  c.rect(9, 3, 1, 6, C.grass);
  c.rect(9, 3, 2, 3, C.brown);
  c.set(9, 2, C.sand);
  c.rect(11, 5, 1, 4, C.lime);
  c.set(12, 4, C.grass);
}

function drawStonebackCairn(c: Canvas): void {
  // Stepped stacked rugged cairn boulders with shadowed mortar seams & crisp sunlit bevels
  c.rect(2, 11, 12, 4, C.coal);
  c.rect(2, 11, 9, 3, C.slate);
  c.rect(2, 11, 7, 1, C.stone);
  c.rect(3, 10, 10, 1, C.plum); // Shadow crevice under middle slab
  c.rect(4, 7, 8, 3, C.slate);
  c.rect(4, 7, 6, 2, C.stone);
  c.rect(4, 7, 5, 1, C.ash);
  c.rect(5, 6, 6, 1, C.plum); // Shadow crevice under cap boulder
  c.rect(5, 3, 6, 3, C.stone);
  c.rect(5, 3, 4, 2, C.ash);
  c.rect(6, 3, 2, 1, C.bone);
  c.rect(7, 1, 2, 2, C.bone);
  c.set(8, 2, C.ash);
  // Luminous carved Stoneback ice rune on central boulder + moss tuft
  c.set(7, 8, C.frost);
  c.set(8, 8, C.cyan);
  c.set(7, 9, C.ice);
  c.set(8, 9, C.blue);
  c.set(6, 8, C.blue);
  c.set(9, 8, C.blue);
  c.set(3, 13, C.moss);
  c.set(4, 12, C.grass);
}

function drawKettleBarrowWreath(c: Canvas): void {
  // Evergreen pine-bough ring leaving open hollow center at (7..8, 7..8)
  const ringPts: readonly (readonly [number, number, string])[] = [
    [5, 2, C.grass],
    [6, 2, C.lime],
    [7, 2, C.grass],
    [8, 2, C.grass],
    [9, 2, C.moss],
    [10, 2, C.moss],
    [4, 3, C.lime],
    [5, 3, C.grass],
    [10, 3, C.moss],
    [11, 3, C.pine],
    [3, 4, C.grass],
    [4, 4, C.moss],
    [11, 4, C.pine],
    [12, 4, C.moss],
    [2, 5, C.grass],
    [3, 5, C.lime],
    [4, 5, C.pine],
    [11, 5, C.pine],
    [12, 5, C.moss],
    [13, 5, C.pine],
    [2, 6, C.lime],
    [3, 6, C.grass],
    [4, 6, C.pine],
    [11, 6, C.pine],
    [12, 6, C.moss],
    [13, 6, C.pine],
    [2, 7, C.grass],
    [3, 7, C.moss],
    [4, 7, C.pine],
    [11, 7, C.pine],
    [12, 7, C.pine],
    [13, 7, C.moss],
    [2, 8, C.grass],
    [3, 8, C.moss],
    [4, 8, C.pine],
    [11, 8, C.pine],
    [12, 8, C.pine],
    [13, 8, C.moss],
    [3, 9, C.moss],
    [4, 9, C.pine],
    [5, 9, C.pine],
    [10, 9, C.pine],
    [11, 9, C.moss],
    [12, 9, C.pine],
    [4, 10, C.pine],
    [5, 10, C.moss],
    [10, 10, C.moss],
    [11, 10, C.pine],
    [5, 11, C.moss],
    [6, 11, C.moss],
    [9, 11, C.pine],
    [10, 11, C.pine],
    [6, 12, C.pine],
    [7, 12, C.moss],
    [8, 12, C.pine],
    [9, 12, C.pine],
  ];
  for (const [px, py, col] of ringPts) c.set(px, py, col);

  // Scarlet rowan berry clusters + gold wreath bow & scarlet ribbons contrasting over grass
  for (const [bx, by] of [
    [6, 2],
    [3, 5],
    [11, 6],
    [4, 9],
  ] as const) {
    c.set(bx, by, C.red);
    c.set(bx + 1, by, C.pink);
  }
  c.rect(7, 11, 2, 2, C.gold);
  c.set(7, 11, C.cream);
  c.set(6, 11, C.gold);
  c.set(9, 11, C.gold);
  c.rect(5, 13, 2, 2, C.red);
  c.rect(9, 13, 2, 2, C.red);
  c.set(5, 14, C.orange);
  c.set(10, 14, C.orange);
}

function drawWatchFireSconce(c: Canvas): void {
  // Slender wrought-iron wall-mount bracket + tall beacon torch shaft & cage
  c.rect(2, 9, 5, 2, C.coal);
  c.rect(2, 9, 4, 1, C.slate);
  c.rect(2, 8, 2, 4, C.ash);
  c.rect(7, 8, 2, 7, C.coal);
  c.rect(7, 8, 1, 6, C.slate);
  c.rect(5, 6, 6, 3, C.slate);
  c.rect(6, 7, 4, 2, C.coal);
  c.rect(5, 6, 6, 1, C.ash);
  c.set(8, 7, C.gold);
  // Tall surging wind-whipped crimson & gold watch-fire spire
  c.rect(6, 4, 4, 2, C.red);
  c.rect(7, 2, 4, 4, C.orange);
  c.set(11, 3, C.red);
  c.set(10, 1, C.red);
  c.rect(7, 3, 2, 3, C.gold);
  c.set(8, 2, C.gold);
  c.set(8, 4, C.cream);
  c.set(9, 2, C.frost);
}

export const V18_COURTYARD_MARK_IDS = [
  'fjord-bone-standard',
  'barrow-brazier',
  'river-reed-basin',
  'stoneback-cairn',
  'kettle-barrow-wreath',
  'watch-fire-sconce',
] as const satisfies readonly CourtyardMarkId[];
export type V18CourtyardMarkId = (typeof V18_COURTYARD_MARK_IDS)[number];

const MARK_DRAWERS: Readonly<Record<V18CourtyardMarkId, (c: Canvas) => void>> = {
  'fjord-bone-standard': drawFjordBoneStandard,
  'barrow-brazier': drawBarrowBrazier,
  'river-reed-basin': drawRiverReedBasin,
  'stoneback-cairn': drawStonebackCairn,
  'kettle-barrow-wreath': drawKettleBarrowWreath,
  'watch-fire-sconce': drawWatchFireSconce,
};

/**
 * Draws a crisp 16x16 Zughy-32 pixel Courtyard Mark sprite (Q83(a)/Q84(a)) with C.wine outline.
 */
export function drawCourtyardMarkV18(id: V18CourtyardMarkId): Canvas {
  const c = new Canvas(16);
  MARK_DRAWERS[id](c);
  applyWineOutline(c);
  return c;
}
