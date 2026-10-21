// Plan T10.17 (GDD §6.1, D417): the Orderer. Its schedule is the Delver's; at a check-in it finishes
// the opening scenes ("Seat it" when a seat is free), fills a free seat, reads every chapter that can
// be read, and at a new warden seats the top-ranked Orders. It never swaps mid-cycle, and no other
// simulated player ever gives an Order a seat.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ORDER_IDS } from '../../src/content/orders';
import { apply } from '../../src/core/commands/apply';
import { play, POLICY_IDS } from '../../src/core/policies';
import { allChaptersRead, ordererMoves, rankOrders } from '../../src/core/policies/orderer';
import { isDelveSession, nextCheckIn } from '../../src/core/policies/schedules';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import { seatCount } from '../../src/core/systems/orders-seats';

const START = Date.UTC(2024, 0, 1, 7);

/** The owner's migrated save, past the three early Orders; the Quenchers opened from the debug panel. */
const owner = (): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL('../saves/fixtures/v10.json', import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  catchUpNow(s, s.time);
  return s;
};

const moves = (s: GameState, newWarden = false) =>
  ordererMoves(s, (cmd) => apply(s, cmd, s.time).ok, newWarden);

describe("the Orderer keeps the Delver's check-ins", () => {
  it('has the same times over three weeks, from a Monday, Delve sessions included', () => {
    const times = (p: 'delver' | 'orderer') => {
      const out: number[] = [];
      for (let t = START; out.length < 120; t = nextCheckIn(p, t, START - 10 ** 9)) out.push(t);
      return out;
    };
    expect(times('orderer')).toEqual(times('delver'));
    const sessions = times('orderer').filter((t) => isDelveSession('orderer', t));
    expect(sessions.length).toBeGreaterThan(5);
  });
  it('opens like the Delver (10-second steps for 15 minutes)', () => {
    expect(nextCheckIn('orderer', START, START)).toBe(nextCheckIn('delver', START, START));
  });
});

describe('the ranking', () => {
  it('puts due chapters first, then the most unread, then the list order', () => {
    const s = owner();
    for (const id of ORDER_IDS)
      if (!s.orders.opened[id]) apply(s, { type: 'debug.ordersOpen', order: id }, s.time);
    // Nothing due and nothing read: the list order.
    for (const id of ORDER_IDS) {
      s.orders.levelHigh[id] = 0;
      s.orders.start[id] = 0;
      s.orders.counts[id] = {};
    }
    s.orders.triumphant = 0;
    expect(rankOrders(s)).toEqual(['moot', 'greyWives', 'bellWatchers', 'quenchers']);
    // Grey Wives has a chapter due (level 1 and no seat needed to be "due"): it comes first.
    apply(s, { type: 'debug.ordersSetLevel', order: 'greyWives', level: 1 }, s.time);
    expect(rankOrders(s)[0]).toBe('greyWives');
    // Two Orders due: the one with more unread chapters comes first.
    apply(s, { type: 'debug.ordersSetLevel', order: 'quenchers', level: 2 }, s.time);
    apply(s, { type: 'debug.ordersSetLevel', order: 'greyWives', level: 2 }, s.time);
    s.orders.chaptersRead.greyWives = 1;
    expect(rankOrders(s).slice(0, 2)).toEqual(['quenchers', 'greyWives']);
  });
  it('leaves out an Order that has not opened', () => {
    const s = owner();
    s.orders.opened = { moot: { at: 0 } };
    expect(rankOrders(s)).toEqual(['moot']);
  });
});

