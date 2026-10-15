import { AGE_IDS } from '../../content/ages';
import { BUILDING_IDS } from '../../content/buildings';
import { CONSUMABLE_IDS } from '../../content/consumables';
import { LOCATION_IDS, type LocationId } from '../../content/damage';
import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { INGREDIENT_IDS, type IngredientId } from '../../content/ingredients';
import { JOB_IDS } from '../../content/jobs';
import { MONSTER_IDS, type MonsterId } from '../../content/monsters';
import { RESOURCE_IDS } from '../../content/resources';
import { ALL_SCENE_IDS, type SceneId } from '../../content/text/scenes';
import { VILLAGE_IDS, type VillageId } from '../../content/villages';
import { failure, success, type Result } from '../result';
import {
  arr,
  bool,
  count,
  finite,
  hunterId,
  idRecord,
  Invalid,
  knowledgeLevel,
  nonNegative,
  obj,
  oneOf,
  orNull,
  preparation,
  snapshot,
  sparseCounts,
  str,
  unit,
  type Obj,
} from './guards';
import { storyFrom } from './validate-story';
import { growthFrom, itemsFrom } from './validate-items';
import { alchemyLevel, bookFrom, kettleJob, skillsFrom } from './validate-alchemy';
import { delveFrom } from './validate-delve';
import { longNightFrom } from './validate-long-night';
import type {
  ContractInstance,
  ContractResult,
  FallenRecord,
  FightRef,
  GameState,
  HunterState,
  RunningContract,
  Settings,
  SpeciesKnowledge,
} from '../state/game-state';
import { DEFAULT_SETTINGS } from '../state/new-game';

// Technical design §9.4: a hand-written guard [JC: no schema library]. It checks
// types, ranges, and that every ID exists in content. Unknown IDs (content that
// was removed) are dropped with a warning in the load report, never a crash.

export interface Validated {
  state: GameState;
  warnings: string[];
}

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

const scenesSeen = (v: unknown, warnings: string[]): SceneId[] => {
  const out: SceneId[] = [];
  for (const x of arr(v, 'scenes')) {
    if (!(ALL_SCENE_IDS as readonly unknown[]).includes(x))
      warnings.push(`Dropped unknown scene "${String(x)}".`);
    else if (!out.includes(x as SceneId)) out.push(x as SceneId);
  }
  return out;
};

/** Reagents a result brought: unknown ingredients are a hard error here (they were just earned). */
const reagentCounts = (v: unknown, where: string): Partial<Record<IngredientId, number>> => {
  const out: Partial<Record<IngredientId, number>> = {};
  for (const [k, x] of Object.entries(obj(v, where))) {
    out[oneOf<IngredientId>(k, INGREDIENT_IDS, `${where}.${k}`)] = count(x, `${where}.${k}`);
  }
  return out;
};

