// Plan TD.3 (GDD §5.15.10, §7.14, D559, M1): What the Hold Learned. The numbers and the breakdown tree
// come from one function; the table of states below is added up by hand from the constants.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { CONTRACT_SPECIES } from '../../src/content/remembering';
import { DESCENT_STRINGS } from '../../src/content/descent-text';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { ORDER_IDS } from '../../src/content/orders';
import { RELIC_IDS } from '../../src/content/relics';
import { DELVE_RELIC_IDS } from '../../src/content/delves/relics';
import { SKILL_IDS } from '../../src/content/skills';
import { learnedBonus } from '../../src/core/systems/descent';
import { xpToNext } from '../../src/core/skills/skills';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';

const L = balance.descent.learned;
const fresh = (): GameState => createNewGame('learned', 0);

/** XP that is exactly `level` levels of one skill. */
const xpFor = (level: number): number => {
  let xp = 0;
  for (let l = 0; l < level; l++) xp += xpToNext(l);
  return xp;
};

interface Setup {
  mastered?: number;
  properties?: number;
  skillLevels?: number[]; // one per skill, in SKILL_IDS order
  chapters?: number; // spread over the Orders
  holdRelics?: number;
  delveRelics?: readonly (typeof DELVE_RELIC_IDS)[number][];
}

const build = (s: Setup): GameState => {
  const st = fresh();
  CONTRACT_SPECIES.slice(0, s.mastered ?? 0).forEach((id) => {
    st.bestiary[id] = { level: 4, kills: 10 };
  });
  // properties: clear the book, then reveal exactly n (3 per ingredient at most)
  for (const id of INGREDIENT_IDS) st.book.properties[id] = [];
  let left = s.properties ?? 0;
  for (const id of INGREDIENT_IDS) {
    const take = Math.min(3, left);
    st.book.properties[id] = ([0, 1, 2] as const).slice(0, take);
    left -= take;
  }
  (s.skillLevels ?? []).forEach((lv, i) => {
    const id = SKILL_IDS[i];
    if (id) st.skills[id] = xpFor(lv);
  });
  let c = s.chapters ?? 0;
  for (const o of ORDER_IDS) {
    const take = Math.min(4, c);
    st.orders.chaptersRead[o] = take;
    c -= take;
  }
  st.relics = RELIC_IDS.slice(0, s.holdRelics ?? 0).map((id) => ({ id, cycle: 1 }));
  st.delve.relics = (s.delveRelics ?? []).map((id) => ({ id, cycle: 1 }));
  return st;
};

const pct = (x: number): number => Math.round(x * 10000) / 100;

