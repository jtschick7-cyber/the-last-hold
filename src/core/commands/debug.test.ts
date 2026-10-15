import { describe, expect, it } from 'vitest';
import { createNewGame } from '../state/new-game';
import { apply } from './apply';
import type { Command } from './types';

const T0 = 1_760_000_000_000;
const HOUR = 3_600_000;

describe('debug commands (technical design §15)', () => {
  it('time skip runs the offline path and respects the cap', () => {
    const s = createNewGame('d', T0);
    expect(apply(s, { type: 'debug.skip', ms: HOUR }, T0).ok).toBe(true);
    expect(s.resources.food).toBeCloseTo(80 + 6 * 60, 6);
    expect(s.time).toBe(T0);
    const t = createNewGame('d', T0);
    apply(t, { type: 'debug.skip', ms: 20 * HOUR }, T0);
    expect(t.resources.food).toBeCloseTo(80 + 6 * 60 * 12, 6); // capped at 12 h
  });

  it('runs a policy over the last hours through apply(), then catches up', () => {
    const s = createNewGame('d', T0);
    expect(apply(s, { type: 'debug.runPolicy', policy: 'standard', ms: 24 * HOUR }, T0).ok).toBe(
      true,
    );
    expect(s.time).toBe(T0);
    expect(s.stats.buildingsBought).toBeGreaterThan(5);
    expect(s.peasants.total).toBeGreaterThan(3);
  });

  it('adds resources, sets the seed, and unlocks an Age', () => {
    const s = createNewGame('d', T0);
    apply(s, { type: 'debug.addResources', bundle: { silver: 300 } }, T0);
    apply(s, { type: 'debug.setSeed', seed: 'new-seed' }, T0);
    apply(s, { type: 'debug.unlockAge', age: 'keep' }, T0);
    expect(s.resources.silver).toBe(300);
    expect(s.meta.gameSeed).toBe('new-seed');
    expect(s.cycle.age).toBe('keep');
  });

  it.each<Command>([
    { type: 'debug.skip', ms: 1 },
    { type: 'debug.runPolicy', policy: 'heavy', ms: HOUR },
    { type: 'debug.addResources', bundle: { wood: 1 } },
    { type: 'debug.setSeed', seed: 'x' },
    { type: 'debug.unlockAge', age: 'hamlet' },
    { type: 'debug.grantLoot' },
    { type: 'debug.readyRanks' },
  ])('$type sets debugUsed', (cmd) => {
    const s = createNewGame('d', T0);
    apply(s, cmd, T0);
    expect(s.meta.debugUsed).toBe(true);
  });

  it.each<Command>([
    { type: 'debug.skip', ms: 0 },
    { type: 'debug.skip', ms: Number.NaN },
    { type: 'debug.runPolicy', policy: 'standard', ms: 0 },
    { type: 'debug.runPolicy', policy: 'lazy' as never, ms: HOUR },
    { type: 'debug.addResources', bundle: { wood: -5 } },
    { type: 'debug.addResources', bundle: { mana: 5 } as never },
    { type: 'debug.addResources', bundle: {} },
    { type: 'debug.setSeed', seed: '  ' },
    { type: 'debug.unlockAge', age: 'empire' as never },
  ])('refuses $type with bad input and changes nothing', (cmd) => {
    const s = createNewGame('d', T0);
    const before = structuredClone(s);
    expect(apply(s, cmd, T0).ok).toBe(false);
    expect(s).toEqual(before);
  });
});
