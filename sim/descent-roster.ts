import { CONTRACT_SPECIES } from '../src/content/remembering';
import { num } from '../src/core/balance-access';
import {
  debugRememberingFinishActVI,
  debugRememberingOpenGate,
} from '../src/core/commands/debug-remembering';
import { prepareEndgameRoster } from '../src/core/commands/debug-descent';
import type { GameState } from '../src/core/state/game-state';
import { actVIStandApplied } from '../src/core/story/remembering';

// Plan TD.8a (technical design §22.7, M5, M10): the two reference rosters the Descent probe fights
// with. `maxed` is the very state `debug.prepareEndgameRoster` builds (the core function is shared, so
// the owner's debug button and the simulator can never drift apart). `minimal` is the weakest state that
// lets a player in: the gate open and the hold at Bastion, every species Studied and none Mastered, no
// Order chapter read, and the roster, skills and relics as the run left them.

export const ROSTER_PROFILES = ['minimal', 'maxed'] as const;
export type RosterProfile = (typeof ROSTER_PROFILES)[number];

/** The gate and the hold, as `debug.descentWin` sets them (Act VI's stand applied, gate open, Bastion). */
const openTheGate = (state: GameState): void => {
  if (!actVIStandApplied(state)) {
    const r = debugRememberingFinishActVI(state);
    if (!r.ok) throw new Error(r.reason);
  }
  const opened = debugRememberingOpenGate(state);
  if (!opened.ok) throw new Error(opened.reason);
  const record = state.cycles[state.cycles.length - 1];
  state.cycle.age = 'bastion';
  if (record) record.ranks.bastion ??= state.time;
};

/** Builds a reference roster in place; idempotent. Like every debug path it sets `meta.debugUsed`. */
export const buildEndgameRoster = (state: GameState, profile: RosterProfile): void => {
  openTheGate(state);
  if (profile === 'maxed') {
    prepareEndgameRoster(state);
  } else {
    // "Studied, not Mastered": the gate's own floor, so a natural higher level is brought down to it.
    for (const m of CONTRACT_SPECIES)
      state.bestiary[m] = { level: 3, kills: num('knowledge.studiedKills') };
  }
  state.meta.debugUsed = true;
};
