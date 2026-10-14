// GDD §8.6: the 12 ingredients. Herbs grow in the Herb Garden; gift reagents come
// from villages (villages.ts); monster reagents are drops (monsters.ts). The four
// hidden effects each ingredient has arrive with alchemy discovery in v0.6.

export const INGREDIENT_IDS = [
  'yarrow',
  'mugwort',
  'juniper',
  'honeycomb',
  'hares-foot',
  'pitch',
  'rime-salt',
  'grave-dust',
  'river-pearl',
  'thornwood',
  'wolf-fang',
  'noon-poppy',
] as const;
export type IngredientId = (typeof INGREDIENT_IDS)[number];

export type IngredientSource = 'herb-garden' | 'village-gift' | 'monster-drop';

export interface IngredientDef {
  readonly id: IngredientId;
  readonly name: string;
  readonly source: IngredientSource;
}

export const ingredients: Readonly<Record<IngredientId, IngredientDef>> = {
  yarrow: { id: 'yarrow', name: 'Yarrow', source: 'herb-garden' },
  mugwort: { id: 'mugwort', name: 'Mugwort', source: 'herb-garden' },
  juniper: { id: 'juniper', name: 'Juniper', source: 'herb-garden' },
  honeycomb: { id: 'honeycomb', name: 'Honeycomb', source: 'village-gift' },
  'hares-foot': { id: 'hares-foot', name: "Hare's foot", source: 'village-gift' },
  pitch: { id: 'pitch', name: 'Pitch', source: 'village-gift' },
  // Gift from Velkvik and Ravenfell, and a Draugr drop: it has two sources.
  'rime-salt': { id: 'rime-salt', name: 'Rime salt', source: 'village-gift' },
  'grave-dust': { id: 'grave-dust', name: 'Grave dust', source: 'monster-drop' },
  'river-pearl': { id: 'river-pearl', name: 'River pearl', source: 'monster-drop' },
  thornwood: { id: 'thornwood', name: 'Thornwood', source: 'monster-drop' },
  'wolf-fang': { id: 'wolf-fang', name: 'Wolf fang', source: 'monster-drop' },
  // A Poludnitsa drop, and (Q19, D239) a Velkvik gift, so the book can be finished: it has two sources.
  'noon-poppy': { id: 'noon-poppy', name: 'Noon poppy', source: 'village-gift' },
};

/** The three herbs the Herb Garden grows (GDD §5.7). */
export const HERB_IDS = ['yarrow', 'mugwort', 'juniper'] as const satisfies readonly IngredientId[];
