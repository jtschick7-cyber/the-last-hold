// GDD §9.12 (D265): the 11 hunters' 32 px battle sprites, built from the same `portrait` parts as
// their 64 px portraits (skin, hair, beard, headgear, collar, cloth, weapon, mark), on the shared
// two-armed template. Drawn facing left like the monsters, then turned: hunters face right.
import { HUNTER_IDS, hunters, type HunterId, type PortraitSpec } from '../src/content/hunters';
import { CLOTH, HAIR, SKIN } from './draw-hunter';
import { C, Canvas } from './pixel';
import { mirror, SPRITE_SIZE } from './sprite-frames';
import { biped } from './sprite-parts';

const WIDTH: Record<PortraitSpec['face'], number> = { broad: 12, square: 11, oval: 10, narrow: 9 };

const collar = (c: Canvas, kind: PortraitSpec['collar'], x: number, y: number, w: number): void => {
  const ramp: Record<PortraitSpec['collar'], readonly [string, string]> = {
    cloth: [C.bone, C.ash],
    fur: [C.bone, C.stone],
    leather: [C.rust, C.brown],
    'scarred-leather': [C.rust, C.brownDark],
    plate: [C.ice, C.slate],
    mail: [C.ash, C.stone],
  };
  const [a, b] = ramp[kind];
  c.rect(x, y, w, 2, a);
  c.rect(x, y + 1, w, 1, b);
  if (kind === 'fur') for (let i = 0; i < w; i += 2) c.set(x + i, y + 2, C.bone);
  if (kind === 'scarred-leather') c.line(x + 2, y, x + 5, y + 2, C.bone, 1);
  if (kind === 'mail') for (let i = 0; i < w; i += 2) c.set(x + i, y, C.frost);
};

const weapon = (c: Canvas, w: PortraitSpec['weapon'], hx: number, hy: number): void => {
  const pole = (top: number, color: string): void => {
    c.line(hx, hy + 8, hx, top, C.brownDark, 1);
    c.line(hx + 1, hy + 8, hx + 1, top, color, 1);
  };
  switch (w) {
    case 'axe':
      pole(hy - 8, C.brown);
      c.rect(hx - 4, hy - 9, 4, 5, C.ash);
      c.rect(hx - 5, hy - 8, 1, 3, C.frost);
      break;
    case 'boathook':
      pole(hy - 11, C.brownDark);
      c.line(hx, hy - 11, hx - 3, hy - 12, C.ash, 1);
      c.line(hx - 3, hy - 12, hx - 3, hy - 9, C.ash, 1);
      break;
    case 'staff':
      pole(hy - 12, C.rust);
      c.rect(hx - 1, hy - 14, 3, 3, C.sand);
      break;
    case 'spear':
      pole(hy - 10, C.brown);
      c.rect(hx, hy - 15, 2, 5, C.ice);
      break;
    case 'shovel':
      pole(hy - 8, C.brown);
      c.rect(hx - 1, hy + 7, 4, 3, C.ash);
      break;
    case 'hammer':
      pole(hy - 5, C.brown);
      c.rect(hx - 3, hy - 9, 7, 4, C.stone);
      c.rect(hx - 3, hy - 9, 7, 1, C.ash);
      break;
    case 'kettle':
      c.line(hx, hy + 2, hx, hy - 3, C.brownDark, 1);
      c.ellipse(hx, hy + 5, 4, 3, C.coal);
      c.rect(hx - 4, hy + 3, 8, 1, C.stone);
      c.set(hx + 4, hy + 4, C.ash);
      break;
    case 'knife':
      c.rect(hx, hy - 5, 2, 7, C.ash);
      c.rect(hx, hy - 5, 1, 6, C.frost);
      c.rect(hx - 1, hy + 2, 4, 1, C.brownDark);
      break;
    case 'satchel':
      c.rect(hx - 1, hy + 2, 6, 5, C.brown);
      c.rect(hx - 1, hy + 2, 6, 1, C.rust);
      c.set(hx + 2, hy + 4, C.gold);
      c.line(hx + 1, hy - 7, hx + 1, hy + 2, C.brownDark, 1);
      c.rect(hx - 1, hy - 9, 3, 3, C.ash);
      break;
  }
};

/**
 * v1.0 (TV.9b, D492): hunters whose downed pose is redrawn (a near-black body no longer vanishes into
 * the ground). With TV.9c all fourteen hunters are in the set.
 */
