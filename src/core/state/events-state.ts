import type { HunterId } from '../../content/hunters';
import { HUNT_IDS, type HuntId } from '../../content/hunts';
import type { FightRef } from './game-state';

// Technical design §5.2 (v9, D358–D387): everything events keep. Kept through the Long Night
// (GDD §5.12.10) and small. Times are event time in milliseconds (`clock`), not wall-clock.

/** A short result of the latest attempt, kept until read so a closed app still shows it. */
export interface EventResult {
  kind: 'boss' | 'hunt';
  attempt: number;
  at: number;
}

export interface EventsState {
  /** True once the Citadel has been reached (D366); never goes back. */
  opened: boolean;
  /** The one-time scene (GDD §5.12.1) has been shown. */
  sceneSeen: boolean;
  /**
   * The monotone event clock (D359 (5), D387 (1)): `value` is event time, `high` the latest real
   * time seen. Time only ever passes beyond the high-water mark.
   */
  clock: { value: number; high: number };
  /** Tokens banked at event time `at`; `at` is null until events first open. */
  tokens: { count: number; at: number | null };
  /** A monotone counter; part of every attempt's seed. */
  attempts: number;
  /** Hunter → event time they are rested at. Entries already in the past are dropped on load. */
  rest: Partial<Record<HunterId, number>>;
  boss: {
    /** 0-based; the boss is `order[visit % 3]`, the pass `floor(visit / 3)`. */
    visit: number;
    /** Fixed at the visit's first attempt. */
    tier: number | null;
    /** Health left; null until the first attempt. */
    pool: number | null;
    /** Milestones already paid this visit, 0–4. */
    paid: number;
    /** Attempts made in this visit. */
    attempts: number;
  };
  hunts: Record<HuntId, { points: number; unlocked: boolean }>;
  last: EventResult | null;
  /** The last `events.recentKeep` event fights: seeds and inputs, never logs (technical design §5.3). */
  recent: FightRef[];
}

export const newEventsState = (now: number): EventsState => ({
  opened: false,
  sceneSeen: false,
  clock: { value: 0, high: now },
  tokens: { count: 0, at: null },
  attempts: 0,
  rest: {},
  boss: { visit: 0, tier: null, pool: null, paid: 0, attempts: 0 },
  hunts: Object.fromEntries(
    HUNT_IDS.map((id) => [id, { points: 0, unlocked: false }]),
  ) as EventsState['hunts'],
  last: null,
  recent: [],
});
