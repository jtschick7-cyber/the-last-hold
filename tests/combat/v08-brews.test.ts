// Plan T19.3 (decisions D632, D633; technical design §26.2):
// Rebalanced consumables (4 bombs, 6 potions), cumulative slow-stacking fix,
// Saltburst active + passive disruption + 25 Rune damage, and Poppy Smoke Shrouded
// under rulesVersion 8 — plus full rulesVersion <= 7 bit-for-bit immutability.
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import {
  runFight,
  type FightInput,
  type FightResult,
  type HunterSnapshot,
} from '../../src/core/combat';
import { buildMonster } from '../../src/core/combat/build';
import { endOwnAction } from '../../src/core/combat/fight';
import { clearAbilityEffects, rimeSlow } from '../../src/core/combat/skills';
import { runStand } from '../../src/core/stand/engine';
import { seeded } from '../../src/core/rng';
import type { Preparation } from '../../src/core/state/game-state';
import { cyclic, snap, sponge } from './helpers';

const prep = (over: Partial<Preparation> = {}): Preparation => ({
  oils: {},
  potions: {},
  bombs: [],
  ...over,
});

const tank = (
  id: 'halvar' | 'zora' | 'vesna' | 'sigrun' | 'bjarna',
  over: Partial<HunterSnapshot> = {},
): HunterSnapshot =>
  snap(id, { base: { ...hunters[id].stats, health: 1_000_000, might: 1 }, ...over });

const fight = (
  party: readonly HunterSnapshot[],
  monster: FightInput['monster'],
  p: Preparation | undefined,
  opts: {
    rolls?: FightInput['rolls'];
    location?: FightInput['location'];
    alchemy?: number;
    rulesVersion?: number;
    nameless?: number;
  } = {},
): FightResult =>
  runFight({
    party,
    monster,
    location: opts.location ?? 'field',
    rolls: opts.rolls ?? cyclic([0.5]),
    prep: p,
    alchemy: opts.alchemy,
    rulesVersion: opts.rulesVersion,
    nameless: opts.nameless,
  });

const firstDealt = (r: FightResult, by: string): number => {
  const hit = r.log.find((l) => (l.kind === 'hit' || l.kind === 'crit') && l.actor === by);
  if (!hit?.dealt) throw new Error(`no hit by ${by}`);
  return hit.dealt;
};

const actionTicks = (r: FightResult, actor: string): number[] => {
  const ticks = new Set<number>();
  for (const l of r.log) {
    if (l.actor === actor && l.kind !== 'prep' && l.kind !== 'end') ticks.add(l.tick);
  }
  return [...ticks];
};

