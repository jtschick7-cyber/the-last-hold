import { BUILDING_IDS, buildings } from '../../content/buildings';
import { traits } from '../../content/traits';
import { hunters } from '../../content/hunters';
import { num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import type { ContractInstance, GameState } from '../state/game-state';
import { hunterStatus } from '../systems/hunters';
import { MS_PER_SECOND } from '../time';
import { isIdentified } from './clues';
import { levelOf, raiseTo } from './knowledge';
import { clueCut } from '../long-night/bonuses';

// GDD §5.6.3: the Hunter's Lodge gives one investigation slot per level. A slot
// reveals a contract's clues one at a time. Investigation takes no hunters [JC].

/** Investigation slots: one per Lodge level. */
export const investigationSlots = (state: GameState): number => {
  let n = 0;
  for (const id of BUILDING_IDS)
    for (const e of buildings[id].effects)
      if (e.kind === 'investigationSlots') n += state.buildings[id] * e.perLevel;
  return n;
};

/**
 * How many Trackers are idle at the hold: owned, on the active roster, not out on a
 * contract and not recovering (GDD §8.5). Each speeds up one slot.
 */
export const idleTrackers = (state: GameState): number =>
  state.roster.active.filter(
    (id) => hunterStatus(state, id) === 'ready' && hunters[id].traits.includes('tracker'),
  ).length;

const trackerCut = (): number => {
  const e = traits.tracker.effect;
  return e.kind === 'clueSpeed' ? e.amount : 0;
};

/**
 * How long the next clue takes, in ms (GDD §5.6.3): 30 min, × 0.5 if the true species is
 * Studied or better, × (1 − 0.25) in a slot a Tracker is speeding up. `slotIndex` is the
 * slot's place in the queue; the first slots are the sped-up ones.
 */
export const clueDuration = (
  state: GameState,
  contract: Pick<ContractInstance, 'monster'>,
  slotIndex: number,
): Explained => {
  const base = num('clue.time') * MS_PER_SECOND;
  const studied = levelOf(state, contract.monster) >= 3;
  const studiedMult = studied ? num('clue.studiedMult') : 1;
  const tracked = slotIndex < idleTrackers(state);
  const trackerMult = tracked ? 1 - trackerCut() : 1;
  const whistle = clueCut(state);
  const relicMult = 1 - whistle.value;
  const value = Math.round(base * studiedMult * trackerMult * relicMult);
  return {
    value,
    breakdown: {
      label: 'Time per clue',
      value,
      formula: `${base / MS_PER_SECOND / 60} min × ${studiedMult} × ${trackerMult} × ${relicMult}`,
      children: [
        { label: 'Base time', value: base, key: 'clue.time' },
        {
          label: 'Species Studied',
          value: studiedMult,
          ...(studied ? { key: 'clue.studiedMult' as const } : {}),
        },
        { label: 'Tracker idle at the hold', value: trackerMult },
        whistle.breakdown,
      ],
    },
  };
};

/** When the soonest clue is due, or null while nothing is being investigated. */
export const nextClueTime = (state: GameState): number | null => {
  let soonest: number | null = null;
  for (const slot of state.queues.investigation)
    if (soonest === null || slot.nextClueAt < soonest) soonest = slot.nextClueAt;
  return soonest;
};

export interface ClueApplied {
  contractId: string;
  at: number;
  revealed: number;
  identified: boolean;
}

/** Reveals the soonest due clue. The caller has moved the clock to its time. */
export const applyClue = (state: GameState): ClueApplied | null => {
  let index = -1;
  state.queues.investigation.forEach((slot, i) => {
    const best = state.queues.investigation[index];
    if (index < 0 || (best && slot.nextClueAt < best.nextClueAt)) index = i;
  });
  const slot = state.queues.investigation[index];
  if (!slot) return null;
  const contract = state.board.open.find((c) => c.id === slot.contractId);
  if (!contract) {
    state.queues.investigation.splice(index, 1);
    return null;
  }
  contract.revealed += 1;
  const identified = isIdentified(state.meta.gameSeed, contract);
  if (identified) {
    raiseTo(state, contract.monster, 2);
    state.queues.investigation.splice(index, 1);
  } else {
    slot.nextClueAt = state.time + clueDuration(state, contract, index).value;
  }
  return { contractId: contract.id, at: state.time, revealed: contract.revealed, identified };
};

/** Frees the slot watching a contract, if any (it was launched, declined or stopped). */
export const releaseSlot = (state: GameState, contractId: string): boolean => {
  const i = state.queues.investigation.findIndex((s) => s.contractId === contractId);
  if (i < 0) return false;
  state.queues.investigation.splice(i, 1);
  return true;
};
