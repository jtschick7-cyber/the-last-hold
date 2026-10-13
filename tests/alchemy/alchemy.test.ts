// Plan T3.8: brewing queues, the Herb Garden, and the reagents a success brings.
// GDD §5.7, §8.6, §5.4.3.
import { describe, expect, it } from 'vitest';
import { CONSUMABLE_IDS, consumables } from '../../src/content/consumables';
import { HERB_IDS, type IngredientId } from '../../src/content/ingredients';
import { monsters } from '../../src/content/monsters';
import { villages } from '../../src/content/villages';
import { num } from '../../src/core/balance-access';
import { brewSlots, kettlesBusy, nextBrewTime } from '../../src/core/alchemy/brewing';
import { nextGardenTime } from '../../src/core/alchemy/garden';
import { reagentsFor } from '../../src/core/contracts/reagents';
import { advance } from '../../src/core/sim/advance';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import { HOUR, T0, give, keepRich, run } from '../contracts/helpers';

const MIN = 60_000;
const BREW = num('brew.time') * 1000;
const GARDEN = num('herbGarden.interval') * 1000;

/** A rich Keep with a Hut of the given level and plenty of reagents. */
const hut = (level = 1): GameState => {
  const s = keepRich('alch');
  s.buildings['alchemists-hut'] = level;
  for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 20;
  for (const k of Object.keys(s.stores)) {
    if ((CONSUMABLE_IDS as readonly string[]).includes(k)) s.stores[k as keyof typeof s.stores] = 0;
  }
  return s;
};

describe('the Alchemist’s Hut (GDD §5.7)', () => {
  it('has one kettle per level', () => {
    expect(brewSlots(hut(0))).toBe(0);
    expect(brewSlots(hut(1))).toBe(1);
    expect(brewSlots(hut(5))).toBe(5);
  });

  it('refuses without a Hut, for an unknown item, or when reagents or resources are short', () => {
    expect(run(hut(0), { type: 'brew.queue', item: 'grave-oil' }).ok).toBe(false);
    expect(run(hut(1), { type: 'brew.queue', item: 'nope' as never }).ok).toBe(false);
    const s = hut(1);
    s.stores['grave-dust'] = 1; // the recipe needs 2
    expect(run(s, { type: 'brew.queue', item: 'grave-oil' }).ok).toBe(false);
    s.stores['grave-dust'] = 5;
    s.resources.silver = 0;
    expect(run(s, { type: 'brew.queue', item: 'saltburst' }).ok).toBe(false); // needs 1 silver
    const w = hut(1);
    w.resources.wood = 0;
    expect(run(w, { type: 'brew.queue', item: 'fire-pot' }).ok).toBe(false); // needs 1 wood
  });

  it('pays the recipe when queued, and starts at once on a free kettle', () => {
    const s = hut(1);
    const wood = s.resources.wood;
    expect(run(s, { type: 'brew.queue', item: 'fire-pot' }).ok).toBe(true);
    expect(s.stores.pitch).toBe(19);
    expect(s.resources.wood).toBe(wood - 1);
    expect(s.queues.brewing).toEqual([{ item: 'fire-pot', doneAt: s.time + BREW }]);
    expect(kettlesBusy(s)).toBe(1);
  });

  it('every recipe is paid exactly as the content says', () => {
    for (const id of CONSUMABLE_IDS) {
      const s = hut(1);
      const before = structuredClone({ stores: s.stores, resources: s.resources });
      expect(run(s, { type: 'brew.queue', item: id }).ok, id).toBe(true);
      for (const [k, n] of Object.entries(consumables[id].recipe.ingredients))
        expect(s.stores[k as IngredientId], `${id} ${k}`).toBe(
          before.stores[k as IngredientId] - (n ?? 0),
        );
      for (const [r, n] of Object.entries(consumables[id].recipe.resources))
        expect(s.resources[r as keyof typeof s.resources]).toBe(
          before.resources[r as keyof typeof s.resources] - (n ?? 0),
        );
    }
  });

  it('a brew finishes after 10 minutes and goes into the stores', () => {
    const s = hut(1);
    run(s, { type: 'brew.queue', item: 'grave-oil' });
    const t0 = s.time;
    advance(s, t0 + BREW - 1);
    expect(s.stores['grave-oil']).toBe(0);
    const log = advance(s, t0 + BREW);
    expect(s.stores['grave-oil']).toBe(1);
    expect(log.events.some((e) => e.type === 'brew' && e.item === 'grave-oil')).toBe(true);
    expect(s.queues.brewing).toEqual([]);
    expect(nextBrewTime(s)).toBeNull();
  });

  it('brews one at a time per Hut level; the rest wait, and start the moment a kettle frees', () => {
    const s = hut(2);
    for (const item of ['grave-oil', 'fire-pot', 'frost-pot', 'saltburst'] as const)
      run(s, { type: 'brew.queue', item });
    const t0 = s.time;
    expect(s.queues.brewing.map((j) => j.doneAt)).toEqual([t0 + BREW, t0 + BREW, null, null]);
    advance(s, t0 + BREW);
    expect(s.queues.brewing.map((j) => j.doneAt)).toEqual([t0 + 2 * BREW, t0 + 2 * BREW]);
    advance(s, t0 + 2 * BREW);
    expect(s.queues.brewing).toEqual([]);
    expect(
      ['grave-oil', 'fire-pot', 'frost-pot', 'saltburst'].map(
        (i) => s.stores[i as keyof typeof s.stores],
      ),
    ).toEqual([1, 1, 1, 1]);
  });

  it('upgrading the Hut puts a waiting brew on the new kettle at once', () => {
    const s = hut(1);
    run(s, { type: 'brew.queue', item: 'grave-oil' });
    run(s, { type: 'brew.queue', item: 'fire-pot' });
    expect(s.queues.brewing[1]?.doneAt).toBeNull();
    advance(s, s.time + 3 * MIN);
    expect(run(s, { type: 'build.upgrade', building: 'alchemists-hut' }).ok).toBe(true);
    expect(s.queues.brewing[1]?.doneAt).toBe(s.time + BREW);
  });

  it('cancelling a brew refunds it in full, and a waiting brew behind it moves up', () => {
    const s = hut(1);
    run(s, { type: 'brew.queue', item: 'fire-pot' });
    run(s, { type: 'brew.queue', item: 'frost-pot' });
    advance(s, s.time + 4 * MIN);
    const wood = s.resources.wood;
    expect(run(s, { type: 'brew.cancel', index: 0 }).ok).toBe(true);
    expect(s.stores.pitch).toBe(20);
    expect(s.resources.wood).toBe(wood + 1); // the fire pot's wood comes back
    expect(s.queues.brewing).toEqual([{ item: 'frost-pot', doneAt: s.time + BREW }]);
    expect(run(s, { type: 'brew.cancel', index: 5 }).ok).toBe(false);
  });

  it('is the same however time is chopped up', () => {
    const make = () => {
      const s = hut(2);
      for (const item of [
        'grave-oil',
        'fire-pot',
        'frost-pot',
        'saltburst',
        'mending-draught',
      ] as const)
        run(s, { type: 'brew.queue', item });
      return s;
    };
    const a = make();
    const b = make();
    const c = make();
    advance(a, a.time + 2 * HOUR);
    for (let i = 0; i < 2 * 3600; i++) advance(b, b.time + 1000);
    for (let i = 0; i < 2 * 60; i++) advance(c, c.time + 60_000);
    expect(b.stores).toEqual(a.stores);
    expect(c.stores).toEqual(a.stores);
    expect(b.queues).toEqual(a.queues);
  });
});

