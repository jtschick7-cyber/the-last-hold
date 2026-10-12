import type { BuildingId } from '../../content/buildings';
import type { JobId } from '../../content/jobs';
import type { Settings } from '../state/game-state';

// Technical design §4.3: every player action is a plain JSON Command, applied
// through apply(). The UI, the simulator and the debug panel all use these.
export type Command =
  /** Count buildings: a number of copies, or the most affordable ("Max"). */
  | { type: 'build.buy'; building: BuildingId; count: number | 'max' }
  /** Level buildings: the next level. */
  | { type: 'build.upgrade'; building: BuildingId }
  | { type: 'peasants.add'; job: JobId }
  | { type: 'peasants.remove'; job: JobId }
  /** Moves as many idle peasants into the job as its free slots allow. */
  | { type: 'peasants.fill'; job: JobId }
  | { type: 'peasants.autoSettle'; on: boolean }
  | { type: 'peasants.priority'; order: JobId[] }
  | { type: 'age.up' }
  | { type: 'settings.set'; patch: Partial<Settings> };

export type ApplyResult = { ok: true } | { ok: false; reason: string };

export const ok: ApplyResult = { ok: true };
export const refuse = (reason: string): ApplyResult => ({ ok: false, reason });
