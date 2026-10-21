# OUT-9 — Technical design changes for v0.11 (apply to `docs/technical-design.md`)

Claude Code may not add design content to the technical design (CLAUDE.md), so every entry v0.11 needs is here. Apply them in the docs commit.

## §5.2 State: add to the state interface (after `orders`)

```ts
  remembering: RememberingState                  // v0.11; the ending (below)
```

and, after the Orders block:

```ts
interface RememberingState {
  nearSeen: boolean                              // Pechko's near-scene (R-01 or R-02) was closed with Continue
  readyNoted: boolean                            // the "The Remembering is ready" line has been shown (D466)
  endings: EndingRecord[]                        // endings reached, in the order chosen; at most 2 entries
}
interface EndingRecord {
  ending: 'remember' | 'vigil'
  at: number                                     // information only; never compared (D461)
  cycle: number                                  // the cycle number when it was chosen
}
```

- **Derived, never stored:** the gate (`rememberingGate(state)`: 40 names found **and** every contract species' stored knowledge level is Studied or better; the contract-species list is content and is pinned by a content test, so changing it needs a decisions row); `actVIStandApplied(state)` (Act VI's cycle has its `stand` record set, or a later cycle exists; Claude Code confirms the exact field in the repo); `endingChoosable(state)` = both; the card's form; the Order cards of the ending (`endingOrderCards(state)`, from `orders.chaptersRead` and `orders.readWith[o][3]`, and from whether `orders.opened.quenchers` exists); whether the hearth is warm (`endings` has `remember`).
- **Nothing in `orders` or `skills` changes** because of the ending. The ending reads `readWith`; it never writes it. Current `seats` and levels are not read at all. R-11 is derived from `endings` and is **not** a found document (no standing, no Lore XP, no Archive badge, no act grouping; D463).
- **Validation (array order, not time):** `endings` has at most one `remember` and one `vigil`; ids are known; `cycle` is an integer from 1 to the current cycle number; `at` is a non-negative number and is **not compared**; a `vigil` must come **before** a `remember` in the array; an ending recorded while `actVIStandApplied` is false is **dropped with a warning** (it cannot happen in play); an ending whose gate no longer holds in the loaded state is **kept, with a warning** (content may have changed). Unknown ids drop with a warning. A device clock set back changes nothing here.
- **Commands (names are the debug and sim interface):**
  - `remembering.seeNear()` — sets `nearSeen`; the UI calls it when the scene is closed with Continue (the ✕ leaves it waiting, D432 (4)).
  - `remembering.noteReady()` — sets `readyNoted`; the UI calls it when the ready line is shown.
  - `remembering.choose(ending)` — refused unless `endingChoosable`; `remember` refused if already recorded; `vigil` refused if already recorded or after `remember`; records `{ending, at: now, cycle}`.
  - Re-reading is UI only and is not a command.
  - **Debug (D462):** `debug.remembering.openGate()` sets the 40 names found and every contract species to Studied in the stored fields the game reads, **without** running the found-document hooks, and marks `debugUsed`; `debug.remembering.finishActVI()` applies Act VI's stand result by the T10.12 pattern (or uses an existing debug stand command). Neither stores an override.
- **Where scenes are decided:** `rememberingNearPending(state)` = `actVIStandApplied && !nearSeen`. `rememberingReadyLine(state)` = `nearSeen && gate && !readyNoted && endings empty`. **No `advance` change.**
- **The core stays pure.** The reading's pace, fades and reduced-motion handling are UI only, kept in `src/ui/remembering/timing.ts` (a presentation timing, not a game constant; D464 (4)). The core supplies the ordered list of 40 `{name, village, year}` from content.

## §6.2 Order of a load: change

