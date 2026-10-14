import { WARDEN_NAME_MAX } from '../../content/story/scenes';
import type { GameState } from '../state/game-state';
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
