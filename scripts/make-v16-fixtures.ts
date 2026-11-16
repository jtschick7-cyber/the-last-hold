// Plan T18.2 (D618, D621, D624): makes tests/saves/fixtures/v16.json (the owner's real v15
// save `v15-owner.json` after the v15 → v16 inner-ward shift migration, not played) and
// tests/saves/fixtures/v16-played.json (migrated + real commands testing 8 × 12 geometry,
// flexible Hearth Hall anchor inside clearing, rows 0..4 front defenses, and a recorded Stand).
// Run with:
//   npx vite-node scripts/make-v16-fixtures.ts && npx prettier --write tests/saves/fixtures/v16.json tests/saves/fixtures/v16-played.json
import { readFileSync, writeFileSync } from 'node:fs';
import { apply, type Command } from '../src/core/commands';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loadOwner = () => {
  const loaded = loadEnvelope(
    JSON.parse(readFileSync(new URL('v15-owner.json', fixtures), 'utf8')),
  );
  if (!loaded.ok) throw new Error(loaded.error);
  return loaded.value.state;
};

const migrated = loadOwner();
writeFileSync(new URL('v16.json', fixtures), encodeSaveFile(makeEnvelope(migrated, migrated.time)));

const played = loadOwner();
catchUpNow(played, played.time);
const must = (cmd: Command): void => {
  const r = apply(played, cmd, played.time);
  if (!r.ok) throw new Error(`${cmd.type}: ${r.reason}`);
};

must({ type: 'debug.layoutFillBastion' });
// Exercise flexible Hearth Hall placement within active Bastion clearing (outside legacy 2..4 bounds)
must({ type: 'layout.place', pieceId: 'hearth-hall', x: 1, y: 8 });
// Exercise expanded frontRows = 5 (rows 3 and 4 now count in Breach lanes)
must({
  type: 'layout.setDefenses',
  moves: [
    { pieceId: 'wall-1', x: 0, y: 0 },
    { pieceId: 'wall-2', x: 0, y: 1 },
    { pieceId: 'wall-3', x: 0, y: 2 },
    { pieceId: 'wall-4', x: 0, y: 3 },
    { pieceId: 'watchtower-1', x: 0, y: 4 },
    { pieceId: 'wall-5', x: 2, y: 1 },
    { pieceId: 'watchtower-2', x: 3, y: 3 },
    { pieceId: 'wall-6', x: 5, y: 4 },
  ],
});
const rec = played.cycles[played.cycles.length - 1];
if (rec) rec.ranks.bastion ??= played.time;
must({ type: 'stand.make', party: played.roster.active.slice(0, 6) as never });
must({ type: 'debug.breach.freeze' });

writeFileSync(
  new URL('v16-played.json', fixtures),
  encodeSaveFile(makeEnvelope(played, played.time)),
);
console.log(
  `v16 fixtures written: cycle ${played.cycle.number}, hall=${JSON.stringify(played.layout.placed['hearth-hall'])}, stands=${played.cycles.filter((c) => c.stand).length}`,
);
