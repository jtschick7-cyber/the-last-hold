import { TIME_TARGETS } from '../targets';
import { groups, hoursText } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 "first-contract": the first contract is launched within 15 min of the
// first Mine (thresholds in sim/targets.ts). Measured from the Mine, not the start.
const target = TIME_TARGETS.find((t) => t.id === 'first-contract');
if (!target) throw new Error('targets.ts has no "first-contract" row');

export const firstContractCheck: Check = {
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
          (r) => (r.moments['first-contract'] ?? Infinity) - (r.moments['first-mine'] ?? 0),
        );
        const h = [...gaps].sort((a, c) => a - c)[Math.floor(gaps.length / 2)] ?? Infinity;
        const ok = h <= (b.maxHours ?? Infinity);
        if (start !== 'mon') {
          lines.push(`${b.policy} (${start}, reported only): ${hoursText(h)} after the Mine`);
          continue;
        }
        pass = (pass ?? true) && ok;
        lines.push(
          `${b.policy} (${start}, median of ${rs.length}): ${hoursText(h)} after the Mine ${ok ? '✓' : '✗'}`,
        );
      }
    }
    return { id: target.id, text: target.text, pass, lines };
  },
};
