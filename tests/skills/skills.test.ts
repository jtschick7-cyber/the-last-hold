// Plan T6.6: the four warden skills (GDD §5.8.6, D205–D208): the curve, the XP from
// every activity, the four bonuses, and the Alchemy level frozen at launch.
import { describe, expect, it } from 'vitest';
import { gear } from '../../src/content/gear';
import { num } from '../../src/core/balance-access';
import { runFight } from '../../src/core/combat';
import { clueDuration } from '../../src/core/investigation/lodge';
import { contractXpBonus } from '../../src/core/long-night/bonuses';
import { gearCost } from '../../src/core/skills/hooks';
import { slotGear } from '../../src/core/systems/hunters';
import {
  gainSkillXp,
  levelFor,
  progressFor,
  skillBonus,
  skillLevel,
  skillLevels,
  xpToNext,
} from '../../src/core/skills/skills';
import { advance } from '../../src/core/sim/advance';
import { seeded } from '../../src/core/rng';
import { cyclic, snap } from '../combat/helpers';
import { HOUR, T0, give, keepRich, run } from '../contracts/helpers';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';

const MIN = 60_000;
const hut = (): GameState => {
  const s = keepRich('skills');
  s.buildings['alchemists-hut'] = 2;
  for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 20;
  return s;
};

describe('the curve (GDD §5.8.6)', () => {
  it('level L → L+1 costs 20 × 1.6^L, rounded; 0 at the top', () => {
    expect([0, 1, 2, 3, 4].map(xpToNext)).toEqual([20, 32, 51, 82, 131]);
    expect(xpToNext(9)).toBe(Math.floor(20 * 1.6 ** 9 + 0.5));
    expect(xpToNext(num('skill.maxLevel'))).toBe(0);
  });

  it('turns XP into a level, and stops at the cap of 10', () => {
    expect([0, 19, 20, 51, 52, 134].map(levelFor)).toEqual([0, 0, 1, 1, 2, 3]);
    expect(levelFor(1e9)).toBe(10);
    expect(progressFor(30)).toEqual({ level: 1, into: 10, needed: 32 });
    expect(progressFor(1e9)).toEqual({ level: 10, into: 0, needed: 0 });
  });

  it('reports a level-up only when the level rises', () => {
    const s = keepRich('lv');
    expect(gainSkillXp(s, 'lore', 19)).toBeNull();
    expect(gainSkillXp(s, 'lore', 1)).toBe(1);
    expect(gainSkillXp(s, 'lore', 0)).toBeNull();
    expect(skillLevels(s)).toEqual({ alchemy: 0, smithing: 0, lore: 1, command: 0 });
  });
});

describe('Alchemy XP: brews, experiments, properties', () => {
  it('a finished brew gives 1, an experiment 3 and 10 per property revealed', () => {
    const s = hut();
    run(s, { type: 'brew.queue', item: 'grave-oil' });
    advance(s, s.time + 10 * MIN);
    expect(s.skills.alchemy).toBe(1);
    run(s, { type: 'experiment.queue', a: 'wolf-fang', b: 'hares-foot' }); // shows 4 properties
    advance(s, s.time + 10 * MIN);
    expect(s.skills.alchemy).toBe(1 + 3 + 10 * 4);
  });
});

describe('Smithing: XP and cheaper gear', () => {
  it('a gear upgrade gives 2 per tier and a Smithy level gives 2', () => {
    const s = keepRich('smith');
    const before = s.skills.smithing;
    expect(run(s, { type: 'build.upgrade', building: 'smithy' }).ok).toBe(true);
    expect(s.skills.smithing).toBe(before + 2);
    const tier = gear['hide-armor']?.tier ?? 1;
    expect(run(s, { type: 'gear.upgrade', hunter: 'ostap', slot: 'armor' }).ok).toBe(true);
    expect(s.skills.smithing).toBe(
      before +
        2 +
        2 * (s.hunters.ostap ? (slotGear(s, s.hunters.ostap, 'armor')?.tier ?? tier) : tier),
    );
  });

  it('gear costs `skill.smithingCost` less per level, every resource including silver', () => {
    const s = keepRich('smith2');
    const g = gear['silvered-blade'] ?? Object.values(gear).find((x) => (x.cost.silver ?? 0) > 0);
    if (!g) throw new Error('no gear with silver');
    const full = gearCost(s, g).cost;
    const step = num('skill.smithingCost'); // a tunable (D228): the test follows it
    s.skills.smithing = 10_000; // level 10
    const cheap = gearCost(s, g);
    for (const r of ['food', 'wood', 'iron', 'silver'] as const)
      expect(cheap.cost[r]).toBe(Math.floor(full[r] * (1 - 10 * step) + 0.5));
    expect(cheap.breakdown.label).toBe('Smithing 10');
    expect(cheap.breakdown.value).toBeCloseTo(10 * step, 9);
    // The command pays exactly what the breakdown says.
    s.skills.smithing = 20 + 32 + 51; // level 3
    const price = gearCost(s, g).cost;
    expect(price.silver).toBe(Math.floor((g.cost.silver ?? 0) * (1 - 3 * step) + 0.5));
  });
});

