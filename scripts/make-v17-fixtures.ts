// Generates the unplayed v17 fixture (`tests/saves/fixtures/v17.json`) by loading
// and migrating `v16.json` under the v17 schema without altering `v16.json`.
// Run: `npx vite-node scripts/make-v17-fixtures.ts && npx prettier --write tests/saves/fixtures/v17.json`
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../src/core/save';

const fixturesDir = resolve(import.meta.dirname, '../tests/saves/fixtures');
const raw = JSON.parse(readFileSync(resolve(fixturesDir, 'v16.json'), 'utf8')) as unknown;
const loaded = loadEnvelope(raw);
if (!loaded.ok) throw new Error(`Failed to migrate v16.json: ${loaded.error}`);
if (loaded.value.warnings.length > 0) {
  throw new Error(`Unexpected warnings migrating v16.json: ${loaded.value.warnings.join('; ')}`);
}
const envelopeJson = encodeSaveFile(makeEnvelope(loaded.value.state, loaded.value.state.time));
writeFileSync(resolve(fixturesDir, 'v17.json'), `${envelopeJson}\n`);
console.log(`Wrote v17.json (schemaVersion=${loaded.value.state.meta.schemaVersion})`);
