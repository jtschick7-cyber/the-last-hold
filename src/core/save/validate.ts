import { AGE_IDS } from '../../content/ages';
import { BUILDING_IDS } from '../../content/buildings';
import { DAMAGE_TYPES, LOCATION_IDS, type LocationId } from '../../content/damage';
import { GEAR_IDS, type GearId } from '../../content/gear';
import { HUNTER_IDS, ROLE_IDS, type HunterId } from '../../content/hunters';
import { JOB_IDS } from '../../content/jobs';
import { MONSTER_IDS, type MonsterId } from '../../content/monsters';
import { RESOURCE_IDS } from '../../content/resources';
import { TRAIT_IDS, type TraitId } from '../../content/traits';
import { VILLAGE_IDS, type VillageId } from '../../content/villages';
import type { HunterSnapshot } from '../combat';
import { failure, success, type Result } from '../result';
import type {
  ContractInstance,
  ContractResult,
  FallenRecord,
  FightRef,
  GameState,
  HunterState,
  RunningContract,
  Settings,
} from '../state/game-state';
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
const unit = (v: unknown, where: string): number => {
  const n = nonNegative(v, where);
  if (n > 1) throw new Invalid(`${where} is above 1.`);
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

const arr = (v: unknown, where: string): unknown[] => {
  if (!Array.isArray(v)) throw new Invalid(`${where} is missing.`);
  return v;
};
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], where: string): T => {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v))
    throw new Invalid(`${where} isn't one we know.`);
  return v as T;
};
const orNull = <T>(v: unknown, read: (x: unknown) => T): T | null => (v === null ? null : read(v));

const hunterId = (v: unknown, where: string): HunterId => oneOf(v, HUNTER_IDS, where);
const gear = (v: unknown, where: string): GearId | null =>
  orNull(v, (x) => oneOf(x, GEAR_IDS, where));

const snapshot = (v: unknown, where: string): HunterSnapshot => {
  const o = obj(v, where);
  const base = obj(o.base, `${where}.base`);
  return {
    id: hunterId(o.id, `${where}.id`),
    name: str(o.name, `${where}.name`),
    role: oneOf(o.role, ROLE_IDS, `${where}.role`),
    damage: oneOf(o.damage, DAMAGE_TYPES, `${where}.damage`),
    level: count(o.level, `${where}.level`),
    base: {
      health: nonNegative(base.health, `${where}.base.health`),
      might: nonNegative(base.might, `${where}.base.might`),
      armor: nonNegative(base.armor, `${where}.base.armor`),
      speed: nonNegative(base.speed, `${where}.base.speed`),
    },
    traits: arr(o.traits, `${where}.traits`).map((t, i) =>
      oneOf<TraitId>(t, TRAIT_IDS, `${where}.traits[${i}]`),
    ),
    weapon: gear(o.weapon, `${where}.weapon`),
    armorGear: gear(o.armorGear, `${where}.armorGear`),
  };
};

const contract = (v: unknown, where: string): ContractInstance => {
  const o = obj(v, where);
  const tier = count(o.tier, `${where}.tier`);
  if (tier < 1 || tier > 5) throw new Invalid(`${where}.tier is out of range.`);
  return {
    id: str(o.id, `${where}.id`),
    village: oneOf<VillageId>(o.village, VILLAGE_IDS, `${where}.village`),
    monster: oneOf<MonsterId>(o.monster, MONSTER_IDS, `${where}.monster`),
    tier,
    location: oneOf<LocationId>(o.location, LOCATION_IDS, `${where}.location`),
    arrivedAt: finite(o.arrivedAt, `${where}.arrivedAt`),
  };
};

