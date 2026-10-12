import { JOB_IDS, jobs, type JobId } from '../../content/jobs';
import type { GameState } from '../state/game-state';
import { idlePeasants, jobSlots } from '../systems/housing';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.1.1: reassigning is free and instant.

const known = (job: unknown): job is JobId =>
  typeof job === 'string' && (JOB_IDS as readonly string[]).includes(job);

const freeSlots = (state: GameState, job: JobId): number =>
  jobSlots(state, job).value - state.peasants.jobs[job];

export const add = (state: GameState, job: JobId): ApplyResult => {
  if (!known(job)) return refuse('That job does not exist.');
  if (idlePeasants(state) < 1) return refuse('No idle peasants.');
  if (freeSlots(state, job) < 1) return refuse(`No free ${jobs[job].name} slots.`);
  state.peasants.jobs[job] += 1;
  return ok;
};

export const remove = (state: GameState, job: JobId): ApplyResult => {
  if (!known(job)) return refuse('That job does not exist.');
  if (state.peasants.jobs[job] < 1) return refuse(`No ${jobs[job].name}s to take off.`);
  state.peasants.jobs[job] -= 1;
  return ok;
};

export const fill = (state: GameState, job: JobId): ApplyResult => {
  if (!known(job)) return refuse('That job does not exist.');
  const n = Math.min(idlePeasants(state), freeSlots(state, job));
  if (n < 1)
    return refuse(
      idlePeasants(state) < 1 ? 'No idle peasants.' : `No free ${jobs[job].name} slots.`,
    );
  state.peasants.jobs[job] += n;
  return ok;
};

export const setAutoSettle = (state: GameState, on: boolean): ApplyResult => {
  if (typeof on !== 'boolean') return refuse('Auto-settle is on or off.');
  state.peasants.autoSettle = on;
  return ok;
};

export const setPriority = (state: GameState, order: JobId[]): ApplyResult => {
  const valid =
    Array.isArray(order) &&
    order.length === JOB_IDS.length &&
    JOB_IDS.every((j) => order.filter((o) => o === j).length === 1);
  if (!valid) return refuse('The priority list must name every job exactly once.');
  state.peasants.priority = [...order];
  return ok;
};
