import { computeOdds } from '../../core/contracts/odds';
import { suggestParty } from '../../core/contracts/suggest';
import { previewBoss, suggestBossParty } from '../../core/systems/boss-odds';
import { computeHuntOdds, suggestHuntParty } from '../../core/systems/hunt-odds';
import { previewDescent } from '../../core/systems/descent-odds';
import { previewStand } from '../../core/stand/preview';
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
    } else if (req.kind === 'stand') {
      scope.postMessage({
        id: req.id,
        kind: 'stand',
        result: previewStand(req.input),
        ms: performance.now() - started,
      });
    } else if (req.kind === 'bossPreview') {
      scope.postMessage({
        id: req.id,
        kind: 'bossPreview',
        result: previewBoss(req.input),
        ms: performance.now() - started,
      });
    } else if (req.kind === 'bossSuggest') {
      scope.postMessage({
        id: req.id,
        kind: 'bossSuggest',
        result: suggestBossParty(req.input),
        ms: performance.now() - started,
      });
    } else if (req.kind === 'huntOdds') {
      scope.postMessage({
        id: req.id,
        kind: 'huntOdds',
        result: computeHuntOdds(req.input),
        ms: performance.now() - started,
      });
    } else if (req.kind === 'huntSuggest') {
      scope.postMessage({
        id: req.id,
        kind: 'huntSuggest',
        result: suggestHuntParty(req.input),
        ms: performance.now() - started,
      });
    } else if (req.kind === 'descentPreview') {
      scope.postMessage({
        id: req.id,
        kind: 'descentPreview',
        result: previewDescent(req.input),
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
