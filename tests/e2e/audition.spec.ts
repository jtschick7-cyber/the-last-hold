import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { expect, test } from '@playwright/test';
import { parseSoundMarks } from '../../tools/sound-marks';
import { candidateAudioFile } from '../../tools/audition-page';

// SF.4 (D524 (2)): the audition page, in the preview build, at the phone viewport. Every button is at
// least 44 × 44 px, every candidate decodes in Chromium, and the page matches sound-marks.md.
const marks = parseSoundMarks(readFileSync('docs/flesh-out/v1.2/sound-marks.md', 'utf8'));
const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.mp3': 'audio/mpeg',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

let dir = '';
let server: Server;
let origin = '';

test.beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'lh-preview-'));
  execFileSync('npx', ['vite', 'build', '--outDir', dir, '--emptyOutDir'], {
    env: { ...process.env, LH_CHANNEL: 'preview' },
    stdio: 'ignore',
  });
  server = createServer((req, res) => {
    const path = join(dir, new URL(req.url ?? '/', 'http://x').pathname);
    try {
      statSync(path);
      res.setHeader('content-type', TYPES[extname(path)] ?? 'application/octet-stream');
      res.end(readFileSync(path));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  const addr = server.address();
  origin = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
});

test.afterAll(async () => {
  await new Promise((ok) => server.close(ok));
  rmSync(dir, { recursive: true, force: true });
});

test('the page lists the map, every button is 44 px, and every candidate decodes', async ({
  page,
}) => {
  await page.goto(`${origin}/audition.html`);
  const buttons = page.locator('button.play');
  await expect(buttons).toHaveCount(marks.candidates.length);
  for (const [i, c] of marks.candidates.entries())
    await expect(buttons.nth(i)).toHaveAttribute(
      'data-file',
      `audition/${candidateAudioFile(c.n)}`,
    );

  for (const sel of ['button.play', 'label.pick']) {
    const boxes = await page.locator(sel).evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return [r.width, r.height];
      }),
    );
    for (const [w, h] of boxes) {
      expect(w).toBeGreaterThanOrEqual(44);
      expect(h).toBeGreaterThanOrEqual(44);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  const decoded = await page.evaluate(async () => {
    const ctx = new AudioContext();
    const out: number[] = [];
    for (const b of Array.from(document.querySelectorAll<HTMLElement>('button.play'))) {
      const buf = await (await fetch(b.dataset.file ?? '')).arrayBuffer();
      out.push((await ctx.decodeAudioData(buf)).length);
    }
    return out;
  });
  expect(decoded).toHaveLength(marks.candidates.length);
  for (const n of decoded) expect(n).toBeGreaterThan(0);

  // The running total follows the picks.
  await page.locator('section[data-slot="build"] input').first().check();
  await expect(page.locator('#total')).toContainText('Picked so far');
  await expect(page.locator('#picks')).toContainText('Build: 1');
});
