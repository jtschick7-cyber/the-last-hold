// GDD §9.12 (D265): the part templates the 32 px battle sprites are built from. Every sprite is
// drawn facing left (monsters); hunters are drawn the same way and mirrored by the sprite sheet
// writer. Parts are small shapes in palette colors, layered back to front; a family chooses its
// template and colors, a species its head, its extras and its one telling feature.
import { C, Canvas } from './pixel';

export type Ramp = readonly [light: string, mid: string, dark: string];

/** Light from the top: the upper third in the light color, the lower third in the dark. */
export const shaded = (
  c: Canvas,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ramp: Ramp,
): void => {
  c.ellipse(cx, cy, rx, ry, (_x, y) =>
    y < cy - ry * 0.35 ? ramp[0] : y > cy + ry * 0.45 ? ramp[2] : ramp[1],
  );
};

export type HeadKind = 'wolf' | 'horned' | 'horse';

export interface QuadrupedOptions {
  readonly fur: Ramp;
  readonly eye: string;
  readonly head: HeadKind;
  readonly mane?: Ramp;
  readonly belly?: string;
}

/** A four-legged body: the beasts, the river-horse. */
export const quadruped = (c: Canvas, o: QuadrupedOptions): void => {
  const [light, mid, dark] = o.fur;
  // Far legs first, in the dark.
  c.rect(11, 22, 2, 8, dark);
  c.rect(22, 22, 2, 8, dark);
  shaded(c, 17, 18, 9, 5, o.fur);
  if (o.belly) c.rect(11, 21, 12, 2, o.belly);
  // Near legs.
  c.rect(9, 22, 2, 8, mid);
  c.rect(8, 28, 3, 2, dark);
  c.rect(20, 22, 2, 8, mid);
  c.rect(19, 28, 3, 2, dark);
  // Neck and head.
  c.rect(9, 12, 4, 8, mid);
  if (o.head === 'horse') {
    shaded(c, 6, 15, 3, 4, o.fur);
    c.rect(2, 16, 4, 4, light);
    c.set(3, 18, C.ink);
    c.rect(7, 10, 2, 3, mid);
  } else {
    shaded(c, 8, 14, 4, 3.5, o.fur);
    c.rect(3, 14, 5, 4, light);
    c.set(3, 14, C.ink);
    c.set(5, 18, C.frost);
    c.set(7, 18, C.frost);
    if (o.head === 'wolf') {
      c.rect(8, 9, 2, 3, dark);
      c.rect(11, 10, 2, 2, dark);
    } else {
      // Horns sweeping up and forward.
      c.line(8, 11, 6, 6, C.bone, 1);
      c.line(12, 11, 13, 6, C.bone, 1);
      c.set(5, 5, C.frost);
      c.set(13, 5, C.frost);
    }
  }
  c.set(6, 14, o.eye);
  c.set(7, 14, o.eye);
  if (o.mane) {
    for (let x = 10; x < 24; x++) c.set(x, 12 + Math.floor((x - 10) / 6), o.mane[x % 2 ? 0 : 2]);
    c.rect(9, 10, 3, 5, o.mane[1]);
  }
  // Tail.
  c.line(25, 15, 30, 18, mid, 2);
};

export type ItemKind = 'none' | 'scythe' | 'staff' | 'sword' | 'spindle' | 'branch';
export type HairKind = 'none' | 'long' | 'hood' | 'horns' | 'antlers' | 'helm';

export interface BipedOptions {
  readonly cloth: Ramp;
  readonly skin: Ramp;
  readonly eye: string;
  /** Torso width and height; the legs fill what is left to the ground. */
  readonly width?: number;
  readonly height?: number;
  /** How far the head sits forward (left) of the torso: a hunch. */
  readonly stoop?: number;
  readonly hair?: HairKind;
  readonly hairRamp?: Ramp;
  /** A skirt or tail to the ground instead of two legs. */
  readonly skirt?: boolean;
  readonly item?: ItemKind;
  readonly itemRamp?: Ramp;
  /** Lifts the whole figure off the ground (a drifting thing). */
  readonly lift?: number;
}

