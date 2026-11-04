// v1.7 (plan VB.2, D605, closes D490): verifies staged Batch 1 battle sprite strips (10 hunters,
// including bespoke D490 idle2 + lunge animations on Gest Tall-Torch and Ragnhild the Eye-Taker)
// and Contact Sheet 1 before any approved strip overwrites public/assets/sprites/.
import { existsSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { SPRITE_FRAME_NAMES, SPRITE_PX } from '../../src/content/assets';
import { v17Batch1Items } from '../../tools/contact-sheet-v17';
import { C, PALETTE_HEX } from '../../tools/pixel';

const STAGING = new URL('../../art-src/v1.7-staging/', import.meta.url);
const SHEET_1 = new URL(
  '../../docs/flesh-out/v1.7/contact-sheets/contact-sheet-1.png',
  import.meta.url,
);
const MARKS = new URL('../../docs/flesh-out/v1.7/art-marks.md', import.meta.url);

type FrameGrid = (string | null)[];

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

describe('v1.7 Batch 1 staged hunter battle sprites (VB.2, D605)', () => {
  it('lists all 10 Batch 1 hunters numbered 1..10 and generates Contact Sheet 1 + art-marks.md', () => {
    expect(v17Batch1Items).toHaveLength(10);
    expect(v17Batch1Items.map((x) => x.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(existsSync(SHEET_1)).toBe(true);
    const sheetPng = PNG.sync.read(readFileSync(SHEET_1));
    expect(sheetPng.width).toBeGreaterThan(800);
    expect(sheetPng.height).toBeGreaterThan(1000);
    const marks = readFileSync(MARKS, 'utf8');
    for (const item of v17Batch1Items) {
      expect(marks).toContain(`| ${item.n} | \`${item.spriteId}\` |`);
    }
  });

  it.each(v17Batch1Items)(
    '#$n $spriteId: 160x32 px, transparent outside silhouette, 100% Zughy-32, 5 distinct poses',
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

      // Lunge reaches further right than idle (facing right) and stays inside frame
      const xsOf = (g: FrameGrid): number[] =>
        g.flatMap((v, idx) => (v === null ? [] : [idx % SPRITE_PX]));
      const ysOf = (g: FrameGrid): number[] =>
        g.flatMap((v, idx) => (v === null ? [] : [Math.floor(idx / SPRITE_PX)]));

      const idleXs = xsOf(frames.idle ?? []);
      const lungeXs = xsOf(frames.lunge ?? []);
      expect(Math.max(...lungeXs)).toBeGreaterThan(Math.max(...idleXs));
      expect(Math.max(...lungeXs)).toBeLessThanOrEqual(31);

      // Lunge includes a custom weapon/attack flourish (more or altered pixels vs pure shift)
      expect(lungeXs.length).toBeGreaterThan(idleXs.length);

      // Downed rests on the ground line (y = 30) and sits lower than standing idle
      const idleYs = ysOf(frames.idle ?? []);
      const downedYs = ysOf(frames.downed ?? []);
      expect(Math.max(...downedYs)).toBe(Math.max(...idleYs));
      expect(Math.min(...downedYs)).toBeGreaterThan(Math.min(...idleYs));
    },
  );

  it('closes Batch 1 of D490: Gest Tall-Torch and Ragnhild Eye-Taker have bespoke idle2 + lunge animations', () => {
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
  });
});
