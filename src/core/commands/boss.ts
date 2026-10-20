import { noPreparation, type GameState, type Preparation } from '../state/game-state';
import type { HunterId } from '../../content/hunters';
import { attemptProblem, makeAttempt } from '../systems/boss';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.12.4 (plan T9.6): one boss attempt. Validates first, so a refused attempt changes nothing.
export const bossAttempt = (
  state: GameState,
  party: HunterId[],
  prep: Preparation = noPreparation(),
  now: number,
): ApplyResult => {
  const problem = attemptProblem(state, party, prep, now);
  if (problem) return refuse(problem);
  makeAttempt(state, party, prep, now);
  return ok;
};
