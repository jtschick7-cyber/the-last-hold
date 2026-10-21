import type { OrderId } from './orders';

// GDD §5.13.6 (D414, OUT-3 Part B and D): the sixteen chapters, four per Order. This file holds the
// facts the rules need (id, number, title, the extra condition); the scene texts are separate content
// (T10.9, T10.10), word for word from lore §33. Titles are D414 (6).

/** What a chapter needs besides the Order being open and seated, its level and the one before it. */
export type ChapterCondition =
  | 'none'
  | 'vesnaOnRoster' // OR-G1
  | 'ilseArrived' // OR-G2
  | 'ostapAndVesnaOnRoster' // OR-G3
  | 'quenchersOpened' // OR-M4: so it can meet its other ending
  | 'mootOpened'; // OR-Q4: always true once the Moot is open; stated so the test is symmetric

export interface ChapterDef {
  /** "OR-M1" to "OR-Q4" (lore §33). */
  id: string;
  order: OrderId;
  /** 1 to 4. */
  n: number;
  title: string;
  condition: ChapterCondition;
}

const chapter = (
  id: string,
  order: OrderId,
  n: number,
  title: string,
  condition: ChapterCondition = 'none',
): ChapterDef => ({ id, order, n, title, condition });

export const CHAPTERS: readonly ChapterDef[] = [
  chapter('OR-M1', 'moot', 1, 'A table at the gate'),
  chapter('OR-M2', 'moot', 2, 'Salt and a ledger'),
  chapter('OR-M3', 'moot', 3, 'The one who leaves'),
  chapter('OR-M4', 'moot', 4, 'What is it for?', 'quenchersOpened'),
  chapter('OR-G1', 'greyWives', 1, 'The kettle test', 'vesnaOnRoster'),
  chapter('OR-G2', 'greyWives', 2, 'Tea for a recipe', 'ilseArrived'),
  chapter('OR-G3', 'greyWives', 3, 'Two hands', 'ostapAndVesnaOnRoster'),
  chapter('OR-G4', 'greyWives', 4, "What can't be mended"),
  chapter('OR-B1', 'bellWatchers', 1, 'The second spring'),
  chapter('OR-B2', 'bellWatchers', 2, 'A list of springs'),
  chapter('OR-B3', 'bellWatchers', 3, 'What he said at the door'),
  chapter('OR-B4', 'bellWatchers', 4, 'A bell of our own'),
  chapter('OR-Q1', 'quenchers', 1, 'Three at the gate'),
  chapter('OR-Q2', 'quenchers', 2, "Věra's chair"),
  chapter('OR-Q3', 'quenchers', 3, 'A cold supper'),
  chapter('OR-Q4', 'quenchers', 4, 'The mouth', 'mootOpened'),
];

export const chapterOf = (order: OrderId, n: number): ChapterDef | undefined =>
  CHAPTERS.find((c) => c.order === order && c.n === n);
