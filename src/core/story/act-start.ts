import { allDocuments, LAST_WRITTEN_ACT } from '../../content/story/acts';
import type { GameState } from '../state/game-state';
import { beginAct, currentAct, isFound } from './documents';

// GDD §5.14.1 (D245, D246, D302): Acts IV and V begin with the next warden after the act before
// has made its stand (core/commands/stand.ts). A save that was in a story-less cycle when an act
// shipped has had its current cycle re-based onto that act by the migration, with fresh counters,
// and meets the act's opening scene (D4-01, D5-01) on load.

/** The act whose opening scene is due on load, or null: begun in this cycle but not yet played. */
export const actDue = (state: GameState): number | null => {
  const act = currentAct(state);
  if (act === null || act < 4 || act > LAST_WRITTEN_ACT) return null;
  // An act whose opening scene is not in the game yet has nothing to play on load.
  if (!allDocuments.some((d) => d.id === `D${act}-01`)) return null;
  const due =
    state.story.acts.some((a) => a.act === act) &&
    !isFound(state, `D${act}-01`) &&
    !state.story.arrivalDue &&
    !state.arrivalDue;
  return due ? act : null;
};

/**
 * An act's opening scene plays on load (`via` 'arrival'), and any of its Rank documents the save
 * already stands behind in this cycle is found with it. Returns the keys of everything new.
 */
export const startAct = (state: GameState, act: number): string[] =>
  beginAct(state, act, 'arrival');
