import { failure, success, type Result } from '../result';
import { SCHEMA_VERSION } from '../state/game-state';

// Technical design §9.4: migrations[n] upgrades a version-n state to n + 1.
// They're pure functions on plain JSON. Every schema change MUST add a
// migration, a real old-save fixture (tests/saves/fixtures/vN.json), and pass
// the round-trip test (CLAUDE.md "Saves").
export type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});

export const migrations: Readonly<Record<number, Migration>> = {
  // v1 → v2 (plan T2.4): hunters, the board, running and unread contracts, fights.
  // The two starting hunters (free, GDD §8.5) join the roster. If a Mine already
  // stands, the board opens now, with its first contract due at once.
  1: (state) => {
    const s: Plain = structuredClone(state);
    const fresh = (): Plain => ({
      level: 1,
      xp: 0,
      weapon: null,
      armor: null,
      recovery: null,
      record: { won: 0, lost: 0 },
    });
    const buildings: Plain = { ...asPlain(s.buildings), barracks: 0, 'trophy-hall': 0 };
    const mine = typeof buildings.mine === 'number' ? buildings.mine : 0;
    return {
      ...s,
      buildings,
      hunters: { halvar: fresh(), zora: fresh() },
      roster: { active: ['halvar', 'zora'] },
      board: {
        opened: mine > 0,
        open: [],
        nextArrivalAt: mine > 0 ? s.time : null,
        arrivals: 0,
        tierWins: [0, 0, 0, 0, 0],
      },
      running: [],
      results: [],
      fallen: [],
      scenes: [],
      log: { recentFights: [] },
      stats: {
        ...asPlain(s.stats),
        contractsWon: 0,
        contractsLost: 0,
        trophies: 0,
        bountySilver: 0,
        kills: {},
        winsByLocation: {},
      },
    };
  },
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
