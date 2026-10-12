import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { paletteCandidates } from '../../src/content/palette-candidates';
import { hexToRgb, nearestIn, rgbToOklab } from '../../tools/color/oklab';
import { recolorPng } from '../../tools/recolor';

describe('OKLab nearest color (technical design §12.2)', () => {
  it('matches the published OKLab reference values', () => {
    const [L, a, b] = rgbToOklab([255, 255, 255]);
    expect(L).toBeCloseTo(1, 4);
    expect(a).toBeCloseTo(0, 4);
    expect(b).toBeCloseTo(0, 4);
    const red = rgbToOklab([255, 0, 0]);
    expect(red[0]).toBeCloseTo(0.62796, 3);
    expect(red[1]).toBeCloseTo(0.22486, 3);
    expect(red[2]).toBeCloseTo(0.12585, 3);
  });

  it('maps palette colors to themselves and others to a perceptual neighbor', () => {
    const near = nearestIn(['000000', 'ffffff', 'ff0000']);
    expect(near([255, 255, 255])).toEqual([255, 255, 255]);
    expect(near([20, 10, 10])).toEqual([0, 0, 0]);
    expect(near([230, 40, 30])).toEqual([255, 0, 0]);
  });

  it('every candidate palette has 32 distinct valid colors', () => {
    for (const p of paletteCandidates) {
      expect(p.colors).toHaveLength(32);
      expect(new Set(p.colors).size).toBe(32);
      for (const c of p.colors) expect(c).toMatch(/^[0-9a-f]{6}$/);
      for (const c of Object.values(p.ui)) expect(p.colors, `${p.id} ui ${c}`).toContain(c);
    }
  });
});

describe('recolorPng', () => {
  it('snaps every pixel to the palette and makes faint pixels transparent', () => {
    const img = new PNG({ width: 3, height: 1 });
    img.data.set([250, 250, 250, 255, 200, 30, 20, 200, 10, 200, 10, 40]);
    const out = PNG.sync.read(recolorPng(PNG.sync.write(img), ['ffffff', 'ff0000', '00ff00']));
    expect([...out.data]).toEqual([255, 255, 255, 255, 255, 0, 0, 255, 0, 0, 0, 0]);
    expect(hexToRgb('#1a2b3c')).toEqual([26, 43, 60]);
  });
});
