import { describe, expect, it } from 'vitest';
import { createNewGame } from './new-game';

describe('createNewGame (GDD §5.1.4)', () => {
  const s = createNewGame('seed-1', 1_760_000_000_000);

  it('starts with the GDD starting state', () => {
    expect(s.resources).toEqual({ food: 50, wood: 50, iron: 0, silver: 0 });
    expect(s.peasants.total).toBe(3);
    expect(s.peasants.jobs).toEqual({ farmer: 1, woodcutter: 2, miner: 0, 'silver-digger': 0 });
    expect(s.peasants.autoSettle).toBe(true);
    expect(s.buildings['hearth-hall']).toBe(1);
    expect(s.buildings.farm).toBe(1);
    expect(s.buildings['woodcutters-camp']).toBe(1);
    expect(s.buildings.cottage).toBe(0);
    expect(s.cycle).toEqual({ number: 1, age: 'hamlet' });
  });

  it('records the seed and the clock', () => {
    expect(s.meta.gameSeed).toBe('seed-1');
    expect(s.meta.createdAt).toBe(1_760_000_000_000);
    expect(s.meta.lastSeen).toBe(1_760_000_000_000);
    expect(s.time).toBe(1_760_000_000_000);
    expect(s.meta.debugUsed).toBe(false);
  });

  it('survives a JSON round trip unchanged', () => {
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('gives each game its own copies of shared defaults', () => {
    const a = createNewGame('a', 0);
    const b = createNewGame('b', 0);
    a.peasants.priority.push('farmer');
    a.peasants.jobs.farmer = 9;
    expect(b.peasants.priority).toHaveLength(4);
    expect(b.peasants.jobs.farmer).toBe(1);
  });
});
