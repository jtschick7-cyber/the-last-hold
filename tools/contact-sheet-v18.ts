import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { C } from './pixel';
import { packPng } from './png-pack';
import { writePackedPng } from './grid-v18-kit';
import { BATCH1_SUBJECTS, type Batch1Subject } from './grid-v18-batch1';
import { BATCH2_SUBJECTS } from './grid-v18-batch2';
import { drawBitmapText, fillPngRect } from './grid-v18-font';

export { BATCH1_SUBJECTS, BATCH2_SUBJECTS };

const ROOT = resolve(import.meta.dirname, '..');
export const STAGING_DIR = resolve(ROOT, 'art-src', 'v1.8-staging');
const MARKS_PATH = resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'art-marks.md');

export const CONTACT_SHEET_PATHS = {
  dark: resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'contact-sheets', 'contact-sheet-1-dark.png'),
  light: resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'contact-sheets', 'contact-sheet-1-light.png'),
  marks: MARKS_PATH,
} as const;

export const BATCH2_CONTACT_PATHS = {
  dark: resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'contact-sheets', 'contact-sheet-2-dark.png'),
  light: resolve(ROOT, 'docs', 'flesh-out', 'v1.8', 'contact-sheets', 'contact-sheet-2-light.png'),
  marks: MARKS_PATH,
} as const;

function renderContactSheet(
  subjects: readonly Batch1Subject[],
  sheetNumber: 1 | 2,
  rangeLabel: string,
  ground: 'dark' | 'light',
): Buffer {
  const width = 920;
  const headerH = 60;
  const pad = 20;
  const rowGap = 14;
  const cardHdr = 26;
  const bodyPad = 12;
  const totalH =
    headerH +
    pad +
    subjects.reduce((sum, s) => sum + cardHdr + s.cardHeight + bodyPad * 2 + rowGap, 0) +
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
    `V1.8 CONTACT SHEET ${sheetNumber} - BATCH ${sheetNumber} (${rangeLabel}) [${ground.toUpperCase()} #${swatchHex.slice(1)}]`,
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
  for (const subject of subjects) {
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

const APPROVED_BATCH1_MARKS: Readonly<Record<number, 'Keep' | 'Redraw' | 'Pending'>> = {
  1: 'Keep',
  2: 'Keep',
  3: 'Keep',
  4: 'Keep',
  5: 'Keep',
  6: 'Keep',
  7: 'Keep',
  8: 'Keep',
  9: 'Keep',
  10: 'Keep',
  11: 'Keep',
  12: 'Keep',
};

const BATCH2_MARKS: Readonly<Record<number, 'Keep' | 'Redraw' | 'Pending'>> = {};

function formatMarkRows(
  subjects: readonly Batch1Subject[],
  marksMap: Readonly<Record<number, 'Keep' | 'Redraw' | 'Pending'>>,
): string {
  return subjects
    .map(
      (s) =>
        `| ${s.num} | \`${s.id}\` | ${s.label} | ${marksMap[s.num] ?? 'Pending'} | ${s.stagedFiles.map((f) => `\`${f.name}\``).join(', ')} |`,
    )
    .join('\n');
}

function buildArtMarksMarkdown(): string {
  return [
    '# Art marks (v1.8 Grid Art Overhaul: Keep / Redraw)',
    '',
    'Reviewed across 3 numbered batches (`T18.8`, `T18.9`, `T18.10`, `D623`, `D475`). The owner marks each row **Keep** or **Redraw**; shipped `public/assets/grid/` stays untouched until `T18.11`.',
    '',
    '## Batch 1 - Hearth Hall, Grounds, Borders, Wall Kit & Watchtower (`T18.8`, #01-#12)',
    '',
    '| n | id | name | mark | staged files |',
    '|---|---|---|---|---|',
    formatMarkRows(BATCH1_SUBJECTS, APPROVED_BATCH1_MARKS),
    '',
    '## Batch 2 - Level Buildings & Primary Plot Archetypes (`T18.9`, #13-#24)',
    '',
    '| n | id | name | mark | staged files |',
    '|---|---|---|---|---|',
    formatMarkRows(BATCH2_SUBJECTS, BATCH2_MARKS),
    '',
  ].join('\n');
}

function stageSubjects(subjects: readonly Batch1Subject[]): void {
  mkdirSync(STAGING_DIR, { recursive: true });
  for (const subject of subjects) {
    for (const file of subject.stagedFiles) {
      writePackedPng(STAGING_DIR, file.name, file.render(), file.h);
    }
  }
}

/** Stages packed Batch 1 PNGs, renders Dark/Light Contact Sheet 1, and writes art-marks.md. */
export function writeBatch1Artifacts(): void {
  mkdirSync(resolve(CONTACT_SHEET_PATHS.dark, '..'), { recursive: true });
  stageSubjects(BATCH1_SUBJECTS);
  writeFileSync(
    CONTACT_SHEET_PATHS.dark,
    renderContactSheet(BATCH1_SUBJECTS, 1, '#01-#12', 'dark'),
  );
  writeFileSync(
    CONTACT_SHEET_PATHS.light,
    renderContactSheet(BATCH1_SUBJECTS, 1, '#01-#12', 'light'),
  );
  writeFileSync(MARKS_PATH, buildArtMarksMarkdown());
}

/** Stages packed Batch 2 PNGs, renders Dark/Light Contact Sheet 2, and updates art-marks.md. */
export function writeBatch2Artifacts(): void {
  mkdirSync(resolve(BATCH2_CONTACT_PATHS.dark, '..'), { recursive: true });
  stageSubjects(BATCH2_SUBJECTS);
  writeFileSync(
    BATCH2_CONTACT_PATHS.dark,
    renderContactSheet(BATCH2_SUBJECTS, 2, '#13-#24', 'dark'),
  );
  writeFileSync(
    BATCH2_CONTACT_PATHS.light,
    renderContactSheet(BATCH2_SUBJECTS, 2, '#13-#24', 'light'),
  );
  writeFileSync(MARKS_PATH, buildArtMarksMarkdown());
}

if (
  process.argv.includes('--write') ||
  (process.argv[1] !== undefined && import.meta.filename === resolve(process.argv[1]))
) {
  const batchIdx = process.argv.indexOf('--batch');
  const mode = batchIdx >= 0 ? process.argv[batchIdx + 1] : 'all';
  if (mode === '1') {
    writeBatch1Artifacts();
    console.log(
      `Staged v1.8 Batch 1 (${BATCH1_SUBJECTS.length} subjects) + Dark/Light Contact Sheet 1.`,
    );
  } else if (mode === '2') {
    writeBatch2Artifacts();
    console.log(
      `Staged v1.8 Batch 2 (${BATCH2_SUBJECTS.length} subjects) + Dark/Light Contact Sheet 2.`,
    );
  } else {
    writeBatch1Artifacts();
    writeBatch2Artifacts();
    console.log(
      `Staged v1.8 Batches 1+2 (${BATCH1_SUBJECTS.length + BATCH2_SUBJECTS.length} subjects) + Dark/Light Contact Sheets.`,
    );
  }
}
