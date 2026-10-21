import { ORDER_IDS, ORDER_SOURCES } from '../../content/orders';
import { backfillOrders } from './orders-backfill';
import type { Migration } from './migrations';

// v9 → v10 (plan T10.1, D410, D421, technical design §9.4): Orders.
//
// 1. `orders` is added empty and closed: nothing opened, no scene queued, nothing seated. The load
//    path opens Orders after the catch-up, by the same function the live game uses at a trigger
//    (T10.6), and no Order ever seats itself (D422).
// 2. Counting starts for all four Orders at once. The save's history is backfilled ONCE, capped at
//    level `orders.backfillCapLevel`, so a long-running save starts at the bottom and its first
//    chapters come one at a time (D410 (5)). What the save cannot recover starts at 0 and is
//    named: the notes ride in `orders.migrationNotes` and the guard turns them into load notes.
// 3. Nothing about hunters, items, Legendaries, events, stands or the story changes, so every golden
//    fight and recorded stand replays as before.
export const v9ToV10: Migration = (state) => {
  const s: Record<string, unknown> = structuredClone(state);
  const { start, levelHigh, notes } = backfillOrders(s);
  const per = <T>(make: (id: (typeof ORDER_IDS)[number]) => T): Record<string, T> =>
    Object.fromEntries(ORDER_IDS.map((id) => [id, make(id)]));
  return {
    ...s,
    orders: {
      opened: {},
      counts: per((id) => Object.fromEntries(ORDER_SOURCES[id].map((src) => [src, 0]))),
      start,
      triumphant: 0,
      delveWindow: null,
      levelHigh,
      seats: [],
      thirdSeat: false,
      lastChange: null,
      chaptersRead: per(() => 0),
      readWith: per(() => []),
      openingQueue: [],
      seatStepPending: false,
      migrationNotes: notes,
    },
  };
};
