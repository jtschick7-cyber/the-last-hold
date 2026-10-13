import type { Milestone } from './targets';

// The milestone being built: the simulator enforces the rows of `targets.ts`
// whose "Enforced from" it has reached. Moves forward when a milestone starts.
export const CURRENT_MILESTONE: Milestone = 'v0.2';

/** Technical design §11.2: the fast set runs through this milestone's last time target. */
export const FAST_UNTIL_TARGET = 'first-tier-3' as const;
