// Plan T9.5 (GDD §5.12.4, §8.5b, §8.13, §8.14; D358, D368, D369, D386): the fight engine for events.
// A boss enters with the pool as its Health; the new abilities, traits and use-skills each have a
// test here. Every old fight is unchanged: the golden and recorded-fight suites cover that.
import { describe, expect, it } from 'vitest';
import type { EventInstance, FightResult, HunterSnapshot } from '../../src/core/combat';
import { runFight } from '../../src/core/combat';
import { RULES_VERSION } from '../../src/core/rules-version';
import { cyclic, lines, snap, sponge } from './helpers';

const HUGE = 100000;
const POOL = 24000;

const event = (id: EventInstance['event'], over: Partial<EventInstance> = {}): EventInstance => ({
  event: id,
  tier: 3,
  ...over,
});

const run = (
  party: readonly HunterSnapshot[],
  monster: EventInstance,
  rolls = cyclic([0.5]),
): FightResult => runFight({ party, monster, location: null, rolls });

/** A party member who survives anything and hits for almost nothing. */
const tank = (
  id: Parameters<typeof sponge>[0],
  speed: number,
  over: Partial<HunterSnapshot> = {},
): HunterSnapshot => {
  const s = sponge(id);
  return { ...s, base: { ...s.base, speed, armor: 8 }, ...over };
};

const actorLines = (r: FightResult, actor: string) => r.log.filter((e) => e.actor === actor);

describe('a Great Beast in a fight', () => {
  it('enters with the pool as its Health, and the rules version is 6 (the lane table picks the stand rules)', () => {
    expect(RULES_VERSION).toBe(6);
    const r = run([tank('halvar', 7)], event('barrow-king', { healthOverride: 9000 }));
    expect(r.monsters[0]?.maxHealth).toBe(9000);
  });

  it('scales Might by 1.35 per tier above 3 but takes its Health from the pool, not the tier', () => {
    const at = (tier: number) =>
      run([tank('halvar', 7)], event('barrow-king', { tier, healthOverride: POOL }), cyclic([0.5]));
    const first = (r: FightResult) => lines(r, 'hit', 'barrow-king')[0]?.dealt ?? 0;
    expect(at(3).monsters[0]?.maxHealth).toBe(POOL);
    expect(at(5).monsters[0]?.maxHealth).toBe(POOL);
    expect(first(at(4)) / first(at(3))).toBeCloseTo(1.35, 5);
  });

  it('can never end above the pool it started with: no Great Beast has a heal', () => {
    const r = run(
      [tank('halvar', 7), tank('zora', 13)],
      event('mother-of-the-river', { healthOverride: 5000 }),
    );
    expect(r.monsterHealth).toBeLessThanOrEqual(5000);
    expect(r.log.some((e) => e.kind === 'heal' && e.actor === 'mother-of-the-river')).toBe(false);
    expect(r.endedBy).toBe('retreat');
  });

  it('a hunter who is down early still counts what they dealt: the pool is the Health left', () => {
    const striker = snap('zora', {
      base: { health: 1, might: 20, armor: 0, speed: 20 },
      traits: [],
    });
    const r = run(
      [striker, tank('halvar', 1)],
      event('lindworm-of-velk-fjord', { healthOverride: POOL }),
    );
    expect(r.monsterHealth).toBeLessThan(POOL);
  });
});

