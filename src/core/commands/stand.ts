import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { num } from '../balance-access';
import { applyCompletion } from '../contracts/complete';
import { prepProblem, spendPrep } from '../contracts/prep';
import { RULES_VERSION } from '../rules-version';
import { resetForNewCycle } from '../long-night/reset';
import { embersPayout } from '../stand/embers';
import { runStand } from '../stand/engine';
import { arrivalTrophyCap, standInputFor } from '../stand/from-state';
import { bestWavesEver, relicsFound } from '../stand/relics';
import type { GameState, Preparation, StandRecord } from '../state/game-state';
import { bandFor } from '../story/band';
import { standDocuments, wardenDocuments } from '../story/documents';
import { triumphantStand } from '../story/trust';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.9.3 and §5.9.7 (D107, D110): making the Last Stand, then the Long Night, in
// this order: running contracts finish on the spot with their real result, the stand,
// the conversion into Embers and relics, the reset, the new cycle. Starting is final.

/** Why the stand can't be made now, or null. */
export const standProblem = (state: GameState): string | null => {
  // GDD §5.9.8: a save from before v0.4 faces its first stand at whatever Rank it has.
  if (!state.arrivalDue && state.cycle.age !== 'bastion') return 'The Last Stand opens at Bastion.';
  const record = state.cycles[state.cycles.length - 1];
  if (!record || record.stand) return 'This cycle has already made its stand.';
  return null;
};

export const makeStand = (
  state: GameState,
  party: readonly HunterId[],
  prep: Pick<Preparation, 'oils' | 'potions'>,
): ApplyResult => {
  const problem = standProblem(state);
  if (problem) return refuse(problem);
  if (!Array.isArray(party as unknown) || party.length === 0)
    return refuse('Choose at least one hunter.');
  if (party.length > num('laststand.partyMax'))
    return refuse(`At most ${num('laststand.partyMax')} hunters can stand.`);
  if (new Set(party).size !== party.length) return refuse('A hunter is listed twice.');
  for (const id of party) {
    if (!(HUNTER_IDS as readonly string[]).includes(id) || !state.hunters[id])
      return refuse('Only your own hunters can stand.');
    if (!state.roster.active.includes(id)) return refuse('Only active hunters can stand.');
  }
  // Injured hunters can stand (GDD §5.9.3); bombs come from the stores on their own.
  const full: Preparation = { oils: prep.oils ?? {}, potions: prep.potions ?? {}, bombs: [] };
  const bad = prepProblem(state, party, full);
  if (bad) return refuse(bad);

  // 1. Contracts still running finish now, with the dice fixed at launch.
  for (const r of state.running) r.endsAt = Math.min(r.endsAt, state.time);
  while (state.running.length > 0) applyCompletion(state);
  // 2. The stand.
  spendPrep(state, full);
  const input = standInputFor(state, party, full);
  const result = runStand(input);
  // 3. Conversion: Embers and relics.
  const payout = embersPayout({
    rank: state.cycle.age,
    waves: result.wavesHeld,
    threat: input.threat,
    trophies: state.stats.trophies,
    trophyCap: arrivalTrophyCap(state),
  });
  const found = relicsFound(
    input.seed,
    result.wavesHeld,
    bestWavesEver(state),
    state.relics.map((r) => r.id),
  );
  const stand: StandRecord = {
    at: state.time,
    seed: input.seed,
    rank: state.cycle.age,
    threat: input.threat,
    party: [...input.party],
    prep: input.prep,
    bombs: { ...input.bombs },
    defenses: { ...input.defenses },
    relics: [...input.relics],
    knowledge: { ...input.knowledge },
    rulesVersion: RULES_VERSION,
    wavesHeld: result.wavesHeld,
    embers: { waves: payout.waves, trophies: payout.trophies, total: payout.value },
    relicsFound: found,
    arrival: state.arrivalDue,
    trustSteps: [],
    seen: false,
  };
  const record = state.cycles[state.cycles.length - 1];
  if (record) record.stand = stand;
  state.embers += payout.value;
  for (const id of found) state.relics.push({ id, cycle: state.cycle.number });
  // GDD §5.14.9: the stand closes the act (its testament on the result sheet), and a
  // Triumphant one raises every village's trust a step (D146).
  // The steps are kept on the record so the result sheet can show them whenever it is opened (D183).
  if (bandFor(result.wavesHeld) === 'triumphant') stand.trustSteps = triumphantStand(state);
  standDocuments(state);
  // 4–5. The reset and the new cycle; the next warden's arrival closes the act's scene.
  resetForNewCycle(state);
  wardenDocuments(state);
  return ok;
};

/** The last stand's result sheet has been read (GDD §5.9.7, the Long Night sheets). */
export const markStandSeen = (state: GameState): ApplyResult => {
  const last = [...state.cycles].reverse().find((c) => c.stand !== null);
  if (!last?.stand) return refuse('No stand to acknowledge.');
  last.stand.seen = true;
  return ok;
};
