// GDD §9.12 and §8 shop (D259): the four hold cosmetics, each a 160 × 64 transparent layer the same
// size as the hold scenes, drawn so the UI only stacks it on `scene.hold.<age>`. The gatehouse,
// the walls and the halls sit in different places at each Rank, so each cosmetic is drawn per Rank.
import type { AgeId } from '../src/content/ages';
import type { CosmeticId } from '../src/content/delves/shop';
import { C, Canvas } from './pixel';

export const SCENE_W = 160;
export const SCENE_H = 64;

/** Where things hang in each hold scene (measured from the scene images, scene pixels). */
const ANCHORS: Record<
  AgeId,
  {
    banners: readonly [number, number];
    lanterns: readonly (readonly [number, number])[];
    door: readonly [number, number, number, number];
    bell: readonly [number, number];
  }
> = {
  hamlet: {
    banners: [66, 33],
    lanterns: [
      [65, 38],
      [94, 38],
    ],
    door: [50, 35, 12, 13],
    bell: [76, 24],
  },
  keep: {
    banners: [65, 14],
    lanterns: [
      [60, 32],
      [98, 32],
    ],
    door: [131, 35, 13, 13],
    bell: [80, 8],
  },
  citadel: {
    banners: [65, 14],
    lanterns: [
      [60, 32],
      [98, 32],
    ],
    door: [130, 35, 12, 13],
    bell: [80, 8],
  },
  bastion: {
    banners: [65, 14],
    lanterns: [
      [60, 36],
      [98, 36],
    ],
    door: [115, 19, 13, 13],
    bell: [80, 8],
  },
};

const banner = (c: Canvas, x: number, y: number, len: number): void => {
  c.rect(x - 1, y, 6, 1, C.brownDark);
  c.rect(x, y + 1, 4, len, C.red);
  c.rect(x, y + 1, 1, len, C.blood);
  c.rect(x + 1, y + 3, 2, 2, C.gold);
  c.set(x, y + len + 1, C.red);
  c.set(x + 3, y + len + 1, C.red);
  c.set(x + 1, y + len + 2, C.red);
  c.set(x + 2, y + len + 2, C.red);
  c.outline(C.ink);
};

const lantern = (c: Canvas, x: number, y: number): void => {
  c.rect(x, y - 3, 1, 3, C.coal);
  c.rect(x - 1, y, 3, 4, C.gold);
  c.rect(x, y + 1, 1, 2, C.frost);
  c.rect(x - 1, y - 1, 3, 1, C.coal);
  c.set(x - 2, y + 4, C.orange);
  c.set(x + 2, y + 4, C.orange);
};

/** The door's own box in the scene (frame included): x, y, width, height. */
type Box = readonly [number, number, number, number];

const carvedDoor = (c: Canvas, [x, y, w, h]: Box): void => {
  c.rect(x, y, w, h, C.gold);
  c.rect(x + 1, y + 1, w - 2, h - 2, C.brownDark);
  c.rect(x + 2, y + 2, w - 4, h - 3, C.brown);
  // A flame carved in the middle of the door, a vine up each side.
  const mx = x + Math.floor(w / 2) - 1;
  const my = y + Math.floor(h / 2) - 3;
  c.rect(mx, my + 2, 2, 5, C.orange);
  c.set(mx, my + 1, C.gold);
  c.set(mx + 1, my, C.gold);
  c.rect(mx - 1, my + 7, 4, 1, C.sand);
  c.line(x + 2, y + h - 3, x + 3, y + 3, C.clay, 1);
  c.line(x + w - 3, y + h - 3, x + w - 4, y + 3, C.clay, 1);
};

const bell = (c: Canvas, x: number, y: number): void => {
  c.rect(x - 3, y - 2, 8, 1, C.brownDark);
  c.ellipse(x + 1, y + 2, 3, 3, C.gold);
  c.rect(x - 2, y + 2, 6, 3, C.gold);
  c.rect(x - 3, y + 5, 8, 1, C.sand);
  c.rect(x - 1, y + 1, 1, 3, C.cream);
  c.set(x + 1, y + 7, C.clay);
};

/** v1.0 (TV.10b): the Hamlet's bell hangs from its own wooden post and crossbeam, not from the sky. */
const bellPost = (c: Canvas, x: number, y: number): void => {
  for (const px of [x - 6, x + 7]) {
    c.rect(px, y - 4, 2, 19, C.brown);
    c.rect(px, y - 4, 1, 19, C.clay);
  }
  c.rect(x - 7, y - 5, 17, 2, C.brownDark);
  c.rect(x - 7, y - 5, 17, 1, C.brown);
  c.line(x - 6, y + 3, x - 3, y - 3, C.brown, 1);
  c.line(x + 8, y + 3, x + 5, y - 3, C.brown, 1);
  c.rect(x + 1, y - 3, 1, 3, C.coal);
  bell(c, x, y);
};

export const drawCosmetic = (id: CosmeticId, age: AgeId): Canvas => {
  const a = ANCHORS[age];
  const c = new Canvas(SCENE_W);
  switch (id) {
    case 'gatehouse-banners': {
      const [x, y] = a.banners;
      banner(c, x, y, age === 'hamlet' ? 8 : 12);
      banner(c, SCENE_W - x - 5, y, age === 'hamlet' ? 8 : 12);
      break;
    }
    case 'wall-lanterns':
      for (const [x, y] of a.lanterns) lantern(c, x, y);
      c.outline(C.ink);
      break;
    case 'carved-hearth-hall-door':
      carvedDoor(c, a.door);
      break;
    case 'watchtower-bell':
      if (age === 'hamlet') bellPost(c, a.bell[0], a.bell[1] + 1);
      else bell(c, ...a.bell);
      c.outline(C.ink);
      break;
  }
  return c;
};
