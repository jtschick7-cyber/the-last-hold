import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { courtyardMarkDef } from '../src/content/courtyard-marks';
import type { Batch1Subject } from './grid-v18-batch1';
import { blitCanvasScaled, drawBitmapText } from './grid-v18-font';
import { stampCanvas } from './grid-v18-kit';
import {
  drawCourtyardMarkV18,
  V18_COURTYARD_MARK_IDS,
  type V18CourtyardMarkId,
} from './grid-v18-marks';
import { drawHerbGardenV18, drawSilverSeamV18 } from './grid-v18-plots-extra';
import { drawGroundV18 } from './grid-v18-terrain';
import { C, Canvas } from './pixel';

const ROOT = resolve(import.meta.dirname, '..');

const SCENE_ANCHORS: Readonly<Record<V18CourtyardMarkId, readonly [number, number]>> = {
  'fjord-bone-standard': [12, 34],
  'barrow-brazier': [34, 42],
  'stoneback-cairn': [56, 44],
  'kettle-barrow-wreath': [96, 42],
  'river-reed-basin': [116, 44],
  'watch-fire-sconce': [136, 36],
};

function toHexRgb(r: number, g: number, b: number): string {
  return [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

let cachedHoldKeepScene: PNG | null = null;
function loadHoldKeepScene(): PNG {
  if (cachedHoldKeepScene === null) {
    cachedHoldKeepScene = PNG.sync.read(
      readFileSync(resolve(ROOT, 'public', 'assets', 'scenes', 'hold-keep.png')),
    );
  }
  return cachedHoldKeepScene;
}

function onGround(sprite: Canvas, groundKind: 'grass' | 'earth' | 'flags'): Canvas {
  const composite = drawGroundV18(groundKind);
  stampCanvas(composite, sprite);
  return composite;
}

function cropSceneContext(id: V18CourtyardMarkId, mark: Canvas): Canvas {
  const scene = loadHoldKeepScene();
  const [ax, ay] = SCENE_ANCHORS[id];
  const ox = Math.max(0, Math.min(scene.width - 32, ax - 8));
  const oy = Math.max(0, Math.min(scene.height - 32, ay - 8));
  const c = new Canvas(32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = ((oy + y) * scene.width + (ox + x)) * 4;
      const a = scene.data[idx + 3] ?? 0;
      if (a > 0) {
        c.set(
          x,
          y,
          toHexRgb(scene.data[idx] ?? 0, scene.data[idx + 1] ?? 0, scene.data[idx + 2] ?? 0),
        );
      }
    }
  }
  stampCanvas(c, mark, ax - ox, ay - oy);
  return c;
}

function buildGridContext(mark: Canvas): Canvas {
  const bg = drawGroundV18('flags');
  // Subtle north-wall trim framing the upper courtyard edge where corner marks sit
  bg.rect(0, 0, 32, 6, C.slate);
  bg.rect(0, 5, 32, 1, C.plum);
  stampCanvas(bg, mark, 8, 9);
  return bg;
}

function drawPlotVariantsRow(
  variants: readonly Canvas[],
  labels: readonly string[],
  groundKind: 'grass' | 'earth',
) {
  return (png: PNG, x: number, y: number, ground: 'dark' | 'light'): void => {
    const cap = ground === 'dark' ? C.ash : C.wine;
    variants.forEach((sprite, idx) => {
      const vx = x + idx * 116;
      blitCanvasScaled(png, sprite, vx, y, 3);
      drawBitmapText(png, vx, y + 101, `${labels[idx] ?? `V${idx + 1}`} (3X)`, cap, 1);
    });

    const nativeX = x + 362;
    variants.forEach((sprite, idx) => {
      blitCanvasScaled(png, sprite, nativeX + idx * 42, y + 32, 1);
    });
    drawBitmapText(png, nativeX, y + 101, '1X NATIVE', cap, 1);

    const first = variants[0];
    const last = variants[variants.length - 1];
    if (first && last) {
      blitCanvasScaled(png, onGround(first, groundKind), x + 522, y + 16, 2);
      blitCanvasScaled(png, onGround(last, groundKind), x + 598, y + 16, 2);
      drawBitmapText(
        png,
        x + 522,
        y + 101,
        `ON ${groundKind.toUpperCase()} (${labels[0]}/${labels[labels.length - 1]})`,
        cap,
        1,
      );
    }
  };
}

function makeCourtyardMarkSubject(id: V18CourtyardMarkId, num: number): Batch1Subject {
  const def = courtyardMarkDef(id);
  return {
    num,
    id: `courtyard-mark.${id}`,
    label: `COURTYARD MARK: ${def.name.toUpperCase()}`,
    cardHeight: 110,
    stagedFiles: [
      {
        name: `courtyard-mark-${id}.png`,
        w: 16,
        h: 16,
        render: () => drawCourtyardMarkV18(id),
      },
    ],
    drawRow: (png, x, y, ground) => {
      const cap = ground === 'dark' ? C.ash : C.wine;
      const mark = drawCourtyardMarkV18(id);
      blitCanvasScaled(png, mark, x + 8, y + 24, 3);
      drawBitmapText(png, x, y + 96, '3X (48PX)', cap, 1);

      blitCanvasScaled(png, mark, x + 112, y + 40, 1);
      drawBitmapText(png, x + 98, y + 96, '1X NATIVE', cap, 1);

      blitCanvasScaled(png, buildGridContext(mark), x + 196, y + 16, 2);
      drawBitmapText(png, x + 188, y + 96, 'ON HOLDGRID (2X)', cap, 1);

      blitCanvasScaled(png, cropSceneContext(id, mark), x + 332, y + 16, 2);
      drawBitmapText(png, x + 324, y + 96, 'ON HOLDSCENE (2X)', cap, 1);
    },
  };
}

export const BATCH3_SUBJECTS: readonly Batch1Subject[] = [
  {
    num: 25,
    id: 'grid.herb-garden',
    label: 'HERB GARDEN PLOTS (1-3)',
    cardHeight: 110,
    stagedFiles: ([1, 2, 3] as const).map((d) => ({
      name: `herb-garden-${d}.png`,
      w: 32,
      h: 32,
      render: () => drawHerbGardenV18(d),
    })),
    drawRow: drawPlotVariantsRow(
      [drawHerbGardenV18(1), drawHerbGardenV18(2), drawHerbGardenV18(3)],
      ['D1', 'D2', 'D3'],
      'grass',
    ),
  },
  {
    num: 26,
    id: 'grid.silver-seam',
    label: 'SILVER SEAM OUTCROPS (1-2)',
    cardHeight: 110,
    stagedFiles: ([1, 2] as const).map((look) => ({
      name: `silver-seam-${look}.png`,
      w: 32,
      h: 32,
      render: () => drawSilverSeamV18(look),
    })),
    drawRow: drawPlotVariantsRow(
      [drawSilverSeamV18(1), drawSilverSeamV18(2)],
      ['V1', 'V2'],
      'earth',
    ),
  },
  ...V18_COURTYARD_MARK_IDS.map((id, idx) => makeCourtyardMarkSubject(id, 27 + idx)),
];
