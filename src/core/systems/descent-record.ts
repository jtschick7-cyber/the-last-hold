import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { constantAt, num } from '../balance-access';
import { prepProblem } from '../contracts/prep';
import { RULES_VERSION } from '../rules-version';
import { bombStock } from '../stand/from-state';
import type { DescentMonsterId, DescentRecord } from '../state/descent-state';
import { DESCENT_ORDER_MAX } from '../state/descent-state';
import type { GameState, Preparation } from '../state/game-state';
import { levelOf } from '../investigation/knowledge';
import { skillLevel } from '../skills/skills';
import { endingChoosable } from '../story/remembering';
import { runDescent, type DescentInput, type DescentRun } from './descent-fight';
import { hunterStatus, snapshotOf } from './hunters';
import { learnedBonus } from './descent';

// GDD §5.15.10, technical design §22.1, §22.2 (D558, D562): who can go, what a Descent freezes, and the
// rebuild of its logs. Every combat input is frozen on the record, so a replay depends on nothing in the
// hold as it is later (M3).

/** The Descent is open: the Remembering gate is open and the hold has reached Bastion (D558, S6). */
export const descentAvailable = (state: GameState): boolean =>
  endingChoosable(state) && state.cycle.age === 'bastion';

/**
 * Owned hunters who can march now, in content order: all but those on a running contract or in a
 * paused Delve (the all-hands rule: injury and rest timers do not block, D558, D567 (1)).
 */
export const eligibleForDescent = (state: GameState): HunterId[] =>
  HUNTER_IDS.filter((id) => {
    const status = hunterStatus(state, id);
    return status !== null && status !== 'on-contract' && status !== 'in-delve';
  });

/** Why the Descent cannot start with this order and preparation, or null. */
export const descentProblem = (
  state: GameState,
  order: readonly HunterId[],
  prep: Pick<Preparation, 'oils' | 'potions'>,
): string | null => {
  if (!descentAvailable(state)) return 'The Descent is not open yet.';
  if (!Array.isArray(order as unknown) || order.length === 0) return 'Choose at least one hunter.';
  if (order.length > DESCENT_ORDER_MAX) return `At most ${DESCENT_ORDER_MAX} hunters can march.`;
  if (new Set(order).size !== order.length) return 'A hunter is listed twice.';
  const free = eligibleForDescent(state);
  for (const id of order) {
    if (!(HUNTER_IDS as readonly string[]).includes(id) || !state.hunters[id])
      return 'Only your own hunters can march.';
    if (!free.includes(id)) return 'A hunter on a contract or in a Delve cannot march.';
  }
  return prepProblem(state, order, {
    oils: prep.oils ?? {},
    potions: prep.potions ?? {},
    bombs: [],
  });
};

/** The levels the stage monsters are fought at, frozen on the record (M3). Unlit is never studied. */
const knowledgeNow = (state: GameState): Partial<Record<DescentMonsterId, number>> => ({
  'unlits-breath': state.delve.deep['unlits-breath']?.level ?? 0,
  'the-forgotten': state.delve.deep['the-forgotten']?.level ?? 0,
  'dross-tide': state.delve.deep['dross-tide']?.level ?? 0,
  'anvil-wight': levelOf(state, 'anvil-wight'),
  rimewrought: levelOf(state, 'rimewrought'),
  unlit: 0,
});

/** The record a Descent started now would freeze, before its fight: outcome fields are filled by the caller. */
export const descentInputFor = (
  state: GameState,
  order: readonly HunterId[],
  prep: Pick<Preparation, 'oils' | 'potions'>,
): { record: DescentRecord; input: DescentInput } => {
  const learned = learnedBonus(state);
  const attempt = state.descent.attempts + 1;
  const record: DescentRecord = {
    attempt,
    cycle: state.cycle.number,
    warden: state.cycles[state.cycles.length - 1]?.warden ?? null,
    seed: `${state.meta.gameSeed}:descent:${attempt}`,
    order: order.map((id) => snapshotOf(state, id)),
    prep: { oils: { ...prep.oils }, potions: { ...prep.potions } },
    bombs: bombStock(state),
    learned: { mightAndHealth: learned.might.value, taken: -learned.taken.value },
    delveRelics: state.delve.relics.map((r) => r.id),
    bestiaryKnowledge: knowledgeNow(state),
    stageTiers: [...(constantAt('descent.stageTiers').value as readonly number[])] as [
      number,
      number,
      number,
    ],
    unlitBaseHealth: num('descent.unlitBaseHealth'),
    alchemy: skillLevel(state, 'alchemy'),
    rulesVersion: RULES_VERSION,
    outcome: 'loss',
    stagesCleared: 0,
    standingCount: 0,
    downedCount: 0,
    stages: [],
  };
  return { record, input: inputOf(record, false) };
};

const inputOf = (record: DescentRecord, log: boolean): DescentInput => ({
  seed: record.seed,
  order: record.order,
  prep: record.prep,
  bombs: record.bombs,
  learned: record.learned,
  delveRelics: record.delveRelics,
  knowledge: record.bestiaryKnowledge,
  stageTiers: record.stageTiers,
  unlitBaseHealth: record.unlitBaseHealth,
  alchemy: record.alchemy,
  log,
});

/**
 * Runs the three stages again from the record alone, with logs (M3): nothing in the hold as it is now
 * is read, so later kills, levels or gear can never change a replay.
 */
export const rebuildDescentLogs = (record: DescentRecord): DescentRun =>
  runDescent(inputOf(record, true));

/** Whether a rebuilt run still agrees with what the record says happened (a guard for tests and the UI). */
export const rebuildMatches = (record: DescentRecord, run: DescentRun): boolean =>
  run.outcome === record.outcome &&
  run.stagesCleared === record.stagesCleared &&
  JSON.stringify(run.stages.map((s) => s.summary)) === JSON.stringify(record.stages);
