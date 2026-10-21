import type { BossId } from '../../content/great-beasts';
import type { HunterId } from '../../content/hunters';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { runFight, type HunterSnapshot } from '../combat';
import { explainFight } from '../combat/summary';
import { bossOddsSeed, eventSuggestSeed } from '../contracts/seeds';
import { seeded, seedBank } from '../rng';
import { at, HIGH, LOW, MID } from '../stand/preview';
import { skillLevel } from '../skills/skills';
import { noPreparation, type GameState, type Preparation } from '../state/game-state';
import { bossOfVisit, poolAtTier, poolNow, visitTier } from './boss';
import { eligibleHunters } from './events';
import { snapshotOf } from './hunters';
import { constantAt } from '../balance-access';

// GDD §5.12.4, §6.5 (plan T9.7, D391): the boss preview and Suggest for events. Both run the same
// fight the real attempt does (the Great Beast's Health is the pool still standing) on their own
// dice, so neither reveals the real roll. A boss has no win chance, so everything here is damage.

export interface BossPreviewInput {
  readonly gameSeed: string;
  readonly visit: number;
  readonly boss: BossId;
  readonly tier: number;
  /** The pool the visit began with, for the milestone marks. */
  readonly poolStart: number;
  /** The pool still standing: the boss's Health at launch. */
  readonly pool: number;
  /** Milestones already paid this visit. */
  readonly paid: number;
  readonly party: readonly HunterSnapshot[];
  readonly prep?: Preparation;
  readonly alchemy?: number;
  /** Overrides `boss.previewSamples` (the main-thread fallback uses fewer). */
  readonly samples?: number;
}

export interface BossPreview {
  readonly samples: number;
  readonly boss: BossId;
  readonly tier: number;
  readonly poolBefore: number;
  /** Damage dealt: the median and the 10th–90th percentile range. */
  readonly median: number;
  readonly p10: number;
  readonly p90: number;
  /** The same, as a share of the pool still standing. */
  readonly share: { readonly median: number; readonly p10: number; readonly p90: number };
  /** Milestone marks the typical attempt would newly bring (e.g. 0.5). */
  readonly wouldPay: readonly number[];
  /** The next unpaid mark, or null when every one is paid. */
  readonly nextMark: number | null;
  readonly why: Breakdown;
}

const damageOf = (
  input: Pick<BossPreviewInput, 'boss' | 'tier' | 'pool' | 'prep' | 'alchemy'>,
  party: readonly HunterSnapshot[],
  rolls: ReturnType<typeof seeded>,
): number => {
  const f = runFight({
    party,
    monster: { event: input.boss, tier: input.tier, healthOverride: input.pool },
    location: null, // no location traits, as in the real attempt
    rolls,
    log: false,
    prep: input.prep,
    alchemy: input.alchemy,
  });
  // The same rule as the attempt: the pool never rises, and what the party dealt is what it lost.
  return input.pool - Math.max(0, Math.min(input.pool, f.monsterHealth));
};

const marksOf = (): readonly number[] => constantAt('boss.milestones').value as readonly number[];

export const previewBoss = (input: BossPreviewInput): BossPreview => {
  const n = input.samples ?? num('boss.previewSamples');
  const ids = input.party.map((h) => h.id);
  const dealt: number[] = [];
  for (let i = 0; i < n; i++)
    dealt.push(
      damageOf(input, input.party, seeded(bossOddsSeed(input.gameSeed, input.visit, ids, i))),
    );
  dealt.sort((a, b) => a - b);
  const median = at(dealt, MID);
  const p10 = at(dealt, LOW);
  const p90 = at(dealt, HIGH);
  const marks = marksOf();
  const killed = median >= input.pool;
  // The same crossing rule as the attempt (boss.ts): damage taken since the visit began.
  const taken = input.poolStart - (input.pool - median);
  const crossed = marks.filter((m, i) =>
    i === marks.length - 1 ? killed : taken >= m * input.poolStart,
  ).length;
  const wouldPay = marks.slice(input.paid, crossed);
  const share = (d: number): number => (input.pool > 0 ? d / input.pool : 0);
  const rows = explainFight(
    {
      party: input.party,
      monster: { event: input.boss, tier: input.tier, healthOverride: input.pool },
      location: null,
      rolls: seeded('why'),
      prep: input.prep,
      alchemy: input.alchemy,
    },
    0,
  );
  return {
    samples: n,
    boss: input.boss,
    tier: input.tier,
    poolBefore: input.pool,
    median,
    p10,
    p90,
    share: { median: share(median), p10: share(p10), p90: share(p90) },
    wouldPay,
    nextMark: marks[input.paid] ?? null,
    why: {
      label: 'Why this damage',
      value: median,
      formula: `the median of ${n} practice fights on their own dice; the rows below are averages only`,
      children: rows.children ?? [],
    },
  };
};

