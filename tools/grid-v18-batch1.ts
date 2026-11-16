import type { PNG } from 'pngjs';
import { CONNECTION_BITS } from '../src/content/hold-layout';
import { C, Canvas } from './pixel';
import { stampCanvas } from './grid-v18-kit';
import {
  WALL_MASKS,
  buildWallTile,
  drawCosmeticBellBorderV18,
  drawCosmeticBellTowerV18,
  drawCosmeticWallLanternV18,
  drawFrostWallV18,
  drawWatchtower,
} from './grid-v18-defense';
import {
  drawHallDoorV18,
  drawHallFrostV18,
  drawHallLampV18,
  drawHallV18,
  type HallRank,
} from './grid-v18-hall';
import {
  drawCosmeticBannersV18,
  drawCosmeticLanternsBorderV18,
  drawStripNorthV18,
  drawStripSouthV18,
} from './grid-v18-strips';
import { buildClearingBorderTile, drawGhostV18, drawGroundV18 } from './grid-v18-terrain';
import { blitCanvasScaled, drawBitmapText } from './grid-v18-font';

export interface StagedFileSpec {
  readonly name: string;
  readonly w: number;
  readonly h: number;
  readonly render: () => Canvas;
}

export interface Batch1Subject {
  readonly num: number;
  readonly id: string;
  readonly label: string;
  readonly cardHeight: number;
  readonly stagedFiles: readonly StagedFileSpec[];
  readonly drawRow: (png: PNG, x: number, y: number, ground: 'dark' | 'light') => void;
}

function hallRowDrawer(rank: HallRank) {
  return (png: PNG, x: number, y: number, ground: 'dark' | 'light'): void => {
    const cap = ground === 'dark' ? C.ash : C.wine;
    const base = drawHallV18(rank);
    const frost = new Canvas(64);
    stampCanvas(frost, base);
    stampCanvas(frost, drawHallFrostV18(rank));

    blitCanvasScaled(png, base, x, y, 2);
    drawBitmapText(png, x, y + 132, 'BASE (64X64)', cap, 1);

    blitCanvasScaled(png, frost, x + 152, y, 2);
    drawBitmapText(png, x + 152, y + 132, '+ FROST OVERLAY', cap, 1);

    if (rank === 'keep') {
      const lit = new Canvas(64);
      stampCanvas(lit, base);
      stampCanvas(lit, drawHallDoorV18());
      stampCanvas(lit, drawHallLampV18());
      blitCanvasScaled(png, lit, x + 304, y, 2);
      drawBitmapText(png, x + 304, y + 132, '+ DOOR & LAMP', cap, 1);
    }
  };
}

function groundRowDrawer(kind: 'grass' | 'earth' | 'flags') {
  return (png: PNG, x: number, y: number, ground: 'dark' | 'light'): void => {
    const cap = ground === 'dark' ? C.ash : C.wine;
    const single = drawGroundV18(kind);
    const tiled = new Canvas(64);
    for (const oy of [0, 32]) {
      for (const ox of [0, 32]) stampCanvas(tiled, single, ox, oy);
    }
    blitCanvasScaled(png, single, x, y + 32, 2);
    drawBitmapText(png, x, y + 102, '1X TILE', cap, 1);
    blitCanvasScaled(png, tiled, x + 96, y, 2);
    drawBitmapText(png, x + 96, y + 132, '2X2 SEAMLESS PATCH', cap, 1);
  };
}

function stripRowDrawer(kind: 'north' | 'south') {
  return (png: PNG, x: number, y: number, ground: 'dark' | 'light'): void => {
    const cap = ground === 'dark' ? C.ash : C.wine;
    const base = kind === 'north' ? drawStripNorthV18() : drawStripSouthV18();
    const decorated = new Canvas(256);
    stampCanvas(decorated, base, 0, 0, 16);
    stampCanvas(
      decorated,
      kind === 'north' ? drawCosmeticLanternsBorderV18() : drawCosmeticBannersV18(),
      0,
      0,
      16,
    );
    blitCanvasScaled(png, base, x, y + 4, 2, 16, 256);
    drawBitmapText(png, x, y + 40, 'BASE (256X16)', cap, 1);
    blitCanvasScaled(png, decorated, x, y + 58, 2, 16, 256);
    const overlayTag = kind === 'north' ? '+ LANTERNS OVERLAY' : '+ BANNERS OVERLAY';
    drawBitmapText(png, x, y + 94, overlayTag, cap, 1);
  };
}

