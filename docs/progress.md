# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.5` (from `main` at `69157f7`, which holds the v1.4 merge). The Claude session branch for this thread is `claude/serene-johnson-vq5dt0`.
- **Milestone:** v1.5 "The Breach" (D579–D595), in progress. v1.4 is merged, tagged `v1.4.0` and accepted (D578).
- **Last task:** TB.7a (the preview carries the lanes). Before it: TB.6 to TB.1.
- **Next:** TB.7b (Suggest layout; needs TB.3). TB.8a needs TB.4 and TB.7a, so it can follow.
- **Open questions:** Q61 and Q62 answered yes (D595). Q63 opens after TB.12. Size: 452,544 bytes at TB.2 (457,443 at v1.4; about 162 KB under the row).

Earlier entries are in [`docs/archive/progress-2026-10-24-to-28.md`](archive/progress-2026-10-24-to-28.md) (v1.3 KV.11 to v1.4 TD.10), [`docs/archive/progress-2026-10-11-to-15.md`](archive/progress-2026-10-11-to-15.md) (to T8.15), [`docs/archive/progress-2026-10-15-to-21.md`](archive/progress-2026-10-15-to-21.md) (T8.16 to T11.15) and [`docs/archive/progress-2026-10-21-to-24.md`](archive/progress-2026-10-21-to-24.md) (v0.11 session 17 to v1.3 KV.10). Read only the last entry at session start.

## 2026-10-28 — v1.4 TD.11: wrap-up and the pull request
- **Open the real saves (new `descent-open.spec.ts`, 3 tests):** your v13 save and the same save after the v14 migration open with the gate closed (no Descent button anywhere), then with Act VI finished and the gate open the card offers The Descent and the sheet opens; the played v14 save opens and shows its Descent. No page errors. All pass.
- **e2e, five shards here (local chromium):** 130 s, 190 s, 384 s, 173 s, 142 s (slowest 6 min 24 s, under the 8-minute ceiling). Two failures, both explained: (1) WebKit determinism: this container has no WebKit and my throwaway config pointed it at chromium; the chromium determinism test passes; CI is the judge. (2) `descent-sheet.spec.ts` "no Descent button below Bastion" (my TD.7a test): it counted "View Descent result", which the card shows for any finished unviewed Descent. It failed the same way at the TD.7c commit, so it predates TD.8 to TD.10. I narrowed the test to the two buttons that start a Descent (the same intent; nothing loosened); the file's 8 tests pass.
- **Offline reload on the production build:** the smoke tests pass, and the `sw.js` duplicate-hash test is in `npm run check` (green).
- **Simulator:** full `sim:check` at TD.9 (466 s): 60 of 60 rows, 192 of 192 moments same; no code in `src/` or `sim/` has changed since. Vigil shard 105 s.
- **Numbers:** build 457,443 bytes (156,957 under the row); `npm run check` 131 s here (117 s at TD.7c on the same machine today; CI is the judge, accepted by you).
- **Not done, waiting on you:** the playtest, then `sim:accept`, merge, tag. Status stays "in progress" until the merge.

## 2026-10-28 — v1.4 milestone end
- **The owner said the playtest passed** and that their save was exported.
- **`sim:accept`** (470 s here): the baseline moves to v1.4; the only differences are the milestone and the two new rows. Plan `Status: complete`, D578.
- **Left:** the owner tags `v1.4.0` by hand after the merge.
- **A CI flake, fixed:** on the last push, `descent-playback.spec.ts` (full win, loss) failed in one CI run and passed in the other run of the same commit. Cause: the sound player merges cues asked for within 150 ms (D521), and a fast runner skips stages quicker than a player. The test now waits 250 ms after each Skip; nothing else changed, and 9 of 9 runs pass here.

