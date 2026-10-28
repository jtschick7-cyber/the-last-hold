// v1.4 (plan TD.6, D565): the before/after sheet for the Descent's redrawn pictures. Before =
// art-src/previous-v1.4/ (the pictures the owner marked), after = public/assets/. Run by hand:
//   npx vite-node tools/before-after-descent.ts
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { SPRITE_FRAME_NAMES, SPRITE_PX } from '../src/content/assets';
import { v14Numbered } from './contact-sheet-data';

const OUT = new URL('../docs/flesh-out/v1.4/before-after/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const DARK = '#302c2e';
const LIGHT = '#cfc6b8';
const url = (path: string): string =>
  `data:image/png;base64,${readFileSync(new URL(`../${path}`, import.meta.url)).toString('base64')}`;
const PREVIOUS: Record<string, string> = {
  'portrait.monster.unlit': 'portrait-monster-unlit.png',
  'sprite.monster.unlit': 'sprite-monster-unlit.png',
  'scene.descent.stage-1': 'descent-stage-1.png',
  'scene.descent.stage-2': 'descent-stage-2.png',
  'scene.descent.stage-3': 'descent-stage-3.png',
};
const one = (src: string, w: number, h: number, k: number, strip: boolean): string =>
  strip
    ? `<span class="bg">${SPRITE_FRAME_NAMES.map(
        (_, i) =>
          `<span class="f" style="width:${SPRITE_PX * k}px;height:${SPRITE_PX * k}px;background-image:url(${src});background-size:${SPRITE_PX * 5 * k}px ${SPRITE_PX * k}px;background-position:-${i * SPRITE_PX * k}px 0"></span>`,
      ).join('')}</span>`
    : `<span class="bg"><img src="${src}" width="${w * k}" height="${h * k}" alt=""></span>`;

const rows = v14Numbered.map((x) => {
  const [w, h] = x.asset.size;
  const strip = x.asset.kind === 'sprite';
  const k = x.asset.kind === 'portrait' ? 3 : strip ? 3 : 2;
  const before = url(`art-src/previous-v1.4/${PREVIOUS[x.asset.id]}`);
  const after = url(`public/assets/${x.asset.file}`);
  return `<section><div class="n">${x.n} · ${x.asset.id}</div><div class="pair"><div><b>before</b>${one(before, w, h, k, strip)}</div><div><b>after</b>${one(after, w, h, k, strip)}</div></div>${
    strip
      ? `<div class="pair"><div><b>before, 1×</b><span class="bg l">${one(before, w, h, 1, true)}</span></div><div><b>after, 1×</b><span class="bg l">${one(after, w, h, 1, true)}</span></div></div>`
      : ''
  }</section>`;
});
const CSS = `body{margin:0;padding:12px;background:#1b181a;color:#f4cca1;font-family:system-ui,sans-serif;width:max-content}
h1{font-size:16px;margin:0 0 10px}section{background:#39314b;border-radius:6px;padding:8px;margin-bottom:10px}
.n{font-size:15px;font-weight:700;color:#f4b41b;margin-bottom:6px}.pair{display:flex;gap:16px;align-items:flex-start;margin-bottom:6px}
b{display:block;font-size:11px;color:#a0938e;margin-bottom:3px}img{image-rendering:pixelated;display:block}
.bg{display:inline-flex;gap:2px;padding:4px;border-radius:3px;background:${DARK}}.bg.l{background:${LIGHT}}
.f{display:block;flex:none;image-rendering:pixelated;background-repeat:no-repeat}`;
const html = `<!doctype html><meta charset="utf-8"><style>${CSS}</style><h1>The Descent: before and after (v1.4)</h1>${rows.join('')}`;
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.locator('body').screenshot({ path: new URL('descent.png', OUT).pathname });
await browser.close();
console.log('wrote docs/flesh-out/v1.4/before-after/descent.png');
