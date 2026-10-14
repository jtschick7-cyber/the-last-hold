// Technical design §13.3: how the v0.1 checks judge runs, on made-up runs.
import { describe, expect, it } from 'vitest';
import type { PolicyId } from '../../src/core/policies';
import type { CheckInStat, Moment, RunResult, StartId } from '../run';
import { keepCheck } from './keep';
import { noDrySpellsCheck } from './no-dry-spells';
import { noOverflowCheck } from './no-overflow';
import { noWallsCheck } from './no-walls';
import { somethingToDoCheck } from './something-to-do';

const ci = (hours: number, purchases: number, extra: Partial<CheckInStat> = {}): CheckInStat => ({
  hours,
  purchases,
  hadOption: purchases > 0,
  saving: false,
  agedUp: false,
  opening: false,
  cycle: 1,
  ...extra,
});

const run = (
  policy: PolicyId,
  moments: Partial<Record<Moment, number>>,
  checkIns: CheckInStat[] = [],
  start: StartId = 'mon',
  seed = 'a',
): RunResult => ({
  spec: { policy, seed, start, days: 14 },
  moments: {
    'first-cottage': null,
    'first-mine': null,
    'mill-3': null,
    'peasants-10': null,
    keep: null,
    'first-contract': null,
    'roster-4': null,
    'first-tier-3': null,
    'hunters-lodge': null,
    'first-identified': null,
    'first-studied': null,
    citadel: null,
    bastion: null,
    'best-last-stand': null,
    'first-long-night': null,
    'first-ruin': null,
    ...moments,
  },
  checkIns,
  income: { food: 0, wood: 0, iron: 0, silver: 0 },
  peaks: { food: 0, wood: 0, iron: 0, silver: 0, peasants: 0 },
  largestNumber: 1,
  final: { age: 'keep', peasants: 10 },
  cyclesDone: 3,
  contracts: [],
  keepPhase: { bountySilver: 0, jobSilver: 0, provisionsFood: 0, jobFood: 0, byCycle: [] },
  cycleHours: [],
  standSamples: [],
  story: {
    documents: [],
    names: [],
    letters: [],
    bands: [],
    trust: [],
    trustRoseInCycle1: 0,
  },
});

describe('time targets', () => {
  it('judge the median over seeds, per start', () => {
    const runs = [9, 20, 12].map((h, i) => run('standard', { keep: h }, [], 'mon', `s${i}`));
    const r = keepCheck.judge(runs);
    expect(r.pass).toBe(true); // median 12 h, inside 8–14 h
    expect(r.lines.join('\n')).toContain('standard (mon, median of 3): 12.00 h ✓');
  });

  it('a moment never reached fails an upper bound', () => {
    expect(keepCheck.judge([run('light', {})]).pass).toBe(false);
  });

  it('policies left out of the run are reported, not judged', () => {
    const r = keepCheck.judge([run('standard', { keep: 10 })]);
    expect(r.pass).toBe(true);
    expect(r.lines).toContain('light: not run');
  });
});

