import { gear } from '../../content/gear';
import { guardianLootBases } from '../../content/items';
import { constantAt, num } from '../balance-access';
import { seeded } from '../rng';
import type { DelveRun } from '../state/delve-state';
import type { GameState } from '../state/game-state';
import { gainXp } from '../systems/hunters';
import { lootKey, pickRarity, rollLines, takeLoot, type RarityWeights } from '../systems/loot';
import { notePeak } from '../story/letters';
import { floorTier } from './generate';

// GDD §5.10.7 (v0.8, D316): what a Delve gives its hunters besides Riftglass. XP to each of the three
// for every floor cleared (`delve.xpPerTier` × the floor's tier) and for the guardian
// (`delve.guardianXpPerTier` × its tier), and one item from the guardian. All of it is paid only
// while the run pays Riftglass, so a quiet night gives none (D316); no trophies, no yard XP.
// The Command XP per floor waits for Q26 (where its constant lives) and is not paid yet.

/** Pays the XP of a cleared floor (or the guardian) to the run's three hunters, and the guardian's item. */
export const payHunterRewards = (
  state: GameState,
  run: DelveRun,
  floor: number,
  riftglassPaid: number,
  guardian: boolean,
): void => {
  if (riftglassPaid <= 0) return;
  const tier = floorTier(run.baseTier, floor);
  const xp = (guardian ? num('delve.guardianXpPerTier') : num('delve.xpPerTier')) * tier;
  for (const id of run.party) {
    const h = state.hunters[id];
    if (!h) continue;
    for (const level of gainXp(state, h, xp)) notePeak(state, id, level);
  }
  run.earned.xp = (run.earned.xp ?? 0) + xp;
  if (guardian) run.earned.item = guardianItem(state, run);
};

/**
 * The guardian's item (D316): a Silvered Blade or an Emberwright Plate (half each, like contract
 * loot, D328 (1)), rarity by `delve.guardianLootWeights`, from the run's own stream
 * `${runSeed}:loot` (D328 (9)). Same items as contract loot, into Stores or salvaged when full.
 */
const guardianItem = (state: GameState, run: DelveRun): string => {
  const rng = seeded(`${run.seed}:loot`);
  const base =
    gear[guardianLootBases[Math.floor(rng.next() * guardianLootBases.length)] ?? 'silvered-blade'];
  const rarity = pickRarity(rng, constantAt('delve.guardianLootWeights').value as RarityWeights);
  return lootKey(takeLoot(state, { base, rarity, lines: rollLines(rng, rarity) }));
};
