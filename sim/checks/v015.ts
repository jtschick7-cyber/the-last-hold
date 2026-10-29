import type { BreachPoint } from '../breach-probe';
import type { RunResult } from '../run';
import { BREACH, TIME_TARGETS } from '../targets';
import { median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v1.5, D589, D598): the Breach's three rows, judged on the Tactician's Monday runs and the
// probe each takes at its first stand at Bastion (100 practice stands per layout, the same seeds for
// every layout). In the full suite only (`sim.yml`).
const rowOf = (id: string) => {
  const row = TIME_TARGETS.find((r) => r.id === id);
  if (!row) throw new Error(`targets.ts has no "${id}" row`);
  return row;
};

const probed = (runs: readonly RunResult[]): RunResult[] =>
  runs.filter((r) => r.spec.policy === 'tactician' && r.spec.start === 'mon' && r.breach?.probe);

const point = (r: RunResult, v: BreachPoint['variant']): BreachPoint | undefined =>
  r.breach?.probe?.points.find((p) => p.variant === v);

const notJudged = (id: string, text: string): CheckResult => ({
  id,
  text,
  pass: null,
  lines: ['not in the fast set'],
});
const needs = (id: string, text: string): CheckResult => ({
  id,
  text,
  pass: false,
  lines: ['needs the Monday Tactician runs with the Breach probe'],
});

const A = rowOf('breach-auto-holds');
export const breachAutoHoldsCheck: Check = {
  id: A.id,
  enforcedFrom: A.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(A.id, A.text);
    const rs = probed(runs);
    if (rs.length === 0) return needs(A.id, A.text);
    const auto = median(rs.map((r) => point(r, 'auto')?.median ?? 0));
    const v5 = median(rs.map((r) => point(r, 'v5')?.median ?? Infinity));
    return {
      id: A.id,
      text: A.text,
      pass: auto >= BREACH.autoMinWaves && v5 - auto <= BREACH.autoWithinV5,
      lines: [
        `Auto-arrange holds ${auto} waves (at least ${BREACH.autoMinWaves}); the version 5 rules hold ${v5} (within ${BREACH.autoWithinV5}) (median of ${rs.length} seeds)`,
        ...rs.map(
          (r) =>
            `${r.spec.seed}: Auto-arrange ${point(r, 'auto')?.median}, version 5 ${point(r, 'v5')?.median}`,
        ),
      ],
    };
  },
};

const B = rowOf('breach-tactician-not-worse');
export const breachTacticianCheck: Check = {
  id: B.id,
  enforcedFrom: B.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(B.id, B.text);
    const rs = probed(runs);
    if (rs.length === 0) return needs(B.id, B.text);
    const auto = median(rs.map((r) => point(r, 'auto')?.median ?? 0));
    const tactician = median(rs.map((r) => point(r, 'tactician')?.median ?? 0));
    return {
      id: B.id,
      text: B.text,
      pass: tactician - auto >= BREACH.tacticianExtra,
      lines: [
        `the Tactician holds ${tactician} waves, Auto-arrange ${auto} (median of ${rs.length} seeds)`,
        ...rs.map(
          (r) =>
            `${r.spec.seed}: Tactician ${point(r, 'tactician')?.median}, Auto-arrange ${point(r, 'auto')?.median}`,
        ),
      ],
    };
  },
};

const C = rowOf('breach-bad-costs');
export const breachBadCostsCheck: Check = {
  id: C.id,
  enforcedFrom: C.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(C.id, C.text);
    const rs = probed(runs);
    if (rs.length === 0) return needs(C.id, C.text);
    const auto = median(rs.map((r) => r.breach?.probe?.max.auto.median ?? 0));
    const bad = median(rs.map((r) => r.breach?.probe?.max.bad.median ?? Infinity));
    return {
      id: C.id,
      text: C.text,
      pass: auto - bad >= BREACH.badCosts,
      lines: [
        `at Walls 15 and Watchtower 15 the bad layout holds ${bad} waves, Auto-arrange ${auto}: ${auto - bad} fewer against at least ${BREACH.badCosts} (median of ${rs.length} seeds)`,
        ...rs.map(
          (r) =>
            `${r.spec.seed}: bad ${r.breach?.probe?.max.bad.median}, Auto-arrange ${r.breach?.probe?.max.auto.median}`,
        ),
      ],
    };
  },
};