describe('engagement checks', () => {
  it('look at all of cycle 1, past the Keep, up to the stand, and not at later cycles (D114)', () => {
    const quietAfterKeep = run('standard', { keep: 2 }, [
      ci(0, 1),
      ci(1, 1),
      ci(2, 1, { agedUp: true }),
      ci(3, 0),
      ci(4, 0),
    ]);
    expect(noDrySpellsCheck.judge([quietAfterKeep]).pass).toBe(false); // cycle 1 goes on past the Keep
    const quietInCycle2 = run('standard', { keep: 2 }, [
      ci(0, 1),
      ci(1, 1),
      ci(2, 1, { agedUp: true }),
      ci(3, 1), // the stand's check-in still belongs to cycle 1
      ci(4, 0, { cycle: 2 }),
      ci(5, 0, { cycle: 2 }),
    ]);
    expect(somethingToDoCheck.judge([quietInCycle2]).pass).toBe(true);
    expect(noDrySpellsCheck.judge([quietInCycle2]).pass).toBe(true);
  });

  it("skip the Opening's 10-second steps", () => {
    const steps = Array.from({ length: 30 }, (_, i) => ci(i / 360, 0, { opening: true }));
    const r = run('standard', { keep: 3 }, [...steps, ci(3, 1, { agedUp: true })]);
    expect(somethingToDoCheck.judge([r]).pass).toBe(true);
    expect(noWallsCheck.judge([r]).pass).toBe(true);
  });

  it('time targets judge the Monday start and only report Saturday', () => {
    const r = keepCheck.judge([
      run('standard', { keep: 10 }),
      run('standard', { keep: 30 }, [], 'sat'),
    ]);
    expect(r.pass).toBe(true);
    expect(r.lines).toContain('standard (sat, reported only): 30.00 h');
  });

  it('saving for the Age-up while something is affordable counts as something to do', () => {
    const saving = { saving: true, hadOption: true };
    const r = run('standard', { keep: 3 }, [
      ci(0, 1),
      ci(1, 0, saving),
      ci(2, 0, saving),
      ci(3, 1, { agedUp: true }),
    ]);
    expect(somethingToDoCheck.judge([r]).pass).toBe(true);
    expect(noDrySpellsCheck.judge([r]).pass).toBe(true);
  });

  it('two check-ins in a row with nothing to do is a dry spell', () => {
    const r = run('standard', {}, [ci(0, 1), ci(1, 0), ci(2, 0), ci(3, 1)]);
    expect(noDrySpellsCheck.judge([r]).pass).toBe(false);
    expect(somethingToDoCheck.judge([r]).pass).toBe(false);
  });

  it('walls: 4 check-ins of saving fail, unless they end in an Age-up (up to 5)', () => {
    const wait = (from: number, n: number) => Array.from({ length: n }, (_, i) => ci(from + i, 0));
    const wall = run('standard', {}, [ci(0, 1), ...wait(1, 4), ci(5, 1)]);
    expect(noWallsCheck.judge([wall]).pass).toBe(false);
    const ageUp = run('standard', {}, [ci(0, 1), ...wait(1, 5), ci(6, 1, { agedUp: true })]);
    expect(noWallsCheck.judge([ageUp]).pass).toBe(true);
    const long = run('standard', {}, [ci(0, 1), ...wait(1, 6), ci(7, 1, { agedUp: true })]);
    expect(noWallsCheck.judge([long]).pass).toBe(false);
  });

  it('engagement checks judge every Standard run, not the median', () => {
    const good = run('standard', {}, [ci(0, 1), ci(1, 1)], 'mon', 'a');
    const bad = run('standard', {}, [ci(0, 1), ci(1, 0), ci(2, 0)], 'mon', 'b');
    expect(noDrySpellsCheck.judge([good, good, bad]).pass).toBe(false);
  });
});

describe('no overflow (through 3 cycles, D114)', () => {
  const long = (over: Partial<RunResult> = {}): RunResult => ({
    ...run('standard', {}),
    spec: { policy: 'standard', seed: 'a', start: 'mon', days: 14, minCycles: 3, maxDays: 42 },
    ...over,
  });
  it('needs runs through 3 cycles, fails at 1e300, and fails a run that never got there', () => {
    expect(noOverflowCheck.judge([run('standard', {})]).pass).toBeNull();
    expect(noOverflowCheck.judge([long({ largestNumber: 1e301 })]).pass).toBe(false);
    expect(noOverflowCheck.judge([long({ cyclesDone: 2 })]).pass).toBe(false);
    expect(noOverflowCheck.judge([long()]).pass).toBe(true);
  });
});

// v0.2 checks, on made-up runs.
import { contractsOwnSilverCheck } from './contracts-own-silver';
import { firstContractCheck } from './first-contract';
import { firstTier3Check } from './first-tier-3';
import { makeOddsHonestCheck } from './odds-honest';
import { provisionsMatterCheck } from './provisions-matter';
import { roster4Check } from './roster-4';
import type { ContractRecord } from '../run';

