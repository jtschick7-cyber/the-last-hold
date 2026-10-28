// CLAUDE.md (v1.4 rule), D561, D566 (5), technical design §22.8: the Descent runs on its own isolated
// path. Nothing outside it reads `state.descent` (so contracts, Delves, events and the Last Stand never
// do), and nothing in src/ui computes What the Hold Learned. Like the vigil check, this looks at
// property reads and imports: the ending id 'descent' and the balance group `descent` exist elsewhere.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
  });

/** Files that may read or write the `descent` block of the state. The UI's files join this list with TD.7. */
const READERS = [
  'src/core/state/game-state.ts',
  'src/core/state/new-game.ts',
  'src/core/state/descent-state.ts',
  'src/core/save/validate.ts',
  'src/core/save/validate-descent.ts',
  'src/core/save/migration-v14.ts',
  'src/core/commands/descent.ts',
  'src/core/commands/debug-descent.ts',
  'src/core/systems/descent-record.ts',
  'src/core/systems/descent-playback.ts',
  'src/core/long-night/reset.ts',
];

type File = { path: string; text: string };

export const stateReadOffenders = (files: File[]): string[] =>
  files
    .filter((f) => !READERS.includes(f.path) && !f.path.startsWith('tests/'))
    .filter((f) =>
      /\b(?:state|s|st|game|slice|stateSlice|draft)\.descent\b|\.descent\.(?:attempts|last|firstWin|unlitMet|unreadResult)\b/.test(
        f.text.replace(/\/\/.*$/gm, ''),
      ),
    )
    .map((f) => f.path);

export const learnedImportOffenders = (files: File[]): string[] =>
  files
    .filter((f) => f.path.startsWith('src/ui/'))
    .filter((f) => /\b(learnedBonus|runDescent|descentInputFor)\b/.test(f.text))
    .map((f) => f.path);

const sources: File[] = ['src', 'sim', 'tools']
  .flatMap((d) => walk(join(root, d)))
  .map((p) => ({ path: relative(root, p), text: readFileSync(p, 'utf8') }));

describe('the Descent is its own path', () => {
  it('nothing outside the Descent reads or writes state.descent', () => {
    expect(stateReadOffenders(sources)).toEqual([]);
  });

  it('nothing in src/ui computes the learned bonus or runs the fight', () => {
    expect(learnedImportOffenders(sources)).toEqual([]);
  });

  it('a planted read from contracts, a Delve, events or the stand fails the check', () => {
    for (const path of [
      'src/core/contracts/complete.ts',
      'src/core/delves/run.ts',
      'src/core/systems/events.ts',
      'src/core/stand/engine.ts',
      'src/ui/hold/Planted.tsx',
    ])
      expect(stateReadOffenders([{ path, text: 'const n = state.descent.attempts;' }])).toEqual([
        path,
      ]);
  });

  it('a planted learnedBonus in src/ui fails the check', () => {
    const planted = [
      {
        path: 'src/ui/hold/P.tsx',
        text: "import { learnedBonus } from '../../core/systems/descent';",
      },
    ];
    expect(learnedImportOffenders(planted)).toEqual(['src/ui/hold/P.tsx']);
  });

  it('does not fire on the ending id or the balance group', () => {
    const fine = [
      {
        path: 'src/core/story/remembering.ts',
        text: "ending === 'descent' && balance.descent.previewSamples",
      },
    ];
    expect(stateReadOffenders(fine)).toEqual([]);
  });
});
