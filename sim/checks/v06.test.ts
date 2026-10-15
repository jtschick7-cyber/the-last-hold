// GDD §6.2 v0.6 (D216): how the discovery, skill and arc checks judge made-up runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import { act3Check } from './story-acts';
import {
  arvidLetterCheck,
  firstNewBrewCheck,
  recipeBookCheck,
  skillsPaceCheck,
  skillsStartCheck,
  trustArcCheck,
} from './v06';

interface Made {
  discovery?: RunResult['discovery'];
  letters?: RunResult['story']['letters'];
  documents?: RunResult['story']['documents'];
  trust?: RunResult['story']['trust'];
  start?: 'mon' | 'sat';
  seed?: string;
}

const run = (m: Made = {}): RunResult =>
  ({
    spec: { policy: 'standard', seed: m.seed ?? 'a', start: m.start ?? 'mon', days: 14 },
    story: {
      documents: m.documents ?? [],
      names: [],
      letters: m.letters ?? [],
      bands: [],
      trust: m.trust ?? [],
      trustRoseInCycle1: 0,
    },
    discovery: m.discovery ?? { hutHours: null, firstNewBrewHours: null, cycles: [] },
    delve: {
      runs: [],
      riftglassHeld: 0,
      lateHours: 0,
      chosenStart: false,
      reroll: false,
      relics: [],
      totalHours: 0,
    },
    content: { book36Hours: null, skills4Hours: null, wrightsHours: null },
    depth: { cycles: [], legendaries: [], delveXp: 0 },
  }) as unknown as RunResult;

const skills = (a: number, s: number, l: number, c: number) => ({
  alchemy: a,
  smithing: s,
  lore: l,
  command: c,
});

describe('first new brew', () => {
  it('is judged on the median hours after the Hut', () => {
    const at = (h: number, seed: string) =>
      run({ seed, discovery: { hutHours: 30, firstNewBrewHours: 30 + h, cycles: [] } });
    expect(firstNewBrewCheck.judge([at(10, 'a'), at(20, 'b'), at(40, 'c')]).pass).toBe(true);
    expect(firstNewBrewCheck.judge([at(10, 'a'), at(30, 'b'), at(40, 'c')]).pass).toBe(false);
  });

  it('a Hut never built, or a brew never discovered, fails', () => {
    expect(firstNewBrewCheck.judge([run()]).pass).toBe(false);
    const noBrew = run({ discovery: { hutHours: 5, firstNewBrewHours: null, cycles: [] } });
    expect(firstNewBrewCheck.judge([noBrew]).pass).toBe(false);
  });

  it('reports Saturday without judging it', () => {
    const r = firstNewBrewCheck.judge([
      run({ discovery: { hutHours: 5, firstNewBrewHours: 10, cycles: [] } }),
      run({ start: 'sat' }),
    ]);
    expect(r.pass).toBe(true);
    expect(r.lines.some((l) => l.includes('(sat, reported only)'))).toBe(true);
  });
});

describe('recipe book', () => {
  const book = (n: number) =>
    run({
      discovery: {
        hutHours: 1,
        firstNewBrewHours: 2,
        cycles: [
          { cycle: 2, properties: 20, skills: skills(1, 1, 1, 1) },
          { cycle: 3, properties: n, skills: skills(1, 1, 1, 1) },
        ],
      },
    });
  it('needs all 36 by the end of cycle 3', () => {
    expect(recipeBookCheck.judge([book(36)]).pass).toBe(true);
    expect(recipeBookCheck.judge([book(35)]).pass).toBe(false);
    expect(recipeBookCheck.judge([run()]).pass).toBe(false); // cycle 3 never reached
  });
});

