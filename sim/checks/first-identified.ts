import { TIME_TARGETS } from '../targets';
import { groups, hoursText } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 "first-identified": the first species Identified through investigation comes
// within 2 h of the Hunter's Lodge being built (thresholds in sim/targets.ts). Measured
// from the Lodge, not the start, like first-contract is from the Mine.
const target = TIME_TARGETS.find((t) => t.id === 'first-identified');
if (!target) throw new Error('targets.ts has no "first-identified" row');

export const firstIdentifiedCheck: Check = {
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const b of target.bounds) {
      const byStart = groups(runs, b.policy);
      if (byStart.size === 0) lines.push(`${b.policy}: not run`);
      for (const [start, rs] of byStart) {
        const gaps = rs.map(
          (r) => (r.moments['first-identified'] ?? Infinity) - (r.moments['hunters-lodge'] ?? 0),
        );
        const h = [...gaps].sort((a, c) => a - c)[Math.floor(gaps.length / 2)] ?? Infinity;
        const ok = h <= (b.maxHours ?? Infinity);
        if (start !== 'mon') {
          lines.push(`${b.policy} (${start}, reported only): ${hoursText(h)} after the Lodge`);
          continue;
        }
        pass = (pass ?? true) && ok;
        lines.push(
          `${b.policy} (${start}, median of ${rs.length}): ${hoursText(h)} after the Lodge ${ok ? '✓' : '✗'}`,
        );
      }
    }
    return { id: target.id, text: target.text, pass, lines };
  },
};
