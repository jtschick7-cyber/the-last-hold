// Plan T3.12: the simulated player's v0.3 rules (D95).
import { describe, expect, it } from 'vitest';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { apply, type Command } from '../../src/core/commands';
import { revealProperty } from '../../src/core/alchemy/book';
import {
  brewMoves,
  experimentMoves,
  investigateMoves,
  labBuildings,
  prepFor,
} from '../../src/core/policies/lab';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import { keepRich, give, T0 } from '../contracts/helpers';

const actOn = (s: GameState) => {
  const done: Command[] = [];
  return {
    done,
    act: (cmd: Command): boolean => {
      if (!apply(s, cmd, s.time).ok) return false;
      done.push(cmd);
      return true;
    },
  };
};

const rich = (): GameState => {
  const s = keepRich('lab');
  s.resources = { food: 1e8, wood: 1e8, iron: 1e8, silver: 1e6 };
  give(s, 'halvar', 'zora', 'ostap');
  return s;
};

const contract = (over: Partial<ContractInstance> = {}): ContractInstance => ({
  id: 'l1',
  village: 'dubno-ford',
  monster: 'rusalka',
  tier: 2,
  location: 'river',
  arrivedAt: T0,
  revealed: 0,
  ...over,
});

const none = { food: 0, wood: 0, iron: 0, silver: 0 };

describe('building the Lodge, the Hut and the Garden', () => {
  it('buys them in order, as far as it can afford, in the Keep only', () => {
    const s = rich();
    const { act } = actOn(s);
    expect(labBuildings(s, act, none)).toBeGreaterThanOrEqual(6);
    expect(s.buildings['hunters-lodge']).toBeGreaterThanOrEqual(2);
    expect(s.buildings['alchemists-hut']).toBeGreaterThanOrEqual(2);
    expect(s.buildings['herb-garden']).toBeGreaterThanOrEqual(2);
    const poor = rich();
    poor.resources.silver = 100; // not enough for the Lodge's 200
    expect(labBuildings(poor, actOn(poor).act, none)).toBe(0);
    const hamlet = rich();
    hamlet.cycle.age = 'hamlet';
    expect(labBuildings(hamlet, actOn(hamlet).act, none)).toBe(0);
  });

  it('takes one step at a time: the Hut waits for the Lodge, the Garden for the Hut', () => {
    const s = rich();
    s.resources.silver = 200; // the Lodge, and nothing left for the Hut
    labBuildings(s, actOn(s).act, none);
    expect(s.buildings['hunters-lodge']).toBe(1);
    expect(s.buildings['alchemists-hut']).toBe(0);
    expect(s.buildings['herb-garden']).toBe(0);
  });
});

