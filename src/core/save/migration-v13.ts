import type { Migration } from './migrations';

// v12 → v13 (plan KV.2, D543, technical design §9.4): Rising Vigil's block. A migrated save has
// the switch Off and no stand fought On; no stand record gets a `vigilLevel` (absent means 0), so
// every golden fight and recorded stand replays as before and `rulesVersion` stays 5.
export const v12ToV13: Migration = (state) => ({
  ...structuredClone(state),
  vigil: { on: false, stands: 0 },
});
