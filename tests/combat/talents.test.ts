// Plan T8.9 (GDD §5.11.5, §8.11, D313, D314): the 27 talents, one test each, in the bucket the GDD
// names. A hunter with no talents fights exactly as before (the goldens prove it).
import { describe, expect, it } from 'vitest';
import { HUNTER_IDS, hunters, type HunterId, type RoleId } from '../../src/content/hunters';
import { talents, type TalentDef } from '../../src/content/talents';
import { runFight, type FightResult, type HunterSnapshot } from '../../src/core/combat';
import { buildHunter, roundHalfUp } from '../../src/core/combat/build';
import { armorEff, mightEff, outgoingPct, takenReduction } from '../../src/core/combat/stats';
import { talentTotals } from '../../src/core/combat/talents';
import { cyclic, snap, sponge } from './helpers';

const of = (role: RoleId, n = 0): HunterId =>
  HUNTER_IDS.filter((h) => hunters[h].role === role)[n] as HunterId;
const ctx = {
  location: 'field',
  family: 'beasts-and-wilds',
  monsterId: 'wolf',
  attacks: 1,
  hitCut: 0,
  oilBonus: 0,
} as const;

const base = (t: TalentDef): HunterSnapshot => snap(of(t.role), { level: 3 });
const withTalent = (t: TalentDef): HunterSnapshot => ({ ...base(t), talents: [t.id] });
const built = (s: HunterSnapshot, prep?: Parameters<typeof buildHunter>[2]) =>
  buildHunter(s, 1, prep);

const firstHit = (r: FightResult, actor: string) =>
  r.log.find((e) => e.actor === actor && (e.kind === 'hit' || e.kind === 'crit'));
const fight = (party: HunterSnapshot[], knowledge = 0, rolls = [0.0, 0.5, 0.99]): FightResult =>
  runFight({
    party,
    monster: { monster: 'wolf', tier: 1, knowledge },
    location: 'field',
    rolls: cyclic(rolls),
  });

type Check = (t: TalentDef) => void;

