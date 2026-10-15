// lore-secrets §29 (D266): the way down. The first time any warden reaches the Keep, a scene
// sheet kept in the Library: a crack in the Hearth Hall floor behind Pechko's stove. The
// scene is approved word for word; the result-sheet lines are Proposed drafts the owner
// approves or edits with the sprites (T7.3). Delves never carry plot.

export const riftScene: readonly string[] = [
  "There's a crack in the Hearth Hall floor behind the stove that wasn't there yesterday, or that nobody wanted to see. Cold comes up through it. Pechko stands on the edge of it with a broom.",
  `"It opened the night the sky went out. It goes down a long way and it remembers things. Take three, come back before supper, and don't bring anything up you didn't take down."`,
];

/** Shown on the Rift card and the result sheet when the allowance is empty (D258). */
export const RIFT_QUIET_LINE = 'The rift is quiet tonight';

/** One line after each run, picked by the run's seed (lore §29 section 5). Proposed drafts. */
export const pechkoResultLines = {
  guardianBeaten: [
    'Back before supper. Wipe your boots.',
    "Whatever it was, it's quieter now. Sit.",
    'You smell of cold. Stand by the stove a while.',
  ],
  endedEarly: [
    "Came back up. That's the part that counts.",
    "The crack'll still be there tomorrow. So will you. Good.",
    'Bruised pride mends faster than shins. Eat.',
  ],
  quietTonight: [
    "Nothing on the edges tonight. The cold's resting. So should you.",
    "No glass tonight. Go anyway, if you like; I'll keep the soup on.",
    "Quiet down there. I don't trust quiet, but I'll take it.",
  ],
} as const;
