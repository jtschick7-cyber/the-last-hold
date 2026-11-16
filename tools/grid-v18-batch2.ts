import type { PNG } from 'pngjs';
import type { Batch1Subject, StagedFileSpec } from './grid-v18-batch1';
import { drawLevelBuildingV18, type LevelBuildingFamily } from './grid-v18-buildings';
import { blitCanvasScaled, drawBitmapText } from './grid-v18-font';
import { stampCanvas } from './grid-v18-kit';
import { BATCH2_PLOT_FAMILIES, drawPlotV18, type Batch2PlotFamily } from './grid-v18-plots';
import { drawGroundV18 } from './grid-v18-terrain';
import { C, Canvas } from './pixel';

function onGround(sprite: Canvas, groundKind: 'grass' | 'earth' | 'flags'): Canvas {
  const composite = drawGroundV18(groundKind);
  stampCanvas(composite, sprite);
  return composite;
}

function tieredRowDrawer(
  variants: readonly [() => Canvas, () => Canvas, () => Canvas],
  groundKind: 'grass' | 'earth' | 'flags',
  tierPrefix: 'T' | 'D',
) {
  return (png: PNG, x: number, y: number, ground: 'dark' | 'light'): void => {
    const cap = ground === 'dark' ? C.ash : C.wine;
    const c1 = variants[0]();
    const c2 = variants[1]();
    const c3 = variants[2]();

    blitCanvasScaled(png, c1, x, y, 3);
    drawBitmapText(png, x, y + 101, `${tierPrefix}1 (3X)`, cap, 1);

    blitCanvasScaled(png, c2, x + 116, y, 3);
    drawBitmapText(png, x + 116, y + 101, `${tierPrefix}2 (3X)`, cap, 1);

    blitCanvasScaled(png, c3, x + 232, y, 3);
    drawBitmapText(png, x + 232, y + 101, `${tierPrefix}3 (3X)`, cap, 1);

    // Native 1x strip for actual grid-size readability
    blitCanvasScaled(png, c1, x + 362, y + 32, 1);
    blitCanvasScaled(png, c2, x + 404, y + 32, 1);
    blitCanvasScaled(png, c3, x + 446, y + 32, 1);
    drawBitmapText(png, x + 362, y + 101, '1X NATIVE', cap, 1);

    // Grounded over Batch 1 clearing tile at 2x
    blitCanvasScaled(png, onGround(c1, groundKind), x + 522, y + 16, 2);
    blitCanvasScaled(png, onGround(c3, groundKind), x + 598, y + 16, 2);
    drawBitmapText(
      png,
      x + 522,
      y + 101,
      `ON ${groundKind.toUpperCase()} (${tierPrefix}1/${tierPrefix}3)`,
      cap,
      1,
    );
  };
}

function trophyHallRowDrawer(png: PNG, x: number, y: number, ground: 'dark' | 'light'): void {
  const cap = ground === 'dark' ? C.ash : C.wine;
  const sprite = drawLevelBuildingV18('trophy-hall', 1);
  blitCanvasScaled(png, sprite, x, y, 3);
  drawBitmapText(png, x, y + 101, '3X PREVIEW', cap, 1);

  blitCanvasScaled(png, sprite, x + 132, y + 32, 1);
  drawBitmapText(png, x + 132, y + 101, '1X NATIVE', cap, 1);

  blitCanvasScaled(png, onGround(sprite, 'flags'), x + 224, y + 16, 2);
  drawBitmapText(png, x + 224, y + 101, 'ON FLAGS (2X)', cap, 1);
}

interface TieredSubjectMeta {
  readonly num: number;
  readonly id: string;
  readonly label: string;
  readonly ground: 'grass' | 'earth' | 'flags';
}

const LEVEL_BUILDING_META: Readonly<
  Record<Exclude<LevelBuildingFamily, 'trophy-hall'>, TieredSubjectMeta>
