import type { LocationId } from './damage';
import type { IngredientId } from './ingredients';

// GDD §8.2 and setting-primer §3: the five contract-giving villages, with their
// heads. A contract's location tag comes from its village. Trust is kept silent
// (setting-primer §3). Each success also gives one gift reagent (GDD §8.2, v0.3).

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
  /** Gift reagents; one of these comes with each success (GDD §8.2). */
  readonly gifts: readonly IngredientId[];
}

export const villages: Readonly<Record<VillageId, VillageDef>> = {
  'dubno-ford': {
    id: 'dubno-ford',
    name: 'Dubno Ford',
    band: 'lowlands',
    region: 'Lowland river crossing',
    locations: ['river', 'field'],
    head: { name: 'Marta Dubska', title: 'Headwoman' },
    gifts: ['honeycomb', 'hares-foot'],
  },
  'kozly-hollow': {
    id: 'kozly-hollow',
    name: 'Kozly Hollow',
    band: 'lowlands',
    region: 'Lowland goatherd village in the old wood',
    locations: ['forest', 'field', 'ruin'],
    head: { name: 'Bohdan Kozel', title: 'Headman' },
    gifts: ['honeycomb', 'pitch'],
  },
  mirograd: {
    id: 'mirograd',
    name: 'Mirograd',
    band: 'lowlands',
    region: 'Lowland market town (the largest)',
    locations: ['field', 'river'],
    head: { name: 'Ilona Sváteková', title: 'Headwoman' },
    gifts: ['hares-foot', 'pitch'],
  },
  velkvik: {
    id: 'velkvik',
    name: 'Velkvik',
    band: 'fells',
    region: 'Highland fjord village',
    locations: ['river', 'barrow', 'ruin'],
    head: { name: 'Gunnar Ravnsson', title: 'Thane' },
    gifts: ['rime-salt', 'pitch', 'noon-poppy'], // noon poppy: Q19, D239
  },
  ravenfell: {
    id: 'ravenfell',
    name: 'Ravenfell',
    band: 'fells',
    region: 'Highland hamlet among the barrow-hills',
    locations: ['barrow', 'forest', 'ruin'],
    head: { name: 'Sólveig Arnadóttir', title: 'Thane' },
    gifts: ['rime-salt'],
  },
};

// GDD §8.2 (v0.5, D157): the villages whose tags include ruin. Like barrows, ruins
// are never generated in the Hamlet or at tier 1 (core/contracts/board.ts).
export const RUIN_VILLAGES: readonly VillageId[] = ['kozly-hollow', 'velkvik', 'ravenfell'];
