// v1.1 (plan TL.5c, TL.6): what the Hold grid's sheets are made of: the numbered list, one picture's
// cell on both theme backgrounds, and the whole-grid mock-up. Shared by contact-sheet-layout.ts and
// before-after-layout.ts; `from` says where the pictures are read from (the game's, or the previous ones).
import { existsSync, readFileSync } from 'node:fs';
import { type AgeId } from '../src/content/ages';
import { assets, assetById, type AssetEntry } from '../src/content/assets';
import {
  CANONICAL_LAYOUT,
  CLEARING_BOUNDS,
  CONNECTION_BITS,
  HOLD_PIECE_IDS,
  PIECES,
  type HoldPieceId,
} from '../src/content/hold-layout';
import { isV11Asset } from './contact-sheet-data';

type Generated = Extract<AssetEntry, { source: 'generated' }>;
export const numbered = assets
  .filter((a): a is Generated => a.source === 'generated' && isV11Asset(a.id))
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  .map((asset, i) => ({ n: i + 1, asset }));
export type Item = (typeof numbered)[number];

const DARK = '#302c2e';
const LIGHT = '#cfc6b8';

/** `before` makes a picture read from art-src/previous-v1.1/ when a copy of it is kept there (TL.6). */
export const source = { before: false };
const url = (file: string): string => {
  const prev = new URL(`../art-src/previous-v1.1/${file.replace(/^grid\//, '')}`, import.meta.url);
  const at =
    source.before && existsSync(prev) ? prev : new URL(`../public/assets/${file}`, import.meta.url);
  return `data:image/png;base64,${readFileSync(at).toString('base64')}`;
};
const fileOf = (id: string): string => {
  const a = assetById.get(id);
  if (!a || a.source === 'placeholder') throw new Error(`no file for ${id}`);
  return a.file;
};
const img = (id: string, k: number, cls = ''): string => {
  const [w, h] = assetById.get(id)?.size ?? [32, 32];
  return `<img class="${cls}" src="${url(fileOf(id))}" width="${w * k}" height="${h * k}" alt="">`;
};

/** What an overlay sits on, drawn first. */
const baseOf = (id: string): string | null => {
  if (id === 'grid.cosmetic.banners') return 'grid.strip.south';
  if (id === 'grid.cosmetic.lanterns-border') return 'grid.strip.north';
  if (id === 'grid.cosmetic.bell-tower') return 'grid.watchtower';
  if (id === 'grid.cosmetic.lanterns-wall' || id === 'grid.frost.wall') return 'grid.wall.15';
  if (id === 'grid.hearth-hall.door' || id === 'grid.hearth-hall.lamp')
    return 'grid.hearth-hall.keep';
  const frost = /^grid\.hearth-hall\.frost\.(\w+)$/.exec(id);
  return frost ? `grid.hearth-hall.${frost[1]}` : null;
};
const isGround = (id: string): boolean => /^grid\.(ground|forest|ruin)\./.test(id);
const zoom = (id: string): number => {
  const w = assetById.get(id)?.size[0] ?? 32;
  return w >= 256 ? 2 : w === 64 ? 3 : 4;
};

export const cell = (x: Item): string => {
  const k = zoom(x.asset.id);
  const base = baseOf(x.asset.id);
  const stack = (bg: string): string => {
    const [w, h] = x.asset.size;
    const inner = base
      ? `<span class="stack" style="width:${w * k}px;height:${h * k}px">${img(base, k)}${img(x.asset.id, k, 'over')}</span>`
      : img(x.asset.id, k);
    // Ground tiles are shown on their own; pieces and overlays on a ground-coloured card.
    return `<span class="bg" style="background:${bg}">${inner}</span>`;
  };
  const wide = (x.asset.size[0] ?? 32) >= 256;
  return `<figure class="${wide ? 'wide' : ''}"><div class="pair">${stack(DARK)}${isGround(x.asset.id) ? '' : stack(LIGHT)}</div><div class="n">${x.n}</div><div class="id">${x.asset.id.replace(/^grid\./, '')}</div></figure>`;
};

export const GROUPS: readonly { key: string; title: string; has: (id: string) => boolean }[] = [
  {
    key: 'ground',
    title: 'Ground, border, ghosts, strips and their cosmetics',
    has: (id) =>
      /^grid\.(ground|forest|ruin|ghost|strip)\./.test(id) ||
      /cosmetic\.(banners|lanterns-border)/.test(id),
  },
  {
    key: 'defense',
    title: 'Walls, Watchtower, wall cosmetics and frost',
    has: (id) =>
      /^grid\.(wall|watchtower|frost)/.test(id) || /cosmetic\.(lanterns-wall|bell)/.test(id),
  },
  {
    key: 'buildings',
    title: 'Level buildings and the Trophy Hall (Tier I, II, III)',
    has: (id) =>
      /^grid\.(mill|sawpit|smithy|bell-tower|barracks|lodge|alchemist|trophy-hall)/.test(id),
  },
  {
    key: 'hall',
    title: 'The Hearth Hall at each Rank, with the door, lamp and frost',
    has: (id) => id.startsWith('grid.hearth-hall'),
  },
  {
    key: 'plots',
    title: 'Count-building plots (density 1, 2, 3) and Silver Seams',
    has: (id) => /^grid\.(cottage|farm|woodcutter|mine|herb-garden|silver-seam)/.test(id),
  },
];

