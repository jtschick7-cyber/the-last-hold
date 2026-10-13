import { HUNTER_IDS, hunters, type HunterId } from '../../content/hunters';
import type { HunterState } from './game-state';

/** A hunter just arrived: level 1, no gear, fit (GDD §5.3). */
export const freshHunter = (): HunterState => ({
  level: 1,
  xp: 0,
  weapon: null,
  armor: null,
  recovery: null,
  record: { won: 0, lost: 0 },
});

/** The hunters every new game starts with: those whose unlock is "start" (GDD §8.5, free). */
export const startingHunters = (): HunterId[] =>
  HUNTER_IDS.filter((h) => hunters[h].unlock.kind === 'start');
