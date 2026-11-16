import { C, Canvas } from './pixel';
import { applyWineOutline, drawArchedDoor, drawAshlarWall, drawShingledRoof } from './grid-v18-kit';

export type CivicFamily = 'barracks' | 'trophy-hall' | 'lodge' | 'alchemist';

function drawBanner(c: Canvas, x: number, y: number, w: number, h: number): void {
  c.rect(x, y, 1, h + 3, C.bone);
  c.set(x, y - 1, C.gold);
  for (let j = 0; j < h; j++) {
    for (let i = 1; i <= w; i++) {
      c.set(x + i, y + j, j === 1 && i > 1 && i < w ? C.gold : C.red);
    }
  }
}

/** 32x32 Martial Longhouse / Garrison Barracks with spear rack & heraldic shields. */
export function drawBarracksV18(tier: 1 | 2 | 3): Canvas {
  const c = new Canvas(32);
  // Wide martial longhouse (x=3..28) distinct from tall peaked cottages
  drawShingledRoof(c, 3, 28, tier === 3 ? 6 : 8, tier === 3 ? 13 : 14, {
    palette: tier === 1 ? 'wood' : 'blue',
    taper: 2,
    scallops: tier >= 2,
  });
  if (tier === 3) {
    // Crenellated dormer crown + garrison standard
    for (const mx of [7, 13, 21]) {
      c.rect(mx, 5, 3, 2, C.bone);
    }
    drawBanner(c, 15, 2, 4, 3);
  }

  // Facade masonry/timber
  if (tier === 1) {
    c.rect(4, 15, 24, 13, C.brown);
    c.rect(4, 15, 24, 4, C.sand);
    for (const px of [4, 11, 20, 26]) c.rect(px, 15, 2, 13, C.brownDark);
  } else {
    drawAshlarWall(c, 4, 15, 24, 13, { rowH: 4, colW: 6, seed: 501 + tier });
    if (tier === 2) {
      c.rect(4, 14, 24, 3, C.sand);
      for (const px of [4, 11, 20, 26]) c.rect(px, 14, 2, 4, C.brown);
    }
  }

  // Wide studded oak double barracks doors + ground plinth
  drawArchedDoor(c, 12, 19, 8, 9, { stoneArch: tier >= 2 });
  c.rect(3, 27, 26, 2, C.coal);
  c.rect(3, 27, 26, 1, C.stone);

  // Unmistakable external spear rack & round shield on left apron
  for (const sx of [5, 7, 9]) {
    c.rect(sx, 18, 1, 9, C.rust);
    c.set(sx, 17, C.frost);
  }
  c.rect(4, 22, 6, 1, C.brownDark);
  // Painted round shield on right wall
  c.rect(22, 19, 4, 4, C.red);
  c.set(23, 20, C.gold);
  c.set(24, 21, C.gold);

  applyWineOutline(c);
  return c;
}

/** 32x32 Ceremonial Trophy Hall with mounted bone antler crest & crimson victory banners. */
export function drawTrophyHallV18(): Canvas {
  const c = new Canvas(32);
  drawShingledRoof(c, 4, 27, 7, 14, { palette: 'blue', taper: 8, scallops: true });
  c.rect(15, 4, 2, 3, C.gold);
  drawAshlarWall(c, 5, 15, 22, 13, { rowH: 4, colW: 6, seed: 551 });
  // Carved pale bone skull & swept antlers over archway
  c.rect(14, 15, 4, 3, C.frost);
  c.rect(11, 13, 3, 2, C.bone);
  c.rect(18, 13, 3, 2, C.bone);
  c.set(15, 17, C.wine);

  // Flanking crimson-and-gold victory banners
  for (const bx of [7, 22]) {
    c.rect(bx, 16, 3, 8, C.red);
    c.rect(bx + 1, 17, 1, 5, C.gold);
    c.set(bx + 1, 23, C.blood);
  }

  drawArchedDoor(c, 12, 19, 8, 9, { stoneArch: true });
  // Warm flanking torch sconces
  c.set(11, 21, C.gold);
  c.set(20, 21, C.gold);
  c.rect(4, 27, 24, 2, C.coal);
  applyWineOutline(c);
  return c;
}

