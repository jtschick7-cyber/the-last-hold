import type { BalanceKey } from './balance';
import type { ResourceId } from './resources';

// GDD §5.1.1: each peasant is idle or works one job. Slots come from buildings
// (see buildings.ts); the base rate is a balance constant.
export const JOB_IDS = ['farmer', 'woodcutter', 'miner', 'silver-digger'] as const;
export type JobId = (typeof JOB_IDS)[number];

export interface JobDef {
  readonly id: JobId;
  readonly name: string;
  readonly produces: ResourceId;
  readonly rateKey: BalanceKey;
}

export const jobs: Readonly<Record<JobId, JobDef>> = {
  farmer: { id: 'farmer', name: 'Farmer', produces: 'food', rateKey: 'rate.food' },
  woodcutter: { id: 'woodcutter', name: 'Woodcutter', produces: 'wood', rateKey: 'rate.wood' },
  miner: { id: 'miner', name: 'Miner', produces: 'iron', rateKey: 'rate.iron' },
  'silver-digger': {
    id: 'silver-digger',
    name: 'Silver-digger',
    produces: 'silver',
    rateKey: 'rate.silver',
  },
};

// GDD §5.1.1: new peasants take the first open slot in this order by default.
export const DEFAULT_JOB_PRIORITY: readonly JobId[] = [
  'farmer',
  'woodcutter',
  'miner',
  'silver-digger',
];
