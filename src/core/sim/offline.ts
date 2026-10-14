import { skillLevels } from '../skills/skills';
import type { SkillId } from '../../content/skills';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { num } from '../balance-access';
import type { ContractResult, GameState } from '../state/game-state';
import { shiftClock } from '../state/shift';
import { offlineCap } from '../systems/offline-cap';
import { MS_PER_SECOND } from '../time';
import { advance, type AdvanceEvent } from './advance';

// Technical design §6.4 / GDD §5.2: offline time runs through the same advance()
// as live play, in 60 s chunks that only drive the progress bar. Time beyond the
// cap is reported, not simulated. A clock moved backward counts as no time (D21).

/** After this many chunks, catch-up hands control back so the bar can paint. */
const CHUNKS_PER_YIELD = 50;

export interface AwaySummary {
  /** Real time away (ms); 0 if the clock moved backward. */
  away: number;
  /** Time actually simulated (ms): away, limited by the offline cap. */
  counted: number;
  capped: boolean;
  backwardClock: boolean;
  /** Net change per resource over the counted time (spending included). */
  resources: Record<ResourceId, number>;
  peasantsSettled: number;
  /** What the jobs made while away, by resource (spending not subtracted). */
  produced: Record<ResourceId, number>;
  /** Contracts that finished while away, with their outcomes (GDD §5.2, v0.2). */
  contracts: ContractResult[];
  /** Hunters whose injury healed while away. */
  recovered: string[];
  /** Contracts that arrived on the board while away. */
  arrivals: number;
  events: AdvanceEvent[];
  /** Warden skill levels before and after (GDD §5.8.6); the UI words any rise. Absent in older reports. */
  skills?: { before: Record<SkillId, number>; after: Record<SkillId, number> };
}

export interface CatchUpProgress {
  done: number;
  total: number;
}

/**
 * Catches the game up to `now`. A generator so the caller decides how to pace
 * it: `for (const p of catchUp(...)) await nextFrame()` in the browser, or just
 * run it to the end in tests and the simulator. Returns the away summary.
 */
export function* catchUp(state: GameState, now: number): Generator<CatchUpProgress, AwaySummary> {
  const before = { ...state.resources };
  const settledBefore = state.stats.peasantsSettled;
  const skillsBefore = skillLevels(state);
  const backwardClock = now < state.meta.clockHighWater;
  const away = backwardClock ? 0 : Math.max(0, now - state.time);
  const cap = offlineCap(state).value * MS_PER_SECOND;
  const counted = Math.min(away, cap);
  const end = state.time + counted;
  const chunk = num('offline.chunk') * MS_PER_SECOND;
  const total = Math.ceil(counted / chunk);
  const events: AdvanceEvent[] = [];
  const produced = Object.fromEntries(RESOURCE_IDS.map((r) => [r, 0])) as Record<
    ResourceId,
    number
  >;

  for (let i = 1; i <= total; i++) {
    const log = advance(state, Math.min(end, state.time + chunk));
    events.push(...log.events);
    for (const r of RESOURCE_IDS) produced[r] += log.produced[r];
    if (i % CHUNKS_PER_YIELD === 0 && i < total) yield { done: i, total };
  }

  if (backwardClock && now < state.time) {
    // D21: a clock moved backward counts as no time and costs nothing. Rebase
    // the game's clock onto the device's so live play carries on at once,
    // keeping the settle spacing intact.
    shiftClock(state, now - state.time);
  }
  // Time past the cap passes without production (GDD §5.2).
  state.time = Math.max(state.time, now);
  state.meta.lastSeen = now;
  state.meta.clockHighWater = Math.max(state.meta.clockHighWater, now);

  const resources = Object.fromEntries(
    RESOURCE_IDS.map((r) => [r, state.resources[r] - before[r]]),
  ) as Record<ResourceId, number>;
  return {
    away,
    counted,
    capped: away > counted,
    backwardClock,
    resources,
    peasantsSettled: state.stats.peasantsSettled - settledBefore,
    produced,
    contracts: events.flatMap((e) => (e.type === 'contract' ? [e.result] : [])),
    recovered: events.flatMap((e) => (e.type === 'recovered' ? [e.hunter] : [])),
    arrivals: events.filter((e) => e.type === 'arrival').length,
    events,
    skills: { before: skillsBefore, after: skillLevels(state) },
  };
}

/** Runs a catch-up to the end without pausing. */
export const catchUpNow = (state: GameState, now: number): AwaySummary => {
  const gen = catchUp(state, now);
  for (;;) {
    const step = gen.next();
    if (step.done) return step.value;
  }
};
