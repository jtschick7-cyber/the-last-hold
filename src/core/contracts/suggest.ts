import type { AgeId } from '../../content/ages';
import type { LocationId } from '../../content/damage';
import { num } from '../balance-access';
import { runFight, type HunterSnapshot, type MonsterInstance } from '../combat';
import { seeded } from '../rng';
import { computeOdds, type Odds } from './odds';
import { suggestSeed } from './seeds';

// GDD §6.5 / §5.4.2: the Suggested party, by a two-stage search. Stage 1 ranks
// every legal party with a few samples, using the same seeds for every party so
// the comparison is fair. Stage 2 reruns the best few at full samples.

export interface SuggestInput {
  readonly gameSeed: string;
  readonly contractId: string;
  /** Hunters free to go, in roster order (that order is the party slot order). */
  readonly available: readonly HunterSnapshot[];
  readonly monster: MonsterInstance;
  readonly location: LocationId;
  readonly rank: AgeId;
  readonly maxParty: number;
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
  const parties = legalParties(input.available, input.maxParty);
  if (parties.length === 0) return null;
  const stage1 = num('suggest.stage1Samples');
  const wins = parties.map((party) => {
    let w = 0;
    for (let i = 0; i < stage1; i++) {
      const r = runFight({
        party,
        monster: input.monster,
        location: input.location,
        rolls: seeded(suggestSeed(input.gameSeed, input.contractId, i)),
        log: false,
      });
      if (r.result === 'win') w += 1;
    }
    return w;
  });
  const order = parties
    .map((_, i) => i)
    .sort(
      (a, b) =>
        (wins[b] ?? 0) - (wins[a] ?? 0) ||
        (parties[a]?.length ?? 0) - (parties[b]?.length ?? 0) ||
        a - b,
    );
  const finalists = order.slice(0, num('suggest.finalists'));
  let best: { party: HunterSnapshot[]; odds: Odds; index: number } | null = null;
  for (const index of finalists) {
    const party = parties[index];
    if (!party) continue;
    const odds = computeOdds({
      gameSeed: input.gameSeed,
      contractId: input.contractId,
      party,
      monster: input.monster,
      location: input.location,
      rank: input.rank,
    });
    const better =
      !best ||
      odds.winChance > best.odds.winChance ||
      (odds.winChance === best.odds.winChance && party.length < best.party.length);
    if (better) best = { party, odds, index };
  }
  return best ? { party: best.party, odds: best.odds, considered: parties.length } : null;
};
