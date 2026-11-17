// Plan T19.7 (D631, D633, D634): simulator policies value all rebalanced potions/bombs,
// counter passive/Rune threats in contracts, and counter all 5 Great Beasts + 3 Quarries.
import { describe, expect, it } from 'vitest';
import { CONSUMABLE_IDS } from '../../src/content/consumables';
import { bosses } from '../../src/content/great-beasts';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { quarries } from '../../src/content/hunts';
import { apply } from '../../src/core/commands/apply';
import type { Command } from '../../src/core/commands';
import { revealProperty } from '../../src/core/alchemy/book';
import { bestContractPrep, contractMoves, oddsFor } from '../../src/core/policies/contracts';
import { eventPrep, pickParty } from '../../src/core/policies/eventer';
import {
  brewMoves,
  chooseBombs,
  counterPotionFor,
  fillPartyPotions,
  prepFor,
} from '../../src/core/policies/lab';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import { give, keepRich, T0, wear } from '../contracts/helpers';

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

const stockedGame = (seed: string): GameState => {
  const s = keepRich(seed);
  s.cycle.age = 'bastion';
  apply(s, { type: 'debug.prepareEndgameRoster' }, s.time);
  s.resources = { food: 1e7, wood: 1e7, iron: 1e7, silver: 1e6 };
  for (const id of CONSUMABLE_IDS) s.stores[id] = 5;
  return s;
};

describe('lab.ts: rebalanced WANT caps and counter selection (v1.9)', () => {
  it('brews Hardwood Tonic and increased Saltburst cap (2) when earlier stock is filled', () => {
    const s = keepRich('lab-v19-want');
    s.buildings['alchemists-hut'] = 2;
    s.resources = { food: 1e6, wood: 1e6, iron: 1e6, silver: 1e6 };
    for (const id of INGREDIENT_IDS) s.stores[id] = 20;
    for (const id of ['grave-oil', 'drowned-bane-oil', 'thornbane-oil'] as const) s.stores[id] = 3;
    s.stores['fire-pot'] = 2;
    s.stores['frost-pot'] = 2;
    s.stores['mending-draught'] = 2;
    s.stores['hardwood-tonic'] = 0;
    s.stores.saltburst = 1;

    expect(brewMoves(s, actOn(s).act)).toBe(2);
    expect(s.queues.brewing.map((j) => (j.kind === 'brew' ? j.item : ''))).toEqual([
      'hardwood-tonic',
      'hardwood-tonic',
    ]);

    s.queues.brewing = [];
    s.stores['hardwood-tonic'] = 2;
    s.stores['quickfoot-tincture'] = 1;
    expect(brewMoves(s, actOn(s).act)).toBe(1);
    expect(s.queues.brewing[0]).toMatchObject({ kind: 'brew', item: 'saltburst' });
  });

  it('queues v1.9 discovered brews (Coldwater, Owl-Eye, Steadfast, Poppy Smoke) up to cap 2', () => {
    const s = keepRich('lab-v19-discovered');
    s.buildings['alchemists-hut'] = 2;
    s.resources = { food: 1e6, wood: 1e6, iron: 1e6, silver: 1e6 };
    for (const id of INGREDIENT_IDS) s.stores[id] = 20;
    for (const id of INGREDIENT_IDS)
      for (const idx of [0, 1, 2] as const) revealProperty(s, id, idx);
    for (const id of [
      'grave-oil',
      'drowned-bane-oil',
      'thornbane-oil',
      'fire-pot',
      'frost-pot',
      'mending-draught',
      'hardwood-tonic',
      'saltburst',
      'hidebane-oil',
      'wrights-oil',
    ] as const) {
      s.stores[id] = 3;
    }
    s.stores['quickfoot-tincture'] = 1;
    s.stores['coldwater-draught'] = 1;
    s.stores['owl-eye-drops'] = 1;

    expect(brewMoves(s, actOn(s).act)).toBe(2);
    expect(s.queues.brewing.map((j) => (j.kind === 'brew' ? j.item : ''))).toEqual([
      'coldwater-draught',
      'owl-eye-drops',
    ]);
  });

  it('maps Hardwood Tonic cleanly as counterPotionFor physical burst threats', () => {
    const s = stockedGame('lab-v19-counter');
    give(s, 'halvar', 'zora', 'ostap');
    expect(counterPotionFor(bosses['beacon-bane'])).toBe('coldwater-draught');
    expect(counterPotionFor(bosses['thorn-stag'])).toBe('steadfast-draught');
    expect(counterPotionFor(quarries['stoneback-fell-troll'])).toBe('hardwood-tonic');
    expect(
      prepFor(
        s,
        {
          id: 'c1',
          village: 'velkvik',
          monster: 'anvil-wight',
          tier: 3,
          location: 'barrow',
          arrivedAt: T0,
          revealed: 3,
        },
        ['halvar', 'zora'],
      ).potions,
    ).toEqual({
      halvar: 'hardwood-tonic',
      zora: 'mending-draught',
    });
  });
});

