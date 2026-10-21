import { balance } from '../../content/balance';
import { ORDER_IDS, type OrderId } from '../../content/orders';
import { formatDuration } from '../format/duration';
import type { GameState } from '../state/game-state';
import { MS_PER_SECOND } from '../time';
import { eventNow } from './events';

// GDD §5.13.3–§5.13.4 (D412, D422): how many seats there are, who sits in them, and the 24 h
// cooldown on the monotone event clock. Only the player's commands change `orders.seats`; nothing
// here seats an Order by itself.

/** The seats there are now: two until the third opens, then three. */
export const seatCount = (state: GameState): number =>
  state.orders.thirdSeat ? balance.orders.seatsMax.value : balance.orders.seatsStart.value;

/** Milliseconds until a mid-cycle seat change is allowed; 0 when it is allowed now. */
export const cooldownLeft = (state: GameState, now: number): number => {
  const last = state.orders.lastChange;
  if (last === null) return 0;
  const length = balance.orders.swapCooldown.value * MS_PER_SECOND;
  return Math.max(0, last + length - eventNow(state, now));
};

/** "Can change in 9h 20m" — the reason a change is refused, built from the same number. */
export const cooldownText = (state: GameState, now: number): string =>
  `Can change in ${formatDuration(Math.ceil(cooldownLeft(state, now) / MS_PER_SECOND))}`;

/** A list of Orders in the fixed list order (D419), so equality tests are stable. */
export const inListOrder = (ids: readonly OrderId[]): OrderId[] =>
  ORDER_IDS.filter((id) => ids.includes(id));
