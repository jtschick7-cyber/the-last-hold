# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v0.11` (the preview follows it); work is pushed to it and to `claude/stoic-keller-hav7be`. Nothing is merged or tagged.
- **Milestone:** v0.11 "The Remembering" (D446–D470). All 17 tasks are built; `Status: in progress` until the owner's playtest.
- **Last task:** T11.17 docs, the pull request and the playtest hand-off.
- **Next:** the owner's playtest of the preview. Only after the owner says it passed: merge, tag `v0.11.0`, `Status: complete`, `npm run sim:accept`, a decisions row.
- **Open questions:** Q41 and Q43 informational; everything else answered. Q43 ("Gaunt" or "Gloam" Wolf) is for the polish pass.

Earlier entries are in [`docs/archive/progress-2026-10-11-to-15.md`](archive/progress-2026-10-11-to-15.md) (to T8.15) and [`docs/archive/progress-2026-10-15-to-21.md`](archive/progress-2026-10-15-to-21.md) (T8.16 to T11.15). Read only the last entry at session start.

## 2026-10-21 — v0.11 session 17: T11.16 layout checks and budgets
- **Owner answered Q45 (a)** (D469): the row will judge "all 40 names found and Act VI's stand applied by cycle N". T11.15 is open again (measure that, propose N, stop for the owner).
- **Layout (Playwright, production build, `tests/e2e/remembering-layout.spec.ts`):** at 320, 360, 900 and 1300 px: no sideways scroll, and nothing wider than its sheet, with Pechko's scene, the card (not open, open, after Remember Them), R-03, the reading (names 1, 20, 40 and the Unlit's line), every ending card, the Library shelf and the Names view. All 40 names with their village lines are tapped through at 320 and 360 px and each sits inside the sheet. I looked at the screenshots: nothing clips.
- **One real finding, fixed:** the pixel font has no č, ě, ř, š, Š or ž, and eleven of the forty names use them, so the reading's names would have fallen back to another font letter by letter. The reading's name now uses the normal font, bold. (The Names view already did.)
- **Budgets (D445 route), measured, not yet in the GDD or enforced:** reading start (tap on R-03's Continue to the first name painted), 4× CPU slowdown: **15 ms**; v10 → v11 migration of a played v10 save, 4× slowdown: **18.6 ms**. **Proposed rows for you to approve (GDD §6.5):** reading start ≤ 50 ms (the same as an Order sheet opening); v10 → v11 migration ≤ 100 ms (as v9 → v10); `remembering` save growth ≤ 0.5 KB, which is now a unit test (`tests/remembering/save-size.test.ts`; the block is about 150 bytes full). The two timing rows are logged by `bench` and become checks once you approve them.
- **Seen, not mine:** at 360 px the Archive's section tabs ("Bestiary, Library, Accounts, Names") run past the edge, so "Names" is cut off (the row scrolls; the page does not). It has been so since v0.5. I did not change it; it is for the polish pass unless you say otherwise.
- **Known, unchanged:** the older "odds with 3 candidates" row still fails on this container's CPU (D445); it is not part of `npm run check`.
- **Not seen on a real phone**, only emulated (Pixel 7 at 360 and 320 px). No old test edited. Nothing skipped.

## 2026-10-21 — v0.11 session 18: T11.15a measured for the narrower row (D469)
- **Measured** (Standard, 5 Monday seeds, usual run, 52 s): all 40 names found **and** Act VI's stand applied by the end of cycle **6, 6, 6, 6 and 7** (at 446 to 486 hours). Median **6**. The full ending is still never choosable (species, as in Q45).
- **Proposed N = 6** (the median, so the row passes by construction). Four seeds are at 6 and one at 7; a seed that never got there would count as later than any N. Judged in `sim.yml` only, not in `npm run check`.
- **Built (report only):** the run record's `ending` field now also holds the moment names and stand were both reached; the report shows it per seed and the median. No policy, constant, target or baseline changed.
- **Waiting for the owner:** approve N = 6 (or name another). **Then T11.15b:** the row alone in `sim/targets.ts`, with its check, in its own commit. I did not touch `sim/targets.ts`.

## 2026-10-21 — v0.11 session 19: T11.15b the row, and T11.17 the hand-off
- **Owner approved** N = 6 and the three §6.5 rows (D470). **T11.15b:** the row `remembering-reachable` is in `sim/targets.ts` in its own commit, then its check (`sim/checks/v011.ts`, with tests) and the milestone setting. The full suite on this machine (340 s, 55 runs): the row passes (median cycle 6) and nothing else changed; the only ✗ lines are the Saturday runs, which are reported only. GDD §6.2 and §6.5 are updated. The two timing rows are in the benchmark and the layout spec (warn at the budget, fail at 2×): measured 15 to 19 ms each.
- **T11.17:** plan boxes ticked, v0.11 `Status: in progress`, the pull request opened from `milestone/v0.11` with the template. `progress.md` was 90 KB, so older entries moved to `docs/archive/progress-2026-10-15-to-21.md` and the last three stay here.
- **For the playtest:** the plan's checklist is in the PR. To see the ending: debug panel, "Finish Act VI" (plays the real Long Night, the hold resets), then "Open the gate", then Remember Them or Keep the Vigil.
- **Please check CI** on the PR: the sim jobs must each stay under 5 minutes (D320); I could not see them from here.
- **Deferred, by decision:** the Descent and rising difficulty (D448, D453); the species half of the gate is not judged by the simulator (D469); the Archive's section tabs run past the edge at 360 px (since v0.5); Q43 (Wolf name).
- **Nothing skipped, no old test weakened.** Older tests edited this milestone: `tests/orders/opening.test.ts` (lists `v11-played.json`, T11.5) and `tests/remembering/vigil.test.ts` (T11.13); the closing-line tests now assert its absence (T11.3, D465).
