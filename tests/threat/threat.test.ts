// Plan T4.5 (GDD §5.9.1–5.9.2, D107–D108): Threat rises by the hour at the Rank's
// rate, defenses slow it, contracts push it up or down, and it never goes below 0.
import { describe, expect, it } from 'vitest';
import type { AgeId } from '../../src/content/ages';
import { applyContractThreat, threatMeter, threatRate } from '../../src/core/threat/threat';
import { advance, catchUpNow } from '../../src/core/sim';
import { createNewGame } from '../../src/core/state/new-game';
import type { GameState } from '../../src/core/state/game-state';
import { HOUR, T0, keepRich, run } from '../contracts/helpers';

const at = (age: AgeId): GameState => {
  const s = createNewGame('threat', T0);
  s.cycle.age = age;
  return s;
};

describe('Threat (plan T4.5)', () => {
  it('rises per hour by Rank: Hamlet 0, Keep 0.5, Citadel 1, Bastion 2', () => {
    const after10h = (age: AgeId): number => {
      const s = at(age);
      advance(s, T0 + 10 * HOUR);
      return s.threat;
    };
    expect(after10h('hamlet')).toBe(0);
    expect(after10h('keep')).toBeCloseTo(5);
    expect(after10h('citadel')).toBeCloseTo(10);
    expect(after10h('bastion')).toBeCloseTo(10); // Bastion 1 per hour (D138)
  });

  it('each level of Walls or Watchtower slows the rate by 2%, so 60% at the Bastion caps', () => {
    const s = at('bastion');
    s.buildings.walls = 3;
    s.buildings.watchtower = 2;
    expect(threatRate(s).value).toBeCloseTo(1 * (1 - 0.1));
    s.buildings.walls = 15;
    s.buildings.watchtower = 15;
    expect(threatRate(s).value).toBeCloseTo(1 * 0.4);
  });

  it('the rate breakdown names the Rank rate and what defenses take off', () => {
    const s = at('citadel');
    s.buildings.walls = 5;
    const tree = JSON.stringify(threatRate(s).breakdown);
    expect(tree).toContain('threat.ratePerHour');
    expect(tree).toContain('threat.defenseSlowPerLevel');
    expect(tree).toContain('Walls');
  });

  it('a failed contract adds 3 × tier; a completed one takes off 0.76 × tier; never below 0', () => {
    const s = at('keep');
    applyContractThreat(s, 4, false);
    expect(s.threat).toBe(12);
    applyContractThreat(s, 5, true);
    expect(s.threat).toBeCloseTo(8.2); // 12 − 0.76 × 5 (D138)
    for (let i = 0; i < 3; i++) applyContractThreat(s, 5, true);
    expect(s.threat).toBe(0);
    // The meter's tally counts what contracts did, before the floor.
    expect(s.cycles[0]?.contractThreat.added).toBe(12);
    expect(s.cycles[0]?.contractThreat.removed).toBeCloseTo(15.2);
  });

  it('the meter shows the value, the rate now and what contracts did this cycle', () => {
    const s = at('keep');
    applyContractThreat(s, 2, false);
    const m = threatMeter(s);
    expect(m.value).toBe(6);
    const tree = JSON.stringify(m.breakdown);
    expect(tree).toContain('threat.failedPerTier');
    expect(tree).toContain('threat.completedPerTier');
    expect(tree).toContain('per hour');
  });

  it('counts nothing while a pre-v0.4 save still faces its first Long Night', () => {
    const s = at('keep');
    s.arrivalDue = true;
    advance(s, T0 + 10 * HOUR);
    applyContractThreat(s, 3, false);
    expect(s.threat).toBe(0);
    expect(threatRate(s).value).toBe(0);
    expect(s.cycles[0]?.contractThreat).toEqual({ added: 0, removed: 0 });
  });

  it('time away counts as for production: the offline cap applies', () => {
    const s = at('bastion');
    catchUpNow(s, T0 + 48 * HOUR); // 12 h cap, no Bell Tower
    expect(s.threat).toBeCloseTo(12); // 12 h at 1 per hour
  });

  it('contracts finishing during advance() move Threat at the moment they finish', () => {
    const s = keepRich('threat-contracts');
    s.board.open = [
      {
        id: 'w',
        village: 'dubno-ford',
        monster: 'kikimora',
        tier: 1,
        location: 'field',
        arrivedAt: T0,
        revealed: 3,
      },
    ];
    expect(
      run(s, { type: 'contract.launch', contract: 'w', party: ['halvar', 'zora', 'ostap'] }).ok,
    ).toBe(true);
    advance(s, T0 + 10 * HOUR);
    const r = s.results.find((x) => x.contractId === 'w');
    expect(r?.success).toBe(true);
    // 0.5 h at 0.5/h = 0.25, minus 0.76 × tier 1, floored at 0; then 9.5 h at 0.5/h.
    expect(s.threat).toBeCloseTo(4.75);
    expect(s.cycles[0]?.contractThreat).toEqual({ added: 0, removed: 0.76 });
  });
});
