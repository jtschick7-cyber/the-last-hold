import { gearCost, noteGearUpgraded } from '../skills/hooks';
import type { GearSlot } from '../../content/gear';
import { HUNTER_IDS, hunters, type HunterId } from '../../content/hunters';
import { RESOURCE_IDS } from '../../content/resources';
import type { GameState } from '../state/game-state';
import { freshHunter } from '../state/hunters-state';
import { canAfford } from '../systems/costs';
import {
  candidates,
  hunterStatus,
  isOwned,
  gearLock,
  nextGear,
  returnLevel,
  rosterCap,
} from '../systems/hunters';
import { sweepDocuments } from '../story/documents';
import { noteAllPeaks } from '../story/letters';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.3.1 (recruitment, active roster and reserve) and §5.3.6 (gear).

const known = (id: unknown): id is HunterId =>
  typeof id === 'string' && (HUNTER_IDS as readonly string[]).includes(id);

/** Pays a fixed silver price (G5). A recruit joins the active roster if there is room, else the reserve. */
export const recruit = (state: GameState, id: HunterId): ApplyResult => {
  if (!known(id)) return refuse('That hunter does not exist.');
  if (isOwned(state, id)) return refuse(`${hunters[id].shortName} is already with you.`);
  if (!candidates(state).some((c) => c.id === id)) {
    return refuse(`${hunters[id].shortName} hasn't arrived yet.`);
  }
  const price = hunters[id].recruitPrice;
  if (state.resources.silver < price) return refuse('Not enough silver to recruit them.');
  state.resources.silver -= price;
  // GDD §5.9.7: a hunter back from the Hall of the Fallen keeps half their levels.
  state.hunters[id] = { ...freshHunter(), level: returnLevel(state, id) };
  if (state.roster.active.length < rosterCap(state).value) state.roster.active.push(id);
  sweepDocuments(state); // D2-08: Sigrun's confession comes when she's recruited, if after Bastion
  noteAllPeaks(state); // a returning hunter's kept level counts toward their letters
  return ok;
};

/** Swapping active and reserve is free and instant, except on a contract or recovering (G5). */
export const setActive = (state: GameState, id: HunterId, active: boolean): ApplyResult => {
  if (!known(id)) return refuse('That hunter does not exist.');
  if (!isOwned(state, id)) return refuse(`${hunters[id].shortName} isn't on your roster.`);
  if (typeof active !== 'boolean') return refuse('Active or reserve.');
  const isActive = state.roster.active.includes(id);
  if (active === isActive) return refuse(isActive ? 'Already active.' : 'Already in the reserve.');
  const status = hunterStatus(state, id);
  if (status === 'on-contract') return refuse(`${hunters[id].shortName} is on a contract.`);
  if (status === 'in-delve') return refuse(`${hunters[id].shortName} is in a Delve.`);
  if (status === 'recovering') return refuse(`${hunters[id].shortName} is recovering.`);
  if (active) {
    if (state.roster.active.length >= rosterCap(state).value) {
      return refuse('The active roster is full. Move someone to the reserve first.');
    }
    state.roster.active.push(id);
  } else {
    state.roster.active = state.roster.active.filter((h) => h !== id);
  }
  return ok;
};

/** The Smithy upgrades a gear slot in place (GDD §5.3.6). */
export const upgradeGear = (state: GameState, id: HunterId, slot: GearSlot): ApplyResult => {
  if (!known(id)) return refuse('That hunter does not exist.');
  const h = state.hunters[id];
  if (!h) return refuse(`${hunters[id].shortName} isn't on your roster.`);
  if (slot !== 'weapon' && slot !== 'armor') return refuse('Weapon or armor.');
  const next = nextGear(h, slot);
  if (!next) return refuse('Already the best gear there is.');
  if (state.buildings[next.requires.building] < next.requires.level) {
    return refuse(`${next.name} needs Smithy level ${next.requires.level}.`);
  }
  const lock = gearLock(state, next);
  if (lock) return refuse(`The ${next.name} ${lock}.`);
  const { cost } = gearCost(state, next); // after Smithing (GDD §5.8.6)
  if (!canAfford(state, cost)) return refuse(`Not enough resources for ${next.name}.`);
  for (const r of RESOURCE_IDS) state.resources[r] -= cost[r];
  if (slot === 'weapon') h.weapon = next.id;
  else h.armor = next.id;
  noteGearUpgraded(state, next.tier);
  return ok;
};
