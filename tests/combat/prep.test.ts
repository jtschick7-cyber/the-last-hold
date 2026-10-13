// Plan T3.9, the combat half: oils, potions, bombs, Saltburst, Spoil and Herbwise.
// GDD §5.7, §5.5, §8.3. Each rule has its own test.
import { describe, expect, it } from 'vitest';
import type { ConsumableId } from '../../src/content/consumables';
import type { HunterId } from '../../src/content/hunters';
import { runFight, type FightResult, type HunterSnapshot } from '../../src/core/combat';
import { seeded } from '../../src/core/rng';
import type { Preparation } from '../../src/core/state/game-state';
import { cyclic, snap, sponge } from './helpers';

const prep = (over: Partial<Preparation> = {}): Preparation => ({
  oils: {},
  potions: {},
  bombs: [],
  ...over,
});

const fight = (
  party: readonly HunterSnapshot[],
  monster: Parameters<typeof runFight>[0]['monster'],
  p: Preparation | undefined,
  rolls = cyclic([0.5]),
  location: Parameters<typeof runFight>[0]['location'] = 'field',
): FightResult => runFight({ party, monster, location, rolls, prep: p });

const kinds = (r: FightResult, kind: string) => r.log.filter((l) => l.kind === kind);
const text = (r: FightResult) => r.log.map((l) => l.text).join('\n');
/** Ticks at which an actor took an action (one tick can hold several attacks). */
const actionTicks = (r: FightResult, actor: string): number[] => [
  ...new Set(r.log.filter((l) => l.actor === actor && l.kind !== 'prep').map((l) => l.tick)),
];

describe('oils (GDD §5.7)', () => {
  const dealtOnFirstHit = (r: FightResult, by: string): number => {
    const hit = r.log.find((l) => (l.kind === 'hit' || l.kind === 'crit') && l.actor === by);
    if (!hit?.dealt) throw new Error('no hit');
    return hit.dealt;
  };

  it('a matching oil adds 35% to that hunter’s damage for the whole fight', () => {
    const party = [snap('halvar')];
    const bare = fight(party, { monster: 'upyr', tier: 2 }, undefined, seeded('oil'));
    const oiled = fight(
      party,
      { monster: 'upyr', tier: 2 },
      prep({ oils: { halvar: 'grave-oil' } }),
      seeded('oil'),
    );
    expect(dealtOnFirstHit(oiled, 'halvar')).toBeCloseTo(dealtOnFirstHit(bare, 'halvar') * 1.35, 9);
    // The whole fight, not just the first hit: every hunter hit is 35% harder.
    const hits = (r: FightResult) => r.log.filter((l) => l.actor === 'halvar' && l.dealt);
    expect(hits(oiled).length).toBeGreaterThan(1);
    expect(hits(oiled)[1]?.dealt).toBeCloseTo((hits(bare)[1]?.dealt ?? 0) * 1.35, 9);
  });

  it('each oil matches only its own family', () => {
    const cases: [ConsumableId, 'upyr' | 'rusalka' | 'kikimora'][] = [
      ['grave-oil', 'upyr'],
      ['drowned-bane-oil', 'rusalka'],
      ['thornbane-oil', 'kikimora'],
    ];
    for (const [oil, monster] of cases) {
      const party = [snap('halvar')];
      const tier = monster === 'kikimora' ? 1 : 2;
      const bare = fight(party, { monster, tier }, undefined, seeded('oil2'), 'river');
      const oiled = fight(
        party,
        { monster, tier },
        prep({ oils: { halvar: oil } }),
        seeded('oil2'),
        'river',
      );
      expect(dealtOnFirstHit(oiled, 'halvar'), oil).toBeCloseTo(
        dealtOnFirstHit(bare, 'halvar') * 1.35,
        9,
      );
    }
  });

  it('a mismatched oil does nothing at all: the fight is identical, line for line', () => {
    const party = [snap('halvar'), snap('zora')];
    const bare = fight(party, { monster: 'rusalka', tier: 2 }, undefined, seeded('mis'), 'river');
    const wrong = fight(
      party,
      { monster: 'rusalka', tier: 2 },
      prep({ oils: { halvar: 'grave-oil', zora: 'thornbane-oil' } }),
      seeded('mis'),
      'river',
    );
    expect(text(wrong)).toBe(text(bare));
    expect(wrong.result).toBe(bare.result);
  });

  it('only the hunter who carries it gets the bonus', () => {
    const party = [snap('halvar'), snap('radek')];
    const withOne = fight(
      party,
      { monster: 'draugr', tier: 3 },
      prep({ oils: { radek: 'grave-oil' } }),
      seeded('two'),
      'barrow',
    );
    const bare = fight(party, { monster: 'draugr', tier: 3 }, undefined, seeded('two'), 'barrow');
    expect(dealtOnFirstHit(withOne, 'halvar')).toBe(dealtOnFirstHit(bare, 'halvar'));
  });

  it('adds to the outgoing% bucket with a trait, not on top of it: Grave-warden +20% and Grave Oil +35% make +55%', () => {
    const radek = snap('radek'); // Grave-warden
    const bare = fight([radek], { monster: 'draugr', tier: 3 }, undefined, seeded('add'), 'barrow');
    const oiled = fight(
      [radek],
      { monster: 'draugr', tier: 3 },
      prep({ oils: { radek: 'grave-oil' } }),
      seeded('add'),
      'barrow',
    );
    expect(dealtOnFirstHit(oiled, 'radek') / dealtOnFirstHit(bare, 'radek')).toBeCloseTo(
      1.55 / 1.2,
      9,
    );
  });
});

