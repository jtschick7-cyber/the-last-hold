import { BUILDING_IDS, type BuildingId } from '../../content/buildings';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { start } from '../../content/start';
import { SCHEMA_VERSION, type GameState, type Settings } from './game-state';
import { freshHunter, startingHunters } from './hunters-state';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  bestBuyHint: true,
  rateUnit: 'minute',
  reduceMotion: 'system',
};

const fill = <K extends string>(
  ids: readonly K[],
  from: Partial<Record<K, number>>,
): Record<K, number> =>
  Object.fromEntries(ids.map((id) => [id, from[id] ?? 0])) as Record<K, number>;

/** A fresh game in the GDD §5.1.4 starting state. */
export const createNewGame = (seed: string, now: number): GameState => {
  const jobs = { ...start.jobs };
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      gameSeed: seed,
      createdAt: now,
      lastSeen: now,
      clockHighWater: now,
      debugUsed: false,
    },
    time: now,
    cycle: { number: 1, age: start.age },
    resources: fill<ResourceId>(RESOURCE_IDS, start.resources),
    peasants: {
      total: Object.values(jobs).reduce((a, b) => a + b, 0),
      jobs,
      autoSettle: start.autoSettle,
      priority: [...start.jobPriority],
      // "Never": epoch 0 lets the first settle happen at once, and survives JSON.
      lastSettleAt: 0,
    },
    buildings: fill<BuildingId>(BUILDING_IDS, start.buildings),
    hunters: Object.fromEntries(startingHunters().map((h) => [h, freshHunter()])),
    roster: { active: startingHunters() },
    board: { opened: false, open: [], nextArrivalAt: null, arrivals: 0, tierWins: [0, 0, 0, 0, 0] },
    running: [],
    results: [],
    fallen: [],
    scenes: [],
    log: { recentFights: [] },
    stats: {
      buildingsBought: 0,
      peasantsSettled: 0,
      contractsWon: 0,
      contractsLost: 0,
      trophies: 0,
      bountySilver: 0,
      kills: {},
      winsByLocation: {},
    },
    settings: { ...DEFAULT_SETTINGS },
  };
};