const checks: Record<string, Check> = {
  armorFlat: (t) => {
    if (t.effect.kind !== 'armorFlat') throw new Error();
    expect(armorEff(built(withTalent(t)))).toBeCloseTo(armorEff(built(base(t))) + t.effect.amount);
  },
  speedFlat: (t) => {
    if (t.effect.kind !== 'speedFlat') throw new Error();
    expect(built(withTalent(t)).speed).toBe(built(base(t)).speed + t.effect.amount);
  },
  mightPct: (t) => {
    if (t.effect.kind !== 'mightPct') throw new Error();
    expect(mightEff(built(withTalent(t))) / mightEff(built(base(t)))).toBeCloseTo(
      1 + t.effect.amount,
    );
  },
  maxHealthPct: (t) => {
    if (t.effect.kind !== 'maxHealthPct') throw new Error();
    const plain = built(base(t));
    const raw = plain.maxHealth;
    expect(built(withTalent(t)).maxHealth).toBeGreaterThanOrEqual(
      roundHalfUp(raw * (1 + t.effect.amount)) - 1,
    );
    expect(built(withTalent(t)).maxHealth).toBeGreaterThan(raw);
  },
  critPoints: (t) => {
    if (t.effect.kind !== 'critPoints') throw new Error();
    expect(built(withTalent(t)).critChance - built(base(t)).critChance).toBeCloseTo(
      t.effect.amount,
    );
  },
  hitChancePoints: (t) => {
    if (t.effect.kind !== 'hitChancePoints') throw new Error();
    expect(built(withTalent(t)).hitBonus - built(base(t)).hitBonus).toBeCloseTo(t.effect.amount);
  },
  takenPct: (t) => {
    const c = built(withTalent(t));
    expect(takenReduction(c, 'steel', [c])).toBeCloseTo(0.08);
    const plain = built(base(t));
    expect(takenReduction(plain, 'steel', [plain])).toBe(0);
  },
  damageDealtPct: (t) => {
    if (t.effect.kind !== 'damageDealtPct') throw new Error();
    const a = built(withTalent(t));
    const b = built(base(t));
    expect(outgoingPct(a, a.damage, ctx) - outgoingPct(b, b.damage, ctx)).toBeCloseTo(
      t.effect.amount,
    );
  },
  alliesTakenWhileStanding: (t) => {
    if (t.effect.kind !== 'alliesTakenWhileStanding') throw new Error();
    const holder = built({ ...withTalent(t), traits: [] });
    const ally = buildHunter(snap(of('striker'), { traits: [] }), 2);
    expect(takenReduction(ally, 'steel', [holder, ally])).toBeCloseTo(-t.effect.amount);
    // Only while he stands, and only for the others.
    expect(takenReduction(holder, 'steel', [holder, ally])).toBe(0);
    holder.health = 0;
    expect(takenReduction(ally, 'steel', [holder, ally])).toBe(0);
  },
  targetWeight: (t) => {
    if (t.effect.kind !== 'targetWeight') throw new Error();
    expect(built(withTalent(t)).weightOverride).toBe(t.effect.weight);
    expect(built(base(t)).weightOverride).toBeNull();
  },
  damageVsKnown: (t) => {
    if (t.effect.kind !== 'damageVsKnown') throw new Error();
    const name = (s: HunterSnapshot) => s.id;
    const solo = (s: HunterSnapshot, k: number) =>
      firstHit(fight([{ ...s, traits: [] }], k), name(s))?.dealt ?? 0;
    // Studied (+5%) becomes +8%; an unknown species gets nothing.
    expect(solo(withTalent(t), 3) / solo(base(t), 3)).toBeCloseTo(1.08 / 1.05, 6);
    expect(solo(withTalent(t), 4) / solo(base(t), 4)).toBeCloseTo(1.13 / 1.1, 6);
    expect(solo(withTalent(t), 0)).toBeCloseTo(solo(base(t), 0), 9);
  },
  critMult: (t) => {
    if (t.effect.kind !== 'critMult') throw new Error();
    const solo = (s: HunterSnapshot) => firstHit(fight([{ ...s, traits: [] }], 0, [0.0]), s.id);
    const a = solo(withTalent(t));
    expect(a?.kind).toBe('crit');
    expect((a?.dealt ?? 0) / (solo(base(t))?.dealt ?? 1)).toBeCloseTo(1.6 / 1.5, 6);
  },
  potionPower: (t) => {
    if (t.effect.kind !== 'potionPower') throw new Error();
    const prep = { oils: {}, potions: { [of('mender')]: 'mending-draught' as const }, bombs: [] };
    const c = built({ ...withTalent(t), traits: [] }, prep);
    expect(c.potion?.power).toBeCloseTo(t.effect.amount);
  },
  healingDone: (t) => {
    if (t.effect.kind !== 'healingDone') throw new Error();
    const c = built({ ...withTalent(t), traits: [] });
    expect(c.healBonus).toBeCloseTo(t.effect.amount);
    expect(built({ ...base(t), traits: [] }).healBonus).toBe(0);
  },
  mendingBelow: (t) => {
    const prep = { oils: {}, potions: { [of('mender')]: 'mending-draught' as const }, bombs: [] };
    expect(built({ ...withTalent(t), traits: [] }, prep).potion?.below).toBe(0.4);
    expect(built({ ...base(t), traits: [] }, prep).potion?.below).toBe(0.3);
  },
  healsBelow: (t) => {
    expect(built(withTalent(t)).healThreshold).toBe(0.8);
    expect(built(base(t)).healThreshold).toBe(0.7);
  },
  attackShare: (t) => {
    expect(built(withTalent(t)).attackShare).toBe(0.75);
    expect(built(base(t)).attackShare).toBeNull();
  },
};

