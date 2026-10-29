import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import type { HunterId } from '../../content/hunters';
import { UPGRADE_IDS } from '../../content/warden-upgrades';
import { num } from '../balance-access';
import type { Command } from '../commands';
import { standProblem } from '../commands/stand';
import { upgradeCost } from '../long-night/hearth';
import { arrangeHold } from '../systems/breach';
import { previewInputFor } from '../stand/from-state';
import { previewStand } from '../stand/preview';
import { suggestSix } from '../stand/suggest';
import { standPoolOf } from '../stand/pool';
import { creatureOf, standSeed, waveList } from '../stand/waves';
import type { ContractInstance, GameState, Preparation } from '../state/game-state';
import { affordable, type Bundle } from './goals';

// GDD §6.1 (D114): the simulated player's v0.4 rules. Defenses from the Citadel; the
// stand from Bastion, at the first check-in where Embers per day of the cycle is lower
// than at the one before; Embers on the cheapest upgrade. Standard, Light and Heavy
// use the same rules. Every choice is a Command, like a tap.

type Act = (cmd: Command) => boolean;

/** What the policy remembers between check-ins: the last Embers per day it saw this cycle. */
export interface PolicyMemory {
  cycle: number;
  lastPerDay: number | null;
  /** GDD §6.1 (D589): set for the Tactician only, which arranges with the Suggest rule instead of Auto-arrange. */
  tactician?: boolean;
  /** The preview the stand was made on (GDD §6.2 Dross-Tide probe); set when it stood, read and cleared by `play`. */
  standPreview?: { readonly median: number; readonly p10: number; readonly p90: number };
  /**
   * v1.0 (D485 (4), report-only): reorders the open contracts before the launches. Absent for every
   * simulator player, so their runs are exactly as before; only the species-estimate script sets it.
   */
  contractOrder?: (s: GameState, inStandardOrder: ContractInstance[]) => ContractInstance[];
}

export const freshMemory = (): PolicyMemory => ({ cycle: 0, lastPerDay: null });

/** Walls and Watchtower in turn, the lower one first, whenever a level is affordable. */
export const defenseMoves = (s: GameState, act: Act, reserve: () => Bundle): number => {
  let n = 0;
  for (;;) {
    const next = s.buildings.walls <= s.buildings.watchtower ? 'walls' : 'watchtower';
    if (!affordable(s, next, reserve()) || !act({ type: 'build.upgrade', building: next }))
      return n;
    n += 1;
  }
};

/** The cheapest affordable warden upgrade, ties by list order, until none is affordable. */
export const emberMoves = (s: GameState, act: Act): number => {
  let n = 0;
  for (;;) {
    let best: (typeof UPGRADE_IDS)[number] | null = null;
    let cost = Infinity;
    for (const id of UPGRADE_IDS) {
      const c = upgradeCost(s, id)?.value;
      if (c !== undefined && c <= s.embers && c < cost) {
        best = id;
        cost = c;
      }
    }
    if (!best || !act({ type: 'upgrade.buy', upgrade: best })) return n;
    n += 1;
  }
};

/** How many of the first 12 waves are of each family. */
const SHOWN = 12;

/**
 * The stand kit (GDD §6.1): each hunter carries the oil for the family most common in the
 * first 12 waves (among the families an oil exists for), while the stores have it; Mending
 * Draughts for as many as it has.
 */
export const standKit = (
  s: GameState,
  party: readonly HunterId[],
): Pick<Preparation, 'oils' | 'potions'> => {
  const count = new Map<string, number>();
  for (const w of waveList(standSeed(s), SHOWN, standPoolOf(s))) {
    const f = creatureOf(w.monster).family;
    count.set(f, (count.get(f) ?? 0) + 1);
  }
  // The most common family among those an oil exists for (D129).
  const oilFor = (f: string): ConsumableId | undefined =>
    CONSUMABLE_IDS.find((id) => {
      const e = consumables[id].effect;
      return e.kind === 'oil' && e.family === f;
    });
  let family: string | null = null;
  for (const [f, n] of count)
    if (oilFor(f) && (family === null || n > (count.get(family) ?? 0))) family = f;
  const oil = family ? oilFor(family) : undefined;
  const oils: Partial<Record<HunterId, ConsumableId>> = {};
  const potions: Partial<Record<HunterId, ConsumableId>> = {};
  let oilsLeft = oil ? s.stores[oil] : 0;
  let draughts = s.stores['mending-draught'];
  for (const id of party) {
    if (oil && oilsLeft > 0) {
      oils[id] = oil;
      oilsLeft -= 1;
    }
    if (draughts > 0) {
      potions[id] = 'mending-draught';
      draughts -= 1;
    }
  }
  return { oils, potions };
};

/**
 * From Bastion: a quick preview (`laststand.policySamples`) at every check-in; stand at
 * the first one where Embers per day is lower than at the one before. Returns true if it stood.
 */
export const standMove = (s: GameState, act: Act, memory: PolicyMemory): boolean => {
  if (s.arrivalDue || standProblem(s)) return false;
  if (memory.cycle !== s.cycle.number) {
    memory.cycle = s.cycle.number;
    memory.lastPerDay = null;
  }
  const party = suggestSix(s);
  if (party.length === 0) return false;
  // GDD §6.1 (D589): every player arranges the hold with Auto-arrange at every Bastion check-in, before
  // the stand-timing preview, so the preview and the stand use one arrangement. It is the only arranging command.
  if (!arrangeHold(act, memory.tactician ? s : undefined)) return false;
  const kit = standKit(s, party);
  const preview = previewStand(previewInputFor(s, party, kit, num('laststand.policySamples')));
  const perDay = preview.embersPerDay;
  const last = memory.lastPerDay;
  memory.lastPerDay = perDay;
  if (last === null || perDay >= last) return false;
  // And again right before Start (a repeat changes nothing).
  if (!arrangeHold(act, memory.tactician ? s : undefined)) return false;
  if (!act({ type: 'stand.make', party, prep: kit })) return false;
  memory.standPreview = { median: preview.median, p10: preview.p10, p90: preview.p90 };
  return true;
};
