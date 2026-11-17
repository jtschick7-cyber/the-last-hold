// v1.9 (plan T19.6, D635, D636): deploys all 6 owner-approved packed Zughy-32 PNGs from
// art-src/v1.9-staging/ into public/assets/{portraits,sprites,grid}/ and freezes SHA-256 hashes
// in art-src/v1.9-hashes.json without altering v1.0-v1.8 frozen hashes.
// Run: npx vite-node tools/deploy-v19.ts
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assetById } from '../src/content/assets';
import { V19_STAGING_DIR, V19_SUBJECTS } from './contact-sheet-v19';
import { packPng } from './png-pack';

const ROOT = resolve(import.meta.dirname, '..');
const PUBLIC_ASSETS = resolve(ROOT, 'public', 'assets');
export const V19_HASHES_PATH = resolve(ROOT, 'art-src', 'v1.9-hashes.json');

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');

export function deployV19Art(): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const s of V19_SUBJECTS) {
    const srcPath = resolve(V19_STAGING_DIR, s.stagingRelPath);
    const dstPath = resolve(PUBLIC_ASSETS, s.deployedRelPath);
    if (!existsSync(srcPath)) {
      throw new Error(`Missing staged PNG: ${srcPath}`);
    }
    const buf = readFileSync(srcPath);
    if (packPng(buf) !== null) {
      throw new Error(`Staged PNG is not maximally packed: ${s.stagingRelPath}`);
    }
    const row = assetById.get(s.id);
    if (!row || row.source === 'placeholder') {
      throw new Error(`Asset manifest row ${s.id} is missing or still placeholder`);
    }
    if (row.file !== s.deployedRelPath) {
      throw new Error(`Manifest path mismatch for ${s.id}: ${row.file} vs ${s.deployedRelPath}`);
    }
    mkdirSync(resolve(dstPath, '..'), { recursive: true });
    copyFileSync(srcPath, dstPath);
    hashes[s.id] = sha256(buf);
  }
  const sorted = Object.fromEntries(
    Object.entries(hashes).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  writeFileSync(V19_HASHES_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  return sorted;
}

if (process.argv.some((a) => a.endsWith('deploy-v19.ts'))) {
  const frozen = deployV19Art();
  console.log(
    `Deployed ${Object.keys(frozen).length} v1.9 PNGs and froze SHA-256 hashes in art-src/v1.9-hashes.json`,
  );
}
