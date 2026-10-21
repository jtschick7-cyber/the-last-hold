import { STORY, TIME_TARGETS } from '../targets';
import { groups, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v0.9, D383): the Dross-Tide stand probe. In the stands made once Act VI has begun, judged
// on the median over the Monday Standard seeds (Saturday is reported only, D62): the waves held reach
// the Held band, and the real result falls inside the preview's 10th–90th range often enough.
const target = TIME_TARGETS.find((x) => x.id === 'dross-tide-stand');
if (!target) throw new Error('targets.ts has no "dross-tide-stand" row');

export const drossProbeCheck: Check = {
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs))
      return { id: target.id, text: target.text, pass: null, lines: ['not in the fast set'] };
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const [start, rs] of groups(runs, 'standard')) {
      const stands = rs.map((r) => r.drossStands ?? []);
      const waves = median(stands.map((s) => (s.length ? median(s.map((x) => x.waves)) : 0)));
      const share = median(
        stands.map((s) =>
          s.length ? s.filter((x) => x.waves >= x.p10 && x.waves <= x.p90).length / s.length : 0,
        ),
      );
      const count = stands.reduce((n, s) => n + s.length, 0);
      const ok =
        count > 0 &&
        waves >= STORY.drossProbe.heldWaves &&
        share >= STORY.drossProbe.previewAgreeShare;
      const text = `${count} Dross-Tide stands; median waves ${waves} (Held is ${STORY.drossProbe.heldWaves}+), real result inside the preview range in ${(share * 100).toFixed(0)}% (needs ${(STORY.drossProbe.previewAgreeShare * 100).toFixed(0)}%)`;
      if (start !== 'mon') {
        lines.push(`standard (${start}, reported only): ${text}`);
        continue;
      }
      pass = (pass ?? true) && ok;
      lines.push(`standard (mon, median of ${rs.length}): ${text} ${ok ? '✓' : '✗'}`);
    }
    return { id: target.id, text: target.text, pass, lines };
  },
};
