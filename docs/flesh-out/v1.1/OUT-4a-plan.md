# OUT-4a — Plan section for v1.1 and outlines for v1.2–v1.5 (`docs/implementation-plan.md`, revised after the red-team review)

Insert the block below right after the end of `### v1.0 — Polish` (immediately before the `---` that precedes `## Judgment calls in the implementation plan (revised)`), and apply the small edits at the bottom of this file.

Task ids for v1.1 use the prefix **TL** ("The Layout"), because `T1.x` belongs to v0.1 and `T11.x` belongs to v0.11.

---

### v1.1 — The Hold's Layout

**Status:** not started *(fleshed out 2026-10-22; revised after red-team review; decisions D498–D508; files in `docs/flesh-out/v1.1/`)*

**Scope:** decorative free placement of buildings on an **8 × 8 grid** (`0..7 × 0..7`) with **the Fell Breach** on the north edge and **the Lowland Gate** on the south edge; Rank clearings (`4 × 4` Hamlet → `6 × 6` Keep → `8 × 6` Citadel → `8 × 8` Bastion); **39 placeable pieces (42 tiles)** (`2 × 2` Hearth Hall centerpiece anchored in `2..4 × 2..4`, 8 `1 × 1` unique/level buildings with 3 visual tiers, 17 `1 × 1` count-building plots with 3 density tiers, 3 Watchtowers, 11 auto-connecting Wall segments with row 1 Citadel defenses and row 0 Bastion defenses); **blueprint persistence across the Long Night** ("The stones remember", save schema **12**, with normative piece states `locked`, `active`, `dormant-ring`, `tray`); the live grid header on the Hold screen (with a `Grid` / `Classic scene` switch in Settings); the tap-only **Arrange Hold** sheet (`44 × 44 px` tile buttons, Tray, Auto-arrange, Clear, Blueprint ghosts toggle); code-generated 32 px grid art (and 64 px Hearth Hall) in three phased batches gated by a numbered contact sheet; and tuning the live odds benchmark budget rows (identified ≤ 120 ms, 3-candidate ≤ 150 ms per candidate) so slow CI runners pass cleanly (D505, M6). **No game rule, production rate, Threat rate or combat math changes (`rulesVersion` stays 5).** Designed so **v1.5 ("The Breach")** reuses `state.layout` without another save migration.

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v1.0 must be **merged to `main`, tagged `v1.0.0` and accepted** (`docs/progress.md` says it was merged on 2026-10-22, D497). Check that `git tag` lists `v1.0.0`, that `main` contains the v1.0 merge, and that `sim/baseline.json` is the accepted one. **If `v1.0.0` is not yet tagged or `main` does not hold the merge, stop and tell the owner. Do not branch from `milestone/v1.0`.**  
1. **Branch.** Work on `milestone/v1.1`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v1.1`. Push after every task; the preview build follows this branch.  
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the revised v1.1 flesh-out files, and ask whether they have **read `OUT-1` to `OUT-9` (especially GDD §5.1.5 and §9.21, the roadmap D499, and the technical design §19) and say yes.** **Do not apply the files or build anything until they answer yes** (or say what to change; then change the files first). When they say yes, add **D508** (`OUT-1`) with the date.  
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**  
   - copy the files into `docs/flesh-out/v1.1/` and the summary into `docs/flesh-out/v1.1-summary.md`;  
   - `OUT-1` rows → `docs/decisions.md` (**no old row is edited**; D498 is the sweep; D508 once the owner has said yes); `OUT-2a` → `docs/gdd.md` (every Find text must occur exactly once; if one has moved, stop and tell the owner); `OUT-4a` → this plan; `OUT-5` → `docs/questions.md` (closes Q41, Q46, Q48); `OUT-6` → `docs/flesh-out/v1.1/OUT-6-names.md`; `OUT-9` → append to `docs/technical-design.md` as the new §19 and update the schema number in §5.2 / §9.4 and settings key list in §18;  
   - **add two standing rules to `CLAUDE.md`:**  
     1. *"In v1.1, `state.layout` is decorative only: no production rate, cost, Threat rate or fight calculation reads it (`rulesVersion` stays 5)."*  
     2. *"Write no player-facing strings for the layout beyond the table in GDD §9.21; if a screen needs one, ask."*  
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.  
   - [ ] **Docs commit:** flesh-out files applied.  
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. D498 confirms D472–D494 and D496 as Decided as built; D472's blanket rule covers all rows up to D471. Every row from **D499** up is a new v1.1 row. **If any other `Proposed` row is found, list it in the progress entry and ask the owner; do not edit it.**  
5. **Constants and rules.** v1.1 adds **no `balance.ts` game constant** and changes **none.** `rulesVersion` stays **5.** Save schema moves from **11 to 12** (`state.layout`, D502). **If any golden fight changes, or any recorded fight or stand changes its result, stop and ask.**  
6. **The simulator.** Every player's report **equals the v1.0 baseline** (byte-for-byte in the judged metrics; no simulator policy issues layout commands in v1.1). No new simulator row. **Known and expected, not stops:** the Saturday runs show ✗ lines (reported only, D135), and benchmark timing warnings above 1× budget on slow CI runners (D445, M6). **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows.  
7. **Saves.** Schema 12 requires a migration (`save/migration-v12.ts`), a fixture of the owner's real live v1.0 save (`v11-owner.json`, exported before TL.1, S10), migrated fixtures (`v12.json` and `v12-played.json`), and a round-trip test. The `Hold view` setting (`Grid` / `Classic scene`) lives in the external settings key (`lasthold:settings`, D486, D503), not in the save.  
8. **Art rules.** Code-generated in the 32-colour Zughy palette (`32 × 32 px` tiles/sprites, `64 × 64 px` for the `2 × 2` Hearth Hall), registered in `src/content/assets.ts`. Existing v1.0 PNGs must match `art-src/v1.0-hashes.json` byte-for-byte (S3). **Show the numbered contact sheet (`TL.5c`) in the conversation first** and wait for the owner's marks (`docs/flesh-out/v1.1/art-marks.md`). Any redraws (`TL.6`) are capped at **12 pictures per session** with before/after sheets approved by the owner.  
9. **Pre-authorised old-test edits (D507, M7).** Allowed, each listed in the progress entry, nothing loosened: (1) updating save schema version from `11` to `12` and adding `v11-owner.json`, `v12.json` and `v12-played.json` in `tests/saves/`; (2) updating the odds budget constants in `tests/bench/` (identified 120 ms, 3-candidate 150 ms per D505); (3) setting `holdView: 'scene'` in the shared test loader for old specs expecting the pixel hold scene (or updating them for the grid header); (4) scoping v1.0's `contact-sheet.test.ts` to the v1.0 manifest ID list so v1.1 assets number independently; (5) extending `app-settings.test.ts` for the `holdView` field; (6) adding a narrow container-level scroll exemption (`data-internal-scroll`) for Arrange Hold in `polish-widths` and `polish-text-size` at 320 px; (7) appending new screen keys to motion-counts and contrast baselines. Any other old-test edit stops and asks.  
10. **Stop and ask the owner** if any golden fight or simulator report changes; if technical design in the repo contradicts OUT-9 (S9); if a tile button in Arrange Hold cannot reach `44 × 44 px` or causes page-level horizontal scroll at `320 px` at Largest; if your tool cannot show the `TL.5c` contact sheet in the conversation; or if the production gzipped download size exceeds `600 KB`.  
11. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D498–D508, GDD §5.1.5, §9.21, `docs/flesh-out/v1.1-summary.md`, technical design §19.  
- TL.1: technical design §5.2, §9.4, §18, §19; `src/core/save/`; `tests/saves/`.  
- TL.2, TL.3, TL.4: GDD §5.1.2, §5.1.3, §5.1.5, §5.9.2, §5.9.7, §8.1; technical design §19.  
- TL.5a, TL.5b, TL.5c, TL.6: GDD §9.12; `src/content/assets.ts`; `tools/contact-sheet.ts`; `tools/contact-sheet-numbered.ts`; `tools/before-after.ts`.  
- TL.7, TL.8: GDD §9.2, §9.10, §9.20, §9.21; `src/platform/app-settings.ts`; `src/ui/`.  
- TL.9: `tests/e2e/polish-screens.ts`, `polish-tap-targets.spec.ts`, `polish-widths.spec.ts`, `polish-text-size.spec.ts`, `polish-motion.spec.ts`, `polish-contrast.spec.ts`.  
- TL.10, TL.11: GDD §6.5; `tests/bench/`; `sim/`.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Confirm you have read the revised v1.1 flesh-out (`OUT-1` to `OUT-9`) and say yes (or say what to change; Claude Code waits) | Box step 2, D508 |
| **Before TL.1** | Export your live save code from your iPhone and provide it as `v11-owner.json` | S10 |
| After TL.5c | **Mark the v1.1 grid art contact sheet:** reply with any picture numbers to Redraw (everything else is Keep). Claude Code writes your marks to `docs/flesh-out/v1.1/art-marks.md` | D504, S2 |
| After TL.6 (if any marked) | Approve the before/after sheet for any redrawn grid tiles/sprites | D504 |
| After TL.8 | Optional quick look on the preview build: check how the Hold grid and Arrange Hold sheet feel on your iPhone | GDD §9.21 |
| At the end | Playtest on your iPhone (checklist below); then say go for `sim:accept`, merge and tag `v1.1.0` | below |

#### Tasks

- [ ] **TL.1 Save v12: `HoldLayoutState`, catalog foundations and the `v11 → v12` migration.** Create `src/core/systems/layout-catalog.ts` containing the 39 piece definitions, footprints, `clearingBounds`, and `CANONICAL_LAYOUT` (with row 1 Citadel defenses and row 0 Bastion defenses; M1, S1). Add `HoldLayoutState` (`placed`, `showGhosts`) to `GameState` (technical design §19). Implement the `v11 → v12` migration (`src/core/save/migration-v12.ts`) that populates `CANONICAL_LAYOUT` and `showGhosts: true`. Implement deterministic validation (bounds `0..7`, `hearth-hall` anchor inside `2..4 × 2..4` [M4], overlaps resolved in catalog order by moving displaced pieces to Tray [S13], unknown keys dropped with warnings). Create `tests/saves/fixtures/v12.json` (from `v11-owner.json` migrated, S10) and `v12-played.json` (played 72 h under a fixed seed). Add the unit test `tests/layout/save-size.test.ts` proving the full 39-piece layout JSON is `≤ 1.5 KB` (measured ~1.1 KB, M5). **Acceptance:** all save fixtures load, migrate, validate and round-trip; schema 13 is refused by v12 code; `layout` save growth is `≤ 1.5 KB`; every golden fight and recorded stand replays line for line.  
- [ ] **TL.2 Selectors, piece states and non-coupling verification.** Build `src/core/systems/layout.ts` (pure TypeScript): `getPieceStatus(state, pieceId)` returning the four mutually exclusive states (`locked`, `active`, `dormant-ring`, `tray`; M2), visual tier and plot density derivation, `wallConnectionMask(grid, x, y)` (4-bit N/E/S/W mask for adjacent active walls or watchtowers), and `buildHoldGridView(state)` (memoized, N6) returning active pieces, dormant blueprint foundation ghosts, tray pieces, and cosmetic/frost/lamp flags. Add a static lint check ensuring no selector or function in `economy.ts`, `combat.ts`, `stand.ts`, `contracts.ts`, or `advance.ts` imports or reads `state.layout` (S11). **Acceptance:** table-driven unit tests cover every unlock threshold, Rank clearings, 16 wall connection masks, mutually exclusive states across all Ranks; lint test verifies zero combat/economy coupling.  
- [ ] **TL.3 Layout commands, blueprint protection, auto-placement and Long Night.** Implement commands `layout.place(pieceId, x, y)` (target must be inside current clearing; 1 × 1 pieces swap or displace to tray; 2 × 2 Hearth Hall moving within `2..4 × 2..4` swaps displaced pieces into vacated hall tiles or tray), `layout.unplace(pieceId)` (refused for Hearth Hall), `layout.autoArrange()`, `layout.clear()` (clears 1 × 1 pieces to tray and deletes blueprint coordinates, keeping Hearth Hall), and `layout.setShowGhosts(boolean)`. Implement `autoPlaceUnlocked(state)`: blueprint coordinates are never overwritten automatically (M2); newly unlocked pieces wake up at their saved blueprint if free and in clearing, stay `dormant-ring` if outer ring, or go to `tray` if occupied. If unplaced, auto-place using deterministic distance-from-center spiral order (S6). Hook into `buyBuilding`, `upgradeBuilding`, `rankUp` (wakes dormant-ring pieces and places tray items, M2), new game creation (`hearth-hall` only, M3), and cycle start after Long Night (wakes starting buildings, M3). Verify `state.layout.placed` persists untouched across Long Night (`longNight.ts`). **Acceptance:** unit tests verify move, swap, 2 × 2 Hearth Hall restricted to `2..4 × 2..4` (M4), refusal on locked rings, blueprint protection, rankUp placement, and Long Night persistence.  
- [ ] **TL.4 Debug commands for layout.** Add `debug.layout.autoArrange()`, `debug.layout.clear()`, and `debug.layout.fillBastion()` (unlocks Bastion with sample building levels/counts so every piece can be inspected on the grid in one tap; sets `debugUsed`, N4) to the debug panel. **Acceptance:** unit tests cover each debug command; none is reachable without the debug panel.  
- [ ] **TL.5a Grid art inventory, ground & border tiles, and hash baseline.** Create `tools/draw-layout-grid.ts` and write `docs/flesh-out/v1.1/art-inventory.md` listing all ~75 new assets with IDs, sizes, and states (S2). Record `art-src/v1.0-hashes.json` of all PNGs as shipped in v1.0 (S3). Generate ground clearing tiles, locked pine forest and ruined stone border tiles, Fell Breach (north) and Lowland Gate (south) header strips, and blueprint foundation ghost outlines in the 32-colour palette. Register rows in `src/content/assets.ts`. **Acceptance:** every asset uses only the 32-colour palette; `v1.0-hashes.json` test passes byte-identical on all v1.0 PNGs; manifest rows validate.  
- [ ] **TL.5b Grid art: defenses, level buildings, and 2 × 2 Hearth Hall.** Generate the 16 wall connection mask sprites (`wall-conn-*.png`), Watchtower sprites, the 7 level buildings across 3 visual tiers, the Unique Trophy Hall, and the 64 × 64 px Hearth Hall across all 4 Ranks plus Carved Door, frost, and lamp overlays (S2). Register in `src/content/assets.ts`. **Acceptance:** all sprites conform to palette and size constraints; manifest entries validate; Keep test passes.  
- [ ] **TL.5c Grid art: count plots, cosmetics, contact sheet and owner marks stop.** Generate the 17 count-building plot density tiers (`1–4` single, `5–14` pair, `15+` cluster; 2 for Silver Seams) and grid cosmetic overlays (Gatehouse banners, Wall lanterns, Watchtower bell; S7). Extend `tools/contact-sheet-numbered.ts` (`--layout-sheets`) to output a numbered contact sheet of all new v1.1 grid assets on both theme backgrounds to `docs/flesh-out/v1.1/contact-sheets/` and write `docs/flesh-out/v1.1/art-marks.md`. Measure asset download size impact against the 600 KB budget (N5). **Acceptance:** contact sheet is **shown to the owner in the conversation** and committed. **Stop** for the owner's Keep/Redraw marks.  
- [ ] **TL.6 Grid art redraws *(if any marked by the owner)***. Redraw any grid pictures marked Redraw in `docs/flesh-out/v1.1/art-marks.md` (at most 12 per session; split into `TL.6a, TL.6b…` if needed), keeping unmarked pictures byte-identical, and show a before/after sheet in the conversation for the owner's approval. If 0 marked, tick this task and note "all Keep" in `progress.md`. **Acceptance:** Keep hash test passes; owner approves before/after sheet.  
- [ ] **TL.7 Hold screen live grid header and `Hold view` setting.** Add `holdView: 'grid' | 'scene'` (default `'grid'`) to `src/platform/app-settings.ts` (kept on Reset everything, untouched by Paste/Load/Restore, S4). Add the **Hold view** control in `More ▸ Settings`. Build the live 8 × 8 grid header on the Hold screen (GDD §9.21): Fell Breach and Lowland Gate headers, Rank clearing, active pieces, dormant blueprint ghosts, cosmetics across Ranks (S7), Act VI frost / lamp, and `[Layout ▸]` button (`≥ 44 × 44 px`, with badge counting only unplaced items in `tray`; M2). Header scales smoothly and is non-interactive (S5). Add data-attributes for Playwright test assertions (S11). **Acceptance:** unit tests cover `holdView` storage and load; Playwright verifies both views render all cosmetics, frost, and lamp states; routine check-in stays ≤ 15 taps.  
- [ ] **TL.8 The Arrange Hold sheet.** Build `ArrangeHoldSheet` (GDD §9.21): 8 × 8 grid of `44 × 44 px` tile buttons, high-contrast selection outline (N9), tap-to-select, tap-to-move/swap, 2 × 2 Hearth Hall footprint preview, info bar with `[Move to tray]`, Tray of unplaced unlocked pieces, `[Auto-arrange]`, `[Clear to tray…]` (with confirmation dialog), and `Blueprint ghosts: [On] [Off]`. Strictly enforce strings from the GDD §9.21 table (S8). When container width is `< 352 px` (320 px check width, N3), wrap tile grid in a self-contained horizontal scroll container (`data-internal-scroll="true"`, M7) so the page never scrolls horizontally. **Acceptance:** Playwright tests verify selecting, moving, swapping, Hearth Hall movement, tray interactions, Auto-arrange, Clear to tray, and ghosts toggle.  
- [ ] **TL.9 Accessibility and layout checks across all widths and Text sizes.** Add the Hold screen in Grid view (Hamlet through Bastion) and the Arrange Hold sheet to `tests/e2e/polish-screens.ts`. Run the 44 px tap-target sweep (`polish-tap-targets.spec.ts`), width checks at 320/360/900/1300 px (`polish-widths.spec.ts`), 320 px Largest text-size overflow check (`polish-text-size.spec.ts`), reduced motion (`polish-motion.spec.ts`), and contrast check (`polish-contrast.spec.ts`). **Acceptance:** 0 findings across all suites at every width, theme, and Text size. **Stop and ask** if any control cannot reach 44 px or text clips at Largest.  
- [ ] **TL.10 Performance budgets and download size.** In `tests/bench/`, update the live odds budget constants to 120 ms (identified) and 150 ms (3 candidates, 500 samples/candidate) (D505, M6). Add the new throttled benchmark checks: **Hold grid render ≤ 16 ms**, **Arrange Hold sheet open ≤ 50 ms**, and **v11 → v12 migration ≤ 100 ms** (D506). Measure production gzipped download size against `≤ 600 KB` (D494, D495). **Acceptance:** no benchmark row fails (≤ 2× limit; warnings logged in `progress.md`, M6); gzipped production build is `≤ 600 KB`.  
- [ ] **TL.11 Simulator and determinism verification.** Run `npm run check` and the full simulator suite (`sim.yml`). **Acceptance:** all 55 simulator rows pass on the 5 seeds, every player's report equals the v1.0 baseline (`176 of 176 same`), and every golden fight and recorded stand replays line for line (`rulesVersion` is 5).  
- [ ] **TL.12 Playwright smoke and preview build.** Extend `tests/e2e/smoke.spec.ts` to open Arrange Hold, move a building on the grid, tap Auto-arrange, toggle `Hold view` in Settings, and reload offline (S11). Push `milestone/v1.1` and verify the preview build loads `v11-owner.json` and migrates to `v12`. **Acceptance:** all smoke tests pass; preview build is verified.  
- [ ] **TL.13 Docs, progress and playtest hand-off.** Update `docs/progress.md`, tick the plan boxes, open the pull request from `milestone/v1.1` to `main` using the plain-language template and playtest checklist below. Note that rolling back to v1.0 requires importing `v11-owner.json` (S10). Wait for the owner's "playtest passed" before running `sim:accept`, merging, and tagging `v1.1.0`.

#### Out of scope for v1.1 *(visible deferred list, with the reason)*

| Item | Reason |
|---|---|
| Tactical building placement in the Last Stand | Scheduled as milestone **v1.5 — The Breach** (D499, D500); v1.1 is decorative and sets up the saved 8 × 8 layout format so v1.5 needs no save migration (stand snapshot will be added in v1.5, S12) |
| Audio | Scheduled as milestone **v1.2 — Sounds of the Frontier** (D476, D499) |
| Rising difficulty / endless Keep the Vigil | Scheduled as milestone **v1.3 — Keep the Vigil** (D453, D477, D499) |
| The Descent (third ending) | Scheduled as milestone **v1.4 — The Descent** (D448, D477, D499) |
| Event-only cosmetics and legendary hunters' animation | Deferred (D490, D505) |
| Screen-reader labels and keyboard focus | Deferred (D489, D505) |
| Any game-rule, production, Threat or combat change | Not part of v1.1 (`rulesVersion` stays 5) |

#### Simulator rows

No new simulator row. All 55 existing rows must pass and every player's report must equal the v1.0 baseline.

#### Owner playtest checklist *(on your iPhone; send screenshots of anything wrong)*

- **Export first (S10):** did you export your save code before opening the preview build? (Schema 12 is one-way).  
- **Your save's arrival:** does your v1.0 save open straight into the Hold grid with your buildings arranged cleanly? Are Citadel walls visible in row 1? Are all your hunters, items, Orders, Embers and endings untouched?  
- **Visual progression:** use the debug panel (or play through Ranks) to look at Hamlet (`4 × 4`), Keep (`6 × 6`), Citadel (`8 × 6`) and Bastion (`8 × 8`). Does the settlement feel like it is expanding toward the Fell Breach as you Rank up? Do the `2 × 2` Hearth Hall, connected Walls, Watchtowers, count-building plots and cosmetics look good?  
- **Arrange Hold sheet:** tap **[Layout ▸]**. Is tap-to-select and tap-to-move/swap easy with your thumb? Try moving the `2 × 2` Hearth Hall, moving a building to the Tray, **Auto-arrange**, **Clear to tray**, and **Blueprint ghosts On/Off**.  
- **The Long Night ("The stones remember"):** after a Long Night, do your saved blueprint outlines stay in place, and do buildings pop back into their saved spots as you rebuild them without overwriting your layout?  
- **Hold view setting:** in `More ▸ Settings`, switch **Hold view** between `Grid` and `Classic scene`. Do both views work cleanly?  
- **Daily check-in speed:** is a normal check-in still 15 taps or fewer?  
- **Looks wrong on my phone:** send screenshots.  
- **Anything that felt like a chore.**

---

### v1.2 — Sounds of the Frontier *(outline: needs a flesh-out session first, §0.4)*

**Status:** not started *(scheduled by D476, D499)*

**Scope:** CC0 sound effects and optional ambient/UI cues, **muted by default** with a toggle in `More ▸ Settings` (stored in the external settings key `lasthold:settings`, no save schema change); **no new runtime dependency** (uses the browser's built-in Web Audio / HTMLAudioElement); populates the reserved `audio` section in `src/content/assets.ts` and records every CC0 source in `docs/credits.md`; respects reduced-motion / background-tab state (never plays while the app is hidden); stays within the `≤ 600 KB` gzipped download budget in GDD §6.5 (or proposes a measured size row for the owner's approval). No game-rule or simulator change.

---

### v1.3 — Keep the Vigil *(outline: needs a flesh-out session first, §0.4)*

**Status:** not started *(scheduled by D453, D477, D499)*

**Scope:** rising-difficulty endless mode after Act VI (D453, D477). Once the gate is open and the player chooses (or enables) rising vigil cycles, each subsequent Long Night steps up the vigil pressure and wave scaling, with in-world Roll of Wardens marks and an endless-mode simulator check that fits inside the 5-minute CI limit (policy to be specified in its flesh-out, N11). Gated strictly behind post-Act VI play so Cycles 1–6 golden fights and simulator baselines never change.

---

### v1.4 — The Descent *(outline: needs a flesh-out session first, §0.4)*

**Status:** not started *(scheduled by D448, D477, D499)*

**Scope:** the third ending (`lore-secrets.md` §6, D448, D477): taking the fight down into the Deep for one final multi-stage or all-hands battle using everything learned across every cycle (the Unlit is scattered, not ended; a costly, heroic victory). Includes the ending's story texts (approved by the owner before building), Deep battle art, Library replay, and a reachability/victory check in `sim.yml`.

---

### v1.5 — The Breach *(outline: needs a flesh-out session first, §0.4)*

**Status:** not started *(scheduled by D499, D500)*

**Scope:** tactical building placement in the Last Stand ("Version 2"). Reuses `v1.1`'s saved `8 × 8` `state.layout` format (`0..7 × 0..7` with row `0` as the Fell Breach) **without migrating `HoldLayoutState`** (stand records will store an optional layout snapshot, S12). Gives position on the grid a clear, inspectable combat meaning in the Last Stand (such as Wall coverage across the north Breach columns, Watchtower firing lanes/arcs, and inner-ward protection for key buildings), with full in-game formula breakdowns (§5.0), updated Last Stand preview and Suggest workers within the §6.5 time budget, a layout rule for simulated players (`Auto-arrange` as the baseline tactical layout), and a `rulesVersion` bump to **6** with updated stand fixtures.

---

## Small edits to the rest of `docs/implementation-plan.md`

1. **Header `Depth:` line:**  
   - **Find:** `**Depth:** v0.0–v0.11 are in full detail (v0.11 fleshed out 2026-10-21, D446–D467). v1.0 is fleshed out (2026-10-21, D472–D491).`  
   - **Replace with:** `**Depth:** v0.0–v1.1 are in full detail (v1.0 completed 2026-10-22, D472–D497; v1.1 fleshed out 2026-10-22, D498–D508). v1.2–v1.5 are at outline level.`  
2. **§0.7 Size table:** add the row:  
   - `| v1.1 | 15 (TL.1–TL.13, with TL.5 in 3 parts) | 12–16 |`  
   - And add the v1.0 actual and v1.1 sizing note right below the v1.0 sizing note:  
     `*Actual (v1.0):* 17 progress entries (docs commit through milestone end, including 6 art-review passes).`  
     `*Sizing note (v1.1 flesh-out, revised after red-team review):* 15 tasks (TL.1–TL.13, with TL.5 in three parts), estimated at 12–16 sessions. No combat or economy rules change; the weight is in the 39-piece grid state/migration, the Arrange Hold tap-to-swap UI, and the ~75 new 32 px grid art assets split across TL.5a/b/c with one owner stop at TL.5c, plus TL.6 if any tile is marked Redraw.`  
3. **Judgment calls in the implementation plan, add item 15:**  
   - `15. **v1.1 is 15 tasks (TL.1–TL.13, TL.5 in three parts) over 12–16 sessions,** introducing decorative 8 × 8 building placement (schema 12) with Citadel defenses in row 1 and Bastion defenses in row 0, designed for reuse by v1.5 ("The Breach"), followed by outlines for v1.2 (Audio), v1.3 (Keep the Vigil), v1.4 (The Descent) and v1.5 (The Breach) (D499–D508).`
