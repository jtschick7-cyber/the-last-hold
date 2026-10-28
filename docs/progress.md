# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.4` (from `main` at the PR 24 merge). The Claude session branch for this thread is `claude/dreamy-cerf-sg227v`.
- **Milestone:** v1.4 "The Descent" (D557–D569), in progress. v1.3 is merged, tagged `v1.3.0` and accepted (D556).
- **Last task:** TD.8a (endgame roster builder for the simulator). Before it: TD.7c, TD.7b, TD.6, TD.5, TD.7a. Before it: TD.7a, TD.4c, TD.4b, TD.4a, TD.3, TD.2, TD.1.
- **Next:** TD.8b (the Descent probe and calibration command); your look at the Descent screens and strings on the preview is still owed; then TD.9, TD.10, TD.11.
- **Open questions:** Q59 (calibration, asked after TD.8b). Q60 is answered (D570). Q53–Q55 and Q57 are closed. Size: 449,810 bytes at v1.3, about 164 KB under the 614,400 row.

Earlier entries are in [`docs/archive/progress-2026-10-11-to-15.md`](archive/progress-2026-10-11-to-15.md) (to T8.15), [`docs/archive/progress-2026-10-15-to-21.md`](archive/progress-2026-10-15-to-21.md) (T8.16 to T11.15) and [`docs/archive/progress-2026-10-21-to-24.md`](archive/progress-2026-10-21-to-24.md) (v0.11 session 17 to v1.3 KV.10). Read only the last entry at session start.

## 2026-10-24 — v1.3 KV.11 wrap-up and the pull request
- **Checks (this container):** `npm run check` green (94.7 s at KV.10). `sim:check`: 60 runs, 407 s, every enforced row passes (rows A to C included), **176 of 176 moments same** as the baseline; the Vigilant's 16 moments are new. The ✗ lines are Saturday runs, reported only.
- **e2e, 4 shards (local chromium build):** 141 s, 403 s, 172 s, 121 s; 143 tests pass, 2 fail. Shard 2 is over 5 minutes here (CI's limit is 8, D552; CI is the judge). The two failures are the known offline-reload tests in `smoke.spec.ts` (this container's browser build, with and without my changes).
- **Production build opens real saves:** new `tests/e2e/vigil-open.spec.ts`: your v12 save (`v12-owner.json`) with the gate closed (no vigil row) and then open (row there), and the played v13 save (row and status line). Passes.
- **Size:** 438,916 bytes (KV.10; build unchanged since). Schema 13, `rulesVersion` 5, golden fights and recorded stands replay (in `check`). No placeholder constant.
- **Docs:** plan KV.11 ticked, v1.3 `Status: in progress`, §0.7 actuals added (v1.2 final 16, v1.3 12 entries).
- **Not done, waiting on you:** the playtest, then `sim:accept`, merge, tag. **Please export your save from the game just before the merge.**

## 2026-10-24 — v1.3 milestone end
- **The owner said the playtest passed** (Remember Them path included).
- **Done:** `npm run sim:accept` (6 min 49 s here): the baseline moves to v1.3; the only differences are the milestone and the new Vigilant moments. Plan `Status: complete`, D556.
- **Left:** merge PR 21 and tag `v1.3.0`, after the owner confirms they exported their save.

## 2026-10-24 — v1.3 fix: offline reload broken by the picture packing (D553)
- **What was wrong:** CI shard 3 failed the two offline-reload tests in `smoke.spec.ts` on every push since D553. I had called them "known, this container's browser" in KV.10 and KV.11; **that was wrong**. I checked: they pass on the commit before D553 and fail after it.
- **Cause:** packing the pictures also repacked the five app icons. The PWA plugin lists the icons twice (once with the original's hash, once with the packed file's), and Workbox refuses an install with two different hashes for one file, so nothing was kept for offline use. This would have shipped.
- **Fix:** `vite.config.ts` leaves the `icons/` files unpacked (D553 otherwise unchanged). `sw.js` now has one hash per file. All 7 smoke tests pass here, including the two. **Size: 449,810 bytes** (was 438,916; the icons are back to full size), still far under 614,400.
- **Test changed (my own D553 test, same milestone):** `tests/tools/png-pack.test.ts` now skips the top-level `icons/` folder in the "every picture is packed" loop, and gains a check that `sw.js` never lists one file with two different hashes (the check that would have caught this). Nothing else loosened.
- **Left:** CI to confirm on the new push, then merge. The earlier `sim:accept` is not affected (no game rule changed).

