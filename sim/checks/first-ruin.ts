import { TIME_TARGETS } from '../targets';
import { groups, hoursText, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 "first-ruin" (v0.5, D168): the first ruin contract won comes within 24 h of the
// Keep (thresholds in sim/targets.ts). Ruins are posted from the Keep, so it is measured
// from there, like first-identified is from the Lodge.
const target = TIME_TARGETS.find((t) => t.id === 'first-ruin');
if (!target) throw new Error('targets.ts has no "first-ruin" row');

export const firstRuinCheck: Check = {
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs, 'first-ruin'))
      return { id: target.id, text: target.text, pass: null, lines: ['not in the fast set'] };
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const b of target.bounds) {
      const byStart = groups(runs, b.policy);
      if (byStart.size === 0) lines.push(`${b.policy}: not run`);
      for (const [start, rs] of byStart) {
        const h = median(
          rs.map((r) => (r.moments['first-ruin'] ?? Infinity) - (r.moments.keep ?? 0)),
        );
        const ok = h <= (b.maxHours ?? Infinity);
        if (start !== 'mon') {
          lines.push(`${b.policy} (${start}, reported only): ${hoursText(h)} after the Keep`);
          continue;
        }
        pass = (pass ?? true) && ok;
        lines.push(
          `${b.policy} (${start}, median of ${rs.length}): ${hoursText(h)} after the Keep ${ok ? '✓' : '✗'}`,
        );
      }
    }
    return { id: target.id, text: target.text, pass, lines };
  },
};
