import { AGE_IDS, type AgeId } from './ages';
import { BUILDING_IDS, type BuildingId } from './buildings';
import { RESOURCE_IDS, type ResourceId } from './resources';

// Technical design §12.1: every image the game shows has a manifest row.
// Swapping art means replacing a file or changing a row, never code. Rows with
// source 'placeholder' have no file yet; <Sprite> draws the fallback for them.
// GDD §9.12 sizes: 16 px icons, 32 px buildings, 64 px portraits.
export type AssetKind = 'icon' | 'building' | 'scene' | 'portrait';

interface AssetBase {
  readonly id: string;
  readonly kind: AssetKind;
  /** Width and height in pixels, before integer scaling. */
  readonly size: readonly [number, number];
  /** What it shows, for alt text and the placeholder's initials. */
  readonly label: string;
  /** Optional stand-in glyph for the placeholder (resource icons use emoji). */
  readonly glyph?: string;
}

export type AssetEntry =
  | (AssetBase & { readonly source: 'placeholder' })
  | (AssetBase & {
      readonly source: 'generated';
      readonly file: string;
      readonly generator: string;
      readonly license: 'CC0 (project-generated)';
      readonly credit: 'The Last Hold';
    })
  | (AssetBase & {
      readonly source: 'pack';
      readonly file: string;
      readonly pack: string;
      readonly url: string;
      readonly license: 'CC0';
      readonly credit: string;
    });

const GLYPH: Record<ResourceId, string> = { food: '🌾', wood: '🪵', iron: '⛏️', silver: '⚪' };
const titled = (id: string): string =>
  id.replace(/(^|-)(\w)/g, (_, sep: string, c: string) => `${sep ? ' ' : ''}${c.toUpperCase()}`);

export const resourceIconId = (r: ResourceId): string => `icon.resource.${r}`;
export const buildingSpriteId = (b: BuildingId): string => `building.${b}`;
export const holdSceneId = (a: AgeId): string => `scene.hold.${a}`;

export const assets: readonly AssetEntry[] = [
  ...RESOURCE_IDS.map((r): AssetEntry => ({
    id: resourceIconId(r),
    kind: 'icon',
    size: [16, 16],
    label: titled(r),
    glyph: GLYPH[r],
    source: 'placeholder',
  })),
  ...BUILDING_IDS.map((b): AssetEntry => ({
    id: buildingSpriteId(b),
    kind: 'building',
    size: [32, 32],
    label: titled(b),
    source: 'placeholder',
  })),
  ...AGE_IDS.map((a): AssetEntry => ({
    id: holdSceneId(a),
    kind: 'scene',
    size: [160, 64],
    label: `The hold, ${titled(a)}`,
    source: 'placeholder',
  })),
];

export const assetById: ReadonlyMap<string, AssetEntry> = new Map(assets.map((a) => [a.id, a]));
