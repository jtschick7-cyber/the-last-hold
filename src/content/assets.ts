import { CONSUMABLE_IDS, consumables, type ConsumableId } from './consumables';
import { SKILL_IDS, skills, type SkillId } from './skills';
import { AGE_IDS, type AgeId } from './ages';
import { BUILDING_IDS, type BuildingId } from './buildings';
import { bosses, type BossId } from './great-beasts';
import { HUNTER_IDS, hunters, type HunterId } from './hunters';
import { EVENT_CREATURE_IDS, quarries, type EventCreatureId, type QuarryId } from './hunts';
import { MONSTER_IDS, monsters, type MonsterId } from './monsters';
import { RELIC_IDS, relics, type RelicId } from './relics';
import { RESOURCE_IDS, type ResourceId } from './resources';
import { GUARDIAN_IDS, guardians, type GuardianId } from './delves/guardians';
import { PATRON_IDS, patrons, type PatronId } from './delves/patrons';
import { DELVE_RELIC_IDS, delveRelics, type DelveRelicId } from './delves/relics';
import { COSMETIC_IDS, type CosmeticId } from './delves/shop';
import { RARITIES, rarityNames, type RarityId } from './delves/blessing-types';
import { GEAR_IDS, gear, type GearId } from './gear';
import { ITEM_RARITY_IDS, itemRarities, type ItemRarity } from './items';
import { LEGENDARY_IDS, legendaries, type LegendaryId } from './legendaries';
import { ORDER_IDS, ORDER_NAMES, type OrderId } from './orders';
import { HUNTER_RANK_IDS, hunterRanks, type HunterRank } from './ranks';

// Technical design §12.1: every image the game shows has a manifest row.
// Swapping art means replacing a file or changing a row, never code. A row with
// source 'placeholder' has no file yet; <Sprite> draws the fallback for it.
// GDD §9.12 sizes: 16 px icons, 32 px buildings, 64 px portraits.
export type AssetKind = 'icon' | 'building' | 'scene' | 'portrait' | 'sprite' | 'frame';

/** GDD §9.12 (D265): a battle sprite is one strip of these 32 px frames, left to right. */
export const SPRITE_FRAME_NAMES = ['idle', 'idle2', 'lunge', 'hit', 'downed'] as const;
export type SpriteFrameName = (typeof SPRITE_FRAME_NAMES)[number];
const eventCreatureName = (c: EventCreatureId): string =>
  c in bosses ? bosses[c as BossId].name : quarries[c as QuarryId].name;
export const SPRITE_PX = 32;

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
export const EMBERS_ICON = 'icon.embers';
export const THREAT_ICON = 'icon.threat';
export const WRIGHTS_BLADE_ICON = 'icon.gear.wrights-blade';
export const RIBBON_ICON = 'icon.story.ribbon';
/** Icons for four document types (v0.5, plan T5.13); the other types have none. */
export const DOC_ICON_TYPES = ['letter', 'journal', 'ledger', 'testament'] as const;
export const docIconId = (type: string): string | null =>
  (DOC_ICON_TYPES as readonly string[]).includes(type) ? `icon.doc.${type}` : null;
