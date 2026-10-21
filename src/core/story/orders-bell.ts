import { balance } from '../../content/balance';
import { bellWatchersGroups, bellWatchersRemarks } from '../../content/story/orders-perks';
import { roll, type RollName } from '../../content/story/roll';
import { villages } from '../../content/villages';
import type { GameState } from '../state/game-state';
import { orderLevel } from '../systems/orders';

// lore-secrets §33 E3 (D411, Q37 (a)): the Bell-Watchers' sharper "where to look" sentence for names still
// missing from the Names view. It is GENERATED from the roll, never typed, and adds no name, source or
// document: it says only how many springs, from which year to which, and from which villages.

const COUNT = [
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
] as const;
/** The order the village clause lists villages in (lore §33 E3). */
const VILLAGE_ORDER = ['Dubno Ford', 'Kozly Hollow', 'Mirograd', 'Ravenfell', 'Velkvik'] as const;

/** `{Count} {springs|spring}, {year clause}, {village clause}.` built from the names still missing. */
export const bellSentence = (missing: readonly RollName[]): string | null => {
  if (missing.length === 0) return null;
  const years = missing.map((r) => r.year);
  const first = Math.min(...years);
  const last = Math.max(...years);
  const names = VILLAGE_ORDER.filter((v) => missing.some((r) => villages[r.village].name === v));
  const each = (list: readonly string[]): string =>
    list.length === 1
      ? (list[0] ?? '')
      : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1] ?? ''}`;
  const count = `${COUNT[missing.length - 1] ?? String(missing.length)} ${missing.length === 1 ? 'spring' : 'springs'}`;
  const year = missing.length === 1 ? `year ${first}` : `from year ${first} to year ${last}`;
  const left = VILLAGE_ORDER.filter((v) => !names.includes(v));
  const where =
    names.length === VILLAGE_ORDER.length
      ? 'from every village'
      : names.length === VILLAGE_ORDER.length - 1
        ? `from every village but ${left[0] ?? ''}`
        : `from ${each(names)}`;
  return `${count}, ${year}, ${where}.`;
};

export interface BellExtra {
  /** The Bell-Watchers' level, 1 to 4. */
  level: 1 | 2 | 3 | 4;
  /** The roll numbers of the group's names still missing. */
  missing: number[];
  /** The sentence added after each of those names' old hints (the same for all of them), or null. */
  sentence: string | null;
  /** The remark under the Names heading when no name of the group is missing, or null. */
  remark: string | null;
}

/** What the Bell-Watchers add to the Names view now; null while they are not seated (or at level 0). */
export const bellExtra = (state: GameState): BellExtra | null => {
  if (!state.orders.seats.includes('bellWatchers')) return null;
  const level = Math.min(orderLevel(state, 'bellWatchers'), balance.orders.levels.value);
  if (level < 1) return null;
  const n = level as 1 | 2 | 3 | 4;
  const found = new Set(state.story.names.map((x) => x.n));
  const group = bellWatchersGroups[n].flatMap((k) => roll.find((r) => r.n === k) ?? []);
  const missing = group.filter((r) => !found.has(r.n));
  const sentence = bellSentence(missing);
  return {
    level: n,
    missing: missing.map((r) => r.n),
    sentence,
    remark: sentence === null ? bellWatchersRemarks[n] : null,
  };
};

/** The extra sentence for one name in the Names view, or null (not in the group, found, or not seated). */
export const bellSentenceFor = (state: GameState, rollNumber: number): string | null => {
  const extra = bellExtra(state);
  return extra?.missing.includes(rollNumber) ? extra.sentence : null;
};
