import { CONTRACT_SPECIES } from '../../content/remembering';
import { ROLL_SIZE } from '../../content/story/roll';
import { levelOf } from '../investigation/knowledge';
import type { GameState } from '../state/game-state';

// GDD §5.15.1–§5.15.3 (D449, D461): the Remembering's gate. Everything here is worked out from
// the state each time and never stored, so no save can be stranded by it. Names found and
// Studied knowledge never go down, so the gate does not close again in play.

/** Studied is knowledge level 3 (GDD §5.6.2); the gate reads the stored level, not raw kills. */
const STUDIED = 3;

/** How many of the 40 names are found. */
export const namesFound = (state: GameState): number =>
  new Set(state.story.names.map((x) => x.n).filter((n) => n >= 1 && n <= ROLL_SIZE)).size;

/** How many contract species are Studied or better. */
export const speciesStudied = (state: GameState): number =>
  CONTRACT_SPECIES.filter((m) => levelOf(state, m) >= STUDIED).length;

/** All 40 names found and every contract species Studied or better (D449). */
export const rememberingGate = (state: GameState): boolean =>
  namesFound(state) >= ROLL_SIZE && speciesStudied(state) >= CONTRACT_SPECIES.length;

/**
 * Act VI has ended (D459 (4)): its cycle has its Last Stand result applied, or a later cycle
 * exists (the Long Night that follows the stand starts one).
 */
export const actVIStandApplied = (state: GameState): boolean => {
  const act = state.story.acts.find((a) => a.act === 6);
  if (!act) return false;
  return state.cycles.some(
    (c) => (c.number === act.cycle && c.stand !== null) || c.number > act.cycle,
  );
};

/** An ending can be chosen: Act VI's stand is applied and the gate is open (D461 (1)). */
export const endingChoosable = (state: GameState): boolean =>
  actVIStandApplied(state) && rememberingGate(state);