/** The six v0.6 brews' icons are from the 1-Bit Pack (plan T6.10). */
export const NEW_BREW_IDS = CONSUMABLE_IDS.slice(9);
/** Every brew has an icon (the nine older ones since v0.8, D323). */
export const brewIconId = (b: ConsumableId): string => `icon.brew.${b}`;
// v0.8 (plan T8.14, D324): gear base icons, item rarity frames, keepsakes, the star, rank badges and
// the nine older brews' icons, all code-drawn by tools/draw-items.ts.
export const gearIconId = (g: GearId): string => `icon.item.${g}`;
export const itemFrameId = (r: ItemRarity): string => `icon.item-frame.${r}`;
export const keepsakeIconId = (l: LegendaryId): string => `icon.keepsake.${l}`;
export const STAR_ICON = 'icon.star';
export const rankBadgeId = (r: HunterRank): string => `icon.rank.${r}`;
/** The nine brews from before v0.6 are drawn in code, the six newer ones come from the 1-Bit Pack. */
export const OLD_BREW_ICON_IDS = CONSUMABLE_IDS.slice(0, 9);
export const skillIconId = (s: SkillId): string => `icon.skill.${s}`;
export const relicIconId = (r: RelicId): string => `icon.relic.${r}`;
export const hunterPortraitId = (h: HunterId): string => `portrait.hunter.${h}`;
export const monsterPortraitId = (m: MonsterId): string => `portrait.monster.${m}`;
// v0.7 (plan T7.12, D265): battle sprites, the patron sigils, the Riftglass, the Delve relics, the
// rarity frames and the hold cosmetics, all code-drawn.
export { EVENT_CREATURE_IDS };
export const eventCreaturePortraitId = (c: EventCreatureId): string => `portrait.creature.${c}`;
export const RIME_ICON = 'icon.rime';
export const TOKEN_ICON = 'icon.token';
// v0.10 (plan T10.15, Q36 (a)): the Orders' marks, the card's icon and the opening-scene placeholders.
export const ORDERS_ICON = 'icon.orders';
export const orderMarkId = (o: OrderId): string => `icon.order.${o}`;
export const orderSceneId = (o: OrderId): string => `scene.order.${o}`;
export const eventCreatureSpriteId = (c: EventCreatureId): string => `sprite.creature.${c}`;
export const hunterSpriteId = (h: HunterId): string => `sprite.hunter.${h}`;
export const monsterSpriteId = (m: MonsterId): string => `sprite.monster.${m}`;
export const guardianSpriteId = (g: GuardianId): string => `sprite.guardian.${g}`;
export const sigilIconId = (p: PatronId): string => `icon.sigil.${p}`;
export const RIFTGLASS_ICON = 'icon.riftglass';
export const delveRelicIconId = (r: DelveRelicId): string => `icon.delve-relic.${r}`;
export const rarityFrameId = (r: RarityId): string => `icon.rarity.${r}`;
export const HOLD_LOOKS = ['frost', 'lamp'] as const;
export type HoldLook = (typeof HOLD_LOOKS)[number];
/** The ending's two looks of the hold scene (v0.11, D457): the frost, then the lamp. */
export const holdLookId = (l: HoldLook, age: AgeId): string => `scene.look.${l}.${age}`;
// v1.1 (plan TL.5a, D504): the Hold's 8 × 8 grid. 32 px tiles; the two border strips are 256 × 16.
export const GRID_GENERATOR = 'tools/gen-layout-grid.ts';
export const groundTileId = (l: string): string => `grid.ground.${l}`;
export const forestTileId = (l: string): string => `grid.forest.${l}`;
export const ruinTileId = (l: string): string => `grid.ruin.${l}`;
export const ghostTileId = (l: string): string => `grid.ghost.${l}`;
export const gridWallId = (mask: number): string => `grid.wall.${mask}`;
export const GRID_WATCHTOWER_ID = 'grid.watchtower';
export const GRID_TROPHY_HALL_ID = 'grid.trophy-hall';
export const gridTierId = (building: string, tier: number): string => `grid.${building}.${tier}`;
export const gridHallId = (age: AgeId): string => `grid.hearth-hall.${age}`;
export const gridHallFrostId = (age: AgeId): string => `grid.hearth-hall.frost.${age}`;
export const GRID_HALL_DOOR_ID = 'grid.hearth-hall.door';
export const GRID_HALL_LAMP_ID = 'grid.hearth-hall.lamp';
/** The seven level buildings with three looks each on the grid (v1.1 TL.5b). */
export const GRID_TIERED = [
  'mill',
  'sawpit',
  'smithy',
  'bell-tower',
  'barracks',
  'lodge',
  'alchemist',
] as const;
export const GRID_PLOTS = ['cottage', 'farm', 'woodcutter', 'mine', 'herb-garden'] as const;
export const GRID_COSMETIC_IDS = [
  'banners',
  'bell-tower',
  'bell-border',
  'lanterns-wall',
  'lanterns-border',
] as const;
export const gridCosmeticId = (c: (typeof GRID_COSMETIC_IDS)[number]): string =>
  `grid.cosmetic.${c}`;
export const GRID_WALL_FROST_ID = 'grid.frost.wall';
export const gridStripId = (e: string): string => `grid.strip.${e}`;
export const cosmeticId = (c: CosmeticId, age: AgeId): string => `scene.cosmetic.${c}.${age}`;

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
  kind: AssetKind = 'portrait',
): AssetEntry => ({
  id,
  kind,
  size,
  label,
  file,
  generator,
  source: 'generated',
  license: 'CC0 (project-generated)',
  credit: 'The Last Hold',
});

