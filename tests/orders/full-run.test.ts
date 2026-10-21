// Plan T10.16 (GDD §5.13, D414, D419, D422): a scripted run from the migrated fixture (v10.json, the
// owner's save) to every chapter read, using the debug commands for the standing and the cooldown and
// the player's own commands for every seat and every reading. Nothing seats itself.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ORDER_IDS, type OrderId } from '../../src/content/orders';
import { apply } from '../../src/core/commands/apply';
import type { Command } from '../../src/core/commands';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
import {
  ordersShelf,
  readChapterText,
  chapterText,
} from '../../src/core/story/orders-chapter-view';
import { nextChapter, playableChapters, variantRead } from '../../src/core/story/orders-chapters';
import { ordersBadge } from '../../src/core/systems/orders-view';

const loadFixture = (file: string): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL(`../saves/fixtures/${file}`, import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};

/** One reading: the Orders to seat (the player's command), the Order to read, the chapter it plays. */
interface Step {
  seats: OrderId[];
  read: OrderId;
  n: number;
}
// The Moot's and the Quenchers' chapter 4 each wait for the other Order and read A when it is also
// seated, B when it is not (GDD §5.13.6). `both` reads them together; otherwise each reads alone.
const script = (both: boolean): Step[] => [
  ...[1, 2, 3].map((n): Step => ({ seats: ['moot', 'greyWives'], read: 'moot', n })),
  ...[1, 2, 3, 4].map((n): Step => ({
    seats: ['greyWives', 'bellWatchers'],
    read: 'greyWives',
    n,
  })),
  ...[1, 2, 3, 4].map((n): Step => ({
    seats: ['bellWatchers', 'greyWives'],
    read: 'bellWatchers',
    n,
  })),
  ...[1, 2, 3].map((n): Step => ({ seats: ['quenchers', 'greyWives'], read: 'quenchers', n })),
  { seats: both ? ['moot', 'quenchers'] : ['moot'], read: 'moot', n: 4 },
  { seats: both ? ['moot', 'quenchers'] : ['quenchers'], read: 'quenchers', n: 4 },
];

const run = (both: boolean): { state: GameState; log: string[] } => {
  const s = loadFixture('v10.json');
  const t = s.time;
  const log: string[] = [];
  const cmd = (c: Command): void => {
    const r = apply(s, c, t);
    if (!r.ok) throw new Error(`${c.type} refused: ${r.reason}`);
  };
  // The load path opens every Order the save is past (T10.6); nothing seats.
  catchUpNow(s, t);
  expect(s.orders.seats).toEqual([]);
  // An Order the save has not reached yet (the Quenchers need D5-08) is opened from the debug panel.
  for (const id of ORDER_IDS)
    if (!s.orders.opened[id]) cmd({ type: 'debug.ordersOpen', order: id });
  for (const id of ORDER_IDS) cmd({ type: 'debug.ordersSetLevel', order: id, level: 4 });
  for (const step of script(both)) {
    cmd({ type: 'debug.ordersClearCooldown' });
    cmd({ type: 'orders.setSeats', orders: step.seats });
    expect(nextChapter(s, step.read)?.n, `${step.read} ${step.n} is next`).toBe(step.n);
    cmd({ type: 'orders.readChapter', order: step.read });
    log.push(`${step.read}:${step.n}:${variantRead(s, step.read, step.n) ?? '-'}`);
  }
  return { state: s, log };
};

describe('a scripted run from the migrated fixture to every chapter read', () => {
  it('reads all sixteen chapters in order, A endings with both seated', () => {
    const { state, log } = run(true);
    for (const id of ORDER_IDS) expect(state.orders.chaptersRead[id]).toBe(4);
    expect(log).toHaveLength(16);
    expect(log.filter((l) => !l.endsWith(':-'))).toEqual(['moot:4:A', 'quenchers:4:A']);
    expect(ordersShelf(state)).toHaveLength(16);
    expect(playableChapters(state)).toEqual([]);
    expect(ordersBadge(state)).toBe(false);
    // Each reading kept the seats it had (D419), and each chapter plays its own text.
    expect(state.orders.readWith.moot[3]).toEqual(['moot', 'quenchers']);
    expect(readChapterText(state, 'moot', 4)).toEqual(chapterText('moot', 4, 'A'));
    expect(readChapterText(state, 'quenchers', 4)).toEqual(chapterText('quenchers', 4, 'A'));
  });

  it('reads the B endings when the other Order is not seated', () => {
    const { state, log } = run(false);
    expect(log.filter((l) => !l.endsWith(':-'))).toEqual(['moot:4:B', 'quenchers:4:B']);
    expect(readChapterText(state, 'moot', 4)).toEqual(chapterText('moot', 4, 'B'));
    expect(readChapterText(state, 'quenchers', 4)).toEqual(chapterText('quenchers', 4, 'B'));
    expect(readChapterText(state, 'moot', 4)).not.toEqual(chapterText('moot', 4, 'A'));
  });

  it('is repeatable: the same fixture and commands give the same state', () => {
    const a = run(true).state;
    const b = run(true).state;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(encodeSaveFile(makeEnvelope(a, a.time))).toBe(encodeSaveFile(makeEnvelope(b, b.time)));
  });

  it('round-trips through a save with every chapter read', () => {
    const { state } = run(true);
    const r = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(state, state.time))));
    if (!r.ok) throw new Error(r.error);
    expect(r.value.state.orders).toEqual(state.orders);
  });
});

describe('the played fixture (v10-played.json: the migrated owner save, played 72 h)', () => {
  it('loads and round-trips, is on the current schema, has the Orders open and none seated', () => {
    const s = loadFixture('v10-played.json');
    expect(Object.keys(s.orders.opened).sort()).toEqual([...ORDER_IDS].sort());
    expect(s.orders.seats).toEqual([]); // the Standard player never seats an Order
    expect(s.meta.schemaVersion).toBe(SCHEMA_VERSION);
    const r = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, s.time))));
    if (!r.ok) throw new Error(r.error);
    expect(r.value.state).toEqual(s);
  });

  it('can be played through every chapter too', () => {
    const s = loadFixture('v10-played.json');
    const t = s.time;
    for (const id of ORDER_IDS) apply(s, { type: 'debug.ordersSetLevel', order: id, level: 4 }, t);
    for (const step of script(true)) {
      apply(s, { type: 'debug.ordersClearCooldown' }, t);
      expect(apply(s, { type: 'orders.setSeats', orders: step.seats }, t).ok).toBe(true);
      expect(
        apply(s, { type: 'orders.readChapter', order: step.read }, t).ok,
        `${step.read}${step.n}`,
      ).toBe(true);
    }
    for (const id of ORDER_IDS) expect(s.orders.chaptersRead[id]).toBe(4);
  });
});
