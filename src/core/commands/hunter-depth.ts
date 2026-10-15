import { hunters } from '../../content/hunters';
import type { GameState } from '../state/game-state';
import { nextRank, rankUpView, starView } from '../systems/ranks';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.11.3 (v0.8, D309, D310): Rank up and Add a star, bought from the hunter's sheet. Both are
// kept forever. Trophies are spent from those on hand; the cycle's trophies earned stay as they are.

const hunterOf = (state: GameState, hunter: unknown) => {
  if (typeof hunter !== 'string' || !(hunter in hunters)) return null;
  const id = hunter as keyof typeof hunters;
  const h = state.hunters[id];
  return h ? { id, h } : null;
};

export const rankUp = (state: GameState, hunter: unknown): ApplyResult => {
  const found = hunterOf(state, hunter);
  if (!found) return refuse('That hunter is not on your roster.');
  const view = rankUpView(state, found.id);
  const next = nextRank(found.h.rank);
  if (!view || !next) return refuse('Already a Master-Wright.');
  if (!view.available) return refuse(`${hunters[found.id].shortName}: ${view.reason}.`);
  state.stats.trophiesSpent += view.trophies.value;
  found.h.rank = next;
  return ok;
};

export const addStar = (state: GameState, hunter: unknown): ApplyResult => {
  const found = hunterOf(state, hunter);
  if (!found) return refuse('That hunter is not on your roster.');
  const view = starView(state, found.id);
  if (!view?.embers) return refuse('That hunter is not on your roster.');
  if (!view.available) return refuse(`${hunters[found.id].shortName}: ${view.reason}.`);
  state.embers -= view.embers.value;
  state.stats.trophiesSpent += view.trophies.value;
  found.h.stars += 1;
  return ok;
};
