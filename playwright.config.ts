import { defineConfig, devices } from '@playwright/test';

// Technical design §14 (plan T1.38): the phone smoke test on the production
// build, and the determinism scenario in Chromium and WebKit. The production
// build is served by `vite preview`; the scenario page by the dev server,
// so it never ships.
const PREVIEW = 'http://localhost:4173/the-last-hold/';
const DEV = 'http://localhost:5174/the-last-hold/';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'list' : 'line',
  use: { baseURL: PREVIEW, trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm run build && npx vite preview --port 4173 --strictPort',
      url: PREVIEW,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: DEV,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  projects: [
    { name: 'phone-chromium', use: { ...devices['Pixel 7'] }, testIgnore: /bench\.spec\.ts/ },
    // The benchmark needs Chromium's CPU throttling (CDP), so it runs there only.
    { name: 'bench', use: { ...devices['Desktop Chrome'] }, testMatch: /bench\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['iPhone 13'] }, testMatch: /determinism\.spec\.ts/ },
  ],
});
