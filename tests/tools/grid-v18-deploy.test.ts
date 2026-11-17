// Plan T18.11 (D623, D624, Q83-Q85): verifies full deployment of approved Batches 1-3 (#01-#32,
// 89 PNGs) to public/assets/grid/, v1.1 backups in art-src/previous-v1.8/grid/, frozen SHA-256
// hashes in art-src/v1.8-grid-hashes.json, Zughy-32 & binary-alpha compliance, manifest rows for
// all 6 Event Courtyard Marks, and untouched public/assets/scenes/.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { assetById, courtyardMarkAssetId } from '../../src/content/assets';
import { courtyardMarkDef } from '../../src/content/courtyard-marks';
import { V18_COURTYARD_MARK_IDS } from '../../tools/grid-v18-marks';
import { palette } from '../../src/content/palette';
import {
  DEPLOYED_V18_GRID_IDS,
  isV18AddedAsset,
  isV18Asset,
  isV19GridFile,
  numberedAssets,
  redrawIds,
} from '../../tools/contact-sheet-data';
import {
  BATCH1_SUBJECTS,
  BATCH2_SUBJECTS,
  BATCH3_CONTACT_PATHS,
  BATCH3_SUBJECTS,
  STAGING_DIR,
} from '../../tools/contact-sheet-v18';

const ROOT = resolve(import.meta.dirname, '..', '..');
const PUBLIC_GRID = resolve(ROOT, 'public', 'assets', 'grid');
const BACKUP_GRID = resolve(ROOT, 'art-src', 'previous-v1.8', 'grid');
const HASH_PATH = resolve(ROOT, 'art-src', 'v1.8-grid-hashes.json');
const PALETTE_SET = new Set((palette?.colors ?? []).map((h) => h.toLowerCase()));

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');

const assetIdForGridFile = (filename: string): string => {
  const m = /^courtyard-mark-(.+)\.png$/.exec(filename);
  if (m) return `courtyard-mark.${m[1]}`;
  const found = [...assetById.values()].find(
    (a) => a.source !== 'placeholder' && a.file === `grid/${filename}`,
  );
  if (!found) throw new Error(`Missing manifest row for public/assets/grid/${filename}`);
  return found.id;
};