## 2026-10-28 — v1.5 TB.1: docs commit (flesh-out applied)
- **Preconditions all held:** tag `v1.4.0` is the v1.4 merge; `main` contains it; baseline last moved at D578; CI on `main` green; e2e shards 1:42 to 5:05 (each under 8 min); sim runs about 3.5 min. `milestone/v1.5` made from `main` and pushed.
- **Owner gate:** Q61 yes, Q62 yes, D595 yes. D579–D595 added to `decisions.md` already `Decided` (no old row touched). Q61 and Q62 answers recorded in `questions.md`; Q59 closed.
- **Applied:** OUT-2a (22 edits) to the GDD, OUT-9 (12) to the technical design, OUT-5, OUT-4a A–F to the plan; every Find matched exactly once. Nine `breach.*` keys added to `balance.ts` (lanes, frontRows locked; the rest tunable placeholders).
- **CLAUDE.md:** replaced "In v1.1, `state.layout` is decorative only: … (`rulesVersion` stays 5)." with the four v1.5 rules; also edited "beyond the table in GDD §9.21" (now §9.21 and §9.25), "(`rulesVersion` stays 5, save schema stays 12)" (deleted) and "(`rulesVersion` stays 5, D561)" (now "the Descent's fight path is isolated, D561").
- **Housekeeping:** TD.1 ticked; GDD §6.2 Descent rows no longer say "Proposed:" (D577); §6.5 download row gains v1.4's 457,443 bytes; §0.7 gains the v1.4 actual (18 entries) and the v1.5 sizing note.
- **Sweep:** `| Proposed |` from D519 up found only D529, D535, D571, D573, D575, all covered by D579. No other.
- **Names:** searched the web 2026-10-28; no collision (lanes, cover, reach, stacked, tactician, The Breach are generic or plan-only). Dated in `names.ts`.
- **One extra old-test edit (you approved):** `descent-text.test.ts` now stops reading the GDD at §9.25 instead of §10, so the Breach strings are not read as Descent strings. Same checks, nothing loosened.
- **Numbers:** `npm run check` green, 88.5 s here. This container had no `node_modules` at first; `npm ci` fixed the format check (a stale prettier, not a repo problem).

## 2026-10-28 — v1.5 TB.2: save schema 15, the migration and your real v14 save
- **Your save:** `v14-owner.json` is your real v1.4 save (schema 14, cycle 2, Bastion, 40 placed pieces). `v15.json` is that save migrated, not played (`scripts/make-v15-fixtures.ts`). Your layout comes through unchanged.
- **Schema 14 → 15:** the number moves and nothing else. No old stand gets a lane table, so every recorded stand still replays under the version 5 rules. `rulesVersion` stays 5 until TB.5.
- **Lane table:** the stand record can now hold an optional table (`lanes`). A bad table refuses the load; an unknown field is dropped with a warning. The shape sizes equal the locked lane and front-row counts (a test keeps them equal).
- **Tests (first):** new `v15-migration.test.ts`: all fixtures load, round-trip, keep layout and fights; 27 malformed-table cases refuse; a 3-tower table is under 0.4 KB; newer-version guard refuses 16; step under 100 ms.
- **Old-test edits (D593):** (a) schema numbers 14 → 15 and "newer" 15 → 16 in `v12-`, `v13-` and `v14-migration.test.ts` (numbers only); (b) `v14-owner.json` and `v15.json` added to the fixture list in `opening.test.ts` (`saves.test.ts` picks fixtures up by itself). Nothing loosened.
- **Numbers:** `npm run check` green, 93.2 s here (warn at 90, fail at 120). Size 452,544 bytes (per-file gzip -9 of `dist`, my own sum; v1.4 measured 457,443 by its own run, so the two may differ a little in method).
- **Deferred:** `v15-played.json` (TB.10); the benchmark row for the migration (TB.14).

