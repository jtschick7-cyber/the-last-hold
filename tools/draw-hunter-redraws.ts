// v1.0 (plan TV.9a, D475, D492): per-hunter redraws of the portraits the owner marked. A redraw is
// keyed by the hunter's own `portrait` object, so the shared parts in draw-hunter.ts stay as they
// are and every hunter not listed here is drawn exactly as before (the Keep hash test checks it).
import { hunters, type PortraitSpec } from '../src/content/hunters';
import { C, type Canvas } from './pixel';

const CX = 32;
const CY = 26;

export interface HunterRedraw {
  /** Changes to the spec before the shared parts are drawn (a beard the redraw draws itself, say). */
  readonly spec?: Partial<PortraitSpec>;
  /** Replaces the shared weapon silhouette (drawn behind the body). */
  readonly weapon?: (c: Canvas) => void;
  /** Drawn last, over the head and shoulders. */
  readonly after?: (c: Canvas) => void;
}

type Pt = readonly [number, number];
type Ramp = readonly [string, string, string];

/** A polygon with a one-pixel dark outline around it. */
const solid = (
  c: Canvas,
  pts: readonly Pt[],
  fill: string | ((x: number, y: number) => string),
): void => {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const grown = pts.map(([x, y]): Pt => {
    const d = Math.hypot(x - cx, y - cy) || 1;
    return [x + ((x - cx) / d) * 1.4, y + ((y - cy) / d) * 1.4];
  });
  c.polygon(grown, C.ink);
  c.polygon(pts, fill);
};

const pole = (c: Canvas, pts: readonly Pt[], color: string, w = 2): void => {
  pts.forEach(([x0, y0], i) => {
    const n = pts[i + 1];
    if (!n) return;
    c.line(x0, y0, n[0], n[1], C.ink, w + 2);
  });
  pts.forEach(([x0, y0], i) => {
    const n = pts[i + 1];
    if (!n) return;
    c.line(x0 + 1, y0, n[0] + 1, n[1], color, w);
  });
};

/**
 * A beard that comes down over the chin: it follows the cheeks, covers the jaw and hangs `drop`
 * pixels below it, narrowing to a point. The mouth stays a dark slit in it.
 */
const beard = (c: Canvas, rx: number, ry: number, hair: Ramp, drop: number): void => {
  const top = CY + 6;
  const jaw = CY + ry;
  const end = jaw + drop;
  const width = (y: number): number =>
    y <= jaw ? rx - 1 - (y - top) * 0.05 : Math.max(2, (rx - 2) * (1 - (y - jaw) / (drop + 2)));
  for (let pass = 0; pass < 2; pass++)
    for (let y = top - (pass === 0 ? 1 : 0); y <= end + (pass === 0 ? 1 : 0); y++) {
      const w = width(Math.min(y, end)) + (pass === 0 ? 1 : 0);
      for (let x = Math.ceil(CX - w); x <= CX + w; x++) {
        if (pass === 0) c.set(x, y, C.ink);
        else {
          const side = (x - CX) / Math.max(1, w);
          const strand = (x + Math.floor(y / 4)) % 4 === 0;
          c.set(x, y, side > 0.45 ? hair[2] : strand ? hair[2] : side < -0.4 ? hair[0] : hair[1]);
        }
      }
    }
  c.rect(CX - 3, CY + 9, 7, 1, C.ink);
  c.rect(CX - 3, CY + 8, 7, 1, hair[0]);
};

/** Two thin braids hanging from the beard, tied off with a leather thong. */
const beardBraids = (c: Canvas, y0: number, hair: Ramp): void => {
  for (const side of [-1, 1]) {
    const x = CX + side * 5;
    for (let i = 0; i < 5; i++) {
      c.ellipse(x, y0 + i * 2.6, 2.6, 2, C.ink);
      c.ellipse(x, y0 + i * 2.6, 1.9, 1.4, hair[i % 2 === 0 ? 0 : 1]);
    }
    c.rect(x - 1, y0 + 5 * 2.6 - 1, 3, 2, C.rust);
  }
};