## 2026-10-28 — v1.4 TD.1: docs commit (flesh-out applied)
- **Step 0:** `v1.3.0` tagged, v1.3 merged, D553 fix on `main`. CI on `main` was red: `ubuntu-latest` became 26.04 and Playwright 1.56.1 cannot install browsers there. Fixed by PR 23 (browser jobs on `ubuntu-24.04`). Then shard 2 of 4 hit the 8-minute limit (passed on a re-run, about 7 min 21 s), so PR 24 made it 5 shards (slowest job 5 min 6 s). Owner said yes to both (D569). The five-shard run on `main` after the merge (run 604) is green: slowest job 5 min 15 s.
- **Owner gate:** owner said yes (D568); D557–D567 `Decided`. "Four shards" became "five" in the flesh-out files first.
- **Finds:** 47 find/replace pairs checked by machine, each exactly once (GDD 23, plan 7, questions 5, technical design 12; the files say 21 and 11, a miscount). Applied.
- **Sweep:** `Proposed` from D519 up: only D529 and D535, both covered by D557. Nothing else to ask.
- **Also applied:** D557–D569 in `decisions.md`; `descent.*` keys in `balance.ts` (stageTiers and unlitBaseHealth are marked placeholders); six names in `names.ts`; three `CLAUDE.md` rules; `progress.md` archived (was 108 KB).
- **Not done:** `lore-secrets.md` §34.11 (last §34 subsection is §34.10): the approved wording of D-01 to D-07 and the 3 resident lines is not in the repo. Q60 asks; TD.3 is `[?]` for that part only.
- **Test edits (owner said yes, 2026-10-28):** `tests/content/vigil-text.test.ts` now ends its §9.23 cut at the next `###` heading (not on D566's list; §9.24 follows §9.23 now; nothing loosened). `tests/orders/opening.test.ts` lists `v13-owner.json` (D566 (2)). Your save `v13-owner.json` is in; reformatted with Prettier only, data hash identical.
- **Waiting on you:** Q60 (the approved Descent wording). TD.2 can start.

## 2026-10-28 — v1.4 TD.2: save schema 14
- **Done (tests first, 30 new tests in `tests/saves/v14-migration.test.ts`):** schema 13 → 14; `state.descent` (types in `state/descent-state.ts`); `save/migration-v14.ts` adds only the empty block; `save/validate-descent.ts`; `'descent'` is a third ending id (any order, one of each; `remembering.choose` refuses it); the Long Night keeps the block (a test). `v14.json` is your v1.3 save migrated, not played (`scripts/make-v14-fixtures.ts`). `v13-owner.json` loads, validates and round-trips with every other fixture; golden fights and recorded stands replay; schema 15 is refused.
- **Size (SF.9 method, sum of per-file gzip -9 of `dist`):** 441,322 bytes, +988 for TD.2 (440,334 before); 173,078 under 614,400.
- **Ids:** the technical design names two stage monsters `unlit-breath` and `forgotten`; the repo's ids are `unlits-breath` and `the-forgotten`. I used the repo's. TD.4 should read them the same way.
- **Old-test edits (D566):** (1) schema 13 → 14 and newer-version guard 14 → 15 in `v12-migration` and `v13-migration` tests; (2) `v14.json` in `opening.test.ts`'s list. **My reading of (3), please say if wrong:** `choose.test.ts` and `v11-migration.test.ts` used `'descent'` as their made-up ending; it is real now, so both use `'banner'` (assertions unchanged).
- **Not done / later:** `v14-played.json` (TD.4b); the non-coupling lint entry and command lists (D566 (5), (7)) come with the code that needs them.

## 2026-10-28 — v1.4 Q60 answered (docs only)
- The owner pasted the approved wording of D-01 to D-07 and the three resident lines. Written word for word as `lore-secrets.md` §34.11 (the end of §34 and of the file), D570. Q60 closed; TD.3 is no longer `[?]`.

## 2026-10-28 — v1.4 TD.3: The Unlit, story texts, strings, the learned bonus
- **Done (tests first):** `src/content/unlit.ts` (stats, resistances, First Cold, Heavy Dark with Chill, Great Beasts lines, `descentOnly: true`; Health reads `descent.unlitBaseHealth`); `story/descent.ts` (D-01 to D-07 and the 3 resident lines, word for word from §34.11); `descent-text.ts` (the 26 GDD §9.24 strings); `core/systems/descent.ts` `learnedBonus(state)`: Might, Health and damage taken, with the breakdown tree from the same function and the active Delve relics (Whorl, Nail, Lantern, Salt Ring).
- **Tests:** `descent-text` (cards and lines equal the lore file paragraph by paragraph; forbidden words, digits, the forty names, allowed people; strings equal the GDD table both ways), `unlit`, `descent/learned-bonus` (9 states added up by hand), `descent/unlit-no-leak` (guardian draws, floor groups, candidates, stand waves and the Forgotten's count hash-identical to before). Names, §7 keys and every golden fight and recorded stand pass unchanged; `rulesVersion` 5.
- **Old tests edited:** none.
- **Decision to confirm, D571 (Proposed):** The Unlit sits beside the species lists (not in `MONSTER_IDS`), re-exported from `monsters.ts`; this is what keeps it out of every draw. Its abilities have their own types, so no combat code changed.
- **Please check:** percents print with up to two decimals (GDD §9.24 gives no rounding rule). The headline "+m%" is the learned sum only; Spindle Whorl, Cold Iron Nail, Rift Lantern and Salt Ring are listed under "Active Delve relics:" and applied by the fight in TD.4a, so they are not counted twice.
- **Placeholders:** `descent.stageTiers` and `descent.unlitBaseHealth` stay placeholders until TD.9. Names were already in `names.ts` (TD.1); nothing new needed.
- **Not done / later:** the Unlit's art (TD.5), the engine (TD.4a), the UI (TD.7).

## 2026-10-28 — v1.4 TD.4a: the Descent fight engine and The Unlit's abilities
- **Done (tests first, 24 new tests in `tests/descent/descent-fight.test.ts`):** `runDescent` in `core/systems/descent-fight.ts`: three stages, front line of 6, reserve of 8, step-ins between stages (slot order, full Health) and mid-stage (up to 6 at once, meter 0, start-of-fight potions and meter traits on entry), 20% recovery (30% with the Rift Lantern), learned bonus and Delve relics applied, Salt Ring on Deep monsters, automatic bombs (up to 2 per stage), potions and "once" skills across all 3 stages, 400-tick limit. Stage seeds `${seed}:stage:n`.
- **The Unlit:** First Cold (3% Frost, 15 meter) and Heavy Dark (every 3rd action, sweep, Chill) work in a normal fight; Saltburst cancels the first trigger and blocks 3 actions; Smoke-Lunged halves First Cold; the Crook clears Chill (the old rule reads the same fields).
- **Ordinary fight code touched only by exports and extractions** (`runTicks`, `startPotion`, `throwBomb`, `resolveEnds` exported; the `unlit` instance in `species.ts`). `npm run check` green (3,649 tests, 85 s): every golden fight and recorded stand replays; `rulesVersion` 5. No old test edited.
- **Decisions to confirm:** D572 records your yes to D571. D573 (Proposed) lists six small readings: when First Cold fires, who Heavy Dark chills, which monster each bomb hits, potions used once, the sign of the frozen cut, the extractions.
- **Not done / later:** the command, the frozen record and `rebuildDescentLogs` (TD.4b); preview (TD.4c); the debug roster (TD.4b).

## 2026-10-28 — v1.4 TD.4b: the Descent command, the frozen record, the debug path
- **Done (tests first, 22 new tests in `tests/descent/start.test.ts`, 5 in `tests/lint/descent-coupling.test.ts`):** `descent.start` through `apply()`; refused when the gate is closed, below Bastion, empty, duplicate, unowned, over 14, on a contract or in a Delve, or the stores cannot pay. A win records `'descent'` once, sets `firstWin`, `last`, `unlitMet`; nothing else in the hold moves (compared whole). A loss spends what was thrown, records `last`, and retries at once.
- **Record and rebuild:** every combat input is frozen on the record; `rebuildDescentLogs(record)` re-runs the 3 stages with logs and agrees line for line, and a test wipes levels, gear, relics and the bestiary first.
- **Debug:** `debug.prepareEndgameRoster` (14 hunters Master-Wright, 5 stars, 5 talents, Wright gear, 16/16 Mastered, 36/36 properties, 40/40 skills, 16/16 chapters, 12 relics, stocked stores; idempotent) and `debug.descentWin` (real stand if needed, gate, Bastion, real attempts). `v14-played.json` made by `scripts/make-v14-fixtures.ts`; it won on attempt 1 with 0 hunters downed, so the placeholder constants are far too easy (TD.9 calibrates).
- **Save growth (M4):** one record about 6.0 KB (1.4 KB gzipped); `descent` with two records about 12.1 KB (1.5 KB gzipped); above the 4 KB sketch, so D575 (Proposed) asks you to approve a GDD §6.5 row. **Size:** 446,693 bytes (+5,371 since TD.2), 167,707 under 614,400.
- **Old tests edited (D566):** (2) `opening.test.ts` lists `v14-played.json` among the played saves; (5) new non-coupling test (`descent-coupling`); (7) no existing test lists every command, so nothing to add. My own TD.2 test `v14-migration` now also replays `v14-played.json`'s golden fights. Nothing loosened. `npm run check` green (3,675 tests).
- **Not done / later:** Suggest, preview worker, benchmark (TD.4c); the `unreadResult` clearing command comes with the UI (TD.7b).

## 2026-10-28 — v1.4 TD.4c: Suggest marching order, the preview worker, the benchmark
- **Done (tests first, 9 new tests in `tests/descent/preview.test.ts`):** `suggestDescentOrder(state)` (`descent-order.ts`): everyone who can march; the best Vanguard and best Mender take front places, the other front places go to the highest levels (ties in roster order), the rest wait in the reserve by level. The debug path now uses it instead of its own copy.
- **Preview:** `previewDescent` (`descent-odds.ts`) runs `descent.previewSamples` (100) real engine runs on seeds `gameSeed:descentodds:attempt:i` (stages `…:stage:1|2|3`), never the real attempt's seed. The seed does not depend on party or prep, so compared orders share dice. Returns win chance with margin, median stages cleared and outcome, hunters downed (median, 10th to 90th), and a Why? tree. A test recomputes all of it from 100 direct engine runs and gets the same numbers.
- **Worker and client:** worker kind `descentPreview` (the existing message shape is `{ id, kind, input }`, so I followed it rather than `type`/`requestId`; same meaning). `requestDescentPreview` drops stale requests (older answers resolve to nothing); with no worker it runs 20 runs as a "quick estimate".
- **Benchmark:** `Descent preview` in `bench.spec.ts` and `bench-page.ts`, budget 1,500 ms (fails at 2x). Measured 340 ms at 4x slowdown, 14 hunters. The placeholder constants make fights easy, so TD.10 measures again.
- **Checks:** `npm run check` green (3,684 tests, 78 s). Golden fights and recorded stands replay; `rulesVersion` 5. No old test edited. The lint READERS list needs no new file: none of the new core files reads `state.descent`.
- **Container note:** `npm ci` was needed here, and the bench browser had to be pointed at `/opt/pw-browsers/chromium` with a throwaway config (not committed).
- **Not done / later:** the preview's screen (TD.7), the Descent's art (TD.5).

## 2026-10-28 — v1.4 TD.7a: The Remembering card and the Descent sheet
- **Card (GDD §9.24, S3, S6):** new form `afterDescent`; The Descent / Fight the Descent again show only when the gate is open and the hold is at Bastion. Forms for nothing chosen, vigil, remember, descent, descent + vigil and descent + remember are tested in `tests/descent/view.test.ts` and, in the browser, `tests/e2e/descent-sheet.spec.ts`. The facts (`descentAvailable`, `descentWon`, `vigilChosen`) come from the core view.
- **Sheet:** `DescentSheet.tsx`: subtitle, three stage lines, the learned line with ⓘ / long-press (five contributors, then Active Delve relics), Suggest, front 6 and reserve with tap-to-swap, Unavailable hunters with reasons, oil/potion pickers, the bombs note, the worker preview (three lines) and Start. Core side: `descent-view.ts` (`descentSheetView`, `descentPreviewLines`); the UI computes nothing.
- **Tests:** 8 unit, 8 Playwright at 320 px at Largest (card forms; stages; swap and Suggest; preview from the worker; no sideways scroll; tap sizes; breakdown). New screen flow `descent` in `polish-screens.ts` (tap, text-size and contrast sweeps pass for it).
- **Debug:** two buttons added (Prepare endgame roster, Win the Descent).
- **Checks:** `npm run check` green (3,692 tests, 82 s; one cold run was 90 s). Golden fights unchanged; `rulesVersion` 5; no old test edited.
- **Readings to confirm:** (1) no stage banners yet, because the art is TD.5; text only. (2) After Start the sheet just closes: playback, story cards and the result sheet are TD.7b. (3) Two labels not in the §9.24 table: the **Suggest** button and "(quick estimate)" when no worker runs. (4) The Descent button on the open form has no description line.
- **Not done / later:** playback, result sheet, sounds, Roll mark, Library replay (TD.7b/c).

## 2026-10-28 — v1.4 TD.5: the Descent's five pictures and the contact sheet
- **Drawn in code** (`tools/draw-descent.ts`, written by `tools/gen-descent.ts`, 32-colour palette): The Unlit's 64 px portrait and 32 px battle strip (hooded cold, rime crown, hem of threads, one small warm spark), and three 160 × 64 banners: The Crack, The Sealed Stair, Below the Seal. No lettering; the last banner's rime only suggests writing.
- **Manifest:** five rows in `assets.ts`. Files follow the repo's naming (`portraits/monster-unlit.png`, `sprites/monster-unlit.png`, `scenes/descent-stage-N.png`), not the `monsters/` folders the technical design sketches; please say if you want those.
- **Contact sheet (shown in the conversation):** `docs/flesh-out/v1.4/contact-sheets/descent.png`, numbered 1 to 5 on its own (`contact-sheet.ts --descent-sheets`), on both backgrounds; empty marks table in `docs/flesh-out/v1.4/art-marks.md`. 1 portrait, 2 battle sprite, 3 to 5 the banners.
- **Tests:** 9 new in `tests/tools/descent-art.test.ts` (each file equals its generator, size, palette, five different frames, own numbering). v1.0 and v1.1 hash tests pass unchanged; credits regenerated.
- **Old test edited (D566 (6)):** `contact-sheet.test.ts`: its two "every generated row" filters also skip the v1.4 pictures, so the v1.0 numbers 1–156 stay put. Nothing loosened.
- **Size (SF.9 method):** 451,041 bytes (includes TD.4c and TD.7a code); 163,359 under 614,400.
- **Waiting on you:** Keep or Redraw for pictures 1 to 5. Hashes are frozen in `art-src/v1.4-hashes.json` at TD.6 once all five are approved.

## 2026-10-28 — v1.4 TD.6 draft: the five pictures redrawn
- **Marks (your notes, written to `art-marks.md`):** all five Redraw. Done as written: void-dark hood and dripping frost threads (1); five drawn frames, not made from one base: idle 2 bob and tendril shift, lunge with the upper body 3 px left and a longer arm with a cyan tip, a solid flat downed cloak on the bottom edge with broken crown shards (2); rock to the top with a soft dither, frost only within 15 px of the crack, jagged diagonal micro-cracks both sides (3); a dark-iron anvil with horn, waist and base, and eight spokes, a notched rim and a hub on the seal (4); twelve different 3 × 5 runes with a dark-cyan halo and a vertical shadow gradient (5).
- **Sheet (shown in the conversation):** `docs/flesh-out/v1.4/before-after/descent.png`; the old pictures are kept in `art-src/previous-v1.4/`. New tool `tools/before-after-descent.ts`.
- **Checks:** `npm run check` green (3,700 tests). Existing art tests (file equals generator, palette, size) pass on the new pictures. v1.0 and v1.1 hashes unchanged.
- **Not done, on purpose:** `art-src/v1.4-hashes.json` and its test wait for your approval of this sheet (CLAUDE.md: redrawn art ships only after approval).

## 2026-10-28 — v1.4 TD.6 closed, TD.7b: playback, story cards, sound cues, result sheet
- **TD.6:** you approved the art; `art-src/v1.4-hashes.json` (five hashes) is frozen with a test in `descent-art.test.ts`.
- **Playback (tests first, 9 new unit tests in `tests/descent/playback.test.ts`):** `descent-playback.ts` rebuilds the three stages from the saved record alone and shapes them for the screen: cards D-01 to D-06 around the stages (D-07 on a loss), the stage heading, banner, the log lines, who is on the field after each step (a mid-stage step-in replaces the front line), and the result heading and summary. The sheet (`DescentPlayback.tsx`) reuses the Delve's playback view (Skip, Log, Continue) with the stage banner above the arena. Cards word for word from the lore file.
- **Sound (UI only):** Stage 1 and 2 cleared play `win`, Stage 3 `fanfare`, a loss `lose`, cards and logs silent. I used the existing play-by-id call, so the 15 moments and their test are untouched.
- **Result sheet:** heading, summary, and a log button for each stage reached. Reaching it marks the result as seen (new command `descent.markRead`). Closing early leaves it unread: the card shows **View Descent result**, which opens the result sheet directly (also after a reload).
- **Tests (Playwright, 360 px):** a full win with every card and the cues `win, win, fanfare`; a loss (hunters at level 1, no gear) with D-07, `Driven back at Stage 2.` and `win, lose`; a playback closed early, a reload, and the card's button. Polish sweeps (tap size, text size, contrast) pass on the new screens, added to the `descent` flow.
- **Small changes to my own earlier code:** the stage run now also lists everyone who fought and the mid-stage step-in ticks (additive; every golden fight and recorded stand replays; `rulesVersion` 5); the Delve playback view takes optional banner, outcome and opening-line props (the Delve's own look is unchanged). `descent-playback.ts` joins the lint list of files allowed to read `state.descent`. No old test edited.
- **Readings to confirm:** (1) the banner sits above the arena, not behind the sprites, so names and bars keep their contrast; (2) "View Descent result" is the plain text GDD §9.24 names and is kept outside the string table; (3) with the placeholder constants even level-1 hunters win from the played fixture, so the loss test strips gear and ranks.
- **Size (SF.9 method):** 453,208 bytes; 161,192 under 614,400. `npm run check` 88 s, 3,710 tests.

## 2026-10-28 — v1.4 TD.7c: Roll mark, Library replay, resident lines, The Unlit on the shelf
- **Roll of Wardens:** the warden in office when The Descent was first won gets a small stair mark drawn in code (inline SVG) and *"Led the Descent."* Read from the saved ending's cycle, so nothing new reads `state.descent`.
- **Library:** the Remembering shelf gains **The Descent** (title only: GDD §9.24 gives no blurb). It replays D-01 to D-06, then offers the three stage logs, all rebuilt from `descent.firstWin`; a later attempt never changes it, and it is not an attempt.
- **Resident lines:** one pool per ending: the eight after Remember Them, the three of lore §34.11 after the Descent, all eleven after both (still one line a session). The ordinary lines keep their own triggers, which is how the pools rotate.
- **Great Beasts shelf:** The Unlit appears once Stage 3 has been reached (`unlitMet`), with stats, weaknesses, resistances, abilities, "What it was" and its notebook line.
- **Tests:** 6 new unit tests (`tests/descent/shelves.test.ts`), 3 Playwright (`descent-shelves.spec.ts`: Roll mark, Library replay with logs, Unlit entry). New polish screen `roll-marks` (fixture `v14-played:marks`: lamp, Rising Vigil level 2 and Descent marks together); tap-size, text-size and contrast sweeps pass for it and the earlier Descent screens. `npm run check` green (3,716 tests, 88 s). Golden fights replay; `rulesVersion` 5; no old test edited.
- **Readings to confirm:** (1) the Library entry has no blurb; (2) the Unlit entry reuses the notes already written in `unlit.ts` (TD.3); (3) the shelf shows the Unlit even if the Events card has not opened.
- **Owner task now (plan):** look at the Descent sheet, playback and strings on the preview and say yes, or what to change.

## 2026-10-28 — v1.4 TD.8a: the endgame roster builder
- **Scope reading:** the plan's TD.8a is the roster builder (`sim/descent-roster.ts`); the probe itself is TD.8b. I built the former only.
- **Built:** `buildEndgameRoster(state, profile)`. Both profiles open the gate and take the hold to Bastion (same steps as `debug.descentWin`). *Maxed* calls the core `prepareEndgameRoster`, the same function as the debug button, so they cannot drift. *Minimal* sets all 16 species to exactly Studied (none Mastered) and leaves hunters, skills, Orders and relics as the run left them.
- **Tests (10, `sim/descent-roster.test.ts`):** both profiles deterministic, idempotent, valid after a save round-trip, able to start a Descent; minimal and maxed match their specs (14 hunters at Master Wright, 5 stars, 5 talents, 36 properties, 4 skills x 10 levels = 40, 4 Orders x 4 chapters = 16, 6 + 6 relics).
- **Notes:** the "12 relics" are the 6 Hold relics plus the 6 Delve relics, and "40 skills" is 4 skills at level 10. Minimal gets its Act VI stand from the real stand code, so some hunters level a little; chapters read are 0 only on a state that had none (new game). No policy issues `descent.start`; no report changes.
- **No old test edited, no constant, target or fixture touched. `rulesVersion` 5.**
