// v1.1 (plan TL.5c): the numbered Keep/Redraw sheets for the Hold grid's pictures. Run by hand:
//   npx vite-node tools/contact-sheet.ts -- --layout-sheets
// Writes PNG sheets to docs/flesh-out/v1.1/contact-sheets/ (every picture on both theme backgrounds,
// overlays shown over what they sit on, then two mock-ups of the whole grid) and the empty marks table
// to docs/flesh-out/v1.1/art-marks.md. The v1.0 numbers are untouched: these are numbered on their own.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { cell, GROUPS, mock, numbered, sheetHtml } from './layout-sheet-parts';

const OUT = new URL('../docs/flesh-out/v1.1/contact-sheets/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const shot = async (name: string, html: string): Promise<void> => {
  await page.setContent(html, { waitUntil: 'load' });
  await page.locator('body').screenshot({ path: new URL(`${name}.png`, OUT).pathname });
};
for (const g of GROUPS) {
  const items = numbered.filter((x) => g.has(x.asset.id));
  await shot(g.key, sheetHtml(`${g.title} (${items.length} pictures)`, items.map(cell).join('')));
}
await shot(
  'mock-bastion',
  sheetHtml(
    'The canonical layout at Bastion (all pieces at their top look)',
    mock('bastion', 'Bastion, Tier III and clusters', true),
  ),
);
await shot(
  'mock-hamlet',
  sheetHtml(
    'The canonical layout at Hamlet (what a new hold shows)',
    mock('hamlet', 'Hamlet, Tier I and single structures', false),
  ),
);
await browser.close();

const marksUrl = new URL('../docs/flesh-out/v1.1/art-marks.md', import.meta.url);
if (!existsSync(marksUrl)) {
  writeFileSync(
    marksUrl,
    [
      '# Art marks (v1.1 grid art: Keep / Redraw)',
      '',
      'Number → id, in id order, on their own numbers (the v1.0 sheet numbers 1–156 are unchanged). The owner marks each row **Keep** or **Redraw**; an empty mark means Keep.',
      'Redraws ship in batches of at most 12 per session after before/after sheets are approved (D475, D504). A test checks that every v1.1 picture not marked Redraw is byte-identical to the recorded hash.',
      '',
      '| n | id | mark | what to change |',
      '|---|---|---|---|',
      ...numbered.map((x) => `| ${x.n} | \`${x.asset.id}\` | | |`),
      '',
    ].join('\n'),
  );
}
console.log(`wrote ${GROUPS.length + 2} sheets and art-marks.md for ${numbered.length} pictures; `);
