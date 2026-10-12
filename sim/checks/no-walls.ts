import { ENGAGEMENT } from '../targets';
import { engagementWindow, everyStandardRun, hoursText } from './helpers';
import type { Check } from './types';

// GDD §6.3 #3: no purchase takes more than 3 check-ins of saving; Age-ups up
// to 5. Saving is a run of check-ins without a purchase, judged by what ends
// it: an Age-up allows 5, anything else 3 (D60).
const { text, maxSaving, maxSavingAgeUp, enforcedFrom } = ENGAGEMENT.noWalls;

export const noWallsCheck: Check = {
  id: 'no-walls',
  enforcedFrom,
  judge: (runs) =>
    everyStandardRun(runs, 'no-walls', text, (run) => {
      let streak = 0;
      const walls: string[] = [];
      for (const c of engagementWindow(run)) {
        if (c.purchases === 0) {
          streak += 1;
          continue;
        }
        if (streak > (c.agedUp ? maxSavingAgeUp : maxSaving)) {
          walls.push(
            `${streak} before ${c.agedUp ? 'the Age-up' : 'a purchase'} at ${hoursText(c.hours)}`,
          );
        }
        streak = 0;
      }
      if (streak > maxSaving) walls.push(`${streak} at the end, still saving`);
      return { ok: walls.length === 0, detail: walls.length ? walls.join('; ') : 'none' };
    }),
};
