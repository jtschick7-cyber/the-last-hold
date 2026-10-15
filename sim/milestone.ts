import type { Milestone } from './targets';

// The milestone being built: the simulator enforces the rows of `targets.ts`
// whose "Enforced from" it has reached. Moves forward when a milestone starts.
export const CURRENT_MILESTONE: Milestone = 'v0.8';

/** Technical design §11.2: the fast set runs through this milestone's last time target. */
export const FAST_UNTIL_TARGETS = [
  'first-tier-3',
  'first-identified',
  'first-studied',
  // v0.4 (D130): joined once tuning put them on target (T4.15).
  'citadel',
  'bastion',
  // v0.5 (D188): joined once tuning put it on target (T5.16).
  'first-ruin',
] as const;