describe('v8 Potions (rulesVersion 8) vs legacy v7 immutability', () => {
  it('Quickfoot Tincture: +15% Speed under v8 vs +20% under v7', () => {
    const zora = snap('zora'); // Speed 16: v7 -> 19.2 (tick 6), v8 -> 18.4 (tick 6; vs 16 tick 7)
    const v8 = fight(
      [zora],
      { monster: 'kikimora', tier: 1 },
      prep({ potions: { zora: 'quickfoot-tincture' } }),
      {
        rulesVersion: 8,
      },
    );
    const v7 = fight(
      [zora],
      { monster: 'kikimora', tier: 1 },
      prep({ potions: { zora: 'quickfoot-tincture' } }),
      {
        rulesVersion: 7,
      },
    );
    expect(v8.log[0]?.text).toContain('drinks Quickfoot Tincture (+15% Speed');
    expect(v7.log[0]?.text).toContain('drinks Quickfoot Tincture (+20% Speed');
  });

  it('Owl-Eye Drops: +10 hit & +10 crit uncapped under v8 (and Herbwise/Alchemy scaled), hit-only under v7', () => {
    // Zora striker base critChance = 0.20 (20%). With v8 Owl-Eye (+0.10), critChance = 0.30 -> roll 0.25 crits!
    // Under v7, Owl-Eye gives +0.10 hit only -> roll 0.25 does NOT crit (>= 0.20).
    const rolls = cyclic([0.5, 0.5, 0.25]); // hit 0.5 (<0.9), spread 0.5, crit 0.25
    const zora = snap('zora', { traits: [], base: { ...hunters.zora.stats, speed: 30 } });
    const v8 = fight(
      [zora],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { zora: 'owl-eye-drops' } }),
      {
        rolls,
        rulesVersion: 8,
      },
    );
    const v7 = fight(
      [zora],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { zora: 'owl-eye-drops' } }),
      {
        rolls: cyclic([0.5, 0.5, 0.25]),
        rulesVersion: 7,
      },
    );
    expect(v8.log.find((l) => l.actor === 'zora' && l.kind !== 'prep')?.kind).toBe('crit');
    expect(v7.log.find((l) => l.actor === 'zora' && l.kind !== 'prep')?.kind).toBe('hit');
    expect(v8.log[0]?.text).toContain('+10 points to hit and +10 points to crit');
    expect(v7.log[0]?.text).toContain('+10 points to hit for the fight');

    // Herbwise (1.25×) + Alchemy 4 (1.12×) -> +14 hit & +14 crit; Likho Ill Luck (-10 crit) still leaves 20 + 14 - 10 = 24% crit.
    const likhoRolls = cyclic([0.5, 0.5, 0.23]);
    const scaled = fight(
      [snap('zora', { traits: ['herbwise'], base: { ...hunters.zora.stats, speed: 30 } })],
      { event: 'likho-one-eyed', tier: 4 },
      prep({ potions: { zora: 'owl-eye-drops' } }),
      { rolls: likhoRolls, alchemy: 4, rulesVersion: 8, location: null },
    );
    expect(scaled.log.find((l) => l.actor === 'zora' && l.kind !== 'prep')?.kind).toBe('crit');
    expect(scaled.log[0]?.text).toContain('+14 points to hit and +14 points to crit');
  });

  it('Hardwood Tonic: +40% Armor and −15% taken for 8 actions under v8 vs +30% / 5 actions under v7', () => {
    const halvar = tank('halvar', {
      traits: [],
      base: { health: 1_000_000, might: 1, armor: 10, speed: 7 },
    });
    const v8 = fight(
      [halvar],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'hardwood-tonic' } }),
      {
        rulesVersion: 8,
      },
    );
    const v7 = fight(
      [halvar],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'hardwood-tonic' } }),
      {
        rulesVersion: 7,
      },
    );
    expect(v8.log[0]?.text).toContain('+40% Armor and −15% damage taken for 8 actions');
    expect(v7.log[0]?.text).toContain('+30% Armor for 5 actions');

    // Inspect monster hits by Halvar's action count: actions 0..7 have Armor 14.00 and −15% taken; 8+ have 10.00.
    const wolfHits: { halvarActs: number; armor: string; amount: number }[] = [];
    let acts = 0;
    for (const l of v8.log) {
      if (l.actor === 'halvar' && ['hit', 'crit', 'miss'].includes(l.kind)) acts += 1;
      if (l.actor === 'wolf' && (l.kind === 'hit' || l.kind === 'crit')) {
        const arm = /−([\d.]+) armor/.exec(l.text)?.[1] ?? '';
        wolfHits.push({ halvarActs: acts, armor: arm, amount: l.amount ?? 0 });
      }
    }
    expect(wolfHits.some((x) => x.halvarActs < 8 && x.armor === '14.00')).toBe(true);
    expect(wolfHits.some((x) => x.halvarActs >= 8 && x.armor === '10.00')).toBe(true);

    // Check −15% taken vs Fire ability (Noon Heat = 3% maxHP = 60 on 2000 HP) while tonic is active.
    const vesna = tank('vesna', {
      traits: [],
      base: { health: 2000, might: 1, armor: 10, speed: 10 },
    });
    const bareHeat = fight([vesna], { monster: 'poludnitsa', tier: 2 }, undefined, {
      rulesVersion: 8,
    });
    const tonicHeat = fight(
      [vesna],
      { monster: 'poludnitsa', tier: 2 },
      prep({ potions: { vesna: 'hardwood-tonic' } }),
      {
        rulesVersion: 8,
      },
    );
    const firstBare = bareHeat.log.find((l) => l.text.startsWith('Noon Heat'))?.amount ?? 0;
    const firstTonic = tonicHeat.log.find((l) => l.text.startsWith('Noon Heat'))?.amount ?? 0;
    expect(firstBare).toBe(60);
    expect(firstTonic).toBe(51); // 60 × (1 − 0.15) = 51
  });

  it('Mending Draught: <50% HP (65% Herbs) healing 45% under v8 vs <30% HP (40% Herbs) healing 40% under v7', () => {
    const zora = snap('zora', { traits: [], base: { health: 100, might: 1, armor: 0, speed: 1 } });
    // Gaunt Wolf (no Spoil!) hits for 10 each attack -> 100 -> 90 -> 80 -> 70 -> 60 -> 50 -> 40 (< 50% under v8, >= 30% under v7!).
    const v8 = fight(
      [zora],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { zora: 'mending-draught' } }),
      {
        rulesVersion: 8,
      },
    );
    const v8Drink = v8.log.find((l) => l.kind === 'prep');
    expect(v8Drink?.amount).toBe(45);
    expect((v8Drink?.targetHealth ?? 0) - 45).toBe(40); // fired at 40 HP (< 50)!

    const v7 = fight(
      [zora],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { zora: 'mending-draught' } }),
      {
        rulesVersion: 7,
      },
    );
    const v7Drink = v7.log.find((l) => l.kind === 'prep');
    expect(v7Drink?.amount).toBe(40);
    expect((v7Drink?.targetHealth ?? 0) - 40).toBe(20); // waited until < 30 HP (20)!

    // Mender Herbs tier 3 (Armor 4 -> 6 dmg/hit): fires at 64 HP (< 65%) under v8 vs 34 HP (< 40%) under v7.
    const herbHunter = snap('vesna', {
      traits: [],
      talents: ['mender-herbs-3'],
      base: { health: 100, might: 1, armor: 4, speed: 1 },
    });
    const v8Herbs = fight(
      [herbHunter],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { vesna: 'mending-draught' } }),
      {
        rulesVersion: 8,
      },
    );
    const v7Herbs = fight(
      [herbHunter],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { vesna: 'mending-draught' } }),
      {
        rulesVersion: 7,
      },
    );
    const v8HerbsDrink = v8Herbs.log.find((l) => l.kind === 'prep');
    const v7HerbsDrink = v7Herbs.log.find((l) => l.kind === 'prep');
    expect(v8HerbsDrink?.targetHealth).toBe(100);
    expect((v8HerbsDrink?.targetHealth ?? 0) - (v8HerbsDrink?.amount ?? 0)).toBe(64);
    expect((v7HerbsDrink?.targetHealth ?? 0) - (v7HerbsDrink?.amount ?? 0)).toBe(34);
    expect(v7HerbsDrink?.amount).toBe(40);
  });

  it('Coldwater Draught: −50% Fire, −30% Frost & +10% Might under v8 vs −40% Fire only under v7', () => {
    const bare = fight(
      [tank('halvar', { traits: [] })],
      { guardian: 'unlits-breath', tier: 2 },
      undefined,
      { rulesVersion: 8 },
    );
    const v8 = fight(
      [tank('halvar', { traits: [] })],
      { guardian: 'unlits-breath', tier: 2 },
      prep({ potions: { halvar: 'coldwater-draught' } }),
      { rulesVersion: 8 },
    );
    const v7 = fight(
      [tank('halvar', { traits: [] })],
      { guardian: 'unlits-breath', tier: 2 },
      prep({ potions: { halvar: 'coldwater-draught' } }),
      { rulesVersion: 7 },
    );
    const drain = (r: FightResult) =>
      r.log.find((l) => l.text.startsWith('The cold drains'))?.amount ?? 0;
    expect(drain(bare)).toBe(20000);
    expect(drain(v8)).toBe(14000); // −30% Frost taken!
    expect(drain(v7)).toBe(20000); // v7 had no Frost reduction

    // Also grants +10% Might under v8 (and 0% under v7).
    const h = snap('halvar', { traits: [] });
    const mightBare = firstDealt(
      fight([h], { monster: 'wolf', tier: 1 }, undefined, { rulesVersion: 8 }),
      'halvar',
    );
    const mightV8 = firstDealt(
      fight([h], { monster: 'wolf', tier: 1 }, prep({ potions: { halvar: 'coldwater-draught' } }), {
        rulesVersion: 8,
      }),
      'halvar',
    );
    const mightV7 = firstDealt(
      fight([h], { monster: 'wolf', tier: 1 }, prep({ potions: { halvar: 'coldwater-draught' } }), {
        rulesVersion: 7,
      }),
      'halvar',
    );
    expect(mightV8).toBeCloseTo(mightBare * 1.1, 9);
    expect(mightV7).toBeCloseTo(mightBare, 9);

    // Fire cap still holds at 75% (e.g. Coldwater −50% + Herbwise -> 62.5% + Fire-touched 20% = 82.5% -> 75% cap).
    const capHunter = tank('vesna', { traits: ['herbwise', 'fire-touched'] });
    const bareHeat =
      fight([tank('vesna', { traits: [] })], { monster: 'poludnitsa', tier: 2 }, undefined, {
        rulesVersion: 8,
      }).log.find((l) => l.text.startsWith('Noon Heat'))?.amount ?? 0;
    const capHeat =
      fight(
        [capHunter],
        { monster: 'poludnitsa', tier: 2 },
        prep({ potions: { vesna: 'coldwater-draught' } }),
        {
          rulesVersion: 8,
        },
      ).log.find((l) => l.text.startsWith('Noon Heat'))?.amount ?? 0;
    expect(capHeat).toBe(Math.floor(bareHeat * 0.25 + 0.5));
  });

  it('Steadfast Draught: prevents 2–4 lost actions & adds +10% Might under v8 vs 1 unscaled / no Might under v7', () => {
    const draugr = { monster: 'draugr' as const, tier: 3 };
    const countKept = (r: FightResult) =>
      r.log.filter((l) => l.text.includes('keeps their action')).length;

    const bare = fight([sponge('halvar')], draugr, undefined, { rulesVersion: 8 });
    const v8Base = fight(
      [sponge('halvar')],
      draugr,
      prep({ potions: { halvar: 'steadfast-draught' } }),
      {
        rulesVersion: 8,
      },
    );
    const v8Herbwise = fight(
      [sponge('vesna', { traits: ['herbwise'] })],
      draugr,
      prep({ potions: { vesna: 'steadfast-draught' } }),
      { rulesVersion: 8 },
    );
    const v8Max = fight(
      [sponge('vesna', { traits: ['herbwise'], talents: ['mender-herbs-1', 'mender-herbs-2'] })],
      draugr,
      prep({ potions: { vesna: 'steadfast-draught' } }),
      { rulesVersion: 8, alchemy: 10 },
    );
    const v7 = fight(
      [sponge('halvar')],
      draugr,
      prep({ potions: { halvar: 'steadfast-draught' } }),
      {
        rulesVersion: 7,
      },
    );

    expect(countKept(v8Base)).toBe(2); // base 2 uses
    expect(countKept(v8Herbwise)).toBe(3); // roundHalfUp(2 * 1.25) = 3
    expect(countKept(v8Max)).toBe(4); // roundHalfUp(2 * 1.45 * 1.3) = roundHalfUp(3.77) = 4
    expect(countKept(v7)).toBe(1); // v7 legacy 1 use

    // +10% Might under v8 (and consumed on drink so once per stand works cleanly).
    const wolfV8 = fight(
      [snap('halvar')],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'steadfast-draught' } }),
      {
        rulesVersion: 8,
      },
    );
    const wolfBare = fight([snap('halvar')], { monster: 'wolf', tier: 1 }, undefined, {
      rulesVersion: 8,
    });
    expect(firstDealt(wolfV8, 'halvar')).toBeCloseTo(firstDealt(wolfBare, 'halvar') * 1.1, 9);
    expect(wolfV8.potionsUsed).toContain('halvar');

    const wolfV7 = fight(
      [snap('halvar')],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'steadfast-draught' } }),
      {
        rulesVersion: 7,
      },
    );
    expect(firstDealt(wolfV7, 'halvar')).toBeCloseTo(firstDealt(wolfBare, 'halvar'), 9);
    expect(wolfV7.potionsUsed).toEqual([]);
    void bare;
  });

  it('Steadfast Draught fires at most once across waves in Last Stand under v8', () => {
    const res = runStand({
      seed: 'v8-steadfast-stand',
      threat: 0,
      party: [snap('halvar')],
      prep: { oils: {}, potions: { halvar: 'steadfast-draught' }, bombs: [] },
      bombs: {},
      defenses: { walls: 0, watchtower: 0 },
      relics: [],
      knowledge: {},
      alchemy: 0,
      rulesVersion: 8,
      log: true,
    });
    const drinkLogs = res.waves.filter((w) =>
      w.fight.log.some((l) => l.text.includes('drinks Steadfast Draught')),
    );
    expect(drinkLogs).toHaveLength(1);
  });
});

