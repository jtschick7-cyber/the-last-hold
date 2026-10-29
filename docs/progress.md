# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.5` (from `main` at `69157f7`, which holds the v1.4 merge). The Claude session branch for this thread is `claude/serene-johnson-vq5dt0`.
- **Milestone:** v1.5 "The Breach" (D579–D595), in progress. v1.4 is merged, tagged `v1.4.0` and accepted (D578).
- **Last task:** TB.11b (the Tactician, the probe, the `breach` shard). Before it: TB.11a (baseline re-recorded once at rules version 6; Rising Vigil retuned, D596) to TB.1.
- **Next:** TB.12 (calibration command and report; Q63 opens after it). Owner task done: the owner said yes to the Breach strings as built (2026-10-29).
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

## 2026-10-28 — v1.5 TB.7b: Suggest layout (and the benchmark table you approved)
- **Built:** the one fixed rule, in core: it reads the lanes of the first `breach.suggestWaves` waves, counts waves per lane, and adds the defenses one at a time to free front-row tiles (no other building; ties: smaller row, then column), scoring cover with depth plus tower reach. A tower that would only lower the score waits for the end. It returns the list of moves and the scores, and changes nothing. The placement step is a small pure file (`breach-suggest.ts`); `breach.ts` reads the layout and gathers the inputs.
- **Auto-arrange comparison, one detail to know:** it compares with Auto-arrange's defense positions that stand on tiles Suggest may use, and returns those if higher. Auto-arrange also clears other buildings off the front rows, which Suggest never does, so a full Auto-arrange can still beat Suggest on a crowded front row. Where nothing is in the way (an empty or canonical hold, the two named fixtures), it is at least Auto-arrange's whole score, tested.
- **Tests first** (`tests/breach/suggest.test.ts`, 39): deterministic, no state change, only walls and towers, free front-row tiles, none twice, never past what is owned, on the `even` and `west-heavy` lists in four holds (empty, canonical, crowded, low levels); two hand-worked cases; the score equals an independent rebuild from the layout; the quick cover helper equals the breakdown builder on all 256 patterns. One worked expectation of mine was wrong and I corrected it from the sums (towers also give cover, so the third tower sits beside the stack).
- **Speed:** 0.6 ms unthrottled (budget 20 ms throttled).
- **Benchmark table (you said yes):** `bench-page.ts` now gives the stand preview a three-tower lane table. Throttled here: Last Stand preview 624 ms (budget 1 s, limit 2 s). The bench test as a whole fails in this container on the row "Suggest with 3 candidates and preparation" (about 594 to 637 ms against a 600 ms limit); it fails the same way on the v1.4 merge commit `69157f7` (637 and 624 ms), so it is this container's speed, not a change of mine. CI is the judge.
- **Old-test edits:** none beyond the bench page.
- **Not done:** the button and strip (TB.8a, TB.8b); the `layout.setDefenses` command (end of TB.8b, Q61).
- **Numbers:** `npm run check` green, 87 s here (warn 90, fail 120; 3,896 tests).

## 2026-10-28 — v1.5 TB.8a: the Lanes strip on Arrange Hold
- **Built:** from Bastion on, the Arrange Hold sheet shows the Lanes strip above the grid: eight boxes (Lane n, cover %, a dot per upcoming wave of the first 12), two rows of four below 600 px and one row of eight above. A Strip / List switch gives eight text lines. A tap on a lane (box or line) opens its breakdown sheet (Walls line with its cover and stacked lines, then the volley with each tower), and on return the pieces that cover the lane are lit on the grid with a dashed outline and a corner mark, no animation. Hint, help and empty-state lines are in. Nothing appears before Bastion.
- **Where the numbers come from:** only `laneView`, which now also says whether the strip shows (Bastion) and how many waves it looks at. The screen computes nothing.
- **Strings:** the strip, list, hint, help and empty-state strings and the forms of the waves list were added to `breach-text.ts` word for word, with a test against the GDD table. TB.9 checks the whole table.
- **Tests first:** `tests/e2e/lanes-strip.spec.ts` (14, phone): eight boxes with the right text and 12 dots; Clear to tray changes the strip to the empty state with 25% on the two edge lanes; a tap opens "Lane 4" and lights pieces (dashed, corner mark, no animation); the list equals the strip; no strip at Citadel; at 320, 360, 375 and 390 px, at match and Largest text, every control is at least 44 px, two rows of four, no sideways scroll; one row of eight at 900 px. Plus the string test and `lane-view-shown.test.ts`. All pass here in chromium.
- **Old-test edit (D593 d):** one flow, the Bastion Arrange Hold with the strip, appended to `polish-screens.ts`. Tap-target, contrast, Text size, motion and widths sweeps: 73 of 73 pass here (9.4 min, chromium). No baseline changed.
- **Numbers:** `npm run check` green, 81 s here (warn 90, fail 120). Size 459,884 bytes (614,400 row; 458,266 at TB.6).
- **Behaviour to know:** the lit lane is kept in memory so it survives the breakdown sheet closing; each visit from the Hold starts with nothing lit. The existing sheet already dropped a selected piece when another sheet opened over it.
- **Not done:** the strip on the Last Stand screen, the Arrange Hold button there, Suggest and Use this layout (TB.8b); the Start Tray line and the full string check (TB.9). No contrast check of the lit-piece marks was possible beyond the sweep.

