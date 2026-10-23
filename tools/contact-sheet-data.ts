// v1.0 (plan TV.2, D475): the numbered list behind the Keep/Redraw contact sheets. Pure data, so a test
// can check it: every manifest row whose source is `generated`, numbered by sorted id (stable), and
// the plan of which numbers sit on which sheet.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { assets, type AssetEntry } from '../src/content/assets';

export type GeneratedAsset = Extract<AssetEntry, { source: 'generated' }>;

export interface NumberedAsset {
  readonly n: number;
  readonly asset: GeneratedAsset;
}

/** v1.1 pictures (the Hold's grid) are numbered on their own sheet at TL.5c, so the v1.0 numbers never move (D507 (4)). */
export const isV11Asset = (id: string): boolean => id.startsWith('grid.');

/** Numbered 1..N in plain id order; adding a row later never renumbers the ones before it in id order. */
export const numberedAssets: readonly NumberedAsset[] = assets
  .filter((a): a is GeneratedAsset => a.source === 'generated' && !isV11Asset(a.id))
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  .map((asset, i) => ({ n: i + 1, asset }));

export interface SheetPlan {
  readonly name: string;
  readonly title: string;
  readonly items: readonly NumberedAsset[];
}

const chunk = <T>(xs: readonly T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
};

const GROUPS: readonly {
  readonly key: string;
  readonly title: string;
  readonly per: number;
  readonly has: (a: GeneratedAsset) => boolean;
}[] = [
  { key: 'portraits', title: 'Portraits', per: 12, has: (a) => a.kind === 'portrait' },
  { key: 'sprites', title: 'Battle sprites', per: 10, has: (a) => a.kind === 'sprite' },
  {
    key: 'icons',
    title: 'Icons and frames',
    per: 27,
    has: (a) => a.kind === 'icon' || a.kind === 'frame',
  },
  { key: 'scenes', title: 'Scenes', per: 8, has: (a) => a.kind === 'scene' },
];

/** A few composite sheets per kind, in number order. Every generated row is on exactly one. */
export const sheetPlan: readonly SheetPlan[] = GROUPS.flatMap((g) => {
  const items = numberedAssets.filter((x) => g.has(x.asset));
  const parts = chunk(items, g.per);
  return parts.map((part, i) => ({
    name: `${g.key}-${i + 1}`,
    title: `${g.title} (${i + 1} of ${parts.length})`,
    items: part,
  }));
});

const PUBLIC_ASSETS = new URL('../public/assets/', import.meta.url);

/** Hash of every manifest file and the home-screen icons: the v0.11 record behind the Keep test. */
export const hashFile = (path: string): string =>
  createHash('sha256')
    .update(readFileSync(new URL(path, PUBLIC_ASSETS)))
    .digest('hex');

export const ICON_FILES = [
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
] as const;

export const currentHashes = (): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const a of assets) {
    if (a.source === 'placeholder') continue;
    out[a.id] = hashFile(a.file);
  }
  for (const f of ICON_FILES) {
    const url = new URL(`../icons/${f}`, PUBLIC_ASSETS);
    if (existsSync(url))
      out[`app-icon:${f}`] = createHash('sha256').update(readFileSync(url)).digest('hex');
  }
  return out;
};

/** The ids the owner marked Redraw in docs/flesh-out/v1.0/art-marks.md (table rows: | n | id | mark |). */
export const redrawIds = (marksMarkdown: string): Set<string> => {
  const ids = new Set<string>();
  for (const line of marksMarkdown.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length >= 5 && /^\d+$/.test(cells[1] ?? '') && /^redraw$/i.test(cells[3] ?? '')) {
      ids.add((cells[2] ?? '').replace(/`/g, ''));
    }
  }
  return ids;
};
