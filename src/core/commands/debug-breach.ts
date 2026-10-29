import type { GameState } from '../state/game-state';
import { ok, type ApplyResult } from './types';

// Technical design §15, §23 (D593, D594): the one Breach debug command. It changes nothing but the
// debug mark: the panel then shows the table a stand started now would freeze (`describeFreeze`).
// There is no command that sets lanes: a list set that way could not be saved on the record, so its
// stand would not replay.
export const debugBreachFreeze = (state: GameState): ApplyResult => {
  state.meta.debugUsed = true;
  return ok;
};
