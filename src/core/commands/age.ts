import { ages } from '../../content/ages';
import { RESOURCE_IDS } from '../../content/resources';
import type { GameState } from '../state/game-state';
import { ageUpStatus } from '../systems/ages';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.1.3: the Age-up. Its grants (age bucket, higher maximum levels, new
// buildings) follow from the Age itself, so only the Age and resources change.
export const ageUp = (state: GameState): ApplyResult => {
  const status = ageUpStatus(state);
  if (!status) return refuse('The next Age is coming in a later milestone.');
  const missing = status.requirements
    .filter((r) => !r.met)
    .map((r) => `${r.label} ${r.have}/${r.need}`);
  if (missing.length > 0) return refuse(`Not yet: ${missing.join(', ')}.`);
  if (!status.affordable)
    return refuse(`Not enough resources to become a ${ages[status.to].name}.`);
  const cost = ages[status.to].ageUp?.cost ?? {};
  for (const r of RESOURCE_IDS) state.resources[r] -= cost[r] ?? 0;
  state.cycle.age = status.to;
  return ok;
};
