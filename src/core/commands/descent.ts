import type { HunterId } from '../../content/hunters';
import type { GameState, Preparation } from '../state/game-state';
import { spendPrep } from '../contracts/prep';
import { runDescent } from '../systems/descent-fight';
import { descentInputFor, descentProblem } from '../systems/descent-record';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.15.10, technical design §22.4 (D558, D561, D563): one command fights the whole Descent at
// once; the UI plays it back. Nobody dies or is hurt, nothing earns XP, and the cycle does not move:
// the only things that change are the stores, `state.descent` and, on the first win, the endings.

export const startDescent = (
  state: GameState,
  order: readonly HunterId[],
  prep: Pick<Preparation, 'oils' | 'potions'> | undefined,
  now: number,
): ApplyResult => {
  const carried = { oils: prep?.oils ?? {}, potions: prep?.potions ?? {} };
  const problem = descentProblem(state, order, carried);
  if (problem) return refuse(problem);
  const { record, input } = descentInputFor(state, order, carried);
  const run = runDescent(input);
  // Oils and potions are spent at launch; of the bombs, only those thrown are lost.
  spendPrep(state, { ...carried, bombs: [] });
  for (const [id, n] of Object.entries(run.bombsUsed))
    state.stores[id as keyof typeof state.stores] -= n ?? 0;
  record.outcome = run.outcome;
  record.stagesCleared = run.stagesCleared as 0 | 1 | 2 | 3;
  record.standingCount = run.standingCount;
  record.downedCount = run.downedCount;
  record.stages = run.stages.map((s) => s.summary);
  const d = state.descent;
  d.attempts = record.attempt;
  d.last = record;
  d.unreadResult = true;
  if (run.stages.length === input.stageTiers.length) d.unlitMet = true;
  if (record.outcome === 'win') {
    if (!d.firstWin) d.firstWin = structuredClone(record);
    if (!state.remembering.endings.some((e) => e.ending === 'descent'))
      state.remembering.endings.push({ ending: 'descent', at: now, cycle: state.cycle.number });
  }
  return ok;
};

/** The result sheet has been shown: the card stops offering "View Descent result" (GDD §9.24, S9). */
export const markDescentRead = (state: GameState): ApplyResult => {
  state.descent.unreadResult = false;
  return ok;
};
