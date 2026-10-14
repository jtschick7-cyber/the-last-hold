import { RELIC_IDS, type RelicId } from '../../content/relics';
import { constantAt } from '../balance-access';
import { seeded } from '../rng';
import type { GameState } from '../state/game-state';

// GDD §5.9.6 (D111): the first time any stand holds wave 6, 9, 12, 15, 18 and 21,
// the hold finds one relic it doesn't have yet, picked by the stand's seed.

/** The most waves any stand has held, in any cycle. */
export const bestWavesEver = (state: GameState): number =>
  state.cycles.reduce((best, c) => Math.max(best, c.stand?.wavesHeld ?? 0), 0);

/** The relics a stand finds: one per milestone passed for the first time, among those not owned. */
export const relicsFound = (
  seed: string,
  wavesHeld: number,
  bestBefore: number,
  owned: readonly RelicId[],
): RelicId[] => {
  const milestones = constantAt('relics.waveMilestones').value as readonly number[];
  const have = new Set<RelicId>(owned);
  const found: RelicId[] = [];
  for (const m of milestones) {
    if (m <= bestBefore || m > wavesHeld) continue;
    const pool = RELIC_IDS.filter((r) => !have.has(r));
    if (pool.length === 0) break;
    const roll = seeded(`${seed}:relic:${m}`).next();
    const pick = pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))];
    if (!pick) break;
    have.add(pick);
    found.push(pick);
  }
  return found;
};
