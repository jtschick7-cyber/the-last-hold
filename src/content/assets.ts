import { AGE_IDS, type AgeId } from './ages';
import { BUILDING_IDS, type BuildingId } from './buildings';
import { HUNTER_IDS, hunters, type HunterId } from './hunters';
import { MONSTER_IDS, monsters, type MonsterId } from './monsters';
import { RESOURCE_IDS, type ResourceId } from './resources';

// Technical design §12.1: every image the game shows has a manifest row.
// Swapping art means replacing a file or changing a row, never code. A row with
// source 'placeholder' has no file yet; <Sprite> draws the fallback for it.
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
export const hunterPortraitId = (h: HunterId): string => `portrait.hunter.${h}`;
export const monsterPortraitId = (m: MonsterId): string => `portrait.monster.${m}`;

// Plan T1.31a: the v0.1 images, built from the owner's CC0 Kenney packs by
// tools/build-art.ts (recipes in tools/art-recipes.ts) and recolored to the
// palette. Rows here and recipes there must agree (tests/tools/art.test.ts).
const KENNEY = 'Kenney (www.kenney.nl)';
const TINY_TOWN = { pack: 'Tiny Town', url: 'https://kenney.nl/assets/tiny-town' } as const;
const ONE_BIT = { pack: '1-Bit Pack', url: 'https://kenney.nl/assets/1-bit-pack' } as const;

const fromPack = (
  id: string,
  kind: AssetKind,
  size: readonly [number, number],
  label: string,
  file: string,
  src: { pack: string; url: string },
  glyph?: string,
): AssetEntry => ({
  id,
  kind,
  size,
  label,
  file,
  ...src,
  source: 'pack',
  license: 'CC0',
  credit: KENNEY,
  ...(glyph ? { glyph } : {}),
});

const ICON_PACK: Record<ResourceId, { pack: string; url: string }> = {
  food: ONE_BIT,
  wood: TINY_TOWN,
  iron: TINY_TOWN,
  silver: TINY_TOWN,
};

// Plan T2.23/T2.24: portraits drawn by tools/gen-portraits.ts (hunters) and tools/gen-monsters.ts from each hunter's `portrait` parts and each species' recipe.
const generated = (
  id: string,
  size: readonly [number, number],
  label: string,
  file: string,
  generator: string,
): AssetEntry => ({
  id,
  kind: 'portrait',
  size,
  label,
  file,
  generator,
  source: 'generated',
  license: 'CC0 (project-generated)',
  credit: 'The Last Hold',
});

export const assets: readonly AssetEntry[] = [
  ...RESOURCE_IDS.map((r) =>
    fromPack(
      resourceIconId(r),
      'icon',
      [16, 16],
      titled(r),
      `icons/${r}.png`,
      ICON_PACK[r],
      GLYPH[r],
    ),
  ),
  ...BUILDING_IDS.map((b) =>
    fromPack(buildingSpriteId(b), 'building', [32, 32], titled(b), `buildings/${b}.png`, TINY_TOWN),
  ),
  ...AGE_IDS.map((a) =>
    fromPack(
      holdSceneId(a),
      'scene',
      [160, 64],
      `The hold, ${titled(a)}`,
      `scenes/hold-${a}.png`,
      TINY_TOWN,
    ),
  ),
  ...HUNTER_IDS.map((h) =>
    generated(
      hunterPortraitId(h),
      [64, 64],
      hunters[h].name,
      `portraits/${h}.png`,
      'tools/gen-portraits.ts',
    ),
  ),
  ...MONSTER_IDS.map((m) =>
    generated(
      monsterPortraitId(m),
      [64, 64],
      monsters[m].name,
      `portraits/monster-${m}.png`,
      'tools/gen-monsters.ts',
    ),
  ),
];

export const assetById: ReadonlyMap<string, AssetEntry> = new Map(assets.map((a) => [a.id, a]));
