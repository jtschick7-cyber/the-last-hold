// Plan T3.10: odds and Suggest when the monster is unidentified. GDD §5.6.3, §6.5, §9.5.
import { describe, expect, it } from 'vitest';
import { monsters } from '../../src/content/monsters';
import { runFight } from '../../src/core/combat';
import { seeded } from '../../src/core/rng';
import { num } from '../../src/core/balance-access';
import type { MonsterInstance } from '../../src/core/combat';
import { generateContract } from '../../src/core/contracts/board';
import { candidatesFor } from '../../src/core/contracts/candidates';
import { computeOdds, type OddsInput } from '../../src/core/contracts/odds';
import { bombIsWeak, oilMatches } from '../../src/core/contracts/prep';
import { suggestParty } from '../../src/core/contracts/suggest';
import { monsterFor, noteArrival, oddsTarget } from '../../src/core/investigation/knowledge';
import { possibleSpecies } from '../../src/core/investigation/clues';
import { advance } from '../../src/core/sim/advance';
import type { ContractInstance, GameState, Preparation } from '../../src/core/state/game-state';
import { snapshotOf } from '../../src/core/systems/hunters';
import { HOUR, T0, give, keepRich, run } from './helpers';

const world = (): GameState => {
  const s = keepRich('unc');
  give(s, 'halvar', 'zora', 'ostap');
  return s;
};

const contract = (over: Partial<ContractInstance> = {}): ContractInstance => ({
  id: 'u1',
  village: 'dubno-ford',
  monster: 'rusalka',
  tier: 2,
  location: 'river',
  arrivedAt: T0,
  revealed: 0,
  ...over,
});

const input = (
  s: GameState,
  c: ContractInstance,
  monster: OddsInput['monster'],
  over: Partial<OddsInput> = {},
): OddsInput => ({
  gameSeed: s.meta.gameSeed,
  contractId: c.id,
  party: ['halvar', 'zora'].map((h) => snapshotOf(s, h as 'halvar')),
  monster,
  location: c.location,
  rank: s.cycle.age,
  ...over,
});

describe('what the odds are about (GDD §5.6.3)', () => {
  it('an identified contract is about one species; an unidentified one is about every candidate left', () => {
    const s = world();
    const known = oddsTarget(s, contract({ revealed: 3 }));
    expect(Array.isArray(known)).toBe(false);
    expect(known).toMatchObject({ monster: 'rusalka', tier: 2 });
    const unknown = oddsTarget(s, contract());
    expect(Array.isArray(unknown)).toBe(true);
    expect((unknown as MonsterInstance[]).map((m) => m.monster)).toEqual(candidatesFor('river', 2));
  });

  it('never leaks the true species: the unidentified target is the same whichever species it really is', () => {
    const s = world();
    const a = oddsTarget(s, contract({ monster: 'rusalka' }));
    const b = oddsTarget(s, contract({ monster: 'wolf' }));
    expect(a).toEqual(b);
  });

  it('clues narrow it, and each candidate carries its own knowledge level', () => {
    const s = world();
    s.bestiary.wolf = { level: 4, kills: 10 };
    const pool = oddsTarget(s, contract()) as MonsterInstance[];
    expect(pool.find((m) => m.monster === 'wolf')?.knowledge).toBe(4);
    expect(pool.find((m) => m.monster === 'rusalka')?.knowledge).toBe(0);
    // One clue in: only the species that carry that tag remain.
    let c = contract();
    for (let i = 0; i < 400; i++) {
      c = contract({ id: `n${i}`, revealed: 1 });
      if (possibleSpecies(s.meta.gameSeed, c).length === 2) break;
    }
    expect((oddsTarget(s, c) as MonsterInstance[]).length).toBe(2);
  });
});