## 2026-10-28 — v1.5 TB.3: the lane, cover, depth and volley maths
- **Built, not yet in any fight:** new `src/core/systems/breach.ts`: the lane of a wave, the counted pieces (active walls and towers in rows 0 to 2), the lane table a stand will freeze, cover (own 50% plus 25% a neighbour, ruined edge counts), depth, the wall cut, the shared volley, each with its breakdown from the same function, and the strip's view. The wave number is counted from 1, as the species picks count.
- **Strings:** `src/content/breach-text.ts` holds the nine §9.25 breakdown lines, word for word (a test checks them against the GDD). No other string.
- **Constants:** the nine `breach.*` keys were already in `balance.ts` (TB.1); each is read in one file under `src/core` (a test enforces it). Placeholders stay placeholders until TB.13.
- **One detail for you to know:** the lint allows only 0, 1, 2 and 100 as plain numbers there, so the volley is worked with reach and scale in hundredths, not quarters. It gives exactly the same whole numbers as the quarters order in the design (both sides scale by 25).
- **Tests first:** 60-odd new tests: worked lane lists, species picks unchanged, every one of the 256 column patterns for cover, 2% per level with full cover, worked volley tables (1, 2, 3 towers, floor, scale and reach changes, Tray tower dilutes nothing, an upgrade never lowers a lane), the 25 breakdown lines, the view and its memo. Planted reads of the layout from stand, combat, economy, contracts and advance code fail; nothing in `src/ui` may import a formula.
- **Old-test edit (D593 c):** `systems/breach.ts` added to the allowed readers in `tests/layout/layout.test.ts`. A stale comment in `layout.ts` was updated.
- **Numbers:** `npm run check` green, 94.8 s here (warn at 90, fail at 120; CI is the judge). Every golden fight and recorded stand still replays (they are in `check`).
- **Not done:** nothing is wired into combat or the wave list (TB.4, TB.5); no UI.

## 2026-10-28 — v1.5 TB.4: lanes in the wave list
- **Built:** a new core function (`standWaves` in `breach.ts`) gives each wave of the stand list its lane from `laneOf` of the stand seed; below Bastion the lane is empty. The stand screen's wave list now reads it and shows "Lane {n}" (1 to 8) after the tier, "?" species too. Species and tiers come from the same list as before.
- **Not touched:** the layout is never read (the lane depends on the seed alone); no fight, preview or save changes; no new strings (the tag is the §9.25 line already in `breach-text.ts`).
- **Tests first:** new `tests/breach/wave-lanes.test.ts` (same lanes on every call, unchanged after any layout change, species and tiers equal to v1.4's list for four seeds, no lane at Hamlet, Keep or Citadel). New `tests/e2e/wave-lanes.spec.ts` (phone): the first 12 waves each show "Lane 1" to "Lane 8" including a "?" wave; on a Keep save no lane text appears. Both pass here in chromium (the container's browser needed a throwaway config; nothing committed for that).
- **Weak spot:** the "before Bastion" browser check does not open the stand screen (it opens only at Bastion); the unit test covers the gating.
- **Old-test edits:** none. The layout lint tests stay green.
- **Numbers:** `npm run check` green, 80 s here (warn at 90, fail at 120; CI is the judge).
- **Not done:** TB.5 onward.

## 2026-10-28 — v1.5 TB.5: the stand fight reads the lane table; rules version 6
- **Built:** the stand fight takes the optional lane table. Absent: the old path, unchanged. Present: each wave's lane (from the stand seed) gives its wall cut (in the taken% bucket, under the 75% cap) and its volley (replacing the flat one). Each wave of such a stand also carries the lane's Walls and volley breakdowns (cover and depth lines from the same function). A record with a table rebuilds with it; one without replays as version 5. Nothing makes a table yet (Start does at TB.6), so no real stand changes.
- **Rules version is now 6.** Replay was already by result, so records stamped 5 or 6 replay either way.
- **Tests first** (`tests/stand/lanes-fight.test.ts`): the two equality tests with version 5, an empty table differs as the rules say, per-wave lane numbers, breakdown lines, rebuild from a record, the 75% cap counted on a deep-wall fixture. New `layout-isolation.test.ts`: the same five days of contracts with the layout cleared or not give identical states. Every golden fight and recorded stand still replay line for line.
- **Old-test edits (you approved, number and wording only):** the golden test's version line 5 → 6 (Q62), and the same number in `events`, `use-skills`, the Descent start test, and the v9, v11, v12, v13, v14, v15 migration tests (titles that said "stays 5" now say 6).
- **Numbers:** `npm run check` green, 82 s here (warn 90, fail 120).
- **Weak spots:** the cap test works the sums by hand rather than running a full fight under the cap; the isolation test covers contracts and time, while events, Delves, bosses, hunts and the Descent are kept off the layout by the lint.
- **Not done:** TB.6 onward. Size was not measured (due at TB.6).

