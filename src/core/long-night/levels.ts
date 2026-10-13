import { UPGRADE_IDS, upgrades } from '../../content/warden-upgrades';
import { num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';

// GDD §5.9.7 (D110): each hunter keeps a share of the levels above 1, rounded down
// (half by default: 6 → 3, 5 → 3, 4 → 2); Old Hands raises the share (GDD §8.9).

export const levelsKeptShare = (state: GameState): Explained => {
  const base = num('longNight.levelsKept');
  let extra = 0;
  for (const id of UPGRADE_IDS) {
    const e = upgrades[id].effect;
    if (e.kind === 'levelsKept') extra += e.perLevel * state.upgrades[id];
  }
  const value = Math.min(1, base + extra);
  return {
    value,
    breakdown: {
      label: 'Levels kept at the Long Night',
      value,
      formula: `${base} + ${extra}`,
      children: [
        { label: 'Base share', value: base, key: 'longNight.levelsKept' },
        { label: upgrades['old-hands'].name, value: extra },
      ],
    },
  };
};

/** `1 + floor((L − 1) × share)`. */
export const keptLevel = (level: number, share: number): number =>
  1 + Math.floor((level - 1) * share);
