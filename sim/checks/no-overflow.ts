import { ENGAGEMENT } from '../targets';
import type { Check } from './types';

// GDD §6.3 #7: every number stays below 1e300 over 14 simulated days (through v0.3).
const { text, limit, days, enforcedFrom } = ENGAGEMENT.noOverflow;

export const noOverflowCheck: Check = {
  id: 'no-overflow',
  enforcedFrom,
  judge: (runs) => {
    const long = runs.filter((r) => r.spec.days >= days && !r.spec.stopAtKeep);
    if (long.length === 0) {
      return { id: 'no-overflow', text, pass: null, lines: [`needs ${days}-day runs`] };
    }
    const worst = long.reduce((m, r) => Math.max(m, r.largestNumber), 0);
    const ok = worst < limit && Number.isFinite(worst);
    return {
      id: 'no-overflow',
      text,
      pass: ok,
      lines: [
        `largest number over ${long.length} runs: ${worst.toExponential(3)} ${ok ? '✓' : '✗'}`,
      ],
    };
  },
};