export const BATCH1_SUBJECTS: readonly Batch1Subject[] = [
  {
    num: 1,
    id: 'grid.hearth-hall.hamlet',
    label: 'Hearth Hall - Hamlet (64x64 + frost)',
    cardHeight: 152,
    stagedFiles: [
      { name: 'hearth-hall-hamlet.png', w: 64, h: 64, render: () => drawHallV18('hamlet') },
      {
        name: 'hearth-hall-frost-hamlet.png',
        w: 64,
        h: 64,
        render: () => drawHallFrostV18('hamlet'),
      },
    ],
    drawRow: hallRowDrawer('hamlet'),
  },
  {
    num: 2,
    id: 'grid.hearth-hall.keep',
    label: 'Hearth Hall - Keep (64x64 + frost/door/lamp)',
    cardHeight: 152,
    stagedFiles: [
      { name: 'hearth-hall-keep.png', w: 64, h: 64, render: () => drawHallV18('keep') },
      { name: 'hearth-hall-frost-keep.png', w: 64, h: 64, render: () => drawHallFrostV18('keep') },
      { name: 'hearth-hall-door.png', w: 64, h: 64, render: () => drawHallDoorV18() },
      { name: 'hearth-hall-lamp.png', w: 64, h: 64, render: () => drawHallLampV18() },
    ],
    drawRow: hallRowDrawer('keep'),
  },
  {
    num: 3,
    id: 'grid.hearth-hall.citadel',
    label: 'Hearth Hall - Citadel (64x64 + frost)',
    cardHeight: 152,
    stagedFiles: [
      { name: 'hearth-hall-citadel.png', w: 64, h: 64, render: () => drawHallV18('citadel') },
      {
        name: 'hearth-hall-frost-citadel.png',
        w: 64,
        h: 64,
        render: () => drawHallFrostV18('citadel'),
      },
    ],
    drawRow: hallRowDrawer('citadel'),
  },
  {
    num: 4,
    id: 'grid.hearth-hall.bastion',
    label: 'Hearth Hall - Bastion (64x64 + frost)',
    cardHeight: 152,
    stagedFiles: [
      { name: 'hearth-hall-bastion.png', w: 64, h: 64, render: () => drawHallV18('bastion') },
      {
        name: 'hearth-hall-frost-bastion.png',
        w: 64,
        h: 64,
        render: () => drawHallFrostV18('bastion'),
      },
    ],
    drawRow: hallRowDrawer('bastion'),
  },
  {
    num: 5,
    id: 'grid.ground.grass',
    label: 'Ground - Meadow Turf (32x32 seamless)',
    cardHeight: 152,
    stagedFiles: [{ name: 'ground-grass.png', w: 32, h: 32, render: () => drawGroundV18('grass') }],
    drawRow: groundRowDrawer('grass'),
  },
  {
    num: 6,
    id: 'grid.ground.earth',
    label: 'Ground - Compacted Earth (32x32 seamless)',
    cardHeight: 152,
    stagedFiles: [{ name: 'ground-earth.png', w: 32, h: 32, render: () => drawGroundV18('earth') }],
    drawRow: groundRowDrawer('earth'),
  },
  {
    num: 7,
    id: 'grid.ground.flags',
    label: 'Ground - Slate Flagstones (32x32 seamless)',
    cardHeight: 152,
    stagedFiles: [{ name: 'ground-flags.png', w: 32, h: 32, render: () => drawGroundV18('flags') }],
    drawRow: groundRowDrawer('flags'),
  },
  {
    num: 8,
    id: 'grid.strip.north',
    label: 'North Strip - The Fell Breach (256x16)',
    cardHeight: 112,
    stagedFiles: [
      { name: 'strip-north.png', w: 256, h: 16, render: () => drawStripNorthV18() },
      {
        name: 'cosmetic-lanterns-border.png',
        w: 256,
        h: 16,
        render: () => drawCosmeticLanternsBorderV18(),
      },
    ],
    drawRow: stripRowDrawer('north'),
  },
  {
    num: 9,
    id: 'grid.strip.south',
    label: 'South Strip - Lowland Gate (256x16)',
    cardHeight: 112,
    stagedFiles: [
      { name: 'strip-south.png', w: 256, h: 16, render: () => drawStripSouthV18() },
      { name: 'cosmetic-banners.png', w: 256, h: 16, render: () => drawCosmeticBannersV18() },
    ],
    drawRow: stripRowDrawer('south'),
  },
  {
    num: 10,
    id: 'grid.borders',
    label: 'Clearing Borders - Forest, Ruin, Ghosts & Edge Trim',
    cardHeight: 96,
    stagedFiles: [
      { name: 'forest-1.png', w: 32, h: 32, render: () => buildClearingBorderTile('forest', 1, 0) },
      { name: 'forest-2.png', w: 32, h: 32, render: () => buildClearingBorderTile('forest', 2, 0) },
      { name: 'ruin-1.png', w: 32, h: 32, render: () => buildClearingBorderTile('ruin', 1, 0) },
      { name: 'ruin-2.png', w: 32, h: 32, render: () => buildClearingBorderTile('ruin', 2, 0) },
      { name: 'ghost-locked.png', w: 32, h: 32, render: () => drawGhostV18('locked') },
      { name: 'ghost-dormant.png', w: 32, h: 32, render: () => drawGhostV18('dormant') },
    ],
    drawRow: (png, x, y, ground) => {
      const cap = ground === 'dark' ? C.ash : C.wine;
      const items: readonly (readonly [string, () => Canvas])[] = [
        ['FOREST-1', () => buildClearingBorderTile('forest', 1, 0)],
        ['FOREST-2', () => buildClearingBorderTile('forest', 2, 0)],
        ['EDGE S', () => buildClearingBorderTile('forest', 1, CONNECTION_BITS.s)],
        ['RUIN-1', () => buildClearingBorderTile('ruin', 1, 0)],
        ['RUIN-2', () => buildClearingBorderTile('ruin', 2, 0)],
        ['LOCKED', () => drawGhostV18('locked')],
        ['DORMANT', () => drawGhostV18('dormant')],
      ];
      items.forEach(([tag, fn], idx) => {
        const bx = x + idx * 84;
        blitCanvasScaled(png, fn(), bx, y, 2);
        drawBitmapText(png, bx, y + 70, tag, cap, 1);
      });
    },
  },
  {
    num: 11,
    id: 'grid.wall.kit',
    label: 'Wall Kit - 16-Mask Builder (0..15 + frost + lantern)',
    cardHeight: 176,
    stagedFiles: [
      ...WALL_MASKS.map((m) => ({
        name: `wall-${m}.png`,
        w: 32,
        h: 32,
        render: () => buildWallTile(m),
      })),
      { name: 'frost-wall.png', w: 32, h: 32, render: () => drawFrostWallV18() },
      {
        name: 'cosmetic-lanterns-wall.png',
        w: 32,
        h: 32,
        render: () => drawCosmeticWallLanternV18(),
      },
    ],
    drawRow: (png, x, y, ground) => {
      const cap = ground === 'dark' ? C.ash : C.wine;
      for (const m of WALL_MASKS) {
        const bx = x + (m % 8) * 76;
        const by = y + Math.floor(m / 8) * 82;
        blitCanvasScaled(png, buildWallTile(m), bx, by, 2);
        drawBitmapText(png, bx, by + 68, `W${m}`, cap, 1);
      }
      const wallFrost = new Canvas(32);
      stampCanvas(wallFrost, buildWallTile(15));
      stampCanvas(wallFrost, drawFrostWallV18());
      blitCanvasScaled(png, wallFrost, x + 632, y, 2);
      drawBitmapText(png, x + 632, y + 68, '+FROST', cap, 1);

      const wallLamp = new Canvas(32);
      stampCanvas(wallLamp, buildWallTile(15));
      stampCanvas(wallLamp, drawCosmeticWallLanternV18());
      blitCanvasScaled(png, wallLamp, x + 632, y + 82, 2);
      drawBitmapText(png, x + 632, y + 150, '+LANTERN', cap, 1);
    },
  },
  {
    num: 12,
    id: 'grid.watchtower',
    label: 'Watchtower - Bastion & Wall Join (32x32 + bells)',
    cardHeight: 96,
    stagedFiles: [
      { name: 'watchtower.png', w: 32, h: 32, render: () => drawWatchtower() },
      { name: 'cosmetic-bell-tower.png', w: 32, h: 32, render: () => drawCosmeticBellTowerV18() },
      { name: 'cosmetic-bell-border.png', w: 32, h: 32, render: () => drawCosmeticBellBorderV18() },
    ],
    drawRow: (png, x, y, ground) => {
      const cap = ground === 'dark' ? C.ash : C.wine;
      const base = drawWatchtower();
      const belled = new Canvas(32);
      stampCanvas(belled, base);
      stampCanvas(belled, drawCosmeticBellTowerV18());

      blitCanvasScaled(png, base, x, y, 2);
      drawBitmapText(png, x, y + 70, 'WATCHTOWER', cap, 1);
      blitCanvasScaled(png, belled, x + 96, y, 2);
      drawBitmapText(png, x + 96, y + 70, '+ BELL', cap, 1);
      blitCanvasScaled(png, drawCosmeticBellBorderV18(), x + 192, y, 2);
      drawBitmapText(png, x + 192, y + 70, 'BELL POST', cap, 1);

      blitCanvasScaled(png, buildWallTile(CONNECTION_BITS.e), x + 288, y, 2);
      blitCanvasScaled(png, base, x + 352, y, 2);
      blitCanvasScaled(png, buildWallTile(CONNECTION_BITS.w), x + 416, y, 2);
      drawBitmapText(png, x + 288, y + 70, 'WALL + TOWER + WALL SEAM CHECK', cap, 1);
    },
  },
];
