import type { AgeId } from './ages';
import type { BuildingId } from './buildings';
import { DEFAULT_JOB_PRIORITY, type JobId } from './jobs';
import type { ResourceId } from './resources';

// GDD §5.1.4: the starting state. Tunable per D44; if the Opening policy misses
// its first-Mine target, raise starting wood to 70 rather than move the target.
export interface StartDef {
  readonly age: AgeId;
  readonly resources: Readonly<Record<ResourceId, number>>;
  readonly buildings: Readonly<Partial<Record<BuildingId, number>>>;
  /** Starting peasants by job; their sum is the starting peasant count. */
  readonly jobs: Readonly<Record<JobId, number>>;
  readonly autoSettle: boolean;
  readonly jobPriority: readonly JobId[];
}

export const start: StartDef = {
  age: 'hamlet',
  resources: { food: 50, wood: 50, iron: 0, silver: 0 },
  buildings: { 'hearth-hall': 1, farm: 1, 'woodcutters-camp': 1 },
  jobs: { farmer: 1, woodcutter: 2, miner: 0, 'silver-digger': 0 },
  autoSettle: true,
  jobPriority: DEFAULT_JOB_PRIORITY,
};
