import type { BalanceKey } from '../../content/balance';
import type { BucketId } from '../../content/buckets';

// Technical design §5.4 (GDD §5.0, D10): every derived number comes with the
// tree that explains it. Selectors build both in the same function, so the
// number and its explanation can't disagree.
export interface Breakdown {
  readonly label: string;
  readonly value: number;
  readonly formula?: string;
  readonly bucket?: BucketId;
  readonly key?: BalanceKey;
  readonly children?: readonly Breakdown[];
}

/** A value together with the breakdown that produced it. */
export interface Explained<T = number> {
  readonly value: T;
  readonly breakdown: Breakdown;
}
