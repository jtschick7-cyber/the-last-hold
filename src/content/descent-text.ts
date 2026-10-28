// GDD §9.24 (D568): the Descent's player-facing strings, word for word, and nothing else. `{x}` marks a
// number filled in by `descentLine`. The story cards D-01 to D-07 and the resident lines are in
// story/descent.ts (lore §34.11). Checked against the GDD table by tests/content/descent-text.test.ts.

export const DESCENT_STRINGS = {
  button: 'The Descent',
  again: 'Fight the Descent again',
  scattered: 'The Unlit was scattered in the Deep.',
  subtitle: 'Three stages in the Deep · all hands',
  stages: ['Stage 1: The Crack', 'Stage 2: The Sealed Stair', 'Stage 3: Below the Seal'],
  /** The monsters after each stage heading on the sheet: "Stage 1: The Crack — <these>". */
  stageMonsters: [
    "Unlit's Breath & The Forgotten",
    'The Dross-Tide, Anvil-wight & Rimewrought',
    'The Unlit',
  ],
  learnedSummary: 'What the hold learned: +{m}% Might and Health · −{t}% damage taken',
  learnedLines: {
    species: 'Mastered species (+{p}%): +{m}%',
    properties: 'Recipe book properties (+{p}%): +{m}%',
    skills: 'Warden skill levels (+{p}%): +{m}%',
    chapters: 'Order chapters read (+{p}%): +{m}%',
    relics: 'Owned relics (−{p}% taken): −{t}%',
  },
  activeRelics: 'Active Delve relics:',
  rows: {
    front: 'Front line (up to 6)',
    reserve: 'Reserve line (steps in as hunters fall)',
  },
  unavailable: 'Unavailable hunters',
  away: { contract: 'On a contract', delve: 'In a Delve' },
  bombs: 'Thrown automatically from stores (up to 2 per stage)',
  preview: {
    win: 'Win chance: {p}% ±{m}%',
    stage: 'Expected stage reached: Stage {s} · {d} hunters downed (likely {d1} to {d2})',
    victory:
      'Expected outcome: Victory (Stage 3 cleared) · {d} hunters downed (likely {d1} to {d2})',
    why: 'Why: based on 100 practice runs with your marching order and preparation.',
  },
  start: 'Start the Descent',
  logs: ['Stage 1 log', 'Stage 2 log', 'Stage 3 log'],
  result: {
    win: 'Victory — The Unlit is scattered.',
    loss: 'Driven back at Stage {s}.',
    summary: 'Hunters standing: {a} · Fallen on the stair: {d}',
  },
  roll: 'Led the Descent.',
} as const;

/** GDD §9.24 (S9, in the playback text, not the string table): the card's button after a playback was closed early. */
export const DESCENT_VIEW_RESULT = 'View Descent result';

/** The sheet's heading for a stage: its name, a dash, and its monsters (GDD §9.24). */
export const descentStageLine = (stage: 1 | 2 | 3): string =>
  `${DESCENT_STRINGS.stages[stage - 1]} — ${DESCENT_STRINGS.stageMonsters[stage - 1]}`;

/** Puts numbers into one of the templates above: `descentLine(DESCENT_STRINGS.result.loss, { s: 2 })`. */
export const descentLine = (template: string, values: Readonly<Record<string, number>>): string =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const v = values[key];
    return v === undefined ? whole : String(v);
  });

/** A fraction as the percent the strings print: whole numbers stay whole; every rate is a multiple of 0.25%, so two decimals are exact. */
export const descentPercent = (x: number): number => Math.round(x * 10000) / 100;
