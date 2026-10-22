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
  // A long table under the gatehouse arch, five chairs behind it on the long side, and the empty sixth at the head.
  moot: (c) => {
    c.rect(46, 8, 68, 44, C.stone);
    c.rect(46, 8, 68, 3, C.ash);
    for (let x = 50; x < 112; x += 8) c.rect(x, 12, 4, 2, C.coal);
    c.rect(64, 24, 32, 28, C.ink);
    c.ellipse(80, 24, 16, 9, C.ink);
    // The five chairs stand behind the table: only their backs show above its top.
    for (let i = 0; i < 5; i++) {
      const x = 62 + i * 8;
      c.rect(x, 31, 4, 12, C.clay);
      c.rect(x, 31, 4, 1, C.sand);
      c.rect(x + 3, 32, 1, 11, C.rust);
    }
    // The table, in front of them.
    c.rect(54, 41, 52, 3, C.brown);
    c.rect(54, 41, 52, 1, C.sand);
    c.rect(54, 44, 52, 1, C.brownDark);
    c.rect(56, 44, 2, 8, C.brownDark);
    c.rect(102, 44, 2, 8, C.brownDark);
    c.rect(78, 39, 4, 2, C.bone); // bread, set out on the table
    // The sixth chair at the head of the table: taller, darker, high-backed, and empty.
    c.rect(106, 26, 6, 26, C.brownDark);
    c.rect(106, 26, 6, 2, C.brown);
    c.rect(107, 29, 4, 1, C.rust);
    c.rect(107, 44, 4, 3, C.brown);
    c.rect(107, 44, 4, 1, C.clay);
    c.set(108, 27, C.gold);
    c.set(110, 27, C.gold);
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
  // A bronze bell hung from the arch of a stone gatehouse, against the hill, its rope hanging down.
  bellWatchers: (c) => {
    c.ellipse(40, 56, 50, 14, C.ink);
    c.ellipse(120, 58, 50, 16, C.ink);
    // The gatehouse: two stone piers, an arch over the opening, a bright course along the top.
    c.rect(54, 12, 52, 40, C.stone);
    c.rect(54, 12, 52, 3, C.ash);
    for (let x = 58; x < 104; x += 8) c.rect(x, 16, 4, 2, C.coal);
    c.rect(66, 28, 28, 24, C.ink);
    c.ellipse(80, 28, 14, 12, C.ink);
    c.rect(54, 30, 12, 1, C.ash);
    c.rect(94, 34, 12, 1, C.ash);
    c.rect(54, 40, 12, 1, C.ash);
    c.rect(94, 44, 12, 1, C.ash);
    // The bell hangs from an iron hook under the keystone.
    c.rect(79, 17, 2, 7, C.coal);
    c.ellipse(80, 31, 6, 6, C.clay);
    c.rect(74, 31, 12, 8, C.clay);
    c.rect(73, 38, 14, 2, C.rust);
    c.rect(75, 27, 2, 9, C.sand);
    c.rect(83, 32, 2, 7, C.rust);
    c.rect(79, 40, 2, 2, C.coal);
    // The pull-rope, brown, with a knot.
    c.rect(80, 42, 1, 10, C.brown);
    c.set(80, 46, C.clay);
  },
  // Pechko's stove: coals still glowing in its mouth, the crack in the flagstones, Bohdan's cold grey
  // river stone on the hearthstone, and one thin thread of smoke.
  quenchers: (c) => {
    // The flagstones: seams, and the crack that runs across them from the hearth.
    for (const y of [57, 62]) c.rect(0, y, ORDER_SCENE_W, 1, C.ink);
    for (const x of [24, 60, 98, 134]) c.rect(x, 53, 1, 4, C.ink);
    for (const x of [8, 44, 80, 116, 150]) c.rect(x, 58, 1, 4, C.ink);
    c.line(72, 52, 66, 57, C.ink, 1);
    c.line(66, 57, 69, 60, C.ink, 1);
    c.line(69, 60, 62, 63, C.ink, 1);
    c.line(66, 57, 58, 58, C.ink, 1);
    c.rect(58, 26, 44, 26, C.stone);
    c.rect(58, 26, 44, 4, C.ash);
    c.rect(70, 34, 20, 18, C.ink);
    // The coals, glowing.
    c.rect(72, 46, 16, 5, C.blood);
    for (const [x, y, k] of [
      [73, 47, C.red],
      [76, 46, C.orange],
      [79, 48, C.red],
      [82, 46, C.gold],
      [85, 48, C.orange],
      [75, 49, C.orange],
      [80, 50, C.red],
      [86, 46, C.red],
    ] as const)
      c.rect(x, y, 2, 2, k);
    c.set(81, 45, C.gold);
    c.set(77, 45, C.orange);
    // The hearthstone, and on it the cold grey river stone.
    c.rect(66, 51, 28, 2, C.ash);
    c.rect(66, 51, 28, 1, C.bone);
    c.ellipse(96, 49, 4, 3, C.stone);
    c.rect(94, 47, 3, 1, C.ash);
    c.set(95, 48, C.bone);
    c.rect(94, 12, 5, 14, C.coal);
    c.line(96, 10, 98, 2, C.ash, 1);
  },
};

export const drawOrderScene = (id: OrderId): Canvas => {
  const c = new Canvas(ORDER_SCENE_W);
  sky(c);
  SCENES[id](c);
  return c;
};
