// Plan TD.3 (lore §34.11, GDD §9.24, D560, D563, D570): the Descent's story cards, the three resident
// lines and the player-facing strings equal the docs word for word; the checks of lore §34.11 hold.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DESCENT_CARDS,
  DESCENT_CARD_IDS,
  descentResidentLines,
} from '../../src/content/story/descent';
import { DESCENT_STRINGS } from '../../src/content/descent-text';
import { checkText, sentNames } from './orders-checks';

const read = (p: string): string =>
  readFileSync(new URL(`../../docs/${p}`, import.meta.url), 'utf8');
const lore = read('lore-secrets.md');
const start = lore.indexOf('### 34.11 The Descent');
const sec = lore.slice(start);
const gdd = read('gdd.md');
const g0 = gdd.indexOf('### 9.24 The Descent');
// Ends at §9.25 (v1.5 added it after §9.24), so the Breach table is not read as Descent strings.
const g924 = gdd.slice(g0, gdd.indexOf('\n### 9.25', g0));

/** The paragraphs of one card as the lore file has them: block-quote lines, split on the blank `>` lines. */
const loreCard = (id: string): string[] => {
  const from = sec.indexOf(`**${id} ·`);
  const rest = sec.slice(sec.indexOf('\n', from));
  const lines: string[] = [];
  for (const l of rest.split('\n').slice(1)) {
    if (l.trim() === '') {
      if (lines.length) break; // the quote ended
      continue;
    }
    if (!l.startsWith('>')) break;
    lines.push(l.replace(/^>\s?/, ''));
  }
  return lines
    .join('\n')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
};

describe('story cards D-01 to D-07 equal lore §34.11 (check 1)', () => {
  it('there are seven, in order', () => {
    expect(DESCENT_CARD_IDS).toEqual(['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07']);
    expect(Object.keys(DESCENT_CARDS)).toEqual([...DESCENT_CARD_IDS]);
  });

  it.each(DESCENT_CARD_IDS)('%s equals the lore file, paragraph for paragraph', (id) => {
    const expected = loreCard(id);
    expect(expected.length).toBeGreaterThan(0);
    expect(DESCENT_CARDS[id].paragraphs).toEqual(expected);
  });

  it('D-04 ends on the rime line', () => {
    expect(DESCENT_CARDS['D-04'].paragraphs.at(-1)).toBe('YOU BROUGHT THEM ALL.');
  });
});

describe('the three resident lines equal lore §34.11', () => {
  it('Pechko, Brana and Ilse, one each', () => {
    expect(descentResidentLines.map((l) => l.speaker)).toEqual(['pechko', 'brana', 'ilse']);
  });

  it.each([
    ['pechko', 'Pechko'],
    ['brana', 'Brana'],
    ['ilse', 'Ilse'],
  ] as const)('%s', (speaker, label) => {
    const m = new RegExp(`- \\*\\*${label}:\\*\\* "(.+)"`).exec(sec);
    expect(m, label).not.toBeNull();
    expect(descentResidentLines.find((l) => l.speaker === speaker)?.text).toBe(m?.[1]);
  });
});

const texts = [
  ...DESCENT_CARD_IDS.flatMap((id) => DESCENT_CARDS[id].paragraphs),
  ...descentResidentLines.map((l) => l.text),
];

describe('forbidden words, years, people, the Sent (checks 2 to 4)', () => {
  // Places and things the check reads as two capitalised words, allowed by lore §34.11 (4).
  const NOT_PEOPLE = /an unknown person or name: (Hearth Hall|YOU BROUGHT THEM ALL)$/;
  it.each(texts)('%s', (t) => {
    expect(checkText(t, 'chapter').filter((v) => !NOT_PEOPLE.test(v))).toEqual([]);
  });

  it('has no digit (so no year and no number of years)', () => {
    for (const t of texts) expect(t).not.toMatch(/\d/);
  });

  it('names none of the forty', () => {
    for (const t of texts)
      for (const n of sentNames())
        expect(new RegExp(`(?<![\\p{L}-])${n}(?![\\p{L}-])`, 'u').test(t), `${t}: ${n}`).toBe(
          false,
        );
  });

  it('a planted bad text is caught', () => {
    expect(checkText('The cinders glowed.', 'chapter').length).toBeGreaterThan(0);
    expect(checkText('Milena Horská came.', 'chapter').length).toBeGreaterThan(0);
  });
});

describe('the player-facing strings equal GDD §9.24 (S4)', () => {
  const table = g924.slice(g924.indexOf('| String | Where it shows |'));
  const cells = table
    .split('\n')
    .filter((l) => /^\s*\| `/.test(l))
    .flatMap((l) => {
      const first = l.split('|')[1]?.trim() ?? '';
      return first.slice(1, -1).split('` / `');
    });
  const tabled: Record<string, unknown> = { ...DESCENT_STRINGS };
  delete tabled.stageMonsters; // sheet-only: composed with the stage names
  const mine = Object.values(tabled).flatMap((v) =>
    typeof v === 'string' ? [v] : Object.values(v as Record<string, string>),
  );

  it('every table string is in the code, and nothing else is', () => {
    expect([...mine].sort()).toEqual([...cells].sort());
  });

  it('the sheet lines that are not in the table are in the section', () => {
    for (const line of [
      "Stage 1: The Crack — Unlit's Breath & The Forgotten",
      'Stage 2: The Sealed Stair — The Dross-Tide, Anvil-wight & Rimewrought',
      'Stage 3: Below the Seal — The Unlit',
    ])
      expect(g924).toContain(`\`${line}\``);
    expect(DESCENT_STRINGS.stageMonsters).toEqual([
      "Unlit's Breath & The Forgotten",
      'The Dross-Tide, Anvil-wight & Rimewrought',
      'The Unlit',
    ]);
  });

  it('the table has the 26 rows the GDD lists', () => {
    expect(table.split('\n').filter((l) => /^\s*\| `/.test(l))).toHaveLength(26);
  });
});
