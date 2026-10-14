// Plan T6.4: the recipe book and experiments (GDD §5.8.1–§5.8.4), rule by rule.
import { describe, expect, it } from 'vitest';
import { CONSUMABLE_IDS, type ConsumableId } from '../../src/content/consumables';
import type { IngredientId } from '../../src/content/ingredients';
import { num } from '../../src/core/balance-access';
import {
  experimentProblem,
  knownBrews,
  knownRecipes,
  propertiesFound,
  revealProperty,
} from '../../src/core/alchemy/book';
import { brewMs, kettlesBusy } from '../../src/core/alchemy/brewing';
import { advance } from '../../src/core/sim/advance';
import { pairKey } from '../../src/core/state/book-state';
import type { GameState } from '../../src/core/state/game-state';
import { keepRich, run } from '../contracts/helpers';

const MIN = 60_000;
const EXPERIMENT = num('experiment.time') * 1000;

/** A rich Keep with a Hut of the given level and 20 of every ingredient. */
const hut = (level = 1): GameState => {
  const s = keepRich('book');
  s.buildings['alchemists-hut'] = level;
  for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 20;
  for (const k of CONSUMABLE_IDS) s.stores[k] = 0;
  return s;
};
const recipes = (s: GameState, brew: ConsumableId) =>
  knownRecipes(s, brew).map((r) => ({ ...r.ingredients }));

describe('the book at the start (GDD §5.8.1, D200)', () => {
  it('shows 15 of the 36 properties and knows exactly the nine v0.3 brews', () => {
    const s = hut();
    expect(propertiesFound(s)).toBe(15);
    expect(knownBrews(s)).toEqual(CONSUMABLE_IDS.slice(0, 9));
  });
});

describe('recipes (GDD §5.8.2, D198)', () => {
  it('an oil or potion is two carriers 2:1, either way round, the v0.3 recipe first', () => {
    const s = hut();
    expect(recipes(s, 'grave-oil')).toEqual([
      { 'grave-dust': 2, juniper: 1 },
      { juniper: 2, 'grave-dust': 1 },
    ]);
  });

  it('a bomb is one carrier and a wood; Saltburst two carriers and a silver', () => {
    const s = hut();
    expect(knownRecipes(s, 'fire-pot')).toEqual([
      { ingredients: { pitch: 1 }, resources: { wood: 1 } },
    ]);
    expect(knownRecipes(s, 'saltburst')).toEqual([
      { ingredients: { 'rime-salt': 2 }, resources: { silver: 1 } },
    ]);
  });

  it('a newly found carrier adds an alternate recipe (a Fire Pot from thornwood)', () => {
    const s = hut();
    revealProperty(s, 'thornwood', 2);
    expect(recipes(s, 'fire-pot')).toEqual([{ pitch: 1 }, { thornwood: 1 }]);
  });

  it('a mix of two carriers counts for Saltburst (any mix of two units)', () => {
    const s = hut();
    revealProperty(s, 'grave-dust', 2);
    expect(recipes(s, 'saltburst')).toEqual([
      { 'rime-salt': 2 },
      { 'rime-salt': 1, 'grave-dust': 1 },
      { 'grave-dust': 2 },
    ]);
  });

  it('a bomb is known from one carrier, an oil needs two (Poppy Smoke, Hidebane Oil)', () => {
    const s = hut();
    expect(knownBrews(s)).not.toContain('poppy-smoke');
    revealProperty(s, 'honeycomb', 2);
    expect(knownBrews(s)).toContain('poppy-smoke');
    expect(recipes(s, 'poppy-smoke')).toEqual([{ honeycomb: 1 }]);
    revealProperty(s, 'hares-foot', 1);
    expect(knownBrews(s)).not.toContain('hidebane-oil');
    revealProperty(s, 'wolf-fang', 0);
    expect(recipes(s, 'hidebane-oil')).toEqual([
      { 'hares-foot': 2, 'wolf-fang': 1 },
      { 'wolf-fang': 2, 'hares-foot': 1 },
    ]);
  });
});

