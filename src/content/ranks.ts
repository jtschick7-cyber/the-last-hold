import type { BalanceKey } from './balance';

// GDD §5.11.3 (v0.8, D309, D310): hunter ranks and stars. The order's titles Apprentice →
// Wright → Master-Wright; the hold's Ranks (Hamlet … Bastion) keep their name. A rank is read
// from the highest level ever reached plus trophies of any family, spent from the trophies on
// hand. Ranks, stars and talents are kept forever. Content outside the saved-state id lists
// until T8.5 (D171).

export const HUNTER_RANK_IDS = ['apprentice', 'wright', 'masterWright'] as const;
export type HunterRank = (typeof HUNTER_RANK_IDS)[number];

export interface HunterRankDef {
  readonly id: HunterRank;
  readonly name: string;
  /** The highest level ever needed, and the trophies spent; null for the first rank. */
  readonly levelKey: BalanceKey | null;
  readonly trophiesKey: BalanceKey | null;
  /** The field of `talent.points` giving the talent points in all at this rank. */
  readonly pointsField: 'apprentice' | 'wright' | 'masterWright';
  /** What rising to this rank gives, in words (GDD §5.11.3). */
  readonly gives: string;
}

export const hunterRanks: Readonly<Record<HunterRank, HunterRankDef>> = {
  apprentice: {
    id: 'apprentice',
    name: 'Apprentice',
    levelKey: null,
    trophiesKey: null,
    pointsField: 'apprentice',
    gives: '1 talent point',
  },
  wright: {
    id: 'wright',
    name: 'Wright',
    levelKey: 'rank.wrightLevel',
    trophiesKey: 'rank.wrightTrophies',
    pointsField: 'wright',
    gives: 'The use-skill; 3 talent points in all',
  },
  masterWright: {
    id: 'masterWright',
    name: 'Master-Wright',
    levelKey: 'rank.masterLevel',
    trophiesKey: 'rank.masterTrophies',
    pointsField: 'masterWright',
    gives: '5 talent points in all',
  },
};

/**
 * Stars: star n costs `star.embersPerStar` × n Embers and `star.trophiesPerStar` × n trophies,
 * up to `star.max`; each adds `star.growthPerStar` to the Health and Might growth per level; stars
 * open talent tiers by `talent.tierStars` (D310).
 */
export const STAR_KEYS = {
  max: 'star.max',
  embers: 'star.embersPerStar',
  trophies: 'star.trophiesPerStar',
  growth: 'star.growthPerStar',
  tierStars: 'talent.tierStars',
} as const satisfies Record<string, BalanceKey>;
