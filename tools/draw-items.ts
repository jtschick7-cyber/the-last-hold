// GDD §9.12, §9.16 (v0.8, D324): the v0.8 small art, drawn in code like the v0.7 icons: the seven
// gear base pieces, the four item rarity frames, the six keepsakes, the star, the three rank
// badges, and icons for the nine older brews (D323). 16 px icons; frames 20 px, to sit around a
// 16 px icon. Palette colors by name, deterministic, outlined in ink.
import type { GearId } from '../src/content/gear';
import type { ItemRarity } from '../src/content/items';
import type { LegendaryId } from '../src/content/legendaries';
import type { HunterRank } from '../src/content/ranks';
import { C, Canvas } from './pixel';

const icon = (draw: (c: Canvas) => void): Canvas => {
  const c = new Canvas(16);
  draw(c);
  c.outline(C.ink);
  return c;
};

/** A blade running up and to the right from a crossguard, grip and pommel at the lower left. */
const sword = (
  c: Canvas,
  p: { blade: string; edge: string; guard: string; grip: string; extra?: (c: Canvas) => void },
): void => {
  c.line(7, 9, 14, 2, p.blade, 2);
  c.line(8, 8, 14, 2, p.edge, 1);
  c.line(4, 8, 8, 12, p.guard, 1);
  c.line(5, 8, 9, 12, p.guard, 1);
  c.line(6, 10, 3, 13, p.grip, 1);
  c.set(2, 14, p.guard);
  p.extra?.(c);
};

/** A body with two shoulders and a neck notch. */
const torso = (c: Canvas, body: string, trim: string): void => {
  c.rect(4, 3, 8, 10, body);
  c.rect(2, 3, 3, 4, trim);
  c.rect(11, 3, 3, 4, trim);
  c.rect(6, 3, 4, 2, null);
  c.rect(4, 12, 8, 1, trim);
};

const GEAR: Record<GearId, (c: Canvas) => void> = {
  'iron-blade': (c) => sword(c, { blade: C.stone, edge: C.ash, guard: C.brownDark, grip: C.brown }),
  'steel-blade': (c) => sword(c, { blade: C.ash, edge: C.bone, guard: C.stone, grip: C.brown }),
  // Silver in the edge: a cold, bright blade.
  'silvered-blade': (c) =>
    sword(c, {
      blade: C.bone,
      edge: C.frost,
      guard: C.slate,
      grip: C.brownDark,
      extra: (k) => {
        k.set(10, 5, C.cyan);
        k.set(12, 3, C.ice);
      },
    }),
  // Gold at the guard, rune marks down the blade (a Silver and a Rune sub-hit).
  'wrights-blade': (c) =>
    sword(c, {
      blade: C.bone,
      edge: C.frost,
      guard: C.gold,
      grip: C.brown,
      extra: (k) => {
        k.set(9, 7, C.orchid);
        k.set(11, 5, C.orchid);
        k.set(13, 3, C.orchid);
        k.set(2, 14, C.gold);
      },
    }),
  // A hide jerkin laced up the front.
  'hide-armor': (c) => {
    torso(c, C.clay, C.brown);
    c.line(8, 5, 8, 11, C.cream, 1);
    for (const y of [6, 8, 10]) c.rect(7, y, 3, 1, C.cream);
  },
  // Rings of mail: a checker of two greys.
  mail: (c) => {
    torso(c, C.ash, C.stone);
    for (let y = 5; y < 12; y++)
      for (let x = 5; x < 11; x++) if ((x + y) % 2 === 0) c.set(x, y, C.bone);
  },
  // Dark plate with the forge-glow still in its seams.
  'emberwright-plate': (c) => {
    torso(c, C.slate, C.coal);
    c.rect(5, 6, 6, 1, C.orange);
    c.rect(5, 9, 6, 1, C.orange);
    c.rect(7, 4, 2, 8, C.coal);
    c.set(8, 7, C.gold);
    c.set(8, 10, C.gold);
  },
};

export const drawGearIcon = (id: GearId): Canvas => icon(GEAR[id]);

