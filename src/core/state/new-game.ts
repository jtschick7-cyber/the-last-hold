import { BUILDING_IDS, type BuildingId } from '../../content/buildings';
import { CONSUMABLE_IDS, type ConsumableId } from '../../content/consumables';
import { INGREDIENT_IDS, type IngredientId } from '../../content/ingredients';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { start } from '../../content/start';
import { UPGRADE_IDS, type UpgradeId } from '../../content/warden-upgrades';
import { SCHEMA_VERSION, type CycleRecord, type GameState, type Settings } from './game-state';
import { freshHunter, startingHunters } from './hunters-state';
import { startingBook, startingSkills } from './book-state';
import { startingDelve } from './delve-state';
import { newEventsState } from './events-state';
import { newOrdersState } from './orders-state';
import { newLayoutState } from '../systems/layout-catalog';
import { newVigilState } from './vigil-state';
import { newDescentState } from './descent-state';
import { autoPlaceUnlocked } from '../systems/layout-place';
import { newRememberingState } from './remembering-state';
import { freshAct, startingVillageTrust } from './story-state';

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

/** A cycle's history entry as it begins (D113); `act` is the act it tells (GDD §5.14.1). */
export const freshCycleRecord = (number: number, now: number, act: number | null): CycleRecord => ({
  number,
  startedAt: now,
  ranks: { [start.age]: now },
  contractThreat: { added: 0, removed: 0 },
  stand: null,
  act,
  warden: null,
  standPool: null,
});

/** A fresh game in the GDD §5.1.4 starting state. */
export const createNewGame = (seed: string, now: number): GameState => {
  const jobs = { ...start.jobs };
  const state: GameState = {
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
    bestiary: {},
    stores: fill<ConsumableId | IngredientId>([...CONSUMABLE_IDS, ...INGREDIENT_IDS], {}),
    queues: { brewing: [], investigation: [] },
    garden: { nextAt: null },
    running: [],
    results: [],
    fallen: [],
    scenes: [],
    log: { recentFights: [] },
    threat: 0,
    embers: 0,
    upgrades: fill<UpgradeId>(UPGRADE_IDS, {}),
    relics: [],
    arrivalDue: false, // new games never face the v0.4 arrival (GDD §5.9.8)
    cycles: [freshCycleRecord(1, now, 1)],
    // GDD §5.14.1: a new game starts Act I with cycle 1; the opening scene names the warden.
    story: {
      arrivalDue: false,
      ilseAt: null,
      acts: [freshAct(1, 1, now)],
      documents: [],
      names: [],
      ribbonshades: 0,
      peakLevels: Object.fromEntries(startingHunters().map((h) => [h, 1])),
      letters: [],
      trust: startingVillageTrust(),
      unread: [],
    },
    book: startingBook(),
    skills: startingSkills(),
    delve: startingDelve(),
    items: [],
    itemSeq: 0,
    legendaries: [],
    events: newEventsState(now),
    orders: newOrdersState(),
    remembering: newRememberingState(),
    layout: newLayoutState(),
    vigil: newVigilState(),
    descent: newDescentState(),
    stats: {
      buildingsBought: 0,
      peasantsSettled: 0,
      contractsWon: 0,
      contractsLost: 0,
      trophies: 0,
      trophiesSpent: 0,
      bountySilver: 0,
      kills: {},
      winsByLocation: {},
    },
    settings: { ...DEFAULT_SETTINGS },
  };
  autoPlaceUnlocked(state); // GDD §5.1.5 (M3): the starting Farm and Camp stand on the grid, not in the tray
  return state;
};
