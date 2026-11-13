// v1.7 (plan VB.2, VB.4, VB.6, VB.8, D605, D611, D614, closes D490): verifies all 40 owner-approved
// battle sprite strips deployed to public/assets/sprites/ (#01-#40, with backups in
// art-src/previous-v1.7/sprites/ and frozen SHA-256 hashes in art-src/v1.7-sprite-hashes.json),
// staged strips (#01-#40), Contact Sheets 1, 2, 3 & 4, and bespoke D490 idle2 + lunge animations
// across all 3 legendary hunters (Gest, Ragnhild, Radmila).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { assetById, SPRITE_FRAME_NAMES, SPRITE_PX } from '../../src/content/assets';
import { DEPLOYED_V17_SPRITE_IDS, isV17Asset } from '../../tools/contact-sheet-data';
import {
  v17Batch1Items,
  v17Batch2Items,
  v17Batch3Items,
  v17Batch4Items,
} from '../../tools/contact-sheet-v17';
import { C, PALETTE_HEX } from '../../tools/pixel';

const STAGING = new URL('../../art-src/v1.7-staging/', import.meta.url);
const PUBLIC_SPRITES = new URL('../../public/assets/sprites/', import.meta.url);
const PREVIOUS_SPRITES = new URL('../../art-src/previous-v1.7/sprites/', import.meta.url);
const HASHES_FILE = new URL('../../art-src/v1.7-sprite-hashes.json', import.meta.url);
const V14_HASHES_FILE = new URL('../../art-src/v1.4-hashes.json', import.meta.url);
const SHEET_1 = new URL(
  '../../docs/flesh-out/v1.7/contact-sheets/contact-sheet-1.png',
  import.meta.url,
);
const SHEET_2 = new URL(
  '../../docs/flesh-out/v1.7/contact-sheets/contact-sheet-2.png',
  import.meta.url,
);
const SHEET_3 = new URL(
  '../../docs/flesh-out/v1.7/contact-sheets/contact-sheet-3.png',
  import.meta.url,
);
const SHEET_4 = new URL(
  '../../docs/flesh-out/v1.7/contact-sheets/contact-sheet-4.png',
  import.meta.url,
);
const MARKS = new URL('../../docs/flesh-out/v1.7/art-marks.md', import.meta.url);

type FrameGrid = (string | null)[];

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');

const readStrip = (stagingFile: string): { png: PNG; frames: Record<string, FrameGrid> } => {
  const raw = readFileSync(new URL(stagingFile, STAGING));
  const png = PNG.sync.read(raw);
  const frames: Record<string, FrameGrid> = {};
  SPRITE_FRAME_NAMES.forEach((name, fi) => {
    const grid: FrameGrid = Array.from({ length: SPRITE_PX * SPRITE_PX }, () => null);
    for (let y = 0; y < SPRITE_PX; y++) {
      for (let x = 0; x < SPRITE_PX; x++) {
        const idx = (y * png.width + (fi * SPRITE_PX + x)) * 4;
        const a = png.data[idx + 3] ?? 0;
        if (a === 0) continue;
        expect(a, `${stagingFile} ${name} (${x},${y}) alpha must be 0 or 255`).toBe(255);
        const hex = [0, 1, 2]
          .map((k) => (png.data[idx + k] ?? 0).toString(16).padStart(2, '0'))
          .join('');
        grid[y * SPRITE_PX + x] = hex;
      }
    }
    frames[name] = grid;
  });
  return { png, frames };
};

const plainBob = (idle: FrameGrid, bobAbove = 22): FrameGrid => {
  const out: FrameGrid = Array.from({ length: SPRITE_PX * SPRITE_PX }, () => null);
  for (let y = 0; y < SPRITE_PX; y++) {
    for (let x = 0; x < SPRITE_PX; x++) {
      out[y * SPRITE_PX + x] =
        y >= bobAbove
          ? (idle[y * SPRITE_PX + x] ?? null)
          : y === 0
            ? null
            : (idle[(y - 1) * SPRITE_PX + x] ?? null);
    }
  }
  return out;
};

