// Plan T2.7 and T2.9: one test per monster ability, in the turn-meter form of
// GDD §8.3. Abilities are exercised with constant rolls, so every number can be
// worked out by hand. Interpretation choices (ordering inside an action, what
// "every Nth action" counts) are in decisions row D70.
import { describe, expect, it } from 'vitest';
import { cyclic, fightOf, lines, snap, sponge } from './helpers';

/** The ticks on which a combatant of this Speed acts, from the turn meter's own rule. */
const actionTicks = (speed: number, count: number): number[] => {
  const out: number[] = [];
  let meter = 0;
  for (let tick = 1; out.length < count; tick++) {
    meter += speed;
    if (meter >= 100) {
      meter -= 100;
      out.push(tick);
    }
  }
  return out;
};

const tough = { health: 1000000, might: 1, armor: 8, speed: 7 };

describe('Gaunt Wolf: Hamstring', () => {
  it('a hit that rolls under 25% cuts the target Speed by 30% for its next 3 actions', () => {
    const z = sponge('zora', { base: { health: 1000000, might: 1, armor: 3, speed: 13 } });
    const slow = fightOf([z], 'wolf', 1, cyclic([0.1]));
    const none = fightOf([z], 'wolf', 1, cyclic([0.5]));
    expect(lines(slow, 'hit', 'wolf').some((e) => e.text.includes('hamstrung'))).toBe(true);
    expect(lines(none, 'hit', 'wolf').some((e) => e.text.includes('hamstrung'))).toBe(false);
    // Speed 13 acts on ticks 8, 16, 24…; hamstrung, it slips behind.
    const normal = lines(none, 'hit', 'zora')
      .concat(lines(none, 'miss', 'zora'))
      .map((e) => e.tick);
    const slowed = lines(slow, 'hit', 'zora')
      .concat(lines(slow, 'miss', 'zora'))
      .map((e) => e.tick);
    expect(slowed.slice(0, 6).join()).not.toBe(normal.slice(0, 6).join());
  });

  it('draws the ability roll only after a hit (a miss draws one roll)', () => {
    const z = sponge('zora');
    const r = fightOf([z], 'wolf', 1, cyclic([0.95]));
    expect(lines(r, 'miss', 'wolf')[0]?.rolls).toEqual([0.95]);
  });

  it('refreshes rather than stacks', () => {
    const z = sponge('zora', { base: { health: 1000000, might: 1, armor: 3, speed: 13 } });
    const r = fightOf([z], 'wolf', 1, cyclic([0.1]));
    // Two attacks per action, both hamstring: still Speed × 0.7, never × 0.4.
    const own = lines(r, 'hit', 'zora')
      .concat(lines(r, 'miss', 'zora'))
      .map((e) => e.tick);
    const gaps = own.slice(1, 6).map((t, i) => t - (own[i] ?? 0));
    for (const g of gaps) expect(g).toBeLessThanOrEqual(12); // 100 / (13 × 0.7) ≈ 11
  });
});

describe('Kikimora: Spoil', () => {
  it('has no effect while no potions exist (v0.3)', () => {
    const r = fightOf([sponge('zora')], 'kikimora', 1, cyclic([0.5]));
    expect(r.log.some((e) => /potion|spoil/i.test(e.text))).toBe(false);
  });
});

describe('Upyr: Bloodfeast', () => {
  it('heals 50% of the damage it deals', () => {
    const z = snap('zora', {
      traits: [],
      base: { health: 100000, might: 20, armor: 3, speed: 13 },
    });
    const r = fightOf([z], 'upyr', 2, cyclic([0.5]), 'field');
    const feast = lines(r, 'hit', 'upyr').find((e) => e.text.includes('drinks'));
    expect(feast).toBeDefined();
    const healed = Number(/drinks, \+(\d+)/.exec(feast?.text ?? '')?.[1]);
    expect(healed).toBe(Math.floor((feast?.amount ?? 0) * 0.5 + 0.5));
  });
});

