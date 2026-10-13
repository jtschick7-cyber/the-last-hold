// GDD §5.0: every percentage bonus belongs to one bucket. Bonuses add within a
// bucket and multiply across buckets, in this order.
export const BUCKET_IDS = [
  'building',
  'age',
  'trophy',
  'knowledge',
  'ember',
  'relic',
  'event',
] as const;
export type BucketId = (typeof BUCKET_IDS)[number];

// GDD §5.1.1 (G1, D30): silver-digger output takes only these buckets.
export const SILVER_BUCKETS: readonly BucketId[] = ['relic', 'event'];
