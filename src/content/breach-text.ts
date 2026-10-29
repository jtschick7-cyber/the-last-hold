// GDD §9.25 (v1.5, D593): the Breach's player-facing strings that the core's breakdown lines use,
// word for word. {p} is a whole percent, {x} a column number 1 to 8, {t} and {v} whole numbers.
// The rest of the table (strip, list, buttons, Start line, log header) is added by TB.8a to TB.9.
// Nothing else may be invented; a screen that needs a string asks the owner.
export const BREACH_TEXT = {
  lane: (n: number | string) => `Lane ${n}`,
  ownColumn: (p: number | string) => `Own column: +${p}%`,
  westNeighbour: (p: number | string) => `West neighbour: +${p}%`,
  eastNeighbour: (p: number | string) => `East neighbour: +${p}%`,
  ruinedEdge: (p: number | string) => `Ruined edge counts as wall: +${p}%`,
  cover: (p: number | string) => `Cover: ${p}%`,
  stacked: (p: number | string) => `Stacked pieces: +${p}% on the wall cut`,
  walls: (t: number | string) => `Walls: −${t}% damage taken in this lane`,
  tower: (x: number | string, p: number | string) => `Tower in column ${x}: ${p}% of its share`,
  volley: (v: number | string) => `Watchtower volley in this lane: ${v}`,
  /** Heading of the Lanes strip and of the text list. */
  lanes: 'Lanes',
  /** Line in each strip box. */
  coverBox: (p: number | string) => `${p}% cover`,
  strip: 'Strip',
  list: 'List',
  hint: 'Tap a lane to see what covers it.',
  /** One line per lane in the text list; {w} is `wavesText`. */
  listLine: (n: number | string, p: number | string, r: number | string, w: string) =>
    `Lane ${n}: cover ${p}%, tower reach ${r}%, waves ${w}`,
  /** Help line under the Lanes strip. */
  help: 'Only walls and towers in the three rows nearest the Fell Breach count.',
  /** Empty state, when no piece counts. */
  empty: 'No walls or towers on the front rows yet. Only the ruined edge gives cover.',
  /** Button on the Arrange Hold sheet (from Bastion on, never disabled). */
  suggest: 'Suggest layout',
  /** Line under the suggested layout, from the preview. */
  suggested: (n: number | string, m: number | string) =>
    `Suggested: about ${n} waves (now about ${m}).`,
  /** Button; exists because the owner answered Q61 yes. */
  useThis: 'Use this layout',
  /** Button under the Lanes strip on the Last Stand screen; opens the Arrange Hold sheet. */
  arrangeHold: 'Arrange Hold',
  /** The header line of a stand wave log (new stands only). */
  logHeader: (n: number | string, p: number | string) => `Lane ${n} · cover ${p}%`,
} as const;

/** The forms {w} takes: the waves that come down a lane, *and* before the last, or `none in the first {k}`. */
export const wavesText = (waves: readonly number[], k: number | string): string => {
  if (waves.length === 0) return `none in the first ${k}`;
  if (waves.length === 1) return `${waves[0]}`;
  return `${waves.slice(0, -1).join(', ')} and ${waves[waves.length - 1]}`;
};
