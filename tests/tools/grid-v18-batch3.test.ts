import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { palette } from '../../src/content/palette';
import { isV19GridFile } from '../../tools/contact-sheet-data';
import {
  BATCH1_SUBJECTS,
  BATCH2_SUBJECTS,
  BATCH3_CONTACT_PATHS,
  BATCH3_SUBJECTS,
  STAGING_DIR,
} from '../../tools/contact-sheet-v18';
import { drawCourtyardMarkV18, V18_COURTYARD_MARK_IDS } from '../../tools/grid-v18-marks';
import { drawPlotV18 } from '../../tools/grid-v18-plots';
import {
  BATCH3_PLOT_FAMILIES,
  drawBatch3PlotV18,
  drawHerbGardenV18,
  drawSilverSeamV18,
} from '../../tools/grid-v18-plots-extra';
import { C } from '../../tools/pixel';

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
      expect(PALETTE_SET.has(toHexRgb(r, g, b))).toBe(true);
    }
  }
  expect(opaqueCount).toBeGreaterThan(0);
  return { png, opaqueCount };
}

function collectOpaqueHexes(png: PNG): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b, a] = rgbaAt(png.data, i);
    if (a === 255) out.add(toHexRgb(r, g, b));
  }
  return out;
}

function countOpaqueIslands(png: PNG): number {
  const w = png.width;
  const h = png.height;
  const visited = new Uint8Array(w * h);
  let islands = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx] || (png.data[idx * 4 + 3] ?? 0) !== 255) continue;
      islands++;
      const stack: number[] = [idx];
      visited[idx] = 1;
      while (stack.length > 0) {
        const cur = stack.pop();
        if (cur === undefined) break;
        const cx = cur % w;
        const cy = Math.floor(cur / w);
        for (const nIdx of [
          cx > 0 ? cur - 1 : -1,
          cx < w - 1 ? cur + 1 : -1,
          cy > 0 ? cur - w : -1,
          cy < h - 1 ? cur + w : -1,
        ]) {
          if (nIdx >= 0 && !visited[nIdx] && (png.data[nIdx * 4 + 3] ?? 0) === 255) {
            visited[nIdx] = 1;
            stack.push(nIdx);
          }
        }
      }
    }
  }
  return islands;
}

function pixelDiffCount(a: PNG, b: PNG): number {
  expect(a.width).toBe(b.width);
  expect(a.height).toBe(b.height);
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const [ar, ag, ab, aa] = rgbaAt(a.data, i);
    const [br, bg, bb, ba] = rgbaAt(b.data, i);
    if (ar !== br || ag !== bg || ab !== bb || aa !== ba) diff++;
  }
  return diff;
}