const hunterState = (v: unknown, where: string): HunterState => {
  const o = obj(v, where);
  const level = count(o.level, `${where}.level`);
  if (level < 1) throw new Invalid(`${where}.level is below 1.`);
  const rec = obj(o.record, `${where}.record`);
  return {
    level,
    xp: nonNegative(o.xp, `${where}.xp`),
    weapon: gear(o.weapon, `${where}.weapon`),
    armor: gear(o.armor, `${where}.armor`),
    recovery: orNull(o.recovery, (x) => {
      const r = obj(x, `${where}.recovery`);
      return {
        kind: oneOf(r.kind, ['bruised', 'wounded', 'grievous'] as const, `${where}.recovery.kind`),
        until: finite(r.until, `${where}.recovery.until`),
      };
    }),
    record: {
      won: count(rec.won, `${where}.record.won`),
      lost: count(rec.lost, `${where}.record.lost`),
    },
  };
};

const running = (v: unknown, where: string): RunningContract => {
  const o = obj(v, where);
  return {
    contract: contract(o.contract, `${where}.contract`),
    party: arr(o.party, `${where}.party`).map((h, i) => hunterId(h, `${where}.party[${i}]`)),
    snapshots: arr(o.snapshots, `${where}.snapshots`).map((x, i) =>
      snapshot(x, `${where}.snapshots[${i}]`),
    ),
    launchedAt: finite(o.launchedAt, `${where}.launchedAt`),
    endsAt: finite(o.endsAt, `${where}.endsAt`),
    reckless: bool(o.reckless, `${where}.reckless`),
    winChance: unit(o.winChance, `${where}.winChance`),
  };
};

const result = (v: unknown, where: string): ContractResult => {
  const o = obj(v, where);
  const c = contract({ ...o, id: o.contractId, arrivedAt: 0 }, where);
  return {
    contractId: c.id,
    village: c.village,
    monster: c.monster,
    tier: c.tier,
    location: c.location,
    success: bool(o.success, `${where}.success`),
    at: finite(o.at, `${where}.at`),
    bounty: nonNegative(o.bounty, `${where}.bounty`),
    trophies: count(o.trophies, `${where}.trophies`),
    xp: nonNegative(o.xp, `${where}.xp`),
    winChance: unit(o.winChance, `${where}.winChance`),
    injuries: arr(o.injuries, `${where}.injuries`).map((x, i) => {
      const r = obj(x, `${where}.injuries[${i}]`);
      return {
        hunter: hunterId(r.hunter, `${where}.injuries[${i}].hunter`),
        kind: oneOf(
          r.kind,
          ['none', 'bruised', 'wounded', 'grievous', 'dead'] as const,
          `${where}.injuries[${i}].kind`,
        ),
        until: finite(r.until, `${where}.injuries[${i}].until`),
      };
    }),
    levelUps: arr(o.levelUps, `${where}.levelUps`).map((x, i) => {
      const r = obj(x, `${where}.levelUps[${i}]`);
      return {
        hunter: hunterId(r.hunter, `${where}.levelUps[${i}].hunter`),
        level: count(r.level, `${where}.levelUps[${i}].level`),
      };
    }),
  };
};

const fightRef = (v: unknown, where: string): FightRef => {
  const o = obj(v, where);
  const m = obj(o.monster, `${where}.monster`);
  return {
    contractId: str(o.contractId, `${where}.contractId`),
    seed: str(o.seed, `${where}.seed`),
    party: arr(o.party, `${where}.party`).map((x, i) => snapshot(x, `${where}.party[${i}]`)),
    monster: {
      monster: oneOf<MonsterId>(m.monster, MONSTER_IDS, `${where}.monster.monster`),
      tier: count(m.tier, `${where}.monster.tier`),
    },
    location: oneOf<LocationId>(o.location, LOCATION_IDS, `${where}.location`),
    result: oneOf(o.result, ['win', 'loss'] as const, `${where}.result`),
    rulesVersion: count(o.rulesVersion, `${where}.rulesVersion`),
    at: finite(o.at, `${where}.at`),
  };
};

