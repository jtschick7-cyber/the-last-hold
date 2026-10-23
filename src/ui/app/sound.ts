// GDD §9.22: the one place the UI asks for a sound. The setting lives in the settings key outside
// the save, and the core never knows any of this exists.
import { soundFor, type Moment, type SoundId } from '../../platform/sound/moments';
import { createBrowserSound } from '../../platform/sound/browser';
import type { SoundPlayer } from '../../platform/sound/player';

let player: SoundPlayer | null = null;
const get = (): SoundPlayer => (player ??= createBrowserSound());

/** Sound switched On or Off. Call it inside the tap that did it, so the phone lets audio start. */
export const applySoundSetting = (on: boolean): void => {
  if (on || player) get().setEnabled(on);
};

/** One sound for one moment (D520); skipped, never queued, when it cannot play now. */
export const playMoment = (moment: Moment): boolean =>
  player ? player.request(soundFor(moment)) : false;

/** The debug panel's Play sound row: plays one of the seven straight away (UI-only). */
export const playSoundById = (id: SoundId): boolean => (player ? player.request(id) : false);
