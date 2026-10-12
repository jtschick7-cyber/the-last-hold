// ESLint guard-rails (technical design §4.2, §5.1, §7.4; CLAUDE.md "Hard rules").
// tests/lint/guard-rails.test.ts proves each rule fires on a breaking fixture.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { noGameConstants } from './eslint-rules/no-game-constants.js';

const local = { rules: { 'no-game-constants': noGameConstants } };

const layer = (paths, message) => ({
  patterns: paths.map((p) => ({ group: [`**/${p}`, `**/${p}/**`], message })),
});

// Technical design §4.2 and §7.4: core/ never touches the clock, randomness,
// browser globals, or engine-dependent math.
const coreBannedGlobals = [
  ['window', 'core/ is pure: no browser globals.'],
  ['document', 'core/ is pure: no browser globals.'],
  ['localStorage', 'core/ is pure: storage lives in platform/.'],
  ['sessionStorage', 'core/ is pure: storage lives in platform/.'],
  ['indexedDB', 'core/ is pure: storage lives in platform/.'],
  ['navigator', 'core/ is pure: no browser globals.'],
  ['location', 'core/ is pure: no browser globals.'],
  ['self', 'core/ is pure: no browser globals.'],
  ['globalThis', 'core/ is pure: no global object access.'],
  ['fetch', 'core/ is pure: no I/O.'],
  ['setTimeout', 'core/ is pure: time passes only through advance().'],
  ['setInterval', 'core/ is pure: time passes only through advance().'],
  ['requestAnimationFrame', 'core/ is pure: time passes only through advance().'],
  ['Date', 'core/ never reads the clock (Date.now, new Date). Time arrives as a parameter.'],
  ['performance', 'core/ never reads the clock (performance.now). Time arrives as a parameter.'],
  ['crypto', 'core/ never uses crypto randomness. Use core/rng.'],
].map(([name, message]) => ({ name, message }));

const mathMessage = (fn, why) => ({ object: 'Math', property: fn, message: why });
const notPortable = 'Not exactly specified across engines (technical design §7.4). Use core/math.';
const coreBannedMath = [
  mathMessage('random', 'core/ never uses Math.random. Use core/rng.'),
  mathMessage('pow', 'Use intPow from core/math (technical design §7.4).'),
  ...[
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
    'asinh',
    'acosh',
    'atanh',
    'cbrt',
    'hypot',
    'fround',
  ].map((fn) => mathMessage(fn, notPortable)),
];

const namedExportsOnly = [
  { selector: 'ExportDefaultDeclaration', message: 'Named exports only (CLAUDE.md "Style").' },
  {
    selector: 'ExportSpecifier[exported.name="default"]',
    message: 'Named exports only (CLAUDE.md "Style").',
  },
];

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'dist-preview/',
      'coverage/',
      'dev-dist/',
      'node_modules/',
      'sim/reports/',
      'tests/lint/fixtures/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { local },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': ['error', ...namedExportsOnly],
    },
  },
  // Tooling config files must default-export by their tools' convention.
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  // ---- Layer rules (technical design §4.2) ----
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        layer(
          ['ui', 'platform'],
          'core/ must not import ui/ or platform/ (technical design §4.2).',
        ),
      ],
      'no-restricted-globals': ['error', ...coreBannedGlobals],
      'no-restricted-properties': ['error', ...coreBannedMath],
      'no-restricted-syntax': [
        'error',
        ...namedExportsOnly,
        {
          selector: 'BinaryExpression[operator="**"]',
          message: 'Use intPow from core/math (technical design §7.4).',
        },
        {
          selector: 'AssignmentExpression[operator="**="]',
          message: 'Use intPow from core/math (technical design §7.4).',
        },
      ],
    },
  },
  // Tests next to core code compare against Math.pow / Math.log on purpose
  // (plan T1.2: reference values are computed in the tests only).
  {
    files: ['src/core/**/*.test.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['src/core/systems/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts'],
    rules: { 'local/no-game-constants': 'error' },
  },
  {
    files: ['src/content/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/core', '**/core/**'],
              allowTypeImports: true,
              message: 'content/ may import only types from core/ (technical design §4.2).',
            },
            ...layer(['ui', 'platform'], 'content/ is data only (technical design §4.2).').patterns,
          ],
        },
      ],
    },
  },
  {
    files: ['src/platform/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        layer(['ui'], 'platform/ must not import ui/ (technical design §4.1).'),
      ],
    },
  },
  {
    files: ['sim/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        layer(['ui', 'platform'], 'sim/ uses only core/ and content/ (technical design §4.2).'),
      ],
    },
  },
);
