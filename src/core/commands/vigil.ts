import type { GameState } from '../state/game-state';
import { vigilAvailable } from '../systems/vigil';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.9.10 and technical design §21.3 (D544): the Rising Vigil switch. It rolls nothing and
// sets no flag. There is no "this cycle's stand has started" refusal: the stand and the Long Night
// that follows it are one command (stand.ts), so a state where the stand is made and the cycle is
// still the same never exists (tests/vigil/commands.test.ts proves it).

export const vigilSet = (state: GameState, on: boolean): ApplyResult => {
  if (typeof on !== 'boolean') return refuse('vigil: on must be true or false');
  if (on && !vigilAvailable(state)) return refuse('vigil: not available until the gate is open');
  state.vigil.on = on;
  return ok;
};

/** Plan KV.4 (D544 (7)): a high level without playing. Like every debug action it sets debugUsed. */
export const debugVigilSetStands = (state: GameState, stands: number): ApplyResult => {
  if (typeof stands !== 'number' || !Number.isSafeInteger(stands) || stands < 0)
    return refuse('debug: stands must be a whole number, 0 or more');
  state.vigil.stands = stands;
  state.meta.debugUsed = true;
  return ok;
};
