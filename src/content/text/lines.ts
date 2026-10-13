import type { ResidentId } from '../residents';

// setting-primer §6.2: short lines, at most one sentence each, 3–5 variants per
// trigger. "{count}" is filled in by the UI for triggers that carry a number.
export const LINE_TRIGGERS = [
  'first-building',
  'idle-peasants',
  'long-absence',
  'peasant-milestone',
  'age-up',
  'first-contract-success',
] as const;
export type LineTrigger = (typeof LINE_TRIGGERS)[number];

export interface TriggerLines {
  readonly speaker: ResidentId;
  /** Placeholders this trigger fills in; any other {…} in a line is an error. */
  readonly placeholders: readonly 'count'[];
  readonly variants: readonly string[];
}

export const residentLines: Readonly<Record<LineTrigger, TriggerLines>> = {
  'first-building': {
    speaker: 'brana',
    placeholders: [],
    variants: [
      "That's one. I'll start a list.",
      "One more roof than yesterday. I've written it down.",
      "Good timber, square corners. I'll take it.",
      'Built and paid for. My favorite kind.',
    ],
  },
  'idle-peasants': {
    speaker: 'brana',
    placeholders: ['count'],
    variants: [
      "I've got hands sitting on their hands, warden.",
      "{count} idle. They're starting to talk, and nobody wants that.",
      'Idle folk eat the same as busy ones. Give them work.',
      "Someone's out there counting clouds. Find them a job.",
    ],
  },
  'long-absence': {
    speaker: 'pechko',
    placeholders: [],
    variants: [
      "You were gone. The stove wasn't. Sit.",
      "Long road? The bread's still warm. Mostly.",
      "I swept while you were away. Twice. Don't look in the corners.",
      "The hold kept itself. It's better at it than you'd think.",
    ],
  },
  'peasant-milestone': {
    speaker: 'brana',
    placeholders: ['count'],
    variants: [
      "{count} souls. {count} mouths. I'll manage.",
      "{count} now. I've stopped counting on my fingers.",
      '{count} people under our roofs, and the roofs are holding.',
      "{count}. The kitchen's crowded, and that's a good problem.",
    ],
  },
  'age-up': {
    speaker: 'pechko',
    placeholders: [],
    variants: [
      'The old stones remember being a fortress. Let them.',
      "Walls again. I'd almost forgotten how they sound in the wind.",
      'Good. A hold should look like a hold.',
      "The stove draws better already. Don't ask me how I know.",
    ],
  },
  'first-contract-success': {
    speaker: 'brana',
    placeholders: [],
    variants: [
      'Silver. Real silver. Say it again so I believe it.',
      'They came back with all their fingers and a purse. Write that down.',
      "That's what a bounty looks like. Pretty, isn't it.",
      "A contract done, silver counted twice. I'll find it a drawer.",
    ],
  },
};

// When the triggers fire (setting-primer §6.2). Tunable content (D44).
export const lineTriggerRules = {
  /** "Long absence (≥ 8 h)". */
  longAbsenceSeconds: 8 * 3600,
  /** "Peasant milestone (10, 25, 50…)"; the primer's "…" continued in the same pattern [JC]. */
  peasantMilestones: [10, 25, 50, 100, 250, 500, 1000],
} as const;
