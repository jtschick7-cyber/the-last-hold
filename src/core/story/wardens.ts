import { ages, type AgeId } from '../../content/ages';
import type { RelicId } from '../../content/relics';
import {
  bandLines,
  blankWarden,
  ROLL_FIRST_YEAR,
  WARDEN_NAME_MAX,
  YEARS_PER_WARDEN,
  type Band,
} from '../../content/story/scenes';
import { wardenNames } from '../../content/story/wardens';
import { seeded, streamSeed } from '../rng';
import type { GameState } from '../state/game-state';
import { bandFor } from './band';

// GDD §5.14.5 (D152, D153): wardens are named (24 characters, Suggest) and carved
// on the Roll of Wardens, one line each; GDD §5.14.8: the stand's band and the
// residents' lines for it, picked by the stand seed.

/** A typed name, trimmed; empty means unnamed. Refuses one that's too long. */
export const cleanWardenName = (raw: string): string | null | 'too-long' => {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length > WARDEN_NAME_MAX) return 'too-long';
  return name === '' ? null : name;
};

/** Suggest: a name from the list, by the game seed and a press count, never one already carved or in another field (`taken`). */
export const suggestWardenName = (
  state: GameState,
  press: number,
  taken: readonly string[] = [],
): string => {
  const used = new Set([...state.cycles.map((c) => c.warden).filter((w) => w !== null), ...taken]);
  const free = wardenNames.filter((n) => !used.has(n));
  const pool = free.length > 0 ? free : wardenNames;
  const r = seeded(streamSeed(state.meta.gameSeed, 'warden', state.cycle.number, press)).next();
  return pool[Math.min(pool.length - 1, Math.floor(r * pool.length))] ?? blankWarden;
};

/** One line on the Roll of Wardens (D153). */
export interface WardenLine {
  readonly cycle: number;
  /** The carved name, or "the warden before" for an earlier warden left blank. */
  readonly name: string;
  readonly named: boolean;
  readonly fromYear: number;
  readonly toYear: number;
  readonly ranks: readonly AgeId[];
  readonly stand: { readonly band: Band; readonly waves: number } | null;
  readonly relics: readonly RelicId[];
  /** The current warden: "…keeping the hearth". */
  readonly current: boolean;
}

export const rollOfWardens = (state: GameState): WardenLine[] =>
  state.cycles.map((c, i) => {
    const current = i === state.cycles.length - 1;
    return {
      cycle: c.number,
      name: c.warden ?? blankWarden,
      named: c.warden !== null,
      fromYear: ROLL_FIRST_YEAR + YEARS_PER_WARDEN * (c.number - 1),
      toYear: ROLL_FIRST_YEAR + YEARS_PER_WARDEN * c.number,
      ranks: (Object.keys(ages) as AgeId[]).filter((a) => c.ranks[a] !== undefined),
      stand: c.stand ? { band: bandFor(c.stand.wavesHeld), waves: c.stand.wavesHeld } : null,
      relics: c.stand?.relicsFound ?? [],
      current,
    };
  });

/** One line each from Pechko and Brana for the band, picked by the stand seed (GDD §5.14.8). */
export const residentLines = (
  standSeed: string,
  band: Band,
): { readonly pechko: string; readonly brana: string } => {
  const r = seeded(`${standSeed}:band`);
  const pick = (list: readonly string[]): string =>
    list[Math.min(list.length - 1, Math.floor(r.next() * list.length))] ?? '';
  return { pechko: pick(bandLines[band].pechko), brana: pick(bandLines[band].brana) };
};