// Ids whose art isn't drawn yet; <Sprite> draws the placeholder for them.
const NO_ART_YET: ReadonlySet<string> = new Set<string>([]);
const placeholder = (
  id: string,
  kind: AssetKind,
  size: readonly [number, number],
  label: string,
): AssetEntry => ({ id, kind, size, label, source: 'placeholder' });

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
    NO_ART_YET.has(b)
      ? placeholder(buildingSpriteId(b), 'building', [32, 32], titled(b))
      : fromPack(
          buildingSpriteId(b),
          'building',
          [32, 32],
          titled(b),
          `buildings/${b}.png`,
          TINY_TOWN,
        ),
  ),
  ...AGE_IDS.map((a) =>
    NO_ART_YET.has(a)
      ? placeholder(holdSceneId(a), 'scene', [160, 64], `The hold, ${titled(a)}`)
      : fromPack(
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
  // v0.9 (T9.16): drawn in code like the monsters (tools/draw-creatures.ts).
  ...EVENT_CREATURE_IDS.map((c) =>
    generated(
      eventCreaturePortraitId(c),
      [64, 64],
      eventCreatureName(c),
      `portraits/creature-${c}.png`,
      'tools/gen-sprites.ts',
    ),
  ),
  // The Cursed (v0.5) are drawn too (plan T5.13, tools/draw-cursed.ts).
  ...MONSTER_IDS.map((m) =>
    generated(
      monsterPortraitId(m),
      [64, 64],
      monsters[m].name,
      `portraits/monster-${m}.png`,
      'tools/gen-monsters.ts',
    ),
  ),
  // v0.4 (plan T4.12): Embers, Threat and the relics, from the 1-Bit Pack.
  fromPack(EMBERS_ICON, 'icon', [16, 16], 'Embers', 'icons/embers.png', ONE_BIT),
  fromPack(THREAT_ICON, 'icon', [16, 16], 'Threat', 'icons/threat.png', ONE_BIT),
  ...RELIC_IDS.map((r) =>
    fromPack(relicIconId(r), 'icon', [16, 16], relics[r].name, `icons/relic-${r}.png`, ONE_BIT),
  ),
  // v0.5 (plan T5.13): the Wright's Blade, the ribbon and the document types.
  fromPack(
    WRIGHTS_BLADE_ICON,
    'icon',
    [16, 16],
    "Wright's Blade",
    'icons/gear-wrights-blade.png',
    ONE_BIT,
  ),
  fromPack(RIBBON_ICON, 'icon', [16, 16], 'Ribbon', 'icons/story-ribbon.png', ONE_BIT),
  ...DOC_ICON_TYPES.map((d) =>
    fromPack(`icon.doc.${d}`, 'icon', [16, 16], titled(d), `icons/doc-${d}.png`, ONE_BIT),
  ),
  // v0.6 (plan T6.10): the six new brews and the four warden skills.
  ...NEW_BREW_IDS.map((b) =>
    fromPack(
      `icon.brew.${b}`,
      'icon',
      [16, 16],
      consumables[b].name,
      `icons/brew-${b}.png`,
      ONE_BIT,
    ),
  ),
  ...SKILL_IDS.map((k) =>
    fromPack(skillIconId(k), 'icon', [16, 16], skills[k].name, `icons/skill-${k}.png`, ONE_BIT),
  ),
  // v0.8 (plan T8.14, D324): drawn by tools/gen-items.ts.
  ...GEAR_IDS.map((g) =>
    generated(
      gearIconId(g),
      [16, 16],
      gear[g].name,
      `icons/item-${g}.png`,
      'tools/gen-items.ts',
      'icon',
    ),
  ),
  ...ITEM_RARITY_IDS.map((r) =>
    generated(
      itemFrameId(r),
      [20, 20],
      `${itemRarities[r].name} item frame`,
      `icons/item-frame-${r}.png`,
      'tools/gen-items.ts',
      'frame',
    ),
  ),
  ...LEGENDARY_IDS.map((l) =>
    generated(
      keepsakeIconId(l),
      [16, 16],
      legendaries[l].name,
      `icons/keepsake-${l}.png`,
      'tools/gen-items.ts',
      'icon',
    ),
  ),
  generated(STAR_ICON, [16, 16], 'Star', 'icons/star.png', 'tools/gen-items.ts', 'icon'),
  ...HUNTER_RANK_IDS.map((r) =>
    generated(
      rankBadgeId(r),
      [16, 16],
      `${hunterRanks[r].name} badge`,
      `icons/rank-${r}.png`,
      'tools/gen-items.ts',
      'icon',
    ),
  ),
  ...OLD_BREW_ICON_IDS.map((b) =>
    generated(
      brewIconId(b),
      [16, 16],
      consumables[b].name,
      `icons/brew-${b}.png`,
      'tools/gen-items.ts',
      'icon',
    ),
  ),
  // v0.7 (plan T7.12): drawn by tools/gen-sprites.ts.
  ...HUNTER_IDS.map((h) =>
    generated(
      hunterSpriteId(h),
      [SPRITE_PX * SPRITE_FRAME_NAMES.length, SPRITE_PX],
      `${hunters[h].name}, battle sprite`,
      `sprites/hunter-${h}.png`,
      'tools/gen-sprites.ts',
      'sprite',
    ),
  ),
  ...EVENT_CREATURE_IDS.map((c) =>
    generated(
      eventCreatureSpriteId(c),
      [SPRITE_PX * SPRITE_FRAME_NAMES.length, SPRITE_PX],
      `${eventCreatureName(c)}, battle sprite`,
      `sprites/creature-${c}.png`,
      'tools/gen-sprites.ts',
      'sprite',
    ),
  ),
  ...MONSTER_IDS.map((m) =>
    generated(
      monsterSpriteId(m),
      [SPRITE_PX * SPRITE_FRAME_NAMES.length, SPRITE_PX],
      `${monsters[m].name}, battle sprite`,
      `sprites/monster-${m}.png`,
      'tools/gen-sprites.ts',
      'sprite',
    ),
  ),
  ...GUARDIAN_IDS.map((g) =>
    generated(
      guardianSpriteId(g),
      [SPRITE_PX * SPRITE_FRAME_NAMES.length, SPRITE_PX],
      `${guardians[g].name}, battle sprite`,
      `sprites/guardian-${g}.png`,
      'tools/gen-sprites.ts',
      'sprite',
    ),
  ),
  ...PATRON_IDS.map((p) =>
    generated(
      sigilIconId(p),
      [16, 16],
      `${patrons[p].name}, sigil`,
      `icons/sigil-${p}.png`,
      'tools/gen-sprites.ts',
      'icon',
    ),
  ),
  generated(RIME_ICON, [16, 16], 'Rime', 'icons/rime.png', 'tools/gen-sprites.ts', 'icon'),
  generated(
    TOKEN_ICON,
    [16, 16],
    'Attempt token',
    'icons/token.png',
    'tools/gen-sprites.ts',
    'icon',
  ),
  generated(
    RIFTGLASS_ICON,
    [16, 16],
    'Riftglass',
    'icons/riftglass.png',
    'tools/gen-sprites.ts',
    'icon',
  ),
  generated(ORDERS_ICON, [16, 16], 'Orders', 'icons/orders.png', 'tools/gen-sprites.ts', 'icon'),
  ...ORDER_IDS.flatMap((o) => [
    generated(
      orderMarkId(o),
      [16, 16],
      `${ORDER_NAMES[o]}, mark`,
      `icons/order-${o}.png`,
      'tools/gen-sprites.ts',
      'icon',
    ),
    generated(
      orderSceneId(o),
      [160, 64],
      `${ORDER_NAMES[o]}, opening scene`,
      `scenes/orders/${o}.png`,
      'tools/gen-sprites.ts',
      'scene',
    ),
  ]),
  ...DELVE_RELIC_IDS.map((r) =>
    generated(
      delveRelicIconId(r),
      [16, 16],
      delveRelics[r].name,
      `icons/delve-relic-${r}.png`,
      'tools/gen-sprites.ts',
      'icon',
    ),
  ),
  ...RARITIES.map((r) =>
    generated(
      rarityFrameId(r),
      [20, 20],
      `${rarityNames[r]} frame`,
      `icons/rarity-${r}.png`,
      'tools/gen-sprites.ts',
      'frame',
    ),
  ),
  ...COSMETIC_IDS.flatMap((c) =>
    AGE_IDS.map((a) =>
      generated(
        cosmeticId(c, a),
        [160, 64],
        `${titled(c)}, the hold at ${titled(a)}`,
        `scenes/cosmetics/${a}-${c}.png`,
        'tools/gen-sprites.ts',
        'scene',
      ),
    ),
  ),
  // v1.1 TL.5a: the grid's ground, border and blueprint tiles (tools/draw-layout-grid.ts).
  ...(['grass', 'earth', 'flags'] as const).map((l) =>
    generated(
      groundTileId(l),
      [32, 32],
      `Cleared ground, ${l}`,
      `grid/ground-${l}.png`,
      GRID_GENERATOR,
      'building',
    ),
  ),
  ...(['1', '2'] as const).map((l) =>
    generated(
      forestTileId(l),
      [32, 32],
      `Dark pine forest ${l}`,
      `grid/forest-${l}.png`,
      GRID_GENERATOR,
      'building',
    ),
  ),
  ...(['1', '2'] as const).map((l) =>
    generated(
      ruinTileId(l),
      [32, 32],
      `Ruined stones ${l}`,
      `grid/ruin-${l}.png`,
      GRID_GENERATOR,
      'building',
    ),
  ),
  ...(['locked', 'dormant'] as const).map((l) =>
    generated(
      ghostTileId(l),
      [32, 32],
      `Foundation outline, ${l}`,
      `grid/ghost-${l}.png`,
      GRID_GENERATOR,
      'building',
    ),
  ),
  ...(['north', 'south'] as const).map((e) =>
    generated(
      gridStripId(e),
      [256, 16],
      e === 'north' ? 'The Fell Breach' : 'The Lowland Gate',
      `grid/strip-${e}.png`,
      GRID_GENERATOR,
      'scene',
    ),
  ),
  // v1.1 TL.5b: defenses, level buildings and the Hearth Hall (tools/draw-grid-*.ts).
  ...Array.from({ length: 16 }, (_, m) =>
    generated(
      gridWallId(m),
      [32, 32],
      `Wall segment, connections ${m}`,
      `grid/wall-${m}.png`,
      GRID_GENERATOR,
      'building',
    ),
  ),
  generated(
    GRID_WATCHTOWER_ID,
    [32, 32],
    'Watchtower',
    'grid/watchtower.png',
    GRID_GENERATOR,
    'building',
  ),
  generated(
    GRID_TROPHY_HALL_ID,
    [32, 32],
    'Trophy Hall',
    'grid/trophy-hall.png',
    GRID_GENERATOR,
    'building',
  ),
  ...GRID_TIERED.flatMap((b) =>
    [1, 2, 3].map((t) =>
      generated(
        gridTierId(b, t),
        [32, 32],
        `${titled(b)}, tier ${t}`,
        `grid/${b}-${t}.png`,
        GRID_GENERATOR,
        'building',
      ),
    ),
  ),
  ...AGE_IDS.map((a) =>
    generated(
      gridHallId(a),
      [64, 64],
      `Hearth Hall at ${titled(a)}`,
      `grid/hearth-hall-${a}.png`,
      GRID_GENERATOR,
      'scene',
    ),
  ),
  ...AGE_IDS.map((a) =>
    generated(
      gridHallFrostId(a),
      [64, 64],
      `Frost on the Hearth Hall at ${titled(a)}`,
      `grid/hearth-hall-frost-${a}.png`,
      GRID_GENERATOR,
      'scene',
    ),
  ),
  generated(
    GRID_HALL_DOOR_ID,
    [64, 64],
    'Carved Hearth Hall door',
    'grid/hearth-hall-door.png',
    GRID_GENERATOR,
    'scene',
  ),
  generated(
    GRID_HALL_LAMP_ID,
    [64, 64],
    'Lamp in the Hearth Hall window',
    'grid/hearth-hall-lamp.png',
    GRID_GENERATOR,
    'scene',
  ),
  // v1.1 TL.5c: count-building plots and the grid's cosmetics (tools/draw-grid-plots.ts).
  ...GRID_PLOTS.flatMap((b) =>
    [1, 2, 3].map((d) =>
      generated(
        gridTierId(b, d),
        [32, 32],
        `${titled(b)} plot, density ${d}`,
        `grid/${b}-${d}.png`,
        GRID_GENERATOR,
        'building',
      ),
    ),
  ),
  ...[1, 2].map((l) =>
    generated(
      gridTierId('silver-seam', l),
      [32, 32],
      `Silver Seam ${l}`,
      `grid/silver-seam-${l}.png`,
      GRID_GENERATOR,
      'building',
    ),
  ),
  ...GRID_COSMETIC_IDS.map((c) =>
    generated(
      gridCosmeticId(c),
      c === 'banners' || c === 'lanterns-border' ? [256, 16] : [32, 32],
      `${titled(c)} on the grid`,
      `grid/cosmetic-${c}.png`,
      GRID_GENERATOR,
      c === 'banners' || c === 'lanterns-border' ? 'scene' : 'building',
    ),
  ),
  generated(
    GRID_WALL_FROST_ID,
    [32, 32],
    'Frost on a wall segment',
    'grid/frost-wall.png',
    GRID_GENERATOR,
    'building',
  ),
  ...HOLD_LOOKS.flatMap((l) =>
    AGE_IDS.map((a) =>
      generated(
        holdLookId(l, a),
        [160, 64],
        `${titled(l)} on the hold at ${titled(a)}`,
        `scenes/look/${a}-${l}.png`,
        'tools/gen-sprites.ts',
        'scene',
      ),
    ),
  ),
];

export const assetById: ReadonlyMap<string, AssetEntry> = new Map(assets.map((a) => [a.id, a]));
