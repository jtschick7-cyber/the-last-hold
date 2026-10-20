import type { HunterId } from '../../content/hunters';
import { hunts, type HuntId, type TrackId } from '../../content/hunts';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { runFight, type HunterSnapshot } from '../combat';
import { explainFight } from '../combat/summary';
import { marginFor } from '../contracts/odds';
import { huntOddsSeed } from '../contracts/seeds';
import { seeded } from '../rng';
import { skillLevel } from '../skills/skills';
import { noPreparation, type GameState, type Preparation } from '../state/game-state';
import { snapshotOf } from './hunters';
import { trackOf, trackTier } from './hunt';

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
