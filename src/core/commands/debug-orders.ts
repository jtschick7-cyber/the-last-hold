import { balance } from '../../content/balance';
import { ORDER_IDS, type OrderId } from '../../content/orders';
import { newOrdersState } from '../state/orders-state';
import type { GameState } from '../state/game-state';
import { checkThirdSeat, orderLevel, orderStanding, raiseLevels } from '../systems/orders';
import { inListOrder } from '../systems/orders-seats';
import { ok, refuse, type ApplyResult } from './types';

// Plan T10.12 (technical design §15): debug actions for the Orders, so the playtest can reach a level,
// the third seat or a chapter without weeks of play. Like every debug action they set meta.debugUsed.
// They add standing as "brought from before" and never seat anything: only the player's commands
// change `orders.seats`.

const known = (id: unknown): id is OrderId => ORDER_IDS.includes(id as OrderId);
const whole = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;

const marked = (state: GameState): ApplyResult => {
  state.meta.debugUsed = true;
  return ok;
};

/** Opens an Order as if its trigger had been passed: its opening scene is queued, no seat is taken. */
export const debugOrdersOpen = (state: GameState, id: OrderId, now: number): ApplyResult => {
  if (!known(id)) return refuse('No such Order.');
  if (state.orders.opened[id]) return refuse('That Order is already open.');
  state.orders.opened[id] = { at: now };
  state.orders.openingQueue.push(id);
  checkThirdSeat(state);
  return marked(state);
};

/** Adds standing (as "Brought from before the Orders"); levels rise as they would in play. */
export const debugOrdersAddStanding = (state: GameState, id: OrderId, n: number): ApplyResult => {
  if (!known(id)) return refuse('No such Order.');
  if (!whole(n) || n === 0) return refuse('A whole number above 0, please.');
  state.orders.start[id] += n;
  raiseLevels(state);
  return marked(state);
};

/** Raises an Order to a level by adding the standing it lacks. A level never drops (D410). */
export const debugOrdersSetLevel = (state: GameState, id: OrderId, level: number): ApplyResult => {
  if (!known(id)) return refuse('No such Order.');
  if (!whole(level) || level > balance.orders.levels.value)
    return refuse(`A level from 0 to ${balance.orders.levels.value}, please.`);
  if (level <= orderLevel(state, id)) return refuse('Levels never drop; use Reset Orders.');
  const need = balance.orders.levelThresholds.value[id][level - 1] ?? 0;
  state.orders.start[id] += Math.max(0, need - orderStanding(state, id));
  raiseLevels(state);
  return marked(state);
};

/** Opens the third seat, for good. */
export const debugOrdersOpenThird = (state: GameState): ApplyResult => {
  state.orders.thirdSeat = true;
  return marked(state);
};

/** Ends the 24 h wait after a seat change. */
export const debugOrdersClearCooldown = (state: GameState): ApplyResult => {
  state.orders.lastChange = null;
  return marked(state);
};

/**
 * Plays chapter `n` of an Order now: opens the Order and raises its level if need be, counts the
 * chapters before it as read, and reads this one with the Orders seated as they are (so the variant is
 * the one those seats give). It does not seat the Order and it ignores a chapter's extra condition.
 */
export const debugOrdersPlayChapter = (
  state: GameState,
  id: OrderId,
  n: number,
  now: number,
): ApplyResult => {
  if (!known(id)) return refuse('No such Order.');
  if (!whole(n) || n < 1 || n > balance.orders.levels.value)
    return refuse(`A chapter from 1 to ${balance.orders.levels.value}, please.`);
  const o = state.orders;
  if (o.chaptersRead[id] >= n) return refuse('That chapter is already read.');
  if (!o.opened[id]) debugOrdersOpen(state, id, now);
  if (orderLevel(state, id) < n) debugOrdersSetLevel(state, id, n);
  while (o.chaptersRead[id] < n) {
    o.readWith[id].push(inListOrder(o.seats));
    o.chaptersRead[id] += 1;
  }
  return marked(state);
};

/** Puts everything the Orders keep back to a new game's, as if none had come. */
export const debugOrdersReset = (state: GameState): ApplyResult => {
  state.orders = newOrdersState();
  return marked(state);
};
