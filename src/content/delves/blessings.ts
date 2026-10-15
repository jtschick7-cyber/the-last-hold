import type { BlessingDef } from './blessing-types';
import { drownedBellBlessings } from './blessings-drowned-bell';
import { hearthCroneBlessings } from './blessings-hearth-crone';
import { paleSmithBlessings } from './blessings-pale-smith';
import { unlitBlessings } from './blessings-unlit';
import { weaverBlessings } from './blessings-weaver';
import { wolfBlessings } from './blessings-wolf';
import type { PatronId } from './patrons';

// GDD §8.8 (D255): 48 blessings, 8 per patron (4 Faint, 3 Warm, 1 Bright). Content outside
// the saved-state id lists until T7.5 (D171): the run stores blessing ids as plain strings.

export const blessings: readonly BlessingDef[] = [
  ...paleSmithBlessings,
  ...weaverBlessings,
  ...wolfBlessings,
  ...hearthCroneBlessings,
  ...drownedBellBlessings,
  ...unlitBlessings,
];

export const blessingById = (id: string): BlessingDef | undefined =>
  blessings.find((b) => b.id === id);

export const blessingsOf = (patron: PatronId): readonly BlessingDef[] =>
  blessings.filter((b) => b.patron === patron);
