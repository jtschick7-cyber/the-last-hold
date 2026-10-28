# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.4` (from `main` at the PR 24 merge). The Claude session branch for this thread is `claude/dreamy-cerf-sg227v`.
- **Milestone:** v1.4 "The Descent" (D557–D569), in progress. v1.3 is merged, tagged `v1.3.0` and accepted (D556).
- **Last task:** TD.1 docs commit (flesh-out files applied, D568 added, the `descent.*` keys in `balance.ts`, three `CLAUDE.md` rules). Before it: two CI repairs on `main` (PR 23, PR 24, D569).
- **Next:** TD.2 (save schema 14). Q60 (the approved Descent story wording is missing from the repo) blocks only the story-text part of TD.3.
- **Open questions:** Q59 (calibration, asked after TD.8b) and Q60 (the missing story wording). Q53–Q55 and Q57 are closed. Size: 449,810 bytes at v1.3, about 164 KB under the 614,400 row.

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
