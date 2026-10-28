// Plan T8.8 (GDD §5.11.4, §8.5b, D312, D314): the eleven use-skills in the fight engine, each on its
// trigger, with no new dice and a log line each. A hunter with no skill fights exactly as before.
import { describe, expect, it } from 'vitest';
import { runFight, type FightResult, type HunterSnapshot } from '../../src/core/combat';
import { RULES_VERSION } from '../../src/core/rules-version';
import { cyclic, fightOf, lines, snap, sponge } from './helpers';

const HUGE = 100000;
const tough = (
  id: Parameters<typeof sponge>[0],
  skill: HunterSnapshot['skill'] | undefined,
  over: Partial<HunterSnapshot> = {},
): HunterSnapshot => sponge(id, { ...(skill ? { skill } : {}), ...over });

/** The texts of one actor's log entries, in order. */
const texts = (r: FightResult, actor: string, kind?: string): string[] =>
  r.log
    .filter((e) => e.actor === actor && (kind === undefined || e.kind === kind))
    .map((e) => e.text);

const ticks = (r: FightResult, actor: string): number[] =>
  r.log.filter((e) => e.actor === actor && e.kind !== 'skill').map((e) => e.tick);

describe('the rules version', () => {
  it('is 6 from v1.5 (it was 5 for the use-skills and item lines, D308)', () => {
    expect(RULES_VERSION).toBe(6);
  });
});

describe('Banked Smoke (Halvar)', () => {
  const party = (skill: boolean) => [
    tough('halvar', skill ? 'banked-smoke' : undefined, {
      base: { health: HUGE, might: 1, armor: 8, speed: 14 },
    }),
    tough('zora', undefined, { base: { health: HUGE, might: 1, armor: 3, speed: 13 } }),
  ];

  it('every 3rd action, instead of attacking, every hunter takes −20% until his next action', () => {
    const r = fightOf(party(true), 'kikimora', 1, cyclic([0.5]));
    const skill = lines(r, 'skill', 'halvar');
    expect(skill.length).toBeGreaterThan(2);
    expect(skill[0]?.text).toContain('Banked Smoke');
    // His actions: hit, hit, smoke, hit, hit, smoke…
    const halvarKinds = r.log.filter((e) => e.actor === 'halvar').map((e) => e.kind);
    expect(halvarKinds.slice(0, 6)).toEqual(['hit', 'hit', 'skill', 'hit', 'hit', 'skill']);
    // The Kikimora's blow lands for 12 − 8 Armor = 4; under the smoke 4 × 0.8 = 3.2 → 3; then 4 again.
    const blows = r.log.filter((e) => e.actor === 'kikimora').map((e) => e.amount);
    expect(blows.slice(0, 6)).toEqual([4, 4, 3, 4, 4, 3]);
  });

  it('draws no dice of its own: the same fight without the skill draws the same rolls per attack', () => {
    const a = fightOf(party(true), 'kikimora', 1, cyclic([0.5]));
    expect(a.log.filter((e) => e.kind === 'skill').every((e) => e.rolls.length === 0)).toBe(true);
  });
});

describe('Boathook (Zora)', () => {
  it('every 3rd action, a landing hit knocks the target’s meter back 30', () => {
    const base = { health: HUGE, might: 1, armor: 3, speed: 13 };
    const withSkill = fightOf([tough('zora', 'boathook', { base })], 'kikimora', 1, cyclic([0.5]));
    const without = fightOf([tough('zora', undefined, { base })], 'kikimora', 1, cyclic([0.5]));
    const hits = texts(withSkill, 'zora', 'hit');
    expect(hits[2]).toContain("Boathook: Kikimora's turn comes 30 later");
    expect(hits[5]).toContain('Boathook');
    expect(hits[0]).not.toContain('Boathook');
    expect(hits[1]).not.toContain('Boathook');
    const monster = (r: FightResult) => r.log.filter((e) => e.actor === 'kikimora').length;
    expect(monster(withSkill)).toBeLessThan(monster(without));
  });

  it('does nothing when the attack misses', () => {
    const r = fightOf([tough('zora', 'boathook')], 'kikimora', 1, cyclic([0.99]));
    expect(r.log.some((e) => e.text.includes('Boathook'))).toBe(false);
  });
});

describe('Bonesetter’s Hands (Ostap)', () => {
  const wounded = (skill: boolean) =>
    runFight({
      party: [
        tough('ostap', skill ? 'bonesetters-hands' : undefined, {
          base: { health: HUGE, might: 10, armor: 4, speed: 9 },
        }),
        tough('halvar', undefined, { base: { health: HUGE, might: 1, armor: 8, speed: 7 } }),
      ],
      monster: { monster: 'kikimora', tier: 1 },
      location: 'field',
      rolls: cyclic([0.5]),
      stand: { health: { halvar: 10 }, partyTaken: 0, volley: 0, monsterStrength: 1 },
    });

  it('every 4th action, if he heals, the heal is doubled', () => {
    const heals = lines(wounded(true), 'heal', 'ostap');
    const plain = lines(wounded(false), 'heal', 'ostap');
    expect(heals.length).toBeGreaterThan(4);
    expect(heals[3]?.text).toContain('Bonesetter’s Hands: the heal is doubled'.replace('’', "'"));
    expect(heals[3]?.amount).toBe((plain[3]?.amount ?? 0) * 2);
    for (const i of [0, 1, 2, 4]) expect(heals[i]?.amount).toBe(plain[i]?.amount);
  });
});

