// Plan T3.11, the part the screens read: what a contract shows of its monster, the bestiary
// rows, and the ability wording. The UI shows these; it never works them out. GDD §9.4, §9.8.
import { describe, expect, it } from 'vitest';
import { FAMILY_IDS } from '../../src/content/damage';
import { MONSTER_IDS, monsters, type MonsterAbility } from '../../src/content/monsters';
import { abilityTips } from '../../src/content/text/bestiary';
import { candidatesFor } from '../../src/core/contracts/candidates';
import { describeAbility } from '../../src/core/describe';
import { revealedClues } from '../../src/core/investigation/clues';
import {
  bestiaryFamilies,
  contractIdentity,
  knowledgeProgress,
} from '../../src/core/investigation/view';
import { keepRich } from '../contracts/helpers';

const c = (over = {}) => ({
  id: 'v1',
  village: 'dubno-ford' as const,
  monster: 'rusalka' as const,
  tier: 2,
  location: 'river' as const,
  arrivedAt: 0,
  revealed: 0,
  ...over,
});

describe('what a contract shows of its monster (GDD §9.4)', () => {
  it('unidentified: no species, the candidates (named only if Identified), no clues yet', () => {
    const s = keepRich('view');
    s.bestiary.wolf = { level: 2, kills: 0 };
    s.bestiary.rusalka = { level: 1, kills: 0 };
    const v = contractIdentity(s, c());
    expect(v.identified).toBe(false);
    expect(v.monster).toBeNull();
    expect(v.candidates.map((x) => x.monster)).toEqual(candidatesFor('river', 2));
    expect(v.candidates.find((x) => x.monster === 'wolf')?.name).toBe('Gaunt Wolf');
    expect(v.candidates.find((x) => x.monster === 'rusalka')?.name).toBeNull();
    expect(v.candidates.find((x) => x.monster === 'kikimora')?.name).toBeNull();
    expect(v.clues).toEqual([]);
  });

  it('never depends on the true species while nothing is known', () => {
    const s = keepRich('view');
    expect(contractIdentity(s, c({ monster: 'rusalka' }))).toEqual(
      contractIdentity(s, c({ monster: 'wolf' })),
    );
  });

  it('identified: the species, and the clues shown', () => {
    const s = keepRich('view');
    const v = contractIdentity(s, c({ revealed: 3 }));
    expect(v.identified).toBe(true);
    expect(v.monster).toBe('rusalka');
    expect(v.clues).toEqual(revealedClues(s.meta.gameSeed, c({ revealed: 3 })));
    expect(v.clues).toHaveLength(3);
  });

  it('the level label of an identified species is the knowledge level', () => {
    const s = keepRich('view');
    s.bestiary.rusalka = { level: 3, kills: 4 };
    expect(contractIdentity(s, c({ revealed: 3 })).level).toBe(3);
  });
});

describe('the bestiary rows (GDD §9.8)', () => {
  it('has a row per family with every member, in a fixed order, and counts the Identified', () => {
    const s = keepRich('view');
    s.bestiary.upyr = { level: 2, kills: 0 };
    s.bestiary.draugr = { level: 3, kills: 3 };
    s.bestiary.strzyga = { level: 1, kills: 0 };
    const rows = bestiaryFamilies(s);
    expect(rows.map((r) => r.family).sort()).toEqual([...FAMILY_IDS].sort());
    expect(rows.flatMap((r) => r.entries.map((e) => e.monster)).sort()).toEqual(
      [...MONSTER_IDS].sort(),
    );
    const dead = rows.find((r) => r.family === 'restless-dead');
    expect(dead?.total).toBe(3);
    expect(dead?.known).toBe(2); // Upyr and Draugr; the Strzyga is only Sighted
    expect(dead?.entries.find((e) => e.monster === 'strzyga')?.level).toBe(1);
    expect(dead?.entries.find((e) => e.monster === 'draugr')?.level).toBe(3);
    expect(bestiaryFamilies(keepRich('view')).every((r) => r.known === 0)).toBe(true);
  });

  it('progress: kills to the next level, and nothing after Mastered', () => {
    expect(knowledgeProgress(undefined)).toMatchObject({ level: 0, nextLevel: null });
    expect(knowledgeProgress({ level: 2, kills: 1 })).toEqual({
      level: 2,
      kills: 1,
      nextLevel: 3,
      killsToNext: 2,
      nextAtKills: 3,
    });
    expect(knowledgeProgress({ level: 3, kills: 4 })).toMatchObject({
      nextLevel: 4,
      killsToNext: 6,
      nextAtKills: 10,
    });
    expect(knowledgeProgress({ level: 4, kills: 12 })).toMatchObject({
      nextLevel: null,
      killsToNext: 0,
    });
    expect(knowledgeProgress({ level: 1, kills: 0 })).toMatchObject({
      nextLevel: 3,
      killsToNext: 3,
    });
  });
});

describe('ability wording (GDD §8.3)', () => {
  const all = MONSTER_IDS.flatMap((m) => monsters[m].abilities);

  it('every ability has a plain description built from its numbers', () => {
    for (const a of all) expect(describeAbility(a).length).toBeGreaterThan(20);
    const get = (kind: string) => all.find((a) => a.kind === kind) as MonsterAbility;
    expect(describeAbility(get('hamstring'))).toContain('25%');
    expect(describeAbility(get('hamstring'))).toContain('30%');
    expect(describeAbility(get('noonHeat'))).toContain('3%');
    expect(describeAbility(get('barrowGrip'))).toContain('3rd');
    expect(describeAbility(get('swell'))).toContain('50%');
    expect(describeAbility(get('secondSoul'))).toContain('40%');
    expect(describeAbility(get('drowningSong'))).toContain('1st, 5th, 9th');
    expect(describeAbility(get('riverhorse'))).toContain('20%');
  });

  it('every ability kind has a counter-tip, and it names a real way to answer it', () => {
    for (const a of all) expect(abilityTips[a.kind].length, a.kind).toBeGreaterThan(20);
    expect(Object.keys(abilityTips).sort()).toEqual([...new Set(all.map((a) => a.kind))].sort());
  });
});
