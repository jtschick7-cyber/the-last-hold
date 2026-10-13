import { ENGAGEMENT } from '../targets';
import type { Check } from './types';

// GDD §6.3 #8 (Q9, D81–D82): from the Rank-up on, contract provisions take 20–40% of the food
// the jobs make, so food stays a real cost after the settling years. Judged over cycle 1's
// stretch from the Keep; later cycles restart at tier 1 and are reported only (D135).
const { text, minShare, maxShare, enforcedFrom } = ENGAGEMENT.provisionsMatter;

export const provisionsMatterCheck: Check = {
  id: 'provisions-matter',
  enforcedFrom,
  judge: (runs) => {
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const r of runs.filter(
      (x) => x.spec.policy === 'standard' && x.spec.days >= 14 && x.moments.keep !== null,
    )) {
      const { provisionsFood, jobFood } =
        r.keepPhase.byCycle.find((c) => c.cycle === 1) ?? r.keepPhase;
      const share = provisionsFood / Math.max(1e-9, jobFood);
      const ok = share >= minShare && share <= maxShare;
      pass = (pass ?? true) && ok;
      lines.push(
        `${r.spec.start} ${r.spec.seed}: provisions ${(share * 100).toFixed(1)}% of food income in cycle 1 ${ok ? '✓' : '✗'}` +
          `${
            r.keepPhase.byCycle.length > 1
              ? ` [${r.keepPhase.byCycle
                  .filter((c) => c.jobFood >= 1) // a stretch the run ended in at once
                  .map(
                    (c) =>
                      `cycle ${c.cycle} ${((c.provisionsFood / Math.max(1e-9, c.jobFood)) * 100).toFixed(0)}%`,
                  )
                  .join(', ')}]`
              : ''
          }`,
      );
    }
    return { id: 'provisions-matter', text, pass, lines };
  },
};
