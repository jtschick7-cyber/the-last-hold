import type { HunterId } from '../../content/hunters';
import { hunts, type HuntId, type TrackId } from '../../content/hunts';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { runFight, type HunterSnapshot } from '../combat';
import { explainFight } from '../combat/summary';
import { marginFor } from '../contracts/odds';
import { eventSuggestSeed, huntOddsSeed } from '../contracts/seeds';
import { seeded, seedBank } from '../rng';
import { skillLevel } from '../skills/skills';
import { noPreparation, type GameState, type Preparation } from '../state/game-state';
import { snapshotOf } from './hunters';
import { legalHunters, trackOf, trackTier } from './hunt';
import { partiesOf } from './boss-odds';

// GDD §5.12.6, §9.17 (plan T9.8): the odds panel for a hunt track. n practice fights on their own
// dice give an ordinary win chance and an "unprepared would be X%" line. No Reckless line: nobody
// is hurt. The prepared and unprepared runs share their dice (D98).

export interface HuntOddsInput {
  readonly gameSeed: string;
  readonly hunt: HuntId;
  readonly track: 1 | 2 | 3;
  readonly tier: number;
  readonly party: readonly HunterSnapshot[];
  readonly prep?: Preparation;
  readonly alchemy?: number;
  /** Overrides `odds.samples`. */
  readonly samples?: number;
}

export interface HuntOdds {
  readonly samples: number;
  readonly winChance: number;
  /** ±1.96 × √(p(1−p)/n), as the contract panel (GDD §7.4). */
  readonly margin: number;
  /** The win chance with nothing carried; equal to `winChance` when nothing is carried. */
  readonly unpreparedWinChance: number;
  readonly why: Breakdown;
}

const winRate = (input: HuntOddsInput, prep: Preparation | undefined, n: number): number => {
  const ids = input.party.map((h) => h.id);
  let wins = 0;
  for (let i = 0; i < n; i++) {
    const r = runFight({
      party: input.party,
      monster: { event: hunts[input.hunt].quarry, tier: input.tier },
      location: null,
      rolls: seeded(huntOddsSeed(input.gameSeed, input.hunt, input.track, ids, i)),
      log: false,
      prep,
      alchemy: input.alchemy,
    });
    if (r.result === 'win') wins += 1;
  }
  return wins / n;
};

export const computeHuntOdds = (input: HuntOddsInput): HuntOdds => {
  const n = input.samples ?? num('odds.samples');
  const winChance = winRate(input, input.prep, n);
  const carries =
    input.prep !== undefined && JSON.stringify(input.prep) !== JSON.stringify(noPreparation());
  return {
    samples: n,
    winChance,
    margin: marginFor(winChance, n),
    unpreparedWinChance: carries ? winRate(input, undefined, n) : winChance,
    why: explainFight(
      {
        party: input.party,
        monster: { event: hunts[input.hunt].quarry, tier: input.tier },
        location: null,
        rolls: seeded('why'),
        prep: input.prep,
        alchemy: input.alchemy,
      },
      winChance,
    ),
  };
};

/** What the odds panel needs, from the save. */
export const huntOddsInput = (
  state: GameState,
  track: TrackId,
  party: readonly HunterId[],
  prep: Preparation = noPreparation(),
): HuntOddsInput => {
  const t = trackOf(track);
  return {
    gameSeed: state.meta.gameSeed,
    hunt: t.hunt,
    track: t.track.number,
    tier: trackTier(t.track),
    party: party.map((id) => snapshotOf(state, id)),
    prep,
    alchemy: skillLevel(state, 'alchemy'),
  };
};

export interface HuntSuggestInput {
  readonly gameSeed: string;
  readonly hunt: HuntId;
  readonly track: 1 | 2 | 3;
  readonly tier: number;
  /** Hunters who can attend this track now; the caller has already removed anyone who cannot. */
  readonly available: readonly HunterSnapshot[];
  readonly maxParty: number;
  readonly prep?: Preparation;
  readonly alchemy?: number;
  /** Parties tried at most (`events.suggestTries`). */
  readonly tries: number;
}

export interface HuntSuggestion {
  readonly party: readonly HunterSnapshot[];
  readonly odds: HuntOdds;
  readonly considered: number;
  /** True when the search stopped at a party that won every shared stage-1 fight. */
  readonly stoppedEarly: boolean;
}

/**
 * GDD §5.12.6, §6.5: Suggest for a hunt. Parties of the largest size are tried in a fixed order
 * (highest level first, then roster order) on the same stage-1 dice, stopping at the first that wins
 * them all or after `tries` parties; the best seen wins, ties to the earlier. Only the winner pays
 * for the full odds panel.
 */
export const suggestHuntParty = (input: HuntSuggestInput): HuntSuggestion | null => {
  if (input.available.length === 0) return null;
  const ordered = input.available
    .map((h, i) => ({ h, i }))
    .sort((a, b) => b.h.level - a.h.level || a.i - b.i)
    .map((x) => x.h);
  const size = Math.min(input.maxParty, ordered.length);
  const stage1 = num('suggest.stage1Samples');
  const bank = seedBank(
    Array.from({ length: stage1 }, (_, i) =>
      eventSuggestSeed(input.gameSeed, `${input.hunt}:${input.track}`, i),
    ),
  );
  const wins = (party: readonly HunterSnapshot[]): number => {
    let w = 0;
    for (let i = 0; i < stage1; i++) {
      const r = runFight({
        party,
        monster: { event: hunts[input.hunt].quarry, tier: input.tier },
        location: null,
        rolls: bank(i),
        log: false,
        prep: input.prep,
        alchemy: input.alchemy,
      });
      if (r.result === 'win') w += 1;
    }
    return w;
  };
  let best: { party: HunterSnapshot[]; wins: number } | null = null;
  let considered = 0;
  let stoppedEarly = false;
  for (const party of partiesOf(ordered, size)) {
    considered += 1;
    const w = wins(party);
    if (!best || w > best.wins) best = { party, wins: w };
    if (w === stage1) {
      stoppedEarly = true;
      break;
    }
    if (considered >= input.tries) break;
  }
  if (!best) return null;
  return {
    party: best.party,
    odds: computeHuntOdds({ ...input, party: best.party, prep: input.prep }),
    considered,
    stoppedEarly,
  };
};

/** Suggest's inputs from the save: only hunters who can attend and fit the track (never anyone else). */
export const huntSuggestInput = (
  state: GameState,
  trackId: TrackId,
  now: number,
  prep?: Preparation,
): HuntSuggestInput => {
  const t = trackOf(trackId);
  return {
    gameSeed: state.meta.gameSeed,
    hunt: t.hunt,
    track: t.track.number,
    tier: trackTier(t.track),
    available: legalHunters(state, t.track, now).map((id) => snapshotOf(state, id)),
    maxParty: num('boss.partySize'),
    prep,
    alchemy: skillLevel(state, 'alchemy'),
    tries: num('events.suggestTries'),
  };
};
