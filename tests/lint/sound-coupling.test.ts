// D525 (5), technical design §20.3: nothing in src/core/ imports or reads the sound module or the
// `sound` setting (`rulesVersion` stays 5, save schema stays 12).
// v1.7 (D609, D611, technical design §24.3): the same holds for the procedural ambience module, the
// `ambience` setting and its test hook.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../../src/core');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });

describe('sound is UI-only', () => {
  it('no core file mentions the sound module, the setting or the test hook', () => {
    const offenders = walk(root)
      .filter((p) =>
        /platform\/sound|app-settings|SoundSetting|__lastholdSound|sound-text/.test(
          readFileSync(p, 'utf8'),
        ),
      )
      .map((p) => relative(root, p));
    expect(offenders).toEqual([]);
  });

  it('the save state has no sound field', () => {
    const state = readFileSync(join(root, 'state/game-state.ts'), 'utf8');
    expect(state).not.toMatch(/\bsound\b/i);
  });
});

describe('ambience is UI-only (D611)', () => {
  it('no core file mentions ambience, its module, its setting or its test hook', () => {
    const offenders = walk(root)
      .filter((p) =>
        /ambience|platform\/sound\/ambience|AmbienceSetting|__lastholdAmbience/i.test(
          readFileSync(p, 'utf8'),
        ),
      )
      .map((p) => relative(root, p));
    expect(offenders).toEqual([]);
  });

  it('the save state has no ambience field', () => {
    const state = readFileSync(join(root, 'state/game-state.ts'), 'utf8');
    expect(state).not.toMatch(/ambience/i);
  });
});
