# OUT-9 — Edits to `docs/technical-design.md` (v1.5 "The Breach", 2026-10-28; revised after the red-team review)

Apply in order. **Honest note on checking:** the Finds below were checked by reading the Project's copy of `docs/technical-design.md` (it was too long to load as a file for a machine count, unlike the GDD). Each was chosen as a short, distinctive phrase that appears once. **If any Find does not match exactly once in the repo's copy, stop and tell the owner; do not guess.** A Replace that begins with the Find text is an insertion.

New section: **§23 The Breach** (the last section is §22, so §23 is next). Player-facing strings are in GDD §9.25. Constants are in GDD §7.15.

## 1 — §5.2: the schema number

**Find:**
````markdown
// 14 from v1.4 (D562); 13 from v1.3 (D543);
````

**Replace with:**
````markdown
// 15 from v1.5 (D585); 14 from v1.4 (D562); 13 from v1.3 (D543);
````

## 2 — §5.2: the stand's saved inputs

**Find:**
````markdown
v1.3: the stand's saved inputs also carry an optional `vigilLevel`, §21.1.)*
````

**Replace with:**
````markdown
v1.3: the stand's saved inputs also carry an optional `vigilLevel`, §21.1. v1.5: they also carry an optional `lanes` table, and a stand with one is fought and rebuilt under the version 6 rules and one without under version 5; there is no separate rules-version field on the record, §23.1.)*
````

## 3 — §5.3: the rules version

**Find:**
````markdown
A `rulesVersion` constant bumps whenever combat math changes (5 from v0.8, D308).
````

