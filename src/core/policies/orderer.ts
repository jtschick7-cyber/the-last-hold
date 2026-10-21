import { ORDER_IDS, type OrderId } from '../../content/orders';
import type { Command } from '../commands';
import type { GameState } from '../state/game-state';
import { chapterWaitsForSeat, nextChapter, variantRead } from '../story/orders-chapters';
import { seatCount } from '../systems/orders-seats';

// GDD §6.1 (v0.10, D417): what the Orderer does with the Orders at a check-in. It is the only player
// that ever seats one; its contract, building and Delve decisions are Standard's and the Delver's.
// Every choice is a Command through apply(), and nothing here rolls a die or reads the clock.

type Act = (cmd: Command) => boolean;

/** Chapters in an Order (GDD §5.13.6). */
const CHAPTERS = 4;

export interface ChapterPlayed {
  readonly order: OrderId;
  readonly n: number;
  /** Which way a chapter 4 of the opposed pair played, else null. */
  readonly variant: 'A' | 'B' | null;
}

export interface OrdererCheckIn {
  /** Opening scenes it finished at this check-in, and whether each took a seat ("Seat it"). */
  readonly openings: readonly { readonly order: OrderId; readonly seated: boolean }[];
  /** The chapters it read at this check-in, in order. */
  readonly chapters: readonly ChapterPlayed[];
  /** The seats after its moves, in list order. */
  readonly seats: readonly OrderId[];
  /** It chose seats for a new warden at this check-in. */
  readonly newWarden: boolean;
  /** The seats when a stand was made at this check-in (before the new warden's step), else absent. */
  readonly standSeats?: readonly OrderId[];
}

/**
 * The Orders in the order the Orderer would give them seats (D417): chapters playable now first (a
 * chapter that is due, whether or not the Order sits), then the most chapters unread, then the list
 * order (Moot, Grey Wives, Bell-Watchers, Quenchers). Only Orders that have opened.
 */
export const rankOrders = (s: GameState): OrderId[] => {
  const playable = (id: OrderId): number =>
    nextChapter(s, id) !== null || chapterWaitsForSeat(s, id) ? 1 : 0;
  const unread = (id: OrderId): number => CHAPTERS - s.orders.chaptersRead[id];
  return ORDER_IDS.filter((id) => s.orders.opened[id] !== undefined).sort(
    (a, b) =>
      playable(b) - playable(a) ||
      unread(b) - unread(a) ||
      ORDER_IDS.indexOf(a) - ORDER_IDS.indexOf(b),
  );
};

/** Every chapter of every Order has been read. */
export const allChaptersRead = (s: GameState): boolean =>
  ORDER_IDS.every((id) => s.orders.chaptersRead[id] >= CHAPTERS);

/**
 * One check-in's Orders moves, in this order: finish each waiting opening scene ("Seat it" when a
 * seat is free, else "Continue"); fill a free seat (the third, the moment it opens) with the best
 * ranked Order that has none; read every chapter that can be read; and, at a new warden only, seat
 * the top-ranked Orders for the free step. It never swaps or unseats mid-cycle.
 */
export const ordererMoves = (s: GameState, act: Act, newWarden: boolean): OrdererCheckIn => {
  const openings: { order: OrderId; seated: boolean }[] = [];
  for (const order of [...s.orders.openingQueue]) {
    const seatIt = s.orders.seats.length < seatCount(s);
    if (act({ type: 'orders.finishOpening', order, seatIt }))
      openings.push({ order, seated: seatIt });
  }
  if (newWarden) {
    const top = rankOrders(s).slice(0, seatCount(s));
    act({ type: 'orders.setSeats', orders: top });
  } else {
    for (const id of rankOrders(s)) {
      if (s.orders.seats.length >= seatCount(s)) break;
      if (!s.orders.seats.includes(id)) act({ type: 'orders.seat', order: id });
    }
  }
  const chapters: ChapterPlayed[] = [];
  for (let guard = 0; guard < ORDER_IDS.length * CHAPTERS; guard++) {
    const next = ORDER_IDS.find((id) => nextChapter(s, id) !== null);
    if (next === undefined) break;
    const n = s.orders.chaptersRead[next] + 1;
    if (!act({ type: 'orders.readChapter', order: next })) break;
    chapters.push({ order: next, n, variant: variantRead(s, next, n) });
  }
  return { openings, chapters, seats: [...s.orders.seats], newWarden };
};
