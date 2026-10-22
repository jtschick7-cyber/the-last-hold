// v1.0 (plan TV.10c, D489 (5)): the app icon files exist at their sizes, the page links the
// apple-touch-icon and a favicon, the manifest lists the icons (the maskable one marked), and only
// the preview set carries the corner mark (kept inside a maskable icon's safe zone).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';

const read = (path: string): PNG =>
  PNG.sync.read(readFileSync(new URL(`../../${path}`, import.meta.url)));
const text = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const FILES: readonly (readonly [string, number])[] = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
];
const MARK = [0x28, 0xcc, 0xdf];

const markPixels = (png: PNG): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < png.height; y++)
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      if (MARK.every((v, k) => png.data[i + k] === v)) out.push([x, y]);
    }
  return out;
};

describe('app icons', () => {
  it.each(FILES)('%s exists at %i px, live and preview', (name, size) => {
    for (const dir of ['public/icons', 'art-src/icons-preview']) {
      const png = read(`${dir}/${name}`);
      expect([png.width, png.height]).toEqual([size, size]);
    }
  });

  it('only the preview icons carry the corner mark, and a maskable one keeps it in the safe zone', () => {
    for (const [name, size] of FILES) {
      expect(markPixels(read(`public/icons/${name}`))).toHaveLength(0);
      const marked = markPixels(read(`art-src/icons-preview/${name}`));
      expect(marked.length).toBeGreaterThan(size);
      for (const [x, y] of marked) {
        expect(x).toBeGreaterThan(size / 2);
        expect(y).toBeLessThan(size / 2);
        if (name === 'icon-maskable-512.png') {
          expect(x).toBeLessThanOrEqual(size * 0.9);
          expect(y).toBeGreaterThanOrEqual(Math.round(size * 0.1));
        }
      }
    }
  });

  it('the page links the apple-touch-icon and a favicon', () => {
    const html = text('index.html');
    expect(html).toContain('rel="apple-touch-icon" href="icons/apple-touch-icon.png"');
    expect(html).toContain('rel="icon"');
    expect(html).toContain('icons/favicon-32.png');
  });

  it('the manifest lists 192, 512 and a maskable 512, and the preview build swaps in the marked set', () => {
    const config = text('vite.config.ts');
    expect(config).toContain("sizes: '192x192'");
    expect(config).toContain("src: 'icons/icon-maskable-512.png'");
    expect(config).toContain("purpose: 'maskable'");
    expect(config).toContain('art-src/icons-preview');
  });
});