describe('Lore: XP and quicker clues', () => {
  const contract = { monster: 'wolf' } as Pick<ContractInstance, 'monster'>;

  it('a clue gives 1, a species level 5, a document or letter 5', () => {
    const s = keepRich('lore');
    s.buildings['hunters-lodge'] = 1;
    s.board.open = [
      {
        id: 'c1',
        village: 'dubno-ford',
        monster: 'wolf',
        tier: 1,
        location: 'forest',
        arrivedAt: T0,
        revealed: 0,
      },
    ];
    run(s, { type: 'investigate.assign', contract: 'c1' });
    advance(s, s.time + 31 * MIN);
    expect(s.board.open[0]?.revealed).toBe(1);
    expect(s.skills.lore).toBeGreaterThanOrEqual(1);
    expect(s.skills.lore).toBe(
      1 + 5 * Object.values(s.bestiary).reduce((n, b) => n + (b?.level ?? 0), 0),
    );
  });

  it('clues take 4% less time per level, after Studied, Tracker and the Bone Whistle', () => {
    const s = keepRich('lore2');
    const full = clueDuration(s, contract, 0).value;
    s.skills.lore = 20 + 32 + 51 + 82; // level 4: −16%
    const d = clueDuration(s, contract, 0);
    expect(d.value).toBe(Math.round(full * 0.84));
    expect(JSON.stringify(d.breakdown)).toContain('Lore 4');
  });
});

describe('Command: XP and contract XP', () => {
  it('adds its bonus to the Drill Yard and the Tally Stick, 4% per level', () => {
    const s = keepRich('cmd');
    s.upgrades['drill-yard'] = 1;
    const base = contractXpBonus(s).value;
    s.skills.command = 20 + 32 + 51 + 82 + 131; // level 5: +20%
    const b = contractXpBonus(s);
    expect(b.value).toBeCloseTo(base + 0.2, 9);
    expect(JSON.stringify(b.breakdown)).toContain('Command 5');
  });
});

describe('Alchemy: stronger brews, frozen at launch (D206)', () => {
  it('every number in a brew is 3% stronger per level; counts are not', () => {
    const party = [snap('halvar')];
    const m = { monster: 'upyr', tier: 2 } as const;
    const prep = { oils: { halvar: 'grave-oil' as const }, potions: {}, bombs: [] };
    const hit = (alchemy: number) =>
      runFight({
        party,
        monster: m,
        location: 'field',
        rolls: cyclic([0.5]),
        prep,
        alchemy,
      }).log.find((l) => l.kind === 'hit' && l.actor === 'halvar')?.dealt ?? 0;
    const none =
      runFight({ party, monster: m, location: 'field', rolls: cyclic([0.5]) }).log.find(
        (l) => l.kind === 'hit' && l.actor === 'halvar',
      )?.dealt ?? 0;
    expect(hit(0)).toBeCloseTo(none * 1.35, 9);
    expect(hit(10)).toBeCloseTo(none * (1 + 0.35 * 1.3), 9);
    // Counts don't change: one Poppy Smoke is still exactly one lost action at level 10.
    const smoke = runFight({
      party: [snap('halvar')],
      monster: { monster: 'wolf', tier: 1 },
      location: 'field',
      rolls: cyclic([0.5]),
      prep: { oils: {}, potions: {}, bombs: ['poppy-smoke'] },
      alchemy: 10,
    });
    expect(smoke.log.filter((l) => l.kind === 'skip' && l.actor === 'wolf')).toHaveLength(1);
  });

  it('the fight keeps the level it was launched at, however the skill grows later', () => {
    const s = keepRich('freeze');
    s.skills.alchemy = 20 + 32 + 51; // level 3
    give(s, 'halvar', 'zora');
    s.board.open = [
      {
        id: 'c1',
        village: 'dubno-ford',
        monster: 'wolf',
        tier: 1,
        location: 'forest',
        arrivedAt: T0,
        revealed: 3,
      },
    ];
    expect(run(s, { type: 'contract.launch', contract: 'c1', party: ['halvar', 'zora'] }).ok).toBe(
      true,
    );
    expect(s.running[0]?.alchemy).toBe(3);
    s.skills.alchemy = 1e6; // level 10 before it ends
    advance(s, s.time + 12 * HOUR);
    expect(s.log.recentFights[0]?.alchemy).toBe(3);
    expect(skillLevel(s, 'alchemy')).toBe(10);
    expect(skillBonus(s, 'alchemy').value).toBeCloseTo(0.3, 9);
  });

  it('a replay of the saved fight uses the saved level', () => {
    const party = [snap('halvar')];
    const a = runFight({
      party,
      monster: { monster: 'wolf', tier: 1 },
      location: 'forest',
      rolls: seeded('r'),
      alchemy: 4,
      prep: { oils: { halvar: 'hidebane-oil' }, potions: {}, bombs: ['fire-pot'] },
    });
    const b = runFight({
      party,
      monster: { monster: 'wolf', tier: 1 },
      location: 'forest',
      rolls: seeded('r'),
      alchemy: 4,
      prep: { oils: { halvar: 'hidebane-oil' }, potions: {}, bombs: ['fire-pot'] },
    });
    expect(a.log.map((l) => l.text)).toEqual(b.log.map((l) => l.text));
  });
});
