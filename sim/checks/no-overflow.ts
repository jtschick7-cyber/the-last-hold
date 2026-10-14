import { ENGAGEMENT } from '../targets';
import type { Check } from './types';

// GDD §6.3 #7 (D114): every number stays below 1e300 through 3 simulated cycles (through
// v0.3 it was 14 simulated days). Judged on the runs that went on for 3 Long Nights.
const { text, limit, cycles, enforcedFrom } = ENGAGEMENT.noOverflow;

export const noOverflowCheck: Check = {
  id: 'no-overflow',
  enforcedFrom,
  judge: (runs) => {
    const long = runs.filter((r) => r.spec.minCycles !== undefined && r.spec.stopAt === undefined);
    if (long.length === 0) {
      return {
        id: 'no-overflow',
        text,
        pass: null,
        lines: [`needs runs through ${cycles} cycles`],
      };
    }
    const short = long.filter((r) => r.cyclesDone < cycles);
    const worst = long.reduce((m, r) => Math.max(m, r.largestNumber), 0);
    const ok = short.length === 0 && worst < limit && Number.isFinite(worst);
    return {
      id: 'no-overflow',
      text,
      pass: ok,
      lines: [
        `largest number over ${long.length} runs: ${worst.toExponential(3)} ${worst < limit ? '✓' : '✗'}`,
        ...short.map(
          (r) =>
            `${r.spec.start} ${r.spec.seed}: only ${r.cyclesDone} of ${cycles} cycles by day ${r.spec.maxDays ?? r.spec.days} ✗`,
        ),
      ],
    };
  },
};
