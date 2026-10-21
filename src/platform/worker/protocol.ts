import type { Odds, OddsInput } from '../../core/contracts/odds';
import type { SuggestInput, Suggestion } from '../../core/contracts/suggest';
import type {
  BossPreview,
  BossPreviewInput,
  BossSuggestInput,
  BossSuggestion,
} from '../../core/systems/boss-odds';
import type {
  HuntOdds,
  HuntOddsInput,
  HuntSuggestInput,
  HuntSuggestion,
} from '../../core/systems/hunt-odds';
import type { StandPreview, StandPreviewInput } from '../../core/stand/preview';

// Technical design §10.1: odds and Suggest run in a Web Worker, so a slow phone
// never freezes the screen. Plain messages in, plain results out.
export type WorkerRequest =
  | { id: number; kind: 'odds'; input: OddsInput }
  | { id: number; kind: 'suggest'; input: SuggestInput }
  /** GDD §5.9.3, §6.5: the Last Stand preview (100 practice stands). */
  | { id: number; kind: 'stand'; input: StandPreviewInput }
  /** GDD §5.12.4, §6.5: the boss preview (100 practice fights) and Suggest for events. */
  | { id: number; kind: 'bossPreview'; input: BossPreviewInput }
  | { id: number; kind: 'bossSuggest'; input: BossSuggestInput }
  /** GDD §5.12.6, §9.17: a hunt track's odds and Suggest. */
  | { id: number; kind: 'huntOdds'; input: HuntOddsInput }
  | { id: number; kind: 'huntSuggest'; input: HuntSuggestInput };

export type WorkerResponse =
  | { id: number; kind: 'odds'; result: Odds; ms: number }
  | { id: number; kind: 'suggest'; result: Suggestion | null; ms: number }
  | { id: number; kind: 'stand'; result: StandPreview; ms: number }
  | { id: number; kind: 'bossPreview'; result: BossPreview; ms: number }
  | { id: number; kind: 'bossSuggest'; result: BossSuggestion | null; ms: number }
  | { id: number; kind: 'huntOdds'; result: HuntOdds; ms: number }
  | { id: number; kind: 'huntSuggest'; result: HuntSuggestion | null; ms: number }
  | { id: number; kind: 'error'; message: string };
