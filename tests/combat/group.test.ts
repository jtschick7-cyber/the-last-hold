// Plan T7.6 (GDD §5.10.4, D251): group fights. The party fights a monster plus its
// `companions`. One test per rule: targeting by role, the same-tick order, same-name passives,
// every ability acting on the member that owns it, success when every monster is down, and
// the log naming group targets. A one-monster fight is exactly the fight it always was
// (the goldens in tests/golden are the proof; one equality test here too).
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { runFight, type FightInput, type MonsterInstance } from '../../src/core/combat';
import { stream } from '../../src/core/rng';
import { cyclic, lines, snap, sponge } from './helpers';

const tier2 = (
  monster: MonsterInstance['monster'],
  extra: Partial<MonsterInstance> = {},
): MonsterInstance => ({
  monster,
  tier: 2,
  ...extra,
});

const group = (
  party: FightInput['party'],
  first: MonsterInstance,
  companions: readonly MonsterInstance[],
  rolls = cyclic([0.05, 0.5, 0.9]),
) => runFight({ party, monster: first, companions, location: 'field', rolls });

/** A hunter of the content with every stat set, so a test controls who acts when. */
const fixed = (
  id: 'halvar' | 'zora' | 'ostap',
  over: { might?: number; speed?: number; health?: number },
) => {
  const h = hunters[id];
  return snap(id, {
    base: {
      ...h.stats,
      might: over.might ?? h.stats.might,
      speed: over.speed ?? h.stats.speed,
      health: over.health ?? 100000,
    },
    traits: [],
  });
};

describe('a one-monster fight is exactly the fight it was (D251)', () => {
  it('has the same result and log with no companions, an empty list, or none given', () => {
    const base = {
      party: [snap('halvar'), snap('zora'), snap('ostap')],
      monster: tier2('upyr'),
      location: 'field' as const,
    };
    const plain = runFight({ ...base, rolls: stream('same', 'fight', '1') });
    const none = runFight({ ...base, companions: [], rolls: stream('same', 'fight', '1') });
    expect(none).toEqual(plain);
    expect(plain.monsters).toHaveLength(1);
    expect(plain.monsterHealth).toBe(plain.monsters[0]?.health);
  });
});

describe('success and failure', () => {
  it('wins only when every monster is down, and the monsters’ Health is the sum', () => {
    const killers = [
      fixed('halvar', { might: 400 }),
      fixed('zora', { might: 400 }),
      fixed('ostap', { might: 400 }),
    ];
    const r = group(killers, tier2('upyr'), [tier2('upyr'), tier2('kikimora')]);
    expect(r.result).toBe('win');
    expect(r.monsters.map((m) => m.health)).toEqual([0, 0, 0]);
    expect(r.monsterHealth).toBe(0);
    const downs = lines(r, 'hit').filter((e) => e.targetHealth === 0).length;
    expect(downs).toBeGreaterThanOrEqual(3);
  });

  it('fails when every hunter is down, with monsters left standing', () => {
    const weak = [sponge('halvar', { base: { ...hunters.halvar.stats, health: 5, might: 1 } })];
    const r = group(weak, tier2('upyr'), [tier2('upyr')]);
    expect(r.result).toBe('loss');
    expect(r.endedBy).toBe('party-down');
    expect(r.monsterHealth).toBeGreaterThan(0);
  });

  it('fails at tick 400 if the group is still standing', () => {
    const r = group([sponge('halvar'), sponge('zora'), sponge('ostap')], tier2('upyr'), [
      tier2('upyr'),
    ]);
    expect(r.endedBy).toBe('retreat');
    expect(r.ticks).toBe(400);
  });
});

describe('hunters choose a target by role (no new dice)', () => {
  /** Who each hunter's hits landed on, by log target id. */
  const targets = (r: ReturnType<typeof group>, hunter: string) =>
    r.log
      .filter(
        (e) => e.actor === hunter && (e.kind === 'hit' || e.kind === 'crit' || e.kind === 'miss'),
      )
      .map((e) => e.target);

  it('the Vanguard hits the front monster: the first standing in group order, then the next', () => {
    const r = group(
      [fixed('halvar', { might: 60 }), sponge('zora'), sponge('ostap')],
      tier2('upyr'),
      [tier2('kikimora'), tier2('rusalka')],
    );
    const t = targets(r, 'halvar');
    expect(t[0]).toBe('upyr');
    // Once the first is down, he moves to the second in group order, never the third first.
    const firstSecond = t.indexOf('kikimora');
    const firstThird = t.indexOf('rusalka');
    expect(firstSecond).toBeGreaterThan(0);
    expect(firstThird === -1 || firstThird > firstSecond).toBe(true);
    expect(t.slice(0, firstSecond).every((x) => x === 'upyr')).toBe(true);
  });

  it('the Striker hits the standing monster with the lowest Health', () => {
    // The Kikimora (110) has less Health than the Upyr (170) and the Rusalka (150), whatever the order.
    const r = group(
      [sponge('halvar'), fixed('zora', { might: 20 }), sponge('ostap')],
      tier2('upyr'),
      [tier2('rusalka'), tier2('kikimora')],
    );
    expect(targets(r, 'zora')[0]).toBe('kikimora');
  });

  it('breaks a Health tie by group order', () => {
    const r = group(
      [sponge('halvar'), fixed('zora', { might: 20 }), sponge('ostap')],
      tier2('upyr'),
      [tier2('upyr')],
    );
    const t = targets(r, 'zora');
    expect(t[0]).toBe('upyr'); // the first Upyr; both start at the same Health
  });

  it('the Mender attacks the front monster when nobody needs healing', () => {
    const r = group(
      [sponge('halvar'), sponge('zora'), fixed('ostap', { might: 20 })],
      tier2('upyr'),
      [tier2('kikimora')],
    );
    expect(targets(r, 'ostap')[0]).toBe('upyr');
  });

  it('the Mender heals by the same rule as ever: the lowest % Health, if below the threshold', () => {
    const hurt = [
      fixed('halvar', { health: 60 }),
      sponge('zora'),
      sponge('ostap', { base: { ...hunters.ostap.stats, health: 100000, might: 10 } }),
    ];
    const r = group(hurt, tier2('upyr'), [tier2('upyr')], cyclic([0.05, 0.5, 0.9]));
    expect(lines(r, 'heal', 'ostap').length).toBeGreaterThan(0);
  });
});