describe('Rusalka: Drowning Song', () => {
  const party = [
    sponge('halvar', { base: { ...tough, armor: 8 } }),
    sponge('zora', { base: { ...tough, armor: 3, speed: 13 } }),
  ];
  const r = fightOf(party, 'rusalka', 2, cyclic([0.5]), 'river');
  const songs = lines(r, 'ability', 'rusalka').filter((e) => e.text.includes('charmed'));

  it('on its 1st, 5th, 9th… action it charms the lowest-Armor hunter instead of attacking', () => {
    const ticks = actionTicks(12, 9);
    expect(songs.slice(0, 3).map((e) => e.tick)).toEqual([ticks[0], ticks[4], ticks[8]]);
    expect(songs[0]?.target).toBe('zora'); // Armor 3 < 8
    // No attack by the Rusalka on a song tick.
    for (const s of songs.slice(0, 3)) {
      expect(
        r.log.filter((e) => e.actor === 'rusalka' && e.tick === s.tick && e.kind !== 'ability'),
      ).toHaveLength(0);
    }
  });

  it('the charmed hunter loses their next action', () => {
    const skips = lines(r, 'skip', 'zora');
    expect(skips.length).toBeGreaterThan(0);
    expect(skips[0]?.tick).toBeGreaterThan(songs[0]?.tick ?? 0);
  });
});

describe('Poludnitsa: Noon Heat', () => {
  it('every action, every hunter loses 3% of max Health (Fire, ignoring Armor)', () => {
    const a = sponge('halvar', { base: { health: 1000, might: 1, armor: 50, speed: 7 } });
    const b = sponge('zora', { base: { health: 2000, might: 1, armor: 50, speed: 7 } });
    const r = fightOf([a, b], 'poludnitsa', 2, cyclic([0.5]), 'field');
    const first = lines(r, 'ability', 'poludnitsa').slice(0, 2);
    expect(first.map((e) => [e.target, e.amount])).toEqual([
      ['halvar', 30],
      ['zora', 60],
    ]);
  });

  it('Fire-touched cuts it by 20%', () => {
    const f = sponge('sigrun', {
      traits: ['fire-touched'],
      base: { health: 1000, might: 1, armor: 4, speed: 7 },
    });
    const r = fightOf([f], 'poludnitsa', 2, cyclic([0.5]), 'field');
    expect(lines(r, 'ability', 'poludnitsa')[0]?.amount).toBe(24);
  });
});

describe('Vodyanoy: Drag Under', () => {
  it('every 3rd action it grabs the target: they lose their next action and take ×2 from the next hit', () => {
    const r = fightOf([sponge('halvar', { base: tough })], 'vodyanoy', 3, cyclic([0.5]), 'river');
    const hits = lines(r, 'hit', 'vodyanoy');
    expect(hits[2]?.text).toContain('dragged under');
    expect(hits[0]?.amount).toBe(12); // Might 20 − Armor 8
    expect(hits[1]?.amount).toBe(12);
    expect(hits[3]?.amount).toBe(24); // ×2 from the next hit
    expect(hits[4]?.amount).toBe(12); // only the next one
    expect(lines(r, 'skip', 'halvar').length).toBeGreaterThan(0);
  });
});

describe('Draugr: Barrow-Grip and Swell', () => {
  it('Barrow-Grip: every 3rd action its attack holds the target', () => {
    const r = fightOf([sponge('halvar', { base: tough })], 'draugr', 3, cyclic([0.5]), 'barrow');
    const hits = lines(r, 'hit', 'draugr');
    expect(hits[2]?.text).toContain('held');
    expect(hits[0]?.text).not.toContain('held');
    expect(hits[1]?.text).not.toContain('held');
    expect(hits[5]?.text).toContain('held');
    expect(lines(r, 'skip', 'halvar').length).toBeGreaterThan(0);
  });

  it('Swell: below 50% Health, Armor +50%', () => {
    const z = snap('zora', {
      traits: [],
      base: { health: 1000000, might: 60, armor: 3, speed: 13 },
    });
    const r = fightOf([z], 'draugr', 3, cyclic([0.5]), 'barrow');
    // Might 60 × Steel 0.75 = 45. Armor 9 → 36; below 130 Health, Armor 13.5 → 31.5 → 32.
    expect(lines(r, 'hit', 'zora').map((e) => e.amount)).toEqual([36, 36, 36, 36, 32, 32, 32, 32]);
    expect(r.result).toBe('win');
  });
});

describe('Bies: Malice', () => {
  it('gains +5% Might after each of its actions, stacking', () => {
    const r = fightOf([sponge('halvar', { base: tough })], 'bies', 3, cyclic([0.5]), 'forest');
    const [d0 = 1, d1 = 0, d2 = 0, d3 = 0] = lines(r, 'hit', 'bies').map((e) => e.dealt ?? 0);
    expect(d1 / d0).toBeCloseTo(1.05, 10);
    expect(d2 / d0).toBeCloseTo(1.1, 10);
    expect(d3 / d0).toBeCloseTo(1.15, 10);
  });
});

