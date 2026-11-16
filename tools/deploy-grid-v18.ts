// Plan T18.11 (D623, D624): backs up replaced v1.1 PNGs in art-src/previous-v1.8/grid/, deploys
// all 89 approved Zughy-32 PNGs from art-src/v1.8-staging/ to public/assets/grid/, and freezes
// SHA-256 hashes in art-src/v1.8-grid-hashes.json. Idempotent: existing backups are preserved.
// Run: npx vite-node tools/deploy-grid-v18.ts
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { assetById } from '../src/content/assets';
import {
  BATCH1_SUBJECTS,
  BATCH2_SUBJECTS,
  BATCH3_SUBJECTS,
  STAGING_DIR,
} from './contact-sheet-v18';
import { packPng } from './png-pack';

const ROOT = resolve(import.meta.dirname, '..');
const PUBLIC_GRID = resolve(ROOT, 'public', 'assets', 'grid');
const BACKUP_GRID = resolve(ROOT, 'art-src', 'previous-v1.8', 'grid');
const HASH_PATH = resolve(ROOT, 'art-src', 'v1.8-grid-hashes.json');

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex');

const fileToAssetId = new Map<string, string>();
for (const entry of assetById.values()) {
  if (entry.source !== 'placeholder' && entry.file.startsWith('grid/')) {
    fileToAssetId.set(entry.file.replace(/^grid\//, ''), entry.id);
  }
}

const allStaged = [...BATCH1_SUBJECTS, ...BATCH2_SUBJECTS, ...BATCH3_SUBJECTS].flatMap(
  (s) => s.stagedFiles,
);

// 1. Back up the 83 pre-deployment v1.1 PNGs once before overwriting.
mkdirSync(BACKUP_GRID, { recursive: true });
const existingBackups = readdirSync(BACKUP_GRID).filter((f) => f.endsWith('.png'));
if (existingBackups.length === 0) {
  const existingGrid = readdirSync(PUBLIC_GRID)
    .filter((f) => f.endsWith('.png'))
    .sort();
  if (existingGrid.length !== 83) {
    throw new Error(
      `Expected 83 existing grid PNGs before deployment, found ${existingGrid.length}`,
    );
  }
  for (const name of existingGrid) {
    copyFileSync(resolve(PUBLIC_GRID, name), resolve(BACKUP_GRID, name));
  }
  console.log(`Backed up ${existingGrid.length} original PNGs to art-src/previous-v1.8/grid/`);
} else {
  console.log(
    `Preserved ${existingBackups.length} existing backup PNGs in art-src/previous-v1.8/grid/`,
  );
}

// 2. Deploy all 89 approved packed PNGs from art-src/v1.8-staging/ into public/assets/grid/.
mkdirSync(PUBLIC_GRID, { recursive: true });
const hashes: Record<string, string> = {};
for (const spec of allStaged) {
  const srcPath = resolve(STAGING_DIR, spec.name);
  const dstPath = resolve(PUBLIC_GRID, spec.name);
  const buf = readFileSync(srcPath);
  if (packPng(buf) !== null) {
    throw new Error(`Staged PNG is not maximally packed: ${spec.name}`);
  }
  copyFileSync(srcPath, dstPath);
  const assetId = fileToAssetId.get(spec.name);
  if (!assetId) {
    throw new Error(`No manifest row maps to grid/${spec.name}`);
  }
  hashes[assetId] = sha256(buf);
}

// 3. Freeze sorted SHA-256 hashes in art-src/v1.8-grid-hashes.json.
const sortedHashes = Object.fromEntries(
  Object.entries(hashes).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
);
writeFileSync(HASH_PATH, `${JSON.stringify(sortedHashes, null, 2)}\n`);
console.log(
  `Deployed ${allStaged.length} PNGs to public/assets/grid/ and froze ${Object.keys(sortedHashes).length} hashes in art-src/v1.8-grid-hashes.json (${existsSync(HASH_PATH) ? 'ok' : 'missing'})`,
);