migrate → catch up (`advance`) → `openOrders` → `checkThirdSeat` → UI scenes. **The UI scene order is now:** the Orders scenes (opening scenes and the "Seat your Orders" step, as in v0.10), then Act VI's D6-07 if due, then Pechko's near-scene if `rememberingNearPending`. The ending itself never starts on load (D459 (3)). The same order holds on the **live path** straight after Act VI's stand result: the stand's result sheet, D6-06, then the Orders and D6-07 scenes if due, then the near-scene on the next Hold-screen visit.

## §9.4 Migrations: add

- **v10 → v11** *(v0.11; `save/migration-v11.ts`; fixtures `tests/saves/fixtures/v10.json` (the owner's save migrated to v10, not played) and `v10-played.json`, both already in the repo, and the new scripted `v11-played.json`; see OUT-8)*:
  - adds `remembering: { nearSeen: false, readyNoted: false, endings: [] }`;
  - changes nothing else; records no ending; sets no flag;
  - **Tests:** each v10 fixture loads, migrates, validates and round-trips (save → load → equal); the migrated save has an empty block; `rulesVersion` is still 5; **`orders` is identical before and after the migration step itself** (the load path after it may legitimately change `orders`); **every golden fight replays line for line, and every recorded fight and stand keeps its result;** a save with `schemaVersion` 12 is refused by v11 code with the usual "newer version" message; `v11-played.json` loads, validates, round-trips and has `vigil` before `remember`; the migration runs within the budget approved under D445's route.

## §10 UI architecture: add

- **Scene order** after Act VI's stand and on load: see §6.2 above. The near-scene is a scene sheet like the Orders scenes; the card is a Hold-screen card after the Orders card; the ready line is an away-sheet or result-sheet line, once.
- **The ending sequence** is one scene stack played from the card or the Library: R-03, the reading screen, R-04, R-04b (Sigrun on the roster), the Order cards, R-09, R-11. Skip exists on the reading screen only. Fake-timer tests drive the pace.

## §11.2 Fast simulator set: add

The reachability row (D464) is **judged only in `sim.yml` (the full suite).** The fast set inside `npm run check` (Opening and Standard, 1 seed, to the current milestone's last time target) is **not extended** for it, to keep `npm run check` inside 90 s.

## §13 Simulator: add

- `sim/checks/v011.ts` holds the reachability check. **Sampling:** at the end of each cycle, the Standard player's report records whether `endingChoosable` is true and notes the first cycle in which it was (the one new report field, D464 (2)). A seed that never gets there counts as later than any N.
- No new player; Standard, Light, Heavy, Opening, the Delver, the Eventer and the Orderer never choose an ending.

## §14 Test table: add

| Area | Tests |
|---|---|
| Save | v10 → v11 on both v10 fixtures; `v11-played.json`; round-trip; schema 12 refused; `orders` unchanged across the migration step |
| Gate | closed at 39 names; closed at 3 kills on one species; open when all; reads stored knowledge level; contract-species list pinned; the base stand pool equals the contract species |
| Commands | `choose` refused before Act VI's stand, with a closed gate, twice, `vigil` after `remember`; `seeNear` only on Continue |
| Validation | ending dropped when the stand isn't applied; kept (warn) when the gate no longer holds; clock set back changes nothing |
| Orders cards | table over every case (none; one; all; Moot A/B; Quenchers A/B; Quenchers never opened); current seats and levels change nothing |
| No side effects | `orders` and `skills` unchanged across the whole ending; no document filed |
| Reading | 40 names in year order equal lore §20; fake timers; tap; Skip |
| Texts | lore §34.10 |
| Reachability | the sim row (full suite only) |
| Layout | Playwright: no sideways scroll, all 40 names fit |

## §15 Debug panel: add

`debug.remembering.openGate()` and `debug.remembering.finishActVI()` (D462). They mark `debugUsed` as every debug command does. The owner's path to the near-scene and the card is: *finishActVI*, then play the near-scene, then *openGate* (or leave the gate closed to see the not-ready card).

## Note

The repo's technical design has no Appendix 1; do not look for one.
