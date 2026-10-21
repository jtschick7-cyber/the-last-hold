// Plan T10.13 (GDD §9.18, §5.13.3, D412, D416, D422): what the Orders card, the seat step and the
// Hold tab's badge say. The screens only draw these.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import type { OrderId } from '../../src/content/orders';
import { apply } from '../../src/core/commands/apply';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { chapterWaitsForSeat, playableChapters } from '../../src/core/story/orders-chapters';
import { ordersBadge, ordersCardView, seatStepOrders } from '../../src/core/systems/orders-view';
import { T0 } from '../contracts/helpers';

const COOL = balance.orders.swapCooldown.value * 1000;
const game = (open: OrderId[] = []): GameState => {
  const s = createNewGame('card', T0);
  for (const id of open) s.orders.opened[id] = { at: T0 };
  return s;
};
const level = (s: GameState, id: OrderId, n: number): void => {
  apply(s, { type: 'debug.ordersSetLevel', order: id, level: n }, T0);
};
const CLOSED =
  'Seats: 2 of 3 (the third opens when two Orders reach their top level and the Quenchers have come).';

describe('the Orders card', () => {
  it('is hidden before any Order has opened, and lists only open Orders', () => {
    const s = game();
    expect(ordersCardView(s, T0)).toBeNull();
    s.orders.opened.greyWives = { at: T0 };
    const v = ordersCardView(s, T0);
    expect(v?.rows.map((r) => r.id)).toEqual(['greyWives']);
  });

  it('reads the seat lines exactly in all four states', () => {
    const s = game(['moot', 'greyWives']);
    expect(ordersCardView(s, T0)).toMatchObject({
      seatsLine: CLOSED,
      inSeatsLine: 'In seats: none.',
    });
    apply(s, { type: 'orders.setSeats', orders: ['moot', 'greyWives'] }, T0);
    expect(ordersCardView(s, T0)).toMatchObject({
      seatsLine: CLOSED,
      inSeatsLine: "In seats: Thanes' Moot, Grey Wives",
    });
    s.orders.thirdSeat = true;
    expect(ordersCardView(s, T0)?.seatsLine).toBe('Seats: 3 of 3.');
    apply(s, { type: 'orders.setSeats', orders: [] }, T0);
    expect(ordersCardView(s, T0)).toMatchObject({
      seatsLine: 'Seats: 3 of 3.',
      inSeatsLine: 'In seats: none.',
    });
  });

  it('shows the level word and count, Seated or not, and what seating would give', () => {
    const s = game(['moot', 'greyWives']);
    level(s, 'moot', 2);
    apply(s, { type: 'orders.setSeats', orders: ['moot'] }, T0);
    const [moot, wives] = ordersCardView(s, T0)?.rows ?? [];
    expect(moot).toMatchObject({ levelWord: 'Friend', standing: 40, seated: true, gives: null });
    expect(wives).toMatchObject({ levelWord: 'No level yet', seated: false });
    expect(wives?.gives).toContain('brew and experiment time');
  });

  it('counts the cooldown down and drops the line when it ends', () => {
    const s = game(['moot', 'greyWives']);
    apply(s, { type: 'orders.seat', order: 'moot' }, T0);
    expect(ordersCardView(s, T0)?.cooldownLine).toBe('Can change in 1d');
    expect(ordersCardView(s, T0 + COOL - (9 * 3600 + 20 * 60) * 1000)?.cooldownLine).toBe(
      'Can change in 9h 20m',
    );
    expect(ordersCardView(s, T0 + COOL)?.cooldownLine).toBeNull();
  });

  it('offers seat, unseat or swap by the state of the seats', () => {
    const s = game(['moot', 'greyWives', 'bellWatchers']);
    expect(ordersCardView(s, T0)?.rows.map((r) => r.action)).toEqual(['seat', 'seat', 'seat']);
    apply(s, { type: 'orders.setSeats', orders: ['moot', 'greyWives'] }, T0);
    const rows = ordersCardView(s, T0)?.rows ?? [];
    expect(rows.map((r) => r.action)).toEqual(['unseat', 'unseat', 'swap']);
    expect(rows[2]?.swapOut).toEqual(['moot', 'greyWives']);
  });

  it('a routine swap is 3 taps from the card (open, swap in, choose the one out)', () => {
    const s = game(['moot', 'greyWives', 'bellWatchers']);
    apply(s, { type: 'orders.setSeats', orders: ['moot', 'greyWives'] }, T0);
    const row = ordersCardView(s, T0)?.rows[2];
    expect(row?.action).toBe('swap');
    expect(apply(s, { type: 'orders.swap', out: 'moot', in: 'bellWatchers' }, T0).ok).toBe(true);
  });

  it('keeps the opening scenes waiting and the load step pending until used', () => {
    const s = game(['moot']);
    s.orders.openingQueue = ['moot'];
    s.orders.seatStepPending = true;
    expect(ordersCardView(s, T0)).toMatchObject({ scenesWaiting: ['moot'], seatStepPending: true });
    s.orders.lastChange = T0;
    apply(s, { type: 'orders.skipSeatStep' }, T0);
    expect(s.orders.seatStepPending).toBe(false);
    expect(s.orders.lastChange).toBe(T0); // skipping does not clear a cooldown
    expect(seatStepOrders(s)).toEqual(['moot']);
  });
});

describe('the Hold tab badge', () => {
  it('shows exactly while a chapter is playable or one is due with no seat', () => {
    const s = game(['moot', 'greyWives']);
    expect(ordersBadge(s)).toBe(false); // nothing due
    level(s, 'moot', 1);
    expect(chapterWaitsForSeat(s, 'moot')).toBe(true);
    expect(ordersBadge(s)).toBe(true); // due, unseated
    apply(s, { type: 'orders.setSeats', orders: ['moot'] }, T0);
    expect(playableChapters(s).map((c) => c.id)).toContain('OR-M1');
    expect(ordersBadge(s)).toBe(true); // playable
    expect(ordersCardView(s, T0)?.chaptersReady).toBe(1);
    apply(s, { type: 'orders.readChapter', order: 'moot' }, T0);
    expect(ordersBadge(s)).toBe(false); // read; the next one is not due
    expect(ordersCardView(s, T0)?.chaptersReady).toBe(0);
    apply(s, { type: 'orders.setSeats', orders: [] }, T0);
    expect(ordersBadge(s)).toBe(false); // unseating changes nothing that is due
  });
});
