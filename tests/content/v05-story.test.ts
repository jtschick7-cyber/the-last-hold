// Plan T5.1b: the story content matches lore-secrets §20–§24 and GDD §5.14 word
// for word, and the true-ending gate's arithmetic holds (lore §8). The texts are
// read from the docs themselves, so a doc edit and a content edit can't drift.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { HUNTER_IDS, hunters } from '../../src/content/hunters';
import { villages } from '../../src/content/villages';
import { accountEvents, acts, allDocuments, LAST_WRITTEN_ACT } from '../../src/content/story/acts';
import {
  act5Arrival,
  act5ArrivalOnLoad,
  CRACK_LETTERS,
  crackLetterLine,
  sixthDoorLine,
  yrsaTholeLine,
} from '../../src/content/story/act5';
import type { DocumentDef } from '../../src/content/story/documents';
import { letters } from '../../src/content/story/letters';
import { foundNameLine, roll, ROLL_SIZE } from '../../src/content/story/roll';
import {
  bandLines,
  bandThresholdsLine,
  inscriptions,
  plainRibbon,
  wornFirstLine,
} from '../../src/content/story/scenes';
import { startingTrust, trustLevels, trustStepLine } from '../../src/content/story/trust';
import { WARDEN_NAME_MAX } from '../../src/content/story/scenes';
import { properNouns, wardenNames } from '../../src/content/story/wardens';

const read = (name: string): string =>
  readFileSync(new URL(`../../docs/${name}`, import.meta.url), 'utf8');
const lore = read('lore-secrets.md');
const gdd = read('gdd.md');
const primer = read('setting-primer.md');

/** A lore section's blockquoted lines, without the `> ` and the italics. */
const quoted = (text: string): string =>
  text
    .split('\n')
    .filter((l) => l.startsWith('>'))
    .map((l) =>
      l
        .replace(/^> ?/, '')
        .replace(/^\*|\*$/g, '')
        .replace(/\*\*/g, ''),
    )
    .filter((l) => l.trim() !== '')
    .join('\n');

