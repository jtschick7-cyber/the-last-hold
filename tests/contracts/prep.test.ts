// Plan T3.9, the contract half: slots, stores, seeds, odds, and the well-prepared bonus.
// GDD §5.7, §5.4.2, §5.4.3.
import { describe, expect, it } from 'vitest';
import type { ConsumableId } from '../../src/content/consumables';
import { num } from '../../src/core/balance-access';
import { runFight } from '../../src/core/combat';
import { computeOdds } from '../../src/core/contracts/odds';
import { isWellPrepared, prepIds } from '../../src/core/contracts/prep';
import { fightSeed } from '../../src/core/contracts/seeds';
import { monsterFor } from '../../src/core/investigation/knowledge';
import { seeded } from '../../src/core/rng';
import { advance } from '../../src/core/sim/advance';
import type { ContractInstance, GameState, Preparation } from '../../src/core/state/game-state';
import { snapshotOf } from '../../src/core/systems/hunters';
import { HOUR, T0, give, keepRich, run } from './helpers';

const prep = (over: Partial<Preparation> = {}): Preparation => ({
  oils: {},
  potions: {},
  bombs: [],
  ...over,
});

const stocked = (): GameState => {
  const s = keepRich('prep');
  for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 0;
  for (const c of [
    'grave-oil',
    'thornbane-oil',
    'drowned-bane-oil',
    'mending-draught',
    'hardwood-tonic',
    'quickfoot-tincture',
    'fire-pot',
    'frost-pot',
    'saltburst',
  ] as ConsumableId[])
    s.stores[c] = 3;
  give(s, 'halvar', 'zora', 'ostap');
  return s;
};

const kikimora = (id = 'k1', over: Partial<ContractInstance> = {}): ContractInstance => ({
  id,
  village: 'kozly-hollow',
  monster: 'kikimora',
  tier: 1,
  location: 'field',
  arrivedAt: T0,
  revealed: 3,
  ...over,
});

const launch = (
  s: GameState,
  p: Preparation,
  party: ('halvar' | 'zora' | 'ostap')[] = ['halvar', 'zora', 'ostap'],
) => run(s, { type: 'contract.launch', contract: 'k1', party, confirmReckless: true, prep: p });

describe('the preparation slots (GDD §5.7)', () => {
  it('refuses anything that does not fit, and changes nothing when it does', () => {
    const cases: [string, Preparation][] = [
      ['an unknown item', prep({ oils: { halvar: 'nope' as never } })],
      ['a potion in the oil slot', prep({ oils: { halvar: 'mending-draught' } })],
      ['an oil in the potion slot', prep({ potions: { halvar: 'grave-oil' } })],
      ['a potion as a bomb', prep({ bombs: ['mending-draught'] })],
      ['a bomb as an oil', prep({ oils: { zora: 'fire-pot' } })],
      ['a hunter who is not in the party', prep({ oils: { radek: 'grave-oil' } })],
      ['three bombs', prep({ bombs: ['fire-pot', 'frost-pot', 'saltburst'] })],
    ];
    for (const [why, p] of cases) {
      const s = stocked();
      s.board.open = [kikimora()];
      const before = structuredClone({ stores: s.stores, food: s.resources.food });
      expect(launch(s, p).ok, why).toBe(false);
      expect(s.stores, why).toEqual(before.stores);
      expect(s.board.open, why).toHaveLength(1);
      expect(s.running, why).toHaveLength(0);
    }
  });

  it('refuses when the stores are short, counting every slot that wants the same item', () => {
    const s = stocked();
    s.board.open = [kikimora()];
    s.stores['fire-pot'] = 1;
    expect(launch(s, prep({ bombs: ['fire-pot', 'fire-pot'] })).ok).toBe(false);
    s.stores['thornbane-oil'] = 1;
    expect(launch(s, prep({ oils: { halvar: 'thornbane-oil', zora: 'thornbane-oil' } })).ok).toBe(
      false,
    );
    expect(s.running).toHaveLength(0);
  });

  it('allows an oil and a potion on every hunter and two bombs, and spends exactly those', () => {
    const s = stocked();
    s.board.open = [kikimora()];
    const p = prep({
      oils: { halvar: 'thornbane-oil', zora: 'thornbane-oil', ostap: 'grave-oil' },
      potions: { halvar: 'hardwood-tonic', zora: 'quickfoot-tincture', ostap: 'mending-draught' },
      bombs: ['fire-pot', 'saltburst'],
    });
    expect(launch(s, p).ok).toBe(true);
    expect(s.stores['thornbane-oil']).toBe(1);
    expect(s.stores['grave-oil']).toBe(2);
    expect(s.stores['hardwood-tonic']).toBe(2);
    expect(s.stores['quickfoot-tincture']).toBe(2);
    expect(s.stores['mending-draught']).toBe(2);
    expect(s.stores['fire-pot']).toBe(2);
    expect(s.stores.saltburst).toBe(2);
    expect(s.stores['frost-pot']).toBe(3);
    expect(s.running[0]?.prep).toEqual(p);
  });

  it('the bomb slots are a balance constant', () => {
    expect(num('prep.bombSlots')).toBe(2);
  });

  it('what was spent stays spent whether the contract is won or lost', () => {
    const s = stocked();
    s.board.open = [
      kikimora('k1', { monster: 'draugr', tier: 5, location: 'barrow', village: 'ravenfell' }),
    ];
    expect(launch(s, prep({ bombs: ['fire-pot'] }), ['halvar']).ok).toBe(true);
    advance(s, s.time + 9 * HOUR);
    expect(s.results[0]?.success).toBe(false);
    expect(s.stores['fire-pot']).toBe(2);
  });
});

