import type { RunResult } from '../run';
import { TIME_TARGETS, VIGIL } from '../targets';
import { median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 v1.3 (D546 (5), D554): Rising Vigil's three rows, judged on the Vigilant's Monday runs and
// on its probe (a copy of its state at its first endless stand, 100 practice stands per level with the
// same seeds at every level). In the full suite only: the Vigilant plays 3 endless cycles.
const rowOf = (id: string) => {
  const row = TIME_TARGETS.find((r) => r.id === id);
  if (!row) throw new Error(`targets.ts has no "${id}" row`);
  return row;
};

const vigilants = (runs: readonly RunResult[]): RunResult[] =>
  runs.filter((r) => r.spec.policy === 'vigilant' && r.spec.start === 'mon');

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
  lines: ['needs the Monday Vigilant runs'],
});

const A = rowOf('vigil-level-rises');
export const vigilLevelRisesCheck: Check = {
  id: A.id,
  enforcedFrom: A.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(A.id, A.text);
    const rs = vigilants(runs);
    if (rs.length === 0) return needs(A.id, A.text);
    const levels = rs.map((r) => (r.vigil?.stands ?? []).map((s) => s.level));
    return {
      id: A.id,
      text: A.text,
      pass: levels.every((l) => l.length === 3 && l.every((n, i) => n === i + 1)),
      lines: rs.map((r, i) => `${r.spec.seed}: levels ${(levels[i] ?? []).join(', ') || 'none'}`),
    };
  },
};

const B = rowOf('vigil-never-more-waves');
/** The levels at which a curve of medians rises (level L + 1 holds more than level L). */
export const risesAt = (medians: readonly number[]): number[] =>
  medians.flatMap((m, i) => ((medians[i + 1] ?? -Infinity) > m ? [i] : []));
export const vigilNeverMoreWavesCheck: Check = {
  id: B.id,
  enforcedFrom: B.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(B.id, B.text);
    const rs = vigilants(runs).filter((r) => r.vigil?.probe);
    if (rs.length === 0) return needs(B.id, B.text);
    const lines: string[] = [];
    let pass = true;
    for (const r of rs) {
      for (const [i, t] of (r.vigil?.probe?.threats ?? []).entries()) {
        const medians = (t.waves.additive?.[0] ?? []).map((p) => p.median);
        const rises = risesAt(medians);
        if (rises.length > 0 || medians.length === 0) pass = false;
        lines.push(
          `${r.spec.seed}, ${i === 0 ? "the stand's Threat" : 'twice that Threat'}: ${medians.join(' ')}${rises.length > 0 ? ` (rises after level ${rises.join(', ')})` : ''}`,
        );
      }
    }
    return { id: B.id, text: B.text, pass, lines };
  },
};

const C = rowOf('vigil-embers-level');
export const vigilEmbersLevelCheck: Check = {
  id: C.id,
  enforcedFrom: C.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs)) return notJudged(C.id, C.text);
    const rs = vigilants(runs).filter((r) => r.vigil?.probe);
    if (rs.length === 0) return needs(C.id, C.text);
    const at = (point: number, level: number): number =>
      median(
        rs.map((r) => r.vigil?.probe?.threats[point]?.embers.additive?.[0]?.[0]?.[level] ?? 0),
      );
    const lines: string[] = [];
    let pass = true;
    for (const point of [0, 1]) {
      const base = at(point, 0);
      const ratios = [1, 2, 3].map((l) => (base === 0 ? Infinity : at(point, l) / base));
      const off = Math.max(...ratios.map((x) => Math.abs(x - 1)));
      // Only the stand's own Threat is judged; twice that Threat is reported (D554).
      if (point === 0 && !(off <= VIGIL.embersTolerance)) pass = false;
      lines.push(
        `${point === 0 ? "the stand's Threat (judged)" : 'twice that Threat (reported)'}: level 0 ${base}, ratios ${ratios.map((x) => x.toFixed(3)).join(', ')}; largest gap ${(off * 100).toFixed(1)}% against ${(VIGIL.embersTolerance * 100).toFixed(0)}%`,
      );
    }
    return { id: C.id, text: C.text, pass, lines };
  },
};
