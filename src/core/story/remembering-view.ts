import {
  creaturesKnownLine,
  creaturesMissingLine,
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
import { monsters } from '../../content/monsters';
import { villages } from '../../content/villages';
import { levelOf } from '../investigation/knowledge';
import type { GameState } from '../state/game-state';
import { descentResultUnread } from '../systems/descent-playback';
import { descentAvailable } from '../systems/descent-record';
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

export type RememberingForm =
  | 'notOpen'
  | 'open'
  | 'afterVigil'
  | 'afterRemember'
  /** v1.4 (GDD §9.24, S3): the Descent is won and Remember Them is not chosen. */
  | 'afterDescent';

export interface RememberingCardView {
  readonly form: RememberingForm;
  /** "Names found: n of 40." and "Creatures known well: s of t." (the not-open form only). */
  readonly counts: readonly string[];
  /** v1.0 (D493): "Not yet known well: …" naming the contract species met (Identified or better) but not yet Studied; null when there is none to name or the form is not `notOpen`. */
  readonly missing: string | null;
  readonly namesFound: number;
  readonly speciesKnown: number;
  readonly speciesTotal: number;
  /** v1.4: the gate is open and the hold is at Bastion, so The Descent can be fought now (S6). */
  readonly descentAvailable: boolean;
  /** v1.4: `'descent'` is recorded. */
  readonly descentWon: boolean;
  /** Keep the Vigil was chosen (so its button is not offered again). */
  readonly vigilChosen: boolean;
  /** v1.4 (S9): an attempt's result has not been seen yet, so the card offers "View Descent result". */
  readonly descentUnread: boolean;
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
  const has = (e: 'remember' | 'vigil' | 'descent'): boolean =>
    r.endings.some((x) => x.ending === e);
  const form: RememberingForm = has('remember')
    ? 'afterRemember'
    : has('descent')
      ? 'afterDescent'
      : has('vigil')
        ? 'afterVigil'
        : rememberingGate(state)
          ? 'open'
          : 'notOpen';
  const met = CONTRACT_SPECIES.filter((m) => levelOf(state, m) >= 2 && levelOf(state, m) < 3);
  return {
    form,
    missing:
      form === 'notOpen' && met.length > 0
        ? creaturesMissingLine(met.map((m) => monsters[m].name))
        : null,
    counts:
      form === 'notOpen' ? [`${namesFoundLine(names)}.`, creaturesKnownLine(known, total)] : [],
    namesFound: names,
    speciesKnown: known,
    speciesTotal: total,
    descentAvailable: descentAvailable(state),
    descentWon: has('descent'),
    vigilChosen: has('vigil'),
    descentUnread: descentResultUnread(state),
  };
};

export interface RememberingShelfEntry {
  readonly id: 'reading' | 'later';
  readonly title: string;
  readonly blurb: string;
}

/**
 * The Library shelf: empty (so hidden) until an entry is reached (lore §34.8). "The reading" follows
 * Remember Them and replays the whole ending; "Later" follows Keep the Vigil. Neither depends on the gate.
 */
export const rememberingShelf = (state: GameState): RememberingShelfEntry[] => {
  const chosen = (e: 'remember' | 'vigil'): boolean =>
    state.remembering.endings.some((x) => x.ending === e);
  return [
    ...(chosen('remember') ? [{ id: 'reading' as const, ...rememberingShelfEntries.reading }] : []),
    ...(chosen('vigil') ? [{ id: 'later' as const, ...rememberingShelfEntries.later }] : []),
  ];
};

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

export type HoldLookState = 'plain' | 'frost' | 'lamp';

/**
 * Which look the hold scene has (GDD §5.15.6, D457): the frost from Act VI's start, until Remember
 * Them is chosen; then the lamp. Keep the Vigil changes nothing, so the frost stays. Only a picture:
 * no number reads it.
 */
export const holdLook = (state: GameState): HoldLookState =>
  state.remembering.endings.some((e) => e.ending === 'remember')
    ? 'lamp'
    : state.cycles.some((c) => c.act === 6)
      ? 'frost'
      : 'plain';
