// v1.9 (plan T19.6, D635): Option B chamfered-corner portraits (64 × 64 px) in 100% Zughy-32
// palette for The Thorn-Stag (#01) and The Beacon-Bane (#02).
import { C, Canvas } from './pixel';

export const V19_PORTRAIT_IDS = ['thorn-stag', 'beacon-bane'] as const;
export type V19PortraitId = (typeof V19_PORTRAIT_IDS)[number];

const SIZE = 64;

const CLIPPED_CORNERS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [63, 0],
  [62, 0],
  [63, 1],
  [0, 63],
  [1, 63],
  [0, 62],
  [63, 63],
  [62, 63],
  [63, 62],
];

/** Draws the moody v1.6 Option B dithered family backdrop inside [2..61, 2..61]. */
function drawOptionBBackdrop(c: Canvas, theme: 'forest' | 'cursed'): void {
  for (let y = 2; y < SIZE - 2; y++) {
    for (let x = 2; x < SIZE - 2; x++) {
      const dx = x - 32;
      const dy = y - 34;
      const inHalo = dx * dx + dy * dy <= 29 * 29;
      const checker = (x + y) % 2 === 0;
      const sparse = x % 2 === 0 && y % 2 === 0;

      if (theme === 'forest') {
        if (!inHalo) {
          const edge = y < 24 ? C.pine : y < 46 ? C.slate : C.violet;
          c.set(x, y, checker ? C.plum : edge);
        } else if (y < 20) {
          c.set(x, y, checker ? C.pine : C.plum);
        } else if (y < 42) {
          c.set(x, y, y % 4 === 0 && sparse ? C.slate : C.pine);
        } else {
          c.set(x, y, checker ? C.slate : C.pine);
        }
      } else {
        if (!inHalo) {
          c.set(x, y, checker ? C.plum : y < 24 || y >= 46 ? C.wine : C.slate);
        } else if (y < 20) {
          c.set(x, y, checker ? C.violet : C.plum);
        } else if (y < 42) {
          c.set(x, y, y % 4 === 0 && sparse ? C.slate : C.violet);
        } else {
          c.set(x, y, checker ? C.slate : C.plum);
        }
      }
    }
  }
}

/** Applies the exact v1.6 Option B chamfered stone/iron plaque border, bevel, and corner rivets. */
function applyOptionBFrame(c: Canvas): void {
  for (let i = 2; i < SIZE - 2; i++) {
    c.set(i, 1, C.stone);
    c.set(1, i, i <= 57 ? C.stone : C.coal);
    c.set(i, SIZE - 2, C.coal);
    c.set(SIZE - 2, i, C.coal);
    c.set(i, 0, C.ink);
    c.set(0, i, C.ink);
    c.set(i, SIZE - 1, C.ink);
    c.set(SIZE - 1, i, C.ink);
  }
  for (const [x, y] of [
    [1, 1],
    [62, 1],
    [1, 62],
    [62, 62],
  ] as const) {
    c.set(x, y, C.ink);
  }
  for (const [x, y] of [
    [3, 3],
    [60, 3],
    [3, 60],
    [60, 60],
  ] as const) {
    c.set(x, y, C.ash);
  }
  for (const [x, y] of CLIPPED_CORNERS) {
    c.set(x, y, null);
  }
}

function compositeWithOutline(fg: Canvas, dst: Canvas): void {
  const outlined = new Canvas(SIZE);
  for (let i = 0; i < fg.px.length; i++) outlined.px[i] = fg.px[i] ?? null;
  outlined.outline(C.ink);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = outlined.get(x, y);
      if (v !== null) dst.set(x, y, v);
    }
  }
}

