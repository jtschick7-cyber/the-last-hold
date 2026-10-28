// Plan TD.10 (GDD §6.5 row "Descent save growth", D575, D576, M4): the Descent block of a played save,
// with `last` and `firstWin` both full 14-hunter records, stays within 14 KB raw.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HUNTER_IDS } from '../../src/content/hunters';
import { loadEnvelope } from '../../src/core/save';

describe('the Descent save growth (D576)', () => {
  it('is at most 14 KB raw with two full 14-hunter records', () => {
    const raw = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v14-played.json', import.meta.url), 'utf8'),
    );
    const r = loadEnvelope(raw);
    if (!r.ok) throw new Error(r.error);
    const d = r.value.state.descent;
    expect(d.firstWin?.order).toHaveLength(HUNTER_IDS.length);
    expect(d.last?.order).toHaveLength(HUNTER_IDS.length);
    const bytes = new TextEncoder().encode(JSON.stringify(d)).length;
    expect(bytes).toBeLessThanOrEqual(14 * 1024);
    console.info(`descent block ${bytes} bytes`);
  });
});
