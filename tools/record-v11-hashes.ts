// Plan TL.5c/TL.6: records the SHA-256 of every v1.1 grid picture as shown to the owner, so a picture
// marked Keep can be proved unchanged. Run once, after the owner's marks:
//   npx vite-node tools/record-v11-hashes.ts
import { writeFileSync } from 'node:fs';
import { currentHashes, isV11Asset } from './contact-sheet-data';

const hashes = Object.fromEntries(
  Object.entries(currentHashes())
    .filter(([id]) => isV11Asset(id))
    .sort(([a], [b]) => a.localeCompare(b)),
);
writeFileSync(
  new URL('../art-src/v1.1-hashes.json', import.meta.url),
  JSON.stringify(hashes, null, 2) + '\n',
);
console.log(`recorded ${Object.keys(hashes).length} hashes`);