describe('skills', () => {
  const at = (c1: ReturnType<typeof skills>, c3: ReturnType<typeof skills>, seed = 'a') =>
    run({
      seed,
      discovery: {
        hutHours: 1,
        firstNewBrewHours: 2,
        cycles: [
          { cycle: 1, properties: 20, skills: c1 },
          { cycle: 3, properties: 36, skills: c3 },
        ],
      },
    });
  it('start moving: every skill at 1 or more at the end of cycle 1', () => {
    expect(skillsStartCheck.judge([at(skills(1, 1, 2, 1), skills(5, 5, 5, 5))]).pass).toBe(true);
    expect(skillsStartCheck.judge([at(skills(1, 0, 2, 1), skills(5, 5, 5, 5))]).pass).toBe(false);
  });
  it('pace: every skill between 4 and 8 at the end of cycle 3', () => {
    expect(skillsPaceCheck.judge([at(skills(1, 1, 1, 1), skills(4, 8, 5, 6))]).pass).toBe(true);
    expect(skillsPaceCheck.judge([at(skills(1, 1, 1, 1), skills(3, 8, 5, 6))]).pass).toBe(false);
    expect(skillsPaceCheck.judge([at(skills(1, 1, 1, 1), skills(4, 9, 5, 6))]).pass).toBe(false);
  });
  it('judge each skill on the median over seeds', () => {
    const rs = [3, 5, 6].map((a, i) => at(skills(1, 1, 1, 1), skills(a, 5, 5, 5), `s${i}`));
    expect(skillsPaceCheck.judge(rs).pass).toBe(true); // median alchemy 5
  });
});

describe('Act III', () => {
  const docs = (ids: string[], cycle: number) => ids.map((id) => ({ id, cycle, hours: 1 }));
  it('wants D3-01 to D3-06 by cycle 3 and D3-07 by cycle 4; D3-08 is only reported', () => {
    const ok = run({
      documents: [
        ...docs(['D3-01', 'D3-02', 'D3-03', 'D3-04', 'D3-05', 'D3-06'], 3),
        ...docs(['D3-07'], 4),
      ],
    });
    const r = act3Check.judge([ok]);
    expect(r.pass).toBe(true);
    expect(r.lines.join('\n')).toContain('D3-08 never');
    const late = run({
      documents: [
        ...docs(['D3-01', 'D3-02', 'D3-03', 'D3-04', 'D3-05'], 3),
        ...docs(['D3-06'], 4),
        ...docs(['D3-07'], 4),
      ],
    });
    expect(act3Check.judge([late]).pass).toBe(false);
  });
});

describe('Arvid’s level-5 letter', () => {
  it('is due by the end of cycle 4', () => {
    const letter = (cycle: number) =>
      run({ letters: [{ hunter: 'arvid', slot: 0, cycle, hours: 1 }] });
    expect(arvidLetterCheck.judge([letter(3)]).pass).toBe(true);
    expect(arvidLetterCheck.judge([letter(4)]).pass).toBe(true);
    expect(arvidLetterCheck.judge([letter(5)]).pass).toBe(false);
    expect(arvidLetterCheck.judge([run()]).pass).toBe(false);
    // The level-8 letter (slot 1) does not count.
    const other = run({ letters: [{ hunter: 'arvid', slot: 1, cycle: 3, hours: 1 }] });
    expect(arvidLetterCheck.judge([other]).pass).toBe(false);
  });
});

describe('trust keeps an arc', () => {
  const levels = (sworn: number) => ({
    a: sworn > 0 ? 'sworn' : 'trusting',
    b: 'hopeful',
  });
  it('wants no village Sworn at the end of cycle 3', () => {
    const t = (sworn: number) =>
      run({
        trust: [
          { cycle: 1, levels: levels(0) },
          { cycle: 3, levels: levels(sworn) },
        ],
      });
    expect(trustArcCheck.judge([t(0)]).pass).toBe(true);
    expect(trustArcCheck.judge([t(1)]).pass).toBe(false);
  });
});

describe('the fast set', () => {
  it('does not judge them', () => {
    const fast = { ...run(), spec: { ...run().spec, stopAt: ['bastion' as const] } } as RunResult;
    expect(firstNewBrewCheck.judge([fast]).pass).toBeNull();
    expect(trustArcCheck.judge([fast]).pass).toBeNull();
  });
});
