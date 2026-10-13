import type { LocationId } from './damage';

// GDD §8.2 and setting-primer §3: the five contract-giving villages, with their
// heads. A contract's location tag comes from its village. Trust is kept silent
// (setting-primer §3); gift reagents arrive in v0.3.

export const VILLAGE_IDS = [
  'dubno-ford',
  'kozly-hollow',
  'mirograd',
  'velkvik',
  'ravenfell',
] as const;
export type VillageId = (typeof VILLAGE_IDS)[number];

export interface VillageDef {
  readonly id: VillageId;
  readonly name: string;
  readonly band: 'lowlands' | 'fells';
  readonly region: string;
  readonly locations: readonly LocationId[];
  /** The village head's name and how they're addressed. */
  readonly head: { readonly name: string; readonly title: string };
}

export const villages: Readonly<Record<VillageId, VillageDef>> = {
  'dubno-ford': {
    id: 'dubno-ford',
    name: 'Dubno Ford',
    band: 'lowlands',
    region: 'Lowland river crossing',
    locations: ['river', 'field'],
    head: { name: 'Marta Dubska', title: 'Headwoman' },
  },
  'kozly-hollow': {
    id: 'kozly-hollow',
    name: 'Kozly Hollow',
    band: 'lowlands',
    region: 'Lowland goatherd village in the old wood',
    locations: ['forest', 'field'],
    head: { name: 'Bohdan Kozel', title: 'Headman' },
  },
  mirograd: {
    id: 'mirograd',
    name: 'Mirograd',
    band: 'lowlands',
    region: 'Lowland market town (the largest)',
    locations: ['field', 'river'],
    head: { name: 'Ilona Sváteková', title: 'Headwoman' },
  },
  velkvik: {
    id: 'velkvik',
    name: 'Velkvik',
    band: 'fells',
    region: 'Highland fjord village',
    locations: ['river', 'barrow'],
    head: { name: 'Gunnar Ravnsson', title: 'Thane' },
  },
  ravenfell: {
    id: 'ravenfell',
    name: 'Ravenfell',
    band: 'fells',
    region: 'Highland hamlet among the barrow-hills',
    locations: ['barrow', 'forest'],
    head: { name: 'Sólveig Arnadóttir', title: 'Thane' },
  },
};
