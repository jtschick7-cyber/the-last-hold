// v1.7 (plan VB.2, VB.4, VB.6, VB.8; D605): numbered Keep/Redraw contact sheets for the 40 battle
// sprite strips in 4 batches of 10. Rendered deterministically with pngjs (nearest-neighbor 2×
// frames beside 1× 64 px v1.6 portraits on both dark #302c2e and light #cfc6b8 theme backgrounds).
// Run: npx vite-node tools/contact-sheet-v17.ts -- --batch 1|2|3|4
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  assetById,
  eventCreatureSpriteId,
  guardianSpriteId,
  hunterSpriteId,
  monsterSpriteId,
  SPRITE_FRAME_NAMES,
  SPRITE_PX,
} from '../src/content/assets';
import { GUARDIAN_IDS } from '../src/content/delves/guardians';
import { hunters, type HunterId } from '../src/content/hunters';
import { EVENT_CREATURE_IDS } from '../src/content/hunts';
import { monsters, type MonsterId } from '../src/content/monsters';
import { packPng } from './png-pack';

export interface V17SheetItem {
  readonly n: number;
  readonly spriteId: string;
  readonly stagingFile: string;
  readonly portraitFile: string;
  readonly title: string;
  readonly facing: 'left' | 'right';
  readonly note?: string;
  /** `previous-strip` (VB.8): no v1.6 portrait exists, so `portraitFile` is a strip in art-src/previous-v1.7/sprites/. */
  readonly refKind?: 'portrait' | 'previous-strip';
}

const BATCH_1_HUNTERS: readonly HunterId[] = [
  'arvid',
  'bjarna',
  'gest-tall-torch',
  'halvar',
  'ostap',
  'radek',
  'ragnhild-eye-taker',
  'sigrun',
  'stanko',
  'zora',
];

const BATCH_2_HUNTERS: readonly HunterId[] = ['herdis', 'radmila-of-the-reeds', 'toma', 'vesna'];

const BATCH_2_MONSTERS: readonly MonsterId[] = [
  'wolf',
  'bies',
  'leshy',
  'huldra',
  'nix',
  'vodyanoy',
];

const BATCH_3_MONSTERS: readonly MonsterId[] = [
  'rusalka',
  'poludnitsa',
  'kikimora',
  'gloam-moths',
  'upyr',
  'strzyga',
  'draugr',
  'ribbonshade',
  'anvil-wight',
  'rimewrought',
];

const BATCH_4_CREATURES: readonly (typeof EVENT_CREATURE_IDS)[number][] = [
  'lindworm-of-velk-fjord',
  'barrow-king',
  'mother-of-the-river',
  'stoneback-fell-troll',
  'mara-of-kettle-barrow',
  'likho-one-eyed',
];

const BESPOKE_NOTE: Partial<Record<HunterId, string>> = {
  'gest-tall-torch': 'D490 TORCH IDLE2+LUNGE',
  'ragnhild-eye-taker': 'D490 NEEDLE IDLE2+LUNGE',
  'radmila-of-the-reeds': 'D490 WARD IDLE2+LUNGE',
};

export const v17Batch1Items: readonly V17SheetItem[] = BATCH_1_HUNTERS.map((id, idx) => ({
  n: idx + 1,
  spriteId: hunterSpriteId(id),
  stagingFile: `hunter-${id}.png`,
  portraitFile: `portraits/${id}.png`,
  title: hunters[id].name,
  facing: 'right',
  ...(BESPOKE_NOTE[id] ? { note: BESPOKE_NOTE[id] } : {}),
}));

export const v17Batch2Items: readonly V17SheetItem[] = [
  ...BATCH_2_HUNTERS.map((id, idx): V17SheetItem => ({
    n: 11 + idx,
    spriteId: hunterSpriteId(id),
    stagingFile: `hunter-${id}.png`,
    portraitFile: `portraits/${id}.png`,
    title: hunters[id].name,
    facing: 'right',
    ...(BESPOKE_NOTE[id] ? { note: BESPOKE_NOTE[id] } : {}),
  })),
  ...BATCH_2_MONSTERS.map((id, idx): V17SheetItem => ({
    n: 15 + idx,
    spriteId: monsterSpriteId(id),
    stagingFile: `monster-${id}.png`,
    portraitFile: `portraits/monster-${id}.png`,
    title: monsters[id].name,
    facing: 'left',
  })),
];

