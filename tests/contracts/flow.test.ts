// Plan T2.11, T2.12b, T2.13–T2.15: launching, completion at the timer's end,
// injuries and death, the roster, gear, and the Trophy Hall.
import { describe, expect, it } from 'vitest';
import { hunters, type HunterId } from '../../src/content/hunters';
import { computeOdds } from '../../src/core/contracts/odds';
import { provisions } from '../../src/core/contracts/rewards';
import { advance } from '../../src/core/sim';
import type { ContractInstance, GameState, HunterState } from '../../src/core/state/game-state';
import { snapshotOf } from '../../src/core/systems/hunters';
import { productionRate } from '../../src/core/systems/production';
import { HOUR, T0, give, hamletWithMine, keepRich, run } from './helpers';

const hunterOf = (s: GameState, id: HunterId): HunterState => {
  const h = s.hunters[id];
  if (!h) throw new Error(`${id} is not owned`);
  return h;
};

const put = (s: GameState, over: Partial<ContractInstance> = {}): ContractInstance => {
  const c: ContractInstance = {
    id: `t${s.board.open.length}-${over.monster ?? 'wolf'}-${over.tier ?? 1}`,
    village: 'mirograd',
    monster: 'wolf',
    tier: 1,
    location: 'field',
    arrivedAt: s.time,
    ...over,
  };
  s.board.open.push(c);
  return c;
};

describe('launching (GDD §5.4.2)', () => {
  it('refuses what cannot be launched, and says why', () => {
    const s = hamletWithMine();
    const c = put(s);
    const bad = (cmd: Parameters<typeof run>[1]) => {
      const r = run(s, cmd);
      expect(r.ok).toBe(false);
      return r.ok ? '' : r.reason;
    };
    expect(bad({ type: 'contract.launch', contract: 'nope', party: ['zora'] })).toMatch(/board/);
    expect(bad({ type: 'contract.launch', contract: c.id, party: [] })).toMatch(/at least one/);
    expect(bad({ type: 'contract.launch', contract: c.id, party: ['zora', 'zora'] })).toMatch(
      /once/,
    );
    expect(bad({ type: 'contract.launch', contract: c.id, party: ['ostap'] })).toMatch(
      /active roster/,
    );
    s.resources.food = 0;
    expect(bad({ type: 'contract.launch', contract: c.id, party: ['zora'] })).toMatch(/food/);
    expect(s.running).toHaveLength(0);
    expect(s.board.open).toHaveLength(1); // nothing changed
  });

  it('Hamlet parties take at most 2 hunters; Keep tiers 1–3 take 3, tiers 4–5 take 4', () => {
    const h = hamletWithMine();
    give(h, 'ostap');
    const c = put(h);
    h.resources.food = 1e6;
    const r = run(h, {
      type: 'contract.launch',
      contract: c.id,
      party: ['halvar', 'zora', 'ostap'],
    });
    expect(r.ok).toBe(false);
    expect(r.ok ? '' : r.reason).toMatch(/at most 2/);

    const k = keepRich();
    k.board.open = [];
    const low = put(k, { tier: 2, monster: 'kikimora' });
    expect(
      run(k, {
        type: 'contract.launch',
        contract: low.id,
        party: ['halvar', 'zora', 'ostap', 'bjarna'],
      }).ok,
    ).toBe(false);
    const high = put(k, { tier: 4, monster: 'bies', location: 'forest' });
    expect(
      run(k, {
        type: 'contract.launch',
        contract: high.id,
        party: ['halvar', 'zora', 'ostap', 'bjarna'],
        confirmReckless: true,
      }).ok,
    ).toBe(true);
  });

  it('pays provisions at launch, removes the contract from the board, and runs for its tier', () => {
    const s = keepRich();
    s.board.open = [];
    const c = put(s, { tier: 2, monster: 'kikimora' });
    const food = s.resources.food;
    expect(run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora'] }).ok).toBe(
      true,
    );
    expect(s.resources.food).toBe(food - provisions(s, 2, 2).value);
    expect(s.board.open).toHaveLength(0);
    expect(s.running).toHaveLength(1);
    expect(s.running[0]?.endsAt).toBe(s.time + 1 * HOUR); // tier 2 lasts 1 h
  });

  it('a Reckless contract needs the confirmation, and records that it was given', () => {
    const s = keepRich();
    s.board.open = [];
    const c = put(s, { tier: 5, monster: 'leshy', location: 'forest' });
    const odds = computeOdds({
      gameSeed: s.meta.gameSeed,
      contractId: c.id,
      party: [snapshotOf(s, 'zora')],
      monster: { monster: c.monster, tier: c.tier },
      location: c.location,
      rank: 'keep',
    });
    expect(odds.reckless).toBe(true);
    const refused = run(s, { type: 'contract.launch', contract: c.id, party: ['zora'] });
    expect(refused.ok).toBe(false);
    expect(refused.ok ? '' : refused.reason).toMatch(/Reckless/);
    expect(s.running).toHaveLength(0);
    expect(
      run(s, { type: 'contract.launch', contract: c.id, party: ['zora'], confirmReckless: true })
        .ok,
    ).toBe(true);
    expect(s.running[0]?.reckless).toBe(true);
  });

  it('busy hunters cannot be sent twice', () => {
    const s = keepRich();
    s.board.open = [];
    const a = put(s, { tier: 1, monster: 'kikimora' });
    const b = put(s, { tier: 1, monster: 'wolf' });
    expect(run(s, { type: 'contract.launch', contract: a.id, party: ['halvar'] }).ok).toBe(true);
    expect(run(s, { type: 'contract.launch', contract: b.id, party: ['halvar'] }).ok).toBe(false);
    expect(run(s, { type: 'contract.launch', contract: b.id, party: ['zora'] }).ok).toBe(true);
  });
});

