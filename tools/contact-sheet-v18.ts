import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { C } from './pixel';
import { packPng } from './png-pack';
import { writePackedPng } from './grid-v18-kit';
import { BATCH1_SUBJECTS } from './grid-v18-batch1';
import { drawBitmapText, fillPngRect } from './grid-v18-font';

export { BATCH1_SUBJECTS };

const ROOT = resolve(import.meta.dirname, '..');
export const STAGING_DIR = resolve(ROOT, 'art-src', 'v1.8-staging');
export const CONTACT_SHEET_PATHS = {
  dark: resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'contact-sheets', 'contact-sheet-1-dark.png'),
  light: resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'contact-sheets', 'contact-sheet-1-light.png'),
  marks: resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'art-marks.md'),
} as const;

function renderContactSheet(ground: 'dark' | 'light'): Buffer {
  const width = 920;
  const headerH = 60;
  const pad = 20;
  const rowGap = 14;
  const cardHdr = 26;
  const bodyPad = 12;
  const totalH =
    headerH +
    pad +
    BATCH1_SUBJECTS.reduce((sum, s) => sum + cardHdr + s.cardHeight + bodyPad * 2 + rowGap, 0) +
    pad;

  const png = new PNG({ width, height: totalH });
  const bgHex = '#221f24';
  const swatchHex = ground === 'dark' ? '#302c2e' : '#cfc6b8';
  fillPngRect(png, 0, 0, width, totalH, bgHex);
  fillPngRect(png, 0, 0, width, headerH, '#39314b');
  drawBitmapText(
    png,
    pad,
    12,
    `V1.8 CONTACT SHEET 1 - BATCH 1 (#01-#12) [${ground.toUpperCase()} #${swatchHex.slice(1)}]`,
    C.gold,
    2,
  );
  drawBitmapText(
    png,
    pad,
    36,
    'ZUGHY-32 GRID OVERHAUL STAGING (PUBLIC/ASSETS/GRID UNTOUCHED UNTIL APPROVED)',
    C.frost,
    1,
  );

  let cy = headerH + pad;
  for (const subject of BATCH1_SUBJECTS) {
    const cardW = width - pad * 2;
    const cardH = cardHdr + subject.cardHeight + bodyPad * 2;
    fillPngRect(png, pad, cy, cardW, cardHdr, '#39314b');
    fillPngRect(png, pad, cy + cardHdr, cardW, cardH - cardHdr, swatchHex);
    const title = `#${String(subject.num).padStart(2, '0')} ${subject.label}`;
    drawBitmapText(png, pad + 10, cy + 6, title, C.gold, 2);
    subject.drawRow(png, pad + 14, cy + cardHdr + bodyPad, ground);
    cy += cardH + rowGap;
  }

  const raw = PNG.sync.write(png);
  const packed = packPng(raw);
  return packed !== null && packed.length <= raw.length ? packed : raw;
}

function buildArtMarksMarkdown(): string {
  const rows = BATCH1_SUBJECTS.map(
    (s) =>
      `| ${s.num} | \`${s.id}\` | ${s.label} | Pending | ${s.stagedFiles.map((f) => `\`${f.name}\``).join(', ')} |`,
  ).join('\n');

  return [
    '# Art marks (v1.8 Grid Art Overhaul: Keep / Redraw)',
    '',
    'Reviewed across 3 numbered batches (`T18.8`, `T18.9`, `T18.10`, `D623`, `D475`). The owner marks each row **Keep** or **Redraw**; shipped `public/assets/grid/` stays untouched until `T18.11`.',
    '',
    '## Batch 1 - Hearth Hall, Grounds, Borders, Wall Kit & Watchtower (`T18.8`, #01-#12)',
    '',
    '| n | id | name | mark | staged files |',
    '|---|---|---|---|---|',
    rows,
    '',
  ].join('\n');
}

/** Stages packed Batch 1 PNGs, renders Dark/Light Contact Sheet 1, and writes art-marks.md. */
export function writeBatch1Artifacts(): void {
  mkdirSync(STAGING_DIR, { recursive: true });
  mkdirSync(resolve(CONTACT_SHEET_PATHS.dark, '..'), { recursive: true });

  for (const subject of BATCH1_SUBJECTS) {
    for (const file of subject.stagedFiles) {
      writePackedPng(STAGING_DIR, file.name, file.render(), file.h);
    }
  }
  writeFileSync(CONTACT_SHEET_PATHS.dark, renderContactSheet('dark'));
  writeFileSync(CONTACT_SHEET_PATHS.light, renderContactSheet('light'));
  writeFileSync(CONTACT_SHEET_PATHS.marks, buildArtMarksMarkdown());
}

if (
  process.argv.includes('--write') ||
  (process.argv[1] !== undefined && import.meta.filename === resolve(process.argv[1]))
) {
  writeBatch1Artifacts();
  console.log(
    `Staged v1.8 Batch 1 (${BATCH1_SUBJECTS.length} subjects) + Dark/Light Contact Sheet 1.`,
  );
}
