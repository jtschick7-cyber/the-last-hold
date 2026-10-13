import { prepProbe, type PrepCase } from '../prep-probe';
import { ENGAGEMENT } from '../targets';
import type { Check } from './types';

// GDD §6.3 #4: on identified contracts at equal tier, matched preparation raises the odds
// by at least 15 points over no preparation (sim/targets.ts). Judged per tier, over the
// probe's cases where the odds without preparation leave room for it to matter. A tier
// with fewer than MIN_CASES such cases is reported, not judged.
const { text, minPoints, enforcedFrom } = ENGAGEMENT.preparationMatters;
const MIN_CASES = 8;
const FULL_RUN_DAYS = 14;

export const makePreparationMattersCheck = (probeOf: () => PrepCase[]): Check => ({
  id: 'preparation-matters',
  enforcedFrom,
  judge: (runs) => {
    // Only the full suite pays for the probe; the fast set runs three days.
    if (!runs.some((r) => r.spec.days >= FULL_RUN_DAYS))
      return { id: 'preparation-matters', text, pass: null, lines: ['needs the full suite'] };
    const cases = probeOf();
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const tier of [1, 2, 3, 4, 5]) {
      const here = cases.filter((c) => c.tier === tier);
      if (here.length === 0) {
        lines.push(`tier ${tier}: no case where preparation has room to matter`);
        continue;
      }
      const gain = (here.reduce((s, c) => s + (c.prepared - c.bare), 0) / here.length) * 100;
      const judged = here.length >= MIN_CASES;
      const ok = gain >= minPoints;
      if (judged) pass = (pass ?? true) && ok;
      lines.push(
        `tier ${tier}: +${gain.toFixed(1)} points over ${here.length} cases ` +
          `(${((here.reduce((s, c) => s + c.bare, 0) / here.length) * 100).toFixed(0)}% → ` +
          `${((here.reduce((s, c) => s + c.prepared, 0) / here.length) * 100).toFixed(0)}%) ` +
          `${judged ? (ok ? '✓' : '✗') : '(too few)'}`,
      );
    }
    return { id: 'preparation-matters', text, pass, lines };
  },
});

export const preparationMattersCheck: Check = makePreparationMattersCheck(prepProbe);
