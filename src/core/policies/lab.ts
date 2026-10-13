import type { BuildingId } from '../../content/buildings';
import { consumables, type ConsumableId } from '../../content/consumables';
import type { Command } from '../commands';
import { bombIsWeak, oilMatches } from '../contracts/prep';
import { contractIdentity } from '../investigation/view';
import { investigationSlots } from '../investigation/lodge';
import { brewSlots } from '../alchemy/brewing';
import { num } from '../balance-access';
import type { ContractInstance, GameState, Preparation } from '../state/game-state';
import { affordable, type Bundle } from './goals';

// D95: what the simulated player does about the v0.3 systems. It builds the Lodge, the
// Hut and a Garden once the Keep stands, sends its free Lodge slots after the
// highest-tier unidentified contracts, keeps a few consumables brewing, and carries
// what suits a contract it can name. Every choice is a Command, like a tap.

type Act = (cmd: Command) => boolean;

/** Order in which the Keep's new buildings are bought (a level or a copy each time). */
const BUILD_ORDER: readonly BuildingId[] = [
  'hunters-lodge',
  'alchemists-hut',
  'herb-garden',
  'hunters-lodge',
  'alchemists-hut',
  'herb-garden',
  'hunters-lodge',
  'alchemists-hut',
];

/** The stock the player likes to keep, in the order it brews them (oils first). */
const WANT: readonly [ConsumableId, number][] = [
  ['grave-oil', 3],
  ['drowned-bane-oil', 3],
  ['thornbane-oil', 3],
  ['fire-pot', 2],
  ['frost-pot', 2],
  ['mending-draught', 2],
  ['saltburst', 1],
  ['quickfoot-tincture', 1],
];

/** The next step of BUILD_ORDER the hold hasn't reached yet, or null when it has them all. */
const nextStep = (s: GameState): BuildingId | null => {
  const seen = new Map<BuildingId, number>();
  for (const id of BUILD_ORDER) {
    const need = (seen.get(id) ?? 0) + 1;
    seen.set(id, need);
    if (s.buildings[id] < need) return id;
  }
  return null;
};

/** Buys the next Lodge, Hut or Garden step it can afford; returns how many it bought. */
export const labBuildings = (s: GameState, act: Act, reserve: Bundle): number => {
  if (s.cycle.age !== 'keep') return 0;
  let bought = 0;
  for (;;) {
    const next = nextStep(s);
    if (!next || !affordable(s, next, reserve)) return bought;
    const cmd: Command =
      next === 'herb-garden'
        ? { type: 'build.buy', building: next, count: 1 }
        : { type: 'build.upgrade', building: next };
    if (!act(cmd)) return bought;
    bought += 1;
  }
};

/** Sends each free Lodge slot after the highest-tier contract still unidentified. */
export const investigateMoves = (s: GameState, act: Act): number => {
  let n = 0;
  const open = [...s.board.open].sort((a, b) => b.tier - a.tier || a.arrivedAt - b.arrivedAt);
  for (const c of open) {
    if (s.queues.investigation.length >= investigationSlots(s)) break;
    if (contractIdentity(s, c).identified) continue;
    if (act({ type: 'investigate.assign', contract: c.id })) n += 1;
  }
  return n;
};

/** Queues one brew per free kettle: the first wanted item it is short of and can pay for. */
export const brewMoves = (s: GameState, act: Act): number => {
  let n = 0;
  while (s.queues.brewing.length < brewSlots(s)) {
    const queued = (id: ConsumableId): number =>
      s.queues.brewing.filter((j) => j.item === id).length;
    const item = WANT.find(([id, cap]) => s.stores[id] + queued(id) < cap);
    if (!item) break;
    // Try the wanted items in order until one can be paid for.
    const ok = WANT.some(
      ([id, cap]) => s.stores[id] + queued(id) < cap && act({ type: 'brew.queue', item: id }),
    );
    if (!ok) break;
    n += 1;
  }
  return n;
};

/**
 * What it carries to a contract (GDD §5.7): for a species it can name, the matching oil on
 * each hunter, a bomb the species is weak to (a Saltburst if none is), and a Mending
 * Draught for the first hunter. Against an unknown monster, a Saltburst only.
 */
export const prepFor = (
  s: GameState,
  c: ContractInstance,
  party: readonly string[],
): Preparation => {
  const prep: Preparation = { oils: {}, potions: {}, bombs: [] };
  const left = (id: ConsumableId, used = 0): boolean => s.stores[id] - used > 0;
  const v = contractIdentity(s, c);
  const slots = num('prep.bombSlots');
  if (v.identified && v.monster) {
    const oil = (Object.keys(consumables) as ConsumableId[]).find(
      (id) => consumables[id].kind === 'oil' && oilMatches(id, v.monster as never),
    );
    if (oil) {
      let used = 0;
      for (const h of party) {
        if (!left(oil, used)) break;
        prep.oils[h as keyof Preparation['oils']] = oil;
        used += 1;
      }
    }
    for (const bomb of ['fire-pot', 'frost-pot'] as const) {
      if (prep.bombs.length < slots && left(bomb) && bombIsWeak(bomb, v.monster))
        prep.bombs.push(bomb);
    }
    if (prep.bombs.length === 0 && left('saltburst')) prep.bombs.push('saltburst');
  } else if (left('saltburst')) {
    prep.bombs.push('saltburst');
  }
  const first = party[0];
  if (first && left('mending-draught'))
    prep.potions[first as keyof Preparation['potions']] = 'mending-draught';
  return prep;
};
