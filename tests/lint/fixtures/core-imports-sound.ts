// A planted import: src/core/ must never reach the sound module (D525 (5)).
import { createSoundPlayer } from '../../platform/sound/player';

export const bad = createSoundPlayer;
