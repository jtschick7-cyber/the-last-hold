// Plan T2.12 (injury, rewards) and T2.16 (odds): GDD §5.3.7, §5.4, §7.3, §7.4.
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { runFight } from '../../src/core/combat';
import { injuryOutcome, needsDeathRoll, recoveryMult } from '../../src/core/contracts/injury';
import { computeOdds, type OddsInput } from '../../src/core/contracts/odds';
import { bounty, provisions, trophies, xpPerHunter } from '../../src/core/contracts/rewards';
import { deathSeed, fightSeed, oddsSeed } from '../../src/core/contracts/seeds';
import { seeded } from '../../src/core/rng';
import { snap } from '../combat/helpers';

const HOUR = 3600;
const calm = { tier: 2, reckless: false, story: false, recoveryMult: 1, deathRoll: null };

describe('injury (GDD §5.3.7)', () => {
  it('survived with at least 30% Health: fine', () => {
    expect(injuryOutcome({ health: 30, maxHealth: 100, downed: false }, calm)).toEqual({
      kind: 'none',
      recoverySeconds: 0,
    });
  });

  it('survived under 30%: bruised, 30 minutes', () => {
    expect(injuryOutcome({ health: 29, maxHealth: 100, downed: false }, calm)).toEqual({
      kind: 'bruised',
      recoverySeconds: 1800,
    });
  });

  it('downed: wounded for 2 h × tier', () => {
    expect(injuryOutcome({ health: 0, maxHealth: 100, downed: true }, calm)).toEqual({
      kind: 'wounded',
      recoverySeconds: 4 * HOUR,
    });
    expect(
      injuryOutcome({ health: 0, maxHealth: 100, downed: true }, { ...calm, tier: 5 })
        .recoverySeconds,
    ).toBe(10 * HOUR);
  });

  it('Hard to kill cuts every recovery time by 30%', () => {
    const m = recoveryMult(['hard-to-kill', 'quick']);
    expect(m).toBeCloseTo(0.7, 10);
    expect(
      injuryOutcome({ health: 0, maxHealth: 100, downed: true }, { ...calm, recoveryMult: m })
        .recoverySeconds,
    ).toBe(Math.round(4 * HOUR * 0.7));
    expect(
      injuryOutcome({ health: 5, maxHealth: 100, downed: false }, { ...calm, recoveryMult: m })
        .recoverySeconds,
    ).toBe(1260);
  });

  const reckless = { ...calm, reckless: true };
  const down = { health: 0, maxHealth: 100, downed: true };

  it('downed on a Reckless contract: a 30% death roll, else Grievously Wounded (3× the Wounded time)', () => {
    expect(injuryOutcome(down, { ...reckless, deathRoll: 0.29 }).kind).toBe('dead');
    expect(injuryOutcome(down, { ...reckless, deathRoll: 0.3 })).toEqual({
      kind: 'grievous',
      recoverySeconds: 3 * 4 * HOUR,
    });
  });

  it('story hunters never die: the death roll becomes Grievously Wounded', () => {
    expect(needsDeathRoll(down, { reckless: true, story: true })).toBe(false);
    expect(injuryOutcome(down, { ...reckless, story: true, deathRoll: 0 }).kind).toBe('grievous');
  });

  it('a non-story hunter can die only when downed on a Reckless contract', () => {
    expect(needsDeathRoll(down, { reckless: false, story: false })).toBe(false);
    expect(
      needsDeathRoll(
        { health: 5, maxHealth: 100, downed: false },
        { reckless: true, story: false },
      ),
    ).toBe(false);
    expect(needsDeathRoll(down, { reckless: true, story: false })).toBe(true);
    expect(() => injuryOutcome(down, reckless)).toThrow(/death roll/);
  });
});

describe('rewards (GDD §5.4)', () => {
  it('bounty is 60 × 1.6^(tier−1), with the Rank multiplier and Haggler', () => {
    expect(bounty(1, 'hamlet', []).value).toBe(60);
    expect(bounty(3, 'keep', []).value).toBeCloseTo(60 * 1.6 * 1.6, 8);
    expect(bounty(1, 'keep', [hunters.toma.traits]).value).toBeCloseTo(66, 8); // Toma is a Haggler
    expect(bounty(1, 'keep', [hunters.toma.traits]).breakdown.children?.length).toBeGreaterThan(3);
  });

  it('provisions: 30 × party × 2.2^(tier−1); tier 1 with 2 hunters is 60, tier 5 with 4 is about 2,811', () => {
    expect(provisions(2, 1).value).toBe(60);
    expect(provisions(4, 5).value).toBeCloseTo(2811.1, 0);
  });

  it('trophies equal the tier; XP is 20 × tier, half on a failure', () => {
    expect(trophies(4)).toBe(4);
    expect(trophies(4, true)).toBe(5);
    expect(xpPerHunter(3, true)).toBe(60);
    expect(xpPerHunter(3, false)).toBe(30);
  });
});

