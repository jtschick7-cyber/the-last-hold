// GDD §9.25: the strings of the Lanes strip, the text list and the help lines equal the table word for
// word, and the forms of {w} are the ones the table lists. TB.9 adds the check of the whole table.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BREACH_TEXT, wavesText } from '../../src/content/breach-text';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const start = gdd.indexOf('### 9.25 The Breach');
const section = gdd.slice(start, gdd.indexOf('\n## 10.', start));
const table = section.slice(section.indexOf('| String | Where it shows |'));

describe('the strip and list strings match the GDD §9.25 table word for word', () => {
  it('headings, boxes, switch, hint, help and empty state', () => {
    const t = BREACH_TEXT;
    for (const s of [
      t.lanes,
      t.coverBox('{p}'),
      t.hint,
      t.help,
      t.empty,
      t.listLine('{n}', '{p}', '{r}', '{w}'),
    ])
      expect(table, s).toContain(`\`${s}\``);
    expect(table).toContain(`\`${t.strip}\` / \`${t.list}\``);
  });

  it('the forms {w} takes', () => {
    expect(wavesText([], 12)).toBe('none in the first 12');
    expect(wavesText([2], 12)).toBe('2');
    expect(wavesText([2, 7], 12)).toBe('2 and 7');
    expect(wavesText([2, 7, 11], 12)).toBe('2, 7 and 11');
    expect(wavesText([1, 2, 3, 4], 12)).toBe('1, 2, 3 and 4');
    expect(table).toContain('`{a}` / `{a} and {b}` / `{a}, {b} and {c}`');
    expect(table).toContain('`none in the first {k}`');
  });

  it('the example line of the GDD is what the builder gives', () => {
    expect(BREACH_TEXT.listLine(3, 75, 50, wavesText([2, 7], 12))).toBe(
      'Lane 3: cover 75%, tower reach 50%, waves 2 and 7',
    );
    expect(section).toContain('*Lane 3: cover 75%, tower reach 50%, waves 2 and 7*');
  });
});
