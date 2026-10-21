import { ORDER_IDS, ORDER_SOURCES, type OrderId } from '../../content/orders';

// Technical design §5.2 (v10, D408–D425): everything Orders keep. Kept whole through the Long Night
// (D410). Standing and level are derived from this, never stored (T10.3).
export interface OrdersState {
  /** An Order that has opened, for good. `at` is the wall-clock `now` of the opening. */
  opened: Partial<Record<OrderId, { at: number }>>;
  /** Live counts per source from v10 on, for all four Orders, opened or not (D410). */
  counts: Record<OrderId, Record<string, number>>;
  /** The one migration backfill, already capped (0 in a new game). */
  start: Record<OrderId, number>;
  /** Triumphant stands counted since v10; each adds the chunk to every Order. */
  triumphant: number;
  /** The Delve window: its event-clock start and the standing used in it. */
  delveWindow: { start: number; used: number } | null;
  /** The highest level an Order has reached; a level never drops (D410). */
  levelHigh: Record<OrderId, number>;
  /** Seated Orders, kept in list order. Only the player's commands change this (D422). */
  seats: OrderId[];
  /** The third seat has opened, once, for good (D412). */
  thirdSeat: boolean;
  /** `eventNow` at the last mid-cycle seat change, or null. */
  lastChange: number | null;
  /** Chapters read per Order, 0 to 4. */
  chaptersRead: Record<OrderId, number>;
  /** For each chapter read, the Orders seated at that moment, in list order (D419). */
  readWith: Record<OrderId, OrderId[][]>;
  /** Opening scenes waiting, in the order the Orders opened. */
  openingQueue: OrderId[];
  /** The one-time "Seat your Orders" sheet for a migrated save (D421). */
  seatStepPending: boolean;
}

const perOrder = <T>(make: (id: OrderId) => T): Record<OrderId, T> =>
  Object.fromEntries(ORDER_IDS.map((id) => [id, make(id)])) as Record<OrderId, T>;

export const newOrdersState = (): OrdersState => ({
  opened: {},
  counts: perOrder((id) => Object.fromEntries(ORDER_SOURCES[id].map((s) => [s, 0]))),
  start: perOrder(() => 0),
  triumphant: 0,
  delveWindow: null,
  levelHigh: perOrder(() => 0),
  seats: [],
  thirdSeat: false,
  lastChange: null,
  chaptersRead: perOrder(() => 0),
  readWith: perOrder(() => []),
  openingQueue: [],
  seatStepPending: false,
});
