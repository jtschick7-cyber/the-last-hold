import { describe, expect, it } from 'vitest';
import { ageUnlocks, describeBuilding } from '../describe';
import { createNewGame } from '../state/new-game';
import { timeToAfford } from './costs';

describe('descriptions for the UI', () => {
  it('describes building effects from content and balance', () => {
    expect(describeBuilding('cottage')).toBe('+2 housing');
    expect(describeBuilding('farm')).toBe('+3 farmer slots');
    expect(describeBuilding('silver-seam')).toBe('+1 silver-digger slot');
    expect(describeBuilding('mill')).toBe('+25% food');
    expect(describeBuilding('smithy')).toBe('+20% iron');
    expect(describeBuilding('bell-tower')).toBe('+1h offline cap');
  });

  it('lists what the Keep unlocks (GDD §5.1.3)', () => {
    expect(ageUnlocks('keep')).toEqual([
      '+50% to all production (not silver)',
      'Mill up to level 10',
      'Sawpit up to level 10',
      'Smithy up to level 10',
      'New: Bell Tower',
      // v0.2 (GDD §8.1): both arrive at the Keep.
      'New: Barracks',
      'New: Trophy Hall',
    ]);
    expect(ageUnlocks('hamlet')).toEqual([]);
  });
});

describe('timeToAfford', () => {
  it('waits for the slowest resource at current rates', () => {
    const s = createNewGame('t', 0);
    s.resources = { food: 0, wood: 0, iron: 0, silver: 0 };
    const rates = { food: 6, wood: 8, iron: 0, silver: 0 };
    expect(timeToAfford(s, { food: 60, wood: 40, iron: 0, silver: 0 }, (r) => rates[r])).toBe(600);
    expect(timeToAfford(s, { food: 0, wood: 0, iron: 1, silver: 0 }, (r) => rates[r])).toBeNull();
    s.resources.food = 100;
    expect(timeToAfford(s, { food: 60, wood: 0, iron: 0, silver: 0 }, (r) => rates[r])).toBe(0);
  });
});