describe('completion (GDD §5.4.3, B9)', () => {
  const launched = () => {
    const s = keepRich('done');
    s.board.open = [];
    const c = put(s, { tier: 1, monster: 'kikimora', location: 'field' });
    run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora', 'ostap'] });
    return { s, c };
  };

  it('applies rewards the moment the timer ends, with no one watching', () => {
    const { s, c } = launched();
    const silver = s.resources.silver;
    advance(s, s.time + 29 * 60_000);
    expect(s.results).toHaveLength(0);
    advance(s, T0 + 40 * 60_000); // tier 1 lasts 30 minutes
    expect(s.results).toHaveLength(1);
    const r = s.results[0];
    expect(r?.contractId).toBe(c.id);
    expect(r?.success).toBe(true);
    expect(r?.at).toBe(T0 + 30 * 60_000);
    expect(s.resources.silver).toBe(silver + (r?.bounty ?? 0));
    expect(r?.bounty).toBe(72);
    expect(s.stats).toMatchObject({ contractsWon: 1, trophies: 1, bountySilver: 72 });
    expect(s.stats.kills.kikimora).toBe(1);
    expect(s.board.tierWins[0]).toBe(4); // 3 before
    expect(s.running).toHaveLength(0);
  });

  it('hunters return at once, and gain XP; Collect only clears the list', () => {
    const { s } = launched();
    advance(s, T0 + 31 * 60_000);
    expect(s.hunters.zora?.xp).toBe(20);
    expect(s.hunters.zora?.record.won).toBe(1);
    expect(run(s, { type: 'contract.launch', contract: 'x', party: ['zora'] }).ok).toBe(false);
    const kept = { ...s.stats };
    expect(run(s, { type: 'results.collect' }).ok).toBe(true);
    expect(s.results).toEqual([]);
    expect(s.stats).toEqual(kept);
    expect(run(s, { type: 'results.collect' }).ok).toBe(false);
  });

  it('levels hunters up from XP: 50 × 1.5^(L−1) to the next level, capped at 10', () => {
    const { s } = launched();
    hunterOf(s, 'zora').xp = 45; // 20 more makes 65: level 2 at 50, 15 left
    advance(s, T0 + 31 * 60_000);
    expect(s.hunters.zora?.level).toBe(2);
    expect(s.hunters.zora?.xp).toBe(15);
    expect(s.results[0]?.levelUps).toContainEqual({ hunter: 'zora', level: 2 });
    hunterOf(s, 'halvar').level = 10;
    hunterOf(s, 'halvar').xp = 5;
    const again = keepRich('cap');
    hunterOf(again, 'halvar').level = 10;
    again.board.open = [];
    const c = put(again, { tier: 1, monster: 'kikimora' });
    run(again, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora'] });
    advance(again, T0 + 31 * 60_000);
    expect(again.hunters.halvar?.level).toBe(10);
    expect(again.hunters.halvar?.xp).toBe(0);
  });

  it('catches up through offline time: a day away resolves everything that came due', () => {
    const { s } = launched();
    advance(s, T0 + 24 * HOUR);
    expect(s.results).toHaveLength(1);
    expect(s.board.open.length).toBe(Math.min(6, 12)); // arrivals every 2 h, capped at 6
  });
});

describe('injuries and death (GDD §5.3.7)', () => {
  /** Finds a contract id whose fight the party loses, so the aftermath can be checked. */
  const loses = (build: (id: string) => GameState): { s: GameState; id: string } => {
    for (let i = 0; i < 400; i++) {
      const id = `x${i}`;
      const s = build(id);
      advance(s, T0 + 9 * HOUR);
      if (s.results[0] && !s.results[0].success) return { s, id };
    }
    throw new Error('no losing fight found');
  };

  it('a downed hunter on an ordinary contract is Wounded for 2 h × tier; the loser earns no bounty', () => {
    const { s } = loses((id) => {
      const s = keepRich('wound');
      s.board.open = [];
      const c = put(s, { id, tier: 5, monster: 'nix', location: 'river' });
      // About 68% for this party, so a loss is an ordinary bad day, not a Reckless one.
      const r = run(s, {
        type: 'contract.launch',
        contract: c.id,
        party: ['halvar', 'zora', 'ostap'],
      });
      expect(r.ok).toBe(true);
      return s;
    });
    const r = s.results[0];
    expect(r?.bounty).toBe(0);
    expect(r?.trophies).toBe(0);
    expect(s.stats.contractsLost).toBe(1);
    expect(r?.xp).toBe(50); // half of 20 × 5
    const kinds = r?.injuries.map((i) => i.kind) ?? [];
    expect(kinds.length).toBeGreaterThan(0);
    for (const k of kinds) expect(['bruised', 'wounded']).toContain(k); // never grievous or dead: not Reckless
    for (const w of r?.injuries.filter((i) => i.kind === 'wounded') ?? []) {
      const per = hunters[w.hunter].traits.includes('hard-to-kill') ? 0.7 : 1;
      expect(w.until - (r?.at ?? 0)).toBe(Math.round(2 * HOUR * 5 * per));
    }
  });

  it('recovery runs on real time, ends as an event, and a recovering hunter cannot be sent', () => {
    const { s } = loses((id) => {
      const s = keepRich('recover');
      s.board.open = [];
      const c = put(s, { id, tier: 5, monster: 'nix', location: 'river' });
      run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora', 'ostap'] });
      return s;
    });
    const injured = s.results[0]?.injuries.find((i) => i.kind === 'wounded');
    expect(injured).toBeDefined();
    if (!injured) return;
    expect(s.hunters[injured.hunter]?.recovery).not.toBeNull();
    const c = put(s, { tier: 1, monster: 'kikimora' });
    expect(run(s, { type: 'contract.launch', contract: c.id, party: [injured.hunter] }).ok).toBe(
      false,
    );
    const events = advance(s, injured.until + 1).events;
    expect(events.some((e) => e.type === 'recovered' && e.hunter === injured.hunter)).toBe(true);
    expect(s.hunters[injured.hunter]?.recovery).toBeNull();
  });

  it('only a confirmed Reckless contract can kill a hunter, and the fallen are recorded', () => {
    let died = 0;
    for (let i = 0; i < 40; i++) {
      const s = keepRich(`death${i}`);
      s.board.open = [];
      const c = put(s, { id: `d${i}`, tier: 5, monster: 'leshy', location: 'forest' });
      run(s, {
        type: 'contract.launch',
        contract: c.id,
        party: ['zora', 'halvar', 'radek'],
        confirmReckless: true,
      });
      advance(s, T0 + 9 * HOUR);
      const dead = s.results[0]?.injuries.filter((x) => x.kind === 'dead') ?? [];
      for (const d of dead) {
        died += 1;
        expect(s.hunters[d.hunter]).toBeUndefined();
        expect(s.roster.active).not.toContain(d.hunter);
        expect(s.fallen.some((f) => f.hunter === d.hunter && f.contractId === c.id)).toBe(true);
      }
    }
    expect(died).toBeGreaterThan(0);
  });

  it('never kills on an unconfirmed-Reckless-free contract: no death without the Reckless flag', () => {
    for (let i = 0; i < 60; i++) {
      const s = keepRich(`safe${i}`);
      s.board.open = [];
      const c = put(s, { id: `s${i}`, tier: 3, monster: 'upyr', location: 'field' });
      const r = run(s, {
        type: 'contract.launch',
        contract: c.id,
        party: ['halvar', 'zora', 'ostap'],
      });
      if (!r.ok) continue; // Reckless here: not what this test is about
      advance(s, T0 + 9 * HOUR);
      expect(s.results[0]?.injuries.some((x) => x.kind === 'dead')).toBe(false);
    }
  });

  it('story hunters never die: a downed one is Grievously Wounded instead', () => {
    for (let i = 0; i < 40; i++) {
      const s = keepRich(`story${i}`);
      s.board.open = [];
      const c = put(s, { id: `y${i}`, tier: 5, monster: 'leshy', location: 'forest' });
      run(s, {
        type: 'contract.launch',
        contract: c.id,
        party: ['toma', 'ostap', 'sigrun'],
        confirmReckless: true,
      });
      advance(s, T0 + 9 * HOUR);
      expect(s.results[0]?.injuries.some((x) => x.kind === 'dead')).toBe(false);
      for (const id of ['toma', 'ostap', 'sigrun'] as const) expect(s.hunters[id]).toBeDefined();
    }
  });

  it('a fallen hunter returns as a candidate 3 days after death', () => {
    const s = keepRich('return');
    Reflect.deleteProperty(s.hunters, 'radek');
    s.roster.active = s.roster.active.filter((h) => h !== 'radek');
    s.fallen.push({ hunter: 'radek', diedAt: s.time, cycle: 1, contractId: 'c0' });
    s.stats.kills.upyr = 1;
    const ids = (g: GameState) => candidatesIds(g);
    expect(ids(s)).not.toContain('radek');
    advance(s, T0 + 2 * 24 * HOUR);
    expect(ids(s)).not.toContain('radek');
    advance(s, T0 + 3 * 24 * HOUR);
    expect(ids(s)).toContain('radek');
  });
});

import { candidates } from '../../src/core/systems/hunters';
const candidatesIds = (s: GameState): string[] => candidates(s).map((c) => c.id);

describe('the roster (GDD §5.3.1)', () => {
  it('candidates arrive when their condition is met; recruiting costs their silver price', () => {
    const s = hamletWithMine();
    expect(candidatesIds(s)).toEqual([]);
    s.stats.contractsWon = 1;
    expect(candidatesIds(s)).toEqual(['ostap']);
    s.resources.silver = 100;
    expect(run(s, { type: 'hunter.recruit', hunter: 'ostap' }).ok).toBe(false); // costs 150
    s.resources.silver = 200;
    expect(run(s, { type: 'hunter.recruit', hunter: 'ostap' }).ok).toBe(true);
    expect(s.resources.silver).toBe(50);
    expect(s.hunters.ostap).toMatchObject({ level: 1, xp: 0 });
    expect(s.roster.active).toContain('ostap'); // there was room (3 in Hamlet)
    expect(run(s, { type: 'hunter.recruit', hunter: 'ostap' }).ok).toBe(false);
  });

  it('all eight unlock conditions work', () => {
    const s = keepRich('unlocks');
    for (const id of ['ostap', 'bjarna', 'vesna', 'radek', 'sigrun', 'toma'] as const) {
      Reflect.deleteProperty(s.hunters, id);
    }
    s.roster.active = ['halvar', 'zora'];
    s.buildings.smithy = 4;
    expect(candidatesIds(s)).toEqual([]);
    s.stats.contractsWon = 3;
    expect(candidatesIds(s).sort()).toEqual(['bjarna', 'ostap']);
    s.stats.winsByLocation.river = 1;
    s.stats.kills.upyr = 1;
    s.buildings.smithy = 5;
    s.stats.bountySilver = 2000;
    expect(candidatesIds(s).sort()).toEqual([
      'bjarna',
      'ostap',
      'radek',
      'sigrun',
      'toma',
      'vesna',
    ]);
  });

  it('caps the active roster at 3 in Hamlet and 3 + Barracks levels in the Keep', () => {
    const s = hamletWithMine();
    give(s, 'ostap', 'bjarna');
    s.roster.active = ['halvar', 'zora', 'ostap'];
    expect(run(s, { type: 'roster.set', hunter: 'bjarna', active: true }).ok).toBe(false);
    expect(run(s, { type: 'roster.set', hunter: 'ostap', active: false }).ok).toBe(true);
    expect(run(s, { type: 'roster.set', hunter: 'bjarna', active: true }).ok).toBe(true);
    const k = keepRich();
    k.buildings.barracks = 2;
    k.roster.active = ['halvar', 'zora', 'ostap', 'bjarna', 'vesna'];
    expect(run(k, { type: 'roster.set', hunter: 'radek', active: true }).ok).toBe(false);
    k.buildings.barracks = 3;
    expect(run(k, { type: 'roster.set', hunter: 'radek', active: true }).ok).toBe(true);
  });

  it('swapping is refused for a hunter on a contract', () => {
    const s = keepRich();
    s.board.open = [];
    const c = put(s, { tier: 1, monster: 'kikimora' });
    run(s, { type: 'contract.launch', contract: c.id, party: ['zora'] });
    const r = run(s, { type: 'roster.set', hunter: 'zora', active: false });
    expect(r.ok).toBe(false);
    expect(r.ok ? '' : r.reason).toMatch(/contract/);
  });
});

describe('gear (GDD §5.3.6)', () => {
  it('the Smithy upgrades a slot in place, tier by tier, for the listed cost', () => {
    const s = keepRich();
    s.resources = { food: 1000, wood: 1000, iron: 1000, silver: 1000 };
    s.buildings.smithy = 1;
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(true);
    expect(s.hunters.zora?.weapon).toBe('iron-blade');
    expect(s.resources.iron).toBe(940);
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(false); // Smithy 3
    s.buildings.smithy = 3;
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(true);
    expect(s.hunters.zora?.weapon).toBe('steel-blade');
    expect(s.resources).toMatchObject({ iron: 690, wood: 950 });
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'armor' }).ok).toBe(true);
    expect(s.hunters.zora?.armor).toBe('hide-armor');
    expect(s.resources.food).toBe(970);
  });

  it('refuses when poor or already at the top', () => {
    const s = keepRich();
    s.resources.iron = 10;
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(false);
    s.resources.iron = 1e6;
    s.resources.silver = 1e6;
    s.buildings.smithy = 6;
    for (let i = 0; i < 3; i++)
      expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(true);
    expect(s.hunters.zora?.weapon).toBe('silvered-blade');
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(false);
  });

  it('gear shows up in the fight snapshot', () => {
    const s = keepRich();
    hunterOf(s, 'zora').weapon = 'steel-blade';
    expect(snapshotOf(s, 'zora')).toMatchObject({
      weapon: 'steel-blade',
      level: 1,
      name: hunters.zora.name,
    });
  });
});

