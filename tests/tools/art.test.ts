// Plan T1.31a: the art recipes and the manifest agree, and every recipe uses
// tiles that exist in its sheet.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assetById, assets } from '../../src/content/assets';
import { fonts } from '../../src/content/fonts';
import { recipes, SHEETS } from '../../tools/art-recipes';

describe('art recipes', () => {
  it('every recipe has a manifest row with the same file and pack', () => {
    for (const r of recipes) {
      const row = assetById.get(r.id);
      expect(row?.source, r.id).toBe('pack');
      if (row?.source !== 'pack') continue;
      expect(row.file).toBe(r.file);
      expect(row.pack).toBe(SHEETS[r.sheet].pack);
    }
  });

  it('every pack row in the manifest has a recipe', () => {
    const ids = new Set(recipes.map((r) => r.id));
    for (const a of assets) if (a.source === 'pack') expect(ids.has(a.id), a.id).toBe(true);
  });

  it('recipe sizes match the manifest, and every layer has the same shape', () => {
    for (const r of recipes) {
      const rows = r.layers[0]?.length ?? 0;
      const cols = r.layers[0]?.[0]?.length ?? 0;
      expect([cols * 16, rows * 16], r.id).toEqual([...(assetById.get(r.id)?.size ?? [])]);
      for (const layer of r.layers) {
        expect(layer.length, r.id).toBe(rows);
        for (const row of layer) expect(row.length, r.id).toBe(cols);
      }
    }
  });

  it('every font file exists', () => {
    for (const f of fonts)
      expect(existsSync(new URL(`../../public/${f.file}`, import.meta.url)), f.file).toBe(true);
  });
});
