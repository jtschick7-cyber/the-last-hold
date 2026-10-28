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
} as const;