/** What the preview needs, from the save: the tier a visit would have now and the pool standing. */
export const bossPreviewInput = (
  state: GameState,
  party: readonly HunterId[],
  prep: Preparation = noPreparation(),
): BossPreviewInput => {
  const tier = visitTier(state);
  return {
    gameSeed: state.meta.gameSeed,
    visit: state.events.boss.visit,
    boss: bossOfVisit(state.events.boss.visit),
    tier,
    poolStart: poolAtTier(tier),
    pool: poolNow(state),
    paid: state.events.boss.paid,
    party: party.map((id) => snapshotOf(state, id)),
    prep,
    alchemy: skillLevel(state, 'alchemy'),
  };
};

export interface BossSuggestInput {
  readonly gameSeed: string;
  readonly visit: number;
  readonly boss: BossId;
  readonly tier: number;
  readonly poolStart: number;
  readonly pool: number;
  readonly paid: number;
  /** Hunters who can attend now; the caller has already removed anyone who cannot. */
  readonly available: readonly HunterSnapshot[];
  readonly maxParty: number;
  readonly prep?: Preparation;
  readonly alchemy?: number;
  /** Damage a party's typical stage-1 attempt must reach for the search to stop (D391). */
  readonly floor: number;
  /** Parties tried at most (`events.suggestTries`): the full search of 14 hunters is 1,001 parties. */
  readonly tries: number;
}

export interface BossSuggestion {
  readonly party: readonly HunterSnapshot[];
  /** The party's typical damage over the shared stage-1 fights. */
  readonly stage1Median: number;
  readonly preview: BossPreview;
  /** Parties tried before the search stopped. */
  readonly considered: number;
  /** True when the search stopped at a party that cleared the floor. */
  readonly stoppedEarly: boolean;
}

/** Every party of exactly `size` hunters in the order given: the strongest hunters come first. */
export function* partiesOf<T>(from: readonly T[], size: number): Generator<T[]> {
  const chosen: T[] = [];
  function* walk(start: number): Generator<T[]> {
    if (chosen.length === size) {
      yield [...chosen];
      return;
    }
    for (let i = start; i <= from.length - (size - chosen.length); i++) {
      chosen.push(from[i] as T);
      yield* walk(i + 1);
      chosen.pop();
    }
  }
  yield* walk(0);
}

/**
 * GDD §5.12.4: parties are tried in a fixed order (highest level first, then roster order) on the
 * same stage-1 dice, and the search stops at the first whose typical attempt clears the floor, or
 * after `tries` parties. If none cleared it, the best seen wins (ties to the earlier). Only the winner pays for the full preview.
 */
export const suggestBossParty = (input: BossSuggestInput): BossSuggestion | null => {
  if (input.available.length === 0) return null;
  const ordered = input.available
    .map((h, i) => ({ h, i }))
    .sort((a, b) => b.h.level - a.h.level || a.i - b.i)
    .map((x) => x.h);
  const size = Math.min(input.maxParty, ordered.length);
  const stage1 = num('suggest.stage1Samples');
  const bank = seedBank(
    Array.from({ length: stage1 }, (_, i) =>
      eventSuggestSeed(input.gameSeed, String(input.visit), i),
    ),
  );
  let best: { party: HunterSnapshot[]; median: number } | null = null;
  let considered = 0;
  let stoppedEarly = false;
  for (const party of partiesOf(ordered, size)) {
    considered += 1;
    const dealt: number[] = [];
    for (let i = 0; i < stage1; i++) dealt.push(damageOf(input, party, bank(i)));
    dealt.sort((a, b) => a - b);
    const median = at(dealt, MID);
    if (!best || median > best.median) best = { party, median };
    if (median >= input.floor || considered >= input.tries) {
      // Cleared the floor: this party wins at once. Out of tries: the best seen wins.
      if (median >= input.floor) {
        stoppedEarly = true;
        best = { party, median };
      }
      break;
    }
  }
  if (!best) return null;
  return {
    party: best.party,
    stage1Median: best.median,
    preview: previewBoss({ ...input, party: best.party }),
    considered,
    stoppedEarly,
  };
};

/** Suggest's inputs from the save: only the hunters who can attend now (never an ineligible one). */
export const bossSuggestInput = (
  state: GameState,
  now: number,
  prep?: Preparation,
): BossSuggestInput => {
  const tier = visitTier(state);
  const poolStart = poolAtTier(tier);
  return {
    gameSeed: state.meta.gameSeed,
    visit: state.events.boss.visit,
    boss: bossOfVisit(state.events.boss.visit),
    tier,
    poolStart,
    pool: poolNow(state),
    paid: state.events.boss.paid,
    available: eligibleHunters(state, now).map((id) => snapshotOf(state, id)),
    maxParty: num('boss.partySize'),
    prep,
    alchemy: skillLevel(state, 'alchemy'),
    floor: Math.round(num('events.suggestFloor') * poolStart),
    tries: num('events.suggestTries'),
  };
};
