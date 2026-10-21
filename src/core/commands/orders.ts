import { ORDER_IDS, type OrderId } from '../../content/orders';
import { nextChapter } from '../story/orders-chapters';
import { eventNow } from '../systems/events';
import { cooldownLeft, cooldownText, inListOrder, seatCount } from '../systems/orders-seats';
import type { GameState } from '../state/game-state';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.13.3–§5.13.4, technical design §5.2 (D412, D422): the only commands that change
// `orders.seats`. Seating is always the player's choice; a mid-cycle change starts the 24 h cooldown
// on the event clock; the new-warden and load step (`orders.setSeats`) is free and clears it.

const known = (id: unknown): id is OrderId => ORDER_IDS.includes(id as OrderId);

const unopened = (state: GameState, id: OrderId): string | null =>
  known(id) ? (state.orders.opened[id] ? null : 'That Order has not come yet.') : 'No such Order.';

const refusal = (state: GameState, now: number): string | null =>
  cooldownLeft(state, now) > 0 ? cooldownText(state, now) : null;

const changed = (state: GameState, seats: OrderId[], now: number): ApplyResult => {
  state.orders.seats = inListOrder(seats);
  state.orders.lastChange = eventNow(state, now);
  return ok;
};

export const seatOrder = (state: GameState, id: OrderId, now: number): ApplyResult => {
  const problem = unopened(state, id);
  if (problem) return refuse(problem);
  const seats = state.orders.seats;
  if (seats.includes(id)) return refuse('That Order already has a seat.');
  if (seats.length >= seatCount(state)) return refuse('Every seat is taken.');
  const wait = refusal(state, now);
  if (wait) return refuse(wait);
  return changed(state, [...seats, id], now);
};

export const unseatOrder = (state: GameState, id: OrderId, now: number): ApplyResult => {
  if (!known(id)) return refuse('No such Order.');
  if (!state.orders.seats.includes(id)) return refuse('That Order has no seat.');
  const wait = refusal(state, now);
  if (wait) return refuse(wait);
  return changed(
    state,
    state.orders.seats.filter((s) => s !== id),
    now,
  );
};

export const swapOrders = (
  state: GameState,
  out: OrderId,
  into: OrderId,
  now: number,
): ApplyResult => {
  const problem = unopened(state, into);
  if (problem) return refuse(problem);
  if (!known(out) || !state.orders.seats.includes(out)) return refuse('That Order has no seat.');
  if (state.orders.seats.includes(into)) return refuse('That Order already has a seat.');
  const wait = refusal(state, now);
  if (wait) return refuse(wait);
  return changed(state, [...state.orders.seats.filter((s) => s !== out), into], now);
};

/**
 * An opening scene is done (technical design §5.2, D422): the Order leaves the queue. It takes a seat
 * only if the player asked ("Seat it") and one is free; that never starts the cooldown. "Continue" and
 * "Not now" leave it unseated.
 */
export const finishOpening = (state: GameState, id: OrderId, seatIt: boolean): ApplyResult => {
  if (!known(id) || !state.orders.openingQueue.includes(id))
    return refuse('That scene is not waiting.');
  const seats = state.orders.seats;
  if (seatIt && seats.length >= seatCount(state)) return refuse('Every seat is taken.');
  state.orders.openingQueue = state.orders.openingQueue.filter((q) => q !== id);
  if (seatIt) state.orders.seats = inListOrder([...seats, id]);
  return ok;
};

/**
 * Reads that Order's next playable chapter (technical design §5.2, D414, D419): it counts as read and
 * the Orders seated at that moment are saved, in list order, so the ending it played is known. It
 * changes nothing else: no name, document, entry or standing comes from a chapter.
 */
export const readChapter = (state: GameState, id: OrderId): ApplyResult => {
  if (!known(id)) return refuse('No such Order.');
  const chapter = nextChapter(state, id);
  if (!chapter) return refuse('No chapter of that Order can be read now.');
  state.orders.readWith[id].push(inListOrder(state.orders.seats));
  state.orders.chaptersRead[id] = chapter.n;
  return ok;
};

/** The new-warden step and the load sheet (D412 (3), (6)): free of cooldown, and it clears one. */
export const setSeats = (state: GameState, list: OrderId[]): ApplyResult => {
  if (!Array.isArray(list)) return refuse('A list of Orders, please.');
  for (const id of list) {
    const problem = unopened(state, id);
    if (problem) return refuse(problem);
  }
  if (new Set(list).size !== list.length) return refuse('An Order takes one seat.');
  if (list.length > seatCount(state)) return refuse('There are not that many seats.');
  state.orders.seats = inListOrder(list);
  state.orders.lastChange = null;
  state.orders.seatStepPending = false;
  return ok;
};

/** "Skip" on the "Seat your Orders" step (D421): the seats stay as they are and the step is used. */
export const skipSeatStep = (state: GameState): ApplyResult => {
  state.orders.seatStepPending = false;
  return ok;
};
