import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  CONNECTION_BITS,
  CLEARING_BOUNDS,
  GRID_COLS,
  GRID_ROWS,
} from '../../src/content/hold-layout';
import { palette } from '../../src/content/palette';
import { redrawIds } from '../../tools/contact-sheet-data';
import { packPng } from '../../tools/png-pack';
import { BATCH1_SUBJECTS, CONTACT_SHEET_PATHS, STAGING_DIR } from '../../tools/contact-sheet-v18';
import { WALL_MASKS, buildWallTile, drawWatchtower } from '../../tools/grid-v18-defense';
import { HALL_DOOR_BOX, HALL_LAMP_BOX, HALL_RANKS, drawHallV18 } from '../../tools/grid-v18-hall';
import {
  buildClearingBorderTile,
  computeClearingEdgeMasks,
  drawGroundV18,
} from '../../tools/grid-v18-terrain';

const ROOT = resolve(import.meta.dirname, '..', '..');
const PALETTE_SET = new Set((palette?.colors ?? []).map((h) => h.toLowerCase()));

function toHexRgb(r: number, g: number, b: number): string {
  return [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function rgbaAt(data: Uint8Array, byteOffset: number): readonly [number, number, number, number] {
  return [
    data[byteOffset] ?? 0,
    data[byteOffset + 1] ?? 0,
    data[byteOffset + 2] ?? 0,
    data[byteOffset + 3] ?? 0,
  ];
}

function checkPngCompliance(buf: Buffer, expectedW: number, expectedH: number) {
  const png = PNG.sync.read(buf);
  expect(png.width).toBe(expectedW);
  expect(png.height).toBe(expectedH);
  let opaqueCount = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b, a] = rgbaAt(png.data, i);
    expect(a === 0 || a === 255).toBe(true);
    if (a === 255) {
      opaqueCount++;
      const hex = toHexRgb(r, g, b);
      expect(PALETTE_SET.has(hex)).toBe(true);
    }
  }
  expect(opaqueCount).toBeGreaterThan(0);
  return png;
}

