# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v0.9` (from `main`, the v0.8.0 merge); the v0.9 flesh-out is applied (docs commit).
- **Last task:** the v0.9 docs commit (no code).
- **Next:** T9.1 — save v9 (`events`, `standPool`, v8 → v9 migration, fixtures from `v8-owner.json`).
- **Open questions:** Q28 (tokens-not-wasted row, may block T9.17), Q29 (pool size, ends T9.13); one stop-and-ask below (`riftglass.bankWeeks`).

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
