// Plan T6.1a: the v0.6 content matches the GDD tables (§5.8.5, §7.7, §7.8, §8.6)
// and is internally consistent. The tables are read from the GDD itself, so a doc
// edit and a content edit can't drift apart.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../src/content/consumables';
import { families } from '../../src/content/damage';
import { INGREDIENT_IDS, ingredients } from '../../src/content/ingredients';
import { ingredientProperties } from '../../src/content/properties';
import { arvidArrival, arvidArrivalOnLoad } from '../../src/content/story/act3';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const cells = (line: string): string[] =>
  line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
const section = (from: string, to: string): string => {
  const a = gdd.indexOf(from);
  return gdd.slice(a, gdd.indexOf(to, a));
};

const ALL_BREWS: readonly ConsumableId[] = CONSUMABLE_IDS;
const V06_BREW_IDS = CONSUMABLE_IDS.slice(9);
const v06Brews = consumables;
const brewName = (id: ConsumableId): string => consumables[id].name;

describe('the properties table (GDD §8.6, D197, D202)', () => {
  const rows = section('### 8.6 Ingredients', '### 8.7 Consumables')
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.includes('---') && !l.startsWith('| Ingredient'));

  it('is the GDD table, property by property and in order', () => {
    expect(rows).toHaveLength(INGREDIENT_IDS.length);
    for (const id of INGREDIENT_IDS) {
      const row = rows.find((r) => cells(r)[0] === ingredients[id].name);
      expect(row, id).toBeDefined();
      const gddProps = (cells(row ?? '')[2] ?? '').split(' · ');
      expect(
        gddProps.map((s) => s.replace(/\*/g, '')),
        id,
      ).toEqual(ingredientProperties[id].map((x) => brewName(x.brew)));
      // Bold in the GDD = known from the start.
      expect(
        gddProps.map((s) => s.startsWith('**')),
        id,
      ).toEqual(ingredientProperties[id].map((x) => x.known));
    }
  });

  it('gives each ingredient exactly 3 distinct properties, never the same three as another', () => {
    const triples = new Set<string>();
    for (const id of INGREDIENT_IDS) {
      const props = ingredientProperties[id].map((x) => x.brew);
      expect(new Set(props).size, id).toBe(3);
      triples.add([...props].sort().join());
    }
    expect(triples.size).toBe(INGREDIENT_IDS.length);
  });

  it('makes every brew: 2+ carriers for oils and potions, 1+ for bombs', () => {
    const carriers = (b: ConsumableId): number =>
      INGREDIENT_IDS.filter((i) => ingredientProperties[i].some((x) => x.brew === b)).length;
    let total = 0;
    for (const b of ALL_BREWS) {
      const kind = consumables[b].kind;
      expect(carriers(b), b).toBeGreaterThanOrEqual(kind === 'bomb' ? 1 : 2);
      expect(carriers(b), b).toBeLessThanOrEqual(3);
      total += carriers(b);
    }
    expect(total).toBe(36);
  });

  it('opens the book with exactly the properties the nine v0.3 recipes prove (15)', () => {
    const proved = new Set<string>();
    for (const id of CONSUMABLE_IDS)
      for (const ing of Object.keys(consumables[id].recipe?.ingredients ?? {}))
        proved.add(`${ing}/${id}`);
    const known = new Set<string>();
    for (const id of INGREDIENT_IDS)
      for (const x of ingredientProperties[id]) if (x.known) known.add(`${id}/${x.brew}`);
    expect([...known].sort()).toEqual([...proved].sort());
    expect(known.size).toBe(15);
  });

  it('puts all three of wolf fang and noon poppy in the hidden 21', () => {
    for (const id of ['wolf-fang', 'noon-poppy'] as const)
      expect(
        ingredientProperties[id].every((x) => !x.known),
        id,
      ).toBe(true);
  });
});

describe('the six new brews (GDD §5.8.5, D201)', () => {
  it('have the GDD names, kinds and effects', () => {
    const lines = section('#### 5.8.5', '#### 5.8.6')
      .split('\n')
      .filter((l) => l.startsWith('| **'));
    expect(lines).toHaveLength(6);
    for (const id of V06_BREW_IDS) {
      const def = v06Brews[id];
      const row = lines.find((l) => cells(l)[0]?.replace(/\*/g, '') === def.name);
      expect(row, id).toBeDefined();
      expect(cells(row ?? '')[1]?.toLowerCase(), id).toContain(def.kind);
    }
  });

  it('use the oil rule for the two new oils and the GDD numbers for the rest', () => {
    expect(v06Brews['hidebane-oil'].effect).toEqual({ kind: 'oil', family: 'beasts-and-wilds' });
    expect(v06Brews['wrights-oil'].effect).toEqual({ kind: 'oil', family: 'cursed' });
    expect(families['beasts-and-wilds'].name).toBe('Beasts & Wilds');
    expect(v06Brews['coldwater-draught'].effect).toEqual({ kind: 'fireTaken', takenCut: 0.4 });
    expect(v06Brews['owl-eye-drops'].effect).toEqual({ kind: 'hitChance', hitChance: 0.1 });
    expect(v06Brews['steadfast-draught'].effect).toEqual({ kind: 'steadfast', uses: 1 });
    expect(v06Brews['poppy-smoke'].effect).toEqual({ kind: 'smoke', lostActions: 1 });
  });

  it('join the saved-state id list after the nine v0.3 items, with no recipe to start (T6.3)', () => {
    expect(V06_BREW_IDS).toHaveLength(6);
    for (const id of V06_BREW_IDS) expect(consumables[id].recipe, id).toBeNull();
  });
});

describe('the v0.6 balance keys (GDD §7.7, §7.8, D194, D195, D217)', () => {
  it('have the GDD starting values', () => {
    expect(balance.band.heldFrom).toMatchObject({ value: 12, locked: false });
    expect(balance.band.triumphantFrom).toMatchObject({ value: 15, locked: false });
    expect(balance.trust.triumphantContracts).toMatchObject({ value: 10, locked: false });
    expect(balance.experiment.time).toMatchObject({ value: 600, locked: false });
    expect(balance.experiment.units.value).toBe(1);
    expect(balance.skill.maxLevel).toMatchObject({ value: 10, locked: true });
    expect(balance.skill.xpBase.value).toBe(20);
    expect(balance.skill.xpGrowth.value).toBe(1.6);
    expect(balance.skill.xp.alchemy.value).toEqual({ brew: 1, experiment: 3, property: 10 });
    expect(balance.skill.xp.smithing.value).toEqual({ gearPerTier: 2, smithyLevel: 2 });
    expect(balance.skill.xp.lore.value).toEqual({ clue: 1, knowledgeLevel: 5, document: 5 });
    expect(balance.skill.xp.command.value).toEqual({ contractPerTier: 2, wave: 1 });
    expect(balance.skill.alchemyPotency.value).toBe(0.03);
    expect(balance.skill.smithingCost.value).toBe(0.025); // D237
    expect(balance.skill.loreClueTime.value).toBe(0.04);
    expect(balance.skill.commandXp.value).toBe(0.04);
  });

  it('keep every skill key tunable except the cap', () => {
    for (const [k, v] of Object.entries(balance.skill))
      if (k !== 'maxLevel' && 'locked' in v) expect(v.locked, k).toBe(false);
  });
});

describe("Act III's arrival lines (lore-secrets §26, D211, D214)", () => {
  const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');
  it('are the lore lines word for word', () => {
    expect(lore).toContain(`*"${arvidArrival}"*`);
    expect(lore).toContain(`*"${arvidArrivalOnLoad}"*`);
  });
});