describe('Trophy Hall (GDD §5.4.4)', () => {
  it('can be built once, and adds +0.5% to production per trophy earned (silver excluded)', () => {
    const s = keepRich();
    expect(run(s, { type: 'build.buy', building: 'trophy-hall', count: 1 }).ok).toBe(true);
    expect(run(s, { type: 'build.buy', building: 'trophy-hall', count: 1 }).ok).toBe(false);
    const before = productionRate(s, 'food').value;
    s.stats.trophies = 40;
    const after = productionRate(s, 'food').value;
    expect(after / before).toBeCloseTo(1.2, 10);
    expect(JSON.stringify(productionRate(s, 'food').breakdown)).toContain('trophies');
    s.peasants.jobs['silver-digger'] = 1;
    s.stats.trophies = 0;
    const silver = productionRate(s, 'silver').value;
    s.stats.trophies = 40;
    expect(productionRate(s, 'silver').value).toBe(silver);
  });

  it('does nothing before it is built, and trophies are never spent', () => {
    const s = keepRich();
    const before = productionRate(s, 'food').value;
    s.stats.trophies = 100;
    expect(productionRate(s, 'food').value).toBe(before);
  });
});

import { hunterStat } from '../../src/core/systems/hunters';
describe('displayed hunter stats (GDD §5.3.2, A14)', () => {
  it('match what the fight uses: base, level scaling, gear and traits', () => {
    const s = keepRich();
    hunterOf(s, 'zora').level = 3;
    hunterOf(s, 'zora').weapon = 'steel-blade';
    hunterOf(s, 'zora').armor = 'mail';
    const stat = (n: 'health' | 'might' | 'armor' | 'speed') => hunterStat(s, 'zora', n).value;
    expect(stat('health')).toBe(120); // 100 × (1 + 0.1 × 2)
    expect(stat('might')).toBeCloseTo(20 * 1.2 + 9, 10);
    expect(stat('armor')).toBe(8); // 3 + 5
    expect(stat('speed')).toBe(16); // 13 + Quick 3
    const snap = snapshotOf(s, 'zora');
    expect(snap.level).toBe(3);
    const labels = (hunterStat(s, 'zora', 'might').breakdown.children ?? []).map((c) => c.label);
    expect(labels).toEqual(['Base (Zora)', 'Level 3', 'Steel Blade']);
    expect((hunterStat(s, 'zora', 'speed').breakdown.children ?? []).map((c) => c.label)).toEqual([
      'Base (Zora)',
      'Quick',
    ]);
  });
});

describe('the debug time skip moves the whole world (GDD §9.10)', () => {
  it('a skip finishes running contracts, ends recoveries, and refills the board', () => {
    const s = keepRich('skip');
    s.board.open = [];
    const c = put(s, { tier: 1, monster: 'kikimora' });
    run(s, { type: 'contract.launch', contract: c.id, party: ['halvar', 'zora'] });
    expect(run(s, { type: 'debug.skip', ms: 3 * HOUR }).ok).toBe(true);
    expect(s.results).toHaveLength(1);
    expect(s.running).toHaveLength(0);
    expect(s.board.open.length).toBeGreaterThan(0);
  });
});
