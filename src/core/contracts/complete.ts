import { noteContractWon } from '../skills/hooks';
import { HUNTER_IDS, hunters as hunterContent, type HunterId } from '../../content/hunters';
import { runFight } from '../combat';
import { recordFight } from '../investigation/knowledge';
import { isWellPrepared, prepIds } from './prep';
import { reagentsFor } from './reagents';
import { seeded, stream } from '../rng';
import { lootKey, rollContractLoot, takeLoot } from '../systems/loot';
import { grantLegendaries, legendaryKey } from '../systems/legendaries';
import { RULES_VERSION } from '../rules-version';
import type { ContractResult, FightRef, GameState, RunningContract } from '../state/game-state';
import { gainXp, recoveryFactor } from '../systems/hunters';
import { applyContractThreat } from '../threat/threat';
import { MS_PER_SECOND } from '../time';
import { injuryOutcome, needsDeathRoll, type InjuryOutcome } from './injury';
import { holdBounty, trophies, xpPerHunter } from './rewards';
import { contractXpBonus } from '../long-night/bonuses';
import { recordWin, sweepDocuments } from '../story/documents';
import { defeatRibbonshade } from '../story/names';
import { winForVillage } from '../story/trust';
import { applyYard } from './yard';
import { notePeak } from '../story/letters';
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
    rolls: seeded(fightSeed(state.meta.gameSeed, run.contract.id, run.party, prepIds(run.prep))),
    prep: run.prep,
    alchemy: run.alchemy,
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
  // GDD §5.7: a success with a matching oil and a weak-type bomb (or a cancelling Saltburst).
  const wellPrepared =
    success && isWellPrepared(contract.monster, run.prep, fight.saltburstCancelled);
  const pay = success ? holdBounty(state, contract.tier, partyTraits, wellPrepared).value : 0;
  const earned = success ? trophies(contract.tier, wellPrepared) : 0;
  const xp = xpPerHunter(contract.tier, success, contractXpBonus(state).value);
  // GDD §5.4.3: a success brings reagents (the drops and a gift); a failure brings none.
  const reagents = success ? reagentsFor(state.meta.gameSeed, contract) : {};
  for (const [id, n] of Object.entries(reagents))
    state.stores[id as keyof typeof state.stores] += n ?? 0;

  const earners: HunterId[] = [];
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
      recoveryMult: recoveryFactor(partyTraits, i),
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
        level: h.level,
      });
      injuries.push({ hunter: id, kind: 'dead', until: at });
      return;
    }
    if (outcome.kind !== 'none') {
      h.recovery = { kind: outcome.kind, until: at + outcome.recoverySeconds * MS_PER_SECOND };
      injuries.push({ hunter: id, kind: outcome.kind, until: h.recovery.until });
    }
    earners.push(id);
    for (const level of gainXp(state, h, xp)) levelUps.push({ hunter: id, level });
  });

  state.resources.silver += pay;
  if (success) {
    state.stats.contractsWon += 1;
    noteContractWon(state, contract.tier); // Command (GDD §5.8.6)
    state.stats.trophies += earned;
    state.stats.bountySilver += pay;
    state.stats.kills[contract.monster] = (state.stats.kills[contract.monster] ?? 0) + 1;
    state.stats.winsByLocation[contract.location] =
      (state.stats.winsByLocation[contract.location] ?? 0) + 1;
    state.board.tierWins[contract.tier - 1] = (state.board.tierWins[contract.tier - 1] ?? 0) + 1;
  } else {
    state.stats.contractsLost += 1;
  }
  applyContractThreat(state, contract.tier, success); // GDD §5.9.1
  // GDD §5.4.3, §5.14.2: a success can bring documents and names; a failure never does.
  const found = success ? [...recordWin(state, contract), ...sweepDocuments(state)] : [];
  if (success && contract.monster === 'ribbonshade') found.push(...defeatRibbonshade(state));
  // GDD §5.11.2 (D305): a won contract can drop an item, fixed at launch like the fight.
  if (success) {
    const drop = rollContractLoot(stream(state.meta.gameSeed, 'loot', contract.id), contract.tier);
    if (drop) found.push(lootKey(takeLoot(state, drop)));
  }
  // GDD §5.11.6 (D306, D328 (5)): a species reaching Mastered can complete a family; the Legendary is found now.
  if (success) found.push(...grantLegendaries(state).map(legendaryKey));
  // GDD §5.14.6: after the documents (a trust-gated one reads trust before this win, D178).
  if (success) found.push(...winForVillage(state, contract.village));
  // GDD §5.14.7: a level-up can reach a hunter's letter, win or lose.
  for (const u of levelUps) found.push(...notePeak(state, u.hunter, u.level));
  // GDD §5.11.5 (D315): everyone else at the hold earns a share of that XP in the yard, win or lose.
  if (earners.length > 0) found.push(...applyYard(state, run.party, xp));

  const ref: FightRef = {
    contractId: contract.id,
    seed: fightSeed(state.meta.gameSeed, contract.id, run.party, prepIds(run.prep)),
    party: run.snapshots,
    monster: { monster: contract.monster, tier: contract.tier, knowledge: run.knowledge },
    location: contract.location,
    result: fight.result,
    rulesVersion: RULES_VERSION,
    at,
    prep: run.prep,
    alchemy: run.alchemy,
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
    reagents,
    wellPrepared,
    ...(found.length > 0 ? { found } : {}),
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
