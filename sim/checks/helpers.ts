import type { PolicyId } from '../../src/core/policies';
import type { CheckInStat, Moment, RunResult, StartId } from '../run';
import type { TimeTarget } from '../targets';
import type { Check, CheckResult } from './types';

// Technical design §13.3: time targets are judged on the median over seeds,
// engagement checks on every seed. Each start time is judged on its own.

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

/** A GDD §6.2 row: every bound, for every start that was run. */
export const timeCheck = (target: TimeTarget, moment: Moment): Check => ({
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const b of target.bounds) {
      const byStart = groups(runs, b.policy);
      if (byStart.size === 0) lines.push(`${b.policy}: not run`);
      for (const [start, rs] of byStart) {
        const h = medianMoment(rs, moment);
        const ok = h >= (b.minHours ?? 0) && h <= (b.maxHours ?? Number.POSITIVE_INFINITY);
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
 * The check-ins an engagement check looks at: from the start until the Keep
 * (v0.1's end of content), or the whole run if the Keep was never reached.
 */
export const engagementWindow = (run: RunResult): readonly CheckInStat[] => {
  const keep = run.moments.keep;
  return keep === null ? run.checkIns : run.checkIns.filter((c) => c.hours <= keep);
};

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
