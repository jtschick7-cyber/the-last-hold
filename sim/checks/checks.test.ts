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
    ...moments,
  },
  checkIns,
  income: { food: 0, wood: 0, iron: 0, silver: 0 },
  peaks: { food: 0, wood: 0, iron: 0, silver: 0, peasants: 0 },
  largestNumber: 1,
  final: { age: 'keep', peasants: 10 },
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
  it('look only at check-ins up to the Keep', () => {
    const r = run('standard', { keep: 2 }, [
      ci(0, 1),
      ci(1, 1),
      ci(2, 1, { agedUp: true }),
      ci(3, 0),
      ci(4, 0),
    ]);
    expect(somethingToDoCheck.judge([r]).pass).toBe(true);
    expect(noDrySpellsCheck.judge([r]).pass).toBe(true);
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

describe('no overflow', () => {
  it('needs 14-day runs and fails at 1e300', () => {
    expect(
      noOverflowCheck.judge([
        { ...run('standard', {}), spec: { policy: 'standard', seed: 'a', start: 'mon', days: 3 } },
      ]).pass,
    ).toBeNull();
    expect(noOverflowCheck.judge([{ ...run('standard', {}), largestNumber: 1e301 }]).pass).toBe(
      false,
    );
    expect(noOverflowCheck.judge([run('standard', {})]).pass).toBe(true);
  });
});
