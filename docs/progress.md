# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v0.9` (from `main`, the v0.8.0 merge); the v0.9 flesh-out is applied (docs commit).
- **Last task:** T9.13 — measured; waiting on the owner (Q29, D397). Box stays `[?]`.
- **Next:** T9.14 once the pool row is answered (or in parallel; it needs no number).
- **Open questions:** Q31 answered (a). Q30 (not blocking), Q28 (tokens-not-wasted row, may block T9.17), Q29 (pool size, ends T9.13).

Earlier entries (v0.0 to v0.8 up to T8.15) are in [`docs/archive/progress-2026-10-11-to-15.md`](archive/progress-2026-10-11-to-15.md). Read only the last entry at session start.

## 2026-10-15 — v0.8 session 4 (continued): T8.16 policy rules
- **T8.16 is built** (D352 Proposed). The simulated players now play the v0.8 systems: loot is equipped by a fixed item score and Stores is trimmed to 30 (lowest scorers salvaged first); ranks as soon as a hunter qualifies; stars from the Embers The Hearth leaves over (cheapest first, highest level breaks ties); talents in a fixed order; Legendaries by a fixed table; and the Delver uses its Re-roll once a run on the first all-Faint offer. The tables were not in the GDD (it says "fixed"), so they are written out in D352 for you to read; they live in `src/core/policies/depth.ts`. The new report section "Hunter depth" shows stars, Wrights and Fine/Rare/Heroic items per cycle, Legendaries found and the Delver's Delve XP. Tests: `tests/policies/v08-rules.test.ts` (score, equip, salvage at 30, ranks, stars, talent order, Legendary table, the Re-roll replayed command by command) and `sim/depth-report.test.ts`. `npm run check` is green (55 s).
- **What the rules did to the full suite (one machine, 211 s):** 37 of 38 rows pass. **`ribbonshades` now fails** (all six names by cycle 6, Monday Standard median; the row says cycle 4), and **`trust-moves` passes again** (median 1). Both are knife-edge rows: the players' choices changed, so which seeds cross the line changed. `idle-only` passes (Standard 1.11× the Delver). I did not change any number; both are for T8.17/T8.18 (the checks and tuning, tunables only). If no reasonable tunable fixes `ribbonshades`, T8.18 asks you.
- **Seen in the report:** stars arrive late (0 in cycle 1, 3 to 4 by cycle 4), Wrights 1 to 2 in cycle 1, 4 to 5 by cycle 4; Fine items 2 to 5 a cycle, Rare 0 to 3, Heroic rare; only Yrsa's Thole is found (the family-Mastered Legendaries are not reached in 5 cycles); the Delver earns 4,400 Delve XP each over 7 cycles.
- **Next:** CI timing of the longer runs (the sim workflow, started by hand), then T8.17 checks (own commit) and T8.18 tuning.