export const v17Batch3Items: readonly V17SheetItem[] = BATCH_3_MONSTERS.map(
  (id, idx): V17SheetItem => ({
    n: 21 + idx,
    spriteId: monsterSpriteId(id),
    stagingFile: `monster-${id}.png`,
    portraitFile: `portraits/monster-${id}.png`,
    title: monsters[id].name,
    facing: 'left',
  }),
);

const spriteTitle = (spriteId: string): string =>
  (assetById.get(spriteId)?.label ?? spriteId).replace(/, battle sprite$/, '');

const NO_PORTRAIT_NOTE = 'NO V1.6 PORTRAIT - OLD STRIP SHOWN';

export const v17Batch4Items: readonly V17SheetItem[] = [
  ...BATCH_4_CREATURES.map((id, idx): V17SheetItem => ({
    n: 31 + idx,
    spriteId: eventCreatureSpriteId(id),
    stagingFile: `creature-${id}.png`,
    portraitFile: `portraits/creature-${id}.png`,
    title: spriteTitle(eventCreatureSpriteId(id)),
    facing: 'left',
  })),
  ...GUARDIAN_IDS.map((id, idx): V17SheetItem => ({
    n: 37 + idx,
    spriteId: guardianSpriteId(id),
    stagingFile: `guardian-${id}.png`,
    portraitFile: `guardian-${id}.png`,
    title: spriteTitle(guardianSpriteId(id)),
    facing: 'left',
    note: NO_PORTRAIT_NOTE,
    refKind: 'previous-strip',
  })),
  {
    n: 40,
    spriteId: 'sprite.monster.unlit',
    stagingFile: 'monster-unlit.png',
    portraitFile: 'portraits/monster-unlit.png',
    title: spriteTitle('sprite.monster.unlit'),
    facing: 'left',
  },
];

// Compact 5×7 uppercase/digit/symbol bitmap glyphs (5 bits per row, 7 rows).
const GLYPHS: Readonly<Record<string, readonly number[]>> = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 14],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 18, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 27, 17],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  '0': [14, 17, 19, 21, 25, 17, 14],
  '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 6, 8, 16, 31],
  '3': [30, 1, 1, 14, 1, 1, 30],
  '4': [2, 6, 10, 18, 31, 2, 2],
  '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [14, 16, 30, 17, 17, 17, 14],
  '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 1, 14],
  '#': [10, 31, 10, 10, 31, 10, 0],
  '-': [0, 0, 0, 31, 0, 0, 0],
  '+': [0, 4, 4, 31, 4, 4, 0],
  '.': [0, 0, 0, 0, 0, 4, 4],
  "'": [4, 4, 8, 0, 0, 0, 0],
  ':': [0, 4, 4, 0, 4, 4, 0],
  '(': [2, 4, 8, 8, 8, 4, 2],
  ')': [8, 4, 2, 2, 2, 4, 8],
  '/': [1, 2, 2, 4, 8, 8, 16],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};

const rgb = (hex: string): readonly [number, number, number] => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

const setPx = (
  png: PNG,
  x: number,
  y: number,
  [r, g, b]: readonly [number, number, number],
): void => {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const o = (y * png.width + x) * 4;
  png.data[o] = r;
  png.data[o + 1] = g;
  png.data[o + 2] = b;
  png.data[o + 3] = 255;
};

const fillRect = (png: PNG, x0: number, y0: number, w: number, h: number, hex: string): void => {
  const c = rgb(hex);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setPx(png, x, y, c);
};

const drawText = (
  png: PNG,
  x0: number,
  y0: number,
  text: string,
  hex: string,
  scale = 1,
): number => {
  const c = rgb(hex);
  let cx = x0;
  for (const rawCh of text.toUpperCase()) {
    const rows = GLYPHS[rawCh] ?? GLYPHS[' '] ?? [];
    for (let ry = 0; ry < 7; ry++) {
      const bits = rows[ry] ?? 0;
      for (let rx = 0; rx < 5; rx++) {
        if ((bits >> (4 - rx)) & 1) {
          for (let dy = 0; dy < scale; dy++)
            for (let dx = 0; dx < scale; dx++)
              setPx(png, cx + rx * scale + dx, y0 + ry * scale + dy, c);
        }
      }
    }
    cx += 6 * scale;
  }
  return cx;
};

