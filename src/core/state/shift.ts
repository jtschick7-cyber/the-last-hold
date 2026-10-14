import type { GameState } from './game-state';

/**
 * Moves every timestamp the game holds by `delta` ms (negative = earlier), so a
 * whole world shifts together: the clock, the settle spacing, the board timer,
 * running contracts, recoveries, and the history that quotes times. Used by the
 * debug time skip (GDD §9.10) and the backward-clock rebase (D21).
 */
export const shiftClock = (state: GameState, delta: number): void => {
  state.time += delta;
  state.meta.lastSeen += delta;
  state.peasants.lastSettleAt += delta;
  if (state.board.nextArrivalAt !== null) state.board.nextArrivalAt += delta;
  if (state.garden.nextAt !== null) state.garden.nextAt += delta;
  for (const j of state.queues.brewing) if (j.doneAt !== null) j.doneAt += delta;
  for (const slot of state.queues.investigation) slot.nextClueAt += delta;
  for (const c of state.board.open) c.arrivedAt += delta;
  for (const r of state.running) {
    r.launchedAt += delta;
    r.endsAt += delta;
    r.contract.arrivedAt += delta;
  }
  for (const h of Object.values(state.hunters)) {
    if (h.recovery) h.recovery.until += delta;
  }
  for (const r of state.results) {
    r.at += delta;
    for (const i of r.injuries) i.until += delta;
  }
  for (const f of state.fallen) f.diedAt += delta;
  for (const f of state.log.recentFights) f.at += delta;
  for (const c of state.cycles) {
    c.startedAt += delta;
    for (const age of Object.keys(c.ranks) as (keyof typeof c.ranks)[]) {
      const at = c.ranks[age];
      if (at !== undefined) c.ranks[age] = at + delta;
    }
    if (c.stand) c.stand.at += delta;
  }
};
