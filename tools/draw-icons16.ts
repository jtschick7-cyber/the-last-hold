// GDD §9.12 (D265): the v0.7 small art, drawn in code like the portraits: the six patron sigils,
// the Riftglass icon and the six Delve relic icons (all 16 px), and the three rarity frames
// (20 px, to sit around a 16 px sigil). Palette colors by name, deterministic, outlined in ink.
import type { DelveRelicId } from '../src/content/delves/relics';
import type { PatronId } from '../src/content/delves/patrons';
import { C, Canvas } from './pixel';

const icon = (draw: (c: Canvas) => void): Canvas => {
  const c = new Canvas(16);
  draw(c);
  c.outline(C.ink);
  return c;
};

const SIGILS: Record<PatronId, (c: Canvas) => void> = {
  // An anvil with a spark: craft, the old forge.
  'pale-smith': (c) => {
    c.rect(2, 4, 11, 3, C.bone);
    c.rect(2, 4, 11, 1, C.frost);
    c.rect(0, 5, 3, 1, C.ash);
    c.rect(5, 7, 5, 3, C.stone);
    c.rect(3, 10, 9, 3, C.coal);
    c.set(10, 1, C.orange);
    c.set(12, 2, C.gold);
    c.set(8, 2, C.gold);
  },
  // A spindle wound with thread, three strands running off: kinship, weaving.
  weaver: (c) => {
    c.line(7, 1, 7, 13, C.brown, 1);
    c.ellipse(7, 7, 3, 4, C.orchid);
    c.rect(5, 6, 5, 1, C.violet);
    c.rect(5, 9, 5, 1, C.violet);
    c.line(10, 6, 14, 2, C.rose, 1);
    c.line(10, 8, 14, 9, C.gold, 1);
    c.line(4, 8, 1, 13, C.rose, 1);
  },
  // A wolf's head, ears up, eyes lit: hunger, fury.
  wolf: (c) => {
    c.rect(2, 1, 3, 4, C.stone);
    c.rect(11, 1, 3, 4, C.stone);
    c.ellipse(8, 8, 5, 5, C.ash);
    c.rect(5, 10, 6, 4, C.bone);
    c.rect(7, 12, 2, 1, C.ink);
    c.set(5, 7, C.gold);
    c.set(10, 7, C.gold);
    c.set(6, 13, C.frost);
    c.set(9, 13, C.frost);
  },
  // A flame in a bowl of coals: warmth, mending.
  'hearth-crone': (c) => {
    c.ellipse(8, 8, 3, 5, C.orange);
    c.ellipse(8, 9, 2, 3, C.gold);
    c.set(8, 2, C.red);
    c.rect(3, 12, 10, 2, C.brown);
    c.rect(4, 11, 8, 1, C.rust);
  },
  // A bell with water lines through it: stillness, depth.
  'drowned-bell': (c) => {
    c.ellipse(8, 6, 4, 4, C.gold);
    c.rect(4, 6, 9, 5, C.gold);
    c.rect(3, 10, 11, 2, C.sand);
    c.rect(7, 1, 2, 2, C.clay);
    c.set(8, 13, C.clay);
    for (const y of [5, 8]) c.rect(3, y, 10, 1, C.cyan);
    c.rect(3, 12, 11, 1, C.blue);
  },
  // An unlit lamp: the outline of a flame, with nothing in it.
  unlit: (c) => {
    c.ellipse(8, 7, 4, 6, C.slate);
    c.ellipse(8, 8, 2, 4, C.ink);
    c.set(8, 1, C.slate);
    c.rect(4, 13, 8, 2, C.plum);
    c.set(8, 8, C.dusk);
  },
};

export const drawSigil = (id: PatronId): Canvas => icon(SIGILS[id]);

/** The Riftglass: a faceted shard, glass that holds a little light. */
export const drawRiftglass = (): Canvas =>
  icon((c) => {
    c.rect(6, 1, 4, 2, C.frost);
    c.rect(4, 3, 8, 6, C.ice);
    c.rect(5, 9, 6, 3, C.cyan);
    c.rect(7, 12, 2, 2, C.blue);
    c.rect(4, 3, 3, 6, C.frost);
    c.rect(10, 4, 2, 5, C.blue);
    c.set(8, 6, C.cyan);
    c.set(9, 7, C.cyan);
  });

