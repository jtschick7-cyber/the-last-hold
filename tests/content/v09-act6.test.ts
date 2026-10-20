// Plan T9.11 (lore-secrets §31, D364, D386): Act VI's ten documents are OUT-3's words and nothing
// else, and the checks the writer ran are re-run here.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allDocuments } from '../../src/content/story/acts';
import { act6Documents } from '../../src/content/story/act6';
import { roll } from '../../src/content/story/roll';

const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');
const flat = (s: string): string => s.replace(/\s+/g, ' ').replace(/\*/g, '').trim();

/** §31's text of one document: from its heading to the next rule. */
const section = (id: string): string => {
  const from = lore.indexOf(`**${id} · `);
  if (from < 0) throw new Error(`No ${id} in lore §31.`);
  return lore.slice(from).split('\n---\n')[0] ?? '';
};
const quotedLines = (text: string): string[] =>
  text
    .split('\n')
    .filter((l) => l.startsWith('>'))
    .map((l) => flat(l.replace(/^> ?/, '')))
    .filter((l) => l !== '');

const texts = (d: (typeof act6Documents)[number]): string[] => [
  ...d.body,
  ...(d.signature ? [d.signature] : []),
  ...(d.ilseNote ? [d.ilseNote] : []),
];

describe('Act VI’s texts (T9.11)', () => {
  it('has the ten documents, in order, all in Act VI', () => {
    expect(act6Documents.map((d) => d.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `D6-${String(i + 1).padStart(2, '0')}`),
    );
    for (const d of act6Documents) expect(d.act).toBe(6);
  });

  it('matches §31 exactly: every quoted line, in order, nothing added', () => {
    for (const d of act6Documents) {
      const expected = quotedLines(section(d.id));
      const got = [...d.body, ...(d.signature ? [d.signature] : [])].map(flat);
      expect(got, d.id).toEqual(expected);
      const note = /\*Ilse's note:\* \*"(.*)"\*/.exec(section(d.id))?.[1];
      expect(d.ilseNote === undefined ? undefined : flat(d.ilseNote), d.id).toBe(
        note === undefined ? undefined : flat(note),
      );
    }
  });

  it('carries exactly the names #1 to #3, once each, on the Keep, Citadel and Bastion documents', () => {
    expect(act6Documents.flatMap((d) => d.names)).toEqual([1, 2, 3]);
    expect(act6Documents.filter((d) => d.names.length > 0).map((d) => d.id)).toEqual([
      'D6-03',
      'D6-04',
      'D6-05',
    ]);
    expect(act6Documents.map((d) => d.names.length)).toEqual([0, 0, 1, 1, 1, 0, 0, 0, 0, 0]);
    // Every other roll name keeps its own source.
    for (const r of roll.filter((x) => x.n <= 3))
      expect(r.source).toMatchObject({ kind: 'document' });
    expect(allDocuments.filter((d) => d.act === 6)).toHaveLength(10);
  });

  it('never says, asks for or begins the names (D386)', () => {
    const names = roll.filter((r) => r.n <= 3).map((r) => r.name);
    for (const d of act6Documents)
      for (const t of texts(d)) {
        // The roll line of D6-03 to D6-05 is the only place a name appears.
        const isRollLine = /^\d{3} · /.test(t);
        for (const name of names)
          for (const part of [name, ...name.split(' ')])
            if (!isRollLine) expect(t, `${d.id}: ${part}`).not.toContain(part);
        expect(t, d.id).not.toMatch(
          /\b(say|speak|read|call|whisper|recite)\b[^.]{0,30}\bnames?\b/i,
        );
      }
  });

  it('avoids the avoid-list words and relative counts of years', () => {
    const avoid =
      /\b(ash|ashes|cinders?|kindle[sd]?|tithes?|bonfire|thrones?|souls?|fed|feeding)\b/i;
    for (const d of act6Documents)
      for (const t of texts(d)) {
        expect(t, d.id).not.toMatch(avoid);
        expect(t.replace(/Kozly Hollow/g, ''), d.id).not.toMatch(/\bhollow\b/i);
        // "all those years" is not a count; "twenty years" and "years ago" would be.
        expect(t, d.id).not.toMatch(
          /\b(\d+|a|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred)\s+years?\b|\bago\b/i,
        );
      }
  });

  it('uses no ruin, family or Delve condition', () => {
    for (const d of act6Documents) {
      const c = d.condition;
      expect(c.kind, d.id).not.toBe('familyWon');
      expect(['actBegins', 'contractWon', 'rankReached', 'actStand', 'nextWarden']).toContain(
        c.kind,
      );
      if (c.kind === 'contractWon') expect(c.location, d.id).toBeUndefined();
    }
  });

  it('writes the Rime as Rime, and the closing scenes as scenes', () => {
    expect(act6Documents.map((d) => d.type)).toEqual([
      'scene',
      'rime',
      'rime',
      'rime',
      'rime',
      'rime',
      'scene',
      'scene',
      'scene',
      'scene',
    ]);
  });
});
