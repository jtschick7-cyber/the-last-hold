import type { PolicyId } from '../../src/core/policies';
import type { CheckInStat, Moment, RunResult, StartId } from '../run';
import type { TimeTarget } from '../targets';
import type { Check, CheckResult } from './types';

// Technical design §13.3: time targets are judged on the median over seeds,
// engagement checks on every seed.

const JUDGED_START: StartId = 'mon';

const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? NaN) : ((s[mid - 1] ?? NaN) + (s[mid] ?? NaN)) / 2;
};

export const hoursText = (h: number): string =>
  !Number.isFinite(h) ? 'never' : h < 1 ? `${(h * 60).toFixed(1)} min` : `${h.toFixed(2)} h`;

export const groups = (runs: readonly RunResult[], policy: PolicyId): Map<StartId, RunResult[]> => {
  const out = new Map<StartId, RunResult[]>();
  for (const r of runs.filter((x) => x.spec.policy === policy)) {
    out.set(r.spec.start, [...(out.get(r.spec.start) ?? []), r]);
  }
  return out;
};

/** The median time to a moment over seeds (never reached counts as infinite). */
export const medianMoment = (runs: readonly RunResult[], moment: Moment): number =>
  median(runs.map((r) => r.moments[moment] ?? Number.POSITIVE_INFINITY));

/** True when every run stopped early (the fast set) without this moment among its targets. */
export const stoppedBefore = (runs: readonly RunResult[], moment?: Moment): boolean =>
  runs.length > 0 &&
  runs.every(
    (r) => r.spec.stopAt !== undefined && (moment === undefined || !r.spec.stopAt.includes(moment)),
  );

/** A GDD §6.2 row: every bound, for every start that was run. */
export const timeCheck = (target: TimeTarget, moment: Moment): Check => ({
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    const lines: string[] = [];
    let pass: boolean | null = null;
    if (stoppedBefore(runs, moment))
      return { id: target.id, text: target.text, pass: null, lines: ['not in the fast set'] };
    for (const b of target.bounds) {
      const byStart = groups(runs, b.policy);
      if (byStart.size === 0) lines.push(`${b.policy}: not run`);
      for (const [start, rs] of byStart) {
        const h = medianMoment(rs, moment);
        const ok = h >= (b.minHours ?? 0) && h <= (b.maxHours ?? Number.POSITIVE_INFINITY);
        // D62 (Q4b): time targets are judged on the Monday start (GDD §6.1's
        // start); the Saturday start is reported here and judged by the
        // engagement checks.
        if (start !== JUDGED_START) {
          lines.push(`${b.policy} (${start}, reported only): ${hoursText(h)}`);
          continue;
        }
        pass = (pass ?? true) && ok;
        lines.push(
          `${b.policy} (${start}, median of ${rs.length}): ${hoursText(h)} ${ok ? '✓' : '✗'}`,
        );
      }
    }
    return { id: target.id, text: target.text, pass, lines };
  },
});

/**
 * The check-ins an engagement check looks at: the scheduled ones (GDD §6.3
 * judges Standard check-ins, not the Opening's 10-second steps) of all of cycle 1,
 * up to and including the Last Stand (v0.4, D114; through v0.3 it stopped at the Keep).
 */
export const engagementWindow = (run: RunResult): readonly CheckInStat[] =>
  run.checkIns.filter((c) => !c.opening && c.cycle === 1);

/**
 * A check-in with something to do: a purchase, or a real choice passed up to
 * save for the Age-up (GDD §6.1's saving rule), as D60 defines it.
 */
export const busy = (c: CheckInStat): boolean => c.purchases > 0 || (c.saving && c.hadOption);

/** Runs an engagement check on every Standard run (every seed and start). */
export const everyStandardRun = (
  runs: readonly RunResult[],
  id: string,
  text: string,
  judgeRun: (run: RunResult) => { ok: boolean; detail: string },
): CheckResult => {
  const lines: string[] = [];
  let pass: boolean | null = null;
  for (const run of runs.filter((r) => r.spec.policy === 'standard')) {
    const { ok, detail } = judgeRun(run);
    pass = (pass ?? true) && ok;
    lines.push(`${run.spec.start} ${run.spec.seed}: ${detail} ${ok ? '✓' : '✗'}`);
  }
  return { id, text, pass, lines };
};
