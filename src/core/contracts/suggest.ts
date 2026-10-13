import type { AgeId } from '../../content/ages';
import type { LocationId } from '../../content/damage';
import { num } from '../balance-access';
import { runFight, type HunterSnapshot, type MonsterInstance } from '../combat';
import { seedBank } from '../rng';
import type { Preparation } from '../state/game-state';
import { computeOdds, type Odds, type OddsInput } from './odds';
import { suggestSeed } from './seeds';

// GDD §6.5 / §5.4.2: the Suggested party, by a two-stage search. Stage 1 ranks
// every legal party with a few samples, using the same seeds for every party so
// the comparison is fair. Stage 2 compares the best few at stage2Samples each
// (D73), then the winner alone gets the full odds-panel samples.

export interface SuggestInput {
  readonly gameSeed: string;
  readonly contractId: string;
  /** Hunters free to go, in roster order (that order is the party slot order). */
  readonly available: readonly HunterSnapshot[];
  readonly monster: MonsterInstance;
  readonly location: LocationId;
  readonly rank: AgeId;
  readonly maxParty: number;
  /** What the party would carry; hunters outside a candidate party are simply not in it. */
  readonly prep?: Preparation;
}

export interface Suggestion {
  readonly party: readonly HunterSnapshot[];
  readonly odds: Odds;
  /** How many parties stage 1 looked at. */
  readonly considered: number;
}

/** Every non-empty party of at most `max` hunters, keeping roster order. */
export const legalParties = (
  available: readonly HunterSnapshot[],
  max: number,
): HunterSnapshot[][] => {
  const out: HunterSnapshot[][] = [];
  const walk = (from: number, chosen: HunterSnapshot[]): void => {
    if (chosen.length > 0) out.push([...chosen]);
    if (chosen.length === max) return;
    for (let i = from; i < available.length; i++) {
      const h = available[i];
      if (!h) continue;
      chosen.push(h);
      walk(i + 1, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  return out;
};

/** The best party, or null if nobody is free. Ties go to the smaller party (cheaper provisions), then roster order. */
export const suggestParty = (input: SuggestInput): Suggestion | null => {
  const all = legalParties(input.available, input.maxParty);
  if (all.length === 0) return null;
  const stage1 = num('suggest.stage1Samples');
  // The same fifty seeds for every party, hashed once.
  const bank = seedBank(
    Array.from({ length: stage1 }, (_, i) => suggestSeed(input.gameSeed, input.contractId, i)),
  );
  const stage1Wins = (party: readonly HunterSnapshot[]): number => {
    let w = 0;
    for (let i = 0; i < stage1; i++) {
      const r = runFight({
        party,
        monster: input.monster,
        location: input.location,
        rolls: bank(i),
        log: false,
        prep: input.prep,
      });
      if (r.result === 'win') w += 1;
    }
    return w;
  };
  // Full-size parties first. A smaller party can only matter (cheaper provisions at the
  // same odds) when the full-size ones already win every fight, and those fights are short;
  // when they don't, weak small parties would only add long fights and never win the pick [D74].
  const size = Math.min(input.maxParty, input.available.length);
  const full = all.filter((p) => p.length === size);
  const fullWins = full.map(stage1Wins);
  const perfect = fullWins.some((w) => w === stage1);
  const smaller = perfect ? all.filter((p) => p.length < size) : [];
  const parties = [...full, ...smaller];
  const wins = [...fullWins, ...smaller.map(stage1Wins)];
  const order = parties
    .map((_, i) => i)
    .sort(
      (a, b) =>
        (wins[b] ?? 0) - (wins[a] ?? 0) ||
        (parties[a]?.length ?? 0) - (parties[b]?.length ?? 0) ||
        a - b,
    );
  const finalists = order.slice(0, num('suggest.finalists'));
  const stage2 = num('suggest.stage2Samples');
  let best: { party: HunterSnapshot[]; winChance: number } | null = null;
  for (const index of finalists) {
    const party = parties[index];
    if (!party) continue;
    const { winChance } = computeOdds({ ...oddsInput(input, party), samples: stage2 });
    const better =
      !best ||
      winChance > best.winChance ||
      (winChance === best.winChance && party.length < best.party.length);
    if (better) best = { party, winChance };
  }
  // Only the winner pays for the full odds the launch panel shows.
  return best
    ? {
        party: best.party,
        odds: computeOdds(oddsInput(input, best.party)),
        considered: parties.length,
      }
    : null;
};

const oddsInput = (input: SuggestInput, party: HunterSnapshot[]): OddsInput => ({
  gameSeed: input.gameSeed,
  contractId: input.contractId,
  party,
  monster: input.monster,
  location: input.location,
  rank: input.rank,
});
