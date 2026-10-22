// v1.0 (plan TV.2): the numbered Keep/Redraw sheets. Run by hand through `contact-sheet.ts --sheets`;
// not part of the build. Writes PNG sheets to docs/flesh-out/v1.0/contact-sheets/, the
// number → id map and the empty marks table to art-marks.md, and art-src/v0.11-hashes.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { chromium } from '@playwright/test';
import { assetById, SPRITE_FRAME_NAMES, SPRITE_PX } from '../src/content/assets';
import { AGE_IDS } from '../src/content/ages';
import { iconCandidates, ICON_COLORS } from './icon-candidates';
import { currentHashes, numberedAssets, sheetPlan, type NumberedAsset } from './contact-sheet-data';

const OUT = new URL('../docs/flesh-out/v1.0/contact-sheets/', import.meta.url);
const DARK = '#302c2e';
const LIGHT = '#cfc6b8';
mkdirSync(OUT, { recursive: true });

// Pictures are embedded as data URLs, so each sheet is one self-contained file.
const url = (file: string): string =>
  `data:image/png;base64,${readFileSync(new URL(`../public/assets/${file}`, import.meta.url)).toString('base64')}`;

const bg = (color: string, inner: string): string =>
  `<span class="bg" style="background:${color}">${inner}</span>`;
const img = (file: string, w: number, h: number): string =>
  `<img src="${url(file)}" width="${w}" height="${h}" alt="">`;

const label = (x: NumberedAsset): string =>
  `<div class="n">${x.n}</div><div class="id">${x.asset.id.replace(/^(portrait|sprite|icon|scene)\./, '')}</div>`;

const frameStrip = (file: string, k: number, bgc: string): string =>
  `<span class="bg frames" style="background:${bgc}">${SPRITE_FRAME_NAMES.map(
    (_, i) =>
      `<span style="width:${SPRITE_PX * k}px;height:${SPRITE_PX * k}px;background-image:url(${url(file)});background-size:${SPRITE_PX * SPRITE_FRAME_NAMES.length * k}px ${SPRITE_PX * k}px;background-position:-${i * SPRITE_PX * k}px 0"></span>`,
  ).join('')}</span>`;

const AGE_OF = /\.(hamlet|keep|citadel|bastion)$/;
const overlay = (x: NumberedAsset): string => {
  const age = AGE_OF.exec(x.asset.id)?.[1];
  const base = age ? assetById.get(`scene.hold.${age}`) : undefined;
  const top = img(x.asset.file, 320, 128).replace('<img', '<img class="over"');
  if (base && base.source !== 'placeholder' && AGE_IDS.includes(age as never)) {
    return `<span class="stack">${img(base.file, 320, 128)}${top}</span>`;
  }
  return `<span class="stack">${img(x.asset.file, 320, 128)}</span>`;
};

const cellFor = (kind: string, x: NumberedAsset): string => {
  const f = x.asset.file;
  if (kind === 'portraits') {
    return `<figure>${bg(DARK, img(f, 128, 128))}${bg(LIGHT, img(f, 64, 64))}${label(x)}</figure>`;
  }
  if (kind === 'sprites') {
    return `<figure class="wide">${frameStrip(f, 2, DARK)}${frameStrip(f, 1, LIGHT)}${label(x)}</figure>`;
  }
  if (kind === 'icons') {
    const s = x.asset.kind === 'frame' ? 20 : 16;
    return `<figure>${bg(DARK, img(f, s * 4, s * 4))}${bg(LIGHT, img(f, s * 4, s * 4))}${label(x)}</figure>`;
  }
  return `<figure class="scene">${overlay(x)}${label(x)}</figure>`;
};