const fallen = (v: unknown, where: string): FallenRecord => {
  const o = obj(v, where);
  return {
    hunter: hunterId(o.hunter, `${where}.hunter`),
    diedAt: finite(o.diedAt, `${where}.diedAt`),
    cycle: count(o.cycle, `${where}.cycle`),
    contractId: str(o.contractId, `${where}.contractId`),
  };
};

/** A sparse count record keyed by content IDs; unknown keys are dropped with a warning. */
const sparseCounts = <K extends string>(
  v: unknown,
  ids: readonly K[],
  where: string,
  warnings: string[],
): Partial<Record<K, number>> => {
  const o = obj(v, where);
  const out: Partial<Record<K, number>> = {};
  for (const [k, x] of Object.entries(o)) {
    if (!(ids as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown ${where} entry "${k}".`);
      continue;
    }
    out[k as K] = count(x, `${where}.${k}`);
  }
  return out;
};

const check = (raw: unknown, warnings: string[]): GameState => {
  const s = obj(raw, 'The game data');
  const meta = obj(s.meta, 'meta');
  const cycle = obj(s.cycle, 'cycle');
  const peasants = obj(s.peasants, 'peasants');
  const stats = obj(s.stats, 'stats');
  const boardRaw = obj(s.board, 'board');
  const rosterRaw = obj(s.roster, 'roster');
  const logRaw = obj(s.log, 'log');

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

  const huntersRaw = obj(s.hunters, 'hunters');
  const owned: GameState['hunters'] = {};
  for (const [k, x] of Object.entries(huntersRaw)) {
    if (!(HUNTER_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown hunters entry "${k}".`);
      continue;
    }
    owned[k as HunterId] = hunterState(x, `hunters.${k}`);
  }
  const active: HunterId[] = [];
  for (const [i, h] of arr(rosterRaw.active, 'roster.active').entries()) {
    const id = hunterId(h, `roster.active[${i}]`);
    if (!owned[id] || active.includes(id)) {
      warnings.push(`The roster listed ${id} without owning them (or twice); removed.`);
      continue;
    }
    active.push(id);
  }
  const tierWins = arr(boardRaw.tierWins, 'board.tierWins').map((n, i) =>
    count(n, `board.tierWins[${i}]`),
  );
  if (tierWins.length !== 5) throw new Invalid('board.tierWins must have 5 entries.');

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
    hunters: owned,
    roster: { active },
    board: {
      opened: bool(boardRaw.opened, 'board.opened'),
      open: arr(boardRaw.open, 'board.open').map((c, i) => contract(c, `board.open[${i}]`)),
      nextArrivalAt: orNull(boardRaw.nextArrivalAt, (x) => finite(x, 'board.nextArrivalAt')),
      arrivals: count(boardRaw.arrivals, 'board.arrivals'),
      tierWins,
    },
    running: arr(s.running, 'running').map((r, i) => running(r, `running[${i}]`)),
    results: arr(s.results, 'results').map((r, i) => result(r, `results[${i}]`)),
    fallen: arr(s.fallen, 'fallen').map((r, i) => fallen(r, `fallen[${i}]`)),
    log: {
      recentFights: arr(logRaw.recentFights, 'log.recentFights').map((r, i) =>
        fightRef(r, `log.recentFights[${i}]`),
      ),
    },
    stats: {
      buildingsBought: count(stats.buildingsBought, 'stats.buildingsBought'),
      peasantsSettled: count(stats.peasantsSettled, 'stats.peasantsSettled'),
      contractsWon: count(stats.contractsWon, 'stats.contractsWon'),
      contractsLost: count(stats.contractsLost, 'stats.contractsLost'),
      trophies: count(stats.trophies, 'stats.trophies'),
      bountySilver: nonNegative(stats.bountySilver, 'stats.bountySilver'),
      kills: sparseCounts(stats.kills, MONSTER_IDS, 'stats.kills', warnings),
      winsByLocation: sparseCounts(
        stats.winsByLocation,
        LOCATION_IDS,
        'stats.winsByLocation',
        warnings,
      ),
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
