import { LAST_WRITTEN_ACT } from '../../content/story/acts';
import type { GameState } from '../state/game-state';
import { freshAct } from '../state/story-state';
import { actDue, startAct } from '../story/act-start';
import { isFound } from '../story/documents';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.14.1 (D246): a save re-based onto Act IV or Act V by a migration meets the act's opening
// scene on load. The sheet that shows it sends this command.
export const startActOnLoad = (state: GameState): ApplyResult => {
  const act = actDue(state);
  if (act === null) return refuse('There is no act waiting to begin.');
  startAct(state, act);
  return ok;
};

/**
 * Debug (plan T7.5, T8.5, as "Start Act III" is, D229): begins Act IV or Act V in the current
 * cycle, as if the Long Night had, so its documents and scenes can be tried without playing
 * the cycles before.
 */
export const debugStartAct = (state: GameState, act: number): ApplyResult => {
  if (!Number.isInteger(act) || act < 4 || act > LAST_WRITTEN_ACT)
    return refuse('Only Acts IV and V can be started here.');
  if (isFound(state, `D${act}-01`))
    return refuse(`Act ${act === 4 ? 'IV' : 'V'} is already under way.`);
  const record = state.cycles[state.cycles.length - 1];
  if (!record) return refuse('There is no cycle to begin it in.');
  if (!state.story.acts.some((a) => a.act === act)) {
    state.story.acts.push(freshAct(act, state.cycle.number, state.time));
    record.act = act;
  }
  state.meta.debugUsed = true;
  startAct(state, act);
  return ok;
};
