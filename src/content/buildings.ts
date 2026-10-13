import type { AgeId } from './ages';
import type { BalanceKey } from './balance';
import type { JobId } from './jobs';
import type { ResourceBundle, ResourceId } from './resources';

// GDD §5.1.2: the v0.1 buildings. Costs are base values (D44: per-item numbers
// live here and are tunable). Count buildings cost base × r^n, level buildings
// base × r^(L−1), with r from balance.costGrowth.
export const BUILDING_IDS = [
  'hearth-hall',
  'cottage',
  'farm',
  'woodcutters-camp',
  'mine',
  'silver-seam',
  'mill',
  'sawpit',
  'smithy',
  'bell-tower',
  'barracks',
  'trophy-hall',
  'hunters-lodge',
  'alchemists-hut',
  'herb-garden',
] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export type BuildingEffect =
  | { readonly kind: 'housing'; readonly amount: number }
  | { readonly kind: 'jobSlots'; readonly job: JobId; readonly amount: number }
  /** +perLevel production of a resource per level, in the building bucket. */
  | { readonly kind: 'production'; readonly resource: ResourceId; readonly perLevelKey: BalanceKey }
  /** Extends the offline cap per level (GDD §5.2). */
  | { readonly kind: 'offlineCap'; readonly perLevelKey: BalanceKey }
  /** Raises the active-roster cap by this much per level (GDD §5.3.1, G5). */
  | { readonly kind: 'rosterCap'; readonly perLevel: number }
  /** +this much to all production except silver per trophy earned this cycle (GDD §5.4.4). */
  | { readonly kind: 'trophyBonus'; readonly perTrophyKey: BalanceKey }
  /** Investigation slots: this many per level (GDD §5.6.3, v0.3). */
  | { readonly kind: 'investigationSlots'; readonly perLevel: number }
  /** Kettles: this many brews at a time per level (GDD §5.7, v0.3). */
  | { readonly kind: 'brewSlots'; readonly perLevel: number }
  /** Grows one of each herb per copy every `intervalKey` seconds (GDD §5.7, v0.3). */
  | { readonly kind: 'herbGrowth'; readonly intervalKey: BalanceKey };

interface BuildingBase {
  readonly id: BuildingId;
  readonly name: string;
  /** Effects per copy (count buildings) or per level (level buildings). */
  readonly effects: readonly BuildingEffect[];
  /** The first Age in which it can be built. */
  readonly availableFrom: AgeId;
}

export interface UniqueBuilding extends BuildingBase {
  readonly kind: 'unique';
}

export interface CountBuilding extends BuildingBase {
  readonly kind: 'count';
  readonly baseCost: ResourceBundle;
  /** A locked cap on copies, when there is one (Silver Seam, G1). */
  readonly maxCountKey?: BalanceKey;
  /** A cap that belongs to the building itself: 1 for the Trophy Hall (GDD §8.1 "Unique"). */
  readonly maxCount?: number;
}

export interface LevelBuilding extends BuildingBase {
  readonly kind: 'level';
  readonly baseCost: ResourceBundle;
  /** Highest level allowed in each Age; missing Ages mean "not available". */
  readonly maxLevel: Readonly<Partial<Record<AgeId, number>>>;
}

export type BuildingDef = UniqueBuilding | CountBuilding | LevelBuilding;

