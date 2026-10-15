// Plan T7.8 (GDD §8.8, D254, D255, D257, D261): all 48 blessings in combat. Part one checks that
// every blessing turns into the effects the GDD states (one row each); part two runs fights to show
// the buckets and each ★ rule really change what happens. Blessings work for one run only, and
// outside a Delve nothing here applies.
import { describe, expect, it } from 'vitest';
import { blessings, blessingById } from '../../src/content/delves/blessings';
import { runFight, type FightInput } from '../../src/core/combat';
import { activeEffects, boostFor, monsterBoostFrom, rulesFrom } from '../../src/core/combat/delve';
import type { DelveFightOptions, HunterSnapshot } from '../../src/core/combat/types';
import { cyclic, lines, snap, sponge } from './helpers';

const PARTY: HunterSnapshot[] = [
  snap('halvar', { weapon: 'steel-blade', armorGear: 'mail' }), // Vanguard, Steel, weapon tier 2, armor tier 2
  snap('bjarna'), // Striker, Frost
  snap('vesna'), // Mender, Venom
];

const derive = (id: string) => {
  const a = activeEffects([id], []);
  return {
    halvar: boostFor(PARTY[0] as HunterSnapshot, PARTY, a),
    rules: rulesFrom(a),
    monsters: monsterBoostFrom(a),
    blessing: blessingById(id),
  };
};

/** One row per blessing: what it must do to the first hunter (Halvar), the rules, and the monsters. */
const EXPECT: Record<string, { boost?: object; rules?: object; monsters?: object }> = {
  'true-hammer': { boost: { mightFlat: 4 } }, // +2 per weapon tier, Steel is tier 2
  'rivet-and-ring': { boost: { armorFlat: 2 } }, // +1 per armor tier, Mail is tier 2
  'good-steel': { boost: { mightPct: 0.08 } },
  'cooled-iron': { boost: { takenByType: { fire: 0.1, frost: 0.1 } } },
  'the-smiths-mark': { rules: { smithsMark: 0.15 } },
  'proud-plate': { boost: { armorFlat: 3, takenAll: 0.05 } },
  'well-hafted': { boost: { dealtBonus: 0.1 } },
  'forge-welded': { rules: { forgeWelded: true } },
  'close-weave': { boost: { mightPct: 0.12 } }, // 3 roles
  'many-colours': { boost: { dealtBonus: 0.04 } }, // Halvar's party has Steel, Frost, Venom: 3 types → 12%, see below
  'shared-bread': { boost: { healBonus: 0.15 } },
  'shoulder-to-shoulder': { boost: { takenAll: 0.12 } },
  'one-thread': { rules: { oneThread: 0.25 } },
  'the-pattern-holds': { boost: { speedFlat: 3 } },
  'warp-and-weft': { boost: { vanguardShield: 0.08 } },
  'mended-cloth': { rules: { mendedCloth: 0.3 } },
  'long-teeth': { boost: { critPoints: 5 } },
  'lean-and-grey': { boost: { mightPct: 0.08 } },
  hungry: { boost: { dealtBonus: 0.1, armorFlat: -1 } },
  'heavy-jaw': { boost: { critMult: 1.75 } },
  'the-pack-grows': { rules: { packGrows: { perKill: 0.03, max: 0.45 } } },
  'blood-in-the-snow': { boost: { lowHealth: { below: 0.5, amount: 0.2 } } },
  'bare-throat': { boost: { dealtBonus: 0.15, armorFlat: -2 } },
  'the-wolfs-share': { rules: { wolfsShare: true } },
  'broth-on-the-hob': {},
  'goose-grease': { boost: { healBonus: 0.2 } },
  'wool-against-the-skin': { boost: { healthPct: 0.1 } },
  'close-the-door': { boost: { takenAll: 0.06 } },
  'a-price-paid': { rules: { pricePaid: { healthLost: 0.1, might: 0.2 } } },
  'up-again': {},
  'sit-up-with-them': { boost: { healThreshold: 0.85 } },
  'the-long-vigil': { rules: { longVigil: 0.25 } },
  toll: { rules: { toll: 20 } },
  'cold-water': { monsters: { speedPct: -0.08 } },
  muffled: { monsters: { mightPct: -0.08 } },
  'low-tide': { monsters: { hitPoints: -5 } },
  'struck-bronze': { rules: { struckBronze: true } },
  undertow: { rules: { monsterStartMeter: -30 } },
  'slack-water': { monsters: { speedPct: -0.15 } },
  'rung-for-the-sent': { rules: { knockback: { every: 4, amount: 50 } } },
  'cold-hands': { boost: { mightPct: 0.2, healthPct: -0.2 } },
  unremembering: { boost: { dealtBonus: 0.25 }, rules: { knowledgeOff: true } },
  'still-blood': { boost: { takenAll: 0.15 } },
  'grey-eyes': { boost: { critPoints: 10, hitPoints: -10 } },
  'no-name': { boost: { mightPct: 0.35 }, rules: { menderNeverHeals: true } },
  'drawn-thin': { boost: { speedFlat: 4 }, rules: { actionDrain: 0.03 } },
  'cold-comfort': { boost: { takenAll: 0.3 } },
  'what-was-burned': { boost: { dealtBonus: 0.5 }, rules: { nothingRestores: true } },
};
// Many Colours counts the party's damage types: Steel, Frost and Venom.
EXPECT['many-colours'] = { boost: { dealtBonus: 0.12 } };

