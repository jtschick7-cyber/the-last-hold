# OUT-8 — Save fixture note (`v9-owner.json`)

*(Revised after the independent review, 2026-10-21.)*

**What it is.** The owner's real save in schema **v9**, used as the fixture for **T10.1** (save v10). v0.9 is merged and tagged `v0.9.0` (progress log, 2026-10-21), so the live game now saves v9.

**What the owner does (optional but best).** Export the save from the live game (More → Save & Data → Export) **after** the live game shows v0.9, and give the file to Claude Code. **Not the preview copy:** the preview save may have had debug commands used on it. The file's `schemaVersion` must read 9.

**What Claude Code does.**
1. If the owner supplies the export: check that `schemaVersion` is 9 and `meta.debugUsed` is false (if it is true, tell the owner and ask which to use). Copy it **unchanged** to `tests/saves/fixtures/v9-owner.json`.
2. **If the owner does not supply one:** build `v9-owner.json` by running the repo's shipped v8 → v9 migration and `openEvents` load path on `tests/saves/fixtures/v8-owner.json` (the owner's real save of 2026-10-20, cycle 19, Act IV, Bastion, 11 hunters), and say in the progress entry that the fixture is that save carried forward and not a fresh export.
3. Add `tests/saves/fixtures/v10.json`: the fixture migrated to v10 (**not played**; the played fixture, `v10-played.json`, comes at T10.16).
4. Write the backfill table (each standing source, where the save holds it, recoverable or not) in the progress entry **before** the migration code.
5. Tests: loads, migrates, validates, round-trips; `start` equals an independent recount, capped at level 1; the unrecoverable sources are named; the migration sets no `opened`, `openingQueue` or `seats`; **every golden fight replays line for line.**

**The tests do not assume the fixture's act or cycle.** What should open (the Moot at a Keep or later, Grey Wives with the Hut, the Bell-Watchers with Ilse, the Quenchers only if D5-08 is found) is computed from the fixture's own state by a table in the test. The 2026-10-20 save is in Act IV, so the Quenchers do not open on it; a fresher export may be in Act V and open them.

**What the owner should expect on opening the preview.** Up to four short scenes, one at a time, then "Seat your Orders" once; each Order starts at level 1. Nothing else in the save changes. (After you have opened the preview once, the scenes are used up on that copy; later checks use a fresh copy of `v10.json`.)

**Not checked here.** I did not have the file in this session, so the exact counts it holds are unknown (Q35).