describe('investigating, brewing and preparing', () => {
  it('sends each free Lodge slot after the highest-tier unidentified contract', () => {
    const s = rich();
    s.buildings['hunters-lodge'] = 2;
    s.board.open = [
      contract({ id: 'a', tier: 1 }),
      contract({ id: 'b', tier: 3 }),
      contract({ id: 'c', tier: 2 }),
      contract({ id: 'd', tier: 5, revealed: 3 }),
    ];
    expect(investigateMoves(s, actOn(s).act)).toBe(2);
    expect(s.queues.investigation.map((q) => q.contractId)).toEqual(['b', 'c']);
  });

  it('keeps one brew per kettle going, oils first', () => {
    const s = rich();
    s.buildings['alchemists-hut'] = 2;
    for (const k of INGREDIENT_IDS) s.stores[k] = 20;
    expect(brewMoves(s, actOn(s).act)).toBe(2);
    expect(s.queues.brewing.map((j) => (j.kind === 'brew' ? j.item : j.kind))).toEqual([
      'grave-oil',
      'grave-oil',
    ]); // up to 3 of each oil
    expect(brewMoves(s, actOn(s).act)).toBe(0);
  });

  it('brews nothing it cannot pay for, and stops at the stock it wants', () => {
    const s = rich();
    s.buildings['alchemists-hut'] = 1;
    expect(brewMoves(s, actOn(s).act)).toBe(0); // no reagents at all
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
    s.stores['grave-oil'] = 3;
    s.stores['drowned-bane-oil'] = 3;
    s.stores['thornbane-oil'] = 3;
    s.stores.pitch = 5;
    expect(brewMoves(s, actOn(s).act)).toBe(1);
    expect(s.queues.brewing[0]).toMatchObject({ kind: 'brew', item: 'fire-pot' });
  });

  it('carries the matching oil, a bomb the species is weak to, and a Mending Draught, when it can name the species', () => {
    const s = rich();
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 5;
    const p = prepFor(
      s,
      contract({ monster: 'kikimora', tier: 1, location: 'field', revealed: 3 }),
      ['halvar', 'zora'],
    );
    expect(p.oils).toEqual({ halvar: 'thornbane-oil', zora: 'thornbane-oil' });
    expect(p.bombs).toContain('fire-pot'); // Kikimora: Fire ×1.5
    expect(p.bombs).not.toContain('frost-pot'); // Frost ×0.75
    expect(p.potions).toEqual({ halvar: 'mending-draught' });
  });

  it('against an unnamed monster it carries a Saltburst and nothing that depends on the species', () => {
    const s = rich();
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 5;
    const p = prepFor(s, contract(), ['halvar']);
    expect(p.oils).toEqual({});
    expect(p.bombs).toEqual(['saltburst']);
  });

  it('carries only what the stores hold', () => {
    const s = rich();
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
    s.stores['thornbane-oil'] = 1;
    const p = prepFor(
      s,
      contract({ monster: 'kikimora', tier: 1, location: 'field', revealed: 3 }),
      ['halvar', 'zora'],
    );
    expect(p.oils).toEqual({ halvar: 'thornbane-oil' });
    expect(p.bombs).toEqual([]);
  });
});

