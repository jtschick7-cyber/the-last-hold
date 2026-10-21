// Plan T10.9 (lore §33 Part F, D423): the Orders' texts equal the lore file word for word and pass the
// automated checks; each check is proved by a planted bad text that it catches. T10.10 adds the
// Bell-Watchers and the Quenchers (E3, E4) to the same file.
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/orders-chapters';
import { ingredientProperties } from '../../src/content/properties';
import { ingredients, INGREDIENT_IDS, type IngredientId } from '../../src/content/ingredients';
import { mootGreyWivesScenes, type OrderScene } from '../../src/content/story/orders-scenes';
import {
  greyWivesHints,
  mootHeadLines,
  type HintClaim,
} from '../../src/content/story/orders-perks';
import { villages } from '../../src/content/villages';
import { checkText, sentNames, type TextKind } from './orders-checks';
import { loreScene, plain, tableRows } from './orders-lore';

const scenes: readonly OrderScene[] = mootGreyWivesScenes;
const textsOf = (s: OrderScene): string[] => [
  ...s.body,
  ...(s.variantA ?? []),
  ...(s.variantB ?? []),
  ...(s.ending ?? []),
  ...(s.libraryNote ? [s.libraryNote] : []),
];
const headingOf = (s: OrderScene): string => `##### ${s.id} ·`;

describe('the scene texts equal lore §33, word for word', () => {
  it('has the ten Moot and Grey Wives scenes: two openings and eight chapters', () => {
    expect(scenes.map((s) => s.id)).toEqual([
      'OS-M',
      'OS-G',
      ...['M1', 'M2', 'M3', 'M4', 'G1', 'G2', 'G3', 'G4'].map((x) => `OR-${x}`),
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

  it('only chapter 4 of the Moot has two endings', () => {
    expect(scenes.filter((s) => s.variantA).map((s) => s.id)).toEqual(['OR-M4']);
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
    expect(real.body.map((p) => p.replace('Brana', 'Branna'))).not.toEqual(
      mootGreyWivesScenes[2]?.body,
    );
  });
});
