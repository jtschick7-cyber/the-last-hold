// Plan T3.12: the simulated player's v0.3 rules (D95).
import { describe, expect, it } from 'vitest';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { apply, type Command } from '../../src/core/commands';
import { brewMoves, investigateMoves, labBuildings, prepFor } from '../../src/core/policies/lab';
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
    expect(s.queues.brewing.map((j) => j.item)).toEqual(['grave-oil', 'grave-oil']); // up to 3 of each oil
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
    expect(s.queues.brewing[0]?.item).toBe('fire-pot');
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