const bestiaryFrom = (
  v: unknown,
  warnings: string[],
): Partial<Record<MonsterId, SpeciesKnowledge>> => {
  const out: Partial<Record<MonsterId, SpeciesKnowledge>> = {};
  for (const [k, x] of Object.entries(obj(v, 'bestiary'))) {
    if (!(MONSTER_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown bestiary entry "${k}".`);
      continue;
    }
    const e = obj(x, `bestiary.${k}`);
    const level = count(e.level, `bestiary.${k}.level`);
    if (level < 1 || level > 4) throw new Invalid(`bestiary.${k}.level is out of range.`);
    out[k as MonsterId] = {
      level: level as SpeciesKnowledge['level'],
      kills: count(e.kills, `bestiary.${k}.kills`),
    };
  }
  return out;
};

const contract = (v: unknown, where: string): ContractInstance => {
  const o = obj(v, where);
  const tier = count(o.tier, `${where}.tier`);
  if (tier < 1 || tier > 5) throw new Invalid(`${where}.tier is out of range.`);
  const revealed = count(o.revealed, `${where}.revealed`);
  if (revealed > 3) throw new Invalid(`${where}.revealed is above 3.`);
  return {
    id: str(o.id, `${where}.id`),
    village: oneOf<VillageId>(o.village, VILLAGE_IDS, `${where}.village`),
    monster: oneOf<MonsterId>(o.monster, MONSTER_IDS, `${where}.monster`),
    tier,
    location: oneOf<LocationId>(o.location, LOCATION_IDS, `${where}.location`),
    arrivedAt: finite(o.arrivedAt, `${where}.arrivedAt`),
    revealed,
  };
};

const hunterState = (v: unknown, where: string, id: HunterId, warnings: string[]): HunterState => {
  const o = obj(v, where);
  const level = count(o.level, `${where}.level`);
  if (level < 1) throw new Invalid(`${where}.level is below 1.`);
  const rec = obj(o.record, `${where}.record`);
  return {
    level,
    xp: nonNegative(o.xp, `${where}.xp`),
    weapon: orNull(o.weapon, (x) => str(x, `${where}.weapon`)),
    armor: orNull(o.armor, (x) => str(x, `${where}.armor`)),
    ...growthFrom(o, id, where, warnings),
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
    prep: preparation(o.prep, `${where}.prep`),
    knowledge: knowledgeLevel(o.knowledge, `${where}.knowledge`),
    alchemy: alchemyLevel(o.alchemy, `${where}.alchemy`),
  };
};

const result = (v: unknown, where: string): ContractResult => {
  const o = obj(v, where);
  const c = contract({ ...o, id: o.contractId, arrivedAt: 0, revealed: 3 }, where);
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
    reagents: reagentCounts(o.reagents, `${where}.reagents`),
    wellPrepared: bool(o.wellPrepared, `${where}.wellPrepared`),
    ...(o.found === undefined
      ? {}
      : { found: arr(o.found, `${where}.found`).map((x, i) => str(x, `${where}.found[${i}]`)) }),
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
      knowledge: knowledgeLevel(m.knowledge, `${where}.monster.knowledge`),
    },
    location: oneOf<LocationId>(o.location, LOCATION_IDS, `${where}.location`),
    result: oneOf(o.result, ['win', 'loss'] as const, `${where}.result`),
    rulesVersion: count(o.rulesVersion, `${where}.rulesVersion`),
    at: finite(o.at, `${where}.at`),
    prep: preparation(o.prep, `${where}.prep`),
    alchemy: alchemyLevel(o.alchemy, `${where}.alchemy`),
  };
};

const fallen = (v: unknown, where: string): FallenRecord => {
  const o = obj(v, where);
  const r: FallenRecord = {
    hunter: hunterId(o.hunter, `${where}.hunter`),
    diedAt: finite(o.diedAt, `${where}.diedAt`),
    cycle: count(o.cycle, `${where}.cycle`),
    contractId: str(o.contractId, `${where}.contractId`),
  };
  if (o.level !== undefined) r.level = count(o.level, `${where}.level`);
  if (o.returnLevel !== undefined) r.returnLevel = count(o.returnLevel, `${where}.returnLevel`);
  return r;
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
  const queuesRaw = obj(s.queues, 'queues');
  const gardenRaw = obj(s.garden, 'garden');

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
    owned[k as HunterId] = hunterState(x, `hunters.${k}`, k as HunterId, warnings);
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
  const cycleNumber = count(cycle.number, 'cycle.number');

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
    cycle: { number: cycleNumber, age: age as (typeof AGE_IDS)[number] },
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
    bestiary: bestiaryFrom(s.bestiary, warnings),
    stores: idRecord(s.stores, [...CONSUMABLE_IDS, ...INGREDIENT_IDS], 'stores', count, warnings),
    queues: {
      brewing: arr(queuesRaw.brewing, 'queues.brewing').map((j, i) =>
        kettleJob(j, `queues.brewing[${i}]`),
      ),
      investigation: arr(queuesRaw.investigation, 'queues.investigation').map((j, i) => {
        const r = obj(j, `queues.investigation[${i}]`);
        return {
          contractId: str(r.contractId, `queues.investigation[${i}].contractId`),
          nextClueAt: finite(r.nextClueAt, `queues.investigation[${i}].nextClueAt`),
        };
      }),
    },
    garden: { nextAt: orNull(gardenRaw.nextAt, (x) => finite(x, 'garden.nextAt')) },
    running: arr(s.running, 'running').map((r, i) => running(r, `running[${i}]`)),
    results: arr(s.results, 'results').map((r, i) => result(r, `results[${i}]`)),
    fallen: arr(s.fallen, 'fallen').map((r, i) => fallen(r, `fallen[${i}]`)),
    scenes: scenesSeen(s.scenes, warnings),
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
      trophiesSpent: count(stats.trophiesSpent, 'stats.trophiesSpent'),
      bountySilver: nonNegative(stats.bountySilver, 'stats.bountySilver'),
      kills: sparseCounts(stats.kills, MONSTER_IDS, 'stats.kills', warnings),
      winsByLocation: sparseCounts(
        stats.winsByLocation,
        LOCATION_IDS,
        'stats.winsByLocation',
        warnings,
      ),
    },
    ...longNightFrom(s, cycleNumber, warnings),
    story: storyFrom(s, warnings),
    book: bookFrom(s.book, warnings),
    skills: skillsFrom(s.skills, warnings),
    delve: delveFrom(s.delve, warnings),
    ...itemsFrom(s, owned, warnings),
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