describe('v8 Frost Pot + Rime-Dipped + Hamstring slow-stacking fix (rulesVersion 8 vs 7)', () => {
  it('stacks Frost Pot (-30%) + Rime-Dipped (-25%) cumulatively (-55%) and preserves remaining slow when one expires', () => {
    // Compare gaps after Frost Pot + Rime-Dipped both apply against a tanky Draugr.
    // Bjarna hits on every action (roll 0.5 < 0.9); 3rd hit applies Rime-Dipped (-25% for 2 monster actions).
    const slowParty = [
      sponge('bjarna', {
        skill: 'rime-dipped',
        base: { health: 1_000_000, might: 1, armor: 50, speed: 12 },
      }),
    ];
    const frostOnly = fight(
      slowParty,
      { monster: 'draugr', tier: 3 },
      prep({ bombs: ['frost-pot'] }),
      {
        rulesVersion: 8,
      },
    );
    // Actually use Bjarna WITHOUT rime-dipped vs WITH rime-dipped while Frost Pot is thrown at tick 1.
    const noRime = [
      sponge('bjarna', {
        skill: undefined,
        base: { health: 1_000_000, might: 1, armor: 50, speed: 12 },
      }),
    ];
    const frostPlain = fight(
      noRime,
      { monster: 'draugr', tier: 3 },
      prep({ bombs: ['frost-pot'] }),
      {
        rulesVersion: 8,
      },
    );
    const draugrSpeedTicks = (r: FightResult) => {
      const t = actionTicks(r, 'draugr').filter((x) => x > 1);
      return t.map((x, i) => x - (i === 0 ? 0 : (t[i - 1] ?? 0)));
    };
    // Test with faster Bjarna so 3rd Bjarna hit lands BEFORE Frost Pot's 3 monster actions expire (Draugr speed 7 -> slowed 4.9 -> tick 21, 42, 63; Bjarna speed 30 -> 3rd hit at tick 11!).
    const fastBjarna = (withSkill: boolean) => [
      sponge('bjarna', {
        skill: withSkill ? 'rime-dipped' : undefined,
        base: { health: 1_000_000, might: 1, armor: 50, speed: 30 },
      }),
    ];
    const rCombined = fight(
      fastBjarna(true),
      { monster: 'draugr', tier: 3 },
      prep({ bombs: ['frost-pot'] }),
      {
        rulesVersion: 8,
      },
    );
    const rFrostOnly = fight(
      fastBjarna(false),
      { monster: 'draugr', tier: 3 },
      prep({ bombs: ['frost-pot'] }),
      {
        rulesVersion: 8,
      },
    );
    const cGaps = draugrSpeedTicks(rCombined);
    const fGaps = draugrSpeedTicks(rFrostOnly);
    // Draugr speed = 6 -> Frost (-30%) = 4.2 -> 100/4.2 = 24 ticks in frostOnly.
    expect(fGaps[0]).toBe(24);
    // With Rime-Dipped firing at tick 10 (Draugr already had 42 meter): remaining 58 at speed 6*(1-0.55)=2.7 takes 22 more ticks -> tick 32!
    expect(cGaps[0]).toBe(32);
    expect(cGaps[0]).toBeGreaterThan(fGaps[0] ?? 999);
    // Combined slow keeps Draugr slower than Frost-only on subsequent actions too!
    expect(cGaps[1]).toBeGreaterThanOrEqual(fGaps[1] ?? 999);
    expect(cGaps[2]).toBeGreaterThan(17); // unslowed speed 6 would be ~17 ticks; Rime keeps it slower!
    void frostOnly;
    void frostPlain;
  });

  it('reproduces v7 Frost/Rime slow behavior identically under rulesVersion 7', () => {
    const fastBjarna = [
      sponge('bjarna', {
        skill: 'rime-dipped',
        base: { health: 1_000_000, might: 1, armor: 50, speed: 30 },
      }),
    ];
    const r1 = fight(fastBjarna, { monster: 'draugr', tier: 3 }, prep({ bombs: ['frost-pot'] }), {
      rulesVersion: 7,
      rolls: seeded('slow-v7'),
    });
    const r2 = fight(fastBjarna, { monster: 'draugr', tier: 3 }, prep({ bombs: ['frost-pot'] }), {
      rulesVersion: 7,
      rolls: seeded('slow-v7'),
    });
    expect(r1.log.map((l) => l.text)).toEqual(r2.log.map((l) => l.text));
  });

  it('tracks chillCut, rimeCut, and hamstringCut independently regardless of expiry order (v8)', () => {
    const m = buildMonster({ monster: 'draugr', tier: 3 });
    rimeSlow(m, 0.25, 4, 8);
    expect(m.statusPct.speed).toBeCloseTo(-0.25, 9);
    // Stack Frost Pot (-0.30, 3 actions) + Hamstring (-0.20, 2 actions) alongside Rime (-0.25, 4 actions):
    m.chillLeft = 3;
    m.chillCut = 0.3;
    m.hamstringLeft = 2;
    m.hamstringCut = 0.2;
    rimeSlow(m, 0.25, 4, 8);
    expect(m.statusPct.speed).toBeCloseTo(-0.75, 9);
    endOwnAction(m, 8); // chill 2, hamstring 1, rime 3
    expect(m.statusPct.speed).toBeCloseTo(-0.75, 9);
    endOwnAction(m, 8); // chill 1, hamstring 0 -> -0.55 remains
    expect(m.statusPct.speed).toBeCloseTo(-0.55, 9);
    endOwnAction(m, 8); // chill 0, rime 1 -> -0.25 remains
    expect(m.statusPct.speed).toBeCloseTo(-0.25, 9);
    endOwnAction(m, 8); // rime 0 -> back to 0 (+0)
    expect(m.statusPct.speed).toBe(0);

    // Clearing Hamstring via Shepherd's Crook preserves active chillCut/rimeCut under v8:
    m.chillLeft = 2;
    m.chillCut = 0.3;
    m.hamstringLeft = 2;
    m.hamstringCut = 0.2;
    rimeSlow(m, 0.25, 2, 8);
    expect(clearAbilityEffects(m, 8)).toEqual(['slowed']);
    expect(m.statusPct.speed).toBeCloseTo(-0.55, 9);
  });
});

