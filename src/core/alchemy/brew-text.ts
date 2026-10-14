import { consumables, type ConsumableId } from '../../content/consumables';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { alchemyPotency } from '../combat/stats';
import { skillBonusAt } from '../skills/skills';

// GDD §5.8.6, §9.9: Alchemy makes every number in a brew's effect stronger (oil bonus, heal,
// Armor, Speed, Coldwater, Owl-Eye, bomb damage and burn); counts, durations and the Frost
// Pot's Speed cut do not change. The text and its breakdown are built here, with the same
// `alchemyPotency` the fight uses, so what the Hut shows is what the fight does (before
// Herbwise, which belongs to a hunter). At level 0 it reads exactly as the content text.

export interface BrewSummary {
  readonly text: string;
  /** The boosted number, explained: its base and the Alchemy line. Null when nothing scales. */
  readonly breakdown: Breakdown | null;
}

const percent = (x: number): string => `${Math.round(x * 1000) / 10}%`;
const points = (x: number): string => `${Math.round(x * 1000) / 10}`;
/** Bomb numbers are rounded to 2 places, as the fight log rounds them. */
const amount = (x: number): string => `${Math.round(x * 100) / 100}`;

export const brewSummary = (level: number, id: ConsumableId): BrewSummary => {
  const def = consumables[id];
  const e = def.effect;
  const p = alchemyPotency(level);
  const swap = (from: string, to: string): string => def.summary.replace(from, to);
  let text = def.summary;
  let base: number | null = null;
  switch (e.kind) {
    case 'oil': {
      base = num('oil.familyBonus');
      text = swap(percent(base), percent(base * p));
      break;
    }
    case 'heal':
      base = e.healFraction;
      text = swap(percent(e.healFraction), percent(e.healFraction * p));
      break;
    case 'armorUntilAction':
      base = e.armorBonus;
      text = swap(percent(e.armorBonus), percent(e.armorBonus * p));
      break;
    case 'speedWholeFight':
      base = e.speedBonus;
      text = swap(percent(e.speedBonus), percent(e.speedBonus * p));
      break;
    case 'fireTaken':
      base = e.takenCut;
      text = swap(percent(e.takenCut), percent(e.takenCut * p));
      break;
    case 'hitChance':
      base = e.hitChance;
      text = swap(points(e.hitChance), points(e.hitChance * p));
      break;
    case 'burn':
      base = e.initial;
      text = def.summary
        .replace(`${e.initial} Fire damage`, `${amount(e.initial * p)} Fire damage`)
        .replace(`${e.perAction} Fire on`, `${amount(e.perAction * p)} Fire on`);
      break;
    case 'chill':
      base = e.initial;
      text = swap(`${e.initial} Frost damage`, `${amount(e.initial * p)} Frost damage`);
      break;
    default:
      break;
  }
  if (base === null || level === 0) return { text, breakdown: null };
  const alchemy = skillBonusAt('alchemy', level).breakdown;
  return {
    text,
    breakdown: {
      label: def.name,
      value: base * p,
      formula: `${base} × ${p.toFixed(2)}`,
      children: [{ label: 'Base', value: base }, alchemy],
    },
  };
};
