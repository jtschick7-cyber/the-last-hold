// Plan T5.16, Q17 (D190): until all six Ribbonshade names are found, a ruin contract's
// creature is a Ribbonshade about half the time; nothing changes once they are found.
import { describe, expect, it } from 'vitest';
import { num } from '../../src/core/balance-access';
import { candidatesFor, generateContract } from '../../src/core/contracts/board';
import { createNewGame } from '../../src/core/state/new-game';
import type { ContractInstance } from '../../src/core/state/game-state';
import { keepRich } from './helpers';

const ruins = (named: boolean): ContractInstance[] => {
  const s = keepRich('ribbon-share');
  s.board.tierWins = [3, 3, 3, 3, 3];
  s.story.ribbonshades = named ? 6 : 0;
  const out: ContractInstance[] = [];
  for (let i = 0; i < 4000; i++) {
    const c = generateContract(s, i, s.time);
    if (c.location === 'ruin') out.push(c);
  }
  return out;
};

describe('Ribbonshades in ruin contracts', () => {
  it('are most of them until the six names are found (ruin.ribbonshadeShare)', () => {
    const share = num('ruin.ribbonshadeShare');
    expect(share).toBe(0.75); // 0.5 until the T8.18 tuning (D354)
    const list = ruins(false).filter((c) => c.tier <= 4);
    expect(list.length).toBeGreaterThan(150);
    const got = list.filter((c) => c.monster === 'ribbonshade').length / list.length;
    // The share, plus a Ribbonshade's ordinary chance among the others.
    expect(got).toBeGreaterThan(share);
    expect(got).toBeLessThanOrEqual(1);
  });

  it('go back to their ordinary chance once all six names are found', () => {
    const list = ruins(true).filter((c) => c.tier === 3);
    const ordinary = 1 / candidatesFor('ruin', 3).length;
    const got = list.filter((c) => c.monster === 'ribbonshade').length / list.length;
    expect(Math.abs(got - ordinary)).toBeLessThan(0.08);
  });

  it('never put a Ribbonshade where it cannot appear, and leave every other contract alone', () => {
    const s = createNewGame('ribbon-share-2', 0);
    s.board.tierWins = [3, 3, 3, 3, 3];
    for (let i = 0; i < 500; i++) {
      const c = generateContract(s, i, 0);
      if (c.monster === 'ribbonshade') {
        expect(c.location).toBe('ruin');
        expect(c.tier).toBeGreaterThanOrEqual(2);
        expect(c.tier).toBeLessThanOrEqual(4);
      }
    }
    const before = generateContract(s, 7, 0);
    expect(generateContract(s, 7, 0)).toEqual(before); // deterministic
  });
});