## 2026-10-29 — v1.5 TB.8b: the strip on the Last Stand screen, Suggest layout, Use this layout
- **Last Stand screen:** the same Lanes strip, read only (a tap opens the numbers-only breakdown; nothing is lit), sits above the party slots, with the Arrange Hold button under it. The party and kit you chose wait while the sheet is open and are back when you return.
- **Arrange Hold sheet:** the Suggest layout button (from Bastion on, never disabled) shows the suggested spots as outlined tiles with a corner mark and the line "Suggested: about {n} waves (now about {m})." from two practice runs (now, and with the suggested table). It places nothing. The suggestion disappears if the hold changes after it.
- **Use this layout (Q61 yes):** new command `layout.setDefenses`, atomic: only walls and towers; front-row defenses not in the list go to the Tray; refuses the whole list (nothing changes) if a target is not a free front-row tile, a piece is not an unlocked wall or tower, or a piece or tile is listed twice. Its rules sit in `breach.ts` (the one file that reads the front rows); the command only calls them.
- **Tests first:** `tests/layout/set-defenses.test.ts` (13) and `tests/e2e/lanes-stand.spec.ts` (12, phone): strip equals the sheet's; party kept; Suggest places nothing and its line matches; a later move hides it; Use applies it in one tap and no other piece moves; 44 px and no sideways scroll at 320/360/375/390, both text sizes.
- **Old-test edits (D593 d):** one flow (Last Stand with the strip) appended to `polish-screens.ts`. D593 (e): no test listed every command, so none changed. Tap, contrast, motion, Text size, widths sweeps: 73 of 73; 38 neighbouring e2e pass. No baseline changed.
- **Numbers:** `npm run check` green but 92 s here (81 at TB.8a; warn 90, fail 120; CI is the judge). Size **467,137 bytes** (459,884 at TB.8a; row 614,400).
- **Not done / for TB.9:** the Start Tray line and the full string check. The Suggest line is left out when there is no hunter to preview with. One-autosave of Use this layout rests on its being one command (not separately measured).

## 2026-10-29 — v1.5 TB.9: the Start Tray line, the log header and the string check
- **Start confirmation:** if any unlocked wall or tower is in the Tray it adds "{n} defenses are in the Tray and give nothing." (or the "1 defense" form). With none it says nothing extra. It places nothing. The count comes from the core's lane view (new field), not from the screen.
- **Wave-log header:** it was already built at TB.5 (shown only when a wave carries a lane); this task added the browser proof. A stand started at Bastion shows "Lane {n} · cover {p}%" on its wave log. An older log has none: proved in core (`freeze`, `lanes-fight` tests) not in the browser, since no fixture offers an old stand log at Bastion; TB.10's v15 fixtures could add it.
- **String check (new `breach-text-all.test.ts`, 3):** the GDD table has 23 rows and 29 strings; every string in the code is in the table; every table string is in the code; nothing else.
- **Browser:** 2 new tests in `lanes-stand.spec.ts` (Tray line with defenses and with none, nothing placed; the log header). Passed. The Last Stand strip passed the five sweeps at TB.8b (73 of 73); I did not re-run them for the one added line.
- **Old-test edits:** none.
- **Numbers:** `npm run check` green, 89 s here (warn 90, fail 120). Size 467,258 bytes (row 614,400).
- **Owner task:** read the Breach strings as built (GDD §9.25 table) and say yes.
- **Owner said yes (2026-10-29)** to the Breach strings as built; the TB.9 owner task is closed.

## 2026-10-29 — v1.5 TB.10: the debug command and the played save
- **`debug.breach.freeze`:** a core command through `apply`; it marks `debugUsed` and changes nothing else. The debug panel gets a "Show the lane table" button that runs it and prints the table a stand started now would freeze (a core function builds the text; below Bastion it says "No lanes before Bastion."). There is no command that sets lanes (a test reads the command list). Debug commands are reached only from the panel. The button label and the line are debug-panel text, not game strings; say if you want them changed.
- **`v15-played.json`** (new `scripts/make-v15-played-fixture.ts`, real commands only, from `v15.json`): four stands from Bastion with a spread of holds: canonical; a few defenses placed on the front row with everything else in the Tray (`layout.place`); canonical with a wall and a tower in the Tray (`layout.unplace`); the suggestion applied (`layout.setDefenses`). Then the freeze read once. It also holds your older stand, which has no table.
- **Tests first:** `debug-freeze.test.ts` (4), `v15-played.test.ts` (3: the four tables differ, the Tray stand counts fewer pieces, every stand log rebuilds line for line with its header only when it has a table). This also proves an old stand's log has no header (the TB.9 gap, in core). The save round-trip runs it too.
- **Old-test edits (D593 b, e):** `v15-played.json` added to the Orders-opening list; `debug.breach.freeze` added to the debug "sets debugUsed" list. Nothing loosened.
- **Numbers:** `npm run check` green, 93 s here (warn 90, fail 120; 81 at TB.8a; CI is the judge). No size measurement due.

