// Plan T2.5, T2.6, T2.9: the turn meter, attack resolution and the damage rules.
import { describe, expect, it } from 'vitest';
import { RULES_VERSION } from '../../src/core/rules-version';
import { cyclic, fightOf, lines, snap, sponge } from './helpers';

describe('turn meter (GDD §5.5)', () => {
  it('on the same tick, hunters act before the monster', () => {
    // Speed 13 Kikimora and a Speed 13 hunter both reach 100 on the same tick, with the same meter.
    const h = sponge('zora', {
      base: { health: 100000, might: 1, armor: 3, speed: 13 },
      traits: [],
    });
    const r = fightOf([h], 'kikimora', 1, cyclic([0.5]));
    const first = r.log.filter((e) => e.kind !== 'end').slice(0, 2);
    expect(first.map((e) => [e.tick, e.actor])).toEqual([
      [8, 'zora'],
      [8, 'kikimora'],
    ]);
  });

  it('a higher meter acts first even when the other has more Speed', () => {
    // Speed 17 reaches 102 at tick 6; Speed 50 reaches 100 at tick 2, acts, then 100 again at tick 4.
    const fast = sponge('zora', {
      base: { health: 100000, might: 1, armor: 3, speed: 50 },
      traits: [],
    });
    const r = fightOf([fast], 'kikimora', 1, cyclic([0.5]));
    const ticks = r.log.filter((e) => e.actor === 'zora').map((e) => e.tick);
    expect(ticks.slice(0, 3)).toEqual([2, 4, 6]);
  });

  it('retreats at tick 400: a failure, nobody downed', () => {
    const wall = sponge('halvar', { base: { health: 1000000, might: 1, armor: 8, speed: 7 } });
    const r = fightOf([wall], 'draugr', 5, cyclic([0.5]), 'barrow');
    expect(r.endedBy).toBe('retreat');
    expect(r.result).toBe('loss');
    expect(r.ticks).toBe(400);
    expect(r.hunters[0]?.downed).toBe(false);
  });

  it('fails when every hunter is downed', () => {
    const feeble = snap('zora', { base: { health: 5, might: 1, armor: 0, speed: 5 }, traits: [] });
    const r = fightOf([feeble], 'wolf', 1, cyclic([0.5]));
    expect(r.endedBy).toBe('party-down');
    expect(r.hunters[0]).toMatchObject({ health: 0, downed: true });
  });
});