const CSS = `body{margin:0;padding:12px;background:#1b181a;color:#f4cca1;font-family:system-ui,sans-serif;width:max-content;max-width:1000px}
h1{font-size:16px;margin:0 0 10px;font-weight:600}
.grid{display:flex;flex-wrap:wrap;gap:10px}
figure{margin:0;padding:6px;background:#39314b;border-radius:6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
figure.wide{width:540px}
img{image-rendering:pixelated;display:block}.pair{display:flex;gap:4px}figure.wide .pair{flex-direction:column}.bg{display:inline-flex;padding:4px;border-radius:3px}
.stack{position:relative;display:block}.stack img{position:absolute;left:0;top:0}
.n{font-size:22px;font-weight:700;color:#f4b41b;line-height:1}.id{font-size:10px;color:#a0938e;max-width:200px;word-break:break-all}`;
export const sheetHtml = (title: string, body: string): string =>
  `<!doctype html><meta charset="utf-8"><style>${CSS}</style><h1>${title}</h1><div class="grid">${body}</div>`;

// ---- the two mock-ups: a whole grid, laid out from the canonical layout --------------------------------
const pieceImage = (id: HoldPieceId, age: AgeId, top: boolean, defenses: Set<string>): string => {
  const def = PIECES.find((p) => p.id === id);
  const at = CANONICAL_LAYOUT[id];
  if (!def) return '';
  if (id === 'hearth-hall') return `grid.hearth-hall.${age}`;
  if (id.startsWith('wall-')) {
    const has = (dx: number, dy: number): boolean => defenses.has(`${at.x + dx},${at.y + dy}`);
    const mask =
      (has(0, -1) ? CONNECTION_BITS.n : 0) |
      (has(1, 0) ? CONNECTION_BITS.e : 0) |
      (has(0, 1) ? CONNECTION_BITS.s : 0) |
      (has(-1, 0) ? CONNECTION_BITS.w : 0);
    return `grid.wall.${mask}`;
  }
  if (id.startsWith('watchtower-')) return 'grid.watchtower';
  if (id === 'trophy-hall') return 'grid.trophy-hall';
  const m = /^(.*)-(\d)$/.exec(id);
  if (m) {
    const kind = m[1] === 'silver-seam' ? 'silver-seam' : (m[1] ?? '');
    const n = Number(m[2]);
    return `grid.${kind}.${top ? (kind === 'silver-seam' ? 2 : 3) : Math.min(n, 1)}`;
  }
  return `grid.${id}.${top ? 3 : 1}`;
};
export const mock = (age: AgeId, title: string, top: boolean): string => {
  const K = 2;
  const b = CLEARING_BOUNDS[age];
  const inside = (x: number, y: number): boolean =>
    x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
  const placed = HOLD_PIECE_IDS.filter((id) => {
    const at = CANONICAL_LAYOUT[id];
    const def = PIECES.find((p) => p.id === id);
    return def && inside(at.x, at.y) && inside(at.x + def.w - 1, at.y + def.h - 1);
  });
  const defenses = new Set(
    placed
      .filter((id) => /^(wall|watchtower)-/.test(id))
      .map((id) => `${CANONICAL_LAYOUT[id].x},${CANONICAL_LAYOUT[id].y}`),
  );
  const tiles: string[] = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const look = (x * 5 + y * 3 + x * y) % 3;
      const id = inside(x, y)
        ? `grid.ground.${(['grass', 'earth', 'flags'] as const)[look]}`
        : (x + y) % 3 === 0
          ? `grid.ruin.${(x % 2) + 1}`
          : `grid.forest.${(y % 2) + 1}`;
      tiles.push(
        `<span style="position:absolute;left:${x * 32 * K}px;top:${(y * 32 + 16) * K}px">${img(id, K)}</span>`,
      );
    }
  const pieces = placed.map((id) => {
    const at = CANONICAL_LAYOUT[id];
    return `<span style="position:absolute;left:${at.x * 32 * K}px;top:${(at.y * 32 + 16) * K}px">${img(pieceImage(id, age, top, defenses), K)}</span>`;
  });
  const strips = `<span style="position:absolute;left:0;top:0">${img('grid.strip.north', K)}</span><span style="position:absolute;left:0;top:${(256 + 16) * K}px">${img('grid.strip.south', K)}</span>`;
  return `<figure style="width:${256 * K + 8}px"><div class="stack" style="width:${256 * K}px;height:${(256 + 32) * K}px">${tiles.join('')}${pieces.join('')}${strips}</div><div class="id" style="max-width:none;font-size:13px">${title}</div></figure>`;
};
