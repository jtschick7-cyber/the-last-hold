import type { Migration } from './migrations';

// v14 → v15 (plan TB.2, D585, technical design §9.4): the stand's lane table. Only the number
// moves: no field is added and no past stand record gets `lanes` (absent means the version 5
// rules), so every golden fight and recorded stand replays as before. `HoldLayoutState` is
// untouched.
export const v14ToV15: Migration = (state) => structuredClone(state);
