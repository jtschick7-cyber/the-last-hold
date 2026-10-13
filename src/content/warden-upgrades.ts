import type { ResourceBundle } from './resources';

// GDD §5.9.5 and §8.9 (D111): the warden upgrades on The Hearth, bought with
// Embers. Level L costs `cost × growth^(L−1)`. Every value is tunable (D44:
// per-item numbers live with the content). Production bonuses go in the ember
// bucket and never touch silver (G1). Wired in by T4.9.
export const UPGRADE_IDS = [
  'kept-coals',
  'full-larder',
  'young-families',
  'old-hands',
  'drill-yard',
  'village-goodwill',
  'swift-roads',
  'late-lantern',
] as const;
export type UpgradeId = (typeof UPGRADE_IDS)[number];

/** What one level of an upgrade does. */
export type UpgradeEffect =
  /** +share of all production except silver (ember bucket). */
  | { readonly kind: 'allProduction'; readonly perLevel: number }
  /** Each new cycle starts with these extra resources. */
  | { readonly kind: 'startResources'; readonly perLevel: ResourceBundle }
  /** Each new cycle starts with extra Cottages and peasants. */
  | { readonly kind: 'startHousing'; readonly cottages: number; readonly peasants: number }
  /** +share of hunter levels kept at the Long Night, on top of `longNight.levelsKept`. */
  | { readonly kind: 'levelsKept'; readonly perLevel: number }
  /** +share of contract XP. */
  | { readonly kind: 'contractXp'; readonly perLevel: number }
  /** +share of bounty silver (bounties only; seams untouched, G1). */
  | { readonly kind: 'bounty'; readonly perLevel: number }
  /** Contracts take this share less time. */
  | { readonly kind: 'contractDuration'; readonly perLevel: number }
  /** +seconds of offline cap, still within `offline.ceiling`. */
  | { readonly kind: 'offlineCap'; readonly perLevel: number };

export interface UpgradeDef {
  readonly id: UpgradeId;
  readonly name: string;
  readonly effect: UpgradeEffect;
  readonly maxLevel: number;
  /** Embers for level 1. */
  readonly cost: number;
  /** Each further level costs this much more. */
  readonly growth: number;
}

const HOUR = 3600; // seconds

export const upgrades: Readonly<Record<UpgradeId, UpgradeDef>> = {
  'kept-coals': {
    id: 'kept-coals',
    name: 'Kept Coals',
    effect: { kind: 'allProduction', perLevel: 0.1 },
    maxLevel: 10,
    cost: 15,
    growth: 1.5,
  },
  'full-larder': {
    id: 'full-larder',
    name: 'Full Larder',
    effect: { kind: 'startResources', perLevel: { food: 200, wood: 200 } },
    maxLevel: 5,
    cost: 10,
    growth: 1.6,
  },
  'young-families': {
    id: 'young-families',
    name: 'Young Families',
    effect: { kind: 'startHousing', cottages: 1, peasants: 2 },
    maxLevel: 5,
    cost: 20,
    growth: 1.6,
  },
  'old-hands': {
    id: 'old-hands',
    name: 'Old Hands',
    effect: { kind: 'levelsKept', perLevel: 0.1 },
    maxLevel: 5,
    cost: 30,
    growth: 1.8,
  },
  'drill-yard': {
    id: 'drill-yard',
    name: 'Drill Yard',
    effect: { kind: 'contractXp', perLevel: 0.1 },
    maxLevel: 5,
    cost: 15,
    growth: 1.6,
  },
  'village-goodwill': {
    id: 'village-goodwill',
    name: 'Village Goodwill',
    effect: { kind: 'bounty', perLevel: 0.05 },
    maxLevel: 5,
    cost: 25,
    growth: 1.7,
  },
  'swift-roads': {
    id: 'swift-roads',
    name: 'Swift Roads',
    effect: { kind: 'contractDuration', perLevel: 0.1 },
    maxLevel: 3,
    cost: 25,
    growth: 1.8,
  },
  'late-lantern': {
    id: 'late-lantern',
    name: 'Late Lantern',
    effect: { kind: 'offlineCap', perLevel: 1 * HOUR },
    maxLevel: 4,
    cost: 20,
    growth: 2,
  },
};
