// Plan TL.5a (S3): records the SHA-256 of every picture as shipped in v1.0, so v1.1 can prove it
// changed none of them without an owner-approved redraw. Run once, at the start of v1.1:
//   npx vite-node tools/record-v10-hashes.ts
import { writeFileSync } from 'node:fs';
import { currentHashes } from './contact-sheet-data';

const hashes = currentHashes();
const sorted = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(
  new URL('../art-src/v1.0-hashes.json', import.meta.url),
  JSON.stringify(sorted, null, 2) + '\n',
);
console.log(`recorded ${Object.keys(sorted).length} hashes`);
