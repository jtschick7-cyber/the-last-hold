// Plan T8.9 (GDD §5.11.6, §8.12, D306, D314): the six Legendaries in the fight engine, one test
// each. Their finding and wearing are in tests/items/legendaries.test.ts.
import { describe, expect, it } from 'vitest';
import { monsters } from '../../src/content/monsters';
import { legendaries, type LegendaryId } from '../../src/content/legendaries';
import { runFight, type FightResult, type HunterSnapshot } from '../../src/core/combat';
import { buildHunter, buildMonster } from '../../src/core/combat/build';
import { armorEff, mightEff } from '../../src/core/combat/stats';
import { num } from '../../src/core/balance-access';
import { hunterStat } from '../../src/core/systems/hunters';
import { keepRich } from '../contracts/helpers';
import { cyclic, fightOf, lines, snap, sponge } from './helpers';

const wearing = (id: LegendaryId, over: Partial<HunterSnapshot> = {}): HunterSnapshot =>
  snap('zora', { traits: [], keepsake: id, ...over });
const tough = { health: 100000, might: 1, armor: 3, speed: 13 };

describe('the Barley Knot', () => {
  it('keeps the first action a monster’s ability would cost the holder, once a fight', () => {
    const r = fightOf(
      [sponge('halvar', { base: { ...tough, speed: 8 }, keepsake: 'barley-knot' })],
      'draugr',
      3,
      cyclic([0.5]),
      'barrow',
    );
    const hits = lines(r, 'hit', 'draugr');
    expect(hits[2]?.text).toContain('held, but their Barley Knot keeps their action');
    expect(hits[5]?.text).toContain('held (loses their next action)');
    expect(lines(r, 'skip', 'halvar').length).toBeGreaterThan(0);
  });

  it('a hunter without it loses the action the first time', () => {
    const r = fightOf(
      [sponge('halvar', { base: { ...tough, speed: 8 } })],
      'draugr',
      3,
      cyclic([0.5]),
      'barrow',
    );
    expect(lines(r, 'hit', 'draugr')[2]?.text).toContain('held (loses their next action)');
  });
});

describe('Wolf-Tooth String', () => {
  const pack = (n: number) =>
    runFight({
      party: [
        wearing('wolf-tooth-string', { base: { health: 1e6, might: 50, armor: 3, speed: 13 } }),
      ],
      monster: { monster: 'wolf', tier: 1, healthMult: 0.001 },
      companions: Array.from({ length: n - 1 }, () => ({
        monster: 'wolf' as const,
        tier: 1,
        healthMult: 0.001,
      })),
      location: 'field',
      rolls: cyclic([0.5]),
    });

  it('+3% Might (status%, stacking) for each monster downed this fight', () => {
    const notes = lines(pack(3), 'keepsake').map((e) => e.text);
    expect(notes[0]).toContain('+3% Might (3% in all)');
    expect(notes[1]).toContain('+3% Might (6% in all)');
    expect(notes).toHaveLength(3);
  });

  it('stops at +15%', () => {
    const notes = lines(pack(7), 'keepsake').map((e) => e.text);
    expect(notes).toHaveLength(5);
    expect(notes[4]).toContain('(15% in all)');
  });
});

describe('Coffin Silver', () => {
  const hitsOf = (r: FightResult) => lines(r, 'sub-hit', 'zora');

  it('each direct hit adds a Silver sub-hit of 0.15 × Might, its own log line', () => {
    const r = fightOf(
      [wearing('coffin-silver', { base: { health: 1e6, might: 15, armor: 3, speed: 13 } })],
      'wolf',
      1,
      cyclic([0.5]),
    );
    const sub = hitsOf(r)[0];
    expect(sub?.text).toContain('Coffin Silver also hits');
    const spread =
      num('combat.varianceLo') + (num('combat.varianceHi') - num('combat.varianceLo')) * 0.5;
    const holder = buildHunter(
      wearing('coffin-silver', { base: { health: 1e6, might: 15, armor: 3, speed: 13 } }),
      1,
    );
    const silverResist = monsters.wolf.resist.silver;
    expect(sub?.dealt ?? 0).toBeCloseTo(0.15 * mightEff(holder) * spread * silverResist, 9);
    // One per direct hit that leaves the target standing (the killing blow has nothing to add to).
    const direct = lines(r, 'hit', 'zora').length + lines(r, 'crit', 'zora').length;
    expect(r.result).toBe('win');
    // (A sub-hit can itself bring the target down, so the last hit may or may not have one.)
    expect(hitsOf(r).length).toBeGreaterThanOrEqual(direct - 1);
    expect(hitsOf(r).length).toBeLessThanOrEqual(direct);
  });

  it('stacks with the Silvered Blade’s own sub-hit', () => {
    const r = fightOf(
      [
        wearing('coffin-silver', {
          weapon: 'silvered-blade',
          base: { health: 1e6, might: 15, armor: 3, speed: 13 },
        }),
      ],
      'wolf',
      1,
      cyclic([0.5]),
    );
    const firstTick = lines(r, 'sub-hit', 'zora').filter(
      (e) => e.tick === (lines(r, 'hit', 'zora')[0]?.tick ?? -1),
    );
    expect(firstTick).toHaveLength(2);
    expect(firstTick.map((e) => e.text).join(' ')).toContain('Coffin Silver');
  });
});

