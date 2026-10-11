/// <reference types="vite/client" />

// Injected by vite.config.ts (and vitest.config.ts for tests).
declare const __BUILD_INFO__: {
  channel: 'live' | 'preview';
  version: string;
  commit: string;
  branch: string;
  builtAt: string;
};