const blitPng = (
  dst: PNG,
  src: PNG,
  sx0: number,
  sy0: number,
  sw: number,
  sh: number,
  dx0: number,
  dy0: number,
  scale: number,
): void => {
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = ((sy0 + y) * src.width + (sx0 + x)) * 4;
      if ((src.data[i + 3] ?? 0) === 0) continue;
      const c: readonly [number, number, number] = [
        src.data[i] ?? 0,
        src.data[i + 1] ?? 0,
        src.data[i + 2] ?? 0,
      ];
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++)
          setPx(dst, dx0 + x * scale + dx, dy0 + y * scale + dy, c);
    }
  }
};

const BATCH_HEADERS: Readonly<
  Record<1 | 2 | 3 | 4, { readonly banner: string; readonly section: string }>
> = {
  1: {
    banner: 'V1.7 CONTACT SHEET 1 - SPRITE BATCH 1: 10 HUNTERS (#01-#10)',
    section: '## Batch 1 — 10 Hunters (`VB.2`)',
  },
  2: {
    banner: 'V1.7 CONTACT SHEET 2 - SPRITE BATCH 2: 4 HUNTERS + 6 MONSTERS (#11-#20)',
    section: '## Batch 2 — 4 Hunters + 6 Woodland/Beast/Water Monsters (`VB.4`)',
  },
  3: {
    banner: 'V1.7 CONTACT SHEET 3 - SPRITE BATCH 3: 10 CONTRACT MONSTERS (#21-#30)',
    section: '## Batch 3 — 10 Remaining Contract Monsters (`VB.6`)',
  },
  4: {
    banner: 'V1.7 CONTACT SHEET 4 - BATCH 4: CREATURES, GUARDIANS, UNLIT (#31-#40)',
    section: '## Batch 4 — 6 Event Creatures, 3 Deep Guardians & The Unlit (`VB.8`)',
  },
};