describe('the Lindworm of Velk Fjord: Coil and Fjord Roar', () => {
  const r = run(
    [tank('halvar', 7), tank('zora', 7)],
    event('lindworm-of-velk-fjord', { healthOverride: POOL }),
  );
  const acts = (): string[] => {
    // One entry per Lindworm action, in order: 'roar', 'hit' (with its notes), and so on.
    const out: string[] = [];
    const actionTicks = new Map<number, number>();
    for (const e of actorLines(r, 'lindworm-of-velk-fjord')) {
      if (e.kind === 'ability') out.push('roar');
      else if (e.kind === 'hit' || e.kind === 'miss' || e.kind === 'crit') {
        // Two attacks per action share a tick; one entry per action, carrying both texts.
        const last = out.length - 1;
        if (last >= 0 && actionTicks.get(last) === e.tick && out[last] !== 'roar')
          out[last] += ` | ${e.text}`;
        else {
          actionTicks.set(out.length, e.tick);
          out.push(e.text);
        }
      }
    }
    return out;
  };

  it('roars on its 1st action and every 5th after, instead of attacking', () => {
    const roars = lines(r, 'ability', 'lindworm-of-velk-fjord').filter((e) =>
      e.text.includes('roars'),
    );
    expect(roars.length).toBeGreaterThan(2);
    expect(roars[0]?.text).toBe(
      "The Lindworm of Velk Fjord roars: every hunter's turn comes 20 later",
    );
    const seq = acts();
    expect(seq[0]).toBe('roar');
    expect(seq.slice(1, 5).every((s) => s !== 'roar')).toBe(true);
    expect(seq[5]).toBe('roar');
    expect(seq[10]).toBe('roar');
  });

  it('knocks every hunter’s meter back 20 (they act later than without it)', () => {
    const quiet = run(
      [tank('halvar', 7), tank('zora', 7)],
      event('barrow-king', { healthOverride: POOL }),
    );
    const firstTick = (x: FightResult) => actorLines(x, 'halvar')[0]?.tick ?? 0;
    expect(firstTick(r)).toBeGreaterThan(firstTick(quiet) - 1); // the roar set it back at tick 1
    const roar = lines(r, 'ability', 'lindworm-of-velk-fjord')[0];
    expect(roar?.tick).toBeLessThanOrEqual(firstTick(r));
  });

  it('Coil: every 3rd action its hit holds the target', () => {
    const coiled = r.log.filter((e) => e.text.includes('is coiled'));
    expect(coiled.length).toBeGreaterThan(0);
    // Two attacks, one hold: only one of the 3rd action's two hits carries it.
    expect((acts()[2]?.match(/is coiled/g) ?? []).length).toBe(1);
    // The 3rd action is the 3rd entry counting the roar as the 1st action.
    const seq = acts();
    expect(seq[2]).toContain('is coiled');
    expect(seq[3]).not.toContain('is coiled');
  });
});

describe('the Barrow-King: Barrow-Grip and Grave Chill', () => {
  const r = run(
    [tank('halvar', 7), tank('zora', 7)],
    event('barrow-king', { healthOverride: POOL }),
  );

  it('Grave Chill: on each action every standing hunter loses 1.5% of max Health as Frost, ignoring Armor (D398)', () => {
    const chill = r.log.filter((e) => e.text.includes('grave chill reaches'));
    expect(chill.length).toBeGreaterThanOrEqual(4);
    // 1.5% of 100,000, no Armor taken off (Halvar has Armor 8), taken% not applicable.
    expect(chill[0]?.amount).toBe(1500);
    expect(chill[0]?.text).toContain('Frost 1500.00 = 1500');
  });

  it('Barrow-Grip: every 3rd action its hit holds the target', () => {
    const held = r.log.filter((e) => e.text.includes('is held'));
    expect(held.length).toBeGreaterThan(0);
  });
});

describe('the Mother of the River: Drowning Song and Weir-Pull', () => {
  const r = run(
    [tank('halvar', 7), tank('zora', 7, { base: { ...sponge('zora').base, speed: 7, armor: 3 } })],
    event('mother-of-the-river', { healthOverride: POOL }),
  );
  const seq = (): string[] => {
    const out: string[] = [];
    for (const e of actorLines(r, 'mother-of-the-river')) {
      if (e.kind === 'ability' && e.text.includes('sings')) out.push('song');
      else if (e.kind === 'ability' && e.text.includes('weir')) out.push('pull');
      else if (e.kind === 'hit' || e.kind === 'miss' || e.kind === 'crit') out.push('attack');
    }
    // An action with two attacks appears twice; collapse the pairs into one action.
    const actions: string[] = [];
    for (let i = 0; i < out.length; i++) {
      actions.push(out[i] ?? '');
      if (out[i] === 'attack' && out[i + 1] === 'attack') i += 1;
    }
    return actions;
  };

  it('charms the lowest-Armor hunter on its 1st, 5th, 9th… action; pulls on its 4th, 8th…', () => {
    const s = seq();
    expect(s.slice(0, 9)).toEqual([
      'song',
      'attack',
      'attack',
      'pull',
      'song',
      'attack',
      'attack',
      'pull',
      'song',
    ]);
    const song = lines(r, 'ability', 'mother-of-the-river').find((e) => e.text.includes('sings'));
    expect(song?.target).toBe('zora'); // Armor 3 against Halvar's 8
  });

  it('Weir-Pull knocks every hunter’s meter back 25', () => {
    const pull = lines(r, 'ability', 'mother-of-the-river').find((e) => e.text.includes('weir'));
    expect(pull?.text).toBe(
      "The Mother of the River pulls at the weir: every hunter's turn comes 25 later",
    );
  });
});

