import { failure, success, type Result } from '../result';
import { SCHEMA_VERSION } from '../state/game-state';
import { v5ToV6 } from './migration-v6';
import { v6ToV7 } from './migration-v7';
import { v7ToV8 } from './migration-v8';

// Technical design §9.4: migrations[n] upgrades a version-n state to n + 1.
// They're pure functions on plain JSON. Every schema change MUST add a
// migration, a real old-save fixture (tests/saves/fixtures/vN.json), and pass
// the round-trip test (CLAUDE.md "Saves").
export type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});

// v3 → v4 (plan T4.3, D113): Citadel and Bastion, Walls and Watchtower, Threat,
// Embers, warden upgrades, relics and the cycle history. A save from before v0.4
// still faces its first Long Night (GDD §5.9.8), so `arrivalDue` is set. Its cycle
// began when the game was created; Rank times before v0.4 weren't recorded.
const v3ToV4: Migration = (state) => {
  const s: Plain = structuredClone(state);
  const meta = asPlain(s.meta);
  const cycle = asPlain(s.cycle);
  const createdAt = typeof meta.createdAt === 'number' ? meta.createdAt : s.time;
  return {
    ...s,
    buildings: { ...asPlain(s.buildings), walls: 0, watchtower: 0 },
    threat: 0,
    embers: 0,
    upgrades: Object.fromEntries(
      [
        'kept-coals',
        'full-larder',
        'young-families',
        'old-hands',
        'drill-yard',
        'village-goodwill',
        'swift-roads',
        'late-lantern',
      ].map((id) => [id, 0]),
    ),
    relics: [],
    arrivalDue: true,
    cycles: [
      {
        number: cycle.number,
        startedAt: createdAt,
        ranks: { hamlet: createdAt },
        contractThreat: { added: 0, removed: 0 },
        stand: null,
      },
    ],
  };
};

// v4 → v5 (plan T5.3): the story (GDD §5.14). Act I starts at once in the current
// cycle (D149), unless the save still owes its v0.4 arrival: then it starts with the
// cycle after that Long Night. Earlier cycles had no act, and every warden is
// unnamed until the v0.5 arrival asks. Each hunter's highest level is the best the
// save still knows: their level now, or their level at death.
const v4ToV5: Migration = (state) => {
  const s: Plain = structuredClone(state);
  const cycles = Array.isArray(s.cycles) ? (s.cycles as Plain[]) : [];
  const startsNow = s.arrivalDue !== true;
  const current = cycles.length - 1;
  const cycleNumber = asPlain(s.cycle).number;
  const peakLevels: Record<string, number> = {};
  const note = (id: unknown, level: unknown): void => {
    if (typeof id !== 'string' || typeof level !== 'number') return;
    peakLevels[id] = Math.max(peakLevels[id] ?? 0, level);
  };
  for (const [id, h] of Object.entries(asPlain(s.hunters))) note(id, asPlain(h).level);
  for (const f of Array.isArray(s.fallen) ? (s.fallen as Plain[]) : []) note(f.hunter, f.level);
  return {
    ...s,
    cycles: cycles.map((c, i) => ({
      ...c,
      act: startsNow && i === current ? 1 : null,
      warden: null,
    })),
    story: {
      arrivalDue: true,
      ilseAt: null,
      acts: startsNow
        ? [
            {
              act: 1,
              cycle: cycleNumber,
              startedAt: s.time,
              wins: 0,
              winsByVillage: {},
              ruinWins: 0,
            },
          ]
        : [],
      documents: [],
      names: [],
      ribbonshades: 0,
      peakLevels,
      letters: [],
      // setting-primer §3's starting trust, as of v5, kept here so a later change never rewrites old saves.
      trust: Object.fromEntries(
        Object.entries({
          'dubno-ford': 'wary',
          'kozly-hollow': 'cold',
          mirograd: 'hopeful',
          velkvik: 'wary',
          ravenfell: 'cold',
        }).map(([v, level]) => [v, { level, progress: 0, won: 0, triumphs: 0 }]),
      ),
      unread: [],
    },
  };
};

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

  // v2 → v3 (plan T3.4): the bestiary, stores, brewing, investigation and preparation.
  // Every species the player has met was identified for free in v0.2, so it starts
  // Identified, or Studied / Mastered by its kills (GDD §5.6.2: 3 and 10 kills; these
  // are the thresholds as of v3, kept here so a later change never rewrites old saves).
  // Contracts already posted keep their named species (3 clues of 3).
  2: (state) => {
    const s: Plain = structuredClone(state);
    const kills = asPlain(asPlain(s.stats).kills) as Record<string, number>;
    const met = new Set<string>(Object.keys(kills));
    const list = (v: unknown): Plain[] => (Array.isArray(v) ? (v as Plain[]) : []);
    const board = asPlain(s.board);
    for (const c of list(board.open)) met.add(String(c.monster));
    for (const r of list(s.running)) met.add(String(asPlain(r.contract).monster));
    for (const r of list(s.results)) met.add(String(r.monster));
    for (const f of list(asPlain(s.log).recentFights)) met.add(String(asPlain(f.monster).monster));
    const bestiary = Object.fromEntries(
      [...met].map((id) => {
        const n = typeof kills[id] === 'number' ? kills[id] : 0;
        return [id, { level: n >= 10 ? 4 : n >= 3 ? 3 : 2, kills: n }];
      }),
    );
    const noPrep = (): Plain => ({ oils: {}, potions: {}, bombs: [] });
    const stores = Object.fromEntries(
      [
        'grave-oil',
        'drowned-bane-oil',
        'thornbane-oil',
        'mending-draught',
        'hardwood-tonic',
        'quickfoot-tincture',
        'fire-pot',
        'frost-pot',
        'saltburst',
        'yarrow',
        'mugwort',
        'juniper',
        'honeycomb',
        'hares-foot',
        'pitch',
        'rime-salt',
        'grave-dust',
        'river-pearl',
        'thornwood',
        'wolf-fang',
        'noon-poppy',
      ].map((id) => [id, 0]),
    );
    return {
      ...s,
      buildings: {
        ...asPlain(s.buildings),
        'hunters-lodge': 0,
        'alchemists-hut': 0,
        'herb-garden': 0,
      },
      bestiary,
      stores,
      queues: { brewing: [], investigation: [] },
      garden: { nextAt: null },
      board: { ...board, open: list(board.open).map((c) => ({ ...c, revealed: 3 })) },
      running: list(s.running).map((r) => ({
        ...r,
        contract: { ...asPlain(r.contract), revealed: 3 },
        prep: noPrep(),
        // v2 contracts were all identified, and no species had a knowledge bonus yet.
        knowledge: 2,
      })),
      results: list(s.results).map((r) => ({ ...r, reagents: {}, wellPrepared: false })),
      log: {
        ...asPlain(s.log),
        recentFights: list(asPlain(s.log).recentFights).map((f) => ({
          ...f,
          monster: { ...asPlain(f.monster), knowledge: 2 },
          prep: noPrep(),
        })),
      },
    };
  },

  3: v3ToV4,
  4: v4ToV5,
  5: v5ToV6,
  6: v6ToV7,
  7: v7ToV8,
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
