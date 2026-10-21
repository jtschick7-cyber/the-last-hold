// Plan T10.14 (GDD §9.18, §5.13.5, §5.13.6, D414, D416, D419): what an Order sheet, a chapter and the
// Library's Orders shelf say. The screens only draw these.
import { describe, expect, it } from 'vitest';
import { sceneOf } from '../../src/content/story/orders-scenes-all';
import type { OrderId } from '../../src/content/orders';
import { apply } from '../../src/core/commands/apply';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import {
  chapterRows,
  chapterText,
  ordersShelf,
  readChapterText,
} from '../../src/core/story/orders-chapter-view';
import { orderSheetView } from '../../src/core/systems/orders-sheet-view';
import { perkAtLevel, perkLines } from '../../src/core/systems/orders-perks';
import { T0 } from '../contracts/helpers';

const game = (open: OrderId[], seats: OrderId[] = []): GameState => {
  const s = createNewGame('sheet', T0);
  for (const id of open) s.orders.opened[id] = { at: T0 };
  s.orders.seats = seats;
  return s;
};
const level = (s: GameState, id: OrderId, n: number): void => {
  apply(s, { type: 'debug.ordersSetLevel', order: id, level: n }, T0);
};

describe('the Order sheet', () => {
  it('is only for an open Order', () => {
    expect(orderSheetView(game([]), 'moot', T0)).toBeNull();
  });

  it('shows the level, standing, next threshold and the four levels with real numbers', () => {
    const s = game(['moot'], ['moot']);
    level(s, 'moot', 2);
    const v = orderSheetView(s, 'moot', T0);
    expect(v).toMatchObject({ levelWord: 'Friend', standing: 40, nextLine: 'Next level at 100' });
    expect(v?.levels.map((l) => l.numberLine)).toEqual([
      '−3% food for provisions',
      '−6% food for provisions',
      '−9% food for provisions',
      '−12% food for provisions',
    ]);
    expect(v?.levels.map((l) => [l.reached, l.current])).toEqual([
      [true, false],
      [true, true],
      [false, false],
      [false, false],
    ]);
    // The standing's breakdown is the one the rules use.
    expect(v?.standingBreakdown.value).toBe(40);
    expect(v?.standingBreakdown.children?.length).toBeGreaterThan(0);
  });

  it("says the Quenchers' trade, and 'Top level' at the top", () => {
    const s = game(['quenchers']);
    level(s, 'quenchers', 4);
    const v = orderSheetView(s, 'quenchers', T0);
    expect(v?.nextLine).toBe('Top level');
    for (const l of v?.levels ?? []) expect(l.numberLine).toContain('easier waves, smaller Embers');
    expect(orderSheetView(game(['moot']), 'moot', T0)?.levels[0]?.numberLine).not.toContain(
      'easier waves',
    );
  });

  it("each level's number is the perk's own breakdown line", () => {
    const s = game(['greyWives'], ['greyWives']);
    level(s, 'greyWives', 3);
    expect(perkLines(s, 'greyWives')).toEqual([perkAtLevel('greyWives', 3)]);
    const v = orderSheetView(s, 'greyWives', T0);
    expect(v?.levels[2]?.number).toEqual(perkAtLevel('greyWives', 3));
  });

  it('carries the seat action and the cooldown line', () => {
    const s = game(['moot', 'greyWives']);
    apply(s, { type: 'orders.seat', order: 'moot' }, T0);
    expect(orderSheetView(s, 'moot', T0)).toMatchObject({
      row: { action: 'unseat', seated: true },
      cooldownLine: 'Can change in 1d',
    });
    expect(orderSheetView(s, 'greyWives', T0)?.row.action).toBe('seat');
  });
});

