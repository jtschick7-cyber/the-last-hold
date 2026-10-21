// GDD §9.12, §9.18 (plan T10.15, Q36 (a), D427): the Orders' art, drawn in code like the v0.7 icons.
// A 16 px mark for each Order and one for the Orders card, and a 160 × 64 placeholder for each
// opening scene. Palette colors by name, deterministic, outlined in ink; the owner approves them.
import type { OrderId } from '../src/content/orders';
import { C, Canvas } from './pixel';

export const ORDER_SCENE_W = 160;
export const ORDER_SCENE_H = 64;

const icon = (draw: (c: Canvas) => void): Canvas => {
  const c = new Canvas(16);
  draw(c);
  c.outline(C.ink);
  return c;
};

/** The Orders card's mark: an empty high-backed chair, the seat to be filled. */
export const drawOrdersIcon = (): Canvas =>
  icon((c) => {
    c.rect(4, 1, 2, 12, C.brown);
    c.rect(4, 1, 8, 2, C.clay);
    c.rect(4, 4, 7, 1, C.rust);
    c.rect(4, 8, 8, 2, C.clay);
    c.rect(11, 8, 1, 5, C.brown);
    c.rect(4, 10, 1, 3, C.brownDark);
    c.set(5, 8, C.sand);
  });

const MARKS: Record<OrderId, (c: Canvas) => void> = {
  // The Thanes' Moot: a gate arch over a long table, the two ends bare.
  moot: (c) => {
    c.ellipse(7.5, 6, 6, 5, C.stone);
    c.ellipse(7.5, 7, 3.5, 4, C.ink);
    c.rect(1, 6, 14, 1, C.stone);
    c.rect(2, 4, 3, 1, C.ash);
    c.rect(1, 10, 14, 2, C.brown);
    c.rect(1, 10, 14, 1, C.sand);
    c.rect(2, 12, 1, 3, C.brownDark);
    c.rect(12, 12, 1, 3, C.brownDark);
  },
  // The Grey Wives: a basket under a cloth, a sprig tied with red thread.
  greyWives: (c) => {
    c.rect(2, 7, 12, 2, C.bone);
    c.rect(2, 7, 12, 1, C.frost);
    c.rect(3, 9, 10, 5, C.rust);
    c.rect(3, 11, 10, 1, C.clay);
    c.rect(3, 13, 10, 1, C.brownDark);
    c.line(4, 7, 8, 1, C.brown, 1);
    c.line(12, 7, 8, 1, C.brown, 1);
    c.set(6, 5, C.moss);
    c.set(7, 4, C.grass);
    c.set(7, 6, C.red);
  },
  // The Bell-Watchers: a bell on its post, rung for the ones who went onward.
  bellWatchers: (c) => {
    c.rect(2, 1, 12, 2, C.brown);
    c.rect(7, 3, 2, 2, C.brownDark);
    c.ellipse(7.5, 8, 4, 4, C.gold);
    c.rect(3, 9, 10, 3, C.gold);
    c.rect(3, 12, 10, 1, C.orange);
    c.rect(5, 6, 2, 4, C.sand);
    c.rect(7, 13, 2, 2, C.coal);
  },
  // The Quenchers: a cold stove, ash in its mouth, a drop of water over it.
  quenchers: (c) => {
    c.rect(1, 6, 14, 9, C.stone);
    c.rect(1, 6, 14, 2, C.ash);
    c.rect(4, 9, 8, 6, C.ink);
    c.rect(4, 13, 8, 2, C.ash);
    c.rect(7, 12, 2, 1, C.coal);
    c.rect(7, 1, 2, 2, C.ice);
    c.rect(6, 3, 4, 2, C.cyan);
    c.set(7, 4, C.frost);
  },
};

export const drawOrderMark = (id: OrderId): Canvas => icon(MARKS[id]);

