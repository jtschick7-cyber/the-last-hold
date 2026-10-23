import { HOLD_PIECE_IDS, type HoldPieceId } from '../../content/hold-layout';
import type { GameState } from '../state/game-state';
import { getPieceStatus } from '../systems/layout';
import { autoArrange, dropPiece, placePiece, placeRefusal } from '../systems/layout-place';
import { ok, refuse, type ApplyResult } from './types';

// Technical design §19.3 (D502): the Hold's layout commands. Decorative in v1.1: they change only
// `state.layout`, never a rate, a cost, a Threat figure or a fight. A refused command changes nothing.

const known = (id: unknown): id is HoldPieceId =>
  typeof id === 'string' && (HOLD_PIECE_IDS as readonly string[]).includes(id);

export const layoutPlace = (
  state: GameState,
  id: HoldPieceId,
  x: number,
  y: number,
): ApplyResult => {
  const why = known(id) ? placeRefusal(state, id, x, y) : 'layout: no such piece';
  if (why) return refuse(why);
  placePiece(state, id, { x, y });
  return ok;
};

export const layoutUnplace = (state: GameState, id: HoldPieceId): ApplyResult => {
  if (!known(id)) return refuse('layout: no such piece');
  if (id === 'hearth-hall') return refuse('layout: the Hearth Hall stays');
  if (getPieceStatus(state, id) === 'locked') return refuse('layout: piece is locked');
  if (!state.layout.placed[id]) return refuse('layout: piece is not placed');
  dropPiece(state, id);
  return ok;
};

export const layoutAutoArrange = (state: GameState): ApplyResult => {
  autoArrange(state);
  return ok;
};

/** Everything but the Hearth Hall leaves the blueprint: built pieces wait in the tray. */
export const layoutClear = (state: GameState): ApplyResult => {
  const hall = state.layout.placed['hearth-hall'];
  state.layout.placed = hall ? { 'hearth-hall': hall } : {};
  return ok;
};

export const layoutSetShowGhosts = (state: GameState, show: unknown): ApplyResult => {
  if (typeof show !== 'boolean') return refuse('layout: ghosts setting must be on or off');
  state.layout.showGhosts = show;
  return ok;
};
