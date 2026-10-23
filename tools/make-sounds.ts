// SF.9: converts the owner's seven picks (docs/flesh-out/v1.2/sound-marks.md) from the original packs
// into public/assets/audio/<id>.mp3 and prints the byte sizes for src/content/audio.ts.
// Authoring-time only; needs the unzipped packs in art-src/packs/audio-unpacked/ and ffmpeg.
// Run: npx vite-node tools/make-sounds.ts
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { candidateSource, convertClip } from './audio-convert';
import { parseSoundMarks, SOUND_IDS } from './sound-marks';

const marks = parseSoundMarks(
  readFileSync(new URL('../docs/flesh-out/v1.2/sound-marks.md', import.meta.url), 'utf8'),
);
const out = fileURLToPath(new URL('../public/assets/audio/', import.meta.url));
mkdirSync(out, { recursive: true });
for (const id of SOUND_IDS) {
  const n = marks.picks[id];
  const c = marks.candidates.find((x) => x.n === n);
  if (!c) throw new Error(`no pick for ${id}`);
  convertClip(candidateSource(c), `${out}${id}.mp3`, c.maxSeconds);
  console.log(`${id}\t${c.pack}\t${c.file}\t${statSync(`${out}${id}.mp3`).size}`);
}
