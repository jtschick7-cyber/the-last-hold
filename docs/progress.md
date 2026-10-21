# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `claude/stoic-keller-hav7be` (from `main`, the v0.10.0 merge). `milestone/v0.11` is created from it when the first preview is wanted (D468).
- **Milestone:** v0.11 "The Remembering" (D446–D467; D460 accepted by the owner).
- **Last task:** T11.16 layout checks and budgets (owner approval of the §6.5 rows pending).
- **Next:** T11.15 (a second measurement for the narrower row, then stop for N), then T11.17.
- **Open questions:** Q40, Q38 and Q42 answered; Q41 and Q43 informational; Q45 answered (a).

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

## 2026-10-21 — v0.9 session 5 (continued): Q32 applied, T9.14 screens part 1
- **Q32 applied (D398):** Barrow-King and Mother softened, `hunt.trackPoints` 10/4, 15/6, 22/8, GDD §8.13/§7.11/§8.14 and their tests updated. **My mistake:** I pushed that commit after running only the content tests; the combat test still pinned Grave Chill at 2%, so that one commit was red. Fixed in the next commit; `npm run check` is now green (85 s).
- **T9.14 built** (D399 Proposed). Core: `systems/events-view.ts` (card, boss sheet, party rows, preview words; every number carries its breakdown) and the command `events.seeScene`. UI: Events card under the Rift card, one badge on the Hold tab, the opening scene (the GDD's three paragraphs), boss sheet with the pool bar and marks, party picker with reasons, Suggest, preparation beside the Great Beast's weaknesses, and the preview with Why?. Debug panel: +1 token, Fill the bank, End all rests.
- **Checked on the real build** (phone viewport, your save): scene → card → fill bank (badge, "full") → boss sheet → Suggest → preview → Send, **4 taps** from the Hold screen; no sideways scroll at 360, 900 and 1300 px. The card before the Citadel is covered by a core test, not a screenshot.
- **Not here (T9.15):** playback with Skip and Log, result sheets, hunt list and sheets, the away-sheet line, shelves. After Send you see a one-line last result.
- Open: Q29 (pool). Q28 for T9.17.
- **Owner's answers applied:** Q29 (a) → `boss.poolBase` 21,000 (D400); Q28 (b) then (a) and D399 yes (D401). T9.13's box is ticked.

## 2026-10-21 — v0.9 session 5 (continued): T9.15 screens part 2
- **Built** (D402 Proposed): after Send, the attempt plays back like a Delve floor with Skip and Log (the log is regenerated from the seed), then a result sheet (boss: damage, pool left, milestones, silver, reagents, item, XP, rests; hunt: win or loss, points, XP, reagent) with a breakdown on each number. A hunt that unlocks a hunter opens the unlock sheet (active or reserve).
- **Hunts:** a Legendary Hunts list on the Events card (quarry, greyed hunter, points with breakdown, three tracks with restriction and a reason when nobody free fits) and a track sheet with the odds panel (no Reckless line), "unprepared would be X%", Suggest, preparation and Send. Hunt odds and Suggest run in the worker.
- **Other screens:** Great Beasts shelf in the Bestiary (Identified on first fight, no levels; empty line as the GDD words it); the hunter sheet's rest line and "No letters." for the legendary hunters; the away sheet's full-bank line. The Rime shelf and reader were already in (T9.10).
- **Tests:** `tests/events/screens2.test.ts` (25) and three Playwright runs on the real build (boss with playback and result, a hunt end to end with the shelf, widths 360/900/1300). `npm run check` green.
- **Note:** only the top sheet shows, so a playback restarts after its Log is closed (same as Delves).
- **Not done / next:** T9.16 art and T9.17 rows are `[?]` (owner). Section 6.5 budgets for hunt odds not measured.

## 2026-10-21 — v0.9 session 5 (continued): T9.16 art
- **Owner chose "draw them in code".** New `tools/draw-creatures.ts`: a 64 px portrait and a 32 px battle sprite for the three Great Beasts and three quarries, in the game's palette; two 16 px icons (Rime, attempt token) in `draw-icons16.ts`. The three legendary hunters' portraits and sprites now come from the existing hunter generators (their portrait parts were already in the content).
- **Manifest:** all 20 rows moved from placeholder to generated; the placeholder fallback still stands for anything else. Tests that said "placeholder" now check the files match their generators, sizes and palette.
- **Shown in the game:** the token icon on the Events card, the Rime icon on the Rime shelf; the creatures' sprites in playback and their portraits on the shelf and hunt list.
- **Not done:** the box stays unticked until you look at `public/contact-sheet.html` (or the preview) and approve or ask for redraws. The sprites are small and simple; the Lindworm and Likho read least clearly.
- `npm run check` green.

## 2026-10-21 — v0.9 session 5 (continued): T9.17 measured, stopped on Q33
- **T9.16 ticked:** art approved. The braids were redrawn at your request (four hunter portraits changed).
- **Measured** the five approved rows on 5 Monday Eventer seeds. First boss attempt passes (9 h after the Citadel). First kill is cycle 6 (needs 2), first unlock cycle 5 (needs 3), full bank about 29% (needs 15%). Cause: the Eventer's contract decisions are Standard's, so fewer than four hunters are free at about 90% of open check-ins.
- **Tried Q28 (b)** (three hunters when four are not free): little change; reverted, nothing committed.
- **Stopped and asked:** Q33 in `docs/questions.md` has the options and my recommendation. No row is written to `sim/targets.ts`; no `sim:accept`. The two D383 rows still need their own yes.

## 2026-10-21 — v0.9 session 5 (continued): T9.17, the two D383 rows
- **Owner answered Q33 with (c) and said yes to the two D383 rows.** Rows `act-6` and `dross-tide-stand` are in `sim/targets.ts` in their own commit (64bed31); the milestone is now v0.9.
- **Checks built:** `act6Check` (with the other acts) and `drossProbeCheck` (`sim/checks/v09.ts`); the run record gains `drossStands` (waves held and the preview's range at the stand). The Monday Standard runs now also play on until Act VI's documents and three Dross-Tide stands exist (D403).
- **Full suite (one machine, 287 s):** every row passes, old and new. Act VI: D6-01 to D6-06 cycle 6, D6-07 cycle 7. Dross-Tide: 15 stands, median 18 waves, 100% inside the preview range. The 60% agreement figure is my reading (D403): please confirm.
- **Eventer rows (Q33 (c)):** I tried the hold-back (four hunters kept off contracts while a token is banked). It did not help: first kill cycles 4 to 7, full bank about 32%, unlocks cycle 4 to 13. Reverted. See the message to the owner for why (rest and token rate), and the options.
- **CI timings** for the simulator workflow on GitHub (run 39586017390, this branch): events 30 s, long 121 s, rest 56 s, heavy 80 s, judge 71 s; all under 5 minutes, all rows pass. The first CI run of the new events shard is now seen.
- **CI fixes:** `npm run check` had been over its 90 s budget on CI (102 s once); the test files now share their module cache (`isolate: false`), 84 s to 62 s locally, all 2,398 tests pass twice. The story e2e's scene waits are 45 s (it failed on CI only; it passes locally; not yet seen green on CI).
- **Waiting on you:** Q33 (hold-back did not help; my proposed rows and the alternative are in `docs/questions.md`) and the 60% in D403.

## 2026-10-21 — v0.9 session 5 (continued): T9.17 done
- **Owner chose (c) for Q33 and said 60% is fine** (D404, Decided). The Eventer's three rows moved: first kill by the 7th cycle, first unlock by the 6th, full bank at most 35%. First attempt (24 h) and silver (70%) unchanged. The rows are in `sim/targets.ts` in their own commit (db7d64c), checks in `sim/checks/v09.ts`, the Eventer now plays on until a kill and an unlock (42-day cap).
- **Full suite (one machine, 276 s):** every row passes. Eventer medians: first attempt 6 h after events opened, first kill cycle 6, first unlock cycle 5, full bank 28.9%, cycle-1 silver 77% from bounties.
- **GDD §6.2 and the plan's table** carry the new numbers. No `sim:accept` (milestone end, after your playtest). No locked constant changed.

- **CI after T9.17** (simulator run 39588879184, GitHub runners): events 57 s, long 121 s, rest 52 s, heavy 57 s, judge 91 s; every row passes, all under 5 minutes. The normal CI run (322) is green, e2e included, so the story e2e failure is gone.

## 2026-10-21 — v0.9 session 6: T9.18 and T9.19
- **T9.18: nothing to tune.** All simulator rows already pass on the 5 Monday seeds (T9.17 run; CI run 39588879184, every job under 5 minutes). No `balance:` commit, no tunable or `boss.*` constant changed, no `sim:accept`.
- **T9.19:** `tests/e2e/events.spec.ts` already covers one boss attempt (scene, card, party, send, playback, result) and one hunt attempt (list, track, odds, playback, result, shelf, rest line) on the Pixel 7 phone viewport, with your real save (`v8-owner.json`) loaded into the production build. The smoke file already covers install-style offline reload. No new test needed. Phone e2e (events and smoke, 7 tests) passed here in 23 s; `npm run check` green (2,403 tests, 81 s).
- **Open:** D402 and D403 are Proposed and need your yes. Hunt odds and hunt Suggest budgets (GDD §6.5) are not measured; you set those rows. Q30 not blocking.
- **Not done on purpose:** `sim:accept`, merge, tag, pull request.

## 2026-10-21 — v0.9 closed
- Owner passed the playtest (D405). `sim:accept` run: 50 runs, 318 s, all rows pass, baseline recorded in `sim/baseline.json`. Status set to complete, PR opened, merged, tagged `v0.9.0`.

## 2026-10-21 — v0.10 session 1: the flesh-out is applied (docs only)
- **Checked first:** `v0.9.0` is tagged and inside `main`; the v0.9 merge is in `main`; `sim/baseline.json` is the accepted one. Branched `milestone/v0.10` from `main` and pushed it.
- **Owner said yes** to OUT-3 and the eighteen readings, no exceptions: **D425** added (Decided). **D407** (sweep, Decided) and **D408–D424** (Proposed) added; no old row edited.
- **Applied:** flesh-out files to `docs/flesh-out/v0.10/` and the summary to `docs/flesh-out/v0.10-summary.md`; GDD §5.13 replaced and the other GDD edits made (OUT-2b, §7.12, waits for T10.2); lore §33 and its three edits; the plan's v0.10 section, the v0.11 outline, the v1.0 line and the §0.7 row (OUT-4b waits for T10.2); Q34–Q37; the technical-design changes; two standing rules in `CLAUDE.md`.
- **Sweep:** every `Proposed` row from D358 to D406 is named in D407; D408–D424 are the new ones; nothing else turned up.
- **v0.9 actual count** (§0.7): 21 entries over 6 numbered build sessions.
- **`npm run check` green** (2,403 tests, 64 s).
- **Save fixture, waiting on the owner:** the export they sent has `schemaVersion` 9 but `meta.debugUsed` is **true**. OUT-8 says to ask which to use (this export, or v8-owner.json carried forward). Not copied yet.
- **Next:** T10.1.

## 2026-10-21 — v0.10 session 1 (continued): T10.1 save v10
- **Fixture:** both exports you sent today had `debugUsed` true, so by your rule I used the fallback: your 2026-10-20 save carried through the shipped v8 → v9 migration and the events load path (`v9-owner.json`; made by `scripts/make-v9-owner-fixture.ts`). `v10.json` is that save after this migration, not played.
- **Backfill table (Q35):** Moot: contracts won, `stats.contractsWon` (kept). Grey Wives: experiments (`book.tried`) and properties (`book.properties`) kept; **brews not recorded**. Bell-Watchers: documents, letters and names all kept. Quenchers: Kozly Hollow contracts from village trust (**partial**: a Sworn village stops counting); **Delve floors not recorded**. Every Order: past Triumphant stands from the cycle bands.
- **Result on your save:** every Order is far past level 1, so the cap binds: starts 10 (Moot), 30 (Grey Wives), 25 (Bell-Watchers), 20 (Quenchers), all at level 1. Nothing opens, queues or seats on migration.
- **Built:** `orders` state and guard (`validate-orders.ts`), `migration-v10.ts`, `orders-backfill.ts`, schema 10. Refuses impossible states; drops unknown ids with warnings. Tests: `tests/saves/v10-migration.test.ts` (23 tests): recount, cap, notes, guard, round-trip, golden fights and recorded stands replay unchanged.
- **Timing:** migration 1.1 ms; full load 2.3 ms (198 KB file). `npm run check` green (2,432 tests, 64 s).
- **Two readings for you (D426, Proposed):** the unrecovered sources come out as load notes, not warnings, so ten older tests that expect no warnings stay untouched; and the backfill numbers sit in one marked temporary file until T10.2 moves them to `balance.ts`.
- **Next:** T10.2.

## 2026-10-21 — v0.10 session 1 (continued): T10.2 constants
- **GDD §7.12** (OUT-2b) added after §7.11; the §7.4 pointer was already in. **Plan §0.6** has the Orders row (six locked keys) and the note that the rest are tunable.
- **`balance.ts`** now holds every `orders.*` key at the §7.12 value; six are locked (seats, third-seat rule, levels, the opposed pair, the perk ceiling). The temporary file from T10.1 is deleted; the migration and the guard read `balance.ts`, and the migration test takes its weights from it.
- **Test:** `tests/content/v10-constants.test.ts` fails if a locked value changes, checks each perk step × 4 ≤ the 20% ceiling, one weight per source, rising thresholds. Existing balance tests (both directions with the GDD, locked = plan §0.6) pass.
- `npm run check` green (2,438 tests, 60 s). No locked value changed, no old row edited.
- **Next:** T10.3.

## 2026-10-21 — v0.10 session 1 (continued): T10.3 standing hooks, part 1
- **New `core/systems/orders.ts`:** standing is derived (start + counts × weights + Triumphant stands × chunk) with its breakdown built by the same function; level is the higher of the derived one and the saved highest level, raised in the same call that adds standing.
- **Three hooks:** a contract won (Moot for any village, Quenchers for Kozly Hollow), a Triumphant stand (the chunk to all four Orders, opened or not), a Delve floor whose result paid at least 1 Riftglass (7-day window on the event clock, capped). A lost contract, a Broken stand, a Cold Comfort run and a run past its allowance add nothing.
- **Delve-optional test (D20, D271):** Delve standing is listed as a reward with an idle source (Kozly Hollow contracts).
- **Tests:** `tests/orders/standing-hooks.test.ts` (16): each source adds its weight once, a 30 h catch-up equals 30 one-hour steps, the cap and a new window, a real Delve run, level never drops.
- `npm run check` green (2,454 tests, 66 s). Golden fights and recorded stands unchanged; no existing test edited.
- **Left for later:** the third-seat check after a level change (T10.5) will read the list `raiseLevels` returns; the full simulator is not re-run here (nothing reads standing yet; T10.17 checks the old players still equal the baseline).
- **Next:** T10.4.

## 2026-10-21 — v0.10 session 2: T10.4 standing hooks, part 2
- **Six hooks added** in `core/systems/orders.ts`, called where the game already notes the same event: a brew finished and an experiment finished (with one per property it revealed) for the Grey Wives; a document found, a hunter letter found and a name found for the Bell-Watchers. A name counts once, whatever found it.
- **Long Night:** the reset never touches Orders, and a test now pins that counts, start, flags, Triumphant stands and the highest level all survive it. **Events add nothing:** a test runs a real boss attempt and a hunt on the owner's save and the Orders state is unchanged.
- **Tests:** `tests/orders/standing-hooks-2.test.ts` (10), including a 30 h catch-up equal to 30 one-hour steps.
- `npm run check` green (2,464 tests, 83 s). Golden fights and recorded stands unchanged; no existing test edited.
- **Note:** this container had no installed packages at the start, so I ran `npm ci` from the lockfile first (nothing added). The "green" I saw before that was not a real run; this one is.
- **Next:** T10.5.

## 2026-10-21 — v0.10 session 2 (continued): T10.5 seats
- **Owner answers logged (D427, Decided):** D426 accepted; Q34, Q36, Q37 all (a).
- **Seats:** two at the start, three once the third opens. Four commands: seat, unseat, swap, and set-all (the new-warden and load step). Seats stay in the fixed list order; nothing seats an Order by itself.
- **Cooldown:** 24 h on the event clock, refused with "Can change in 9h 20m"; a rewound device clock gives nothing back; a refused change starts none. Set-all is free and clears it; a new warden clears it too (in the Long Night reset), and seats carry over.
- **Third seat:** one check (idempotent), run after every level change; the Quenchers' opening and the load will call it in T10.6. Tests cover all three orders of events, "once", and the Long Night.
- **Tests:** `tests/orders/seats.test.ts` (17). `npm run check` green. Golden fights and recorded stands unchanged; no existing test edited.
- **Not here:** the "Seat it" at an opening that skips the cooldown (T10.6), the screens (T10.13).
- **Next:** T10.6.

## 2026-10-21 — v0.10 session 2 (continued): T10.6 opening the Orders
- **One function, `openOrders`,** opens each Order once for good and queues its opening scene, in list order. It runs at the live triggers (a Rank-up to the Keep, a building, a document found, Ilse's arrival) and at the end of every catch-up, after the time away is played, so contracts are counted by their own events and never by the opening. Then it runs the third-seat check.
- **Triggers:** Moot at the first Keep; Grey Wives at the first Hut; Bell-Watchers at Ilse; Quenchers when D5-08 is found. Nothing seats itself; a new command finishes a scene ("Seat it" takes a free seat with no cooldown; "Continue" and "Not now" leave it).
- **Tests:** `tests/orders/opening.test.ts` (28). A table over all 19 saved fixtures works out what should be open from each save itself. Also: the Quenchers wait for D5-08 (live and in a catch-up), the Hut, Ilse, a new game at the Keep, the scene commands.
- **Please look at (D428, Proposed):** how "the first Hut" is read from an old save; the "Seat your Orders" sheet is pending only when a load opens the save's first Orders; "Seat it" with no free seat is refused.
- **Not tested yet:** acceptance 3's "no Sending, Deep or onward word" needs the scene texts, so it is checked in T10.9. The owner's own save opens Moot, Grey Wives and Bell-Watchers on load, and the Quenchers not at all (it has not found D5-08).
- `npm run check` green. Golden fights and recorded stands unchanged; no existing test edited.
- **Next:** T10.7.

## 2026-10-21 — v0.10 session 2 (continued): T10.7 number perks
- **D428 accepted by the owner.**
- **Four factors, each `1 − step × level`, seated only,** each its own breakdown line (for example "Thanes' Moot, Friend: −6% food for provisions"): contract provisions (Moot), brew and experiment time (Grey Wives), clue time (Bell-Watchers), the hourly Threat rate (Quenchers; failed and completed contracts are untouched). Unseated or level 0 is exactly 1, so a game with nothing seated equals v0.9. New file `core/systems/orders-perks.ts`; the Order names and the level words (Neighbour, Friend, Ally, Kin) are now in `content/orders.ts`.
- **Fixed at the right moment:** provisions at launch; a clue as it starts; a brew or experiment as it is **queued** (a waiting job keeps its cut). That last one needed one optional saved number on a queued job (D429, Proposed; no migration, round-trip tested).
- **Tests:** `tests/orders/perks.test.ts` (37): factors by level, all 19 saved fixtures unchanged when unseated, queue and seat-change cases, the Threat equivalence (one long advance equals hourly steps, with a seat change inside), the stand preview's Threat per day follows the seat.
- `npm run check` green. Golden fights and recorded stands unchanged; no existing test edited. The simulator rows are not re-run here (nothing seats an Order until T10.17).
- **Next:** T10.8.

## 2026-10-21 — v0.10 session 2 (continued): T10.8 chapters
- **D429 accepted by the owner.**
- **The sixteen chapters as rules, no prose yet:** ids, numbers, the D414 titles and the extra condition of each (Vesna on the roster, Ilse arrived, Ostap and Vesna, the Quenchers opened for the Moot's last, the Moot opened for the Quenchers') are in `content/orders-chapters.ts`; the texts come in T10.9 and T10.10.
- **Playable is worked out from the state each time** (no stored queue): open, seated, level at least the number, the one before read, condition holds; at most one per Order, in list order. A chapter due only for want of a seat is reported separately, for the card and the Hold badge.
- **Reading** (`orders.readChapter`) counts it read and saves the seats in the fixed order; nothing else changes (tested: no name, document, entry, standing). The ending (A or B) for chapter 4 of the Moot and the Quenchers comes from the saved seats. The Library shelf entries are a read-only selector.
- **Tests:** `tests/orders/chapters.test.ts` (14), including a seat-blocked chapter that does not block another, all five extra conditions, a chapter found after a tuning change and a load, and the owner's migrated save (each seated Order plays chapter 1 and not chapter 2).
- **Names:** the sixteen chapter titles and the four Order names are now in `tests/content/names.ts` (dated 2026-10-21, with the OUT-6 notes; the two near-matches say the owner kept them, Q34). This was needed now because the names test reads content, and it is the T10.10 names item done early.
- `npm run check` green (2,560 tests). Golden fights and recorded stands unchanged; no existing test edited.
- **Next:** T10.9 (the first scene texts, word for word from lore §33; the test harness first).

## 2026-10-21 — v0.10 session 2 (continued): T10.9 texts, part 1
- **Texts in:** the Moot's and Grey Wives' opening scenes and all eight chapters (`content/story/orders-scenes.ts`), E1 (the heads' notice lines and panel entries) and E2 (the Grey Wives' hints and elder's notes, `content/story/orders-perks.ts`). The scene file was produced from lore §33 by a script so no word is retyped; author notes (Wrongness, Threshold) are not shipped. Ilse's note under the Grey Wives' chapter 2 is kept as a Library note.
- **Test harness** (`tests/content/orders-texts.test.ts`, `orders-checks.ts`, `orders-lore.ts`): every string is compared to lore §33, read separately from the generator. The Part F checks run on every text: forbidden words, "hollow" only as Kozly Hollow or the Hollow, relative years, names from the roll, phrases that ask for the names, unknown people, and the opening-scene words. Each check is also run on a planted bad text and must fail.
- **E2 hints are data** (`{brew, claim}`) and each claim is checked against the GDD §8.6 ingredient table (garden herb, two village gifts, exactly two unlike carriers, pitch and grave dust).
- **Names:** the two opening titles added to `names.ts` (the other six were in T10.8).
- **Not done yet (by plan):** where these texts show (T10.11) and the Bell-Watchers and Quenchers texts, E3 and E4 (T10.10). I did not read the texts for tone; that is your read of lore §33, which they equal exactly.
- `npm run check` green. Golden fights and recorded stands unchanged; no existing test edited.
- **Next:** T10.10.

## 2026-10-21 — v0.10 session 2 (continued): T10.10 texts, part 2
- **Texts in:** the Bell-Watchers' and Quenchers' opening scenes and eight chapters (`orders-scenes-b.ts`, made from lore §33 by the same script, so word for word), plus `orders-scenes-all.ts` listing all twenty scenes. All sixteen chapters and four openings now equal lore §33.
- **E3 (Q37 (a), built as written):** the Bell-Watchers' extra sentence is generated from the roll by `core/story/orders-bell.ts`, never typed. Tests: the full groups equal the lore table; hand-worked cases for one, two and all-but-one names found; "every village", "every village but X", village order; nothing for the other groups; only while seated; the remark when none is missing.
- **E4:** the four Kozly Hollow excerpts equal the lore table and are exact substrings of their chapters; the Account name, witness and label are constants.
- **Checks:** the harness now covers all twenty scenes, E1 to E4 and a cross-check that no roll name or asking phrase appears anywhere. Two harness fixes, not text changes: the pronoun "I" is not a name, and a sentence-opening word before a name ("Then Marta") is not part of it.
- **Names:** level names and the interface phrases added to `names.ts` (the four Order names and all titles were already in). Names test green.
- `npm run check` green. Golden fights and recorded stands unchanged; no existing test edited.
- **Next:** T10.11 (where the perk texts show: heads' lines in notices and the Villages panel, the Book hint, the Names view, the Accounts).

## 2026-10-21 — v0.10 session 2 (continued): T10.11 where the perk texts show
- **Four places, all from the core** (`core/story/orders-views.ts`, `orders-bell.ts`, `archive.ts`), the UI only draws them: a head's line at the end of that village's contract notice and the "What the heads say about you" list on the Villages panel (Moot); "The eldest Grey Wife says:" under the Book's grid (Grey Wives); the extra sentence after a missing name's hint and the remark under the Names heading (Bell-Watchers); the Quenchers' voice in "What the hearth leaves" (Quenchers).
- **Rules:** each shows only while its Order is seated and at or above the line's level; unseated shows none; the Names sentence is only for names still missing in the level's group; the remark replaces it once the group is found; the Quenchers' voice appears only once that Account exists in the save, and only account n (not 1 to n).
- **Please look at (D430, Proposed):** which Book hint shows when an earlier brew is still unknown but the level's own brew is known; the Quenchers' voice is a row with no document to open.
- **Tests:** `tests/orders/perk-texts.test.ts` (10). The notice text itself is unchanged (the head's line is a separate field). I did not run the app in a browser here; the screens are small additions to existing ones, so please glance at them in the T10.13 playtest.
- `npm run check` green. Golden fights and recorded stands unchanged; no existing test edited.
- **Next:** T10.12.
- **D430 accepted by the owner** (logged as D431 with D428 and D429). Nothing is waiting on the owner; Q35 is informational.

## 2026-10-21 — v0.10 session 2 (continued): T10.12 debug commands
- **Seven debug commands** (`core/commands/debug-orders.ts`), each a `debug.orders*` command through `apply()` and a button in the debug panel's new Orders block: open an Order, add standing, set a level, open the third seat, clear the seat wait, play a chapter, reset the Orders. All set `debugUsed`.
- **How they read:** standing added goes in as "Brought from before the Orders". Set level only raises (levels never drop; Reset is the way back). Play chapter opens the Order and raises its level if needed, counts the earlier chapters as read, reads that one with the Orders seated as they are, and ignores a chapter's extra condition. **None of them seats an Order.**
- **Reachable only from the panel:** the panel is already hidden unless the page has `?debug` or is a dev build; a test checks that nothing else in `src/ui` sends these commands.
- Tests: `tests/orders/debug-commands.test.ts` (9). `npm run check` green. Golden fights and recorded stands unchanged; no existing test edited.
- **Not seen in a browser** (the panel buttons are plain additions to an existing sheet).
- **Next:** T10.13.

## 2026-10-21 — v0.10 session 2 (continued): T10.13 screens, part 1
- **Built:** the Orders card on the Hold screen (after the Events card when shown, else after the last card), the one Hold-tab badge, the opening scenes (Seat it / Not now, or Continue when no seat is free), the "Seat your Orders" step (a sheet on load, from the card until used, and inside the new-warden step), and a "Change seats" sheet (Seat, Unseat, Swap in). What the screens say is worked out in `core/systems/orders-view.ts`; the UI is in `src/ui/orders/`.
- **Seen in a browser (phone size):** the card, the step, an opening scene and the change sheet, on the owner's save; no sideways scroll at 360, 900 and 1300 px. A swap is 3 taps. T10.11's perk texts are still not seen in a browser (they sit in other screens).
- **Please look at (D432, Proposed):** (1) the cooldown reads "Can change in 9h 20m" (the game's duration format and what the command already says); the GDD and plan write "9 h 20 m". A one-word change if you want the spaces. (2) the "Change seats" button, which T10.14's Order sheets will reuse. (3) "Skip"/"Done" use a new command that never clears a cooldown. (4) A scene closed with ✕ stays waiting and the card offers it.
- **Not checked by a test:** the card's exact position among the cards (by code only).
- Tests: `tests/orders/card-view.test.ts` (8), `tests/e2e/orders-card.spec.ts` (phone). `npm run check` green (2,658). Golden fights and recorded stands unchanged; no existing test edited.
- **Next:** T10.14. (D433: the owner accepted D432 as built, no spaces in the cooldown.)

## 2026-10-21 — v0.10 session 2 (continued): T10.14 screens, part 2
- **Built:** the Order sheet (tap a card row: standing with its breakdown, next threshold, the four levels with the real number, chapters read, waiting or readable and why, Seat / Unseat / Swap, the cooldown line, "You keep your standing and chapters."); chapter scenes (text from lore §33, the variant by the seats at that moment, Close and Next); the Library's Orders shelf (not shown until a chapter is read, "read with …", Ilse's note); the Villages panel entry already existed from T10.11. Views are in `core/systems/orders-sheet-view.ts` and `core/story/orders-chapter-view.ts`; each level's number is the perk's own breakdown line.
- **Chapters open by themselves** after the opening scenes and the load step (one at a time, D416 (6)); opening one counts it as read and saves the seats. The Quenchers' line says "easier waves, smaller Embers".
- **Seen in a browser (phone size):** the Order sheet, a chapter, the shelf and unseating; no sideways scroll at 360, 900 and 1300 px.
- **Please look at:** (1) the short "perk in words" lines on the Order sheet are interface text I wrote, not lore (e.g. "A head's word at the end of that village's notices"); (2) the plain wording for waits ("Waits for level 2.", "Waits for Vesna to be on your roster.") and for chapter 4's two endings; (3) my T10.13 browser test gained one step (close the first chapter that now opens after seating the Moot); nothing was removed from it.
- Tests: `tests/orders/sheet-view.test.ts` (12), `tests/e2e/orders-sheets.spec.ts`. `npm run check` green (2,670). Golden fights and recorded stands unchanged.
- **Next:** T10.15.

## 2026-10-21 — v0.10 session 2 (continued): T10.15 art
- **Drawn in code (Q36 (a)):** an Orders icon (an empty high-backed chair), a 16 px mark for each Order (a gate arch over a long table; a basket under a cloth; a bell on its post; a cold stove with a drop of water), and a 160 × 64 placeholder scene for each opening. `tools/draw-orders.ts`, written by `tools/gen-sprites.ts`; every one has a manifest row (generated, CC0). The credits file and the contact sheet are regenerated (new "The Orders" section).
- **Shown:** the icon on the card's and the shelf's titles, each mark on its card row and Order sheet, the scene at the top of its opening scene. Seen in a phone-size browser.
- **Not ticked:** the acceptance says the owner has seen the placeholders and the art. A picture of all nine is in `docs/orders-art-preview.png`; the full contact sheet is `public/contact-sheet.html`. Tell me what to change, or approve them.
- Tests: `tests/tools/orders-art.test.ts` (redraws each file and compares, size, palette). The older art test was not touched. `npm run check` green (2,681). Golden fights and recorded stands unchanged.
- **Next:** T10.16.

## 2026-10-21 — v0.10 session 2 (continued): T10.15 approved, T10.16 done
- **Art approved by the owner** (D434); T10.15 ticked.
- **T10.16:** `tests/orders/full-run.test.ts`: from the migrated fixture (`v10.json`) the Orders are opened by the load path (the Quenchers by the debug command if the save is not past them), levelled with the debug commands, and every one of the 16 chapters is read in order with the player's own seat and read commands. Both endings of the Moot's and the Quenchers' chapter 4 (A with both seated, B without), the shelf, the badge clearing, a round-trip and "same fixture and commands, same state" are checked. New fixture `v10-played.json` (the migrated owner save, load path and 72 h of the Standard player; no Order seated), made by `scripts/make-v10-played-fixture.ts`, with its own load, round-trip and play-through tests.
- **Browser smoke:** a new phone test (seat the Moot in the step, its first chapter opens and is read, a seat change from the card, reload keeps it). **Whole phone browser suite: 24 of 24 pass.** WebKit's determinism run could not start here (the browser is not installed in this container); it does not touch the Orders.
- **Fixed in my own code:** Close on a chapter was undone (the next chapter opened at once). A chapter now opens by itself once on load and again after a seat change; Close stops there, Next goes on, and the card shows "A chapter can be read" for the rest.
- **Owner-approved test edits (D435, D436):** the older opening test skips played saves (and a new check names them); a close-scene helper in 10 older browser tests; the Events test checks the Events card's own dot. **My mistake:** I had not run the whole browser suite since T10.13, so eight older tests were broken for two tasks and I found them only now.
- `npm run check` green (2,692). Golden fights and recorded stands unchanged.
- **Next:** T10.17.

## 2026-10-21 — v0.10 session 3: T10.17 the Orderer
- **The Orderer is built** (GDD §6.1, D417): Standard's check-ins plus the Delver's Delve sessions, Monday seeds only, in its own `orders` shard (also added to the CI workflow). It finishes opening scenes ("Seat it" with a free seat, else "Continue"), takes the third seat at once, reads every chapter that can be read, and at each new warden seats the top-ranked Orders (due chapters, then most unread, then list order). Never swaps mid-cycle. Code in `src/core/policies/orderer.ts`; its run record and report section ("Orders") are in `sim/`.
- **Nothing else changed:** the full suite (55 runs, 376 s on this 4-core machine) shows every old group `same` against the baseline and all 48 rows passing. `tests/policies/orderer.test.ts` checks that no other policy issues an Orders command or seats anything.
- **Timings:** a 3-cycle Orderer run is about 15 s (limit 60); the whole `orders` shard is 59 s (limit 5 min). `npm run check` is green (2,705 tests, about 87 s: tight against 90).
- **First look (5 seeds, sketch values, not judged yet):** all 16 chapters are read by cycle 7–8 (the row says 8); the Quenchers open only in cycle 5 and reach level 4 in cycles 7–8; the third seat opens in cycle 5–6; Grey Wives reach level 4 last (cycle 8–9); silver from bounties 83–84%; provisions share 16–20% (the row says 20–40%, so this one will likely need a tunable or a question in T10.18); chapter 1 after an Order opens takes 19–77 h for the Moot and Grey Wives (the row says 24 h).
- **Owner-approved test edit (D437):** `sim/shards.test.ts` knows the Orderer and its shard (55 runs); the balance rule is as strict as before.
- **D438 (Proposed):** the Quenchers' perk acts on Threat over a whole cycle, so a seat flipped at the stand changes nothing; "perk on and off" is read as the cycles where they sat against those where they did not, with Embers and Threat for each. Say if you want a paired run instead.
- **Not done:** the six rows (T10.18, after you approve them) and `sim:accept` (after your playtest).
- **Next:** T10.18.

## 2026-10-21 — v0.10 session 3 (continued): T10.18 simulator rows
- **Six rows in `sim/targets.ts`, own commit, after your approval** (D443); checks in `sim/checks/v010.ts` (+ tests). Milestone is now v0.10. Full suite (55 runs, 388 s on this 4-core machine): all 54 rows pass, every old group unchanged.
- **Row (a) read differently (D440, your answer):** only Orders the Orderer seats at their opening are judged; the Grey Wives wait 77.5 h for a seat (new warden) and are reported. No tunable could fix it.
- **Tuning (D441, Proposed, tunables only):** level thresholds lowered (Moot [5,40,100,200], Grey Wives [10,70,180,330], Bell-Watchers [5,50,120,250], Quenchers [10,40,100,180]). Before: Grey Wives level 4 in cycle 8, Quenchers 7 to 8. After: cycles 5, 3, 3, 5; all 16 chapters by cycle 5 (floor: the Quenchers open in cycle 5). Silver 73.1% (thin), provisions 26.3%, stands 372 Embers with the Quenchers seated against 376 without. Weights, chunk, cap, perks untouched.
- **Old tests edited with your yes (D442):** the §7.12 constants test, two migration tests, and the `start` block of `v10.json`. Nothing loosened.
- **Seen, for the playtest:** with the lower thresholds the Orders may come fast (all levels by cycle 3 to 5); say if you want it slower and I retune in T10.19.
- `npm run check` green (2,709 tests). Golden fights and recorded stands unchanged. rulesVersion 5.
- **Next:** T10.19.

## 2026-10-21 — v0.10 session 3 (continued): T10.19 wrap-up
- **No further tuning needed:** the T10.18 thresholds are the final ones; nothing else moved. No locked constant changed (the constants test passes; the only balance change this milestone's last two tasks is the four level thresholds, D441).
- **Checks:** all 54 simulator rows pass on 5 Monday seeds (T10.18 full run, same constants); `npm run check` green (2,709); whole phone browser suite 24 of 24 (WebKit is not installed here); `npm run build` works (5 s). A fresh `v10.json` meets the Orders through the load path (tests/orders/opening, full-run and the phone smoke); your own save is not assumed to still hold its scenes.
- **Measured timings (this 4-core machine, not a phone):** v9 → v10 migration of your save 5.0 ms; Orders card view 0.04 ms; Order sheet 0.02 ms; standing recompute (all four) 0.005 ms; save growth about 350 bytes (217,273 → 217,620). Simulator: 3-cycle Orderer run about 15 s; `orders` shard 59–64 s; full suite 388 s on one machine (CI splits it into shards).
- **Waiting on you:** (1) the playtest; (2) the Orders rows for GDD §6.5 (the proposed numbers are below in the pull request text, not yet written into the GDD); (3) D438–D443 are decided; D441 stays Proposed until you accept it.

## 2026-10-21 — v0.10 closed
- **The owner said the playtest passed;** D441 approved (D444) and the Orders budgets approved (D445). The budgets are in GDD §6.5, and the four timing rows are in the throttled benchmark (card 0.10 ms, migration 18.7 ms at 4× slowdown); the save-growth row is a unit test (`tests/orders/save-size.test.ts`).
- **`sim:accept` run** on the full suite (55 runs, 367 s): all 54 rows pass; baseline recorded with the new `orderer/mon` group.
- **Plan:** v0.10 `Status: complete`. Merged to `main` and tagged `v0.10.0` (see the pull request).
- **Known:** the older odds benchmark row fails on this container's CPU (215 ms against 200 ms); it is untouched and outside `npm run check`.
- **Next:** v0.11 flesh-out (The Remembering).

## 2026-10-21 — v0.11 session 1: the flesh-out is applied (docs only)
- **Step 0 passed:** `v0.10.0` is tagged and in `main`; `sim/baseline.json` is the accepted one. The owner said yes to OUT-3 (all four ★ lines) and every reading (D459, D461–D467); **D460** logged. Q38 answered (a).
- **Applied:** files in `docs/flesh-out/v0.11/` and `v0.11-summary.md`; D446–D467 in `decisions.md`; GDD §5.15, §9.19, B1–B11 (all five find texts matched); lore §34 and its five small edits (the closing line no longer appears in lore); the plan section (17 tasks), §0.7 (v0.10 actual: 20 entries over 3 numbered sessions), the "Depth" line and v1.0 scope; OUT-9 into the technical design (§5.2, §6.2, §9.4, §10.0, §11.2, §13.4, §14, §15); Q38–Q44 in `questions.md` (Q33 marked answered, Q35 closed); three standing rules in `CLAUDE.md`; names in `tests/content/names.ts`.
- **GDD B11:** the §9.18 Quenchers text had no "for v0.11" wording to change; §5.13.6 and §5.13.8 were updated instead.
- **Sweep (plan step 4):** `Proposed` rows from D357 up that D446 does **not** name: D367–D384, D387–D399, D402, D403. Not edited; asked the owner.
- **Checks:** `npm run check` green (165 files, 2,710 tests, about 70 s with the simulator set).
- **Next:** T11.1. No code was written. The preview does not change.

## 2026-10-21 — v0.11 session 2: T11.1 save v11
- **D468 logged:** the owner accepted the remaining `Proposed` rows (D367–D384, D387–D399, D402, D403) and chose to build on the current branch for now.
- **Built:** schema 11; `remembering` (`nearSeen`, `readyNoted`, `endings`) with `src/core/state/remembering-state.ts`; `migration-v11.ts` (empty block, nothing else touched); the guard in `validate-remembering.ts` (unknown ending ids drop with a warning; a repeat, a `vigil` after `remember`, a cycle that does not exist or a negative time is refused; order is array order, `at` is never compared).
- **Fixtures:** `v11.json` (v10.json migrated; `scripts/make-v11-fixture.ts`) is needed by the existing "a fixture for every version" test. The owner's new save of today is added as `v9-fresh.json` (a real v9 file: cycle 1, almost nothing built), so the whole chain runs on it. `v11-played.json` is still due at T11.5.
- **Tests:** `tests/saves/v11-migration.test.ts`: both v10 fixtures migrate, validate, round-trip; empty block; the step leaves `orders` and everything else identical; golden fights and recorded stands replay; schema 12 is refused; guard cases.
- **Test edits (each a literal "10" that meant "the current schema"):** `tests/saves/v10-migration.test.ts` (two) and `tests/orders/full-run.test.ts` (one) now read `SCHEMA_VERSION`. Nothing loosened.
- **Deferred to T11.2:** dropping an ending recorded before Act VI's stand, and warning when a stored ending's gate no longer holds; both need the gate and `actVIStandApplied`, which T11.2 builds.
- **Next:** T11.2.

## 2026-10-21 — v0.11 session 3: T11.2 the gate and the content tests
- **Built (all derived, nothing stored):** `src/core/story/remembering.ts` with `namesFound`, `speciesStudied`, `rememberingGate` (40 names and all 16 contract species at the stored level Studied or better), `actVIStandApplied` (Act VI's cycle has its stand result, or a later cycle exists) and `endingChoosable`. The 16 species are the list in `src/content/remembering.ts`.
- **T11.1's deferred checks are in:** on load, an ending recorded without Act VI's stand applied is dropped with a warning; one whose gate no longer holds is kept with a warning (`reconcileEndings`, run after the whole state is built).
- **Tests:** `tests/remembering/gate.test.ts` (closed at 39 names; closed with one species at 3 kills; reads the stored level, not kills; open with all; Mastered counts; never stored; Act VI stand cases; the two load checks; a set-back clock changes nothing) and `tests/content/v11-gate.test.ts` (the list pinned to 16 ids; equals the species contracts name and the base stand pool, so Q39 stays closed; Great Beasts, quarries, guardians and the Dross-Tide excluded; every species and every name has a free source; a planted Order-only, Delve-only or event-only source fails).
- **Test edit:** the T11.1 guard tests in `tests/saves/v11-migration.test.ts` now start from a save past Act VI's stand with the gate open (the new load check would otherwise drop their endings); nothing loosened.
- **Note:** "Act VI's cycle" is read from `story.acts` (the act-6 entry's cycle), the persisted fact. 
- **Next:** T11.3.

## 2026-10-21 — v0.11 session 4: T11.3 remove the closing line
- **Removed:** the line and its constant; `actClosing` now returns Act VI's testament or nothing. The Long Night builds its steps from a list, so a cycle with no act (or no testament found) skips the step; Act VI's D6-06 and Act V's Thole line still play. New helper `longNightTestament` is what the sheet uses and what the test reads.
- **Docs:** already clean from the docs commit (GDD B1–B5, lore §5 and §31). The new test checks `docs/` too.
- **Tests edited under D465 (to assert the line's absence, nothing else loosened):** `tests/story/documents.test.ts` ("an unwritten act closes with..." now "a cycle with no act closes with nothing") and `tests/story/act6-lines.test.ts` ("the cycle after it shows the unwritten line" now "closes with nothing"). Both now expect `null` for act 7.
- **New:** `tests/story/closing-line.test.ts`: a story-less Long Night has no testament step; D6-06 still closes Act VI; the line is in none of `src/`, `public/`, `index.html`, and in `docs/` only in the decisions log, `docs/archive/` and `docs/flesh-out/`.
- **Not done:** no screenshot or on-phone look at the shortened Long Night (three steps instead of four); it is on the playtest list under "after".
- **Next:** T11.4.

## 2026-10-21 — v0.11 session 5: T11.4 near-scene, card, ready line
- **Built:** commands `remembering.seeNear` (only on Continue; the ✕ sends nothing) and `remembering.noteReady`; derived views in `core/story/remembering-view.ts` (which scene, the card's form and live counts, the ready note); texts in `content/text/remembering.ts`, word for word from lore §34.1–34.2; UI in `src/ui/remembering/` (scene, card, ready line).
- **Where it shows:** the scene after the Orders openings and the "Seat your Orders" step, only on the Hold tab (D459 (6)), once a session so a ✕ cannot loop; the card after the Orders card, hidden until the scene is seen, with Names and Bestiary links (the tab signal moved to `runtime.ts` so a card can send you to the Archive); the ready line on the away sheet and on live result sheets.
- **Tests:** `tests/remembering/near-card.test.ts` (R-01 or R-02 by the gate; waits for the stand; seen only by the command; no second scene; counts equal the Names view and the species known well; no bar or percentage; ready line once; texts equal the lore; none of the 40 names or forbidden phrases).
- **Left for later tasks (by plan):** the open form's two choices (T11.5), "Read it again" and the Library (T11.13). Until T11.5 the open card shows its first line only.
- **Not seen on a phone:** no layout check yet (T11.16). If you close the scene with the ✕ it comes back on the next load; there is no button for it, because the card is hidden until the scene is seen and I may not invent text.
- **Next:** T11.5.

## 2026-10-21 — v0.11 session 6: T11.5 the choice and the debug commands
- **Built:** `remembering.choose` (refused before Act VI's stand, with the gate closed, twice, and for the vigil after Remember Them; it records the ending and changes nothing else); the card's open form now has Remember Them and Keep the Vigil, and the after-vigil form has Remember Them. For now choosing only records: the scenes that follow come with T11.6 (R-10) and T11.9 (the sequence).
- **Debug commands (D462):** "Open the gate" writes the 40 names and Studied species with no rewards (no document filed; Orders and skills unchanged). "Finish Act VI" begins Act VI if needed, takes the hold to Bastion and makes the real Last Stand, so it **plays the Long Night: the hold resets as in play** (hunters, Embers, the roll and the bestiary persist). I chose this over writing a stand record by hand because it is valid by construction and leaves no cycle stuck; say if you would rather have the lighter version. Both are on the debug sheet under "The Remembering".
- **Names of the commands:** `debug.rememberingOpenGate` and `debug.rememberingFinishActVI` (the Orders debug commands are camel-cased too), `remembering.choose`; the docs say `debug.remembering.openGate()` as a description.
- **Fixture:** `v11-played.json` made by `scripts/make-v11-played-fixture.ts` from `v11.json` through the debug and player commands: past Act VI's stand, vigil then Remember Them. It loads, validates, round-trips, and its fights and stands replay.
- **Tests:** `tests/remembering/choose.test.ts` (every refusal; the card's forms along the owner's path; the debug commands, including no side effects and a stand that replays; the fixture).
- **Test edit:** `tests/orders/opening.test.ts` lists the played fixtures it leaves out; `v11-played.json` is added (it has its Orders open already). Nothing loosened.
- **Next:** T11.6.

## 2026-10-21 — v0.11 session 7: T11.6 Keep the Vigil
- **Owner:** agreed that "Finish Act VI" plays the real Long Night (recorded in the T11.5 entry).
- **Built:** R-10 "Later" (lore §34.4, word for word) opens when the card's Keep the Vigil succeeds, so it plays once (a second choice is refused); the Library gets the shelf "The Remembering" with one entry, "Later" (*Pechko, when you were not ready.*), shown only after the vigil and replaying the scene. The shelf has room for "The reading" (T11.13).
- **Tests:** `tests/remembering/vigil.test.ts`: the state outside `remembering` is identical after the choice at the same time (ignoring `meta.lastSeen`, the clock high-water mark and `events.clock`); the choice is recorded once; the shelf is hidden, then shows "Later" and keeps it; the text equals the lore, with none of the 40 names and no avoid-list word.
- **Nothing skipped.** Not seen on a phone (T11.16).
- **Next:** T11.7.

## 2026-10-21 — v0.11 session 8: T11.7 the reading
- **Built:** Remember Them now plays R-03 "The roll" (lore §34.3, word for word) and, on Continue, the reading: one name at a time on a dark rime-coloured card, in order of year, about 2 seconds each; a tap anywhere shows the next at once; Skip jumps to the last frame; after the fortieth name the Unlit's line shows (★, lore §34.5, word for word) with a Continue button.
- **Same data as the Names view:** `readingFrames()` is built from the roll table and village names the Names view uses; a test checks both against lore §34.5 and against the Names view's own lines.
- **Pace:** `src/ui/remembering/timing.ts` (2000 ms, outside `balance.ts`; no game constant). Reduced motion drops the fade through the existing motion rules; the speed is unchanged.
- **Tests:** `tests/remembering/reading.test.ts` (table equals lore; R-03 and the Unlit's line equal the lore; fake timers: pace, tap restarts the interval, Skip stops it).
- **Choices I made:** the reading is a tall dark card inside the existing sheet, not a separate full-screen layer (less new code; T11.16 can judge it on a phone). Tapping Remember Them records the ending at once; after the reading, Continue just closes. T11.9 adds the scenes that follow, and T11.13 the "Read it again" button, so until then a closed reading cannot be replayed.
- **No old test edited. Nothing skipped. Not seen on a phone** (T11.16).
- **Next:** T11.8.

## 2026-10-21 — v0.11 session 9: T11.8 Orders in the ending
- **Built:** `endingOrderCards(state)` (`core/story/ending-orders.ts`) gives the Orders' cards in the fixed order Moot, Grey Wives, Bell-Watchers, Quenchers. An Order has a card only if its chapter 4 was read; the Moot and Quenchers cards pick variant A or B from `readWith` of that chapter. The Quenchers give Věra's fallback if they opened but chapter 4 was not read, and nothing if they never opened. It reads `chaptersRead`, `readWith` and `orders.opened` only.
- **Texts:** R-05 to R-08 and the fallback, word for word from lore §34.6 (`content/text/remembering-orders.ts`).
- **Tests:** `tests/remembering/ending-orders.test.ts`: none read; fallback only; unread but opened Orders silent; one read; unfinished Order silent; all read (A/A, B/B, mixed); changing seats, levels and counts changes nothing; texts equal the lore; none of the 40 names.
- **Not shown yet:** the cards are data only; T11.9 puts them in the sequence.
- **Branch:** `milestone/v0.11` created from this commit so the preview exists (the reading can be tried from the debug panel). Later pushes go to both branches.
- **No old test edited. Nothing skipped.** **Next:** T11.9.

## 2026-10-21 — v0.11 session 10: T11.9 the ending sequence
- **Built:** `endingSequence(state)` (`core/story/ending-sequence.ts`) is the whole ending as one list: R-03, the reading, R-04, R-04b (only if Sigrun is owned), the Orders' cards, R-09, R-11. Remember Them now plays it as a stack of sheets, each with Continue; Skip is on the reading only. Texts word for word from lore §34.6–34.7 (`content/text/remembering-ending.ts`). The card then shows its "After Remember Them" form.
- **R-11 is in already,** with Ilse's note, because the acceptance list names it as the last card. T11.10 still owns the Rime shelf entry, the "no side effects" test and the Roll of Wardens mark.
- **Closing early:** nothing is lost; the list is rebuilt the same each time. The Library button that replays it is T11.13, so until then a closed ending cannot be replayed.
- **Tests:** `tests/remembering/ending-sequence.test.ts` (order, with and without Sigrun, one reading, same every time, seats ignored, After form, texts equal the lore, no names).
- **Not seen on a phone** (T11.16). Nothing skipped; no old test edited.

## 2026-10-21 — v0.11 session 11: T11.10 R-11 and the Roll of Wardens mark
- **Built:** R-11 on the Archive's Rime shelf under "After the ending" (rime plus Ilse's note), derived from the saved ending, so it is no found document: no standing, no XP, no badge, no act group. The Roll of Wardens marks the warden in office when Remember Them was chosen with a small lamp drawn in code and "Read the roll aloud." (lore §34.7); the mark stays with that warden when later wardens take office.
- **Tests:** `tests/remembering/ending-effects.test.ts`: Remember Them leaves `orders`, `skills`, documents and all else unchanged (outside `remembering`); the sequence touches no state; R-11 absent before, after Keep the Vigil, present after Remember Them and never in the found documents; the mark is on exactly the right warden.
- **My wording:** the Rime entry is titled "It is warm where I am" (R-11's own heading), with no witness line. The sub-heading "After the ending" is lore's.
- **Not seen on a phone** (T11.16). No old test edited. Nothing skipped.

## 2026-10-21 — v0.11 session 12: T11.11 resident lines
- **Asked first** (there was no idle rotation, and Ilse had no lines). **Owner chose:** a small rotation, one line once per app session.
- **Built:** the eight lines of lore §34.7 (word for word, `content/text/remembering.ts`); on opening the Hold screen, once an app session, one of them shows in the speech spot under the hold's title, only after Remember Them is recorded. Ilse speaks only here. Nothing is saved, so the pick is random each session (it cannot follow a fixed order without a new saved field); an event's line may replace it. The six triggered lines are unchanged.
- **Tests:** `tests/remembering/resident-lines.test.ts` (texts equal the lore; none before Remember Them or after the vigil; all eight reachable after; triggered lines unchanged; no names).
- **Not seen on a phone** (T11.16). No old test edited. Nothing skipped.

## 2026-10-21 — v0.11 session 13: T11.12 the Hearth Hall look
- **Asked first** (the scene is the hold's outside picture on the Hold screen, one per Rank, and it had no frost). **Owner chose:** Q42 (a) code-drawn; draw the frost and then remove it; the lamp on all four Ranks.
- **Built:** two code-drawn layers per Rank (`tools/draw-hold-look.ts`, written by `tools/gen-sprites.ts`, 8 manifest rows, credits regenerated, contact sheet regenerated). **Frost** (rime along the foot of the walls and on the ground) shows from the start of Act VI until Remember Them is chosen; **lamp** (a lit window: gold panes, orange bar) after it. Keep the Vigil keeps the frost. The layers sit on top of the cosmetics so the lamp is never hidden. Which look applies is `holdLook(state)`, a picture only; no number reads it.
- **Tests:** `tests/remembering/hold-look.test.ts` (plain, frost, lamp, vigil keeps the frost; the eight images equal what the generator draws, 160 × 64, in the palette).
- **Owner: please look** at the Hold screen in the preview (debug: Finish Act VI shows the frost; Open the gate, Remember Them shows the lamp) and approve or ask for changes. The frost is a speckled band; I can thin or thicken it.
- **Not seen on a phone** (T11.16). No old test edited. Nothing skipped.
- **Owner's change (same session):** thicker frost, and rime on the roofs. The ground and wall-foot frost is denser, and a ragged cap of rime now sits under the top outline of roofs, towers and trees (found by reading the scene picture, so it follows each Rank). The lamp is unchanged. The look still awaits your approval.

## 2026-10-21 — v0.11 session 14: T11.13 the Library shelf
- **Owner approved the frost and lamp look** (thicker frost, rime on roofs).
- **Built:** the shelf "The Remembering" now has "The reading" (*The roll, read aloud in the Hearth Hall.*) after Remember Them, which replays the whole ending (R-03 to R-11, Skip on the reading only), then "Later" after the vigil. It stays hidden until an entry is reached; neither depends on the gate. The card's "After Remember Them" form has a "Read it again" button doing the same, so a closed ending can now be replayed. R-11 was already on the Rime shelf (T11.10).
- **Tests:** `tests/remembering/library-shelf.test.ts` (hidden, both entries and their order, titles and blurbs equal lore §34.8, replay is whole and changes nothing, the card's four forms, after-choice forms with the gate artificially closed).
- **Older test edited (the plan allows it):** `tests/remembering/vigil.test.ts` expected the shelf to be just "Later" after both choices; it now expects "The reading" then "Later". Nothing loosened.
- **Not seen on a phone** (T11.16). Nothing skipped.

## 2026-10-21 — v0.11 session 15: T11.14 the text content test
- **Built:** `tests/content/v11-texts.test.ts` runs lore §34.10 on every v0.11 text outside the reading (R-01 to R-11, the card lines, the ready line, the Unlit's line, the eight resident lines, the shelf blurbs, the Roll mark): each text is found in lore §34; the Orders' checks (forbidden words, the case rule for "hollow", relative years, the 40 names, unknown people) pass; no digits at all (so no year number); R-01, R-02 and the ready line also pass the opening-scene word list. The 40 names are also checked against the v0.11 source files (whole words, so "Lis" is not found in "Lisová"). Planted bad texts prove each check can fail. Checks 7 and 8 stay with `ending-orders.test.ts` and `ending-effects.test.ts`.
- **Reading used:** Sigrun is allowed (lore §34's list has her, the Orders' list does not), and "Hearth Hall", "Roll of Wardens", "Remember Them" and "Keep the Vigil" are not people. The test says so in its own filters; `orders-checks.ts` is untouched.
- **No text needed changing; no old test edited. Nothing skipped.**

## 2026-10-21 — v0.11 session 16: T11.15a the reachability measurement
- **Result: stop (D464 (1)).** Standard, 5 Monday seeds, the usual run (8 Long Nights): **the ending is never choosable in any seed** (three or more never means stop and ask). All 40 names are found by cycle 6 and Act VI's stand is applied in every seed; the species half is what is missing (7 to 10 of 16 Studied; Draugr, Leshy, Strzyga, Anvil-wight and Rimewrought most often). I did not lengthen the run. The question, with options and a recommendation, is **Q45**; T11.15 is marked `[?]`.
- **Built (report only):** the run record gains one field, `ending` (the first moment the ending was choosable, plus the names, species and stand the hold had at the end), and the Standard report gets a section "The Remembering". No policy, constant, target or baseline changed; the players never choose an ending. `npm run check` is green; the baseline holds only moments, so it is unchanged.
- **Cost:** the five-run Standard measurement takes about 55 s on this machine.
- **Next:** T11.16 (layout checks and budgets) does not depend on Q45. T11.15b waits for the owner's answer.

## 2026-10-21 — v0.11 session 17: T11.16 layout checks and budgets
- **Owner answered Q45 (a)** (D469): the row will judge "all 40 names found and Act VI's stand applied by cycle N". T11.15 is open again (measure that, propose N, stop for the owner).
- **Layout (Playwright, production build, `tests/e2e/remembering-layout.spec.ts`):** at 320, 360, 900 and 1300 px: no sideways scroll, and nothing wider than its sheet, with Pechko's scene, the card (not open, open, after Remember Them), R-03, the reading (names 1, 20, 40 and the Unlit's line), every ending card, the Library shelf and the Names view. All 40 names with their village lines are tapped through at 320 and 360 px and each sits inside the sheet. I looked at the screenshots: nothing clips.
- **One real finding, fixed:** the pixel font has no č, ě, ř, š, Š or ž, and eleven of the forty names use them, so the reading's names would have fallen back to another font letter by letter. The reading's name now uses the normal font, bold. (The Names view already did.)
- **Budgets (D445 route), measured, not yet in the GDD or enforced:** reading start (tap on R-03's Continue to the first name painted), 4× CPU slowdown: **15 ms**; v10 → v11 migration of a played v10 save, 4× slowdown: **18.6 ms**. **Proposed rows for you to approve (GDD §6.5):** reading start ≤ 50 ms (the same as an Order sheet opening); v10 → v11 migration ≤ 100 ms (as v9 → v10); `remembering` save growth ≤ 0.5 KB, which is now a unit test (`tests/remembering/save-size.test.ts`; the block is about 150 bytes full). The two timing rows are logged by `bench` and become checks once you approve them.
- **Seen, not mine:** at 360 px the Archive's section tabs ("Bestiary, Library, Accounts, Names") run past the edge, so "Names" is cut off (the row scrolls; the page does not). It has been so since v0.5. I did not change it; it is for the polish pass unless you say otherwise.
- **Known, unchanged:** the older "odds with 3 candidates" row still fails on this container's CPU (D445); it is not part of `npm run check`.
- **Not seen on a real phone**, only emulated (Pixel 7 at 360 and 320 px). No old test edited. Nothing skipped.
