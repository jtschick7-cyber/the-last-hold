import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import type { GameState } from '../state/game-state';
import { productionRate } from '../systems/production';
import { nextSettleTime, settleOne } from '../systems/settle-event';
import { MS_PER_MINUTE } from '../time';

// Technical design §6.2 (GDD §5.2, D30): advance() is event-driven. Rates are
// constant between events, so resources move linearly to the next event, the
// event applies, and the loop repeats. Chunk size therefore never changes the
// result. v0.1 has one event source: auto-settle. Later sources (contract
// completions, recoveries, brews, clues, refills) join here in the tie order
// completions → recoveries → brews → clues → refills → settles [JC].

export type AdvanceEvent = { type: 'settle'; at: number; job: string | null };

export interface AdvanceLog {
  from: number;
  to: number;
  events: AdvanceEvent[];
}

// Settles are bounded by housing, so this only stops a runaway bug.
const MAX_EVENTS_PER_ADVANCE = 100_000;

const integrate = (state: GameState, until: number): void => {
  const dt = until - state.time;
  if (dt <= 0) return;
  const perMs: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_IDS) perMs[r] = productionRate(state, r).value / MS_PER_MINUTE;
  for (const r of RESOURCE_IDS) state.resources[r] += (perMs[r] ?? 0) * dt;
  state.time = until;
};

/** Moves the game forward to `toTime` (epoch ms). Never moves backward. */
export const advance = (state: GameState, toTime: number): AdvanceLog => {
  const log: AdvanceLog = { from: state.time, to: Math.max(state.time, toTime), events: [] };
  for (let i = 0; i < MAX_EVENTS_PER_ADVANCE; i++) {
    const settleAt = nextSettleTime(state);
    if (settleAt === null || settleAt > toTime) break;
    integrate(state, settleAt);
    const { job } = settleOne(state);
    log.events.push({ type: 'settle', at: state.time, job });
  }
  integrate(state, toTime);
  // The game was running up to here (technical design §6.4 bookkeeping).
  state.meta.lastSeen = state.time;
  state.meta.clockHighWater = Math.max(state.meta.clockHighWater, state.time);
  return log;
};