const REDRAWN_DOWNED: ReadonlySet<HunterId> = new Set([
  'arvid',
  'bjarna',
  'gest-tall-torch',
  'halvar',
  'herdis',
  'ostap',
  'zora',
  'radek',
  'radmila-of-the-reeds',
  'ragnhild-eye-taker',
  'sigrun',
  'stanko',
  'toma',
  'vesna',
]);

/** A hunter facing right, outlined. */
export const drawHunterSprite = (id: HunterId): Canvas => {
  const s = hunters[id].portrait;
  const skin = SKIN[s.skin];
  const hair = HAIR[s.hairColor];
  const width = WIDTH[s.face];
  const c = new Canvas(SPRITE_SIZE);
  biped(c, {
    cloth: CLOTH[s.clothColor],
    skin,
    eye: C.ink,
    width,
    height: 11,
    hair: s.hair === 'long' ? 'long' : 'none',
    hairRamp: hair,
  });
  const left = 16 - Math.floor(width / 2);
  const hx = 16;
  const hy = 8;
  // Hair that is not long.
  if (s.hair === 'short' || s.hair === 'cropped') {
    c.rect(hx - 4, hy - 4, 9, s.hair === 'short' ? 3 : 2, hair[1]);
    c.rect(hx - 4, hy - 4, 9, 1, hair[0]);
    if (s.hair === 'short') {
      c.rect(hx - 4, hy - 2, 1, 3, hair[2]);
      c.rect(hx + 4, hy - 2, 1, 3, hair[2]);
    }
  } else if (s.hair === 'braid') {
    c.rect(hx - 4, hy - 4, 9, 3, hair[1]);
    c.line(hx + 4, hy - 1, hx + 5, hy + 8, hair[1], 1);
    c.set(hx + 5, hy + 9, hair[2]);
  }
  // Beard.
  if (s.beard === 'stubble') for (let i = -2; i <= 2; i += 2) c.set(hx + i, hy + 3, hair[2]);
  else if (s.beard === 'short') c.rect(hx - 3, hy + 2, 7, 2, hair[1]);
  else if (s.beard === 'full' || s.beard === 'braided') {
    c.rect(hx - 3, hy + 1, 7, 4, hair[1]);
    c.rect(hx - 3, hy + 4, 7, 1, hair[2]);
    if (s.beard === 'braided') c.line(hx, hy + 5, hx, hy + 8, hair[2], 1);
  }
  // Headgear.
  const cap = CLOTH[s.headgearColor];
  if (s.headgear === 'cap') {
    c.rect(hx - 4, hy - 5, 9, 3, cap[1]);
    c.rect(hx - 4, hy - 5, 9, 1, cap[0]);
    c.rect(hx - 5, hy - 3, 11, 1, cap[2]);
  } else if (s.headgear === 'hood') {
    c.ellipse(hx, hy - 1, 5, 5, cap[1]);
    c.ellipse(hx, hy + 1, 3, 3, skin[1]);
    c.set(hx - 2, hy + 1, C.ink);
    c.set(hx + 1, hy + 1, C.ink);
  } else if (s.headgear === 'scarf') {
    c.rect(hx - 4, hy + 3, 9, 3, cap[1]);
    c.rect(hx + 2, hy + 5, 2, 4, cap[2]);
  } else if (s.headgear === 'band') {
    c.rect(hx - 4, hy - 3, 9, 1, cap[1]);
  } else if (s.headgear === 'knit') {
    c.rect(hx - 4, hy - 6, 9, 4, cap[1]);
    c.rect(hx - 4, hy - 4, 9, 1, cap[0]);
    c.set(hx, hy - 7, cap[0]);
  }
  // Collar and the front hand's weapon.
  collar(c, s.collar, left, 12, width);
  weapon(c, s.weapon, left - 4, 20);
  // The single mark.
  if (s.mark === 'soot')
    for (const [x, y] of [
      [hx - 2, hy + 2],
      [hx + 2, hy - 1],
      [hx, hy + 3],
    ] as const)
      c.set(x, y, C.coal);
  if (s.mark === 'scar') c.line(hx + 1, hy - 2, hx + 3, hy + 2, C.rose, 1);
  if (s.mark === 'frost')
    for (const x of [left + 1, left + 4, left + width - 3]) c.set(x, 12, C.frost);
  if (s.mark === 'rune') for (const y of [12, 14, 16]) c.set(left - 3, y, C.dusk);
  c.outline(C.ink);
  const out = mirror(c);
  out.rimmedDowned = REDRAWN_DOWNED.has(id);
  return out;
};

export { HUNTER_IDS };