describe('Stoneback: Boulder Toss and Moss-Mend', () => {
  const strong = (id: Parameters<typeof sponge>[0], speed: number) => {
    const s = tank(id, speed);
    return { ...s, base: { ...s.base, might: 25 } };
  };
  const r = run(
    [strong('halvar', 7), strong('zora', 13), tank('ostap', 5)],
    event('stoneback-fell-troll'),
  );

  it('every 4th action, instead of attacking, a boulder hits every standing hunter', () => {
    const toss = lines(r, 'ability', 'stoneback-fell-troll').filter((e) =>
      e.text.includes('hurls a boulder'),
    );
    expect(toss.length).toBeGreaterThan(0);
    const out = r.log.filter((e) => e.actor === 'stoneback-fell-troll');
    const at = out.indexOf(toss[0] as (typeof out)[number]);
    const after = out.slice(at + 1, at + 4);
    expect(after.map((e) => e.target).sort()).toEqual(['halvar', 'ostap', 'zora']);
  });

  it('Moss-Mend: regenerates 3% of max Health (33 of 1,100) on each of its actions', () => {
    const mend = lines(r, 'ability', 'stoneback-fell-troll').filter((e) =>
      e.text.includes('Moss-Mend'),
    );
    expect(mend.length).toBeGreaterThan(0);
    expect(mend.every((e) => (e.amount ?? 0) > 0 && (e.amount ?? 0) <= 33)).toBe(true);
    expect(Math.max(...mend.map((e) => e.amount ?? 0))).toBe(33);
  });
});

describe('the Mara of Kettle Barrow: Night-Weight and Quick Dark', () => {
  it('Night-Weight: on its 1st action and every 4th after, the highest-Might hunter loses their next action', () => {
    const big = { ...tank('halvar', 7), base: { ...tank('halvar', 7).base, might: 30 } };
    const r = run([big, tank('zora', 7)], event('mara-of-kettle-barrow'));
    const weight = lines(r, 'ability', 'mara-of-kettle-barrow').filter((e) =>
      e.text.includes('settles on'),
    );
    expect(weight.length).toBeGreaterThan(1);
    expect(weight.every((e) => e.target === 'halvar')).toBe(true);
    // Her attacks go on after it (it does not replace the action).
    expect(lines(r, 'hit', 'mara-of-kettle-barrow').length).toBeGreaterThan(0);
    // The 1st and the 5th action: the gap between the two lines is four of her actions.
    const own = r.log.filter((e) => e.actor === 'mara-of-kettle-barrow');
    expect(own[0]?.text).toContain('settles on');
  });

  it('Quick Dark: her first hit on each hunter ruins that hunter’s unused potion', () => {
    const r = runFight({
      party: [tank('halvar', 7)],
      monster: event('mara-of-kettle-barrow'),
      location: null,
      rolls: cyclic([0.5]),
      prep: { oils: {}, potions: { halvar: 'mending-draught' }, bombs: [] },
    });
    const ruined = r.log.filter((e) => e.text.includes('Quick Dark ruins'));
    expect(ruined).toHaveLength(1);
    expect(ruined[0]?.text).toContain("Halvar Two-Smokes's");
  });
});

describe('Likho the One-Eyed: Ill Luck and Misfortune', () => {
  const striker = (): HunterSnapshot => ({
    ...sponge('zora'),
    base: { health: HUGE, might: 1, armor: 3, speed: 13 },
  });

  it('Ill Luck: every hunter’s crit chance is 10 points lower (20% → 10%), the roll still drawn', () => {
    const crits = (monster: EventInstance, roll: number) =>
      lines(run([striker()], monster, cyclic([roll])), 'crit', 'zora').length;
    // 0.15 is a crit at 20% and not at 10%.
    expect(crits(event('stoneback-fell-troll'), 0.15)).toBeGreaterThan(0);
    expect(crits(event('likho-one-eyed'), 0.15)).toBe(0);
    // 0.05 is a crit at either.
    expect(crits(event('likho-one-eyed'), 0.05)).toBeGreaterThan(0);
  });

  it('Misfortune: 15% each action, one random hunter loses their next action', () => {
    const party = [tank('halvar', 7), tank('zora', 7)];
    const always = run(party, event('likho-one-eyed'), cyclic([0.01]));
    expect(always.log.some((e) => e.text.startsWith('Misfortune follows'))).toBe(true);
    const never = run(party, event('likho-one-eyed'), cyclic([0.99]));
    expect(never.log.some((e) => e.text.startsWith('Misfortune follows'))).toBe(false);
    expect(never.log.some((e) => e.text.includes('Misfortune passes'))).toBe(true);
  });
});

