import type { GameState } from '../state/game-state';
import { beginAct, currentAct, isFound } from './documents';

// GDD §5.14.1 (D245, D246): Act IV begins with the next warden after Act III's stand
// (core/commands/stand.ts). A save that was in a story-less cycle when Act IV shipped has had
// its current cycle re-based onto Act IV by the v7 migration, with fresh counters, and meets
// Pechko's bundle (D4-01) on load.

/** Act IV has begun in this cycle, but its opening scene has not played yet. */
export const actFourDue = (state: GameState): boolean =>
  currentAct(state) === 4 &&
  state.story.acts.some((a) => a.act === 4) &&
  !isFound(state, 'D4-01') &&
  !state.story.arrivalDue &&
  !state.arrivalDue;

/**
 * D4-01 plays on load (`via` 'arrival'), and any Act IV Rank document the save already stands
 * behind in this cycle is found with it. Returns the keys of everything new.
 */
export const startActFour = (state: GameState): string[] => beginAct(state, 4, 'arrival');