describe('v1.7 deployed 40 battle sprite strips (VB.2, VB.4, VB.6 & VB.8, D605, D611, D614)', () => {
  const deployedItems = [
    ...v17Batch1Items,
    ...v17Batch2Items,
    ...v17Batch3Items,
    ...v17Batch4Items,
  ];
  const frozenHashes = JSON.parse(readFileSync(HASHES_FILE, 'utf8')) as Record<string, string>;
  const v14Hashes = JSON.parse(readFileSync(V14_HASHES_FILE, 'utf8')) as Record<string, string>;
  const marks = readFileSync(MARKS, 'utf8');

  it('deploys all 40 owner-approved sprite rows (#01-#40) with matching frozen hashes and updates v1.4 unlit hash', () => {
    expect(deployedItems).toHaveLength(40);
    expect([...DEPLOYED_V17_SPRITE_IDS].sort()).toEqual(
      deployedItems.map((x) => x.spriteId).sort(),
    );
    expect(Object.keys(frozenHashes).sort()).toEqual([...DEPLOYED_V17_SPRITE_IDS].sort());
    for (const item of deployedItems) {
      expect(isV17Asset(item.spriteId)).toBe(true);
      expect(marks).toMatch(
        new RegExp(`\\| ${item.n} \\| \`${item.spriteId}\` \\| [^|]+ \\| Keep \\|`),
      );
    }
    expect(v14Hashes['sprite.monster.unlit']).toBe(frozenHashes['sprite.monster.unlit']);
  });

  it.each(deployedItems)(
    'deployed #$n $spriteId matches frozen SHA-256 hash and preserves previous procedural backup',
    (item) => {
      const entry = assetById.get(item.spriteId);
      expect(entry?.source).toBe('generated');
      const liveBuf = readFileSync(new URL(item.stagingFile, PUBLIC_SPRITES));
      const stageBuf = readFileSync(new URL(item.stagingFile, STAGING));
      expect(liveBuf.equals(stageBuf)).toBe(true);
      expect(sha256(liveBuf)).toBe(frozenHashes[item.spriteId]);

      const backupUrl = new URL(item.stagingFile, PREVIOUS_SPRITES);
      expect(existsSync(backupUrl), `backup ${item.stagingFile}`).toBe(true);
      const backupBuf = readFileSync(backupUrl);
      expect(backupBuf.length).toBeGreaterThan(200);
      expect(backupBuf.equals(liveBuf)).toBe(false);
    },
  );
});

