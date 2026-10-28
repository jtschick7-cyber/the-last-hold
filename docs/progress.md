# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.5` (from `main` at `69157f7`, which holds the v1.4 merge). The Claude session branch for this thread is `claude/serene-johnson-vq5dt0`.
- **Milestone:** v1.5 "The Breach" (D579–D595), in progress. v1.4 is merged, tagged `v1.4.0` and accepted (D578).
- **Last task:** TB.1 (docs commit, preconditions, branch, name check).
- **Next:** TB.2 (save schema 15, needs your real v14 save export) or TB.3 (constants and lane maths; either order).
- **Open questions:** Q61 and Q62 answered yes (D595). Q63 opens after TB.12. Size: 457,443 bytes at v1.4 (about 157 KB under the row).

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
