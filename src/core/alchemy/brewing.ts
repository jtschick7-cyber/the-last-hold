import { BUILDING_IDS, buildings } from '../../content/buildings';
import { consumables, type ConsumableId } from '../../content/consumables';
import type { IngredientId } from '../../content/ingredients';
import { perkCut } from '../systems/orders-perks';
import { noteBrewFinished, noteExperimentFinished } from '../skills/hooks';
import { ordersBrewFinished, ordersExperimentFinished } from '../systems/orders';
import { finishExperiment, type ExperimentResult } from './book';
import { num } from '../balance-access';
import type { BrewJob, GameState, KettleJob } from '../state/game-state';
import { MS_PER_SECOND } from '../time';
import { brewCut } from '../long-night/bonuses';

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

/** One brew's time, less the Copper Still (GDD §8.10). */
export const brewMs = (state: GameState): number =>
  num('brew.time') * MS_PER_SECOND * (1 - brewCut(state).value);

/** One experiment's time, less the Copper Still like a brew (GDD §5.8.3). */
export const experimentMs = (state: GameState): number =>
  num('experiment.time') * MS_PER_SECOND * (1 - brewCut(state).value);

// GDD §5.13.5: the Grey Wives' cut is fixed when the job is queued (`orderCut`), so a seat change
// never alters a brew already queued; the Copper Still is read when the kettle starts, as before.
const jobMs = (state: GameState, job: KettleJob): number =>
  (job.kind === 'experiment' ? experimentMs(state) : brewMs(state)) * (1 - (job.orderCut ?? 0));

/** The cut to store on a job queued now: the seated Grey Wives' share, or nothing. */
export const queuedOrderCut = (state: GameState): { orderCut?: number } => {
  const cut = perkCut(state, 'greyWives');
  return cut > 0 ? { orderCut: cut } : {};
};

/** Starts waiting brews, in queue order, on every free kettle, from the current time. */
export const startBrews = (state: GameState): void => {
  let busy = kettlesBusy(state);
  const slots = brewSlots(state);
  for (const job of state.queues.brewing) {
    if (busy >= slots) break;
    if (job.doneAt === null) {
      job.doneAt = state.time + jobMs(state, job);
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

/** An experiment finished: what it showed and what it newly made makeable (GDD §5.8.3). */
export interface ExperimentDone extends ExperimentResult {
  a: IngredientId;
  b: IngredientId;
  at: number;
}

/** A brew is still the only kind of kettle job a player can queue until experiments (T6.4). */
export const brewJobs = (state: GameState): BrewJob[] =>
  state.queues.brewing.filter((j): j is BrewJob => j.kind === 'brew');

/** Finishes the soonest brew into the stores and starts the next. The clock is at its time. */
export const applyBrew = (state: GameState): BrewDone | ExperimentDone | null => {
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
  startBrews(state);
  if (job.kind === 'experiment') {
    const result = finishExperiment(state, job.a, job.b);
    noteExperimentFinished(state, result.revealed.length);
    ordersExperimentFinished(state, result.revealed.length); // GDD §5.13.2: Grey Wives
    return { a: job.a, b: job.b, at: state.time, ...result };
  }
  state.stores[job.item] += 1;
  noteBrewFinished(state);
  ordersBrewFinished(state); // GDD §5.13.2: Grey Wives
  return { item: job.item, at: state.time };
};

/** The recipe the book starts with, or null for a v0.6 brew that must be discovered first. */
export const recipeOf = (item: ConsumableId) => consumables[item].recipe;
