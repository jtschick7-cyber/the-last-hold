// Plan TV.2 (D475, D489): the numbered contact sheets list every generated picture exactly once, with
// stable numbers; the v0.11 hashes are recorded; a picture not marked Redraw is byte-identical to its
// v0.11 PNG (the Keep test, D489 (1)).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assets } from '../../src/content/assets';
import {
  currentHashes,
  isV11Asset,
  isV14Asset,
  numberedAssets,
  redrawIds,
  sheetPlan,
} from '../../tools/contact-sheet-data';

const read = (p: string): string => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('numbered contact sheets', () => {
  const generated = assets.filter(
    (a) => a.source === 'generated' && !isV11Asset(a.id) && !isV14Asset(a.id),
  ); // D507 (4), D566 (6)

  it('number every generated row once, in id order', () => {
    expect(numberedAssets.length).toBe(generated.length);
    expect(numberedAssets.map((x) => x.n)).toEqual(generated.map((_, i) => i + 1));
    const ids = numberedAssets.map((x) => x.asset.id);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('put every numbered picture on exactly one sheet', () => {
    const onSheets = sheetPlan.flatMap((s) => s.items.map((x) => x.n));
    expect([...onSheets].sort((a, b) => a - b)).toEqual(numberedAssets.map((x) => x.n));
  });

  it('keep the marks table in step with the numbers', () => {
    const marks = read('../../docs/flesh-out/v1.0/art-marks.md');
    for (const x of numberedAssets) expect(marks).toContain(`| ${x.n} | \`${x.asset.id}\` |`);
  });
});

describe('Keep pictures are byte-identical to v0.11', () => {
  const recorded = JSON.parse(read('../../art-src/v0.11-hashes.json')) as Record<string, string>;
  const redraw = redrawIds(read('../../docs/flesh-out/v1.0/art-marks.md'));
  const now = currentHashes();

  it('has a recorded hash for every manifest file', () => {
    for (const a of assets)
      if (a.source !== 'placeholder' && !isV11Asset(a.id) && !isV14Asset(a.id))
        expect(recorded[a.id], a.id).toBeDefined(); // D507 (4), D566 (6)
  });

  it('matches the recorded hash for every picture not marked Redraw', () => {
    for (const [id, hash] of Object.entries(recorded)) {
      if (redraw.has(id) || id.startsWith('app-icon:')) continue;
      expect(now[id], id).toBe(hash);
    }
  });

  it('reads Redraw marks from the table', () => {
    expect([...redrawIds('| 3 | `icon.star` | Redraw |\n| 4 | `icon.rime` | Keep |\n')]).toEqual([
      'icon.star',
    ]);
  });
});