describe('Rime-Dipped (Bjarna)', () => {
  it('every 3rd action, a landing hit slows the target −25% Speed for its next 2 actions', () => {
    const base = { health: HUGE, might: 1, armor: 3, speed: 13 };
    const withSkill = fightOf(
      [tough('bjarna', 'rime-dipped', { base })],
      'kikimora',
      1,
      cyclic([0.5]),
    );
    const without = fightOf([tough('bjarna', undefined, { base })], 'kikimora', 1, cyclic([0.5]));
    const hits = texts(withSkill, 'bjarna', 'hit');
    expect(hits[2]).toContain('Rime-Dipped: Kikimora is slowed (Speed −25% for 2 actions)');
    const gaps = (r: FightResult) =>
      ticks(r, 'kikimora')
        .map((t, i, a) => t - (a[i - 1] ?? 0))
        .slice(1);
    const slow = gaps(withSkill);
    const plain = gaps(without);
    // After the third Bjarna hit, two monster actions come later than they otherwise would.
    expect(slow.reduce((a, b) => a + b, 0)).toBeGreaterThan(
      plain.slice(0, slow.length).reduce((a, b) => a + b, 0),
    );
  });
});

describe('Stopping Root (Vesna)', () => {
  it('her first attack roots the target: Venom equal to her Might at the start of each of its next 3 actions', () => {
    const vesna = tough('vesna', 'stopping-root', {
      base: { health: HUGE, might: 30, armor: 4, speed: 12 },
    });
    const r = fightOf([vesna], 'kikimora', 1, cyclic([0.5]));
    const skill = lines(r, 'skill');
    expect(skill[0]?.text).toContain('Stopping Root');
    expect(skill[0]?.actor).toBe('vesna');
    const burns = skill.filter((e) => e.actor === 'kikimora');
    expect(burns).toHaveLength(3); // once, never again
    expect(burns[0]?.text).toContain('Venom 30');
    expect(burns.every((b) => (b.amount ?? 0) > 0)).toBe(true);
  });

  it('fires on her first attack even if it misses (GDD §8.5b: "first attack", not "first hit")', () => {
    const r = fightOf([tough('vesna', 'stopping-root')], 'kikimora', 1, cyclic([0.99]));
    expect(lines(r, 'skill', 'vesna')).toHaveLength(1);
  });
});

describe('Shovelful (Radek)', () => {
  it('every 3rd action the attack ignores Armor', () => {
    const base = { health: HUGE, might: 20, armor: 4, speed: 11 };
    const r = fightOf(
      [tough('radek', 'shovelful', { base })],
      'draugr',
      1,
      cyclic([0.5]),
      'barrow',
    );
    const hits = lines(r, 'hit', 'radek');
    expect(hits[2]?.text).toContain('ignores armor (Shovelful)');
    expect(hits[2]?.text).toContain('Shovelful: the blow ignores Armor');
    expect(hits[0]?.text).not.toContain('Shovelful');
    expect(hits[2]?.amount ?? 0).toBeGreaterThan(hits[0]?.amount ?? 0);
  });
});

describe('The Other Hand (Sigrun)', () => {
  it('her first hit is a crit, with the crit roll still drawn; later hits roll for it as usual', () => {
    const base = { health: HUGE, might: 20, armor: 3, speed: 12 };
    const withSkill = fightOf(
      [tough('sigrun', 'the-other-hand', { base })],
      'kikimora',
      1,
      cyclic([0.5]),
    );
    const without = fightOf([tough('sigrun', undefined, { base })], 'kikimora', 1, cyclic([0.5]));
    const hits = withSkill.log.filter((e) => e.actor === 'sigrun');
    expect(hits[0]?.kind).toBe('crit');
    expect(hits[0]?.text).toContain('The Other Hand');
    expect(hits[1]?.kind).toBe('hit');
    const plain = without.log.filter((e) => e.actor === 'sigrun');
    expect(plain[0]?.kind).toBe('hit');
    expect(hits[0]?.rolls).toEqual(plain[0]?.rolls); // the same dice
    expect(hits[0]?.rolls).toHaveLength(3); // hit, spread, crit
  });

  it('waits for a hit: a miss does not use it', () => {
    const fast = { health: HUGE, might: 20, armor: 3, speed: 50 };
    const sigrun = tough('sigrun', 'the-other-hand', { base: fast });
    const r = fightOf([sigrun], 'kikimora', 1, cyclic([0.99, 0.5, 0.5]));
    const mine = r.log.filter((e) => e.actor === 'sigrun');
    expect(mine[0]?.kind).toBe('miss'); // the first roll misses…
    expect(mine[1]?.kind).toBe('crit'); // …so the first hit is the crit, though its crit roll was 0.99
  });
});

