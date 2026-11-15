import type { Canvas } from './pixel';
import {
  drawBarracksV18,
  drawAlchemistV18,
  drawLodgeV18,
  drawTrophyHallV18,
} from './grid-v18-civic';
import { drawBellTowerV18, drawMillV18, drawSawpitV18, drawSmithyV18 } from './grid-v18-industry';

export const LEVEL_BUILDING_FAMILIES = [
  'mill',
  'sawpit',
  'smithy',
  'bell-tower',
  'barracks',
  'trophy-hall',
  'lodge',
  'alchemist',
] as const;

export type LevelBuildingFamily = (typeof LEVEL_BUILDING_FAMILIES)[number];

/** Renders any of the 8 v1.8 level buildings at tiers 1..3 cleanly at 32x32 px. */
export function drawLevelBuildingV18(family: LevelBuildingFamily, tier: 1 | 2 | 3 = 1): Canvas {
  switch (family) {
    case 'mill':
      return drawMillV18(tier);
    case 'sawpit':
      return drawSawpitV18(tier);
    case 'smithy':
      return drawSmithyV18(tier);
    case 'bell-tower':
      return drawBellTowerV18(tier);
    case 'barracks':
      return drawBarracksV18(tier);
    case 'trophy-hall':
      return drawTrophyHallV18();
    case 'lodge':
      return drawLodgeV18(tier);
    case 'alchemist':
      return drawAlchemistV18(tier);
  }
}