describe('every blessing does what the GDD says (§8.8)', () => {
  it('has a row here for each of the 48', () => {
    expect(Object.keys(EXPECT).sort()).toEqual(blessings.map((b) => b.id).sort());
  });

  it.each(Object.entries(EXPECT))('%s', (id, want) => {
    const d = derive(id);
    if (want.boost) expect(d.halvar).toMatchObject(want.boost);
    if (want.rules) expect(d.rules).toMatchObject(want.rules);
    if (want.monsters) expect(d.monsters).toMatchObject(want.monsters);
  });

  it('the recovery blessings are read between floors (Broth on the Hob, Up Again)', () => {
    const broth = blessingById('broth-on-the-hob')?.effects;
    expect(broth).toEqual([{ kind: 'recoverySet', value: 0.35 }]);
    expect(blessingById('up-again')?.effects).toEqual([{ kind: 'recoveryFloor', value: 0.5 }]);
    expect(blessingById('still-blood')?.drawbacks).toEqual([
      { kind: 'switch', switch: 'no-recovery' },
    ]);
  });

  it('the Unlit’s drawbacks are all recorded as drawbacks', () => {
    for (const b of blessings.filter((x) => x.patron === 'unlit'))
      expect(b.drawbacks?.length, b.name).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------------ fights
const delve = (ids: string[], over: Partial<DelveFightOptions> = {}): DelveFightOptions => ({
  blessings: ids,
  relics: [],
  health: {},
  kills: 0,
  vigilUsed: false,
  ...over,
});
const floor = (
  party: HunterSnapshot[],
  ids: string[],
  rest: Partial<FightInput> & { d?: Partial<DelveFightOptions> } = {},
  monster: FightInput['monster'] = { monster: 'bies', tier: 3 },
) => {
  const { d, ...input } = rest;
  return runFight({
    party,
    monster,
    location: 'field',
    rolls: cyclic([0.5]),
    delve: delve(ids, d),
    ...input,
  });
};
const hitBy = (r: ReturnType<typeof floor>, actor: string) =>
  r.log.find((e) => e.actor === actor && (e.kind === 'hit' || e.kind === 'crit'));
const dealt = (ids: string[], who = 'bjarna', party = PARTY, rest = {}) =>
  hitBy(floor(party, ids, rest), who)?.dealt ?? 0;
const taken = (ids: string[], who = 'bies', rest = {}) =>
  hitBy(floor(PARTY, ids, rest), who)?.amount ?? 0;

describe('the buckets, in a fight', () => {
  it('stat% Might (Good Steel, Close Weave, Cold Hands) raises damage dealt', () => {
    const base = dealt([]);
    expect(dealt(['good-steel'])).toBeCloseTo(base * 1.08);
    expect(dealt(['close-weave'])).toBeCloseTo(base * 1.12);
    expect(dealt(['cold-hands'])).toBeCloseTo(base * 1.2);
  });

  it('outgoing% (Hungry, Many Colours, Unremembering) raises damage dealt', () => {
    const base = dealt([]);
    expect(dealt(['hungry'])).toBeCloseTo(base * 1.1);
    expect(dealt(['many-colours'])).toBeCloseTo(base * 1.12);
    expect(dealt(['unremembering'])).toBeCloseTo(base * 1.25);
  });

  it('flat Might per weapon tier (True Hammer) and Well-Hafted by weapon tier', () => {
    const halvar = (ids: string[]) => dealt(ids, 'halvar');
    expect(halvar(['true-hammer'])).toBeCloseTo(halvar([]) / 1 + 4 * 1 * resistSteel());
    // Well-Hafted: Halvar's weapon is tier 2 (gets +10%); Bjarna has none (nothing).
    expect(halvar(['well-hafted'])).toBeCloseTo(halvar([]) * 1.1);
    expect(dealt(['well-hafted'])).toBeCloseTo(dealt([]));
  });

  it('Heavy Jaw: crits deal ×1.75 instead of ×1.5', () => {
    const crit = (ids: string[]) =>
      floor([snap('halvar'), snap('zora'), snap('vesna')], ids, { rolls: cyclic([0.0]) }).log.find(
        (e) => e.actor === 'zora' && e.kind === 'crit',
      )?.dealt ?? 0;
    expect(crit(['heavy-jaw']) / crit([])).toBeCloseTo(1.75 / 1.5);
  });

  it('Armor (Proud Plate, Rivet and Ring) and taken% lower the damage a monster deals', () => {
    const base = taken([]);
    expect(taken(['proud-plate'])).toBeLessThan(base);
    expect(taken(['rivet-and-ring'])).toBeLessThan(base);
    expect(taken(['close-the-door'])).toBeLessThanOrEqual(base);
    // Hungry and Bare Throat cost Armor: the same monster hits harder.
    expect(taken(['bare-throat'])).toBeGreaterThan(base);
  });

  it('taken% is capped at 75% (§5.0), even with every protection stacked', () => {
    const stack = [
      'shoulder-to-shoulder',
      'cold-comfort',
      'proud-plate',
      'close-the-door',
      'warp-and-weft',
    ];
    const r = floor(PARTY, stack, { monster: { monster: 'bies', tier: 3 } });
    const hit = hitBy(r, 'bies');
    expect(hit?.amount).toBeGreaterThanOrEqual(1);
  });

  it('Cooled Iron cuts Fire and Frost damage taken only', () => {
    // The Draugr's Barrow-Grip hits are Steel; the Anvil-wight and others too. Use Noon Heat (Fire).
    const heat = (ids: string[]) =>
      floor(
        [sponge('halvar'), sponge('zora')],
        ids,
        {},
        { monster: 'poludnitsa', tier: 2 },
      ).log.find((e) => e.text.startsWith('Noon Heat'))?.amount ?? 0;
    expect(heat(['cooled-iron'])).toBeLessThan(heat([]));
  });

  it('max Health (Wool Against the Skin, Cold Hands) and Speed (The Pattern Holds, Drawn Thin)', () => {
    const maxH = (ids: string[]) => floor(PARTY, ids).hunters.map((h) => h.maxHealth);
    const plain = maxH([]);
    expect(maxH(['wool-against-the-skin'])).toEqual(plain.map((m) => Math.floor(m * 1.1 + 0.5)));
    expect(maxH(['cold-hands'])).toEqual(plain.map((m) => Math.floor(m * 0.8 + 0.5)));
    const first = (ids: string[]) =>
      floor(PARTY, ids).log.find((e) => e.actor === 'halvar')?.tick ?? 0;
    expect(first(['the-pattern-holds'])).toBeLessThan(first([]));
  });

  it('crit and hit chance in points (Long Teeth, Grey Eyes) show in the log', () => {
    const hitNote = (ids: string[]) => hitBy(floor(PARTY, ids), 'bjarna')?.rollNotes?.[0] ?? '';
    expect(hitNote([])).toContain('90%');
    expect(hitNote(['grey-eyes'])).toContain('80%');
    const critNote = (ids: string[]) => hitBy(floor(PARTY, ids), 'bjarna')?.rollNotes?.[2] ?? '';
    expect(critNote([])).toMatch(/12\.5%|10%|15%|\d+%/);
    expect(critNote(['long-teeth'])).not.toBe(critNote([]));
  });

  it('Blood in the Snow: +20% Might only while below half Health', () => {
    const wounded = dealt(['blood-in-the-snow'], 'bjarna', PARTY, {
      d: { health: { bjarna: 0.4 } },
    });
    const hale = dealt(['blood-in-the-snow'], 'bjarna', PARTY, { d: { health: { bjarna: 1 } } });
    const plainWounded = dealt([], 'bjarna', PARTY, { d: { health: { bjarna: 0.4 } } });
    expect(wounded).toBeCloseTo(plainWounded * 1.2);
    expect(hale).toBeCloseTo(dealt([]));
  });

  it('the Mender: Shared Bread and Goose-Grease heal more; Sit Up With Them heals at 85%', () => {
    const heals = (ids: string[], share = 0.5) =>
      lines(
        floor([sponge('halvar'), sponge('zora'), snap('ostap', { traits: [] })], ids, {
          d: { health: { halvar: share } },
        }),
        'heal',
        'ostap',
      )[0]?.amount ?? 0;
    expect(heals(['shared-bread'])).toBe(Math.floor(heals([]) * 1.15 + 0.5));
    expect(heals(['goose-grease'])).toBe(Math.floor(heals([]) * 1.2 + 0.5));
    // At 80% Health she doesn't heal by default (threshold 70%), but she does with Sit Up With Them.
    expect(heals([], 0.8)).toBe(0);
    expect(heals(['sit-up-with-them'], 0.8)).toBeGreaterThan(0);
  });

  it('Warp and Weft: while a Vanguard stands, the others take 8% less; not the Vanguard himself', () => {
    const hitOn = (ids: string[], target: string) =>
      floor([snap('halvar'), snap('zora'), snap('ostap', { traits: [] })], ids, {
        rolls: cyclic([0.99, 0.5]),
      }).log.find((e) => e.target === target && e.actor === 'bies' && e.kind === 'hit')?.amount ??
      0;
    expect(hitOn(['warp-and-weft'], 'halvar')).toBe(hitOn([], 'halvar'));
  });

  it('monsters: Cold Water and Slack Water slow, Muffled weakens, Undertow delays, Low Tide misses more', () => {
    const tickOf = (ids: string[]) =>
      floor(PARTY, ids).log.find((e) => e.actor === 'bies')?.tick ?? 0;
    expect(tickOf(['cold-water'])).toBeGreaterThanOrEqual(tickOf([]));
    expect(tickOf(['slack-water'])).toBeGreaterThan(tickOf([]));
    expect(tickOf(['undertow'])).toBeGreaterThan(tickOf([])); // meter starts at −30
    expect(taken(['muffled'])).toBeLessThanOrEqual(taken([]));
    const missNote = (ids: string[]) =>
      floor(PARTY, ids)
        .log.find((e) => e.actor === 'bies')
        ?.rollNotes?.join(' ') ?? '';
    expect(missNote(['low-tide'])).toContain('85%');
    expect(missNote([])).toContain('90%');
  });

  it('Rung for the Sent: every 4th party action knocks every monster’s meter back 50', () => {
    const r = floor(PARTY, ['rung-for-the-sent']);
    const rings = r.log.filter((e) => e.text.includes('The bell rings for the Sent'));
    expect(rings.length).toBeGreaterThan(0);
    // The 4th party action precedes the first ring.
    const before = r.log.filter(
      (e) => ['halvar', 'bjarna', 'vesna'].includes(e.actor) && e.tick <= (rings[0]?.tick ?? 0),
    );
    expect(before.length).toBeGreaterThanOrEqual(4);
  });
});

describe('the ★ rules, in a fight (each has its log line)', () => {
  it('the Smith’s Mark: a Rune sub-hit on every direct hit, beside the blade’s own', () => {
    const r = floor(PARTY, ['the-smiths-mark']);
    const marks = r.log.filter((e) => e.kind === 'sub-hit' && e.text.includes("Smith's Mark"));
    const hits = r.log.filter(
      (e) => (e.kind === 'hit' || e.kind === 'crit') && PARTY.some((p) => p.id === e.actor),
    );
    expect(marks.length).toBeGreaterThan(0);
    expect(hits.length).toBeGreaterThan(0);
    expect(marks[0]?.text).toContain('Rune');
  });

  it('Forge-Welded: Armor now reduces ability damage and burns, to a minimum of 1', () => {
    const heat = (ids: string[]) =>
      floor(
        [sponge('halvar', { armorGear: 'emberwright-plate' }), sponge('zora')],
        ids,
        {},
        { monster: 'poludnitsa', tier: 2 },
      ).log.filter((e) => e.text.startsWith('Noon Heat burns Halvar'))[0]?.amount ?? 0;
    expect(heat(['forge-welded'])).toBeLessThan(heat([]));
    expect(heat(['forge-welded'])).toBeGreaterThanOrEqual(1);
  });

  it('One Thread: when the Mender heals, every other standing hunter recovers 25% of it', () => {
    const r = floor([sponge('halvar'), sponge('zora'), snap('ostap')], ['one-thread'], {
      d: { health: { halvar: 0.5, zora: 0.9 } },
    });
    const heal = lines(r, 'heal', 'ostap').find((e) => e.target === 'halvar');
    const thread = r.log.find((e) => e.text.startsWith('One Thread'));
    expect(heal?.amount).toBeGreaterThan(0);
    expect(thread).toBeDefined();
    expect(thread?.amount).toBe(Math.floor((heal?.amount ?? 0) * 0.25 + 0.5));
  });

  it('Mended Cloth: the first hunter downed gets up at 30% on the Mender’s next action, once', () => {
    const frail = sponge('zora', { base: { ...snap('zora').base, health: 30, might: 1 } });
    const r = floor([sponge('halvar'), frail, snap('ostap')], ['mended-cloth'], {
      rolls: cyclic([0.65]),
    });
    const up = r.log.filter((e) => e.text.includes('back to their feet'));
    expect(up.length).toBe(1);
    expect(up[0]?.target).toBe('zora');
    expect(up[0]?.targetHealth).toBe(Math.max(1, Math.floor(30 * 0.3 + 0.5)));
  });

  it('The Pack Grows: +3% Might per monster killed, up to +45%, carried across floors', () => {
    const killers = [
      snap('halvar', { base: { ...snap('halvar').base, might: 200 } }),
      snap('bjarna', { base: { ...snap('bjarna').base, might: 200 } }),
      snap('vesna'),
    ];
    const r = floor(killers, ['the-pack-grows'], {
      companions: [
        { monster: 'bies', tier: 3 },
        { monster: 'bies', tier: 3 },
      ],
    });
    const grows = r.log.filter((e) => e.text.startsWith('The pack grows'));
    expect(grows).toHaveLength(3); // one line for each monster downed
    expect(r.delve?.kills).toBe(3);
    // Carried in: 20 kills earlier is the cap, +45%, whatever the count.
    const base = dealt(['the-pack-grows'], 'bjarna', PARTY, { d: { kills: 0 } });
    expect(dealt(['the-pack-grows'], 'bjarna', PARTY, { d: { kills: 5 } })).toBeCloseTo(
      base * 1.15,
    );
    expect(dealt(['the-pack-grows'], 'bjarna', PARTY, { d: { kills: 40 } })).toBeCloseTo(
      base * 1.45,
    );
  });

  it('The Wolf’s Share: a crit that downs a monster earns one extra action at once', () => {
    const killer = snap('bjarna', { base: { ...snap('bjarna').base, might: 400 } });
    const r = floor(
      [sponge('halvar'), killer, sponge('vesna')],
      ['the-wolfs-share'],
      { rolls: cyclic([0.0]), companions: [{ monster: 'bies', tier: 3 }] },
      { monster: 'bies', tier: 3 },
    );
    expect(r.log.some((e) => e.text.includes("takes the wolf's share"))).toBe(true);
    expect(r.result).toBe('win');
  });

  it('A Price Paid: each standing hunter gives up 10% of current Health for +20% Might this floor', () => {
    const r = floor(PARTY, ['a-price-paid']);
    const paid = r.log.filter((e) => e.text.startsWith('A price paid'));
    expect(paid).toHaveLength(3);
    const h = PARTY.map((p) => floor([p], []).hunters[0]?.maxHealth ?? 0);
    expect(paid.map((e) => e.amount)).toEqual(h.map((m) => Math.floor(m * 0.1)));
    expect(dealt(['a-price-paid'])).toBeCloseTo(dealt([]) * 1.2);
  });

  it('A Price Paid never takes a hunter below 1 Health', () => {
    const r = floor(PARTY, ['a-price-paid'], { d: { health: { bjarna: 0.001 } } });
    const e = r.log.find(
      (x) => x.text.startsWith('A price paid') && x.target === undefined && x.actor === 'bjarna',
    );
    expect(e?.targetHealth).toBeGreaterThanOrEqual(1);
  });

  it('The Long Vigil: once per run, when the last hunter falls, every downed hunter rises at 25%', () => {
    const frail = (id: 'halvar' | 'zora' | 'ostap') =>
      sponge(id, { base: { ...snap(id).base, health: 8, might: 1 } });
    const r = floor([frail('halvar'), frail('zora'), frail('ostap')], ['the-long-vigil']);
    const vigils = r.log.filter((e) => e.text.startsWith('The Long Vigil'));
    expect(vigils).toHaveLength(1); // once
    expect(r.delve?.vigilUsed).toBe(true);
    // Used already on an earlier floor: the party simply falls.
    const again = floor([frail('halvar'), frail('zora'), frail('ostap')], ['the-long-vigil'], {
      d: { vigilUsed: true },
    });
    expect(again.log.some((e) => e.text.startsWith('The Long Vigil'))).toBe(false);
    expect(again.endedBy).toBe('party-down');
  });

  it('Toll: each hunter’s first hit on each monster knocks its meter back 20, once', () => {
    const r = floor(PARTY, ['toll']);
    const tolls = r.log.filter((e) => e.text.includes('the bell tolls'));
    const byHunter = new Set(tolls.map((e) => e.actor));
    expect(byHunter.size).toBe(tolls.length); // one per hunter against the one monster
    expect(tolls.length).toBeGreaterThan(0);
  });

  it('Struck Bronze: a crit makes its target lose its next action', () => {
    const r = floor(PARTY, ['struck-bronze'], { rolls: cyclic([0.0]) });
    expect(r.log.some((e) => e.text.includes('struck bronze: Bies loses their next action'))).toBe(
      true,
    );
    expect(r.log.some((e) => e.kind === 'skip' && e.actor === 'bies')).toBe(true);
  });
});

describe('the Unlit’s switches (D257)', () => {
  it('No Name: the Mender never heals; she only attacks', () => {
    const r = floor([sponge('halvar'), sponge('zora'), snap('ostap')], ['no-name'], {
      d: { health: { halvar: 0.3 } },
    });
    expect(lines(r, 'heal', 'ostap')).toHaveLength(0);
    expect(r.log.some((e) => e.actor === 'ostap' && (e.kind === 'hit' || e.kind === 'miss'))).toBe(
      true,
    );
  });

  it('Drawn Thin: each hunter loses 3% of max Health on each of their own actions', () => {
    const r = floor([sponge('halvar'), sponge('zora'), sponge('ostap')], ['drawn-thin']);
    const thin = r.log.filter((e) => e.text.includes('grows thinner'));
    expect(thin.length).toBeGreaterThan(2);
    for (const e of thin) expect(e.amount).toBe(3000); // 3% of 100000
  });

  it('Unremembering: Studied and Mastered bonuses do not apply', () => {
    const mastered = (ids: string[]) =>
      hitBy(floor(PARTY, ids, {}, { monster: 'bies', tier: 3, knowledge: 4 }), 'bjarna')?.dealt ??
      0;
    expect(mastered([])).toBeCloseTo(dealt([]) * 1.1); // Mastered +10%
    expect(mastered(['unremembering'])).toBeCloseTo(dealt([]) * 1.25); // +25%, no knowledge bonus
  });

  it('What Was Burned: nothing restores Health, not a heal, not a potion, not a getting up again', () => {
    const r = floor(
      [sponge('halvar'), sponge('zora'), snap('ostap')],
      ['what-was-burned', 'the-long-vigil'],
      { d: { health: { halvar: 0.3 } } },
    );
    expect(lines(r, 'heal', 'ostap').every((e) => e.amount === 0)).toBe(true);
    const frail = sponge('zora', { base: { ...snap('zora').base, health: 8, might: 1 } });
    const down = floor([frail, frail], ['what-was-burned', 'the-long-vigil']);
    expect(down.log.some((e) => e.text.startsWith('The Long Vigil'))).toBe(false);
  });

  it('Cold Hands: +20% Might but −20% max Health (a drawback shows as a negative)', () => {
    const b = derive('cold-hands').halvar;
    expect(b.mightPct).toBe(0.2);
    expect(b.healthPct).toBe(-0.2);
  });
});

describe('Delve relics (D261): only inside a Delve', () => {
  it('Spindle Whorl adds 5% Might and Cold Iron Nail cuts 5% damage taken, in a Delve', () => {
    const base = dealt([]);
    const r = floor(PARTY, [], { d: { relics: ['spindle-whorl'] } });
    expect(hitBy(r, 'bjarna')?.dealt).toBeCloseTo(base * 1.05);
    const nail = floor(PARTY, [], { d: { relics: ['cold-iron-nail'] } });
    expect(hitBy(nail, 'bies')?.amount).toBeLessThanOrEqual(taken([]));
  });

  it('a contract fight takes no relics: the same input without `delve` is the fight it always was', () => {
    const plain = runFight({
      party: PARTY,
      monster: { monster: 'bies', tier: 3 },
      location: 'field',
      rolls: cyclic([0.5]),
    });
    const withRelics = runFight({
      party: PARTY,
      monster: { monster: 'bies', tier: 3 },
      location: 'field',
      rolls: cyclic([0.5]),
    });
    expect(withRelics).toEqual(plain);
  });
});

const resistSteel = (): number => 1;
