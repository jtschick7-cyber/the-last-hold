// Plan T7.7 (GDD §8.3, §5.10.4, D252): the Deep guardians. One test per ability, plus Health ×2,
// tier scaling past 5, the resistances, and the Nameless breakdown.
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { MONSTER_IDS } from '../../src/content/monsters';
import type { GuardianId } from '../../src/content/delves/guardians';
import { runFight, type FightInput } from '../../src/core/combat';
import { endOwnAction } from '../../src/core/combat/fight';
import { heal } from '../../src/core/combat/formula';
import type { Combatant } from '../../src/core/combat/types';
import { namelessBonus, unstudiedSpecies } from '../../src/core/delves/nameless';
import { createNewGame } from '../../src/core/state/new-game';
import { cyclic, lines, snap, sponge } from './helpers';

const guardian = (g: GuardianId, tier = 2, extra: object = {}) => ({ guardian: g, tier, ...extra });
const fight = (
  party: FightInput['party'],
  monster: FightInput['monster'],
  rest: Partial<FightInput> = {},
) => runFight({ party, monster, location: null, rolls: cyclic([0.5]), ...rest });
const fixed = (id: 'halvar' | 'zora' | 'ostap', over: { might?: number; health?: number }) => {
  const h = hunters[id];
  return snap(id, {
    base: { ...h.stats, might: over.might ?? h.stats.might, health: over.health ?? 100000 },
    traits: [],
  });
};

describe('the guardians’ stats and tiers (D249, D252)', () => {
  it('fight at the GDD’s base stats at tier 2, and Health × delve.guardianHealth when asked', () => {
    const plain = fight([sponge('halvar')], guardian('unlits-breath'));
    expect(plain.monsters[0]?.maxHealth).toBe(260);
    const doubled = fight([sponge('halvar')], guardian('unlits-breath', 2, { healthMult: 2 }));
    expect(doubled.monsters[0]?.maxHealth).toBe(520);
    expect(
      fight([sponge('halvar')], guardian('dross-tide', 2, { healthMult: 2 })).monsters[0]
        ?.maxHealth,
    ).toBe(640);
  });

  it('scale by tier like any monster, and the scaling goes on past tier 5 (D249)', () => {
    const at = (tier: number) =>
      fight([sponge('halvar')], guardian('the-forgotten', tier)).monsters[0]?.maxHealth ?? 0;
    expect(at(4)).toBe(Math.floor(240 * 1.35 ** 2 + 0.5));
    expect(at(7)).toBe(Math.floor(240 * 1.35 ** 5 + 0.5));
    // Armor × 1.15 per step: the log shows the Armor a hit met.
    const r = fight([fixed('halvar', { might: 80 })], guardian('the-forgotten', 7));
    const hit = lines(r, 'hit', 'halvar')[0];
    expect(hit?.text).toContain(`−${(5 * 1.15 ** 5).toFixed(2)} armor`);
  });

  it('are immune where the GDD says: Frost and Venom for the Breath, Venom for the others', () => {
    const frost = fight([snap('bjarna')], guardian('unlits-breath'));
    expect(lines(frost, 'hit', 'bjarna')[0]?.text).toContain('immune');
    const venom = fight([snap('vesna')], guardian('the-forgotten'));
    expect(venom.log.some((e) => e.actor === 'vesna' && e.text.includes('immune'))).toBe(true);
  });
});

describe('Chill (Unlit’s Breath)', () => {
  it('halves the healing a hit hunter receives, for their next 3 actions, then ends', () => {
    const c = { health: 10, maxHealth: 100, healCutLeft: 3, healCut: 0.5 } as Combatant;
    expect(heal(c, 40)).toBe(20);
    c.healCutLeft = 0;
    expect(heal(c, 40)).toBe(40);
  });

  it('wears off after the chilled hunter’s own 3 actions', () => {
    const c = {
      health: 10,
      maxHealth: 100,
      healCutLeft: 3,
      healCut: 0.5,
      tonicLeft: 0,
      chillLeft: 0,
      abilitiesBlocked: 0,
      hamstringLeft: 0,
    } as Combatant;
    endOwnAction(c);
    endOwnAction(c);
    expect(heal(c, 40)).toBe(20); // still chilled after 2 of 3
    c.health = 10;
    endOwnAction(c);
    expect(c.healCutLeft).toBe(0);
    expect(heal(c, 40)).toBe(40);
  });

  it('is applied on a hit, and the Mender’s heals on the chilled hunter are half what they are without it', () => {
    const run = (monster: FightInput['monster']) =>
      runFight({
        party: [fixed('halvar', { might: 1 }), fixed('ostap', { might: 20 })],
        monster,
        location: null,
        rolls: cyclic([0.5]),
        // Halvar starts badly hurt, so the Mender heals him whenever she can.
        stand: { health: { halvar: 1000 }, monsterStrength: 1, partyTaken: 0, volley: 0 },
      });
    const chilled = run(guardian('unlits-breath'));
    expect(
      chilled.log.some((e) => e.text.includes('is chilled (healing −50% for 3 actions)')),
    ).toBe(true);
    const half = lines(chilled, 'heal', 'ostap').map((e) => e.amount);
    expect(half.length).toBeGreaterThan(0);
    expect(new Set(half)).toEqual(new Set([15]));
    // The Forgotten has no Chill: the same Mender heals 30 (1.5 × 20).
    const whole = lines(run(guardian('the-forgotten')), 'heal', 'ostap').map((e) => e.amount);
    expect(new Set(whole)).toEqual(new Set([30]));
  });
});