> = {
  mill: { num: 13, id: 'grid.mill', label: 'MILL (TIERS 1-3)', ground: 'flags' },
  sawpit: { num: 14, id: 'grid.sawpit', label: 'SAWPIT (TIERS 1-3)', ground: 'earth' },
  smithy: { num: 15, id: 'grid.smithy', label: 'SMITHY (TIERS 1-3)', ground: 'flags' },
  'bell-tower': {
    num: 16,
    id: 'grid.bell-tower',
    label: 'BELL TOWER (TIERS 1-3)',
    ground: 'flags',
  },
  barracks: { num: 17, id: 'grid.barracks', label: 'BARRACKS (TIERS 1-3)', ground: 'flags' },
  lodge: { num: 19, id: 'grid.lodge', label: 'SCOUT LODGE (TIERS 1-3)', ground: 'grass' },
  alchemist: { num: 20, id: 'grid.alchemist', label: 'ALCHEMIST (TIERS 1-3)', ground: 'flags' },
};

const PLOT_META: Readonly<Record<Batch2PlotFamily, TieredSubjectMeta>> = {
  cottage: { num: 21, id: 'grid.cottage', label: 'COTTAGE PLOTS (1-3)', ground: 'grass' },
  farm: { num: 22, id: 'grid.farm', label: 'FARM PLOTS (1-3)', ground: 'grass' },
  woodcutter: {
    num: 23,
    id: 'grid.woodcutter',
    label: 'WOODCUTTER PLOTS (1-3)',
    ground: 'grass',
  },
  mine: { num: 24, id: 'grid.mine', label: 'MINE PLOTS (1-3)', ground: 'earth' },
};

function makeTieredBuildingSubject(
  family: Exclude<LevelBuildingFamily, 'trophy-hall'>,
): Batch1Subject {
  const meta = LEVEL_BUILDING_META[family];
  const stagedFiles: StagedFileSpec[] = ([1, 2, 3] as const).map((t) => ({
    name: `${family}-${t}.png`,
    w: 32,
    h: 32,
    render: () => drawLevelBuildingV18(family, t),
  }));
  return {
    num: meta.num,
    id: meta.id,
    label: meta.label,
    cardHeight: 110,
    stagedFiles,
    drawRow: tieredRowDrawer(
      [
        () => drawLevelBuildingV18(family, 1),
        () => drawLevelBuildingV18(family, 2),
        () => drawLevelBuildingV18(family, 3),
      ],
      meta.ground,
      'T',
    ),
  };
}

function makePlotSubject(family: Batch2PlotFamily): Batch1Subject {
  const meta = PLOT_META[family];
  const stagedFiles: StagedFileSpec[] = ([1, 2, 3] as const).map((d) => ({
    name: `${family}-${d}.png`,
    w: 32,
    h: 32,
    render: () => drawPlotV18(family, d),
  }));
  return {
    num: meta.num,
    id: meta.id,
    label: meta.label,
    cardHeight: 110,
    stagedFiles,
    drawRow: tieredRowDrawer(
      [() => drawPlotV18(family, 1), () => drawPlotV18(family, 2), () => drawPlotV18(family, 3)],
      meta.ground,
      'D',
    ),
  };
}

export const BATCH2_SUBJECTS: readonly Batch1Subject[] = [
  makeTieredBuildingSubject('mill'),
  makeTieredBuildingSubject('sawpit'),
  makeTieredBuildingSubject('smithy'),
  makeTieredBuildingSubject('bell-tower'),
  makeTieredBuildingSubject('barracks'),
  {
    num: 18,
    id: 'grid.trophy-hall',
    label: 'TROPHY HALL',
    cardHeight: 110,
    stagedFiles: [
      {
        name: 'trophy-hall.png',
        w: 32,
        h: 32,
        render: () => drawLevelBuildingV18('trophy-hall', 1),
      },
    ],
    drawRow: trophyHallRowDrawer,
  },
  makeTieredBuildingSubject('lodge'),
  makeTieredBuildingSubject('alchemist'),
  ...BATCH2_PLOT_FAMILIES.map(makePlotSubject),
];
