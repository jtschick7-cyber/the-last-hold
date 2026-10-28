import { CONSUMABLE_IDS } from '../../content/consumables';
import { DELVE_RELIC_IDS } from '../../content/delves/relics';
import {
  DESCENT_MONSTER_IDS,
  DESCENT_ORDER_MAX,
  type DescentMonsterId,
  type DescentRecord,
  type DescentStageSummary,
  type DescentState,
} from '../state/descent-state';
import {
  arr,
  bool,
  count,
  finite,
  hunterId,
  Invalid,
  knowledgeLevel,
  nonNegative,
  obj,
  oneOf,
  orNull,
  perHunter,
  snapshot,
  sparseCounts,
  str,
  unit,
} from './guards';

// Technical design §22.6 (v14, D562): the Descent part of the save guard. An unknown field of the
// block, an unknown bomb or beast id in a record, drops with a warning. A bad flag, count or
// record refuses the load as damage: a record is the whole input of a replay, so it is never
// repaired. Nothing here reads the rest of the state.

const stageSummary = (v: unknown, where: string, index: number): DescentStageSummary => {
  const o = obj(v, where);
  const stage = oneOf(String(o.stage), ['1', '2', '3'], `${where}.stage`);
  if (Number(stage) !== index + 1) throw new Invalid(`${where}.stage isn't in order.`);
  return {
    stage: Number(stage) as 1 | 2 | 3,
    won: bool(o.won, `${where}.won`),
    ticks: count(o.ticks, `${where}.ticks`),
    downedIds: arr(o.downedIds, `${where}.downedIds`).map((x, i) =>
      hunterId(x, `${where}.downedIds[${i}]`),
    ),
    steppedInIds: arr(o.steppedInIds, `${where}.steppedInIds`).map((x, i) =>
      hunterId(x, `${where}.steppedInIds[${i}]`),
    ),
  };
};

const positiveCount = (v: unknown, where: string): number => {
  const n = count(v, where);
  if (n < 1) throw new Invalid(`${where} must be 1 or more.`);
  return n;
};

const recordFrom = (v: unknown, where: string, warnings: string[]): DescentRecord => {
  const o = obj(v, where);
  const order = arr(o.order, `${where}.order`).map((x, i) => snapshot(x, `${where}.order[${i}]`));
  if (order.length < 1 || order.length > DESCENT_ORDER_MAX)
    throw new Invalid(`${where}.order must hold 1 to ${DESCENT_ORDER_MAX} hunters.`);
  const prep = obj(o.prep, `${where}.prep`);
  const learned = obj(o.learned, `${where}.learned`);
  const tiers = arr(o.stageTiers, `${where}.stageTiers`).map((x, i) =>
    positiveCount(x, `${where}.stageTiers[${i}]`),
  );
  if (tiers.length !== 3) throw new Invalid(`${where}.stageTiers must hold three tiers.`);
  const stages = arr(o.stages, `${where}.stages`).map((x, i) =>
    stageSummary(x, `${where}.stages[${i}]`, i),
  );
  if (stages.length < 1 || stages.length > 3)
    throw new Invalid(`${where}.stages must hold 1 to 3 stages.`);
  const outcome = oneOf(o.outcome, ['win', 'loss'], `${where}.outcome`);
  const stagesCleared = count(o.stagesCleared, `${where}.stagesCleared`);
  if (stagesCleared > 3) throw new Invalid(`${where}.stagesCleared is above 3.`);
  if ((outcome === 'win') !== (stagesCleared === 3))
    throw new Invalid(`${where}: a win clears all three stages, and nothing else does.`);
  const standingCount = count(o.standingCount, `${where}.standingCount`);
  const downedCount = count(o.downedCount, `${where}.downedCount`);
  if (standingCount + downedCount > order.length)
    throw new Invalid(`${where}: more hunters standing and downed than in the order.`);
  const unlitBaseHealth = finite(o.unlitBaseHealth, `${where}.unlitBaseHealth`);
  if (unlitBaseHealth <= 0) throw new Invalid(`${where}.unlitBaseHealth must be above 0.`);
  return {
    attempt: positiveCount(o.attempt, `${where}.attempt`),
    cycle: positiveCount(o.cycle, `${where}.cycle`),
    warden: orNull(o.warden, (x) => str(x, `${where}.warden`)),
    seed: str(o.seed, `${where}.seed`),
    order,
    prep: {
      oils: perHunter(prep.oils, `${where}.prep.oils`),
      potions: perHunter(prep.potions, `${where}.prep.potions`),
    },
    bombs: sparseCounts(o.bombs, CONSUMABLE_IDS, `${where}.bombs`, warnings),
    learned: {
      mightAndHealth: nonNegative(learned.mightAndHealth, `${where}.learned.mightAndHealth`),
      taken: unit(learned.taken, `${where}.learned.taken`),
    },
    delveRelics: arr(o.delveRelics, `${where}.delveRelics`).map((x, i) =>
      oneOf(x, DELVE_RELIC_IDS, `${where}.delveRelics[${i}]`),
    ),
    bestiaryKnowledge: knowledgeFrom(o.bestiaryKnowledge, `${where}.bestiaryKnowledge`, warnings),
    stageTiers: [tiers[0] ?? 1, tiers[1] ?? 1, tiers[2] ?? 1],
    unlitBaseHealth,
    alchemy: count(o.alchemy, `${where}.alchemy`),
    rulesVersion: count(o.rulesVersion, `${where}.rulesVersion`),
    outcome,
    stagesCleared: stagesCleared as 0 | 1 | 2 | 3,
    standingCount,
    downedCount,
    stages,
  };
};

const knowledgeFrom = (
  v: unknown,
  where: string,
  warnings: string[],
): Partial<Record<DescentMonsterId, number>> => {
  const out: Partial<Record<DescentMonsterId, number>> = {};
  for (const [k, x] of Object.entries(obj(v, where))) {
    if (!(DESCENT_MONSTER_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown ${where} entry "${k}".`);
      continue;
    }
    out[k as DescentMonsterId] = knowledgeLevel(x, `${where}.${k}`);
  }
  return out;
};

export const descentFrom = (v: unknown, warnings: string[]): DescentState => {
  const o = obj(v, 'descent');
  const known = ['attempts', 'unlitMet', 'last', 'firstWin', 'unreadResult'];
  for (const k of Object.keys(o))
    if (!known.includes(k)) warnings.push(`Dropped unknown descent.${k}.`);
  const firstWin = orNull(o.firstWin, (x) => recordFrom(x, 'descent.firstWin', warnings));
  if (firstWin && firstWin.outcome !== 'win') throw new Invalid('descent.firstWin is not a win.');
  return {
    attempts: count(o.attempts, 'descent.attempts'),
    unlitMet: bool(o.unlitMet, 'descent.unlitMet'),
    last: orNull(o.last, (x) => recordFrom(x, 'descent.last', warnings)),
    firstWin,
    unreadResult: bool(o.unreadResult, 'descent.unreadResult'),
  };
};
