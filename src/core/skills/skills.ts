import { SKILL_IDS, skills, type SkillId } from '../../content/skills';
import { constantAt, num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import { intPow } from '../math';
import type { GameState } from '../state/game-state';

// GDD §5.8.6 (D205): four warden skills that rise by doing their activity and are
// kept forever. Level L → L+1 costs `skill.xpBase × skill.xpGrowth^L` XP, rounded to
// a whole number; the level is derived from the XP, never stored.

const roundHalfUp = (x: number): number => Math.floor(x + 0.5);

export const maxSkillLevel = (): number => num('skill.maxLevel');

/** The XP it takes to go from `level` to the next; 0 at the highest level. */
export const xpToNext = (level: number): number =>
  level >= maxSkillLevel()
    ? 0
    : roundHalfUp(num('skill.xpBase') * intPow(num('skill.xpGrowth'), level));

/** The level a skill has reached with this much XP. */
export const levelFor = (xp: number): number => {
  let level = 0;
  let left = xp;
  while (level < maxSkillLevel() && left >= xpToNext(level)) {
    left -= xpToNext(level);
    level += 1;
  }
  return level;
};

export interface SkillProgress {
  readonly level: number;
  /** XP gained toward the next level. */
  readonly into: number;
  /** XP the next level takes; 0 at the highest level. */
  readonly needed: number;
}

export const progressFor = (xp: number): SkillProgress => {
  const level = levelFor(xp);
  let spent = 0;
  for (let l = 0; l < level; l++) spent += xpToNext(l);
  return level >= maxSkillLevel()
    ? { level, into: 0, needed: 0 }
    : { level, into: xp - spent, needed: xpToNext(level) };
};

export const skillLevel = (state: GameState, skill: SkillId): number =>
  levelFor(state.skills[skill]);

export const skillLevels = (state: GameState): Record<SkillId, number> =>
  Object.fromEntries(SKILL_IDS.map((id) => [id, skillLevel(state, id)])) as Record<SkillId, number>;

/** Adds XP; returns the new level when it went up, else null. */
export const gainSkillXp = (state: GameState, skill: SkillId, amount: number): number | null => {
  if (amount <= 0) return null;
  const before = skillLevel(state, skill);
  state.skills[skill] += amount;
  const after = skillLevel(state, skill);
  return after > before ? after : null;
};

/** The XP table for a skill, as `balance.ts` holds it. */
export const xpTable = <T extends Record<string, number>>(
  skill: 'alchemy' | 'smithing' | 'lore' | 'command',
): T => constantAt(`skill.xp.${skill}`).value as T;

const BONUS_KEYS = {
  alchemy: 'skill.alchemyPotency',
  smithing: 'skill.smithingCost',
  lore: 'skill.loreClueTime',
  command: 'skill.commandXp',
} as const;

/** What one level of a skill gives (a share), from `balance.ts`. */
export const perLevel = (skill: SkillId): number => num(BONUS_KEYS[skill]);

/**
 * A skill's bonus as a share at a given level, with its breakdown line ("Lore 4: 16%").
 * Alchemy takes the level frozen on a fight; the others read the hold now.
 */
export const skillBonusAt = (skill: SkillId, level: number): Explained => {
  const step = perLevel(skill);
  const value = step * level;
  const line: Breakdown = {
    label: `${skills[skill].name} ${level}`,
    value,
    formula: `${step} × ${level}`,
    key: BONUS_KEYS[skill],
  };
  return { value, breakdown: line };
};

export const skillBonus = (state: GameState, skill: SkillId): Explained =>
  skillBonusAt(skill, skillLevel(state, skill));

/** What the Rank screen shows for one skill (GDD §5.8.6): level, progress, bonus and its breakdown. */
export interface SkillView {
  readonly id: SkillId;
  readonly name: string;
  readonly gives: string;
  readonly level: number;
  readonly progress: SkillProgress;
  readonly maxed: boolean;
  /** The bonus at this level as a share (0.12 = 12%), with its breakdown line. */
  readonly bonus: Explained;
  /** "+12%" or "−12%". */
  readonly bonusText: string;
}

const percent = (share: number): string => `${Math.round(share * 1000) / 10}%`;

export const skillViews = (state: GameState): SkillView[] =>
  SKILL_IDS.map((id) => {
    const progress = progressFor(state.skills[id]);
    const bonus = skillBonusAt(id, progress.level);
    const detail =
      progress.needed === 0
        ? 'Highest level'
        : `${progress.into} of ${progress.needed} XP toward level ${progress.level + 1}`;
    return {
      id,
      name: skills[id].name,
      gives: skills[id].gives,
      level: progress.level,
      progress,
      maxed: progress.needed === 0,
      bonus: {
        value: bonus.value,
        breakdown: {
          ...bonus.breakdown,
          children: [
            { label: `${skills[id].name} experience`, value: state.skills[id], formula: detail },
          ],
        },
      },
      bonusText: `${skills[id].sign}${percent(bonus.value)}`,
    };
  });
