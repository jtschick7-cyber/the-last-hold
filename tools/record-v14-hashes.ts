// Plan TD.6 (S12, D565): records the SHA-256 of the five Descent pictures as the owner approved them,
// so a later change shows up as a failing test. Run once, after the owner's approval:
//   npx vite-node tools/record-v14-hashes.ts
import { writeFileSync } from 'node:fs';
import { currentHashes, isV14Asset } from './contact-sheet-data';

const hashes = Object.fromEntries(
  Object.entries(currentHashes())
    .filter(([id]) => isV14Asset(id))
    .sort(([a], [b]) => a.localeCompare(b)),
);
writeFileSync(
  new URL('../art-src/v1.4-hashes.json', import.meta.url),
  JSON.stringify(hashes, null, 2) + '\n',
);
console.log(`recorded ${Object.keys(hashes).length} hashes`);
