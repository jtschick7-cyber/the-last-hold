import { AGE_IDS, ages, type AgeId } from '../content/ages';
import {
  BUILDING_IDS,
  buildings,
  type BuildingEffect,
  type BuildingId,
} from '../content/buildings';
import { jobs } from '../content/jobs';
import type { MonsterAbility } from '../content/monsters';
import { resources } from '../content/resources';
import { constantAt, num } from './balance-access';
import { formatDuration } from './format';
import { levelCapIn } from './systems/ages';

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
    case 'investigationSlots':
      return `+${e.perLevel} investigation slot${e.perLevel === 1 ? '' : 's'}`;
    case 'brewSlots':
      return `+${e.perLevel} kettle${e.perLevel === 1 ? '' : 's'}`;
    case 'herbGrowth':
      return `grows yarrow, mugwort and juniper, one each every ${formatDuration(num(e.intervalKey))}`;
    case 'threatSlow':
      return `Threat rises ${percent(num(e.perLevelKey))} slower`;
    case 'standTaken':
      return `${percent(num(e.perLevelKey))} less damage taken in the Last Stand`;
    case 'standVolley':
      return `a volley of ${num(e.perLevelKey)} Steel damage at the start of each wave`;
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
  // D106: the Rank tables in balance.ts, read the way the engine reads them.
  const table = (key: 'hunter.levelCap' | 'roster.ageBonus' | 'bounty.ageMult') =>
    constantAt(key).value as Readonly<Record<string, number>>;
  const hunterCap = (age: AgeId): number =>
    table('hunter.levelCap')[age] ?? table('hunter.levelCap')['keep'] ?? 0;
  if (prev && hunterCap(to) > hunterCap(prev)) lines.push(`Hunters up to level ${hunterCap(to)}`);
  const roster = table('roster.ageBonus')[to] ?? 0;
  if (roster > 0) lines.push(`+${roster} active hunters`);
  const pay = (age: AgeId): number => table('bounty.ageMult')[age] ?? 1;
  if (prev && pay(to) !== pay(prev)) lines.push(`Bounties ×${pay(to)}`);
  for (const id of BUILDING_IDS) {
    const b = buildings[id];
    if (b.availableFrom === to) lines.push(`New: ${b.name}`);
    else if (b.kind === 'level' && prev && levelCapIn(b, to) > levelCapIn(b, prev)) {
      lines.push(`${b.name} up to level ${levelCapIn(b, to)}`);
    }
  }
  for (const line of up.alsoUnlocks ?? []) lines.push(line);
  return lines;
};

const ordinal = (n: number): string => {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 ? 0 : n % 10] ?? 'th'}`;
};

/** An ability in plain words, built from its numbers so it can never disagree with the fight (GDD §8.3). */
export const describeAbility = (a: MonsterAbility): string => {
  switch (a.kind) {
    case 'hamstring':
      return `Each hit has a ${percent(a.chance)} chance to cut the target's Speed by ${percent(a.speedCut)} for their next ${a.actions} actions.`;
    case 'spoil':
      return "Its first hit on each hunter ruins that hunter's unused potion.";
    case 'bloodfeast':
      return `Heals ${percent(a.healFraction)} of the damage it deals.`;
    case 'drowningSong':
      return `On its ${[0, 1, 2].map((i) => ordinal(1 + i * a.every)).join(', ')}… action, instead of attacking, it charms the lowest-Armor hunter, who loses their next action.`;
    case 'noonHeat':
      return `On each of its actions, every hunter loses ${percent(a.maxHealthFraction)} of max Health (Fire; ignores Armor). A Frost Pot suppresses it for ${a.frostSuppressActions} actions.`;
    case 'dragUnder':
      return `Every ${ordinal(a.every)} action, its attack grabs the target: they lose their next action and take ×${a.nextHitMult} from the next hit.`;
    case 'barrowGrip':
      return `Every ${ordinal(a.every)} action, its attack holds the target: they lose their next action.`;
    case 'swell':
      return `Below ${percent(a.belowHealth)} Health, its Armor rises by ${percent(a.armorBonus)}.`;
    case 'malice':
      return `Its Might rises by ${percent(a.mightPerAction)} after each of its actions, and the rises stack.`;
    case 'leadAstray':
      return `On each of its actions, a ${percent(a.chance)} chance that one random hunter loses their next action.`;
    case 'rootWall':
      return `Regenerates ${percent(a.regenFraction)} of max Health on each of its actions.`;
    case 'lightless':
      return `While the swarm stands, every hunter's hit chance is ${Math.round(a.hitChanceCut * 100)} points lower.`;
    case 'sealBurn':
      return `A hunter who hits it with a direct attack takes ${percent(a.reflectFraction)} of the damage dealt back as Fire, ignoring Armor.`;
    case 'reForge':
      return `Every ${ordinal(a.every)} action, instead of attacking, it restores ${percent(a.healFraction)} of max Health. A Saltburst cancels it.`;
    case 'unthawed':
      return `The first Fire hit it takes in a fight strips ${percent(a.armorStrip)} of its Armor for the rest of the fight.`;
    case 'secondSoul':
      return `The first time it reaches 0 Health, it rises again at ${percent(a.reviveFraction)} Health (once per fight).`;
    case 'enthrall':
      return `On its 1st action and every ${ordinal(a.every)} after, the hunter with the highest Might is enthralled: they lose their next action, and it heals ${percent(a.healFraction)} of max Health.`;
    case 'riverhorse':
      return `On its 1st action it carries off the lowest-Health hunter, who can't act or be targeted until ${a.awayActions} of its actions have passed, then returns having lost ${percent(a.healthLossFraction)} of max Health. A Saltburst cancels it.`;
  }
};