describe('brewing from the book (GDD §5.8.2)', () => {
  it('a brew without a chosen recipe uses the v0.3 recipe, as before', () => {
    const s = hut();
    revealProperty(s, 'thornwood', 2);
    expect(run(s, { type: 'brew.queue', item: 'fire-pot' }).ok).toBe(true);
    expect(s.stores.pitch).toBe(19);
    expect(s.stores.thornwood).toBe(20);
  });

  it('the player can pick any known recipe, and only a known one', () => {
    const s = hut(2);
    expect(run(s, { type: 'brew.queue', item: 'fire-pot', ingredients: { thornwood: 1 } }).ok).toBe(
      false,
    );
    revealProperty(s, 'thornwood', 2);
    expect(run(s, { type: 'brew.queue', item: 'fire-pot', ingredients: { thornwood: 1 } }).ok).toBe(
      true,
    );
    expect(s.stores.thornwood).toBe(19);
    expect(s.queues.brewing[0]).toMatchObject({
      kind: 'brew',
      paid: { ingredients: { thornwood: 1 }, resources: { wood: 1 } },
    });
    expect(
      run(s, {
        type: 'brew.queue',
        item: 'grave-oil',
        ingredients: { juniper: 2, 'grave-dust': 1 },
      }).ok,
    ).toBe(true);
    expect(run(s, { type: 'brew.queue', item: 'grave-oil', ingredients: { juniper: 3 } }).ok).toBe(
      false,
    );
  });

  it('a discovered brew can be brewed, with no default until it is known', () => {
    const s = hut(1);
    expect(run(s, { type: 'brew.queue', item: 'poppy-smoke' }).ok).toBe(false);
    revealProperty(s, 'honeycomb', 2);
    expect(run(s, { type: 'brew.queue', item: 'poppy-smoke' }).ok).toBe(true);
    expect(s.stores.honeycomb).toBe(19);
    advance(s, s.time + num('brew.time') * 1000);
    expect(s.stores['poppy-smoke']).toBe(1);
  });

  it('cancelling refunds exactly the recipe that was paid', () => {
    const s = hut(1);
    revealProperty(s, 'thornwood', 2);
    const wood = s.resources.wood;
    run(s, { type: 'brew.queue', item: 'fire-pot', ingredients: { thornwood: 1 } });
    expect(run(s, { type: 'brew.cancel', index: 0 }).ok).toBe(true);
    expect(s.stores.thornwood).toBe(20);
    expect(s.stores.pitch).toBe(20);
    expect(s.resources.wood).toBe(wood);
  });
});

