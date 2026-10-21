import { balance } from '../../content/balance';
import { chapterOf, type ChapterDef } from '../../content/orders-chapters';
import { ORDER_NAMES, type OrderId } from '../../content/orders';
import { sceneOf } from '../../content/story/orders-scenes-all';
import type { GameState } from '../state/game-state';
import { orderLevel } from '../systems/orders';
import { conditionHolds, variantNow, variantRead } from './orders-chapters';

// GDD §5.13.6, §9.18 (D414, D419): how a chapter reads and what a waiting chapter waits for. Worked
// out from the state each time; the screens only draw it. The texts are lore §33, word for word.

/** A chapter's scene: its title and paragraphs (the variant's, for a two-ending chapter 4). */
export interface ChapterText {
  readonly title: string;
  readonly paragraphs: readonly string[];
  /** Ilse's note shown under the chapter in the Library, or null. */
  readonly libraryNote: string | null;
}

/** The text of chapter `n` of an Order, read the way `variant` says (null for a one-way chapter). */
export const chapterText = (
  id: OrderId,
  n: number,
  variant: 'A' | 'B' | null,
): ChapterText | null => {
  const chapter = chapterOf(id, n);
  const scene = chapter && sceneOf(chapter.id);
  if (!chapter || !scene) return null;
  const middle = variant === 'A' ? scene.variantA : variant === 'B' ? scene.variantB : undefined;
  return {
    title: scene.title,
    paragraphs: [...scene.body, ...(middle ?? []), ...(scene.ending ?? [])],
    libraryNote: scene.libraryNote ?? null,
  };
};

export type ChapterStatus = 'read' | 'playable' | 'waits';

export interface ChapterRow {
  readonly n: number;
  readonly title: string;
  readonly status: ChapterStatus;
  /** Why it waits, or how it will read; null when there is nothing to say. */
  readonly line: string | null;
}

const conditionLine = (c: ChapterDef): string => {
  switch (c.condition) {
    case 'vesnaOnRoster':
      return 'Waits for Vesna to be on your roster.';
    case 'ilseArrived':
      return 'Waits for Ilse to have come.';
    case 'ostapAndVesnaOnRoster':
      return 'Waits for Ostap and Vesna to be on your roster.';
    case 'quenchersOpened':
      return 'Waits for the Quenchers to have come.';
    case 'mootOpened':
      return "Waits for the Thanes' Moot to have come.";
    case 'none':
      return '';
  }
};

const opposedName = (id: OrderId): string | null => {
  const [a, b] = balance.orders.opposed.value;
  return id === a ? ORDER_NAMES[b] : id === b ? ORDER_NAMES[a] : null;
};

/** The four chapters of an Order, each read, playable or waiting, and why (GDD §9.18). */
export const chapterRows = (state: GameState, id: OrderId): ChapterRow[] => {
  const o = state.orders;
  return Array.from({ length: balance.orders.levels.value }, (_, i) => i + 1).flatMap(
    (n): ChapterRow[] => {
      const c = chapterOf(id, n);
      if (!c) return [];
      if (n <= o.chaptersRead[id]) return [{ n, title: c.title, status: 'read', line: null }];
      const how =
        n === 4 && variantNow(state, id) !== null
          ? `Read now, it reads the way it does ${variantNow(state, id) === 'A' ? 'with' : 'without'} ${opposedName(id) ?? ''} seated.`
          : null;
      if (n > o.chaptersRead[id] + 1)
        return [{ n, title: c.title, status: 'waits', line: `Read chapter ${n - 1} first.` }];
      const reasons: string[] = [];
      if (!o.opened[id]) reasons.push('The Order has not come yet.');
      if (orderLevel(state, id) < n) reasons.push(`Waits for level ${n}.`);
      if (!conditionHolds(state, c)) reasons.push(conditionLine(c));
      if (reasons.length === 0 && !o.seats.includes(id))
        reasons.push(`A chapter waits for a seat. Seat ${ORDER_NAMES[id]} to read it.`);
      if (reasons.length > 0)
        return [
          { n, title: c.title, status: 'waits', line: [...reasons, how].filter(Boolean).join(' ') },
        ];
      return [{ n, title: c.title, status: 'playable', line: how }];
    },
  );
};

/** One entry on the Library's Orders shelf: a chapter read, with the seats it was read with. */
export interface ShelfEntry {
  readonly order: OrderId;
  readonly n: number;
  readonly title: string;
  /** "read with Thanes' Moot, Grey Wives" (D419). */
  readonly readWithLine: string;
}

/** Every chapter read, by Order in list order then chapter number; empty until the first is read. */
export const ordersShelf = (state: GameState): ShelfEntry[] =>
  (['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const).flatMap((id) =>
    Array.from({ length: state.orders.chaptersRead[id] }, (_, i) => {
      const c = chapterOf(id, i + 1);
      const seated = state.orders.readWith[id][i] ?? [];
      return c
        ? [
            {
              order: id,
              n: i + 1,
              title: c.title,
              readWithLine: `read with ${seated.length === 0 ? 'no Order seated' : seated.map((x) => ORDER_NAMES[x]).join(', ')}`,
            },
          ]
        : [];
    }).flat(),
  );

/** The text of a chapter already read, the way it was read (from the seats saved then, D419). */
export const readChapterText = (state: GameState, id: OrderId, n: number): ChapterText | null =>
  n <= state.orders.chaptersRead[id] ? chapterText(id, n, variantRead(state, id, n)) : null;
