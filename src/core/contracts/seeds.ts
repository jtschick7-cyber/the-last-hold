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

/** Sample i of the 500-fight preview: a distinct prefix, so it never equals the real fight. */
export const oddsSeed = (
  gameSeed: string,
  contractId: string,
  party: readonly string[],
  prep: readonly string[],
  i: number,
): string => streamSeed(gameSeed, 'odds', contractId, ids(party), ids(prep), i);

/** The death roll for one downed hunter on a Reckless contract. */
export const deathSeed = (gameSeed: string, contractId: string, hunterId: string): string =>
  streamSeed(gameSeed, 'death', contractId, hunterId);