describe('v0.2 time targets', () => {
  it('first contract: within 15 minutes of the first Mine, on the Monday median', () => {
    const fast = [1, 2, 3].map((i) =>
      run('standard', { 'first-mine': 0.075, 'first-contract': 0.2 }, [], 'mon', `s${i}`),
    );
    expect(firstContractCheck.judge(fast).pass).toBe(true); // 7.5 min after the Mine
    const slow = [1, 2, 3].map((i) =>
      run('standard', { 'first-mine': 0.075, 'first-contract': 3 }, [], 'mon', `s${i}`),
    );
    expect(firstContractCheck.judge(slow).pass).toBe(false);
    expect(firstContractCheck.judge([run('standard', { 'first-mine': 0.07 })]).pass).toBe(false); // never launched
  });

  it('roster of four by 48 h, and the first tier-3 success on day 2', () => {
    const ok = run('standard', { 'roster-4': 40, 'first-tier-3': 36 });
    expect(roster4Check.judge([ok]).pass).toBe(true);
    expect(firstTier3Check.judge([ok]).pass).toBe(true);
    expect(roster4Check.judge([run('standard', { 'roster-4': 60 })]).pass).toBe(false);
    expect(firstTier3Check.judge([run('standard', { 'first-tier-3': 20 })]).pass).toBe(false); // too early
    expect(firstTier3Check.judge([run('standard', { 'first-tier-3': 60 })]).pass).toBe(false); // too late
  });
});

describe('v0.2 economy checks', () => {
  const withKeep = (
    phase: Partial<RunResult['keepPhase']>,
    keep: number | null = 14,
  ): RunResult => ({
    ...run('standard', keep === null ? {} : { keep }),
    keepPhase: {
      bountySilver: 0,
      jobSilver: 0,
      provisionsFood: 0,
      jobFood: 1,
      byCycle: [],
      ...phase,
    },
  });

  it('bounties must be at least 70% of the silver since the Keep', () => {
    expect(
      contractsOwnSilverCheck.judge([withKeep({ bountySilver: 71, jobSilver: 29 })]).pass,
    ).toBe(true);
    expect(
      contractsOwnSilverCheck.judge([withKeep({ bountySilver: 69, jobSilver: 31 })]).pass,
    ).toBe(false);
    expect(contractsOwnSilverCheck.judge([withKeep({}, null)]).pass).toBe(false); // never reached the Keep
  });

  it('both shares are judged on cycle 1 only; later cycles are reported (D135)', () => {
    const c = (cycle: number, bountySilver: number, provisionsFood: number) => ({
      cycle,
      bountySilver,
      jobSilver: 100 - bountySilver,
      provisionsFood,
      jobFood: 100,
    });
    const r = withKeep({
      bountySilver: 120,
      jobSilver: 80,
      provisionsFood: 40,
      jobFood: 200,
      byCycle: [c(1, 75, 30), c(2, 45, 10)],
    });
    expect(contractsOwnSilverCheck.judge([r]).pass).toBe(true); // 60% over both, 75% in cycle 1
    expect(provisionsMatterCheck.judge([r]).pass).toBe(true); // 20% over both, 30% in cycle 1
    const low = withKeep({ byCycle: [c(1, 65, 15), c(2, 90, 30)] });
    expect(contractsOwnSilverCheck.judge([low]).pass).toBe(false);
    expect(provisionsMatterCheck.judge([low]).pass).toBe(false);
  });

  it('provisions are judged against 20–40% of food income, and the check is enforced (no longer pending)', () => {
    const r = provisionsMatterCheck.judge([withKeep({ provisionsFood: 30, jobFood: 100 })]);
    expect(r.pass).toBe(true);
    expect(provisionsMatterCheck.judge([withKeep({ provisionsFood: 1, jobFood: 100 })]).pass).toBe(
      false,
    );
    expect(provisionsMatterCheck.judge([withKeep({ provisionsFood: 90, jobFood: 100 })]).pass).toBe(
      false,
    );
    expect(r.pending).toBeUndefined();
  });
});

