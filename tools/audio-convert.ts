// Converts the audition candidates (SF.4) to mono MP3 under art-src/audition/ (D522 (2), D524 (2)).
// Authoring-time only (technical design §12.3); needs ffmpeg on the PATH.
// The command line is tools/make-audition.ts.
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Candidate } from './sound-marks';

/** The unzipped folder each pack is in (git-ignored, art-src/packs/audio-unpacked/). */
export const PACK_DIRS: Record<string, string> = {
  'Impact Sounds': 'kenney_impact-sounds',
  'Interface Sounds': 'kenney_interface-sounds',
  'RPG Audio': 'kenney_rpg-audio',
  'Music Jingles': 'kenney_music-jingles',
};

const MEAN_TARGET_DB = -24; // evens the loudness between packs
const FADE_IN = 0.004;
const FADE_OUT = 0.05;

const ffmpeg = (args: string[]): string =>
  execFileSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const durationOf = (file: string): number =>
  Number(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
      { encoding: 'utf8' },
    ),
  );

/** `volumedetect` for a file (and an optional filter in front of it): mean and peak, in dB. */
const levels = (file: string, pre: string): { mean: number; max: number } => {
  const af = pre === '' ? 'volumedetect' : `${pre},volumedetect`;
  const log = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostdin', '-i', file, '-ac', '1', '-af', af, '-f', 'null', '-'],
    { encoding: 'utf8' },
  ).stderr;
  const pick = (key: string): number => Number(new RegExp(`${key}: (-?[\\d.]+) dB`).exec(log)?.[1]);
  return { mean: pick('mean_volume'), max: pick('max_volume') };
};

const PEAK_LIMIT_DB = -2; // headroom: MP3 encoding overshoots a limited signal a little

/** One clip → mono MP3 at about 48 kbps: cut to the limit, loudness evened, short fades, no tags. */
export const convertClip = (src: string, dst: string, maxSeconds: number): void => {
  const length = Math.min(durationOf(src), maxSeconds);
  const cut = `atrim=0:${length},asetpts=PTS-STARTPTS`;
  let gain = Math.max(-12, Math.min(18, MEAN_TARGET_DB - levels(src, cut).mean));
  const fadeOut = Math.min(FADE_OUT, length / 3);
  for (let pass = 0; pass < 4; pass++) {
    const filter = [
      cut,
      `volume=${gain.toFixed(2)}dB`,
      'alimiter=limit=0.7:attack=0.1:release=20:level=disabled',
      `afade=t=in:d=${FADE_IN}`,
      `afade=t=out:st=${(length - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}`,
    ].join(',');
    ffmpeg([
      '-y',
      '-i',
      src,
      '-ac',
      '1',
      '-af',
      filter,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '48k',
      '-ar',
      '44100',
      '-map_metadata',
      '-1',
      '-write_xing',
      '0',
      '-id3v2_version',
      '0',
      '-write_id3v1',
      '0',
      dst,
    ]);
    // Check the encoded file, not the filter: lower the gain if the MP3 still peaks too high.
    const { max } = levels(dst, '');
    if (max <= PEAK_LIMIT_DB) return;
    gain -= max - PEAK_LIMIT_DB + 0.2;
  }
};

export const candidateSource = (c: Candidate): string =>
  fileURLToPath(
    new URL(`../art-src/packs/audio-unpacked/${PACK_DIRS[c.pack]}/${c.file}`, import.meta.url),
  );

export const candidateFile = (n: number): string => `${String(n).padStart(2, '0')}.mp3`;
