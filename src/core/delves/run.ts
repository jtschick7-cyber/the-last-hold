import { balance } from '../../content/balance';
import { blessingById } from '../../content/delves/blessings';
import { guardians } from '../../content/delves/guardians';
import { patrons, type PatronId } from '../../content/delves/patrons';
import { DELVE_RELIC_IDS, delveRelics } from '../../content/delves/relics';
import type { HunterId } from '../../content/hunters';
import { monsters } from '../../content/monsters';
import { runFight, type FightInput } from '../combat';
import { activeEffects } from '../combat/delve';
import type { DelveFightOptions } from '../combat/types';
import { ok, refuse, type ApplyResult } from '../commands/types';
import { stream } from '../rng';
import type { GameState } from '../state/game-state';
import type { DelveFloorRecord, DelveRun, DelveStage } from '../state/delve-state';
import { snapshotOf } from '../systems/hunters';
import { baseTierFor, delvesOpen, entryProblem, rankOfBaseTier } from './access';
import {
  chosenStartCards,
  doorsFor,
  floorDrop,
  floorSpecies,
  floorTier,
  guardianOf,
  offerFor,
  pechkoLineIndex,
} from './generate';
import { namelessBonus } from './nameless';
import { payRiftglass } from './riftglass';
import { grantIdleDelveRelics, grantRelic, noteBlessingTaken, recordDeepFight } from './rewards';

// GDD §5.10 (D248–D263): a Delve run. Six floors and a guardian, three hunters. Each floor's fight is
// worked out at once from the run's seed (so it can be replayed), the run is saved after every
// step, and nothing happens while the app is closed. Commands live in core/commands/delve.ts.

const FLOORS = (): number => balance.delve.floors.value;

const effectsFor = (state: GameState, blessings: readonly string[]) =>
  activeEffects(
    blessings,
    state.delve.relics.map((r) => r.id),
  );

const hasDrawback = (
  state: GameState,
  run: DelveRun,
  name: 'no-riftglass' | 'no-recovery' | 'nothing-restores',
): boolean =>
  effectsFor(state, run.blessings).effects.some((e) => e.kind === 'switch' && e.switch === name);

/** The room a run is in, for the doors: floors 1–6 show doors, the guardian does not (D256). */
const doorsStage = (state: GameState, run: DelveRun): DelveStage => {
  const d = doorsFor(run.seed, run.floor, run.lastDoors, state.delve.unlitOpen, run.unlitDoorsUsed);
  run.lastDoors = d.doors;
  if (d.unlit) run.unlitDoorsUsed += 1;
  return { kind: 'doors', doors: d.doors };
};

/** Starts a run with three hunters from the active roster (D248, D253). */
export const startRun = (state: GameState, party: readonly HunterId[]): ApplyResult => {
  if (!delvesOpen(state)) return refuse('The way down opens when a warden first reaches the Keep.');
  if (state.delve.run) return refuse('A Delve is already under way.');
  if (!Array.isArray(party as unknown) || party.length !== balance.delve.partySize.value)
    return refuse(`A Delve takes exactly ${balance.delve.partySize.value} hunters.`);
  if (new Set(party).size !== party.length) return refuse('A hunter can only go down once.');
  for (const id of party) {
    const problem = entryProblem(state, id);
    if (problem)
      return refuse(`${state.hunters[id] ? id : 'That hunter'} cannot go down: ${problem}.`);
  }
  const d = state.delve;
  d.runs += 1;
  d.result = null;
  const run: DelveRun = {
    seed: `${state.meta.gameSeed}:delve:${d.runs}`,
    baseTier: baseTierFor(state),
    floor: 1,
    party: [...party],
    snapshots: party.map((id) => snapshotOf(state, id)),
    health: Object.fromEntries(party.map((id) => [id, 1])),
    kills: 0,
    vigilUsed: false,
    lastFloor: null,
    blessings: [],
    stage: { kind: 'fight' },
    lastDoors: null,
    unlitDoorsUsed: 0,
    rerollUsed: false,
    earned: {
      floors: 0,
      riftglass: 0,
      reagents: {},
      echoes: [],
      relics: [],
      kills: 0,
      guardianBeaten: false,
    },
  };
  d.run = run;
  run.stage = d.shop.chosenStart
    ? { kind: 'start', patron: null, cards: [] }
    : doorsStage(state, run);
  return ok;
};