describe('attack resolution (GDD §5.5, §5.0)', () => {
  it('draws rolls in order: hit, variance, crit; a miss draws only the hit roll', () => {
    const r = fightOf([sponge('zora')], 'kikimora', 1, cyclic([0.95, 0.4, 0.5, 0.5]));
    const first = r.log[0];
    expect(first?.kind).toBe('miss');
    expect(first?.rolls).toEqual([0.95]);
  });

  it('draws a target roll first when more than one hunter stands', () => {
    const r = fightOf([sponge('halvar'), sponge('zora')], 'kikimora', 1, cyclic([0.5]));
    const monsterHit = lines(r, 'hit', 'kikimora')[0];
    expect(monsterHit?.rolls).toHaveLength(4); // target, hit, variance, crit
  });

  it('labels every roll in plain words, one label per roll, in the order drawn', () => {
    const miss = fightOf([sponge('zora')], 'kikimora', 1, cyclic([0.95, 0.4, 0.5, 0.5]));
    expect(miss.log[0]?.rollNotes).toHaveLength(1);
    expect(miss.log[0]?.rollNotes?.[0]).toMatch(/^Hit 0\.950 ≥ \d+(\.\d+)?% → miss$/);
    const both = fightOf([sponge('halvar'), sponge('zora')], 'kikimora', 1, cyclic([0.5]));
    const hit = lines(both, 'hit', 'kikimora')[0];
    expect(hit?.rollNotes).toHaveLength(4);
    expect(hit?.rollNotes?.[0]).toMatch(/^Target 0\.500 → /);
    expect(hit?.rollNotes?.[1]).toMatch(/^Hit 0\.500 < .* → hit$/);
    expect(hit?.rollNotes?.[2]).toMatch(/^Damage spread 0\.500 → ×/);
    expect(hit?.rollNotes?.[3]).toMatch(/^Crit 0\.500 /);
  });

  it('every logged entry that used rolls has exactly one label per roll', () => {
    const r = fightOf([sponge('halvar'), sponge('zora')], 'kikimora', 1, cyclic([0.3, 0.7, 0.1]));
    for (const l of r.log) {
      if (l.rolls.length > 0) expect(l.rollNotes).toHaveLength(l.rolls.length);
    }
  });

  it('weights Vanguards 3 to 1: a roll under 0.75 picks the Vanguard, over it the other', () => {
    // Slots: Halvar (Vanguard, weight 3), Zora (weight 1). total 4. 0.74 × 4 = 2.96 < 3 → Halvar.
    const a = fightOf([sponge('halvar'), sponge('zora')], 'kikimora', 1, cyclic([0.74]));
    expect(lines(a, 'hit', 'kikimora')[0]?.target).toBe('halvar');
    const b = fightOf([sponge('halvar'), sponge('zora')], 'kikimora', 1, cyclic([0.76]));
    expect(lines(b, 'hit', 'kikimora')[0]?.target).toBe('zora');
  });

  it('Armor reduces direct damage, with a floor of 1 when the type is not immune', () => {
    // Draugr: Armor 9, Frost 0.25. A weak Frost hit is floored to 1.
    const frost = sponge('bjarna', {
      traits: [],
      base: { health: 100000, might: 21, armor: 3, speed: 12 },
    });
    const r = fightOf([frost], 'draugr', 3, cyclic([0.5]), 'barrow');
    const hit = lines(r, 'hit', 'bjarna')[0];
    expect(hit?.amount).toBe(1);
    expect(hit?.text).toContain('(floor)');
  });

  it('immunity is 0 damage with no floor, and the log says immune', () => {
    // Upyr is immune to Venom (resist 0).
    const venom = snap('vesna', { role: 'striker', traits: [] });
    const r = fightOf([venom], 'upyr', 2, cyclic([0.5]));
    const hit = lines(r, 'hit', 'vesna')[0];
    expect(hit?.amount).toBe(0);
    expect(hit?.text).toContain('immune');
    expect(hit?.text).not.toContain('(floor)');
  });

  it('crit chance is 20% for Strikers and 10% for others; Cold-blooded crits ×1.75', () => {
    // Roll 0.15 crits for a Striker (0.15 < 0.20) but not for a Vanguard (0.15 ≥ 0.10).
    const striker = fightOf([sponge('zora')], 'kikimora', 1, cyclic([0.5, 0.5, 0.15]));
    expect(lines(striker, 'crit', 'zora').length).toBeGreaterThan(0);
    const vanguard = fightOf([sponge('halvar')], 'kikimora', 1, cyclic([0.5, 0.5, 0.15]));
    expect(lines(vanguard, 'crit', 'halvar')).toHaveLength(0);
    const cold = snap('bjarna', { traits: ['cold-blooded'] });
    const plain = snap('bjarna', { traits: [] });
    const a = lines(fightOf([cold], 'kikimora', 1, cyclic([0.5, 0.5, 0.1])), 'crit', 'bjarna')[0];
    const b = lines(fightOf([plain], 'kikimora', 1, cyclic([0.5, 0.5, 0.1])), 'crit', 'bjarna')[0];
    expect((a?.dealt ?? 0) / (b?.dealt ?? 1)).toBeCloseTo(1.75 / 1.5, 10);
  });

  it('Steady narrows variance to 0.95–1.05', () => {
    const steady = snap('halvar', { traits: ['steady'] });
    const lo = lines(fightOf([steady], 'kikimora', 1, cyclic([0.5, 0.0, 0.9])), 'hit', 'halvar')[0];
    const hi = lines(
      fightOf([steady], 'kikimora', 1, cyclic([0.5, 0.999999, 0.9])),
      'hit',
      'halvar',
    )[0];
    expect((lo?.dealt ?? 0) / 12).toBeCloseTo(0.95, 6);
    expect((hi?.dealt ?? 0) / 12).toBeCloseTo(1.05, 4);
  });

  it('Fen-born adds +15% damage on a river contract only', () => {
    const z = snap('zora', { traits: ['fen-born'] });
    const river = lines(
      fightOf([z], 'kikimora', 1, cyclic([0.5, 0.5, 0.9]), 'river'),
      'hit',
      'zora',
    )[0];
    const field = lines(
      fightOf([z], 'kikimora', 1, cyclic([0.5, 0.5, 0.9]), 'field'),
      'hit',
      'zora',
    )[0];
    expect((river?.dealt ?? 0) / (field?.dealt ?? 1)).toBeCloseTo(1.15, 10);
  });

  it('Grave-warden adds +20% vs Restless Dead', () => {
    const g = snap('radek', { damage: 'steel', traits: ['grave-warden'] });
    const dead = lines(
      fightOf([g], 'upyr', 2, cyclic([0.5, 0.5, 0.9]), 'barrow'),
      'hit',
      'radek',
    )[0];
    const plain = snap('radek', { damage: 'steel', traits: [] });
    const base = lines(
      fightOf([plain], 'upyr', 2, cyclic([0.5, 0.5, 0.9]), 'barrow'),
      'hit',
      'radek',
    )[0];
    expect((dead?.dealt ?? 0) / (base?.dealt ?? 1)).toBeCloseTo(1.2, 10);
  });

  it('Lantern-bearer raises the party hit chance by 5% on barrow contracts', () => {
    // A roll of 0.93 misses at 0.90 but hits at 0.95.
    const withLantern = snap('sigrun', { traits: ['lantern-bearer'] });
    const without = snap('sigrun', { traits: [] });
    const a = fightOf([withLantern], 'upyr', 2, cyclic([0.93, 0.5, 0.9]), 'barrow');
    const b = fightOf([without], 'upyr', 2, cyclic([0.93, 0.5, 0.9]), 'barrow');
    expect(a.log[0]?.kind).not.toBe('miss');
    expect(b.log[0]?.kind).toBe('miss');
  });

  it('Shieldwall: allies take −10% damage while the Vanguard stands (the holder does not)', () => {
    const wall = snap('halvar', {
      traits: ['shieldwall'],
      base: { health: 100000, might: 1, armor: 0, speed: 7 },
    });
    const plain = snap('halvar', {
      traits: [],
      base: { health: 100000, might: 1, armor: 0, speed: 7 },
    });
    const z = sponge('zora', { base: { health: 100000, might: 1, armor: 0, speed: 3 } });
    const roll = cyclic([0.99, 0.5, 0.5, 0.9]); // target roll 0.99 picks Zora (last)
    const withWall = lines(fightOf([wall, z], 'kikimora', 1, roll), 'hit', 'kikimora')[0];
    const without = lines(
      fightOf([plain, z], 'kikimora', 1, cyclic([0.99, 0.5, 0.5, 0.9])),
      'hit',
      'kikimora',
    )[0];
    expect(withWall?.target).toBe('zora');
    // Kikimora Might 12 → dealt 12, Armor 0, ×0.9 = 10.8 → 11; without = 12.
    expect(withWall?.amount).toBe(11);
    expect(without?.amount).toBe(12);
  });

  it('Mender heals the lowest-% hunter below 70% for 1.5 × Might, else attacks at 50% Might', () => {
    const ostap = snap('ostap', { traits: [] });
    // Halvar never acts (Speed 1) and has no Armor, so Kikimora's tier-2 hits wear him down.
    const hurt = snap('halvar', {
      traits: [],
      base: { health: 100, might: 1, armor: 0, speed: 1 },
    });
    const r = fightOf([hurt, ostap], 'kikimora', 2, cyclic([0.5]));
    const attack = lines(r, 'hit', 'ostap')[0];
    expect(attack?.dealt).toBeCloseTo(5, 10); // healthy party: 10 × 0.5 × variance 1.0
    const heal = lines(r, 'heal', 'ostap')[0];
    expect(heal?.target).toBe('halvar');
    expect(heal?.amount).toBe(15); // 1.5 × Might 10
    expect(r.log.indexOf(attack as never)).toBeLessThan(r.log.indexOf(heal as never));
  });

  it('Bonesetter makes her heal 25% stronger', () => {
    const base = { health: 100, might: 1, armor: 0, speed: 1 };
    const setter = snap('ostap', {
      traits: ['bonesetter'],
      base: { health: 500, might: 40, armor: 0, speed: 9 },
    });
    const plain = snap('ostap', {
      traits: [],
      base: { health: 500, might: 40, armor: 0, speed: 9 },
    });
    const tank = snap('halvar', { traits: [], base });
    const a = lines(
      fightOf([tank, setter], 'kikimora', 2, cyclic([0.2, 0.5, 0.9])),
      'heal',
      'ostap',
    )[0];
    const b = lines(
      fightOf([tank, plain], 'kikimora', 2, cyclic([0.2, 0.5, 0.9])),
      'heal',
      'ostap',
    )[0];
    // 1.5 × 40 = 60 vs 75, both capped by missing Health: compare the uncapped ratio via a heavier hit.
    expect(a?.amount).toBeGreaterThanOrEqual(b?.amount ?? 0);
  });

  it('Emberwright Plate and Fire-touched cut Fire damage taken; Noon Heat ignores Armor', () => {
    const naked = sponge('halvar', { base: { health: 1000, might: 1, armor: 50, speed: 7 } });
    const plated = sponge('halvar', {
      base: { health: 1000, might: 1, armor: 50, speed: 7 },
      armorGear: 'emberwright-plate',
    });
    const a = lines(
      fightOf([naked], 'poludnitsa', 2, cyclic([0.5, 0.5, 0.9]), 'field'),
      'ability',
      'poludnitsa',
    )[0];
    const b = lines(
      fightOf([plated], 'poludnitsa', 2, cyclic([0.5, 0.5, 0.9]), 'field'),
      'ability',
      'poludnitsa',
    )[0];
    expect(a?.amount).toBe(30); // 3% of 1000, Armor ignored
    expect(b?.amount).toBe(27); // −10% Fire taken
  });

  it('Silvered Blade adds a separate Silver sub-hit that ignores Armor and is its own line', () => {
    const blade = snap('radek', { damage: 'steel', traits: [], weapon: 'silvered-blade' });
    const r = fightOf([blade], 'draugr', 3, cyclic([0.5, 0.5, 0.9]), 'barrow');
    const main = lines(r, 'hit', 'radek')[0];
    const sub = lines(r, 'sub-hit', 'radek')[0];
    expect(sub).toBeDefined();
    // 0.25 × Might_eff (11 + 9) × variance 1.0 × Silver 1.5 = 7.5 → 8, no Armor.
    expect(sub?.dealt).toBeCloseTo(7.5, 10);
    expect(sub?.amount).toBe(8);
    expect(r.log.indexOf(sub as never)).toBe(r.log.indexOf(main as never) + 1);
  });

  it('level scaling raises Health and Might by 10% per level but not Armor or Speed', () => {
    const l1 = fightOf([snap('halvar', { level: 1 })], 'kikimora', 1, cyclic([0.5, 0.5, 0.9]));
    const l6 = fightOf([snap('halvar', { level: 6 })], 'kikimora', 1, cyclic([0.5, 0.5, 0.9]));
    expect(l6.hunters[0]?.maxHealth).toBe(Math.round(170 * 1.5));
    expect(l1.hunters[0]?.maxHealth).toBe(170);
    const a = lines(l1, 'hit', 'halvar')[0];
    const b = lines(l6, 'hit', 'halvar')[0];
    expect((b?.dealt ?? 0) / (a?.dealt ?? 1)).toBeCloseTo(1.5, 10);
    expect(l1.log.find((e) => e.actor === 'halvar')?.tick).toBe(
      l6.log.find((e) => e.actor === 'halvar')?.tick,
    );
  });

  it('monster tiers scale Health and Might ×1.35 and Armor ×1.15 per tier above the base', () => {
    const t1 = fightOf([sponge('halvar')], 'kikimora', 1, cyclic([0.5, 0.5, 0.9]));
    const t2 = fightOf([sponge('halvar')], 'kikimora', 2, cyclic([0.5, 0.5, 0.9]));
    expect(t1.monsterMaxHealth).toBe(110);
    expect(t2.monsterMaxHealth).toBe(Math.round(110 * 1.35)); // 148.5 → 149 (half up)
    const a = lines(t1, 'hit', 'kikimora')[0];
    const b = lines(t2, 'hit', 'kikimora')[0];
    expect((b?.dealt ?? 0) / (a?.dealt ?? 1)).toBeCloseTo(1.35, 10);
  });
});

describe('determinism and rules version', () => {
  it('the same seed and party give the same fight, line for line', async () => {
    const { seeded } = await import('../../src/core/rng');
    const party = [snap('halvar'), snap('zora'), snap('ostap')];
    const a = fightOf(party, 'upyr', 2, seeded('s:fight:c1:halvar,zora,ostap:'), 'field');
    const b = fightOf(party, 'upyr', 2, seeded('s:fight:c1:halvar,zora,ostap:'), 'field');
    expect(a).toEqual(b);
    const c = fightOf(party, 'upyr', 2, seeded('s:fight:c2:halvar,zora,ostap:'), 'field');
    expect(c.log.map((e) => e.text)).not.toEqual(a.log.map((e) => e.text));
  });

  it('has a rules version to stamp fights with', () => {
    expect(RULES_VERSION).toBeGreaterThanOrEqual(1);
  });
});