describe('contracts.ts: uses rebalanced bombs and party potions on tough contracts (v1.9)', () => {
  it('upgrades party potions and Saltburst against tough contracts below SAFE_ODDS', () => {
    const s = keepRich('contracts-v19-upgrade');
    s.buildings['hunters-lodge'] = 1;
    s.buildings['alchemists-hut'] = 1;
    s.buildings['herb-garden'] = 1;
    s.buildings.smithy = 1;
    s.buildings.barracks = 0;
    s.resources = { food: 1e6, wood: 1e6, iron: 0, silver: 0 };
    for (const id of CONSUMABLE_IDS) s.stores[id] = 5;
    s.stores['thornbane-oil'] = 0;
    s.stores['fire-pot'] = 0;
    s.stores['poppy-smoke'] = 0;
    s.hunters = {};
    give(s, 'halvar', 'zora', 'ostap');
    s.roster.active = ['halvar', 'zora', 'ostap'];
    for (const id of s.roster.active) {
      const h = s.hunters[id];
      if (h) h.level = 3;
      wear(s, id, 'iron-blade');
    }
    const c: ContractInstance = {
      id: 'leshy-t5',
      village: 'velkvik',
      monster: 'leshy',
      tier: 5,
      location: 'forest',
      arrivedAt: T0,
      revealed: 3,
    };
    s.board.open = [c];
    const basePrep = prepFor(s, c, ['halvar', 'zora', 'ostap']);
    const baseOdds = oddsFor(s, c, ['halvar', 'zora', 'ostap'], basePrep) ?? 0;
    expect(baseOdds).toBeGreaterThanOrEqual(0.35);
    expect(baseOdds).toBeLessThan(0.85);
    const best = bestContractPrep(s, c, ['halvar', 'zora', 'ostap']);
    expect(Object.keys(best.prep.potions)).toHaveLength(3);

    const { act, done } = actOn(s);
    contractMoves(s, act, { food: 0, wood: 0, iron: 0, silver: 0 });
    const launch = done.find((cmd) => cmd.type === 'contract.launch');
    expect(launch).toBeDefined();
    if (!launch || launch.type !== 'contract.launch') return;
    expect(launch.contract).toBe('leshy-t5');
    expect(launch.party).toEqual(['halvar', 'zora', 'ostap']);
    expect(launch.prep?.bombs).toContain('saltburst');
    expect(Object.keys(launch.prep?.potions ?? {})).toHaveLength(3);
    expect(launch.prep?.potions).toEqual({
      halvar: 'hardwood-tonic',
      zora: 'steadfast-draught',
      ostap: 'mending-draught',
    });
  });

  it('considers adding Poppy Smoke when an unidentified contract sits just under MIN_ODDS', () => {
    const s = stockedGame('contracts-v19-unidentified-smoke');
    for (const id of s.roster.active) {
      const h = s.hunters[id];
      if (h) h.level = 1;
      wear(s, id, 'iron-blade');
    }
    const c: ContractInstance = {
      id: 'unknown-t3',
      village: 'velkvik',
      monster: 'draugr',
      tier: 3,
      location: 'barrow',
      arrivedAt: T0,
      revealed: 0,
    };
    const res = bestContractPrep(s, c, ['halvar', 'zora']);
    expect(res.prep.bombs[0]).toBe('saltburst');
    expect(res.odds).not.toBeNull();
  });
});