const CSS = `body{margin:0;padding:12px;background:#1b181a;color:#f4cca1;font-family:system-ui,sans-serif;width:max-content;max-width:900px}
h1{font-size:16px;margin:0 0 10px;font-weight:600}
.grid{display:flex;flex-wrap:wrap;gap:10px}
figure{margin:0;padding:6px;background:#39314b;border-radius:6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
figure.wide{width:372px}figure.scene{width:332px}
img{image-rendering:pixelated;display:block}.bg{display:inline-flex;padding:4px;border-radius:3px}
.frames{gap:2px}.frames span{display:block;image-rendering:pixelated}
.n{font-size:22px;font-weight:700;color:#f4b41b;line-height:1}.id{font-size:10px;color:#a0938e;max-width:150px;word-break:break-all}
.stack{position:relative;display:block;width:320px;height:128px;background:${DARK}}.stack img{position:absolute;left:0;top:0}`;

const sheetHtml = (title: string, body: string): string =>
  `<!doctype html><meta charset="utf-8"><style>${CSS}</style><h1>${title}</h1><div class="grid">${body}</div>`;

const iconPng = (grid: readonly string[]): string => {
  const png = new PNG({ width: 16, height: 16 });
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const hex = (ICON_COLORS[ch] ?? '#302c2e').slice(1);
      const i = (y * 16 + x) * 4;
      png.data[i] = parseInt(hex.slice(0, 2), 16);
      png.data[i + 1] = parseInt(hex.slice(2, 4), 16);
      png.data[i + 2] = parseInt(hex.slice(4, 6), 16);
      png.data[i + 3] = 255;
    }),
  );
  return `data:image/png;base64,${PNG.sync.write(png).toString('base64')}`;
};

const iconSheet = (): string => {
  const cells = iconCandidates
    .map((c, i) => {
      const src = iconPng(c.grid);
      const big = (px: number, extra = ''): string =>
        `<img src="${src}" width="${px}" height="${px}" alt="" style="${extra}">`;
      return `<figure style="gap:8px"><div class="n">${i === 0 ? 'now' : 'ABC'[i - 1]}</div>
<div style="display:flex;gap:10px;align-items:flex-end">${big(180, 'border-radius:40px')}${big(64)}${big(32)}${big(16)}</div>
<div class="id" style="font-size:12px;max-width:none">${c.name} · home-screen tile 180, then 64, 32 and 16 px</div></figure>`;
    })
    .join('');
  return sheetHtml('App-icon candidates (the current icon and three new ones)', cells);
};

const marks = [
  '# Art marks (v1.0 Keep / Redraw)',
  '',
  'Number → id, in id order. The owner marks each row **Keep** or **Redraw**; an empty mark means Keep.',
  'At most about 40 Redraw in total, at most 12 per session (D475). A test checks that every Keep picture is byte-identical to its v0.11 PNG (`art-src/v0.11-hashes.json`).',
  '',
  '**App icon:** *(not chosen yet: current / A / B / C)*',
  '',
  '| n | id | mark |',
  '|---|---|---|',
  ...numberedAssets.map((x) => `| ${x.n} | \`${x.asset.id}\` | |`),
  '',
].join('\n');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const shot = async (name: string, html: string): Promise<void> => {
  await page.setContent(html, { waitUntil: 'load' });
  await page.locator('body').screenshot({ path: new URL(`${name}.png`, OUT).pathname });
};
for (const s of sheetPlan) {
  const kind = s.name.split('-')[0] ?? '';
  const first = s.items[0]?.n;
  const last = s.items[s.items.length - 1]?.n;
  await shot(
    s.name,
    sheetHtml(
      `${s.title}: numbers ${first}–${last}`,
      s.items.map((x) => cellFor(kind, x)).join(''),
    ),
  );
}
await shot('app-icons', iconSheet());
await browser.close();

if (!existsSync(new URL('../docs/flesh-out/v1.0/art-marks.md', import.meta.url))) {
  writeFileSync(new URL('../docs/flesh-out/v1.0/art-marks.md', import.meta.url), marks);
}
writeFileSync(
  new URL('../art-src/v0.11-hashes.json', import.meta.url),
  `${JSON.stringify(currentHashes(), null, 2)}\n`,
);
console.log(`wrote ${sheetPlan.length + 1} sheets, art-marks.md and v0.11-hashes.json`);