**Replace with:**
````markdown
A `rulesVersion` constant bumps whenever combat math changes (5 from v0.8, D308; 6 from v1.5. Only the Last Stand's maths differs between 5 and 6, and it is chosen by whether the stand's record carries a lane table (D584, §23.4); every other fight's maths is identical in 5 and 6, so replay accepts both for them, and every version 5 Last Stand record replays under the version 5 rules).
````

## 4 — §7.2: the lane stream

**Find:**
````markdown
| Simulator | `sim:${runSeed}` (the simulator also picks its own `gameSeed`) |
````

**Replace with:**
````markdown
| Stand lane, wave n (v1.5) | `${gameSeed}:stand:${cycle}:lane:${n}`, one roll: the lane is `floor(roll × breach.lanes)`; n is counted the way the stand's species picks count waves (Claude Code confirms 0- or 1-based in the repo, uses the same for both and fixes it in a test). A distinct suffix on the stand seed, so the stand's species picks (the stand seed itself) are unchanged (D580) |
| Simulator | `sim:${runSeed}` (the simulator also picks its own `gameSeed`) |
````

## 5 — §9.4: the current schema number

**Find:**
````markdown
(currently **14**, from v1.4, D562;
````

**Replace with:**
````markdown
(currently **15**, from v1.5, D585; 14 from v1.4, D562;
````

## 6 — §9.4: the v14 → v15 migration

**Find:**
````markdown
rebuilds all 3 stage logs from `descent.firstWin`; migration runs in ≤ 100 ms (the benchmark row, GDD §6.5).
````

**Replace with:**
````markdown
rebuilds all 3 stage logs from `descent.firstWin`; migration runs in ≤ 100 ms (the benchmark row, GDD §6.5).

- **v14 → v15** *(v1.5; `save/migration-v15.ts`; fixtures `tests/saves/fixtures/v14-owner.json` (the owner's real v1.4 save, exported at TB.2; if the owner cannot, `v14-played.json` is the real old-save fixture and the progress entry says so), `v15.json` (that save migrated, not played) and the scripted `v15-played.json`; see §23.6)*:
  - changes only the number: `schemaVersion` 14 → 15. It adds no field and gives no past stand record a `lanes` table, so every recorded stand replays under the version 5 rules;
  - `HoldLayoutState` is untouched (D585);
  - **Tests:** each fixture loads, migrates, validates and round-trips (save → load → equal); no stand record anywhere has `lanes` after the migration; `layout` is identical before and after; each old record's stamp is unchanged; **every golden fight replays line for line, and every recorded fight and stand keeps its result;** the "newer version" guard is tested with the current code refusing schema 16; `v15-played.json` loads, validates, round-trips and holds at least one stand with `lanes` whose logs rebuild line for line; the migration runs in ≤ 100 ms (the benchmark row, GDD §6.5).
````

## 7 — §13.4: the simulator

**Find:**
````markdown
No simulator policy issues `descent.start` in its main run, so every existing report equals the v1.3 baseline (`192 of 192 same`).
````

**Replace with:**
````markdown
No simulator policy issues `descent.start` in its main run, so every existing report equals the v1.3 baseline (`192 of 192 same`).

#### The Breach (v1.5)

- Every player except the Tactician calls `layout.autoArrange` **at every Bastion check-in before the stand-timing preview, and again right before Start** (a repeat changes nothing), and issues no other layout command (Auto-arrange is the baseline layout, D589); so the timing previews and the stand use one layout. The Tactician (`sim/policies/tactician.ts`, Monday seeds only, its own shard `breach` in `sim/shards.ts`, the Orderer and Vigilant pattern) plays like Standard and at the same moments applies the Suggest layout rule (§23.2): `layout.unplace` for every defense, then `layout.place` in Suggest's order (so swap rules never matter). It exercises the whole command path on a real 3-cycle run; no row judges it (rows A to C use the probe), so its report is informational.
- **The probe** (`sim/breach-probe.ts`, inside the `breach` shard, judged in `sim.yml` only) works on a `structuredClone` of Standard's state at its first stand check-in, per Monday seed, with the preview's 100 practice stands (`laststand.previewSamples`) and the same seeds for every layout: Auto-arrange, the Tactician's layout and a deliberately bad layout (lift every defense to the Tray; fill the tiles `(x,y)` (0,0), (0,1), (0,2), (1,0), (1,1), (1,2) in that order, towers first and then walls in catalog order, skipping any tile that holds another building (the Alchemist holds (1,2) in the canonical layout); the rest stay in the Tray); it also reports the same state under the version 5 rules.
- **One-time baseline move (D589 (5)):** **every moment up to a player's first version 6 stand equals the v1.4 baseline; everything after it moves** (waves held change Embers, Hearth upgrades, cycle length, relics, band, trust, Orders standing and Command XP). The baselines are re-recorded once at TB.11, every row is re-judged on them, and the report says how many of the 192 moments are the same and lists each that moved. If an old row fails and no tunable fixes it, stop and ask.
- Calibration sweeps run on demand with `npm run sim:breach -- ...` (the v1.3 KV.9 and v1.4 TD.8b pattern); CI `sim.yml` judges only the fixed, approved constants.
- **Budget:** the `breach` shard must stay under 5 minutes per CI job (D320); if it would pass 4 minutes, stop and ask; never trim seeds or rows.
````

## 8 — §14: the tests table (a pointer row)

**Find:**
````markdown
| **Simulator checks** | The v0.9 rows | v0.9 |
````

**Replace with:**
````markdown
| **Simulator checks** | The v0.9 rows | v0.9 |
| **The Breach** | Lane streams, cover, depth, tower reach, the version 5 / 6 dual path, the frozen lane table, schema 15, Suggest layout and the Tactician; see §23.8 | v1.5 |
````

## 9 — §15: debug

**Find:**
````markdown
it guarantees `rebuildDescentLogs` replays an honest win line for line.
````

**Replace with:**
````markdown
it guarantees `rebuildDescentLogs` replays an honest win line for line.
- **v1.5 (D593, D594):** `debug.breach.freeze()` builds and shows the lane table the stand would freeze now (it saves nothing). It is a core command through `apply` and marks `debugUsed`. There is no debug command that sets lanes: a lane list set that way could not be saved on the record, so its stand would not replay. Tests pick real seeds whose lanes are known (a table of seeds worked out once and checked in).
````

## 10 — §19.1: the coupling rule changes

**Find:**
````markdown
- **Zero combat/economy coupling in v1.1 (S11):** A static lint test verifies that no module in `core/systems/economy.ts`, `combat.ts`, `stand.ts`, `contracts.ts` or `advance.ts` imports or references `layout`. `rulesVersion` stays 5.
````

**Replace with:**
````markdown
- **Coupling rule (S11 in v1.1; revised by D586 and D593 in v1.5):** a static lint test verifies that no module in `core/systems/economy.ts`, `combat.ts`, `stand.ts`, `contracts.ts` or `advance.ts` imports or references `layout` or `state.layout`. In v1.1 nothing read it and `rulesVersion` stayed 5. **From v1.5 exactly one new module, `core/systems/breach.ts`, may read `state.layout`** (with the layout modules and the UI; the UI may read the layout to draw the grid but **may not compute cover, depth or volley**, which it takes from `laneView`), and only to build the lane table when a stand starts and to answer the Lanes strip and the preview; the stand fight and the wave-log rebuild read **only the frozen lane table** (§23). The lint list gains `breach.ts` as an allowed reader and keeps the five modules above banned.
````

## 11 — §19.5: the forward-compatibility note

**Find:**
````markdown
The 8 × 8 coordinate layout format and piece IDs are designed for direct reuse by v1.5. In v1.5, Last Stand records will store an optional layout snapshot without migrating `HoldLayoutState`.
````

**Replace with:**
````markdown
The 8 × 8 coordinate layout format and piece IDs were designed for reuse by v1.5, and v1.5 uses them unchanged: `HoldLayoutState` is not migrated (D585). Instead of a layout snapshot, the Last Stand's record keeps a small derived **lane table** (§23.1) built from the layout when Start is pressed. The save schema moves to 15 for that table (§9.4, §23.6). Walls and Watchtowers now matter in combat (§23); every other piece is still purely visual.
````

## 12 — Append the new §23 after §22.8

**Find:**
````markdown
| Size | production build ≤ 614,400 bytes gzipped (SF.9 method), measured at TD.2, TD.4b, TD.5, TD.7b and TD.10 |
````

**Replace with:**
````markdown
| Size | production build ≤ 614,400 bytes gzipped (SF.9 method), measured at TD.2, TD.4b, TD.5, TD.7b and TD.10 |

## 23. The Breach (v1.5, D579–D595)

**Save schema 14 → 15 (§23.1, §23.6). `rulesVersion` 5 → 6 on a dual path chosen by the lane table (§23.4). One new random stream prefix, a suffix on the stand seed (§7.2). No `advance` change: the layout is read when a stand starts, never over time. No new runtime dependency.** The core does all the arithmetic and builds every breakdown in the function that builds the number; the UI shows it and never computes it (§4.2). Constants are in GDD §7.15, strings in GDD §9.25, rules in GDD §5.9.11.

### 23.1 Save state (D585, D591, D592)

```ts
interface LaneTable {
  pieces: number[]          // 8 integers: counted wall and tower pieces in each column, 0 to 3
  towerCols: number[]       // the columns (0 to 7) of the counted towers, ascending, at most 3
  k: {                      // the breach.* numbers in force at Start, so later tuning never changes a replay
    coverOwn: number; coverNeighbour: number; depthStep: number; depthMax: number
    towerReach: number[]    // [1, 0.5, 0.25] at the start values; multiples of 0.25
    volleyScale: number     // in hundredths
  }
}
// The stand's saved inputs (the record that holds standPool, vigilLevel, Threat and the seed, §5.2) gain:  lanes?: LaneTable
// Present means the stand is fought and rebuilt under the version 6 rules. Absent means version 5, exactly as before. There is no separate rules-version field: the table is the marker.
```

- `HoldLayoutState` is **not** changed. A new game starts with no `lanes` anywhere; a stand gets one only when `stand.start` runs.
- About 200 bytes a stand, for ever (one per cycle, as the vigil row did). **Save growth ≤ 0.4 KB per stand record** (a unit test, GDD §6.5).
- The lane **list** (which lane each wave takes) is never saved: it is `laneOf(standSeed, n)` (§23.2) and is the same on every rebuild.
- `resetForLongNight` copies nothing new; `layout` is kept as now (D502). Claude Code confirms the exact name of the field that holds the stand's saved inputs in the repo and tells the owner if it differs.

### 23.2 Derived values: `src/core/systems/breach.ts` (D581, D582, D588, D590)

All pure, built so each number and its `Breakdown` come from the same function (§5.4). Only `+ − × ÷`, `floor`, `min`, `max` and comparisons are used, so the portable-math rule (§7.4) is met with no helper. No numeric literal outside the allowlist (§5.1): lanes, rows and every weight come from `balance.breach`.

- `laneOf(standSeed, n)`: seeds `${gameSeed}:stand:${cycle}:lane:${n}` (§7.2), takes the first roll, returns `floor(roll × breach.lanes)`. `laneOf` is defined for every n, so the worker and the strip compute lanes on demand and no fixed-length list exists; `lanesFor(standSeed, N)` is just N calls.
- `countedPieces(state)`: the `active` wall and watchtower pieces (the existing `getPieceStatus`, §19.3) whose tile row is below `breach.frontRows`.
- `laneTableFor(state)`: builds the `LaneTable` from the layout and the defense levels now. **This is the only function that reads `state.layout` for combat.**
- `cover(table, c)`, `extra(table, c)`, `wallCut(table, wallsLevel, c)`, `volley(table, towerLevel, c)`: the formulas of GDD §5.9.11 and §7.15, each returning a value and a `Breakdown` (the lines of GDD §9.25). **`volley` is worked in whole numbers in one fixed order:** reach in quarters (`round(towerReach[d] × 4)`), the scale in hundredths (`round(volleyScale × 100)`), then `floor( volleyPerLevel × level × scaleHundredths × Σ reachQuarters ÷ (400 × counted towers) )`: all products first, one division, then `floor`; **0 when no tower counts** (counted towers = `towerCols.length`) and at level 0. Hand-worked test tables use the same order. Validation keeps `towerReach` in multiples of 0.25 and `volleyScale` in hundredths.
- `laneView(state)`: the view for the Lanes strip, the text list and the breakdown sheet (the 8 lanes' cover, tower reach, the waves of the first `breach.suggestWaves` in each lane (so tuning that constant changes the strip), and which pieces cover which lane for the lit tiles). Memoized like `buildHoldGridView` (§19.2).
- `suggestLayout(state)`: the fixed rule of GDD §5.9.11. It reads the lanes of the first `breach.suggestWaves` waves, weights each lane by its number of waves, and adds pieces one at a time: at each step it scores every (owned defense piece, free front-row tile holding no other building) pair by the rise in `Σ weight × (cover × (1 + depthStep × extra) + tower reach)`, takes the best (ties: smaller row, then smaller column), and stops when every owned defense is placed or no free tile is left; a tower whose placement would only lower the score is left for the end. **It also scores the Auto-arrange defense positions with the same score and returns those instead if they are higher, so it never scores below Auto-arrange, by construction.** The score adds cover and tower reach with equal weight (a fixed design choice, not tuned). It returns a list of moves and **changes no state**. It must run in ≤ 20 ms on the throttled profile (GDD §6.5). The Tactician and the Suggest layout button call this one function.
- **Each `breach.*` key is read in exactly one file under `src/core`** (`breach.ts`), except `breach.lanes`, which `laneOf` also needs (same file). A test enforces it, as for the vigil keys (§21.2).

### 23.3 Commands (D587, D588, D591)

- `layout.*` commands (§19.3) are unchanged, and v1.1's auto-placement of newly unlocked pieces (§19.3) is unchanged. **If the owner answers Q61 yes (asked in the first message of the build thread; built at the end of TB.8b):** `layout.setDefenses { moves }` applies a list of moves from `suggestLayout`, moves only wall and tower pieces, and is **atomic**: it lifts every defense in the front rows that is not in the list to the Tray, then places each listed defense on its target; it refuses the whole command if a target is not a free front-row tile (free means holding no other building and not another listed target) or a piece is not an unlocked wall or tower; defenses in rows 3 to 7 are untouched; it is one command and one autosave. It is the only way a suggestion ever changes the layout, and only on the player's tap.
- The existing stand-start command (`stand.start` or the repo's name) is extended: with the gate and Bastion rules unchanged, **it calls `laneTableFor(state)` once, saves it as `lanes` in the stand's saved inputs (which is what makes it a version 6 stand)**, in the same step that fixes the stand's other inputs (the way it fixes `vigilLevel`, §21.3). Starting twice cannot freeze two tables (the existing "already started" refusal covers it; a test proves it). If the start code lives in `stand.ts`, Claude Code splits the layout read into `breach.ts`, called from the command; **if that cannot be done without a larger change, stop and ask** (the lint rule of §19.1 bans `stand.ts` from reading the layout).
- A stand started below Bastion (the v0.4 arrival stand) freezes no table and takes the version 5 path; Claude Code confirms in the repo which stands can start below Bastion and applies the same rule to each.
- **Test-only start option (D593 (f), at TB.6):** the stand-start input gains an optional flag that freezes no table, so old stand tests that go through the command path keep asserting the same numbers on the version 5 path. It is honoured only in the debug panel and in tests (it sets `debugUsed`) and refused in a normal build. Each such test also gets a version 6 counterpart, so nothing is weakened.
- `debug.breach.freeze` — §15.

### 23.4 The fight, `rulesVersion` and the dual path (D584)

- The stand fight takes an optional `lanes` input. **Absent: the old code path, bit for bit** (the level 0 pattern of §21.2), so a version 5 record replays under the version 5 rules.
- **Present:** for wave n the fight asks `breach.ts` for two numbers from the table and the wave's lane: `wallCut` (added into the party's `taken%` bucket beside the other taken% lines, inside the 75% cap) and `volley` (the tick-1 Steel damage, replacing `watchtower.volleyPerLevel × level`). `combat.ts` and `stand.ts` receive numbers, never the layout. The wave's Health, Might, species, tier, bombs, potions and the 400-tick limit are unchanged.
- **Equality with version 5 (two tests):** (1) a version 6 stand whose Walls and Watchtower levels are both 0 equals the version 5 stand for the same inputs (wall cut and volley are both 0 whatever the table: the volley is 0 at level 0 and also when no tower counts); (2) with Watchtower level 0, `depthStep` 0 and cover 100% in every lane (a table with a counted piece in every column), the version 6 stand equals the version 5 stand (the wall cut is then exactly today's). A table with no counted pieces is **not** equal to version 5: Walls then cover only the ruined-edge lanes, which is the point of the layout.
- The wave log rebuild uses the saved table and the saved `k`, never the live layout or the current `balance.breach`. A log of a version 6 stand opens with its header line (GDD §9.25).
- **The global rules-version constant becomes 6.** Contract, Delve, event, boss, hunt and Descent fight records made from v1.5 on are stamped 6; their maths is the same in 5 and 6 and replay accepts both. Only the Last Stand's choice of rules depends on the lane table.
- **Locked files (D584 (5), Q62):** the golden-fight test asserts the rules version number; the one-line move from 5 to 6 is the owner's decision. No golden fight, recorded contract, Delve, event, boss, hunt or Descent fight, and no recorded version 5 stand, changes a line. **New version 6 stand goldens (`tests/golden/stands-v6/`) are additions the owner approves and are recorded only after TB.13 sets the final constants.**
- **Proof that nothing outside the Last Stand changed:** (1) the golden fights and all recorded fights replay line for line; (2) every recorded version 5 stand replays line for line; (3) a test starts the same cycle with and without a layout change and checks that contracts, Delves, events, bosses, hunts and the Descent produce identical logs and results; (4) the non-coupling lint of §19.1; (5) every simulator moment up to a player's first version 6 stand equals the v1.4 baseline (everything after it moves and is re-recorded once, D589).

### 23.5 The preview and the worker (D590)

- `previewInputFor(state)` (§10.1) carries the **lane table built from the layout now** and the **real stand's seed**, from which the worker computes any wave's lane on demand with `laneOf` (no fixed-length list), never the whole layout. The 100 practice stands draw their species from their own seeds (as today) and **take their lanes from the real stand's lanes (wave n takes the real stand's lane n)**, so the preview reacts to the lanes the player can see and to the layout. *(Claude's reading, listed in the summary for the owner to confirm: using fresh random lanes for each practice stand would average over lanes and make the preview ignore the actual coming lanes.)*
- The preview is recomputed whenever a piece moves; stale responses are dropped by `requestId` (§10.1). The Last Stand preview budget (≤ 1 s, GDD §6.5) is unchanged and now includes the lanes. With every piece in the Tray the preview shows the cost honestly.
- **Suggest layout runs on the main thread** in `core` (≤ 20 ms), not in the worker; its preview line uses the worker with the suggested table (a second request, same budget).

### 23.6 Migration and fixtures (D585)

`save/migration-v15.ts` is described in §9.4. Validation (`save/validate-stand-lanes.ts`): `pieces` 8 integers in 0..3; `towerCols` at most 3 integers in 0..7, ascending; `k` finite numbers in sane ranges, with `towerReach` of length 3 in multiples of 0.25, `volleyScale` in hundredths and `depthMax` a whole number; **each tower column must have `pieces[c] ≥ 1`, and the number of tower columns is at most 3.** **A table that fails validation refuses the load** with the usual plain-language reason (a run that cannot be trusted, as for Delves, §5.2), never silently drops, because dropping would replay the stand under different rules. Fixtures: **`v14-owner.json`** (the owner's real v1.4 save, exported at TB.2), **`v15.json`** (migrated, not played) and **`v15-played.json`** (made in TB.10 with the real commands: several stands with a spread of layouts made by `layout.place`, one with the Tray non-empty, and `debug.breach.freeze` read once).

### 23.7 Simulator

See §13.4 ("The Breach"). Rows A–C are GDD §6.2 (Proposed, measured at TB.12, approved by the owner, committed in their own `sim/targets.ts` commit at TB.13).

### 23.8 Tests (D593)

| Area | Tests |
|---|---|
| Save | v14 → v15 on all fixtures; round-trip; the current code refuses schema 16; no old stand gains `lanes`; `layout` identical across the step; `lanes` validation table (each bad shape refuses); the table on one record ≤ 0.4 KB; `resetForLongNight` unchanged |
| Lanes | `laneOf` for a table of seeds equals an independently worked list; the lane list is the same on every call; **the stand's species picks for fixed seeds are byte-identical before and after** (the lane stream is separate) |
| Cover and depth | a table over every column pattern (empty, own only, one neighbour, both, edge columns, 2 and 3 pieces) against worked-out values; `coverOwn + 2 × coverNeighbour = 1`; the 75% cap holds; with full cover and no depth the cut equals today's 2% per level |
| Towers | the shared volley equals worked-out values (whole-number order of §23.2) for 1, 2 and 3 counted towers at every distance; **0 when no tower counts**; a tower in the Tray gives nothing and does not dilute the others; a Watchtower upgrade with the new tower in the Tray never lowers any lane; the volley is an integer |
| Counted pieces | only `active` pieces in rows 0..2 count; Tray, locked, dormant-ring and rows 3..7 do not; nothing is placed by starting a stand (the layout is identical before and after Start) |
| Dual path | a record without `lanes` replays line for line under version 5; the two equality-with-version-5 tests of §23.4; a stand rebuilt from its record gives identical logs after the layout is changed and after `balance.breach` is changed in the test |
| Nothing else changed | golden fights, recorded fights and stands, contracts, Delves, events, bosses, hunts and the Descent identical (§23.4 proof) |
| Non-coupling | `breach.ts` on the lint list as the only combat-side reader of `state.layout`; a planted read of `state.layout` from `stand.ts`, `combat.ts`, `economy.ts`, `contracts.ts` or `advance.ts` fails; **the UI may read the layout to draw the grid**, and a separate test fails if anything under `src/ui/` computes cover, depth or volley instead of taking it from `laneView` |
| Preview | the preview with the layout as Auto-arrange and the lane list equals the practice stands run by hand with the same seeds; moving a piece changes it; ≤ 1 s on the throttled profile |
| Suggest | deterministic; never moves a non-defense piece; never uses an occupied tile; never exceeds the pieces owned; **scores at least as high as Auto-arrange by construction** (it returns Auto-arrange's positions if they score higher), tested on two named fixture lane lists: `even` (lanes 0 to 7, then 0 to 3) and `west-heavy` (0, 1, 0, 1, 2, 0, 1, 0, 3, 0, 1, 2); ≤ 20 ms |
| Version 6 stand goldens (TB.13) | five stands, one per layout: Auto-arrange, Suggest, the bad layout, no towers placed, and an edges-only layout (pieces only in columns 0 and 7), on fixed seeds; recorded only after the final constants |
| UI (Playwright, phone viewport) | the strip (two rows of four below 600 px, one row of eight above), list, lane sheet, lit tiles (outline and corner mark, no pulse under reduced motion), Suggest, the Arrange Hold button on the Last Stand screen, no strip before Bastion, the wave-list lane tags, the Start Tray line and the log header; every control ≥ 44 px at 320, 360, 375 and 390 px and every Text size; no sideways page scroll at 320 px at Largest; contrast in both themes; a routine check-in ≤ 15 taps |
| Strings | the strings equal GDD §9.25 word for word (the `sound-text.test.ts` pattern) |
| Simulator | rows A–C; every report's non-stand moments equal the v1.4 baseline; the `breach` shard ≤ 4 minutes |
| Size | the production build, gzipped (SF.9 method), ≤ 614,400 bytes; measured at TB.2, TB.6, TB.8a, TB.8b and TB.14 |

### 23.9 Risks and honest notes

- **Auto-arrange could be optimal for everyone.** The lane list differs each cycle, towers share one volley, and depth rewards stacking, so the best layout changes; row B (the Tactician beats Auto-arrange) is the check, and if it fails with no reasonable tunable, stop and write it to `docs/questions.md`.
- **Wall segments unlock slowly** (4 at Walls level 1, 11 at level 15), so low-level Citadel stands are weaker than today whatever the layout. Reported, not hidden (GDD §5.9.11).
- **The placeholder `volleyScale` of 1 makes an average tower weaker than today's,** so the first measured table is expected to show stands at or below the old results until calibration.
- **Phone use.** The strip must be readable and tappable at 320 px at Largest; the text list is the fallback and the page never scrolls sideways.
- **Test timing.** `npm run check` was already at the 120 s fail line in the container at v1.4 (117 to 131 s; CI, the judge, ran 88 s), and v1.5 adds large tables of tests. It is measured at TB.3 and TB.5 as well as TB.14; the probe, the calibration sweeps and any test that runs many practice stands stay out of `npm run check` (they run in `sim.yml`); if a CI `check` run passes 120 s, stop and ask. The e2e shards (5 since D569, each under 8 minutes, stop and ask at 7 min 30 s) are re-measured at TB.14.
- **Volley with fewer towers placed.** Because the divisor is the placed towers, one well-placed tower gives the full volley in its own lane and extra placed towers never add damage to one lane (D582); calibration reports it.
- **Wave-driven effects.** Layout moves the waves held, and with them the Embers, relics, band, trust, Orders standing and Command XP (D586); the calibration report shows relics and bands per layout, and how often the 75% cap binds.
````