describe('v1.8 deployed grid art & Courtyard Marks (T18.11)', () => {
  const allSubjects = [...BATCH1_SUBJECTS, ...BATCH2_SUBJECTS, ...BATCH3_SUBJECTS];
  const allFiles = allSubjects.flatMap((s) => s.stagedFiles);

  it('keeps all 32 subjects marked Keep in docs/flesh-out/v1.8/art-marks.md', () => {
    expect(allSubjects).toHaveLength(32);
    expect(allFiles).toHaveLength(89);
    const marks = readFileSync(BATCH3_CONTACT_PATHS.marks, 'utf8');
    expect(marks).not.toContain('| Pending |');
    expect(marks).not.toContain('| Redraw |');
    for (const s of allSubjects) {
      expect(marks).toContain(`| ${s.num} | \`${s.id}\` | ${s.label} | Keep |`);
    }
  });

  it('backs up all 83 pre-v1.8 PNGs in art-src/previous-v1.8/grid/ matching non-redrawn v1.1 hashes', () => {
    expect(existsSync(BACKUP_GRID)).toBe(true);
    const backupFiles = readdirSync(BACKUP_GRID)
      .filter((f) => f.endsWith('.png'))
      .sort();
    expect(backupFiles).toHaveLength(83);

    const v11Hashes = JSON.parse(
      readFileSync(resolve(ROOT, 'art-src', 'v1.1-hashes.json'), 'utf8'),
    ) as Record<string, string>;
    const v11Redraw = redrawIds(
      readFileSync(resolve(ROOT, 'docs', 'flesh-out', 'v1.1', 'art-marks.md'), 'utf8'),
    );
    for (const [id, expectedHash] of Object.entries(v11Hashes)) {
      const filename = `${id.replace(/^grid\./, '').replaceAll('.', '-')}.png`;
      expect(existsSync(resolve(BACKUP_GRID, filename)), `backup missing: ${filename}`).toBe(true);
      if (!v11Redraw.has(id)) {
        const actualHash = sha256(readFileSync(resolve(BACKUP_GRID, filename)));
        expect(actualHash, `backup v1.1 Keep mismatch: ${id}`).toBe(expectedHash);
      }
    }
  });

  it('deploys all 89 packed PNGs matching staging, frozen SHA-256 hashes, Zughy-32, binary alpha, and manifest size', () => {
    expect(existsSync(HASH_PATH)).toBe(true);
    const frozen = JSON.parse(readFileSync(HASH_PATH, 'utf8')) as Record<string, string>;
    expect(Object.keys(frozen).sort()).toEqual([...DEPLOYED_V18_GRID_IDS].sort());
    expect(DEPLOYED_V18_GRID_IDS.size).toBe(89);

    const liveFiles = readdirSync(PUBLIC_GRID)
      .filter((f) => f.endsWith('.png') && !isV19GridFile(f))
      .sort();
    const stagedFiles = readdirSync(STAGING_DIR)
      .filter((f) => f.endsWith('.png'))
      .sort();
    expect(liveFiles).toHaveLength(89);
    expect(liveFiles).toEqual(stagedFiles);

    for (const file of allFiles) {
      const stagedPath = resolve(STAGING_DIR, file.name);
      const livePath = resolve(PUBLIC_GRID, file.name);
      const stagedBuf = readFileSync(stagedPath);
      const liveBuf = readFileSync(livePath);
      expect(liveBuf.equals(stagedBuf), `live vs staged mismatch: ${file.name}`).toBe(true);
      expect(liveBuf[25], `indexed PNG colorType: ${file.name}`).toBe(3);
      expect(liveBuf.length, `packed smaller than raw RGBA: ${file.name}`).toBeLessThan(
        file.render().toPng(file.h).length,
      );

      const assetId = assetIdForGridFile(file.name);
      expect(frozen[assetId], `hash mismatch: ${assetId}`).toBe(sha256(liveBuf));
      expect(isV18Asset(assetId), `isV18Asset(${assetId})`).toBe(true);

      const entry = assetById.get(assetId);
      expect(entry?.source, assetId).toBe('generated');
      expect(entry?.size, assetId).toEqual([file.w, file.h]);

      const png = PNG.sync.read(liveBuf);
      expect([png.width, png.height], file.name).toEqual([file.w, file.h]);
      let opaque = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        const a = png.data[i + 3] ?? 0;
        expect(a === 0 || a === 255, `${file.name} non-binary alpha at ${i / 4}`).toBe(true);
        if (a === 255) {
          opaque++;
          const hex = [0, 1, 2]
            .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
            .join('');
          expect(PALETTE_SET.has(hex), `${file.name} non-Zughy pixel ${hex}`).toBe(true);
        }
      }
      expect(opaque, `${file.name} opaque count`).toBeGreaterThan(0);
    }
  });

  it('registers all 6 Courtyard Marks in assets.ts without shifting v1.0 contact sheet numbers', () => {
    for (const id of V18_COURTYARD_MARK_IDS) {
      const assetId = courtyardMarkAssetId(id);
      expect(assetId).toBe(`courtyard-mark.${id}`);
      expect(isV18Asset(assetId)).toBe(true);
      expect(isV18AddedAsset(assetId)).toBe(true);
      const row = assetById.get(assetId);
      expect(row).toMatchObject({
        id: assetId,
        kind: 'icon',
        size: [16, 16],
        label: courtyardMarkDef(id).name,
        source: 'generated',
        file: `grid/courtyard-mark-${id}.png`,
      });
    }
    expect(isV18Asset('icon.embers')).toBe(false);
    expect(isV18Asset('sprite.hunter.arvid')).toBe(false);
    expect(isV18Asset('scene.hold.bastion')).toBe(false);
    expect(numberedAssets.some((x) => x.asset.id.startsWith('courtyard-mark.'))).toBe(false);
  });

  it('leaves public/assets/scenes/ untouched during v1.8 grid art deployment', () => {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', 'public/assets/scenes'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    expect(dirty).toBe('');
  });
});
