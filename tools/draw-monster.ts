// Technical design §12.3 (plan T2.24): the monster portrait generator. Twelve 64 px
// portraits, one per species, drawn from small shapes in palette colors. Portraits only:
// no battle sprites (D-plan T2.24). Each family has a backdrop; each species has its own
// head, eyes and one telling feature. The PNGs are committed, so the game ships plain
// images that can be hand-edited or swapped later.

import type { FamilyId } from '../src/content/damage';
import { monsters, type MonsterId } from '../src/content/monsters';
import { anvilWight, gloamMoths, ribbonshade, rimewrought } from './draw-cursed';
import { C, Canvas, seedRolls } from './pixel';

const CX = 32;

const BACKDROP: Record<FamilyId, readonly [string, string, string]> = {
  'beasts-and-wilds': [C.ink, C.coal, C.stone],
  'field-and-forest-spirits': [C.pine, C.moss, C.grass],
  'restless-dead': [C.plum, C.night, C.slate],
  'water-spirits': [C.night, C.blue, C.cyan],
  cursed: [C.ink, C.wine, C.rust], // v0.5 (T5.13)
};

/** Two matching eyes, mirrored about the middle. */
const eyes = (
  c: Canvas,
  y: number,
  dx: number,
  w: number,
  h: number,
  color: string,
  pupil?: string,
): void => {
  c.mirrored((set) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(CX - dx - i, y + j, color);
    if (pupil) set(CX - dx - Math.floor(w / 2), y + Math.floor(h / 2), pupil);
  });
};

const fangs = (c: Canvas, y: number, dx: number, len: number, color = C.frost): void => {
  c.mirrored((set) => {
    for (let j = 0; j < len; j++) set(CX - dx, y + j, color);
  });
};

const wolf = (c: Canvas): void => {
  const fur = [C.ash, C.stone, C.coal] as const;
  // Ears.
  c.mirrored((set) => {
    for (let j = 0; j < 12; j++)
      for (let i = 0; i < 7 - Math.floor(j / 2); i++)
        set(16 + i + Math.floor(j / 3), 6 + j, j < 4 ? fur[0] : fur[1]);
  });
  c.ellipse(CX, 28, 16, 16, (x, y) => (y < 22 ? fur[1] : x < 24 || x > 40 ? fur[2] : fur[1]));
  // Long muzzle.
  c.ellipse(CX, 40, 8, 11, fur[0]);
  c.rect(CX - 2, 24, 4, 12, fur[2]);
  c.ellipse(CX, 50, 7, 3, C.blood);
  c.rect(CX - 5, 47, 10, 4, C.ink);
  fangs(c, 47, 4, 4);
  c.ellipse(CX, 33, 3, 2, C.ink);
  // Gaunt cheeks.
  c.mirrored((set) => {
    for (let j = 0; j < 8; j++) set(19 + Math.floor(j / 3), 30 + j, fur[2]);
  });
  eyes(c, 24, 8, 3, 2, C.gold, C.ink);
};

const kikimora = (c: Canvas): void => {
  const hair = [C.stone, C.coal, C.ink] as const;
  const r = seedRolls('kikimora');
  // Stringy hair falling past the face.
  c.rect(14, 10, 36, 50, hair[1]);
  for (let i = 0; i < 90; i++) c.set(14 + r() * 36, 12 + r() * 48, r() < 0.5 ? hair[0] : hair[2]);
  c.ellipse(CX, 28, 12, 15, (x, y) => (y > 36 ? C.bone : x < 28 ? C.bone : C.ash));
  eyes(c, 26, 7, 4, 4, C.frost, C.ink);
  c.mirrored((set) => set(CX - 7 - 1, 22, C.ink));
  c.rect(CX - 4, 38, 8, 2, C.ink);
  c.rect(CX - 3, 40, 6, 1, C.blood);
  // Moss gown and spindle.
  c.rect(16, 50, 32, 14, C.moss);
  for (let i = 0; i < 20; i++) c.set(16 + r() * 32, 50 + r() * 14, C.pine);
  c.line(52, 12, 46, 58, C.brown, 2);
  c.ellipse(52, 12, 3, 3, C.bone);
};

