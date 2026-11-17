// v1.9 (plan T19.6, D475, D635): stages the 6 packed v1.9 PNGs in art-src/v1.9-staging/,
// renders dark (#302c2e) and light (#cfc6b8) Contact Sheets under docs/flesh-out/v1.9/contact-sheets/,
// and writes the Keep/Redraw marks ledger at docs/flesh-out/v1.9/art-marks.md.
// Run: npx vite-node tools/contact-sheet-v19.ts -- --write
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import {
  assetById,
  courtyardMarkAssetId,
  eventCreaturePortraitId,
  eventCreatureSpriteId,
  SPRITE_FRAME_NAMES,
  SPRITE_PX,
} from '../src/content/assets';
import { courtyardMarkDef, type CourtyardMarkId } from '../src/content/courtyard-marks';
import { bosses } from '../src/content/great-beasts';
import { drawBitmapText, fillPngRect } from './grid-v18-font';
import { stampCanvas } from './grid-v18-kit';
import { drawGroundV18 } from './grid-v18-terrain';
import { drawCourtyardMarkV19, V19_MARK_IDS, type V19MarkId } from './marks-v19';
import { C, Canvas } from './pixel';
import { packPng } from './png-pack';
import { drawPortraitV19, V19_PORTRAIT_IDS, type V19PortraitId } from './portraits-v19';
import { renderSpriteStripV19, V19_SPRITE_IDS, type V19SpriteId } from './sprites-v19';

const ROOT = resolve(import.meta.dirname, '..');
export const V19_STAGING_DIR = resolve(ROOT, 'art-src', 'v1.9-staging');
export const V19_CONTACT_PATHS = {
  dark: resolve(ROOT, 'docs', 'flesh-out', 'v1.9', 'contact-sheets', 'contact-sheet-dark.png'),
  light: resolve(ROOT, 'docs', 'flesh-out', 'v1.9', 'contact-sheets', 'contact-sheet-light.png'),
  marks: resolve(ROOT, 'docs', 'flesh-out', 'v1.9', 'art-marks.md'),
} as const;

export interface V19Subject {
  readonly num: number;
  readonly id: string;
  readonly kind: 'portrait' | 'sprite' | 'mark';
  readonly subjectKey: V19PortraitId | V19SpriteId | V19MarkId;
  readonly title: string;
  readonly stagingRelPath: string;
  readonly deployedRelPath: string;
  readonly w: number;
  readonly h: number;
  readonly render: () => Buffer;
}

const packBuffer = (raw: Buffer): Buffer => {
  const packed = packPng(raw);
  return packed !== null && packed.length <= raw.length ? packed : raw;
};

export const V19_SUBJECTS: readonly V19Subject[] = [
  ...V19_PORTRAIT_IDS.map((id, idx): V19Subject => ({
    num: idx + 1,
    id: eventCreaturePortraitId(id),
    kind: 'portrait',
    subjectKey: id,
    title: `${bosses[id].name.toUpperCase()} (PORTRAIT 64X64)`,
    stagingRelPath: `portraits/creature-${id}.png`,
    deployedRelPath: `portraits/creature-${id}.png`,
    w: 64,
    h: 64,
    render: () => packBuffer(drawPortraitV19(id).toPng(64)),
  })),
  ...V19_SPRITE_IDS.map((id, idx): V19Subject => ({
    num: 3 + idx,
    id: eventCreatureSpriteId(id),
    kind: 'sprite',
    subjectKey: id,
    title: `${bosses[id].name.toUpperCase()} (BATTLE SPRITE 160X32)`,
    stagingRelPath: `sprites/creature-${id}.png`,
    deployedRelPath: `sprites/creature-${id}.png`,
    w: 160,
    h: 32,
    render: () => packBuffer(renderSpriteStripV19(id)),
  })),
  ...V19_MARK_IDS.map((id, idx): V19Subject => ({
    num: 5 + idx,
    id: courtyardMarkAssetId(id),
    kind: 'mark',
    subjectKey: id,
    title: `COURTYARD MARK: ${courtyardMarkDef(id).name.toUpperCase()} (16X16)`,
    stagingRelPath: `grid/courtyard-mark-${id}.png`,
    deployedRelPath: `grid/courtyard-mark-${id}.png`,
    w: 16,
    h: 16,
    render: () => packBuffer(drawCourtyardMarkV19(id).toPng(16)),
  })),
];

export const V19_MARKS: Readonly<Record<number, 'Keep' | 'Redraw' | 'Pending'>> = {
  1: 'Keep',
  2: 'Keep',
  3: 'Keep',
  4: 'Keep',
  5: 'Keep',
  6: 'Keep',
};

const SCENE_ANCHORS_V19: Readonly<Record<V19MarkId, readonly [number, number]>> = {
  'thorn-antler-rack': [140, 46],
  'beacon-iron-urn': [4, 46],
};

