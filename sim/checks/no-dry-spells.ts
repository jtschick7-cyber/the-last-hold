import { ENGAGEMENT } from '../targets';
import { busy, engagementWindow, everyStandardRun, hoursText } from './helpers';
import type { Check } from './types';

// GDD §6.3 #2: never 2 consecutive check-ins with nothing to do.
const { text, maxConsecutiveEmpty, enforcedFrom } = ENGAGEMENT.noDrySpells;

export const noDrySpellsCheck: Check = {
  id: 'no-dry-spells',
  enforcedFrom,
  judge: (runs) =>
    everyStandardRun(runs, 'no-dry-spells', text, (run) => {
      let streak = 0;
      let worst = 0;
      let worstAt = 0;
      for (const c of engagementWindow(run)) {
        streak = busy(c) ? 0 : streak + 1;
        if (streak > worst) [worst, worstAt] = [streak, c.hours];
      }
      return {
        ok: worst <= maxConsecutiveEmpty,
        detail:
          worst === 0 ? 'none empty' : `longest ${worst} in a row (ending ${hoursText(worstAt)})`,
      };
    }),
};
