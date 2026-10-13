// GDD §5.6.2: the five knowledge levels of a species. The thresholds and bonuses
// are balance constants (knowledge.*); this file names the levels and what they do.

export const KNOWLEDGE_LEVELS = [
  'unknown',
  'sighted',
  'identified',
  'studied',
  'mastered',
] as const;
export type KnowledgeLevel = (typeof KNOWLEDGE_LEVELS)[number];

export interface KnowledgeLevelDef {
  readonly id: KnowledgeLevel;
  readonly number: number;
  readonly name: string;
  /** How you reach it (player-facing, GDD §5.6.2). */
  readonly how: string;
  /** What it does (player-facing). */
  readonly effect: string;
}

export const knowledgeLevels: Readonly<Record<KnowledgeLevel, KnowledgeLevelDef>> = {
  unknown: {
    id: 'unknown',
    number: 0,
    name: 'Unknown',
    how: 'Not yet met.',
    effect: "It doesn't appear in candidate lists, and its entry is hidden.",
  },
  sighted: {
    id: 'sighted',
    number: 1,
    name: 'Sighted',
    how: 'It appeared as a possibility on a contract.',
    effect: 'Shown as "?" in candidate lists. A silhouette entry in the bestiary.',
  },
  identified: {
    id: 'identified',
    number: 2,
    name: 'Identified',
    how: 'Identify it through investigation, or fight it.',
    effect: 'Its stats, resistances and abilities are visible, and preparation can target it.',
  },
  studied: {
    id: 'studied',
    number: 3,
    name: 'Studied',
    how: '3 kills.',
    effect:
      'Clues on its contracts take half the time, and your hunters deal 5% more damage to it.',
  },
  mastered: {
    id: 'mastered',
    number: 4,
    name: 'Mastered',
    how: '10 kills.',
    effect:
      'Its contracts arrive already identified, your hunters deal 10% more damage to it, and each of its abilities has a counter-tip.',
  },
};