describe('averaging over candidates (GDD §5.6.3)', () => {
  it('a known species behaves exactly as before: one candidate, 500 samples', () => {
    const s = world();
    const c = contract({ revealed: 3 });
    const o = computeOdds(input(s, c, { monster: 'rusalka', tier: 2 }));
    expect(o.samples).toBe(num('odds.samples'));
    expect(o.candidates).toEqual([{ monster: 'rusalka', winChance: o.winChance }]);
    expect(o.assumesUnidentified).toBe(false);
  });

  it('the win chance is the equal-weight mean of the candidates, from about 500 fights in all', () => {
    const s = world();
    const c = contract({ tier: 4 });
    const pool = oddsTarget(s, c) as MonsterInstance[];
    const o = computeOdds(input(s, c, pool));
    expect(o.assumesUnidentified).toBe(true);
    expect(o.candidates.map((x) => x.monster)).toEqual(pool.map((m) => m.monster));
    const mean = o.candidates.reduce((t, x) => t + x.winChance, 0) / o.candidates.length;
    expect(o.winChance).toBeCloseTo(mean, 12);
    expect(o.winChance).toBeGreaterThan(0);
    expect(o.winChance).toBeLessThan(1);
    expect(o.samples).toBeGreaterThanOrEqual(num('odds.samples'));
    expect(o.samples).toBeLessThan(num('odds.samples') + pool.length);
    expect(o.margin).toBeGreaterThan(0);
  });

  it('each candidate’s share matches that species fought on its own, within the sampling error', () => {
    const s = world();
    const pool = oddsTarget(s, contract({ tier: 4, location: 'river' })) as MonsterInstance[];
    expect(pool.length).toBeGreaterThanOrEqual(2);
    const o = computeOdds(input(s, contract({ tier: 4 }), pool));
    for (const cand of pool) {
      const alone = computeOdds(input(s, contract({ tier: 4, id: `solo-${cand.monster}` }), cand));
      const share = o.candidates.find((x) => x.monster === cand.monster)?.winChance ?? -1;
      expect(Math.abs(share - alone.winChance), cand.monster).toBeLessThan(0.14);
    }
  });

  it('is honest about the real fight: over many contracts the average odds match the real win rate', () => {
    const s = world();
    let said = 0;
    let wins = 0;
    const n = 300;
    for (let i = 0; i < n; i++) {
      const c = { ...generateContract(s, i, T0), revealed: 0 };
      said += computeOdds(input(s, c, oddsTarget(s, c), { samples: 60 })).winChance;
      const real = runFight({
        party: input(s, c, monsterFor(s, c)).party,
        monster: monsterFor(s, c),
        location: c.location,
        rolls: seeded(`honest:${i}`),
        log: false,
      });
      if (real.result === 'win') wins += 1;
    }
    expect(Math.abs(said / n - wins / n)).toBeLessThan(0.07);
  });

  it('an oil only helps against the candidates it matches, each in its own fight', () => {
    const s = world();
    const c = contract({ tier: 3, location: 'field' });
    const pool = oddsTarget(s, c) as MonsterInstance[];
    expect(pool.map((m) => m.monster)).toContain('upyr');
    const oiled: Preparation = {
      oils: { halvar: 'grave-oil', zora: 'grave-oil', ostap: 'grave-oil' },
      potions: {},
      bombs: [],
    };
    const base = computeOdds(input(s, c, pool));
    const oil = computeOdds(input(s, c, pool, { prep: oiled }));
    const by = (o: typeof base, m: string) =>
      o.candidates.find((x) => x.monster === m)?.winChance ?? -1;
    expect(by(oil, 'upyr')).toBeGreaterThan(by(base, 'upyr'));
    expect(oilMatches('grave-oil', 'upyr')).toBe(true);
    // Mismatched candidates are not helped, beyond sampling noise (the preview seeds include the preparation).
    for (const m of pool.map((x) => x.monster).filter((x) => !oilMatches('grave-oil', x)))
      expect(Math.abs(by(oil, m) - by(base, m)), m).toBeLessThan(0.15);
  });

  it('helpers say which candidates an item works on', () => {
    expect(oilMatches('grave-oil', 'draugr')).toBe(true);
    expect(oilMatches('grave-oil', 'rusalka')).toBe(false);
    expect(oilMatches('drowned-bane-oil', 'nix')).toBe(true);
    expect(oilMatches('thornbane-oil', 'huldra')).toBe(true);
    expect(bombIsWeak('fire-pot', 'kikimora')).toBe(true);
    expect(bombIsWeak('fire-pot', 'vodyanoy')).toBe(false);
    expect(bombIsWeak('frost-pot', 'poludnitsa')).toBe(true);
    expect(bombIsWeak('saltburst', 'nix')).toBe(false);
    for (const m of Object.keys(monsters) as (keyof typeof monsters)[])
      expect(typeof bombIsWeak('fire-pot', m)).toBe('boolean');
  });

  it('a Mastered candidate is easier than the same species unknown', () => {
    const s = world();
    const c = contract({ tier: 2, location: 'river' });
    const pool0 = oddsTarget(s, c) as MonsterInstance[];
    s.bestiary.rusalka = { level: 4, kills: 10 };
    const pool4 = oddsTarget(s, c) as MonsterInstance[];
    const a = computeOdds(input(s, c, pool0)).candidates.find((x) => x.monster === 'rusalka');
    const b = computeOdds(input(s, c, pool4)).candidates.find((x) => x.monster === 'rusalka');
    expect(b?.winChance ?? 0).toBeGreaterThanOrEqual(a?.winChance ?? 1);
  });
});

