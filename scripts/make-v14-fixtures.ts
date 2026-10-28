// Plan TD.2 (D562): makes tests/saves/fixtures/v14.json, the owner's real v1.3 save
// (v13-owner.json, exported at TD.1) after the v13 -> v14 migration, not played. Run with
//   npx vite-node scripts/make-v14-fixtures.ts && npx prettier --write tests/saves/fixtures/v14.json
// v14-played.json (TD.4b) is v14.json after `debug.descentWin`: the real stand, the endgame roster and real
// Descent attempts until a genuine win, all through apply().
import { readFileSync, writeFileSync } from 'node:fs';
import { apply } from '../src/core/commands';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v13-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
writeFileSync(new URL('v14.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v14 fixture written: cycle ${state.cycle.number}, descent ${JSON.stringify(state.descent)}`,
);

const played = loadEnvelope(JSON.parse(readFileSync(new URL('v14.json', fixtures), 'utf8')));
if (!played.ok) throw new Error(played.error);
const ps = played.value.state;
const won = apply(ps, { type: 'debug.descentWin' }, ps.time);
if (!won.ok) throw new Error(won.reason);
writeFileSync(new URL('v14-played.json', fixtures), encodeSaveFile(makeEnvelope(ps, ps.time)));
console.log(
  `v14-played written: ${ps.descent.attempts} attempt(s), ${ps.descent.firstWin?.stagesCleared} stages, endings ${JSON.stringify(ps.remembering.endings.map((e) => e.ending))}`,
);
