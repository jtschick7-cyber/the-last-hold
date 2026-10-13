import { ENGAGEMENT } from '../targets';
import { hoursText } from './helpers';
import type { Check } from './types';

// GDD §6.3 #5: at least 70% of the silver earned from the Rank-up on comes from
// bounties; the Silver Seams are capped (G1), so contracts must become the main
// source. Judged on every Standard run that reached the Keep, over cycle 1's stretch from
// the Keep; later cycles restart at tier 1 and are reported only (D135).
const { text, minShare, enforcedFrom } = ENGAGEMENT.contractsOwnSilver;

export const contractsOwnSilverCheck: Check = {
  id: 'contracts-own-silver',
  enforcedFrom,
  judge: (runs) => {
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const r of runs.filter(
      (x) => x.spec.policy === 'standard' && x.spec.days >= ENGAGEMENT.contractsOwnSilver.minDays,
    )) {
      if (r.moments.keep === null) {
        pass = false;
        lines.push(`${r.spec.start} ${r.spec.seed}: never reached the Keep ✗`);
        continue;
      }
      const { bountySilver, jobSilver } =
        r.keepPhase.byCycle.find((c) => c.cycle === 1) ?? r.keepPhase;
      const share = bountySilver / Math.max(1e-9, bountySilver + jobSilver);
      const ok = share >= minShare;
      pass = (pass ?? true) && ok;
      lines.push(
        `${r.spec.start} ${r.spec.seed}: ${(share * 100).toFixed(1)}% from bounties ` +
          `(${Math.round(bountySilver)} of ${Math.round(bountySilver + jobSilver)} silver from the Keep on, cycle 1; first Keep at ${hoursText(r.moments.keep)}) ${ok ? '✓' : '✗'}` +
          `${r.keepPhase.byCycle.length > 1 ? ` [${r.keepPhase.byCycle.map((c) => `cycle ${c.cycle} ${((c.bountySilver / Math.max(1e-9, c.bountySilver + c.jobSilver)) * 100).toFixed(0)}%`).join(', ')}]` : ''}`,
      );
    }
    return { id: 'contracts-own-silver', text, pass, lines };
  },
};
