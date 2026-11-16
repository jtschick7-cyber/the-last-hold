import { C, Canvas } from './pixel';
import { applyWineOutline, drawAshlarWall, drawShingledRoof } from './grid-v18-kit';

export type IndustryFamily = 'mill' | 'sawpit' | 'smithy' | 'bell-tower';

function drawPlinth(c: Canvas, x0: number, x1: number, y: number): void {
  c.rect(x0, y, x1 - x0 + 1, 2, C.coal);
  c.rect(x0, y, x1 - x0 + 1, 1, C.stone);
}

function drawTinyDoor(c: Canvas, x: number, y: number, w: number, h: number): void {
  c.rect(x, y, w, h, C.wine);
  c.rect(x + 1, y + 1, Math.max(1, w - 2), h - 1, C.brown);
  c.set(x + Math.max(1, w - 2), y + Math.floor(h / 2), C.gold);
}

/** 32x32 Windmill with full sweeping diagonal canvas-and-oak sails across all tiers. */
export function drawMillV18(tier: 1 | 2 | 3): Canvas {
  const c = new Canvas(32);
  if (tier === 3) {
    // Adjacent granary annex on right
    drawShingledRoof(c, 18, 28, 15, 20, { palette: 'red', taper: 2, scallops: false });
    drawAshlarWall(c, 19, 21, 9, 7, { rowH: 3, colW: 4, seed: 211 });
    drawTinyDoor(c, 22, 23, 3, 5);
  }

  // Windmill body centered around x=15 (shifted left slightly on tier 3 to balance annex)
  const cx = tier === 3 ? 13 : 16;
  const halfBot = tier === 1 ? 5 : 6;
  const topY = tier === 1 ? 10 : 8;
  for (let y = topY; y <= 27; y++) {
    const t = (y - topY) / (27 - topY);
    const hw = Math.round((halfBot - 2) * (1 - t) + halfBot * t);
    for (let x = cx - hw; x <= cx + hw; x++) {
      if (tier === 1) {
        c.set(x, y, x < cx ? (y % 4 === 0 ? C.brown : C.cream) : C.sand);
      } else if (tier === 2) {
        c.set(x, y, y % 4 === 0 ? C.stone : x < cx ? C.bone : C.ash);
      } else {
        c.set(x, y, y % 4 === 0 ? C.slate : x < cx ? C.ash : C.stone);
      }
    }
    if (tier === 1) {
      c.set(cx - hw, y, C.brown);
      c.set(cx + hw, y, C.brownDark);
    }
  }
  // Conical terracotta / heraldic cap
  drawShingledRoof(c, cx - halfBot, cx + halfBot, topY - 5, topY, {
    palette: tier === 3 ? 'blue' : 'red',
    taper: halfBot - 1,
    scallops: false,
  });
  if (tier === 3) {
    // Crimson pennant at cap peak
    c.rect(cx, 1, 1, 3, C.bone);
    c.rect(cx + 1, 1, 4, 2, C.red);
  }
  drawPlinth(c, cx - halfBot, tier === 3 ? 28 : cx + halfBot, 27);
  drawTinyDoor(c, cx - 2, 22, 4, 6);

  // Full sweeping 4-blade diagonal windmill sails anchored cleanly to hub at (cx, hubY)
  const hubY = tier === 1 ? 13 : 11;
  const reach = tier === 1 ? 10 : tier === 2 ? 11 : 12;
  const dirs: readonly (readonly [number, number, number, number])[] = [
    [-1, -1, 1, 0],
    [1, -1, 0, 1],
    [-1, 1, 0, -1],
    [1, 1, -1, 0],
  ];
  for (const [dx, dy, vx, vy] of dirs) {
    for (let step = 1; step <= reach; step++) {
      const sx = cx + dx * step;
      const sy = hubY + dy * step;
      c.set(sx, sy, C.brownDark);
      if (step >= 3) {
        const tipShade = tier === 3 && step >= reach - 1 ? C.red : C.cream;
        c.set(sx + vx, sy + vy, tipShade);
        c.set(sx + vx * 2, sy + vy * 2, C.bone);
        if (tier >= 2) c.set(sx + vx * 2 - dx, sy + vy * 2, C.ash);
      }
    }
  }
  c.rect(cx - 1, hubY - 1, 3, 3, C.brownDark);
  c.set(cx, hubY, C.gold);
  applyWineOutline(c);
  return c;
}

