import { allDocuments } from '../../content/story/acts';
import type { GameState } from '../state/game-state';
import { openOrders } from '../systems/orders-open';
import { findDocument, sweepDocuments } from './documents';
import { noteAllPeaks } from './letters';
import { cleanWardenName } from './wardens';

// GDD §5.14.1, §5.14.3 (D149, D151, D152): a save from before v0.5 meets Ilse on
// load, after any v0.4 arrival. Her scene hands over D1-01 and every document whose
// condition is already behind the save; the save names its wardens once (a blank one
// is carved "the warden before"); Act I has started in the current cycle
// (the v4 → v5 migration). Readings: D182.

/** Why the v0.5 arrival can't happen now, or null. */
export const v05ArrivalProblem = (state: GameState): string | null => {
  if (!state.story.arrivalDue) return 'Ilse has already arrived.';
  if (state.arrivalDue) return 'The first Long Night comes first.';
  return null;
};

/** Ilse arrives; `names` are the earlier wardens' names by cycle. Returns what she hands over. */
export const completeV05Arrival = (
  state: GameState,
  names: Readonly<Record<number, string>>,
): string[] => {
  const keys: string[] = [];
  const first = allDocuments.find((d) => d.id === 'D1-01');
  if (first) keys.push(...findDocument(state, first, 'arrival'));
  keys.push(...sweepDocuments(state, 'arrival'));
  keys.push(...noteAllPeaks(state));
  // Every warden so far, the current one too (nothing else names them before the next
  // Long Night); one left blank is carved "the warden before".
  for (const c of state.cycles) {
    const typed = names[c.number];
    if (typed === undefined) continue;
    const clean = cleanWardenName(typed);
    c.warden = clean === 'too-long' ? null : clean;
  }
  state.story.ilseAt ??= state.time;
  openOrders(state, state.time); // GDD §5.13.1: Ilse's arrival opens the Bell-Watchers
  state.story.arrivalDue = false;
  return keys;
};
