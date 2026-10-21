import { balance, type BalanceKey } from '../../content/balance';
import { ORDER_IDS, ORDER_SOURCES, type OrderId } from '../../content/orders';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { MS_PER_SECOND } from '../time';
import { eventNow } from './events';

// GDD §5.13.2 (v0.10, D410, D418): Orders' standing. It is DERIVED, never stored: the one-time
// migration `start`, plus every source's count × its weight, plus each Triumphant stand's chunk. Each
// source is counted in the command or event that does the thing (a contract resolving, a Delve floor
// paying), including inside `advance`, never on a timer, and for all four Orders whether or not they
// have opened. Standing and level never drop: the highest level is saved (`levelHigh`).

type Weights = Record<string, number>;
const weightsOf = (id: OrderId): Weights => balance.orders.standing[id].value;
const sourceLabel: Record<string, string> = {
  contract: 'Contracts won',
  brew: 'Brews finished',
  experiment: 'Experiments finished',
  property: 'Properties revealed',
  document: 'Documents found',
  letter: 'Hunter letters found',
  name: 'Names found',
  kozlyContract: 'Kozly Hollow contracts won',
  delveFloor: 'Delve floors that paid Riftglass',
};

/** The level a standing gives: how many thresholds it has reached (0 to 4). */
export const levelOfStanding = (id: OrderId, standing: number): number =>
  balance.orders.levelThresholds.value[id].filter((t) => standing >= t).length;

/** An Order's standing and the breakdown that explains it (GDD §5.0), built together. */
export const standingExplained = (state: GameState, id: OrderId): Explained => {
  const o = state.orders;
  const weights = weightsOf(id);
  const key = `orders.standing.${id}` as BalanceKey;
  const children: Breakdown[] = [];
  if (o.start[id] > 0)
    children.push({ label: 'Brought from before the Orders', value: o.start[id] });
  for (const source of ORDER_SOURCES[id]) {
    const n = o.counts[id][source] ?? 0;
    const w = weights[source] ?? 0;
    children.push({
      label: sourceLabel[source] ?? source,
      value: n * w,
      formula: `${n} × ${w}`,
      key,
    });
  }
  const chunk = balance.orders.triumphantChunk.value;
  children.push({
    label: 'Triumphant stands',
    value: o.triumphant * chunk,
    formula: `${o.triumphant} × ${chunk}`,
    key: 'orders.triumphantChunk',
  });
  const value = children.reduce((sum, c) => sum + c.value, 0);
  return { value, breakdown: { label: 'Standing', value, children } };
};

export const orderStanding = (state: GameState, id: OrderId): number =>
  standingExplained(state, id).value;

/** The level now: the higher of the derived one and the highest ever reached (D410). */
export const orderLevel = (state: GameState, id: OrderId): number =>
  Math.max(levelOfStanding(id, orderStanding(state, id)), state.orders.levelHigh[id]);

/**
 * Raises each Order's saved high-water level to the derived one. Called by every hook after it
 * adds standing, so a tuning that lowers a weight later can never lower a level. Returns the Orders
 * whose level rose (the away sheet and the third-seat check read this, T10.5).
 */
export const raiseLevels = (state: GameState): OrderId[] => {
  const rose: OrderId[] = [];
  for (const id of ORDER_IDS) {
    const level = levelOfStanding(id, orderStanding(state, id));
    if (level > state.orders.levelHigh[id]) {
      state.orders.levelHigh[id] = level;
      rose.push(id);
    }
  }
  return rose;
};

const count = (state: GameState, id: OrderId, source: string, n: number): void => {
  const counts = state.orders.counts[id];
  counts[source] = (counts[source] ?? 0) + n;
};

/** A contract was won (GDD §5.13.2): any village adds to the Moot, Kozly Hollow also to the Quenchers. */
export const ordersContractWon = (state: GameState, village: string): OrderId[] => {
  count(state, 'moot', 'contract', 1);
  if (village === 'kozly-hollow') count(state, 'quenchers', 'kozlyContract', 1);
  return raiseLevels(state);
};

/** A Triumphant stand ended (GDD §5.13.2): its chunk is added to every Order, open or not. */
export const ordersTriumphantStand = (state: GameState): OrderId[] => {
  state.orders.triumphant += 1;
  return raiseLevels(state);
};

/**
 * A Delve floor was paid (GDD §5.13.2, D410 (1)): it counts only if its result paid at least one
 * Riftglass, so a Cold Comfort run, or a run past its allowance, adds nothing. A window starts at the
 * first counted floor and lasts `orders.delveWindow` on the event clock; inside it the standing
 * added is capped at `orders.delveWeeklyCap`, and a floor after it starts a new window.
 */
export const ordersDelveFloor = (state: GameState, paid: number, now: number): OrderId[] => {
  if (paid < 1) return [];
  const t = eventNow(state, now);
  const weight = weightsOf('quenchers').delveFloor ?? 0;
  const length = balance.orders.delveWindow.value * MS_PER_SECOND;
  const window = state.orders.delveWindow;
  const current = window !== null && t < window.start + length ? window : { start: t, used: 0 };
  if (current.used + weight > balance.orders.delveWeeklyCap.value) {
    state.orders.delveWindow = current;
    return [];
  }
  state.orders.delveWindow = { start: current.start, used: current.used + weight };
  count(state, 'quenchers', 'delveFloor', 1);
  return raiseLevels(state);
};
