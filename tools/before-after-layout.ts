// v1.1 (plan TL.6): the before/after sheet for one batch of grid redraws. Before = the copy kept in
// art-src/previous-v1.1/, after = public/assets/. Also writes a Hamlet and a Bastion mock-up of the
// whole grid, before and after. Run by hand, not part of the build:
//   npx vite-node tools/before-after-layout.ts <sheet-name> <n,n,...>   (numbers from art-marks.md)
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { cell, mock, numbered, sheetHtml, source } from './layout-sheet-parts';

const [name, list] = process.argv.slice(2);
if (!name || !list) throw new Error('Usage: before-after-layout.ts <sheet-name> <n,n,...>');
const wanted = list.split(',').map(Number);
const OUT = new URL('../docs/flesh-out/v1.1/before-after/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const items = numbered.filter((x) => wanted.includes(x.n));
if (items.length !== wanted.length) throw new Error('A number is not a v1.1 picture');
const pair = (x: (typeof items)[number]): string => {
  source.before = true;
  const before = cell(x);
  source.before = false;
  return `<div style="display:flex;gap:6px;align-items:center">${before}<span style="font-size:28px;color:#f4b41b">→</span>${cell(x)}</div>`;
};

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const shot = async (file: string, html: string): Promise<void> => {
  await page.setContent(html, { waitUntil: 'load' });
  await page.locator('body').screenshot({ path: new URL(`${file}.png`, OUT).pathname });
};
await shot(name, sheetHtml(`Before → after (${items.length} pictures)`, items.map(pair).join('')));
for (const [age, top] of [
  ['hamlet', false],
  ['bastion', true],
] as const) {
  source.before = true;
  const before = mock(age, `${age}: before`, top);
  source.before = false;
  const after = mock(age, `${age}: after`, top);
  await shot(`${name}-mock-${age}`, sheetHtml(`The ${age} grid, before and after`, before + after));
}
await browser.close();
console.log(`wrote ${name}.png and two mock-ups`);