function drawMossCluster(
  fg: Canvas,
  blobs: readonly (readonly [number, number, number, number])[],
): void {
  for (const [cx, cy, w, h] of blobs) {
    fg.ellipse(cx, cy + 1, w, h, C.pine);
  }
  for (const [cx, cy, w, h] of blobs) {
    fg.ellipse(cx, cy, w, h, (x, y) => {
      if (y < cy - h * 0.3) return (x + y) % 2 === 0 ? C.lime : C.grass;
      if (y > cy + h * 0.35) return C.pine;
      return (x * 3 + y * 5) % 4 === 0 ? C.grass : C.moss;
    });
  }
}

function drawThornStagBody(fg: Canvas): void {
  // Broad ironwood chest & shoulders sloping down into the lower corners
  fg.polygon(
    [
      [4, 61],
      [6, 48],
      [14, 41],
      [25, 36],
      [41, 35],
      [53, 42],
      [60, 52],
      [60, 61],
    ],
    (x, y) => {
      if (x < 16 && y < 56) return C.clay;
      if (x < 27) return C.rust;
      if (x > 46 || y > 55) return C.brownDark;
      return C.brown;
    },
  );
  // Sculpted curved ironwood bark plates across chest & shoulder
  fg.polygon(
    [
      [9, 51],
      [17, 43],
      [26, 45],
      [24, 60],
      [8, 60],
    ],
    (x, y) => (x < 15 ? C.clay : x < 21 ? C.rust : y > 53 ? C.brownDark : C.brown),
  );
  // Muscular arched neck rising seamlessly into the cranium
  fg.polygon(
    [
      [20, 31],
      [35, 22],
      [43, 35],
      [38, 49],
      [22, 46],
    ],
    (x, y) => (x < 27 ? C.clay : x < 34 ? C.rust : y > 41 ? C.brownDark : C.brown),
  );
  // Bark grain fissures down neck and chest
  for (const [x0, y0, x1, y1] of [
    [13, 47, 11, 59],
    [19, 46, 18, 60],
    [25, 34, 25, 46],
    [26, 46, 27, 60],
    [33, 30, 36, 52],
    [41, 38, 46, 58],
  ] as const) {
    fg.line(x0, y0, x1, y1, C.ink, 1);
    fg.line(x0 - 1, y0, x1 - 1, y1, C.rust, 1);
  }
  // Irregular creeping moss clusters hugging the shoulder ridge, back crest, and collar seam
  drawMossCluster(fg, [
    [12, 43, 3.2, 1.8],
    [16, 42, 2.5, 1.6],
    [10, 45, 2, 1.4],
  ]);
  drawMossCluster(fg, [
    [41, 37, 4, 2.2],
    [46, 40, 3.5, 2],
    [50, 43, 3, 1.8],
    [53, 46, 2.5, 1.5],
  ]);
  drawMossCluster(fg, [
    [27, 51, 3.5, 1.6],
    [31, 53, 3, 1.5],
    [24, 54, 2.2, 1.4],
  ]);
}

