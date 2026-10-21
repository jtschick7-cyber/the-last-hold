import type { RunResult } from '../run';
import { REMEMBERING, TIME_TARGETS } from '../targets';
import { median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v0.11, D458, D464, D469): the Remembering is reachable. Judged on the median over the 5
// Monday Standard seeds: all 40 names found and Act VI's stand applied by the end of cycle N. A seed
// that never gets there counts as later than any N. The species half of the gate is proved by the
// content test (T11.2), not here. Judged in the full suite only.
const ROW = 'remembering-reachable';
const row = TIME_TARGETS.find((r) => r.id === ROW);
if (!row) throw new Error(`targets.ts has no "${ROW}" row`);

const INF = Number.POSITIVE_INFINITY;
const cycleText = (c: number): string => (Number.isFinite(c) ? `cycle ${c}` : 'never');

export const rememberingReachableCheck: Check = {
  id: ROW,
  enforcedFrom: row.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs))
      return { id: ROW, text: row.text, pass: null, lines: ['not in the fast set'] };
    const rs = runs.filter(
      (r) => r.spec.policy === 'standard' && r.spec.start === 'mon' && r.ending !== undefined,
    );
    if (rs.length === 0)
      return { id: ROW, text: row.text, pass: false, lines: ['needs the Monday Standard runs'] };
    const cycles = rs.map((r: RunResult) => r.ending?.namesAndStand?.cycle ?? INF);
    const m = median(cycles);
    return {
      id: ROW,
      text: row.text,
      pass: m <= REMEMBERING.byCycle,
      lines: [
        `median ${cycleText(m)} against cycle ${REMEMBERING.byCycle}`,
        ...rs.map(
          (r, i) =>
            `${r.spec.seed}: ${cycleText(cycles[i] ?? INF)} (${r.ending?.atEnd.names ?? 0} of 40 names)`,
        ),
      ],
    };
  },
};
