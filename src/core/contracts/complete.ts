import { HUNTER_IDS, hunters as hunterContent, type HunterId } from '../../content/hunters';
import { runFight } from '../combat';
import { recordFight } from '../investigation/knowledge';
import { seeded } from '../rng';
import { RULES_VERSION } from '../rules-version';
import type { ContractResult, FightRef, GameState, RunningContract } from '../state/game-state';
import { levelCap, recoveryFactor, xpToNext } from '../systems/hunters';
import { MS_PER_SECOND } from '../time';
import { injuryOutcome, needsDeathRoll, type InjuryOutcome } from './injury';
import { bounty, trophies, xpPerHunter } from './rewards';
import { deathSeed, fightSeed } from './seeds';

// GDD §5.4.3 (B9): rewards, injuries and XP apply the moment a contract's timer
// ends, even offline. Collect only acknowledges the results.

const FIGHTS_KEPT = 50;

/** The end time of the contract that finishes next, or null if none is running. */
export const nextCompletionTime = (state: GameState): number | null => {
  let soonest: number | null = null;
  for (const r of state.running) if (soonest === null || r.endsAt < soonest) soonest = r.endsAt;
  return soonest;
};

/** The running contract that finishes next: earliest end, then the one launched first. */
const earliest = (state: GameState): number => {
  let best = 0;
  state.running.forEach((r, i) => {
    const b = state.running[best];
    if (b && (r.endsAt < b.endsAt || (r.endsAt === b.endsAt && r.launchedAt < b.launchedAt)))
      best = i;
  });
  return best;
};

/** The deterministic fight for a launched contract: same seed, same party, same fight. */
export const fightOf = (state: GameState, run: RunningContract) =>
  runFight({
    party: run.snapshots,
    monster: {
      monster: run.contract.monster,
      tier: run.contract.tier,
      knowledge: run.knowledge,
    },
    location: run.contract.location,
    rolls: seeded(fightSeed(state.meta.gameSeed, run.contract.id, run.party)),
  });

/** Finishes the next contract. The caller has moved the clock to its end time. */
export const applyCompletion = (state: GameState): ContractResult | null => {
  if (state.running.length === 0) return null;
  const [run] = state.running.splice(earliest(state), 1);
  if (!run) return null;
  const { contract } = run;
  const at = run.endsAt;
  const fight = fightOf(state, run);
  const success = fight.result === 'win';
  recordFight(state, contract.monster, success);
  const partyTraits = run.snapshots.map((s) => s.traits);
  const pay = success ? bounty(contract.tier, state.cycle.age, partyTraits).value : 0;
  const earned = success ? trophies(contract.tier) : 0;
  const xp = xpPerHunter(contract.tier, success);

  const injuries: ContractResult['injuries'] = [];
  const levelUps: ContractResult['levelUps'] = [];
  run.party.forEach((id, i) => {
    const h = state.hunters[id];
    const end = fight.hunters[i];
    if (!h || !end) return;
    const ctx = {
      tier: contract.tier,
      reckless: run.reckless,
      story: hunterContent[id].story,
      recoveryMult: recoveryFactor(id),
      deathRoll: null as number | null,
    };
    if (needsDeathRoll(end, ctx)) {
      ctx.deathRoll = seeded(deathSeed(state.meta.gameSeed, contract.id, id)).next();
    }
    const outcome: InjuryOutcome = injuryOutcome(end, ctx);
    h.record[success ? 'won' : 'lost'] += 1;
    if (outcome.kind === 'dead') {
      Reflect.deleteProperty(state.hunters, id);
      state.roster.active = state.roster.active.filter((a) => a !== id);
      state.fallen.push({
        hunter: id,
        diedAt: at,
        cycle: state.cycle.number,
        contractId: contract.id,
      });
      injuries.push({ hunter: id, kind: 'dead', until: at });
      return;
    }
    if (outcome.kind !== 'none') {
      h.recovery = { kind: outcome.kind, until: at + outcome.recoverySeconds * MS_PER_SECOND };
      injuries.push({ hunter: id, kind: outcome.kind, until: h.recovery.until });
    }
    h.xp += xp;
    while (h.level < levelCap() && h.xp >= xpToNext(h.level)) {
      h.xp -= xpToNext(h.level);
      h.level += 1;
      levelUps.push({ hunter: id, level: h.level });
    }
    if (h.level >= levelCap()) h.xp = 0;
  });

  state.resources.silver += pay;
  if (success) {
    state.stats.contractsWon += 1;
    state.stats.trophies += earned;
    state.stats.bountySilver += pay;
    state.stats.kills[contract.monster] = (state.stats.kills[contract.monster] ?? 0) + 1;
    state.stats.winsByLocation[contract.location] =
      (state.stats.winsByLocation[contract.location] ?? 0) + 1;
    state.board.tierWins[contract.tier - 1] = (state.board.tierWins[contract.tier - 1] ?? 0) + 1;
  } else {
    state.stats.contractsLost += 1;
  }

  const ref: FightRef = {
    contractId: contract.id,
    seed: fightSeed(state.meta.gameSeed, contract.id, run.party),
    party: run.snapshots,
    monster: { monster: contract.monster, tier: contract.tier, knowledge: run.knowledge },
    location: contract.location,
    result: fight.result,
    rulesVersion: RULES_VERSION,
    at,
    prep: run.prep,
  };
  state.log.recentFights.push(ref);
  if (state.log.recentFights.length > FIGHTS_KEPT) state.log.recentFights.shift();

  const result: ContractResult = {
    contractId: contract.id,
    village: contract.village,
    monster: contract.monster,
    tier: contract.tier,
    location: contract.location,
    success,
    at,
    bounty: pay,
    trophies: earned,
    xp,
    winChance: run.winChance,
    injuries,
    levelUps,
    reagents: {},
    wellPrepared: false,
  };
  state.results.push(result);
  return result;
};

/** When the soonest injury recovery ends, or null if nobody is recovering. */
export const nextRecoveryTime = (state: GameState): number | null => {
  let soonest: number | null = null;
  for (const h of Object.values(state.hunters)) {
    if (h.recovery && (soonest === null || h.recovery.until < soonest)) soonest = h.recovery.until;
  }
  return soonest;
};

/** Ends the soonest recovery (ties: roster order of the content). */
export const applyRecovery = (state: GameState): HunterId | null => {
  let pick: HunterId | null = null;
  for (const id of HUNTER_IDS) {
    const until = state.hunters[id]?.recovery?.until;
    if (until === undefined) continue;
    const best = pick ? state.hunters[pick]?.recovery?.until : undefined;
    if (best === undefined || until < best) pick = id;
  }
  if (!pick) return null;
  const h = state.hunters[pick];
  if (h) h.recovery = null;
  return pick;
};
