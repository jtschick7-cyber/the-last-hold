// Plan T11.11 (lore §34.7): eight resident lines, shown only once Remember Them is recorded.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roll } from '../../src/content/story/roll';
import { afterEndingLines } from '../../src/content/text/remembering';
import { residentLines } from '../../src/content/text/lines';
import { apply } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { afterEndingLine } from '../../src/core/story/remembering-view';

const ready = () => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  catchUpNow(s, s.time);
  for (const type of [
    'debug.rememberingFinishActVI',
    'remembering.seeNear',
    'debug.rememberingOpenGate',
  ] as const)
    apply(s, { type }, s.time);
  return s;
};

describe('the resident lines after Remember Them', () => {
  const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');
  const sec = lore.slice(
    lore.indexOf('**Resident lines after Remember Them**'),
    lore.indexOf('**The Roll of Wardens mark**'),
  );

  it('are the eight of lore §34.7, word for word', () => {
    const rows = [...sec.matchAll(/^- (Pechko|Brana|Ilse): \*"(.*)"\*$/gm)].map((m) => ({
      speaker: m[1]?.toLowerCase(),
      text: m[2],
    }));
    expect(rows).toHaveLength(8);
    expect(afterEndingLines).toEqual(rows);
  });

  it('show none before Remember Them (nor after Keep the Vigil), and every one after', () => {
    const s = ready();
    for (let i = 0; i < 8; i++) expect(afterEndingLine(s, i / 8)).toBeNull();
    apply(s, { type: 'remembering.choose', ending: 'vigil' }, s.time);
    expect(afterEndingLine(s, 0.5)).toBeNull();
    apply(s, { type: 'remembering.choose', ending: 'remember' }, s.time);
    const shown = Array.from({ length: 8 }, (_, i) => afterEndingLine(s, i / 8)?.text);
    expect(new Set(shown).size).toBe(8);
    expect(afterEndingLine(s, 0.999999)?.text).toBe(afterEndingLines[7]?.text);
  });

  it('replace nothing: the triggered lines are as they were, and no name is spoken', () => {
    expect(Object.keys(residentLines)).toHaveLength(6);
    const all = afterEndingLines.map((l) => l.text).join('\n');
    for (const r of roll) expect(all).not.toContain(r.name);
  });
});
