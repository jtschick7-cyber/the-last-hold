// GDD §9.23 (D551): the nine player-facing strings of Rising Vigil, word for word, and nothing else.
// `{n}` is filled with a count. The Embers breakdown line ("Rising Vigil: +{y}% on the waves part")
// is built in core/systems/vigil.ts, next to the number it explains, and the Roll of Wardens line
// comes with KV.7; both are checked against the GDD table by tests/content/vigil-text.test.ts.
export const VIGIL_LABEL = 'Rising Vigil';
export const VIGIL_BUTTONS = { on: 'On', off: 'Off' } as const;
export const VIGIL_HELP =
  'On: every wave is stronger, one step more for each stand you make with it on, and the Embers rise to make up for it. Off: an ordinary stand. Your level is kept.';
export const VIGIL_STATUS_ON = 'This stand: vigil level {n}';
export const VIGIL_STATUS_OFF = 'Next level when on: {n}';
export const VIGIL_CONFIRM = 'Rising Vigil is on at level {n}.';
export const VIGIL_RESULT = 'Fought with Rising Vigil at level {n}.';
export const VIGIL_ROLL = 'Rising Vigil, level {n}.';

/** Puts a count into one of the templates above. */
export const vigilLine = (template: string, n: number): string =>
  template.replace('{n}', String(n));
