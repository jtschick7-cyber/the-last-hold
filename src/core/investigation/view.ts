import { FAMILY_IDS, type FamilyId } from '../../content/damage';
import { MONSTER_IDS, monsters, type MonsterId } from '../../content/monsters';
import { num } from '../balance-access';
import type { ContractInstance, GameState, SpeciesKnowledge } from '../state/game-state';
import { isIdentified, possibleSpecies, revealedClues } from './clues';
import { levelOf, type Level } from './knowledge';

// What the screens read about knowledge. The UI shows these and never works them out,
// and nothing here depends on the true species until the player has the clues to know it.

export interface CandidateView {
  monster: MonsterId;
  level: Level;
  /** The species' name only once it is Identified; otherwise it is "?" on screen. */
  name: string | null;
}

export interface ContractIdentity {
  identified: boolean;
  /** The species, only when identified. */
  monster: MonsterId | null;
  /** Its knowledge level (when identified). */
  level: Level;
  /** Every species the clues so far leave possible. */
  candidates: CandidateView[];
  clues: { tag: string; text: string }[];
}

export const contractIdentity = (
  state: GameState,
  contract: ContractInstance,
): ContractIdentity => {
  const seed = state.meta.gameSeed;
  const identified = isIdentified(seed, contract);
  const candidates = possibleSpecies(seed, contract).map((monster): CandidateView => {
    const level = levelOf(state, monster);
    return { monster, level, name: level >= 2 ? monsters[monster].name : null };
  });
  return {
    identified,
    monster: identified ? contract.monster : null,
    level: identified ? levelOf(state, contract.monster) : 0,
    candidates,
    clues: revealedClues(seed, contract),
  };
};

export interface BestiaryEntry {
  monster: MonsterId;
  level: Level;
  kills: number;
}

export interface BestiaryRow {
  family: FamilyId;
  entries: BestiaryEntry[];
  /** Species Identified or better. */
  known: number;
  total: number;
}

/** The grid: restless dead, water spirits, field and forest spirits, then beasts (GDD §9.8). */
const FAMILY_ORDER: readonly FamilyId[] = [
  'restless-dead',
  'water-spirits',
  'field-and-forest-spirits',
  'beasts-and-wilds',
];

export const bestiaryFamilies = (state: GameState): BestiaryRow[] =>
  FAMILY_ORDER.filter((f) => FAMILY_IDS.includes(f)).map((family) => {
    const entries = MONSTER_IDS.filter((m) => monsters[m].family === family).map(
      (monster): BestiaryEntry => ({
        monster,
        level: levelOf(state, monster),
        kills: state.bestiary[monster]?.kills ?? 0,
      }),
    );
    return {
      family,
      entries,
      known: entries.filter((e) => e.level >= 2).length,
      total: entries.length,
    };
  });

export interface KnowledgeProgress {
  level: Level;
  kills: number;
  /** The next level to reach by kills (3 Studied, 4 Mastered), or null once Mastered. */
  nextLevel: 3 | 4 | null;
  killsToNext: number;
  /** The kill count at which the next level comes. */
  nextAtKills: number;
}

export const knowledgeProgress = (entry: SpeciesKnowledge | undefined): KnowledgeProgress => {
  const studied = num('knowledge.studiedKills');
  const mastered = num('knowledge.masteredKills');
  if (!entry) return { level: 0, kills: 0, nextLevel: null, killsToNext: 0, nextAtKills: studied };
  const kills = entry.kills;
  const level = entry.level as Level;
  if (level >= 4 || kills >= mastered)
    return { level, kills, nextLevel: null, killsToNext: 0, nextAtKills: mastered };
  if (level >= 3 || kills >= studied)
    return { level, kills, nextLevel: 4, killsToNext: mastered - kills, nextAtKills: mastered };
  return { level, kills, nextLevel: 3, killsToNext: studied - kills, nextAtKills: studied };
};
