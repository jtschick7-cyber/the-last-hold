// v1.9 (plan T19.6, D475, D635): Zughy-32 compliance, dimensions, binary alpha, Option B
// plaque corners, 5-frame sprite strip checks, single-island silhouettes, staging & Contact Sheets.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { assetById, SPRITE_FRAME_NAMES, SPRITE_PX } from '../../src/content/assets';
import { palette } from '../../src/content/palette';
import { DEPLOYED_V19_IDS, isV19Asset, numberedAssets } from '../../tools/contact-sheet-data';
import { V19_CONTACT_PATHS, V19_STAGING_DIR, V19_SUBJECTS } from '../../tools/contact-sheet-v19';
import { V19_HASHES_PATH } from '../../tools/deploy-v19';
import { drawCourtyardMarkV18, V18_COURTYARD_MARK_IDS } from '../../tools/grid-v18-marks';
import { drawCourtyardMarkV19, V19_MARK_IDS } from '../../tools/marks-v19';
import { C } from '../../tools/pixel';
import { packPng } from '../../tools/png-pack';
import { drawPortraitV19, V19_PORTRAIT_IDS } from '../../tools/portraits-v19';
import { drawSpriteCanvasV19, renderSpriteStripV19, V19_SPRITE_IDS } from '../../tools/sprites-v19';

const ROOT = resolve(import.meta.dirname, '..', '..');
const PALETTE_SET = new Set((palette?.colors ?? []).map((h) => h.toLowerCase()));

const CLIPPED_CORNERS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [63, 0],
  [62, 0],
  [63, 1],
  [0, 63],
  [1, 63],
  [0, 62],
  [63, 63],
  [62, 63],
  [63, 62],
];

const RIVETS: readonly (readonly [number, number])[] = [
  [3, 3],
  [60, 3],
  [3, 60],
  [60, 60],
];

const toHex = (r: number, g: number, b: number): string =>
  [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

const rgbaAt = (data: Uint8Array, i: number): readonly [number, number, number, number] => [
  data[i] ?? 0,
  data[i + 1] ?? 0,
  data[i + 2] ?? 0,
  data[i + 3] ?? 0,
];

function checkCompliance(buf: Buffer, w: number, h: number): { png: PNG; opaqueCount: number } {
  const png = PNG.sync.read(buf);
  expect(png.width).toBe(w);
  expect(png.height).toBe(h);
  let opaqueCount = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b, a] = rgbaAt(png.data, i);
    expect(a === 0 || a === 255).toBe(true);
    if (a === 255) {
      opaqueCount++;
      expect(PALETTE_SET.has(toHex(r, g, b))).toBe(true);
    }
  }
  expect(opaqueCount).toBeGreaterThan(0);
  return { png, opaqueCount };
}

