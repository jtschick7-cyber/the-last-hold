// Plan T3.2: the v0.3 content matches GDD §5.6, §5.7, §8.2, §8.3, §8.4 and §8.6,
// and is internally consistent. (The location × tier coverage test is T3.5.)
import { describe, expect, it } from 'vitest';
import { CLUE_TAGS, clueTexts } from '../../src/content/clues';
import { CONSUMABLE_IDS, consumables } from '../../src/content/consumables';
import { families } from '../../src/content/damage';
import { HERB_IDS, INGREDIENT_IDS, ingredients } from '../../src/content/ingredients';
import { KNOWLEDGE_LEVELS, knowledgeLevels } from '../../src/content/knowledge';
import { MONSTER_IDS, monsters } from '../../src/content/monsters';
import { RESOURCE_IDS } from '../../src/content/resources';
import { VILLAGE_IDS, villages } from '../../src/content/villages';
import { bestiaryText } from '../../src/content/text/bestiary';
import { num } from '../../src/core/balance-access';

describe('knowledge levels (GDD §5.6.2)', () => {
  it('has five levels, numbered 0 to 4 in order', () => {
    expect(KNOWLEDGE_LEVELS).toHaveLength(5);
    KNOWLEDGE_LEVELS.forEach((id, i) => expect(knowledgeLevels[id].number).toBe(i));
  });

  it('the Studied and Mastered text names the balance thresholds and bonuses', () => {
    expect(knowledgeLevels.studied.how).toContain(`${num('knowledge.studiedKills')} kills`);
    expect(knowledgeLevels.mastered.how).toContain(`${num('knowledge.masteredKills')} kills`);
    expect(knowledgeLevels.studied.effect).toContain(`${num('knowledge.studiedDamage') * 100}%`);
    expect(knowledgeLevels.mastered.effect).toContain(`${num('knowledge.masteredDamage') * 100}%`);
  });
});

describe('clue library (GDD §8.4)', () => {
  it('has the 20 tags, each with at least 3 distinct texts', () => {
    expect(CLUE_TAGS).toHaveLength(20);
    for (const tag of CLUE_TAGS) {
      const texts = clueTexts[tag];
      expect(texts.length, tag).toBeGreaterThanOrEqual(3);
      expect(new Set(texts).size, tag).toBe(texts.length);
      for (const t of texts) expect(t.trim().length, tag).toBeGreaterThan(10);
    }
    expect(Object.keys(clueTexts).sort()).toEqual([...CLUE_TAGS].sort());
  });

  it('every tag is used by at least one species, and every species has three different tags', () => {
    const used = new Set(MONSTER_IDS.flatMap((m) => monsters[m].clueTags));
    for (const tag of CLUE_TAGS) expect(used.has(tag), tag).toBe(true);
    for (const m of MONSTER_IDS) expect(new Set(monsters[m].clueTags).size, m).toBe(3);
  });

  it('matches the GDD §8.3 clue tags for the species', () => {
    expect(monsters.wolf.clueTags).toEqual(['tracks', 'livestock', 'night']);
    expect(monsters.draugr.clueTags).toEqual(['grave', 'cold', 'treasure']);
    expect(monsters.nix.clueTags).toEqual(['drowned', 'song', 'horse']);
    expect(monsters.huldra.clueTags).toEqual(['stranger', 'lost', 'livestock']);
  });
});

describe('ingredients (GDD §8.6)', () => {
  it('has the 12 ingredients and 3 herbs', () => {
    expect(INGREDIENT_IDS).toHaveLength(12);
    expect(Object.keys(ingredients).sort()).toEqual([...INGREDIENT_IDS].sort());
    for (const h of HERB_IDS) expect(ingredients[h].source).toBe('herb-garden');
  });

  it('drops match the GDD §8.6 table', () => {
    const droppedBy = (id: string): string[] =>
      MONSTER_IDS.filter((m) => (monsters[m].drops as readonly string[]).includes(id)).sort();
    expect(droppedBy('grave-dust')).toEqual(['draugr', 'strzyga', 'upyr']);
    expect(droppedBy('river-pearl')).toEqual(['nix', 'rusalka', 'vodyanoy']);
    expect(droppedBy('thornwood')).toEqual(['bies', 'huldra', 'kikimora', 'leshy']);
    expect(droppedBy('wolf-fang')).toEqual(['wolf']);
    expect(droppedBy('noon-poppy')).toEqual(['poludnitsa']);
    expect(droppedBy('rime-salt')).toEqual(['draugr']);
  });

  it('gift reagents match the GDD §8.2 and §8.6 tables', () => {
    const giftedBy = (id: string): string[] =>
      VILLAGE_IDS.filter((v) => (villages[v].gifts as readonly string[]).includes(id)).sort();
    expect(giftedBy('honeycomb')).toEqual(['dubno-ford', 'kozly-hollow']);
    expect(giftedBy('hares-foot')).toEqual(['dubno-ford', 'mirograd']);
    expect(giftedBy('pitch')).toEqual(['kozly-hollow', 'mirograd', 'velkvik']);
    expect(giftedBy('rime-salt')).toEqual(['ravenfell', 'velkvik']);
  });

  it("every ingredient's declared source is real, and every non-herb has one", () => {
    for (const id of INGREDIENT_IDS) {
      const def = ingredients[id];
      const dropped = MONSTER_IDS.some((m) =>
        (monsters[m].drops as readonly string[]).includes(id),
      );
      const gifted = VILLAGE_IDS.some((v) => (villages[v].gifts as readonly string[]).includes(id));
      if (def.source === 'monster-drop') expect(dropped, id).toBe(true);
      if (def.source === 'village-gift') expect(gifted, id).toBe(true);
      if (def.source === 'herb-garden') expect(dropped || gifted, id).toBe(false);
    }
  });
});