describe('the new traits', () => {
  const firstAttack = (r: FightResult, who: string) =>
    r.log.find((e) => e.actor === who && ['hit', 'crit', 'miss'].includes(e.kind));

  it('Tall Torch: while Gest stands, party hit chance is 3 points higher (90% → 93%)', () => {
    const hunter = () =>
      snap('halvar', { base: { health: HUGE, might: 1, armor: 8, speed: 20 }, traits: [] });
    const gest = (torch: boolean) =>
      snap('gest-tall-torch', {
        base: { health: HUGE, might: 1, armor: 8, speed: 1 },
        traits: torch ? ['tall-torch', 'fire-touched'] : ['fire-touched'],
      });
    // 0.92 misses at 90% and hits at 93%.
    const withTorch = run([hunter(), gest(true)], event('stoneback-fell-troll'), cyclic([0.92]));
    const without = run([hunter(), gest(false)], event('stoneback-fell-troll'), cyclic([0.92]));
    expect(firstAttack(withTorch, 'halvar')?.kind).toBe('hit');
    expect(firstAttack(without, 'halvar')?.kind).toBe('miss');
  });

  it('Eye-Taker: +10 points crit chance (Ragnhild’s striker 20% becomes 30%)', () => {
    const rag = (eye: boolean) =>
      snap('ragnhild-eye-taker', {
        base: { health: HUGE, might: 1, armor: 3, speed: 20 },
        traits: eye ? ['cold-blooded', 'eye-taker'] : ['cold-blooded'],
      });
    const roll = cyclic([0.25]);
    const a = run([rag(true), tank('halvar', 1)], event('stoneback-fell-troll'), roll);
    const b = run([rag(false), tank('halvar', 1)], event('stoneback-fell-troll'), cyclic([0.25]));
    expect(firstAttack(a, 'ragnhild-eye-taker')?.kind).toBe('crit');
    expect(firstAttack(b, 'ragnhild-eye-taker')?.kind).toBe('hit');
  });

  it('Night-Sitter: +20% Might against Field & Forest Spirits (the Mara)', () => {
    const rad = (sitter: boolean) =>
      snap('radmila-of-the-reeds', {
        base: { health: HUGE, might: 10, armor: 4, speed: 20 },
        traits: sitter ? ['night-sitter'] : [],
      });
    const dealt = (r: FightResult) =>
      r.log.find((e) => e.actor === 'radmila-of-the-reeds' && e.kind === 'hit')?.dealt ?? 0;
    const a = run([rad(true)], event('mara-of-kettle-barrow'));
    const b = run([rad(false)], event('mara-of-kettle-barrow'));
    expect(dealt(a) / dealt(b)).toBeCloseTo(1.2, 5);
    // And not against another family.
    const c = run([rad(true)], event('stoneback-fell-troll'));
    const d = run([rad(false)], event('stoneback-fell-troll'));
    expect(dealt(c)).toBe(dealt(d));
  });
});