describe('v1.8 Grid Art Batch 3 (T18.10, Q83-Q85, D623, D475)', () => {
  it('enforces D475 review cap (<= 12 subjects), numbered #25..#32 with Q85 ID mapping', () => {
    expect(BATCH3_SUBJECTS.length).toBeLessThanOrEqual(12);
    expect(BATCH3_SUBJECTS).toHaveLength(8);
    expect(BATCH3_SUBJECTS.map((s) => s.num)).toEqual([25, 26, 27, 28, 29, 30, 31, 32]);
    expect(BATCH3_SUBJECTS.map((s) => s.id)).toEqual([
      'grid.herb-garden',
      'grid.silver-seam',
      ...V18_COURTYARD_MARK_IDS.map((id) => `courtyard-mark.${id}`),
    ]);
    const files = BATCH3_SUBJECTS.flatMap((s) => s.stagedFiles.map((f) => f.name));
    expect(files).toHaveLength(11);
    expect(files).toContain('herb-garden-1.png');
    expect(files).toContain('herb-garden-2.png');
    expect(files).toContain('herb-garden-3.png');
    expect(files).toContain('silver-seam-1.png');
    expect(files).toContain('silver-seam-2.png');
    for (const id of V18_COURTYARD_MARK_IDS) {
      expect(files).toContain(`courtyard-mark-${id}.png`);
    }
  });

  it('draws herb-garden 1..3 (32x32) in 100% Zughy-32 distinct from farm-3 with yarrow, mugwort & juniper blossoms', () => {
    expect(BATCH3_PLOT_FAMILIES).toEqual(['herb-garden', 'silver-seam']);
    const herbPngs: PNG[] = [];
    for (const d of [1, 2, 3] as const) {
      const buf = drawHerbGardenV18(d).toPng(32);
      const viaHelper = drawBatch3PlotV18('herb-garden', d).toPng(32);
      expect(buf.equals(viaHelper)).toBe(true);
      const { png } = checkPngCompliance(buf, 32, 32);
      herbPngs.push(png);
    }
    const [h1, h2, h3] = herbPngs;
    expect(h1 && h2 && pixelDiffCount(h1, h2)).toBeGreaterThan(40);
    expect(h2 && h3 && pixelDiffCount(h2, h3)).toBeGreaterThan(40);
    expect(h1 && h3 && pixelDiffCount(h1, h3)).toBeGreaterThan(40);
    // Unified cohesive silhouette per tier (no stray detached confetti)
    expect(h1 && countOpaqueIslands(h1)).toBe(1);
    expect(h2 && countOpaqueIslands(h2)).toBe(1);
    expect(h3 && countOpaqueIslands(h3)).toBe(1);

    // v1.1 Redraw note: lush herb beds + white (yarrow), purple (mugwort), blue (juniper) blossoms, distinct from farm-3
    expect(h3).toBeDefined();
    if (h3) {
      const hexes = collectOpaqueHexes(h3);
      expect(hexes.has(C.grass) || hexes.has(C.moss) || hexes.has(C.lime)).toBe(true);
      expect(hexes.has(C.brown) || hexes.has(C.brownDark) || hexes.has(C.clay)).toBe(true);
      // White yarrow, purple mugwort, and blue juniper blossoms
      expect(hexes.has(C.frost) || hexes.has(C.cream)).toBe(true);
      expect(hexes.has(C.orchid) || hexes.has(C.rose) || hexes.has(C.pink)).toBe(true);
      expect(hexes.has(C.blue) || hexes.has(C.cyan) || hexes.has(C.ice)).toBe(true);

      const farm3 = PNG.sync.read(drawPlotV18('farm', 3).toPng(32));
      expect(pixelDiffCount(h3, farm3)).toBeGreaterThan(220);
    }
  });

  it('draws silver-seam 1..2 (32x32) in 100% Zughy-32 as jagged rock outcrops split by glowing silver/ice veins', () => {
    const seamPngs: PNG[] = [];
    for (const look of [1, 2] as const) {
      const buf = drawSilverSeamV18(look).toPng(32);
      const viaHelper = drawBatch3PlotV18('silver-seam', look).toPng(32);
      expect(buf.equals(viaHelper)).toBe(true);
      const { png } = checkPngCompliance(buf, 32, 32);
      const hexes = collectOpaqueHexes(png);
      // Dark rocky crags
      expect(hexes.has(C.plum) || hexes.has(C.coal) || hexes.has(C.slate)).toBe(true);
      expect(hexes.has(C.stone) || hexes.has(C.ash)).toBe(true);
      // Bright silver / ice-blue mineral veins
      expect(hexes.has(C.ice) || hexes.has(C.frost)).toBe(true);
      expect(hexes.has(C.cyan) || hexes.has(C.blue)).toBe(true);
      seamPngs.push(png);
    }
    const [s1, s2] = seamPngs;
    expect(s1 && s2 && pixelDiffCount(s1, s2)).toBeGreaterThan(100);
    expect(s1 && countOpaqueIslands(s1)).toBe(1);
    expect(s2 && countOpaqueIslands(s2)).toBeGreaterThanOrEqual(2);
  });

  it('draws all 6 Event Courtyard Marks (16x16, Q83(a)) crisply in Zughy-32 and pairwise distinct', () => {
    const rendered: { id: string; png: PNG; opaqueCount: number }[] = [];
    for (const id of V18_COURTYARD_MARK_IDS) {
      const buf = drawCourtyardMarkV18(id).toPng(16);
      const again = drawCourtyardMarkV18(id).toPng(16);
      expect(buf.equals(again)).toBe(true);
      const { png, opaqueCount } = checkPngCompliance(buf, 16, 16);
      // Crisp 16x16 silhouette: non-tiny, non-solid-block, single connected island
      expect(opaqueCount).toBeGreaterThanOrEqual(65);
      expect(opaqueCount).toBeLessThanOrEqual(215);
      expect(countOpaqueIslands(png)).toBe(1);

      // Must contain C.wine outline pixels (contrast on light) plus bright inner colors (contrast on dark)
      const hexes = collectOpaqueHexes(png);
      expect(hexes.has(C.wine)).toBe(true);
      const brightCount = [...hexes].filter(
        (h) => h !== C.ink && h !== C.wine && h !== C.plum && h !== C.bone,
      ).length;
      expect(brightCount).toBeGreaterThanOrEqual(3);
      rendered.push({ id, png, opaqueCount });
    }

    for (let i = 0; i < rendered.length; i++) {
      for (let j = i + 1; j < rendered.length; j++) {
        const a = rendered[i];
        const b = rendered[j];
        expect(a && b && pixelDiffCount(a.png, b.png)).toBeGreaterThanOrEqual(50);
      }
    }
  });

  it('stages all 11 Batch 3 PNGs in art-src/v1.8-staging/ (89 total staged PNGs) losslessly packed', () => {
    let stagedCount = 0;
    for (const subject of BATCH3_SUBJECTS) {
      for (const file of subject.stagedFiles) {
        const fullPath = resolve(STAGING_DIR, file.name);
        expect(existsSync(fullPath)).toBe(true);
        const buf = readFileSync(fullPath);
        expect(buf.length).toBeLessThanOrEqual(142_000);
        const { png } = checkPngCompliance(buf, file.w, file.h);
        const rawRgba = file.render().toPng(file.h);
        const fresh = PNG.sync.read(rawRgba);
        expect(png.data.equals(fresh.data)).toBe(true);
        // Staged PNG is indexed-colour (colorType 3) and smaller than raw RGBA across all OS zlib builds
        expect(buf[25]).toBe(3);
        expect(buf.length).toBeLessThan(rawRgba.length);
        stagedCount++;
      }
    }
    expect(stagedCount).toBe(11);
    const allStaged = readdirSync(STAGING_DIR).filter((f) => f.endsWith('.png'));
    expect(allStaged).toHaveLength(89);
  });

  it('renders dark (#302c2e) and light (#cfc6b8) Contact Sheet 3 PNGs and preserves Batch 1+2 Keep marks', () => {
    expect(existsSync(BATCH3_CONTACT_PATHS.dark)).toBe(true);
    expect(existsSync(BATCH3_CONTACT_PATHS.light)).toBe(true);
    expect(existsSync(BATCH3_CONTACT_PATHS.marks)).toBe(true);

    const darkPng = PNG.sync.read(readFileSync(BATCH3_CONTACT_PATHS.dark));
    const lightPng = PNG.sync.read(readFileSync(BATCH3_CONTACT_PATHS.light));
    expect(darkPng.width).toBe(lightPng.width);
    expect(darkPng.height).toBe(lightPng.height);
    expect(darkPng.width).toBeGreaterThanOrEqual(800);
    expect(darkPng.height).toBeGreaterThanOrEqual(700);

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

    const marks = readFileSync(BATCH3_CONTACT_PATHS.marks, 'utf8');
    const batch1Section = marks.split('## Batch 2')[0] ?? '';
    const batch2Section = (marks.split('## Batch 2')[1] ?? '').split('## Batch 3')[0] ?? '';
    const batch3Section = marks.split('## Batch 3')[1] ?? '';

    for (const s of BATCH1_SUBJECTS) {
      expect(batch1Section).toContain(`| ${s.num} | \`${s.id}\` | ${s.label} | Keep |`);
    }
    expect(batch1Section).not.toContain('Pending');

    for (const s of BATCH2_SUBJECTS) {
      expect(batch2Section).toContain(`| ${s.num} | \`${s.id}\` | ${s.label} | Keep |`);
    }
    expect(batch2Section).not.toContain('Pending');

    for (const s of BATCH3_SUBJECTS) {
      expect(batch3Section).toContain(`| ${s.num} | \`${s.id}\` | ${s.label} | Keep |`);
    }
    expect(marks).not.toContain('Pending');
  });

  it('deploys all 89 grid/Courtyard Mark PNGs while backing up 83 prior files and leaving scenes/ untouched', () => {
    const backupDir = resolve(ROOT, 'art-src', 'previous-v1.8', 'grid');
    const gridDir = resolve(ROOT, 'public', 'assets', 'grid');
    expect(readdirSync(backupDir).filter((f) => f.endsWith('.png'))).toHaveLength(83);
    expect(
      readdirSync(gridDir).filter((f) => f.endsWith('.png') && !isV19GridFile(f)),
    ).toHaveLength(89);
    const dirty = execFileSync('git', ['status', '--porcelain', '--', 'public/assets/scenes'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    expect(dirty).toBe('');
  });
});
