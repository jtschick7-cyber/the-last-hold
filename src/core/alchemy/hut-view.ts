import type { ConsumableId, Recipe } from '../../content/consumables';
import { INGREDIENT_IDS, ingredients, type IngredientId } from '../../content/ingredients';
import { ingredientProperties } from '../../content/properties';
import { RESOURCE_IDS } from '../../content/resources';
import type { GameState } from '../state/game-state';
import { hiddenIndexes, isRevealed, propertiesFound, PROPERTIES_TOTAL } from './book';

// GDD §9.9 (v0.6): what the Hut's Brew, Experiment and Book sections show. The UI reads
// these and decides nothing: which recipes are known, what is missing, what is hidden.

/** What a recipe still lacks, in words, or null when the stores and the hold can pay it. */
export const recipeShortfall = (state: GameState, recipe: Recipe): string | null => {
  for (const id of INGREDIENT_IDS) {
    const need = recipe.ingredients[id] ?? 0;
    if (state.stores[id] < need)
      return `needs ${ingredients[id].name.toLowerCase()} (have ${Math.floor(state.stores[id])})`;
  }
  for (const r of RESOURCE_IDS)
    if (state.resources[r] < (recipe.resources[r] ?? 0)) return `needs ${r}`;
  return null;
};

/** A recipe as words: "2 grave dust · 1 juniper · 1 wood". */
export const recipeWords = (recipe: Recipe): string =>
  [
    ...INGREDIENT_IDS.flatMap((id) => {
      const n = recipe.ingredients[id] ?? 0;
      return n > 0 ? [`${n} ${ingredients[id].name.toLowerCase()}`] : [];
    }),
    ...RESOURCE_IDS.flatMap((r) =>
      (recipe.resources[r] ?? 0) > 0 ? [`${recipe.resources[r]} ${r}`] : [],
    ),
  ].join(' · ');

/** One row of the book's grid: an ingredient and what its three properties show (null = hidden). */
export interface BookRow {
  readonly ingredient: IngredientId;
  readonly slots: readonly [ConsumableId | null, ConsumableId | null, ConsumableId | null];
}

export const bookRows = (state: GameState): BookRow[] =>
  INGREDIENT_IDS.map((id) => ({
    ingredient: id,
    slots: ingredientProperties[id].map((p, i) => (isRevealed(state, id, i) ? p.brew : null)) as [
      ConsumableId | null,
      ConsumableId | null,
      ConsumableId | null,
    ],
  }));

export const bookCount = (state: GameState): { found: number; total: number } => ({
  found: propertiesFound(state),
  total: PROPERTIES_TOTAL,
});

/** How many of an ingredient's properties the book does not show yet. */
export const hiddenCount = (state: GameState, ingredient: IngredientId): number =>
  hiddenIndexes(state, ingredient).length;

/** Pairs already tried, as ingredient pairs in list order. */
export const triedPairs = (state: GameState): [IngredientId, IngredientId][] =>
  state.book.tried.flatMap((k) => {
    const [a, b] = k.split('+') as [IngredientId, IngredientId];
    return a && b && ingredients[a] && ingredients[b]
      ? [[a, b] as [IngredientId, IngredientId]]
      : [];
  });

/** The words for an experiment that finished: "Yarrow and juniper showed: …" and "Discovered: …". */
export const experimentLines = (
  brewName: (id: ConsumableId) => string,
  e: {
    a: IngredientId;
    b: IngredientId;
    revealed: readonly { ingredient: IngredientId; index: number }[];
    discovered: readonly ConsumableId[];
  },
): string[] => {
  const pair = `${ingredients[e.a].name} and ${ingredients[e.b].name}`;
  const shown = e.revealed.flatMap((r) => {
    const brew = ingredientProperties[r.ingredient][r.index]?.brew;
    return brew ? [`${ingredients[r.ingredient].name.toLowerCase()}: ${brewName(brew)}`] : [];
  });
  return [
    shown.length > 0 ? `${pair} showed ${shown.join(', ')}.` : `${pair} showed nothing new.`,
    ...e.discovered.map((d) => `Discovered: ${brewName(d)}.`),
  ];
};