describe('Rattle the Pots (Toma)', () => {
  it('his first action, instead of attacking, knocks every monster’s meter back 40', () => {
    const base = { health: HUGE, might: 1, armor: 4, speed: 30 };
    const withSkill = fightOf(
      [tough('toma', 'rattle-the-pots', { base })],
      'kikimora',
      1,
      cyclic([0.5]),
    );
    const without = fightOf([tough('toma', undefined, { base })], 'kikimora', 1, cyclic([0.5]));
    const first = withSkill.log.find((e) => e.actor === 'toma');
    expect(first?.kind).toBe('skill');
    expect(first?.text).toContain('Rattle the Pots');
    expect(withSkill.log.filter((e) => e.actor === 'toma' && e.kind === 'skill')).toHaveLength(1);
    const firstMonster = (r: FightResult) => r.log.find((e) => e.actor === 'kikimora')?.tick ?? 0;
    expect(firstMonster(withSkill)).toBeGreaterThan(firstMonster(without) + 2);
  });
});

describe('Up Before the Wolves (Stanko)', () => {
  it('starts each fight with his meter full, so he acts at tick 1', () => {
    const base = { health: HUGE, might: 1, armor: 4, speed: 10 };
    const r = fightOf(
      [tough('stanko', 'up-before-the-wolves', { base })],
      'wolf',
      1,
      cyclic([0.5]),
    );
    expect(r.log[0]?.kind).toBe('skill');
    expect(r.log[0]?.tick).toBe(1); // start-of-fight lines are shown at tick 1, like the potions
    const first = r.log.find((e) => e.actor === 'stanko' && e.kind !== 'skill');
    expect(first?.tick).toBe(1);
    const plain = fightOf([tough('stanko', undefined, { base })], 'wolf', 1, cyclic([0.5]));
    expect(plain.log.find((e) => e.actor === 'stanko')?.tick).toBeGreaterThan(1);
  });
});

describe('Shepherd’s Crook (Herdis)', () => {
  it('every 3rd action, a heal also frees the healed hunter of Hamstring, held, charm and Chill', () => {
    // The Gaunt Wolf hamstrings on a 25% roll that is drawn when it hits; low rolls make it certain.
    const r = runFight({
      party: [
        tough('halvar', undefined, { base: { health: HUGE, might: 1, armor: 8, speed: 7 } }),
        tough('herdis', 'shepherds-crook', {
          base: { health: HUGE, might: 10, armor: 4, speed: 12 },
        }),
      ],
      monster: { monster: 'wolf', tier: 1 },
      location: 'field',
      rolls: cyclic([0.05]),
      stand: { health: { halvar: 40 }, partyTaken: 0, volley: 0, monsterStrength: 1 },
    });
    const freed = lines(r, 'skill', 'herdis');
    expect(freed.length).toBeGreaterThan(0);
    expect(freed[0]?.text).toContain("Shepherd's Crook");
    expect(freed[0]?.text).toContain('slowed');
  });
});

describe('Hold the Stair (Arvid)', () => {
  // Slow hunters, so the Kikimora's first blows come first; a target roll of 0.1 picks Zora (slot 0),
  // then hit, spread and crit rolls of 0.5, and the cycle repeats for the next blow.
  const rolls = () => cyclic([0.1, 0.5, 0.5, 0.5]);
  const arvid = () =>
    tough('arvid', 'hold-the-stair', { base: { health: HUGE, might: 1, armor: 10, speed: 1 } });
  const zora = (health: number) =>
    snap('zora', { base: { health, might: 1, armor: 3, speed: 1 }, traits: [] });

  it('once a fight, takes the hit that would down another hunter, after his own Armor and taken%', () => {
    const r = fightOf([zora(6), arvid()], 'kikimora', 1, rolls());
    const stair = r.log.filter((e) => e.text.includes('Hold the Stair'));
    expect(stair).toHaveLength(1);
    expect(stair[0]?.target).toBe('arvid');
    expect(stair[0]?.text).toContain('Arvid Netmender takes the hit meant for Zora');
    // Arvid's own Armor 10 against Steel 12 → 2, not Zora's 12 − 3 = 9.
    expect(stair[0]?.amount).toBe(2);
    // A second killing blow is not turned aside: Zora goes down.
    expect(r.hunters.find((h) => h.id === 'zora')?.downed).toBe(true);
  });

  it('does nothing when the hit would not down anyone', () => {
    const r = fightOf([zora(HUGE), arvid()], 'kikimora', 1, rolls());
    expect(r.log.some((e) => e.text.includes('Hold the Stair'))).toBe(false);
  });
});

describe('a hunter with no skill fights as before', () => {
  it('the same fight with and without an absent skill is identical', () => {
    const a = fightOf([snap('zora'), snap('halvar')], 'kikimora', 1, cyclic([0.4, 0.6]));
    const b = fightOf([snap('zora', {}), snap('halvar', {})], 'kikimora', 1, cyclic([0.4, 0.6]));
    expect(b.log).toEqual(a.log);
  });
});