const RELICS: Record<DelveRelicId, (c: Canvas) => void> = {
  // A clay disc with a hole through it.
  'spindle-whorl': (c) => {
    c.ellipse(8, 8, 6, 6, C.clay);
    c.ellipse(8, 8, 6, 3, C.sand);
    c.ellipse(8, 8, 2, 2, C.ink);
    c.rect(5, 4, 2, 1, C.cream);
  },
  // A long horseshoe nail, hammered straight.
  'cold-iron-nail': (c) => {
    c.rect(3, 1, 10, 2, C.stone);
    c.rect(3, 1, 10, 1, C.ash);
    c.rect(7, 3, 2, 10, C.coal);
    c.rect(7, 3, 1, 10, C.stone);
    c.set(8, 14, C.ink);
    c.set(7, 6, C.ice);
  },
  // A horn lantern that lights only below the hearthstone.
  'rift-lantern': (c) => {
    c.rect(5, 1, 6, 2, C.brown);
    c.rect(4, 3, 8, 8, C.bone);
    c.rect(5, 4, 6, 6, C.ice);
    c.rect(7, 5, 2, 4, C.frost);
    c.rect(4, 11, 8, 2, C.brownDark);
  },
  // The tongue of a bell, without the bell.
  'bell-clapper': (c) => {
    c.rect(7, 1, 2, 8, C.brown);
    c.ellipse(8, 11, 3, 3, C.gold);
    c.rect(6, 10, 2, 1, C.cream);
    c.rect(6, 1, 4, 1, C.clay);
  },
  // A ring of rime salt, wrapped in thread.
  'salt-ring': (c) => {
    c.ellipse(8, 8, 6, 6, C.frost);
    c.ellipse(8, 8, 4, 4, C.ink);
    c.ellipse(8, 8, 3, 3, C.slate);
    for (const y of [4, 8, 12]) c.set(13, y, C.rose);
    c.rect(2, 6, 3, 1, C.rose);
    c.rect(2, 9, 3, 1, C.rose);
    c.set(6, 3, C.ice);
  },
  // A goatherd's spoon in horn.
  'horn-spoon': (c) => {
    c.line(3, 13, 9, 6, C.sand, 2);
    c.ellipse(11, 5, 3, 3, C.cream);
    c.ellipse(11, 5, 2, 2, C.clay);
    c.set(10, 4, C.sand);
  },
};

export const drawRelicIcon = (id: DelveRelicId): Canvas => icon(RELICS[id]);

export const RARITY_FRAME_SIZE = 20;

/**
 * Faint: a thin ash edge with notched corners (v1.0, TV.10a: it must differ from the plain Common
 * frame). Warm: gold, with a small frost diamond at each corner. Bright: gold and ice, with a larger
 * diamond that reaches the outer edge.
 */
export const drawRarityFrame = (rarity: 'faint' | 'warm' | 'bright'): Canvas => {
  const n = RARITY_FRAME_SIZE;
  const c = new Canvas(n);
  const edge = rarity === 'faint' ? C.ash : rarity === 'warm' ? C.gold : C.ice;
  const inner = rarity === 'faint' ? C.stone : rarity === 'warm' ? C.orange : C.gold;
  c.rect(0, 0, n, n, C.ink);
  c.rect(1, 1, n - 2, n - 2, edge);
  c.rect(2, 2, n - 4, n - 4, inner);
  c.rect(3, 3, n - 6, n - 6, null);
  for (const [sx, sy] of [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ] as const) {
    const at = (dx: number, dy: number): [number, number] => [
      sx > 0 ? 2 + dx : n - 3 - dx,
      sy > 0 ? 2 + dy : n - 3 - dy,
    ];
    if (rarity === 'faint') {
      // The corner is cut away: two outer pixels go, the one inside becomes the new edge.
      c.set(...at(-2, -2), null);
      c.set(...at(-1, -2), null);
      c.set(...at(-2, -1), null);
      c.set(...at(-1, -1), C.ink);
      continue;
    }
    // A plus-shaped diamond, its centre frost.
    for (const [dx, dy] of [
      [0, -1],
      [-1, 0],
      [1, 0],
      [0, 1],
    ] as const)
      c.set(...at(dx, dy), rarity === 'warm' ? C.cream : C.frost);
    c.set(...at(0, 0), C.frost);
    if (rarity === 'bright') {
      c.set(...at(0, -2), C.gold);
      c.set(...at(-2, 0), C.gold);
      c.set(...at(-1, -1), C.ice);
    }
  }
  return c;
};

/** The Rime (v0.9, GDD §5.14.3): frost grown into a few strokes by the crack, pale on dark. */
export const drawRimeIcon = (): Canvas =>
  icon((c) => {
    c.rect(7, 1, 2, 14, C.frost);
    c.rect(1, 7, 14, 2, C.frost);
    c.line(3, 3, 12, 12, C.ice, 1);
    c.line(12, 3, 3, 12, C.ice, 1);
    c.rect(7, 7, 2, 2, C.cyan);
    for (const [x, y] of [
      [7, 3],
      [8, 3],
      [3, 7],
      [3, 8],
      [12, 7],
      [12, 8],
      [7, 12],
      [8, 12],
    ] as const)
      c.set(x, y, C.cyan);
  });

/** An attempt token (v0.9, GDD §5.12.2): a notched tally disc of old wood with a brass rim. */
export const drawTokenIcon = (): Canvas =>
  icon((c) => {
    c.ellipse(8, 8, 6, 6, C.gold);
    c.ellipse(8, 8, 5, 5, C.brown);
    c.ellipse(8, 8, 5, 3, C.rust);
    c.rect(7, 3, 2, 10, C.brownDark);
    c.rect(5, 6, 6, 1, C.sand);
    c.rect(5, 9, 6, 1, C.sand);
    c.set(4, 4, C.sand);
  });
