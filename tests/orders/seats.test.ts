// Plan T10.5 (GDD §5.13.3–§5.13.4, D412, D422): seats, the third seat and swaps.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import type { OrderId } from '../../src/content/orders';
import { apply } from '../../src/core/commands/apply';
import { resetForNewCycle } from '../../src/core/long-night/reset';
import type { GameState } from '../../src/core/state/game-state';
import { checkThirdSeat, orderLevel, raiseLevels } from '../../src/core/systems/orders';
import { cooldownLeft, seatCount } from '../../src/core/systems/orders-seats';
import { createNewGame } from '../../src/core/state/new-game';
import { T0 } from '../contracts/helpers';

const COOL = balance.orders.swapCooldown.value * 1000;
const HOUR = 3_600_000;
const TOP = (id: OrderId): number => balance.orders.levelThresholds.value[id][3] ?? 0;

const game = (open: OrderId[] = ['moot', 'greyWives', 'bellWatchers']): GameState => {
  const s = createNewGame('seats', T0);
  for (const id of open) s.orders.opened[id] = { at: T0 };
  return s;
};
const cmd = (s: GameState, c: Parameters<typeof apply>[1], now = T0) => apply(s, c, now);

describe('seats', () => {
  it('start at two, and never exceed two before the third opens', () => {
    const s = game();
    expect(seatCount(s)).toBe(2);
    expect(cmd(s, { type: 'orders.seat', order: 'moot' }).ok).toBe(true);
    expect(cmd(s, { type: 'orders.seat', order: 'greyWives' }, T0 + COOL).ok).toBe(true);
    const r = cmd(s, { type: 'orders.seat', order: 'bellWatchers' }, T0 + 2 * COOL);
    expect(r).toEqual({ ok: false, reason: 'Every seat is taken.' });
    expect(s.orders.seats).toEqual(['moot', 'greyWives']);
  });

  it('allow three once the third has opened, and no more', () => {
    const s = game(['moot', 'greyWives', 'bellWatchers', 'quenchers']);
    s.orders.thirdSeat = true;
    expect(seatCount(s)).toBe(3);
    const ids: OrderId[] = ['moot', 'greyWives', 'bellWatchers', 'quenchers'];
    ids.forEach((order, i) => cmd(s, { type: 'orders.seat', order }, T0 + i * COOL));
    expect(s.orders.seats).toEqual(['moot', 'greyWives', 'bellWatchers']);
  });

  it('keep list order whatever order they are seated in, and refuse closed or repeated Orders', () => {
    const s = game();
    cmd(s, { type: 'orders.seat', order: 'bellWatchers' });
    cmd(s, { type: 'orders.seat', order: 'moot' }, T0 + COOL);
    expect(s.orders.seats).toEqual(['moot', 'bellWatchers']);
    expect(cmd(s, { type: 'orders.seat', order: 'moot' }, T0 + 2 * COOL).ok).toBe(false);
    expect(cmd(s, { type: 'orders.seat', order: 'quenchers' }, T0 + 2 * COOL).ok).toBe(false);
    expect(cmd(s, { type: 'orders.seat', order: 'nope' as OrderId }, T0 + 2 * COOL).ok).toBe(false);
  });

  it('unseat and swap work, and refuse an Order that has no seat or already has one', () => {
    const s = game();
    cmd(s, { type: 'orders.seat', order: 'moot' });
    const t = T0 + COOL;
    expect(cmd(s, { type: 'orders.unseat', order: 'greyWives' }, t).ok).toBe(false);
    expect(cmd(s, { type: 'orders.swap', out: 'greyWives', in: 'bellWatchers' }, t).ok).toBe(false);
    expect(cmd(s, { type: 'orders.swap', out: 'moot', in: 'moot' }, t).ok).toBe(false);
    expect(cmd(s, { type: 'orders.swap', out: 'moot', in: 'quenchers' }, t).ok).toBe(false);
    expect(cmd(s, { type: 'orders.swap', out: 'moot', in: 'bellWatchers' }, t).ok).toBe(true);
    expect(s.orders.seats).toEqual(['bellWatchers']);
    expect(cmd(s, { type: 'orders.unseat', order: 'bellWatchers' }, t + COOL).ok).toBe(true);
    expect(s.orders.seats).toEqual([]);
  });

  it('are never filled by anything but a command (opening, levels and advance leave them alone)', () => {
    const s = game();
    s.orders.start.moot = TOP('moot');
    raiseLevels(s);
    expect(s.orders.seats).toEqual([]);
  });
});

