import { AGE_IDS } from '../../content/ages';
import { BUILDING_IDS } from '../../content/buildings';
import { JOB_IDS } from '../../content/jobs';
import { RESOURCE_IDS } from '../../content/resources';
import { failure, success, type Result } from '../result';
import type { GameState, Settings } from '../state/game-state';
import { DEFAULT_SETTINGS } from '../state/new-game';

// Technical design §9.4: a hand-written guard [JC: no schema library]. It checks
// types, ranges, and that every ID exists in content. Unknown IDs (content that
// was removed) are dropped with a warning in the load report, never a crash.

export interface Validated {
  state: GameState;
  warnings: string[];
}

class Invalid extends Error {}

type Obj = Record<string, unknown>;

const obj = (v: unknown, where: string): Obj => {
  if (typeof v !== 'object' || v === null || Array.isArray(v))
    throw new Invalid(`${where} is missing.`);
  return v as Obj;
};
const finite = (v: unknown, where: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Invalid(`${where} isn't a number.`);
  return v;
};
const nonNegative = (v: unknown, where: string): number => {
  const n = finite(v, where);
  if (n < 0) throw new Invalid(`${where} is negative.`);
  return n;
};
const count = (v: unknown, where: string): number => {
  const n = nonNegative(v, where);
  if (!Number.isInteger(n)) throw new Invalid(`${where} isn't a whole number.`);
  return n;
};
const bool = (v: unknown, where: string): boolean => {
  if (typeof v !== 'boolean') throw new Invalid(`${where} isn't true or false.`);
  return v;
};
const str = (v: unknown, where: string): string => {
  if (typeof v !== 'string') throw new Invalid(`${where} isn't text.`);
  return v;
};

/** A record keyed by content IDs: unknown keys dropped (warned), missing ones 0 (warned). */
const idRecord = <K extends string>(
  v: unknown,
  ids: readonly K[],
  where: string,
  read: (x: unknown, w: string) => number,
  warnings: string[],
): Record<K, number> => {
  const o = obj(v, where);
  for (const k of Object.keys(o)) {
    if (!(ids as readonly string[]).includes(k))
      warnings.push(`Dropped unknown ${where} entry "${k}".`);
  }
  return Object.fromEntries(
    ids.map((id) => {
      if (!(id in o)) {
        warnings.push(`${where} had no "${id}"; set to 0.`);
        return [id, 0];
      }
      return [id, read(o[id], `${where}.${id}`)];
    }),
  ) as Record<K, number>;
};

const settingsFrom = (v: unknown, warnings: string[]): Settings => {
  const o = typeof v === 'object' && v !== null ? (v as Obj) : {};
  const pick = <K extends keyof Settings>(key: K, allowed: readonly Settings[K][]): Settings[K] => {
    if (allowed.includes(o[key] as Settings[K])) return o[key] as Settings[K];
    warnings.push(`Setting "${key}" was invalid; reset to its default.`);
    return DEFAULT_SETTINGS[key];
  };
  return {
    theme: pick('theme', ['dark', 'light']),
    bestBuyHint: pick('bestBuyHint', [true, false]),
    rateUnit: pick('rateUnit', ['minute', 'hour']),
    reduceMotion: pick('reduceMotion', ['system', 'on', 'off']),
  };
};

const check = (raw: unknown, warnings: string[]): GameState => {
  const s = obj(raw, 'The game data');
  const meta = obj(s.meta, 'meta');
  const cycle = obj(s.cycle, 'cycle');
  const peasants = obj(s.peasants, 'peasants');
  const stats = obj(s.stats, 'stats');

  const age = str(cycle.age, 'cycle.age');
  if (!(AGE_IDS as readonly string[]).includes(age)) throw new Invalid(`Unknown Rank "${age}".`);

  const jobs = idRecord(peasants.jobs, JOB_IDS, 'peasants.jobs', count, warnings);
  const total = count(peasants.total, 'peasants.total');
  const working = Object.values(jobs).reduce((a, b) => a + b, 0);
  if (working > total)
    throw new Invalid(`${working} peasants are working but only ${total} exist.`);

  // Keep the player's order for known jobs; append any the list is missing.
  const rawPriority = Array.isArray(peasants.priority) ? peasants.priority : [];
  const priority = rawPriority.filter(
    (j, i): j is (typeof JOB_IDS)[number] =>
      (JOB_IDS as readonly unknown[]).includes(j) && rawPriority.indexOf(j) === i,
  );
  for (const j of JOB_IDS) if (!priority.includes(j)) priority.push(j);
  if (rawPriority.length !== priority.length || priority.some((j, i) => rawPriority[i] !== j)) {
    warnings.push('The job priority list was repaired.');
  }

  return {
    meta: {
      schemaVersion: count(meta.schemaVersion, 'meta.schemaVersion'),
      gameSeed: str(meta.gameSeed, 'meta.gameSeed'),
      createdAt: finite(meta.createdAt, 'meta.createdAt'),
      lastSeen: finite(meta.lastSeen, 'meta.lastSeen'),
      clockHighWater: finite(meta.clockHighWater, 'meta.clockHighWater'),
      debugUsed: bool(meta.debugUsed, 'meta.debugUsed'),
    },
    time: finite(s.time, 'time'),
    cycle: { number: count(cycle.number, 'cycle.number'), age: age as (typeof AGE_IDS)[number] },
    resources: idRecord(s.resources, RESOURCE_IDS, 'resources', nonNegative, warnings),
    peasants: {
      total,
      jobs,
      autoSettle: bool(peasants.autoSettle, 'peasants.autoSettle'),
      priority,
      lastSettleAt: finite(peasants.lastSettleAt, 'peasants.lastSettleAt'),
    },
    buildings: idRecord(s.buildings, BUILDING_IDS, 'buildings', count, warnings),
    stats: {
      buildingsBought: count(stats.buildingsBought, 'stats.buildingsBought'),
      peasantsSettled: count(stats.peasantsSettled, 'stats.peasantsSettled'),
    },
    settings: settingsFrom(s.settings, warnings),
  };
};

/** Checks plain JSON against the current GameState; returns a clean copy. */
export const validateState = (raw: unknown): Result<Validated> => {
  const warnings: string[] = [];
  try {
    return success({ state: check(raw, warnings), warnings });
  } catch (e) {
    if (e instanceof Invalid) return failure(`This save has invalid data: ${e.message}`);
    throw e;
  }
};
