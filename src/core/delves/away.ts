import { balance } from '../../content/balance';
import type { GameState } from '../state/game-state';
import { delvesOpen } from './access';
import { allowanceCap } from './riftglass';

// GDD §9.15: what a Delve adds to the away sheet and the Rift card. Light on purpose: the away
// summary (core/sim) uses it.

/** "Floor 3", or "the guardian" for the seventh. */
export const floorName = (floor: number): string =>
  floor > balance.delve.floors.value ? 'the guardian' : `floor ${floor}`;

/** The away sheet's Delve lines: a run waiting and the Riftglass waiting. */
export const awayDelveLines = (state: GameState): string[] => {
  if (!delvesOpen(state)) return [];
  const lines: string[] = [];
  const run = state.delve.run;
  if (run) lines.push(`A Delve is waiting on ${floorName(run.floor)}.`);
  const waiting = Math.floor(state.delve.allowance);
  if (waiting > 0) lines.push(`Riftglass waiting: ${waiting} of ${allowanceCap()}.`);
  return lines;
};
