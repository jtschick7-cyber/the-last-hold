// Plan T4.1: the v0.4 content matches GDD §5.1.2–5.1.3, §5.9.2, §8.1, §8.9 and
// §8.10, and is internally consistent.
import { describe, expect, it } from 'vitest';
import { AGE_IDS, ages, type AgeId } from '../../src/content/ages';
import { buildings, DEFENSE_IDS, type BuildingId } from '../../src/content/buildings';
import { RELIC_IDS, relics } from '../../src/content/relics';
import { UPGRADE_IDS, upgrades } from '../../src/content/warden-upgrades';
import { inscriptions } from '../../src/content/story/scenes';
import { constantAt, num } from '../../src/core/balance-access';

const V04_AGES = ['citadel', 'bastion'] as const;
const up = (id: (typeof V04_AGES)[number]) => {
  const a = ages[id].ageUp;
  if (!a) throw new Error(`${id} has no Rank-up`);
  return a;
};
/** A level building's cap in an Age: its entry, else the latest earlier one (GDD §8.1). */
const capIn = (id: BuildingId, age: AgeId): number => {
  const b = buildings[id];
  if (b.kind !== 'level') return Infinity;
  for (let i = AGE_IDS.indexOf(age); i >= 0; i--) {
    const cap = b.maxLevel[AGE_IDS[i] as AgeId];
    if (cap !== undefined) return cap;
  }
  return 0;
};

describe('Citadel and Bastion (GDD §5.1.3, D106)', () => {
  it('have the GDD requirements and costs', () => {
    expect(up('citadel').requires).toEqual({
      peasants: 50,
      buildings: { mill: 10, smithy: 8, barracks: 1 },
    });
    expect(up('citadel').cost).toEqual({
      food: 300_000,
      wood: 150_000,
      iron: 60_000,
      silver: 600, // D138
    });
    expect(up('bastion').requires).toEqual({
      peasants: 60,
      buildings: { mill: 12, smithy: 9, barracks: 3, walls: 1 },
    });
    expect(up('bastion').cost).toEqual({
      food: 500_000,
      wood: 300_000,
      iron: 110_000,
      silver: 1_600,
    });
  });

  it('their requirements can be met under the Rank they are bought from', () => {
    // Citadel is bought in the Keep, Bastion in the Citadel.
    for (const [id, level] of Object.entries(up('citadel').requires.buildings))
      expect(capIn(id as BuildingId, 'keep'), id).toBeGreaterThanOrEqual(level ?? 0);
    for (const [id, level] of Object.entries(up('bastion').requires.buildings))
      expect(capIn(id as BuildingId, 'citadel'), id).toBeGreaterThanOrEqual(level ?? 0);
  });

  it('restore neutral text; from v0.5 their inscriptions are appended (setting-primer §6.5, D160)', () => {
    expect(up('citadel').restores.description).toBe(
      'The roof is back on the old Forge Hall. Its forges are cold.',
    );
    expect(up('bastion').restores.description).toBe(
      'Under the Bastion floor, a stair goes down to a sealed door.',
    );
    for (const id of V04_AGES) expect(up(id).restores.inscription).toBe(inscriptions[id]);
  });

  it('follow the Keep in Rank order, and every Rank has its balance entries', () => {
    expect(AGE_IDS).toEqual(['hamlet', 'keep', 'citadel', 'bastion']);
    for (const id of AGE_IDS) {
      for (const key of [
        'contract.ageTierCap',
        'bounty.ageMult',
        'provisions.incomeMinutes',
        'threat.ratePerHour',
        'embers.rankMult',
      ] as const)
        expect((constantAt(key).value as Record<string, number>)[id], `${key}.${id}`).toBeTypeOf(
          'number',
        );
    }
    expect(constantAt('contract.ageTierCap').value).toMatchObject({ citadel: 5, bastion: 5 });
    expect(constantAt('roster.ageBonus').value).toEqual({ citadel: 2, bastion: 2 });
    expect(constantAt('hunter.levelCap').value).toEqual({ keep: 10, citadel: 15, bastion: 20 });
  });
});

