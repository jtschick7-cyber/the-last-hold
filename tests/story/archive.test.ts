// Plan T5.11a: the Archive's data (GDD §5.14.3, §9.14): the Library by act, type
// and newest first, the letters shelf, the Accounts, the Names view and the badge.
import { describe, expect, it } from 'vitest';
import { allDocuments } from '../../src/content/story/acts';
import { halinaRibbonNote } from '../../src/content/story/scenes';
import { apply } from '../../src/core/commands';
import { createNewGame } from '../../src/core/state/new-game';
import {
  accounts,
  archiveTab,
  foundLine,
  hunterLetters,
  laterNote,
  lettersShelf,
  library,
  namesView,
} from '../../src/core/story/archive';
import { findDocument } from '../../src/core/story/documents';
import { notePeak } from '../../src/core/story/letters';

const T0 = Date.UTC(2026, 9, 14, 8);
const doc = (id: string) => {
  const d = allDocuments.find((x) => x.id === id);
  if (!d) throw new Error(id);
  return d;
};

describe('the Archive', () => {
  it('opens with Ilse, and its badge counts what has not been opened', () => {
    const s = createNewGame('archive', T0);
    expect(archiveTab(s)).toEqual({ open: false, unread: 0 });
    findDocument(s, doc('D1-01'), 'contract');
    expect(archiveTab(s)).toEqual({ open: true, unread: 1 });
    expect(apply(s, { type: 'archive.read', key: 'doc:D1-01' }, T0).ok).toBe(true);
    expect(archiveTab(s).unread).toBe(0);
    expect(apply(s, { type: 'archive.read', key: 'doc:D1-01' }, T0).ok).toBe(false);
  });

  it('the Library groups by act, then type, newest first, with where each was found', () => {
    const s = createNewGame('archive', T0);
    findDocument(s, doc('D1-01'), 'contract');
    s.time = T0 + 1000;
    findDocument(s, doc('D1-04'), 'contract');
    findDocument(s, doc('D1-03'), 'contract');
    const lib = library(s);
    expect(lib.map((g) => g.act)).toEqual(['I. The Fall']);
    expect(lib[0]?.types.map((t) => [t.type, t.rows.map((r) => r.id)])).toEqual([
      ['Letter', ['D1-04', 'D1-01']],
      ['Ledger page', ['D1-03']],
    ]);
    expect(lib[0]?.types[0]?.rows[0]?.foundLine).toBe(
      'Found: the 2nd Mirograd contract won in Act I, cycle 1.',
    );
    expect(foundLine(doc('D1-09'), { id: 'D1-09', cycle: 2, at: 0, via: 'arrival' })).toBe(
      'Found: brought by Ilse when she came, cycle 2.',
    );
  });

  it('shows Ilse’s note under Halina’s letter once Jaro’s name is found', () => {
    const s = createNewGame('archive', T0);
    expect(laterNote(s, 'D1-04')).toBeNull();
    s.story.names.push({ n: 39, cycle: 1, at: T0 });
    expect(laterNote(s, 'D1-04')).toBe(halinaRibbonNote);
  });

  it('the letters shelf holds written letters reached; the hunter sheet shows locked rows', () => {
    const s = createNewGame('archive', T0);
    notePeak(s, 'ostap', 5);
    notePeak(s, 'halvar', 5); // reached, but its text waits for T5.12
    expect(lettersShelf(s).map((l) => [l.hunter, l.slot, l.level])).toEqual([['ostap', 0, 5]]);
    expect(hunterLetters(s, 'ostap').map((l) => [l.level, l.letter !== null])).toEqual([
      [5, true],
      [8, false],
    ]);
  });

  it('Accounts show only the accounts found, side by side, none marked true', () => {
    const s = createNewGame('archive', T0);
    expect(accounts(s)).toEqual([]);
    findDocument(s, doc('D1-02'), 'contract');
    const cards = accounts(s);
    expect(cards.map((c) => c.heading)).toEqual(['The Night of the Fall', 'The apprentices']);
    expect(cards[0]?.accounts).toEqual([
      {
        document: 'D1-02',
        witness: 'Věra, eldest of Kozly Hollow',
        excerpt:
          'Then she broke whatever it was under the hold, and after that night nobody came down the road for a fourth.',
      },
    ]);
  });

  it('Names: the count, every row in order, found names with village and year, missing with hints', () => {
    const s = createNewGame('archive', T0);
    findDocument(s, doc('D1-03'), 'contract');
    const v = namesView(s);
    expect(v.title).toBe('Names found: 4 of 40');
    expect(v.rows).toHaveLength(40);
    expect(v.rows[7]).toEqual({
      n: 8,
      found: true,
      text: 'Danica Mlynářová — Mirograd — onward, year 214 of the order.',
      hint: null,
    });
    expect(v.rows[38]).toEqual({
      n: 39,
      found: false,
      text: '— a name not yet found —',
      hint: 'A mother in Mirograd still writes to the hold.',
    });
  });
});
