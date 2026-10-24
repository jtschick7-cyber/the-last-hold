// CLAUDE.md (v1.3 rule 1), D548 (4), technical design §21: Rising Vigil level 0 takes the old stand
// path, so nothing outside the stand code reads `state.vigil`, and nothing in src/ui computes the
// vigil factors. The check is on property reads and imports, not the word: the ending id 'vigil'
// (Keep the Vigil), the text key `open.vigil` and the balance group `vigil` exist elsewhere, so the check
// looks for the state's block: a `.vigil` read off a state-like name, or `.vigil.on` / `.vigil.stands`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
  });

/** Files that may read or write the `vigil` block of the state. */
const READERS = [
  'src/core/state/game-state.ts',
  'src/core/state/new-game.ts',
  'src/core/state/vigil-state.ts',
  'src/core/save/validate.ts',
  'src/core/save/validate-vigil.ts',
  'src/core/save/migration-v13.ts',
  'src/core/systems/vigil.ts',
  'src/core/commands/vigil.ts',
  'src/core/commands/stand.ts',
];

export const stateReadOffenders = (files: { path: string; text: string }[]): string[] =>
  files
    .filter((f) => !READERS.includes(f.path) && !f.path.startsWith('tests/'))
    .filter((f) =>
      /\b(?:state|s|st|game|slice|stateSlice|draft)\.vigil\b|\.vigil\.(?:on|stands)\b|\{[^}]*\bvigil\b[^}]*\}\s*=\s*(?:state|s)\b/.test(
        f.text.replace(/\/\/.*$/gm, ''),
      ),
    )
    .map((f) => f.path);

export const factorImportOffenders = (files: { path: string; text: string }[]): string[] =>
  files
    .filter((f) => f.path.startsWith('src/ui/'))
    .filter((f) => /\b(waveFactor|embersMultiplier)\b/.test(f.text))
    .map((f) => f.path);

const sources = ['src', 'sim', 'tools']
  .flatMap((d) => walk(join(root, d)))
  .map((p) => ({ path: relative(root, p), text: readFileSync(p, 'utf8') }));

describe('Rising Vigil is stand code only', () => {
  it('nothing outside the stand code reads or writes state.vigil', () => {
    expect(stateReadOffenders(sources)).toEqual([]);
  });

  it('nothing in src/ui computes the vigil factors', () => {
    expect(factorImportOffenders(sources)).toEqual([]);
  });

  it('a planted read of state.vigil from src/ui fails the check', () => {
    const planted = [{ path: 'src/ui/hold/Planted.tsx', text: 'const on = state.vigil.on;' }];
    expect(stateReadOffenders(planted)).toEqual(['src/ui/hold/Planted.tsx']);
    expect(
      factorImportOffenders([
        {
          path: 'src/ui/hold/P.tsx',
          text: "import { waveFactor } from '../../core/systems/vigil';",
        },
      ]),
    ).toEqual(['src/ui/hold/P.tsx']);
  });

  it('does not fire on the ending id or on names that merely start with vigil', () => {
    const fine = [
      { path: 'src/core/story/remembering.ts', text: "ending === 'vigil' && vigilScene.title" },
    ];
    expect(stateReadOffenders(fine)).toEqual([]);
  });
});
