import { ORDER_IDS, ORDER_SOURCES, type OrderId } from '../../content/orders';
import type { OrdersState } from '../state/orders-state';
import { arr, bool, count, finite, Invalid, obj, orNull, type Obj } from './guards';
import { balance } from '../../content/balance';

// Technical design §5.2 and §9.4 (v10): the Orders part of the save guard. Unknown Order ids and
// unknown sources drop with a warning, never a crash. An impossible state (a seat for an Order that
// has not opened, a chapter read that its level never allowed, a third seat with nothing to open
// it) is refused: commands cannot make one, so it means a damaged save. The migration's notes about
// what it could not recover come out as load notes, not warnings (they are not damage).
const perOrder = <T>(
  v: unknown,
  where: string,
  read: (x: unknown, w: string) => T,
): Record<OrderId, T> => {
  const o = obj(v, where);
  return Object.fromEntries(ORDER_IDS.map((id) => [id, read(o[id], `${where}.${id}`)])) as Record<
    OrderId,
    T
  >;
};

const dropUnknown = (o: Obj, where: string, warnings: string[]): void => {
  for (const k of Object.keys(o))
    if (!(ORDER_IDS as readonly string[]).includes(k))
      warnings.push(`Dropped unknown ${where} entry "${k}".`);
};

const orderIds = (v: unknown, where: string, warnings: string[]): OrderId[] => {
  const out: OrderId[] = [];
  for (const [i, x] of arr(v, where).entries()) {
    if (typeof x !== 'string' || !(ORDER_IDS as readonly string[]).includes(x)) {
      warnings.push(`Dropped unknown ${where}[${i}].`);
      continue;
    }
    out.push(x as OrderId);
  }
  return out;
};

const listOrder = (ids: OrderId[]): OrderId[] =>
  [...ids].sort((a, b) => ORDER_IDS.indexOf(a) - ORDER_IDS.indexOf(b));

export const ordersFrom = (v: unknown, warnings: string[], notes: string[]): OrdersState => {
  const o = obj(v, 'orders');
  for (const n of Array.isArray(o.migrationNotes) ? o.migrationNotes : [])
    if (typeof n === 'string') notes.push(n);

  const openedRaw = obj(o.opened, 'orders.opened');
  dropUnknown(openedRaw, 'orders.opened', warnings);
  const opened: OrdersState['opened'] = {};
  for (const id of ORDER_IDS)
    if (id in openedRaw)
      opened[id] = {
        at: finite(obj(openedRaw[id], `orders.opened.${id}`).at, `orders.opened.${id}.at`),
      };

  const countsRaw = obj(o.counts, 'orders.counts');
  dropUnknown(countsRaw, 'orders.counts', warnings);
  const counts = perOrder(o.counts, 'orders.counts', (x, w) => {
    const c = obj(x, w);
    const sources = ORDER_SOURCES[w.split('.').pop() as OrderId] as readonly string[];
    for (const k of Object.keys(c))
      if (!sources.includes(k)) warnings.push(`Dropped unknown ${w} entry "${k}".`);
    return Object.fromEntries(sources.map((k) => [k, k in c ? count(c[k], `${w}.${k}`) : 0]));
  });

  const levelHigh = perOrder(o.levelHigh, 'orders.levelHigh', (x, w) => {
    const n = count(x, w);
    if (n > balance.orders.levels.value) throw new Invalid(`${w} is above the top level.`);
    return n;
  });
  const chaptersRead = perOrder(o.chaptersRead, 'orders.chaptersRead', (x, w) => {
    const n = count(x, w);
    if (n > balance.orders.levels.value) throw new Invalid(`${w} is above the last chapter.`);
    return n;
  });
  for (const id of ORDER_IDS)
    if (chaptersRead[id] > levelHigh[id])
      throw new Invalid(`orders.chaptersRead.${id} is above the level the Order reached.`);

  const readWith = perOrder(o.readWith, 'orders.readWith', (x, w) =>
    arr(x, w).map((seats, i) => listOrder(orderIds(seats, `${w}[${i}]`, warnings))),
  );
  for (const id of ORDER_IDS)
    if (readWith[id].length !== chaptersRead[id])
      throw new Invalid(`orders.readWith.${id} must hold one entry per chapter read.`);

  const seatsRaw = orderIds(o.seats, 'orders.seats', warnings);
  if (new Set(seatsRaw).size !== seatsRaw.length)
    throw new Invalid('orders.seats lists an Order twice.');
  for (const id of seatsRaw)
    if (!opened[id]) throw new Invalid(`orders.seats has ${id}, which has not opened.`);
  const seats = listOrder(seatsRaw);
  if (seats.some((id, i) => id !== seatsRaw[i]))
    warnings.push('The seated Orders were put back in list order.');

  const thirdSeat = bool(o.thirdSeat, 'orders.thirdSeat');
  if (seats.length > (thirdSeat ? balance.orders.seatsMax.value : balance.orders.seatsStart.value))
    throw new Invalid('orders.seats holds more Orders than there are seats.');
  if (thirdSeat) {
    const top = ORDER_IDS.filter((id) => levelHigh[id] >= balance.orders.levels.value).length;
    if (top < balance.orders.thirdSeatTopOrders.value || !opened.quenchers)
      throw new Invalid('orders.thirdSeat is open without what opens it.');
  }

  const queue = orderIds(o.openingQueue, 'orders.openingQueue', warnings);
  for (const id of queue)
    if (!opened[id]) throw new Invalid(`orders.openingQueue has ${id}, which has not opened.`);

  const win = orNull(o.delveWindow, (x) => {
    const w = obj(x, 'orders.delveWindow');
    return {
      start: finite(w.start, 'orders.delveWindow.start'),
      used: count(w.used, 'orders.delveWindow.used'),
    };
  });

  return {
    opened,
    counts,
    start: perOrder(o.start, 'orders.start', count),
    triumphant: count(o.triumphant, 'orders.triumphant'),
    delveWindow: win,
    levelHigh,
    seats,
    thirdSeat,
    lastChange: orNull(o.lastChange, (x) => finite(x, 'orders.lastChange')),
    chaptersRead,
    readWith,
    openingQueue: queue,
    seatStepPending: bool(o.seatStepPending, 'orders.seatStepPending'),
  };
};
