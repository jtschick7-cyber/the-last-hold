// Technical design §12.3 (plan T2.23): the hunter portrait generator. Each hunter's
// content entry (`portrait`) names the parts of a 64 px portrait: face, hair, beard,
// headgear, collar and a weapon silhouette. Parts are small shapes drawn in palette
// colors, in layers, deterministically. The PNGs are committed, so the game ships
// plain images that can be hand-edited or swapped later.

import type { PortraitSpec } from '../src/content/hunters';
import { C, Canvas, seedRolls } from './pixel';

type Ramp = readonly [light: string, mid: string, dark: string];

const SKIN: Record<PortraitSpec['skin'], Ramp> = {
  light: [C.cream, C.sand, C.clay],
  warm: [C.sand, C.clay, C.rust],
  tan: [C.clay, C.rust, C.brown],
  deep: [C.rust, C.brown, C.brownDark],
};
const HAIR: Record<PortraitSpec['hairColor'], Ramp> = {
  black: [C.coal, C.ink, C.wine],
  brown: [C.brown, C.brownDark, C.wine],
  auburn: [C.red, C.blood, C.brownDark],
  blond: [C.gold, C.sand, C.clay],
  grey: [C.bone, C.ash, C.stone],
  white: [C.frost, C.bone, C.ash],
};
const CLOTH: Record<PortraitSpec['clothColor'] | PortraitSpec['headgearColor'], Ramp> = {
  brown: [C.rust, C.brown, C.brownDark],
  green: [C.grass, C.moss, C.pine],
  blue: [C.cyan, C.blue, C.night],
  red: [C.red, C.blood, C.wine],
  grey: [C.stone, C.coal, C.ink],
  violet: [C.orchid, C.violet, C.plum],
};

const FACE: Record<PortraitSpec['face'], { rx: number; ry: number }> = {
  broad: { rx: 15, ry: 15 },
  oval: { rx: 12, ry: 16 },
  narrow: { rx: 11, ry: 17 },
  square: { rx: 14, ry: 14 },
};
const CX = 32;
const CY = 26;

const weapon = (c: Canvas, w: PortraitSpec['weapon']): void => {
  const pole = (x0: number, y0: number, x1: number, y1: number, color: string): void => {
    c.line(x0, y0, x1, y1, C.ink, 4);
    c.line(x0 + 1, y0, x1 + 1, y1, color, 2);
  };
  switch (w) {
    case 'axe':
      pole(50, 8, 46, 62, C.brown);
      c.ellipse(52, 13, 7, 8, C.ink);
      c.ellipse(52, 13, 5.5, 6.5, C.ash);
      c.ellipse(54, 14, 3, 5, C.frost);
      break;
    case 'boathook':
      pole(52, 6, 47, 62, C.brownDark);
      c.line(52, 6, 56, 8, C.ink, 4);
      c.line(56, 8, 55, 14, C.ink, 4);
      c.line(52, 6, 56, 8, C.ash, 2);
      c.line(56, 8, 55, 14, C.ash, 2);
      break;
    case 'staff':
      pole(51, 4, 47, 62, C.rust);
      c.ellipse(52, 6, 4, 4, C.ink);
      c.ellipse(52, 6, 3, 3, C.sand);
      break;
    case 'spear':
      pole(51, 14, 47, 62, C.brown);
      c.line(52, 4, 50, 18, C.ink, 5);
      c.line(52, 5, 51, 17, C.ice, 3);
      c.set(52, 8, C.frost);
      c.set(52, 10, C.frost);
      break;
    case 'shovel':
      pole(52, 14, 47, 62, C.brown);
      c.rect(48, 3, 10, 12, C.ink);
      c.rect(49, 4, 8, 10, C.bone);
      c.rect(49, 4, 3, 10, C.frost);
      break;
    case 'hammer':
      pole(51, 10, 47, 62, C.rust);
      c.rect(44, 3, 16, 10, C.ink);
      c.rect(45, 4, 14, 8, C.coal);
      c.rect(45, 4, 14, 2, C.stone);
      break;
    case 'kettle':
      c.ellipse(50, 14, 9, 8, C.ink);
      c.ellipse(50, 14, 7.5, 6.5, C.coal);
      c.ellipse(48, 12, 3, 2, C.stone);
      c.line(43, 8, 57, 8, C.ink, 2);
      break;
    case 'satchel':
      pole(53, 16, 49, 62, C.pine);
      break;
  }
};