## 2026-10-28 — v1.5 TB.6: Start freezes the lane table
- **Built:** from Bastion, Start saves the lane table on the stand's record in the step that fixes its other inputs (that makes it a version 6 stand). The layout is read only by `breach.ts`, called from the stand input builder, so `stand.ts` never reads it and no split was needed. A stand made below Bastion (the v0.4 arrival) saves none and takes the version 5 path. The preview uses the table the layout gives now.
- **Log header:** a version 6 wave log opens with "Lane {n} · cover {p}%" (the GDD §9.25 string, added to `breach-text.ts`; checked against the GDD in the new tests). Older stands show none.
- **Test-only start option:** a start flag that freezes no table. It is refused unless a test switches it on (no screen does) and it marks the save as debug-used.
- **Tests first** (`tests/stand/freeze.test.ts`, 9): the saved table equals the layout's; the layout is identical before and after Start; a second Start is refused and the first table stays; the preview changes nothing; below Bastion no table; logs rebuild identical after the layout is cleared and after `balance.breach` is changed; a record without a table rebuilds as version 5; the header; the option is refused unless switched on. All golden fights and recorded stands still replay line for line.
- **Old-test edit (D593 f):** one test, `stand-story.test.ts` "a Triumphant stand records the steps" (it needs exactly 20 waves held, which a stand with no walls placed no longer reaches), is pinned to the version 5 path with its assertions unchanged. Its version 6 counterpart is new: a table stand records the steps its band brought. Only this one test changed result; the rest of the suite passed as it was.
- **Numbers:** `npm run check` green, 80 s here (warn 90, fail 120). Size 458,266 bytes (614,400 row; 452,544 at TB.2).
- **Heads-up:** simulator stands now fight version 6 with whatever layout the policy has, so `sim:check` will differ from the v1.4 baseline until TB.11a re-records it. I did not run the full `sim:check`; the fast set in `npm run check` passes.
- **Not done:** TB.7a onward; no browser test for the log header line yet.

## 2026-10-28 — v1.5 TB.7a: the preview and the worker carry the lanes
- **Mostly already true from TB.6:** the preview request is built by the same function as the real stand's input, so it carries the lane table the layout gives now and the real stand's seed. Practice stands draw species and dice from their own seeds and, because the lane of wave n comes from the real seed, take the real stand's lanes. No worker or protocol change was needed: it computes each lane on demand.
- **New here:** (1) the Last Stand preview request now drops stale answers (an older request that finishes after a newer one gets nothing back, as the Descent preview does); (2) the stand screen's refresh key includes the lane table, read from the core's request, so moving a piece works the preview out again.
- **Tests first** (`tests/stand/preview-lanes.test.ts`, 6): the request carries the table and seed and no layout; with the Auto-arrange layout the preview equals 100 practice stands run by hand (median, 10th and 90th); lifting the defenses changes the preview; with every defense in the Tray the table counts nothing and the preview is no better; same seeds give the same preview; a stale request gets null.
- **Old-test edits:** none.
- **Timing:** unthrottled, 100 practice stands of six level-8-or-so hunters with full defenses take 252 ms with a table and 172 ms without (the stands last longer). I did not change the bench page (its input has no table, and editing it is not on the pre-approved list), so CI's throttled bench still measures the old path; the 4× throttle puts this about at the 1 s budget, inside the 2× ceiling the bench enforces.
- **Numbers:** `npm run check` green, 83 s here (warn 90, fail 120); no size measurement due (TB.8a).
- **Not done:** the bench measuring the table path (asks for your yes to extend `bench-page.ts`); no browser test for the preview refreshing on a piece move (the Arrange Hold sheet and the strip come in TB.8a/8b).
