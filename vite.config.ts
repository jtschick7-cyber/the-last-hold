import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Technical design §11.3: the build channel decides the base path, the PWA's
// name and scope, and (in src/platform/storage.ts) the storage namespace.
type Channel = 'live' | 'preview';

const channel: Channel = process.env.LH_CHANNEL === 'preview' ? 'preview' : 'live';
const base = channel === 'preview' ? '/the-last-hold/preview/' : '/the-last-hold/';

const git = (args: string, fallback: string): string => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
};

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

const build = {
  channel,
  version: pkg.version,
  commit: process.env.LH_COMMIT ?? git('rev-parse --short HEAD', 'unknown'),
  branch: process.env.LH_BRANCH ?? git('rev-parse --abbrev-ref HEAD', 'unknown'),
  builtAt: new Date().toISOString(),
};

const appName = channel === 'preview' ? 'The Last Hold (Preview)' : 'The Last Hold';

export default defineConfig({
  base,
  define: {
    __BUILD_INFO__: JSON.stringify(build),
  },
  plugins: [
    preact(),
    {
      // iPhone uses the page title for the Home Screen name, so each channel
      // needs its own (plan v0.0 acceptance 3).
      name: 'channel-app-name',
      transformIndexHtml: (html: string) => html.replaceAll('%APP_NAME%', appName),
    },
    VitePWA({
      // We register the service worker ourselves (src/platform/service-worker.ts)
      // so the update banner never reloads on its own (technical design §11.1).
      injectRegister: false,
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        id: base,
        name: appName,
        short_name: channel === 'preview' ? 'Hold (Preview)' : 'The Last Hold',
        description: 'Rebuild a ruined frontier fortress and hold it through the night.',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#16120f',
        theme_color: '#16120f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        // The live app must never serve or cache preview pages (technical design §11.3).
        navigateFallbackDenylist: channel === 'live' ? [/\/preview\//] : [],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
      },
    }),
  ],
});