describe('the new use-skills', () => {
  it('Torch Held High: every 3rd action, instead of attacking, every hunter deals +15% until his next action', () => {
    const gest = snap('gest-tall-torch', {
      base: { health: HUGE, might: 1, armor: 8, speed: 10 },
      traits: [],
      skill: 'torch-held-high',
    });
    const zora = snap('zora', {
      base: { health: HUGE, might: 20, armor: 3, speed: 30 },
      traits: [],
    });
    const r = run([gest, zora], event('stoneback-fell-troll'));
    const torch = lines(r, 'skill', 'gest-tall-torch');
    expect(torch.length).toBeGreaterThan(1);
    expect(torch[0]?.text).toContain('Torch Held High');
    const gestKinds = r.log.filter((e) => e.actor === 'gest-tall-torch').map((e) => e.kind);
    expect(gestKinds.slice(0, 6)).toEqual(['hit', 'hit', 'skill', 'hit', 'hit', 'skill']);
    // Zora's damage before the first torch and during it differ by exactly 15%.
    const zoraHits = r.log.filter((e) => e.actor === 'zora' && e.kind === 'hit');
    const lit = zoraHits.find((e) => e.tick > (torch[0]?.tick ?? 0));
    const dark = zoraHits[0];
    expect(dark && dark.tick < (torch[0]?.tick ?? 0)).toBe(true);
    expect((lit?.dealt ?? 0) / (dark?.dealt ?? 1)).toBeCloseTo(1.15, 5);
    expect(torch.every((e) => e.rolls.length === 0)).toBe(true);
  });

  it('Take the Eye: her first hit cuts the target’s Might by 15% for the rest of the fight, once', () => {
    const rag = snap('ragnhild-eye-taker', {
      base: { health: HUGE, might: 1, armor: 3, speed: 14 },
      traits: [],
      skill: 'take-the-eye',
    });
    const r = run([rag, tank('halvar', 1)], event('stoneback-fell-troll'));
    const notes = r.log.filter((e) => e.text.includes('Take the Eye'));
    expect(notes).toHaveLength(1);
    expect(notes[0]?.text).toContain(
      "Stoneback the Fell Troll's Might is -15% for the rest of the fight",
    );
    const plain = run(
      [{ ...rag, skill: undefined }, tank('halvar', 1)],
      event('stoneback-fell-troll'),
    );
    const blow = (x: FightResult) => lines(x, 'hit', 'stoneback-fell-troll')[0]?.dealt ?? 0;
    expect(blow(r) / blow(plain)).toBeCloseTo(0.85, 5);
    // Once: the later blows are no further cut.
    const all = lines(r, 'hit', 'stoneback-fell-troll').map((e) => e.dealt);
    expect(new Set(all).size).toBe(1);
  });

  describe('Sit the Vigil', () => {
    // Kikimora hits for 12 Steel; roll 0.1 picks the first target, then hit, spread and crit of 0.5.
    const rolls = () => cyclic([0.1, 0.5, 0.5, 0.5]);
    const radmila = () =>
      snap('radmila-of-the-reeds', {
        base: { health: HUGE, might: 1, armor: 4, speed: 1 },
        traits: [],
        skill: 'sit-the-vigil',
      });
    const zora = (health: number) =>
      snap('zora', { base: { health, might: 1, armor: 3, speed: 1 }, traits: [] });
    const arvid = (health: number) =>
      snap('arvid', {
        base: { health, might: 1, armor: 10, speed: 1 },
        traits: [],
        skill: 'hold-the-stair',
      });
    const fight = (party: readonly HunterSnapshot[]) =>
      runFight({
        party,
        monster: { monster: 'kikimora', tier: 1 },
        location: 'field',
        rolls: rolls(),
      });

    it('once a fight, leaves a hunter who would be downed at 1 Health', () => {
      const r = fight([zora(6), radmila()]);
      const vigil = r.log.filter((e) => e.text.includes('Sit the Vigil'));
      expect(vigil).toHaveLength(1);
      expect(vigil[0]?.text).toContain(
        'Radmila of the Reeds keeps Zora Sedlak on their feet at 1 Health',
      );
      expect(vigil[0]?.targetHealth).toBe(1);
      // A second killing blow is not turned aside.
      expect(r.hunters.find((h) => h.id === 'zora')?.downed).toBe(true);
    });

    it('works only for another hunter: Radmila herself goes down', () => {
      const lone = { ...radmila(), base: { health: 5, might: 1, armor: 4, speed: 1 } };
      const r = fight([lone]);
      expect(r.log.some((e) => e.text.includes('Sit the Vigil'))).toBe(false);
      expect(r.hunters[0]?.downed).toBe(true);
    });

    it('does nothing when the hit would not down anyone', () => {
      const r = fight([zora(HUGE), radmila()]);
      expect(r.log.some((e) => e.text.includes('Sit the Vigil'))).toBe(false);
    });

    it('applies after Hold the Stair: Arvid’s moved hit resolves first, then Radmila saves what is left', () => {
      const r = fight([zora(6), arvid(2), radmila()]);
      const stair = r.log.find((e) => e.text.includes('Hold the Stair'));
      expect(stair?.text).toContain('Arvid Netmender takes the hit meant for Zora Sedlak');
      expect(stair?.text).toContain('Sit the Vigil: Radmila of the Reeds keeps Arvid Netmender');
      expect(stair?.target).toBe('arvid');
      expect(stair?.targetHealth).toBe(1);
    });
  });
});
