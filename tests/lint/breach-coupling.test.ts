// CLAUDE.md (v1.5 rule 1), technical design §19.1 and §23.2 (D586, D593 (c)): only the Breach module
// (with the layout modules and the UI) may read `state.layout`; the stand fight, combat, economy,
// contracts and advance code never do; nothing in src/ui computes cover, depth or volley; and each
// `breach.*` key is read in exactly one file under src/core.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
const read = (dir: string, skipTests = true) =>
  walk(join(root, dir))
    .filter((p) => !(skipTests && /\.test\.tsx?$/.test(p)))
    .map((p) => ({ path: relative(root, p), text: readFileSync(p, 'utf8') }));

/** The core files the layout test (S11) allows to mention the layout, plus the Breach module. */
const READERS = new Set([
  'src/core/systems/breach.ts',
  'src/core/commands/apply.ts',
  'src/core/commands/debug-layout.ts',
  'src/core/commands/layout.ts',
  'src/core/commands/types.ts',
  'src/core/long-night/reset.ts',
  'src/core/save/migration-v12.ts',
  'src/core/save/validate-layout.ts',
  'src/core/save/validate.ts',
  'src/core/state/game-state.ts',
  'src/core/state/layout-state.ts',
  'src/core/state/new-game.ts',
  'src/core/systems/layout-catalog.ts',
  'src/core/systems/layout-place.ts',
  'src/core/systems/layout.ts',
]);
/** The modules of the five that must never read the layout (technical design §19.1): economy, combat, the stand fight, contracts and advance. */
const BANNED = [
  'src/core/systems/production.ts',
  'src/core/combat/fight.ts',
  'src/core/stand/engine.ts',
  'src/core/commands/contracts.ts',
  'src/core/sim/advance.ts',
];

export const layoutReadOffenders = (files: { path: string; text: string }[]): string[] =>
  files
    .filter((f) => !READERS.has(f.path))
    .filter((f) =>
      /\blayout\b|hold-layout|layout-state|layout-catalog|state\.layout/i.test(
        f.text.replace(/\/\/.*$/gm, ''),
      ),
    )
    .map((f) => f.path);

/** Names a UI file must not take from the Breach module (it takes `laneView` and types only). */
const FORMULAS = ['cover', 'extra', 'wallCut', 'volley', 'laneTableFor', 'countedPieces', 'laneOf'];
export const uiFormulaOffenders = (files: { path: string; text: string }[]): string[] =>
  files
    .filter((f) => f.path.startsWith('src/ui/'))
    .filter((f) => {
      const m = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*'[^']*systems\/breach'/g;
      for (const x of f.text.matchAll(m))
        if (
          (x[1] ?? '')
            .split(',')
            .map((s) => s.trim().replace(/^type\s+/, ''))
            .some((n) => FORMULAS.includes(n))
        )
          return true;
      return false;
    })
    .map((f) => f.path);

const core = read('src/core');

describe('the layout is read only by the Breach module, the layout modules and the UI', () => {
  it('no other core file reads it', () => {
    expect(layoutReadOffenders(core)).toEqual([]);
  });

  it.each(BANNED)('a planted read from %s fails the check', (path) => {
    const planted = [{ path, text: 'const l = state.layout.placed;' }];
    expect(layoutReadOffenders(planted)).toEqual([path]);
  });

  it('the banned modules exist, so the check is about real files', () => {
    for (const p of BANNED) expect(() => statSync(join(root, p)), p).not.toThrow();
  });

  it('the allowed list has no stale entry', () => {
    for (const p of READERS) expect(() => statSync(join(root, p)), p).not.toThrow();
  });
});

describe('the UI takes lane numbers from laneView and computes none', () => {
  it('no UI file imports a Breach formula', () => {
    expect(uiFormulaOffenders(read('src/ui'))).toEqual([]);
  });

  it('a planted import of cover or volley fails the check; laneView and types are fine', () => {
    const bad = (names: string) => [
      {
        path: 'src/ui/sheets/P.tsx',
        text: `import { ${names} } from '../../core/systems/breach';`,
      },
    ];
    expect(uiFormulaOffenders(bad('laneView, cover'))).toEqual(['src/ui/sheets/P.tsx']);
    expect(uiFormulaOffenders(bad('volley'))).toEqual(['src/ui/sheets/P.tsx']);
    expect(uiFormulaOffenders(bad('laneView, type LaneView'))).toEqual([]);
  });
});

describe('each breach.* key is read in one file under src/core', () => {
  const KEYS = [
    'coverOwn',
    'coverNeighbour',
    'depthStep',
    'depthMax',
    'towerReach',
    'volleyScale',
    'suggestWaves',
    'lanes',
    'frontRows',
  ];
  it.each(KEYS)('breach.%s', (key) => {
    const readers = core
      .filter((f) =>
        new RegExp(`['"\`]breach\\.${key}['"\`]|\\bbalance\\.breach\\.${key}\\b`).test(
          f.text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''),
        ),
      )
      .map((f) => f.path);
    expect(readers).toEqual(['src/core/systems/breach.ts']);
  });
});