export const buildings: Readonly<Record<BuildingId, BuildingDef>> = {
  'hearth-hall': {
    id: 'hearth-hall',
    name: 'Hearth Hall',
    kind: 'unique',
    effects: [{ kind: 'housing', amount: 3 }],
    availableFrom: 'hamlet',
  },
  cottage: {
    id: 'cottage',
    name: 'Cottage',
    kind: 'count',
    baseCost: { wood: 30, food: 10 },
    effects: [{ kind: 'housing', amount: 2 }],
    availableFrom: 'hamlet',
  },
  farm: {
    id: 'farm',
    name: 'Farm',
    kind: 'count',
    baseCost: { wood: 40 },
    effects: [{ kind: 'jobSlots', job: 'farmer', amount: 3 }],
    availableFrom: 'hamlet',
  },
  'woodcutters-camp': {
    id: 'woodcutters-camp',
    name: "Woodcutter's Camp",
    kind: 'count',
    baseCost: { wood: 25, food: 15 },
    effects: [{ kind: 'jobSlots', job: 'woodcutter', amount: 3 }],
    availableFrom: 'hamlet',
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    kind: 'count',
    baseCost: { wood: 80, food: 40 },
    effects: [{ kind: 'jobSlots', job: 'miner', amount: 2 }],
    availableFrom: 'hamlet',
  },
  'silver-seam': {
    id: 'silver-seam',
    name: 'Silver Seam',
    kind: 'count',
    baseCost: { wood: 150, iron: 120 },
    effects: [{ kind: 'jobSlots', job: 'silver-digger', amount: 1 }],
    availableFrom: 'hamlet',
    maxCountKey: 'silverSeam.max',
  },
  mill: {
    id: 'mill',
    name: 'Mill',
    kind: 'level',
    baseCost: { wood: 120, iron: 40 },
    effects: [{ kind: 'production', resource: 'food', perLevelKey: 'mill.perLevel' }],
    availableFrom: 'hamlet',
    maxLevel: { hamlet: 5, keep: 10 },
  },
  sawpit: {
    id: 'sawpit',
    name: 'Sawpit',
    kind: 'level',
    baseCost: { wood: 100, iron: 60 },
    effects: [{ kind: 'production', resource: 'wood', perLevelKey: 'sawpit.perLevel' }],
    availableFrom: 'hamlet',
    maxLevel: { hamlet: 5, keep: 10 },
  },
  smithy: {
    id: 'smithy',
    name: 'Smithy',
    kind: 'level',
    baseCost: { wood: 200, iron: 150 },
    // GDD §5.1.2: also unlocks gear tiers, from v0.2.
    effects: [{ kind: 'production', resource: 'iron', perLevelKey: 'smithy.ironPerLevel' }],
    availableFrom: 'hamlet',
    maxLevel: { hamlet: 3, keep: 10 },
  },
  'bell-tower': {
    id: 'bell-tower',
    name: 'Bell Tower',
    kind: 'level',
    baseCost: { wood: 1500, iron: 800, silver: 150 },
    effects: [{ kind: 'offlineCap', perLevelKey: 'bellTower.perLevel' }],
    availableFrom: 'keep',
    maxLevel: { keep: 3 },
  },
  // GDD §8.1 (v0.2): both Keep.
  barracks: {
    id: 'barracks',
    name: 'Barracks',
    kind: 'level',
    baseCost: { wood: 600, iron: 300, silver: 100 },
    effects: [{ kind: 'rosterCap', perLevel: 1 }],
    availableFrom: 'keep',
    maxLevel: { keep: 5 },
  },
  'trophy-hall': {
    id: 'trophy-hall',
    name: 'Trophy Hall',
    kind: 'count',
    baseCost: { wood: 500, iron: 200 },
    effects: [{ kind: 'trophyBonus', perTrophyKey: 'trophyHall.perTrophy' }],
    availableFrom: 'keep',
    maxCount: 1,
  },
  // GDD §8.1 (v0.3): all Keep.
  'hunters-lodge': {
    id: 'hunters-lodge',
    name: "Hunter's Lodge",
    kind: 'level',
    baseCost: { wood: 800, iron: 400, silver: 200 },
    effects: [{ kind: 'investigationSlots', perLevel: 1 }],
    availableFrom: 'keep',
    maxLevel: { keep: 3 },
  },
  'alchemists-hut': {
    id: 'alchemists-hut',
    name: "Alchemist's Hut",
    kind: 'level',
    baseCost: { wood: 700, iron: 300, silver: 150 },
    effects: [{ kind: 'brewSlots', perLevel: 1 }],
    availableFrom: 'keep',
    maxLevel: { keep: 5 },
  },
  'herb-garden': {
    id: 'herb-garden',
    name: 'Herb Garden',
    kind: 'count',
    baseCost: { wood: 300, food: 100 },
    effects: [{ kind: 'herbGrowth', intervalKey: 'herbGarden.interval' }],
    availableFrom: 'keep',
  },
};
