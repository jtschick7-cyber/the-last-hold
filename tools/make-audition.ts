// SF.4: converts every audition candidate in docs/flesh-out/v1.2/sound-marks.md to a mono MP3 under
// art-src/audition/ (needs the unzipped packs in art-src/packs/audio-unpacked/ and ffmpeg).
// Run: npx vite-node tools/make-audition.ts
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { candidateFile, candidateSource, convertClip } from './audio-convert';
import { parseSoundMarks } from './sound-marks';

const marks = parseSoundMarks(
  readFileSync(new URL('../docs/flesh-out/v1.2/sound-marks.md', import.meta.url), 'utf8'),
);
const out = fileURLToPath(new URL('../art-src/audition/', import.meta.url));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const c of marks.candidates)
  convertClip(candidateSource(c), out + candidateFile(c.n), c.maxSeconds);
console.log(`converted ${marks.candidates.length} candidates into art-src/audition/`);
