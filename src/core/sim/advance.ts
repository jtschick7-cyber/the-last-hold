import type { ConsumableId } from '../../content/consumables';
import { accrueAllowance } from '../delves/riftglass';
import { grantIdleDelveRelics } from '../delves/rewards';
import type { IngredientId } from '../../content/ingredients';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import type { ContractResult, GameState } from '../state/game-state';
import { productionRate } from '../systems/production';
import { nextSettleTime, settleOne } from '../systems/settle-event';
import { applyArrival, nextArrivalTime } from '../contracts/board';
import { applyBrew, nextBrewTime } from '../alchemy/brewing';
import { applyHarvest, nextGardenTime } from '../alchemy/garden';
import { applyClue, nextClueTime } from '../investigation/lodge';
import {
  applyCompletion,
  applyRecovery,
  nextCompletionTime,
  nextRecoveryTime,
} from '../contracts/complete';
import { accrueThreat } from '../threat/threat';
import { MS_PER_MINUTE } from '../time';
import { foldEventClock } from '../systems/events';

// Technical design §6.2 (GDD §5.2, D30): advance() is event-driven. Rates are
// constant between events, so resources move linearly to the next event, the
// event applies, and the loop repeats. Chunk size therefore never changes the
// result. v0.1 has one event source: auto-settle. Later sources (contract
// completions, recoveries, brews, clues, refills) join here in the tie order
// completions → recoveries → brews → clues → refills → settles [JC].

export type AdvanceEvent =
  | { type: 'settle'; at: number; job: string | null }
  /** A contract finished: its rewards, injuries and XP applied now (B9). */
  | { type: 'contract'; at: number; result: ContractResult }
  | { type: 'recovered'; at: number; hunter: string }
  | { type: 'arrival'; at: number; contractId: string }
  /** A brew finished into the stores (GDD §5.7). */
  | { type: 'brew'; at: number; item: string }
  /** An experiment finished: the properties it showed, and the brews it newly made makeable (GDD §5.8.3). */
  | {
      type: 'experiment';
      at: number;
      a: IngredientId;
      b: IngredientId;
      revealed: readonly { ingredient: IngredientId; index: number }[];
      discovered: readonly ConsumableId[];
    }
  /** The Herb Gardens grew `each` of every herb. */
  | { type: 'harvest'; at: number; each: number }
  /** A Lodge slot revealed a clue; `identified` when it left one species (GDD §5.6.3). */
  | { type: 'clue'; at: number; contractId: string; revealed: number; identified: boolean };

export interface AdvanceLog {
  from: number;
  to: number;
  events: AdvanceEvent[];
  /** What the jobs made over this advance, by resource (the simulator tells income from spending). */
  produced: Record<ResourceId, number>;
}

// Settles are bounded by housing, so this only stops a runaway bug.
const MAX_EVENTS_PER_ADVANCE = 100_000;

const integrate = (state: GameState, until: number, produced: Record<ResourceId, number>): void => {
  const dt = until - state.time;
  if (dt <= 0) return;
  const perMs: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_IDS) perMs[r] = productionRate(state, r).value / MS_PER_MINUTE;
  for (const r of RESOURCE_IDS) {
    const made = (perMs[r] ?? 0) * dt;
    state.resources[r] += made;
    produced[r] += made;
  }
  // GDD §5.9.1: Threat rises with time like production, so the offline cap applies to it.
  accrueThreat(state, dt);
  state.time = until;
};

/** Moves the game forward to `toTime` (epoch ms). Never moves backward. */
export const advance = (state: GameState, toTime: number): AdvanceLog => {
  const produced = Object.fromEntries(RESOURCE_IDS.map((r) => [r, 0])) as Record<
    ResourceId,
    number
  >;
  const log: AdvanceLog = {
    from: state.time,
    to: Math.max(state.time, toTime),
    events: [],
    produced,
  };
  for (let i = 0; i < MAX_EVENTS_PER_ADVANCE; i++) {
    // Technical design §6.2: the next event of any kind. Ties at the same instant go
    // completions, recoveries, brews, clues, refills (the Herb Garden, then board arrivals),
    // then settles [JC].
    const due: [number | null, number][] = [
      [nextCompletionTime(state), 0],
      [nextRecoveryTime(state), 1],
      [nextBrewTime(state), 5],
      [nextClueTime(state), 4],
      [nextGardenTime(state), 6],
      [nextArrivalTime(state), 2],
      [nextSettleTime(state), 3],
    ];
    let at: number | null = null;
    let kind = -1;
    for (const [t, order] of due) {
      if (t === null) continue;
      if (at === null || t < at) {
        at = t;
        kind = order;
      }
    }
    if (at === null || at > toTime) break;
    integrate(state, Math.max(at, state.time), produced);
    if (kind === 0) {
      const r = applyCompletion(state);
      if (r) log.events.push({ type: 'contract', at: r.at, result: r });
    } else if (kind === 1) {
      const hunter = applyRecovery(state);
      if (hunter) log.events.push({ type: 'recovered', at: state.time, hunter });
    } else if (kind === 5) {
      const done = applyBrew(state);
      if (done && 'item' in done) log.events.push({ type: 'brew', ...done });
      else if (done) {
        log.events.push({ type: 'experiment', ...done });
        // GDD §8.10a (D261): the recipe book complete finds the Horn Spoon.
        grantIdleDelveRelics(state);
      }
    } else if (kind === 6) {
      const h = applyHarvest(state);
      if (h) log.events.push({ type: 'harvest', ...h });
    } else if (kind === 4) {
      const clue = applyClue(state);
      if (clue) log.events.push({ type: 'clue', ...clue });
    } else if (kind === 2) {
      const c = applyArrival(state);
      if (c) log.events.push({ type: 'arrival', at: c.arrivedAt, contractId: c.id });
    } else {
      const { job } = settleOne(state);
      log.events.push({ type: 'settle', at: state.time, job });
    }
  }
  integrate(state, toTime, produced);
  // The Riftglass allowance grows with time (GDD §5.10.8, D258); the Delve run itself does not.
  accrueAllowance(state, state.time);
  // The game was running up to here (technical design §6.4 bookkeeping).
  state.meta.lastSeen = state.time;
  state.meta.clockHighWater = Math.max(state.meta.clockHighWater, state.time);
  // The event clock (D359): live ticks and catch-up fold elapsed time the same way, so they match.
  foldEventClock(state, state.time);
  return log;
};