describe('odds honesty', () => {
  const rec = (winChance: number, wins: number, n: number): ContractRecord[] =>
    Array.from({ length: n }, (_, i) => ({ hours: 0, tier: 1, winChance, success: i < wins }));
  const judge = (probe: ContractRecord[]) =>
    makeOddsHonestCheck(() => probe).judge([
      { ...run('standard', {}), contracts: rec(0.99, 1881, 1900) },
    ]);

  it('passes when every crowded bucket lands within 5 points of what the odds said', () => {
    const r = judge([...rec(0.55, 55, 100), ...rec(0.25, 24, 100)]);
    expect(r.pass).toBe(true);
    expect(r.lines.join('\n')).toContain('50–60%');
  });

  it('fails when a crowded bucket is off by more than 5 points', () => {
    expect(judge(rec(0.55, 40, 100)).pass).toBe(false); // said 55%, got 40%
  });

  it('does not judge a bucket with too few contracts', () => {
    const r = judge([...rec(0.55, 10, 10), ...rec(0.25, 25, 100)]); // 10 contracts at 55%, far off, but too few
    expect(r.pass).toBe(true);
    expect(r.lines.join('\n')).toContain('too few');
  });

  it('cannot judge with fewer than 2,000 contracts', () => {
    const few = makeOddsHonestCheck(() => []).judge([
      { ...run('standard', {}), contracts: rec(0.9, 9, 100) },
    ]);
    expect(few.pass).toBe(null);
  });
});

// v0.3 checks, on made-up runs.
import { firstIdentifiedCheck } from './first-identified';
import { firstStudiedCheck } from './first-studied';
import { makePreparationMattersCheck } from './preparation-matters';

describe('v0.3 time targets', () => {
  it('first Identified is judged from the Lodge: within 2 h', () => {
    const ok = run('standard', { 'hunters-lodge': 40, 'first-identified': 41.5 });
    expect(firstIdentifiedCheck.judge([ok]).pass).toBe(true);
    const late = run('standard', { 'hunters-lodge': 40, 'first-identified': 43 });
    expect(firstIdentifiedCheck.judge([late]).pass).toBe(false);
    expect(firstIdentifiedCheck.judge([run('standard', { 'hunters-lodge': 40 })]).pass).toBe(false);
  });

  it('first Studied falls on days 2–3', () => {
    expect(firstStudiedCheck.judge([run('standard', { 'first-studied': 50 })]).pass).toBe(true);
    expect(firstStudiedCheck.judge([run('standard', { 'first-studied': 20 })]).pass).toBe(false);
    expect(firstStudiedCheck.judge([run('standard', { 'first-studied': 80 })]).pass).toBe(false);
  });
});

describe('preparation matters (GDD §6.3 #4)', () => {
  const cases = (tier: number, gain: number, n = 10) =>
    Array.from({ length: n }, () => ({ tier, bare: 0.5, prepared: 0.5 + gain }));
  const base = run('standard', {});
  const full = [base];

  it('needs the full suite', () => {
    const fast = [{ ...base, spec: { ...base.spec, days: 3 } }];
    expect(makePreparationMattersCheck(() => cases(3, 0.3)).judge(fast).pass).toBeNull();
  });

  it('passes when every judged tier gains at least 15 points', () => {
    const probe = () => [...cases(1, 0.2), ...cases(3, 0.16), ...cases(5, 0.4)];
    expect(makePreparationMattersCheck(probe).judge(full).pass).toBe(true);
  });

  it('fails when a tier gains less, and ignores a tier with too few cases', () => {
    const weak = () => [...cases(1, 0.2), ...cases(3, 0.1)];
    expect(makePreparationMattersCheck(weak).judge(full).pass).toBe(false);
    const thin = () => [...cases(1, 0.2), ...cases(2, 0.0, 3)];
    expect(makePreparationMattersCheck(thin).judge(full).pass).toBe(true);
    expect(makePreparationMattersCheck(() => []).judge(full).pass).toBeNull();
  });
});

// v0.4 checks, on made-up runs.
import { laterCyclesCheck } from './later-cycles';

describe('later cycles (GDD §6.2, D111)', () => {
  const cycles = (...hours: number[]): RunResult => ({ ...run('standard', {}), cycleHours: hours });
  it('each later cycle at least 15% faster than the first (D134)', () => {
    expect(laterCyclesCheck.judge([cycles(100, 85, 72)]).pass).toBe(true);
    expect(laterCyclesCheck.judge([cycles(100, 80, 82)]).pass).toBe(true); // a plateau is fine
    expect(laterCyclesCheck.judge([cycles(100, 90)]).pass).toBe(false);
    expect(laterCyclesCheck.judge([cycles(100, 80, 86)]).pass).toBe(false);
  });
  it('a cycle at the 2-day floor passes; one below it fails', () => {
    expect(laterCyclesCheck.judge([cycles(56, 48, 48)]).pass).toBe(true);
    expect(laterCyclesCheck.judge([cycles(60, 40)]).pass).toBe(false);
  });
  it('needs two finished cycles in every Monday run', () => {
    expect(laterCyclesCheck.judge([cycles(100)]).pass).toBe(false);
  });
});

