import { expect, test } from '@playwright/test';
import { audio } from '../../src/content/audio';

// Plan SF.10: every shipped sound decodes to a non-empty buffer in the browser. Chromium only: the
// WebKit project here runs the determinism scenario, and iPhone playback is the owner's check (Q55).
test('every shipped sound decodes to a non-empty buffer', async ({ page }) => {
  await page.goto('./');
  const base = `${new URL('./', page.url()).pathname}assets/`;
  const decoded = await page.evaluate(
    async ([root, files]) => {
      const ctx = new OfflineAudioContext(1, 44100, 44100);
      const out: Record<string, { length: number; channels: number }> = {};
      for (const f of files as string[]) {
        const bytes = await (await fetch(`${root}${f}`)).arrayBuffer();
        const buf = await ctx.decodeAudioData(bytes);
        out[f] = { length: buf.length, channels: buf.numberOfChannels };
      }
      return out;
    },
    [base, audio.map((a) => a.file)] as const,
  );
  for (const a of audio) {
    expect(decoded[a.file]?.length, a.id).toBeGreaterThan(0);
    expect(decoded[a.file]?.channels, a.id).toBe(1);
  }
});
