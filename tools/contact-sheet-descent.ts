// v1.4 (plan TD.5, D565): the numbered Keep/Redraw sheet for the Descent's five pictures. Run by hand:
//   npx vite-node tools/contact-sheet.ts -- --descent-sheets
// Writes docs/flesh-out/v1.4/contact-sheets/descent.png (every picture on both theme backgrounds, the
// battle sprite frame by frame, the banners at 2×) and the empty marks table to
// docs/flesh-out/v1.4/art-marks.md. Numbered 1 to 5 on their own: the v1.0 and v1.1 numbers are untouched.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { SPRITE_FRAME_NAMES, SPRITE_PX } from '../src/content/assets';
import { v14Numbered, type NumberedAsset } from './contact-sheet-data';

const OUT = new URL('../docs/flesh-out/v1.4/contact-sheets/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const DARK = '#302c2e';
const LIGHT = '#cfc6b8';

const url = (file: string): string =>
  `data:image/png;base64,${readFileSync(new URL(`../public/assets/${file}`, import.meta.url)).toString('base64')}`;
const bg = (color: string, inner: string): string =>
  `<span class="bg" style="background:${color}">${inner}</span>`;
const img = (file: string, w: number, h: number): string =>
  `<img src="${url(file)}" width="${w}" height="${h}" alt="">`;
const frames = (file: string, k: number, color: string): string =>
  bg(
    color,
    SPRITE_FRAME_NAMES.map(
      (_, i) =>
        `<span class="f" style="width:${SPRITE_PX * k}px;height:${SPRITE_PX * k}px;background-image:url(${url(file)});background-size:${SPRITE_PX * SPRITE_FRAME_NAMES.length * k}px ${SPRITE_PX * k}px;background-position:-${i * SPRITE_PX * k}px 0"></span>`,
    ).join(''),
  );

const cell = (x: NumberedAsset): string => {
  const f = x.asset.file;
  const label = `<div class="n">${x.n}</div><div class="id">${x.asset.id}</div>`;
  if (x.asset.kind === 'portrait')
    return `<figure>${bg(DARK, img(f, 256, 256))}${bg(LIGHT, img(f, 128, 128))}${label}</figure>`;
  if (x.asset.kind === 'sprite')
    return `<figure class="wide">${frames(f, 4, DARK)}${frames(f, 2, LIGHT)}${label}</figure>`;
  return `<figure class="wide">${bg(DARK, img(f, 480, 192))}${bg(LIGHT, img(f, 320, 128))}${label}</figure>`;
};

const CSS = `body{margin:0;padding:12px;background:#1b181a;color:#f4cca1;font-family:system-ui,sans-serif;width:max-content;max-width:1100px}
h1{font-size:16px;margin:0 0 10px;font-weight:600}.grid{display:flex;flex-wrap:wrap;gap:10px}
figure{margin:0;padding:6px;background:#39314b;border-radius:6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
figure.wide{width:690px}img{image-rendering:pixelated;display:block}.bg{display:inline-flex;gap:2px;padding:4px;border-radius:3px}
.f{display:block;flex:none;image-rendering:pixelated;background-repeat:no-repeat}
.n{font-size:22px;font-weight:700;color:#f4b41b;line-height:1}.id{font-size:11px;color:#a0938e}`;

const html = `<!doctype html><meta charset="utf-8"><style>${CSS}</style><h1>The Descent: five pictures (v1.4)</h1><div class="grid">${v14Numbered.map(cell).join('')}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.locator('body').screenshot({ path: new URL('descent.png', OUT).pathname });
await browser.close();

const marksUrl = new URL('../docs/flesh-out/v1.4/art-marks.md', import.meta.url);
if (!existsSync(marksUrl)) {
  writeFileSync(
    marksUrl,
    [
      '# Art marks (v1.4 Descent art: Keep / Redraw)',
      '',
      'Number → id, on their own numbers 1 to 5 (the v1.0 numbers 1–156 and v1.1 numbers 1–83 are unchanged). The owner marks each row **Keep** or **Redraw**; an empty mark means Keep.',
      'Redraws (TD.6) ship after a before/after sheet is approved (D475, D565). Once all five are approved their hashes are frozen in `art-src/v1.4-hashes.json`.',
      '',
      '| n | id | mark | what to change |',
      '|---|---|---|---|',
      ...v14Numbered.map((x) => `| ${x.n} | \`${x.asset.id}\` | | |`),
      '',
    ].join('\n'),
  );
}
console.log(`wrote descent.png and art-marks.md for ${v14Numbered.length} pictures`);