/** The cap's crown covers the eyes in the shared drawing; these hunters get them back, under the brim. */
const eyes = (c: Canvas, rx: number, brow: string): void => {
  for (const side of [-1, 1]) {
    const ex = CX + side * Math.min(5.5, rx - 4);
    c.rect(ex - 2, CY - 4, 5, 1, brow);
    c.rect(ex - 1, CY - 2, 3, 2, C.ink);
    c.set(ex - 1, CY - 2, C.frost);
  }
};

const GREY: Ramp = [C.bone, C.ash, C.stone];
const WHITE: Ramp = [C.frost, C.bone, C.ash];
const BROWN: Ramp = [C.rust, C.brown, C.brownDark];

const arvidAxe = (c: Canvas): void => {
  pole(
    c,
    [
      [49, 6],
      [46, 62],
    ],
    C.brown,
    2,
  );
  // A sharp bearded axe: a short back spike, a long straight edge with pointed top and toe, and a
  // hooked beard; the edge is bright, runes are cut into the blade and the haft.
  solid(
    c,
    [
      [49, 10],
      [43, 11],
      [43, 14],
      [49, 16],
    ],
    C.coal,
  );
  solid(
    c,
    [
      [49, 5],
      [57, 3],
      [63, 1],
      [62, 12],
      [63, 23],
      [58, 31],
      [56, 24],
      [52, 19],
      [49, 18],
    ],
    (x, y) => (x > 59 ? C.frost : y > 22 ? C.stone : x > 54 ? C.ash : C.bone),
  );
  c.line(63, 1, 62, 12, C.frost, 1);
  c.line(62, 12, 63, 23, C.frost, 1);
  c.line(63, 23, 58, 31, C.ice, 1);
  for (const [x, y] of [
    [53, 9],
    [55, 11],
    [53, 13],
    [55, 15],
    [54, 12],
  ] as const)
    c.set(x, y, C.slate);
  for (let y = 33; y <= 40; y++) c.set(48.2 - (y - 33) * 0.07, y, C.dusk);
  c.set(47, 35, C.dusk);
  c.set(49, 37, C.dusk);
  c.set(47, 39, C.dusk);
};

const halvarAxe = (c: Canvas): void => {
  pole(
    c,
    [
      [50, 12],
      [46, 62],
    ],
    C.brownDark,
    3,
  );
  // A heavy charcoal-burner's axe: a thick poll, and a broad flared blade with a sharp top corner,
  // a sharp toe and a bright, worn edge; the iron is black with soot.
  solid(
    c,
    [
      [41, 9],
      [48, 9],
      [48, 19],
      [41, 19],
    ],
    C.coal,
  );
  solid(
    c,
    [
      [47, 8],
      [55, 5],
      [63, 1],
      [61, 14],
      [63, 27],
      [55, 24],
      [47, 21],
    ],
    (x, y) => (x > 60 ? C.frost : y < 9 ? C.stone : (x * 7 + y * 3) % 11 === 0 ? C.ink : C.coal),
  );
  c.line(63, 1, 61, 14, C.frost, 1);
  c.line(61, 14, 63, 27, C.frost, 1);
  c.line(56, 6, 62, 3, C.ash, 1);
  for (const [x, y] of [
    [52, 13],
    [56, 18],
    [50, 17],
    [57, 10],
  ] as const)
    c.set(x, y, C.ink);
};

const bjarnaSpear = (c: Canvas): void => {
  pole(
    c,
    [
      [52, 16],
      [47, 62],
    ],
    C.brown,
    2,
  );
  // A barbed rime-spear: a long leaf of ice with two back-swept barbs, rime on the shaft.
  solid(
    c,
    [
      [52, 1],
      [55, 8],
      [58, 16],
      [53, 14],
      [51, 17],
      [49, 14],
      [46, 17],
      [49, 8],
    ],
    (x) => (x > 53 ? C.cyan : x < 50 ? C.ice : C.frost),
  );
  c.line(52, 3, 52, 14, C.frost, 1);
  for (const [x, y] of [
    [51, 22],
    [50, 27],
    [51, 32],
    [49, 37],
  ] as const)
    c.set(x, y, C.ice);
  c.set(53, 24, C.frost);
};

