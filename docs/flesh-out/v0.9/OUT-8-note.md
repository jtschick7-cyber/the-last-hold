# OUT-8 — the save fixture for v0.9 (2026-10-20)

**File:** `v8-owner.json`, the owner's real save, **copied unchanged** (214,937 bytes; export envelope `app`, `schemaVersion` 8, `rulesVersion` 5, `savedAt`, `state`). Do not edit, trim or reformat it.

**Where it goes:** `tests/saves/fixtures/v8-owner.json`, used by T9.1. If the repo's existing fixtures (`v7.json`, `v8.json`) are stored as the bare state rather than the export envelope, unwrap it the same way the existing fixtures were made, and keep the envelope copy beside it for the export-code test.

**Why a new fixture:** the schema changes from 8 to 9 (the `events` object and `CycleRecord.standPool`; technical design §5.2, §9.4).

**What the migrated save must show** (from the owner's save: cycle 19, Act IV, Bastion reached, `cycles[18].stand` null (the current cycle's stand record), 11 hunters, one Legendary, 421 Embers, 22 items):
- `schemaVersion` 9; `rulesVersion` still 5;
- after the load path: `events.opened` true, an empty bank (`tokens.count` 0, `at` = the load time), the scene pending, no rests, the boss at visit 0 with no tier or pool, three hunts at 0 points;
- `standPool: 'base'` on every past cycle and on cycle 19 (Bastion is reached; Act VI has not begun), `cycles[18].stand` still null;
- every hunter, item, Legendary, document and Embers value exactly as before;
- every existing **golden fight** replays line for line, and every recorded fight and stand **keeps its result** (recorded fights keep only a result, D344 (1), so they are compared by result, not by line);
- a second fixture, **`v9.json`**, is made by migrating this save and playing it 72 h under a fixed seed (as v5, v6 and v8 each have one), and is checked in beside it.
