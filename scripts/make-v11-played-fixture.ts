// Plan T11.5 (OUT-8, D462): makes tests/saves/fixtures/v11-played.json, a scripted, seeded save past
// Act VI's stand with Keep the Vigil and then Remember Them recorded. It starts from v11.json (the
// owner's save, migrated), catches up, then uses the debug commands (Start Act VI, Finish Act VI, Open
// the gate) and the player's own commands (see the scene, choose the vigil, choose to remember), all
// through apply(). Run with
//   npx vite-node scripts/make-v11-played-fixture.ts && npx prettier --write tests/saves/fixtures/v11-played.json
import { readFileSync, writeFileSync } from 'node:fs';
import { apply, type Command } from '../src/core/commands';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v11.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
catchUpNow(state, state.time);

const HOUR = 60 * 60 * 1000;
let now = state.time;
const run = (cmd: Command): void => {
  const r = apply(state, cmd, now);
  if (!r.ok) throw new Error(`${cmd.type}: ${r.reason}`);
};
run({ type: 'debug.startAct', act: 6 });
run({ type: 'debug.rememberingFinishActVI' });
run({ type: 'remembering.seeNear' });
run({ type: 'debug.rememberingOpenGate' });
now += HOUR;
run({ type: 'remembering.choose', ending: 'vigil' });
now += HOUR;
run({ type: 'remembering.choose', ending: 'remember' });
writeFileSync(
  new URL('v11-played.json', fixtures),
  encodeSaveFile(makeEnvelope(state, state.time)),
);
console.log(
  `v11-played.json written: cycle ${state.cycle.number}, endings ${JSON.stringify(state.remembering.endings)}`,
);
