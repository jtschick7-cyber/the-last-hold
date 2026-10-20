import type { CycleRecord, GameState } from '../state/game-state';
import type { StandPool } from './waves';

// GDD §5.9.3, §5.12.9 (plan T9.9, D363, D386): which species pool this cycle's Last Stand draws
// from. It is fixed on the cycle record when the wave list is first fixed (Bastion reached), so a
// stand made earlier, and every recorded stand, keeps its old pool.

/** Act VI has begun in the save: its progress exists, whatever cycle it began in (and every one after). */
export const actSixBegun = (state: GameState): boolean => state.story.acts.some((a) => a.act >= 6);

const currentRecord = (state: GameState): CycleRecord | undefined =>
  state.cycles[state.cycles.length - 1];

/** The pool the stand of this cycle uses: the fixed one, or what it would be if fixed now. */
export const standPoolOf = (state: GameState): StandPool =>
  currentRecord(state)?.standPool ?? (actSixBegun(state) ? 'dross' : 'base');

/** Fixes the pool on the cycle record, once. Called when Bastion is reached, and when a stand is made. */
export const fixStandPool = (state: GameState): void => {
  const record = currentRecord(state);
  if (record && record.standPool === null) record.standPool = standPoolOf(state);
};
