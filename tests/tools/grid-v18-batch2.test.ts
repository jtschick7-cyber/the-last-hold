import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { palette } from '../../src/content/palette';
import { BATCH2_CONTACT_PATHS, BATCH2_SUBJECTS, STAGING_DIR } from '../../tools/contact-sheet-v18';
import { drawLevelBuildingV18, LEVEL_BUILDING_FAMILIES } from '../../tools/grid-v18-buildings';
import { drawPlotV18, BATCH2_PLOT_FAMILIES } from '../../tools/grid-v18-plots';

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
  return png;
}

/** Counts 4-connected opaque islands in a 32x32 PNG to catch floating detached blobs. */
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
        const neighbors = [
          cx > 0 ? cur - 1 : -1,
          cx < w - 1 ? cur + 1 : -1,
          cy > 0 ? cur - w : -1,
          cy < h - 1 ? cur + w : -1,
        ];
        for (const nIdx of neighbors) {
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

describe('v1.8 Grid Art Batch 2 (T18.9, D623, D475)', () => {
  it('enforces the D475 review cap (<= 12 subjects) numbered #13..#24', () => {
    expect(BATCH2_SUBJECTS).toHaveLength(12);
    expect(BATCH2_SUBJECTS.map((s) => s.num)).toEqual([
      13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    ]);
  });

  it('draws all 8 level-building families (22 sprites) in 100% Zughy-32 with distinct tiers', () => {
    let total = 0;
    for (const family of LEVEL_BUILDING_FAMILIES) {
      const tiers: readonly (1 | 2 | 3)[] = family === 'trophy-hall' ? [1] : [1, 2, 3];
      const tierPngs: Buffer[] = [];
      for (const tier of tiers) {
        const buf = drawLevelBuildingV18(family, tier).toPng(32);
        const bufAgain = drawLevelBuildingV18(family, tier).toPng(32);
        expect(buf.equals(bufAgain)).toBe(true);
        checkPngCompliance(buf, 32, 32);
        tierPngs.push(buf);
        total++;
      }
      if (tierPngs.length === 3) {
        const [t1, t2, t3] = tierPngs;
        expect(t1 && t2 && !t1.equals(t2)).toBe(true);
        expect(t2 && t3 && !t2.equals(t3)).toBe(true);
      }
    }
    expect(total).toBe(22);

    // Mill tier 1 must have wide visible sails (>= 18 px overall horizontal span)
    const mill1 = PNG.sync.read(drawLevelBuildingV18('mill', 1).toPng(32));
    let minX = 32;
    let maxX = -1;
    for (let y = 2; y <= 18; y++) {
      for (let x = 0; x < 32; x++) {
        if ((mill1.data[(y * 32 + x) * 4 + 3] ?? 0) === 255) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    expect(maxX - minX + 1).toBeGreaterThanOrEqual(18);

    // Fix v1.1 detached floating bugs: sawpit-3 and alchemist-3 form single unified silhouettes
    const sawpit3 = PNG.sync.read(drawLevelBuildingV18('sawpit', 3).toPng(32));
    const alchemist3 = PNG.sync.read(drawLevelBuildingV18('alchemist', 3).toPng(32));
    expect(countOpaqueIslands(sawpit3)).toBe(1);
    expect(countOpaqueIslands(alchemist3)).toBe(1);
  });

  it('draws 4 primary plot archetypes (12 sprites) in 100% Zughy-32 distinct from buildings', () => {
    let total = 0;
    for (const family of BATCH2_PLOT_FAMILIES) {
      const variants: Buffer[] = [];
      for (const density of [1, 2, 3] as const) {
        const buf = drawPlotV18(family, density).toPng(32);
        const bufAgain = drawPlotV18(family, density).toPng(32);
        expect(buf.equals(bufAgain)).toBe(true);
        checkPngCompliance(buf, 32, 32);
        variants.push(buf);
        total++;
      }
      expect(variants[0] && variants[1] && !variants[0].equals(variants[1])).toBe(true);
      expect(variants[1] && variants[2] && !variants[1].equals(variants[2])).toBe(true);
    }
    expect(total).toBe(12);

    // Barracks must look visually distinct from Cottage across all tiers
    for (const t of [1, 2, 3] as const) {
      const barracks = drawLevelBuildingV18('barracks', t).toPng(32);
      const cottage = drawPlotV18('cottage', t).toPng(32);
      expect(barracks.equals(cottage)).toBe(false);
    }
  });

  it('stages all 34 Batch 2 PNGs cleanly in art-src/v1.8-staging/', () => {
    let stagedCount = 0;
    for (const subject of BATCH2_SUBJECTS) {
      for (const file of subject.stagedFiles) {
        const fullPath = resolve(STAGING_DIR, file.name);
        expect(existsSync(fullPath)).toBe(true);
        const buf = readFileSync(fullPath);
        const png = checkPngCompliance(buf, file.w, file.h);
        const rawRgba = file.render().toPng(file.h);
        const fresh = PNG.sync.read(rawRgba);
        expect(png.data.equals(fresh.data)).toBe(true);
        // Staged PNG is indexed-colour (colorType 3) and smaller than raw RGBA across all OS zlib builds
        expect(buf[25]).toBe(3);
        expect(buf.length).toBeLessThan(rawRgba.length);
        stagedCount++;
      }
    }
    expect(stagedCount).toBe(34);
  });

  it('renders dark (#302c2e) and light (#cfc6b8) Contact Sheet 2 PNGs and preserves Batch 1 marks', () => {
    expect(existsSync(BATCH2_CONTACT_PATHS.dark)).toBe(true);
    expect(existsSync(BATCH2_CONTACT_PATHS.light)).toBe(true);
    expect(existsSync(BATCH2_CONTACT_PATHS.marks)).toBe(true);

    const darkPng = PNG.sync.read(readFileSync(BATCH2_CONTACT_PATHS.dark));
    const lightPng = PNG.sync.read(readFileSync(BATCH2_CONTACT_PATHS.light));
    expect(darkPng.width).toBe(lightPng.width);
    expect(darkPng.height).toBe(lightPng.height);
    expect(darkPng.width).toBeGreaterThanOrEqual(800);
    expect(darkPng.height).toBeGreaterThanOrEqual(800);

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

    const marks = readFileSync(BATCH2_CONTACT_PATHS.marks, 'utf8');
    const batch1Section = marks.split('## Batch 2')[0] ?? '';
    const batch2Section = (marks.split('## Batch 2')[1] ?? '').split('## Batch 3')[0] ?? '';
    // Batch 1 remains Keep
    for (let n = 1; n <= 12; n++) {
      expect(batch1Section).toContain(`| ${n} |`);
    }
    expect(batch1Section).toContain('| 1 | `grid.hearth-hall.hamlet`');
    expect(batch1Section).toContain('| Keep |');
    // Batch 2 rows #13..#24 all marked Keep
    for (const s of BATCH2_SUBJECTS) {
      expect(batch2Section).toContain(`| ${s.num} | \`${s.id}\` | ${s.label} | Keep |`);
    }
    expect(batch2Section).not.toContain('Pending');
  });

  it('preserves 83 original backups in art-src/previous-v1.8/grid/ and deploys 89 PNGs without touching scenes/', () => {
    const backupDir = resolve(ROOT, 'art-src', 'previous-v1.8', 'grid');
    const gridDir = resolve(ROOT, 'public', 'assets', 'grid');
    expect(readdirSync(backupDir).filter((f) => f.endsWith('.png'))).toHaveLength(83);
    expect(readdirSync(gridDir).filter((f) => f.endsWith('.png'))).toHaveLength(89);
    const dirty = execFileSync('git', ['status', '--porcelain', '--', 'public/assets/scenes'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    expect(dirty).toBe('');
  });
});
