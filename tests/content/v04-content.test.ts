// Plan T4.1: the v0.4 content matches GDD §5.1.2–5.1.3, §5.9.2, §8.1, §8.9 and
// §8.10, and is internally consistent. Wiring into the saved state is T4.3 on.
import { describe, expect, it } from 'vitest';
import { ages, V04_AGE_IDS, v04Ages } from '../../src/content/ages';
import {
  BUILDING_IDS,
  buildings,
  DEFENSE_IDS,
  defenses,
  v04MaxLevels,
} from '../../src/content/buildings';
import { RELIC_IDS, relics } from '../../src/content/relics';
import { UPGRADE_IDS, upgrades } from '../../src/content/warden-upgrades';
import { constantAt, num } from '../../src/core/balance-access';

const has = (list: readonly string[], id: string): boolean => list.includes(id);

describe('Citadel and Bastion (GDD §5.1.3, D106)', () => {
  it('have the GDD requirements and costs', () => {
    expect(v04Ages.citadel.ageUp.requires).toEqual({
      peasants: 50,
      buildings: { mill: 10, smithy: 8, barracks: 1 },
    });
    expect(v04Ages.citadel.ageUp.cost).toEqual({
      food: 300_000,
      wood: 150_000,
      iron: 60_000,
      silver: 1_000,
    });
    expect(v04Ages.bastion.ageUp.requires).toEqual({
      peasants: 65,
      buildings: { mill: 15, smithy: 12, barracks: 3, walls: 1 },
    });
    expect(v04Ages.bastion.ageUp.cost).toEqual({
      food: 1_500_000,
      wood: 600_000,
      iron: 250_000,
      silver: 2_500,
    });
  });

  it('their requirements can be met under the Rank they are bought from', () => {
    // Citadel is bought in the Keep, Bastion in the Citadel. A building with no
    // entry for a later Rank keeps its Keep cap (Barracks max 5, GDD §8.1).
    const capIn = (id: string, age: 'keep' | 'citadel'): number => {
      if (has(DEFENSE_IDS, id)) return defenses[id as 'walls'].maxLevel[age as 'citadel'] ?? 0;
      const extra = age === 'citadel' ? v04MaxLevels[id as 'mill']?.citadel : undefined;
      const b = buildings[id as 'mill'];
      return extra ?? (b.kind === 'level' ? (b.maxLevel.keep ?? 0) : Infinity);
    };
    for (const [id, level] of Object.entries(v04Ages.citadel.ageUp.requires.buildings))
      expect(capIn(id, 'keep'), id).toBeGreaterThanOrEqual(level);
    for (const [id, level] of Object.entries(v04Ages.bastion.ageUp.requires.buildings))
      expect(capIn(id, 'citadel'), id).toBeGreaterThanOrEqual(level);
  });

  it('restore neutral text and carry no inscription (setting-primer §6.5)', () => {
    expect(v04Ages.citadel.ageUp.restores.description).toBe(
      'The roof is back on the old Forge Hall. Its forges are cold.',
    );
    expect(v04Ages.bastion.ageUp.restores.description).toBe(
      'Under the Bastion floor, a stair goes down to a sealed door.',
    );
    for (const id of V04_AGE_IDS) expect('inscription' in v04Ages[id].ageUp.restores).toBe(false);
  });

  it('are new ids, and every Rank has its balance entries', () => {
    for (const id of V04_AGE_IDS) expect(id in ages, id).toBe(false);
    for (const id of [...Object.keys(ages), ...V04_AGE_IDS]) {
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
    for (const id of ['mill', 'sawpit', 'smithy'] as const)
      expect(v04MaxLevels[id]).toEqual({ citadel: 15, bastion: 20 });
  });

  it('Walls and Watchtower have the GDD costs and caps, from Citadel', () => {
    expect(defenses.walls.baseCost).toEqual({ wood: 20_000, iron: 10_000 });
    expect(defenses.watchtower.baseCost).toEqual({ wood: 15_000, iron: 8_000, silver: 100 });
    for (const id of DEFENSE_IDS) {
      expect(defenses[id].kind).toBe('level');
      expect(defenses[id].availableFrom).toBe('citadel');
      expect(defenses[id].maxLevel).toEqual({ citadel: 10, bastion: 15 });
      expect(defenses[id].effects).toContainEqual({
        kind: 'threatSlow',
        perLevelKey: 'threat.defenseSlowPerLevel',
      });
      expect(has(BUILDING_IDS, id), id).toBe(false); // joins with the migration (T4.3)
    }
    // At the Bastion caps, defenses slow Threat by at most 60% (GDD §5.9.1).
    const slow =
      num('threat.defenseSlowPerLevel') *
      DEFENSE_IDS.reduce((n, id) => n + (defenses[id].maxLevel.bastion ?? 0), 0);
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
