// v1.0 (plan TV.8–TV.10): the before/after sheet for one art batch. Before = art-src/previous/ (the
// v0.11 PNG), after = public/assets/. Run by hand, not part of the build:
//   npx vite-node tools/before-after.ts <sheet-name> <n,n,...>   (numbers from art-marks.md)
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import { SPRITE_FRAME_NAMES, SPRITE_PX } from '../src/content/assets';
import { numberedAssets } from './contact-sheet-data';

const [name, list] = process.argv.slice(2);
if (!name || !list) throw new Error('Usage: before-after.ts <sheet-name> <n,n,...>');
const wanted = list.split(',').map(Number);
const OUT = new URL('../docs/flesh-out/v1.0/before-after/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const read = (dir: string, file: string): string | null => {
  const url = new URL(`../${dir}/${file}`, import.meta.url);
  return existsSync(url) ? `data:image/png;base64,${readFileSync(url).toString('base64')}` : null;
};
/** A scene overlay (a look or a cosmetic) shown over its base hold scene, as the game stacks them. */
const overOver = (dir: string, file: string, id: string): string | null => {
  const age = id.split('.').pop() ?? '';
  const over = new URL(`../${dir}/${file}`, import.meta.url);
  const base = new URL(`../public/assets/scenes/hold-${age}.png`, import.meta.url);
  if (!existsSync(over) || !existsSync(base)) return null;
  const b = PNG.sync.read(readFileSync(base));
  const o = PNG.sync.read(readFileSync(over));
  for (let i = 0; i < o.data.length; i += 4) {
    if ((o.data[i + 3] ?? 0) === 0) continue;
    for (let k = 0; k < 4; k++) b.data[i + k] = o.data[i + k] ?? 0;
  }
  return `data:image/png;base64,${PNG.sync.write(b).toString('base64')}`;
};
const K = Number(process.env.K ?? 3);
const still = (src: string | null, px: number, k: number, py = px): string =>
  src ? `<img src="${src}" width="${px * k}" height="${py * k}" alt="">` : '<i>missing</i>';
const strip = (src: string | null, k: number): string =>
  src
    ? `<span class="frames">${SPRITE_FRAME_NAMES.map(
        (_, i) =>
          `<span style="width:${SPRITE_PX * k}px;height:${SPRITE_PX * k}px;background-image:url(${src});background-size:${SPRITE_PX * SPRITE_FRAME_NAMES.length * k}px ${SPRITE_PX * k}px;background-position:-${i * SPRITE_PX * k}px 0"></span>`,
      ).join('')}</span>`
    : '<i>missing</i>';

const cells = wanted.map((n) => {
  const x = numberedAssets.find((a) => a.n === n);
  if (!x) throw new Error(`No picture numbered ${n}`);
  const f = x.asset.file;
  const stacked = /^scene\.(look|cosmetic)\./.test(x.asset.id);
  const before = stacked
    ? overOver('art-src/previous', f, x.asset.id)
    : read('art-src/previous', f);
  const after = stacked ? overOver('public/assets', f, x.asset.id) : read('public/assets', f);
  const isSprite = x.asset.kind === 'sprite';
  const px = x.asset.size[0];
  const py = x.asset.size[1];
  const view = (src: string | null): string =>
    isSprite
      ? strip(src, K)
      : `<span class="bg">${still(src, px, K, py)}</span><span class="bg light">${still(src, px, 1, py)}</span>`;
  return `<figure class="${isSprite ? 'wide' : ''}"><div class="t"><b>${n}</b> ${x.asset.id.replace(/^(portrait|sprite|icon|scene)\./, '')}</div>
<div class="row">${process.env.ONLY === 'after' ? '' : `<div><small>before</small>${view(before)}</div>`}<div><small>after</small>${view(after)}</div></div></figure>`;
});

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:12px;background:#1b181a;color:#f4cca1;font-family:system-ui,sans-serif;width:max-content;max-width:1100px}
.grid{display:flex;flex-wrap:wrap;gap:10px}figure{margin:0;padding:6px;background:#39314b;border-radius:6px}
.t{font-size:13px;margin-bottom:4px}.t b{color:#f4b41b;font-size:18px}small{display:block;color:#a0938e;font-size:10px}
.row{display:flex;gap:10px}img{image-rendering:pixelated;display:block}.bg{display:inline-flex;padding:3px;background:#302c2e;vertical-align:bottom;margin-right:4px}
.light{background:#cfc6b8}.frames{display:flex;gap:2px;background:#302c2e}.frames span{display:block;flex:none;image-rendering:pixelated}
i{color:#e6482e}</style><div class="grid">${cells.join('')}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.locator('body').screenshot({ path: new URL(`${name}.png`, OUT).pathname });
await browser.close();
console.log(`wrote docs/flesh-out/v1.0/before-after/${name}.png`);
