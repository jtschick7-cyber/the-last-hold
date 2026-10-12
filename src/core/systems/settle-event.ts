import type { GameState } from '../state/game-state';
import { num } from '../balance-access';
import { reached } from '../math';
import { MS_PER_MINUTE, MS_PER_SECOND } from '../time';
import { housing, jobSlots } from './housing';
import { productionRate } from './production';
import { settleCost } from './settle';

// GDD §5.1.1 auto-settle: while housing is free and food covers the cost, a new
// peasant settles, at most one every 30 s. Technical design §6.2: the event
// fires at max(lastSettleAt + 30 s, the moment food reaches the cost).

/** When the next settle happens at current rates, or null if it never will. */
export const nextSettleTime = (state: GameState): number | null => {
  if (!state.peasants.autoSettle) return null;
  if (state.peasants.total >= housing(state).value) return null;
  const earliest = state.peasants.lastSettleAt + num('peasant.settleMinInterval') * MS_PER_SECOND;
  const cost = settleCost(state.peasants.total).value;
  const food = state.resources.food;
  if (reached(food, cost)) return Math.max(state.time, earliest);
  const perMs = productionRate(state, 'food').value / MS_PER_MINUTE;
  if (perMs <= 0) return null;
  return Math.max(state.time + (cost - food) / perMs, earliest);
};

/** Settles one peasant now; they take the first open slot in priority order. */
export const settleOne = (state: GameState): { job: string | null } => {
  const cost = settleCost(state.peasants.total).value;
  // Never below zero: `reached` may accept food a few ulps short of the cost.
  state.resources.food = Math.max(0, state.resources.food - cost);
  state.peasants.total += 1;
  state.peasants.lastSettleAt = state.time;
  state.stats.peasantsSettled += 1;
  for (const job of state.peasants.priority) {
    if (state.peasants.jobs[job] < jobSlots(state, job).value) {
      state.peasants.jobs[job] += 1;
      return { job };
    }
  }
  return { job: null };
};
