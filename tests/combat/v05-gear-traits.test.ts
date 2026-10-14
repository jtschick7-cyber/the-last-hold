// Plan T5.5: the Wright's Blade (GDD §5.3.6, D159, D170), Arvid's traits
// Shield-companion and Old Wright (GDD §8.5, D154), and his unlock and debug action.
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { buildHunter } from '../../src/core/combat/build';
import { outgoingPct, takenReduction } from '../../src/core/combat/stats';
import { unlockMet } from '../../src/core/systems/hunters';
import { freshAct } from '../../src/core/state/story-state';
import { cyclic, fightOf, lines, snap } from './helpers';
import { give, keepRich, run } from '../contracts/helpers';

describe("the Wright's Blade", () => {
  it('adds +12 Might and a Rune sub-hit beside the Silver one, each on its own line', () => {
    const z = snap('zora', {
      traits: [],
      weapon: 'wrights-blade',
      base: { health: 1000000, might: 60, armor: 3, speed: 13 },
    });
    const r = fightOf([z], 'anvil-wight', 3, cyclic([0.5]), 'ruin');
    // Might 60 + 12 = 72. Steel 72 × 0.5 = 36, − Armor 11 = 25.
    expect(lines(r, 'hit', 'zora')[0]?.amount).toBe(25);
    const subs = lines(r, 'sub-hit', 'zora');
    // Silver 0.25 × 72 × 1.0 = 18; Rune 0.25 × 72 × 1.75 = 31.5 → 32. No Armor on either.
    expect(subs[0]?.text).toContain('silver');
    expect(subs[0]?.amount).toBe(18);
    expect(subs[1]?.text).toContain('rune');
    expect(subs[1]?.amount).toBe(32);
  });

  it('needs Smithy 8 and the Citadel, and follows the Silvered Blade in place', () => {
    const s = keepRich('blade');
    give(s, 'zora');
    const h = s.hunters.zora;
    if (!h) throw new Error('no zora');
    h.weapon = 'silvered-blade';
    Object.assign(s.resources, { iron: 10_000, silver: 10_000 });
    s.buildings.smithy = 8;
    const atKeep = run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' });
    expect(atKeep.ok).toBe(false);
    if (!atKeep.ok) expect(atKeep.reason).toBe("The Wright's Blade needs the Citadel.");
    s.cycle.age = 'citadel';
    s.buildings.smithy = 7;
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(false);
    s.buildings.smithy = 8;
    expect(run(s, { type: 'gear.upgrade', hunter: 'zora', slot: 'weapon' }).ok).toBe(true);
    expect(h.weapon).toBe('wrights-blade');
    expect(s.resources).toMatchObject({ iron: 9_400, silver: 9_700 });
  });
});

describe('Shield-companion (Arvid)', () => {
  const party = (zoraHealth: number, arvidHealth = 175) => {
    const a = buildHunter(snap('arvid'), 1);
    const z = buildHunter(snap('zora'), 2);
    a.health = arvidHealth;
    z.health = zoraHealth;
    return [a, z] as const;
  };

  it('while he stands, the party member with the lowest % Health takes −15%', () => {
    const [a, z] = party(50);
    expect(takenReduction(z, 'steel', [a, z])).toBeCloseTo(0.15);
    expect(takenReduction(a, 'steel', [a, z])).toBe(0);
  });

  it('covers himself when he is the lowest, and nobody once he is down', () => {
    const [a, z] = party(100, 20);
    expect(takenReduction(a, 'steel', [a, z])).toBeCloseTo(0.15);
    const [a2, z2] = party(50, 0);
    expect(takenReduction(z2, 'steel', [a2, z2])).toBe(0);
  });

  it('ties go by party slot', () => {
    const [a, z] = party(100, 175 * (100 / 100));
    // Both at 100%: Arvid is slot 1.
    expect(takenReduction(a, 'steel', [a, z])).toBeCloseTo(0.15);
    expect(takenReduction(z, 'steel', [a, z])).toBe(0);
  });
});

describe('Old Wright (Arvid)', () => {
  it('+20% Might vs the Cursed, nothing vs others', () => {
    const a = buildHunter(snap('arvid'), 1);
    const ctx = (family: 'cursed' | 'restless-dead') => ({
      location: null,
      family,
      monsterId: 'upyr' as const,
      attacks: 1,
      hitCut: 0,
      oilBonus: 0.35,
    });
    expect(outgoingPct(a, 'rune', ctx('cursed'))).toBeCloseTo(0.2);
    expect(outgoingPct(a, 'rune', ctx('restless-dead'))).toBe(0);
  });
});

describe('Arvid Netmender (GDD §8.5)', () => {
  it('is a free story hunter who unlocks when Act III begins', () => {
    expect(hunters.arvid).toMatchObject({ recruitPrice: 0, story: true });
    const s = keepRich('arvid');
    expect(unlockMet(s, hunters.arvid.unlock)).toBe(false);
    s.story.acts.push(freshAct(2, 2, s.time), freshAct(3, 3, s.time));
    // Act III is written from v0.6 (D209), so Act III's start meets his unlock. How he
    // arrives (with Ilse, onto the roster) is T6.7.
    expect(unlockMet(s, hunters.arvid.unlock)).toBe(true);
  });

  it('a debug action adds him to the roster, for testing', () => {
    const s = keepRich('arvid-debug');
    expect(run(s, { type: 'debug.addArvid' }).ok).toBe(true);
    expect(s.hunters.arvid).toBeDefined();
    expect(s.meta.debugUsed).toBe(true);
    expect(run(s, { type: 'debug.addArvid' }).ok).toBe(false);
  });
});
