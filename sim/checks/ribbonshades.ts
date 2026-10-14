import { STORY, TIME_TARGETS } from '../targets';
import type { RunResult } from '../run';
import { groups, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 "Ribbonshade names" (v0.5, D168): all six found by the end of cycle 3, judged on the
// median over the Monday Standard seeds of the cycle the sixth was found in.
const target = TIME_TARGETS.find((t) => t.id === 'ribbonshades');
if (!target) throw new Error('targets.ts has no "ribbonshades" row');

/** The cycle the last of the six names was found in; infinite if one is missing. */
const doneIn = (run: RunResult): number =>
  Math.max(
    ...STORY.ribbonNames.map(
      (n) => run.story.names.find((x) => x.n === n)?.cycle ?? Number.POSITIVE_INFINITY,
    ),
  );

export const ribbonshadesCheck: Check = {
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs))
      return { id: target.id, text: target.text, pass: null, lines: ['not in the fast set'] };
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const [start, rs] of groups(runs, 'standard')) {
      const c = median(rs.map(doneIn));
      const ok = c <= STORY.ribbonsByCycle;
      const shown = Number.isFinite(c) ? `cycle ${c}` : 'never';
      if (start !== 'mon') {
        lines.push(`standard (${start}, reported only): all six by ${shown}`);
        continue;
      }
      pass = (pass ?? true) && ok;
      lines.push(`standard (mon, median of ${rs.length}): all six by ${shown} ${ok ? '✓' : '✗'}`);
    }
    return { id: target.id, text: target.text, pass, lines };
  },
};
