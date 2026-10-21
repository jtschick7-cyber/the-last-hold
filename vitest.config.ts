import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __BUILD_INFO__: JSON.stringify({
      channel: 'live',
      version: '0.0.0-test',
      commit: 'test',
      branch: 'test',
      builtAt: '1970-01-01T00:00:00.000Z',
    }),
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts', 'sim/**/*.test.ts'],
    environment: 'node',
    // The suite is pure and deterministic (no test leaves state behind), so files share their module
    // cache: about a third faster, which keeps `npm run check` inside its 90 s budget on CI.
    isolate: false,
  },
});
