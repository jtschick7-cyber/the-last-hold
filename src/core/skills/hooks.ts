import type { GearDef } from '../../content/gear';
import { RESOURCE_IDS, type ResourceBundle, type ResourceId } from '../../content/resources';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { gainSkillXp, skillBonus, xpTable } from './skills';

// GDD §5.8.6: where each activity feeds its skill, and where each skill's bonus is
// read. The XP numbers are `skill.xp.*` in `balance.ts`.

type AlchemyXp = { brew: number; experiment: number; property: number };
type SmithingXp = { gearPerTier: number; smithyLevel: number };
type LoreXp = { clue: number; knowledgeLevel: number; document: number };
type CommandXp = { contractPerTier: number; wave: number; delveFloor: number };

const roundHalfUp = (x: number): number => Math.floor(x + 0.5);

export const noteBrewFinished = (state: GameState): void => {
  gainSkillXp(state, 'alchemy', xpTable<AlchemyXp>('alchemy').brew);
};

export const noteExperimentFinished = (state: GameState, propertiesRevealed: number): void => {
  const t = xpTable<AlchemyXp>('alchemy');
  gainSkillXp(state, 'alchemy', t.experiment + t.property * propertiesRevealed);
};

export const noteGearUpgraded = (state: GameState, tier: number): void => {
  gainSkillXp(state, 'smithing', xpTable<SmithingXp>('smithing').gearPerTier * tier);
};

export const noteSmithyBuilt = (state: GameState, levels: number): void => {
  gainSkillXp(state, 'smithing', xpTable<SmithingXp>('smithing').smithyLevel * levels);
};

export const noteClue = (state: GameState): void => {
  gainSkillXp(state, 'lore', xpTable<LoreXp>('lore').clue);
};

export const noteKnowledgeLevels = (state: GameState, levels: number): void => {
  gainSkillXp(state, 'lore', xpTable<LoreXp>('lore').knowledgeLevel * levels);
};

/** A document or a hunter's letter was found. */
export const noteDocument = (state: GameState): void => {
  gainSkillXp(state, 'lore', xpTable<LoreXp>('lore').document);
};

export const noteContractWon = (state: GameState, tier: number): void => {
  gainSkillXp(state, 'command', xpTable<CommandXp>('command').contractPerTier * tier);
};

export const noteWavesHeld = (state: GameState, waves: number): void => {
  gainSkillXp(state, 'command', xpTable<CommandXp>('command').wave * waves);
};

/** A Delve floor was cleared in a run that pays Riftglass (GDD §5.10.7, D316). */
export const noteDelveFloor = (state: GameState): void => {
  gainSkillXp(state, 'command', xpTable<CommandXp>('command').delveFloor);
};

/** Smithing: gear upgrades cost this share less, every resource including silver (GDD §5.8.6). */
export const smithingCut = (state: GameState): Explained => skillBonus(state, 'smithing');

/** A gear upgrade's cost after Smithing, each resource rounded to a whole number. */
export const gearCost = (
  state: GameState,
  gear: Pick<GearDef, 'cost'>,
): { cost: Record<ResourceId, number>; breakdown: Breakdown } => {
  const cut = smithingCut(state);
  const cost = Object.fromEntries(
    RESOURCE_IDS.map((r) => [
      r,
      roundHalfUp(((gear.cost as ResourceBundle)[r] ?? 0) * (1 - cut.value)),
    ]),
  ) as Record<ResourceId, number>;
  return { cost, breakdown: cut.breakdown };
};
