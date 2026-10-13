import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import type { ContractResult, GameState } from '../state/game-state';
import { productionRate } from '../systems/production';
import { nextSettleTime, settleOne } from '../systems/settle-event';
import { applyArrival, nextArrivalTime } from '../contracts/board';
import {
  applyCompletion,
  applyRecovery,
  nextCompletionTime,
  nextRecoveryTime,
} from '../contracts/complete';
import { MS_PER_MINUTE } from '../time';

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
  | { type: 'arrival'; at: number; contractId: string };

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
    // completions, recoveries, board arrivals, then settles [JC].
    const due: [number | null, number][] = [
      [nextCompletionTime(state), 0],
      [nextRecoveryTime(state), 1],
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
    } else if (kind === 2) {
      const c = applyArrival(state);
      if (c) log.events.push({ type: 'arrival', at: c.arrivedAt, contractId: c.id });
    } else {
      const { job } = settleOne(state);
      log.events.push({ type: 'settle', at: state.time, job });
    }
  }
  integrate(state, toTime, produced);
  // The game was running up to here (technical design §6.4 bookkeeping).
  state.meta.lastSeen = state.time;
  state.meta.clockHighWater = Math.max(state.meta.clockHighWater, state.time);
  return log;
};