describe('potions (GDD §5.7)', () => {
  it('Quickfoot Tincture: +20% Speed for the whole fight, drunk at the start', () => {
    const zora = snap('zora'); // Speed 16: first action at tick 7
    const bare = fight([zora], { monster: 'kikimora', tier: 1 }, undefined);
    const fast = fight(
      [zora],
      { monster: 'kikimora', tier: 1 },
      prep({ potions: { zora: 'quickfoot-tincture' } }),
    );
    expect(actionTicks(bare, 'zora')[0]).toBe(7);
    expect(actionTicks(fast, 'zora')[0]).toBe(6); // 19.2 per tick
    expect(text(fast)).toContain('Zora Sedlak drinks Quickfoot Tincture (+20% Speed');
    expect(fast.log[0]?.tick).toBe(1);
  });

  it('Hardwood Tonic: +30% Armor, covering the holder’s first 5 actions, then gone', () => {
    const halvar = snap('halvar'); // Armor 8: 10.40 with the tonic
    const r = fight(
      [halvar],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'hardwood-tonic' } }),
    );
    let actions = 0;
    const armorAt: { actions: number; armor: string }[] = [];
    for (const l of r.log) {
      if (l.actor === 'halvar' && (l.kind === 'hit' || l.kind === 'crit' || l.kind === 'miss'))
        actions += 1;
      if (l.actor === 'wolf' && (l.kind === 'hit' || l.kind === 'crit')) {
        const m = /−([\d.]+) armor/.exec(l.text);
        armorAt.push({ actions, armor: m?.[1] ?? '' });
      }
    }
    expect(armorAt.length).toBeGreaterThan(8);
    for (const x of armorAt)
      expect(x.armor, `after ${x.actions} actions`).toBe(x.actions < 5 ? '10.40' : '8.00');
    expect(text(r)).toContain('drinks Hardwood Tonic (+30% Armor for 5 actions)');
  });

  it('Mending Draught: once, below 30% Health, heals 40% of max Health', () => {
    // A frail Zora against a hard hitter, so she falls below 30% with the draught unused.
    const zora = snap('zora', { base: { health: 100, might: 1, armor: 0, speed: 16 } });
    const r = fight(
      [zora],
      { monster: 'bies', tier: 4 },
      prep({ potions: { zora: 'mending-draught' } }),
    );
    const drinks = r.log.filter((l) => l.kind === 'prep' && l.text.includes('Mending Draught'));
    expect(drinks).toHaveLength(1);
    const d = drinks[0];
    expect(d?.amount).toBe(40);
    expect(d?.targetHealth ?? 0).toBeGreaterThan(0);
    // It fired right after the hit that took her under 30 of 100.
    const before = r.log.filter(
      (l) => l.tick <= (d?.tick ?? 0) && l.target === 'zora' && l.kind === 'hit',
    );
    const last = before[before.length - 1];
    expect(last?.targetHealth ?? 99).toBeLessThan(30);
    expect((d?.targetHealth ?? 0) - 40).toBe(last?.targetHealth);
  });

  it('Mending Draught never fires above the threshold, and never twice', () => {
    const healthy = fight(
      [sponge('halvar')],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { halvar: 'mending-draught' } }),
    );
    expect(kinds(healthy, 'prep')).toHaveLength(0);
  });

  it('Herbwise makes potions 25% stronger: Vesna’s draught heals 50%, her tonic gives +37.5% Armor, her tincture +25% Speed', () => {
    const base = { health: 100, might: 1, armor: 0, speed: 11 };
    const vesna = snap('vesna', { base, traits: ['herbwise'] });
    const heal = fight(
      [vesna],
      { monster: 'bies', tier: 4 },
      prep({ potions: { vesna: 'mending-draught' } }),
    );
    expect(heal.log.find((l) => l.kind === 'prep' && l.text.includes('Mending'))?.amount).toBe(50);
    const tonic = fight(
      [vesna],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { vesna: 'hardwood-tonic' } }),
    );
    expect(text(tonic)).toContain('+37.5% Armor');
    const speed = fight(
      [vesna],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { vesna: 'quickfoot-tincture' } }),
    );
    expect(text(speed)).toContain('+25% Speed');
    // Without Herbwise the same potions are the plain strength.
    const plain = snap('vesna', { base, traits: [] });
    const plainHeal = fight(
      [plain],
      { monster: 'bies', tier: 4 },
      prep({ potions: { vesna: 'mending-draught' } }),
    );
    expect(plainHeal.log.find((l) => l.kind === 'prep' && l.text.includes('Mending'))?.amount).toBe(
      40,
    );
  });

  it('a potion only works for the hunter who carries it', () => {
    const r = fight(
      [sponge('halvar'), sponge('zora')],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { zora: 'quickfoot-tincture' } }),
    );
    expect(text(r)).not.toContain('Halvar Two-Smokes drinks');
    expect(text(r)).toContain('Zora Sedlak drinks');
  });
});