describe('Suggest against an unidentified monster (GDD §6.5)', () => {
  it('stage 1 uses 20 samples per candidate; a known monster uses 50', () => {
    const s = world();
    const c = contract({ tier: 3 });
    const pool = oddsTarget(s, c) as MonsterInstance[];
    const free = ['halvar', 'zora', 'ostap'].map((h) => snapshotOf(s, h as 'halvar'));
    const base = {
      gameSeed: s.meta.gameSeed,
      contractId: c.id,
      available: free,
      location: c.location,
      rank: s.cycle.age,
      maxParty: 3,
    };
    const unknown = suggestParty({ ...base, monster: pool });
    const known = suggestParty({ ...base, monster: pool[0] as MonsterInstance });
    expect(unknown?.stage1PerParty).toBe(num('suggest.stage1PerCandidate') * pool.length);
    expect(known?.stage1PerParty).toBe(num('suggest.stage1Samples'));
    expect(unknown?.odds.assumesUnidentified).toBe(true);
    expect(unknown?.party.length).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const s = world();
    const c = contract({ tier: 3 });
    const pool = oddsTarget(s, c) as MonsterInstance[];
    const free = ['halvar', 'zora', 'ostap'].map((h) => snapshotOf(s, h as 'halvar'));
    const args = {
      gameSeed: s.meta.gameSeed,
      contractId: c.id,
      available: free,
      location: c.location,
      rank: s.cycle.age,
      maxParty: 3,
      monster: pool,
    };
    expect(suggestParty(args)?.party.map((h) => h.id)).toEqual(
      suggestParty(args)?.party.map((h) => h.id),
    );
  });
});

describe('unidentified contracts on the board (GDD §5.6)', () => {
  it('arrive with no clues unless the species is Mastered, and make every candidate Sighted', () => {
    const s = keepRich('arr');
    for (let i = 0; i < 12; i++) {
      const c = generateContract(s, i, T0);
      expect(c.revealed).toBe(0);
      noteArrival(s, c);
    }
    s.bestiary.nix = { level: 4, kills: 10 };
    let mastered = false;
    for (let i = 12; i < 400 && !mastered; i++) {
      const c = generateContract(s, i, T0);
      if (c.monster === 'nix') {
        expect(c.revealed).toBe(3);
        mastered = true;
      } else expect(c.revealed).toBe(0);
    }
    expect(mastered).toBe(true);
  });

  it('launching one: the Reckless line uses the averaged odds shown, the real fight is the true species', () => {
    const s = world();
    s.board.open = [
      contract({
        id: 'k1',
        monster: 'kikimora',
        tier: 1,
        location: 'field',
        village: 'kozly-hollow',
      }),
    ];
    const shown = computeOdds(
      input(
        s,
        s.board.open[0] as ContractInstance,
        oddsTarget(s, s.board.open[0] as ContractInstance),
      ),
    );
    expect(
      run(s, {
        type: 'contract.launch',
        contract: 'k1',
        party: ['halvar', 'zora', 'ostap'],
        confirmReckless: true,
      }).ok,
    ).toBe(true);
    const r = s.running[0];
    expect(r?.winChance).toBeCloseTo(shown.winChance, 12);
    expect(r?.reckless).toBe(shown.reckless);
    advance(s, s.time + HOUR);
    expect(s.log.recentFights[0]?.monster).toMatchObject({ monster: 'kikimora' });
    expect(s.bestiary.kikimora?.level).toBeGreaterThanOrEqual(2); // fighting it identified it
  });
});
