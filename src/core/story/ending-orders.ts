import { ORDER_IDS, type OrderId } from '../../content/orders';
import {
  endingOrderTexts,
  type EndingOrderCard,
  type EndingOrderCardId,
} from '../../content/text/remembering-orders';
import type { GameState } from '../state/game-state';
import { variantRead } from './orders-chapters';

// GDD §5.15.4 (D419, D466 (3)): the Orders' cards of the ending. Worked out from what was read:
// `chaptersRead` and `readWith` (through `variantRead`), and whether the Quenchers have opened.
// Current seats and levels are never looked at. An Order whose chapter 4 was not read is silent,
// except that the Quenchers, if they have opened, give Věra's fallback.

const LAST_CHAPTER = 4;

const cardFor = (state: GameState, id: OrderId): EndingOrderCardId | null => {
  const o = state.orders;
  if (o.chaptersRead[id] >= LAST_CHAPTER) {
    const v = variantRead(state, id, LAST_CHAPTER);
    if (id === 'moot') return v === 'A' ? 'mootA' : 'mootB';
    if (id === 'quenchers') return v === 'A' ? 'quenchersA' : 'quenchersB';
    return id;
  }
  return id === 'quenchers' && o.opened.quenchers ? 'quenchersFallback' : null;
};

/** The cards in the fixed order: Moot, Grey Wives, Bell-Watchers, Quenchers. */
export const endingOrderCards = (state: GameState): EndingOrderCard[] =>
  ORDER_IDS.flatMap((id) => {
    const key = cardFor(state, id);
    return key === null ? [] : [endingOrderTexts[key]];
  });
