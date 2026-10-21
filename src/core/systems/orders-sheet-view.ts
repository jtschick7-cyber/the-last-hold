import { balance } from '../../content/balance';
import {
  ORDER_LEVEL_WORDS,
  ORDER_NAMES,
  ORDER_NUMBER_NOTE,
  ORDER_STORY_PERK,
  type OrderId,
} from '../../content/orders';
import type { Breakdown } from '../breakdown/breakdown';
import { chapterRows, type ChapterRow } from '../story/orders-chapter-view';
import type { GameState } from '../state/game-state';
import { orderLevel, standingExplained } from './orders';
import { perkAtLevel } from './orders-perks';
import { cooldownLeft, cooldownText } from './orders-seats';
import { rowOf, type OrderRow } from './orders-view';

// GDD §9.18 (D416 (2)): everything an Order sheet says. The standing is the breakdown the rules use;
// each level's number is the perk's own breakdown line; nothing here changes the state.

export interface LevelRow {
  readonly level: number;
  readonly word: string;
  /** The standing this level needs. */
  readonly threshold: number;
  readonly reached: boolean;
  readonly current: boolean;
  /** The number perk at this level, with its breakdown. */
  readonly number: Breakdown;
  /** The number perk in words ("−8% food for provisions"), with the trade for the Quenchers. */
  readonly numberLine: string;
  readonly story: string;
}

export interface OrderSheetView {
  readonly name: string;
  readonly levelWord: string;
  readonly standing: number;
  /** "Next level at 40" or "Top level". */
  readonly nextLine: string;
  readonly standingBreakdown: Breakdown;
  readonly levels: readonly LevelRow[];
  readonly chapters: readonly ChapterRow[];
  readonly row: OrderRow;
  readonly cooldownLine: string | null;
}

/** The Order sheet for an Order that has opened, or null for one that has not (it is not listed). */
export const orderSheetView = (
  state: GameState,
  id: OrderId,
  now: number,
): OrderSheetView | null => {
  if (!state.orders.opened[id]) return null;
  const level = orderLevel(state, id);
  const standing = standingExplained(state, id);
  const thresholds = balance.orders.levelThresholds.value[id];
  const next = thresholds[level];
  const note = ORDER_NUMBER_NOTE[id];
  return {
    name: ORDER_NAMES[id],
    levelWord: level === 0 ? 'No level yet' : (ORDER_LEVEL_WORDS[level - 1] ?? ''),
    standing: standing.value,
    nextLine: next === undefined ? 'Top level' : `Next level at ${next}`,
    standingBreakdown: standing.breakdown,
    levels: thresholds.map((threshold, i) => {
      const n = i + 1;
      const number = perkAtLevel(id, n);
      return {
        level: n,
        word: ORDER_LEVEL_WORDS[i] ?? '',
        threshold,
        reached: level >= n,
        current: level === n,
        number,
        numberLine: `${number.label.split(': ')[1] ?? ''}${note ? `: ${note}` : ''}`,
        story: ORDER_STORY_PERK[id],
      };
    }),
    chapters: chapterRows(state, id),
    row: rowOf(state, id),
    cooldownLine: cooldownLeft(state, now) > 0 ? cooldownText(state, now) : null,
  };
};