describe('the higher level caps and the defenses (GDD §5.1.2, §5.9.2, §8.1)', () => {
  it('Mill, Sawpit and Smithy reach 15 in Citadel and 20 in Bastion', () => {
    for (const id of ['mill', 'sawpit', 'smithy'] as const) {
      expect(capIn(id, 'citadel'), id).toBe(15);
      expect(capIn(id, 'bastion'), id).toBe(20);
    }
    // The rest keep their one cap in every Rank (GDD §8.1).
    expect(capIn('barracks', 'bastion')).toBe(5);
    expect(capIn('bell-tower', 'bastion')).toBe(3);
    expect(capIn('hunters-lodge', 'bastion')).toBe(3);
    expect(capIn('alchemists-hut', 'bastion')).toBe(5);
  });

  it('Walls and Watchtower have the GDD costs and caps, from Citadel', () => {
    const def = (id: (typeof DEFENSE_IDS)[number]) => {
      const b = buildings[id];
      if (b.kind !== 'level') throw new Error(`${id} is not a level building`);
      return b;
    };
    expect(def('walls').baseCost).toEqual({ wood: 20_000, iron: 10_000 });
    expect(def('watchtower').baseCost).toEqual({ wood: 15_000, iron: 8_000, silver: 100 });
    for (const id of DEFENSE_IDS) {
      expect(def(id).availableFrom).toBe('citadel');
      expect(def(id).maxLevel).toEqual({ citadel: 10, bastion: 15 });
      expect(def(id).effects).toContainEqual({
        kind: 'threatSlow',
        perLevelKey: 'threat.defenseSlowPerLevel',
      });
    }
    // At the Bastion caps, defenses slow Threat by at most 60% (GDD §5.9.1).
    const slow =
      num('threat.defenseSlowPerLevel') *
      DEFENSE_IDS.reduce((n, id) => n + capIn(id, 'bastion'), 0);
    expect(slow).toBeCloseTo(0.6);
  });
});

describe('warden upgrades (GDD §8.9, D111)', () => {
  it('are the eight, in list order, with the GDD maxima and costs', () => {
    expect(UPGRADE_IDS).toHaveLength(8);
    expect(Object.keys(upgrades)).toEqual([...UPGRADE_IDS]);
    const table = UPGRADE_IDS.map((id) => [
      upgrades[id].name,
      upgrades[id].maxLevel,
      upgrades[id].cost,
      upgrades[id].growth,
    ]);
    expect(table).toEqual([
      ['Kept Coals', 10, 15, 1.5],
      ['Full Larder', 5, 10, 1.6],
      ['Young Families', 5, 20, 1.6],
      ['Old Hands', 5, 30, 1.8],
      ['Drill Yard', 5, 15, 1.6],
      ['Village Goodwill', 5, 25, 1.7],
      ['Swift Roads', 3, 25, 1.8],
      ['Late Lantern', 4, 20, 2],
    ]);
  });

  it('have the GDD effects', () => {
    expect(upgrades['kept-coals'].effect).toEqual({ kind: 'allProduction', perLevel: 0.1 });
    expect(upgrades['full-larder'].effect).toEqual({
      kind: 'startResources',
      perLevel: { food: 200, wood: 200 },
    });
    expect(upgrades['young-families'].effect).toEqual({
      kind: 'startHousing',
      cottages: 1,
      peasants: 2,
    });
    expect(upgrades['old-hands'].effect).toEqual({ kind: 'levelsKept', perLevel: 0.1 });
    expect(upgrades['drill-yard'].effect).toEqual({ kind: 'contractXp', perLevel: 0.1 });
    expect(upgrades['village-goodwill'].effect).toEqual({ kind: 'bounty', perLevel: 0.05 });
    expect(upgrades['swift-roads'].effect).toEqual({ kind: 'contractDuration', perLevel: 0.1 });
    expect(upgrades['late-lantern'].effect).toEqual({ kind: 'offlineCap', perLevel: 3600 });
  });

  it('Old Hands at its max keeps every level (50% → 100%)', () => {
    const s = upgrades['old-hands'];
    if (s.effect.kind !== 'levelsKept') throw new Error('wrong effect');
    expect(num('longNight.levelsKept') + s.effect.perLevel * s.maxLevel).toBeCloseTo(1);
  });

  it('Late Lantern at its max stays within the 24 h ceiling with every Bell Tower level', () => {
    const lw = upgrades['late-lantern'];
    if (lw.effect.kind !== 'offlineCap') throw new Error('wrong effect');
    const bell = buildings['bell-tower'];
    const bellMax = bell.kind === 'level' ? Math.max(...Object.values(bell.maxLevel)) : 0;
    const cap =
      num('offline.baseCap') +
      bellMax * num('bellTower.perLevel') +
      lw.maxLevel * lw.effect.perLevel;
    expect(cap).toBeLessThanOrEqual(num('offline.ceiling'));
  });
});

describe('relics (GDD §8.10, D111)', () => {
  it('are the six, with the GDD effects', () => {
    expect(RELIC_IDS).toHaveLength(6);
    expect(Object.keys(relics)).toEqual([...RELIC_IDS]);
    expect(RELIC_IDS.map((id) => [relics[id].name, relics[id].effect])).toEqual([
      ['Plough-Share', { kind: 'production', resources: ['food'], amount: 0.1 }],
      ["Mason's Plumb", { kind: 'production', resources: ['wood', 'iron'], amount: 0.1 }],
      ['Tally Stick', { kind: 'contractXp', amount: 0.15 }],
      ['Bone Whistle', { kind: 'clueTime', amount: 0.15 }],
      ['Copper Still', { kind: 'brewTime', amount: 0.2 }],
      ['Iron Shutter', { kind: 'standTaken', amount: 0.05 }],
    ]);
  });

  it('one relic per wave milestone', () => {
    expect(constantAt('relics.waveMilestones').value).toHaveLength(RELIC_IDS.length);
  });
});
