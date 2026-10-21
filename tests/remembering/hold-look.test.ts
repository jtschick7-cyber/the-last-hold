// Plan T11.12 (GDD §5.15.6, D457): the hold scene's two looks. The frost lies from Act VI's start
// until Remember Them; then the lamp. Keep the Vigil keeps the frost. Art is what the generators
// draw today, in the palette, at the manifest's size, on every Rank.
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { AGE_IDS } from '../../src/content/ages';
import { assetById, HOLD_LOOKS, holdLookId } from '../../src/content/assets';
import { loadEnvelope } from '../../src/core/save';
import type { GameState } from '../../src/core/state/game-state';
import { holdLook } from '../../src/core/story/remembering-view';
import { drawFrost, drawLamp, SCENE_H } from '../../tools/draw-hold-look';
import { PALETTE_HEX } from '../../tools/pixel';

const base = (): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  for (const c of s.cycles) c.act = c.act === 6 ? 5 : c.act;
  s.remembering.endings = [];
  return s;
};

describe('which look the hold has', () => {
  it('is plain before Act VI, frost from Act VI on, lamp after Remember Them', () => {
    const s = base();
    expect(holdLook(s)).toBe('plain');
    const last = s.cycles[s.cycles.length - 1];
    if (!last) throw new Error('no cycle');
    last.act = 6;
    expect(holdLook(s)).toBe('frost');
    s.remembering.endings.push({ ending: 'remember', at: 0, cycle: last.number });
    expect(holdLook(s)).toBe('lamp');
  });

  it('keeps the frost after Keep the Vigil, and stays frost in the cycles after Act VI', () => {
    const s = base();
    const last = s.cycles[s.cycles.length - 1];
    if (!last) throw new Error('no cycle');
    last.act = 6;
    s.cycles.push({ ...structuredClone(last), number: last.number + 1, act: null });
    s.remembering.endings.push({ ending: 'vigil', at: 0, cycle: last.number });
    expect(holdLook(s)).toBe('frost');
  });

  it('is the lamp even if Remember Them came with no act left in the cycle', () => {
    const s = base();
    s.remembering.endings.push({ ending: 'remember', at: 0, cycle: 1 });
    expect(holdLook(s)).toBe('lamp');
  });
});

describe('the looks’ art', () => {
  const cases = HOLD_LOOKS.flatMap((l) =>
    AGE_IDS.map((a) => ({
      row: holdLookId(l, a),
      drawn: () => (l === 'frost' ? drawFrost(a) : drawLamp(a)).toPng(SCENE_H),
    })),
  );

  it('has eight generated rows (2 looks × 4 Ranks)', () => {
    expect(cases).toHaveLength(8);
    for (const c of cases) expect(assetById.get(c.row)?.source, c.row).toBe('generated');
  });

  it.each(cases)('$row matches its generator, is 160 × 64 and stays in the palette', (c) => {
    const entry = assetById.get(c.row);
    if (entry?.source !== 'generated') throw new Error(`${c.row} is not generated`);
    const file = readFileSync(new URL(`../../public/assets/${entry.file}`, import.meta.url));
    expect(file.equals(c.drawn()), `${entry.file} is stale: rerun tools/gen-sprites.ts`).toBe(true);
    const png = PNG.sync.read(file);
    expect([png.width, png.height]).toEqual([160, 64]);
    let drawn = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      if ((png.data[i + 3] ?? 0) === 0) continue;
      drawn++;
      const hex = [0, 1, 2]
        .map((k) => (png.data[i + k] ?? 0).toString(16).padStart(2, '0'))
        .join('');
      expect(PALETTE_HEX.has(hex), `${entry.file} pixel ${i / 4}: ${hex}`).toBe(true);
    }
    expect(drawn).toBeGreaterThan(20);
  });
});
