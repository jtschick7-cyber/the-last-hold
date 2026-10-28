import type { RunResult } from '../run';
import type { DescentCell, ProbeProfile } from '../descent-probe';
import { DESCENT, TIME_TARGETS } from '../targets';
import { median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §5.15.10, §7.14 (v1.4, D564, D577): the Descent's two rows, judged on the Vigilant's Monday runs
// and the Descent probe it takes at its first Rising Vigil stand (gate open, at Bastion): 100 practice
// runs per roster with the preview's own dice. In the full suite only.
const rowOf = (id: string) => {
  const row = TIME_TARGETS.find((r) => r.id === id);
  if (!row) throw new Error(`targets.ts has no "${id}" row`);
  return row;
};

const probed = (runs: readonly RunResult[]): RunResult[] =>
  runs.filter((r) => r.spec.policy === 'vigilant' && r.spec.start === 'mon' && r.vigil?.descent);

const cellOf = (r: RunResult, p: ProbeProfile): DescentCell | undefined =>
  r.vigil?.descent?.cells[p][0]?.[0];
const rate = (c: DescentCell | undefined): number => (c ? c.wins / c.samples : 0);
const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;

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
  lines: ['needs the Monday Vigilant runs with the Descent probe'],
});

const A = rowOf('descent-victory');
export const descentVictoryCheck: Check = {
  id: A.id,
  enforcedFrom: A.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(A.id, A.text);
    const rs = probed(runs);
    if (rs.length === 0) return needs(A.id, A.text);
    const win = median(rs.map((r) => rate(cellOf(r, 'maxed'))));
    const downed = median(rs.map((r) => cellOf(r, 'maxed')?.downed.median ?? Infinity));
    return {
      id: A.id,
      text: A.text,
      pass:
        win >= DESCENT.winMin &&
        win <= DESCENT.winMax &&
        downed >= DESCENT.downedMin &&
        downed <= DESCENT.downedMax,
      lines: [
        `maxed roster (median of ${rs.length} seeds): wins ${pct(win)} (band ${pct(DESCENT.winMin)} to ${pct(DESCENT.winMax)}), hunters downed ${downed} (band ${DESCENT.downedMin} to ${DESCENT.downedMax})`,
        ...rs.map(
          (r) =>
            `${r.spec.seed}: wins ${pct(rate(cellOf(r, 'maxed')))}, downed ${cellOf(r, 'maxed')?.downed.median}; minimal gate-open (reported) wins ${pct(rate(cellOf(r, 'minimal')))}`,
        ),
      ],
    };
  },
};

const B = rowOf('descent-learned-matters');
export const descentLearnedMattersCheck: Check = {
  id: B.id,
  enforcedFrom: B.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(B.id, B.text);
    const rs = probed(runs);
    if (rs.length === 0) return needs(B.id, B.text);
    const full = median(rs.map((r) => rate(cellOf(r, 'maxed'))));
    const zeroed = median(rs.map((r) => rate(cellOf(r, 'maxed-zeroed'))));
    // Lost in Stage 1: not one practice run cleared a stage (and none won).
    const hamletLoses = rs.every((r) => {
      const c = cellOf(r, 'hamlet');
      return !!c && c.wins === 0 && c.stagesCleared.p90 === 0;
    });
    return {
      id: B.id,
      text: B.text,
      pass: full - zeroed >= DESCENT.learnedPoints && hamletLoses,
      lines: [
        `maxed roster wins ${pct(full)}, with the bonus zeroed ${pct(zeroed)}: ${((full - zeroed) * 100).toFixed(0)} points against at least ${(DESCENT.learnedPoints * 100).toFixed(0)}`,
        `Hamlet starter party: ${hamletLoses ? 'loses in Stage 1 on every seed' : 'cleared a stage or won on some seed'}`,
      ],
    };
  },
};
