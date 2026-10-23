import { canonicalLayout } from '../systems/layout-catalog';
import type { Migration } from './migrations';

// v11 → v12 (plan TL.1, D502, technical design §19.2): the Hold's layout blueprint. A migrated
// save gets the canonical layout, so every building the warden owns, and every one still to come,
// has its place. Nothing else changes, so every golden fight and recorded stand replays as
// before and `rulesVersion` stays 5.
export const v11ToV12: Migration = (state) => ({
  ...structuredClone(state),
  layout: canonicalLayout(),
});
