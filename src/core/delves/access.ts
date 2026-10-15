import type { AgeId } from '../../content/ages';
import type { HunterId } from '../../content/hunters';
import { hunters } from '../../content/hunters';
import { balance } from '../../content/balance';
import type { GameState } from '../state/game-state';
import { availableHunters } from '../systems/hunters';

// GDD §5.10.1, §5.10.3 (D249): Delves open for good the first time any warden reaches the Keep.

/** True once any warden has reached the Keep (a cycle's Rank record, or this cycle's Rank). */
export const delvesOpen = (state: GameState): boolean =>
  state.cycles.some((c) => c.ranks.keep !== undefined) || state.cycle.age !== 'hamlet';

/** The Rank a run's depth follows, now: the Hamlet counts as the Keep, whose depth is the shallowest (D249). */
export const runRank = (state: GameState): Exclude<AgeId, 'hamlet'> =>
  state.cycle.age === 'hamlet' ? 'keep' : state.cycle.age;

/** The tier of floors 1–3, fixed when a run starts (D249). */
export const baseTierFor = (state: GameState): number =>
  balance.delve.baseTier.value[runRank(state)];

/** The Rank a run of this base tier started at, for the relics that name one (D261). */
export const rankOfBaseTier = (baseTier: number): Exclude<AgeId, 'hamlet'> =>
  baseTier >= balance.delve.baseTier.value.bastion
    ? 'bastion'
    : baseTier >= balance.delve.baseTier.value.citadel
      ? 'citadel'
      : 'keep';

/** Why a hunter cannot enter, or null if they can (GDD §9.15: greyed with the reason). */
export const entryProblem = (state: GameState, id: HunterId): string | null => {
  if (!state.hunters[id]) return 'not at the hold';
  if (!state.roster.active.includes(id)) return 'in the reserve';
  if (state.running.some((r) => r.party.includes(id))) return 'on a contract';
  if (state.delve.run?.party.includes(id)) return 'in a Delve';
  return availableHunters(state).includes(id) ? null : 'recovering';
};

/**
 * The suggested three (GDD §9.15): a Vanguard, a Striker and a Mender if the roster has them,
 * the highest levels first; then the highest levels left.
 */
export const suggestedParty = (state: GameState): HunterId[] => {
  const free = availableHunters(state);
  const level = (id: HunterId): number => state.hunters[id]?.level ?? 0;
  const byLevel = [...free].sort(
    (a, b) => level(b) - level(a) || free.indexOf(a) - free.indexOf(b),
  );
  const chosen: HunterId[] = [];
  for (const role of ['vanguard', 'striker', 'mender'] as const) {
    const h = byLevel.find((id) => hunters[id].role === role && !chosen.includes(id));
    if (h) chosen.push(h);
  }
  for (const id of byLevel) {
    if (chosen.length >= balance.delve.partySize.value) break;
    if (!chosen.includes(id)) chosen.push(id);
  }
  return free.filter((id) => chosen.includes(id)); // party slot order = roster order
};
