// SF.4 / VB.5 (D524 (2), D608): the sound audition. The maps in v1.2 & v1.7 sound-marks.md, the
// converted candidates and the page agree; and neither the candidates nor the page reach the live build.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BYTES_PER_SECOND,
  candidateAudioFile,
  renderAuditionPage,
  SOUND_CAP_BYTES,
} from '../../tools/audition-page';
import { loadSoundMarks, SOUND_IDS, V17_SOUND_IDS } from '../../tools/sound-marks';

const root = new URL('../../', import.meta.url);
const marks = loadSoundMarks(root);
const audition = new URL('art-src/audition/', root);
const sizeOf = (n: number): number => statSync(new URL(candidateAudioFile(n), audition)).size;

describe('the audition map', () => {
  it('lists 4–6 unique candidates for each of the ten sounds, numbered 1 to N in order', () => {
    expect(marks.candidates.map((c) => c.n)).toEqual(marks.candidates.map((_, i) => i + 1));
    for (const slot of SOUND_IDS) {
      const n = marks.candidates.filter((c) => c.slot === slot).length;
      expect(n, slot).toBeGreaterThanOrEqual(4);
      expect(n, slot).toBeLessThanOrEqual(6);
    }
    const sources = marks.candidates.map((c) => `${c.pack}:${c.file}`);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it('uses the length limits of D524 (2) and D608', () => {
    const limit = {
      build: 0.4,
      launch: 0.4,
      place: 0.4,
      win: 0.8,
      lose: 0.8,
      fanfare: 1.2,
      nightfall: 1.2,
      brace: 0.6,
      discover: 0.8,
      strike: 0.4,
    };
    for (const c of marks.candidates) expect(c.maxSeconds, `${c.n}`).toBe(limit[c.slot]);
  });

  it('draws only from the four Kenney sound packs', () => {
    const packs = new Set(marks.candidates.map((c) => c.pack));
    for (const p of packs)
      expect(['Interface Sounds', 'Impact Sounds', 'RPG Audio', 'Music Jingles']).toContain(p);
  });

  it('has one converted file per candidate, no others, each within its length limit', () => {
    expect(readdirSync(audition).sort()).toEqual(
      marks.candidates.map((c) => candidateAudioFile(c.n)),
    );
    for (const c of marks.candidates) {
      const bytes = sizeOf(c.n);
      expect(bytes, `${c.n}`).toBeGreaterThan(500);
      // 48 kbps = 6,000 bytes per second; one extra frame of padding.
      expect(bytes / BYTES_PER_SECOND, `${c.n}`).toBeLessThanOrEqual(c.maxSeconds + 0.1);
    }
  });

  it('starts every file with MP3 frame data and no tags', () => {
    for (const c of marks.candidates) {
      const head = readFileSync(new URL(candidateAudioFile(c.n), audition)).subarray(0, 3);
      expect([head[0], (head[1] ?? 0) & 0xe0]).toEqual([0xff, 0xe0]);
    }
  });
});

describe('the audition page', () => {
  const sizes = Object.fromEntries(marks.candidates.map((c) => [c.n, sizeOf(c.n)]));
  const html = renderAuditionPage(marks, sizes);

  it('has one play button per candidate, in the map order, grouped by sound, with v1.7 jump links', () => {
    const files = [...html.matchAll(/data-file="audition\/(\d+\.mp3)"/g)].map((m) => m[1]);
    expect(files).toEqual(marks.candidates.map((c) => candidateAudioFile(c.n)));
    for (const slot of SOUND_IDS) expect(html).toContain(`data-slot="${slot}"`);
    for (const slot of V17_SOUND_IDS) expect(html).toContain(`href="#slot-${slot}"`);
    for (const slot of SOUND_IDS) {
      const picked = marks.picks[slot];
      expect(picked, slot).not.toBeNull();
      expect(html).toContain(`name="${slot}" value="${picked}" checked`);
    }
  });

  it('shows the 45 KB cap the owner is picking against (D608)', () => {
    expect(SOUND_CAP_BYTES).toBe(45 * 1024);
    expect(html).toContain(`var cap=${SOUND_CAP_BYTES}`);
  });
});

describe('the live build', () => {
  it('has no audition page, no candidate file and nothing about them in its precache list', () => {
    const out = mkdtempSync(join(tmpdir(), 'lh-live-'));
    try {
      execFileSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], {
        cwd: root,
        env: { ...process.env, LH_CHANNEL: 'live' },
        stdio: 'ignore',
      });
      expect(existsSync(join(out, 'audition.html'))).toBe(false);
      expect(existsSync(join(out, 'audition'))).toBe(false);
      const all = (dir: string): string[] =>
        readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? all(join(dir, e.name)) : [join(dir, e.name)],
        );
      const files = all(out);
      expect(files.filter((f) => /audition|\/\d+\.mp3$/.test(f))).toEqual([]);
      expect(readFileSync(join(out, 'sw.js'), 'utf8')).not.toMatch(/audition/);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 60_000);
});