function toHexRgb(r: number, g: number, b: number): string {
  return [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function blitPngScaled(
  dst: PNG,
  src: PNG,
  sx0: number,
  sy0: number,
  sw: number,
  sh: number,
  dx0: number,
  dy0: number,
  scale: number,
): void {
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = ((sy0 + y) * src.width + (sx0 + x)) * 4;
      if ((src.data[idx + 3] ?? 0) === 0) continue;
      fillPngRect(
        dst,
        dx0 + x * scale,
        dy0 + y * scale,
        scale,
        scale,
        toHexRgb(src.data[idx] ?? 0, src.data[idx + 1] ?? 0, src.data[idx + 2] ?? 0),
      );
    }
  }
}

function buildGridContext(mark: Canvas): PNG {
  const bg = drawGroundV18('flags');
  bg.rect(0, 0, 32, 6, C.slate);
  bg.rect(0, 5, 32, 1, C.plum);
  stampCanvas(bg, mark, 8, 9);
  return PNG.sync.read(bg.toPng(32));
}

function buildSceneContext(id: V19MarkId, mark: Canvas): PNG {
  const scene = PNG.sync.read(
    readFileSync(resolve(ROOT, 'public', 'assets', 'scenes', 'hold-keep.png')),
  );
  const [ax, ay] = SCENE_ANCHORS_V19[id];
  const ox = Math.max(0, Math.min(scene.width - 32, ax - 8));
  const oy = Math.max(0, Math.min(scene.height - 32, ay - 8));
  const c = new Canvas(32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = ((oy + y) * scene.width + (ox + x)) * 4;
      if ((scene.data[idx + 3] ?? 0) > 0) {
        c.set(
          x,
          y,
          toHexRgb(scene.data[idx] ?? 0, scene.data[idx + 1] ?? 0, scene.data[idx + 2] ?? 0),
        );
      }
    }
  }
  stampCanvas(c, mark, ax - ox, ay - oy);
  return PNG.sync.read(c.toPng(32));
}

function drawSubjectCard(
  png: PNG,
  s: V19Subject,
  x: number,
  y: number,
  ground: 'dark' | 'light',
): void {
  const cap = ground === 'dark' ? C.ash : C.wine;
  const staged = PNG.sync.read(readFileSync(resolve(V19_STAGING_DIR, s.stagingRelPath)));

  if (s.kind === 'portrait') {
    blitPngScaled(png, staged, 0, 0, 64, 64, x + 8, y + 4, 2);
    drawBitmapText(png, x + 8, y + 138, '2X (128PX)', cap, 1);

    blitPngScaled(png, staged, 0, 0, 64, 64, x + 176, y + 36, 1);
    drawBitmapText(png, x + 176, y + 138, '1X (64PX)', cap, 1);

    // Show family/role notes for quick review context
    const b = bosses[s.subjectKey as V19PortraitId];
    drawBitmapText(png, x + 280, y + 18, `FAMILY: ${b.family.toUpperCase()}`, cap, 1);
    drawBitmapText(
      png,
      x + 280,
      y + 34,
      `ATTACK: ${(b.damage ?? 'steel').toUpperCase()}  ATK:${b.attacks}`,
      cap,
      1,
    );
    drawBitmapText(png, x + 280, y + 50, `REAGENT: ${b.reagent.toUpperCase()}`, cap, 1);
    return;
  }

  if (s.kind === 'sprite') {
    const portraitFile = resolve(V19_STAGING_DIR, `portraits/creature-${s.subjectKey}.png`);
    const portrait = PNG.sync.read(readFileSync(portraitFile));
    blitPngScaled(png, portrait, 0, 0, 64, 64, x + 8, y + 10, 1);
    drawBitmapText(png, x + 8, y + 82, 'PORTRAIT', cap, 1);
    fillPngRect(png, x + 84, y + 10, 1, 68, cap);

    SPRITE_FRAME_NAMES.forEach((fname, fi) => {
      const fx = x + 98 + fi * 82;
      blitPngScaled(png, staged, fi * SPRITE_PX, 0, SPRITE_PX, SPRITE_PX, fx, y + 10, 2);
      drawBitmapText(png, fx + 8, y + 82, fname.toUpperCase(), cap, 1);
    });

    // Native 1x strip preview on the right
    fillPngRect(png, x + 516, y + 10, 1, 68, cap);
    blitPngScaled(png, staged, 0, 0, 160, 32, x + 530, y + 26, 1);
    drawBitmapText(png, x + 530, y + 82, '1X NATIVE STRIP (160X32)', cap, 1);
    return;
  }

  const markId = s.subjectKey as V19MarkId;
  const markCanvas = drawCourtyardMarkV19(markId);
  blitPngScaled(png, staged, 0, 0, 16, 16, x + 12, y + 20, 3);
  drawBitmapText(png, x + 8, y + 90, '3X (48PX)', cap, 1);

  blitPngScaled(png, staged, 0, 0, 16, 16, x + 116, y + 36, 1);
  drawBitmapText(png, x + 100, y + 90, '1X NATIVE', cap, 1);

  blitPngScaled(png, buildGridContext(markCanvas), 0, 0, 32, 32, x + 198, y + 14, 2);
  drawBitmapText(png, x + 190, y + 90, 'ON HOLDGRID (2X)', cap, 1);

  blitPngScaled(png, buildSceneContext(markId, markCanvas), 0, 0, 32, 32, x + 338, y + 14, 2);
  drawBitmapText(png, x + 330, y + 90, 'ON HOLDSCENE (2X)', cap, 1);

  const def = courtyardMarkDef(markId as CourtyardMarkId);
  const srcLabel = def.source.kind === 'boss' ? bosses[def.source.bossId].name : def.source.huntId;
  drawBitmapText(png, x + 478, y + 32, `SOURCE: ${srcLabel.toUpperCase()}`, cap, 1);
}

