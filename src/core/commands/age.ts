import { ages } from '../../content/ages';
import { RESOURCE_IDS } from '../../content/resources';
import type { GameState } from '../state/game-state';
import { ageUpStatus } from '../systems/ages';
import { startAllowanceClock } from '../delves/riftglass';
import { openEvents } from '../systems/events';
import { sweepDocuments } from '../story/documents';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.1.3: the Age-up. Its grants (age bucket, higher maximum levels, new
// buildings) follow from the Age itself, so only the Age and resources change.
export const ageUp = (state: GameState): ApplyResult => {
  const status = ageUpStatus(state);
  if (!status) return refuse(`${ages[state.cycle.age].name} is the highest Rank.`);
  const missing = status.requirements
    .filter((r) => !r.met)
    .map((r) => `${r.label} ${r.have}/${r.need}`);
  if (missing.length > 0) return refuse(`Not yet: ${missing.join(', ')}.`);
  if (!status.affordable)
    return refuse(`Not enough resources to become a ${ages[status.to].name}.`);
  const cost = ages[status.to].ageUp?.cost ?? {};
  for (const r of RESOURCE_IDS) state.resources[r] -= cost[r] ?? 0;
  state.cycle.age = status.to;
  // D113: the cycle history keeps when each Rank was reached.
  const record = state.cycles[state.cycles.length - 1];
  if (record) record.ranks[status.to] = state.time;
  startAllowanceClock(state); // GDD §5.10.8: the Riftglass allowance begins when Delves open
  sweepDocuments(state); // GDD §5.14.2: a Rank document arrives on the Rank-up sheet
  openEvents(state, state.time); // GDD §5.12.1: events open for good at the first Citadel
  return ok;
};
