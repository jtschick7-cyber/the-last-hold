# OUT-8 — The save fixtures for T11.1 (v10 → v11)

**No owner export is needed** (D462). `meta.debugUsed` never resets, so every export from the live game carries it, as both v0.10 exports did (D426).

**Fixtures:**
- `tests/saves/fixtures/v10.json` — the owner's save migrated to v10, not played (already in the repo).
- `tests/saves/fixtures/v10-played.json` — the scripted v10 save (already in the repo).
- **New: `tests/saves/fixtures/v11-played.json`** — a scripted, seeded save past Act VI's stand with Keep the Vigil and then Remember Them recorded, made by `scripts/make-v11-fixture.ts` the way T10.16 made `v10-played.json`: debug commands (`debug.startAct`, `debug.remembering.finishActVI()`, `debug.remembering.openGate()`) plus the player's own commands (`remembering.seeNear`, `remembering.choose('vigil')`, `remembering.choose('remember')`). It gives the later v12 migration a save with endings, and gives the near-scene tests a sanctioned "Act VI's stand applied" source (hand-editing `cycles[].act` would fail story validation).

**What the tests must show (T11.1):**
- both v10 fixtures load, migrate to v11, validate and round-trip;
- `remembering` is `{ nearSeen: false, readyNoted: false, endings: [] }` after the migration;
- `orders` is identical before and after the migration step (the load path after it may change it, and that is allowed);
- every golden fight replays line for line and every recorded fight and stand keeps its result;
- `v11-played.json` loads, validates and round-trips.
