// Technical design §12.3 (plan T2.24): the monster portrait generator. Twelve 64 px
// portraits, one per species, drawn from small shapes in palette colors. Portraits only:
// no battle sprites (D-plan T2.24). Each family has a backdrop; each species has its own
// head, eyes and one telling feature. The PNGs are committed, so the game ships plain
// images that can be hand-edited or swapped later.

import type { FamilyId } from '../src/content/damage';
import { monsters, type MonsterId } from '../src/content/monsters';
import { anvilWight, gloamMoths, ribbonshade, rimewrought } from './draw-cursed';
import { C, Canvas, seedRolls } from './pixel';
import {
  bies,
  huldra,
  kikimora,
  nix,
  poludnitsa,
  rusalka,
  strzyga,
  vodyanoy,
} from './draw-monster-redraws';
import { CX, eyes, fangs } from './portrait-parts';

const BACKDROP: Record<FamilyId, readonly [string, string, string]> = {
  'beasts-and-wilds': [C.ink, C.coal, C.stone],
  'field-and-forest-spirits': [C.pine, C.moss, C.grass],
  'restless-dead': [C.plum, C.night, C.slate],
  'water-spirits': [C.night, C.blue, C.cyan],
  cursed: [C.ink, C.wine, C.rust], // v0.5 (T5.13)
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

const upyr = (c: Canvas): void => {
  // Dark collar rising behind a corpse-pale head.
  // v1.0 (TV.8a): a wider collar, rising higher on both sides.
  c.rect(2, 38, 60, 26, C.ink);
  c.mirrored((set) => {
    for (let j = 0; j < 28; j++)
      for (let i = 0; i <= 9 + Math.floor(j / 2); i++)
        set(3 + i, 44 - j + 0, j % 2 ? C.wine : C.ink);
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
  // The drip runs from the corner fang, not the middle of the mouth.
  c.rect(CX + 3, 44, 1, 2, C.frost);
  c.rect(CX + 3, 46, 1, 5, C.red);
  c.set(CX + 3, 52, C.blood);
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