const gestTorch = (c: Canvas): void => {
  pole(
    c,
    [
      [53, 24],
      [47, 62],
    ],
    C.rust,
    2,
  );
  // A pine torch: wrapped tow on the top, a big, tall flame with a flicker.
  solid(
    c,
    [
      [50, 18],
      [57, 18],
      [58, 26],
      [50, 26],
    ],
    (_x, y) => (y % 4 < 2 ? C.brownDark : C.brown),
  );
  solid(
    c,
    [
      [51, 17],
      [47, 11],
      [50, 6],
      [49, 1],
      [54, 5],
      [57, 1],
      [58, 8],
      [60, 12],
      [57, 17],
    ],
    (_x, y) => (y > 12 ? C.gold : C.orange),
  );
  c.polygon(
    [
      [52, 17],
      [50, 12],
      [53, 8],
      [56, 12],
      [55, 17],
    ],
    C.sand,
  );
  c.polygon(
    [
      [53, 16],
      [52, 13],
      [54, 10],
      [55, 13],
    ],
    C.frost,
  );
  for (const [x, y] of [
    [46, 7],
    [61, 6],
    [45, 14],
    [62, 14],
  ] as const)
    c.set(x, y, C.gold);
};

const herdisCrook = (c: Canvas): void => {
  // A shepherd's crook: a stout shaft ending in a big open hook, curling right and back.
  const hook: readonly Pt[] = [
    [52, 18],
    [52, 9],
    [54, 4],
    [58, 2],
    [62, 4],
    [62, 9],
    [59, 12],
  ];
  hook.forEach(([x0, y0], i) => {
    const n = hook[i + 1];
    if (n) c.line(x0, y0, n[0], n[1], C.ink, 5);
  });
  c.line(52, 18, 48, 62, C.ink, 5);
  hook.forEach(([x0, y0], i) => {
    const n = hook[i + 1];
    if (n) c.line(x0, y0, n[0], n[1], C.clay, 3);
  });
  c.line(52, 18, 48, 62, C.clay, 3);
  hook.forEach(([x0, y0], i) => {
    const n = hook[i + 1];
    if (n) c.line(x0 - 1, y0, n[0] - 1, n[1], C.sand, 1);
  });
  c.line(51, 18, 47, 62, C.sand, 1);
  c.line(53, 18, 49, 62, C.rust, 1);
  c.set(59, 12, C.brown);
};

const radekShovel = (c: Canvas): void => {
  // A gravedigger's spade, blade up: it tapers to a point, shod with silver along its edge.
  pole(
    c,
    [
      [52, 18],
      [47, 62],
    ],
    C.brown,
    2,
  );
  solid(
    c,
    [
      [53, 0],
      [58, 4],
      [61, 12],
      [58, 19],
      [48, 19],
      [45, 12],
      [48, 4],
    ],
    (x) => (x < 50 ? C.ash : x > 57 ? C.coal : C.stone),
  );
  c.line(48, 5, 53, 1, C.frost, 1);
  c.line(53, 1, 58, 5, C.frost, 1);
  c.line(46, 12, 48, 6, C.bone, 1);
  c.line(60, 12, 58, 6, C.bone, 1);
  c.line(53, 5, 53, 17, C.coal, 1);
  c.rect(50, 18, 6, 2, C.brownDark);
  c.set(52, 19, C.gold);
};

