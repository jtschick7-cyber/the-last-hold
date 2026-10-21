// Plan T10.12 (technical design §15): the debug commands for the Orders.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { apply } from '../../src/core/commands/apply';
import type { Command } from '../../src/core/commands';
import { newOrdersState } from '../../src/core/state/orders-state';
import { createNewGame } from '../../src/core/state/new-game';
import { orderLevel, orderStanding } from '../../src/core/systems/orders';
import { cooldownLeft, seatCount } from '../../src/core/systems/orders-seats';
import { T0 } from '../contracts/helpers';

const game = () => createNewGame('debug-orders', T0);
const run = (s: ReturnType<typeof game>, c: Command, now = T0) => apply(s, c, now);
const cut = (id: 'moot' | 'greyWives' | 'bellWatchers' | 'quenchers', level: number): number =>
  balance.orders.levelThresholds.value[id][level - 1] ?? 0;

describe('debug commands for the Orders', () => {
  it('open: opens an Order, queues its scene, takes no seat, and refuses a second time', () => {
    const s = game();
    expect(run(s, { type: 'debug.ordersOpen', order: 'moot' }).ok).toBe(true);
    expect(s.orders.opened.moot).toEqual({ at: T0 });
    expect(s.orders.openingQueue).toEqual(['moot']);
    expect(s.orders.seats).toEqual([]);
    expect(s.meta.debugUsed).toBe(true);
    expect(run(s, { type: 'debug.ordersOpen', order: 'moot' }).ok).toBe(false);
  });

  it('addStanding: adds standing and raises the level; refuses nonsense', () => {
    const s = game();
    expect(
      run(s, { type: 'debug.ordersAddStanding', order: 'moot', amount: cut('moot', 2) }).ok,
    ).toBe(true);
    expect(orderStanding(s, 'moot')).toBe(cut('moot', 2));
    expect(orderLevel(s, 'moot')).toBe(2);
    expect(s.meta.debugUsed).toBe(true);
    const bad = [0, -3, 1.5, Number.NaN];
    for (const amount of bad)
      expect(run(s, { type: 'debug.ordersAddStanding', order: 'moot', amount }).ok).toBe(false);
    expect(orderStanding(s, 'moot')).toBe(cut('moot', 2));
  });

  it('setLevel: reaches exactly that level, never lowers, refuses a level past the top', () => {
    const s = game();
    expect(run(s, { type: 'debug.ordersSetLevel', order: 'greyWives', level: 3 }).ok).toBe(true);
    expect(orderLevel(s, 'greyWives')).toBe(3);
    expect(s.orders.levelHigh.greyWives).toBe(3);
    expect(orderStanding(s, 'greyWives')).toBe(cut('greyWives', 3));
    expect(run(s, { type: 'debug.ordersSetLevel', order: 'greyWives', level: 2 }).ok).toBe(false);
    expect(run(s, { type: 'debug.ordersSetLevel', order: 'greyWives', level: 5 }).ok).toBe(false);
    expect(orderLevel(s, 'greyWives')).toBe(3);
  });

  it('openThird: opens the third seat', () => {
    const s = game();
    expect(seatCount(s)).toBe(2);
    expect(run(s, { type: 'debug.ordersOpenThird' }).ok).toBe(true);
    expect(seatCount(s)).toBe(3);
    expect(s.meta.debugUsed).toBe(true);
  });

  it('clearCooldown: ends the wait after a seat change', () => {
    const s = game();
    s.orders.opened.moot = { at: T0 };
    s.orders.opened.greyWives = { at: T0 };
    run(s, { type: 'orders.seat', order: 'moot' });
    expect(cooldownLeft(s, T0)).toBeGreaterThan(0);
    expect(run(s, { type: 'debug.ordersClearCooldown' }).ok).toBe(true);
    expect(cooldownLeft(s, T0)).toBe(0);
    expect(run(s, { type: 'orders.seat', order: 'greyWives' }).ok).toBe(true);
  });

  it('playChapter: opens, raises, reads the chapters before it, and keeps the seats it saw', () => {
    const s = game();
    s.orders.opened.moot = { at: T0 };
    s.orders.seats = ['moot'];
    expect(
      run(s, { type: 'debug.ordersPlayChapter', order: 'bellWatchers', chapter: 2 }, T0).ok,
    ).toBe(true);
    expect(s.orders.opened.bellWatchers).toBeDefined();
    expect(orderLevel(s, 'bellWatchers')).toBe(2);
    expect(s.orders.chaptersRead.bellWatchers).toBe(2);
    expect(s.orders.readWith.bellWatchers).toEqual([['moot'], ['moot']]);
    expect(s.orders.seats).toEqual(['moot']); // never seated
    expect(s.meta.debugUsed).toBe(true);
    expect(run(s, { type: 'debug.ordersPlayChapter', order: 'bellWatchers', chapter: 2 }).ok).toBe(
      false,
    );
    expect(run(s, { type: 'debug.ordersPlayChapter', order: 'moot', chapter: 5 }).ok).toBe(false);
    expect(run(s, { type: 'debug.ordersPlayChapter', order: 'moot', chapter: 0 }).ok).toBe(false);
  });

  it('reset: puts the Orders back to a new game', () => {
    const s = game();
    run(s, { type: 'debug.ordersSetLevel', order: 'moot', level: 4 });
    run(s, { type: 'debug.ordersPlayChapter', order: 'moot', chapter: 3 });
    expect(run(s, { type: 'debug.ordersReset' }).ok).toBe(true);
    expect(s.orders).toEqual(newOrdersState());
    expect(s.meta.debugUsed).toBe(true);
  });

  it('refuses an unknown Order in every command that takes one', () => {
    const s = game();
    const order = 'nobody' as never;
    const cmds: Command[] = [
      { type: 'debug.ordersOpen', order },
      { type: 'debug.ordersAddStanding', order, amount: 1 },
      { type: 'debug.ordersSetLevel', order, level: 1 },
      { type: 'debug.ordersPlayChapter', order, chapter: 1 },
    ];
    for (const c of cmds) expect(run(s, c).ok).toBe(false);
    expect(s.meta.debugUsed).toBe(false);
  });

  it('is reachable only from the debug panel (nothing else dispatches them)', () => {
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name)) files.push(p);
      }
    };
    walk('src/ui');
    const users = files.filter((f) => readFileSync(f, 'utf8').includes('debug.orders'));
    expect(users).toEqual([join('src/ui/more', 'DebugSheet.tsx')]);
  });
});
