import type { DocumentDef } from './documents';

// lore-secrets §31 (v0.9 flesh-out, D364, D386): Act VI, The Unlit. Witness: the Unlit, through the
// frost it writes on the Hearth Hall floor by the crack, with Pechko beside it. The machinery
// (plan T9.10) is here; the ten documents arrive word for word from OUT-3 in T9.11. Act VI carries
// exactly the names #1 to #3 and no other, and nobody in it says the names aloud.

/** Act VI's arrival lines (lore §31): the new-warden sheet as Act VI begins, and on load (D246). */
export const act6Arrival =
  'Ilse is back from Velkvik with the archive. Pechko is sitting by the crack behind the stove, and the frost on the floor has shapes in it.';
export const act6ArrivalOnLoad =
  'Pechko is sitting by the crack when you come in. The frost on the floor has shapes in it.';

/** How a Rime shows on the away sheet and in results, and on the Rank-up sheet (lore §31, D364). */
export const rimeLine = (heading: string): string =>
  `There is new writing in the rime by the crack: '${heading}'.`;

export const act6Documents: readonly DocumentDef[] = [];
