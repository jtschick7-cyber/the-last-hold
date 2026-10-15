import type { FightResult } from './combat';
import { replayLastFloor } from './delves/run';
import type { FightRef, GameState, StandRecord } from './state/game-state';
import type { StandResult } from './stand/engine';

// Technical design §5.3, GDD §9.6 (v0.8, D319): "recorded with an older rules version" is shown only
// when a replay actually comes out different from what was recorded. A fight recorded under an
// older version that replays to the same result is not worth a warning. What each record keeps to
// compare with: a contract fight its result; a stand the waves it held; a Delve floor the run's
// record of its last floor. The screens already run the replay when a log opens, so they pass it in.

/** A contract fight's replay comes out different from the record. */
export const fightReplayDiffers = (ref: FightRef, replay: FightResult): boolean =>
  replay.result !== ref.result;

/** A stand's replay holds a different number of waves than the record says. */
export const standReplayDiffers = (record: StandRecord, replay: StandResult): boolean =>
  replay.wavesHeld !== record.wavesHeld;

/** The last Delve floor of the run in progress replays to another result than the run recorded. False when there is none. */
export const floorReplayDiffers = (state: GameState): boolean => {
  const last = state.delve.run?.lastFloor;
  if (!last) return false;
  const replay = replayLastFloor(state, false);
  return replay !== null && replay.result !== last.result;
};

export const OLDER_RULES_NOTE =
  'Recorded with an older rules version, so this replay differs from what happened.';