/** Chosen start (D259): the patron picked, three Faint blessings of it are shown. */
export const chooseStartPatron = (state: GameState, patron: PatronId): ApplyResult => {
  const run = state.delve.run;
  if (!run || run.stage.kind !== 'start') return refuse('There is no start to choose.');
  if (!(patron in patrons) || (patron === 'unlit' && !state.delve.unlitOpen))
    return refuse('That patron has not opened a door yet.');
  run.stage = { kind: 'start', patron, cards: chosenStartCards(run.seed, patron) };
  return ok;
};

/** A door is chosen: three blessings of that patron's pool not yet taken are offered (D255, D256). */
export const chooseDoor = (state: GameState, patron: PatronId): ApplyResult => {
  const run = state.delve.run;
  if (!run || run.stage.kind !== 'doors') return refuse('There is no door to choose.');
  if (!run.stage.doors.includes(patron)) return refuse('That door is not here.');
  const bell = state.delve.relics.some((r) => r.id === 'bell-clapper') && run.floor === 1;
  const effect = delveRelics['bell-clapper'].effect;
  const count =
    bell && effect.kind === 'firstOfferSize' ? effect.value : balance.delve.offers.value;
  run.stage = {
    kind: 'offer',
    patron,
    cards: offerFor(run.seed, 'door', run.floor, patron, {
      count,
      lastFloor: run.floor === FLOORS(),
      exclude: run.blessings,
    }),
  };
  return ok;
};

/** Re-roll (D259): once per run, replace the offer with new cards. */
export const rerollOffer = (state: GameState): ApplyResult => {
  const run = state.delve.run;
  if (!run || run.stage.kind !== 'offer') return refuse('There is no offer to re-roll.');
  if (!state.delve.shop.reroll) return refuse('The Re-roll upgrade has not been bought.');
  if (run.rerollUsed) return refuse('The offer has already been re-rolled this run.');
  const { patron, cards } = run.stage;
  const fresh = offerFor(run.seed, 'reroll', run.floor, patron, {
    count: cards.length,
    lastFloor: run.floor === FLOORS(),
    exclude: [...run.blessings, ...cards],
  });
  run.rerollUsed = true;
  run.stage = { kind: 'offer', patron, cards: fresh.length > 0 ? fresh : cards };
  return ok;
};

/** A blessing is taken from the offer (or the Chosen start): it lasts the run (D255). */
export const chooseBlessing = (state: GameState, id: string): ApplyResult => {
  const run = state.delve.run;
  if (!run || (run.stage.kind !== 'offer' && run.stage.kind !== 'start'))
    return refuse('There is no blessing to choose.');
  if (!run.stage.cards.includes(id)) return refuse('That blessing is not on offer.');
  const b = blessingById(id);
  if (!b) return refuse('That blessing does not exist.');
  run.blessings.push(id);
  noteBlessingTaken(state, b.patron, b.rarity, run);
  run.stage = run.stage.kind === 'start' ? doorsStage(state, run) : { kind: 'fight' };
  return ok;
};

