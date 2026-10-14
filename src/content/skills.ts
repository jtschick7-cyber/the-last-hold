// GDD §5.8.6 (D205): the four warden skills. They rise by doing their activity and
// are kept forever. The numbers (XP, curve, bonuses) are balance constants (§7.8).

export const SKILL_IDS = ['alchemy', 'smithing', 'lore', 'command'] as const;
export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillDef {
  readonly id: SkillId;
  readonly name: string;
  /** What each level gives, for the Rank screen (GDD §5.8.6). */
  readonly gives: string;
  /** Whether the bonus adds (+) or takes off (−), for its sign on screen. */
  readonly sign: '+' | '−';
}

export const skills: Readonly<Record<SkillId, SkillDef>> = {
  alchemy: { id: 'alchemy', name: 'Alchemy', gives: 'Brews are stronger', sign: '+' },
  smithing: { id: 'smithing', name: 'Smithing', gives: 'Gear upgrades cost less', sign: '−' },
  lore: { id: 'lore', name: 'Lore', gives: 'Clues take less time', sign: '−' },
  command: { id: 'command', name: 'Command', gives: 'Hunters earn more contract XP', sign: '+' },
};

/** GDD §5.8.6: one line on the away sheet or results when a level is reached. */
export const emberRemembersMore = (name: string, level: number): string =>
  `The ember remembers more: ${name} ${level}.`;

/** GDD §5.8.6: the new-warden sheet lists them all. */
export const emberRemembers = (levels: readonly { name: string; level: number }[]): string =>
  `The ember remembers: ${levels.map((l) => `${l.name} ${l.level}`).join(' · ')}.`;