describe('chapter rows', () => {
  it('say what a waiting chapter waits for', () => {
    const s = game(['moot', 'greyWives']);
    level(s, 'moot', 1);
    const rows = chapterRows(s, 'moot');
    expect(rows[0]).toMatchObject({
      status: 'waits',
      line: "A chapter waits for a seat. Seat Thanes' Moot to read it.",
    });
    expect(rows[1]).toMatchObject({ status: 'waits', line: 'Read chapter 1 first.' });
    s.orders.seats = ['moot'];
    expect(chapterRows(s, 'moot')[0]).toMatchObject({ status: 'playable', line: null });
    expect(chapterRows(game(['moot'], ['moot']), 'moot')[0]?.line).toBe('Waits for level 1.');
  });

  it("name the condition a chapter needs (Vesna for the Grey Wives' first)", () => {
    const s = game(['greyWives'], ['greyWives']);
    level(s, 'greyWives', 1);
    expect(chapterRows(s, 'greyWives')[0]?.line).toBe('Waits for Vesna to be on your roster.');
  });

  it('say which way chapter 4 of the opposed pair would read now', () => {
    const s = game(['moot', 'quenchers'], ['moot']);
    s.orders.chaptersRead.moot = 3;
    level(s, 'moot', 4);
    expect(chapterRows(s, 'moot')[3]?.line).toBe(
      'Read now, it reads the way it does without the Quenchers seated.',
    );
    s.orders.seats = ['moot', 'quenchers'];
    expect(chapterRows(s, 'moot')[3]).toMatchObject({
      status: 'playable',
      line: 'Read now, it reads the way it does with the Quenchers seated.',
    });
  });
});

describe('chapter text and the shelf', () => {
  it('plays the body, the variant and the ending, from lore §33', () => {
    const scene = sceneOf('OR-M4');
    const a = chapterText('moot', 4, 'A')?.paragraphs ?? [];
    const b = chapterText('moot', 4, 'B')?.paragraphs ?? [];
    expect(a).toEqual([
      ...(scene?.body ?? []),
      ...(scene?.variantA ?? []),
      ...(scene?.ending ?? []),
    ]);
    expect(b).toEqual([
      ...(scene?.body ?? []),
      ...(scene?.variantB ?? []),
      ...(scene?.ending ?? []),
    ]);
    expect(a).not.toEqual(b);
    expect(chapterText('moot', 1, null)?.paragraphs).toEqual(sceneOf('OR-M1')?.body);
  });

  it("keeps Ilse's note for the shelf", () => {
    expect(chapterText('greyWives', 2, null)?.libraryNote).toMatch(/Recipe received/);
    expect(chapterText('moot', 1, null)?.libraryNote).toBeNull();
  });

  it('is empty until the first chapter is read, then lists each with its seats', () => {
    const s = game(['moot', 'greyWives'], ['moot', 'greyWives']);
    expect(ordersShelf(s)).toEqual([]);
    level(s, 'moot', 2);
    apply(s, { type: 'orders.readChapter', order: 'moot' }, T0);
    apply(s, { type: 'orders.readChapter', order: 'moot' }, T0);
    s.orders.seats = ['moot'];
    expect(ordersShelf(s)).toEqual([
      {
        order: 'moot',
        n: 1,
        title: 'A table at the gate',
        readWithLine: "read with Thanes' Moot, Grey Wives",
      },
      {
        order: 'moot',
        n: 2,
        title: 'Salt and a ledger',
        readWithLine: "read with Thanes' Moot, Grey Wives",
      },
    ]);
  });

  it('re-reads a chapter the way it was read, and nothing unread', () => {
    const s = game(['moot', 'quenchers'], ['moot', 'quenchers']);
    s.orders.chaptersRead.moot = 3;
    s.orders.readWith.moot = [['moot'], ['moot'], ['moot']];
    level(s, 'moot', 4);
    apply(s, { type: 'orders.readChapter', order: 'moot' }, T0);
    s.orders.seats = ['moot']; // seated differently now; the reading keeps its seats (D419)
    expect(readChapterText(s, 'moot', 4)).toEqual(chapterText('moot', 4, 'A'));
    expect(readChapterText(s, 'greyWives', 1)).toBeNull();
  });
});
