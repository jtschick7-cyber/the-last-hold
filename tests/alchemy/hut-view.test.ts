// Plan T6.9a: what the Hut shows (GDD §9.9). The UI decides nothing; these are the facts it reads.
import { describe, expect, it } from 'vitest';
import { consumables } from '../../src/content/consumables';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { ingredientProperties } from '../../src/content/properties';
import { knownRecipes, revealProperty } from '../../src/core/alchemy/book';
import {
  bookCount,
  bookRows,
  experimentLines,
  hiddenCount,
  recipeShortfall,
  recipeWords,
  triedPairs,
} from '../../src/core/alchemy/hut-view';
import { advance } from '../../src/core/sim/advance';
import { keepRich, run } from '../contracts/helpers';

const name = (id: string): string => consumables[id as keyof typeof consumables].name;

describe('the Book (GDD §5.8.4)', () => {
  it('opens with 15 of 36 shown, and "?" where hidden', () => {
    const s = keepRich('book-view');
    expect(bookCount(s)).toEqual({ found: 15, total: 36 });
    const rows = bookRows(s);
    expect(rows).toHaveLength(INGREDIENT_IDS.length);
    // Yarrow's first two are proved by v0.3 recipes, the third is hidden.
    expect(rows[0]?.slots).toEqual(['drowned-bane-oil', 'mending-draught', null]);
    expect(hiddenCount(s, 'yarrow')).toBe(1);
  });

  it('shows a property once revealed, and counts it', () => {
    const s = keepRich('book-reveal');
    expect(revealProperty(s, 'yarrow', 2)).toBe(true);
    expect(bookRows(s)[0]?.slots[2]).toBe(ingredientProperties.yarrow[2].brew);
    expect(bookCount(s).found).toBe(16);
  });

  it('lists tried pairs in ingredient order', () => {
    const s = keepRich('book-pairs');
    s.book.tried.push('yarrow+juniper', 'juniper+pitch');
    expect(triedPairs(s)).toEqual([
      ['yarrow', 'juniper'],
      ['juniper', 'pitch'],
    ]);
  });
});

describe('recipes in words and what they lack', () => {
  it('words list ingredients then resources', () => {
    const s = keepRich('words');
    const fire = knownRecipes(s, 'fire-pot')[0];
    if (!fire) throw new Error('no recipe');
    expect(recipeWords(fire)).toBe('1 pitch · 1 wood');
  });

  it('says what is missing, or nothing when it can be paid', () => {
    const s = keepRich('short');
    const fire = knownRecipes(s, 'fire-pot')[0];
    if (!fire) throw new Error('no recipe');
    s.stores.pitch = 0;
    expect(recipeShortfall(s, fire)).toBe('needs pitch (have 0)');
    s.stores.pitch = 2;
    s.resources.wood = 0;
    expect(recipeShortfall(s, fire)).toBe('needs wood');
    s.resources.wood = 5;
    expect(recipeShortfall(s, fire)).toBeNull();
  });
});

describe('experiment lines (the Hut, the away sheet)', () => {
  it('say what a finished experiment showed and what it made makeable', () => {
    const s = keepRich('lines');
    s.buildings['alchemists-hut'] = 1;
    s.stores.honeycomb = 5;
    s.stores['hares-foot'] = 5;
    // Honeycomb and hare's foot share Owl-Eye Drops (hidden on both): a discovery needs 2 carriers.
    expect(run(s, { type: 'experiment.queue', a: 'honeycomb', b: 'hares-foot' }).ok).toBe(true);
    const log = advance(s, s.time + 3_600_000);
    const done = log.events.find((e) => e.type === 'experiment');
    if (!done || done.type !== 'experiment') throw new Error('no experiment finished');
    const lines = experimentLines(name, done);
    expect(lines[0]).toContain('Honeycomb and Hare');
    expect(lines[0]).toContain('Owl-Eye Drops');
    expect(lines.some((l) => l.startsWith('Discovered: '))).toBe(done.discovered.length > 0);
  });

  it('say "nothing new" when the pair taught nothing', () => {
    expect(
      experimentLines(name, { a: 'yarrow', b: 'mugwort', revealed: [], discovered: [] }),
    ).toEqual(['Yarrow and Mugwort showed nothing new.']);
  });
});