/** The fight of the floor the run is on, as the fight engine takes it. Used to work it out and to replay it. */
export const floorFightInput = (
  state: GameState,
  run: DelveRun,
  rec: DelveFloorRecord,
  log: boolean,
): FightInput => {
  const relics = state.delve.relics.map((r) => r.id);
  const delve: DelveFightOptions = {
    blessings: rec.blessings,
    relics,
    health: rec.health,
    kills: rec.kills,
    vigilUsed: rec.vigilUsed,
  };
  const rolls = stream(run.seed, 'fight', rec.floor);
  if (rec.floor <= FLOORS()) {
    const tier = floorTier(run.baseTier, rec.floor);
    const group = floorSpecies(run.seed, rec.floor, run.baseTier).map((id) => ({
      monster: id,
      tier,
      knowledge: state.bestiary[id]?.level ?? 0,
      healthMult: balance.delve.memberHealth.value,
      mightMult: balance.delve.memberMight.value,
    }));
    return {
      party: run.snapshots,
      monster: group[0] as (typeof group)[number],
      companions: group.slice(1),
      location: null,
      rolls,
      log,
      delve,
    };
  }
  const g = guardianOf(run.seed);
  const salt = delveRelics['salt-ring'].effect;
  const saltCut =
    relics.includes('salt-ring') && salt.kind === 'guardianHealthPct' ? 1 + salt.amount : 1;
  return {
    party: run.snapshots,
    monster: {
      guardian: g,
      tier: floorTier(run.baseTier, rec.floor),
      knowledge: state.delve.deep[g]?.level ?? 0,
      healthMult: balance.delve.guardianHealth.value * saltCut,
    },
    nameless: namelessBonus(state).value.count,
    location: null,
    rolls,
    log,
    delve,
  };
};

/** What the run needs of a floor's fight right now, to work it out or replay it. */
export const currentFloorRecord = (run: DelveRun): DelveFloorRecord => ({
  floor: run.floor,
  blessings: [...run.blessings],
  health: { ...run.health },
  kills: run.kills,
  vigilUsed: run.vigilUsed,
  result: 'win',
});

/** The log of the last floor fought, from its seed (GDD §9.15 Log). Null if none yet. */
export const replayLastFloor = (state: GameState, log = true) => {
  const run = state.delve.run;
  if (!run?.lastFloor) return null;
  return runFight(floorFightInput(state, run, run.lastFloor, log));
};

/** Recovery before the next floor (D253, D255, D261): standing hunters get a share of max Health back. */
const recover = (state: GameState, run: DelveRun): void => {
  if (hasDrawback(state, run, 'no-recovery') || hasDrawback(state, run, 'nothing-restores')) return;
  const effects = effectsFor(state, run.blessings).effects;
  let share: number = balance.delve.recovery.value;
  let floorShare = 0;
  for (const e of effects) {
    if (e.kind === 'recoverySet') share = e.value;
    else if (e.kind === 'recoveryFloor') floorShare = Math.max(floorShare, e.value);
  }
  const lantern = delveRelics['rift-lantern'].effect;
  if (state.delve.relics.some((r) => r.id === 'rift-lantern') && lantern.kind === 'recoveryPoints')
    share += lantern.amount;
  for (const id of run.party) {
    const now = run.health[id] ?? 0;
    if (now <= 0) continue; // a downed hunter is out for the rest of the run (D253)
    run.health[id] = Math.max(Math.min(1, now + share), floorShare);
  }
};

/** Ends the run and keeps what it earned (D253): the result waits for its sheet. */
const finish = (state: GameState, outcome: 'guardian' | 'defeated' | 'left'): void => {
  const run = state.delve.run;
  if (!run) return;
  state.delve.result = {
    ...run.earned,
    outcome,
    at: state.time,
    allowanceLeft: state.delve.allowance,
    line: pechkoLineIndex(run.seed),
  };
  state.delve.run = null;
  grantIdleDelveRelics(state);
};

/** Pays a cleared floor: Riftglass from the allowance, and a reagent of the floor's family (D258, D262). */
const payFloor = (state: GameState, run: DelveRun, floor: number): void => {
  const guardian = floor > FLOORS();
  const wanted = guardian ? balance.riftglass.guardian.value : balance.riftglass.perFloor.value;
  const paid = hasDrawback(state, run, 'no-riftglass') ? 0 : payRiftglass(state, wanted);
  run.earned.riftglass += paid;
  if (guardian) {
    const g = guardians[guardianOf(run.seed)];
    const spoon = delveRelics['horn-spoon'].effect;
    const bonus =
      state.delve.relics.some((r) => r.id === 'horn-spoon') && spoon.kind === 'guardianDropBonus'
        ? spoon.amount
        : 0;
    const units = balance.delve.guardianReagents.value + bonus;
    state.stores[g.drop] += units;
    run.earned.reagents[g.drop] = (run.earned.reagents[g.drop] ?? 0) + units;
  } else {
    const drop = floorDrop(run.seed, floor);
    const units = balance.delve.reagentsPerFloor.value;
    state.stores[drop] += units;
    run.earned.reagents[drop] = (run.earned.reagents[drop] ?? 0) + units;
  }
};

