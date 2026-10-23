// D525 (4), D523: the audio list, its files, its credits and the size cap.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AUDIO_BYTES_CAP, AUDIO_IDS, audio } from '../../src/content/audio';
import { SOUND_IDS } from '../../src/platform/sound/moments';

const DIR = fileURLToPath(new URL('../../public/assets/audio/', import.meta.url));
const ASSETS = fileURLToPath(new URL('../../public/assets/', import.meta.url));

describe('audio list', () => {
  it('has one row per sound id, the same ids the sound module plays', () => {
    expect([...AUDIO_IDS]).toEqual([...SOUND_IDS]);
    expect(audio.map((a) => a.id)).toEqual([...AUDIO_IDS]);
  });

  it('every file under public/assets/audio/ is in the list and every row has its file', () => {
    const files = readdirSync(DIR).sort();
    expect(files).toEqual(audio.map((a) => a.file.replace('audio/', '')).sort());
    for (const a of audio) expect(a.file, a.id).toBe(`audio/${a.id}.mp3`);
  });

  it('every row has a pack, a URL, CC0, a credit and the original file name', () => {
    for (const a of audio) {
      expect(a.pack.trim(), a.id).not.toBe('');
      expect(a.url, a.id).toMatch(/^https:\/\//);
      expect(a.license, a.id).toBe('CC0');
      expect(a.credit.trim(), a.id).not.toBe('');
      expect(a.original, a.id).toMatch(/\.ogg$/);
    }
  });

  it('bytes match the committed files, and a file is an MP3 with no tags', () => {
    for (const a of audio) {
      const buf = readFileSync(ASSETS + a.file);
      expect(buf.length, a.id).toBe(a.bytes);
      expect(buf.subarray(0, 3).toString('latin1'), a.id).not.toBe('ID3');
      expect(buf[0], a.id).toBe(0xff);
    }
  });

  it('all sounds together are at most 30 KB (D523)', () => {
    const total = audio.reduce((n, a) => n + statSync(ASSETS + a.file).size, 0);
    expect(total).toBeLessThanOrEqual(AUDIO_BYTES_CAP);
  });

  it('the sound packs agree both ways with docs/credits.md', () => {
    const committed = readFileSync(new URL('../../docs/credits.md', import.meta.url), 'utf8');
    const section = committed.split('## Sound packs (CC0)')[1]?.split('## Made for')[0] ?? '';
    const credited = new Map(
      [...section.matchAll(/^- \*\*(.+?)\*\* by .*?\. (\d+) sounds?\.$/gm)].map((m) => [
        m[1] as string,
        Number(m[2]),
      ]),
    );
    const rows = new Map<string, number>();
    for (const a of audio) rows.set(a.pack, (rows.get(a.pack) ?? 0) + 1);
    expect(credited).toEqual(rows);
  });

  it('no audition candidate is in the live-build inputs', () => {
    expect(readdirSync(DIR).every((f) => !/^\d+\.mp3$/.test(f))).toBe(true);
  });
});