function drawThornStagHeadAndAntlers(fg: Canvas): void {
  // Sweeping crown of boundary-thorn antlers (kept cleanly inside x = 5..58, y = 4..20)
  const beams: readonly (readonly [number, number, number, number, number])[] = [
    // Left majestic curved rack
    [26, 20, 19, 14, 2],
    [19, 14, 11, 9, 2],
    [11, 9, 7, 5, 1],
    [19, 14, 18, 6, 1],
    [14, 11, 13, 4, 1],
    [10, 9, 6, 12, 1],
    // Right majestic curved rack
    [36, 20, 44, 14, 2],
    [44, 14, 53, 9, 2],
    [53, 9, 57, 5, 1],
    [42, 14, 42, 5, 1],
    [48, 11, 50, 4, 1],
    [52, 9, 57, 13, 1],
  ];
  for (const [x0, y0, x1, y1, w] of beams) {
    fg.line(x0, y0, x1, y1, C.brown, w);
    fg.line(x0, y0 - 1, x1, y1 - 1, x0 < 32 ? C.clay : C.rust, 1);
  }
  // Pale weathered bone antler tips
  for (const [tx, ty] of [
    [7, 5],
    [18, 6],
    [13, 4],
    [6, 12],
    [57, 5],
    [42, 5],
    [50, 4],
    [57, 13],
  ] as const) {
    fg.set(tx, ty, C.cream);
    fg.set(tx + (tx < 32 ? 1 : -1), ty + 1, C.bone);
  }
  // Sharp boundary thorns bristling along the beams
  for (const [sx, sy, dx, dy] of [
    [22, 17, -2, -2],
    [16, 13, -1, 3],
    [40, 17, 2, -2],
    [47, 13, 1, 3],
  ] as const) {
    fg.line(sx, sy, sx + dx, sy + dy, C.ink, 1);
    fg.set(sx + dx, sy + dy, C.bone);
  }
  // Coiling boundary briar vines & scarlet thorn-buds around the antler crown
  fg.line(12, 10, 24, 18, C.moss, 1);
  fg.line(24, 18, 38, 18, C.pine, 1);
  fg.line(38, 18, 51, 10, C.moss, 1);
  for (const [lx, ly] of [
    [15, 11],
    [20, 15],
    [24, 17],
    [38, 17],
    [44, 14],
    [49, 11],
  ] as const) {
    fg.rect(lx, ly, 2, 2, C.grass);
    fg.set(lx, ly, C.lime);
  }
  for (const [bx, by] of [
    [17, 12],
    [26, 17],
    [37, 17],
    [47, 12],
  ] as const) {
    fg.set(bx, by, C.red);
  }

  // Swept stag ears
  fg.polygon(
    [
      [35, 22],
      [47, 17],
      [49, 20],
      [38, 25],
    ],
    C.brownDark,
  );
  fg.line(37, 22, 46, 18, C.ash, 1);
  fg.polygon(
    [
      [25, 20],
      [21, 13],
      [24, 13],
      [28, 19],
    ],
    C.brown,
  );

  // Sculpted 3/4 stag head & weathered pale-bark skull/muzzle (arched brow crown, curved shading)
  fg.polygon(
    [
      [25, 17],
      [34, 17],
      [38, 21],
      [39, 28],
      [33, 37],
      [22, 37],
      [12, 33],
      [11, 29],
      [19, 22],
    ],
    (x, y) => {
      const ridge = (x - 12) * 0.45 + 28 - y;
      const distBack = (x - 24) * 0.65 + (y - 22) * 0.35;
      if (ridge > 2 && distBack < 6.5) return y < 24 ? C.bone : C.ash;
      if (ridge > -1 && distBack < 9.5) return C.stone;
      if (distBack > 12 || y > 33) return C.brownDark;
      return y < 26 ? C.brown : C.rust;
    },
  );
  // Crisp highlight down nose bridge and craggy orbital brow
  fg.line(13, 29, 26, 20, C.bone, 2);
  fg.line(15, 28, 25, 21, C.cream, 1);
  fg.line(21, 22, 33, 23, C.ash, 1);
  fg.line(20, 24, 34, 24, C.ink, 1);
  // Dark cleft nostril, stern lower jaw & cheekbone fissure
  fg.rect(11, 30, 3, 2, C.ink);
  fg.line(13, 34, 24, 35, C.ink, 1);
  fg.line(17, 36, 26, 36, C.brownDark, 1);
  fg.line(28, 27, 32, 35, C.ink, 1);

  // Fierce deep-set green spirit eye beneath heavy brow ridge (with subtle far-eye rim)
  fg.rect(22, 25, 5, 3, C.ink);
  fg.set(23, 26, C.grass);
  fg.set(24, 26, C.lime);
  fg.set(25, 26, C.cream);
  fg.set(16, 24, C.ink);
  fg.set(16, 25, C.lime);
}

function drawThornStagPortrait(): Canvas {
  const c = new Canvas(SIZE);
  drawOptionBBackdrop(c, 'forest');
  const fg = new Canvas(SIZE);
  drawThornStagBody(fg);
  drawThornStagHeadAndAntlers(fg);
  compositeWithOutline(fg, c);
  applyOptionBFrame(c);
  return c;
}

