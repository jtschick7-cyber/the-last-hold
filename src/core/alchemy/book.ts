import {
  CONSUMABLE_IDS,
  consumables,
  type ConsumableId,
  type Recipe,
} from '../../content/consumables';
import { INGREDIENT_IDS, type IngredientId } from '../../content/ingredients';
import { ingredientProperties } from '../../content/properties';
import { pairKey, type PropertyIndex } from '../state/book-state';
import type { GameState } from '../state/game-state';

// GDD §5.8 (v0.6): the recipe book. Every ingredient carries 3 properties, each named by
// the brew it makes; the book shows the ones found. A recipe is known when enough
// carriers of its brew's property are shown, and experiments reveal properties.

const PROPERTY_COUNT = 3;
const INDEXES: readonly PropertyIndex[] = [0, 1, 2];

export const isRevealed = (state: GameState, ingredient: IngredientId, index: number): boolean =>
  state.book.properties[ingredient].includes(index as PropertyIndex);

/** Shows a property in the book; true when it was hidden before. */
export const revealProperty = (
  state: GameState,
  ingredient: IngredientId,
  index: PropertyIndex,
): boolean => {
  const shown = state.book.properties[ingredient];
  if (shown.includes(index)) return false;
  shown.push(index);
  shown.sort();
  return true;
};

/** "Properties found: N of 36". */
export const propertiesFound = (state: GameState): number =>
  INGREDIENT_IDS.reduce((n, id) => n + state.book.properties[id].length, 0);

export const PROPERTIES_TOTAL = INGREDIENT_IDS.length * PROPERTY_COUNT;

/** Ingredients the book shows as carrying a brew's property, in ingredient-list order. */
export const knownCarriers = (state: GameState, brew: ConsumableId): IngredientId[] =>
  INGREDIENT_IDS.filter((id) =>
    ingredientProperties[id].some((p, i) => p.brew === brew && isRevealed(state, id, i)),
  );

const sameIngredients = (a: Recipe, b: Recipe): boolean =>
  INGREDIENT_IDS.every((id) => (a.ingredients[id] ?? 0) === (b.ingredients[id] ?? 0));

/**
 * Every recipe the book knows for a brew (GDD §5.8.2): the v0.3 recipe first when it has
 * one, then the rest in ingredient-list order. Empty while the brew is unknown.
 */
export const knownRecipes = (state: GameState, brew: ConsumableId): Recipe[] => {
  const def = consumables[brew];
  const carriers = knownCarriers(state, brew);
  const shape = def.shape;
  const out: Recipe[] = [];
  if (shape.kind === 'split') {
    // Two different carriers: 2 of one and 1 of the other, either way round.
    for (const major of carriers)
      for (const minor of carriers)
        if (major !== minor)
          out.push({ ingredients: { [major]: shape.major, [minor]: shape.minor }, resources: {} });
  } else if (shape.kind === 'single') {
    for (const c of carriers)
      out.push({ ingredients: { [c]: shape.units }, resources: { ...shape.resources } });
  } else {
    // Any mix of `units` carrier units.
    carriers.forEach((x, i) =>
      carriers.slice(i).forEach((y) => {
        const ingredients: Partial<Record<IngredientId, number>> =
          x === y ? { [x]: shape.units } : { [x]: 1, [y]: shape.units - 1 };
        out.push({ ingredients, resources: { ...shape.resources } });
      }),
    );
  }
  if (!def.recipe) return out;
  const start = def.recipe;
  const first = out.find((r) => sameIngredients(r, start));
  return first ? [first, ...out.filter((r) => r !== first)] : out;
};

/** The brews whose recipe the book knows, in list order. */
export const knownBrews = (state: GameState): ConsumableId[] =>
  CONSUMABLE_IDS.filter((id) => knownRecipes(state, id).length > 0);

/** The recipe a brew uses when the player doesn't choose: the v0.3 recipe, else the first known. */
export const defaultRecipe = (state: GameState, brew: ConsumableId): Recipe | null =>
  knownRecipes(state, brew)[0] ?? null;

/** The known recipe matching the chosen ingredients exactly, or null. */
export const chosenRecipe = (
  state: GameState,
  brew: ConsumableId,
  ingredients: Partial<Record<IngredientId, number>>,
): Recipe | null =>
  knownRecipes(state, brew).find((r) => sameIngredients(r, { ingredients, resources: {} })) ?? null;

// ---- Experiments (GDD §5.8.3, D199) ----

/** An ingredient's property indexes the book doesn't show yet, in the §8.6 order. */
export const hiddenIndexes = (state: GameState, ingredient: IngredientId): PropertyIndex[] =>
  INDEXES.filter((i) => !isRevealed(state, ingredient, i));

/** Why a pair can't be queued, or null when it can (the picker says why). */
export const experimentProblem = (
  state: GameState,
  a: IngredientId,
  b: IngredientId,
): string | null => {
  if (a === b) return 'Pick two different ingredients.';
  const key = pairKey(a, b);
  if (state.book.tried.includes(key)) return 'You tried that pair already.';
  if (state.queues.brewing.some((j) => j.kind === 'experiment' && pairKey(j.a, j.b) === key))
    return 'That pair is already in a kettle.';
  if (hiddenIndexes(state, a).length === 0 && hiddenIndexes(state, b).length === 0)
    return 'Nothing left to learn from these two.';
  return null;
};

export interface ExperimentResult {
  /** Each property the experiment showed. */
  readonly revealed: readonly {
    readonly ingredient: IngredientId;
    readonly index: PropertyIndex;
  }[];
  /** Brews whose recipe the book newly knows ("Discovered: Hidebane Oil."). */
  readonly discovered: readonly ConsumableId[];
}

/**
 * The result of an experiment (GDD §5.8.3): every shared property is shown on both; with
 * none shared, the first hidden property of each. The pair is then marked tried.
 */
export const finishExperiment = (
  state: GameState,
  a: IngredientId,
  b: IngredientId,
): ExperimentResult => {
  const before = new Set(knownBrews(state));
  const revealed: { ingredient: IngredientId; index: PropertyIndex }[] = [];
  const show = (ingredient: IngredientId, index: PropertyIndex): void => {
    if (revealProperty(state, ingredient, index)) revealed.push({ ingredient, index });
  };
  const pa = ingredientProperties[a];
  const pb = ingredientProperties[b];
  let shared = false;
  INDEXES.forEach((i) =>
    INDEXES.forEach((j) => {
      if (pa[i]?.brew !== pb[j]?.brew) return;
      shared = true;
      show(a, i);
      show(b, j);
    }),
  );
  if (!shared) {
    const first = (id: IngredientId): void => {
      const [i] = hiddenIndexes(state, id);
      if (i !== undefined) show(id, i);
    };
    first(a);
    first(b);
  }
  state.book.tried.push(pairKey(a, b));
  return { revealed, discovered: knownBrews(state).filter((id) => !before.has(id)) };
};
