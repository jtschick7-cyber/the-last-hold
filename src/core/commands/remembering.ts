import type { GameState } from '../state/game-state';
import { rememberingNearPending, rememberingReadyNote } from '../story/remembering-view';
import { actVIStandApplied } from '../story/remembering';
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
