import type { Command } from '../commands';
import type { GameState } from '../state/game-state';
import { actVIStandApplied, endingChoosable } from '../story/remembering';
import { vigilView } from '../systems/vigil';

// GDD §6.1 (v1.3, D546 (2), Q58): what the Vigilant does at a check-in. It plays Standard, with
// Standard's every decision, and adds two moves. Standard never opens the Remembering gate (Q45,
// D469), so once Act VI's stand is applied the Vigilant opens it with the DEBUG shortcut
// `debug.rememberingOpenGate` (the run is marked `debugUsed`, and the report says why). Then it
// switches Rising Vigil On before each stand, for `VIGILANT_LEVELS` stands (levels 1, 2, 3).
// Every move is a Command through apply(); nothing here rolls a die or reads the clock.

type Act = (cmd: Command) => boolean;

/** How many endless stands the Vigilant makes with the switch On (D546 (2)). */
export const VIGILANT_LEVELS = 3;

export interface VigilantCheckIn {
  /** It used the debug shortcut at this check-in. */
  readonly openedGate: boolean;
  /** It switched Rising Vigil On at this check-in. */
  readonly switchedOn: boolean;
}

export const vigilantMoves = (s: GameState, act: Act): VigilantCheckIn => {
  const openedGate =
    actVIStandApplied(s) && !endingChoosable(s)
      ? act({ type: 'debug.rememberingOpenGate' })
      : false;
  const v = vigilView(s);
  const switchedOn =
    v.available && !v.on && v.stands < VIGILANT_LEVELS
      ? act({ type: 'vigil.set', on: true })
      : false;
  return { openedGate, switchedOn };
};

/** The Vigilant has made all its On stands. */
export const vigilantDone = (s: GameState): boolean => vigilView(s).stands >= VIGILANT_LEVELS;
