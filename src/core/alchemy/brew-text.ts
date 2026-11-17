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
      text = swap(`heal ${percent(e.healFraction)}`, `heal ${percent(e.healFraction * p)}`);
      break;
    case 'armorUntilAction':
      base = e.armorBonus;
      text = def.summary
        .replace(`+${percent(e.armorBonus)} Armor`, `+${percent(e.armorBonus * p)} Armor`)
        .replace(
          `−${percent(e.takenCut)} all damage taken`,
          `−${percent(e.takenCut * p)} all damage taken`,
        );
      break;
    case 'speedWholeFight':
      base = e.speedBonus;
      text = swap(percent(e.speedBonus), percent(e.speedBonus * p));
      break;
    case 'fireTaken':
      base = e.takenCut;
      text = def.summary
        .replace(`−${percent(e.takenCut)} Fire`, `−${percent(e.takenCut * p)} Fire`)
        .replace(`−${percent(e.frostCut)} Frost`, `−${percent(e.frostCut * p)} Frost`)
        .replace(`+${percent(e.mightBonus)} Might`, `+${percent(e.mightBonus * p)} Might`);
      break;
    case 'hitChance':
      base = e.hitChance;
      text = def.summary
        .replace(
          `+${points(e.hitChance)} points to the holder's hit chance`,
          `+${points(e.hitChance * p)} points to the holder's hit chance`,
        )
        .replace(
          `+${points(e.critChance)} points to crit chance`,
          `+${points(e.critChance * p)} points to crit chance`,
        );
      break;
    case 'steadfast':
      base = e.mightBonus;
      text = def.summary
        .replace(
          `next ${e.uses} ability-caused`,
          `next ${Math.floor(e.uses * p + 0.5)} ability-caused`,
        )
        .replace(`+${percent(e.mightBonus)} Might`, `+${percent(e.mightBonus * p)} Might`);
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
    case 'saltburst':
      base = e.damage;
      text = swap(`${e.damage} Rune damage`, `${amount(e.damage * p)} Rune damage`);
      break;
    case 'smoke':
      base = e.dealtBonus;
      text = def.summary
        .replace(`+${points(e.hitBonus)} hit`, `+${points(e.hitBonus * p)} hit`)
        .replace(`+${points(e.critBonus)} crit`, `+${points(e.critBonus * p)} crit`)
        .replace(`+${percent(e.dealtBonus)} damage`, `+${percent(e.dealtBonus * p)} damage`);
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
