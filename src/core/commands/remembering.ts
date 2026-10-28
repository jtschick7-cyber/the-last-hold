import type { GameState } from '../state/game-state';
import { ENDING_IDS, type EndingId } from '../state/remembering-state';
import { rememberingNearPending, rememberingReadyNote } from '../story/remembering-view';
import { actVIStandApplied, rememberingGate } from '../story/remembering';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.15.2 (D461 (4), D466 (1)): the two small flags. The UI calls `seeNear` only when Pechko's
// scene is closed with Continue (the ✕ leaves it waiting), and `noteReady` when the ready line is shown.

export const seeNear = (state: GameState): ApplyResult => {
  if (state.remembering.nearSeen) return ok;
  if (!actVIStandApplied(state)) return refuse("Act VI's Last Stand has not been applied yet.");
  if (!rememberingNearPending(state)) return refuse('Nothing is waiting.');
  state.remembering.nearSeen = true;
  return ok;
};

export const noteReady = (state: GameState): ApplyResult => {
  if (rememberingReadyNote(state) === null) return refuse('There is nothing to note yet.');
  state.remembering.readyNoted = true;
  return ok;
};

/** Why an ending cannot be chosen now, or null (GDD §5.15.3, D461 (1)). */
const choiceProblem = (state: GameState, ending: EndingId): string | null => {
  if (!(ENDING_IDS as readonly string[]).includes(ending)) return 'No such ending.';
  // D562 (S2): only a won Descent records 'descent', and the Descent command does that itself.
  if (ending === 'descent') return 'The Descent is fought, not chosen.';
  if (!actVIStandApplied(state)) return "Act VI's Last Stand has not been applied yet.";
  if (!rememberingGate(state)) return 'The roll is not full yet, or the beasts are not all known.';
  const done = state.remembering.endings;
  if (done.some((e) => e.ending === ending)) return 'That has already been chosen.';
  if (ending === 'vigil' && done.some((e) => e.ending === 'remember'))
    return 'The roll has been read; the vigil is no longer a choice.';
  return null;
};

/**
 * Records an ending (GDD §5.15.3). Remember Them is recorded once; Keep the Vigil once, and never
 * after Remember Them. Order is array order; `at` is information only (D461 (2)). Nothing else in
 * the state changes: the scenes that follow are the UI's, and no number moves (D457).
 */
export const chooseEnding = (state: GameState, ending: EndingId, now: number): ApplyResult => {
  const problem = choiceProblem(state, ending);
  if (problem) return refuse(problem);
  state.remembering.endings.push({ ending, at: now, cycle: state.cycle.number });
  return ok;
};