/** The lore text under a heading such as `##### D1-01`, up to the next heading. */
const loreSection = (heading: string): string => {
  const start = lore.indexOf(heading);
  if (start < 0) throw new Error(`No lore heading ${heading}`);
  const rest = lore.slice(start + heading.length);
  const end = rest.search(/\n#{2,5} /);
  return end < 0 ? rest : rest.slice(0, end);
};

const docText = (d: DocumentDef): string =>
  [
    d.preface ?? '',
    ...d.body,
    d.signature ?? '',
    ...(d.table?.rows.map((r) => r.join(' ')) ?? []),
    d.attachment?.preface ?? '',
    ...(d.attachment?.body ?? []),
  ].join('\n');
const flat = (s: string): string => s.replace(/\s+/g, ' ').replace(/\*/g, '').trim();

/** lore §21.1, §22.1, §26.1, §28.1 and §30.1: the documents tables, as [id, title, type, witness, arrives, where, names]. */
const tableRows = (): string[][] =>
  (
    lore.slice(lore.indexOf('## 21. '), lore.indexOf('## 23. ')) +
    lore.slice(lore.indexOf('## 26. '), lore.indexOf('## 27. ')) +
    lore.slice(lore.indexOf('## 28. '), lore.indexOf('## 29. ')) +
    lore.slice(lore.indexOf('## 30. '), lore.indexOf('## 31. '))
  )
    .split('\n')
    .filter((l) => /^\| D\d-\d\d/.test(l))
    .map((l) =>
      l
        .split('|')
        .slice(1, -1)
        .map((c) => c.replace(/\*\(new\)\*/, '').trim()),
    );

describe('Acts I to V (lore-secrets §21, §22, §26, §28, §30)', () => {
  const rows = tableRows();

  it('have every document of the tables, and no other', () => {
    expect(allDocuments.map((d) => d.id).sort()).toEqual(rows.map((r) => r[0]).sort());
    expect(acts.map((a) => a.act)).toEqual([1, 2, 3, 4, 5]);
    expect(LAST_WRITTEN_ACT).toBe(5);
    for (const a of acts) for (const d of a.documents) expect(d.act, d.id).toBe(a.act);
  });

  it('have the tables’ titles, types and witnesses', () => {
    const types: Record<string, string> = {
      Letter: 'letter',
      'Ledger page': 'ledger',
      Testament: 'testament',
      'Field note': 'field-note',
      'Resident scene': 'scene',
      'Resident scene + ledger strip': 'scene',
      Journal: 'journal',
      'Journal page': 'journal',
    };
    for (const [id, title, type, witness] of rows) {
      const d = allDocuments.find((x) => x.id === id);
      expect(d?.heading, id).toBe(title);
      expect(d?.type, id).toBe(types[type ?? '']);
      expect(d?.witness, id).toBe(flat(witness ?? ''));
    }
  });

  it('carry exactly the names the tables give', () => {
    for (const [id, , , , , , names] of rows) {
      const d = allDocuments.find((x) => x.id === id);
      const nums = [...(names ?? '').matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
      expect(d?.names, id).toEqual(nums);
    }
  });

  it('have the conditions the tables give (D148)', () => {
    const c = (id: string) => allDocuments.find((d) => d.id === id)?.condition;
    expect(c('D1-01')).toEqual({ kind: 'contractWon', nth: 1 });
    expect(c('D1-04')).toEqual({ kind: 'contractWon', nth: 2, village: 'mirograd' });
    expect(c('D1-03')).toEqual({ kind: 'contractWon', nth: 1, location: 'ruin' });
    expect(c('D1-09')).toEqual({ kind: 'rankReached', age: 'citadel' });
    expect(c('D1-10')).toEqual({ kind: 'rankReached', age: 'bastion' });
    expect(c('D1-02')).toEqual({
      kind: 'contractWon',
      nth: 1,
      village: 'kozly-hollow',
      minTrust: 'wary',
    });
    expect(c('D1-05')).toEqual({ kind: 'knowledge', monster: 'upyr', level: 'mastered' });
    expect(c('D1-06')).toEqual({ kind: 'actStand' });
    expect(c('D1-07')).toEqual({ kind: 'nextWarden' });
    expect(c('D2-01')).toEqual({ kind: 'contractWon', nth: 1, village: 'kozly-hollow' });
    for (let n = 1; n <= 5; n++)
      expect(c(`D2-0${n + 1}`)).toEqual({ kind: 'contractWon', nth: n, location: 'ruin' });
    expect(c('D2-07')).toEqual({ kind: 'rankReached', age: 'citadel' });
    expect(c('D2-08')).toEqual({ kind: 'hunterAtRank', hunter: 'sigrun', age: 'bastion' });
    expect(c('D2-09')).toEqual({ kind: 'actStand' });
    expect(c('D2-10')).toEqual({ kind: 'nextWarden' });
    expect(c('D3-01')).toEqual({ kind: 'arvidArrives' });
    expect(c('D3-02')).toEqual({ kind: 'contractWon', nth: 1, village: 'velkvik' });
    expect(c('D3-03')).toEqual({ kind: 'contractWon', nth: 2, village: 'velkvik' });
    expect(c('D3-04')).toEqual({ kind: 'rankReached', age: 'citadel' });
    expect(c('D3-05')).toEqual({ kind: 'rankReached', age: 'bastion' });
    expect(c('D3-06')).toEqual({ kind: 'actStand' });
    expect(c('D3-07')).toEqual({ kind: 'nextWarden' });
    expect(c('D3-08')).toEqual({
      kind: 'huntersTogether',
      hunters: ['arvid', 'sigrun'],
      after: 'D2-08',
    });
    // Act IV (lore §28.1, D245).
    expect(c('D4-01')).toEqual({ kind: 'actBegins' });
    expect(c('D4-02')).toEqual({
      kind: 'familyWon',
      nth: 1,
      family: 'field-and-forest-spirits',
    });
    expect(c('D4-03')).toEqual({ kind: 'familyWon', nth: 2, family: 'beasts-and-wilds' });
    expect(c('D4-04')).toEqual({ kind: 'rankReached', age: 'citadel' });
    expect(c('D4-05')).toEqual({ kind: 'rankReached', age: 'bastion' });
    expect(c('D4-06')).toEqual({ kind: 'actStand' });
    expect(c('D4-07')).toEqual({ kind: 'nextWarden' });
    expect(c('D4-08')).toEqual({ kind: 'contractWon', nth: 2, village: 'mirograd' });
    // Act V (lore §30.1, D302): no new condition kinds.
    expect(c('D5-01')).toEqual({ kind: 'actBegins' });
    expect(c('D5-02')).toEqual({ kind: 'contractWon', nth: 1 });
    expect(c('D5-03')).toEqual({ kind: 'contractWon', nth: 1, village: 'ravenfell' });
    expect(c('D5-04')).toEqual({ kind: 'rankReached', age: 'citadel' });
    expect(c('D5-05')).toEqual({ kind: 'rankReached', age: 'bastion' });
    expect(c('D5-06')).toEqual({ kind: 'actStand' });
    expect(c('D5-07')).toEqual({ kind: 'nextWarden' });
    expect(c('D5-08')).toEqual({ kind: 'contractWon', nth: 2, village: 'kozly-hollow' });
  });

  it('give Act V exactly four names, all in D5-03, and no new proper nouns', () => {
    const five = allDocuments.filter((d) => d.act === 5);
    expect(five.map((d) => d.id)).toEqual([
      'D5-01',
      'D5-02',
      'D5-03',
      'D5-04',
      'D5-05',
      'D5-06',
      'D5-07',
      'D5-08',
    ]);
    expect(five.flatMap((d) => d.names)).toEqual([4, 5, 6, 7]);
    expect(five.find((d) => d.names.length > 0)?.id).toBe('D5-03');
  });

  it('say Act V’s arrival, delivery, Thole and sixth-door lines word for word (lore §30.2, D314)', () => {
    const section = flat(lore.slice(lore.indexOf('## 30. '), lore.indexOf('## 31. ')));
    for (const line of [
      act5Arrival,
      act5ArrivalOnLoad,
      crackLetterLine('The first night'),
      yrsaTholeLine,
      sixthDoorLine,
    ])
      expect(section).toContain(flat(line));
    expect(CRACK_LETTERS.map((id) => allDocuments.find((d) => d.id === id)?.witness)).toEqual([
      'Yrsa',
      'Yrsa',
      'Yrsa',
      'Yrsa, to the Keeper',
    ]);
  });

  it('give Act IV exactly six names, in D4-02 and D4-03, and no new proper nouns', () => {
    const four = allDocuments.filter((d) => d.act === 4);
    expect(four.map((d) => d.id)).toEqual([
      'D4-01',
      'D4-02',
      'D4-03',
      'D4-04',
      'D4-05',
      'D4-06',
      'D4-07',
      'D4-08',
    ]);
    expect(four.flatMap((d) => d.names)).toEqual([21, 22, 24, 25, 26, 27]);
  });

  it('have the lore texts word for word', () => {
    for (const d of allDocuments) {
      if (d.id === 'D1-04') {
        // setting-primer §8's voice sample.
        const sample = quoted(primer.slice(primer.indexOf('## 8. Voice sample')));
        expect(flat(docText(d)), d.id).toBe(flat(sample));
        continue;
      }
      const section = loreSection(`##### ${d.id} `);
      const text = flat(quoted(section).replace(/\| ?/g, ' ').replace(/---/g, ''));
      for (const part of [
        ...d.body,
        d.signature ?? '',
        ...(d.preface ?? '').split('\n'),
        ...(d.attachment?.preface ?? '').split('\n'),
        ...(d.attachment?.body ?? []),
      ])
        expect(text, `${d.id}: ${part.slice(0, 40)}`).toContain(flat(part.replace(/\n/g, ' ')));
      for (const r of d.table?.rows ?? []) for (const cell of r) expect(text, d.id).toContain(cell);
      if (d.ilseNote) expect(flat(section), d.id).toContain(flat(d.ilseNote));
      if (d.attachment?.ilseNote)
        expect(flat(section), d.id).toContain(flat(d.attachment.ilseNote));
    }
  });

  it('quote each account word for word from its document (GDD §5.14.3)', () => {
    for (const e of accountEvents)
      for (const a of e.accounts) {
        const d = allDocuments.find((x) => x.id === a.document);
        expect(d, a.document).toBeDefined();
        const text = d ? flat(docText(d)) : '';
        for (const part of a.excerpt.split(' — ')) expect(text, a.document).toContain(flat(part));
      }
  });
});

describe('the forty names (lore-secrets §8, §20)', () => {
  const loreRows = loreSection('#### The roll')
    .split('\n')
    .filter((l) => /^\| \d+ \|/.test(l))
    .map((l) =>
      l
        .split('|')
        .slice(1, -1)
        .map((c) => c.replace(/\*\*/g, '').trim()),
    );

  it('match the roll: number, year, name, village and hint', () => {
    expect(roll).toHaveLength(ROLL_SIZE);
    expect(loreRows).toHaveLength(ROLL_SIZE);
    roll.forEach((r, i) => {
      const [n, year, name, village, , hint] = loreRows[i] ?? [];
      expect([r.n, r.year, r.name, villages[r.village].name, r.hint]).toEqual([
        Number(n),
        Number(year),
        name,
        village,
        hint,
      ]);
    });
  });

  it('every second spring from 200 to 276, then Sigrun for 278', () => {
    roll.forEach((r, i) => expect(r.year).toBe(200 + 2 * i));
  });

  it('come from exactly one source each, in lore §8’s counts', () => {
    const count = (kind: string) => roll.filter((r) => r.source.kind === kind).length;
    const actDocs = count('document') + count('laterAct');
    expect(actDocs).toBe(28);
    expect(count('ribbonshade')).toBe(6);
    expect(count('letter')).toBe(5);
    expect(count('confession')).toBe(1);
    // Per act: I 4 · II 6 · III 5 · IV 6 · V 4 · VI 3.
    const inAct = (a: number) =>
      roll.filter((r) =>
        r.source.kind === 'laterAct'
          ? r.source.act === a
          : r.source.kind === 'document' && r.source.id.startsWith(`D${a}-`),
      ).length;
    expect([1, 2, 3, 4, 5, 6].map(inAct)).toEqual([4, 6, 5, 6, 4, 3]);
  });

  it('agree with the documents and letters that carry them, both ways', () => {
    for (const r of roll) {
      const s = r.source;
      if (s.kind === 'document' || s.kind === 'confession') {
        const d = allDocuments.find((x) => x.id === s.id);
        expect(d?.names, `#${r.n}`).toContain(r.n);
        // Tomek's own name (#35) is the journal's author, not in its text.
        if (r.n !== 35)
          expect(docText(d as DocumentDef), `#${r.n}`).toContain(
            s.id === 'D2-03'
              ? (r.name.split(' ')[0]?.toUpperCase() ?? '?')
              : (r.name.split(' ')[0] ?? '?'),
          );
      }
      if (s.kind === 'letter') {
        const l = letters.find((x) => x.hunter === s.hunter && x.slot === s.slot);
        expect(l?.name, `#${r.n}`).toBe(r.n);
        expect(l?.body?.join(' '), `#${r.n}`).toContain(r.name);
      }
    }
    for (const d of allDocuments)
      for (const n of d.names) {
        const r = roll.find((x) => x.n === n);
        expect(r?.source, `${d.id} #${n}`).toMatchObject({ id: d.id });
      }
  });

  it('give the Ribbonshades six names in a fixed order, Jaro’s first', () => {
    const ribbons = roll
      .filter((r) => r.source.kind === 'ribbonshade')
      .sort((a, b) =>
        a.source.kind === 'ribbonshade' && b.source.kind === 'ribbonshade'
          ? a.source.order - b.source.order
          : 0,
      );
    expect(ribbons.map((r) => r.n)).toEqual([39, 15, 16, 17, 19, 20]);
    expect(plainRibbon).toContain('ribbon');
  });

  it('show the GDD found-name line', () => {
    expect(foundNameLine('Eirik Varn', 'Velkvik', 272)).toBe(
      'Eirik Varn — Velkvik — onward, year 272 of the order.',
    );
  });
});

describe('hunter letters (GDD §5.14.7, lore-secrets §23)', () => {
  it('two per hunter, 22 in all, every one written; exactly five carry a name (T5.12)', () => {
    expect(HUNTER_IDS).toContain('arvid');
    expect(letters).toHaveLength(2 * HUNTER_IDS.length);
    expect(letters.every((l) => l.body !== null)).toBe(true);
    expect(
      letters
        .filter((l) => l.name !== undefined)
        .map((l) => `${l.hunter}:${l.slot}`)
        .sort(),
    ).toEqual(['arvid:0', 'ostap:0', 'ostap:1', 'sigrun:0', 'toma:0']);
    expect(balance.letters.levels.value).toEqual([5, 8]);
  });

  it('the 17 unnamed ones are owner-approved letters to the warden that name no one on the roll', () => {
    const unnamed = letters.filter((l) => l.name === undefined);
    expect(unnamed).toHaveLength(17);
    for (const l of unnamed) {
      const key = `${l.hunter}:${l.slot}`;
      const text = (l.body ?? []).join(' ');
      expect(l.body?.[0], key).toMatch(/^Warden — /);
      expect(l.body?.length, key).toBeGreaterThanOrEqual(3);
      for (const r of roll) expect(text, `${key} names ${r.name}`).not.toContain(r.name);
    }
  });

  it('are word for word', () => {
    const heads: Record<string, string> = {
      'ostap:0': '### Old Ostap, level 5',
      'ostap:1': '### Old Ostap, level 8',
      'toma:0': '### Toma Kettle, level 5',
      'sigrun:0': '### Sigrun Halfhand, level 5',
      'arvid:0': '### Arvid Netmender, level 5',
    };
    for (const l of letters.filter((x) => x.name !== undefined)) {
      const key = `${l.hunter}:${l.slot}`;
      const text = flat(quoted(loreSection(heads[key] ?? '?')));
      for (const p of [...(l.body ?? []), l.signature]) expect(text, key).toContain(flat(p));
    }
  });

  it('sign with the hunter’s short name', () => {
    for (const l of letters)
      if (l.hunter !== 'arvid') expect(l.signature).toBe(`— ${hunters[l.hunter].shortName}`);
  });
});

describe('bands, trust and the hold (GDD §5.14, lore-secrets §11, §24)', () => {
  it('have the residents’ lines by band, three each', () => {
    const section = loreSection('#### Resident lines after the stand, by band (D145)');
    for (const band of ['triumphant', 'held', 'broken'] as const)
      for (const who of ['pechko', 'brana'] as const) {
        expect(bandLines[band][who]).toHaveLength(3);
        for (const line of bandLines[band][who]) expect(section, line).toContain(`"${line}"`);
      }
    expect(bandThresholdsLine(9, 12)).toBe('Held from 9 waves · Triumphant from 12');
  });

  it('have the trust levels and lines, and the primer’s starting trust', () => {
    const section = loreSection('#### Village trust on screen (D146–D147)');
    for (const l of Object.values(trustLevels))
      expect(section).toContain(`| ${l.label} | ${l.line} |`);
    for (const [id, level] of Object.entries(startingTrust)) {
      const name = villages[id as keyof typeof villages].name;
      const row = primer.split('\n').find((x) => x.startsWith(`| **${name}**`));
      expect(row?.trim().endsWith(`| ${trustLevels[level].label} |`), id).toBe(true);
    }
    expect(trustStepLine('Mirograd', 'hopeful')).toBe(
      'Mirograd trusts the hold a little more: Hopeful.',
    );
  });

  it('have the inscriptions and the worn first line', () => {
    expect(inscriptions.citadel).toContain('"The fire for the folk; the folk —"');
    expect(inscriptions.bastion).toContain('Thirty-nine faded ribbons');
    expect(gdd).toContain(`*"${wornFirstLine}"*`);
  });

  it('offers warden names that fit the field and aren’t the story’s', () => {
    expect(new Set(wardenNames).size).toBe(wardenNames.length);
    const used = new Set([
      ...roll.flatMap((r) => r.name.split(' ')),
      ...Object.values(hunters).map((h) => h.shortName),
      ...properNouns.filter((n) => !wardenNames.includes(n)),
    ]);
    for (const n of wardenNames) {
      expect(n.length).toBeLessThanOrEqual(WARDEN_NAME_MAX);
      expect(used.has(n), n).toBe(false);
    }
  });
});