const sky = (c: Canvas): void => {
  const bands: readonly [number, string][] = [
    [0, C.night],
    [16, C.plum],
    [30, C.violet],
    [42, C.dusk],
  ];
  for (const [y, color] of bands) c.rect(0, y, ORDER_SCENE_W, ORDER_SCENE_H - y, color);
  c.rect(0, 52, ORDER_SCENE_W, 12, C.coal);
  c.rect(0, 52, ORDER_SCENE_W, 1, C.stone);
};

const SCENES: Record<OrderId, (c: Canvas) => void> = {
  // A long table under the gatehouse arch, five chairs on the long side, the ends bare.
  moot: (c) => {
    c.rect(46, 8, 68, 44, C.stone);
    c.rect(46, 8, 68, 3, C.ash);
    for (let x = 50; x < 112; x += 8) c.rect(x, 12, 4, 2, C.coal);
    c.rect(64, 24, 32, 28, C.ink);
    c.ellipse(80, 24, 16, 9, C.ink);
    c.rect(54, 41, 52, 3, C.brown);
    c.rect(54, 41, 52, 1, C.sand);
    c.rect(56, 44, 2, 8, C.brownDark);
    c.rect(102, 44, 2, 8, C.brownDark);
    for (let i = 0; i < 5; i++) {
      const x = 62 + i * 8;
      c.rect(x, 34, 4, 7, C.clay);
      c.rect(x, 34, 4, 1, C.sand);
    }
    c.rect(78, 47, 4, 2, C.bone); // bread, set out
  },
  // A basket on the Hut's step under a cloth, herbs tied with red thread.
  greyWives: (c) => {
    c.rect(36, 14, 88, 38, C.brown);
    c.rect(36, 14, 88, 3, C.brownDark);
    for (let y = 20; y < 52; y += 6) c.rect(36, y, 88, 1, C.brownDark);
    c.rect(70, 26, 18, 26, C.ink);
    c.rect(66, 48, 36, 4, C.stone);
    c.rect(66, 48, 36, 1, C.ash);
    c.rect(100, 38, 14, 10, C.rust);
    c.rect(100, 38, 14, 2, C.bone);
    c.rect(100, 44, 14, 1, C.brownDark);
    c.line(103, 38, 106, 33, C.moss, 1);
    c.line(108, 38, 110, 32, C.grass, 1);
    c.set(106, 34, C.red);
    c.set(110, 33, C.red);
  },
  // A bell on a post against the hill, a rope hanging down.
  bellWatchers: (c) => {
    c.ellipse(40, 56, 50, 14, C.ink);
    c.ellipse(120, 58, 50, 16, C.ink);
    c.rect(78, 10, 4, 42, C.brown);
    c.rect(62, 10, 36, 3, C.brownDark);
    c.ellipse(80, 22, 7, 7, C.gold);
    c.rect(73, 22, 14, 8, C.gold);
    c.rect(73, 29, 14, 1, C.orange);
    c.rect(76, 18, 2, 8, C.sand);
    c.rect(79, 30, 2, 3, C.coal);
    c.rect(81, 14, 1, 26, C.bone);
  },
  // A cold stove, ash in its mouth, a bucket of water beside it and one thin thread of smoke.
  quenchers: (c) => {
    c.rect(58, 26, 44, 26, C.stone);
    c.rect(58, 26, 44, 4, C.ash);
    c.rect(70, 34, 20, 18, C.ink);
    c.rect(70, 46, 20, 6, C.ash);
    c.rect(76, 44, 8, 2, C.coal);
    c.rect(94, 12, 5, 14, C.coal);
    c.line(96, 10, 98, 2, C.ash, 1);
    c.rect(110, 42, 10, 10, C.brown);
    c.rect(110, 42, 10, 2, C.brownDark);
    c.rect(111, 44, 8, 2, C.cyan);
    c.set(114, 45, C.frost);
  },
};

export const drawOrderScene = (id: OrderId): Canvas => {
  const c = new Canvas(ORDER_SCENE_W);
  sky(c);
  SCENES[id](c);
  return c;
};
