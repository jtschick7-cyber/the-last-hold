import { signal } from '@preact/signals';
import { computeOdds, type Odds, type OddsInput } from '../../core/contracts/odds';
import { suggestParty, type SuggestInput, type Suggestion } from '../../core/contracts/suggest';
import type { WorkerRequest, WorkerResponse } from '../../platform/worker/protocol';
import { num } from '../../core/balance-access';
import {
  previewBoss,
  suggestBossParty,
  type BossPreview,
  type BossPreviewInput,
  type BossSuggestInput,
  type BossSuggestion,
} from '../../core/systems/boss-odds';
import {
  computeHuntOdds,
  suggestHuntParty,
  type HuntOdds,
  type HuntOddsInput,
  type HuntSuggestInput,
  type HuntSuggestion,
} from '../../core/systems/hunt-odds';
import { previewStand, type StandPreview, type StandPreviewInput } from '../../core/stand/preview';

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

export const lastStandMs = signal<number | null>(null);

export interface StandAnswer {
  preview: StandPreview;
  /** True when the main thread answered with fewer practice stands. */
  quick: boolean;
}

/** GDD §5.9.3, §6.5: the Last Stand preview, in the worker (100 practice stands). */
export const requestStandPreview = async (input: StandPreviewInput): Promise<StandAnswer> => {
  const reply = send({ kind: 'stand', input });
  if (reply) {
    const r = await reply;
    if (r.kind === 'stand') {
      lastStandMs.value = r.ms;
      return { preview: r.result, quick: false };
    }
  }
  const started = performance.now();
  const preview = previewStand({ ...input, samples: num('laststand.policySamples') });
  lastStandMs.value = performance.now() - started;
  return { preview, quick: true };
};

export const lastBossPreviewMs = signal<number | null>(null);
export const lastBossSuggestMs = signal<number | null>(null);

export interface BossPreviewAnswer {
  preview: BossPreview;
  /** True when the main thread answered with fewer practice fights. */
  quick: boolean;
}

/** GDD §5.12.4, §6.5: the boss preview, in the worker (100 practice fights). */
export const requestBossPreview = async (input: BossPreviewInput): Promise<BossPreviewAnswer> => {
  const reply = send({ kind: 'bossPreview', input });
  if (reply) {
    const r = await reply;
    if (r.kind === 'bossPreview') {
      lastBossPreviewMs.value = r.ms;
      return { preview: r.result, quick: false };
    }
  }
  const started = performance.now();
  const preview = previewBoss({ ...input, samples: num('laststand.policySamples') });
  lastBossPreviewMs.value = performance.now() - started;
  return { preview, quick: true };
};

/** Suggest for a boss, in the worker; the fallback runs the same search on the main thread. */
export const requestBossSuggest = async (
  input: BossSuggestInput,
): Promise<BossSuggestion | null> => {
  const reply = send({ kind: 'bossSuggest', input });
  if (reply) {
    const r = await reply;
    if (r.kind === 'bossSuggest') {
      lastBossSuggestMs.value = r.ms;
      return r.result;
    }
  }
  const started = performance.now();
  const result = suggestBossParty(input);
  lastBossSuggestMs.value = performance.now() - started;
  return result;
};

export interface HuntOddsAnswer {
  odds: HuntOdds;
  /** True when the main thread answered with fewer practice fights. */
  quick: boolean;
}

/** GDD §5.12.6, §9.17: a hunt track's odds, in the worker (500 practice fights). */
export const requestHuntOdds = async (input: HuntOddsInput): Promise<HuntOddsAnswer> => {
  const reply = send({ kind: 'huntOdds', input });
  if (reply) {
    const r = await reply;
    if (r.kind === 'huntOdds') return { odds: r.result, quick: false };
  }
  return { odds: computeHuntOdds({ ...input, samples: QUICK_SAMPLES }), quick: true };
};

/** Suggest for a hunt, in the worker; the fallback runs the same search on the main thread. */
export const requestHuntSuggest = async (
  input: HuntSuggestInput,
): Promise<HuntSuggestion | null> => {
  const reply = send({ kind: 'huntSuggest', input });
  if (reply) {
    const r = await reply;
    if (r.kind === 'huntSuggest') return r.result;
  }
  return suggestHuntParty(input);
};