const upyr = (c: Canvas): void => {
  // Dark collar rising behind a corpse-pale head.
  c.rect(8, 40, 48, 24, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 22; j++)
      for (let i = 0; i <= 8 + Math.floor(j / 2); i++)
        set(8 + i, 42 - j + 0, j % 2 ? C.wine : C.ink);
  });
  c.ellipse(CX, 28, 13, 17, (x, y) => (x > 38 || y > 40 ? C.ash : C.bone));
  c.rect(CX - 11, 11, 22, 6, C.ink);
  c.mirrored((set) => {
    set(CX - 11, 17, C.ink);
    set(CX - 10, 18, C.ink);
  });
  // Sunken, red-ringed eyes.
  eyes(c, 26, 8, 4, 3, C.red, C.frost);
  c.mirrored((set) => {
    for (let i = 0; i < 5; i++) set(CX - 9 - i + 1, 24, C.violet);
  });
  c.mirrored((set) => {
    set(CX - 3, 33, C.stone);
    set(CX - 2, 34, C.stone);
  });
  // Mouth with blood and fangs.
  c.rect(CX - 6, 40, 12, 4, C.ink);
  c.rect(CX - 5, 43, 10, 2, C.blood);
  fangs(c, 40, 4, 4);
  c.rect(CX + 1, 45, 2, 6, C.red);
};

const rusalka = (c: Canvas): void => {
  const hair = [C.lime, C.grass, C.moss] as const;
  const r = seedRolls('rusalka');
  // Long wet river-green hair.
  c.ellipse(CX, 26, 20, 22, hair[1]);
  c.rect(12, 26, 40, 38, hair[1]);
  for (let i = 0; i < 120; i++) c.set(12 + r() * 40, 8 + r() * 56, r() < 0.4 ? hair[0] : hair[2]);
  c.ellipse(CX, 28, 12, 15, (x, y) => (y > 38 ? C.ice : x < 28 ? C.frost : C.ice));
  c.rect(CX - 12, 12, 24, 5, hair[1]);
  // Large dark eyes, pale lips, drops of water.
  eyes(c, 26, 7, 4, 5, C.night, C.cyan);
  c.rect(CX - 3, 38, 6, 2, C.rose);
  c.mirrored((set) => {
    set(CX - 12, 40, C.frost);
    set(CX - 14, 48, C.cyan);
    set(CX - 17, 54, C.cyan);
  });
  // Reeds in the foreground.
  c.line(6, 62, 8, 34, C.moss, 2);
  c.line(56, 62, 54, 38, C.moss, 2);
  c.rect(6, 30, 3, 8, C.brown);
  c.rect(53, 34, 3, 8, C.brown);
};

const poludnitsa = (c: Canvas): void => {
  // The noon sun behind a white veil, with wheat.
  c.ellipse(CX, 24, 26, 26, C.orange);
  c.ellipse(CX, 24, 21, 21, C.gold);
  c.ellipse(CX, 24, 15, 15, C.cream);
  for (let a = 0; a < 16; a++) {
    const x = CX + Math.round(Math.cos((a * Math.PI) / 8) * 29);
    const y = 24 + Math.round(Math.sin((a * Math.PI) / 8) * 29);
    c.line(
      CX + Math.round(Math.cos((a * Math.PI) / 8) * 24),
      24 + Math.round(Math.sin((a * Math.PI) / 8) * 24),
      x,
      y,
      C.gold,
      1,
    );
  }
  // Veil.
  c.ellipse(CX, 32, 16, 28, C.frost);
  c.rect(CX - 15, 44, 30, 20, C.frost);
  c.mirrored((set) => {
    for (let j = 0; j < 20; j++) set(CX - 15 - (j % 5 === 0 ? 1 : 0), 44 + j, C.bone);
  });
  c.ellipse(CX, 28, 10, 13, C.cream);
  // Eyes are bright white, with no pupils: staring.
  eyes(c, 25, 6, 3, 3, C.frost);
  c.mirrored((set) => set(CX - 6 - 1, 22, C.sand));
  c.rect(CX - 3, 36, 6, 1, C.rust);
  // Wheat stalks.
  for (const x of [8, 14, 50, 56]) {
    c.line(x, 63, x, 40, C.sand, 1);
    for (let j = 0; j < 6; j++) c.set(x + (j % 2 ? 1 : -1), 40 + j * 2, C.gold);
  }
};

