import {
  endingCount,
  endingFortieth,
  endingHearthKeeps,
  endingWarm,
} from '../../content/text/remembering-ending';
import { rememberScene } from '../../content/text/remembering';
import type { GameState } from '../state/game-state';
import { endingOrderCards } from './ending-orders';

// GDD §5.15.3 (D461 (3), D466 (2)): the whole ending as one list. The UI plays it from the card
// and again from the Library, so an interrupted ending loses nothing. Worked out from the state
// each time; nothing is stored.
export interface EndingSceneCard {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export type EndingStep =
  { readonly kind: 'card'; readonly card: EndingSceneCard } | { readonly kind: 'reading' };

/** R-03, the reading, R-04, R-04b (only if Sigrun is on the roster), the Order cards, R-09, R-11. */
export const endingSequence = (state: GameState): EndingStep[] => [
  { kind: 'card', card: rememberScene },
  { kind: 'reading' },
  { kind: 'card', card: endingCount },
  ...(state.hunters.sigrun ? [{ kind: 'card', card: endingFortieth } as const] : []),
  ...endingOrderCards(state).map((card) => ({ kind: 'card', card }) as const),
  { kind: 'card', card: endingHearthKeeps },
  { kind: 'card', card: endingWarm },
];
