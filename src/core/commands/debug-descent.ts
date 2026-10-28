import { CONSUMABLE_IDS } from '../../content/consumables';
import { DELVE_RELIC_IDS } from '../../content/delves/relics';
import { GEAR_IDS, gear } from '../../content/gear';
import { HUNTER_IDS, hunters } from '../../content/hunters';
import { INGREDIENT_IDS } from '../../content/ingredients';
import { ORDER_IDS } from '../../content/orders';
import { RELIC_IDS } from '../../content/relics';
import { CONTRACT_SPECIES } from '../../content/remembering';
import { SKILL_IDS } from '../../content/skills';
import { talentsOf } from '../../content/talents';
import { num } from '../balance-access';
import { HUNTER_RANK_IDS } from '../../content/ranks';
import { freshHunter } from '../state/hunters-state';
import type { GameState } from '../state/game-state';
import { levelFor, maxSkillLevel, xpToNext } from '../skills/skills';
import { suggestDescentOrder } from '../systems/descent-order';
import { equipItem, makeItem } from '../systems/items';
import { talentPointsAt } from '../systems/ranks';
import { actVIStandApplied } from '../story/remembering';
import { startDescent } from './descent';
import { debugRememberingFinishActVI, debugRememberingOpenGate } from './debug-remembering';
import { ok, refuse, type ApplyResult } from './types';

// GDD §9.24, technical design §15 (D563, M5): the endgame roster and an honest win. Like every debug
// action they set meta.debugUsed. The roster builder is a plain function so the simulator (TD.8a) can
// build the same state; the win runs real attempts through `descent.start`, never a forged record.

/** Hunters at the top of what the game offers: all 14 owned, Master-Wright, 5 stars, 5 talents, Wright gear. */
const equipHunters = (state: GameState): void => {
  const weapon = GEAR_IDS.map((g) => gear[g])
    .filter((g) => g.slot === 'weapon')
    .sort((a, b) => b.tier - a.tier)[0];
  const armor = GEAR_IDS.map((g) => gear[g])
    .filter((g) => g.slot === 'armor')
    .sort((a, b) => b.tier - a.tier)[0];
  const top = HUNTER_RANK_IDS[HUNTER_RANK_IDS.length - 1] ?? 'masterWright';
  for (const id of HUNTER_IDS) {
    state.fallen = state.fallen.filter((f) => f.hunter !== id);
    const h = (state.hunters[id] ??= freshHunter());
    h.level = Math.max(h.level, num('rank.masterLevel'));
    h.xp = 0;
    h.rank = top;
    h.stars = num('star.max');
    h.recovery = null;
    state.story.peakLevels[id] = Math.max(state.story.peakLevels[id] ?? 0, h.level);
    h.talents = talentsOf(hunters[id].role)
      .slice(0, talentPointsAt(top))
      .map((t) => t.id);
    for (const [piece, slot] of [
      [weapon, 'weapon'],
      [armor, 'armor'],
    ] as const) {
      if (!piece) continue;
      const worn = slot === 'weapon' ? h.weapon : h.armor;
      if (worn && state.items.find((i) => i.id === worn)?.base === piece.id) continue;
      const item = makeItem(state, piece);
      equipItem(state, item, id, slot);
    }
    // The pieces they wore before are scrapped, not left in Stores.
    state.items = state.items.filter(
      (i) => i.where !== null || i.id === h.weapon || i.id === h.armor,
    );
  }
};

/** Builds a strong endgame state (M5, M10); idempotent. */
export const prepareEndgameRoster = (state: GameState): void => {
  equipHunters(state);
  const mastered = num('knowledge.masteredKills');
  for (const m of CONTRACT_SPECIES)
    state.bestiary[m] = { level: 4, kills: Math.max(state.bestiary[m]?.kills ?? 0, mastered) };
  for (const id of INGREDIENT_IDS) state.book.properties[id] = [0, 1, 2];
  for (const s of SKILL_IDS) {
    let xp = 0;
    for (let l = 0; l < maxSkillLevel(); l++) xp += xpToNext(l);
    if (levelFor(state.skills[s]) < maxSkillLevel()) state.skills[s] = xp;
  }
  const top = num('orders.levels');
  for (const o of ORDER_IDS) {
    // Every chapter read: the Order has opened and reached its top level (what the save checks require).
    state.orders.opened[o] ??= { at: state.time };
    state.orders.levelHigh[o] = Math.max(state.orders.levelHigh[o], top);
    const read = state.orders.readWith[o];
    while (read.length < top) read.push([]);
    state.orders.chaptersRead[o] = read.length;
  }
  for (const id of RELIC_IDS)
    if (!state.relics.some((r) => r.id === id))
      state.relics.push({ id, cycle: state.cycle.number });
  for (const id of DELVE_RELIC_IDS)
    if (!state.delve.relics.some((r) => r.id === id))
      state.delve.relics.push({ id, cycle: state.cycle.number });
  // Matching consumables: a stock of every potion, oil and bomb.
  for (const id of CONSUMABLE_IDS) state.stores[id] = Math.max(state.stores[id], ENDGAME_STOCK);
};
const ENDGAME_STOCK = 20;

export const debugPrepareEndgameRoster = (state: GameState): ApplyResult => {
  prepareEndgameRoster(state);
  state.meta.debugUsed = true;
  return ok;
};

const MAX_ATTEMPTS = 60;

/**
 * Opens the gate, takes the hold to Bastion, builds the endgame roster and fights real Descents until
 * one is won (the seeds are the game's own: `gameSeed:descent:n`). Refused if none is won in time, so
 * a forged result is never recorded.
 */
export const debugDescentWin = (state: GameState, now: number): ApplyResult => {
  if (state.descent.firstWin) return ok;
  if (!actVIStandApplied(state)) {
    const r = debugRememberingFinishActVI(state);
    if (!r.ok) return r;
  }
  const opened = debugRememberingOpenGate(state);
  if (!opened.ok) return opened;
  const record = state.cycles[state.cycles.length - 1];
  state.cycle.age = 'bastion';
  if (record) record.ranks.bastion ??= state.time;
  prepareEndgameRoster(state);
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    for (const id of CONSUMABLE_IDS) state.stores[id] = Math.max(state.stores[id], ENDGAME_STOCK);
    const r = startDescent(state, suggestDescentOrder(state), { oils: {}, potions: {} }, now);
    if (!r.ok) return r;
    if (state.descent.firstWin) {
      state.meta.debugUsed = true;
      return ok;
    }
  }
  return refuse(`No win in ${MAX_ATTEMPTS} attempts; nothing was recorded as won.`);
};
