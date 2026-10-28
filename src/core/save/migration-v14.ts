import { newDescentState } from '../state/descent-state';
import type { Migration } from './migrations';

// v13 → v14 (plan TD.2, D562, technical design §9.4): the Descent's block. A migrated save has had
// no Descent; nothing else changes (`remembering.endings`, `vigil`, `orders` and every
// cycle record stay as they are), so every golden fight and recorded stand replays as before and
// `rulesVersion` stays 5.
export const v13ToV14: Migration = (state) => ({
  ...structuredClone(state),
  descent: newDescentState(),
});
