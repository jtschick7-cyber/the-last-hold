import { hunters, type HunterId } from '../../content/hunters';
import { hunterRanks, type HunterRank } from '../../content/ranks';
import { constantAt, num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState, HunterState } from '../state/game-state';

// GDD §5.11.3 (v0.8, D309, D310, D328 (3), (4)): hunter ranks and stars. A rank is read from the
// highest level the hunter has ever reached plus trophies of any family, spent from the trophies on
// hand this cycle (earned minus spent). Spending never lowers the Trophy Hall count or the Embers
// conversion, which count trophies earned (A7). Ranks, stars and talents are kept forever.

/** Trophies earned this cycle minus those spent on ranks and stars, never below 0. */
export const trophiesOnHand = (state: GameState): number =>
  Math.max(0, state.stats.trophies - state.stats.trophiesSpent);

/** The highest level a hunter has ever reached (D155), at least their level now. */
export const peakLevel = (state: GameState, id: HunterId): number =>
  Math.max(state.story.peakLevels[id] ?? 0, state.hunters[id]?.level ?? 0);

export const RANK_ORDER: readonly HunterRank[] = ['apprentice', 'wright', 'masterWright'];

export const nextRank = (rank: HunterRank): HunterRank | null =>
  RANK_ORDER[RANK_ORDER.indexOf(rank) + 1] ?? null;

/** Talent points in all at a rank (`talent.points`, locked). */
export const talentPointsAt = (rank: HunterRank): number => {
  const points = constantAt('talent.points').value as Readonly<Record<HunterRank, number>>;
  return points[hunterRanks[rank].pointsField];
};

/** Points not yet spent on talents. */
export const unspentTalentPoints = (h: HunterState): number =>
  Math.max(0, talentPointsAt(h.rank) - h.talents.length);

/** The talent tier a hunter's stars open: tier 1 always, tier 2 at 2 stars, tier 3 at 4 (`talent.tierStars`). */
export const tiersOpen = (stars: number): number => {
  const tierStars = constantAt('talent.tierStars').value as readonly number[];
  return tierStars.filter((s) => stars >= s).length;
};

/** The stat-growth share per level: `hunter.levelStatGrowth` plus `star.growthPerStar` for each star. */
export const growthPerLevel = (stars: number): number =>
  num('hunter.levelStatGrowth') + num('star.growthPerStar') * stars;

export interface ProgressView {
  /** What it would give, or null when there is nothing left to buy. */
  readonly label: string;
  readonly available: boolean;
  /** Why not, in the hunter-sheet's words; null when available. */
  readonly reason: string | null;
  readonly trophies: Explained;
  /** Stars only. */
  readonly embers: Explained | null;
}

const leaf = (label: string, value: number, formula: string, key: Breakdown['key']): Explained => ({
  value,
  breakdown: { label, value, formula, key },
});

/** Rank up: the next rank, what it needs, and why it can't be done now (GDD §9.16). */
export const rankUpView = (state: GameState, id: HunterId): ProgressView | null => {
  const h = state.hunters[id];
  if (!h) return null;
  const next = nextRank(h.rank);
  if (!next) {
    return {
      label: 'Master-Wright',
      available: false,
      reason: 'Already a Master-Wright.',
      trophies: leaf('Trophies', 0, '—', undefined),
      embers: null,
    };
  }
  const def = hunterRanks[next];
  const needLevel = num(def.levelKey ?? 'rank.wrightLevel');
  const cost = num(def.trophiesKey ?? 'rank.wrightTrophies');
  const peak = peakLevel(state, id);
  let reason: string | null = null;
  if (peak < needLevel) reason = `needs highest level ${needLevel}`;
  else if (trophiesOnHand(state) < cost) reason = `needs ${cost} trophies`;
  return {
    label: def.name,
    available: reason === null,
    reason,
    trophies: leaf(
      `${def.name}: trophies`,
      cost,
      `${def.trophiesKey}`,
      def.trophiesKey ?? undefined,
    ),
    embers: null,
  };
};

/** Star n costs `star.embersPerStar` × n Embers and `star.trophiesPerStar` × n trophies (D310). */
export const starView = (state: GameState, id: HunterId): ProgressView | null => {
  const h = state.hunters[id];
  if (!h) return null;
  const max = num('star.max');
  const n = h.stars + 1;
  if (n > max) {
    return {
      label: `${max} stars`,
      available: false,
      reason: `Already at ${max} stars.`,
      trophies: leaf('Trophies', 0, '—', undefined),
      embers: leaf('Embers', 0, '—', undefined),
    };
  }
  const embers = num('star.embersPerStar') * n;
  const trophies = num('star.trophiesPerStar') * n;
  let reason: string | null = null;
  if (state.embers < embers) reason = `needs ${embers} Embers`;
  else if (trophiesOnHand(state) < trophies) reason = `needs ${trophies} trophies`;
  return {
    label: `Star ${n}`,
    available: reason === null,
    reason,
    trophies: leaf(
      `Star ${n}: trophies`,
      trophies,
      `${num('star.trophiesPerStar')} × ${n}`,
      'star.trophiesPerStar',
    ),
    embers: leaf(
      `Star ${n}: Embers`,
      embers,
      `${num('star.embersPerStar')} × ${n}`,
      'star.embersPerStar',
    ),
  };
};

export const hunterName = (id: HunterId): string => hunters[id].shortName;
