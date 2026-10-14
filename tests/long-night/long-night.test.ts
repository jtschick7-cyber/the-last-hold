// Plan T4.8 (GDD §5.9.7, D110): the Long Night, tested row by row against the
// "resets / kept" table, in its order: running contracts finish, the stand, the
// conversion, the reset, the new cycle.
import { describe, expect, it } from 'vitest';
import { start } from '../../src/content/start';
import type { GameState } from '../../src/core/state/game-state';
import { keptLevel } from '../../src/core/long-night/levels';
import { embersPayout } from '../../src/core/stand/embers';
import { candidates } from '../../src/core/systems/hunters';
import { HOUR, T0, keepRich, run } from '../contracts/helpers';

const SIX = ['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const;

/** A Bastion hold with something in every part of the table. */
const bastion = (): GameState => {
  const s = keepRich('long-night');
  s.board.open = [
    {
      id: 'run1',
      village: 'dubno-ford',
      monster: 'kikimora',
      tier: 1,
      location: 'field',
      arrivedAt: T0,
      revealed: 3,
    },
    {
      id: 'left',
      village: 'velkvik',
      monster: 'nix',
      tier: 5,
      location: 'river',
      arrivedAt: T0,
      revealed: 3,
    },
  ];
  expect(run(s, { type: 'contract.launch', contract: 'run1', party: ['sigrun'] }).ok).toBe(true);
  s.cycle.age = 'bastion';
  s.hunters.halvar = { ...(s.hunters.halvar ?? never()), level: 6, xp: 40, weapon: 'iron-blade' };
  s.hunters.zora = {
    ...(s.hunters.zora ?? never()),
    level: 5,
    recovery: { kind: 'wounded', until: T0 + 9 * HOUR },
  };
  s.hunters.ostap = { ...(s.hunters.ostap ?? never()), level: 4, armor: 'hide-armor' };
  s.fallen.push({ hunter: 'stanko', diedAt: T0, cycle: 1, contractId: 'cx', level: 9 });
  s.bestiary.wolf = { level: 3, kills: 5 };
  s.stores['fire-pot'] = 3;
  s.stores.yarrow = 7;
  s.queues.brewing = [
    {
      kind: 'brew',
      item: 'saltburst',
      doneAt: null,
      paid: { ingredients: { 'rime-salt': 2 }, resources: { silver: 1 } },
    },
  ];
  s.garden.nextAt = T0 + HOUR;
  s.threat = 30;
  s.stats.trophies = 25;
  s.stats.contractsWon = 40;
  s.embers = 5;
  s.upgrades['kept-coals'] = 1;
  s.book.properties['wolf-fang'] = [1]; // a discovery, and a pair tried
  s.book.tried = ['wolf-fang+yarrow'];
  s.skills.lore = 45;
  s.relics = [{ id: 'tally-stick', cycle: 1 }];
  s.scenes = ['vow'];
  s.settings = { ...s.settings, theme: 'light' };
  s.buildings.walls = 2;
  s.peasants.autoSettle = false;
  s.time = T0 + 10 * 60_000;
  return s;
};
const never = (): never => {
  throw new Error('missing hunter');
};

describe('the Long Night (GDD §5.9.7)', () => {
  const before = bastion();
  const s = structuredClone(before);
  const res = run(s, { type: 'stand.make', party: [...SIX], prep: { oils: {}, potions: {} } });
  const stand = s.cycles[0]?.stand;

  it('is made from Bastion only, once per cycle, with up to 6 active hunters', () => {
    expect(res.ok).toBe(true);
    const keep = bastion();
    keep.cycle.age = 'keep';
    expect(run(keep, { type: 'stand.make', party: ['halvar'] }).ok).toBe(false);
    const seven = bastion();
    expect(run(seven, { type: 'stand.make', party: [...SIX, 'bjarna'] }).ok).toBe(false);
    expect(run(bastion(), { type: 'stand.make', party: [...SIX, 'toma'] }).ok).toBe(false);
    expect(run(bastion(), { type: 'stand.make', party: [] }).ok).toBe(false);
    const twice = bastion();
    twice.cycles[0] = { ...(twice.cycles[0] ?? never()), stand: stand ?? never() };
    expect(run(twice, { type: 'stand.make', party: ['halvar'] }).ok).toBe(false);
  });

  it('1. contracts still running finish on the spot with their real result', () => {
    expect(before.running).toHaveLength(1);
    expect(s.running).toEqual([]);
    expect(s.stats.contractsWon + s.stats.contractsLost).toBe(
      before.stats.contractsWon + before.stats.contractsLost + 1,
    );
  });

  it('2–3. the stand is recorded, and its Embers and relics are converted', () => {
    if (!stand) throw new Error('no stand');
    expect(stand.party.map((h) => h.id)).toEqual([...SIX]);
    // The running tier-1 contract finished first; its success took 0.76 × tier off Threat (D138).
    const won = s.stats.contractsWon > before.stats.contractsWon;
    expect(stand.threat).toBeCloseTo(won ? 29.24 : 33);
    expect(stand.defenses).toEqual({ walls: 2, watchtower: 0 });
    expect(stand.bombs).toEqual({ 'fire-pot': 3 });
    expect(stand.relics).toEqual(['tally-stick']);
    expect(stand.rank).toBe('bastion');
    expect(stand.seen).toBe(false);
    // The trophies counted include the contract that just finished (A7).
    const trophies = s.stats.trophies; // reset to 0 after conversion
    expect(trophies).toBe(0);
    const want = embersPayout({
      rank: 'bastion',
      waves: stand.wavesHeld,
      threat: stand.threat,
      trophies: stand.embers.trophies,
    });
    expect(stand.embers.total).toBe(want.value);
    expect(s.embers).toBe(5 + stand.embers.total);
    expect(s.relics.map((r) => r.id)).toEqual(['tally-stick', ...stand.relicsFound]);
    for (const r of s.relics.slice(1)) expect(r.cycle).toBe(1);
  });

  describe('resets', () => {
    it('Rank back to Hamlet; buildings, resources, peasants to the start', () => {
      expect(s.cycle.age).toBe('hamlet');
      for (const [id, n] of Object.entries(s.buildings))
        expect(n, id).toBe(start.buildings[id as keyof typeof start.buildings] ?? 0);
      expect(s.resources).toEqual(start.resources);
      expect(s.peasants.total).toBe(3);
      expect(s.peasants.jobs).toEqual(start.jobs);
    });

    it('the contract board, tier unlocks, unread results', () => {
      expect(s.board.open).toEqual([]);
      expect(s.board.opened).toBe(false);
      expect(s.board.nextArrivalAt).toBeNull();
      expect(s.board.tierWins).toEqual([0, 0, 0, 0, 0]);
      expect(s.board.arrivals).toBe(before.board.arrivals); // ids never repeat
      expect(s.results).toEqual([]);
    });

    it('stores, the brewing queue, Lodge slots, the garden', () => {
      expect(Object.values(s.stores).every((n) => n === 0)).toBe(true);
      expect(s.queues).toEqual({ brewing: [], investigation: [] });
      expect(s.garden).toEqual({ nextAt: null });
    });

    it('gear, injuries, Threat, trophies this cycle', () => {
      for (const h of Object.values(s.hunters)) {
        expect(h?.weapon).toBeNull();
        expect(h?.armor).toBeNull();
        expect(h?.recovery).toBeNull();
      }
      expect(s.threat).toBe(0);
      expect(s.stats.trophies).toBe(0);
    });
  });

  describe('kept', () => {
    it('every hunter, with half the levels above 1, rounded down (6 → 3, 5 → 3, 4 → 2), XP 0', () => {
      expect(Object.keys(s.hunters).sort()).toEqual(Object.keys(before.hunters).sort());
      expect(s.hunters.halvar?.level).toBe(3);
      expect(s.hunters.zora?.level).toBe(3);
      expect(s.hunters.ostap?.level).toBe(2);
      expect(s.hunters.bjarna?.level).toBe(1);
      for (const h of Object.values(s.hunters)) expect(h?.xp).toBe(0);
      expect(s.hunters.halvar?.record).toEqual(before.hunters.halvar?.record);
      expect([keptLevel(6, 0.5), keptLevel(5, 0.5), keptLevel(4, 0.5), keptLevel(1, 0.5)]).toEqual([
        3, 3, 2, 1,
      ]);
    });

    it('the active roster goes back to 3: the three highest levels; the rest wait in the reserve', () => {
      expect(s.roster.active).toEqual(['halvar', 'zora', 'ostap']);
    });

    it('the dead return as candidates at the next Long Night, levels halved like everyone', () => {
      expect(before.fallen.some((f) => f.hunter === 'stanko')).toBe(true);
      expect(s.fallen.find((f) => f.hunter === 'stanko')?.returnLevel).toBe(5);
      s.bestiary.wolf = { level: 3, kills: 5 }; // Stanko's unlock: the Gaunt Wolf Studied
      expect(candidates(s).map((c) => c.id)).toContain('stanko');
      const t = structuredClone(s);
      t.resources.silver = 1e6;
      expect(run(t, { type: 'hunter.recruit', hunter: 'stanko' }).ok).toBe(true);
      expect(t.hunters.stanko?.level).toBe(5);
    });

    it('the recipe book and the warden skills (GDD §5.9.7, v0.6)', () => {
      expect(s.book).toEqual(before.book);
      expect(s.skills).toEqual(before.skills);
    });

    it('the bestiary, Embers, relics, warden upgrades', () => {
      expect(s.bestiary.wolf).toEqual(before.bestiary.wolf);
      expect(s.upgrades).toEqual(before.upgrades);
      expect(s.embers).toBeGreaterThanOrEqual(before.embers);
    });

    it('the Hall of the Fallen, Reports and fight replays, scenes, settings, lifetime stats', () => {
      expect(s.fallen.map((f) => f.hunter)).toEqual(before.fallen.map((f) => f.hunter));
      expect(s.log.recentFights.length).toBeGreaterThanOrEqual(before.log.recentFights.length);
      expect(s.scenes).toEqual(['vow']);
      expect(s.settings.theme).toBe('light');
      expect(s.peasants.autoSettle).toBe(false); // a player setting, kept
      expect(s.stats.contractsWon).toBeGreaterThanOrEqual(40);
    });

    it('the cycle number goes up by one, and the history gains the new cycle', () => {
      expect(s.cycle.number).toBe(2);
      expect(s.cycles).toHaveLength(2);
      expect(s.cycles[1]).toEqual({
        number: 2,
        startedAt: s.time,
        ranks: { hamlet: s.time },
        contractThreat: { added: 0, removed: 0 },
        stand: null,
        act: 2, // v5 (T5.3, GDD §5.14.1): one act per cycle
        warden: null,
      });
    });

    it('the new cycle begins the next act, with fresh counters (GDD §5.14.1)', () => {
      expect(s.story.acts.map((a) => a.act)).toEqual([1, 2]);
      expect(s.story.acts[1]).toEqual({
        act: 2,
        cycle: 2,
        startedAt: s.time,
        wins: 0,
        winsByVillage: {},
        ruinWins: 0,
      });
    });
  });

  it('v0.5 (GDD §5.14.9): the stand brings the Act I testament, and the new warden its closing scene', () => {
    const doc = (id: string) => s.story.documents.find((d) => d.id === id);
    expect(doc('D1-06')).toMatchObject({ cycle: 1, via: 'stand' });
    expect(doc('D1-07')).toMatchObject({ cycle: 2, via: 'warden' });
    // The contract still running finished first and was won, bringing Act I's first letter.
    expect(doc('D1-01')).toMatchObject({ cycle: 1, via: 'contract' });
  });

  it('the stand causes no injuries and no deaths', () => {
    expect(s.fallen).toHaveLength(before.fallen.length);
    expect(Object.keys(s.hunters)).toHaveLength(Object.keys(before.hunters).length);
  });

  it('injured hunters can stand', () => {
    expect(stand?.party.some((h) => h.id === 'zora')).toBe(true);
  });

  it('the result sheet can be marked read', () => {
    const t = structuredClone(s);
    expect(run(t, { type: 'stand.seen' }).ok).toBe(true);
    expect(t.cycles[0]?.stand?.seen).toBe(true);
  });

  it('the new cycle plays from the start: Threat counts again from the Keep', () => {
    expect(s.arrivalDue).toBe(false);
  });
});

describe('warden upgrades in the new cycle (GDD §8.9)', () => {
  it('Full Larder and Young Families add to the start; Old Hands keeps more levels', () => {
    const b = bastion();
    b.upgrades['full-larder'] = 2;
    b.upgrades['young-families'] = 1;
    b.upgrades['old-hands'] = 5;
    expect(run(b, { type: 'stand.make', party: [...SIX] }).ok).toBe(true);
    expect(b.resources.food).toBe(start.resources.food + 400);
    expect(b.resources.wood).toBe(start.resources.wood + 400);
    expect(b.buildings.cottage).toBe((start.buildings.cottage ?? 0) + 1);
    expect(b.peasants.total).toBe(5);
    expect(Object.values(b.peasants.jobs).reduce((x, y) => x + y, 0)).toBe(5);
    expect(b.hunters.halvar?.level).toBe(6); // 50% + 5 × 10% = all levels kept
  });
});