/** 32x32 Timber Sawpit grounded on oak trestles/sheds with gleaming steel sawblades. */
export function drawSawpitV18(tier: 1 | 2 | 3): Canvas {
  const c = new Canvas(32);
  // Base workshop ground timber/stone sill
  drawPlinth(c, 4, 27, 27);

  if (tier >= 2) {
    // Timber saw-shed frame on right/back
    const rx0 = tier === 2 ? 14 : 4;
    const ry0 = tier === 2 ? 9 : 7;
    drawShingledRoof(c, rx0, 28, ry0, ry0 + 5, {
      palette: tier === 3 ? 'blue' : 'wood',
      taper: 2,
      scallops: false,
    });
    // Heavy oak posts supporting shed open bay
    for (const px of tier === 2 ? [15, 26] : [5, 16, 26]) {
      c.rect(px, ry0 + 6, 2, 27 - (ry0 + 6), C.brown);
      c.rect(px + 1, ry0 + 6, 1, 27 - (ry0 + 6), C.brownDark);
    }
    if (tier === 3) {
      // Back wall stone/plank bay inside master sawmill (connects everything cleanly!)
      c.rect(7, ry0 + 6, 19, 27 - (ry0 + 6), C.brownDark);
      c.rect(17, ry0 + 7, 8, 12, C.slate);
    }
  }

  // Horizontal trestle saw-horse & pale debarked log
  const logY = 19;
  c.rect(6, logY + 3, 2, 5, C.brownDark);
  c.rect(14, logY + 3, 2, 5, C.brownDark);
  c.rect(4, logY, 15, 3, C.brown);
  c.rect(5, logY + 1, 13, 1, C.rust);
  // Bright pale cut heartwood face at left log end
  c.rect(4, logY, 2, 3, C.cream);
  c.set(5, logY + 1, C.sand);

  // Gleaming vertical / circular steel sawblade biting the log
  const sawX = 11;
  c.rect(sawX, 14, 2, 11, C.frost);
  c.set(sawX, 15, C.ice);
  c.set(sawX + 1, 18, C.ash);
  c.set(sawX + 1, 22, C.slate);
  c.rect(sawX - 1, 13, 4, 1, C.brown);

  // Stacked sawn timber planks at ground right
  const stackX = tier === 1 ? 18 : 19;
  for (let row = 0; row < (tier === 1 ? 2 : 3); row++) {
    const sy = 25 - row * 3;
    c.rect(stackX, sy, 8, 2, row % 2 === 0 ? C.sand : C.clay);
    c.rect(stackX, sy, 2, 2, C.cream);
    c.rect(stackX + 2, sy + 1, 6, 1, C.brown);
  }
  applyWineOutline(c);
  return c;
}

/** 32x32 Hearth Forge & Anvil Smithy across tiers 1..3. */
export function drawSmithyV18(tier: 1 | 2 | 3): Canvas {
  const c = new Canvas(32);
  // Tall forge chimney with smoke puff connected solidly to chimney rim
  const chimX = tier === 3 ? 21 : 20;
  c.rect(chimX, 4, 5, 13, C.stone);
  c.rect(chimX + 1, 4, 2, 11, C.ash);
  c.rect(chimX - 1, 4, 7, 2, C.coal);
  if (tier >= 2) {
    c.rect(chimX + 1, 2, 3, 2, C.ash);
    if (tier === 3) {
      c.rect(9, 6, 4, 9, C.stone);
      c.rect(8, 6, 6, 2, C.coal);
    }
  }

  // Main forge hall
  const hx0 = tier === 1 ? 8 : 7;
  drawShingledRoof(c, hx0 - 1, 27, 9, 15, {
    palette: tier === 1 ? 'wood' : 'blue',
    taper: 3,
    scallops: false,
  });
  if (tier === 1) {
    c.rect(hx0, 16, 18, 12, C.brown);
    drawAshlarWall(c, hx0 + 8, 16, 10, 12, { rowH: 4, colW: 5, seed: 301 });
  } else {
    drawAshlarWall(c, hx0, 16, 19, 12, { rowH: 4, colW: 5, seed: 302 + tier });
  }

  // Blazing glowing forge hearth archway
  c.rect(16, 20, 7, 7, C.coal);
  c.rect(17, 21, 5, 6, C.blood);
  c.rect(18, 22, 3, 4, C.orange);
  c.rect(19, 23, 2, 2, C.gold);
  c.set(19, 23, C.cream);

  // Heavy forge door
  drawTinyDoor(c, hx0 + 2, 21, 4, 7);

  // Unmistakable horned iron anvil outside left
  c.rect(3, 25, 5, 3, C.brownDark);
  c.rect(3, 22, 6, 2, C.slate);
  c.rect(2, 21, 7, 1, C.bone);
  c.rect(4, 24, 3, 1, C.coal);
  if (tier === 3) c.set(5, 20, C.gold);

  drawPlinth(c, 3, 27, 27);
  applyWineOutline(c);
  return c;
}

/** 32x32 Open-gallery Signal Bell Tower with visible hanging gold-bronze bell (no wall wings). */
export function drawBellTowerV18(tier: 1 | 2 | 3): Canvas {
  const c = new Canvas(32);
  const x0 = tier === 1 ? 11 : 10;
  const w = tier === 1 ? 10 : 12;

  // Spire roof + bronze finial
  drawShingledRoof(c, x0 - 1, x0 + w, 4, 10, {
    palette: tier === 3 ? 'blue' : 'red',
    taper: Math.floor(w / 2),
    scallops: false,
  });
  c.rect(15, 2, 2, 3, C.gold);

  // Open arched belfry gallery framing a crisp bronze bell
  c.rect(x0, 11, w, 8, tier === 1 ? C.brown : C.stone);
  c.rect(x0 + 2, 11, w - 4, 7, C.ink);
  // Hanging golden bell silhouette inside the gallery
  c.rect(15, 12, 2, 1, C.brown);
  c.rect(14, 13, 4, 3, C.gold);
  c.rect(13, 16, 6, 1, C.orange);
  c.set(15, 17, C.cream);

  // Supporting shaft below gallery
  if (tier === 1) {
    c.rect(x0 + 1, 19, w - 2, 9, C.brown);
    c.rect(x0 + 2, 19, 2, 9, C.rust);
  } else {
    drawAshlarWall(c, x0, 19, w, 9, { rowH: 4, colW: 5, seed: 411 + tier });
  }
  drawTinyDoor(c, 14, 22, 4, 6);
  drawPlinth(c, x0 - 1, x0 + w, 27);
  applyWineOutline(c);
  return c;
}