describe('the Herb Garden (GDD §5.7)', () => {
  const garden = (n: number): GameState => {
    const s = keepRich('herb');
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
    s.resources.wood = 1e6;
    s.resources.food = 1e6;
    if (n > 0)
      expect(run(s, { type: 'build.buy', building: 'herb-garden', count: n }).ok).toBe(true);
    return s;
  };
  const herbs = (s: GameState) => HERB_IDS.map((h) => s.stores[h]);

  it('starts its clock when the first garden is built, and not before', () => {
    expect(nextGardenTime(garden(0))).toBeNull();
    const s = garden(1);
    expect(nextGardenTime(s)).toBe(s.time + GARDEN);
  });

  it('grows one of each herb per garden every 10 minutes', () => {
    const s = garden(1);
    const t0 = s.time;
    advance(s, t0 + GARDEN - 1);
    expect(herbs(s)).toEqual([0, 0, 0]);
    const log = advance(s, t0 + GARDEN);
    expect(herbs(s)).toEqual([1, 1, 1]);
    expect(log.events.some((e) => e.type === 'harvest')).toBe(true);
    advance(s, t0 + 6 * GARDEN);
    expect(herbs(s)).toEqual([6, 6, 6]);
    const three = garden(3);
    advance(three, three.time + 2 * GARDEN);
    expect(herbs(three)).toEqual([6, 6, 6]);
  });

  it('grows only the three common herbs', () => {
    const s = garden(2);
    advance(s, s.time + 3 * GARDEN);
    for (const [k, n] of Object.entries(s.stores))
      if (!(HERB_IDS as readonly string[]).includes(k)) expect(n, k).toBe(0);
  });

  it('a garden built later joins at the next harvest', () => {
    const s = garden(1);
    const t0 = s.time;
    advance(s, t0 + 5 * MIN);
    run(s, { type: 'build.buy', building: 'herb-garden', count: 1 });
    advance(s, t0 + GARDEN);
    expect(herbs(s)).toEqual([2, 2, 2]);
  });

  it('keeps growing through offline time, and is the same however time is chopped up', () => {
    const a = garden(2);
    const b = garden(2);
    advance(a, a.time + 8 * HOUR);
    for (let i = 0; i < 8 * 60; i++) advance(b, b.time + 60_000);
    expect(herbs(a)).toEqual([96, 96, 96]); // 48 harvests of 2
    expect(herbs(b)).toEqual(herbs(a));
  });
});