describe('the v0.6 rules (GDD §6.1, D215)', () => {
  const stocked = (): GameState => {
    const s = rich();
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 5;
    return s;
  };
  const named = (monster: ContractInstance['monster']) =>
    contract({ monster, tier: 2, location: 'field', revealed: 3 });

  it('carries the new oil for the family: Hidebane vs Beasts & Wilds, Wright’s vs the Cursed', () => {
    const s = stocked();
    expect(prepFor(s, named('wolf'), ['halvar']).oils).toEqual({ halvar: 'hidebane-oil' });
    expect(prepFor(s, named('ribbonshade'), ['halvar']).oils).toEqual({ halvar: 'wrights-oil' });
  });

  it('puts the counter-potion on the Vanguard and the Mending Draught on the next hunter', () => {
    const s = stocked();
    // Halvar is the Vanguard; Zora comes second.
    expect(prepFor(s, named('poludnitsa'), ['zora', 'halvar']).potions).toEqual({
      halvar: 'coldwater-draught',
      zora: 'mending-draught',
    });
    expect(prepFor(s, named('ribbonshade'), ['halvar', 'zora']).potions).toEqual({
      halvar: 'coldwater-draught',
      zora: 'mending-draught',
    });
    expect(prepFor(s, named('gloam-moths'), ['halvar', 'zora']).potions).toEqual({
      halvar: 'owl-eye-drops',
      zora: 'mending-draught',
    });
    expect(prepFor(s, named('huldra'), ['halvar', 'zora']).potions).toEqual({
      halvar: 'steadfast-draught',
      zora: 'mending-draught',
    });
    expect(prepFor(s, named('draugr'), ['halvar', 'zora']).potions.halvar).toBe(
      'steadfast-draught',
    );
  });

  it('keeps the Mending Draught on the first hunter when no counter-potion is wanted or held', () => {
    const s = stocked();
    expect(prepFor(s, named('kikimora'), ['halvar', 'zora']).potions).toEqual({
      halvar: 'mending-draught',
    });
    s.stores['steadfast-draught'] = 0;
    expect(prepFor(s, named('huldra'), ['halvar', 'zora']).potions).toEqual({
      halvar: 'mending-draught',
    });
  });

  it('adds Poppy Smoke after the weak-to bombs when a slot is left, for a named species', () => {
    const s = stocked();
    expect(prepFor(s, named('kikimora'), ['halvar']).bombs).toEqual(['fire-pot', 'poppy-smoke']);
    // Nothing weak: a Saltburst, then Poppy Smoke.
    const t = stocked();
    t.stores['fire-pot'] = 0;
    t.stores['frost-pot'] = 0;
    expect(prepFor(t, named('kikimora'), ['halvar']).bombs).toEqual(['saltburst', 'poppy-smoke']);
  });

  it('brews a new brew once the book knows it, after the usual stock', () => {
    const s = rich();
    s.buildings['alchemists-hut'] = 1;
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
    for (const id of ['grave-oil', 'drowned-bane-oil', 'thornbane-oil'] as const) s.stores[id] = 3;
    s.stores['fire-pot'] = 2;
    s.stores['frost-pot'] = 2;
    s.stores['mending-draught'] = 2;
    s.stores.saltburst = 1;
    s.stores['quickfoot-tincture'] = 1;
    s.stores['hares-foot'] = 3;
    s.stores['wolf-fang'] = 3;
    expect(brewMoves(s, actOn(s).act)).toBe(0); // Hidebane is not known yet
    revealProperty(s, 'hares-foot', 1);
    revealProperty(s, 'wolf-fang', 0);
    expect(brewMoves(s, actOn(s).act)).toBe(1);
    expect(s.queues.brewing[0]).toMatchObject({ kind: 'brew', item: 'hidebane-oil' });
  });

  it('runs an experiment in a spare kettle: the pair with the most hidden properties, herbs before drops', () => {
    const s = rich();
    s.buildings['alchemists-hut'] = 1;
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
    s.stores.yarrow = 5;
    s.stores.juniper = 5;
    s.stores['wolf-fang'] = 5; // 3 hidden, but a monster drop
    s.stores['noon-poppy'] = 5; // 3 hidden, but a monster drop
    const { act, done } = actOn(s);
    expect(experimentMoves(s, act)).toBe(1); // one kettle
    expect(done[0]).toMatchObject({ type: 'experiment.queue' });
    // The herbs have 1 hidden each (2 in all); the two drops have 6 in all and win the count.
    expect(s.queues.brewing[0]).toMatchObject({
      kind: 'experiment',
      a: 'wolf-fang',
      b: 'noon-poppy',
    });
  });

  it('keeps enough stock for the usual brews, skips tried pairs, and never fills a busy kettle', () => {
    const s = rich();
    s.buildings['alchemists-hut'] = 2;
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
    s.stores.yarrow = 2; // 1 unit would leave only 1: below the stock it keeps
    s.stores.juniper = 4;
    s.stores.mugwort = 4;
    expect(experimentMoves(s, actOn(s).act)).toBe(1);
    expect(s.queues.brewing[0]).toMatchObject({ kind: 'experiment', a: 'mugwort', b: 'juniper' });
    // Both kettles busy after the second move? Only one pair is left, so it stops.
    expect(experimentMoves(s, actOn(s).act)).toBe(0);
    expect(s.queues.brewing).toHaveLength(1);
  });

  it('does nothing without a Hut, and when nothing is left to learn', () => {
    const s = rich();
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 9;
    expect(experimentMoves(s, actOn(s).act)).toBe(0);
    const t = rich();
    t.buildings['alchemists-hut'] = 1;
    for (const k of Object.keys(t.stores)) t.stores[k as keyof typeof t.stores] = 9;
    for (const id of INGREDIENT_IDS) for (const i of [0, 1, 2] as const) revealProperty(t, id, i);
    expect(experimentMoves(t, actOn(t).act)).toBe(0);
  });
});
