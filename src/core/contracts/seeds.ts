import { streamSeed } from '../rng';

// Technical design §7.2 and GDD §5.4.2: the real fight and the odds preview use
// different seed strings, so the preview never reveals the real roll.

const ids = (party: readonly string[]): string => party.join(',');

/** The actual outcome: fixed and reproducible, and the same fight the log replays. */
export const fightSeed = (
  gameSeed: string,
  contractId: string,
  party: readonly string[],
  prep: readonly string[] = [],
): string => streamSeed(gameSeed, 'fight', contractId, ids(party), ids(prep));

/**
 * Sample i of the 500-fight preview: a distinct prefix, so it never equals the real fight.
 * The party only, not the preparation (Q15, D98): prepared and unprepared previews share
 * their dice, so an item that does nothing shows exactly the unprepared number.
 */
export const oddsSeed = (
  gameSeed: string,
  contractId: string,
  party: readonly string[],
  i: number,
): string => streamSeed(gameSeed, 'odds', contractId, ids(party), i);

/** The death roll for one downed hunter on a Reckless contract. */
export const deathSeed = (gameSeed: string, contractId: string, hunterId: string): string =>
  streamSeed(gameSeed, 'death', contractId, hunterId);

/** Suggest, stage 1, sample i: the same seeds for every party, so comparisons are fair (GDD §6.5). */
export const suggestSeed = (gameSeed: string, contractId: string, i: number): string =>
  streamSeed(gameSeed, 'suggest', contractId, i);