function drawBeaconBaneFlames(fg: Canvas, dst: Canvas): void {
  // Subtle ember sparks drifting in the cursed air
  for (const [ex, ey, col] of [
    [11, 10, C.orange],
    [52, 11, C.gold],
    [13, 18, C.red],
    [54, 20, C.orange],
    [9, 27, C.blood],
  ] as const) {
    dst.set(ex, ey, col);
  }
  // Swirling asymmetric signal-fire roaring out of the iron brazier crown
  fg.polygon(
    [
      [15, 20],
      [14, 12],
      [19, 15],
      [21, 7],
      [26, 12],
      [29, 4],
      [34, 11],
      [39, 6],
      [42, 14],
      [47, 10],
      [48, 20],
    ],
    (x, y) => {
      if (y < 9 || x < 17 || x > 44) return C.red;
      if (y < 14) return C.orange;
      if (x >= 23 && x <= 38 && y >= 15) return C.cream;
      return C.gold;
    },
  );
  fg.ellipse(30, 17, 8, 4, (x, y) => (y > 16 && Math.abs(x - 30) < 5 ? C.cream : C.gold));
}

function drawBeaconBaneBody(fg: Canvas): void {
  // Three articulated splayed charred wrought-iron legs descending into the lower corners
  const legDefs: readonly (readonly [number, number, number, number, number, number, boolean])[] = [
    // [hipX, hipY, kneeX, kneeY, footX, footY, litLeft]
    [18, 41, 14, 51, 10, 61, true],
    [31, 44, 31, 53, 30, 61, true],
    [45, 40, 50, 50, 54, 61, false],
  ];
  for (const [hx, hy, kx, ky, fx, fy, litLeft] of legDefs) {
    fg.line(hx, hy, kx, ky, C.coal, 5);
    fg.line(kx, ky, fx, fy, C.coal, 4);
    fg.line(hx, hy, kx, ky, litLeft ? C.slate : C.coal, 2);
    fg.line(kx, ky, fx, fy, litLeft ? C.slate : C.coal, 2);
    if (litLeft) {
      fg.line(hx - 1, hy, kx - 1, ky, C.ash, 1);
      fg.line(kx - 1, ky, fx - 1, fy, C.ash, 1);
    } else {
      fg.line(hx - 1, hy, kx - 1, ky, C.rust, 1);
    }
    // Riveted knee joint band aligned onto leg shaft
    fg.ellipse(kx, ky, 2.2, 2, C.brownDark);
    fg.set(kx - 1, ky, litLeft ? C.rust : C.orange);
  }

  // Curved 3/4 cylindrical iron fire-cage & riveted basin (bowing downward toward viewer)
  fg.polygon(
    [
      [12, 19],
      [51, 19],
      [50, 34],
      [42, 44],
      [21, 44],
      [13, 34],
    ],
    (x, y) => {
      const bellyCurve = 33 + Math.round(Math.sin(((x - 12) / 39) * Math.PI) * 3);
      if (y >= bellyCurve) return x < 24 ? C.slate : C.coal;
      return y < 27 ? C.orange : C.red;
    },
  );
  // Inner furnace fire glow inside cage windows
  fg.rect(16, 23, 30, 10, C.red);
  fg.rect(18, 24, 24, 7, C.orange);
  fg.rect(22, 25, 13, 5, C.gold);

  // Curved iron cage bars wrapping around the 3/4 cylinder (lit left, shadowed right)
  for (const [bx, col, edge] of [
    [13, C.slate, C.ash],
    [19, C.slate, C.ash],
    [27, C.slate, C.dusk],
    [37, C.coal, C.slate],
    [45, C.coal, C.rust],
    [49, C.coal, C.ink],
  ] as const) {
    fg.rect(bx, 20, 3, 15, col);
    fg.line(bx, 20, bx, 34, edge, 1);
  }

  // Curved heavy iron collar rim with crenellated crown spikes
  for (let x = 11; x <= 51; x++) {
    const curveY = 19 + Math.round(Math.sin(((x - 11) / 40) * Math.PI) * 2);
    fg.rect(x, curveY, 1, 4, x < 34 ? C.slate : C.coal);
    fg.set(x, curveY, x < 30 ? C.ash : C.stone);
    fg.set(x, curveY + 3, C.ink);
  }
  for (const tx of [13, 19, 26, 34, 42, 48]) {
    const curveY = 19 + Math.round(Math.sin(((tx - 11) / 40) * Math.PI) * 2);
    fg.rect(tx, curveY - 2, 3, 2, tx < 34 ? C.slate : C.coal);
    fg.set(tx, curveY - 2, tx < 34 ? C.ash : C.stone);
  }

  // Twin fierce angled iron-hooded furnace eyes in the front-left cage windows
  for (const [ex, ey] of [
    [17, 26],
    [30, 26],
  ] as const) {
    fg.rect(ex - 1, ey - 1, 7, 5, C.ink);
    fg.rect(ex, ey, 5, 3, C.red);
    fg.rect(ex + 1, ey, 3, 2, C.orange);
    fg.rect(ex + 1, ey, 2, 2, C.gold);
    fg.set(ex + 1, ey, C.cream);
  }

  // Curved riveted lower iron belly
  for (let x = 13; x <= 50; x++) {
    const topY = 33 + Math.round(Math.sin(((x - 13) / 37) * Math.PI) * 3);
    const botY = 41 + Math.round(Math.sin(((x - 13) / 37) * Math.PI) * 4);
    for (let y = topY; y <= botY; y++) {
      const col =
        y === topY
          ? x < 32
            ? C.ash
            : C.stone
          : y >= botY - 1
            ? C.ink
            : x < 23
              ? C.slate
              : x > 38
                ? C.coal
                : C.slate;
      fg.set(x, y, col);
    }
    if ((x - 15) % 6 === 0) fg.set(x, topY + 2, C.ash);
    if ((x - 15) % 6 === 3) fg.set(x, topY + 4, C.brownDark);
  }

  // Viscous glossy black pitch streams oozing over the iron rim & tapering into dark drops
  const pitchDrips: readonly (readonly [number, number, number])[] = [
    [17, 34, 49],
    [23, 37, 45],
    [28, 36, 54],
    [35, 37, 48],
    [42, 35, 51],
    [47, 34, 44],
  ];
  for (const [px, topY, botY] of pitchDrips) {
    fg.ellipse(px + 1, topY + 1, 2, 1.5, C.ink);
    for (let y = topY; y <= botY; y++) {
      const wobble = y % 5 === 0 ? 1 : 0;
      const w = y === botY ? 1 : y > botY - 3 ? 3 : 2;
      fg.rect(px + wobble, y, w, 1, C.ink);
      if (w >= 2) fg.set(px + wobble + 1, y, y > botY - 4 ? C.wine : C.plum);
    }
    // Subtle ember glint inside the dark pitch bead
    fg.set(px + 1, botY - 2, C.red);
    fg.set(px + 1, botY - 1, C.orange);
  }
}

function drawBeaconBanePortrait(): Canvas {
  const c = new Canvas(SIZE);
  drawOptionBBackdrop(c, 'cursed');
  const fg = new Canvas(SIZE);
  drawBeaconBaneFlames(fg, c);
  drawBeaconBaneBody(fg);
  compositeWithOutline(fg, c);
  applyOptionBFrame(c);
  return c;
}

/** Draws an Option B 64 × 64 px Zughy-32 portrait for a v1.9 Great Beast. */
export function drawPortraitV19(id: V19PortraitId): Canvas {
  return id === 'thorn-stag' ? drawThornStagPortrait() : drawBeaconBanePortrait();
}