describe('consumables (GDD §5.7)', () => {
  it('has 9 items: 3 oils, 3 potions, 3 bombs', () => {
    expect(CONSUMABLE_IDS).toHaveLength(9);
    const count = (k: string): number =>
      CONSUMABLE_IDS.filter((c) => consumables[c].kind === k).length;
    expect([count('oil'), count('potion'), count('bomb')]).toEqual([3, 3, 3]);
    for (const id of CONSUMABLE_IDS) expect(consumables[id].id).toBe(id);
  });

  it('recipes use real ingredients and resources, in the GDD §5.7 amounts', () => {
    for (const c of Object.values(consumables)) {
      for (const i of Object.keys(c.recipe.ingredients))
        expect(INGREDIENT_IDS as readonly string[], c.id).toContain(i);
      for (const r of Object.keys(c.recipe.resources))
        expect(RESOURCE_IDS as readonly string[], c.id).toContain(r);
    }
    expect(consumables['grave-oil'].recipe.ingredients).toEqual({ 'grave-dust': 2, juniper: 1 });
    expect(consumables.saltburst.recipe).toEqual({
      ingredients: { 'rime-salt': 2 },
      resources: { silver: 1 },
    });
    expect(consumables['fire-pot'].recipe.resources).toEqual({ wood: 1 });
  });

  it('every recipe is brewable from sources that exist in the game', () => {
    for (const c of Object.values(consumables))
      for (const i of Object.keys(c.recipe.ingredients))
        expect(INGREDIENT_IDS as readonly string[], `${c.id}: ${i}`).toContain(i);
  });

  it('each oil targets a different family that has a real species', () => {
    const fams = CONSUMABLE_IDS.flatMap((c) => {
      const e = consumables[c].effect;
      return e.kind === 'oil' ? [e.family] : [];
    });
    expect(new Set(fams).size).toBe(3);
    for (const f of fams) {
      expect(f in families).toBe(true);
      expect(MONSTER_IDS.some((m) => monsters[m].family === f)).toBe(true);
    }
  });

  it('the effect numbers are the GDD ones', () => {
    expect(consumables['mending-draught'].effect).toEqual({
      kind: 'heal',
      belowHealth: 0.3,
      healFraction: 0.4,
    });
    expect(consumables['hardwood-tonic'].effect).toEqual({
      kind: 'armorUntilAction',
      armorBonus: 0.3,
      untilAction: 5,
    });
    expect(consumables['quickfoot-tincture'].effect).toEqual({
      kind: 'speedWholeFight',
      speedBonus: 0.2,
    });
    expect(consumables['fire-pot'].effect).toMatchObject({
      initial: 40,
      perAction: 10,
      actions: 3,
    });
    expect(consumables['frost-pot'].effect).toMatchObject({
      initial: 30,
      speedCut: 0.3,
      actions: 3,
    });
    expect(consumables.saltburst.effect).toEqual({ kind: 'saltburst', blockActions: 3 });
    expect(num('oil.familyBonus')).toBe(0.35);
  });

  it('every summary is plain text with no leftover placeholder', () => {
    for (const c of Object.values(consumables)) expect(c.summary).not.toMatch(/\$\{|undefined/);
  });
});

describe('bestiary text (setting-primer §6.4)', () => {
  const sentences = (s: string): number => s.split(/[.!?]+\s/).filter((x) => x.trim()).length;

  it('every species has a 2–3 sentence blurb and a one-sentence "What it was" line', () => {
    expect(Object.keys(bestiaryText).sort()).toEqual([...MONSTER_IDS].sort());
    for (const id of MONSTER_IDS) {
      const { blurb, whatItWas } = bestiaryText[id];
      expect(sentences(blurb), id).toBeGreaterThanOrEqual(2);
      expect(sentences(blurb), id).toBeLessThanOrEqual(3);
      expect(whatItWas, id).toMatch(/^What it was: .+\.$/);
      expect(sentences(whatItWas), id).toBe(1);
    }
  });

  it("the primer's own Upyr and Rusalka lines are used word for word", () => {
    expect(bestiaryText.upyr.whatItWas).toBe(
      'What it was: a miller buried in a hurry in the plague year, with no one left to watch the grave.',
    );
    expect(bestiaryText.rusalka.whatItWas).toBe(
      "What it was: a girl from Dubno Ford who walked into the river the spring her betrothed didn't come home.",
    );
  });

  it('no two "What it was" lines are the same', () => {
    expect(new Set(MONSTER_IDS.map((m) => bestiaryText[m].whatItWas)).size).toBe(12);
  });
});
