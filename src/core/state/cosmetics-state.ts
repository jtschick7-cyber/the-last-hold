import type { CosmeticId } from '../../content/delves/shop';
import type { CourtyardMarkId } from '../../content/courtyard-marks';

/** Any customizable Hold Look item: a bought shop cosmetic or an earned Courtyard Mark. */
export type HoldCosmeticId = CourtyardMarkId | CosmeticId;

/**
 * Permanent cross-reset Hold Look state (v16+, GDD §9.26, D622).
 * `marks[id]` is omitted until unlocked (`true` = visible, `false` = hidden).
 * `hidden` lists bought `COSMETIC_IDS` toggled off. Kept whole through the Long Night.
 */
export interface CosmeticsState {
  marks: Partial<Record<CourtyardMarkId, boolean>>;
  hidden: CosmeticId[];
}

export const newCosmeticsState = (): CosmeticsState => ({
  marks: {},
  hidden: [],
});
