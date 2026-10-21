// Plan T10.9 (lore §33 Part F, D423): the Orders' texts equal the lore file word for word and pass the
// automated checks; each check is proved by a planted bad text that it catches. T10.10 adds the
// Bell-Watchers and the Quenchers (E3, E4) to the same file.
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/orders-chapters';
import { ingredientProperties } from '../../src/content/properties';
import { ingredients, INGREDIENT_IDS, type IngredientId } from '../../src/content/ingredients';
import type { OrderScene } from '../../src/content/story/orders-scenes';
import { orderScenes, sceneOf } from '../../src/content/story/orders-scenes-all';
import {
  bellWatchersGroups,
  bellWatchersRemarks,
  greyWivesHints,
  mootHeadLines,
  quenchersAccounts,
  quenchersLabel,
  QUENCHERS_ACCOUNT,
  QUENCHERS_WITNESS,
  type HintClaim,
} from '../../src/content/story/orders-perks';
import { roll } from '../../src/content/story/roll';
import { bellExtra, bellSentence } from '../../src/core/story/orders-bell';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import { villages } from '../../src/content/villages';
import { checkText, sentNames, type TextKind } from './orders-checks';
import { loreScene, plain, tableRows } from './orders-lore';

const scenes: readonly OrderScene[] = orderScenes;
const textsOf = (s: OrderScene): string[] => [
  ...s.body,
  ...(s.variantA ?? []),
  ...(s.variantB ?? []),
  ...(s.ending ?? []),
  ...(s.libraryNote ? [s.libraryNote] : []),
];
const headingOf = (s: OrderScene): string => `##### ${s.id} ·`;

describe('the scene texts equal lore §33, word for word', () => {
  it('has twenty scenes: the four openings and the sixteen chapters', () => {
    expect(scenes.map((s) => s.id)).toEqual([
      'OS-M',
      'OS-G',
      'OS-B',
      'OS-Q',
      ...['M', 'G', 'B', 'Q'].flatMap((o) => [1, 2, 3, 4].map((n) => `OR-${o}${n}`)),
    ]);
  });

  it.each(scenes.map((s) => [s.id, s] as const))('%s', (_id, s) => {
    const lore = loreScene(headingOf(s));
    expect(s.title).toBe(lore.title);
    expect(s.body).toEqual(lore.body);
    expect(s.variantA).toEqual(lore.variantA);
    expect(s.variantB).toEqual(lore.variantB);
    expect(s.ending).toEqual(lore.ending);
    expect(s.libraryNote).toEqual(lore.libraryNote);
  });

  it('the chapter titles in the rules file are the scenes’ titles', () => {
    for (const s of scenes.filter((x) => x.kind === 'chapter'))
      expect(CHAPTERS.find((c) => c.id === s.id)?.title).toBe(s.title);
  });

  it('only chapter 4 of the Moot and of the Quenchers has two endings', () => {
    expect(scenes.filter((s) => s.variantA).map((s) => s.id)).toEqual(['OR-M4', 'OR-Q4']);
    expect(scenes.filter((s) => s.variantA).every((s) => s.variantB && s.ending)).toBe(true);
  });
});

describe('E1: the heads’ lines equal lore §33', () => {
  const rows = tableRows('#### E1.');
  it('has one row per line, in order', () => {
    expect(mootHeadLines).toHaveLength(rows.length);
    mootHeadLines.forEach((line, i) => {
      const [level, head, notice, panel] = rows[i] ?? [];
      expect(String(line.level)).toBe(level);
      expect(head).toContain(line.head);
      expect(head).toContain((villages[line.village] as { name: string }).name);
      expect(line.noticeLine).toBe(plain(notice ?? ''));
      expect(line.panelEntry).toBe(plain(panel ?? ''));
    });
  });
});