describe('Drain (Unlit’s Breath)', () => {
  it('takes 2% of every standing hunter’s max Health as Frost on each action, ignoring Armor', () => {
    const r = fight([sponge('halvar'), sponge('zora')], guardian('unlits-breath'));
    const drains = r.log.filter((e) => e.text.startsWith('The cold drains'));
    expect(drains.length).toBeGreaterThan(2);
    for (const e of drains) expect(e.amount).toBe(2000); // 2% of 100000, whatever the Armor
    const first = drains.filter((e) => e.tick === drains[0]?.tick);
    expect(first.map((e) => e.target)).toEqual(['halvar', 'zora']);
  });
});

describe('Nameless (the Forgotten)', () => {
  it('adds 3% Might and Health per species not yet Studied, up to 48%', () => {
    const maxHealth = (n: number) =>
      fight([sponge('halvar')], guardian('the-forgotten'), { nameless: n }).monsters[0]?.maxHealth;
    expect(maxHealth(0)).toBe(240);
    expect(maxHealth(5)).toBe(Math.floor(240 * 1.15 + 0.5));
    expect(maxHealth(16)).toBe(Math.floor(240 * 1.48 + 0.5));
    const dealt = (n: number) =>
      lines(
        fight([sponge('halvar')], guardian('the-forgotten'), { nameless: n }),
        'hit',
        'the-forgotten',
      )[0]?.dealt ?? 0;
    expect(dealt(0)).toBeCloseTo(18);
    expect(dealt(16)).toBeCloseTo(18 * 1.48);
  });

  it('has a breakdown from the bestiary: one line per species not yet Studied', () => {
    const s = createNewGame('nameless', 1_000);
    expect(unstudiedSpecies(s)).toEqual([...MONSTER_IDS]);
    const all = namelessBonus(s);
    expect(all.value.count).toBe(16);
    expect(all.value.might).toBeCloseTo(0.48);
    expect(all.breakdown.children).toHaveLength(16);
    s.bestiary.upyr = { level: 3, kills: 4 };
    s.bestiary.wolf = { level: 2, kills: 1 };
    const some = namelessBonus(s);
    expect(some.value.count).toBe(15); // Studied counts; Identified does not
    expect(some.breakdown.children?.some((c) => c.label.startsWith('Upyr'))).toBe(false);
    expect(some.breakdown.children?.some((c) => c.label.startsWith('Gaunt Wolf'))).toBe(true);
    expect(some.breakdown.value).toBeCloseTo(0.45);
  });
});

describe('Settling (the Dross-Tide)', () => {
  it('on every 3rd action its attack hits every standing hunter, each rolled and resolved as a direct attack', () => {
    const r = fight([sponge('halvar'), sponge('zora'), sponge('ostap')], guardian('dross-tide'));
    const settles = r.log.filter((e) => e.text.includes('settles over the whole party'));
    expect(settles.length).toBeGreaterThan(1);
    // The 3rd action: the settle line, then one attack on each of the three hunters at that tick.
    const tick = settles[0]?.tick ?? 0;
    const attacks = r.log.filter(
      (e) => e.tick === tick && e.actor === 'dross-tide' && e.kind !== 'ability',
    );
    expect(attacks.map((e) => e.target)).toEqual(['halvar', 'zora', 'ostap']);
    for (const e of attacks) expect(e.rolls).toHaveLength(3); // hit, spread, crit: no target roll
    // Armor applies to each (a direct attack).
    expect(attacks[0]?.text).toMatch(/armor/);
    // Between settles it attacks one hunter at a time (with its target roll).
    const otherTicks = r.log.filter(
      (e) => e.actor === 'dross-tide' && e.kind !== 'ability' && e.tick !== tick,
    );
    expect(otherTicks[0]?.rolls).toHaveLength(4);
  });
});