/** 32x32 Rustic Timber & Hearth Hunters' Lodge across tiers 1..3. */
export function drawLodgeV18(tier: 1 | 2 | 3): Canvas {
  const c = new Canvas(32);
  if (tier >= 2) {
    c.rect(21, 5, 4, 10, C.stone);
    c.rect(20, 5, 6, 2, C.coal);
  }
  // Steep woodland A-frame roof
  drawShingledRoof(c, 4, 27, 6, 15, {
    palette: tier === 3 ? 'blue' : 'wood',
    taper: 9,
    scallops: true,
  });
  // Fitted warm log courses + stone base on tier 3
  for (let y = 16; y <= 27; y++) {
    c.rect(6, y, 20, 1, y % 3 === 0 ? C.brownDark : C.brown);
  }
  if (tier === 3) drawAshlarWall(c, 6, 22, 20, 6, { rowH: 3, colW: 5, seed: 583 });

  // Pale bone antler crest above porch lintel
  c.rect(12, 16, 2, 1, C.bone);
  c.rect(18, 16, 2, 1, C.bone);
  c.rect(14, 17, 4, 1, C.cream);

  // Glowing hearth windows
  for (const wx of [8, 21]) {
    c.rect(wx, 18, 3, 3, C.orange);
    c.set(wx + 1, 19, C.gold);
  }
  drawArchedDoor(c, 13, 19, 6, 9, { stoneArch: tier === 3 });
  c.rect(5, 27, 22, 2, C.coal);
  applyWineOutline(c);
  return c;
}

/** 32x32 Plum-slate Alchemist Workshop with grounded courtyard cauldron & attached cupola. */
export function drawAlchemistV18(tier: 1 | 2 | 3): Canvas {
  const c = new Canvas(32);
  if (tier >= 2) {
    // Tall retort chimney with attached pale-green/ice flame glint at the flue rim
    c.rect(16, 4, 4, 12, C.slate);
    c.rect(15, 4, 6, 2, C.coal);
    c.set(17, 3, C.lime);
    c.set(18, 3, C.frost);
    c.set(18, 2, C.ice);
  }

  // Main plum/violet apothecary cottage roof + walls
  for (let y = 8; y <= 15; y++) {
    const inset = Math.round((15 - y) * 0.7);
    for (let x = 4 + inset; x <= 21 - inset; x++) {
      c.set(x, y, y === 8 ? C.dusk : y % 3 === 0 ? C.plum : C.violet);
    }
  }
  if (tier === 3) {
    // Attached leaded-glass cyan cupola seated flush inside the roof pitch (no floating oval!)
    c.rect(8, 5, 5, 6, C.plum);
    c.rect(9, 6, 3, 4, C.cyan);
    c.set(10, 6, C.frost);
    c.set(10, 4, C.dusk);
  }

  c.rect(5, 16, 15, 12, C.slate);
  c.rect(6, 17, 13, 10, C.dusk);
  drawArchedDoor(c, 8, 20, 5, 8);
  c.rect(15, 18, 3, 4, C.gold);

  // Courtyard cobblestone plinth linking cottage seamlessly to bubbling cauldron
  c.rect(4, 27, 25, 2, C.coal);
  c.rect(20, 21, 7, 5, C.coal);
  c.rect(21, 20, 5, 2, C.slate);
  // Bubbling glowing brew anchored smoothly into the cauldron rim
  c.rect(21, 19, 5, 1, tier === 3 ? C.cyan : C.lime);
  c.set(22, 18, tier === 3 ? C.ice : C.lime);
  c.set(24, 18, C.frost);
  if (tier >= 2) {
    // Copper alembic feed pipe connecting wall to cauldron
    c.rect(19, 17, 4, 1, C.orange);
    c.rect(22, 18, 1, 2, C.orange);
  }

  applyWineOutline(c);
  return c;
}
