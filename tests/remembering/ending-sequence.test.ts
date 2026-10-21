// Plan T11.9 (GDD §5.15.3, D461 (3), D466 (2), lore §34.6–34.7): the whole ending is one list, in a
// fixed order, the same every time it is played.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roll } from '../../src/content/story/roll';
import {
  endingCount,
  endingFortieth,
  endingHearthKeeps,
  endingWarm,
  endingWarmNote,
} from '../../src/content/text/remembering-ending';
import { loadEnvelope } from '../../src/core/save';
import type { GameState } from '../../src/core/state/game-state';
import { endingSequence } from '../../src/core/story/ending-sequence';
import { rememberingCardView } from '../../src/core/story/remembering-view';

const base = (): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};

const order = (s: GameState): string[] =>
  endingSequence(s).map((x) => (x.kind === 'reading' ? 'reading' : x.card.id));

const withOrders = (s: GameState): void => {
  for (const id of ['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const) {
    s.orders.opened[id] = { at: 0 };
    s.orders.chaptersRead[id] = 4;
    s.orders.readWith[id] = [[], [], [], []];
  }
};

describe('the ending sequence', () => {
  it('runs R-03, the reading, R-04, R-04b, the Order cards, R-09, R-11', () => {
    const s = base();
    const any = Object.values(s.hunters)[0];
    if (!any) throw new Error('fixture has no hunter');
    s.hunters.sigrun ??= structuredClone(any);
    withOrders(s);
    expect(order(s)).toEqual([
      'R-03',
      'reading',
      'R-04',
      'R-04b',
      'R-05',
      'R-06',
      'R-07',
      'R-08',
      'R-09',
      'R-11',
    ]);
  });

  it('leaves out R-04b when Sigrun is not on the roster', () => {
    const s = base();
    delete s.hunters.sigrun;
    expect(order(s)).toEqual(['R-03', 'reading', 'R-04', 'R-09', 'R-11']);
  });

  it('has the reading once, with the rest after it (Skip skips only the reading)', () => {
    const o = order(base());
    expect(o.filter((x) => x === 'reading')).toHaveLength(1);
    expect(o.indexOf('reading')).toBe(1);
    expect(o.length).toBeGreaterThan(3);
  });

  it('is the same every time it is built (an interrupted ending replays whole)', () => {
    const s = base();
    withOrders(s);
    expect(endingSequence(s)).toEqual(endingSequence(s));
  });

  it('is not changed by current seats', () => {
    const s = base();
    withOrders(s);
    const before = order(s);
    s.orders.seats = ['moot', 'quenchers'];
    expect(order(s)).toEqual(before);
  });

  it('shows the card in its After form once Remember Them is recorded', () => {
    const s = base();
    s.remembering.endings.push({ ending: 'remember', cycle: 1, at: 0 } as never);
    expect(rememberingCardView(s)?.form).toBe('afterRemember');
  });
});

describe('the texts', () => {
  const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');
  const sec = lore.slice(lore.indexOf('### 34.6'), lore.indexOf('### 34.8'));
  const paras = (header: string): string[] => {
    const out: string[] = [];
    let started = false;
    for (const l of sec.slice(sec.indexOf(header) + header.length).split('\n')) {
      if (l.startsWith('>')) {
        started = true;
        if (l.slice(1).trim()) out.push(l.slice(1).trim());
      } else if (started) break;
    }
    return out;
  };

  it('equal lore §34.6 and §34.7 word for word', () => {
    expect(endingCount.paragraphs).toEqual(paras('**R-04 · The count**'));
    expect(endingFortieth.paragraphs).toEqual(paras('**R-04b · The fortieth**'));
    expect(endingHearthKeeps.paragraphs).toEqual(paras('**R-09 · The hearth keeps itself**'));
    expect(endingWarm.paragraphs).toEqual(paras('**R-11 · It is warm where I am**'));
    expect(sec).toContain(`*"${endingWarmNote}"*`);
  });

  it('say none of the 40 names', () => {
    const all = [endingCount, endingFortieth, endingHearthKeeps, endingWarm]
      .flatMap((c) => c.paragraphs)
      .join('\n');
    for (const r of roll) expect(all).not.toContain(r.name);
  });
});