describe('v1.7 staged battle sprite strips and contact sheets (#01-#40, VB.2, VB.4, VB.6, VB.8, D605)', () => {
  const allItems = [...v17Batch1Items, ...v17Batch2Items, ...v17Batch3Items, ...v17Batch4Items];

  it('lists all 40 strips (#01-#40) and verifies Contact Sheets 1–4 + art-marks.md', () => {
    expect(v17Batch1Items).toHaveLength(10);
    expect(v17Batch2Items).toHaveLength(10);
    expect(v17Batch3Items).toHaveLength(10);
    expect(v17Batch4Items).toHaveLength(10);
    expect(allItems.map((x) => x.n)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(v17Batch1Items.every((x) => x.facing === 'right')).toBe(true);
    expect(v17Batch2Items.filter((x) => x.facing === 'right')).toHaveLength(4);
    expect(v17Batch2Items.filter((x) => x.facing === 'left')).toHaveLength(6);
    expect(v17Batch3Items.every((x) => x.facing === 'left')).toBe(true);
    expect(v17Batch4Items.every((x) => x.facing === 'left')).toBe(true);

    for (const sheetUrl of [SHEET_1, SHEET_2, SHEET_3, SHEET_4]) {
      expect(existsSync(sheetUrl)).toBe(true);
      const sheetPng = PNG.sync.read(readFileSync(sheetUrl));
      expect(sheetPng.width).toBeGreaterThan(800);
      expect(sheetPng.height).toBeGreaterThan(1000);
    }

    const marks = readFileSync(MARKS, 'utf8');
    for (const item of allItems) {
      expect(marks).toContain(`| ${item.n} | \`${item.spriteId}\` |`);
    }
  });

  it.each(allItems)(
    '#$n $spriteId ($facing): 160x32 px, transparent outside silhouette, 100% Zughy-32, 5 distinct poses',
    (item) => {
      const { png, frames } = readStrip(item.stagingFile);
      expect([png.width, png.height]).toEqual([160, 32]);

      // Corners of each 32x32 frame are transparent background
      SPRITE_FRAME_NAMES.forEach((fname, fi) => {
        const topLeftAlpha = png.data[fi * SPRITE_PX * 4 + 3] ?? 0;
        expect(topLeftAlpha, `${item.stagingFile} ${fname} (0,0) transparent`).toBe(0);
      });

      // Every opaque pixel is strictly in Zughy-32
      for (const fname of SPRITE_FRAME_NAMES) {
        const g = frames[fname] ?? [];
        const filled = g.filter((v): v is string => v !== null);
        expect(filled.length, `${item.stagingFile} ${fname} pixel count`).toBeGreaterThan(80);
        for (const hex of filled) {
          expect(PALETTE_HEX.has(hex), `${item.stagingFile} ${fname} color ${hex}`).toBe(true);
        }
      }

      // All 5 poses are pairwise distinct
      for (let i = 0; i < SPRITE_FRAME_NAMES.length; i++) {
        for (let j = i + 1; j < SPRITE_FRAME_NAMES.length; j++) {
          const a = frames[SPRITE_FRAME_NAMES[i] ?? 'idle'] ?? [];
          const b = frames[SPRITE_FRAME_NAMES[j] ?? 'idle'] ?? [];
          const identical = a.every((v, k) => v === b[k]);
          expect(
            identical,
            `${item.stagingFile}: ${SPRITE_FRAME_NAMES[i]} and ${SPRITE_FRAME_NAMES[j]} must differ`,
          ).toBe(false);
        }
      }

      // Hit frame uses only frost-white body flash + ink outline
      const hitColors = new Set((frames.hit ?? []).filter((v): v is string => v !== null));
      expect([...hitColors].sort()).toEqual([C.ink, C.frost].sort());

      // Lunge steps toward the foe (right for hunters, left for monsters) and stays inside frame
      const xsOf = (g: FrameGrid): number[] =>
        g.flatMap((v, idx) => (v === null ? [] : [idx % SPRITE_PX]));
      const ysOf = (g: FrameGrid): number[] =>
        g.flatMap((v, idx) => (v === null ? [] : [Math.floor(idx / SPRITE_PX)]));

      const idleXs = xsOf(frames.idle ?? []);
      const lungeXs = xsOf(frames.lunge ?? []);
      if (item.facing === 'right') {
        expect(Math.max(...lungeXs)).toBeGreaterThan(Math.max(...idleXs));
        expect(Math.max(...lungeXs)).toBeLessThanOrEqual(31);
      } else {
        expect(Math.min(...lungeXs)).toBeLessThan(Math.min(...idleXs));
        expect(Math.min(...lungeXs)).toBeGreaterThanOrEqual(0);
      }

      // Lunge includes a custom weapon/attack flourish (more pixels vs pure shift)
      expect(lungeXs.length).toBeGreaterThan(idleXs.length);

      // Downed rests on the ground line (y = 30) and sits lower than standing idle
      const idleYs = ysOf(frames.idle ?? []);
      const downedYs = ysOf(frames.downed ?? []);
      expect(Math.max(...downedYs)).toBe(30);
      expect(Math.max(...idleYs)).toBeGreaterThanOrEqual(29);
      expect(Math.max(...idleYs)).toBeLessThanOrEqual(30);
      expect(Math.min(...downedYs)).toBeGreaterThanOrEqual(Math.min(...idleYs));
    },
  );

  it('closes D490 across all 3 legendary hunters: Gest, Ragnhild, and Radmila have bespoke idle2 + lunge animations', () => {
    const gest = readStrip('hunter-gest-tall-torch.png').frames;
    const gestPlain = plainBob(gest.idle ?? []);
    const gestDiffs = (gest.idle2 ?? []).filter((v, i) => v !== gestPlain[i]);
    expect(gestDiffs.length, 'Gest bespoke torch flame dance in idle2').toBeGreaterThanOrEqual(10);
    const fireSet = new Set<string>([C.red, C.orange, C.gold, C.cream]);
    const lungeFireRight = (gest.lunge ?? []).filter(
      (v, idx) => v !== null && idx % SPRITE_PX >= 26 && fireSet.has(v),
    );
    expect(lungeFireRight.length, 'Gest sweeping fire plume in lunge').toBeGreaterThanOrEqual(12);

    const ragnhild = readStrip('hunter-ragnhild-eye-taker.png').frames;
    const ragPlain = plainBob(ragnhild.idle ?? []);
    const ragDiffs = (ragnhild.idle2 ?? []).filter((v, i) => v !== ragPlain[i]);
    expect(ragDiffs.length, 'Ragnhild bespoke bone-needle glint in idle2').toBeGreaterThanOrEqual(
      6,
    );
    const frostSet = new Set<string>([C.frost, C.ice, C.cyan]);
    const lungeNeedleRight = (ragnhild.lunge ?? []).filter(
      (v, idx) => v !== null && idx % SPRITE_PX >= 26 && frostSet.has(v),
    );
    expect(lungeNeedleRight.length, 'Ragnhild bone-needle thrust in lunge').toBeGreaterThanOrEqual(
      8,
    );

    const radmila = readStrip('hunter-radmila-of-the-reeds.png').frames;
    const radPlain = plainBob(radmila.idle ?? []);
    const radDiffs = (radmila.idle2 ?? []).filter((v, i) => v !== radPlain[i]);
    expect(radDiffs.length, 'Radmila bespoke marsh-ward shimmer in idle2').toBeGreaterThanOrEqual(
      10,
    );
    const wardSet = new Set<string>([C.frost, C.ice, C.cyan, C.lime, C.grass]);
    const lungeWardRight = (radmila.lunge ?? []).filter(
      (v, idx) => v !== null && idx % SPRITE_PX >= 26 && wardSet.has(v),
    );
    expect(
      lungeWardRight.length,
      'Radmila sweeping marsh-ward crescent in lunge',
    ).toBeGreaterThanOrEqual(12);
  });
});
