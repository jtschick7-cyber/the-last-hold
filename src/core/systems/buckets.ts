import type { BalanceKey } from '../../content/balance';
import { BUCKET_IDS, type BucketId } from '../../content/buckets';
import type { Breakdown, Explained } from '../breakdown/breakdown';

// GDD §5.0: final = base × Π over buckets of (1 + Σ bonuses in that bucket).
export interface Bonus {
  readonly bucket: BucketId;
  readonly label: string;
  readonly value: number;
  readonly key?: BalanceKey;
}

/**
 * Applies the bonuses in `allowed` buckets (all by default) to `base`.
 * Bonuses in other buckets are ignored; that is how silver stays capped (G1).
 */
export const applyBuckets = (
  base: Breakdown,
  bonuses: readonly Bonus[],
  allowed: readonly BucketId[] = BUCKET_IDS,
): Explained => {
  let value = base.value;
  const children: Breakdown[] = [base];
  for (const bucket of BUCKET_IDS) {
    if (!allowed.includes(bucket)) continue;
    const inBucket = bonuses.filter((b) => b.bucket === bucket);
    if (inBucket.length === 0) continue;
    const sum = inBucket.reduce((s, b) => s + b.value, 0);
    value *= 1 + sum;
    children.push({
      label: `${bucket} bucket`,
      value: 1 + sum,
      formula: '1 + Σ bonuses',
      bucket,
      children: inBucket.map((b) => ({ label: b.label, value: b.value, bucket, key: b.key })),
    });
  }
  return {
    value,
    breakdown: { label: base.label, value, formula: 'base × Π (1 + Σ bucket)', children },
  };
};
