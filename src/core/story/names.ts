import { roll } from '../../content/story/roll';
import type { GameState } from '../state/game-state';
import { findName } from './documents';

// GDD §5.14.4 (D162): each Ribbonshade defeated carries the next of the six
// Ribbonshade names in a fixed order, Jaro's first (roll #39); after the sixth, a
// ribbon with no name. The scene line comes with the contract result.

export const ribbonKey = (count: number): string => `ribbon:${count}`;

/** The roll number the nth Ribbonshade carries, or null after the sixth. */
export const ribbonName = (order: number): number | null =>
  roll.find((r) => r.source.kind === 'ribbonshade' && r.source.order === order)?.n ?? null;

/**
 * A Ribbonshade defeated in a contract. Returns the keys for its result: `ribbon:n`
 * (which scene line to show) and the name it carried, if new.
 */
export const defeatRibbonshade = (state: GameState): string[] => {
  state.story.ribbonshades += 1;
  const keys = [ribbonKey(state.story.ribbonshades)];
  const n = ribbonName(state.story.ribbonshades);
  if (n !== null) {
    const k = findName(state, n);
    if (k) keys.push(k);
  }
  return keys;
};
