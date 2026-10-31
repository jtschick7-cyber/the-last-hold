// Verifies the committed 37 Option B v1.6 portrait PNGs against approved hashes.
// Run: npx vite-node tools/gen-portraits.ts
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const hashes = JSON.parse(
  readFileSync(new URL('../art-src/v1.6-portrait-hashes.json', import.meta.url), 'utf8'),
) as Record<string, string>;

const out = new URL('../public/assets/portraits/', import.meta.url);
let ok = 0;
for (const [name, expected] of Object.entries(hashes)) {
  const buf = readFileSync(new URL(name, out));
  const hash = createHash('sha256').update(buf).digest('hex');
  if (hash !== expected) throw new Error(`${name} hash mismatch!`);
  ok++;
}
console.log(`Verified ${ok}/37 portraits match approved v1.6 Option B hashes.`);
