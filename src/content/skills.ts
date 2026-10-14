// GDD §5.8.6 (D205): the four warden skills. They rise by doing their activity and
// are kept forever. The numbers (XP, curve, bonuses) are balance constants (§7.8).

export const SKILL_IDS = ['alchemy', 'smithing', 'lore', 'command'] as const;
export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillDef {
  readonly id: SkillId;
  readonly name: string;
  /** What each level gives, for the Rank screen (GDD §5.8.6). */
  readonly gives: string;
}

export const skills: Readonly<Record<SkillId, SkillDef>> = {
  alchemy: { id: 'alchemy', name: 'Alchemy', gives: 'Brews are stronger' },
  smithing: { id: 'smithing', name: 'Smithing', gives: 'Gear upgrades cost less' },
  lore: { id: 'lore', name: 'Lore', gives: 'Clues take less time' },
  command: { id: 'command', name: 'Command', gives: 'Hunters earn more contract XP' },
};
