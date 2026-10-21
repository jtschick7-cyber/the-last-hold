// Plan T11.8 (GDD §5.15.4, D419, D466 (3), lore §34.6): the Orders' cards of the ending are worked out
// from what was read (`chaptersRead`, `readWith`) and from whether the Quenchers opened; never from
// current seats or levels.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { OrderId } from '../../src/content/orders';
import { roll } from '../../src/content/story/roll';
import { endingOrderTexts } from '../../src/content/text/remembering-orders';
import { loadEnvelope } from '../../src/core/save';
import type { GameState } from '../../src/core/state/game-state';
import { endingOrderCards } from '../../src/core/story/ending-orders';

const fresh = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  s.orders.opened = {};
  s.orders.seats = [];
  for (const id of ['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const) {
    s.orders.chaptersRead[id] = 0;
    s.orders.readWith[id] = [];
  }
  return s;
};

/** Marks chapters 1..4 of an Order as read; chapter 4 was read with `at4` seated. */
const readAll = (s: GameState, id: OrderId, at4: OrderId[] = []): void => {
  s.orders.opened[id] = { at: 0 };
  s.orders.chaptersRead[id] = 4;
  s.orders.readWith[id] = [[], [], [], at4];
};

const ids = (s: GameState): string[] => endingOrderCards(s).map((c) => `${c.id}:${c.title}`);

describe('the Orders’ cards of the ending', () => {
  it('none read, no Order opened: no card at all', () => {
    expect(endingOrderCards(fresh())).toEqual([]);
  });

  it('none read, the Quenchers opened: only Věra’s fallback', () => {
    const s = fresh();
    s.orders.opened.quenchers = { at: 0 };
    expect(endingOrderCards(s)).toEqual([endingOrderTexts.quenchersFallback]);
  });

  it('other Orders opened but unread are silent', () => {
    const s = fresh();
    for (const id of ['moot', 'greyWives', 'bellWatchers'] as const)
      s.orders.opened[id] = { at: 0 };
    expect(endingOrderCards(s)).toEqual([]);
  });

  it('only one read: just its card', () => {
    const s = fresh();
    readAll(s, 'greyWives');
    expect(endingOrderCards(s)).toEqual([endingOrderTexts.greyWives]);
  });

  it('an unfinished Order (three chapters) is silent', () => {
    const s = fresh();
    readAll(s, 'bellWatchers');
    s.orders.chaptersRead.bellWatchers = 3;
    s.orders.readWith.bellWatchers = [[], [], []];
    expect(endingOrderCards(s)).toEqual([]);
  });

  it('all read, Moot A and Quenchers A: the fixed order', () => {
    const s = fresh();
    readAll(s, 'moot', ['quenchers']);
    readAll(s, 'greyWives');
    readAll(s, 'bellWatchers');
    readAll(s, 'quenchers', ['moot']);
    expect(endingOrderCards(s)).toEqual([
      endingOrderTexts.mootA,
      endingOrderTexts.greyWives,
      endingOrderTexts.bellWatchers,
      endingOrderTexts.quenchersA,
    ]);
    expect(ids(s)).toEqual([
      "R-05:Thanes' Moot",
      'R-06:Grey Wives',
      'R-07:Bell-Watchers',
      'R-08:The Quenchers',
    ]);
  });

  it('all read, Moot B and Quenchers B', () => {
    const s = fresh();
    for (const id of ['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const) readAll(s, id);
    expect(endingOrderCards(s)).toEqual([
      endingOrderTexts.mootB,
      endingOrderTexts.greyWives,
      endingOrderTexts.bellWatchers,
      endingOrderTexts.quenchersB,
    ]);
  });

  it('Moot A with Quenchers B, and Moot B with Quenchers A, are read separately', () => {
    const s = fresh();
    readAll(s, 'moot', ['quenchers', 'greyWives']);
    readAll(s, 'quenchers', []);
    expect(endingOrderCards(s)).toEqual([endingOrderTexts.mootA, endingOrderTexts.quenchersB]);
    readAll(s, 'moot', []);
    readAll(s, 'quenchers', ['moot']);
    expect(endingOrderCards(s)).toEqual([endingOrderTexts.mootB, endingOrderTexts.quenchersA]);
  });

  it('changing current seats or levels changes nothing', () => {
    const s = fresh();
    readAll(s, 'moot', ['quenchers']);
    readAll(s, 'quenchers', []);
    const before = endingOrderCards(s);
    s.orders.seats = ['moot', 'quenchers'];
    s.orders.levelHigh = { moot: 0, greyWives: 4, bellWatchers: 4, quenchers: 0 };
    s.orders.counts.moot = Object.fromEntries(
      Object.keys(s.orders.counts.moot).map((k) => [k, 999]),
    );
    expect(endingOrderCards(s)).toEqual(before);
    s.orders.seats = [];
    expect(endingOrderCards(s)).toEqual(before);
  });
});

describe('the texts', () => {
  const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');
  const sec = lore.slice(
    lore.indexOf('### 34.6'),
    lore.indexOf('**R-09 · The hearth keeps itself**'),
  );
  const headers = {
    mootA: "**R-05 · The Thanes' Moot** — chapter 4 read with the Quenchers seated (variant A):",
    mootB: "**R-05 · The Thanes' Moot** — chapter 4 read without the Quenchers seated (variant B):",
    greyWives: '**R-06 · The Grey Wives** *(chapter 4 read; no variants)*',
    bellWatchers: '**R-07 · The Bell-Watchers** *(chapter 4 read; no variants)*',
    quenchersA: '**R-08 · The Quenchers** — chapter 4 read with the Moot seated (variant A):',
    quenchersB: '**R-08 · The Quenchers** — chapter 4 read without the Moot seated (variant B):',
    quenchersFallback: "**R-08 · The Quenchers** — chapter 4 never read *(Věra's fallback)*",
  } as const;

  it.each(Object.entries(headers))('%s equals lore §34.6 word for word', (key, header) => {
    const rest = sec.slice(sec.indexOf(header) + header.length).split('\n');
    const paras: string[] = [];
    let started = false;
    for (const l of rest) {
      if (l.startsWith('>')) {
        started = true;
        const t = l.slice(1).trim();
        if (t) paras.push(t);
      } else if (started) break;
    }
    expect(endingOrderTexts[key as keyof typeof endingOrderTexts].paragraphs).toEqual(paras);
  });

  it('say none of the 40 names', () => {
    const text = Object.values(endingOrderTexts)
      .flatMap((c) => c.paragraphs)
      .join('\n');
    for (const r of roll) expect(text).not.toContain(r.name);
    expect(text).not.toMatch(/say the names|speak the names|read the names|their names|the forty/i);
  });
});
