import type { Odds, OddsInput } from '../../core/contracts/odds';
import type { SuggestInput, Suggestion } from '../../core/contracts/suggest';
import type { StandPreview, StandPreviewInput } from '../../core/stand/preview';

// Technical design §10.1: odds and Suggest run in a Web Worker, so a slow phone
// never freezes the screen. Plain messages in, plain results out.
export type WorkerRequest =
  | { id: number; kind: 'odds'; input: OddsInput }
  | { id: number; kind: 'suggest'; input: SuggestInput }
  /** GDD §5.9.3, §6.5: the Last Stand preview (100 practice stands). */
  | { id: number; kind: 'stand'; input: StandPreviewInput };

export type WorkerResponse =
  | { id: number; kind: 'odds'; result: Odds; ms: number }
  | { id: number; kind: 'suggest'; result: Suggestion | null; ms: number }
  | { id: number; kind: 'stand'; result: StandPreview; ms: number }
  | { id: number; kind: 'error'; message: string };
