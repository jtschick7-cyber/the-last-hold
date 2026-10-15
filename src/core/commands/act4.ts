import type { GameState } from '../state/game-state';
import { freshAct } from '../state/story-state';
import { actFourDue, startActFour } from '../story/act4';
import { isFound } from '../story/documents';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.14.1 (D246): a save re-based onto Act IV by the v7 migration meets Pechko's bundle
// on load. The sheet that shows it sends this command (the card is T7.13b).
export const startActFourOnLoad = (state: GameState): ApplyResult => {
  if (!actFourDue(state)) return refuse('Act IV has already begun.');
  startActFour(state);
  return ok;
};

/**
 * Debug (plan T7.5, as "Start Act III" is, D229): begins Act IV in the current cycle, as if
 * the Long Night had, so its documents and scenes can be tried without playing three cycles.
 */
export const debugStartActFour = (state: GameState): ApplyResult => {
  if (isFound(state, 'D4-01')) return refuse('Act IV is already under way.');
  const record = state.cycles[state.cycles.length - 1];
  if (!record) return refuse('There is no cycle to begin it in.');
  if (!state.story.acts.some((a) => a.act === 4)) {
    state.story.acts.push(freshAct(4, state.cycle.number, state.time));
    record.act = 4;
  }
  state.meta.debugUsed = true;
  startActFour(state);
  return ok;
};
