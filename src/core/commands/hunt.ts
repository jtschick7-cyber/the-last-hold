import type { HunterId } from '../../content/hunters';
import type { TrackId } from '../../content/hunts';
import { noPreparation, type GameState, type Preparation } from '../state/game-state';
import { huntProblem, makeHuntAttempt } from '../systems/hunt';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.12.6 (plan T9.8): one Legendary Hunt attempt. Validates first, so a refused attempt changes nothing.
export const huntAttempt = (
  state: GameState,
  track: TrackId,
  party: HunterId[],
  prep: Preparation = noPreparation(),
  now: number,
): ApplyResult => {
  const problem = huntProblem(state, track, party, prep, now);
  if (problem) return refuse(problem);
  makeHuntAttempt(state, track, party, prep, now);
  return ok;
};
