import { failure, success, type Result } from '../result';
import { SCHEMA_VERSION } from '../state/game-state';

// Technical design §9.4: migrations[n] upgrades a version-n state to n + 1.
// They're pure functions on plain JSON. Every schema change MUST add a
// migration, a real old-save fixture (tests/saves/fixtures/vN.json), and pass
// the round-trip test (CLAUDE.md "Saves").
export type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

export const migrations: Readonly<Record<number, Migration>> = {
  // v1 is the first schema; nothing to upgrade yet.
};

export const NEWER_VERSION = 'This save is from a newer version of the game.';

/** Upgrades a plain-JSON state from `from` to the current schema version. */
export const migrate = (state: unknown, from: number): Result<unknown> => {
  if (!Number.isInteger(from) || from < 1)
    return failure("This save's version number is missing or invalid.");
  if (from > SCHEMA_VERSION) return failure(NEWER_VERSION);
  let current = state;
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const step = migrations[v];
    if (!step) return failure(`This save is too old to upgrade (no step from version ${v}).`);
    if (typeof current !== 'object' || current === null)
      return failure('This save has no game data.');
    current = step(current as Record<string, unknown>);
  }
  return success(current);
};
