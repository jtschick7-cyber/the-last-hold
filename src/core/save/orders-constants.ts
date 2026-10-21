import type { OrderId } from '../../content/orders';

// TEMPORARY (plan T10.1): the GDD §7.12 values the v9 → v10 backfill and the Orders guard need
// before T10.2 adds §7.12 and the `orders.*` keys to `balance.ts` (the constants test requires every
// balance key to be in the GDD). T10.2 moves every value here into `balance.ts` and deletes this
// file. Weights, thresholds, the chunk and the cap are tunable sketches; the rest are locked.
export const ORDER_LEVELS = 4;
export const SEATS_START = 2;
export const SEATS_MAX = 3;
export const THIRD_SEAT_TOP_ORDERS = 2;
export const BACKFILL_CAP_LEVEL = 1;
export const TRIUMPHANT_CHUNK = 25;
export const WEIGHTS = {
  moot: { contract: 1 },
  greyWives: { brew: 1, experiment: 3, property: 10 },
  bellWatchers: { document: 5, letter: 5, name: 10 },
  quenchers: { kozlyContract: 2, delveFloor: 1 },
} as const;
export const THRESHOLDS: Record<OrderId, readonly number[]> = {
  moot: [10, 40, 100, 200],
  greyWives: [30, 100, 250, 500],
  bellWatchers: [25, 75, 160, 300],
  quenchers: [20, 60, 140, 260],
};

/** The level a standing gives: how many thresholds it has reached (0 to 4). */
export const levelOf = (order: OrderId, standing: number): number =>
  THRESHOLDS[order].filter((t) => standing >= t).length;
