import type { StandRecord } from '../state/game-state';
import { runStand, type StandInput, type StandResult } from './engine';

// Technical design §5.3 (D113): a stand's wave logs are never stored. The saved
// record holds its frozen inputs, and the logs are rebuilt by running it again.

export const standInputOf = (record: StandRecord, log = true): StandInput => ({
  seed: record.seed,
  threat: record.threat,
  party: record.party,
  prep: record.prep,
  bombs: record.bombs,
  defenses: record.defenses,
  relics: record.relics,
  knowledge: record.knowledge,
  log,
});

/** Rebuilds a stand's waves, with logs, from what the save kept. */
export const replayStand = (record: StandRecord): StandResult => runStand(standInputOf(record));