describe('Spoil (Kikimora, GDD §8.3)', () => {
  const frail = snap('zora', { base: { health: 40, might: 1, armor: 0, speed: 13 } });

  it('ruins a hunter’s unused potion on its first hit on them', () => {
    const r = fight(
      [frail],
      { monster: 'kikimora', tier: 1 },
      prep({ potions: { zora: 'mending-draught' } }),
    );
    expect(text(r)).toMatch(/Kikimora's Spoil ruins Zora Sedlak's Mending Draught/);
    expect(kinds(r, 'prep').filter((l) => l.text.includes('drinks'))).toHaveLength(0);
  });

  it('does not touch a potion against a monster without Spoil: the same potion fires', () => {
    const r = fight(
      [frail],
      { monster: 'wolf', tier: 1 },
      prep({ potions: { zora: 'mending-draught' } }),
    );
    expect(kinds(r, 'prep').filter((l) => l.text.includes('Mending Draught')).length).toBe(1);
  });

  it('leaves potions that already fired at the start alone (they are used, not unused)', () => {
    const r = fight(
      [frail],
      { monster: 'kikimora', tier: 1 },
      prep({ potions: { zora: 'quickfoot-tincture' } }),
    );
    expect(text(r)).not.toContain('Spoil ruins');
    expect(text(r)).toContain('drinks Quickfoot Tincture');
  });

  it('only the first hit on each hunter matters, and each hunter is spoiled separately', () => {
    const r = fight(
      [frail, snap('radek', { base: { health: 40, might: 1, armor: 0, speed: 7 } })],
      { monster: 'kikimora', tier: 1 },
      prep({ potions: { zora: 'mending-draught', radek: 'mending-draught' } }),
    );
    const ruined = r.log.filter((l) => l.text.includes('Spoil ruins'));
    expect(ruined.length).toBeLessThanOrEqual(2);
    const names = ruined.map((l) => /ruins (.+?)'s/.exec(l.text)?.[1]);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('bombs (GDD §5.7)', () => {
  const party = () => [sponge('halvar'), sponge('zora')];

  it('Fire Pot: 40 Fire at tick 1, then 10 Fire at the start of each of the monster’s next 3 actions, ignoring Armor, through resistance', () => {
    // Gaunt Wolf: Fire ×1.25 → 50 now, 12.5 → 13 per action.
    const r = fight(party(), { monster: 'wolf', tier: 1 }, prep({ bombs: ['fire-pot'] }));
    const thrown = r.log.find((l) => l.kind === 'bomb');
    expect(thrown?.tick).toBe(1);
    expect(thrown?.amount).toBe(50);
    expect(thrown?.text).toContain('Fire Pot');
    expect(thrown?.targetHealth).toBe(70);
    const burns = kinds(r, 'burn');
    expect(burns).toHaveLength(3);
    expect(burns.map((b) => b.amount)).toEqual([13, 13, 13]);
    // The burn comes before that action's attacks.
    for (const b of burns) {
      const sameTick = r.log.filter((l) => l.tick === b.tick && l.actor === 'wolf');
      expect(sameTick[0]?.kind).toBe('burn');
    }
    // Armor does not touch it: the wolf has only 2 Armor, so use a heavily armored monster too.
    const draugr = fight(
      party(),
      { monster: 'draugr', tier: 3 },
      prep({ bombs: ['fire-pot'] }),
      cyclic([0.5]),
      'barrow',
    );
    expect(draugr.log.find((l) => l.kind === 'bomb')?.amount).toBe(60); // 40 × 1.5, no Armor taken off
  });

  it('Fire Pot burning stops after 3 monster actions', () => {
    const r = fight(party(), { monster: 'wolf', tier: 1 }, prep({ bombs: ['fire-pot'] }));
    const wolfTicks = actionTicks(r, 'wolf').filter((t) => t > 1);
    expect(kinds(r, 'burn').map((b) => b.tick)).toEqual(wolfTicks.slice(0, 3));
  });

  it('Frost Pot: 30 Frost at tick 1, then −30% Speed for the monster’s next 3 actions', () => {
    const bare = fight(party(), { monster: 'wolf', tier: 1 }, undefined);
    const r = fight(party(), { monster: 'wolf', tier: 1 }, prep({ bombs: ['frost-pot'] }));
    expect(r.log.find((l) => l.kind === 'bomb')?.amount).toBe(30);
    const a = actionTicks(bare, 'wolf');
    const b = actionTicks(r, 'wolf');
    expect(b[0]).toBeGreaterThan(a[0] ?? 0);
    // The first three gaps are long; after that it is back to the monster's own pace.
    const gaps = b.slice(1, 8).map((t, i) => t - (b[i] ?? 0));
    expect(Math.min(gaps[0] ?? 0, gaps[1] ?? 0)).toBeGreaterThanOrEqual(10);
    expect(gaps[4]).toBeLessThanOrEqual(8);
    expect(text(r)).toContain('slows (−30% Speed for 3 actions)');
  });

  it('Frost Pot also suppresses Noon Heat for the monster’s next 3 actions', () => {
    const bare = fight(party(), { monster: 'poludnitsa', tier: 2 }, undefined);
    const frost = fight(
      party(),
      { monster: 'poludnitsa', tier: 2 },
      prep({ bombs: ['frost-pot'] }),
    );
    const burnTicks = (r: FightResult) =>
      r.log.filter((l) => l.text.startsWith('Noon Heat')).map((l) => l.tick);
    const first = (r: FightResult) => r.log.find((l) => l.text.startsWith('Noon Heat'))?.tick ?? 0;
    expect(first(frost)).toBeGreaterThan(first(bare));
    expect(burnTicks(bare).length).toBeGreaterThan(0);
    // Three of the monster's actions pass with no Noon Heat at all.
    const poluTicks = actionTicks(frost, 'poludnitsa').filter((t) => t > 1);
    expect(burnTicks(frost).some((t) => t <= (poluTicks[2] ?? 0))).toBe(false);
  });

  it('resistance applies to a bomb: Frost Pot on a Draugr (Frost ×0.25) does 7.5 → 8', () => {
    const r = fight(
      party(),
      { monster: 'draugr', tier: 3 },
      prep({ bombs: ['frost-pot'] }),
      cyclic([0.5]),
      'barrow',
    );
    expect(r.log.find((l) => l.kind === 'bomb')?.amount).toBe(8);
  });

  it('two bombs are both thrown at tick 1, in order', () => {
    const r = fight(
      party(),
      { monster: 'wolf', tier: 1 },
      prep({ bombs: ['fire-pot', 'frost-pot'] }),
    );
    const b = kinds(r, 'bomb');
    expect(b.map((x) => x.tick)).toEqual([1, 1]);
    expect(b[0]?.text).toContain('Fire Pot');
    expect(b[1]?.text).toContain('Frost Pot');
    expect(b[1]?.targetHealth).toBe(120 - 50 - 30);
  });

  it('a bomb can end the fight at tick 1', () => {
    const r = fight(
      party(),
      { monster: 'wolf', tier: 1 },
      prep({ bombs: ['fire-pot', 'fire-pot', 'fire-pot'] }),
    );
    expect(r.result).toBe('win');
    expect(r.ticks).toBe(1);
  });
});

describe('Saltburst (GDD §5.7)', () => {
  const party = () => [sponge('halvar'), sponge('zora')];
  const salt = prep({ bombs: ['saltburst'] });

  it('cancels the Riverhorse: the Nix carries nobody off on its first action', () => {
    const bare = fight(party(), { monster: 'nix', tier: 3 }, undefined, cyclic([0.5]), 'river');
    const r = fight(party(), { monster: 'nix', tier: 3 }, salt, cyclic([0.5]), 'river');
    expect(text(bare)).toContain('carries');
    expect(text(r)).not.toContain('carries');
    expect(text(r)).toMatch(/Saltburst goes off: the Nix's Riverhorse is cancelled/);
    expect(r.saltburstCancelled).toBe(true);
    expect(bare.saltburstCancelled).toBe(false);
  });

  it('cancels the Rusalka’s first Drowning Song, and the next 3 actions are blocked (her 5th action sings again)', () => {
    const bare = fight(party(), { monster: 'rusalka', tier: 2 }, undefined, cyclic([0.5]), 'river');
    const r = fight(party(), { monster: 'rusalka', tier: 2 }, salt, cyclic([0.5]), 'river');
    const songs = (x: FightResult) =>
      x.log.filter((l) => l.text.includes('sings')).map((l) => l.tick);
    const acts = actionTicks(r, 'rusalka').filter((t) => t > 1);
    expect(songs(bare)[0]).toBe(actionTicks(bare, 'rusalka').filter((t) => t > 1)[0]);
    expect(text(r)).toMatch(/Drowning Song is cancelled/);
    // Songs are on the 1st, 5th, 9th action; the 1st is cancelled, so the 5th is the first heard.
    expect(songs(r)[0]).toBe(acts[4]);
  });

  it('cancels Barrow-Grip on the Draugr’s 3rd action, blocks actions 4–6 (so the 6th grip is lost too), and the 9th grips', () => {
    const r = fight(
      [sponge('halvar')],
      { monster: 'draugr', tier: 3 },
      salt,
      cyclic([0.5]),
      'barrow',
    );
    const draugrActs = actionTicks(r, 'draugr').filter((t) => t > 1);
    const held = r.log.filter((l) => l.text.includes('is held')).map((l) => l.tick);
    expect(text(r)).toMatch(/Barrow-Grip is cancelled/);
    expect(held[0]).toBe(draugrActs[8]); // the 9th action
    expect(held).not.toContain(draugrActs[2]);
    expect(held).not.toContain(draugrActs[5]);
  });

  it('cancels the Wolf’s first Hamstring that lands, and blocks the next 3 actions', () => {
    // 0.1 is under the 25% Hamstring chance and under the 90% hit chance: every hit hamstrings.
    const bare = fight([sponge('halvar')], { monster: 'wolf', tier: 1 }, undefined, cyclic([0.1]));
    const r = fight([sponge('halvar')], { monster: 'wolf', tier: 1 }, salt, cyclic([0.1]));
    expect(text(bare)).toContain('is hamstrung');
    const firstHam = (x: FightResult) =>
      x.log.find((l) => l.text.includes('is hamstrung'))?.tick ?? 0;
    const wolfActs = actionTicks(r, 'wolf').filter((t) => t > 1);
    expect(text(r)).toMatch(/Hamstring is cancelled/);
    // Cancelled on action 1, blocked on 2–4, first lands on action 5.
    expect(firstHam(r)).toBe(wolfActs[4]);
  });

  it('cancels the first Noon Heat tick and blocks the next 3 actions', () => {
    const r = fight(party(), { monster: 'poludnitsa', tier: 2 }, salt, cyclic([0.5]));
    const acts = actionTicks(r, 'poludnitsa').filter((t) => t > 1);
    const burns = r.log.filter((l) => l.text.startsWith('Noon Heat')).map((l) => l.tick);
    expect(text(r)).toMatch(/Noon Heat is cancelled/);
    expect(burns[0]).toBe(acts[4]);
  });

  it('goes off once only; after the blocked actions the abilities work as usual', () => {
    const r = fight(party(), { monster: 'poludnitsa', tier: 2 }, salt, cyclic([0.5]));
    expect(r.log.filter((l) => l.text.includes('Saltburst goes off'))).toHaveLength(1);
    expect(r.log.filter((l) => l.text.startsWith('Noon Heat')).length).toBeGreaterThan(3);
  });

  it('is simply kept in the bag when the fight ends before any ability triggers', () => {
    const r = fight(
      party(),
      { monster: 'wolf', tier: 1 },
      prep({ bombs: ['saltburst', 'fire-pot', 'fire-pot'] }),
      cyclic([0.9]),
    );
    // Misses everywhere (0.9 is not under 90%), so the wolf's Hamstring never rolls; bombs end it.
    expect(r.saltburstCancelled).toBe(false);
  });

  it('cancels the Strzyga’s Second Soul: she does not rise', () => {
    const strong = [snap('halvar', { base: { health: 100000, might: 4000, armor: 8, speed: 7 } })];
    const bare = fight(strong, { monster: 'strzyga', tier: 4 }, undefined, cyclic([0.5]), 'barrow');
    const r = fight(strong, { monster: 'strzyga', tier: 4 }, salt, cyclic([0.5]), 'barrow');
    expect(text(bare)).toContain('rises again');
    expect(text(r)).not.toContain('rises again');
    expect(r.result).toBe('win');
    expect(r.saltburstCancelled).toBe(true);
  });
});

describe('preparation is part of a fight’s inputs', () => {
  it('the same preparation and rolls give the same fight; no preparation gives the v0.2 fight exactly', () => {
    const party = [snap('halvar'), snap('zora')];
    const p = prep({ oils: { halvar: 'grave-oil' }, bombs: ['fire-pot'] });
    const a = fight(party, { monster: 'upyr', tier: 2 }, p, seeded('same'));
    const b = fight(party, { monster: 'upyr', tier: 2 }, p, seeded('same'));
    expect(text(a)).toBe(text(b));
    const none = fight(party, { monster: 'upyr', tier: 2 }, prep(), seeded('same'));
    const absent = fight(party, { monster: 'upyr', tier: 2 }, undefined, seeded('same'));
    expect(text(none)).toBe(text(absent));
    expect(none.ticks).toBe(absent.ticks);
  });
});

export type { HunterId };