const torso = (c: Canvas, s: PortraitSpec): void => {
  const [lite, mid, dark] = CLOTH[s.clothColor];
  c.ellipse(CX, 68, 29, 21, C.ink);
  c.ellipse(CX, 68, 27.5, 19.5, (x) => (x > CX + 10 ? dark : x < CX - 14 ? lite : mid));
  const neckY = 44;
  switch (s.collar) {
    case 'cloth':
      c.line(24, neckY, CX, 54, C.cream, 2);
      c.line(40, neckY, CX, 54, C.cream, 2);
      break;
    case 'fur': {
      const r = seedRolls(`fur:${s.hairColor}`);
      c.ellipse(CX, 47, 17, 6, C.ink);
      c.ellipse(CX, 47, 16, 5, C.bone);
      for (let i = 0; i < 26; i++) c.set(18 + r() * 28, 43 + r() * 8, C.ash);
      break;
    }
    case 'leather':
      c.ellipse(CX, 47, 16, 5.5, C.ink);
      c.ellipse(CX, 47, 15, 4.5, C.brownDark);
      for (const x of [22, 27, 32, 37, 42]) c.set(x, 49, C.gold);
      break;
    case 'plate':
      c.ellipse(CX, 47, 17, 6, C.ink);
      c.ellipse(CX, 47, 16, 5, C.ash);
      c.line(20, 45, 44, 45, C.frost, 1);
      break;
    case 'mail':
      c.ellipse(CX, 47, 17, 6, C.ink);
      c.ellipse(CX, 47, 16, 5, C.stone);
      for (let x = 18; x < 46; x += 2)
        for (let y = 43; y < 51; y += 2) c.set(x + (y % 4 === 1 ? 1 : 0), y, C.ash);
      break;
  }
  if (s.weapon === 'satchel') {
    c.line(24, 46, 44, 64, C.ink, 4);
    c.line(24, 46, 44, 64, C.brown, 2);
    c.rect(40, 56, 12, 9, C.ink);
    c.rect(41, 57, 10, 7, C.rust);
    c.rect(41, 57, 10, 2, C.clay);
  }
};

/** Stanko's knife, sheathed on a strap across his chest, handle up (owner's review, D104). */
const knifeStrap = (c: Canvas): void => {
  // The strap, from the left shoulder down to the right hip, in light leather.
  c.line(19, 46, 45, 64, C.ink, 6);
  c.line(20, 46, 45, 63, C.clay, 4);
  c.line(21, 48, 45, 65, C.rust, 1);
  for (const [x, y] of [
    [25, 50],
    [39, 59],
  ] as const)
    c.set(x, y, C.gold);
  // The sheath crosses the strap, point down-left; the steel guard and grip stick up.
  c.line(26, 62, 33, 54, C.ink, 5);
  c.line(27, 61, 33, 55, C.coal, 3);
  c.line(31, 53, 37, 56, C.ink, 4);
  c.line(32, 54, 36, 55, C.frost, 2);
  c.line(35, 52, 38, 48, C.ink, 4);
  c.line(35, 51, 37, 49, C.bone, 2);
  c.ellipse(39, 47, 1.6, 1.6, C.ink);
  c.set(39, 47, C.ash);
};

/**
 * Long hair falls behind the shoulders as two locks, clear of the jaw and neck, so it
 * never reads as a beard (the owner's portrait review, v0.3).
 */
const longHair = (c: Canvas, s: PortraitSpec, rx: number, ry: number): void => {
  const hair = HAIR[s.hairColor];
  const cutY = CY + ry - 8;
  const fill = (ex: number, ey: number, gap: number, color: string): void => {
    for (let y = Math.floor(CY + 10 - ey); y <= CY + 10 + ey; y++)
      for (let x = Math.floor(CX - ex); x <= CX + ex; x++) {
        const dx = (x - CX) / ex;
        const dy = (y - CY - 10) / ey;
        if (dx * dx + dy * dy > 1) continue;
        if (y > cutY && Math.abs(x - CX) < gap) continue;
        c.set(x, y, color);
      }
  };
  fill(rx + 5, 22, rx - 2, C.ink);
  fill(rx + 3.5, 20.5, rx, hair[1]);
};

