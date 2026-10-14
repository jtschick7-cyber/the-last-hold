import { allDocuments } from '../../content/story/acts';
import type { GameState } from '../state/game-state';
import { freshHunter } from '../state/hunters-state';
import type { FoundVia } from '../state/story-state';
import { levelCap, rosterCap } from '../systems/hunters';
import { findDocument, sweepDocuments } from './documents';
import { noteAllPeaks } from './letters';

// GDD §5.8, §8.5, §5.14.1 (D211, D213, D214): Act III begins and Arvid arrives with Ilse.
// He joins the roster directly, active if there is room, at the level of the highest
// hunter at that moment (after any Long Night halving), within the Rank's level cap.

/**
 * Act III has begun in a save that never met Arvid: a v0.5 save whose cycle began an act
 * with no story written for it (D214, P4). Ilse's arrival comes first (D149).
 */
export const actThreeDue = (state: GameState): boolean =>
  state.hunters.arvid === undefined &&
  !state.story.arrivalDue &&
  !state.arrivalDue &&
  state.story.acts.some((a) => a.act >= 3);

/** Arvid joins the roster at the highest hunter's level within the Rank cap (D211). */
const joinArvid = (state: GameState): void => {
  if (state.hunters.arvid) return;
  const highest = Math.max(1, ...Object.values(state.hunters).map((h) => h?.level ?? 0));
  state.hunters.arvid = { ...freshHunter(), level: Math.min(highest, levelCap(state)) };
  if (state.roster.active.length < rosterCap(state).value) state.roster.active.push('arvid');
};

/**
 * Arvid arrives with Ilse as Act III begins: D3-01 plays, his letters count, and any
 * Act III document the save already meets is found (`via` 'arrival' on load, D214).
 * Returns the keys of everything new.
 */
export const arriveArvid = (
  state: GameState,
  via: Extract<FoundVia, 'warden' | 'arrival'>,
): string[] => {
  joinArvid(state);
  const keys: string[] = [];
  const scene = allDocuments.find((d) => d.condition.kind === 'arvidArrives');
  if (scene) keys.push(...findDocument(state, scene, via));
  keys.push(...noteAllPeaks(state));
  keys.push(...sweepDocuments(state, via === 'arrival' ? 'arrival' : undefined));
  return keys;
};