describe('E2: the Grey Wives’ hints equal lore §33 and are true (GDD §8.6)', () => {
  const rows = tableRows('#### E2.');
  it('has the four hints and elder’s notes, word for word', () => {
    expect(greyWivesHints).toHaveLength(rows.length);
    greyWivesHints.forEach((h, i) => {
      const [level, , hint, note] = rows[i] ?? [];
      expect(String(h.level)).toBe(level);
      expect(h.hint).toBe(plain(hint ?? ''));
      expect(h.elderNote).toBe(plain(note ?? ''));
    });
  });

  const carriers = (brew: string): IngredientId[] =>
    INGREDIENT_IDS.filter((id) => ingredientProperties[id].some((p) => p.brew === brew));
  const holds = (claim: HintClaim, brew: string): boolean => {
    const c = carriers(brew);
    switch (claim.kind) {
      case 'carrierFrom':
        return c.some((id) => ingredients[id].source === claim.source);
      case 'giftCarriersAtLeast':
        return c.filter((id) => ingredients[id].source === 'village-gift').length >= claim.n;
      case 'carriersExactly':
        return (
          c.length === claim.n &&
          new Set(c.map((id) => ingredients[id].source)).size === (claim.unlike ? c.length : 1)
        );
      case 'carriersAre':
        return (
          c.length === claim.ingredients.length && claim.ingredients.every((id) => c.includes(id))
        );
    }
  };

  it.each(greyWivesHints.map((h) => [h.brew, h] as const))('%s: the claim is true', (_b, h) => {
    expect(holds(h.claim, h.brew)).toBe(true);
  });

  it('a false claim is caught', () => {
    expect(holds({ kind: 'carriersExactly', n: 3, unlike: true }, 'coldwater-draught')).toBe(false);
    expect(holds({ kind: 'carriersAre', ingredients: ['pitch'] }, 'wrights-oil')).toBe(false);
  });

  it('a hint names a brew and never an ingredient', () => {
    for (const h of greyWivesHints)
      for (const id of INGREDIENT_IDS)
        expect(h.hint.toLowerCase()).not.toContain(ingredients[id].name.toLowerCase());
  });
});

describe('Part F automated checks pass on every text', () => {
  const kindOf = (s: OrderScene): TextKind => (s.kind === 'opening' ? 'opening' : 'chapter');
  it.each(scenes.map((s) => [s.id, s] as const))('%s', (_id, s) => {
    for (const t of textsOf(s)) expect(checkText(t, kindOf(s))).toEqual([]);
  });

  it('E1 and E2 pass', () => {
    for (const l of mootHeadLines) {
      expect(checkText(l.noticeLine, 'perk')).toEqual([]);
      expect(checkText(l.panelEntry, 'perk')).toEqual([]);
    }
    for (const h of greyWivesHints) {
      expect(checkText(h.hint, 'perk')).toEqual([]);
      expect(checkText(h.elderNote, 'perk')).toEqual([]);
    }
  });
});

describe('each check fails on a planted bad text', () => {
  const fails = (text: string, kind: TextKind, part: string): void => {
    expect(checkText(text, kind).join(' | ')).toContain(part);
  };
  it('a forbidden word', () => {
    fails('The ash lay cold in the hearth.', 'chapter', 'forbidden word "ash"');
    fails('She was fed at the gate.', 'chapter', 'forbidden word "fed"');
    fails('A hollow in the hill.', 'chapter', 'hollow');
  });
  it('allows hollow only as Kozly Hollow or the Hollow', () => {
    expect(checkText('Kozly Hollow is quiet. The Hollow listens.', 'chapter')).toEqual([]);
  });
  it('a relative year', () => {
    fails('It happened four years ago.', 'chapter', 'relative year');
    fails('Long ago, they say.', 'chapter', 'relative year');
    expect(checkText('Every second spring they ring it.', 'chapter')).toEqual([]);
  });
  it('a name from the roll, whole or by a distinctive surname', () => {
    const first = sentNames()[0] ?? '';
    fails(`${first} walked out.`, 'chapter', 'a name from the roll');
    fails('Studnička walked out.', 'chapter', 'a name from the roll');
  });
  it('a phrase that asks for the names', () => {
    fails('Say the names, Ilse.', 'chapter', 'the phrase');
    fails('There were forty. The Sent.', 'chapter', 'the phrase');
  });
  it('an unknown person', () => {
    fails('Tomas Berg came in.', 'chapter', 'unknown person');
    fails('Halvar came in.', 'chapter', 'unknown person');
  });
  it('an opening-scene word', () => {
    fails('The Sending began.', 'opening', 'opening-scene word');
    fails('Down in the Deep.', 'opening', 'opening-scene word "Deep"');
    fails('Break the seal.', 'opening', 'opening-scene word "seal"');
    expect(checkText('Marta sent this by the ferry boy.', 'opening')).toEqual([]);
    expect(checkText('The Deep is cold.', 'chapter')).toEqual([]); // only openings carry this rule
  });
  it('a text that equals no lore text is caught by the string comparison', () => {
    const real = loreScene('##### OR-M1 ·');
    expect(real.body.map((p) => p.replace('Brana', 'Branna'))).not.toEqual(sceneOf('OR-M1')?.body);
  });
});