const KEEPSAKES: Record<LegendaryId, (c: Canvas) => void> = {
  // A knot of barley: ears crossed and tied.
  'barley-knot': (c) => {
    c.line(3, 13, 12, 3, C.gold, 1);
    c.line(12, 13, 3, 3, C.sand, 1);
    c.line(8, 14, 8, 2, C.gold, 1);
    c.ellipse(8, 8, 2, 2, C.rose);
    c.set(8, 8, C.blood);
    for (const [x, y] of [
      [3, 3],
      [8, 2],
      [12, 3],
    ] as const)
      c.rect(x - 1, y - 1, 2, 2, C.cream);
  },
  // A string of three wolf teeth.
  'wolf-tooth-string': (c) => {
    c.line(1, 4, 8, 8, C.brown, 1);
    c.line(8, 8, 15, 4, C.brown, 1);
    for (const x of [4, 8, 12]) {
      const y = x === 8 ? 9 : x === 4 ? 6 : 6;
      c.rect(x - 1, y, 3, 3, C.bone);
      c.rect(x, y + 3, 1, 2, C.cream);
    }
  },
  // A grave-coin of silver, cut with a cross.
  'coffin-silver': (c) => {
    c.ellipse(8, 8, 6, 6, C.ash);
    c.ellipse(8, 8, 5, 5, C.bone);
    c.rect(7, 4, 2, 8, C.stone);
    c.rect(5, 6, 6, 2, C.stone);
    c.set(5, 5, C.frost);
  },
  // A coin with a hole, ripples under it.
  'ferrymans-coin': (c) => {
    c.ellipse(8, 7, 5, 5, C.gold);
    c.ellipse(8, 7, 3, 3, C.sand);
    c.rect(7, 6, 2, 2, C.ink);
    c.rect(2, 13, 12, 1, C.blue);
    c.rect(4, 14, 8, 1, C.cyan);
  },
  // A nail with a rune cut into the shaft.
  'rune-nail': (c) => {
    c.rect(4, 1, 8, 2, C.stone);
    c.rect(4, 1, 8, 1, C.ash);
    c.rect(7, 3, 2, 11, C.coal);
    c.rect(7, 3, 1, 11, C.stone);
    c.rect(7, 6, 2, 1, C.orchid);
    c.rect(7, 9, 2, 1, C.orchid);
    c.set(8, 7, C.rose);
  },
  // A thole pin of oak, rimed at the top: the oar's peg.
  'yrsas-thole': (c) => {
    c.rect(6, 3, 4, 10, C.brown);
    c.rect(6, 3, 2, 10, C.clay);
    c.rect(4, 12, 8, 2, C.brownDark);
    c.rect(5, 1, 6, 3, C.frost);
    c.rect(6, 1, 3, 1, C.ice);
    c.set(10, 3, C.ice);
  },
};

export const drawKeepsakeIcon = (id: LegendaryId): Canvas => icon(KEEPSAKES[id]);

/** One earned star on a hunter's sheet. */
export const drawStarIcon = (): Canvas =>
  icon((c) => {
    c.rect(7, 1, 2, 4, C.gold);
    c.rect(2, 5, 12, 3, C.gold);
    c.rect(4, 8, 8, 3, C.gold);
    c.rect(3, 11, 3, 3, C.gold);
    c.rect(10, 11, 3, 3, C.gold);
    c.rect(5, 5, 6, 3, C.sand);
    c.rect(7, 2, 1, 3, C.cream);
    c.set(6, 6, C.cream);
  });

/** A small shield: one cloth stripe for an Apprentice, two of bone for a Wright, three of gold for a Master-Wright. */
export const drawRankBadge = (rank: HunterRank): Canvas =>
  icon((c) => {
    const base = rank === 'apprentice' ? C.brown : rank === 'wright' ? C.slate : C.plum;
    const stripe = rank === 'apprentice' ? C.clay : rank === 'wright' ? C.bone : C.gold;
    c.rect(2, 1, 12, 9, base);
    c.ellipse(8, 10, 6, 4, base);
    c.rect(2, 1, 12, 1, stripe);
    const n = rank === 'apprentice' ? 1 : rank === 'wright' ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const y = 4 + i * 3;
      c.line(4, y, 8, y + 2, stripe, 1);
      c.line(8, y + 2, 12, y, stripe, 1);
    }
  });

