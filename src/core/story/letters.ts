import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { letters, type LetterSlot } from '../../content/story/letters';
import { constantAt } from '../balance-access';
import type { GameState } from '../state/game-state';
import { findName } from './documents';

// GDD §5.14.7 (D155, D156): every hunter has two letters, at the levels in
// `letters.levels`, counting the highest level the hunter has ever reached, so the
// Long Night's halving never takes one away.

export const letterKey = (hunter: HunterId, slot: LetterSlot): string => `letter:${hunter}:${slot}`;

/**
 * Notes a hunter's level and reaches any letter it now earns. Returns the keys of
 * what's new: the letter, and the name it carries.
 */
export const notePeak = (state: GameState, hunter: HunterId, level: number): string[] => {
  const peak = Math.max(state.story.peakLevels[hunter] ?? 0, level);
  state.story.peakLevels[hunter] = peak;
  const levels = constantAt('letters.levels').value as readonly number[];
  const keys: string[] = [];
  ([0, 1] as const).forEach((slot) => {
    const need = levels[slot];
    if (need === undefined || peak < need) return;
    if (state.story.letters.some((l) => l.hunter === hunter && l.slot === slot)) return;
    state.story.letters.push({ hunter, slot, cycle: state.cycle.number, at: state.time });
    state.story.unread.push(letterKey(hunter, slot));
    keys.push(letterKey(hunter, slot));
    const name = letters.find((l) => l.hunter === hunter && l.slot === slot)?.name;
    if (name !== undefined) {
      const k = findName(state, name);
      if (k) keys.push(k);
    }
  });
  return keys;
};

/** Every owned hunter's current level counts (after a recruit, a debug add, or the v0.5 arrival). */
export const noteAllPeaks = (state: GameState): string[] =>
  HUNTER_IDS.flatMap((id) => {
    const h = state.hunters[id];
    return h ? notePeak(state, id, h.level) : [];
  });
