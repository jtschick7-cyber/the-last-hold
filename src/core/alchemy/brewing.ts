import { BUILDING_IDS, buildings } from '../../content/buildings';
import { consumables, type ConsumableId } from '../../content/consumables';
import { num } from '../balance-access';
import type { GameState } from '../state/game-state';
import { MS_PER_SECOND } from '../time';

// GDD §5.7: the Alchemist's Hut brews consumables from reagents. A brew takes 10
// minutes, one at a time per Hut level; the rest of the queue waits. The recipe is paid
// when the brew is queued (D91), so a brew in the queue can never fail for want of reagents.

/** Kettles: one brew at a time per Hut level. */
export const brewSlots = (state: GameState): number => {
  let n = 0;
  for (const id of BUILDING_IDS)
    for (const e of buildings[id].effects)
      if (e.kind === 'brewSlots') n += state.buildings[id] * e.perLevel;
  return n;
};

/** Kettles at work: brews that have started. */
export const kettlesBusy = (state: GameState): number =>
  state.queues.brewing.filter((j) => j.doneAt !== null).length;

const brewMs = (): number => num('brew.time') * MS_PER_SECOND;

/** Starts waiting brews, in queue order, on every free kettle, from the current time. */
export const startBrews = (state: GameState): void => {
  let busy = kettlesBusy(state);
  const slots = brewSlots(state);
  for (const job of state.queues.brewing) {
    if (busy >= slots) break;
    if (job.doneAt === null) {
      job.doneAt = state.time + brewMs();
      busy += 1;
    }
  }
};

/** When the soonest brew is done, or null while nothing is brewing. */
export const nextBrewTime = (state: GameState): number | null => {
  let soonest: number | null = null;
  for (const job of state.queues.brewing)
    if (job.doneAt !== null && (soonest === null || job.doneAt < soonest)) soonest = job.doneAt;
  return soonest;
};

export interface BrewDone {
  item: ConsumableId;
  at: number;
}

/** Finishes the soonest brew into the stores and starts the next. The clock is at its time. */
export const applyBrew = (state: GameState): BrewDone | null => {
  let index = -1;
  state.queues.brewing.forEach((job, i) => {
    const best = state.queues.brewing[index];
    if (job.doneAt === null) return;
    if (index < 0 || (best?.doneAt !== null && best && job.doneAt < (best.doneAt ?? Infinity)))
      index = i;
  });
  const job = state.queues.brewing[index];
  if (!job) return null;
  state.queues.brewing.splice(index, 1);
  state.stores[job.item] += 1;
  startBrews(state);
  return { item: job.item, at: state.time };
};

/** What a recipe costs to queue, for refunds and the UI. */
export const recipeOf = (item: ConsumableId) => consumables[item].recipe;
