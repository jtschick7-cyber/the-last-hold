import { signal } from '@preact/signals';
import { residents } from '../../content/residents';
import { lineTriggerRules, residentLines, type LineTrigger } from '../../content/text/lines';

// setting-primer §6.2: Brana and Pechko speak when something happens. The UI
// only notices the moment (a count crossing a line) and shows the text.
export interface SpokenLine {
  readonly id: number;
  readonly speaker: string;
  readonly text: string;
}

export const spoken = signal<SpokenLine | null>(null);
const used: Partial<Record<LineTrigger, number>> = {};
let nextId = 1;

export const say = (trigger: LineTrigger, count?: number): void => {
  const t = residentLines[trigger];
  const n = used[trigger] ?? 0;
  used[trigger] = n + 1;
  const text = (t.variants[n % t.variants.length] ?? '').replaceAll('{count}', String(count ?? ''));
  spoken.value = { id: nextId++, speaker: residents[t.speaker].shortName, text };
};

export interface Watched {
  bought: number;
  peasants: number;
  idle: number;
  age: string;
  /** Contracts won so far, for the first-success line. */
  won: number;
}

/** Compares before and after a change and speaks for whatever just happened. */
export const noticeChanges = (before: Watched, after: Watched): void => {
  if (after.age !== before.age) return say('age-up');
  if (before.won === 0 && after.won > 0) return say('first-contract-success');
  if (before.bought === 0 && after.bought > 0) return say('first-building');
  const milestone = lineTriggerRules.peasantMilestones.find(
    (m) => before.peasants < m && after.peasants >= m,
  );
  if (milestone !== undefined) return say('peasant-milestone', milestone);
  if (before.idle === 0 && after.idle > 0) return say('idle-peasants', after.idle);
};
