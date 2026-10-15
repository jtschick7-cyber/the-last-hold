import type { GameState } from '../../src/core/state/game-state';
import { itemById } from '../../src/core/systems/items';

// The v8 schema changed how hunters hold gear and added fields. The tests of the older migrations
// compare a migrated save with the original; these show the migrated state in the old form
// (gear ids in the slots, none of the v8 hunter fields, no trophiesSpent).

export const oldHunters = (s: GameState): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(s.hunters).map(([id, h]) => {
      const rest: Record<string, unknown> = { ...h };
      for (const k of ['rank', 'stars', 'talents', 'keepsake']) Reflect.deleteProperty(rest, k);
      return [
        id,
        {
          ...rest,
          weapon: itemById(s, h.weapon)?.base ?? null,
          armor: itemById(s, h.armor)?.base ?? null,
        },
      ];
    }),
  );

export const oldStats = (s: GameState): Record<string, unknown> => {
  const rest: Record<string, unknown> = { ...s.stats };
  Reflect.deleteProperty(rest, 'trophiesSpent');
  return rest;
};

/** A migrated state's key, in the form the original save had. */
export const oldKey = (s: GameState, key: keyof GameState): unknown =>
  key === 'hunters' ? oldHunters(s) : key === 'stats' ? oldStats(s) : s[key];
