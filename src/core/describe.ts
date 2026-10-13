import { AGE_IDS, ages, type AgeId } from '../content/ages';
import {
  BUILDING_IDS,
  buildings,
  type BuildingEffect,
  type BuildingId,
} from '../content/buildings';
import { jobs } from '../content/jobs';
import { resources } from '../content/resources';
import { num } from './balance-access';
import { formatDuration } from './format';

// Plain-language descriptions built from content and balance, so the UI shows
// what the engine uses and never restates a number by hand.

const percent = (x: number): string => `${Math.round(x * 100)}%`;

const describeEffect = (e: BuildingEffect): string => {
  switch (e.kind) {
    case 'housing':
      return `+${e.amount} housing`;
    case 'jobSlots':
      return `+${e.amount} ${jobs[e.job].name.toLowerCase()} ${e.amount === 1 ? 'slot' : 'slots'}`;
    case 'production':
      return `+${percent(num(e.perLevelKey))} ${resources[e.resource].name.toLowerCase()}`;
    case 'offlineCap':
      return `+${formatDuration(num(e.perLevelKey))} offline cap`;
    case 'rosterCap':
      return `+${e.perLevel} active hunter${e.perLevel === 1 ? '' : 's'}`;
    case 'trophyBonus':
      return `+${percent(num(e.perTrophyKey))} production per trophy`;
  }
};

/** "+2 housing", "+25% food" … per copy or per level. */
export const describeBuilding = (id: BuildingId): string =>
  buildings[id].effects.map(describeEffect).join(', ');

/** What reaching an Age unlocks (GDD §5.1.3 grants), in plain words. */
export const ageUnlocks = (to: AgeId): string[] => {
  const up = ages[to].ageUp;
  if (!up) return [];
  const prev = AGE_IDS[AGE_IDS.indexOf(to) - 1];
  const lines = [`+${percent(num(up.allProductionKey))} to all production (not silver)`];
  for (const id of BUILDING_IDS) {
    const b = buildings[id];
    if (b.availableFrom === to) lines.push(`New: ${b.name}`);
    else if (b.kind === 'level' && prev && (b.maxLevel[to] ?? 0) > (b.maxLevel[prev] ?? 0)) {
      lines.push(`${b.name} up to level ${b.maxLevel[to] ?? 0}`);
    }
  }
  return lines;
};