// v0.5 checks (D168), on made-up runs.
import { firstRuinCheck } from './first-ruin';
import { act1Check, act2Check } from './story-acts';
import { ribbonshadesCheck } from './ribbonshades';
import { trustMovesCheck } from './trust-moves';
import { STORY } from '../targets';

const withStory = (story: Partial<RunResult['story']>, seed = 'a'): RunResult => {
  const r = run('standard', {}, [], 'mon', seed);
  return { ...r, story: { ...r.story, ...story } };
};
const doc = (id: string, cycle: number) => ({ id, cycle, hours: cycle * 50 });

describe('first ruin (D168)', () => {
  it('is judged from the Keep: within 24 h', () => {
    const at = (keep: number, ruin: number) => run('standard', { keep, 'first-ruin': ruin });
    expect(firstRuinCheck.judge([at(10, 30)]).pass).toBe(true);
    expect(firstRuinCheck.judge([at(10, 40)]).pass).toBe(false);
    expect(firstRuinCheck.judge([run('standard', { keep: 10 })]).pass).toBe(false); // never
  });
});

describe('Act I and Act II land in their cycles (D168)', () => {
  const act1 = [...STORY.act1.docs.map((d) => doc(d, 1)), doc('D1-07', 2)];
  const act2 = [...STORY.act2.docs.map((d) => doc(d, 2)), doc('D2-10', 3)];
  it('Act I: its contract, Rank and stand documents by the end of cycle 1, D1-07 at the next warden', () => {
    expect(act1Check.judge([withStory({ documents: act1 })]).pass).toBe(true);
    const late = act1.map((d) => (d.id === 'D1-10' ? doc('D1-10', 2) : d));
    expect(act1Check.judge([withStory({ documents: late })]).pass).toBe(false);
    const missing = act1.filter((d) => d.id !== 'D1-07');
    expect(act1Check.judge([withStory({ documents: missing })]).pass).toBe(false);
  });
  it('the reported-only documents never fail it, and are listed', () => {
    const r = act1Check.judge([withStory({ documents: act1 })]);
    expect(r.lines.join('\n')).toContain('D1-02');
    expect(r.lines.join('\n')).toContain('reported only');
  });
  it('Act II: every document but Sigrun’s in cycle 2, D2-10 at the next warden', () => {
    expect(act2Check.judge([withStory({ documents: act2 })]).pass).toBe(true);
    expect(act2Check.judge([withStory({ documents: act2.slice(1) })]).pass).toBe(false);
  });
  it('judges the median over the Monday seeds, per document', () => {
    const good = (s: string) => withStory({ documents: act1 }, s);
    const bad = withStory({ documents: [] }, 'x');
    expect(act1Check.judge([good('a'), good('b'), bad]).pass).toBe(true); // 2 of 3 found each
  });
});

describe('Ribbonshade names (D168)', () => {
  const names = (cycle: number) => STORY.ribbonNames.map((n) => ({ n, cycle, hours: 1 }));
  it('all six by the end of cycle 3', () => {
    expect(ribbonshadesCheck.judge([withStory({ names: names(3) })]).pass).toBe(true);
    expect(ribbonshadesCheck.judge([withStory({ names: names(4) })]).pass).toBe(false);
    expect(ribbonshadesCheck.judge([withStory({ names: names(2).slice(0, 5) })]).pass).toBe(false);
  });
});

describe('trust moves (D168)', () => {
  it('at least one village rises a step in cycle 1', () => {
    expect(trustMovesCheck.judge([withStory({ trustRoseInCycle1: 1 })]).pass).toBe(true);
    expect(trustMovesCheck.judge([withStory({ trustRoseInCycle1: 0 })]).pass).toBe(false);
  });
});