/** A two-armed figure: the dead, the spirits, the hunters. */
export const biped = (c: Canvas, o: BipedOptions): void => {
  const w = o.width ?? 10;
  const h = o.height ?? 11;
  const lift = o.lift ?? 0;
  const stoop = o.stoop ?? 0;
  const [cl, cm, cd] = o.cloth;
  const left = 16 - Math.floor(w / 2);
  const topY = 12 + (11 - h) - lift;
  const feetY = 29 - lift;
  const hairRamp = o.hairRamp ?? [C.ash, C.stone, C.coal];
  // Back arm and legs.
  c.rect(left + w, topY + 1, 2, 8, cd);
  if (o.skirt) {
    for (let y = topY + h; y <= feetY; y++) {
      const spread = Math.floor((y - topY - h) / 3);
      c.rect(left - spread, y, w + spread * 2, 1, y > feetY - 2 ? cd : cm);
    }
  } else {
    c.rect(left + 1, topY + h, 3, feetY - topY - h + 1, cd);
    c.rect(left + w - 4, topY + h, 3, feetY - topY - h + 1, cm);
    c.rect(left, feetY - 1, 4, 2, C.ink);
    c.rect(left + w - 5, feetY - 1, 4, 2, C.ink);
  }
  // Torso.
  c.rect(left, topY, w, h, cm);
  c.rect(left, topY, w, 2, cl);
  c.rect(left, topY + h - 2, w, 2, cd);
  // Head.
  const hx = 16 - stoop;
  const hy = topY - 4;
  c.ellipse(hx, hy, 4, 4, (_x, y) => (y < hy - 1 ? o.skin[0] : y > hy + 2 ? o.skin[2] : o.skin[1]));
  // Front arm, reaching forward and down.
  c.line(left + 1, topY + 2, left - 3, topY + 8, cm, 2);
  c.rect(left - 4, topY + 8, 2, 2, o.skin[1]);
  const hand: [number, number] = [left - 4, topY + 8];
  // Hair, hoods and the like.
  const hair = o.hair ?? 'none';
  if (hair === 'long') {
    c.rect(hx - 4, hy - 4, 9, 4, hairRamp[1]);
    c.rect(hx - 4, hy, 2, 9, hairRamp[1]);
    c.rect(hx + 3, hy, 2, 9, hairRamp[2]);
    c.rect(hx - 3, hy - 4, 7, 1, hairRamp[0]);
  } else if (hair === 'hood') {
    c.ellipse(hx, hy - 1, 5, 5, hairRamp[1]);
    c.ellipse(hx - 1, hy + 1, 3, 3, o.skin[2]);
  } else if (hair === 'horns') {
    c.rect(hx - 4, hy - 5, 9, 2, hairRamp[1]);
    c.line(hx - 4, hy - 4, hx - 6, hy - 8, C.bone, 1);
    c.line(hx + 4, hy - 4, hx + 6, hy - 8, C.bone, 1);
  } else if (hair === 'antlers') {
    for (const s of [-1, 1]) {
      c.line(hx + s * 3, hy - 4, hx + s * 5, hy - 9, hairRamp[1], 1);
      c.line(hx + s * 4, hy - 7, hx + s * 7, hy - 7, hairRamp[1], 1);
      c.line(hx + s * 5, hy - 9, hx + s * 7, hy - 10, hairRamp[1], 1);
    }
  } else if (hair === 'helm') {
    c.rect(hx - 4, hy - 4, 9, 5, hairRamp[1]);
    c.rect(hx - 4, hy - 4, 9, 1, hairRamp[0]);
    c.rect(hx - 1, hy - 3, 2, 8, hairRamp[2]);
  }
  // Eyes.
  c.set(hx - 2, hy, o.eye);
  c.set(hx + 1, hy, o.eye);
  // What it carries.
  const [il, im, id] = o.itemRamp ?? [C.bone, C.brown, C.brownDark];
  const [hx0, hy0] = hand;
  switch (o.item ?? 'none') {
    case 'scythe':
      c.line(hx0 - 1, hy0 + 8, hx0 + 1, hy0 - 14, im, 1);
      c.line(hx0 + 1, hy0 - 14, hx0 - 6, hy0 - 14, il, 1);
      c.line(hx0 - 6, hy0 - 14, hx0 - 8, hy0 - 11, il, 1);
      break;
    case 'staff':
      c.line(hx0 - 1, hy0 + 8, hx0 - 1, hy0 - 15, im, 1);
      c.rect(hx0 - 2, hy0 - 17, 3, 3, il);
      break;
    case 'sword':
      c.line(hx0, hy0, hx0 - 1, hy0 - 9, il, 1);
      c.rect(hx0 - 2, hy0, 4, 1, id);
      break;
    case 'spindle':
      c.line(hx0, hy0 + 1, hx0 - 2, hy0 - 6, im, 1);
      c.ellipse(hx0 - 1, hy0 - 3, 2, 1.5, il);
      break;
    case 'branch':
      c.line(hx0, hy0 + 3, hx0 - 2, hy0 - 10, im, 1);
      c.line(hx0 - 2, hy0 - 6, hx0 - 5, hy0 - 9, im, 1);
      c.set(hx0 - 5, hy0 - 10, C.lime);
      c.set(hx0 - 2, hy0 - 11, C.lime);
      break;
    default:
  }
};

/** A creature drifting without legs: a long tapering body from a head, for the ghosts and the Deep. */
export const wisp = (c: Canvas, top: number, width: number, ramp: Ramp, eye: string): void => {
  for (let y = top; y <= 29; y++) {
    const t = (y - top) / (29 - top);
    const half = Math.max(1, Math.round((width / 2) * (0.35 + 0.65 * (1 - t))));
    const sway = Math.round(Math.sin(t * 5) * 2);
    c.rect(16 - half + sway, y, half * 2, 1, t < 0.3 ? ramp[0] : t < 0.7 ? ramp[1] : ramp[2]);
  }
  c.set(14, top + 4, eye);
  c.set(18, top + 4, eye);
};
