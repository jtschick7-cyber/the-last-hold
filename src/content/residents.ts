// setting-primer §5: the hold's residents who speak in v0.1.
export const RESIDENT_IDS = ['brana', 'pechko'] as const;
export type ResidentId = (typeof RESIDENT_IDS)[number];

export interface ResidentDef {
  readonly id: ResidentId;
  readonly name: string;
  /** How lines are signed in the UI. */
  readonly shortName: string;
  readonly role: string;
}

export const residents: Readonly<Record<ResidentId, ResidentDef>> = {
  brana: { id: 'brana', name: 'Brana Kolar', shortName: 'Brana', role: 'Steward' },
  pechko: { id: 'pechko', name: 'Pechko', shortName: 'Pechko', role: 'Domovoi' },
};
