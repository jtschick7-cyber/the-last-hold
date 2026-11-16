import { COSMETIC_IDS, type CosmeticId } from '../../content/delves/shop';
import { COURTYARD_MARK_IDS, type CourtyardMarkId } from '../../content/courtyard-marks';
import { newCosmeticsState, type CosmeticsState } from '../state/cosmetics-state';
import { arr, bool, obj, str } from './guards';

const isKnownMark = (k: string): k is CourtyardMarkId =>
  (COURTYARD_MARK_IDS as readonly string[]).includes(k);

const isKnownCosmetic = (k: string): k is CosmeticId =>
  (COSMETIC_IDS as readonly string[]).includes(k);

/** Parses `state.cosmetics`, defaulting silently when absent on pre-T18.5 saves. */
export const cosmeticsFrom = (v: unknown, warnings: string[]): CosmeticsState => {
  if (v === undefined) return newCosmeticsState();
  const o = obj(v, 'cosmetics');
  const marks: Partial<Record<CourtyardMarkId, boolean>> = {};
  if (o.marks !== undefined) {
    const rawMarks = obj(o.marks, 'cosmetics.marks');
    for (const [key, val] of Object.entries(rawMarks)) {
      if (!isKnownMark(key)) {
        warnings.push(`Dropped unknown cosmetics.marks entry "${key}".`);
        continue;
      }
      marks[key] = bool(val, `cosmetics.marks.${key}`);
    }
  }
  const hidden: CosmeticId[] = [];
  if (o.hidden !== undefined) {
    const rawHidden = arr(o.hidden, 'cosmetics.hidden');
    for (let i = 0; i < rawHidden.length; i += 1) {
      const id = str(rawHidden[i], `cosmetics.hidden[${i}]`);
      if (!isKnownCosmetic(id)) {
        warnings.push(`Dropped unknown cosmetics.hidden entry "${id}".`);
        continue;
      }
      if (!hidden.includes(id)) hidden.push(id);
    }
  }
  return { marks, hidden };
};
