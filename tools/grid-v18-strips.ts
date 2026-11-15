import { C, Canvas } from './pixel';
import { mixHash } from './grid-v18-kit';

/** 256x16 northern Fell Breach border strip (crags, twilight breach, pines, lantern standards). */
export function drawStripNorthV18(): Canvas {
  const c = new Canvas(256);
  // Cold northern dusk backdrop kept restrained behind left-side label
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 256; x++) {
      c.set(x, y, y < 5 ? C.ink : y < 11 ? C.plum : C.pine);
    }
  }
  // Mountain ridge silhouette with subtle Breach frost rift at center x=122..133
  for (let x = 0; x < 256; x++) {
    const wave = Math.floor(4 + 3 * Math.sin(x * 0.055) + 1.5 * Math.cos(x * 0.14));
    const crestY = Math.max(1, Math.min(9, wave));
    for (let y = crestY; y < 13; y++) {
      const rift = Math.abs(x - 128) <= 6;
      if (rift && y < 11) {
        c.set(x, y, Math.abs(x - 128) <= 1 ? C.ice : C.night);
      } else {
        c.set(x, y, y === crestY ? C.slate : C.plum);
      }
    }
    // Pine treeline along the Breach foothills
    if (x % 7 === 0 || x % 11 === 3) {
      c.rect(x, 8, 1, 5, C.moss);
      c.rect(x - 1, 10, 3, 3, C.pine);
    }
  }
  // Low north boundary parapet & lantern standards every 32 px
  c.rect(0, 12, 256, 4, C.wine);
  c.rect(0, 13, 256, 2, C.coal);
  c.rect(0, 13, 256, 1, C.slate);
  for (let lx = 16; lx < 256; lx += 32) {
    c.rect(lx - 1, 10, 3, 5, C.wine);
    c.rect(lx, 11, 1, 4, C.stone);
    c.set(lx, 10, C.ash);
  }
  return c;
}

/** 256x16 southern Lowland Gate border strip (meadow apron, low wall, gate piers, dirt road). */
export function drawStripSouthV18(): Canvas {
  const c = new Canvas(256);
  // Top grass apron harmonizing seamlessly with ground-grass
  c.rect(0, 0, 256, 16, C.moss);
  for (let x = 0; x < 256; x++) {
    if (mixHash(x, 2, 701) % 5 === 0) c.set(x, 1, C.grass);
    if (mixHash(x, 4, 702) % 4 === 0) c.set(x, 13, C.pine);
  }
  // Dwarf stone perimeter wall (leaving gate opening x = 113..142)
  for (let x = 0; x < 256; x++) {
    if (x >= 113 && x <= 142) continue;
    c.rect(x, 4, 1, 5, C.wine);
    c.set(x, 5, x % 8 === 0 ? C.slate : C.ash);
    c.set(x, 6, x % 4 === 0 ? C.slate : C.stone);
    c.set(x, 7, C.coal);
  }
  // Central Lowland gravel/earth highway (x = 113..142) matching warm compacted soil
  for (let y = 0; y < 16; y++) {
    for (let x = 113; x <= 142; x++) {
      const curb = x === 113 || x === 142;
      if (curb) {
        c.set(x, y, y % 3 === 0 ? C.slate : C.stone);
      } else {
        const rut = Math.abs(x - 121) <= 2 || Math.abs(x - 134) <= 2;
        const pebble = mixHash(x, y, 719) % 13 === 0;
        c.set(x, y, pebble ? C.stone : rut ? C.brownDark : y % 3 === 0 ? C.rust : C.brown);
      }
    }
  }
  // Gatehouse dressed stone piers flanking road
  for (const px of [108, 143]) {
    c.rect(px, 1, 5, 11, C.wine);
    c.rect(px + 1, 2, 3, 9, C.stone);
    c.rect(px + 1, 2, 3, 2, C.bone);
    c.rect(px + 1, 9, 3, 2, C.slate);
  }
  return c;
}

/** Derived 256x16 north lantern glow strip aligned to the 8 strip-north posts. */
export function drawCosmeticLanternsBorderV18(): Canvas {
  const c = new Canvas(256);
  for (let lx = 16; lx < 256; lx += 32) {
    c.rect(lx - 1, 9, 3, 4, C.wine);
    c.rect(lx, 10, 1, 2, C.gold);
    c.set(lx, 9, C.cream);
  }
  return c;
}

/** Derived 256x16 crimson banners hung from the Lowland Gate stone piers. */
export function drawCosmeticBannersV18(): Canvas {
  const c = new Canvas(256);
  for (const bx of [109, 144]) {
    c.rect(bx, 5, 3, 8, C.wine);
    c.rect(bx + 1, 5, 1, 6, C.red);
    c.set(bx + 1, 6, C.gold);
    c.set(bx + 1, 10, C.blood);
  }
  return c;
}
