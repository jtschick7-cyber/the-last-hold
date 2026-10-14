import type { GameState } from '../state/game-state';
import { freshAct } from '../state/story-state';
import { actThreeDue, arriveArvid } from '../story/act3';
import { isFound } from '../story/documents';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.14.1 (D214): a save whose cycle began Act III before it was written meets
// Arvid on load. The sheet that shows his arrival sends this command.
export const startActThree = (state: GameState): ApplyResult => {
  if (!actThreeDue(state)) return refuse('Act III has already begun.');
  arriveArvid(state, 'arrival');
  return ok;
};

/**
 * Debug (plan T6.7): begins Act III in the current cycle, as if the Long Night had, so
 * Arvid's arrival and the Act III scenes can be tried without playing two cycles.
 */
export const debugStartActThree = (state: GameState): ApplyResult => {
  if (state.hunters.arvid && isFound(state, 'D3-01'))
    return refuse('Act III is already under way.');
  const record = state.cycles[state.cycles.length - 1];
  if (!record) return refuse('There is no cycle to begin it in.');
  if (!state.story.acts.some((a) => a.act === 3)) {
    state.story.acts.push(freshAct(3, state.cycle.number, state.time));
    record.act = 3;
  }
  state.meta.debugUsed = true;
  arriveArvid(state, 'arrival');
  return ok;
};
