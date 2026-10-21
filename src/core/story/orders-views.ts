import { greyWivesHints, mootHeadLines } from '../../content/story/orders-perks';
import type { VillageId } from '../../content/villages';
import { knownBrews } from '../alchemy/book';
import type { GameState } from '../state/game-state';
import { orderLevel } from '../systems/orders';

// lore-secrets §33 Part E (D411): where the Moot's and Grey Wives' perk texts show. Every one is worked
// out from the state each time and shows ONLY while its Order is seated and at or above the line's level;
// an unseated Order shows none. The UI only draws what these return.

const seatedLevel = (state: GameState, id: 'moot' | 'greyWives'): number =>
  state.orders.seats.includes(id) ? orderLevel(state, id) : 0;

/** The head's line that ends a contract notice from `village`, or null (E1). */
export const mootNoticeLine = (state: GameState, village: VillageId): string | null => {
  const level = seatedLevel(state, 'moot');
  return mootHeadLines.find((l) => l.village === village && l.level <= level)?.noticeLine ?? null;
};

export interface HeadEntry {
  readonly head: string;
  readonly village: VillageId;
  readonly entry: string;
}

/** "What the heads say about you" on the Villages panel (E1): one entry per head reached. */
export const mootPanelEntries = (state: GameState): HeadEntry[] => {
  const level = seatedLevel(state, 'moot');
  return mootHeadLines
    .filter((l) => l.level <= level)
    .map((l) => ({ head: l.head, village: l.village, entry: l.panelEntry }));
};

export interface BookLine {
  /** "hint": a claim about a brew the Book does not hold yet; "note": the elder's note instead. */
  readonly kind: 'hint' | 'note';
  readonly text: string;
}

/**
 * Under the Book's grid: "The eldest Grey Wife says:" and a line (E2). While a brew named in a hint at
 * the Order's level or below is not in the Book, the hint shown is the highest such level's, so its claim
 * is always about a brew still unknown. When the Book holds every brew named, the level's elder's note
 * takes its place.
 */
export const greyWivesBookLine = (state: GameState): BookLine | null => {
  const level = seatedLevel(state, 'greyWives');
  if (level < 1) return null;
  const known = new Set(knownBrews(state));
  const within = greyWivesHints.filter((h) => h.level <= level);
  const unknown = within.filter((h) => !known.has(h.brew));
  const hint = unknown[unknown.length - 1];
  if (hint) return { kind: 'hint', text: hint.hint };
  const note = within[within.length - 1];
  return note ? { kind: 'note', text: note.elderNote } : null;
};