// ---- E3: the Bell-Watchers' generated sentence ----------------------------------------------------
const rollOf = (n: number) => {
  const r = roll.find((x) => x.n === n);
  if (!r) throw new Error(`no roll number ${n}`);
  return r;
};
const sentenceFor = (group: number[], missing: number[]): string | null =>
  bellSentence(group.filter((n) => missing.includes(n)).map(rollOf));

describe('E3: the Bell-Watchers’ sentence is generated and equals lore §33', () => {
  const rows = tableRows('#### E3.').filter((r) => /^[1-4]$/.test(r[0] ?? '') && r.length === 4);

  it('the groups are the lore table’s', () => {
    expect(rows).toHaveLength(4);
    for (const [level, group] of rows) {
      const nums = (group?.match(/#(\d+)/g) ?? []).map((x) => Number(x.slice(1)));
      expect(bellWatchersGroups[Number(level) as 1 | 2 | 3 | 4]).toEqual(nums);
    }
  });

  it('the full group gives the sentence in the table', () => {
    for (const [level, , , today] of rows) {
      const g = bellWatchersGroups[Number(level) as 1 | 2 | 3 | 4];
      expect(sentenceFor([...g], [...g])).toBe(plain(today ?? ''));
    }
  });

  it('is built from only the names still missing: one, two and all but one found', () => {
    const g4 = [...bellWatchersGroups[4]]; // #4 206 Ravenfell, #5 208 Mirograd, #6 210 Velkvik, #7 212 Dubno Ford
    expect(sentenceFor(g4, [5, 6, 7])).toBe(
      'Three springs, from year 208 to year 212, from Dubno Ford, Mirograd and Velkvik.',
    );
    expect(sentenceFor(g4, [6, 7])).toBe(
      'Two springs, from year 210 to year 212, from Dubno Ford and Velkvik.',
    );
    expect(sentenceFor(g4, [7])).toBe('One spring, year 212, from Dubno Ford.');
    const g1 = [...bellWatchersGroups[1]]; // #21 Mirograd 240 … #27 Mirograd 252
    expect(sentenceFor(g1, [21])).toBe('One spring, year 240, from Mirograd.');
    expect(sentenceFor(g1, [21, 22])).toBe(
      'Two springs, from year 240 to year 242, from Kozly Hollow and Mirograd.',
    );
    expect(sentenceFor(g1, [21, 22, 24, 25, 26])).toBe(
      'Five springs, from year 240 to year 250, from every village but Dubno Ford.',
    );
    expect(sentenceFor(g1, [])).toBeNull();
  });

  it('says every village when all five are named', () => {
    expect(bellSentence([4, 5, 6, 7, 12].map(rollOf))).toBe(
      'Five springs, from year 206 to year 222, from every village.',
    );
  });

  it('the roll’s facts match the lore note (so the sentences stand on the right data)', () => {
    expect(rollOf(21)).toMatchObject({ year: 240, village: 'mirograd' });
    expect(rollOf(22)).toMatchObject({ year: 242, village: 'kozly-hollow' });
    expect(rollOf(7)).toMatchObject({ year: 212, village: 'dubno-ford' });
  });

  it('shows nothing for groups #8, #13, #18, #23 and #1 to #3', () => {
    const grouped = new Set(Object.values(bellWatchersGroups).flat());
    for (const n of [8, 13, 18, 23, 1, 2, 3]) expect(grouped.has(n)).toBe(false);
  });

  const seated = (level: number, found: number[] = []): GameState => {
    const s = createNewGame('bell', 0);
    s.orders.opened.bellWatchers = { at: 0 };
    s.orders.levelHigh.bellWatchers = level;
    s.orders.seats = ['bellWatchers'];
    s.story.names = found.map((n) => ({ n, cycle: 1, at: 0 }));
    return s;
  };
  it('appears only while seated, for the level’s group, and gives the remark when none is missing', () => {
    expect(bellExtra(seated(0))).toBeNull();
    const off = seated(2);
    off.orders.seats = [];
    expect(bellExtra(off)).toBeNull();
    expect(bellExtra(seated(2))?.sentence).toBe(
      'Five springs, from year 216 to year 226, from every village but Dubno Ford.',
    );
    expect(bellExtra(seated(2, [9, 10]))?.missing).toEqual([11, 12, 14]);
    const done = bellExtra(seated(3, [...bellWatchersGroups[3]]));
    expect(done?.sentence).toBeNull();
    expect(done?.remark).toBe(bellWatchersRemarks[3]);
  });
});

describe('E3 fallback remarks and E4 equal lore §33 and pass the checks', () => {
  it('the four remarks', () => {
    const rows = tableRows('#### E3.').filter((r) => /^[1-4]$/.test(r[0] ?? '') && r.length === 2);
    expect(rows).toHaveLength(4);
    for (const [level, line] of rows)
      expect(bellWatchersRemarks[Number(level) as 1 | 2 | 3 | 4]).toBe(plain(line ?? ''));
  });

  it('E3 sentences and remarks pass the Part F checks', () => {
    for (const g of Object.values(bellWatchersGroups))
      for (let k = 1; k <= g.length; k++)
        expect(checkText(bellSentence(g.slice(0, k).map(rollOf)) ?? '', 'perk')).toEqual([]);
    for (const line of Object.values(bellWatchersRemarks))
      expect(checkText(line, 'perk')).toEqual([]);
  });

  it('E4: each excerpt equals the lore table and is an exact substring of its chapter', () => {
    const rows = tableRows('#### E4.');
    expect(rows).toHaveLength(4);
    rows.forEach(([level, excerpt, from]) => {
      const a = quenchersAccounts[Number(level) as 1 | 2 | 3 | 4];
      expect(`"${a.excerpt}"`).toBe(plain(excerpt ?? ''));
      expect(from).toBe(a.from);
      const scene = sceneOf(a.from);
      const whole = [
        ...(scene?.body ?? []),
        ...(scene?.variantA ?? []),
        ...(scene?.variantB ?? []),
        ...(scene?.ending ?? []),
      ].join('\n');
      expect(whole).toContain(a.excerpt);
      expect(checkText(a.excerpt, 'perk')).toEqual([]);
    });
    expect(QUENCHERS_ACCOUNT).toBe('What the hearth leaves');
    expect(QUENCHERS_WITNESS).toBe('Bohdan Kozel');
    expect(quenchersLabel(2)).toBe('(the Quenchers, level 2)');
  });
});

describe('no text says, asks for or begins the names', () => {
  it('holds across every scene, perk text and generated sentence', () => {
    const all = [
      ...scenes.flatMap(textsOf),
      ...mootHeadLines.flatMap((l) => [l.noticeLine, l.panelEntry]),
      ...greyWivesHints.flatMap((h) => [h.hint, h.elderNote]),
      ...Object.values(bellWatchersRemarks),
      ...Object.values(quenchersAccounts).map((a) => a.excerpt),
    ].join('\n');
    for (const n of sentNames())
      expect(new RegExp(`(?<![\\p{L}-])${n}(?![\\p{L}-])`, 'u').test(all)).toBe(false);
    expect(all.toLowerCase()).not.toMatch(
      /say the names|speak the names|read the names|their names|the forty|the sent/,
    );
  });
});
