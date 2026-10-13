import { TIME_TARGETS } from '../targets';
import { groups, hoursText, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v0.4, D111, D134): every later cycle is at least 15% faster than the first,
// with a floor of 2 days. Judged on the median length of each cycle over the Monday
// Standard seeds; a cycle may be slower than 85% of the first only if it is at the
// floor, and none may be shorter than the floor (D130).
const target = TIME_TARGETS.find((t) => t.id === 'later-cycles');
if (!target) throw new Error('targets.ts has no "later-cycles" row');
const FASTER = 0.85;
const FLOOR_HOURS = 48;

const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? NaN) : ((s[mid - 1] ?? NaN) + (s[mid] ?? NaN)) / 2;
};

export const laterCyclesCheck: Check = {
  id: 'later-cycles',
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    const lines: string[] = [];
    let pass: boolean | null = null;
    if (stoppedBefore(runs))
      return { id: 'later-cycles', text: target.text, pass: null, lines: ['not in the fast set'] };
    for (const [start, rs] of groups(runs, 'standard')) {
      const n = Math.min(...rs.map((r) => r.cycleHours.length));
      const lengths = Array.from({ length: n }, (_, i) =>
        median(rs.map((r) => r.cycleHours[i] ?? NaN)),
      );
      const shown = lengths.map((h, i) => `cycle ${i + 1}: ${hoursText(h)}`).join(', ');
      if (start !== 'mon') {
        lines.push(`standard (${start}, reported only): ${shown || 'no finished cycle'}`);
        continue;
      }
      if (n < 2) {
        pass = false;
        lines.push(`standard (mon): needs 2 finished cycles in every run, got ${n} ✗`);
        continue;
      }
      let ok = true;
      const first = lengths[0] ?? NaN;
      for (let i = 1; i < n; i++) {
        const prev = first;
        const now = lengths[i] ?? NaN;
        const fast = now <= Math.max(prev * FASTER, FLOOR_HOURS);
        const floor = now >= FLOOR_HOURS;
        ok = ok && fast && floor;
        lines.push(
          `cycle ${i + 1} vs 1: ${hoursText(now)} vs ${hoursText(prev)} (${((1 - now / prev) * 100).toFixed(0)}% faster)` +
            `${floor ? '' : ', below the 2-day floor'} ${fast && floor ? '✓' : '✗'}`,
        );
      }
      pass = (pass ?? true) && ok;
      lines.unshift(`standard (mon, median of ${rs.length}): ${shown}`);
    }
    return { id: 'later-cycles', text: target.text, pass, lines };
  },
};