describe('seeds (technical design §7.2)', () => {
  it('the preview seed never equals the real fight seed', () => {
    const real = fightSeed('g', 'c1', ['halvar', 'zora'], []);
    expect(real).toBe('g:fight:c1:halvar,zora:');
    for (let i = 0; i < 500; i++)
      expect(oddsSeed('g', 'c1', ['halvar', 'zora'], [], i)).not.toBe(real);
    expect(deathSeed('g', 'c1', 'zora')).toBe('g:death:c1:zora');
  });
});

describe('odds (GDD §5.4.2, §7.4)', () => {
  const base: OddsInput = {
    gameSeed: 'seed',
    contractId: 'c1',
    party: [snap('halvar'), snap('zora'), snap('ostap')],
    monster: { monster: 'upyr', tier: 2 },
    location: 'field',
    rank: 'keep',
  };

  it('simulates 500 fights and reports the margin ±1.96 × √(p(1−p)/n)', () => {
    const o = computeOdds(base);
    expect(o.samples).toBe(500);
    expect(o.winChance).toBeGreaterThanOrEqual(0);
    expect(o.winChance).toBeLessThanOrEqual(1);
    expect(o.margin).toBeCloseTo(1.96 * Math.sqrt((o.winChance * (1 - o.winChance)) / 500), 12);
    expect(o.margin).toBeLessThanOrEqual(0.044); // within ±4.4 points (GDD §7.4)
  });

  it('is reproducible: the same inputs give the same odds', () => {
    expect(computeOdds(base)).toEqual(computeOdds(base));
    expect(computeOdds({ ...base, contractId: 'c2' }).winChance).not.toBe(undefined);
  });

  it('a strong party on an easy contract wins almost always; a weak one on a hard contract almost never', () => {
    const easy = computeOdds({ ...base, monster: { monster: 'kikimora', tier: 1 }, samples: 100 });
    expect(easy.winChance).toBeGreaterThan(0.95);
    const weak = computeOdds({
      ...base,
      party: [snap('zora')],
      monster: { monster: 'leshy', tier: 5 },
      location: 'forest',
      samples: 100,
    });
    expect(weak.winChance).toBeLessThan(0.05);
    expect(weak.reckless).toBe(true);
  });

  it('death chance is shown only on Reckless contracts, and never for story hunters', () => {
    const hard = computeOdds({
      ...base,
      party: [snap('toma'), snap('zora'), snap('ostap')],
      monster: { monster: 'leshy', tier: 5 },
      location: 'forest',
      samples: 100,
    });
    expect(hard.reckless).toBe(true);
    const byId = Object.fromEntries(hard.hunters.map((h) => [h.id, h]));
    expect(byId.toma?.death).toBe(0); // story hunter
    expect(byId.ostap?.death).toBe(0); // story hunter
    expect(byId.zora?.death).toBeCloseTo((byId.zora?.downed ?? 0) * 0.3, 12);
    const safe = computeOdds({ ...base, monster: { monster: 'kikimora', tier: 1 }, samples: 100 });
    expect(safe.reckless).toBe(false);
    for (const h of safe.hunters) expect(h.death).toBe(0);
  });

  it('expected rewards follow the win chance', () => {
    const o = computeOdds({ ...base, samples: 100 });
    expect(o.expectedBounty).toBeCloseTo(
      o.winChance *
        bounty(
          2,
          'keep',
          base.party.map((h) => h.traits),
        ).value,
      8,
    );
    expect(o.expectedTrophies).toBeCloseTo(o.winChance * 2, 12);
    expect(o.expectedXpPerHunter).toBeCloseTo(o.winChance * 40 + (1 - o.winChance) * 20, 10);
  });

  it('"Why?" explains damage per 100 ticks against Health, both ways', () => {
    const labels = (computeOdds({ ...base, samples: 20 }).why.children ?? []).map((c) => c.label);
    expect(labels.some((l) => l.startsWith('Party damage per 100 ticks'))).toBe(true);
    expect(labels.some((l) => l.includes('Upyr Health'))).toBe(true);
    expect(labels.some((l) => l.includes('Upyr damage per 100 ticks'))).toBe(true);
    expect(labels).toContain("Party's total Health");
  });

  it('is honest: the real fights win about as often as the preview says (±5 points)', () => {
    // Over many contract ids, the real outcome rate matches the preview rate.
    const o = computeOdds({
      ...base,
      party: [snap('halvar'), snap('zora')],
      monster: { monster: 'upyr', tier: 3 },
    });
    let wins = 0;
    const real = 600;
    for (let i = 0; i < real; i++) {
      const r = runFight({
        party: [snap('halvar'), snap('zora')],
        monster: { monster: 'upyr', tier: 3 },
        location: 'field',
        rolls: seeded(fightSeed('seed', `real${i}`, ['halvar', 'zora'], [])),
      });
      if (r.result === 'win') wins += 1;
    }
    expect(Math.abs(wins / real - o.winChance)).toBeLessThan(0.08);
  });
});
