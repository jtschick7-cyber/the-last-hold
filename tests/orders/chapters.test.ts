// Plan T10.8 (GDD §5.13.6, D414, D419; lore §33 Part B): which chapter plays, when, and how it is recorded.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { CHAPTERS } from '../../src/content/orders-chapters';
import { ORDER_IDS, type OrderId } from '../../src/content/orders';
import { apply } from '../../src/core/commands/apply';
import { loadEnvelope } from '../../src/core/save';
import { encodeSaveFile, makeEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import {
  chapterWaitsForSeat,
  nextChapter,
  playableChapters,
  shelfChapters,
  variantNow,
  variantRead,
} from '../../src/core/story/orders-chapters';
import { raiseLevels } from '../../src/core/systems/orders';
import { freshHunter } from '../../src/core/state/hunters-state';
import { T0, keepRich } from '../contracts/helpers';

const TH = balance.orders.levelThresholds.value;
const read = (s: GameState, order: OrderId) =>
  apply(s, { type: 'orders.readChapter', order }, s.time);
const seat = (s: GameState, orders: OrderId[]) =>
  apply(s, { type: 'orders.setSeats', orders }, s.time);

/** A game with every Order open, every condition met, and each Order at `level`. */
const game = (level: number, seated: OrderId[] = []): GameState => {
  const s = keepRich('chapters');
  for (const id of ORDER_IDS) {
    s.orders.opened[id] = { at: T0 };
    s.orders.start[id] = TH[id][level - 1] ?? 0;
  }
  s.hunters.vesna ??= freshHunter();
  s.hunters.ostap ??= freshHunter();
  s.story.ilseAt = T0;
  raiseLevels(s);
  s.orders.thirdSeat = false;
  seat(s, seated.slice(0, 2));
  return s;
};

describe('the sixteen chapters', () => {
  it('are four per Order, numbered 1 to 4, with unique ids and the D414 titles', () => {
    expect(CHAPTERS).toHaveLength(16);
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(16);
    for (const id of ORDER_IDS)
      expect(CHAPTERS.filter((c) => c.order === id).map((c) => c.n)).toEqual([1, 2, 3, 4]);
    expect(CHAPTERS.find((c) => c.id === 'OR-Q4')?.title).toBe('The mouth');
  });
});

describe('what is playable', () => {
  it('needs the Order open, seated, and its level at least the chapter number', () => {
    const s = game(1, ['moot']);
    expect(playableChapters(s).map((c) => c.id)).toEqual(['OR-M1']);
    const low = game(1, ['moot']);
    low.orders.start.moot = 0;
    low.orders.levelHigh.moot = 0;
    expect(playableChapters(low)).toEqual([]);
    const closed = game(1, ['moot']);
    delete closed.orders.opened.moot;
    expect(nextChapter(closed, 'moot')).toBeNull();
  });

  it('an unseated Order’s chapter waits, plays when it is seated, and blocks nobody', () => {
    const s = game(1, ['moot']);
    expect(playableChapters(s).map((c) => c.id)).toEqual(['OR-M1']);
    expect(chapterWaitsForSeat(s, 'bellWatchers')).toBe(true);
    expect(chapterWaitsForSeat(s, 'moot')).toBe(false);
    seat(s, ['bellWatchers', 'moot']);
    expect(playableChapters(s).map((c) => c.id)).toEqual(['OR-M1', 'OR-B1']); // list order
    seat(s, ['bellWatchers']);
    expect(playableChapters(s).map((c) => c.id)).toEqual(['OR-B1']);
    expect(read(s, 'moot').ok).toBe(false); // unseated: refused
    expect(s.orders.chaptersRead.moot).toBe(0); // and not lost
    seat(s, ['moot']);
    expect(read(s, 'moot').ok).toBe(true);
  });

  it('plays one chapter at a time: the next needs the one before and its own level', () => {
    const s = game(2, ['greyWives']);
    expect(read(s, 'greyWives').ok).toBe(true);
    expect(playableChapters(s).map((c) => c.id)).toEqual(['OR-G2']);
    expect(read(s, 'greyWives').ok).toBe(true);
    expect(playableChapters(s)).toEqual([]); // G3 needs level 3
    expect(read(s, 'greyWives').ok).toBe(false);
    expect(s.orders.chaptersRead.greyWives).toBe(2);
  });

  it('the extra conditions hold a chapter back without losing it', () => {
    const g1 = game(4, ['greyWives']);
    delete g1.hunters.vesna;
    expect(nextChapter(g1, 'greyWives')).toBeNull(); // OR-G1 needs Vesna
    g1.hunters.vesna = freshHunter();
    expect(nextChapter(g1, 'greyWives')?.id).toBe('OR-G1');
    const g2 = game(4, ['greyWives']);
    g2.orders.chaptersRead.greyWives = 1;
    g2.orders.readWith.greyWives = [[]];
    g2.story.ilseAt = null;
    expect(nextChapter(g2, 'greyWives')).toBeNull(); // OR-G2 needs Ilse
    g2.story.ilseAt = T0;
    expect(nextChapter(g2, 'greyWives')?.id).toBe('OR-G2');
    const g3 = game(4, ['greyWives']);
    g3.orders.chaptersRead.greyWives = 2;
    g3.orders.readWith.greyWives = [[], []];
    delete g3.hunters.ostap;
    expect(nextChapter(g3, 'greyWives')).toBeNull(); // OR-G3 needs Ostap and Vesna
    g3.hunters.ostap = freshHunter();
    expect(nextChapter(g3, 'greyWives')?.id).toBe('OR-G3');
  });

  it('is found without any command: raised standing, then a load', () => {
    const s = game(1, ['moot']);
    s.orders.start.moot = 0;
    s.orders.levelHigh.moot = 0; // a save whose level was below chapter 1
    expect(playableChapters(s)).toEqual([]);
    s.orders.start.moot = TH.moot[0] ?? 0; // tuning raised what the save is worth
    const r = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!r.ok) throw new Error(r.error);
    catchUpNow(r.value.state, r.value.state.time);
    expect(playableChapters(r.value.state).map((c) => c.id)).toEqual(['OR-M1']);
  });
});

