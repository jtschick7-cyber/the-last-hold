// Plan TL.1 (D502, S10): makes tests/saves/fixtures/v12.json, the owner's real v11 save
// (v11-owner.json, exported 2026-10-23) after the v11 -> v12 migration, and v12-played.json, that save
// after the load path (catch-up) and 72 h of play by the Standard policy under the save's own seed.
// The policy issues no layout command in v1.1. Run with
//   npx vite-node scripts/make-v12-fixtures.ts && npx prettier --write tests/saves/fixtures/v12*.json
import { readFileSync, writeFileSync } from 'node:fs';
import { play } from '../src/core/policies';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v11-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
writeFileSync(new URL('v12.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
catchUpNow(state, state.time);
const HOURS_72 = 72 * 60 * 60 * 1000;
play(state, { policy: 'standard', startedAt: state.time, until: state.time + HOURS_72 });
writeFileSync(
  new URL('v12-played.json', fixtures),
  encodeSaveFile(makeEnvelope(state, state.time)),
);
console.log(
  `v12 fixtures written: cycle ${state.cycle.number}, ${Object.keys(state.layout.placed).length} placed`,
);