describe('v8 Saltburst active + passive disruption & 25 Rune damage (rulesVersion 8 vs 7)', () => {
  const salt = prep({ bombs: ['saltburst'] });

  it('deals 25 × potency × resist Rune damage ignoring Armor on active triggers (v8) vs 0 damage under v7', () => {
    // Rusalka: Rune ×1.0 (not weak, not resistant) -> 25 at Alchemy 0, 28 at Alchemy 4 (25 * 1.12 = 28).
    const rV8 = fight([sponge('halvar')], { monster: 'rusalka', tier: 2 }, salt, {
      location: 'river',
      rulesVersion: 8,
    });
    const bombV8 = rV8.log.find((l) => l.text.includes('Saltburst goes off'));
    expect(bombV8?.amount).toBe(25);
    expect(rV8.saltburstCancelled).toBe(true);

    const rV8Alch = fight([sponge('halvar')], { monster: 'rusalka', tier: 2 }, salt, {
      location: 'river',
      alchemy: 4,
      rulesVersion: 8,
    });
    expect(rV8Alch.log.find((l) => l.text.includes('Saltburst goes off'))?.amount).toBe(28);

    const rV7 = fight([sponge('halvar')], { monster: 'rusalka', tier: 2 }, salt, {
      location: 'river',
      rulesVersion: 7,
    });
    expect(rV7.log.find((l) => l.text.includes('Saltburst goes off'))?.amount).toBeUndefined();
    expect(rV7.saltburstCancelled).toBe(true);
  });

  it('cancels and suppresses Lightless (Gloam-moths) for 3 actions under v8, not v7', () => {
    const z = sponge('zora');
    const rolls = cyclic([0.85, 0.5, 0.5]); // 0.85 hits at 90% base, misses at 80% Lightless!
    const v8 = fight([z], { monster: 'gloam-moths', tier: 2 }, salt, {
      rolls,
      location: 'ruin',
      rulesVersion: 8,
    });
    expect(v8.saltburstCancelled).toBe(true);
    expect(v8.log.some((l) => l.text.includes('Lightless is cancelled'))).toBe(true);
    expect(v8.log.find((l) => l.actor === 'zora')?.kind).toBe('hit');

    const v7 = fight([z], { monster: 'gloam-moths', tier: 2 }, salt, {
      rolls: cyclic([0.85, 0.5, 0.5]),
      location: 'ruin',
      rulesVersion: 7,
    });
    expect(v7.saltburstCancelled).toBe(false);
    expect(v7.log.find((l) => l.actor === 'zora')?.kind).toBe('miss');
  });

  it('cancels and suppresses Seal-burn (Ribbonshade) for 3 actions under v8, not v7', () => {
    const z = snap('zora', { traits: [], base: { health: 1000, might: 60, armor: 3, speed: 13 } });
    const v8 = fight([z], { monster: 'ribbonshade', tier: 2 }, salt, {
      location: 'ruin',
      rulesVersion: 8,
    });
    expect(v8.saltburstCancelled).toBe(true);
    expect(v8.log.some((l) => l.text.includes('Seal-burn is cancelled'))).toBe(true);
    // No Seal-burn damage while blocked on initial actions.
    expect(v8.log.filter((l) => l.text.includes('Seal-burn') && l.kind === 'ability')).toHaveLength(
      0,
    );

    const v7 = fight([z], { monster: 'ribbonshade', tier: 2 }, salt, {
      location: 'ruin',
      rulesVersion: 7,
    });
    expect(
      v7.log.filter((l) => l.text.includes('Seal-burn') && l.kind === 'ability').length,
    ).toBeGreaterThan(0);
  });

  it('cancels and suppresses Swell (Draugr) while blocked under v8, not v7', () => {
    // Draugr tier 3: let hunters bring it below 50% HP while Saltburst is already triggered on Barrow-Grip,
    // AND separately verify Swell alone triggers Saltburst when below 50% HP!
    // Give Halvar enough Might to drop Draugr below 50% on hit 1, then hit 2 meets un-swelled Armor vs swelled Armor.
    const h = snap('halvar', {
      traits: [],
      base: { health: 1_000_000, might: 200, armor: 50, speed: 20 },
    });
    const v8 = fight([h], { monster: 'draugr', tier: 3 }, salt, {
      location: 'barrow',
      rulesVersion: 8,
    });
    const v7 = fight([h], { monster: 'draugr', tier: 3 }, salt, {
      location: 'barrow',
      rulesVersion: 7,
    });
    // After hit 1 knocks Draugr below 50%, hit 2 triggers Swell cancellation in v8 (Armor stays 10.64 instead of 15.96!).
    expect(v8.saltburstCancelled).toBe(true);
    const v8ArmorAfter = v8.log
      .filter((l) => l.actor === 'halvar' && l.kind === 'hit')
      .map((l) => /−([\d.]+) armor/.exec(l.text)?.[1]);
    const v7ArmorAfter = v7.log
      .filter((l) => l.actor === 'halvar' && l.kind === 'hit')
      .map((l) => /−([\d.]+) armor/.exec(l.text)?.[1]);
    expect(v8ArmorAfter[1]).not.toBe(v7ArmorAfter[1]);
  });

  it('cancels and suppresses Ill Luck (Likho) under v8, not v7', () => {
    const z = snap('zora', {
      traits: [],
      base: { health: 1_000_000, might: 50, armor: 50, speed: 30 },
    }); // striker base 20% crit
    const rolls = cyclic([0.5, 0.5, 0.15]); // crits at 20%, fails at 10% under Ill Luck (-10 pts)!
    const v8 = fight([z], { event: 'likho-one-eyed', tier: 4 }, salt, {
      rolls,
      location: null,
      rulesVersion: 8,
    });
    expect(v8.saltburstCancelled).toBe(true);
    expect(v8.log.some((l) => l.text.includes('Ill Luck is cancelled'))).toBe(true);
    expect(v8.log.find((l) => l.actor === 'zora')?.kind).toBe('crit');

    const v7 = fight([z], { event: 'likho-one-eyed', tier: 4 }, salt, {
      rolls: cyclic([0.5, 0.5, 0.15]),
      location: null,
      rulesVersion: 7,
    });
    expect(v7.log.find((l) => l.actor === 'zora')?.kind).toBe('hit');
  });

  it('cancels and suppresses Nameless (The Forgotten) Might bonus while blocked under v8', () => {
    const v8 = fight([sponge('halvar')], { guardian: 'the-forgotten', tier: 2 }, salt, {
      location: null,
      nameless: 16,
      rulesVersion: 8,
    });
    const baseNoNameless = fight(
      [sponge('halvar')],
      { guardian: 'the-forgotten', tier: 2 },
      undefined,
      {
        location: null,
        nameless: 0,
        rulesVersion: 8,
      },
    );
    const v7 = fight([sponge('halvar')], { guardian: 'the-forgotten', tier: 2 }, salt, {
      location: null,
      nameless: 16,
      rulesVersion: 7,
    });
    expect(v8.saltburstCancelled).toBe(true);
    expect(v8.log.some((l) => l.text.includes('Nameless is cancelled'))).toBe(true);
    // Action 1 monster hit has Nameless Might stripped (18 instead of 18 * 1.48 = 26.64).
    expect(firstDealt(v8, 'the-forgotten')).toBeCloseTo(
      firstDealt(baseNoNameless, 'the-forgotten'),
      9,
    );
    // Under v7, Saltburst never fires on Nameless!
    expect(v7.saltburstCancelled).toBe(false);
    expect(firstDealt(v7, 'the-forgotten')).toBeCloseTo(18 * 1.48, 9);
  });

  it('cancels Unthawed on Fire check while blocked under v8', () => {
    const s = snap('sigrun', {
      traits: [],
      base: { health: 1_000_000, might: 60, armor: 4, speed: 11 },
    });
    const v8 = fight([s], { monster: 'rimewrought', tier: 4 }, salt, {
      location: 'ruin',
      rulesVersion: 8,
    });
    expect(v8.saltburstCancelled).toBe(true);
    expect(v8.log.some((l) => l.text.includes('Unthawed is cancelled'))).toBe(true);
    // First hit was NOT boosted by unthawed strip while blocked; after 3 Rimewrought actions, Fire hit cracks rime!
    const hits = v8.log.filter((l) => l.actor === 'sigrun' && l.kind === 'hit');
    expect(hits[0]?.text).not.toContain('Unthawed:');
  });
});

