import {
  creaturesKnownLine,
  nearSceneClosed,
  nearSceneOpen,
  rememberingReadyLine,
  rememberingShelfEntries,
  type RememberingScene,
} from '../../content/text/remembering';
import { endingWarm, type EndingCard } from '../../content/text/remembering-ending';
import { afterEndingLines } from '../../content/text/remembering';
import { CONTRACT_SPECIES } from '../../content/remembering';
import { namesFoundLine, roll } from '../../content/story/roll';
import { villages } from '../../content/villages';
import type { GameState } from '../state/game-state';
import { actVIStandApplied, namesFound, rememberingGate, speciesStudied } from './remembering';

// GDD §5.15.2 (D450, D461, D466): what the Hold screen's card, Pechko's near-scene and the ready line
// show. All of it is derived from the state each time; the UI only draws it.

/** Pechko's near-scene waits for the first Hold visit after Act VI's stand result (D459 (6)). */
export const rememberingNearPending = (state: GameState): boolean =>
  actVIStandApplied(state) && !state.remembering.nearSeen;

/** R-02 if the gate is already open, otherwise R-01 (lore §34.1); null when nothing is waiting. */
export const rememberingNearScene = (state: GameState): RememberingScene | null =>
  !rememberingNearPending(state) ? null : rememberingGate(state) ? nearSceneOpen : nearSceneClosed;

/** The one line on the first away or result sheet after the gate opens, or null (D466 (1)). */
export const rememberingReadyNote = (state: GameState): string | null => {
  const r = state.remembering;
  return r.nearSeen && !r.readyNoted && r.endings.length === 0 && rememberingGate(state)
    ? rememberingReadyLine
    : null;
};

export type RememberingForm = 'notOpen' | 'open' | 'afterVigil' | 'afterRemember';

export interface RememberingCardView {
  readonly form: RememberingForm;
  /** "Names found: n of 40." and "Creatures known well: s of t." (the not-open form only). */
  readonly counts: readonly string[];
  readonly namesFound: number;
  readonly speciesKnown: number;
  readonly speciesTotal: number;
}

/**
 * The card. Hidden until Pechko's scene has been seen (or an ending is recorded). The forms after
 * a choice do not depend on the gate (D461 (5)); after Remember Them the form stays even if Keep the
 * Vigil came first.
 */
export const rememberingCardView = (state: GameState): RememberingCardView | null => {
  const r = state.remembering;
  if (!r.nearSeen && r.endings.length === 0) return null;
  const known = speciesStudied(state);
  const total = CONTRACT_SPECIES.length;
  const names = namesFound(state);
  const form: RememberingForm = r.endings.some((e) => e.ending === 'remember')
    ? 'afterRemember'
    : r.endings.some((e) => e.ending === 'vigil')
      ? 'afterVigil'
      : rememberingGate(state)
        ? 'open'
        : 'notOpen';
  return {
    form,
    counts:
      form === 'notOpen' ? [`${namesFoundLine(names)}.`, creaturesKnownLine(known, total)] : [],
    namesFound: names,
    speciesKnown: known,
    speciesTotal: total,
  };
};

export interface RememberingShelfEntry {
  readonly id: 'later';
  readonly title: string;
  readonly blurb: string;
}

/** The Library shelf: empty (so hidden) until an entry is reached (lore §34.8). "Later" follows Keep the Vigil. */
export const rememberingShelf = (state: GameState): RememberingShelfEntry[] =>
  state.remembering.endings.some((e) => e.ending === 'vigil')
    ? [{ id: 'later', ...rememberingShelfEntries.later }]
    : [];

export interface ReadingFrame {
  readonly n: number;
  readonly name: string;
  /** "Mirograd · onward, year 200 of the order." (lore §34.5); the same data as the Names view's line. */
  readonly line: string;
}

/**
 * The 40 names of the reading, in order of year (lore §34.5). Built from `roll`, the Names view's own
 * table, so the two cannot differ; every name is read, found or not, because the gate is open (D461).
 */
export const readingFrames = (): ReadingFrame[] =>
  [...roll]
    .sort((a, b) => a.year - b.year)
    .map((r) => ({
      n: r.n,
      name: r.name,
      line: `${villages[r.village].name} · onward, year ${r.year} of the order.`,
    }));

/** R-11 for the Rime shelf's "After the ending": derived from the saved ending, not a found document (D463). */
export const rimeAfterEnding = (state: GameState): EndingCard | null =>
  state.remembering.endings.some((e) => e.ending === 'remember') ? endingWarm : null;

/** One resident line after Remember Them; `r` in [0, 1) picks it. Null until the ending is recorded. */
export const afterEndingLine = (
  state: GameState,
  r: number,
): (typeof afterEndingLines)[number] | null =>
  state.remembering.endings.some((e) => e.ending === 'remember')
    ? (afterEndingLines[
        Math.min(afterEndingLines.length - 1, Math.floor(r * afterEndingLines.length))
      ] ?? null)
    : null;