function cardHeightFor(s: V19Subject): number {
  return s.kind === 'portrait' ? 156 : s.kind === 'sprite' ? 104 : 112;
}

export function renderV19ContactSheet(ground: 'dark' | 'light'): Buffer {
  const width = 900;
  const headerH = 56;
  const pad = 18;
  const rowGap = 14;
  const cardHdr = 26;
  const bodyPad = 10;
  const totalH =
    headerH +
    pad +
    V19_SUBJECTS.reduce((sum, s) => sum + cardHdr + cardHeightFor(s) + bodyPad * 2 + rowGap, 0) +
    pad;

  const png = new PNG({ width, height: totalH });
  const swatchHex = ground === 'dark' ? '#302c2e' : '#cfc6b8';
  fillPngRect(png, 0, 0, width, totalH, '#221f24');
  fillPngRect(png, 0, 0, width, headerH, '#39314b');
  drawBitmapText(
    png,
    pad,
    10,
    `V1.9 KETTLE & FANG CONTACT SHEET (#01-#06) (${ground.toUpperCase()} #${swatchHex.slice(1)})`,
    C.gold,
    2,
  );
  drawBitmapText(
    png,
    pad,
    34,
    'ZUGHY-32 STAGING: 2 OPTION B PORTRAITS, 2 SPRITE STRIPS, 2 COURTYARD MARKS (PUBLIC/ASSETS UNTOUCHED)',
    C.frost,
    1,
  );

  let cy = headerH + pad;
  for (const s of V19_SUBJECTS) {
    const cardW = width - pad * 2;
    const cardH = cardHdr + cardHeightFor(s) + bodyPad * 2;
    fillPngRect(png, pad, cy, cardW, cardHdr, '#39314b');
    fillPngRect(png, pad, cy + cardHdr, cardW, cardH - cardHdr, swatchHex);
    drawBitmapText(png, pad + 10, cy + 6, `#0${s.num} ${s.title}`, C.gold, 2);
    drawSubjectCard(png, s, pad + 14, cy + cardHdr + bodyPad, ground);
    cy += cardH + rowGap;
  }

  return packBuffer(PNG.sync.write(png));
}

export function buildV19MarksMarkdown(): string {
  const rows = V19_SUBJECTS.map((s) => {
    const bytes = readFileSync(resolve(V19_STAGING_DIR, s.stagingRelPath)).length;
    const label = assetById.get(s.id)?.label ?? s.title;
    return `| ${s.num} | \`${s.id}\` | ${label} | ${s.w}x${s.h} | ${V19_MARKS[s.num] ?? 'Pending'} | \`${s.stagingRelPath}\` (${bytes} B) |`;
  });
  return [
    '# Art marks (v1.9 Kettle & Fang: Keep / Redraw)',
    '',
    'Single 6-subject Zughy-32 review batch (`T19.6`, `D475`, `D635`). Owner marked all 6 rows **Keep**; deployed to `public/assets/` with SHA-256 hashes frozen in `art-src/v1.9-hashes.json`.',
    '',
    '| n | id | name | size | mark | staged file |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

export function writeV19StagingArtifacts(): Readonly<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const s of V19_SUBJECTS) {
    const full = resolve(V19_STAGING_DIR, s.stagingRelPath);
    mkdirSync(resolve(full, '..'), { recursive: true });
    const buf = s.render();
    writeFileSync(full, buf);
    hashes[s.id] = createHash('sha256').update(buf).digest('hex');
  }
  mkdirSync(resolve(V19_CONTACT_PATHS.dark, '..'), { recursive: true });
  writeFileSync(V19_CONTACT_PATHS.dark, renderV19ContactSheet('dark'));
  writeFileSync(V19_CONTACT_PATHS.light, renderV19ContactSheet('light'));
  writeFileSync(V19_CONTACT_PATHS.marks, buildV19MarksMarkdown());
  return hashes;
}

if (process.argv.some((a) => a.endsWith('contact-sheet-v19.ts'))) {
  const hashes = writeV19StagingArtifacts();
  console.log(
    `Staged ${Object.keys(hashes).length} v1.9 assets + Dark/Light Contact Sheets + art-marks.md`,
  );
}