describe('Leshy: Lead Astray and Root-Wall', () => {
  it('Lead Astray: a roll under 15% makes one random hunter lose their next action', () => {
    const party = [
      sponge('halvar', { base: tough }),
      sponge('zora', { base: { ...tough, speed: 13 } }),
    ];
    const hit = fightOf(party, 'leshy', 4, cyclic([0.1]), 'forest');
    const astray = lines(hit, 'ability', 'leshy').find((e) => e.text.includes('astray'));
    expect(astray?.rolls).toEqual([0.1, 0.1]); // the chance, then the pick
    expect(astray?.target).toBe('halvar'); // floor(0.1 × 2) = 0
    const miss = fightOf(party, 'leshy', 4, cyclic([0.5]), 'forest');
    expect(lines(miss, 'ability-roll', 'leshy')[0]?.rolls).toEqual([0.5]);
  });

  it('Root-Wall: regenerates 5% of max Health on each of its actions (capped at max)', () => {
    const z = snap('zora', {
      traits: [],
      base: { health: 1000000, might: 20, armor: 3, speed: 13 },
    });
    const r = fightOf([z], 'leshy', 4, cyclic([0.5]), 'forest');
    const wall = lines(r, 'ability', 'leshy').find((e) => e.text.includes('Root-Wall'));
    // Leshy tier 4 is its base tier: 320 Health. Zora's first hit: 20 × 0.75 = 15 − Armor 8 = 7.
    expect(wall?.amount).toBe(7);
  });
});

describe('Strzyga: Second Soul', () => {
  it('the first time it reaches 0 Health it rises at 40%, once per fight', () => {
    const z = snap('zora', {
      traits: [],
      base: { health: 1000000, might: 100, armor: 3, speed: 13 },
    });
    const r = fightOf([z], 'strzyga', 4, cyclic([0.5]), 'barrow');
    const rises = r.log.filter((e) => e.text.includes('rises again'));
    expect(rises).toHaveLength(1);
    expect(rises[0]?.targetHealth).toBe(96); // 40% of 240
    expect(r.result).toBe('win');
    expect(r.monsterHealth).toBe(0);
  });
});

describe('Huldra: Enthrall', () => {
  it('on its 1st action and every 4th after, the highest-Might hunter is enthralled and she heals 10%', () => {
    const party = [
      sponge('halvar', { base: { ...tough, might: 1 } }),
      sponge('zora', { base: { ...tough, might: 5, speed: 13 } }),
    ];
    const r = fightOf(party, 'huldra', 2, cyclic([0.5]), 'forest');
    const ens = lines(r, 'ability', 'huldra').filter((e) => e.text.includes('enthralls'));
    const ticks = actionTicks(12, 9);
    expect(ens.slice(0, 3).map((e) => e.tick)).toEqual([ticks[0], ticks[4], ticks[8]]);
    expect(ens[0]?.target).toBe('zora');
    expect(lines(r, 'skip', 'zora').length).toBeGreaterThan(0);
  });
});

describe('Nix: Riverhorse', () => {
  it('on its 1st action it carries off the lowest-Health hunter, who returns after 3 of its actions, 20% lighter', () => {
    const party = [
      sponge('halvar', { base: { ...tough, health: 100000 } }),
      sponge('zora', { base: { ...tough, health: 90000, speed: 13 } }),
    ];
    const r = fightOf(party, 'nix', 3, cyclic([0.5]), 'river');
    const off = lines(r, 'ability', 'nix').find((e) => e.text.includes('carries'));
    const back = lines(r, 'ability', 'nix').find((e) => e.text.includes('returned'));
    expect(off?.target).toBe('zora');
    expect(back?.target).toBe('zora');
    expect(back?.amount).toBe(18000); // 20% of 90,000
    const nixTicks = actionTicks(13, 5);
    expect(off?.tick).toBe(nixTicks[0]);
    expect(back?.tick).toBe(nixTicks[4]); // after its 2nd, 3rd and 4th actions
    // Zora does nothing while away, and the Nix can only target Halvar (no target roll).
    const away = r.log.filter(
      (e) => e.actor === 'zora' && e.tick > (off?.tick ?? 0) && e.tick < (back?.tick ?? 0),
    );
    expect(away).toHaveLength(0);
    const nixHits = lines(r, 'hit', 'nix').filter(
      (e) => e.tick > (off?.tick ?? 0) && e.tick < (back?.tick ?? 0),
    );
    expect(nixHits.length).toBeGreaterThan(0);
    for (const h of nixHits) {
      expect(h.target).toBe('halvar');
      expect(h.rolls).toHaveLength(3);
    }
  });
});