const RARITY_FRAME_SIZE = 20;

/**
 * Item frames (D324), unlike the Delve frames (a gold or icy edge with stars in the corners):
 * a square band with a notch at the middle of each side. Common is plain grey, Fine green,
 * Rare blue, Heroic violet and gold.
 */
export const drawItemFrame = (rarity: ItemRarity): Canvas => {
  const n = RARITY_FRAME_SIZE;
  const c = new Canvas(n);
  const edge = { common: C.stone, fine: C.grass, rare: C.blue, heroic: C.orchid }[rarity];
  const inner = { common: C.coal, fine: C.moss, rare: C.night, heroic: C.violet }[rarity];
  c.rect(0, 0, n, n, C.ink);
  c.rect(1, 1, n - 2, n - 2, edge);
  c.rect(2, 2, n - 4, n - 4, inner);
  c.rect(3, 3, n - 6, n - 6, null);
  if (rarity !== 'common') {
    const mid = n / 2;
    for (const [x, y] of [
      [mid - 1, 1],
      [mid, 1],
      [mid - 1, n - 2],
      [mid, n - 2],
      [1, mid - 1],
      [1, mid],
      [n - 2, mid - 1],
      [n - 2, mid],
    ] as const)
      c.set(x, y, rarity === 'fine' ? C.lime : rarity === 'rare' ? C.cyan : C.gold);
  }
  if (rarity === 'heroic')
    for (const [x, y] of [
      [2, 2],
      [n - 3, 2],
      [2, n - 3],
      [n - 3, n - 3],
    ] as const)
      c.set(x, y, C.gold);
  return c;
};

type OldBrewId =
  | 'grave-oil'
  | 'drowned-bane-oil'
  | 'thornbane-oil'
  | 'mending-draught'
  | 'hardwood-tonic'
  | 'quickfoot-tincture'
  | 'fire-pot'
  | 'frost-pot'
  | 'saltburst';

/** A corked bottle with liquid in it. */
const flask = (c: Canvas, glass: string, liquid: string, shine: string, tall = false): void => {
  const top = tall ? 5 : 6;
  c.rect(7, 1, 2, 1, C.brown);
  c.rect(7, 2, 2, top - 2, glass);
  c.ellipse(8, 10, 4, 4, glass);
  c.ellipse(8, 11, 3, 3, liquid);
  c.set(6, 9, shine);
  c.set(6, 10, shine);
};

/** A round pot with a fuse. */
const pot = (c: Canvas, body: string, shade: string, flame: string): void => {
  c.ellipse(8, 10, 5, 5, body);
  c.ellipse(9, 11, 3, 3, shade);
  c.rect(7, 4, 2, 2, C.coal);
  c.line(8, 4, 10, 2, C.brown, 1);
  c.set(11, 1, flame);
  c.set(10, 2, C.gold);
};

const BREWS: Record<OldBrewId, (c: Canvas) => void> = {
  'grave-oil': (c) => flask(c, C.bone, C.coal, C.frost),
  'drowned-bane-oil': (c) => flask(c, C.ice, C.blue, C.frost),
  'thornbane-oil': (c) => flask(c, C.bone, C.moss, C.lime),
  'mending-draught': (c) => flask(c, C.frost, C.red, C.pink),
  'hardwood-tonic': (c) => flask(c, C.cream, C.brown, C.sand, true),
  'quickfoot-tincture': (c) => flask(c, C.frost, C.gold, C.cream),
  'fire-pot': (c) => pot(c, C.rust, C.blood, C.orange),
  'frost-pot': (c) => pot(c, C.ice, C.cyan, C.frost),
  saltburst: (c) => pot(c, C.frost, C.bone, C.gold),
};

export const OLD_BREW_IDS = Object.keys(BREWS) as OldBrewId[];
export const drawOldBrewIcon = (id: OldBrewId): Canvas => icon(BREWS[id]);
