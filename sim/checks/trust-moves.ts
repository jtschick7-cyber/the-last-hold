import { TIME_TARGETS } from '../targets';
import { groups, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 "A village's trust rises" (v0.5, D168): at least one village stands above its
// starting level when cycle 1 ends (a step from contracts won, or from a Triumphant stand),
// judged on the median over the Monday Standard seeds.
const target = TIME_TARGETS.find((t) => t.id === 'trust-moves');
if (!target) throw new Error('targets.ts has no "trust-moves" row');

export const trustMovesCheck: Check = {
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs))
      return { id: target.id, text: target.text, pass: null, lines: ['not in the fast set'] };
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const [start, rs] of groups(runs, 'standard')) {
      const risen = median(rs.map((r) => r.story.trustRoseInCycle1));
      const ok = risen >= 1;
      if (start !== 'mon') {
        lines.push(`standard (${start}, reported only): ${risen} villages risen`);
        continue;
      }
      pass = (pass ?? true) && ok;
      lines.push(
        `standard (mon, median of ${rs.length}): ${risen} ${risen === 1 ? 'village' : 'villages'} risen by the end of cycle 1 ${ok ? '✓' : '✗'}`,
      );
    }
    return { id: target.id, text: target.text, pass, lines };
  },
};