/** A three-strand plait that hangs from the hair at the temple, tied off with a thread. */
const plait = (
  c: Canvas,
  x0: number,
  top: number,
  end: number,
  hair: Ramp,
  tie: string,
  drift: number,
): void => {
  const bx = (y: number): number => x0 + (y - top) * drift;
  for (let y = top; y <= end; y++) {
    const w = y > end - 8 ? 2 : 3;
    for (let x = Math.round(bx(y)) - w; x <= Math.round(bx(y)) + w + 1; x++) c.set(x, y, C.ink);
  }
  for (let y = top; y <= end; y++) {
    const w = y > end - 8 ? 2 : 3;
    const phase = (y - top) % 4;
    for (let x = Math.round(bx(y)) - w + 1; x <= Math.round(bx(y)) + w; x++) {
      const diag = (x - Math.round(bx(y)) + w - 1 + phase) % 4;
      c.set(x, y, diag === 0 ? hair[2] : diag < 3 ? hair[1] : hair[0]);
    }
  }
  c.rect(Math.round(bx(end)) - 1, end - 6, 4, 2, tie);
  c.rect(Math.round(bx(end)) - 1, end + 1, 4, 3, hair[1]);
};

const radmilaFinish = (c: Canvas): void => {
  // A lock grows out of the hair at the temple and runs into a plait over the left shoulder.
  c.rect(CX - 20, CY - 3, 5, 8, C.ink);
  c.rect(CX - 19, CY - 3, 4, 7, C.brown);
  c.rect(CX - 19, CY - 3, 1, 7, C.rust);
  // A marsh-wife's shawl: wide, heavy shoulders, a green dress showing in the V, a pewter pin.
  solid(
    c,
    [
      [23, 45],
      [41, 45],
      [57, 51],
      [63, 62],
      [63, 66],
      [1, 66],
      [1, 62],
      [7, 51],
    ],
    (x, y) => (y > 60 ? C.night : x > 44 ? C.night : x < 18 ? C.dusk : C.slate),
  );
  c.polygon(
    [
      [27, 46],
      [37, 46],
      [32, 58],
    ],
    C.moss,
  );
  c.line(27, 46, 32, 58, C.ink, 1);
  c.line(37, 46, 32, 58, C.ink, 1);
  for (let x = 5; x < 62; x += 3) c.set(x, 62 + (x % 2), C.dusk);
  c.rect(CX - 1, 47, 3, 3, C.ink);
  c.set(CX, 48, C.bone);
  plait(c, CX - 19, CY + 4, 58, BROWN, C.moss, -0.02);
  // An apron over the dress, with a pocket and a silver spoon in it.
  solid(
    c,
    [
      [18, 55],
      [46, 55],
      [48, 66],
      [16, 66],
    ],
    C.bone,
  );
  c.rect(34, 59, 9, 6, C.ink);
  c.rect(35, 60, 7, 5, C.ash);
  c.line(38, 47, 38, 60, C.ink, 4);
  c.line(38, 50, 38, 60, C.frost, 2);
  c.ellipse(38, 46, 4, 5, C.ink);
  c.ellipse(38, 46, 3, 4, C.frost);
  c.ellipse(38, 47, 2, 2.5, C.bone);
};

const ragnhildFinish = (c: Canvas): void => {
  // The cap's brim hides her eyes in the shared drawing: they are drawn back, a little lower.
  for (const side of [-1, 1]) {
    const ex = CX + side * 5.5;
    c.rect(ex - 2, CY - 2, 5, 1, C.ash);
    c.rect(ex - 1, CY, 3, 2, C.ink);
    c.set(ex - 1, CY, C.frost);
  }
  // Her bone needle, pushed through the crown of her cap: both ends stick out, one with an eye.
  c.line(CX - 16, CY - 16, CX + 16, CY - 13, C.ink, 3);
  c.line(CX - 16, CY - 15, CX + 16, CY - 12, C.bone, 1);
  c.set(CX - 15, CY - 15, C.ink);
};