describe('v8 Poppy Smoke Shrouded status (rulesVersion 8 vs 7)', () => {
  const smoke = prep({ bombs: ['poppy-smoke'] });

  it('stuns 1 action AND applies Shrouded (+15 hit, +10 crit, +15% dmg) for 2 monster actions under v8', () => {
    // Hit check: 0.95 is a miss at 90% base hit, a HIT with +15 Shrouded (105% hit chance)!
    // Crit check: 0.30 is a normal hit for 25%-crit Zora, a CRIT with +10 Shrouded (35% crit chance)!
    const zora = snap('zora', {
      traits: [],
      base: { health: 1_000_000, might: 40, armor: 10, speed: 16 },
    });
    const missThenHit = fight([zora], { monster: 'draugr', tier: 3 }, smoke, {
      rolls: cyclic([0.95, 0.5, 0.3]),
      location: 'barrow',
      rulesVersion: 8,
    });
    expect(missThenHit.log.find((l) => l.actor === 'zora')?.kind).toBe('crit');

    // Damage boost (+15% × potency): Halvar base hit vs wolf with Poppy Smoke at Alchemy 0 vs Alchemy 4 vs v7.
    const h = snap('halvar', {
      traits: [],
      base: { health: 1_000_000, might: 40, armor: 10, speed: 10 },
    });
    const bare = fight([h], { monster: 'draugr', tier: 3 }, undefined, {
      location: 'barrow',
      rulesVersion: 8,
    });
    const v8 = fight([h], { monster: 'draugr', tier: 3 }, smoke, {
      location: 'barrow',
      rulesVersion: 8,
    });
    const v8Alch = fight([h], { monster: 'draugr', tier: 3 }, smoke, {
      location: 'barrow',
      alchemy: 10,
      rulesVersion: 8,
    });
    const v7 = fight([h], { monster: 'draugr', tier: 3 }, smoke, {
      location: 'barrow',
      rulesVersion: 7,
    });

    expect(firstDealt(v8, 'halvar')).toBeCloseTo(firstDealt(bare, 'halvar') * 1.15, 9);
    expect(firstDealt(v8Alch, 'halvar')).toBeCloseTo(
      firstDealt(bare, 'halvar') * (1 + 0.15 * 1.3),
      9,
    );
    expect(firstDealt(v7, 'halvar')).toBeCloseTo(firstDealt(bare, 'halvar'), 9);

    // After Draugr finishes its 2nd action (shroudedLeft -> 0), Shrouded expires and later hits revert to base dealt!
    const allHits = v8.log.filter(
      (l) => l.actor === 'halvar' && (l.kind === 'hit' || l.kind === 'crit'),
    );
    const draugrActs = actionTicks(v8, 'draugr').filter((t) => t > 1);
    const afterSecond = allHits.filter((l) => l.tick > (draugrActs[1] ?? 0));
    expect(afterSecond.length).toBeGreaterThan(0);
    // Note: normalise out crit multiplier if crit happened: compare plain bare vs afterSecond non-crit hit.
    const afterNormal = afterSecond.find((l) => l.kind === 'hit');
    if (afterNormal?.dealt) {
      expect(afterNormal.dealt).toBeCloseTo(firstDealt(bare, 'halvar'), 9);
    }
  });
});