describe('Ferryman’s Coin', () => {
  it('once, the first time the holder drops below 25% and is still standing, 30% of max Health', () => {
    const r = runFight({
      party: [wearing('ferrymans-coin', { base: { health: 100, might: 1, armor: 3, speed: 13 } })],
      monster: { monster: 'draugr', tier: 3 },
      location: 'barrow',
      rolls: cyclic([0.5]),
      stand: { health: { zora: 30 }, partyTaken: 0, volley: 0, monsterStrength: 1 },
    });
    const coins = lines(r, 'keepsake', 'zora');
    expect(coins).toHaveLength(1);
    expect(coins[0]?.amount).toBeGreaterThan(0);
    expect(coins[0]?.text).toContain('Ferryman’s Coin'.replace('’', "'"));
    // 30% of max Health (max is 100 × level scale 1).
    expect(coins[0]?.amount).toBe(30);
    expect(r.result).toBe('loss'); // it was a rescue, not a cure
  });

  it('does nothing if the holder is dropped from above the line to nothing in one blow', () => {
    const r = runFight({
      party: [wearing('ferrymans-coin', { base: { health: 100, might: 1, armor: 0, speed: 13 } })],
      monster: { monster: 'draugr', tier: 3 },
      location: 'barrow',
      rolls: cyclic([0.5]),
      stand: { health: { zora: 5 }, partyTaken: 0, volley: 0, monsterStrength: 1 },
    });
    expect(lines(r, 'keepsake')).toHaveLength(0);
  });
});

describe('Rune Nail', () => {
  it('the holder’s direct attacks ignore 25% of the target’s Armor', () => {
    const hit = (keepsake?: LegendaryId) =>
      lines(
        fightOf(
          [
            snap('zora', {
              traits: [],
              ...(keepsake ? { keepsake } : {}),
              base: { health: 1e6, might: 100, armor: 3, speed: 13 },
            }),
          ],
          'draugr',
          3,
          cyclic([0.5]),
          'barrow',
        ),
        'hit',
        'zora',
      )[0];
    const armor = armorEff(buildMonster({ monster: 'draugr', tier: 3 }));
    const plain = hit();
    const nailed = hit('rune-nail');
    expect(plain?.amount).toBeDefined();
    const gained = (nailed?.amount ?? 0) - (plain?.amount ?? 0);
    expect(Math.abs(gained - armor * 0.25)).toBeLessThanOrEqual(1);
    expect(nailed?.text).toContain('Rune Nail ignores 25%');
    expect(plain?.text).not.toContain('Rune Nail');
  });
});

describe('Yrsa’s Thole', () => {
  it('the holder’s meter starts at 50 and they gain +2 Speed', () => {
    const plain = buildHunter(snap('zora', { traits: [] }), 1);
    const held = buildHunter(wearing('yrsas-thole'), 1);
    expect(plain.meter).toBe(0);
    expect(held.meter).toBe(50);
    expect(held.speed).toBe(plain.speed + 2);
  });

  it('shows in the fight: a log line, and the holder acts sooner', () => {
    const first = (keepsake?: LegendaryId) => {
      const r = fightOf(
        [snap('zora', { traits: [], ...(keepsake ? { keepsake } : {}) })],
        'wolf',
        1,
        cyclic([0.5]),
      );
      return { r, tick: lines(r, 'hit', 'zora')[0]?.tick ?? 0 };
    };
    expect(first('yrsas-thole').tick).toBeLessThan(first().tick);
    expect(lines(first('yrsas-thole').r, 'keepsake', 'zora')[0]?.text).toContain(
      'meter starts at 50',
    );
  });

  it('is shown on the Speed breakdown of the sheet', () => {
    const s = keepRich('thole');
    const h = s.hunters.zora;
    if (!h) throw new Error('no zora');
    const before = hunterStat(s, 'zora', 'speed').value;
    h.keepsake = 'yrsas-thole';
    const after = hunterStat(s, 'zora', 'speed');
    expect(after.value).toBe(before + 2);
    expect(JSON.stringify(after.breakdown)).toContain(legendaries['yrsas-thole'].name);
  });
});
