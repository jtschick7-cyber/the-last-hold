// Plan T10.11 (lore §33 Part E, D411): where the Orders' story and knowledge perks show. Each shows only
// while its Order is seated and at or above the line's level; an unseated Order shows none.
import { describe, expect, it } from 'vitest';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import {
  bellWatchersGroups,
  greyWivesHints,
  mootHeadLines,
  quenchersAccounts,
} from '../../src/content/story/orders-perks';
import { VILLAGE_IDS } from '../../src/content/villages';
import { noticeFor } from '../../src/core/contracts/notice';
import { knownBrews } from '../../src/core/alchemy/book';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { accounts, namesView } from '../../src/core/story/archive';
import { bellSentence } from '../../src/core/story/orders-bell';
import {
  greyWivesBookLine,
  mootNoticeLine,
  mootPanelEntries,
} from '../../src/core/story/orders-views';
import { roll } from '../../src/content/story/roll';
import type { OrderId } from '../../src/content/orders';
import { T0 } from '../contracts/helpers';

const game = (level: number, seated: OrderId[]): GameState => {
  const s = createNewGame('perk-texts', T0);
  for (const id of ['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const) {
    s.orders.opened[id] = { at: T0 };
    s.orders.levelHigh[id] = level;
  }
  s.orders.seats = seated;
  return s;
};

describe('the Moot: heads’ lines in notices and on the Villages panel', () => {
  it('each head’s notice line shows from its level, for its village only', () => {
    for (const level of [0, 1, 2, 3, 4]) {
      const s = game(level, ['moot']);
      for (const l of mootHeadLines)
        expect(mootNoticeLine(s, l.village)).toBe(l.level <= level ? l.noticeLine : null);
    }
    expect(mootHeadLines.map((l) => l.village).sort()).toEqual([...VILLAGE_IDS].sort());
  });

  it('panel entries are cumulative by level: 0, 1, 2, 3 and 5 heads', () => {
    expect([0, 1, 2, 3, 4].map((n) => mootPanelEntries(game(n, ['moot'])).length)).toEqual([
      0, 1, 2, 3, 5,
    ]);
    expect(mootPanelEntries(game(1, ['moot']))[0]?.entry).toBe(mootHeadLines[0]?.panelEntry);
  });

  it('an unseated Moot shows none, and a notice carries the line last, after the trust line', () => {
    const off = game(4, []);
    for (const id of VILLAGE_IDS) expect(mootNoticeLine(off, id)).toBeNull();
    expect(mootPanelEntries(off)).toEqual([]);
    const c: ContractInstance = {
      id: 'x1',
      village: 'dubno-ford',
      monster: 'kikimora',
      tier: 1,
      location: 'field',
      arrivedAt: T0,
      revealed: 3,
    };
    const on = game(1, ['moot']);
    const withLine = noticeFor(c, 'seed', null, 'trusting', mootNoticeLine(on, 'dubno-ford'));
    const without = noticeFor(c, 'seed', null, 'trusting', null);
    expect(withLine.headLine).toBe('The ferry is running. Keep it so.');
    expect(withLine.text).toBe(without.text); // the notice text itself is unchanged
    expect(without.headLine).toBeUndefined();
  });
});

describe('the Grey Wives: the Book’s hint or the elder’s note', () => {
  const allKnown = (s: GameState): GameState => {
    for (const id of INGREDIENT_IDS) s.book.properties[id] = [0, 1, 2];
    return s;
  };

  it('shows the hint while the brew is unknown, the elder’s note once it is known', () => {
    const s = game(1, ['greyWives']);
    expect(knownBrews(s)).not.toContain('steadfast-draught');
    expect(greyWivesBookLine(s)).toEqual({ kind: 'hint', text: greyWivesHints[0]?.hint });
    allKnown(s);
    expect(greyWivesBookLine(s)).toEqual({ kind: 'note', text: greyWivesHints[0]?.elderNote });
  });

  it('at a higher level shows the highest level’s hint whose brew is still unknown', () => {
    const s = game(3, ['greyWives']);
    expect(greyWivesBookLine(s)?.kind).toBe('hint');
    const unknown = greyWivesHints.filter((h) => h.level <= 3 && !knownBrews(s).includes(h.brew));
    expect(greyWivesBookLine(s)?.text).toBe(unknown[unknown.length - 1]?.hint);
    expect(greyWivesBookLine(allKnown(game(3, ['greyWives'])))?.text).toBe(
      greyWivesHints[2]?.elderNote,
    );
  });

  it('shows nothing when unseated or at level 0', () => {
    expect(greyWivesBookLine(game(4, []))).toBeNull();
    expect(greyWivesBookLine(game(0, ['greyWives']))).toBeNull();
  });
});

describe('the Bell-Watchers: the Names view', () => {
  const rollOf = (n: number) => {
    const r = roll.find((x) => x.n === n);
    if (!r) throw new Error(`no roll number ${n}`);
    return r;
  };
  it('adds the generated sentence only to names still missing from the group, after their hint', () => {
    const s = game(4, ['bellWatchers']);
    const group = bellWatchersGroups[4];
    const view = namesView(s);
    const sentence = bellSentence(group.map(rollOf));
    for (const r of view.rows) {
      if (group.includes(r.n)) expect(r.extra).toBe(sentence);
      else expect(r.extra).toBeUndefined();
    }
    expect(view.remark).toBeNull();
    // Two found: the sentence is built from the two that remain.
    s.story.names = [4, 5].map((n) => ({ n, cycle: 1, at: T0 }));
    const part = namesView(s);
    expect(part.rows.find((r) => r.n === 6)?.extra).toBe(bellSentence([6, 7].map(rollOf)));
    expect(part.rows.find((r) => r.n === 4)?.extra).toBeUndefined(); // found: nothing
  });

  it('gives a remark instead when the whole group is found, and nothing when unseated', () => {
    const s = game(4, ['bellWatchers']);
    s.story.names = [...bellWatchersGroups[4]].map((n) => ({ n, cycle: 1, at: T0 }));
    const v = namesView(s);
    expect(v.rows.every((r) => r.extra === undefined)).toBe(true);
    expect(v.remark).toBe('Dana Lisová: "It is easier to ring when it hangs somewhere."');
    const off = game(4, []);
    expect(namesView(off).remark).toBeNull();
    expect(namesView(off).rows.every((r) => r.extra === undefined)).toBe(true);
  });
});

describe('the Quenchers: the Accounts', () => {
  const withHearth = (s: GameState): GameState => {
    s.story.documents.push({ id: 'D4-04', cycle: 1, at: T0, via: 'contract' });
    return s;
  };
  const hearth = (s: GameState) => accounts(s).find((c) => c.heading === 'What the hearth leaves');

  it('adds account n to "What the hearth leaves" while seated, once that Account exists', () => {
    for (const level of [1, 2, 3, 4] as const) {
      const card = hearth(withHearth(game(level, ['quenchers'])));
      const voice = card?.accounts[card.accounts.length - 1];
      expect(voice).toEqual({
        document: null,
        label: `(the Quenchers, level ${level})`,
        witness: 'Bohdan Kozel',
        excerpt: quenchersAccounts[level].excerpt,
      });
      expect(card?.accounts.filter((a) => a.label)).toHaveLength(1); // only account n, not 1 to n
    }
  });

  it('shows nothing before the Account exists in the save, and nothing when unseated', () => {
    expect(hearth(game(4, ['quenchers']))).toBeUndefined();
    expect(hearth(withHearth(game(4, [])))?.accounts.some((a) => a.label)).toBe(false);
    expect(hearth(withHearth(game(0, ['quenchers'])))?.accounts.some((a) => a.label)).toBe(false);
  });
});