## 2026-10-29 — v1.5 TB.11a (not finished): players auto-arrange; one old row fails; waiting on you
- **Built:** every simulated player now calls Auto-arrange at every Bastion check-in before the stand-timing preview, and again right before Start (one helper in `breach.ts`; no other layout command). The report now says how many moments equal the baseline and lists each that moved (`baselineShift`, 3 tests).
- **Full `sim:check` (369 s here), baseline NOT re-recorded:** **189 of 192 moments are the same.** Moved, all stand timings and all earlier: light/sat best-last-stand 108.0 h → 99.5 h; delver/mon best-last-stand 99.0 h → 96.0 h; orderer/mon first-long-night 101.5 h → 99.0 h (the stand-timing preview now sees the lanes, so a stand is chosen at an earlier check-in). Every other moment before a first stand is untouched.
- **One old row fails: `vigil-embers-level`** (Embers at Rising Vigil levels 1 to 3 within 5% of level 0): ratios 0.947, 0.830, 0.930, largest gap 17% (the stand's Threat). Every other row passes. `sim:accept` refuses while a row fails, so the baseline stays at v1.4.
- **A tunable fixes it** (probe, scratch only): `vigil.strengthPerLevel` 0.32 → 0.28 and `vigil.embersPerLevel` 0.22 → 0.26 give ratios 0.99, 1.00, 0.99. Waves lost per level stay 1, 2, 3 (same as now). But 0.32 is a value you approved (Q57, D554, GDD §7.13), so I stopped and asked you (plan box step 12) instead of changing it.
- **Old-test edits:** none. **Numbers:** `npm run check` green, 94 s here (warn 90, fail 120; CI is the judge).
- **CI:** until this row is settled, the `sim` job on this branch fails on that one row.

## 2026-10-29 — v1.5 TB.11a (finished): Rising Vigil retuned, baseline re-recorded
- **You said yes to "Retune now".** `vigil.strengthPerLevel` 0.32 → 0.28 and `vigil.embersPerLevel` 0.22 → 0.26 (D596, `Proposed`; GDD §7.13 text and table updated). Waves lost per level stay 1, 2, 3.
- **Full `sim:check` (377 s here): every row passes**, including `vigil-embers-level`. Other CI jobs not run here; the full run is far under their 5-minute budget in CI terms.
- **Baseline re-recorded once (`sim:accept`):** rules version 5 → 6; the only changes are the three moments that moved: light/sat best-last-stand 108.0 → 99.5 h, delver/mon best-last-stand 99.0 → 96.0 h, orderer/mon first-long-night 101.5 → 99.0 h. **189 of 192 moments are the same as v1.4.** No stand's own moment moved later; all earlier moments are untouched.
- **Old-test edits:** none. **Numbers:** `npm run check` green but 95 s here (81 at TB.8a; warn 90, fail 120; CI is the judge; I did not find what grew).
- **Watch:** the Vigil values may need one more nudge at TB.13 when the Breach constants stop being placeholders.

## 2026-10-29 — v1.5 TB.11b: the Tactician, the probe and the `breach` shard
- **The Tactician** (id `tactician`, never shown; Monday seeds only; plays like Standard for 3 cycles). At the same moments as Auto-arrange it lifts every defense it owns to the Tray, then places them in the order Suggest layout lists. All of it goes through the one helper in `breach.ts` (no policy file names a layout command; a test reads them). Every other player still sends only Auto-arrange.
- **The `breach` shard** (5 runs) is added to `sim.yml`. It plays in **43 s here** (limit 240 s, CI budget 300 s). A single 3-cycle run takes about 9 s (limit 60 s).
- **The probe** takes a copy at the Tactician's first stand at Bastion and fights the preview's 100 practice stands for Auto-arrange, the Tactician's layout, the bad layout of D589 and the same state under the version 5 rules. Reported only; rows A to C are not added (TB.13). With the placeholder constants the four waves-held numbers are still about the same; that is what TB.12 will show.
- **Small difference from the plan:** the Tactician's moves live in `src/core/policies` and `breach.ts` (where Standard's already do), not in a new `sim/policies` folder; the probe is `sim/breach-probe.ts`.
- **Old-test edit (you approved):** `shards.test.ts` lists `breach` among the single-purpose shards left out of the fair-share check. Nothing loosened.
- **Baseline:** not touched. The new `tactician/mon` group shows as "new" in the report and is ignored by the 192-moment count.
- **Numbers:** `npm run check` green, 130 s here. The machine was slower today: the same check on the tip without my changes took 118 s and failed one unrelated 5-second test timeout (`contracts/flow`). My new test file adds about 12 s; its full 3-cycle run is left to the shard so the check stays lean. CI is the judge.
- **Not done on purpose:** rows A to C (TB.13, after you approve); the calibration command and report (TB.12).