describe('v1.8 Grid Art Batch 1 (T18.8, D623, D475)', () => {
  it('enforces the D475 review cap of <= 12 subjects and clean staging metadata', () => {
    expect(BATCH1_SUBJECTS.length).toBeGreaterThan(0);
    expect(BATCH1_SUBJECTS.length).toBeLessThanOrEqual(12);
    const numbers = BATCH1_SUBJECTS.map((s) => s.num);
    expect(new Set(numbers).size).toBe(BATCH1_SUBJECTS.length);
  });

  it('builds 16 deterministic, distinct, boundary-continuous 32x32 wall masks (0..15)', () => {
    expect(WALL_MASKS).toHaveLength(16);
    const seen = new Set<string>();
    const canvases = WALL_MASKS.map((mask) => {
      const a = buildWallTile(mask).toPng(32);
      const b = buildWallTile(mask).toPng(32);
      expect(a.equals(b)).toBe(true);
      const png = checkPngCompliance(a, 32, 32);
      const digest = createHash('sha256').update(png.data).digest('hex');
      seen.add(digest);

      // Edge-connection geometry checks (N=1, E=2, S=4, W=8)
      const hasNorth = [...Array(32).keys()].some((x) => png.data[(0 * 32 + x) * 4 + 3] === 255);
      const hasSouth = [...Array(32).keys()].some((x) => png.data[(31 * 32 + x) * 4 + 3] === 255);
      const hasWest = [...Array(32).keys()].some((y) => png.data[(y * 32 + 0) * 4 + 3] === 255);
      const hasEast = [...Array(32).keys()].some((y) => png.data[(y * 32 + 31) * 4 + 3] === 255);
      expect(hasNorth).toBe((mask & CONNECTION_BITS.n) !== 0);
      expect(hasEast).toBe((mask & CONNECTION_BITS.e) !== 0);
      expect(hasSouth).toBe((mask & CONNECTION_BITS.s) !== 0);
      expect(hasWest).toBe((mask & CONNECTION_BITS.w) !== 0);
      return png;
    });
    expect(seen.size).toBe(16);

    // Adjacent wall continuity: East edge of mask E|W aligns flush with West edge of mask E|W
    const horizontal = canvases[CONNECTION_BITS.e | CONNECTION_BITS.w];
    if (!horizontal) throw new Error('Missing horizontal wall canvas');
    for (let y = 0; y < 32; y++) {
      const eastA = horizontal.data[(y * 32 + 31) * 4 + 3];
      const westA = horizontal.data[(y * 32 + 0) * 4 + 3];
      expect(eastA).toBe(westA);
    }

    // North-South continuity
    const vertical = canvases[CONNECTION_BITS.n | CONNECTION_BITS.s];
    if (!vertical) throw new Error('Missing vertical wall canvas');
    for (let x = 0; x < 32; x++) {
      const northA = vertical.data[(0 * 32 + x) * 4 + 3];
      const southA = vertical.data[(31 * 32 + x) * 4 + 3];
      expect(southA).toBe(northA);
    }

    // Watchtower joins seamlessly with horizontal E/W walls along both left and right edges
    const watchtower = checkPngCompliance(drawWatchtower().toPng(32), 32, 32);
    for (let y = 0; y < 32; y++) {
      const wtLeft = watchtower.data[(y * 32 + 0) * 4 + 3];
      const wtRight = watchtower.data[(y * 32 + 31) * 4 + 3];
      const wallEdge = horizontal.data[(y * 32 + 0) * 4 + 3];
      expect(wtLeft).toBe(wallEdge);
      expect(wtRight).toBe(wallEdge);
    }
  });

  it('builds 100% opaque distinct 32x32 ground tiles (grass, earth, flags) with dark courtyard contrast', () => {
    const flags = checkPngCompliance(drawGroundV18('flags').toPng(32), 32, 32);
    const grass = checkPngCompliance(drawGroundV18('grass').toPng(32), 32, 32);
    const earth = checkPngCompliance(drawGroundV18('earth').toPng(32), 32, 32);
    for (const png of [grass, earth, flags]) {
      for (let i = 0; i < png.data.length; i += 4) {
        expect(png.data[i + 3]).toBe(255);
      }
    }
    // Flagstones stay muted/darker (mean luminance < 120) so stone buildings read clearly on top
    let sumLum = 0;
    for (let i = 0; i < flags.data.length; i += 4) {
      const [r, g, b] = rgbaAt(flags.data, i);
      sumLum += 0.299 * r + 0.587 * g + 0.114 * b;
    }
    expect(sumLum / (32 * 32)).toBeLessThan(120);
  });

  it('builds deterministic clearing-border tiles and perimeter edge masks across 8x12 ranks', () => {
    for (const rank of HALL_RANKS) {
      const bounds = CLEARING_BOUNDS[rank];
      const masks = computeClearingEdgeMasks(bounds);
      expect(masks).toHaveLength(GRID_ROWS);
      expect(masks[0]).toHaveLength(GRID_COLS);
      // Clearing interior cells carry mask 0; directly adjacent outside cells carry boundary bit
      expect(masks[bounds.minY]?.[bounds.minX]).toBe(0);
      if (bounds.minY > 0) {
        const edge = masks[bounds.minY - 1]?.[bounds.minX] ?? 0;
        expect((edge & CONNECTION_BITS.s) !== 0).toBe(true);
      }
    }
    const f1a = buildClearingBorderTile('forest', 1, 0).toPng(32);
    const f1b = buildClearingBorderTile('forest', 1, 0).toPng(32);
    const f2 = buildClearingBorderTile('forest', 2, 0).toPng(32);
    const r1 = buildClearingBorderTile('ruin', 1, 0).toPng(32);
    const fEdge = buildClearingBorderTile('forest', 1, CONNECTION_BITS.s).toPng(32);
    expect(f1a.equals(f1b)).toBe(true);
    expect(f1a.equals(f2)).toBe(false);
    expect(f1a.equals(r1)).toBe(false);
    expect(f1a.equals(fEdge)).toBe(false);
    checkPngCompliance(f1a, 32, 32);
    checkPngCompliance(fEdge, 32, 32);
  });

  it('keeps Hearth Hall door and lamp overlay anchor zones opaque across all 4 ranks', () => {
    for (const rank of HALL_RANKS) {
      const png = checkPngCompliance(drawHallV18(rank).toPng(64), 64, 64);
      for (let y = HALL_DOOR_BOX.y; y < HALL_DOOR_BOX.y + HALL_DOOR_BOX.h; y++) {
        for (let x = HALL_DOOR_BOX.x; x < HALL_DOOR_BOX.x + HALL_DOOR_BOX.w; x++) {
          expect(png.data[(y * 64 + x) * 4 + 3]).toBe(255);
        }
      }
      for (let y = HALL_LAMP_BOX.y; y < HALL_LAMP_BOX.y + HALL_LAMP_BOX.h; y++) {
        for (let x = HALL_LAMP_BOX.x; x < HALL_LAMP_BOX.x + HALL_LAMP_BOX.w; x++) {
          expect(png.data[(y * 64 + x) * 4 + 3]).toBe(255);
        }
      }
    }
  });

  it('stages packed 100% Zughy-32 PNGs matching expected dimensions in art-src/v1.8-staging/', () => {
    for (const subject of BATCH1_SUBJECTS) {
      for (const file of subject.stagedFiles) {
        const fullPath = resolve(STAGING_DIR, file.name);
        expect(existsSync(fullPath)).toBe(true);
        const buf = readFileSync(fullPath);
        const png = checkPngCompliance(buf, file.w, file.h);
        const fresh = PNG.sync.read(file.render().toPng(file.h));
        expect(png.data.equals(fresh.data)).toBe(true);
        // Packed PNG stays as compact as or tighter than png-pack
        const repacked = packPng(buf);
        if (repacked !== null) {
          expect(buf.length).toBeLessThanOrEqual(repacked.length);
        }
      }
    }
  });

  it('renders numbered dark (#302c2e) and light (#cfc6b8) Contact Sheet 1 PNGs and art-marks.md', () => {
    const darkPath = CONTACT_SHEET_PATHS.dark;
    const lightPath = CONTACT_SHEET_PATHS.light;
    const marksPath = CONTACT_SHEET_PATHS.marks;

    expect(existsSync(darkPath)).toBe(true);
    expect(existsSync(lightPath)).toBe(true);
    expect(existsSync(marksPath)).toBe(true);

    const darkPng = PNG.sync.read(readFileSync(darkPath));
    const lightPng = PNG.sync.read(readFileSync(lightPath));
    expect(darkPng.width).toBe(lightPng.width);
    expect(darkPng.height).toBe(lightPng.height);
    expect(darkPng.width).toBeGreaterThanOrEqual(800);
    expect(darkPng.height).toBeGreaterThanOrEqual(900);

    // Check sampled matte swatch ground colors (#302c2e vs #cfc6b8)
    const darkHexes = new Set<string>();
    const lightHexes = new Set<string>();
    for (let i = 0; i < darkPng.data.length; i += 4) {
      const [dr, dg, db] = rgbaAt(darkPng.data, i);
      const [lr, lg, lb] = rgbaAt(lightPng.data, i);
      darkHexes.add(toHexRgb(dr, dg, db));
      lightHexes.add(toHexRgb(lr, lg, lb));
    }
    expect(darkHexes.has('302c2e')).toBe(true);
    expect(lightHexes.has('cfc6b8')).toBe(true);

    const marks = readFileSync(marksPath, 'utf8');
    for (const s of BATCH1_SUBJECTS) {
      expect(marks).toContain(`| ${s.num} |`);
      expect(marks).toContain(s.id);
      expect(marks).toContain(`| ${s.num} | \`${s.id}\` | ${s.label} | Keep |`);
    }
    expect(marks).not.toContain('| Pending |');
  });

  it('leaves shipped public/assets/grid/ untouched (matches HEAD & non-redrawn v1.1 hashes)', () => {
    const gridDir = resolve(ROOT, 'public', 'assets', 'grid');
    expect(readdirSync(gridDir).filter((f) => f.endsWith('.png'))).toHaveLength(83);

    const hashes = JSON.parse(
      readFileSync(resolve(ROOT, 'art-src', 'v1.1-hashes.json'), 'utf8'),
    ) as Record<string, string>;
    const redrawn = redrawIds(
      readFileSync(resolve(ROOT, 'docs', 'flesh-out', 'v1.1', 'art-marks.md'), 'utf8'),
    );
    for (const [id, expected] of Object.entries(hashes)) {
      if (redrawn.has(id)) continue;
      const filename = `${id.replace(/^grid\./, '').replaceAll('.', '-')}.png`;
      const actualBuf = readFileSync(resolve(gridDir, filename));
      const actualHash = createHash('sha256').update(actualBuf).digest('hex');
      expect(actualHash).toBe(expected);
    }

    // Also verify git working tree has zero modifications to public/assets/grid/
    const dirty = execFileSync('git', ['status', '--porcelain', '--', 'public/assets/grid'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    expect(dirty).toBe('');
  });
});
