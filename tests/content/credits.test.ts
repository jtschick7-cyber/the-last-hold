// Technical design §12.4: the license checks CI runs on every push.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assets } from '../../src/content/assets';
import { buildCredits } from '../../src/core/credits';

const ASSET_DIR = fileURLToPath(new URL('../../public/assets/', import.meta.url));

const filesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });

describe('art licenses and credits', () => {
  it('every pack asset is CC0 with a source URL and a credit', () => {
    for (const a of assets) {
      if (a.source !== 'pack') continue;
      expect(a.license, a.id).toBe('CC0');
      expect(a.url, a.id).toMatch(/^https:\/\//);
      expect(a.credit.trim(), a.id).not.toBe('');
    }
  });

  // Plan TV.12 (b): both directions between the manifest's pack rows and the committed credits.
  it('every pack row has a credit line and every credit line has a pack row', () => {
    const committed = readFileSync(new URL('../../docs/credits.md', import.meta.url), 'utf8');
    const section = committed.split('## Art packs (CC0)')[1]?.split('## Fonts')[0] ?? '';
    const credited = new Map(
      [...section.matchAll(/^- \*\*(.+?)\*\* by .*?\. (\d+) images?\.$/gm)].map((m) => [
        m[1] as string,
        Number(m[2]),
      ]),
    );
    const rows = new Map<string, number>();
    for (const a of assets) if (a.source === 'pack') rows.set(a.pack, (rows.get(a.pack) ?? 0) + 1);
    expect(credited).toEqual(rows);
    for (const a of assets) if (a.source === 'pack') expect(a.credit.trim(), a.id).not.toBe('');
  });

  it('every file in public/assets/ is in the manifest (placeholders aside)', () => {
    const listed = new Set(assets.flatMap((a) => (a.source === 'placeholder' ? [] : [a.file])));
    const files = filesUnder(ASSET_DIR)
      .map((f) => relative(ASSET_DIR, f).split('\\').join('/'))
      .filter((f) => !f.startsWith('placeholders/'));
    expect(files.filter((f) => !listed.has(f))).toEqual([]);
  });

  it('docs/credits.md is up to date (run: npx vite-node tools/gen-credits.ts)', () => {
    const committed = readFileSync(new URL('../../docs/credits.md', import.meta.url), 'utf8');
    expect(committed).toBe(buildCredits());
  });
});
