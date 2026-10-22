// v1.0 (plan TV.2, D482): app-icon candidates beside the current one, drawn in code on a 16×16 grid in
// the Zughy 32 palette (D58). Only the contact sheet uses them until the owner picks one (TV.10).
export const CURRENT_ICON = [
  '................',
  '................',
  '...#..#..#..#...',
  '...##########...',
  '....########....',
  '....########....',
  '....###oo###....',
  '....###oo###....',
  '....########....',
  '....########....',
  '....########....',
  '....###..###....',
  '....###..###....',
  '..############..',
  '................',
  '................',
] as const;

const GATE = [
  '................',
  '................',
  '..#.#.#..#.#.#..',
  '..############..',
  '..############..',
  '..####dddd####..',
  '..###dyyyyd###..',
  '..##dyyooyyd##..',
  '..##dyooooyd##..',
  '..##dooooood##..',
  '..##dooooood##..',
  '..##dooooood##..',
  '..############..',
  '..############..',
  '................',
  '................',
] as const;

const HEARTH = [
  '................',
  '................',
  '.......oo.......',
  '......oooo......',
  '.....ooyyoo.....',
  '.....oyyyyo.....',
  '....ooyyyyoo....',
  '....ooyyyyoo....',
  '.....ooyyoo.....',
  '..dddddddddddd..',
  '...##########...',
  '....########....',
  '.....######.....',
  '.....######.....',
  '....########....',
  '................',
] as const;

const BELL = [
  '................',
  '................',
  '................',
  '.......rr.......',
  '......rrrr......',
  '.....rrrrrr.....',
  '....rrrrrrrr....',
  '....##yyyy##....',
  '....#yyyyyy#....',
  '....#yyyyyy#....',
  '....##oooo##....',
  '....########....',
  '....########....',
  '...##########...',
  '...##########...',
  '................',
] as const;

export const ICON_COLORS: Record<string, string> = {
  '.': '#302c2e',
  '#': '#a0938e',
  d: '#5a5353',
  o: '#f47e1b',
  y: '#f4b41b',
  r: '#7a444a',
};

export const iconCandidates: readonly {
  readonly name: string;
  readonly grid: readonly string[];
}[] = [
  { name: 'Current: the tower', grid: CURRENT_ICON },
  { name: 'A: the lit gate', grid: GATE },
  { name: 'B: the hearth flame', grid: HEARTH },
  { name: 'C: the bell tower', grid: BELL },
];
