import { balance } from '../../content/balance';
import { ORDER_IDS, ORDER_LEVEL_WORDS, ORDER_NAMES, type OrderId } from '../../content/orders';
import { chapterWaitsForSeat, playableChapters } from '../story/orders-chapters';
import type { GameState } from '../state/game-state';
import { orderLevel, orderStanding } from './orders';
import { seatingGives } from './orders-perks';
import { cooldownLeft, cooldownText, inListOrder, seatCount } from './orders-seats';

// GDD §9.18, §5.13.3 (D412, D416): everything the Orders card, the seat sheet and the Hold tab's
// badge say, worked out here so the screens only show it. Nothing here changes the state.

/** What a row's button does: seat into a free seat, unseat, or swap for a seated Order. */
export type SeatAction = 'seat' | 'unseat' | 'swap';

export interface OrderRow {
  readonly id: OrderId;
  readonly name: string;
  readonly level: number;
  /** "Friend", or "No level yet" below the first threshold. */
  readonly levelWord: string;
  readonly standing: number;
  readonly seated: boolean;
  /** "A chapter waits for a seat." while its next chapter is due and it has no seat. */
  readonly chapterWaits: boolean;
  /** What seating it would give; shown only while it is not seated. */
  readonly gives: string | null;
  readonly action: SeatAction;
  /** For a swap: the seated Orders it can take the place of. */
  readonly swapOut: readonly OrderId[];
}

export interface OrdersCardView {
  /** "Seats: 2 of 3 (…)." or "Seats: 3 of 3." */
  readonly seatsLine: string;
  /** "In seats: Thanes' Moot, Grey Wives" or "In seats: none." */
  readonly inSeatsLine: string;
  /** "Can change in 9h 20m" while the wait runs, else null. */
  readonly cooldownLine: string | null;
  readonly rows: readonly OrderRow[];
  /** The opening scenes waiting, in the order the Orders opened. */
  readonly scenesWaiting: readonly OrderId[];
  /** The one-time "Seat your Orders" step is still pending (D421). */
  readonly seatStepPending: boolean;
  readonly badge: boolean;
}

/**
 * The Hold tab's one badge (GDD §9.18, D416 (4)): a chapter can be read now, or an Order with a due
 * chapter has no seat. Worked out from the state, so it clears when neither is true.
 */
export const ordersBadge = (state: GameState): boolean =>
  playableChapters(state).length > 0 || ORDER_IDS.some((id) => chapterWaitsForSeat(state, id));

const seatsLineOf = (state: GameState): string => {
  const { seatsStart, seatsMax } = balance.orders;
  return state.orders.thirdSeat
    ? `Seats: ${seatsMax.value} of ${seatsMax.value}.`
    : `Seats: ${seatsStart.value} of ${seatsMax.value} (the third opens when two Orders reach their top level and the Quenchers have come).`;
};

const inSeatsLineOf = (state: GameState): string => {
  const seated = inListOrder(state.orders.seats);
  return seated.length === 0
    ? 'In seats: none.'
    : `In seats: ${seated.map((id) => ORDER_NAMES[id]).join(', ')}`;
};

export const rowOf = (state: GameState, id: OrderId): OrderRow => {
  const level = orderLevel(state, id);
  const seated = state.orders.seats.includes(id);
  const full = state.orders.seats.length >= seatCount(state);
  return {
    id,
    name: ORDER_NAMES[id],
    level,
    levelWord: level === 0 ? 'No level yet' : (ORDER_LEVEL_WORDS[level - 1] ?? ''),
    standing: orderStanding(state, id),
    seated,
    chapterWaits: chapterWaitsForSeat(state, id),
    gives: seated ? null : seatingGives(state, id),
    action: seated ? 'unseat' : full ? 'swap' : 'seat',
    swapOut: !seated && full ? inListOrder(state.orders.seats) : [],
  };
};

/** The Orders card, or null before any Order has opened (a closed Order is not listed). */
export const ordersCardView = (state: GameState, now: number): OrdersCardView | null => {
  const open = ORDER_IDS.filter((id) => state.orders.opened[id]);
  if (open.length === 0) return null;
  return {
    seatsLine: seatsLineOf(state),
    inSeatsLine: inSeatsLineOf(state),
    cooldownLine: cooldownLeft(state, now) > 0 ? cooldownText(state, now) : null,
    rows: open.map((id) => rowOf(state, id)),
    scenesWaiting: [...state.orders.openingQueue],
    seatStepPending: state.orders.seatStepPending,
    badge: ordersBadge(state),
  };
};

/** The Orders the "Seat your Orders" step lists: every open Order, in list order. */
export const seatStepOrders = (state: GameState): OrderId[] =>
  ORDER_IDS.filter((id) => state.orders.opened[id]);