export const renderV17ContactSheet = (
  batchNum: 1 | 2 | 3 | 4,
  items: readonly V17SheetItem[],
): string => {
  const outDir = new URL('../docs/flesh-out/v1.7/contact-sheets/', import.meta.url);
  mkdirSync(outDir, { recursive: true });
  const stagingRoot = new URL('../art-src/v1.7-staging/', import.meta.url);
  const assetsRoot = new URL('../public/assets/', import.meta.url);
  const previousSprites = new URL('../art-src/previous-v1.7/sprites/', import.meta.url);

  // Panel geometry: [64px portrait] + 14px + 5 × ([64px frame] + 6px) = 434px wide, 88px tall
  const PANEL_W = 438;
  const PANEL_H = 88;
  const ROW_W = PANEL_W * 2 + 26;
  const ROW_H = 118;
  const HEADER_H = 40;
  const W = ROW_W + 24;
  const H = HEADER_H + items.length * (ROW_H + 8) + 12;

  const sheet = new PNG({ width: W, height: H });
  fillRect(sheet, 0, 0, W, H, '302c2e');
  drawText(sheet, 12, 10, BATCH_HEADERS[batchNum].banner, 'f4cca1', 2);
  drawText(
    sheet,
    12,
    28,
    'V1.6 PORTRAIT (64PX) BESIDE ALL 5 FRAMES AT 2X (64PX) ON DARK (#302C2E) AND LIGHT (#CFC6B8) · ZUGHY 32',
    'a0938e',
    1,
  );

  items.forEach((item, idx) => {
    const ry = HEADER_H + idx * (ROW_H + 8);
    fillRect(sheet, 12, ry, ROW_W, ROW_H, '39314b');
    // 1px card border
    fillRect(sheet, 12, ry, ROW_W, 1, '564064');
    fillRect(sheet, 12, ry + ROW_H - 1, ROW_W, 1, '564064');

    let tx = drawText(sheet, 20, ry + 7, `#${String(item.n).padStart(2, '0')}`, 'f4b41b', 2);
    tx = drawText(sheet, tx + 8, ry + 7, item.title, 'dff6f5', 2);
    tx = drawText(sheet, tx + 10, ry + 11, item.spriteId, 'a0938e', 1);
    if (item.note) {
      fillRect(sheet, tx + 8, ry + 8, item.note.length * 6 + 8, 13, '5e3643');
      drawText(sheet, tx + 12, ry + 11, item.note, 'f4b41b', 1);
    }

    const isPrev = item.refKind === 'previous-strip';
    const portrait = PNG.sync.read(
      readFileSync(new URL(item.portraitFile, isPrev ? previousSprites : assetsRoot)),
    );
    const strip = PNG.sync.read(readFileSync(new URL(item.stagingFile, stagingRoot)));

    const drawPanel = (px0: number, bgHex: string, labelHex: string, themeTag: string): void => {
      const py0 = ry + 24;
      fillRect(sheet, px0, py0, PANEL_W, PANEL_H, bgHex);
      if (isPrev) blitPng(sheet, portrait, 0, 0, SPRITE_PX, SPRITE_PX, px0 + 8, py0 + 6, 2);
      else blitPng(sheet, portrait, 0, 0, 64, 64, px0 + 8, py0 + 6, 1);
      drawText(sheet, px0 + 10, py0 + 74, `${isPrev ? 'PREV' : 'V1.6'} ${themeTag}`, labelHex, 1);
      // Divider
      fillRect(sheet, px0 + 78, py0 + 6, 1, 66, labelHex);

      SPRITE_FRAME_NAMES.forEach((fname, fi) => {
        const fx = px0 + 88 + fi * 70;
        blitPng(sheet, strip, fi * SPRITE_PX, 0, SPRITE_PX, SPRITE_PX, fx, py0 + 6, 2);
        drawText(sheet, fx + 12, py0 + 74, fname, labelHex, 1);
      });
    };

    drawPanel(20, '302c2e', 'a0938e', 'DARK');
    drawPanel(20 + PANEL_W + 10, 'cfc6b8', '5a5353', 'LIGHT');
  });

  const rawSheet = PNG.sync.write(sheet);
  const packedSheet = packPng(rawSheet) ?? rawSheet;
  const outPath = new URL(`contact-sheet-${batchNum}.png`, outDir).pathname;
  writeFileSync(outPath, packedSheet);

  const marksUrl = new URL('../docs/flesh-out/v1.7/art-marks.md', import.meta.url);
  const sectionHeading = BATCH_HEADERS[batchNum].section;
  const tableLines = [
    sectionHeading,
    '',
    '| n | id | name | mark | notes |',
    '|---|---|---|---|---|',
    ...items.map((x) => `| ${x.n} | \`${x.spriteId}\` | ${x.title} | | ${x.note ?? ''} |`),
    '',
  ];
  if (!existsSync(marksUrl)) {
    writeFileSync(
      marksUrl,
      [
        '# Art marks (v1.7 Battle Sprites: Keep / Redraw)',
        '',
        'Reviewed in 4 batches of 10 (`VB.2`, `VB.4`, `VB.6`, `VB.8`, D605). The owner marks each row **Keep** (Approve) or **Redraw**; staged strips ship to `public/assets/sprites/` only after approval.',
        '',
        ...tableLines,
      ].join('\n'),
    );
  } else {
    const existing = readFileSync(marksUrl, 'utf8');
    if (!existing.includes(sectionHeading)) {
      writeFileSync(marksUrl, `${existing.trimEnd()}\n\n${tableLines.join('\n')}`);
    }
  }
  return outPath;
};

if (process.argv.includes('--batch')) {
  const idx = process.argv.indexOf('--batch');
  const b = Number(process.argv[idx + 1] ?? '1');
  if (b === 1 || b === 2 || b === 3 || b === 4) {
    const batchItems =
      b === 1
        ? v17Batch1Items
        : b === 2
          ? v17Batch2Items
          : b === 3
            ? v17Batch3Items
            : v17Batch4Items;
    // Also pack staged strips losslessly before rendering
    const stagingDir = new URL('../art-src/v1.7-staging/', import.meta.url);
    for (const item of batchItems) {
      const fUrl = new URL(item.stagingFile, stagingDir);
      const raw = readFileSync(fUrl);
      const packed = packPng(raw);
      if (packed) writeFileSync(fUrl, packed);
    }
    const written = renderV17ContactSheet(b, batchItems);
    console.log(`wrote ${written}`);
  }
}