describe('experiments (GDD §5.8.3, D199)', () => {
  const queue = (s: GameState, a: IngredientId, b: IngredientId) =>
    run(s, { type: 'experiment.queue', a, b });

  it('pay 1 of each when queued, take the time, and need a kettle', () => {
    const s = hut(1);
    const t = s.time;
    expect(queue(s, 'yarrow', 'pitch').ok).toBe(true);
    expect([s.stores.yarrow, s.stores.pitch]).toEqual([19, 19]);
    expect(kettlesBusy(s)).toBe(1);
    expect(s.queues.brewing[0]).toMatchObject({ kind: 'experiment', doneAt: t + EXPERIMENT });
    expect(queue(hut(0), 'yarrow', 'pitch').ok).toBe(false);
    const empty = hut(1);
    empty.stores.pitch = 0;
    expect(queue(empty, 'yarrow', 'pitch').ok).toBe(false);
  });

  it('share the Copper Still’s time cut with brews', () => {
    const s = hut(1);
    s.relics = [{ id: 'copper-still', cycle: 1 }];
    queue(s, 'yarrow', 'pitch');
    expect(s.queues.brewing[0]?.doneAt).toBe(s.time + brewMs(s));
    expect(brewMs(s)).toBeLessThan(num('brew.time') * 1000);
  });

  it('cancel refunds both and frees the pair', () => {
    const s = hut(1);
    queue(s, 'yarrow', 'pitch');
    expect(run(s, { type: 'brew.cancel', index: 0 }).ok).toBe(true);
    expect([s.stores.yarrow, s.stores.pitch]).toEqual([20, 20]);
    expect(queue(s, 'yarrow', 'pitch').ok).toBe(true);
  });

  it('reveal every shared property on both (wolf fang and hare’s foot)', () => {
    const s = hut(1);
    queue(s, 'wolf-fang', 'hares-foot');
    const log = advance(s, s.time + EXPERIMENT);
    expect(s.book.properties['wolf-fang']).toEqual([0, 1]);
    expect(s.book.properties['hares-foot']).toEqual([0, 1, 2]);
    expect(s.book.tried).toEqual([pairKey('wolf-fang', 'hares-foot')]);
    const done = log.events.find((e) => e.type === 'experiment');
    expect(done).toMatchObject({
      type: 'experiment',
      a: 'wolf-fang',
      b: 'hares-foot',
      discovered: ['hidebane-oil', 'owl-eye-drops'],
    });
    expect(knownBrews(s)).toEqual(expect.arrayContaining(['hidebane-oil', 'owl-eye-drops']));
  });

  it('with nothing shared, reveal the first hidden property of each', () => {
    const s = hut(1);
    queue(s, 'yarrow', 'mugwort');
    advance(s, s.time + EXPERIMENT);
    expect(s.book.properties.yarrow).toEqual([0, 1, 2]);
    expect(s.book.properties.mugwort).toEqual([0, 1, 2]);
    // Fully known ingredients reveal nothing; the other still learns its first hidden one.
    const t = hut(1);
    t.book.properties.yarrow = [0, 1, 2];
    queue(t, 'yarrow', 'wolf-fang');
    advance(t, t.time + EXPERIMENT);
    expect(t.book.properties['wolf-fang']).toEqual([0]);
  });

  it('teach only: no brew comes out, and a discovery is named', () => {
    const s = hut(1);
    queue(s, 'honeycomb', 'noon-poppy'); // share Mending Draught and Poppy Smoke
    const log = advance(s, s.time + EXPERIMENT);
    expect(CONSUMABLE_IDS.every((id) => s.stores[id] === 0)).toBe(true);
    expect(log.events.find((e) => e.type === 'experiment')).toMatchObject({
      discovered: ['poppy-smoke'],
    });
  });

  it('refuse a pair already tried, already queued, or with nothing left to learn', () => {
    const s = hut(2);
    expect(queue(s, 'yarrow', 'yarrow').ok).toBe(false);
    queue(s, 'yarrow', 'mugwort');
    expect(experimentProblem(s, 'mugwort', 'yarrow')).toMatch(/already/i);
    advance(s, s.time + EXPERIMENT);
    expect(experimentProblem(s, 'mugwort', 'yarrow')).toMatch(/tried/i);
    const t = hut(1);
    t.book.properties.yarrow = [0, 1, 2];
    t.book.properties.mugwort = [0, 1, 2];
    expect(experimentProblem(t, 'yarrow', 'mugwort')).toMatch(/nothing left to learn/i);
    expect(queue(t, 'yarrow', 'mugwort').ok).toBe(false);
  });

  it('the book is complete when all 36 are found, and never loses one', () => {
    const s = hut(5);
    for (let i = 0; i < 40; i++) {
      for (const a of Object.keys(s.book.properties) as IngredientId[])
        for (const b of Object.keys(s.book.properties) as IngredientId[])
          if (experimentProblem(s, a, b) === null) {
            queue(s, a, b);
            advance(s, s.time + EXPERIMENT);
          }
    }
    expect(propertiesFound(s)).toBe(36);
    expect(knownBrews(s)).toEqual([...CONSUMABLE_IDS]);
    // Time: 10 minutes each; sanity that the loop did real work.
    expect(s.book.tried.length).toBeGreaterThan(5);
    expect(MIN).toBeGreaterThan(0);
  });
});

describe('time and experiments', () => {
  it('give the same book however time is chopped up', () => {
    const make = (): GameState => {
      const s = hut(3);
      run(s, { type: 'experiment.queue', a: 'wolf-fang', b: 'hares-foot' });
      run(s, { type: 'experiment.queue', a: 'yarrow', b: 'mugwort' });
      run(s, { type: 'experiment.queue', a: 'honeycomb', b: 'noon-poppy' });
      run(s, { type: 'experiment.queue', a: 'pitch', b: 'river-pearl' });
      return s;
    };
    const one = make();
    advance(one, one.time + 40 * MIN);
    const many = make();
    for (let i = 0; i < 40; i++) advance(many, many.time + MIN);
    expect(many.book).toEqual(one.book);
    expect(many.stores).toEqual(one.stores);
    expect(many.queues).toEqual(one.queues);
  });
});