## 2026-10-15 — v0.8 session 4 (continued): T8.17 checks
- **D352 accepted by the owner.** CI timings for the T8.16 players (run 38809709194, GitHub runners): shards `long` 79 s, `heavy` 77 s, `rest` 92 s, judge 83 s; all well under 5 minutes.
- **T8.17 is built** (D353 Proposed). **Own commit (`18843c8`):** only `sim/targets.ts`: the milestone list gains v0.8, the rows `act-5`, `late-letters` and `first-wright`, and the new `idle-only` definition (Act V's documents, the five name letters and every hunter at Wright). **Next commit:** the checks that judge them (`sim/checks/v08.ts`, `story-acts.ts`), the run records they read (every hunter at Wright, the letters), the stop rule (Monday Standard and Delver runs play on until all of the new "all content", up to 42 days), and the milestone set to v0.8. Tests for each row, for the new "all content", and the older fixtures updated for the new definition. `npm run check` is green (50 s).
- **First full run with the v0.8 rows enforced (one machine, 240 s): 35 of 38 earlier-plus-new rows pass; three fail:**
  - **`act-5` passes** (all seven documents by cycle 5, D5-07 in cycle 6) and **`first-wright` passes** (median 1 Wright at the end of cycle 1).
  - **`late-letters` fails:** Toma's, Sigrun's and Arvid's level-5 letters arrive in cycle 3 (fine) and Ostap's level-5 in cycle 1, but **Ostap's level-8 letter comes in cycle 13** (the row says 5): he does not reach level 8 as a Standard player's hunter.
  - **`idle-only` fails:** the Delver finishes "all content" at 994 h, Standard **never** within the 42-day cap, and the part that is last for both is *every hunter at Wright*. So the ratio cannot be met by tuning alone while the cap is 42 days (1,008 h): Standard would have to finish by about 1,290 h.
  - **`ribbonshades` still fails** (cycle 6 against 4; from T8.16); `trust-moves` passes.
- **Please look at (for T8.18):** the two new failures need a decision rather than a quiet tune. `idle-only`'s "every hunter at Wright" in 42 days is the strict reading I chose (D353 (1)); the lenient reading (every hunter *owned* at Wright, or Wrights of those with a letter) is the alternative. I did not change any number or the reading beyond what D322 says. I will lay out options with a recommendation at the start of T8.18.
- **Next:** T8.18 (tuning, tunables only) and a CI timing check of the longer Monday runs.

## 2026-10-15 — v0.8 session 4 (continued): T8.18 tuning
- **T8.18 is done** (D354 Proposed): three tunables changed, no formula: **`xp.growth` 1.5 → 1.3** (levels get cheaper as they rise; level 8 costs 879 XP in all instead of 1,609), **`rank.wrightTrophies` 20 → 10**, **`ruin.ribbonshadeShare` 0.5 → 0.75**. The full suite (45 runs, one machine, 215 s) **now passes all 41 rows**, including the three that failed (`ribbonshades`, `late-letters`, `idle-only`) and the new `act-5` and `first-wright`; Idle-only is 1.008× (Standard 387 h, Delver 384 h).
- **How I got there:** I measured instead of guessing: five Monday Standard seeds per candidate, one process each. The trio's XP was the limit for Ostap's level-8 letter (Standard reached level 8 in cycle 13; the Delver's Delve XP gets it by cycle 3), and trophies were the limit for "every hunter at Wright". Doubling contract XP (`xp.perTier` 40) passed those but broke `act-2` (the 5th ruin document came in cycle 5), so I took the gentler `xp.growth` instead; a bigger Ribbonshade share (0.9) added nothing over 0.75. No locked constant, `sim/targets.ts` row or golden was touched; the milestone-end `sim:accept` is yours to trigger after the playtest.
- **Please look at:** the XP change makes every hunter climb faster (the cap and stats are unchanged), and two rows pass exactly on their line (`act-2`, `ribbonshades`, both cycle 4 of 4). Tests that pinned the old numbers (`rank.wrightTrophies` 20, the Ribbonshade share 0.5, "needs 20 trophies") now read the constants or the new values; the GDD §5.3.2, §5.11.3, §5.14.4, §7.3, §7.7 and §7.10 text matches.
- **Next:** CI timing of the longer runs (the check-in is already set), then the v0.8 acceptance list and the owner's playtest; nothing is merged or tagged.
- **CI timings for the T8.17 run (run 38811176882, GitHub runners):** shards `long` 206 s, `rest` 104 s, `heavy` 42 s, judge 56 s; all under 5 minutes, `long` the closest. The T8.18 run (38817016718) is timed in the next check-in.
- **CI timings for the T8.18 run (run 38817016718, GitHub runners):** shards `long` 72 s, `heavy` 75 s, `rest` 100 s, judge 64 s; all under 5 minutes, and **the judge job passed** (all 41 rows) on GitHub as well as locally.

- **Art redraw (owner's request, D355):** Yrsa's Thole (an oar resting between two thole pins) and the Wolf-Tooth String (three curved fangs on a cord) were redrawn; the other keepsakes are as before. Image tests pass against the new drawings; `public/contact-sheet.html` is regenerated.

## 2026-10-16 — Token-usage clean-up (docs and settings only)

- **Done:** older `progress.md` entries, completed plan milestones (v0.0 to v0.8) and answered questions Q1–Q25 moved to `docs/archive/` unchanged. Start of session now reads about 20 KB instead of about 320 KB. `CLAUDE.md`: targeted start ritual, entry-size cap, one task per session, search-before-read. `.claude/settings.json`: Read deny rules for build output, caches, sim JSON and art binaries.
- **Next:** v0.9 flesh-out session.
- **Open questions:** none. `.claudeignore` removed (Claude Code doesn't document it; the Read deny rules are the mechanism). `npm run check` is green.

## 2026-10-20 — v0.9 session 1: the flesh-out is applied (docs only)
- Created `milestone/v0.9` from `main`. Copied OUT-1 to OUT-9 and `v8-owner.json` into `docs/flesh-out/v0.9/`, and OUT-7 to `docs/flesh-out/v0.9-summary.md`.
- Applied: OUT-1 rows D357–D387 (added only), OUT-2a to the GDD, OUT-3 to lore §31 and its neighbours, OUT-4a to the plan (not the §0.6 row), OUT-5 (Q28, Q29), OUT-9 to the technical design. OUT-2b and OUT-4b wait for T9.2.
- **Held back, with the reason:** the three new use-skill rows of GDD §8.5b. An existing test counts those rows against the code (11), so they go in with T9.4 and an updated test. Noted on T9.4.
- **Not applicable in this repo:** the lore Appendix 1 edit and the technical-design "v0.9 appendix" do not exist here, so nothing to mark.
- **To ask the owner:** OUT-4b puts `riftglass.bankWeeks` in the locked Events row, but OUT-2b's §7.11 does not list it. Settled before T9.2 applies OUT-4b.
- `.prettierignore` now skips the copied save (`v8-owner.json`, must stay unchanged). `npm ci` was needed: the installed Prettier was older than the pinned one.
- v0.8 actuals added to plan §0.7: 9 entries over 4 numbered sessions against 15–19 estimated; v0.9's 10–15 is likely an upper bound.
- Branch note: the harness named `claude/affectionate-brahmagupta-3n955f`; the owner's instruction (`milestone/v0.9`) was followed.

## 2026-10-20 — v0.9 session 1 (continued): T9.1 save v9
- **T9.1 is built** (D388 Proposed). Schema is now 9: `events` (closed on migration; the load path opens it for a save at the Citadel, with an empty bank and the scene pending) and `standPool` on each cycle (`base` for past cycles and for cycle 19; null if Bastion not reached).
- The owner's real v0.8 save is `tests/saves/fixtures/v8-owner.json` (copied unchanged); `v9.json` is that save migrated and played 72 h (`scripts/make-v9-fixture.ts`, regenerated at T9.9).
- `openEvents` is called on load (catch-up) and at the Rank-up. The event clock is folded in `advance` too, so live ticks and catch-up match.
- Tests: 18 new (migration, opening, backward clock and round trip, guard, fixture). The older migration tests now look at the cycle history without `standPool`, as v8 did for gear.
- Every golden fight, recorded fight and recorded stand still gives its result; `rulesVersion` stays 5. `npm run check` green.
- **Deferred to T9.3 (noted there):** the clamps that need `boss.*` and `hunt.*` values, because those keys arrive in T9.2.
- **Still to ask before T9.2:** OUT-4b lists `riftglass.bankWeeks` in the locked Events row, but OUT-2b's §7.11 does not.

## 2026-10-20 — v0.9 session 1 (continued): T9.2 the constants
- **T9.2 is built.** GDD §7.11 and the §7.4 pointer (OUT-2b) and plan §0.6's Events row and `hunt.*` sentence (OUT-4b) are in, with the `balance.ts` keys: 16 `boss.*` (all locked), 6 `hunt.*` and `events.recentKeep` (tunable). `boss.poolBase` 24,000 is a sketch until T9.13.
- The earlier open point about `riftglass.bankWeeks` is **resolved by reading**: it was already in the plan's Events row (a v0.7 locked key, GDD §7.9), and OUT-4b keeps it. No owner question needed.
- New test `tests/content/v09-constants.test.ts` pins every value; the existing key test and the lock test pass, and the "no game constants in `core/systems`" lint is clean.
- Nothing deferred.

## 2026-10-20 — v0.9 session 1 (continued): T9.3 tokens, rest, eligibility
- **T9.3 is built** (`src/core/systems/events.ts`). The bank, each rest and eligibility are worked out from stored event-time stamps and the monotone clock, with breakdowns (interval, time since the last token, next in; rest length and time since).
- A full bank restarts its clock on a spend; a part-full bank keeps its progress. A resting hunter can still take a contract; a hunter on a contract, in a Delve or recovering is not eligible; reserve hunters are. Events are locked after a Long Night until the Citadel, and the full-bank badge shows only while open.
- Debug commands in core: `debug.addToken`, `debug.fillBank`, `debug.endRests` (all set `debugUsed`). `debug.startAct` already existed and takes an act number; it gets tested for Act VI in T9.10.
- The load-path clamps deferred from T9.1 are in (tokens to the maximum, points to 100, tier 3–12, paid 0–4, a rest already over dropped).
- 16 new tests in `tests/events/timers.test.ts`: 30 h jump equals 12 + 12 + 6 h loads; a spend equals ticking to it; rewind and round trip give no free time; the offline cap does not touch the bank. Goldens unchanged. `npm run check` green.
- Nothing deferred. The unit shown on rest reasons follows the game's duration format ("14h 40m"), not the GDD's "14 h 40 m" example.

## 2026-10-20 — v0.9 session 1: handoff (stopped at the owner's request)
- Done and pushed on `milestone/v0.9`: the docs commit, T9.1, T9.2, T9.3. `npm run check` green. Nothing half-finished; no T9.4 code written.
- **T9.4 starts next.** It needs: the three hunters, three traits, nine tracks, six creatures (GDD §8.5, §8.13, §8.14), and the three use-skill rows held back from GDD §8.5b (note on T9.4; update `tests/content/v08-content.test.ts`'s count of 11 with them). Hunter ids are fixed in the technical design (`gest-tall-torch`, `ragnhild-eye-taker`, `radmila-of-the-reeds`; `lindworm-of-velk-fjord`, `barrow-king`, `mother-of-the-river`; `stoneback-fell-troll`, `mara-of-kettle-barrow`, `likho-one-eyed`). `HUNT_IDS` already exists in `src/content/hunts.ts`.
- Names: OUT-6 lists them for the web collision search. If search is not available, put them in `docs/questions.md`, mark T9.4 `[?]`, leave the names test red. A collision: stop and ask.
- Branch note: the harness named `claude/affectionate-brahmagupta-3n955f`; the owner's `milestone/v0.9` was used.

## 2026-10-20 — v0.9 session 2: T9.4 content
- **T9.4 is built** (D389 Proposed). Three Great Beasts, three quarries, nine tracks, three legendary hunters, their three traits and three use-skills, all word for word from GDD §8.5, §8.13, §8.14; the three §8.5b rows are now in the GDD with the test count at 14.
- **Names:** web-searched against the influences (no match; nearest were Skyrim's Warlord Gathrik, ESO's Stonebreaker, Warhammer's Barrow Kingdoms). All are in `tests/content/names.ts` (2026-10-20); the names test is green.
- Every track has at least four legal hunters among the starting eleven (test). Content is not in the bestiary; none is required elsewhere.
- **Side effects:** the legendary hunters have no letters and are hidden from the locked silhouettes; art rows are placeholders (T9.16); **"Radmila" removed from the warden-name list** (clash with the hunter); the art tests now cover the 11 drawn hunters. A TS limit made me widen one command argument in `HunterDepth.tsx`.
- **Owner to look at (stats are sketches):** GDD §8.13, §8.14.
- **Open:** Q30 (boss.order short keys vs long ids; not blocking). Nothing skipped. Combat code is untouched: the new effects arrive in T9.5.

## 2026-10-20 — v0.9 session 2 (continued): T9.5 fight engine for events
- **T9.5 is built.** A Great Beast or quarry is a new kind of fight monster (`event`, tier, and for a boss `healthOverride` = the pool). Its Health is the pool, so it can end only at or below it; no Great Beast has a heal. Event creatures count for no knowledge.
- **New effects, each with a test** (`tests/combat/events.test.ts`, 26 tests): Coil, Fjord Roar and Weir-Pull (hunters' meters knocked back 20 / 25), Grave Chill, Boulder Toss, Moss-Mend, Night-Weight, Quick Dark, Ill Luck (crit chance −10 points), Misfortune, the three traits and the three use-skills. Sit the Vigil works once a fight, only for another hunter, and after Hold the Stair's moved hit.
- **Readings (not in the GDD):** a monster with two attacks (the Lindworm) **holds one target per Coil action**, not one per hit; Night-Weight and Misfortune do not replace the attack; Grave Chill and Moss-Mend run each action like Noon Heat / Root-Wall; Sit the Vigil covers direct hits only (as Hold the Stair does), not ability damage.
- **Unchanged:** every golden fight, recorded fight and stand (the full suite is green), and `rulesVersion` stays 5. Old fights add no field to their context; the new ones appear only for events.
- Nothing deferred. The fight-reference shape for saves (`event`, `healthOverride`) arrives with T9.6.

## 2026-10-20 — v0.9 session 2 (continued): T9.6 boss attempts
- **T9.6 is built** (`boss.attempt`, `src/core/systems/boss.ts`; D390 Proposed). One token, up to 4 eligible hunters, 24 h rest, a seeded fight, and the pool falls by exactly the damage dealt. Milestones (25/50/75%, kill) pay once per visit, an attempt crossing two pays both; a kill pays one item (Stores full: salvaged, and the result says so) and the next boss arrives at once. The tier is fixed at the visit's first attempt (Citadel 4, Bastion 5, +1 each pass).
- Hunter XP goes to every attendee, win or lose. No Embers, trophies, threat, bestiary, contract counters, hunter records or yard XP; boss silver stays out of `bountySilver` (D387). The Long Night keeps the whole visit (tested).
- The fight reference and the result are saved: `FightRef.monster` can be an event creature and `location` can be null; `events.last` holds a report of the latest attempt. Still schema v9. 33 tests in `tests/events/` on the real v8 fixture.
- Three small edits outside events: two UI/test spots now check the fight is a contract before reading its species; `assets.ts` re-exports the creature ids from `hunts.ts`.
- **Not in this task:** the result sheet and playback (T9.14–T9.15), Suggest and the preview (T9.7). The Archive shelf's "Identified" is derived (D390 (6)).
- Nothing skipped. No golden, recorded fight or stand changed.

## 2026-10-20 — v0.9 session 3: T9.7 boss preview and Suggest
- **T9.7 is built** (D391 Proposed). The preview (`previewBoss`, odds worker, new `bossPreview` message) runs 100 practice fights on their own dice and shows the median damage and 10th–90th range as a share of the pool standing, which marks the typical attempt would bring, and a Why? whose top number is the median. Over 120 real attempts the range held 65–95% (test), about the 80% it claims.
- **Suggest for events** (`suggestBossParty`, worker message `bossSuggest`): parties in a fixed order (highest level, then roster), the same 50 dice for every party, stops at the first whose typical attempt clears the floor, else after 10 parties; it only sees hunters who can attend (tested with resting hunters).
- **You chose the floor:** new tunable `events.suggestFloor` 0.08 (of the starting pool). **I added, for a yes or no:** `events.suggestTries` 10, because the full search of 14 hunters took 9.5 s. Both are in GDD §7.11; no `boss.*` value moved.
- **Timings (4× slowdown, bench):** preview 52 ms, Suggest with 14 hunters and no party clearing the floor 375 ms. **Proposed §6.5 rows:** preview ≤ 150 ms, boss Suggest ≤ 500 ms (warn at the budget, fail at 2×); the bench uses them until you set the rows.
- On your save the first party tried already clears the floor (about 10% of the pool per attempt, a sketch pool).
- Nothing skipped. The stand preview's percentile helpers are now shared. Golden fights, recorded fights and stands unchanged. `npm run check` green (35 s).

## 2026-10-20 — v0.9 session 3 (continued): T9.8 Hunts
- **T9.8 is built** (D392 Proposed). `hunt.attempt` takes a track and up to 4 legal hunters: the track's restriction, one token, the 24 h rest, a seeded fight against the quarry at the track's tier (no location traits), win or loss points that stop at 100, hunter XP (a loss pays half), and replays (XP and one reagent on a win, no points, no item).
- **Unlock:** at 100 points the hunt unlocks once and the legendary hunter arrives free: highest level among your hunters within the cap, a Wright from level 5 else an Apprentice, no stars or talents, first-tier Common pieces made new for them (nothing taken from Stores; no iron or silver recorded, so salvaging them returns nothing). Active if there is room, else the reserve.
- **Odds panel:** `computeHuntOdds` gives the win chance, its margin and the unprepared figure; the real win rate over 300 fights sits inside the margin (test).
- **Save:** the last hunt result is saved and validated (still schema v9); points and unlocks survive the Long Night (tested).
- **Not here (D392 (6)):** Suggest for hunts and the worker message for the hunt odds; they go with the hunt sheet (T9.14).
- 22 tests in `tests/events/hunt.test.ts`. No golden fight, recorded fight or stand changed. `npm run check` green (36 s).

## 2026-10-20 — v0.9 session 3 (continued): T9.9 the Dross-Tide in the Last Stand
- **T9.9 is built** (D393 Proposed). The cycle record's pool is fixed at the Rank-up to Bastion (or when the stand is made, if still unset): `dross` if Act VI has begun in the save, else `base`. A `dross` wave list is the old list with the Dross-Tide swapped in on a separate roll, so it differs from `base` only by the Dross-Tide; no wave is guaranteed.
- The Dross-Tide fights as itself with ordinary tier-scaled Health (320 at tier 2, no Delve multiplier). It is named in the stand screen's wave list at once and in the result log. A stand touches no bestiary or kill count (tested).
- A stand record gets a `pool` field only when it is `dross`, so every saved stand reads and replays as before. It is saved and validated; the preview, the real stand and the Long Night kit all read the same pool.
- Every `base` stand replays exactly; all golden fights, recorded fights and recorded stands are unchanged, so nothing to ask. `rulesVersion` stays 5.
- "Act VI has begun" is read from the act progress for now; the Act VI machinery is T9.10. 12 tests in `tests/stand/dross.test.ts`. `npm run check` green (37 s).

## 2026-10-20 — v0.9 session 3 (continued): T9.10 Act VI machinery
- **T9.10 is built** (D394 Proposed). Act VI is an act only once its documents exist, so nothing shows until T9.11; the machinery is in and tested with stand-in documents that carry OUT-3's conditions and none of its text (`tests/story/act6-machinery.test.ts`).
- **Starts on load** in a story-less cycle (the v8 → v9 migration re-bases it with fresh counters, as v8 did for Act V); **with the next warden** from Act V's cycle (tested through a real stand). An act with no opening scene is never asked for on load.
- **D6-10 waits for Sigrun** (new `withHunter` on the win-count condition) and is never lost. No Act VI condition uses a ruin, family or Delve count (checked on the real documents in T9.11).
- **Rime**: a new document type with its own Library shelf ("Nothing here yet." when empty; pale text on a dark card) and its own away-sheet line. The arrival lines (new-warden and on-load) are OUT-3's words. The Accounts event "What the cold wants" exists, empty until T9.11. Debug panel has Start Act VI.
- **Not done:** the Rank-up sheet shows no Rank documents for any act today, so no Rime wording there (D394 (6)). No Act VI text beyond OUT-3 was written.
- Owner's save is in Act IV, so it reaches Act VI after Acts IV and V. `npm run check` green (35 s).

## 2026-10-20 — v0.9 session 3 (continued): T9.11 Act VI texts
- **T9.11 is built** (D395 Proposed). The ten documents D6-01 to D6-10 are in, generated from OUT-3 (and checked line by line against `lore-secrets.md` §31), with Ilse's notes, the Accounts lines for What the cold wants and the two added events, and the names #1 to #3 on the Keep, Citadel and Bastion documents. No text beyond OUT-3 was written.
- Act VI is now the last written act: it plays on load, with the next warden and from the debug panel; the Rime shelf fills; the Names view shows #1 to #3 (tested).
- **One mismatch, your choice:** Sigrun's Accounts line in OUT-3 ended in a full stop, her scene has a comma. The line is shown without the mark; the scene is untouched.
- Content test (`tests/content/v09-act6.test.ts`): texts equal §31 line by line; names exactly #1–3 once each; nobody says or asks for the names; none of the avoid-list words; no counts of years; no ruin, family or Delve condition. Four older tests moved from "Act V is the last" to VI.
- `npm run check` green (35 s). Nothing deferred.

## 2026-10-21 — v0.9 session 4: T9.12 the Eventer policy and the events shard
- **Built** (D396 Proposed): `src/core/policies/eventer.ts`. It keeps Standard's check-ins and acts before the contract moves. It sends four hunters (highest levels, a Vanguard and a Mender if the pool has them) with the family kit, and keeps going while a token and four fresh hunters remain. **Q31 (a), your answer:** boss and hunt alternate; after each boss attempt the next goes to the hunt with the most points, never to an unlocked one. GDD §6.1 now says so (the old "within reach" test could never fire from 0 points).
- **Shard and CI:** `events` is its own shard (5 Monday runs); the workflow matrix has it. Run records gain an `events` section and the report an "Events" section (attempts, damage, marks, silver, hunt points per cycle, tokens, full-bank and blocked check-ins, first boss, unlocks).
- **Found and fixed:** the first full run failed Idle-only because the legendary hunters counted in "every hunter at Wright" (D386 (6) leaves them out). Fixed in `sim/run.ts`; no row or target changed.
- **Full suite, one machine:** 50 runs in 292 s; every old row passes; every cycle-1 moment equals the v0.8 baseline ("same" for all four old players). The Eventer's runs of 42 days took ~45 s each.
- **Baseline re-recorded** once with your yes (`sim:accept`): only the Eventer's group was added (18 lines); nothing else moved; 0 rows fail. The `events` shard took 43 s locally (CI time still to be seen on the first CI run).
- **Seen:** the Eventer is "blocked" at nearly every open check-in (hunters out on contracts, Q28), and made about 1 attempt a day; no hunter unlocked in the first literal run.
- `npm run check` green (84 s here; near the limit).

## 2026-10-21 — v0.9 session 5: T9.13 calibration
- **Measured** with a one-off script (`sim/calibrate-events.ts`), 5 seeds × 4 moments; full tables in `docs/flesh-out/v0.9-calibration.md`.
- **Pool (D397 Proposed, Q29):** `boss.poolBase` 24,000 → **21,000** gives a median 12.0 attempts to kill (24,000 gives 13.7). The Lindworm alone would want 18,000.
- **Problem for you:** hunter strength swings about 2× between moments, and the Barrow-King is much harder than the other two in weak states (up to 112 attempts at tier 5 in cycle 3). A softening table is in the calibration file; it changes GDD §8.13, so I did **not** apply it.
- **Hunts:** tracks are all-or-nothing (a best party wins 0% or 100%). Tracks I are 100% everywhere; Likho's all 100%; Stoneback II/III 0% in weak states. No quarry strength (up to 4× Health) gave 25–90% across states. With track III an unlock takes about 4 attempts (target 6–8); softer `hunt.trackPoints` (10/4, 15/6, 22/8) gives 5 to 8.
- **Changed:** nothing locked; no constant; no content. I tried content values and reverted them, because the GDD tables and the notebook lines are pinned by content tests and are your design. Only the script and an export of the Eventer's kit were added.
- **Needs your answer:** (1) the pool row (yes to 21,000, or 18,000, or keep 24,000); (2) whether I may apply the softening table and edit GDD §8.13/§8.14 with it; (3) whether to soften `hunt.trackPoints`.
- `npm run check` green.
