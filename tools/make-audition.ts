// SF.4 / VB.5: converts audition candidates in docs/flesh-out/{v1.2,v1.7}/sound-marks.md to mono
// MP3s under art-src/audition/ (needs the unzipped packs in art-src/packs/audio-unpacked/ and ffmpeg).
// Existing committed files are kept unless --all is passed, so historical v1.2 clips stay byte-identical.
// Run: npx vite-node tools/make-audition.ts [--all]
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { candidateFile, candidateSource, convertClip } from './audio-convert';
import { loadSoundMarks } from './sound-marks';

const rebuildAll = process.argv.includes('--all');
const marks = loadSoundMarks();
const out = fileURLToPath(new URL('../art-src/audition/', import.meta.url));
if (rebuildAll) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const expected = new Set(marks.candidates.map((c) => candidateFile(c.n)));
for (const f of readdirSync(out)) {
  if (!expected.has(f)) rmSync(out + f, { force: true });
}

let converted = 0;
for (const c of marks.candidates) {
  const dst = out + candidateFile(c.n);
  if (!rebuildAll && existsSync(dst)) continue;
  convertClip(candidateSource(c), dst, c.maxSeconds);
  converted += 1;
}
console.log(
  `converted ${converted} candidate(s) (${marks.candidates.length} total in art-src/audition/)`,
);
