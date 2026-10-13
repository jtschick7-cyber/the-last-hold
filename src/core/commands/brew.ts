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
  for (const [id, n] of Object.entries(recipe.ingredients))
    if (state.stores[id as IngredientId] < (n ?? 0))
      return refuse(`Not enough ${id.replace(/-/g, ' ')} for ${consumables[item].name}.`);
  for (const r of RESOURCE_IDS)
    if (state.resources[r] < (recipe.resources[r] ?? 0))
      return refuse(`Not enough ${r} for ${consumables[item].name}.`);
  for (const id of INGREDIENT_IDS) state.stores[id] -= recipe.ingredients[id] ?? 0;
  for (const r of RESOURCE_IDS) state.resources[r as ResourceId] -= recipe.resources[r] ?? 0;
  state.queues.brewing.push({ item, doneAt: null });
  startBrews(state);
  return ok;
};

/** Cancels the brew at `index` in the queue, refunding what it cost. */
export const cancelBrew = (state: GameState, index: number): ApplyResult => {
  const job = Number.isInteger(index) ? state.queues.brewing[index] : undefined;
  if (!job) return refuse('There is no such brew in the queue.');
  state.queues.brewing.splice(index, 1);
  const recipe = recipeOf(job.item);
  for (const id of INGREDIENT_IDS) state.stores[id] += recipe.ingredients[id] ?? 0;
  for (const r of RESOURCE_IDS) state.resources[r] += recipe.resources[r] ?? 0;
  startBrews(state);
  return ok;
};