const vodyanoy = (c: Canvas): void => {
  const skin = [C.grass, C.moss, C.pine] as const;
  // Wide frog head with bulging eyes.
  c.ellipse(CX, 36, 24, 18, (x, y) => (y < 26 ? skin[0] : y > 44 ? skin[2] : skin[1]));
  c.mirrored((set) => {
    for (let j = -6; j <= 6; j++)
      for (let i = -6; i <= 6; i++) if (i * i + j * j <= 38) set(CX - 11 + i, 20 + j, skin[0]);
  });
  eyes(c, 17, 11, 5, 6, C.gold, C.ink);
  c.mirrored((set) => {
    set(CX - 11 - 4, 17, C.frost);
  });
  c.rect(CX - 1, 34, 1, 3, skin[2]);
  c.rect(CX, 34, 1, 3, skin[2]);
  // Great wet mouth and beard of weed.
  c.rect(CX - 17, 41, 34, 3, C.ink);
  c.rect(CX - 15, 44, 30, 2, C.blood);
  const r = seedRolls('vodyanoy');
  for (let i = 0; i < 18; i++) {
    const x = 12 + i * 2;
    c.line(x, 47, x + (r() < 0.5 ? -1 : 1), 47 + 6 + r() * 12, i % 2 ? C.moss : C.pine, 2);
  }
  // Water drips and lily pad.
  c.mirrored((set) => {
    set(CX - 22, 6, C.cyan);
    set(CX - 18, 11, C.ice);
  });
  c.ellipse(CX, 11, 8, 3, C.moss);
};

const draugr = (c: Canvas): void => {
  // A rusted helm over a blue-grey dead face, with ice-blue eyes.
  c.ellipse(CX, 30, 15, 18, (x, y) => (y > 38 ? C.slate : x > 38 ? C.slate : C.dusk));
  c.rect(CX - 17, 8, 34, 14, C.coal);
  c.ellipse(CX, 15, 17, 11, (x, y) => (y < 11 ? C.stone : C.coal));
  c.rect(CX - 17, 16, 34, 6, C.coal);
  c.rect(CX - 2, 6, 4, 26, C.stone);
  c.rect(CX - 1, 6, 1, 26, C.ash);
  // Rivets and rust.
  c.mirrored((set) => {
    set(CX - 14, 17, C.ash);
    set(CX - 10, 12, C.rust);
    set(CX - 15, 20, C.rust);
  });
  c.rect(CX - 9, 22, 18, 2, C.ink);
  eyes(c, 26, 8, 4, 3, C.ice, C.cyan);
  c.rect(CX - 4, 40, 8, 2, C.ink);
  for (let i = 0; i < 4; i++) c.rect(CX - 4 + i * 2, 42, 1, 2, C.bone);
  // Broken chain mail at the throat and a rust-red beard.
  c.rect(8, 50, 48, 14, C.coal);
  for (let j = 0; j < 14; j += 2)
    for (let i = 8; i < 56; i += 2) c.set(i + (j % 4 ? 1 : 0), 50 + j, C.stone);
  c.rect(CX - 8, 44, 16, 6, C.slate);
  c.mirrored((set) => {
    for (let j = 0; j < 8; j++) set(CX - 10, 36 + j, C.slate);
  });
};