describe('reagents from a success (GDD §8.6, D87)', () => {
  const contract = (over: Partial<ContractInstance>): ContractInstance => ({
    id: 'r1',
    village: 'dubno-ford',
    monster: 'rusalka',
    tier: 3,
    location: 'river',
    arrivedAt: T0,
    revealed: 3,
    ...over,
  });

  it('gives `tier` units of each drop, plus one gift reagent from the village', () => {
    const r = reagentsFor('seed', contract({}));
    expect(r['river-pearl']).toBeGreaterThanOrEqual(3);
    const gift = Object.entries(r).filter(([k]) => k !== 'river-pearl');
    expect(gift).toHaveLength(1);
    const [giftId, n] = gift[0] ?? ['', 0];
    expect(villages['dubno-ford'].gifts as readonly string[]).toContain(giftId);
    expect(n).toBe(1);
    const total = Object.values(r).reduce((x, y) => x + (y ?? 0), 0);
    expect(total).toBe(3 + 1);
  });

  it('gives every drop of a species with two: the Draugr yields grave dust and rime salt', () => {
    expect(monsters.draugr.drops).toEqual(['grave-dust', 'rime-salt']);
    const r = reagentsFor(
      'seed',
      contract({ monster: 'draugr', tier: 4, location: 'barrow', village: 'velkvik' }),
    );
    expect(r['grave-dust']).toBe(4);
    // Velkvik's gifts are rime salt and pitch; rime salt stacks on the drop.
    expect((r['rime-salt'] ?? 0) + (r.pitch ?? 0)).toBeGreaterThanOrEqual(5);
  });

  it('is fixed by the contract: the same seed gives the same gift, and gifts vary across contracts', () => {
    expect(reagentsFor('seed', contract({}))).toEqual(reagentsFor('seed', contract({})));
    const gifts = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const r = reagentsFor(
        'seed',
        contract({
          id: `g${i}`,
          monster: 'bies',
          location: 'forest',
          tier: 3,
          village: 'kozly-hollow',
        }),
      );
      for (const k of Object.keys(r)) if (k !== 'thornwood') gifts.add(k);
    }
    expect([...gifts].sort()).toEqual(['honeycomb', 'pitch']);
  });

  it('Ravenfell only ever gifts rime salt', () => {
    for (let i = 0; i < 20; i++) {
      const r = reagentsFor(
        'seed',
        contract({
          id: `v${i}`,
          village: 'ravenfell',
          location: 'forest',
          monster: 'bies',
          tier: 3,
        }),
      );
      expect(r['rime-salt']).toBe(1);
    }
  });

  it('a win puts them in the stores and on the result; a loss brings none', () => {
    const s = keepRich('reag');
    for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
    s.board.open = [
      contract({
        id: 'a',
        monster: 'kikimora',
        tier: 1,
        location: 'field',
        village: 'kozly-hollow',
      }),
    ];
    give(s, 'halvar', 'zora', 'ostap');
    run(s, { type: 'contract.launch', contract: 'a', party: ['halvar', 'zora', 'ostap'] });
    advance(s, s.time + HOUR);
    const result = s.results[0];
    expect(result?.success).toBe(true);
    expect(result?.reagents.thornwood).toBe(1);
    for (const [k, n] of Object.entries(result?.reagents ?? {}))
      expect(s.stores[k as IngredientId], k).toBe(n);

    const l = keepRich('reag2');
    for (const k of Object.keys(l.stores)) l.stores[k as keyof typeof l.stores] = 0;
    l.board.open = [
      contract({ id: 'b', monster: 'draugr', tier: 5, location: 'barrow', village: 'velkvik' }),
    ];
    run(l, { type: 'contract.launch', contract: 'b', party: ['halvar'], confirmReckless: true });
    advance(l, l.time + 9 * HOUR);
    expect(l.results[0]?.success).toBe(false);
    expect(l.results[0]?.reagents).toEqual({});
    expect(Object.values(l.stores).every((n) => n === 0)).toBe(true);
  });

  it('nextBrewTime and nextGardenTime are null on a fresh game', () => {
    const s = keepRich('fresh');
    expect(nextBrewTime(s)).toBeNull();
    expect(nextGardenTime(s)).toBeNull();
  });
});
