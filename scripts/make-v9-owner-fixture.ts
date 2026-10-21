// Plan T10.1 (OUT-8): makes tests/saves/fixtures/v9-owner.json, the owner's real v8 save of 2026-10-20
// (v8-owner.json) carried forward through the shipped v8 -> v9 migration and the events load path
// (`catchUpNow`, which runs `openEvents`). It is NOT a fresh export: both exports the owner sent on
// 2026-10-21 had `meta.debugUsed` true. Must run while SCHEMA_VERSION is 9. Run with
//   npx vite-node scripts/make-v9-owner-fixture.ts && npx prettier --write tests/saves/fixtures/v9-owner.json
import { readFileSync, writeFileSync } from 'node:fs';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';
import { SCHEMA_VERSION } from '../src/core/state/game-state';

if (SCHEMA_VERSION !== 9)
  throw new Error(`Run this while the schema is 9 (it is ${SCHEMA_VERSION}).`);
const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v8-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
catchUpNow(state, state.time);
writeFileSync(new URL('v9-owner.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v9-owner.json written: cycle ${state.cycle.number}, ${state.cycle.age}, events opened ${state.events.opened}`,
);
