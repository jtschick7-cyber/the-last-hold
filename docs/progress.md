# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.4` (from `main` at the PR 24 merge). The Claude session branch for this thread is `claude/dreamy-cerf-sg227v`.
- **Milestone:** v1.4 "The Descent" (D557–D569), in progress. v1.3 is merged, tagged `v1.3.0` and accepted (D556).
- **Last task:** TD.4a (the Descent fight engine, The Unlit's abilities). Before it: TD.3, TD.2, TD.1.
- **Next:** TD.4b (the `descent.start` command, the frozen record, log rebuild, `v14-played.json`). TD.5 (art) can also run.
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