const sigrunFinish = (c: Canvas): void => {
  // Her hair frames the face under the band: locks down both cheeks to the jaw.
  const hair: Ramp = [C.blood, C.blood, C.brownDark];
  for (const side of [-1, 1]) {
    const x = CX + side * 13;
    c.rect(x - 1, CY - 5, 4, 17, C.ink);
    c.rect(x, CY - 5, 2, 16, hair[1]);
    c.rect(x + (side > 0 ? 1 : 0), CY - 5, 1, 16, hair[2]);
  }
  // A dark leather forge-apron: a high collar, straps over the shoulders, scorched and riveted.
  solid(
    c,
    [
      [22, 44],
      [42, 44],
      [49, 66],
      [15, 66],
    ],
    (x) => (x > 38 ? C.brownDark : C.coal),
  );
  c.line(22, 44, 14, 58, C.ink, 4);
  c.line(22, 44, 14, 58, C.brown, 2);
  c.line(42, 44, 50, 58, C.ink, 4);
  c.line(42, 44, 50, 58, C.brownDark, 2);
  c.rect(26, 52, 12, 3, C.ink);
  c.rect(27, 52, 10, 2, C.brownDark);
  for (const [x, y] of [
    [25, 46],
    [39, 46],
    [20, 60],
    [44, 60],
  ] as const)
    c.set(x, y, C.gold);
  for (const [x, y] of [
    [30, 60],
    [34, 62],
    [28, 64],
  ] as const)
    c.set(x, y, C.ink);
  // The bandaged half-hand held near her chest: a thumb, and a wrapped stump where fingers were.
  c.ellipse(41, 58, 6, 5, C.ink);
  c.ellipse(41, 58, 5, 4, C.bone);
  c.rect(38, 55, 8, 1, C.ash);
  c.rect(38, 58, 8, 1, C.ash);
  c.rect(38, 61, 8, 1, C.ash);
  c.rect(39, 56, 5, 1, C.frost);
  c.rect(35, 58, 3, 3, C.ink);
  c.rect(35, 58, 2, 2, C.sand);
};

const tomaBeard = (c: Canvas): void => {
  // A half-beard: sideburns run down both cheeks and join under the mouth in one dark band round the chin.
  const pts: readonly Pt[] = [
    [CX - 13, CY + 1],
    [CX - 9, CY + 1],
    [CX - 8, CY + 7],
    [CX + 8, CY + 7],
    [CX + 9, CY + 1],
    [CX + 13, CY + 1],
    [CX + 11, CY + 14],
    [CX + 8, CY + 18],
    [CX + 3, CY + 21],
    [CX - 3, CY + 21],
    [CX - 8, CY + 18],
    [CX - 11, CY + 14],
  ];
  solid(c, pts, (x) => (x > CX + 6 ? C.ink : C.coal));
  // Strands: dark lines of different lengths running down the chin, a few lighter ones on the left.
  for (let x = CX - 8; x <= CX + 8; x += 3)
    c.line(x, CY + 10, x + (x < CX ? 1 : -1), CY + 14 + ((x + 8) % 6), C.ink, 1);
  for (const x of [CX - 9, CX - 6]) c.line(x, CY + 8, x, CY + 12, C.stone, 1);
  c.rect(CX - 3, CY + 9, 7, 1, C.brown);
};

const tomaKettle = (c: Canvas): void => {
  // A copper kettle hung behind the shoulder: a bail, a lid, a spout and a rolled rim.
  c.line(41, 11, 49, 3, C.ink, 3);
  c.line(49, 3, 57, 11, C.ink, 3);
  c.line(41, 11, 49, 3, C.coal, 1);
  c.line(49, 3, 57, 11, C.coal, 1);
  c.line(56, 14, 62, 8, C.ink, 5);
  c.line(56, 14, 62, 8, C.clay, 3);
  c.ellipse(49, 16, 9, 8, C.ink);
  c.ellipse(49, 16, 7.5, 6.5, (x, y) => (y > 19 ? C.rust : x < 47 ? C.sand : C.clay));
  c.ellipse(49, 10, 5, 2.5, C.ink);
  c.ellipse(49, 10, 4, 1.7, C.rust);
  c.set(49, 8, C.sand);
  c.line(43, 20, 55, 20, C.brown, 1);
  c.set(46, 13, C.cream);
  c.set(47, 12, C.cream);
};