const head = (c: Canvas, s: PortraitSpec): void => {
  const { rx, ry } = FACE[s.face];
  const [lite, mid, dark] = SKIN[s.skin];
  const hair = HAIR[s.hairColor];
  const gear = CLOTH[s.headgearColor];

  // Layers behind the head: long hair, braid, hood.
  if (s.headgear === 'hood') {
    c.ellipse(CX, CY - 1, rx + 7, ry + 6, C.ink);
    c.ellipse(CX, CY - 1, rx + 5.5, ry + 4.5, gear[1]);
    c.ellipse(CX + 4, CY + 2, rx + 3, ry + 3, gear[2]);
  }
  if (s.hair === 'long') longHair(c, s, rx, ry);
  // Neck, then the head.
  c.rect(CX - 5, CY + ry - 4, 10, 14, C.ink);
  c.rect(CX - 4, CY + ry - 4, 8, 14, dark);
  c.ellipse(CX, CY, rx + 1, ry + 1, C.ink);
  const base = (x: number, y: number): string => {
    const fx = (x - CX) / rx;
    const fy = (y - CY) / ry;
    return fx > 0.55 || fy > 0.78 ? dark : fx > 0.2 || fy > 0.5 ? mid : lite;
  };
  c.ellipse(CX, CY, rx, ry, base);
  if (s.face === 'square') c.rect(CX - rx, CY - 6, rx * 2 + 1, 18, mid);
  if (s.face === 'square') c.rect(CX - rx + 1, CY - 6, 5, 18, lite);

  // Hair on top, by style.
  if (s.hair === 'short' || s.hair === 'braid' || s.hair === 'long') {
    c.ellipse(CX, CY - 9, rx + 1, 10, hair[1]);
    for (let y = CY - 20; y < CY - 5; y++)
      for (let x = CX - rx - 1; x <= CX + rx + 1; x++) {
        if (c.get(x, y) === hair[1] && x > CX + 3) c.set(x, y, hair[2]);
        if (c.get(x, y) === hair[1] && x < CX - 6 && y < CY - 12) c.set(x, y, hair[0]);
      }
    // Restore the face below the hairline.
    for (let y = CY - 5; y < CY + 2; y++) {
      for (let x = CX - rx; x <= CX + rx; x++) {
        const fx = (x - CX) / rx;
        const fy = (y - CY) / ry;
        if (fx * fx + fy * fy <= 1 && Math.abs(fx) < 0.88) c.set(x, y, base(x, y));
      }
    }
  }
  if (s.hair === 'cropped') {
    for (let y = CY - ry; y < CY - 8; y++) {
      for (let x = CX - rx; x <= CX + rx; x++) {
        const fx = (x - CX) / rx;
        const fy = (y - CY) / ry;
        if (fx * fx + fy * fy <= 1) c.set(x, y, hair[1]);
      }
    }
  }
  if (s.hair === 'braid') {
    for (let i = 0; i < 9; i++) {
      c.ellipse(CX + rx + 1 + i * 0.4, CY + 12 + i * 4, 3, 2.6, C.ink);
      c.ellipse(CX + rx + 1 + i * 0.4, CY + 12 + i * 4, 2.2, 1.9, hair[i % 2 === 0 ? 0 : 1]);
    }
  }

  // Features: brows, eyes, nose, mouth.
  const brow = s.hair === 'none' ? C.brownDark : hair[2];
  for (const side of [-1, 1]) {
    const ex = CX + side * 5.5;
    c.rect(ex - 2, CY - 6, 5, 1, brow);
    c.rect(ex - 1, CY - 3, 3, 2, C.ink);
    c.set(ex - 1, CY - 3, C.frost);
  }
  c.set(CX, CY + 3, dark);
  c.set(CX + 1, CY + 4, dark);
  c.set(CX - 1, CY + 4, dark);
  c.rect(CX - 3, CY + 9, 7, 1, C.brown);

  // Beard.
  if (s.beard === 'stubble') {
    const r = seedRolls(`stubble:${s.hairColor}`);
    for (let i = 0; i < 70; i++) {
      const x = CX + (r() * 2 - 1) * (rx - 2);
      const y = CY + 5 + r() * (ry - 6);
      if (
        ((x - CX) / rx) ** 2 + ((y - CY) / ry) ** 2 < 0.85 &&
        !(y > CY + 8 && y < CY + 11 && Math.abs(x - CX) < 4)
      )
        c.set(x, y, hair[2]);
    }
  }
  if (s.beard === 'short' || s.beard === 'full') {
    const drop = s.beard === 'full' ? 7 : 2;
    for (let y = CY + 4; y <= CY + ry + drop; y++) {
      for (let x = CX - rx - 1; x <= CX + rx + 1; x++) {
        const fy = (y - CY) / (ry + drop);
        const fx = (x - CX) / (rx + 1);
        const inside = fx * fx + fy * fy <= 1 && (y > CY + 7 || Math.abs(fx) > 0.62);
        const mouth = y >= CY + 8 && y <= CY + 10 && Math.abs(x - CX) < 4;
        if (inside && !mouth) c.set(x, y, x > CX + 4 ? hair[2] : y % 5 === 0 ? hair[0] : hair[1]);
      }
    }
    c.rect(CX - 3, CY + 9, 7, 1, C.brown);
  }

  // Headgear in front.
  if (s.headgear === 'cap') {
    c.ellipse(CX, CY - 10, rx + 2, 9, C.ink);
    c.ellipse(CX, CY - 10, rx + 1, 8, gear[1]);
    c.rect(CX - rx - 1, CY - 7, rx * 2 + 3, 3, C.ink);
    c.rect(CX - rx, CY - 7, rx * 2 + 1, 2, gear[2]);
    c.rect(CX - rx + 3, CY - 16, 8, 2, gear[0]);
  }
  if (s.headgear === 'scarf') {
    c.rect(CX - rx - 1, CY - 11, rx * 2 + 3, 7, C.ink);
    c.rect(CX - rx, CY - 10, rx * 2 + 1, 5, gear[1]);
    c.rect(CX - rx, CY - 10, rx * 2 + 1, 1, gear[0]);
    c.ellipse(CX + rx, CY - 7, 4, 4, C.ink);
    c.ellipse(CX + rx, CY - 7, 3, 3, gear[0]);
    c.line(CX + rx, CY - 5, CX + rx + 3, CY + 3, gear[1], 2);
  }
  if (s.headgear === 'band') {
    c.rect(CX - rx, CY - 9, rx * 2 + 1, 4, C.ink);
    c.rect(CX - rx + 1, CY - 8, rx * 2 - 1, 2, gear[0]);
  }
  if (s.headgear === 'hood') {
    for (let x = CX - rx - 1; x <= CX + rx + 1; x++) {
      const t = Math.round(CY - 12 + ((x - CX) / rx) ** 2 * 5);
      for (let y = CY - ry - 6; y < t; y++) c.set(x, y, gear[1]);
    }
    c.ellipse(CX, CY - 12, rx + 2, 4, gear[1]);
    c.rect(CX - rx - 1, CY - 14, 4, 20, gear[2]);
  }

  // Marks.
  const r = seedRolls(`mark:${s.mark ?? 'none'}`);
  if (s.mark === 'soot')
    for (let i = 0; i < 22; i++) c.set(CX + (r() * 2 - 1) * (rx - 3), CY + 1 + r() * 9, C.coal);
  if (s.mark === 'scar') c.line(CX - 9, CY - 8, CX - 3, CY + 3, C.pink, 1);
  if (s.mark === 'frost')
    for (let i = 0; i < 20; i++) c.set(CX + (r() * 2 - 1) * (rx + 2), CY - 12 + r() * 28, C.ice);
};

export const drawHunter = (s: PortraitSpec): Canvas => {
  const c = new Canvas();
  c.fill(C.plum);
  c.ellipse(CX, 30, 27, 29, C.violet);
  c.ellipse(CX, 30, 21, 23, C.slate);
  if (s.weapon !== 'satchel' && s.weapon !== 'knife') weapon(c, s.weapon);
  torso(c, s);
  head(c, s);
  // Over the hair and collar: the strap crosses the shoulder in front.
  if (s.weapon === 'knife') knifeStrap(c);
  return c;
};
