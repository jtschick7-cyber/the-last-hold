import { ENGAGEMENT } from '../targets';
import type { Check } from './types';

// GDD §6.3 #8: from the Rank-up on, contract provisions take 20–40% of the food
// the jobs make, so food stays a real cost after the settling years.
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
      const { provisionsFood, jobFood } = r.keepPhase;
      const share = provisionsFood / Math.max(1e-9, jobFood);
      const ok = share >= minShare && share <= maxShare;
      pass = (pass ?? true) && ok;
      lines.push(
        `${r.spec.start} ${r.spec.seed}: provisions ${(share * 100).toFixed(1)}% of food income ${ok ? '✓' : '✗'}`,
      );
    }
    // Q9: the 20–40% target can't be met by tuning: provisions are about 0.2% of food income.
    return { id: 'provisions-matter', text, pass, lines, pending: 'Q9' };
  },
};