describe('eventer.ts: counters all 5 Great Beasts and 3 Quarries (v1.9)', () => {
  it('prepares bespoke counter-oils, bombs, and all-4-hunter potions per Great Beast', () => {
    const s = stockedGame('eventer-v19-bosses');
    const party = ['halvar', 'zora', 'sigrun', 'ostap'] as const;

    // #1 Lindworm: Hidebane Oil, Fire Pot + Poppy Smoke, Steadfast on fastest (Coil) + Hardwood on Vanguard
    const lind = eventPrep(s, party, bosses['lindworm-of-velk-fjord']);
    expect(lind.oils).toEqual({
      halvar: 'hidebane-oil',
      zora: 'hidebane-oil',
      sigrun: 'hidebane-oil',
      ostap: 'hidebane-oil',
    });
    expect(lind.bombs).toEqual(['fire-pot', 'poppy-smoke']);
    expect(lind.potions.halvar).toBe('hardwood-tonic');
    expect(lind.potions.ostap).toBe('mending-draught');
    expect(Object.values(lind.potions)).toContain('steadfast-draught');
    expect(Object.keys(lind.potions)).toHaveLength(4);

    // #2 Barrow-King: Coldwater (Grave Chill) + Steadfast (Barrow-Grip) + Fire Pot + Poppy Smoke
    const barrow = eventPrep(s, party, bosses['barrow-king']);
    expect(barrow.bombs).toEqual(['fire-pot', 'poppy-smoke']);
    expect(barrow.potions.halvar).toBe('coldwater-draught');
    expect(Object.values(barrow.potions)).toContain('steadfast-draught');
    expect(Object.keys(barrow.potions)).toHaveLength(4);

    // #3 Mother of the River: Frost Pot + Poppy Smoke, Steadfast on lowest-Armor (Drowning Song)
    const mother = eventPrep(s, party, bosses['mother-of-the-river']);
    expect(mother.bombs).toEqual(['frost-pot', 'poppy-smoke']);
    expect(mother.potions.halvar).toBe('hardwood-tonic');
    expect(Object.values(mother.potions)).toContain('steadfast-draught');

    // #4 Thorn-Stag: Thornbane Oil, Fire Pot + Poppy Smoke, Steadfast on fastest (Thorn-Snare) + Hardwood
    const stag = eventPrep(s, party, bosses['thorn-stag']);
    expect(Object.values(stag.oils)).toEqual([
      'thornbane-oil',
      'thornbane-oil',
      'thornbane-oil',
      'thornbane-oil',
    ]);
    expect(stag.bombs).toEqual(['fire-pot', 'poppy-smoke']);
    expect(stag.potions.halvar).toBe('hardwood-tonic');
    expect(Object.values(stag.potions)).toContain('steadfast-draught');
    expect(Object.keys(stag.potions)).toHaveLength(4);

    // #5 Beacon-Bane: Wright's Oil, Frost Pot + Saltburst (cancels Pitch-Flare + Rune x1.5), Coldwater stacked
    const bane = eventPrep(s, party, bosses['beacon-bane']);
    expect(Object.values(bane.oils)).toEqual([
      'wrights-oil',
      'wrights-oil',
      'wrights-oil',
      'wrights-oil',
    ]);
    expect(bane.bombs).toEqual(['frost-pot', 'saltburst']);
    expect(bane.potions.halvar).toBe('coldwater-draught');
    expect(
      Object.values(bane.potions).filter((p) => p === 'coldwater-draught').length,
    ).toBeGreaterThanOrEqual(2);
    expect(Object.keys(bane.potions)).toHaveLength(4);
  });

  it('never assigns more consumables than stores hold', () => {
    const s = stockedGame('eventer-v19-caps');
    for (const id of CONSUMABLE_IDS) s.stores[id] = 0;
    s.stores['wrights-oil'] = 2;
    s.stores['coldwater-draught'] = 1;
    s.stores['frost-pot'] = 1;
    const p = eventPrep(s, ['halvar', 'zora', 'sigrun', 'ostap'], bosses['beacon-bane']);
    expect(Object.keys(p.oils)).toHaveLength(2);
    expect(p.bombs).toEqual(['frost-pot']);
    expect(p.potions).toEqual({ halvar: 'coldwater-draught' });
  });

  it('counters Quarries (Stoneback Saltburst, Mara Saltburst, Likho Owl-Eye) and breaks level ties for Beacon-Bane', () => {
    const s = stockedGame('eventer-v19-quarry-and-tie');
    const party = ['halvar', 'zora', 'sigrun', 'ostap'] as const;
    expect(chooseBombs(s, quarries['stoneback-fell-troll'], true)).toEqual([
      'fire-pot',
      'saltburst',
    ]);
    expect(chooseBombs(s, quarries['mara-of-kettle-barrow'], true)).toEqual([
      'saltburst',
      'poppy-smoke',
    ]);
    expect(eventPrep(s, party, quarries['likho-one-eyed']).potions).toMatchObject({
      halvar: 'hardwood-tonic',
    });
    expect(Object.values(fillPartyPotions(s, party, quarries['likho-one-eyed'], {}))).toContain(
      'owl-eye-drops',
    );

    // Level-tied Vanguards: Halvar wearing Emberwright Plate beats equal-level non-plated Vanguard vs Beacon-Bane.
    const clean = keepRich('pick-tie-v19');
    give(clean, 'bjarna', 'halvar', 'sigrun', 'vesna', 'arvid');
    for (const id of ['halvar', 'bjarna', 'sigrun', 'vesna', 'arvid'] as const) {
      const h = clean.hunters[id];
      if (h) h.level = 10;
    }
    wear(clean, 'bjarna', 'hide-armor');
    wear(clean, 'halvar', 'emberwright-plate');
    const picked = pickParty(
      clean,
      ['bjarna', 'halvar', 'sigrun', 'vesna', 'arvid'],
      4,
      bosses['beacon-bane'],
    );
    expect(picked).toContain('halvar');
    expect(picked).toContain('arvid'); // Rune damage (weak ×1.5) & Vanguard beats Fire-dealing Sigrun (res 0.25) on tie!
  });
});