describe('seeds and odds (GDD §5.4.2)', () => {
  it('prepIds lists the preparation in a fixed order, whatever order it was built in', () => {
    const a = prep({
      oils: { zora: 'thornbane-oil', halvar: 'grave-oil' },
      potions: { ostap: 'mending-draught' },
      bombs: ['fire-pot', 'saltburst'],
    });
    const b = prep({
      oils: { halvar: 'grave-oil', zora: 'thornbane-oil' },
      potions: { ostap: 'mending-draught' },
      bombs: ['fire-pot', 'saltburst'],
    });
    expect(prepIds(a)).toEqual(prepIds(b));
    expect(prepIds(prep())).toEqual([]);
    expect(prepIds(a)).toContain('bomb:fire-pot');
    expect(prepIds(a)).toContain('halvar:oil:grave-oil');
  });

  it('the real fight’s seed includes the preparation, so a different preparation is a different roll', () => {
    expect(fightSeed('g', 'c1', ['halvar'], [])).toBe('g:fight:c1:halvar:');
    expect(fightSeed('g', 'c1', ['halvar'], prepIds(prep({ bombs: ['fire-pot'] })))).toBe(
      'g:fight:c1:halvar:bomb:fire-pot',
    );
  });

  it('the odds panel counts the preparation: matched oil and a weak bomb beat nothing', () => {
    const s = stocked();
    const party = ['halvar', 'zora', 'ostap'].map((h) => snapshotOf(s, h as 'halvar'));
    const c = kikimora('k1', { tier: 2, monster: 'huldra', location: 'forest' });
    const base = {
      gameSeed: s.meta.gameSeed,
      contractId: c.id,
      party,
      monster: monsterFor(s, c),
      location: c.location,
      rank: s.cycle.age,
    };
    const bare = computeOdds(base);
    const ready = computeOdds({
      ...base,
      prep: prep({
        oils: { halvar: 'thornbane-oil', zora: 'thornbane-oil', ostap: 'thornbane-oil' },
        bombs: ['fire-pot', 'saltburst'],
      }),
    });
    expect(ready.winChance).toBeGreaterThanOrEqual(bare.winChance);
    expect(ready.meanTicks).toBeLessThan(bare.meanTicks);
    expect(computeOdds({ ...base, prep: prep() }).winChance).toBe(bare.winChance);
  });

  it('an item that does nothing shows exactly the unprepared odds (Q15, D98)', () => {
    const s = stocked();
    const party = ['halvar', 'zora', 'ostap'].map((h) => snapshotOf(s, h as 'halvar'));
    const c = kikimora('k1', { tier: 2, monster: 'huldra', location: 'forest' });
    const base = {
      gameSeed: s.meta.gameSeed,
      contractId: c.id,
      party,
      monster: monsterFor(s, c),
      location: c.location,
      rank: s.cycle.age,
    };
    const bare = computeOdds(base);
    // Grave Oil does not match a Huldra, so the preview must draw the same dice.
    const useless = computeOdds({ ...base, prep: prep({ oils: { halvar: 'grave-oil' } }) });
    expect(useless.winChance).toBe(bare.winChance);
    expect(useless.meanTicks).toBe(bare.meanTicks);
    expect(useless.hunters).toEqual(bare.hunters);
  });
});

