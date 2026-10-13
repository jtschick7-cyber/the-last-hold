import { BUILDING_IDS, buildings } from '../../content/buildings';
import { num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { offlineExtensions } from '../long-night/bonuses';

// GDD §5.2 / §7.2: cap = base + Σ extensions, never above the ceiling. Seconds.
export const offlineCap = (state: GameState): Explained => {
  const base = num('offline.baseCap');
  const ceiling = num('offline.ceiling');
  const extensions: Breakdown[] = BUILDING_IDS.flatMap((id) => {
    const level = state.buildings[id];
    return buildings[id].effects.flatMap((e) =>
      e.kind === 'offlineCap' && level > 0
        ? [
            {
              label: `${buildings[id].name} level ${level}`,
              value: level * num(e.perLevelKey),
              key: e.perLevelKey,
            },
          ]
        : [],
    );
  });
  // GDD §8.9: Late Lantern, still within the ceiling.
  extensions.push(...offlineExtensions(state));
  const uncapped = base + extensions.reduce((s, e) => s + e.value, 0);
  const value = Math.min(uncapped, ceiling);
  return {
    value,
    breakdown: {
      label: 'Offline cap (seconds)',
      value,
      formula: 'min(base + Σ extensions, ceiling)',
      children: [
        { label: 'Base', value: base, key: 'offline.baseCap' },
        ...extensions,
        { label: 'Ceiling', value: ceiling, key: 'offline.ceiling' },
      ],
    },
  };
};
