import { isIdentified } from '../investigation/clues';
import { clueDuration, investigationSlots, releaseSlot } from '../investigation/lodge';
import type { GameState } from '../state/game-state';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.6.3: assigning a contract to a Lodge slot, and taking it off again.

export const assign = (state: GameState, contractId: string): ApplyResult => {
  const contract = state.board.open.find((c) => c.id === contractId);
  if (!contract) return refuse('That contract is no longer on the board.');
  if (investigationSlots(state) === 0) return refuse('Build a Hunter’s Lodge to investigate.');
  if (state.queues.investigation.some((s) => s.contractId === contractId))
    return refuse('That contract is already being investigated.');
  if (isIdentified(state.meta.gameSeed, contract))
    return refuse('There is nothing more to learn about that monster.');
  if (state.queues.investigation.length >= investigationSlots(state))
    return refuse('Every Lodge slot is busy.');
  const slotIndex = state.queues.investigation.length;
  state.queues.investigation.push({
    contractId,
    nextClueAt: state.time + clueDuration(state, contract, slotIndex).value,
  });
  return ok;
};

/** Stops a slot: the clues already shown stay, the half-finished one is lost. */
export const stop = (state: GameState, contractId: string): ApplyResult =>
  releaseSlot(state, contractId) ? ok : refuse('That contract is not being investigated.');
