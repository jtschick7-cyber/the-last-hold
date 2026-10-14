import { WARDEN_NAME_MAX } from '../../content/story/scenes';
import type { GameState } from '../state/game-state';
import { completeV05Arrival, v05ArrivalProblem } from '../story/arrival';
import { cleanWardenName } from '../story/wardens';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.14.5 (D152): a warden's name, typed on the new-warden sheet, on the v0.5
// arrival for earlier wardens, or changed later from the Roll of Wardens.
export const nameWarden = (state: GameState, cycle: number, name: string): ApplyResult => {
  if (typeof name !== 'string') return refuse('A name is text.');
  const record = state.cycles.find((c) => c.number === cycle);
  if (!record) return refuse('No warden kept the hearth that cycle.');
  const clean = cleanWardenName(name);
  if (clean === 'too-long') return refuse(`A name fits in ${WARDEN_NAME_MAX} characters.`);
  record.warden = clean;
  return ok;
};

/** GDD §5.14.1 (D149): the v0.5 arrival, once, after any v0.4 arrival. */
export const arriveV05 = (state: GameState, names: Record<number, string>): ApplyResult => {
  const problem = v05ArrivalProblem(state);
  if (problem) return refuse(problem);
  if (typeof names !== 'object' || names === null) return refuse('Names by cycle, please.');
  for (const n of Object.values(names)) {
    if (typeof n !== 'string') return refuse('A name is text.');
    if (cleanWardenName(n) === 'too-long')
      return refuse(`A name fits in ${WARDEN_NAME_MAX} characters.`);
  }
  completeV05Arrival(state, names);
  return ok;
};

/** Debug (plan T5.10): makes this save meet Ilse again, as a pre-v0.5 save would. */
export const runV05Arrival = (state: GameState): ApplyResult => {
  if (state.story.arrivalDue) return refuse('Ilse is already due.');
  state.story.arrivalDue = true;
  state.meta.debugUsed = true;
  return ok;
};

/** GDD §5.14.2: an opened Archive item loses its badge. */
export const readArchive = (state: GameState, key: string): ApplyResult => {
  if (!state.story.unread.includes(key)) return refuse('Nothing new there.');
  state.story.unread = state.story.unread.filter((k) => k !== key);
  return ok;
};
