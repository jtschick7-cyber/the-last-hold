import { computeOdds } from '../../core/contracts/odds';
import { suggestParty } from '../../core/contracts/suggest';
import type { WorkerRequest, WorkerResponse } from './protocol';

// Runs the same core functions the main thread would; nothing here knows a rule.
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (m: WorkerResponse) => void;
};

scope.onmessage = (e) => {
  const req = e.data;
  const started = performance.now();
  try {
    if (req.kind === 'odds') {
      scope.postMessage({
        id: req.id,
        kind: 'odds',
        result: computeOdds(req.input),
        ms: performance.now() - started,
      });
    } else {
      scope.postMessage({
        id: req.id,
        kind: 'suggest',
        result: suggestParty(req.input),
        ms: performance.now() - started,
      });
    }
  } catch (err) {
    scope.postMessage({
      id: req.id,
      kind: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
