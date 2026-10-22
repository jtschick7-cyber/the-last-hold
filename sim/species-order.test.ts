// v1.0 (plan TV.11, D478 (3)): the species-estimate variant is report-only, so nothing that judges
// the game may name it, and its one rule puts an unstudied species first among near-top tiers.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ContractInstance, GameState } from '../src/core/state/game-state';
import { speciesOrder } from './species-order';

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('the species-estimate variant stays outside the judged runs', () => {
  it.each(['.github/workflows/sim.yml', 'sim/baseline.json', 'sim/targets.ts', 'package.json'])(
    '%s does not name it',
    (path) => {
      const text = read(path);
      expect(text).not.toContain('species-variant');
      expect(text).not.toContain('species-order');
    },
  );
});

const contract = (id: string, tier: number): ContractInstance =>
  ({ id, tier, monster: id }) as unknown as ContractInstance;
const state = {} as GameState;

describe('speciesOrder', () => {
  const standard = [contract('a', 5), contract('b', 5), contract('c', 4), contract('d', 3)];
  const ids = (cs: ContractInstance[]): string[] => cs.map((c) => c.id);

  it("puts unstudied contracts within one tier of the top first, in Standard's order", () => {
    const order = speciesOrder((_s, c) => c.id === 'c' || c.id === 'b');
    expect(ids(order(state, standard))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('leaves out contracts more than one tier below the top, even if unstudied', () => {
    const order = speciesOrder((_s, c) => c.id === 'd');
    expect(ids(order(state, standard))).toEqual(['a', 'b', 'c', 'd']);
  });

  it("keeps Standard's choice when nothing near the top is unstudied, or the board is empty", () => {
    expect(ids(speciesOrder(() => false)(state, standard))).toEqual(['a', 'b', 'c', 'd']);
    expect(speciesOrder(() => true)(state, [])).toEqual([]);
  });
});
