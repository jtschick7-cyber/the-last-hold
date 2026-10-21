// Plan T11.14 (lore §34.10): the Remembering's texts equal the lore file and pass the automated checks
// (forbidden words, relative years, the Sent's names, the allowed people). Checks 7 and 8 live with
// their features: tests/remembering/ending-orders.test.ts and ending-effects.test.ts. Each check is
// proved by a planted bad text that it catches.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roll } from '../../src/content/story/roll';
import {
  afterEndingLines,
  nearSceneClosed,
  nearSceneOpen,
  rememberScene,
  rememberingCard,
  rememberingReadyLine,
  rememberingShelfEntries,
  rollMarkText,
  unlitLine,
  vigilScene,
} from '../../src/content/text/remembering';
import {
  endingCount,
  endingFortieth,
  endingHearthKeeps,
  endingWarm,
  endingWarmNote,
} from '../../src/content/text/remembering-ending';
import { endingOrderTexts } from '../../src/content/text/remembering-orders';
import { checkText, sentNames } from './orders-checks';

const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');
const sec = lore.slice(lore.indexOf('## 34. The Remembering'), lore.indexOf('### 34.10'));

/** A name as a whole word ("Lis" is not in "Lisová"). */
const hasName = (text: string, name: string): boolean =>
  new RegExp(`(?<![\\p{L}-])${name}(?![\\p{L}-])`, 'u').test(text);

/** Phrases that are not people (the check reads two capitalised words in a row as a name). */
const NOT_PEOPLE =
  /an unknown person or name: (Hearth Hall|Roll of Wardens|Keep the Vigil|Remember Them)/;
/** Sigrun is on lore §34's list of allowed people, but not on the Orders' list. */
const SIGRUN = 'an unknown person: Sigrun';

const violations = (text: string, kind: 'chapter' | 'opening' = 'chapter'): string[] =>
  checkText(text, kind).filter((v) => !NOT_PEOPLE.test(v) && v !== SIGRUN);

// Every text of v0.11 outside the reading, by id. The reading (the 40 lines and the Unlit's heading)
// is the one place for the names and the year numbers (check 4).
const texts: Record<string, string[]> = {
  'R-01': [nearSceneClosed.title, ...nearSceneClosed.paragraphs],
  'R-02': [nearSceneOpen.title, ...nearSceneOpen.paragraphs],
  ready: [rememberingReadyLine],
  card: [
    rememberingCard.notOpen.near,
    rememberingCard.open.line,
    rememberingCard.open.remember.text,
    rememberingCard.open.vigil.text,
    rememberingCard.afterVigil.line,
    rememberingCard.afterRemember.line,
  ],
  'R-03': [...rememberScene.paragraphs],
  'R-04': [...endingCount.paragraphs],
  'R-04b': [...endingFortieth.paragraphs],
  orders: Object.values(endingOrderTexts).flatMap((c) => [...c.paragraphs]),
  'R-09': [...endingHearthKeeps.paragraphs],
  'R-10': [...vigilScene.paragraphs],
  'R-11': [...endingWarm.paragraphs.slice(1), endingWarmNote],
  unlit: [unlitLine.text],
  residents: afterEndingLines.map((l) => l.text),
  shelf: [rememberingShelfEntries.reading.blurb, rememberingShelfEntries.later.blurb, rollMarkText],
};
const all = Object.entries(texts).flatMap(([id, ts]) => ts.map((t) => ({ id, t })));

describe('every text equals lore §34 (check 1)', () => {
  it.each(all)('$id: "$t"', ({ t }) => {
    // The lore file marks emphasis with asterisks and quotes lines in blocks; the text itself is a substring.
    expect(sec.includes(t), t).toBe(true);
  });
});

describe('forbidden words, relative years, people (checks 2, 3, 5)', () => {
  it.each(all)('$id: "$t"', ({ t }) => {
    expect(violations(t)).toEqual([]);
  });

  it('has no year number or count of years outside the reading', () => {
    for (const { t } of all) expect(t, t).not.toMatch(/\d/);
  });
});

describe('the Sent’s names appear only in the reading and the Names view (check 4)', () => {
  it('are in none of the v0.11 texts', () => {
    for (const { t } of all)
      for (const n of sentNames()) expect(hasName(t, n), `${t}: ${n}`).toBe(false);
  });

  it('are in none of the v0.11 files outside the reading’s table', () => {
    const files = [
      ...readdirSync(new URL('../../src/ui/remembering/', import.meta.url)).map(
        (f) => `src/ui/remembering/${f}`,
      ),
      ...readdirSync(new URL('../../src/content/text/', import.meta.url))
        .filter((f) => f.startsWith('remembering'))
        .map((f) => `src/content/text/${f}`),
      'src/content/remembering.ts',
      'src/core/story/ending-orders.ts',
      'src/core/story/ending-sequence.ts',
      'src/core/story/remembering.ts',
      'src/core/story/remembering-view.ts',
    ];
    for (const f of files) {
      const src = readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
      for (const n of sentNames()) expect(hasName(src, n), `${f}: ${n}`).toBe(false);
    }
  });

  it('the roll the reading uses holds exactly the forty', () => {
    expect(roll).toHaveLength(40);
  });
});

describe('R-01, R-02 and the ready line (check 6)', () => {
  const near = [...(texts['R-01'] ?? []), ...(texts['R-02'] ?? []), ...(texts.ready ?? [])];
  it.each(near)('say, ask for and begin none of the names: "%s"', (t) => {
    expect(violations(t, 'opening')).toEqual([]);
  });
});

describe('the checks catch planted bad texts', () => {
  it.each([
    ['a forbidden word', 'The cinders glowed.'],
    ['a relative year', 'It was three years ago.'],
    ['a name from the roll', 'Milena Horská was first.'],
    ['a Sent phrase', 'Say the names now.'],
    ['an unknown person', 'Pavla Novotná came in.'],
    ['hollow alone', 'The hollow was dark.'],
  ])('%s', (_what, text) => {
    expect(violations(text).length).toBeGreaterThan(0);
  });

  it('an opening word', () => {
    expect(violations('The Deep is near.', 'opening').length).toBeGreaterThan(0);
  });

  it('a year number', () => {
    expect(/\d/.test('Onward, year 200 of the order.')).toBe(true);
  });
});