describe('well prepared (GDD §5.7, §5.4.3)', () => {
  const winParty = ['halvar', 'zora', 'ostap'] as const;

  it('needs a matching oil plus a bomb the species is weak to, or a Saltburst that cancelled an ability', () => {
    const oil = prep({ oils: { halvar: 'thornbane-oil' } });
    // Kikimora: Field & Forest Spirits; Fire ×1.5 (weak), Frost ×0.75 (not).
    expect(isWellPrepared('kikimora', { ...oil, bombs: ['fire-pot'] }, false)).toBe(true);
    expect(isWellPrepared('kikimora', { ...oil, bombs: ['frost-pot'] }, false)).toBe(false);
    expect(isWellPrepared('kikimora', oil, false)).toBe(false);
    expect(isWellPrepared('kikimora', { ...oil, bombs: ['saltburst'] }, false)).toBe(false);
    expect(isWellPrepared('kikimora', { ...oil, bombs: ['saltburst'] }, true)).toBe(true);
    // A mismatched oil is not "matching".
    const wrong = prep({ oils: { halvar: 'grave-oil' }, bombs: ['fire-pot'] });
    expect(isWellPrepared('kikimora', wrong, false)).toBe(false);
    // Weakness is ≥ 1.25: the Gaunt Wolf's Fire ×1.25 counts, the Vodyanoy's Fire ×0.5 does not.
    expect(
      isWellPrepared(
        'wolf',
        prep({ oils: { halvar: 'thornbane-oil' }, bombs: ['fire-pot'] }),
        false,
      ),
    ).toBe(false); // wrong family
    expect(
      isWellPrepared(
        'vodyanoy',
        prep({ oils: { halvar: 'drowned-bane-oil' }, bombs: ['fire-pot'] }),
        false,
      ),
    ).toBe(false);
    expect(
      isWellPrepared(
        'vodyanoy',
        prep({ oils: { halvar: 'drowned-bane-oil' }, bombs: ['frost-pot'] }),
        false,
      ),
    ).toBe(true);
  });

  it('a well-prepared success pays bounty × 1.5 and +1 trophy', () => {
    const s = stocked();
    s.board.open = [kikimora()];
    expect(
      launch(s, prep({ oils: { halvar: 'thornbane-oil' }, bombs: ['fire-pot'] }), [...winParty]).ok,
    ).toBe(true);
    const silver = s.resources.silver;
    advance(s, s.time + HOUR);
    const r = s.results[0];
    expect(r?.success).toBe(true);
    expect(r?.wellPrepared).toBe(true);
    expect(r?.bounty).toBe(78 * num('prep.wellPreparedBounty'));
    expect(r?.trophies).toBe(2);
    expect(s.resources.silver).toBeGreaterThanOrEqual(silver + 117);
    expect(s.stats.trophies).toBe(2);
    expect(s.stats.bountySilver).toBe(117);
  });

  it('an ordinary success pays the ordinary bounty', () => {
    const s = stocked();
    s.board.open = [kikimora()];
    expect(
      launch(s, prep({ oils: { halvar: 'grave-oil' }, bombs: ['fire-pot'] }), [...winParty]).ok,
    ).toBe(true);
    advance(s, s.time + HOUR);
    expect(s.results[0]).toMatchObject({
      success: true,
      wellPrepared: false,
      bounty: 78,
      trophies: 1,
    });
  });

  it('a failure is never well prepared, however well it was prepared', () => {
    const s = stocked();
    s.board.open = [
      kikimora('k1', { monster: 'draugr', tier: 5, location: 'barrow', village: 'ravenfell' }),
    ];
    expect(
      launch(s, prep({ oils: { halvar: 'grave-oil' }, bombs: ['fire-pot'] }), ['halvar']).ok,
    ).toBe(true);
    advance(s, s.time + 9 * HOUR);
    expect(s.results[0]).toMatchObject({
      success: false,
      wellPrepared: false,
      bounty: 0,
      trophies: 0,
    });
  });

  it('a recorded fight replays to the same result with its preparation', () => {
    const s = stocked();
    s.board.open = [kikimora()];
    const p = prep({
      oils: { halvar: 'thornbane-oil' },
      potions: { zora: 'quickfoot-tincture' },
      bombs: ['fire-pot', 'saltburst'],
    });
    expect(launch(s, p, [...winParty]).ok).toBe(true);
    advance(s, s.time + HOUR);
    const ref = s.log.recentFights[0];
    expect(ref?.prep).toEqual(p);
    if (!ref) throw new Error('no fight');
    const again = runFight({
      party: ref.party,
      monster: ref.monster,
      location: ref.location,
      rolls: seeded(ref.seed),
      prep: ref.prep,
    });
    expect(again.result).toBe(ref.result);
    expect(ref.seed).toBe(fightSeed(s.meta.gameSeed, 'k1', [...winParty], prepIds(p)));
  });
});
