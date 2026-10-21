import type { Migration } from './migrations';

// v10 → v11 (plan T11.1, D452, D466, technical design §9.4): the ending's save block.
//
// `remembering` is added empty: nothing seen, nothing noted, no ending recorded. Nothing else
// changes (no Order, hunter, stand or story field is touched), so every golden fight and recorded
// stand replays as before and `rulesVersion` stays 5.
export const v10ToV11: Migration = (state) => ({
  ...structuredClone(state),
  remembering: { nearSeen: false, readyNoted: false, endings: [] },
});
