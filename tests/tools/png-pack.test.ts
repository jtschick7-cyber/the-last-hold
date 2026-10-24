// D553: the production build ships every picture re-packed without changing one pixel. The packer
// (tools/png-pack.ts) turns a picture of up to 256 colors into an indexed PNG, and hands back
// nothing at all unless the result is smaller and decodes to exactly the same pixels.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { packPng } from '../../tools/png-pack';

const root = new URL('../..', import.meta.url).pathname;

const all = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? all(join(dir, e.name)) : e.name.endsWith('.png') ? [join(dir, e.name)] : [],
  );

const make = (w: number, h: number, pixel: (x: number, y: number) => number[]): Buffer => {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = pixel(x, y);
      png.data.set(p, (y * w + x) * 4);
    }
  return PNG.sync.write(png);
};
const pixels = (buf: Buffer): Buffer => PNG.sync.read(buf).data;
const colorType = (buf: Buffer): number => buf[25] ?? -1;
const bitDepth = (buf: Buffer): number => buf[24] ?? -1;

describe('packPng', () => {
  it('re-packs a few-colour picture smaller, with identical pixels, alpha included', () => {
    const src = make(64, 48, (x, y) =>
      (x + y) % 7 === 0 ? [0, 0, 0, 0] : x % 5 === 0 ? [200, 40, 40, 128] : [30, 90, 160, 255],
    );
    const out = packPng(src);
    expect(out).not.toBeNull();
    if (!out) return;
    expect(out.length).toBeLessThan(src.length);
    expect(colorType(out)).toBe(3);
    expect(pixels(out).equals(pixels(src))).toBe(true);
  });

  it('uses 1 bit per pixel for two colours, 2 for four, 4 for sixteen', () => {
    const colours = (n: number) => (x: number, y: number) => [((x + 2 * y) % n) * 10, 5, 9, 255];
    for (const [n, depth] of [
      [2, 1],
      [4, 2],
      [16, 4],
      [17, 8],
    ] as const) {
      const src = make(40, 40, colours(n));
      const out = packPng(src);
      expect(out, `${n} colours`).not.toBeNull();
      if (out) {
        expect(bitDepth(out)).toBe(depth);
        expect(pixels(out).equals(pixels(src))).toBe(true);
      }
    }
  });

  it('keeps an image of one pixel exact', () => {
    const src = make(1, 1, () => [12, 34, 56, 78]);
    const out = packPng(src);
    if (out) expect(pixels(out).equals(pixels(src))).toBe(true);
  });

  it('hands back nothing for more than 256 colours', () => {
    const src = make(32, 32, (x, y) => [x * 8, y * 8, (x * y) % 256, 255]);
    expect(packPng(src)).toBeNull();
  });

  it('hands back nothing when the result would not be smaller', () => {
    const src = make(2, 2, (x, y) => [x * 100, y * 100, 3, 255]);
    const out = packPng(src);
    if (out) expect(out.length).toBeLessThan(src.length);
  });

  it('hands back nothing for a file it does not understand', () => {
    expect(packPng(Buffer.from('not a png'))).toBeNull();
    const src = make(16, 16, () => [1, 2, 3, 255]);
    const withGamma = Buffer.concat([
      src.subarray(0, 33),
      Buffer.from([0, 0, 0, 4, 0x67, 0x41, 0x4d, 0x41, 0, 1, 0x86, 0xa0, 0, 0, 0, 0]),
      src.subarray(33),
    ]);
    expect(packPng(withGamma)).toBeNull(); // a chunk that could change how it is shown
  });
});

describe('every picture the game ships', () => {
  const files = [...all(join(root, 'public')), ...all(join(root, 'art-src/icons-preview'))];

  it('packs to identical pixels and is never larger', () => {
    expect(files.length).toBeGreaterThan(250);
    let before = 0;
    let after = 0;
    for (const f of files) {
      const src = readFileSync(f);
      const out = packPng(src);
      before += src.length;
      after += out ? out.length : src.length;
      if (out) expect(pixels(out).equals(pixels(src)), f).toBe(true);
    }
    expect(after).toBeLessThan(before * 0.5); // about 300 KB down to about 120 KB (measured)
  });
});

describe('the live build', () => {
  it('has no contact sheet and no picture that is not as small as the packer can make it', () => {
    const out = mkdtempSync(join(tmpdir(), 'lh-png-'));
    try {
      execFileSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], {
        cwd: root,
        env: { ...process.env, LH_CHANNEL: 'live' },
        stdio: 'ignore',
      });
      expect(existsSync(join(out, 'contact-sheet.html'))).toBe(false);
      expect(readFileSync(join(out, 'sw.js'), 'utf8')).not.toMatch(/contact-sheet/);
      const shipped = all(out);
      expect(shipped.length).toBeGreaterThan(250);
      // The app icons are left as they are (vite.config.ts): the PWA plugin lists them with the hash of
      // the original, and a packed copy would make a second, different hash for the same file.
      for (const f of shipped)
        if (!f.startsWith(join(out, 'icons') + sep)) expect(packPng(readFileSync(f)), f).toBeNull();
      // The service worker lists every file once, or with the same hash each time: Workbox refuses to
      // install otherwise and the game stops working offline.
      const entries = [
        ...readFileSync(join(out, 'sw.js'), 'utf8').matchAll(/\{url:"([^"]+)",revision:([^}]+)\}/g),
      ];
      const seen = new Map<string, string>();
      for (const [, url, revision] of entries) {
        expect(seen.get(url as string) ?? revision, url).toBe(revision);
        seen.set(url as string, revision as string);
      }
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 90_000);

  it('keeps the contact sheet in the preview build', () => {
    const out = mkdtempSync(join(tmpdir(), 'lh-preview-'));
    try {
      execFileSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], {
        cwd: root,
        env: { ...process.env, LH_CHANNEL: 'preview' },
        stdio: 'ignore',
      });
      expect(existsSync(join(out, 'contact-sheet.html'))).toBe(true);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 90_000);
});