const REDRAWS: readonly [PortraitSpec, HunterRedraw][] = [
  [
    hunters.arvid.portrait,
    {
      spec: { beard: 'none' },
      weapon: arvidAxe,
      after: (c) => {
        eyes(c, 14, C.stone);
        beard(c, 14, 14, GREY, 5);
        beardBraids(c, CY + 14 + 7, GREY);
      },
    },
  ],
  [
    hunters.bjarna.portrait,
    {
      // The side braid grows out from under the hood at the temple and hangs in front of the collar.
      spec: { hair: 'short' },
      weapon: bjarnaSpear,
      after: (c) => {
        // A lock comes out from under the hood at the temple, then a real three-strand plait
        // (chevrons) hangs in front of the shoulder, tied with a blue thread.
        c.rect(CX + 12, CY - 2, 4, 7, C.sand);
        c.rect(CX + 12, CY - 2, 1, 7, C.gold);
        const bx = (y: number): number => CX + 14 + (y - CY) * 0.06;
        const top = CY + 4;
        const end = 57;
        for (let y = top; y <= end; y++) {
          const w = y > end - 8 ? 2 : 3;
          for (let x = Math.round(bx(y)) - w; x <= Math.round(bx(y)) + w + 1; x++)
            c.set(x, y, C.ink);
        }
        for (let y = top; y <= end; y++) {
          const w = y > end - 8 ? 2 : 3;
          const phase = (y - top) % 4;
          for (let x = Math.round(bx(y)) - w + 1; x <= Math.round(bx(y)) + w; x++) {
            const k = x - Math.round(bx(y)) + w - 1;
            const diag = (k + phase) % 4;
            c.set(x, y, diag === 0 ? C.clay : diag < 3 ? C.gold : C.sand);
          }
        }
        c.rect(Math.round(bx(end)) - 1, end - 6, 4, 2, C.blue);
        c.rect(Math.round(bx(end)) - 1, end + 1, 4, 3, C.gold);
        c.set(Math.round(bx(end)), end + 4, C.sand);
      },
    },
  ],
  [
    hunters['gest-tall-torch'].portrait,
    {
      spec: { beard: 'none' },
      weapon: gestTorch,
      after: (c) => {
        eyes(c, 15, C.wine);
        beard(c, 15, 15, BROWN, 9);
      },
    },
  ],
  [
    hunters.halvar.portrait,
    {
      spec: { beard: 'none' },
      weapon: halvarAxe,
      after: (c) => {
        eyes(c, 15, C.stone);
        beard(c, 15, 15, GREY, 9);
      },
    },
  ],
  [
    hunters.herdis.portrait,
    {
      // A plain headband instead of the shapeless hood, and only a few flecks of frost.
      spec: { headgear: 'band', headgearColor: 'violet', mark: undefined },
      weapon: herdisCrook,
      after: (c) => {
        for (const [x, y] of [
          [CX + 6, CY + 2],
          [CX - 8, CY + 6],
          [CX + 9, CY + 7],
        ] as const)
          c.set(x, y, C.ice);
      },
    },
  ],
  [
    hunters.ostap.portrait,
    {
      spec: { beard: 'none' },
      after: (c) => {
        eyes(c, 11, C.ash);
        beard(c, 11, 17, WHITE, 8);
      },
    },
  ],
  [
    hunters.radek.portrait,
    {
      weapon: radekShovel,
    },
  ],
  [
    hunters['radmila-of-the-reeds'].portrait,
    {
      // No shared braid (drawn by the redraw, on the left, joined to the hair), no satchel (an apron
      // pocket with a spoon instead).
      spec: { hair: 'short', weapon: 'staff' },
      weapon: () => undefined,
      after: radmilaFinish,
    },
  ],
  [
    hunters['ragnhild-eye-taker'].portrait,
    {
      // The braid floated beside the head; her white hair is under the cap.
      spec: { hair: 'short' },
      after: ragnhildFinish,
    },
  ],
  [
    hunters.sigrun.portrait,
    {
      after: sigrunFinish,
    },
  ],
  [
    hunters.toma.portrait,
    {
      spec: { beard: 'none' },
      weapon: tomaKettle,
      after: tomaBeard,
    },
  ],
];

export const HUNTER_REDRAWS: ReadonlyMap<PortraitSpec, HunterRedraw> = new Map(REDRAWS);
