// GDD §9.12 and §9.21 (v1.1, D504): the ground of the Hold's 8 × 8 grid, drawn in code in the
// 32-colour palette. 32 px tiles (clearing ground, locked forest, ruined stone, blueprint ghosts)
// and the two 256 × 16 border strips. Each is a pure function of its name, so the file never changes.
import { C, Canvas, seedRolls } from './pixel';

export const TILE = 32;
export const STRIP_W = 256;
export const STRIP_H = 16;

export const GROUND_LOOKS = ['grass', 'earth', 'flags'] as const;
export const FOREST_LOOKS = ['1', '2'] as const;
export const RUIN_LOOKS = ['1', '2'] as const;
export const GHOST_LOOKS = ['locked', 'dormant'] as const;
export const STRIP_EDGES = ['north', 'south'] as const;
export type GroundLook = (typeof GROUND_LOOKS)[number];
export type ForestLook = (typeof FOREST_LOOKS)[number];
export type RuinLook = (typeof RUIN_LOOKS)[number];
export type GhostLook = (typeof GHOST_LOOKS)[number];
export type StripEdge = (typeof STRIP_EDGES)[number];

const tile = (): Canvas => new Canvas(TILE);

/** Clearing ground. Seamless: nothing touches the edge pixels that a neighbour would not match. */
export const drawGround = (look: GroundLook): Canvas => {
  const c = tile();
  const roll = seedRolls(`grid.ground.${look}`);
  const at = (): [number, number] => [Math.floor(roll() * TILE), Math.floor(roll() * TILE)];
  if (look === 'grass') {
    c.fill(C.grass);
    for (let i = 0; i < 26; i++) {
      const [x, y] = at();
      c.set(x, y, C.moss);
      c.set(x + 1, y, C.moss);
    }
    for (let i = 0; i < 10; i++) {
      const [x, y] = at();
      c.set(x, y, C.lime);
      c.set(x - 1, y - 1, C.lime);
      c.set(x + 1, y - 1, C.lime);
    }
  } else if (look === 'earth') {
    c.fill(C.clay);
    for (let i = 0; i < 30; i++) {
      const [x, y] = at();
      c.set(x, y, C.rust);
      c.set(x + 1, y, C.rust);
    }
    for (let i = 0; i < 12; i++) {
      const [x, y] = at();
      c.set(x, y, C.cream);
    }
    for (let i = 0; i < 4; i++) {
      const [x, y] = at();
      c.rect(x, y, 2, 1, C.stone);
      c.set(x, y + 1, C.coal);
    }
  } else {
    c.fill(C.stone);
    // Flagstones in offset courses, 16 × 8 px, mortar in coal, a bone highlight on each top-left.
    for (let row = 0; row < 4; row++) {
      const off = row % 2 === 0 ? 0 : 8;
      for (let x = -off; x < TILE; x += 16) {
        c.rect(Math.max(0, x), row * 8, 1, 8, C.coal);
        c.set(x + 2, row * 8 + 1, C.ash);
        c.set(x + 3, row * 8 + 1, C.ash);
        c.set(x + 2, row * 8 + 2, C.ash);
        if (roll() < 0.5) c.set(x + 9 + Math.floor(roll() * 4), row * 8 + 5, C.coal);
      }
      c.rect(0, row * 8, TILE, 1, C.coal);
    }
  }
  return c;
};

/** A dark pine: three stacked tiers, a moss rim on the lit side, a trunk. */
const pine = (c: Canvas, cx: number, base: number, h: number): void => {
  c.rect(cx - 1, base - 2, 2, 3, C.brownDark);
  for (let tier = 0; tier < 3; tier++) {
    const top = base - h + tier * Math.floor(h / 4);
    const half = 3 + tier * 2;
    c.polygon(
      [
        [cx, top],
        [cx + half, top + Math.floor(h / 2.4)],
        [cx - half, top + Math.floor(h / 2.4)],
      ],
      (x, y) => (x < cx - 1 && y > top + 2 ? C.moss : C.pine),
    );
  }
};

/** Outside the clearing: dark pine forest. */
export const drawForest = (look: ForestLook): Canvas => {
  const c = tile();
  const roll = seedRolls(`grid.forest.${look}`);
  c.fill(C.ink);
  for (let i = 0; i < 70; i++) c.set(Math.floor(roll() * TILE), Math.floor(roll() * TILE), C.plum);
  const spots: readonly (readonly [number, number, number])[] =
    look === '1'
      ? [
          [8, 27, 20],
          [22, 21, 17],
          [15, 34, 18],
        ]
      : [
          [24, 28, 20],
          [9, 23, 16],
          [17, 36, 19],
        ];
  for (const [x, base, h] of spots) pine(c, x, base, h);
  for (let i = 0; i < 12; i++) c.set(Math.floor(roll() * TILE), Math.floor(roll() * TILE), C.slate);
  return c;
};

