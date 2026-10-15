import type { RarityId } from '../../content/delves/blessing-types';
import { echoes } from '../../content/delves/echoes';
import type { GuardianId } from '../../content/delves/guardians';
import type { PatronId } from '../../content/delves/patrons';
import { DELVE_RELIC_IDS, delveRelics, type DelveRelicId } from '../../content/delves/relics';
import { FAMILY_IDS } from '../../content/damage';
import { MONSTER_IDS, monsters } from '../../content/monsters';
import { balance } from '../../content/balance';
import type { GameState } from '../state/game-state';
import type { DelveRun } from '../state/delve-state';
import { knowledgeLevels } from '../../content/knowledge';
import { PROPERTIES_TOTAL, propertiesFound } from '../alchemy/book';

// GDD §5.10.7 (D261–D263): what a Delve gives besides Riftglass: Delve relics (found by whichever of
// their two sources comes first, D20), Ember-echoes, and what the hunters learn of the Deep.

/** A Delve relic is found, once (D261). Returns whether it is new. */
export const grantRelic = (state: GameState, id: DelveRelicId, run?: DelveRun | null): boolean => {
  if (state.delve.relics.some((r) => r.id === id)) return false;
  state.delve.relics.push({ id, cycle: state.cycle.number });
  run?.earned.relics.push(id);
  return true;
};

/** Whether the idle source of a Delve relic is met: a family all Studied, or the recipe book complete. */
const idleSourceMet = (state: GameState, id: DelveRelicId): boolean => {
  const s = delveRelics[id].idleSource;
  if (s.kind === 'recipeBookComplete') return propertiesFound(state) >= PROPERTIES_TOTAL;
  const species = MONSTER_IDS.filter((m) => monsters[m].family === s.family);
  return (
    FAMILY_IDS.includes(s.family) &&
    species.length > 0 &&
    species.every((m) => (state.bestiary[m]?.level ?? 0) >= knowledgeLevels.studied.number)
  );
};

/**
 * The idle sources (D261): every species of a family Studied, or the recipe book complete, finds
 * the relic without a single Delve. Idempotent; checked on the same events as other unlocks.
 */
export const grantIdleDelveRelics = (state: GameState): void => {
  for (const id of DELVE_RELIC_IDS) if (idleSourceMet(state, id)) grantRelic(state, id);
};

/**
 * A blessing of this patron and rarity is taken (D263): the echo of that rarity is found the
 * first time ever. Returns the echo's id if one was found now.
 */
export const noteBlessingTaken = (
  state: GameState,
  patron: PatronId,
  rarity: RarityId,
  run: DelveRun | null,
): string | null => {
  const seen = (state.delve.taken[patron] ??= []);
  if (!seen.includes(rarity)) seen.push(rarity);
  const echo = echoes.find((e) => e.patron === patron && e.rarity === rarity);
  if (!echo || state.delve.echoes.some((e) => e.id === echo.id)) return null;
  state.delve.echoes.push({ id: echo.id, cycle: state.cycle.number, at: state.time });
  run?.earned.echoes.push(echo.id);
  return echo.id;
};

/** A fight against a Deep guardian (GDD §5.6.2): it is Identified, a win is a kill, 4 Studied, 10 Mastered. */
export const recordDeepFight = (state: GameState, g: GuardianId, won: boolean): void => {
  const entry = (state.delve.deep[g] ??= { level: 2, kills: 0 });
  if (won) entry.kills += 1;
  const level =
    entry.kills >= balance.knowledge.masteredKills.value
      ? 4
      : entry.kills >= balance.knowledge.studiedKills.value
        ? 3
        : 2;
  if (level > entry.level) entry.level = level;
  if (won) state.delve.guardiansBeaten[g] = (state.delve.guardiansBeaten[g] ?? 0) + 1;
};
