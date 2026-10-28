// Plan T10.6 (GDD §5.13.1, D413, D421, D422): when the Orders open, and the load path.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ORDER_IDS, type OrderId } from '../../src/content/orders';
import { allDocuments } from '../../src/content/story/acts';
import { apply } from '../../src/core/commands/apply';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { findDocument } from '../../src/core/story/documents';
import { openOrders } from '../../src/core/systems/orders-open';
import { HOUR, keepRich, run, T0 } from '../contracts/helpers';

const fixtures = readdirSync(new URL('./../saves/fixtures/', import.meta.url)).filter((f) =>
  f.endsWith('.json'),
);
const load = (file: string): GameState => {
  const env = JSON.parse(
    readFileSync(new URL(`../saves/fixtures/${file}`, import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(`${file}: ${r.error}`);
  return r.value.state;
};

/** What should be open, worked out from the migrated save itself (not from one act). */
const expectedOpen = (s: GameState): OrderId[] => {
  const past = (a: string): boolean => s.cycles.some((c) => Object.keys(c.ranks).includes(a));
  const kettleWork =
    s.buildings['alchemists-hut'] > 0 || s.skills.alchemy > 0 || s.book.tried.length > 0;
  const found = (id: string): boolean => s.story.documents.some((d) => d.id === id);
  const table: [OrderId, boolean][] = [
    ['moot', s.cycle.age !== 'hamlet' || past('keep')],
    ['greyWives', kettleWork],
    ['bellWatchers', s.story.ilseAt !== null],
    ['quenchers', found('D5-08')],
  ];
  return table.filter(([, yes]) => yes).map(([id]) => id);
};

// Played saves (v10-played.json, v11-played.json, v12-played.json) and the owner's own v11/v12 saves (v13.json is v12-owner.json migrated) (Q51) have already opened their Orders; v10-played.json is checked in full-run.test.ts.
const migrated = fixtures.filter((f) => Object.keys(load(f).orders.opened).length === 0);

describe('a save on load opens exactly the Orders it is past', () => {
  it('covers every migrated fixture, and only the played ones are left out', () => {
    expect(fixtures.filter((f) => !migrated.includes(f))).toEqual([
      'v10-played.json',
      'v11-owner.json',
      'v11-played.json',
      'v12-owner.json', // D548 (6): the owner's real v12 save and its v13 form join the list
      'v12-played.json',
      'v12.json',
      'v13-owner.json', // D566 (2): the owner's real v13 save joins the list
      'v13-played.json',
      'v13.json',
    ]);
  });

  it.each(migrated)('%s', (file) => {
    const s = load(file);
    const want = expectedOpen(s);
    expect(s.orders.openingQueue).toEqual([]); // the migration opens nothing (T10.1)
    catchUpNow(s, s.time);
    expect(ORDER_IDS.filter((id) => s.orders.opened[id])).toEqual(want);
    expect(s.orders.openingQueue).toEqual(want); // scene order: Moot, Grey Wives, Bell-Watchers, Quenchers
    expect(s.orders.seats).toEqual([]); // nothing seats itself
    expect(s.orders.seatStepPending).toBe(want.length > 0);
    const again = structuredClone(s.orders);
    catchUpNow(s, s.time);
    openOrders(s, s.time, true);
    expect(s.orders).toEqual(again); // each opens exactly once
  });
});

describe('the Quenchers wait for D5-08', () => {
  const d508 = allDocuments.find((d) => d.id === 'D5-08');
  if (!d508) throw new Error('missing D5-08');

  it('cannot open before it, and open the moment it is found', () => {
    const s = keepRich('q-open');
    s.story.ilseAt = T0;
    openOrders(s, T0);
    expect(s.orders.opened.quenchers).toBeUndefined();
    findDocument(s, d508, 'contract');
    expect(s.orders.opened.quenchers).toBeDefined();
    expect(s.orders.openingQueue).toEqual(['moot', 'bellWatchers', 'quenchers']);
  });

  it('opens on the load whose catch-up found it, and counts the contract once', () => {
    const s = keepRich('q-load');
    openOrders(s, T0);
    const queue = [...s.orders.openingQueue];
    expect(queue).toEqual(['moot']);
    // The catch-up records the fact (D5-08 found); openOrders then runs after it.
    s.story.documents.push({ id: 'D5-08', cycle: 1, at: T0, via: 'contract' });
    const before = s.orders.counts.moot.contract;
    catchUpNow(s, s.time + HOUR);
    expect(s.orders.opened.quenchers).toBeDefined();
    expect(s.orders.openingQueue).toEqual(['moot', 'quenchers']);
    expect(s.orders.counts.moot.contract).toBe(before);
  });
});

describe('live triggers', () => {
  it('the first Alchemist’s Hut opens the Grey Wives', () => {
    const s = keepRich('hut');
    openOrders(s, T0);
    expect(s.orders.opened.greyWives).toBeUndefined();
    expect(run(s, { type: 'build.upgrade', building: 'alchemists-hut' })).toEqual({
      ok: true,
    });
    expect(s.orders.opened.greyWives).toBeDefined();
    expect(s.orders.openingQueue).toEqual(['moot', 'greyWives']);
  });

  it('the first document brings Ilse, and with her the Bell-Watchers', () => {
    const s = keepRich('ilse');
    openOrders(s, T0);
    const doc = allDocuments[0];
    if (!doc) throw new Error('no documents');
    findDocument(s, doc, 'contract');
    expect(s.orders.opened.bellWatchers).toBeDefined();
  });

  it('a new game opens the Moot at the first Keep, and nothing before', () => {
    const s = createNewGame('moot', T0);
    expect(openOrders(s, T0)).toEqual([]);
    s.resources = { food: 1e7, wood: 1e7, iron: 1e7, silver: 1e6 };
    Object.assign(s.buildings, { cottage: 20, farm: 5, mine: 4, mill: 3, smithy: 1 });
    s.peasants.total = 40;
    expect(s.orders.opened.moot).toBeUndefined();
    expect(run(s, { type: 'age.up' })).toEqual({ ok: true });
    expect(s.cycle.age).toBe('keep');
    expect(s.orders.opened.moot).toBeDefined();
    expect(s.orders.openingQueue).toEqual(['moot']);
    expect(s.orders.seatStepPending).toBe(false); // the sheet is for saves from before the Orders
    expect(s.orders.seats).toEqual([]);
  });
});

describe('opening scenes finish by the player’s choice only', () => {
  const opened = (): GameState => {
    const s = keepRich('finish');
    s.story.ilseAt = T0;
    openOrders(s, T0);
    return s;
  };

  it('"Seat it" takes a free seat and starts no cooldown', () => {
    const s = opened();
    expect(run(s, { type: 'orders.finishOpening', order: 'moot', seatIt: true }).ok).toBe(true);
    expect(s.orders.seats).toEqual(['moot']);
    expect(s.orders.lastChange).toBeNull();
    expect(s.orders.openingQueue).toEqual(['bellWatchers']);
  });

  it('"Not now" and "Continue" leave it unseated', () => {
    const s = opened();
    run(s, { type: 'orders.finishOpening', order: 'moot', seatIt: false });
    expect(s.orders.seats).toEqual([]);
    expect(s.orders.openingQueue).toEqual(['bellWatchers']);
  });

  it('refuses a scene that is not waiting, and "Seat it" with no free seat', () => {
    const s = opened();
    expect(run(s, { type: 'orders.finishOpening', order: 'quenchers', seatIt: false }).ok).toBe(
      false,
    );
    s.orders.seats = ['moot', 'bellWatchers'];
    s.orders.openingQueue = ['bellWatchers'];
    const before = JSON.stringify(s.orders);
    expect(run(s, { type: 'orders.finishOpening', order: 'bellWatchers', seatIt: true }).ok).toBe(
      false,
    );
    expect(JSON.stringify(s.orders)).toBe(before);
  });

  it('is unaffected by the Long Night: the queue waits', () => {
    const s = opened();
    expect(apply(s, { type: 'orders.setSeats', orders: [] }, T0).ok).toBe(true);
    expect(s.orders.openingQueue).toEqual(['moot', 'bellWatchers']);
  });
});
