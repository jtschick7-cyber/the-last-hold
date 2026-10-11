// Plan T0.3: every lint guard-rail must fail on a fixture that breaks it.
// Fixtures are linted as if they lived at `as` (the rules are path-scoped).
import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: new URL('../..', import.meta.url).pathname });

const lint = async (fixture: string, as: string): Promise<string[]> => {
  const code = readFileSync(new URL(`./fixtures/${fixture}`, import.meta.url), 'utf8');
  const [result] = await eslint.lintText(code, { filePath: as });
  return (result?.messages ?? []).map((m) => m.ruleId ?? `fatal: ${m.message}`);
};

const CORE = 'src/core/state/fixture.ts';
const SYSTEMS = 'src/core/systems/fixture.ts';

const portableMathBans = [
  'exp',
  'expm1',
  'log',
  'log1p',
  'log2',
  'log10',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'sinh',
  'cosh',
  'tanh',
  'cbrt',
  'hypot',
  'fround',
];

const cases: [fixture: string, as: string, rule: string][] = [
  // Layer rules (technical design §4.2)
  ['core-imports-ui.ts', CORE, '@typescript-eslint/no-restricted-imports'],
  ['core-imports-platform.ts', CORE, '@typescript-eslint/no-restricted-imports'],
  [
    'content-imports-core-value.ts',
    'src/content/fixture.ts',
    '@typescript-eslint/no-restricted-imports',
  ],
  ['platform-imports-ui.ts', 'src/platform/fixture.ts', '@typescript-eslint/no-restricted-imports'],
  ['sim-imports-platform.ts', 'sim/fixture.ts', '@typescript-eslint/no-restricted-imports'],
  // Clock, randomness, and browser globals (technical design §4.2)
  ['core-math-random.ts', CORE, 'no-restricted-properties'],
  ['core-math-random-destructured.ts', CORE, 'no-restricted-properties'],
  ['core-date-now.ts', CORE, 'no-restricted-globals'],
  ['core-new-date.ts', CORE, 'no-restricted-globals'],
  ['core-performance-now.ts', CORE, 'no-restricted-globals'],
  ['core-crypto.ts', CORE, 'no-restricted-globals'],
  ['core-window.ts', CORE, 'no-restricted-globals'],
  ['core-local-storage.ts', CORE, 'no-restricted-globals'],
  ['core-global-this.ts', CORE, 'no-restricted-globals'],
  // Portable math (technical design §7.4)
  ['core-math-pow.ts', CORE, 'no-restricted-properties'],
  ['core-exponent-operator.ts', CORE, 'no-restricted-syntax'],
  ['core-exponent-assign.ts', CORE, 'no-restricted-syntax'],
  ...portableMathBans.map((fn): [string, string, string] => [
    `core-math-${fn}.ts`,
    CORE,
    'no-restricted-properties',
  ]),
  // Numeric game constants (technical design §5.1)
  ['systems-magic-number.ts', SYSTEMS, 'local/no-game-constants'],
  ['systems-magic-number-const.ts', SYSTEMS, 'local/no-game-constants'],
  // Named exports only, everywhere
  ['default-export.ts', 'src/ui/fixture.ts', 'no-restricted-syntax'],
  ['default-export.ts', CORE, 'no-restricted-syntax'],
  ['default-export-specifier.ts', 'src/platform/fixture.ts', 'no-restricted-syntax'],
];

describe('lint guard-rails', () => {
  it.each(cases)('%s (as %s) fails with %s', async (fixture, as, rule) => {
    expect(await lint(fixture, as)).toContain(rule);
  });

  // The rules must not over-fire, or they'd get switched off in frustration.
  it.each([
    ['core-clean.ts', CORE],
    ['core-clean.ts', SYSTEMS],
    ['systems-allowed-literals.ts', SYSTEMS],
    ['content-imports-core-type.ts', 'src/content/fixture.ts'],
    ['core-math-pow.ts', 'src/core/math/fixture.test.ts'],
    ['systems-magic-number.ts', 'src/core/systems/fixture.test.ts'],
    ['systems-magic-number.ts', 'src/core/state/fixture.ts'],
    ['core-date-now.ts', 'src/platform/fixture.ts'],
  ])('%s (as %s) passes', async (fixture, as) => {
    expect(await lint(fixture, as)).toEqual([]);
  });
});
