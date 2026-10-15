import type { GameState } from '../state/game-state';
import { ok, type ApplyResult } from './types';

/**
 * Debug (plan T7.13b acceptance, GDD §5.10.5, D257): opens or closes the Unlit's door, which is
 * otherwise locked until Act V's Last Stand, so its blessings and their drawbacks can be tried.
 */
export const debugUnlit = (state: GameState, open: boolean): ApplyResult => {
  state.delve.unlitOpen = open;
  state.meta.debugUsed = true;
  return ok;
};