describe('its moves', () => {
  it('taps "Seat it" while a seat is free and "Continue" once both are full', () => {
    const s = owner();
    for (const id of ORDER_IDS)
      if (!s.orders.opened[id]) apply(s, { type: 'debug.ordersOpen', order: id }, s.time);
    s.orders.openingQueue = ['moot', 'greyWives', 'bellWatchers'];
    s.orders.seats = [];
    const r = moves(s);
    expect(r.openings).toEqual([
      { order: 'moot', seated: true },
      { order: 'greyWives', seated: true },
      { order: 'bellWatchers', seated: false },
    ]);
    expect(s.orders.seats).toEqual(['moot', 'greyWives']);
    expect(s.orders.openingQueue).toEqual([]);
  });

  it('takes the third seat the moment it opens, and never swaps or unseats mid-cycle', () => {
    const s = owner();
    for (const id of ORDER_IDS)
      if (!s.orders.opened[id]) apply(s, { type: 'debug.ordersOpen', order: id }, s.time);
    s.orders.openingQueue = [];
    s.orders.seats = ['moot', 'greyWives'];
    moves(s);
    expect(s.orders.seats).toEqual(['moot', 'greyWives']);
    // A due chapter in an unseated Order does not make it swap in.
    apply(s, { type: 'debug.ordersSetLevel', order: 'bellWatchers', level: 4 }, s.time);
    moves(s);
    expect(s.orders.seats).toEqual(['moot', 'greyWives']);
    expect(s.orders.lastChange).toBeNull();
    apply(s, { type: 'debug.ordersOpenThird' }, s.time);
    expect(seatCount(s)).toBe(3);
    const r = moves(s);
    expect(s.orders.seats).toEqual(['moot', 'greyWives', 'bellWatchers']);
    expect(r.seats).toEqual(s.orders.seats);
  });

  it('reads every chapter that can be read, and only those', () => {
    const s = owner();
    for (const id of ORDER_IDS)
      if (!s.orders.opened[id]) apply(s, { type: 'debug.ordersOpen', order: id }, s.time);
    s.orders.openingQueue = [];
    s.orders.seats = ['greyWives', 'bellWatchers'];
    apply(s, { type: 'debug.ordersSetLevel', order: 'greyWives', level: 3 }, s.time);
    apply(s, { type: 'debug.ordersSetLevel', order: 'moot', level: 4 }, s.time);
    const r = moves(s);
    expect(r.chapters.filter((c) => c.order === 'greyWives').map((c) => c.n)).toEqual([1, 2, 3]);
    expect(s.orders.chaptersRead.moot).toBe(0); // not seated: waits for a seat
    expect(s.orders.chaptersRead.greyWives).toBe(3);
    expect(moves(s).chapters).toEqual([]);
    expect(allChaptersRead(s)).toBe(false);
  });

  it('seats the top-ranked Orders for a new warden, free of the cooldown', () => {
    const s = owner();
    for (const id of ORDER_IDS)
      if (!s.orders.opened[id]) apply(s, { type: 'debug.ordersOpen', order: id }, s.time);
    s.orders.openingQueue = [];
    s.orders.seats = ['greyWives', 'bellWatchers'];
    s.orders.lastChange = s.time; // a change this very hour
    apply(s, { type: 'debug.ordersSetLevel', order: 'moot', level: 2 }, s.time);
    const r = moves(s, true);
    expect(r.newWarden).toBe(true);
    expect(s.orders.seats).toEqual(['moot', 'greyWives']);
    expect(s.orders.lastChange).toBeNull();
  });
});

describe('only the Orderer seats an Order', () => {
  it('leaves every Order unseated and issues no Orders command for every other policy', () => {
    for (const policy of POLICY_IDS.filter((p) => p !== 'orderer')) {
      const s = createNewGame('sim-1', START);
      const seen: string[] = [];
      play(s, {
        policy,
        startedAt: START,
        until: START + 24 * 3_600_000,
        onCheckIn: (rec) => {
          for (const c of rec.commands) if (c.type.startsWith('orders.')) seen.push(c.type);
          expect(rec.orders).toBeUndefined();
        },
      });
      expect(seen, policy).toEqual([]);
      expect(s.orders.seats, policy).toEqual([]);
    }
  }, 60_000);
});

describe('a short run', () => {
  it('seats and reads on its own, deterministically', () => {
    const go = () => {
      const s = createNewGame('sim-1', START);
      let chapters = 0;
      play(s, {
        policy: 'orderer',
        startedAt: START,
        until: START + 3 * 24 * 3_600_000,
        onCheckIn: (rec) => {
          chapters += rec.orders?.chapters.length ?? 0;
        },
      });
      return { s, chapters };
    };
    const a = go();
    const b = go();
    expect(a.s.orders.opened.moot).toBeDefined();
    expect(a.s.orders.seats.length).toBeGreaterThan(0);
    expect(a.chapters).toBeGreaterThan(0);
    expect(JSON.stringify(a.s)).toBe(JSON.stringify(b.s));
  });
});