const bies = (c: Canvas): void => {
  // Curling horns, goat face, red-black hide.
  c.mirrored((set) => {
    for (let j = 0; j < 20; j++) {
      const x = CX - 12 - Math.round(Math.sin(j / 5) * 6) - Math.floor(j / 6);
      set(x, 18 - j + 8, j > 14 ? C.bone : C.ash);
      set(x + 1, 18 - j + 8, C.stone);
      set(x - 1, 18 - j + 8, C.coal);
    }
  });
  c.ellipse(CX, 32, 15, 16, (x, y) => (y > 40 ? C.blood : x > 38 ? C.wine : C.red));
  c.mirrored((set) => {
    for (let i = 0; i < 6; i++) set(CX - 14 - i, 22 - Math.floor(i / 2), C.blood);
  });
  // Heavy brow and slit eyes.
  c.rect(CX - 14, 24, 28, 3, C.wine);
  eyes(c, 27, 8, 5, 3, C.gold, C.ink);
  c.rect(CX - 1, 31, 2, 6, C.wine);
  c.mirrored((set) => {
    set(CX - 3, 36, C.ink);
    set(CX - 4, 36, C.ink);
  });
  c.rect(CX - 8, 41, 16, 3, C.ink);
  fangs(c, 41, 6, 4);
  fangs(c, 41, 3, 3);
  // Goat beard.
  c.mirrored((set) => {
    for (let j = 0; j < 10; j++)
      for (let i = 0; i < 3 - Math.floor(j / 4); i++) set(CX - i, 46 + j, C.ink);
  });
  // Smoulder.
  c.mirrored((set) => {
    set(CX - 22, 52, C.orange);
    set(CX - 18, 56, C.gold);
  });
};

const leshy = (c: Canvas): void => {
  const bark = [C.rust, C.brown, C.brownDark] as const;
  const r = seedRolls('leshy');
  // Antlers of branches.
  c.mirrored((set) => {
    for (let j = 0; j < 24; j++) set(CX - 10 - Math.floor(j / 2), 18 - j + 4, bark[1]);
    for (let j = 0; j < 8; j++) set(CX - 14 - j, 14 - j, bark[1]);
    for (let j = 0; j < 6; j++) set(CX - 20 + Math.floor(j / 2), 12 + j - 6, bark[0]);
  });
  // Bark head with moss.
  c.ellipse(CX, 30, 15, 19, (x) => (x < 24 ? bark[2] : x > 40 ? bark[2] : bark[1]));
  for (let i = 0; i < 70; i++) {
    const x = 18 + r() * 28;
    const y = 12 + r() * 36;
    c.set(x, y, r() < 0.5 ? bark[2] : bark[0]);
  }
  for (let j = 14; j < 46; j += 6) c.line(CX - 14, j, CX - 10, j + 2, bark[2], 1);
  c.ellipse(CX, 12, 12, 4, C.moss);
  // Hollow knot eyes with green fire.
  eyes(c, 26, 8, 5, 5, C.ink);
  eyes(c, 27, 7, 3, 3, C.lime);
  c.rect(CX - 1, 32, 2, 7, bark[2]);
  c.rect(CX - 6, 43, 12, 3, C.ink);
  // Long moss beard.
  c.ellipse(CX, 50, 14, 10, C.moss);
  for (let i = 0; i < 60; i++)
    c.set(CX - 14 + r() * 28, 44 + r() * 20, r() < 0.5 ? C.grass : C.pine);
  c.rect(CX - 6, 43, 12, 3, C.ink);
};

const strzyga = (c: Canvas): void => {
  const r = seedRolls('strzyga');
  // Wild white hair standing out.
  c.ellipse(CX, 26, 24, 22, C.bone);
  for (let i = 0; i < 160; i++) c.set(8 + r() * 48, 4 + r() * 50, r() < 0.5 ? C.frost : C.ash);
  c.ellipse(CX, 30, 13, 17, (x, y) => (y > 40 ? C.stone : x < 28 ? C.ash : C.stone));
  c.rect(CX - 12, 13, 24, 5, C.ash);
  // Two pupils in each eye: two souls.
  eyes(c, 26, 8, 5, 4, C.gold);
  c.mirrored((set) => {
    set(CX - 8 - 1, 27, C.ink);
    set(CX - 8 - 3, 27, C.ink);
  });
  c.mirrored((set) => {
    set(CX - 2, 33, C.coal);
    set(CX - 3, 35, C.coal);
  });
  // Fanged grin, and a dark gown.
  c.rect(CX - 8, 41, 16, 3, C.ink);
  fangs(c, 41, 6, 3);
  fangs(c, 41, 3, 4);
  fangs(c, 41, 0, 4);
  c.rect(12, 52, 40, 12, C.plum);
  c.rect(CX - 8, 48, 16, 6, C.ash);
  c.mirrored((set) => {
    set(CX - 18, 56, C.violet);
    set(CX - 12, 58, C.violet);
  });
};

