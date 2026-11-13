// GDD §9.22 (D521): the only player-facing words for sound, word for word. The debug panel's labels
// are exempt and live with the debug panel.
export const SOUND_LABEL = 'Sound';
export const SOUND_BUTTONS = { on: 'On', off: 'Off' } as const;
export const SOUND_HELP =
  "Short sounds for wins, rank-ups and the Long Night. Your phone's silent switch still mutes them.";

// GDD §9.22 (D609, D610): the Ambience row, word for word. It shares the [On] [Off] buttons with Sound.
export const SETTING_AMBIENCE_LABEL = 'Ambience';
export const SETTING_AMBIENCE_HELP =
  "Quiet hearth fire and frontier wind while the hold is open. Silent during the Remembering, and muted by your phone's silent switch.";
export const SETTING_AMBIENCE_ON = SOUND_BUTTONS.on;
export const SETTING_AMBIENCE_OFF = SOUND_BUTTONS.off;
