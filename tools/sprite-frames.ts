// GDD §9.12 (D265): a battle sprite is drawn once, 32 px, then its other frames are made from it:
// a 2-frame idle (the second dips the upper body one pixel), a lunge (the sprite steps four pixels
// toward its target), a hit flash (every body pixel white, the outline kept), and a downed pose
// (turned onto its side, in darker palette colors). One strip of five frames per sprite, so a
// missing frame can never happen and a redrawn base redraws everything.
import { PNG } from 'pngjs';
import { SPRITE_FRAME_NAMES, SPRITE_PX, type SpriteFrameName } from '../src/content/assets';
import { palette } from '../src/content/palette';
import { nearestIn } from './color/oklab';
import { C, Canvas } from './pixel';

export const SPRITE_SIZE = SPRITE_PX;
export const SPRITE_FRAMES = SPRITE_FRAME_NAMES;
export type SpriteFrame = SpriteFrameName;
/** Which way a sprite faces: hunters face right, monsters left (the floor plays hunters on the left). */
export type Facing = 'left' | 'right';

const BOB_ABOVE = 22;
const LUNGE = 4;
const DARKER = 0.55;
/** The rimmed downed pose (v1.0, TV.8a) dims less, so near-ink cloth keeps its colour. */
const DARKER_RIMMED = 0.85;

if (!palette) throw new Error('Choose a palette first (src/content/palette.ts).');
const nearest = nearestIn(palette.colors);

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];
const hexOf = ([r, g, b]: readonly [number, number, number]): string =>
  [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

const darker = (hex: string, factor = DARKER): string => {
  if (hex === C.ink) return hex;
  const [r, g, b] = rgb(hex);
  return hexOf(nearest([r * factor, g * factor, b * factor]));
};

const copy = (c: Canvas, f: (x: number, y: number, v: string | null) => string | null): Canvas => {
  const out = new Canvas(c.size);
  for (let y = 0; y < c.size; y++)
    for (let x = 0; x < c.size; x++) out.set(x, y, f(x, y, c.get(x, y)));
  return out;
};

const idle2 = (base: Canvas): Canvas =>
  copy(base, (x, y, v) => (y >= BOB_ABOVE ? v : y === 0 ? null : base.get(x, y - 1)));

/** Steps toward the foe, never past the frame's edge. */
const lunge = (base: Canvas, facing: Facing): Canvas => {
  let minX = base.size;
  let maxX = -1;
  for (let y = 0; y < base.size; y++)
    for (let x = 0; x < base.size; x++)
      if (base.get(x, y) !== null) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
  const step = Math.max(0, Math.min(LUNGE, facing === 'left' ? minX : base.size - 1 - maxX));
  const d = facing === 'left' ? -step : step;
  return copy(base, (x, y) => base.get(x - d, y));
};

/** The picture turned to face the other way. */
export const mirror = (base: Canvas): Canvas =>
  copy(base, (x, y) => base.get(base.size - 1 - x, y));

const hit = (base: Canvas): Canvas =>
  copy(base, (_x, _y, v) => (v === null || v === C.ink ? v : C.frost));

/**
 * v1.0 (TV.8a): dimming turns a very dark body to ink, which vanishes against a dark ground and
 * leaves only its pale parts. A sprite that sets `rimmedDowned` (its drawing knows its cloth is
 * that dark) dims less and takes a slate rim on its edge. Every other sprite is unchanged.
 */
/** On its side on the ground, head away from the foe, dimmed. */
const downed = (base: Canvas, facing: Facing, rim: boolean): Canvas => {
  const n = base.size;
  let minX = n;
  let maxX = -1;
  let minY = n;
  let maxY = -1;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (base.get(x, y) !== null) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new Canvas(n);
  // After the turn the sprite is h wide and w tall, sitting on the ground line, centred.
  const left = Math.floor((n - h) / 2);
  const top = n - 1 - w;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = base.get(minX + x, minY + y);
      if (v === null) continue;
      // Clockwise (head to the right) for sprites that face left, counter-clockwise otherwise.
      const [nx, ny] = facing === 'left' ? [h - 1 - y, x] : [y, w - 1 - x];
      out.set(left + nx, top + ny, darker(v, rim ? DARKER_RIMMED : DARKER));
    }
  if (rim) {
    const body = copy(out, (x, y, v) => v);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = body.get(x, y);
        if (v === null || v !== C.ink) continue;
        // An ink pixel with ink or empty space on every side is outline: keep it. One that touches
        // a lighter body pixel and open space above or beside it is the cloth's edge: lift it.
        const open = [body.get(x, y - 1), body.get(x - 1, y), body.get(x + 1, y)].some(
          (q) => q === null,
        );
        const lit = [body.get(x, y + 1), body.get(x - 1, y), body.get(x + 1, y)].some(
          (q) => q !== null && q !== C.ink,
        );
        if (open && lit) out.set(x, y, C.slate);
      }
  }
  return out;
};

/** Moves the whole picture sideways by `d` (pixels past the frame are lost; callers keep room). */
const shifted = (base: Canvas, d: number): Canvas => copy(base, (x, y) => base.get(x - d, y));

/**
 * Leaves room to lunge: a picture that reaches the frame's edge on the side it faces steps back
 * far enough that the lunge can happen whole.
 */
const settled = (base: Canvas, facing: Facing): Canvas => {
  let minX = base.size;
  let maxX = -1;
  for (let y = 0; y < base.size; y++)
    for (let x = 0; x < base.size; x++)
      if (base.get(x, y) !== null) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
  const ahead = facing === 'left' ? minX : base.size - 1 - maxX;
  const behind = facing === 'left' ? base.size - 1 - maxX : minX;
  const back = Math.min(Math.max(0, LUNGE - ahead), behind);
  return back === 0 ? base : shifted(base, facing === 'left' ? back : -back);
};

export const framesOf = (drawn: Canvas, facing: Facing): Record<SpriteFrame, Canvas> => {
  const base = settled(drawn, facing);
  return {
    idle: base,
    idle2: idle2(base),
    lunge: lunge(base, facing),
    hit: hit(base),
    downed: downed(base, facing, drawn.rimmedDowned),
  };
};

/** One PNG, the frames side by side in SPRITE_FRAMES order. */
export const stripPng = (frames: Record<SpriteFrame, Canvas>): Buffer => {
  const png = new PNG({ width: SPRITE_SIZE * SPRITE_FRAMES.length, height: SPRITE_SIZE });
  SPRITE_FRAMES.forEach((name, i) => {
    const f = frames[name];
    for (let y = 0; y < SPRITE_SIZE; y++)
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const hex = f.get(x, y);
        if (hex === null) continue;
        const o = (y * png.width + i * SPRITE_SIZE + x) * 4;
        const [r, g, b] = rgb(hex);
        png.data[o] = r;
        png.data[o + 1] = g;
        png.data[o + 2] = b;
        png.data[o + 3] = 255;
      }
  });
  return PNG.sync.write(png);
};
