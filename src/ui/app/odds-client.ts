import { signal } from '@preact/signals';
import { computeOdds, type Odds, type OddsInput } from '../../core/contracts/odds';
import { suggestParty, type SuggestInput, type Suggestion } from '../../core/contracts/suggest';
import type { WorkerRequest, WorkerResponse } from '../../platform/worker/protocol';

// Technical design §10.1: odds and Suggest go to a worker, debounced, with stale
// answers dropped. If workers aren't available (or one fails), the main thread
// does a smaller "quick estimate" instead, and says so (GDD §6.5).

/** How many fights the main-thread fallback runs for odds. */
const QUICK_SAMPLES = 100;
const DEBOUNCE_MS = 120;

export const lastOddsMs = signal<number | null>(null);
export const lastSuggestMs = signal<number | null>(null);

let worker: Worker | null | undefined;
let nextId = 1;
const waiting = new Map<number, (r: WorkerResponse) => void>();

const getWorker = (): Worker | null => {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('../../platform/worker/odds.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const done = waiting.get(e.data.id);
      waiting.delete(e.data.id);
      done?.(e.data);
    };
    worker.onerror = () => {
      worker = null; // fall back to the main thread from now on
      for (const [id, done] of waiting) done({ id, kind: 'error', message: 'worker failed' });
      waiting.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
};

const send = (req: Omit<WorkerRequest, 'id'>): Promise<WorkerResponse> | null => {
  const w = getWorker();
  if (!w) return null;
  const id = nextId++;
  return new Promise((resolve) => {
    waiting.set(id, resolve);
    w.postMessage({ ...req, id } as WorkerRequest);
  });
};

export interface OddsAnswer {
  odds: Odds;
  /** True when the main thread answered with fewer fights. */
  quick: boolean;
}

export const requestOdds = async (input: OddsInput): Promise<OddsAnswer> => {
  const reply = send({ kind: 'odds', input });
  if (reply) {
    const r = await reply;
    if (r.kind === 'odds') {
      lastOddsMs.value = r.ms;
      return { odds: r.result, quick: false };
    }
  }
  const started = performance.now();
  const odds = computeOdds({ ...input, samples: QUICK_SAMPLES });
  lastOddsMs.value = performance.now() - started;
  return { odds, quick: true };
};

export const requestSuggest = async (input: SuggestInput): Promise<Suggestion | null> => {
  const reply = send({ kind: 'suggest', input });
  if (reply) {
    const r = await reply;
    if (r.kind === 'suggest') {
      lastSuggestMs.value = r.ms;
      return r.result;
    }
  }
  const started = performance.now();
  const result = suggestParty(input);
  lastSuggestMs.value = performance.now() - started;
  return result;
};

/** Debounces a stream of odds requests: only the last one in a burst is sent. */
export const debounced = (): ((input: OddsInput) => Promise<OddsAnswer | null>) => {
  let ticket = 0;
  return (input) => {
    const mine = ++ticket;
    return new Promise((resolve) => {
      setTimeout(async () => {
        if (mine !== ticket) return resolve(null);
        const answer = await requestOdds(input);
        resolve(mine === ticket ? answer : null);
      }, DEBOUNCE_MS);
    });
  };
};
