import { BUILDING_IDS, buildings, type BuildingId } from '../../content/buildings';
import { PIECES } from '../../content/hold-layout';
import type { GameState } from '../state/game-state';
import { levelCapIn } from '../systems/ages';
import { copyLimit } from '../systems/costs';
import { autoArrange } from '../systems/layout-place';
import { unlockAge } from './debug';
import { layoutAutoArrange, layoutClear } from './layout';
import { ok, type ApplyResult } from './types';

// Plan TL.4 (technical design §15, N4): debug ways to look at the Hold's layout. Like every debug
// action they set meta.debugUsed, and they are reached only from the debug panel.

export const debugLayoutAutoArrange = (state: GameState): ApplyResult => {
  layoutAutoArrange(state);
  state.meta.debugUsed = true;
  return ok;
};

export const debugLayoutClear = (state: GameState): ApplyResult => {
  layoutClear(state);
  state.meta.debugUsed = true;
  return ok;
};

/** The count or level at which a building's last piece (or its last look) appears. */
const needed = (id: BuildingId): number =>
  PIECES.filter((p) => p.building === id).reduce(
    (n, p) => Math.max(n, p.unlockAt, p.tierFrom?.[1] ?? 0),
    0,
  );

/**
 * Takes the hold to Bastion with every building at the figure that shows all its pieces in their
 * highest look (never past its copy limit or its Bastion level cap), then lays the Hold out in the
 * canonical arrangement so all 40 pieces stand on the grid. This replaces any saved layout.
 */
export const debugLayoutFillBastion = (state: GameState): ApplyResult => {
  unlockAge(state, 'bastion');
  for (const id of BUILDING_IDS) {
    const want = needed(id);
    if (want === 0) continue;
    const def = buildings[id];
    const cap = def.kind === 'level' ? levelCapIn(def, 'bastion') : copyLimit(id);
    state.buildings[id] = Math.max(state.buildings[id], Math.min(want, cap ?? want));
  }
  autoArrange(state);
  state.meta.debugUsed = true;
  return ok;
};