const huldra = (c: Canvas): void => {
  const hair = [C.gold, C.sand, C.clay] as const;
  const r = seedRolls('huldra');
  // Long golden hair, a flower crown, and a face like bark on one side.
  c.ellipse(CX, 28, 20, 24, hair[1]);
  c.rect(12, 28, 40, 36, hair[1]);
  for (let i = 0; i < 120; i++) c.set(12 + r() * 40, 6 + r() * 56, r() < 0.4 ? hair[0] : hair[2]);
  c.ellipse(CX, 28, 12, 15, (x, y) => (x > 32 ? C.rust : y > 38 ? C.clay : C.cream));
  for (let j = 0; j < 22; j += 4) c.line(CX + 1, 17 + j, CX + 8, 19 + j, C.brown, 1);
  c.rect(CX - 12, 12, 24, 4, hair[1]);
  // Crown of small flowers.
  for (let i = 0; i < 6; i++) {
    c.set(CX - 12 + i * 5, 12, i % 2 ? C.rose : C.frost);
    c.set(CX - 12 + i * 5, 11, C.gold);
  }
  eyes(c, 26, 7, 4, 3, C.moss, C.ink);
  c.rect(CX - 3, 37, 6, 2, C.rose);
  // The cow's tail curling out beside her.
  c.line(54, 62, 58, 48, C.brown, 2);
  c.ellipse(58, 46, 3, 4, C.brownDark);
};

const nix = (c: Canvas): void => {
  const mane = [C.cyan, C.blue, C.night] as const;
  const r = seedRolls('nix');
  // A horse of the river: long narrow head, mane flowing like water.
  c.mirrored((set) => {
    for (let j = 0; j < 10; j++)
      for (let i = 0; i < 5 - Math.floor(j / 3); i++) set(CX - 11 + i, 4 + j, C.ash);
  });
  c.ellipse(CX, 22, 22, 24, mane[1]);
  c.rect(10, 22, 44, 40, mane[1]);
  for (let i = 0; i < 160; i++) c.set(10 + r() * 44, 4 + r() * 58, r() < 0.4 ? mane[0] : mane[2]);
  c.ellipse(CX, 24, 11, 14, (x) => (x > 34 ? C.dusk : C.bone));
  c.ellipse(CX, 42, 8, 13, (x) => (x > 34 ? C.dusk : C.bone));
  c.rect(CX - 8, 14, 16, 3, mane[2]);
  eyes(c, 24, 8, 3, 3, C.cyan, C.ink);
  c.mirrored((set) => {
    set(CX - 4, 48, C.ink);
    set(CX - 4, 49, C.ink);
  });
  c.rect(CX - 5, 54, 10, 2, C.ink);
  // Water streaming down the face.
  c.mirrored((set) => {
    set(CX - 11, 36, C.ice);
    set(CX - 12, 40, C.frost);
    set(CX - 13, 46, C.ice);
    set(CX - 15, 56, C.ice);
  });
};

const DRAW: Partial<Record<MonsterId, (c: Canvas) => void>> = {
  wolf,
  kikimora,
  upyr,
  rusalka,
  poludnitsa,
  vodyanoy,
  draugr,
  bies,
  leshy,
  strzyga,
  huldra,
  nix,
  'gloam-moths': gloamMoths,
  ribbonshade,
  'anvil-wight': anvilWight,
  rimewrought,
};

export const hasDrawing = (id: MonsterId): boolean => DRAW[id] !== undefined;

export const drawMonster = (id: MonsterId): Canvas => {
  const [dark, mid, light] = BACKDROP[monsters[id].family];
  const c = new Canvas();
  c.fill(dark);
  c.ellipse(CX, 32, 29, 30, mid);
  c.ellipse(CX, 32, 22, 23, light === C.cyan ? C.blue : dark);
  c.ellipse(CX, 32, 22, 23, (x, y) => ((x + y) % 7 === 0 ? mid : dark));
  const draw = DRAW[id];
  if (!draw) throw new Error(`No portrait drawing for ${id} yet (plan T5.13).`);
  draw(c);
  c.outline(C.ink);
  return c;
};