/** The Delve relics a beaten guardian finds (D261). */
const guardianRelics = (state: GameState, run: DelveRun): void => {
  const rank = rankOfBaseTier(run.baseTier);
  const g = guardianOf(run.seed);
  for (const id of DELVE_RELIC_IDS) {
    const s = delveRelics[id].delveSource;
    if (
      (s.kind === 'firstGuardianAtRank' && s.age === rank) ||
      (s.kind === 'guardianDefeated' && s.guardian === g)
    )
      grantRelic(state, id, run);
  }
};

/** Works out the floor the run is on, at once, from the seed (GDD §5.10.2), then moves on. */
export const fightFloor = (state: GameState): ApplyResult => {
  const run = state.delve.run;
  if (!run || run.stage.kind !== 'fight') return refuse('There is no fight to fight.');
  const floor = run.floor;
  const rec = currentFloorRecord(run);
  const r = runFight(floorFightInput(state, run, rec, false));
  const guardian = floor > FLOORS();
  // Health carried on, as shares of max Health (D253); a downed hunter stays at 0.
  for (const h of r.hunters) run.health[h.id as HunterId] = h.downed ? 0 : h.health / h.maxHealth;
  run.kills = r.delve?.kills ?? run.kills;
  run.vigilUsed = r.delve?.vigilUsed ?? run.vigilUsed;
  run.earned.kills = run.kills;
  run.lastFloor = { ...rec, result: r.result };
  // Kills in Delves per family, recorded for v0.8 (D278); the contract bestiary doesn't learn from them (D262).
  const group = guardian ? [] : floorSpecies(run.seed, floor, run.baseTier);
  r.monsters.forEach((m, i) => {
    const species = group[i];
    if (m.health > 0 || species === undefined) return;
    const family = monsters[species].family;
    state.delve.kills[family] = (state.delve.kills[family] ?? 0) + 1;
  });
  if (guardian) {
    const g = guardianOf(run.seed);
    recordDeepFight(state, g, r.result === 'win');
    if (r.result === 'win') state.delve.kills.deep = (state.delve.kills.deep ?? 0) + 1;
  }
  if (r.result === 'loss') {
    finish(state, 'defeated');
    return ok;
  }
  run.earned.floors += 1;
  payFloor(state, run, floor);
  if (guardian) {
    run.earned.guardianBeaten = true;
    guardianRelics(state, run);
    finish(state, 'guardian');
    return ok;
  }
  recover(state, run);
  run.floor += 1;
  run.stage = run.floor > FLOORS() ? { kind: 'fight' } : doorsStage(state, run);
  return ok;
};

/** Leave run (GDD §9.15): between floors, keeping what was earned. */
export const leaveRun = (state: GameState): ApplyResult => {
  if (!state.delve.run) return refuse('There is no Delve to leave.');
  finish(state, 'left');
  return ok;
};

/** The Last Stand ends a paused run and keeps what it earned (D267). */
export const endRunForStand = (state: GameState): void => {
  if (state.delve.run) finish(state, 'left');
};

/** The result sheet has been read. */
export const ackResult = (state: GameState): ApplyResult => {
  if (!state.delve.result) return refuse('There is no result to read.');
  state.delve.result = null;
  return ok;
};

/** The way-down scene has been shown (D266). */
export const seeScene = (state: GameState): ApplyResult => {
  if (!delvesOpen(state)) return refuse('The way down has not opened yet.');
  state.delve.sceneSeen = true;
  return ok;
};