/** Outside the clearing: the ruined foundation stones of old Stanholm in the dark ground. */
export const drawRuin = (look: RuinLook): Canvas => {
  const c = tile();
  const roll = seedRolls(`grid.ruin.${look}`);
  c.fill(C.coal);
  for (let i = 0; i < 40; i++) c.set(Math.floor(roll() * TILE), Math.floor(roll() * TILE), C.ink);
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(roll() * TILE);
    const y = Math.floor(roll() * TILE);
    c.rect(x, y, 3, 1, C.moss);
  }
  const block = (x: number, y: number, w: number, h: number): void => {
    c.rect(x, y, w, h, C.stone);
    c.rect(x, y, w, 1, C.ash);
    c.rect(x, y + h - 1, w, 1, C.slate);
    c.rect(x + w - 1, y, 1, h, C.slate);
    c.rect(x, y + h, w, 1, C.ink);
  };
  if (look === '1') {
    // Fallen blocks.
    block(3, 18, 9, 6);
    block(14, 21, 7, 5);
    block(22, 9, 6, 5);
    block(6, 6, 5, 4);
  } else {
    // A broken wall footing with a gap and a jagged end.
    block(2, 17, 11, 6);
    block(18, 17, 12, 6);
    block(18, 11, 6, 6);
    block(5, 9, 5, 4);
    c.rect(24, 11, 6, 2, C.stone);
    c.set(26, 10, C.stone);
    c.set(29, 10, C.stone);
  }
  return c;
};

/**
 * A foundation outline for a piece the Hold is waiting to raise (GDD §5.1.5, ghosts On). Mostly
 * transparent so the ground shows through. `locked` is a faint dotted rectangle; `dormant` has solid
 * corner stones, because the building is already built and only waits for its ground to clear.
 */
export const drawGhost = (look: GhostLook): Canvas => {
  const c = tile();
  const lo = 3;
  const hi = TILE - 4;
  const dot = (x: number, y: number): void => {
    c.set(x, y, C.bone);
    c.set(x, y + 1, C.coal);
  };
  for (let i = lo; i <= hi; i += look === 'locked' ? 4 : 3) {
    dot(i, lo);
    dot(i, hi);
    dot(lo, i);
    dot(hi, i);
  }
  if (look === 'dormant') {
    for (const [x, y, dx, dy] of [
      [lo, lo, 1, 1],
      [hi, lo, -1, 1],
      [lo, hi, 1, -1],
      [hi, hi, -1, -1],
    ] as const) {
      for (let k = 0; k < 4; k++) {
        c.set(x + dx * k, y, C.bone);
        c.set(x, y + dy * k, C.bone);
      }
      c.set(x + dx, y + dy, C.ash);
    }
  }
  return c;
};

/**
 * The strip above (north: the Fell Breach, where the dark comes down) or below (south: the Lowland
 * Gate, where the road comes up) the grid. 256 × 16, drawn on a 256 canvas and cropped.
 */
export const drawStrip = (edge: StripEdge): Canvas => {
  const c = new Canvas(STRIP_W);
  const roll = seedRolls(`grid.strip.${edge}`);
  if (edge === 'north') {
    c.rect(0, 0, STRIP_W, STRIP_H, C.ink);
    // A ridge of the fells, two overlapping ranges, dusk mist along the top.
    for (let x = 0; x < STRIP_W; x++) {
      const far = 6 + Math.round(3 * Math.sin(x / 11) + 2 * Math.sin(x / 4.3));
      const near = 9 + Math.round(2 * Math.sin(x / 7 + 1) + Math.sin(x / 2.7));
      c.rect(x, far, 1, STRIP_H - far, C.violet);
      c.rect(x, near, 1, STRIP_H - near, C.plum);
      if (x % 2 === 0) c.set(x, far, C.dusk);
    }
    for (let x = 0; x < STRIP_W; x++) {
      c.set(x, 0, (x + roll() * 3) % 4 < 2 ? C.night : C.plum);
      if (x % 3 === 0) c.set(x, 1, C.night);
    }
    // Pines along the foot, against the grid's first row.
    for (let x = 4; x < STRIP_W; x += 9 + Math.floor(roll() * 4)) {
      const h = 6 + Math.floor(roll() * 3);
      c.polygon(
        [
          [x, STRIP_H - h],
          [x + 3, STRIP_H - 1],
          [x - 3, STRIP_H - 1],
        ],
        C.pine,
      );
    }
    for (let x = 0; x < STRIP_W; x++) c.set(x, STRIP_H - 1, C.ink);
  } else {
    c.rect(0, 0, STRIP_W, STRIP_H, C.moss);
    for (let i = 0; i < 90; i++)
      c.set(Math.floor(roll() * STRIP_W), 2 + Math.floor(roll() * 12), C.grass);
    // The road comes up from the south and meets the Hold's gate gap in the low wall.
    const mid = STRIP_W / 2;
    for (let y = 0; y < STRIP_H; y++) {
      const half = 10 + Math.floor(y / 3);
      c.rect(mid - half, y, half * 2, 1, C.sand);
      c.set(mid - half, y, C.clay);
      c.set(mid + half - 1, y, C.clay);
      if (y % 4 === 1) c.set(mid - 3, y, C.clay);
      if (y % 4 === 3) c.set(mid + 3, y, C.clay);
    }
    // A low field wall either side of the gap, with a post at each end of the gap.
    for (const [from, to] of [
      [0, mid - 16],
      [mid + 16, STRIP_W],
    ] as const) {
      c.rect(from, 0, to - from, 5, C.stone);
      c.rect(from, 0, to - from, 1, C.ash);
      c.rect(from, 4, to - from, 1, C.coal);
      for (let x = from; x < to; x += 8) c.rect(x, 1, 1, 3, C.coal);
    }
    for (const x of [mid - 17, mid + 14]) {
      c.rect(x, 0, 3, 7, C.bone);
      c.rect(x, 0, 3, 1, C.frost);
      c.rect(x + 2, 1, 1, 6, C.ash);
    }
  }
  return c;
};

export const drawStripPng = (edge: StripEdge): Buffer => drawStrip(edge).toPng(STRIP_H);
