// GDD §5.5.1: the required golden fight, line for line. This test gates v0.2
// (plan T2.8). It feeds the exact roll sequence from the GDD, so it doesn't
// depend on the random-number generator. Never edit the expected table to make
// it pass: a mismatch is a bug in the combat code, or a question for the owner.
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { runFight } from '../../src/core/combat';
import { scripted } from '../../src/core/rng';

const ROLLS = [
  0.4, 0.5, 0.7, 0.2, 0.6, 0.95, 0.95, 0.1, 0.3, 0.5, 0.3, 0.9, 0.1, 0.5, 0.2, 0.8, 0.6, 0.5, 0.4,
  0.7, 0.8, 0.3, 0.2, 0.4, 0.6, 0.1, 0.5, 0.15, 0.8, 0.6, 0.3, 0.3, 0.7, 0.9,
];

// tick, actor, rolls, dealt before Armor, damage, target Health after (GDD §5.5.1 table)
const TABLE: readonly (readonly [
  number,
  string,
  number[],
  number | null,
  number,
  string,
  number,
])[] = [
  [7, 'zora', [0.4, 0.5, 0.7], 20.0, 17, 'kikimora', 93],
  [8, 'kikimora', [0.2, 0.6, 0.95], 12.36, 9, 'zora', 91],
  [13, 'zora', [0.95], null, 0, 'kikimora', 93],
  [16, 'kikimora', [0.1, 0.3, 0.5], 11.28, 8, 'zora', 83],
  [19, 'zora', [0.3, 0.9, 0.1], 33.6, 31, 'kikimora', 62],
  [24, 'kikimora', [0.5, 0.2, 0.8], 10.92, 8, 'zora', 75],
  [25, 'zora', [0.6, 0.5, 0.4], 20.0, 17, 'kikimora', 45],
  [31, 'kikimora', [0.7, 0.8, 0.3], 13.08, 10, 'zora', 65],
  [32, 'zora', [0.2, 0.4, 0.6], 19.4, 16, 'kikimora', 29],
  [38, 'zora', [0.1, 0.5, 0.15], 30.0, 27, 'kikimora', 2],
  [39, 'kikimora', [0.8, 0.6, 0.3], 12.36, 9, 'zora', 56],
  [44, 'zora', [0.3, 0.7, 0.9], 21.2, 18, 'kikimora', 0],
];

describe('GDD §5.5.1 worked fight: Zora Sedlak vs a tier-1 Kikimora', () => {
  const rolls = scripted(ROLLS);
  const fight = runFight({
    party: [
      {
        id: 'zora',
        name: hunters.zora.name,
        role: hunters.zora.role,
        damage: hunters.zora.damage,
        level: 1,
        base: hunters.zora.stats,
        traits: hunters.zora.traits,
        weapon: null,
        armorGear: null,
      },
    ],
    monster: { monster: 'kikimora', tier: 1 },
    location: 'field', // a field contract, so Fen-born doesn't apply
    rolls,
  });
  const actions = fight.log.filter((e) => e.kind !== 'end');

  it('has 34 scripted rolls, and every one is consumed', () => {
    expect(ROLLS).toHaveLength(34);
    rolls.assertConsumed();
  });

  it('has exactly twelve actions, on the table ticks', () => {
    expect(actions.map((e) => e.tick)).toEqual(TABLE.map((r) => r[0]));
  });

  it.each(TABLE)(
    'tick %i: %s uses the rolls, deals the damage, leaves %s at the right Health',
    (tick, actor, used, dealt, damage, target, health) => {
      const entry = actions.find((e) => e.tick === tick);
      expect(entry).toBeDefined();
      expect(entry?.actor).toBe(actor);
      expect(entry?.target).toBe(target);
      expect(entry?.rolls).toEqual(used);
      expect(entry?.amount).toBe(damage);
      expect(entry?.targetHealth).toBe(health);
      if (dealt === null) expect(entry?.kind).toBe('miss');
      else expect(entry?.dealt?.toFixed(2)).toBe(dealt.toFixed(2));
    },
  );

  it('marks the two crits (ticks 19 and 38)', () => {
    expect(actions.filter((e) => e.kind === 'crit').map((e) => e.tick)).toEqual([19, 38]);
  });

  it('ends in success at tick 44 with Zora at 56/100, so no injury', () => {
    expect(fight.result).toBe('win');
    expect(fight.endedBy).toBe('monster-down');
    expect(fight.ticks).toBe(44);
    expect(fight.hunters).toEqual([{ id: 'zora', health: 56, maxHealth: 100, downed: false }]);
    expect(56 / 100).toBeGreaterThanOrEqual(0.3);
  });

  it('draws no target roll with one hunter standing, and Zora is Speed 16 (13 + Quick 3)', () => {
    // Tick 7 is Zora's first action: 16 Speed reaches the 100 threshold on the 7th tick.
    expect(Math.ceil(100 / 16)).toBe(7);
    expect(actions[0]?.rolls).toHaveLength(3);
  });

  it('reads like the GDD log format', () => {
    expect(actions[0]?.text).toBe(
      'Zora Sedlak (Striker) hits the Kikimora — Steel 20.00 −3.00 armor = 17 · Kikimora 93/110',
    );
  });
});