function countOpaqueIslands(png: PNG, x0 = 0, y0 = 0, w = png.width, h = png.height): number {
  const visited = new Uint8Array(w * h);
  let islands = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const pIdx = ((y0 + y) * png.width + (x0 + x)) * 4;
      if (visited[idx] || (png.data[pIdx + 3] ?? 0) !== 255) continue;
      islands++;
      const stack = [idx];
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
          if (nIdx < 0 || visited[nIdx]) continue;
          const nx = nIdx % w;
          const ny = Math.floor(nIdx / w);
          const npIdx = ((y0 + ny) * png.width + (x0 + nx)) * 4;
          if ((png.data[npIdx + 3] ?? 0) === 255) {
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

function framePixels(strip: PNG, frameIndex: number): (string | null)[] {
  const out: (string | null)[] = [];
  for (let y = 0; y < SPRITE_PX; y++) {
    for (let x = 0; x < SPRITE_PX; x++) {
      const idx = (y * strip.width + frameIndex * SPRITE_PX + x) * 4;
      const [r, g, b, a] = rgbaAt(strip.data, idx);
      out.push(a === 255 ? toHex(r, g, b) : null);
    }
  }
  return out;
}

describe('v1.9 Kettle & Fang art batch (T19.6, D475, D635)', () => {
  it('enforces D475 review cap (6 subjects <= 12) mapped cleanly to manifest IDs', () => {
    expect(V19_SUBJECTS.length).toBeLessThanOrEqual(12);
    expect(V19_SUBJECTS).toHaveLength(6);
    expect(V19_SUBJECTS.map((s) => s.num)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(V19_SUBJECTS.map((s) => s.id)).toEqual([
      'portrait.creature.thorn-stag',
      'portrait.creature.beacon-bane',
      'sprite.creature.thorn-stag',
      'sprite.creature.beacon-bane',
      'courtyard-mark.thorn-antler-rack',
      'courtyard-mark.beacon-iron-urn',
    ]);
    for (const s of V19_SUBJECTS) {
      const row = assetById.get(s.id);
      expect(row?.size, s.id).toEqual([s.w, s.h]);
    }
  });

  it.each(V19_PORTRAIT_IDS)(
    'Option B portrait for %s is 64x64, 100% Zughy-32, binary alpha, with chamfered plaque frame',
    (id) => {
      const buf = drawPortraitV19(id).toPng(64);
      const { png } = checkCompliance(buf, 64, 64);

      for (const [x, y] of CLIPPED_CORNERS) {
        const idx = (y * 64 + x) * 4;
        expect(png.data[idx + 3], `${id} corner (${x},${y}) alpha`).toBe(0);
      }
      for (const [x, y] of RIVETS) {
        const idx = (y * 64 + x) * 4;
        const [r, g, b, a] = rgbaAt(png.data, idx);
        expect(a).toBe(255);
        expect(toHex(r, g, b)).toBe(C.ash);
      }
      // Top & left inner bevels plus outer chamfered ink edges
      expect(
        toHex(...(rgbaAt(png.data, (1 * 64 + 10) * 4).slice(0, 3) as [number, number, number])),
      ).toBe(C.stone);
      expect(
        toHex(...(rgbaAt(png.data, (62 * 64 + 10) * 4).slice(0, 3) as [number, number, number])),
      ).toBe(C.coal);
      expect(
        toHex(...(rgbaAt(png.data, (0 * 64 + 10) * 4).slice(0, 3) as [number, number, number])),
      ).toBe(C.ink);
      expect(countOpaqueIslands(png)).toBe(1);
    },
  );

  it.each(V19_SPRITE_IDS)(
    'left-facing battle sprite strip for %s is 160x32, 100% Zughy-32, 5 distinct poses, single-island idle',
    (id) => {
      const buf = renderSpriteStripV19(id);
      const { png } = checkCompliance(buf, 160, 32);

      // Single connected silhouette in base idle canvas
      const basePng = PNG.sync.read(drawSpriteCanvasV19(id).toPng(32));
      expect(countOpaqueIslands(basePng), `${id} base idle island count`).toBe(1);

      const frames = SPRITE_FRAME_NAMES.map((name, fi) => ({
        name,
        px: framePixels(png, fi),
      }));

      for (let i = 0; i < frames.length; i++) {
        const fi = frames[i];
        expect(fi?.px.filter((v) => v !== null).length).toBeGreaterThan(80);
        expect(fi?.px[0], `${id} ${fi?.name} top-left transparent`).toBeNull();
        for (let j = i + 1; j < frames.length; j++) {
          const fj = frames[j];
          const same = fi?.px.every((v, k) => v === fj?.px[k]) ?? false;
          expect(same, `${id}: ${fi?.name} vs ${fj?.name}`).toBe(false);
        }
      }

      expect(countOpaqueIslands(png, 0, 0, SPRITE_PX, SPRITE_PX)).toBe(1);

      // Hit frame uses strictly [C.ink, C.frost]
      const hitColors = new Set((frames[3]?.px ?? []).filter((v): v is string => v !== null));
      expect([...hitColors].sort()).toEqual([C.ink, C.frost].sort());

      const xsOf = (g: (string | null)[]): number[] =>
        g.flatMap((v, idx) => (v === null ? [] : [idx % SPRITE_PX]));
      const ysOf = (g: (string | null)[]): number[] =>
        g.flatMap((v, idx) => (v === null ? [] : [Math.floor(idx / SPRITE_PX)]));

      const idleXs = xsOf(frames[0]?.px ?? []);
      const lungeXs = xsOf(frames[2]?.px ?? []);
      expect(Math.min(...lungeXs)).toBeLessThan(Math.min(...idleXs));
      expect(Math.min(...lungeXs)).toBeGreaterThanOrEqual(0);
      expect(lungeXs.length).toBeGreaterThan(idleXs.length);

      const idleYs = ysOf(frames[0]?.px ?? []);
      const downedYs = ysOf(frames[4]?.px ?? []);
      expect(Math.max(...idleYs)).toBe(30);
      expect(Math.max(...downedYs)).toBe(30);
      expect(Math.min(...downedYs)).toBeGreaterThanOrEqual(Math.min(...idleYs));
    },
  );

  it('draws both Courtyard Marks (16x16) as crisp single islands distinct from all 6 v1.8 marks', () => {
    const v19Marks = V19_MARK_IDS.map((id) => {
      const buf = drawCourtyardMarkV19(id).toPng(16);
      const { png, opaqueCount } = checkCompliance(buf, 16, 16);
      expect(opaqueCount).toBeGreaterThanOrEqual(65);
      expect(opaqueCount).toBeLessThanOrEqual(215);
      expect(countOpaqueIslands(png), `${id} single island`).toBe(1);

      const hexes = new Set<string>();
      for (let i = 0; i < png.data.length; i += 4) {
        const [r, g, b, a] = rgbaAt(png.data, i);
        if (a === 255) hexes.add(toHex(r, g, b));
      }
      expect(hexes.has(C.wine), `${id} C.wine outline for light ground`).toBe(true);
      const brightCount = [...hexes].filter(
        (h) => h !== C.ink && h !== C.wine && h !== C.plum && h !== C.bone,
      ).length;
      expect(brightCount, `${id} bright contrast colors for dark ground`).toBeGreaterThanOrEqual(3);
      return { id, png };
    });

    expect(
      v19Marks[0] && v19Marks[1] && pixelDiffCount(v19Marks[0].png, v19Marks[1].png),
    ).toBeGreaterThanOrEqual(50);

    for (const v19 of v19Marks) {
      for (const v18Id of V18_COURTYARD_MARK_IDS) {
        const v18Png = PNG.sync.read(drawCourtyardMarkV18(v18Id).toPng(16));
        expect(pixelDiffCount(v19.png, v18Png), `${v19.id} vs ${v18Id}`).toBeGreaterThanOrEqual(50);
      }
    }
  });

  it('deploys all 6 owner-approved Keep PNGs, freezes v1.9 SHA-256 hashes, registers isV19Asset, and leaves v1.0-v1.8 frozen hashes untouched', () => {
    for (const s of V19_SUBJECTS) {
      const stagedPath = resolve(V19_STAGING_DIR, s.stagingRelPath);
      expect(existsSync(stagedPath), stagedPath).toBe(true);
      const buf = readFileSync(stagedPath);
      expect(buf[25], `${s.stagingRelPath} indexed colorType 3`).toBe(3);

      const rawUnpacked =
        s.kind === 'portrait'
          ? drawPortraitV19(s.subjectKey as 'thorn-stag').toPng(64)
          : s.kind === 'sprite'
            ? renderSpriteStripV19(s.subjectKey as 'thorn-stag')
            : drawCourtyardMarkV19(s.subjectKey as 'thorn-antler-rack').toPng(16);
      expect(buf.length).toBeLessThan(rawUnpacked.length);
      expect(PNG.sync.read(buf).data.equals(PNG.sync.read(rawUnpacked).data)).toBe(true);
    }

    expect(existsSync(V19_CONTACT_PATHS.dark)).toBe(true);
    expect(existsSync(V19_CONTACT_PATHS.light)).toBe(true);
    expect(existsSync(V19_CONTACT_PATHS.marks)).toBe(true);

    const darkPng = PNG.sync.read(readFileSync(V19_CONTACT_PATHS.dark));
    const lightPng = PNG.sync.read(readFileSync(V19_CONTACT_PATHS.light));
    expect([darkPng.width, darkPng.height]).toEqual([lightPng.width, lightPng.height]);
    expect(darkPng.width).toBeGreaterThanOrEqual(850);
    expect(darkPng.height).toBeGreaterThanOrEqual(750);

    const marks = readFileSync(V19_CONTACT_PATHS.marks, 'utf8');
    expect(marks).not.toContain('| Pending |');
    expect(marks).not.toContain('| Redraw |');
    for (const s of V19_SUBJECTS) {
      expect(marks).toContain(`| ${s.num} | \`${s.id}\` |`);
      expect(marks).toContain(`| Keep |`);
    }

    expect(existsSync(V19_HASHES_PATH)).toBe(true);
    const frozen = JSON.parse(readFileSync(V19_HASHES_PATH, 'utf8')) as Record<string, string>;
    expect(Object.keys(frozen).sort()).toEqual([...DEPLOYED_V19_IDS].sort());
    expect(DEPLOYED_V19_IDS.size).toBe(6);

    for (const s of V19_SUBJECTS) {
      expect(isV19Asset(s.id), s.id).toBe(true);
      const row = assetById.get(s.id);
      expect(row?.source, s.id).toBe('generated');
      if (row?.source === 'generated') expect(row.file).toBe(s.deployedRelPath);

      const stagedBuf = readFileSync(resolve(V19_STAGING_DIR, s.stagingRelPath));
      const deployedBuf = readFileSync(resolve(ROOT, 'public', 'assets', s.deployedRelPath));
      expect(deployedBuf.equals(stagedBuf), s.deployedRelPath).toBe(true);
      expect(packPng(deployedBuf), `${s.deployedRelPath} already maximally packed`).toBeNull();
      const sha = createHash('sha256').update(deployedBuf).digest('hex');
      expect(sha, s.id).toBe(frozen[s.id]);
    }

    expect(isV19Asset('portrait.creature.barrow-king')).toBe(false);
    expect(isV19Asset('courtyard-mark.barrow-brazier')).toBe(false);
    expect(numberedAssets.some((x) => isV19Asset(x.asset.id))).toBe(false);

    // Ensure v1.0-v1.8 frozen hash manifests remain completely unaltered
    const dirtyPriorHashes = execFileSync(
      'git',
      [
        'status',
        '--porcelain',
        '--',
        'art-src/v0.11-hashes.json',
        'art-src/v1.0-hashes.json',
        'art-src/v1.1-hashes.json',
        'art-src/v1.4-hashes.json',
        'art-src/v1.6-banner-hashes.json',
        'art-src/v1.6-portrait-hashes.json',
        'art-src/v1.7-sprite-hashes.json',
        'art-src/v1.8-grid-hashes.json',
      ],
      { cwd: ROOT, encoding: 'utf8' },
    ).trim();
    expect(dirtyPriorHashes).toBe('');
  });
});
