// Plan T4.4: Citadel and Bastion (GDD §5.1.3, D106): the age bucket adds up Rank by
// Rank, the caps rise, the roster grows, bounties pay more, and the tier cap stays 5.
import { describe, expect, it } from 'vitest';
import type { AgeId } from '../../src/content/ages';
import { apply } from '../../src/core/commands';
import { tierCap } from '../../src/core/contracts/board';
import { bounty, provisions } from '../../src/core/contracts/rewards';
import { ageUnlocks } from '../../src/core/describe';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import { maxLevelNow } from '../../src/core/systems/ages';
import { gainXp, levelCap, rosterCap } from '../../src/core/systems/hunters';
import { productionRate } from '../../src/core/systems/production';

const at = (age: AgeId): GameState => {
  const s = createNewGame('ranks', 0);
  s.cycle.age = age;
  return s;
};

describe('Citadel and Bastion (plan T4.4)', () => {
  it('the age bucket adds each Rank in turn: +50%, +100%, +150% (not silver)', () => {
    const food = (age: AgeId): number => productionRate(at(age), 'food').value;
    const base = food('hamlet');
    expect(food('keep') / base).toBeCloseTo(1.5);
    expect(food('citadel') / base).toBeCloseTo(2);
    expect(food('bastion') / base).toBeCloseTo(2.5);
    const s = at('bastion');
    s.peasants.jobs['silver-digger'] = 1;
    const h = at('hamlet');
    h.peasants.jobs['silver-digger'] = 1;
    expect(productionRate(s, 'silver').value).toBe(productionRate(h, 'silver').value);
  });

  it('the breakdown names each Rank and its key', () => {
    const tree = JSON.stringify(productionRate(at('bastion'), 'wood').breakdown);
    for (const key of [
      'age.keep.allProduction',
      'age.citadel.allProduction',
      'age.bastion.allProduction',
    ])
      expect(tree).toContain(key);
  });

  it('hunter level cap: 10 in Hamlet and Keep, 15 in Citadel, 20 in Bastion', () => {
    expect(levelCap(at('hamlet'))).toBe(10);
    expect(levelCap(at('keep'))).toBe(10);
    expect(levelCap(at('citadel'))).toBe(15);
    expect(levelCap(at('bastion'))).toBe(20);
  });

  it('active roster: Keep 3 + Barracks, +2 at Citadel, +2 more at Bastion', () => {
    const cap = (age: AgeId): number => {
      const s = at(age);
      s.buildings.barracks = 3;
      return rosterCap(s).value;
    };
    expect(cap('keep')).toBe(6);
    expect(cap('citadel')).toBe(8);
    expect(cap('bastion')).toBe(10);
    expect(JSON.stringify(rosterCap(at('bastion')).breakdown)).toContain('roster.ageBonus');
  });

  it('building caps: Mill, Sawpit, Smithy 15 then 20; Walls and Watchtower 10 then 15', () => {
    for (const id of ['mill', 'sawpit', 'smithy'] as const) {
      expect(maxLevelNow(at('citadel'), id)).toBe(15);
      expect(maxLevelNow(at('bastion'), id)).toBe(20);
    }
    for (const id of ['walls', 'watchtower'] as const) {
      expect(maxLevelNow(at('keep'), id)).toBe(0);
      expect(maxLevelNow(at('citadel'), id)).toBe(10);
      expect(maxLevelNow(at('bastion'), id)).toBe(15);
    }
    expect(maxLevelNow(at('bastion'), 'barracks')).toBe(5);
  });

  it('bounties pay ×1.25 in Citadel and ×1.5 in Bastion; the tier cap stays 5', () => {
    const pay = (age: AgeId): number => bounty(3, age, []).value;
    expect(pay('citadel') / pay('keep')).toBeCloseTo(1.25);
    expect(pay('bastion') / pay('keep')).toBeCloseTo(1.5);
    expect(tierCap(at('citadel'))).toBe(5);
    expect(tierCap(at('bastion'))).toBe(5);
  });

  it('provisions read 1 minute of food capacity in both', () => {
    for (const age of ['citadel', 'bastion'] as const) {
      const s = at(age);
      s.peasants.total = 40;
      s.buildings.farm = 10;
      expect(JSON.stringify(provisions(s, 3, 3).breakdown)).toContain('provisions.incomeMinutes');
    }
  });

  it('a level carried above the Rank cap is kept; the cap only stops new levels', () => {
    // GDD §5.9.7: a hunter can carry level 14 from a Citadel cycle into a Keep.
    const h = { level: 14, xp: 0 };
    expect(gainXp(at('keep'), h, 1e9)).toEqual([]);
    expect(h).toEqual({ level: 14, xp: 0 });
    const k = { level: 9, xp: 0 };
    expect(gainXp(at('citadel'), k, 1e9)).toEqual([10, 11, 12, 13, 14, 15]);
    expect(k).toEqual({ level: 15, xp: 0 });
  });

  it('the Unlocks list names the new caps, roster, bounty and buildings', () => {
    const citadel = ageUnlocks('citadel').join('\n');
    expect(citadel).toContain('Hunters up to level 15');
    expect(citadel).toContain('+2 active hunters');
    expect(citadel).toContain('Bounties ×1.25');
    expect(citadel).toContain('New: Walls');
    expect(citadel).toContain('Mill up to level 15');
    const bastion = ageUnlocks('bastion').join('\n');
    expect(bastion).toContain('Hunters up to level 20');
    expect(bastion).toContain('Bounties ×1.5');
    expect(bastion).toContain('The Last Stand');
  });

  it('the Rank-up from the Keep to the Citadel checks the GDD requirements', () => {
    const s = at('keep');
    Object.assign(s.resources, { food: 1e7, wood: 1e7, iron: 1e7, silver: 1e5 });
    expect(apply(s, { type: 'age.up' }, 0).ok).toBe(false);
    s.peasants.total = 50;
    s.buildings.mill = 10;
    s.buildings.smithy = 8;
    s.buildings.barracks = 1;
    expect(apply(s, { type: 'age.up' }, 0).ok).toBe(true);
    expect(s.cycle.age).toBe('citadel');
    expect(s.resources.silver).toBe(1e5 - 1_000);
  });
});
