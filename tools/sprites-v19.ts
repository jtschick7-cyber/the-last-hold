// v1.9 (plan T19.6, D635): left-facing 5-frame battle sprite strips (160 × 32 px) in 100%
// Zughy-32 palette for The Thorn-Stag (#03) and The Beacon-Bane (#04).
import { C, Canvas } from './pixel';
import { framesOf, stripPng } from './sprite-frames';
import { dots, ellipseM, lit, N, polyM, sep, spk, tubeM, union } from './sprite-kit';

export const V19_SPRITE_IDS = ['thorn-stag', 'beacon-bane'] as const;
export type V19SpriteId = (typeof V19_SPRITE_IDS)[number];

/** Base 32 × 32 left-facing sprite for The Thorn-Stag: agile ironwood hart crowned with boundary thorns. */
function drawThornStagBase(): Canvas {
  const c = new Canvas(N);
  const bark = (x: number, y: number): string | null =>
    spk(x, y, 7) ? C.brownDark : spk(x, y, 11, 3) ? C.clay : null;

  // Far legs (back-left and back-right) with clean separation at y = 29 (outline lands on y = 30)
  const farLegs = union(
    tubeM([
      [16, 21, 0.9],
      [18, 25, 0.8],
      [17, 29, 0.8],
    ]),
    tubeM([
      [25, 20, 0.9],
      [27, 24, 0.8],
      [27, 29, 0.8],
    ]),
  );
  lit(c, farLegs, { mid: C.brownDark, light: C.brown, dark: C.ink });

  // Lean arched hart torso & chest
  const body = union(
    ellipseM(20, 18.5, 6.4, 3.4),
    polyM([
      [13, 14],
      [19, 14],
      [26, 16],
      [26, 21],
      [14, 21],
    ]),
  );
  sep(c, body);
  lit(c, body, { mid: C.brown, light: C.rust, dark: C.brownDark, top: C.clay, tex: bark });

  // Short raised tail
  c.rect(26, 16, 2, 2, C.rust);
  c.set(27, 16, C.ash);

  // Near agile legs (fore-left striding forward, hind-right braced) grounded at y = 29
  const nearLegs = union(
    tubeM([
      [14, 20, 1.1],
      [12, 24, 0.9],
      [11, 29, 0.8],
    ]),
    tubeM([
      [23, 20, 1.1],
      [25, 25, 0.9],
      [24, 29, 0.8],
    ]),
  );
  sep(c, nearLegs);
  lit(c, nearLegs, { mid: C.rust, light: C.clay, dark: C.brownDark });
  dots(c, C.coal, [
    [11, 29],
    [17, 29],
    [24, 29],
    [27, 29],
  ]);

  // Creeping moss mantle across spine & shoulder
  for (const [mx, my, col] of [
    [15, 16, C.grass],
    [16, 15, C.lime],
    [18, 15, C.grass],
    [20, 15, C.moss],
    [22, 16, C.grass],
    [24, 16, C.moss],
    [14, 18, C.moss],
  ] as const) {
    c.set(mx, my, col);
  }

  // Proud arched neck & sculpted stag head facing left
  const neck = polyM([
    [11, 10],
    [16, 10],
    [17, 18],
    [12, 18],
  ]);
  sep(c, neck);
  lit(c, neck, { mid: C.brown, light: C.clay, dark: C.brownDark, left: C.clay });

  const head = union(
    ellipseM(12, 10, 3, 2.4),
    polyM([
      [7, 9],
      [12, 8],
      [12, 11],
      [7, 11],
    ]),
  );
  sep(c, head);
  lit(c, head, { mid: C.ash, light: C.bone, dark: C.brownDark, top: C.bone, left: C.cream });
  c.set(7, 10, C.ink); // muzzle tip
  c.set(10, 9, C.lime); // glowing forest-spirit eye
  c.set(11, 9, C.cream);
  c.line(14, 8, 16, 6, C.brown, 1);
  c.set(16, 6, C.ash);

  // Towering crown of boundary thorns & pale-tipped antlers
  for (const [x0, y0, x1, y1, col] of [
    [12, 7, 9, 2, C.bone],
    [11, 5, 13, 2, C.bone],
    [13, 7, 17, 3, C.rust],
    [15, 5, 20, 4, C.bone],
    [18, 5, 21, 2, C.cream],
  ] as const) {
    c.line(x0, y0, x1, y1, col, 1);
  }
  dots(c, C.cream, [
    [9, 2],
    [13, 2],
    [17, 3],
    [21, 2],
  ]);
  dots(c, C.lime, [
    [11, 4],
    [15, 5],
    [18, 4],
  ]);
  dots(c, C.grass, [
    [12, 6],
    [16, 6],
  ]);
  dots(c, C.red, [[14, 6]]);

  c.outline(C.ink);
  c.rimmedDowned = true;
  return c;
}

function thornStagFlourish(lunge: Canvas): void {
  // Sweeping boundary-briar lashes & thorn splinters whipping forward at x = 0..4
  for (const [x0, y0, x1, y1, col] of [
    [4, 10, 1, 7, C.grass],
    [4, 12, 0, 13, C.lime],
    [4, 15, 1, 18, C.grass],
    [4, 18, 2, 22, C.moss],
  ] as const) {
    lunge.line(x0, y0, x1, y1, col, 1);
  }
  dots(lunge, C.cream, [
    [1, 7],
    [0, 13],
    [1, 18],
  ]);
  dots(lunge, C.red, [
    [2, 11],
    [2, 16],
  ]);
}