describe('learnedBonus adds up across a table of states', () => {
  const none = build({});
  const table: { name: string; setup: Setup; stat: number; taken: number }[] = [
    { name: 'a hold with nothing', setup: {}, stat: 0, taken: 0 },
    {
      name: 'three species Mastered',
      setup: { mastered: 3 },
      stat: 3 * L.perMasteredSpecies.value,
      taken: 0,
    },
    {
      name: 'twelve properties',
      setup: { properties: 12 },
      stat: 12 * L.perProperty.value,
      taken: 0,
    },
    {
      name: 'skills 3, 2, 0, 5',
      setup: { skillLevels: [3, 2, 0, 5] },
      stat: 10 * L.perSkillLevel.value,
      taken: 0,
    },
    { name: 'seven chapters', setup: { chapters: 7 }, stat: 7 * L.perOrderChapter.value, taken: 0 },
    {
      name: 'four Hold relics',
      setup: { holdRelics: 4 },
      stat: 0,
      taken: 4 * L.takenPerRelic.value,
    },
    {
      name: 'two Hold and three Delve relics',
      setup: { holdRelics: 2, delveRelics: ['spindle-whorl', 'salt-ring', 'horn-spoon'] },
      stat: 0,
      taken: 5 * L.takenPerRelic.value,
    },
    {
      name: 'a mixed hold',
      setup: {
        mastered: 5,
        properties: 20,
        skillLevels: [4, 4, 4, 4],
        chapters: 6,
        holdRelics: 3,
        delveRelics: ['cold-iron-nail'],
      },
      stat:
        5 * L.perMasteredSpecies.value +
        20 * L.perProperty.value +
        16 * L.perSkillLevel.value +
        6 * L.perOrderChapter.value,
      taken: 4 * L.takenPerRelic.value,
    },
    {
      name: 'everything at its top',
      setup: {
        mastered: 16,
        properties: 36,
        skillLevels: [10, 10, 10, 10],
        chapters: 16,
        holdRelics: 6,
        delveRelics: [...DELVE_RELIC_IDS],
      },
      stat: 0.53,
      taken: 0.12,
    },
  ];

  it.each(table)('$name', ({ setup, stat, taken }) => {
    const b = learnedBonus(build(setup));
    expect(b.might.value).toBeCloseTo(stat, 10);
    expect(b.health.value).toBeCloseTo(stat, 10); // Might and Health get the identical sum
    expect(b.taken.value).toBeCloseTo(-taken, 10); // a cut: negative
    expect(b.breakdown.value).toBeCloseTo(stat, 10);
  });

  it('a hold with nothing has no active Delve relics', () => {
    expect(learnedBonus(none).delveRelics).toEqual([]);
  });

  it('Mastered below level 4 does not count', () => {
    const st = build({});
    st.bestiary.wolf = { level: 3, kills: 5 };
    expect(learnedBonus(st).might.value).toBe(0);
  });
});

describe('the breakdown is built by the same function', () => {
  const st = build({
    mastered: 5,
    properties: 20,
    skillLevels: [4, 4, 4, 4],
    chapters: 6,
    holdRelics: 3,
    delveRelics: ['spindle-whorl', 'cold-iron-nail', 'rift-lantern', 'salt-ring', 'bell-clapper'],
  });
  const b = learnedBonus(st);

  it('lists the five lines in the GDD §9.24 wording, whose parts add up to the totals', () => {
    const labels = (b.breakdown.children ?? []).map((c) => c.label);
    expect(labels).toEqual([
      'Mastered species (+1%): +5%',
      'Recipe book properties (+0.25%): +5%',
      'Warden skill levels (+0.5%): +8%',
      'Order chapters read (+0.5%): +3%',
      'Owned relics (−1% taken): −8%',
    ]);
    const stat = (b.breakdown.children ?? []).slice(0, 4).reduce((a, c) => a + c.value, 0);
    expect(stat).toBeCloseTo(b.might.value, 10);
    expect((b.breakdown.children ?? [])[4]?.value).toBeCloseTo(b.taken.value, 10);
  });

  it('every line names its balance key', () => {
    expect((b.breakdown.children ?? []).map((c) => c.key)).toEqual([
      'descent.learned.perMasteredSpecies',
      'descent.learned.perProperty',
      'descent.learned.perSkillLevel',
      'descent.learned.perOrderChapter',
      'descent.learned.takenPerRelic',
    ]);
  });

  it('lists the active combat Delve relics (not Bell Clapper) under their own heading', () => {
    expect(b.delveRelics.map((r) => r.id)).toEqual([
      'spindle-whorl',
      'cold-iron-nail',
      'rift-lantern',
      'salt-ring',
    ]);
    expect(b.relicsHeading).toBe(DESCENT_STRINGS.activeRelics);
  });

  it('the summary numbers are the same values as the tree', () => {
    expect(b.summary).toEqual({ mightPct: pct(b.might.value), takenPct: pct(-b.taken.value) });
  });

  it('is pure: the state is not changed', () => {
    const before = JSON.stringify(st);
    learnedBonus(st);
    expect(JSON.stringify(st)).toBe(before);
  });
});
