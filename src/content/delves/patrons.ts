// GDD §8.8 and lore-secrets §13, §29: the five patrons of Delves and the Unlit, whose door
// stays locked until Act V's Last Stand (D257). They are the dead, never gods; they give
// "blessings", never "boons". Who each one was is a story secret and is not in the content.

export const PATRON_IDS = [
  'pale-smith',
  'weaver',
  'wolf',
  'hearth-crone',
  'drowned-bell',
  'unlit',
] as const;
export type PatronId = (typeof PATRON_IDS)[number];

export interface PatronDef {
  readonly id: PatronId;
  readonly name: string;
  /** Shown under the name on a door (GDD §9.15). */
  readonly theme: string;
  /** Door order for the simulated Delver's ties (D270): Hearth-Crone first. */
  readonly tieOrder: number;
  /** The Unlit's door is locked until Act V's Last Stand (D257). */
  readonly lockedUntilActFive: boolean;
}

export const patrons: Readonly<Record<PatronId, PatronDef>> = {
  'pale-smith': {
    id: 'pale-smith',
    name: 'The Pale Smith',
    theme: 'Craft, the old forge',
    tieOrder: 1,
    lockedUntilActFive: false,
  },
  weaver: {
    id: 'weaver',
    name: 'The Weaver',
    theme: 'Kinship, weaving',
    tieOrder: 3,
    lockedUntilActFive: false,
  },
  wolf: {
    id: 'wolf',
    name: 'The Wolf Beneath the Hill',
    theme: 'Hunger, fury',
    tieOrder: 2,
    lockedUntilActFive: false,
  },
  'hearth-crone': {
    id: 'hearth-crone',
    name: 'The Hearth-Crone',
    theme: 'Warmth, mending',
    tieOrder: 0,
    lockedUntilActFive: false,
  },
  'drowned-bell': {
    id: 'drowned-bell',
    name: 'The Drowned Bell',
    theme: 'Stillness, depth',
    tieOrder: 4,
    lockedUntilActFive: false,
  },
  unlit: {
    id: 'unlit',
    name: 'The Unlit',
    theme: 'Cold, forgetting',
    tieOrder: 5,
    lockedUntilActFive: true,
  },
};

/** The five patrons open from the first Delve, in the order the simulated Delver breaks ties (D270). */
export const OPEN_PATRON_IDS: readonly PatronId[] = PATRON_IDS.filter(
  (p) => !patrons[p].lockedUntilActFive,
);