describe('the 27 talents, each in its bucket (GDD §8.11)', () => {
  it('there are 27: 9 per role', () => {
    expect(talents).toHaveLength(27);
    for (const role of ['vanguard', 'striker', 'mender'] as const)
      expect(talents.filter((t) => t.role === role)).toHaveLength(9);
  });
  it.each(talents.map((t) => [t.id, t] as const))('%s', (_id, t) => {
    const check = checks[t.effect.kind];
    if (!check) throw new Error(`no check for ${t.effect.kind}`);
    check(t);
  });
});

describe('talents add up', () => {
  it('two Warden talents together make −8% for the others (−3% and −5% more)', () => {
    const t = talentTotals(['vanguard-warden-1', 'vanguard-warden-3']);
    expect(t.alliesTaken).toBeCloseTo(0.08);
  });
  it('a higher crit multiplier from a trait or blessing wins over ×1.6', () => {
    const c = buildHunter({ ...snap(of('striker')), talents: ['striker-edge-2'] }, 1, undefined, {
      healthPct: 0,
      mightPct: 0,
      mightFlat: 0,
      armorFlat: 0,
      speedFlat: 0,
      critPoints: 0,
      hitPoints: 0,
      critMult: 1.8,
      dealtBonus: 0,
      takenAll: 0,
      takenByType: {},
      vanguardShield: 0,
      healBonus: 0,
      healThreshold: null,
      lowHealth: null,
    });
    expect(c.critMult).toBe(1.8);
  });
  it('a hunter with no talents is built exactly as before', () => {
    const s = sponge(of('vanguard'));
    const a = buildHunter(s, 1);
    const b = buildHunter({ ...s, talents: [] }, 1);
    expect(b).toEqual(a);
  });
});

describe('talents in the fight engine', () => {
  const menderFight = (extra: Partial<HunterSnapshot>, health: number): FightResult =>
    runFight({
      party: [
        sponge(of('mender'), {
          base: { ...hunters[of('mender')].stats, health: 100000, might: 20 },
          ...extra,
        }),
        sponge(of('vanguard'), {
          base: { ...hunters[of('vanguard')].stats, health: 100000, might: 1 },
        }),
      ],
      monster: { monster: 'wolf', tier: 1 },
      location: 'field',
      rolls: cyclic([0.5]),
      stand: {
        health: { [of('vanguard')]: health },
        partyTaken: 0,
        volley: 0,
        monsterStrength: 1,
      },
    });
  const heals = (r: FightResult) => r.log.filter((e) => e.kind === 'heal');

  it('Hands, tier 1 makes her heals 8% stronger', () => {
    const plain = heals(menderFight({}, 10))[0]?.amount ?? 0;
    const better = heals(menderFight({ talents: ['mender-hands-1'] }, 10))[0]?.amount ?? 0;
    expect(Math.abs(better / plain - 1.08)).toBeLessThan(0.03);
    expect(better).toBeGreaterThan(plain);
  });

  it('Hands, tier 3 heals anyone below 80% (75% Health is healed, where 70% would not be)', () => {
    const max =
      menderFight({}, 100000).hunters.find((h) => h.id === of('vanguard'))?.maxHealth ?? 0;
    const at75 = Math.floor(max * 0.75);
    expect(heals(menderFight({}, at75))).toHaveLength(0);
    expect(heals(menderFight({ talents: ['mender-hands-3'] }, at75)).length).toBeGreaterThan(0);
  });

  it('Watch, tier 3 makes her attacks deal 75% of her Might instead of 50%', () => {
    const attack = (extra: Partial<HunterSnapshot>) =>
      firstHit(
        runFight({
          party: [
            sponge(of('mender'), {
              base: { ...hunters[of('mender')].stats, health: 100000, might: 40 },
              ...extra,
            }),
          ],
          monster: { monster: 'wolf', tier: 1 },
          location: 'field',
          rolls: cyclic([0.0, 0.5, 0.99]),
        }),
        of('mender'),
      )?.dealt ?? 0;
    expect(attack({ talents: ['mender-watch-3'] }) / attack({})).toBeCloseTo(0.75 / 0.5, 6);
  });
});
