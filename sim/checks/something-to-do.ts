import { ENGAGEMENT } from '../targets';
import { busy, engagementWindow, everyStandardRun } from './helpers';
import type { Check } from './types';

// GDD §6.3 #1: at least 90% of Standard check-ins include a meaningful action.
const { text, minShare, enforcedFrom } = ENGAGEMENT.somethingToDo;

export const somethingToDoCheck: Check = {
  id: 'something-to-do',
  enforcedFrom,
  judge: (runs) =>
    everyStandardRun(runs, 'something-to-do', text, (run) => {
      const window = engagementWindow(run);
      const share = window.filter(busy).length / Math.max(1, window.length);
      return {
        ok: share >= minShare,
        detail: `${(share * 100).toFixed(0)}% of ${window.length} check-ins`,
      };
    }),
};