/** Base 32 × 32 left-facing sprite for The Beacon-Bane: walking iron signal-brazier. */
function drawBeaconBaneBase(): Canvas {
  const c = new Canvas(N);

  // Roaring live signal-fire crown at the top (connected cleanly into the cage rim)
  const flame = polyM([
    [11, 12],
    [11, 7],
    [14, 9],
    [15, 3],
    [18, 7],
    [21, 2],
    [23, 8],
    [25, 6],
    [25, 12],
  ]);
  lit(c, flame, { mid: C.orange, light: C.gold, dark: C.red, top: C.red });
  c.rect(14, 8, 9, 4, C.gold);
  c.rect(16, 9, 5, 3, C.cream);
  dots(c, C.red, [
    [11, 7],
    [15, 3],
    [21, 2],
    [25, 6],
  ]);

  // Three articulated splayed charred wrought-iron legs grounded at y = 29 (outline lands on y = 30)
  const backLeg = tubeM([
    [17, 21, 1.2],
    [17, 28, 1],
  ]);
  lit(c, backLeg, { mid: C.coal, light: C.slate, dark: C.ink });

  const leftLeg = tubeM([
    [12, 20, 1.4],
    [10, 24, 1.2],
    [9, 28, 1],
  ]);
  const rightLeg = tubeM([
    [23, 20, 1.4],
    [25, 24, 1.2],
    [25, 28, 1],
  ]);
  sep(c, leftLeg);
  lit(c, leftLeg, { mid: C.slate, light: C.ash, dark: C.coal });
  sep(c, rightLeg);
  lit(c, rightLeg, { mid: C.coal, light: C.slate, dark: C.ink });
  dots(c, C.rust, [
    [11, 22],
    [17, 23],
    [24, 22],
  ]);

  // Heavy flared iron fire-cage & riveted basin
  const cage = polyM([
    [10, 11],
    [26, 11],
    [25, 19],
    [21, 22],
    [13, 22],
    [10, 19],
  ]);
  sep(c, cage);
  lit(c, cage, { mid: C.slate, light: C.ash, dark: C.coal, top: C.ash });
  // Furnace interior & dark iron framing around the twin glaring eyes
  c.rect(11, 13, 13, 5, C.red);
  c.rect(18, 14, 5, 3, C.orange);
  c.rect(10, 13, 8, 5, C.coal);
  for (const bx of [10, 14, 18, 22, 25]) {
    c.rect(bx, 11, 1, 8, bx < 19 ? C.ash : C.coal);
  }
  c.rect(10, 11, 16, 2, C.ash);
  c.rect(21, 11, 5, 2, C.slate);
  c.rect(11, 18, 14, 2, C.coal);
  c.rect(12, 19, 12, 2, C.brownDark);
  // Twin sharp furnace-slit eyes facing left inside dark hooded brow slots
  c.rect(11, 14, 2, 2, C.gold);
  c.set(11, 14, C.cream);
  c.rect(15, 14, 2, 2, C.gold);
  c.set(15, 14, C.cream);

  // Dripping molten pitch beads hanging under the basin belly
  c.rect(14, 22, 2, 3, C.wine);
  c.set(14, 25, C.orange);
  c.rect(19, 22, 2, 4, C.ink);
  c.set(19, 25, C.red);
  c.set(19, 26, C.gold);

  c.outline(C.ink);
  c.rimmedDowned = true;
  return c;
}

function beaconBaneIdle2Dance(idle2: Canvas): void {
  idle2.set(15, 3, C.orange);
  idle2.set(16, 3, C.red);
  idle2.set(21, 3, C.gold);
  idle2.set(22, 2, C.red);
  idle2.set(14, 24, C.gold);
}

function beaconBaneFlourish(lunge: Canvas): void {
  // Pitch-Flare fire blast & ember sparks jetting left toward hunters (x = 0..5)
  for (const [x0, y0, x1, y1, col] of [
    [5, 13, 1, 11, C.orange],
    [5, 15, 0, 15, C.gold],
    [5, 17, 1, 19, C.red],
  ] as const) {
    lunge.line(x0, y0, x1, y1, col, 1);
  }
  dots(lunge, C.cream, [
    [3, 15],
    [2, 13],
  ]);
  dots(lunge, C.gold, [
    [1, 9],
    [0, 13],
    [2, 21],
  ]);
  dots(lunge, C.red, [
    [0, 11],
    [0, 18],
    [3, 22],
  ]);
}

/** Draws the base 32 × 32 left-facing Canvas for a v1.9 Great Beast. */
export function drawSpriteCanvasV19(id: V19SpriteId): Canvas {
  return id === 'thorn-stag' ? drawThornStagBase() : drawBeaconBaneBase();
}

/** Renders the full 160 × 32 px 5-frame battle sprite strip PNG buffer for a v1.9 Great Beast. */
export function renderSpriteStripV19(id: V19SpriteId): Buffer {
  const base = drawSpriteCanvasV19(id);
  const frames = framesOf(base, 'left');
  if (id === 'thorn-stag') {
    thornStagFlourish(frames.lunge);
  } else {
    beaconBaneIdle2Dance(frames.idle2);
    beaconBaneFlourish(frames.lunge);
  }
  return stripPng(frames);
}
