import { relics, type RelicId } from '../content/relics';
import { resources } from '../content/resources';
import { upgrades, type UpgradeId } from '../content/warden-upgrades';
import { formatDuration } from './format';

// GDD §8.9–8.10: what a warden upgrade level or a relic does, in plain words, built
// from the content values the engine uses (the UI never restates a number).

const percent = (x: number): string => `${Math.round(x * 100)}%`;

/** One level's effect: "+10% all production (not silver)". */
export const describeUpgrade = (id: UpgradeId): string => {
  const e = upgrades[id].effect;
  switch (e.kind) {
    case 'allProduction':
      return `+${percent(e.perLevel)} all production (not silver)`;
    case 'startResources':
      return `each cycle starts with ${Object.entries(e.perLevel)
        .map(([r, n]) => `+${n} ${resources[r as keyof typeof resources].name.toLowerCase()}`)
        .join(' and ')}`;
    case 'startHousing':
      return `each cycle starts with +${e.cottages} Cottage and +${e.peasants} peasants`;
    case 'levelsKept':
      return `hunters keep ${percent(e.perLevel)} more of their levels at the Long Night`;
    case 'contractXp':
      return `+${percent(e.perLevel)} contract XP`;
    case 'bounty':
      return `+${percent(e.perLevel)} bounty silver (not seams)`;
    case 'contractDuration':
      return `contracts take ${percent(e.perLevel)} less time`;
    case 'offlineCap':
      return `+${formatDuration(e.perLevel)} offline cap (up to the ceiling)`;
  }
};

export const describeRelic = (id: RelicId): string => {
  const e = relics[id].effect;
  switch (e.kind) {
    case 'production':
      return `+${percent(e.amount)} ${e.resources.map((r) => resources[r].name.toLowerCase()).join(' and ')}`;
    case 'contractXp':
      return `+${percent(e.amount)} contract XP`;
    case 'clueTime':
      return `clues take ${percent(e.amount)} less time`;
    case 'brewTime':
      return `brewing takes ${percent(e.amount)} less time`;
    case 'standTaken':
      return `in the Last Stand, the party takes ${percent(e.amount)} less damage`;
  }
};