describe('the cooldown', () => {
  const seated = (): GameState => {
    const s = game();
    cmd(s, { type: 'orders.seat', order: 'moot' });
    return s;
  };

  it('refuses a change inside 24 h with the time left, and allows it at 24 h', () => {
    const s = seated();
    const r = cmd(s, { type: 'orders.seat', order: 'greyWives' }, T0 + 14 * HOUR + 40 * 60_000);
    expect(r).toEqual({ ok: false, reason: 'Can change in 9h 20m' });
    expect(cmd(s, { type: 'orders.unseat', order: 'moot' }, T0 + HOUR).ok).toBe(false);
    expect(cmd(s, { type: 'orders.swap', out: 'moot', in: 'greyWives' }, T0 + HOUR).ok).toBe(false);
    expect(s.orders.seats).toEqual(['moot']);
    expect(cmd(s, { type: 'orders.seat', order: 'greyWives' }, T0 + COOL).ok).toBe(true);
  });

  it('is not shortened by a rewound device clock', () => {
    const s = seated();
    // The event clock has run on to T0 + 5 h; the device then claims it is T0 - 30 days.
    s.events.clock = { value: s.events.clock.value + 5 * HOUR, high: T0 + 5 * HOUR };
    const back = T0 - 30 * 24 * HOUR;
    expect(cmd(s, { type: 'orders.seat', order: 'greyWives' }, back).ok).toBe(false);
    expect(cooldownLeft(s, back)).toBeGreaterThan(0);
    expect(cooldownLeft(s, T0 + 5 * HOUR)).toBe(
      COOL - (s.events.clock.value - (s.orders.lastChange ?? 0)),
    );
  });

  it('a refused change starts no cooldown and changes nothing', () => {
    const s = seated();
    const last = s.orders.lastChange;
    cmd(s, { type: 'orders.seat', order: 'quenchers' }, T0 + COOL);
    expect(s.orders.lastChange).toBe(last);
  });

  it('is cleared by a new warden', () => {
    const s = seated();
    expect(cooldownLeft(s, T0 + HOUR)).toBeGreaterThan(0);
    resetForNewCycle(s);
    expect(s.orders.lastChange).toBeNull();
    expect(s.orders.seats).toEqual(['moot']); // the seats carry over
  });
});

describe('the new-warden and load step (orders.setSeats)', () => {
  it('sets the seats with no cooldown, clears one, and ends the pending step', () => {
    const s = game();
    cmd(s, { type: 'orders.seat', order: 'moot' });
    s.orders.seatStepPending = true;
    const r = cmd(s, { type: 'orders.setSeats', orders: ['bellWatchers', 'greyWives'] }, T0 + HOUR);
    expect(r.ok).toBe(true);
    expect(s.orders.seats).toEqual(['greyWives', 'bellWatchers']);
    expect(s.orders.lastChange).toBeNull();
    expect(s.orders.seatStepPending).toBe(false);
    expect(cmd(s, { type: 'orders.unseat', order: 'greyWives' }, T0 + HOUR).ok).toBe(true);
  });

  it('refuses too many, repeats, closed Orders, and changes nothing', () => {
    const s = game();
    const before = JSON.stringify(s);
    for (const orders of [
      ['moot', 'greyWives', 'bellWatchers'],
      ['moot', 'moot'],
      ['quenchers'],
    ] as OrderId[][])
      expect(cmd(s, { type: 'orders.setSeats', orders }).ok).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('the third seat opens exactly once, whichever condition comes last', () => {
  const twoAtTop = (s: GameState): void => {
    s.orders.start.moot = TOP('moot');
    s.orders.start.greyWives = TOP('greyWives');
  };

  it('level 4 reached by two Orders, then the Quenchers open', () => {
    const s = game();
    twoAtTop(s);
    raiseLevels(s);
    expect(orderLevel(s, 'moot')).toBe(4);
    expect(s.orders.thirdSeat).toBe(false);
    s.orders.opened.quenchers = { at: T0 };
    expect(checkThirdSeat(s)).toBe(true);
    expect(s.orders.thirdSeat).toBe(true);
    expect(checkThirdSeat(s)).toBe(false); // once
  });

  it('the Quenchers open, then two Orders reach level 4 (opened by the level change itself)', () => {
    const s = game(['moot', 'greyWives', 'quenchers']);
    s.orders.start.moot = TOP('moot');
    raiseLevels(s);
    expect(s.orders.thirdSeat).toBe(false); // only one at the top
    s.orders.start.greyWives = TOP('greyWives');
    raiseLevels(s);
    expect(s.orders.thirdSeat).toBe(true);
  });

  it('two Orders already at level 4 when a save loads, and the Quenchers open in the catch-up', () => {
    const s = game();
    s.orders.levelHigh.moot = 4;
    s.orders.levelHigh.bellWatchers = 4;
    expect(checkThirdSeat(s)).toBe(false); // the load check: the Quenchers have not come
    expect(s.orders.thirdSeat).toBe(false);
    s.orders.opened.quenchers = { at: T0 };
    expect(checkThirdSeat(s)).toBe(true);
    expect(s.orders.thirdSeat).toBe(true);
  });

  it('does not open with one Order at the top, or with the Quenchers still closed', () => {
    const s = game();
    s.orders.levelHigh.moot = 4;
    s.orders.opened.quenchers = { at: T0 };
    expect(checkThirdSeat(s)).toBe(false);
    const t = game();
    t.orders.levelHigh.moot = 4;
    t.orders.levelHigh.greyWives = 4;
    expect(checkThirdSeat(t)).toBe(false);
  });

  it('is kept through the Long Night', () => {
    const s = game(['moot', 'greyWives', 'quenchers']);
    s.orders.levelHigh.moot = 4;
    s.orders.levelHigh.greyWives = 4;
    checkThirdSeat(s);
    resetForNewCycle(s);
    expect(s.orders.thirdSeat).toBe(true);
    expect(seatCount(s)).toBe(3);
  });
});

describe('unseating loses nothing', () => {
  it('keeps standing, level and chapters read', () => {
    const s = game();
    s.orders.start.moot = 40;
    raiseLevels(s);
    s.orders.chaptersRead.moot = 1;
    s.orders.readWith.moot = [['moot']];
    cmd(s, { type: 'orders.seat', order: 'moot' });
    const before = structuredClone({ ...s.orders, seats: [], lastChange: null });
    cmd(s, { type: 'orders.unseat', order: 'moot' }, T0 + COOL);
    expect({ ...s.orders, lastChange: null }).toEqual(before);
  });
});
