import { ORDER_IDS, type OrderId } from '../../content/orders';
import { balance } from '../../content/balance';

type Plain = Record<string, unknown>;
const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const whole = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;

// Plan T10.1, D410 (5), D421 (2), technical design §9.4: the one-time backfill. It counts the
// sources a v9 save holds, adds past Triumphant stands to every Order, and caps each Order at the
// level-`orders.backfillCapLevel` threshold. What the save cannot recover starts at 0 and is named.
//
//   Moot          contract            stats.contractsWon                         recoverable
//   Grey Wives    brew                (not recorded)                             NOT recoverable
//                 experiment          book.tried (one pair per experiment)       recoverable
//                 property            book.properties (slots revealed)           recoverable
//   Bell-Watchers document, letter, name   story.documents, .letters, .names     recoverable
//   Quenchers     kozlyContract       story.trust["kozly-hollow"].won            partly: a Sworn village
//                                     stops counting (GDD §5.14.6), so it may be low
//                 delveFloor          (only the totals are kept)                 NOT recoverable
//   Every Order   Triumphant stands   cycles[].stand.band === "triumphant"       recoverable
export const NOT_RECOVERED = [
  'Grey Wives: brews finished before the Orders were not recorded, so they start at 0.',
  'Quenchers: Delve floors that paid Riftglass before the Orders were not recorded, so they start at 0.',
] as const;
export const PARTLY_RECOVERED =
  'Quenchers: Kozly Hollow contracts are counted from the village’s trust record, which stops counting once a village is Sworn, so the count may be low.';

/** The level a standing gives: how many thresholds it has reached (0 to 4). */
export const levelOf = (order: OrderId, standing: number): number =>
  balance.orders.levelThresholds.value[order].filter((t) => standing >= t).length;

export interface Backfill {
  start: Record<OrderId, number>;
  levelHigh: Record<OrderId, number>;
  /** The standing before the cap, kept for the "brought from before" breakdown and the tests. */
  raw: Record<OrderId, number>;
  notes: string[];
}

export const backfillOrders = (state: Plain): Backfill => {
  const story = asPlain(state.story);
  const book = asPlain(state.book);
  const properties = asPlain(book.properties);
  const kozly = asPlain(asPlain(story.trust)['kozly-hollow']);
  const triumphant = list(state.cycles).filter(
    (c) => asPlain(asPlain(c).stand).band === 'triumphant',
  ).length;
  const chunk = triumphant * balance.orders.triumphantChunk.value;
  const sum = (o: Record<string, number>): number => Object.values(o).reduce((a, b) => a + b, 0);
  const raw: Record<OrderId, number> = {
    moot:
      whole(asPlain(state.stats).contractsWon) * balance.orders.standing.moot.value.contract +
      chunk,
    greyWives:
      list(book.tried).length * balance.orders.standing.greyWives.value.experiment +
      sum(Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, list(v).length]))) *
        balance.orders.standing.greyWives.value.property +
      chunk,
    bellWatchers:
      list(story.documents).length * balance.orders.standing.bellWatchers.value.document +
      list(story.letters).length * balance.orders.standing.bellWatchers.value.letter +
      list(story.names).length * balance.orders.standing.bellWatchers.value.name +
      chunk,
    quenchers: whole(kozly.won) * balance.orders.standing.quenchers.value.kozlyContract + chunk,
  };
  const start = {} as Record<OrderId, number>;
  const levelHigh = {} as Record<OrderId, number>;
  for (const id of ORDER_IDS) {
    const cap =
      balance.orders.levelThresholds.value[id][balance.orders.backfillCapLevel.value - 1] ?? 0;
    start[id] = Math.min(raw[id], cap);
    levelHigh[id] = levelOf(id, start[id]);
  }
  return { start, levelHigh, raw, notes: [...NOT_RECOVERED, PARTLY_RECOVERED] };
};
