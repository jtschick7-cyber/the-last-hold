import { BUILDING_IDS, type BuildingId } from '../../content/buildings';
import { CONSUMABLE_IDS } from '../../content/consumables';
import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { INGREDIENT_IDS } from '../../content/ingredients';
import { RESOURCE_IDS } from '../../content/resources';
import { start } from '../../content/start';
import { UPGRADE_IDS, upgrades } from '../../content/warden-upgrades';
import { num } from '../balance-access';
import { syncBoardOpen } from '../contracts/board';
import type { GameState } from '../state/game-state';
import { freshCycleRecord } from '../state/new-game';
import { freshAct } from '../state/story-state';
import { jobSlots } from '../systems/housing';
import { keptLevel, levelsKeptShare } from './levels';

// GDD §5.9.7 (D110): what the Long Night resets and what it keeps.
//   Resets (to the §5.1.4 start, plus warden upgrades): Rank, buildings, resources,
//   peasants; the board, tier unlocks, unread results; the stores, the brewing queue,
//   Lodge slots; gear, injuries, Threat, trophies this cycle.
//   Kept: every hunter (part of their levels), the bestiary, Embers, relics, upgrades,
//   candidates, the Hall of the Fallen, Reports and fight replays, scenes, settings,
//   lifetime stats, the cycle number (+1) and the history.
// Running contracts have already finished and the stand is already recorded.

/** The levels of every upgrade of one effect kind, summed with its per-level amount. */
const upgradeSum = (
  state: GameState,
  pick: (e: (typeof upgrades)[keyof typeof upgrades]['effect']) => number,
): number => UPGRADE_IDS.reduce((n, id) => n + pick(upgrades[id].effect) * state.upgrades[id], 0);

/** Full Larder and Young Families (GDD §8.9) add to the §5.1.4 start. */
const startingHold = (state: GameState): void => {
  state.resources = Object.fromEntries(
    RESOURCE_IDS.map((r) => [
      r,
      start.resources[r] +
        upgradeSum(state, (e) => (e.kind === 'startResources' ? (e.perLevel[r] ?? 0) : 0)),
    ]),
  ) as GameState['resources'];
  const cottages = upgradeSum(state, (e) => (e.kind === 'startHousing' ? e.cottages : 0));
  const extraPeasants = upgradeSum(state, (e) => (e.kind === 'startHousing' ? e.peasants : 0));
  state.buildings = Object.fromEntries(
    BUILDING_IDS.map((id) => [id, (start.buildings[id] ?? 0) + (id === 'cottage' ? cottages : 0)]),
  ) as Record<BuildingId, number>;
  const jobs = { ...start.jobs };
  state.peasants = {
    ...state.peasants,
    total: Object.values(jobs).reduce((a, b) => a + b, 0) + extraPeasants,
    jobs,
    lastSettleAt: 0,
  };
  // The extra families take open jobs in the player's priority order.
  for (let i = 0; i < extraPeasants; i++) {
    const job = state.peasants.priority.find(
      (j) => state.peasants.jobs[j] < jobSlots(state, j).value,
    );
    if (job) state.peasants.jobs[job] += 1;
  }
};

/** The 3 highest levels, ties kept in roster order then content order (GDD §5.9.7). */
const defaultActive = (state: GameState, cap: number): HunterId[] => {
  const order = (id: HunterId): number => {
    const i = state.roster.active.indexOf(id);
    return i >= 0 ? i : state.roster.active.length + HUNTER_IDS.indexOf(id);
  };
  return (Object.keys(state.hunters) as HunterId[])
    .sort(
      (a, b) =>
        (state.hunters[b]?.level ?? 0) - (state.hunters[a]?.level ?? 0) || order(a) - order(b),
    )
    .slice(0, cap);
};

export const resetForNewCycle = (state: GameState): void => {
  const share = levelsKeptShare(state).value;
  const ending = state.cycle.number;
  // Hunters: part of their levels, XP to 0, no gear, no injuries; their record stays.
  for (const id of Object.keys(state.hunters) as HunterId[]) {
    const h = state.hunters[id];
    if (!h) continue;
    state.hunters[id] = {
      ...h,
      level: keptLevel(h.level, share),
      xp: 0,
      weapon: null,
      armor: null,
      recovery: null,
    };
  }
  // The dead return as candidates, levels halved like everyone's.
  for (const f of state.fallen)
    if (f.cycle === ending && f.level !== undefined) f.returnLevel = keptLevel(f.level, share);

  state.cycle = { number: ending + 1, age: start.age };
  startingHold(state);
  state.roster = { active: defaultActive(state, num('roster.hamletCap')) };
  state.board = {
    opened: false,
    open: [],
    nextArrivalAt: null,
    arrivals: state.board.arrivals, // contract ids never repeat
    tierWins: state.board.tierWins.map(() => 0),
  };
  state.running = [];
  state.results = [];
  state.stores = Object.fromEntries(
    [...CONSUMABLE_IDS, ...INGREDIENT_IDS].map((id) => [id, 0]),
  ) as GameState['stores'];
  state.queues = { brewing: [], investigation: [] };
  state.garden = { nextAt: null };
  state.threat = 0;
  state.arrivalDue = false;
  state.stats = { ...state.stats, trophies: 0 };
  // GDD §5.14.1: one act per cycle. A cycle with no act (before v0.5, or the v0.4
  // arrival's) is followed by Act I (D149).
  const act = (state.cycles[state.cycles.length - 1]?.act ?? 0) + 1;
  state.cycles.push(freshCycleRecord(ending + 1, state.time, act));
  state.story.acts.push(freshAct(act, ending + 1, state.time));
  syncBoardOpen(state);
};
