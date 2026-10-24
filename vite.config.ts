import { execSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { candidateAudioFile, renderAuditionPage } from './tools/audition-page';
import { packPng } from './tools/png-pack';
import { parseSoundMarks } from './tools/sound-marks';

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

// D489 (5): the preview build's icons carry a visible corner mark. They are copied over the live
// icons after the bundle is written and before the service worker is built, so the precache and the
// manifest see the marked files and the live bundle never contains them.
const previewIcons = {
  name: 'preview-icons',
  apply: 'build' as const,
  writeBundle(options: { dir?: string }): void {
    if (channel !== 'preview' || !options.dir) return;
    const from = new URL('./art-src/icons-preview/', import.meta.url);
    for (const f of readdirSync(from))
      copyFileSync(new URL(f, from), new URL(`icons/${f}`, new URL(`file://${options.dir}/`)));
  },
};

// D524 (2): the sound audition page and its converted candidates ship in the preview channel only.
// They are written after the bundle and before the service worker is built; the live channel never
// runs this and never contains them (a test checks the live build).
const auditionPage = {
  name: 'audition-page',
  apply: 'build' as const,
  writeBundle(options: { dir?: string }): void {
    if (channel !== 'preview' || !options.dir) return;
    const from = new URL('./art-src/audition/', import.meta.url);
    const to = new URL('audition/', new URL(`file://${options.dir}/`));
    mkdirSync(to, { recursive: true });
    const sizes: Record<number, number> = {};
    const marks = parseSoundMarks(
      readFileSync(new URL('./docs/flesh-out/v1.2/sound-marks.md', import.meta.url), 'utf8'),
    );
    for (const c of marks.candidates) {
      const file = candidateAudioFile(c.n);
      copyFileSync(new URL(file, from), new URL(file, to));
      sizes[c.n] = statSync(new URL(file, from)).size;
    }
    writeFileSync(
      new URL('audition.html', new URL(`file://${options.dir}/`)),
      renderAuditionPage(marks, sizes),
    );
  },
};

// D553 (1): every picture is re-packed as an indexed PNG after the bundle is written and before the
// service worker is built, so the precache sees the small files. Not one pixel changes (tools/png-pack.ts
// compares the result with the original and keeps the original otherwise); the files in `public/` and
// the recorded art hashes are untouched. The app icons are left as they are: the PWA plugin lists them
// with the hash of the original, and a packed copy would give a second, conflicting entry (Workbox then
// refuses to install and nothing works offline). The preview build is packed too, so it measures what ships.
const packPictures = {
  name: 'pack-pictures',
  apply: 'build' as const,
  writeBundle(options: { dir?: string }): void {
    if (!options.dir) return;
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? walk(`${dir}/${e.name}`)
          : e.name.endsWith('.png') && dir !== `${options.dir}/icons`
            ? [`${dir}/${e.name}`]
            : [],
      );
    for (const file of walk(options.dir)) {
      const packed = packPng(readFileSync(file));
      if (packed) writeFileSync(file, packed);
    }
  },
};

// D553 (2): the contact sheet is an art-review page for the owner, so it ships in the preview build
// only, like the sound audition page. The live download no longer carries it.
const contactSheetPreviewOnly = {
  name: 'contact-sheet-preview-only',
  apply: 'build' as const,
  writeBundle(options: { dir?: string }): void {
    if (channel === 'live' && options.dir)
      rmSync(`${options.dir}/contact-sheet.html`, { force: true });
  },
};

const appName = channel === 'preview' ? 'The Last Hold (Preview)' : 'The Last Hold';

export default defineConfig({
  base,
  define: {
    __BUILD_INFO__: JSON.stringify(build),
  },
  plugins: [
    preact(),
    previewIcons,
    auditionPage,
    contactSheetPreviewOnly,
    packPictures,
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
        background_color: '#302c2e',
        theme_color: '#302c2e',
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
        // SF.10: the seven sounds (assets/audio/*.mp3) are cached for offline play; the preview's
        // audition candidates are listening copies and are not (D524 (2)).
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,webmanifest,mp3}'],
        globIgnores: ['audition/**'],
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