describe('the same-tick order (GDD §5.5, extended)', () => {
  it('goes hunters before monsters, then party slot order, then group order', () => {
    // Everyone at Speed 10 reaches the threshold on the same tick.
    const s = (id: 'halvar' | 'zora' | 'ostap') =>
      fixed(id, { speed: 10, health: 100000, might: 1 });
    const slow = (m: MonsterInstance['monster']) => tier2(m);
    const r = runFight({
      party: [s('halvar'), s('zora'), s('ostap')],
      monster: slow('upyr'),
      companions: [slow('upyr'), slow('upyr')],
      location: 'field',
      rolls: cyclic([0.5]),
    });
    // Upyr and the content's monsters have their own Speed (10), so all six act on tick 10.
    const first = r.log.filter((e) => e.tick === 10).map((e) => e.actor);
    expect(first.slice(0, 3)).toEqual(['halvar', 'zora', 'ostap']);
    expect(first.slice(3, 6)).toEqual(['upyr', 'upyr-2', 'upyr-3']);
  });
});

describe('same-name passives do not stack (§5.0)', () => {
  it('two Gloam-moth swarms lower hit chance by 10 points, not 20', () => {
    const r = group(
      [sponge('halvar'), sponge('zora'), sponge('ostap')],
      tier2('gloam-moths'),
      [tier2('gloam-moths')],
      cyclic([0.5]),
    );
    const hits = r.log.filter((e) => e.actor === 'halvar').slice(0, 3);
    expect(hits.length).toBeGreaterThan(0);
    for (const e of hits) expect(e.rollNotes?.[0]).toContain('80%'); // 90% − 10, not 70%
  });

  it('is 10 points while either swarm stands', () => {
    const r = group(
      [fixed('halvar', { might: 90 }), sponge('zora'), sponge('ostap')],
      tier2('gloam-moths'),
      [tier2('gloam-moths')],
      cyclic([0.5]),
    );
    const later = r.log.filter((e) => e.actor === 'halvar');
    for (const e of later) expect(e.rollNotes?.[0]).toContain('80%');
  });
});

describe('every ability acts on the member that owns it', () => {
  it('Bloodfeast heals the Upyr that dealt the damage, not the other', () => {
    const r = group(
      [sponge('halvar'), sponge('zora'), sponge('ostap')],
      tier2('upyr'),
      [tier2('upyr')],
      cyclic([0.05, 0.5, 0.9]),
    );
    const drinkers = r.log.filter(
      (e) =>
        (e.kind === 'hit' || e.kind === 'crit') && (e.actor === 'upyr' || e.actor === 'upyr-2'),
    );
    expect(drinkers.length).toBeGreaterThan(0);
    for (const e of drinkers) {
      const owner = e.actor === 'upyr' ? 'first Upyr' : 'second Upyr';
      expect(e.text).toContain(`${owner} drinks`);
    }
  });

  it('Second Soul raises that member once without ending the fight', () => {
    const killers = [
      fixed('halvar', { might: 400 }),
      fixed('zora', { might: 400 }),
      fixed('ostap', { might: 400 }),
    ];
    const r = group(killers, tier2('strzyga'), [tier2('upyr')]);
    expect(r.log.filter((e) => e.text.includes('rises again with its second soul'))).toHaveLength(
      1,
    );
    expect(r.result).toBe('win');
  });
});

describe('members, names and ids', () => {
  it('scale a member’s Health and Might by their multipliers (D250)', () => {
    const r = group([sponge('halvar')], tier2('upyr', { healthMult: 0.5, mightMult: 0.6 }), [
      tier2('upyr'),
    ]);
    expect(r.monsters.map((m) => m.maxHealth)).toEqual([85, 170]);
  });

  it('name a species that appears twice "first" and "second", and give each its own id', () => {
    const r = group(
      [fixed('halvar', { might: 60 }), sponge('zora'), sponge('ostap')],
      tier2('upyr'),
      [tier2('upyr'), tier2('kikimora')],
    );
    expect(r.monsters.map((m) => m.id)).toEqual(['upyr', 'upyr-2', 'kikimora']);
    const text = r.log.map((e) => e.text).join('\n');
    expect(text).toContain('the first Upyr');
    expect(text).toContain('the second Upyr');
    expect(text).not.toContain('the Kikimora Kikimora');
    expect(text).toContain('Kikimora');
    expect(r.log.some((e) => /^(first|second) /.test(e.text))).toBe(false); // sentence starts are capitalised
  });

  it('are deterministic from the seed', () => {
    const run = () =>
      runFight({
        party: [snap('halvar'), snap('zora'), snap('ostap')],
        monster: tier2('upyr', { healthMult: 0.5, mightMult: 0.6 }),
        companions: [tier2('rusalka', { healthMult: 0.5, mightMult: 0.6 })],
        location: 'field',
        rolls: stream('g', 'fight', '1'),
      });
    expect(run()).toEqual(run());
  });
});
