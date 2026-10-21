import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { CONTRACT_SPECIES } from '../../content/remembering';
import { ROLL_SIZE } from '../../content/story/roll';
import { num } from '../balance-access';
import type { GameState } from '../state/game-state';
import { actVIStandApplied } from '../story/remembering';
import { debugStartAct } from './act-start';
import { makeStand } from './stand';
import { ok, refuse, type ApplyResult } from './types';

// Plan T11.5 (technical design §15, D462): the owner's path to the near-scene, the card and the
// ending. Like every debug action they set meta.debugUsed.

/**
 * Opens the gate by writing what the game itself reads: the 40 names found and every contract
 * species at Studied or better. It does NOT run the found-document hooks, so no Bell-Watchers
 * standing, Lore XP or Archive badge comes with it (D462 (1)). A higher level stays as it is.
 */
export const debugRememberingOpenGate = (state: GameState): ApplyResult => {
  const have = new Set(state.story.names.map((x) => x.n));
  for (let n = 1; n <= ROLL_SIZE; n++)
    if (!have.has(n)) state.story.names.push({ n, cycle: state.cycle.number, at: state.time });
  const studied = num('knowledge.studiedKills');
  for (const m of CONTRACT_SPECIES) {
    const entry = state.bestiary[m] ?? { level: 1, kills: 0 };
    state.bestiary[m] = {
      level: Math.max(entry.level, 3) as 3 | 4,
      kills: Math.max(entry.kills, studied),
    };
  }
  state.meta.debugUsed = true;
  return ok;
};

/**
 * Applies Act VI's Last Stand result by playing the real stand: Act VI is begun if it is not (as
 * "Start Act VI" does), the hold is taken to Bastion, and the stand is made with the active hunters
 * through the same code a player's stand uses. So the record is a valid one that replays, and the
 * Long Night follows as it always does (the hold resets; hunters, Embers and the rest persist).
 */
export const debugRememberingFinishActVI = (state: GameState): ApplyResult => {
  if (actVIStandApplied(state)) return refuse("Act VI's stand has already been applied.");
  if (!state.story.acts.some((a) => a.act === 6)) {
    const r = debugStartAct(state, 6);
    if (!r.ok) return r;
  }
  const record = state.cycles[state.cycles.length - 1];
  if (!record) return refuse('There is no cycle.');
  state.cycle.age = 'bastion';
  record.ranks.bastion ??= state.time;
  const party = state.roster.active
    .filter((id): id is HunterId => (HUNTER_IDS as readonly string[]).includes(id))
    .slice(0, num('laststand.partyMax'));
  const r = makeStand(state, party, { oils: {}, potions: {} });
  if (!r.ok) return r;
  state.meta.debugUsed = true;
  return ok;
};
