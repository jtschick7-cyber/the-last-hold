import { balance } from '../../content/balance';
import { ORDER_LEVEL_WORDS, ORDER_NAMES, type OrderId } from '../../content/orders';
import type { Breakdown } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { orderLevel } from './orders';

// GDD §5.13.5 (D411, D418): the four number perks. Each is its own factor with its own breakdown line,
// applied after the buckets (no new bonus bucket, §5.0), and only while its Order is SEATED. An
// unseated Order, or level 0, gives exactly 1, so a game with no Order seated equals v0.9.

const STEP: Record<OrderId, { key: string; step: () => number; text: string }> = {
  moot: {
    key: 'orders.perk.moot.foodStep',
    step: () => balance.orders.perk.moot.foodStep.value,
    text: 'food for provisions',
  },
  greyWives: {
    key: 'orders.perk.greyWives.timeStep',
    step: () => balance.orders.perk.greyWives.timeStep.value,
    text: 'brew and experiment time',
  },
  bellWatchers: {
    key: 'orders.perk.bellWatchers.clueStep',
    step: () => balance.orders.perk.bellWatchers.clueStep.value,
    text: 'clue time',
  },
  quenchers: {
    key: 'orders.perk.quenchers.threatStep',
    step: () => balance.orders.perk.quenchers.threatStep.value,
    text: 'hourly Threat',
  },
};

/** The level that counts: the Order's level while it is seated, else 0. */
export const seatedLevel = (state: GameState, id: OrderId): number =>
  state.orders.seats.includes(id) ? orderLevel(state, id) : 0;

/** The share taken off (0 when unseated): `step × level`. */
export const perkCut = (state: GameState, id: OrderId): number =>
  STEP[id].step() * seatedLevel(state, id);

/** The factor, `1 − step × level`; exactly 1 when nothing is seated. */
export const perkFactor = (state: GameState, id: OrderId): number => 1 - perkCut(state, id);

/** The breakdown line ("Thanes' Moot, Friend: −6%"), or none while unseated. */
export const perkLines = (state: GameState, id: OrderId): Breakdown[] => {
  const level = seatedLevel(state, id);
  if (level === 0) return [];
  const step = STEP[id].step();
  const word = ORDER_LEVEL_WORDS[level - 1] ?? '';
  return [
    {
      label: `${ORDER_NAMES[id]}, ${word}: −${Math.round(step * level * 100)}% ${STEP[id].text}`,
      value: 1 - step * level,
      formula: `1 − ${step} × ${level}`,
      key: STEP[id].key as never,
    },
  ];
};

/** What seating an Order would give, for the card's "Not seated" row (GDD §5.13.3). */
export const seatingGives = (state: GameState, id: OrderId): string => {
  const level = orderLevel(state, id);
  const step = STEP[id].step();
  const cut = Math.round(step * Math.max(level, 1) * 100);
  return level === 0
    ? `Seated, it gives −${cut}% ${STEP[id].text} at each level.`
    : `Seated, it gives −${cut}% ${STEP[id].text}.`;
};
