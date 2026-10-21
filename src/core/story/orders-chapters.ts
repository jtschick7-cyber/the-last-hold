import { balance } from '../../content/balance';
import { chapterOf, type ChapterDef } from '../../content/orders-chapters';
import { ORDER_IDS, type OrderId } from '../../content/orders';
import type { GameState } from '../state/game-state';
import { orderLevel } from '../systems/orders';

// GDD §5.13.6 (D414, D419): what chapter an Order plays next, worked out from the state each time.
// There is no stored queue, so a chapter that becomes playable without any command (a weight lowered
// in tuning, then a load) is still found, and a chapter that waits is never lost.

const onRoster = (s: GameState, ...ids: ('vesna' | 'ostap')[]): boolean =>
  ids.every((id) => s.hunters[id] !== undefined);

export const conditionHolds = (s: GameState, c: ChapterDef): boolean => {
  switch (c.condition) {
    case 'none':
      return true;
    case 'vesnaOnRoster':
      return onRoster(s, 'vesna');
    case 'ilseArrived':
      return s.story.ilseAt !== null;
    case 'ostapAndVesnaOnRoster':
      return onRoster(s, 'ostap', 'vesna');
    case 'quenchersOpened':
      return s.orders.opened.quenchers !== undefined;
    case 'mootOpened':
      return s.orders.opened.moot !== undefined;
  }
};

/** The next chapter of an Order if it can be read now, else null. */
export const nextChapter = (state: GameState, id: OrderId): ChapterDef | null => {
  const o = state.orders;
  const chapter = chapterOf(id, o.chaptersRead[id] + 1);
  if (!chapter || !o.opened[id] || !o.seats.includes(id)) return null;
  if (orderLevel(state, id) < chapter.n || !conditionHolds(state, chapter)) return null;
  return chapter;
};

/** Every chapter that can be read now: Moot, Grey Wives, Bell-Watchers, Quenchers (one each at most). */
export const playableChapters = (state: GameState): ChapterDef[] =>
  ORDER_IDS.flatMap((id) => nextChapter(state, id) ?? []);

/**
 * An Order's next chapter is due (level reached, the one before read) but not playable only because
 * the Order has no seat: the Hold badge and "A chapter waits for a seat." read this (D416 (4)).
 */
export const chapterWaitsForSeat = (state: GameState, id: OrderId): boolean => {
  const o = state.orders;
  const chapter = chapterOf(id, o.chaptersRead[id] + 1);
  if (!chapter || !o.opened[id] || o.seats.includes(id)) return false;
  return orderLevel(state, id) >= chapter.n && conditionHolds(state, chapter);
};

const opposedOf = (id: OrderId): OrderId | null => {
  const [a, b] = balance.orders.opposed.value;
  return id === a ? b : id === b ? a : null;
};

/** Chapter 4 of the opposed pair reads one of two ways: A if the other is seated, else B (D414). */
export const variantFor = (
  id: OrderId,
  n: number,
  seated: readonly OrderId[],
): 'A' | 'B' | null => {
  const other = opposedOf(id);
  if (n !== 4 || other === null) return null;
  return seated.includes(other) ? 'A' : 'B';
};

/** Which way chapter `n` of an Order was read, from the seats saved when it was (D419). */
export const variantRead = (state: GameState, id: OrderId, n: number): 'A' | 'B' | null =>
  variantFor(id, n, state.orders.readWith[id][n - 1] ?? []);

/** The variant the next chapter would play with the seats as they are now (the Order sheet says so). */
export const variantNow = (state: GameState, id: OrderId): 'A' | 'B' | null =>
  variantFor(id, state.orders.chaptersRead[id] + 1, state.orders.seats);

/** One Library entry for a chapter already read; reading it again changes nothing. */
export interface ShelfChapter {
  chapter: ChapterDef;
  /** The Orders seated when it was read, in list order. */
  readWith: OrderId[];
  variant: 'A' | 'B' | null;
}

export const shelfChapters = (state: GameState, id: OrderId): ShelfChapter[] =>
  Array.from({ length: state.orders.chaptersRead[id] }, (_, i) => {
    const chapter = chapterOf(id, i + 1);
    return chapter
      ? [
          {
            chapter,
            readWith: [...(state.orders.readWith[id][i] ?? [])],
            variant: variantRead(state, id, i + 1),
          },
        ]
      : [];
  }).flat();
