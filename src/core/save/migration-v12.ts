import type { HoldLayoutState } from '../state/layout-state';
import type { Migration } from './migrations';

// v11 → v12 (plan TL.1, D502, technical design §19.2): the Hold's layout blueprint at the time
// v12 shipped on the original 8 × 8 grid. Keeping v12's frozen coordinates here ensures v1..v11
// saves pass once through the v15 → v16 inner-ward shift without double-shifting.
const V12_CANONICAL_LAYOUT: HoldLayoutState = {
  showGhosts: true,
  placed: {
    'hearth-hall': { x: 3, y: 3 },
    'silver-seam-2': { x: 2, y: 2 },
    smithy: { x: 3, y: 2 },
    'silver-seam-1': { x: 4, y: 2 },
    'mine-1': { x: 5, y: 2 },
    mill: { x: 2, y: 3 },
    sawpit: { x: 5, y: 3 },
    'farm-1': { x: 2, y: 4 },
    'woodcutter-1': { x: 5, y: 4 },
    'cottage-1': { x: 2, y: 5 },
    'cottage-2': { x: 3, y: 5 },
    'farm-2': { x: 4, y: 5 },
    'woodcutter-2': { x: 5, y: 5 },
    alchemist: { x: 1, y: 2 },
    'herb-garden-1': { x: 1, y: 3 },
    'herb-garden-2': { x: 1, y: 4 },
    'herb-garden-3': { x: 1, y: 5 },
    'mine-2': { x: 6, y: 2 },
    'mine-3': { x: 6, y: 3 },
    lodge: { x: 6, y: 4 },
    barracks: { x: 6, y: 5 },
    'trophy-hall': { x: 1, y: 6 },
    'bell-tower': { x: 2, y: 6 },
    'cottage-3': { x: 3, y: 6 },
    'farm-3': { x: 4, y: 6 },
    'woodcutter-3': { x: 5, y: 6 },
    'wall-1': { x: 0, y: 1 },
    'wall-2': { x: 1, y: 1 },
    'watchtower-1': { x: 2, y: 1 },
    'wall-3': { x: 3, y: 1 },
    'wall-4': { x: 4, y: 1 },
    'watchtower-2': { x: 5, y: 1 },
    'wall-5': { x: 6, y: 1 },
    'wall-6': { x: 7, y: 1 },
    'wall-7': { x: 0, y: 2 },
    'wall-8': { x: 7, y: 2 },
    'wall-9': { x: 2, y: 0 },
    'watchtower-3': { x: 3, y: 0 },
    'wall-10': { x: 4, y: 0 },
    'wall-11': { x: 5, y: 0 },
  },
};

export const v11ToV12: Migration = (state) => ({
  ...structuredClone(state),
  layout: structuredClone(V12_CANONICAL_LAYOUT),
});
