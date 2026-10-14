import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import { INGREDIENT_IDS, type IngredientId } from '../../content/ingredients';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { brewSlots, recipeOf, startBrews } from '../alchemy/brewing';
import type { GameState } from '../state/game-state';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.7: queueing a brew pays its recipe at once; cancelling refunds it in full.

export const queueBrew = (state: GameState, item: ConsumableId): ApplyResult => {
  if (!(CONSUMABLE_IDS as readonly string[]).includes(item))
    return refuse('That is not something the Hut can brew.');
  if (brewSlots(state) === 0) return refuse('Build an Alchemist’s Hut to brew.');
  const recipe = recipeOf(item);
  // GDD §5.8.2: a v0.6 brew can't be brewed until the book knows its recipe (T6.4).
  if (!recipe) return refuse(`The book does not know a recipe for ${consumables[item].name} yet.`);
  for (const [id, n] of Object.entries(recipe.ingredients))
    if (state.stores[id as IngredientId] < (n ?? 0))
      return refuse(`Not enough ${id.replace(/-/g, ' ')} for ${consumables[item].name}.`);
  for (const r of RESOURCE_IDS)
    if (state.resources[r] < (recipe.resources[r] ?? 0))
      return refuse(`Not enough ${r} for ${consumables[item].name}.`);
  for (const id of INGREDIENT_IDS) state.stores[id] -= recipe.ingredients[id] ?? 0;
  for (const r of RESOURCE_IDS) state.resources[r as ResourceId] -= recipe.resources[r] ?? 0;
  state.queues.brewing.push({ kind: 'brew', item, doneAt: null, paid: structuredClone(recipe) });
  startBrews(state);
  return ok;
};

/** Cancels the brew at `index` in the queue, refunding what it cost. */
export const cancelBrew = (state: GameState, index: number): ApplyResult => {
  const job = Number.isInteger(index) ? state.queues.brewing[index] : undefined;
  if (!job) return refuse('There is no such brew in the queue.');
  state.queues.brewing.splice(index, 1);
  if (job.kind === 'experiment') {
    state.stores[job.a] += job.units;
    state.stores[job.b] += job.units;
  } else {
    for (const id of INGREDIENT_IDS) state.stores[id] += job.paid.ingredients[id] ?? 0;
    for (const r of RESOURCE_IDS) state.resources[r] += job.paid.resources[r] ?? 0;
  }
  startBrews(state);
  return ok;
};