describe('chapter 4 of the opposed pair', () => {
  const at3 = (seated: OrderId[], quenchersOpen = true): GameState => {
    const s = game(4, seated);
    s.orders.chaptersRead.moot = 3;
    s.orders.readWith.moot = [[], [], []];
    s.orders.chaptersRead.quenchers = 3;
    s.orders.readWith.quenchers = [[], [], []];
    if (!quenchersOpen) delete s.orders.opened.quenchers;
    return s;
  };

  it('the Moot’s waits until the Quenchers have opened', () => {
    expect(nextChapter(at3(['moot'], false), 'moot')).toBeNull();
    expect(nextChapter(at3(['moot'], true), 'moot')?.id).toBe('OR-M4');
  });

  it('plays variant A only if the other is seated then, else B; the same for the Quenchers', () => {
    const both = at3(['moot', 'quenchers']);
    expect(variantNow(both, 'moot')).toBe('A');
    expect(variantNow(both, 'quenchers')).toBe('A');
    const alone = at3(['moot']);
    expect(variantNow(alone, 'moot')).toBe('B');
    expect(read(both, 'moot').ok).toBe(true);
    expect(variantRead(both, 'moot', 4)).toBe('A');
    expect(read(alone, 'moot').ok).toBe(true);
    expect(variantRead(alone, 'moot', 4)).toBe('B');
    const q = at3(['quenchers']);
    expect(read(q, 'quenchers').ok).toBe(true);
    expect(variantRead(q, 'quenchers', 4)).toBe('B');
  });

  it('the other chapters have no variant', () => {
    const s = game(4, ['moot', 'greyWives']);
    expect(variantNow(s, 'moot')).toBeNull();
    expect(variantNow(s, 'greyWives')).toBeNull();
  });
});

describe('reading', () => {
  it('records the seats at the reading, in the fixed order, whatever order they were seated', () => {
    const s = game(1, ['moot', 'greyWives']);
    apply(s, { type: 'orders.setSeats', orders: ['greyWives', 'moot'] }, s.time);
    expect(read(s, 'greyWives').ok).toBe(true);
    expect(s.orders.readWith.greyWives).toEqual([['moot', 'greyWives']]);
    expect(s.orders.chaptersRead.greyWives).toBe(1);
  });

  it('plays once; the shelf shows it again and changes nothing', () => {
    const s = game(1, ['moot']);
    read(s, 'moot');
    const after = structuredClone(s);
    expect(read(s, 'moot').ok).toBe(false); // not again
    const shelf = shelfChapters(s, 'moot');
    expect(shelf.map((e) => e.chapter.id)).toEqual(['OR-M1']);
    expect(shelf[0]?.readWith).toEqual(['moot']);
    expect(s).toEqual(after);
  });

  it('changes nothing but the Order’s own chapters: no name, document, entry, Legendary or standing', () => {
    const s = game(1, ['moot']);
    const before = structuredClone(s);
    read(s, 'moot');
    const strip = (g: GameState) => {
      const c = structuredClone(g);
      c.orders.chaptersRead.moot = 0;
      c.orders.readWith.moot = [];
      return c;
    };
    expect(strip(s)).toEqual(before);
  });

  it('leaves a refused read untouched', () => {
    const s = game(1, ['moot']);
    const before = JSON.stringify(s);
    expect(read(s, 'quenchers').ok).toBe(false);
    expect(read(s, 'nope' as OrderId).ok).toBe(false);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('the migrated owner’s save', () => {
  it('once seated plays its chapters one at a time, and not more than level 1 allows', () => {
    const r = loadEnvelope(
      JSON.parse(readFileSync(new URL('../saves/fixtures/v9-owner.json', import.meta.url), 'utf8')),
    );
    if (!r.ok) throw new Error(r.error);
    const s = r.value.state;
    catchUpNow(s, s.time);
    const open = ORDER_IDS.filter((id) => s.orders.opened[id]);
    expect(open.length).toBeGreaterThan(0);
    expect(playableChapters(s)).toEqual([]); // nothing is seated by a load
    expect(apply(s, { type: 'orders.setSeats', orders: open.slice(0, 2) }, s.time).ok).toBe(true);
    let played = 0;
    for (const id of open.slice(0, 2)) {
      expect(s.orders.levelHigh[id]).toBeLessThanOrEqual(balance.orders.backfillCapLevel.value);
      const first = nextChapter(s, id);
      if (first) {
        expect(first.n).toBe(1);
        expect(read(s, id).ok).toBe(true);
        played += 1;
        expect(nextChapter(s, id)).toBeNull(); // chapter 2 needs level 2
      }
    }
    expect(played).toBeGreaterThan(0); // the test is not vacuous
  });
});
