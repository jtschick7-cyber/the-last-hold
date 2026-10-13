# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## 2026-10-11 — Planning complete (chat)
- **Done:** GDD, setting primer, lore (kept outside the repo until v0.5), technical design, implementation plan, and CLAUDE.md, all reviewed and revised (D01–D36).
- **Next:** v0.0 Bootstrap, starting with T0.1. 👤 Before then: enable GitHub Pages with Source = GitHub Actions.
- **Open questions:** none.
- **Skipped or deferred:** G9 extras not taken (D31).

## 2026-10-11 — v0.0 Bootstrap, first session
- **Done:** T0.1–T0.5 and T0.7. The app shell builds for both channels (live and preview), with its own name, storage namespace, scope, and a PREVIEW ribbon. The About card shows channel, version, branch, commit, and an "Opened here" count per channel. It installs as an app, works offline after the first load, and offers an update banner that never reloads by itself. Lint guard-rails are in place, with 49 fixture tests proving each one fires. `npm run check` takes about 7 s. Checked in a real browser: separate counts for live and preview, offline reload works, and the live app refuses to serve `/preview/` pages.
- **Not finished:** T0.6 (deploy). The workflow is written and its "main has no app yet" path was tested locally, but it hasn't run on GitHub. It deploys only from `main` and `milestone/*`, and this session's work is on `claude/v0-0-init-g3mpvm`.
- **Owner tasks (👤):** (1) Settings → Pages → Source = GitHub Actions, if not done. (2) Settings → Environments → `github-pages` → add the deployment rule `milestone/*`. (3) Create `milestone/v0.0` from `claude/v0-0-init-g3mpvm`, or tell Claude Code it may push that branch.
- **Next:** first deploy run; check acceptance 2–3 on the real site; then the v0.0 playtest.
- **Open questions:** none.
- **Choices to review:** D39 (Proposed): Preact 10 rather than the brand-new 11, a hand-written service-worker registration, an in-repo numeric-literal rule, and placeholder icons.
- **Skipped or deferred:** none.
- **Update (same day):** the owner did owner tasks 1–2 and allowed the push of `milestone/v0.0`, which is now pushed. **Blocker:** GitHub ran no workflows at all, on either branch, after five minutes, and it lists zero workflows even though the four files are on both branches. Most likely GitHub Actions is turned off for the repo (Settings → Actions → General → "Allow all actions and reusable workflows"). T0.6 stays open until CI and the deploy have run.
- **Update:** the owner turned Actions on; this push triggers the first runs.
- **Test:** this line was committed through the GitHub API, to check whether such commits start workflow runs when git pushes didn't.
- **Update:** the owner committed GitHub's sample workflow (`blank.yml`) to main, and it ran. So Actions works on the account; only our pushes weren't starting runs. Draft PR #1 is open (not for merging yet). `blank.yml` should be removed from main once our own workflows run.
- **Update:** our workflows now run. CI, Simulator and Benchmarks are green, and Deploy published the preview from `milestone/v0.0` plus the placeholder at the root. T0.6 is ticked. The PR's first CI run failed only because main's `blank.yml` broke the format check; this branch deletes it, so merging v0.0 removes it from main. This session can't reach github.io, so the owner checks acceptance 2–3 on the phone during the playtest. **Next:** the owner's v0.0 playtest. Note: GitHub warns that actions/checkout@v4 and setup-node@v4 run on a deprecated Node 20; harmless for now, worth bumping in a later milestone.

## 2026-10-11 — v0.0 complete
- **Done:** the owner's playtest passed. v0.0 merged to `main` via PR #1, tagged `v0.0.0`, and the plan status set to complete (D40). `sim:accept` was skipped because there's no simulator yet; it starts in v0.1.
- **Next:** v0.1 The Hold, starting with T1.1 (RNG), on branch `milestone/v0.1`.
- **Owner check after the merge:** install the live app from the main address and confirm its "Opened here" count is separate from the preview's.
- **Open questions:** none. D39 (v0.0 implementation choices) is still Proposed, for the owner to review.
- **Skipped or deferred:** `sim:accept` (nothing to accept yet). The deprecated Node 20 workflow actions can be bumped in a later milestone.

## 2026-10-12 — v0.1 started: foundations
- **Done:** D41 logs the owner's approval of D39. v0.1 set to in progress. T1.1 (random numbers: sfc32, cyrb128, seeded streams, scripted rolls, with golden values for 3 seeds), T1.2 (exact powers and the "Max" affordability search, checked against the GDD's log formula over 168 cases), and T1.3 (number, rate, exact and duration formatting, with a full boundary table). `npm run check` is green.
- **Next:** T1.4 (the balance file) and T1.5 (v0.1 content).
- **Open questions:** none.
- **Choices to review:** D42 (Proposed). Notably, silver's 0.25/min displays as "0.2/min", because every display floors.
- **Skipped or deferred:** none.

## 2026-10-12 — v0.1: balance file and content
- **Done:** D43 (owner accepted D42). The owner answered two questions, logged as D44: the balance file holds every GDD §7 key now, and per-item numbers live in the content files and count as tunable. T1.4: `balance.ts` has all 86 §7 keys, each tunable or locked. Tests prove the keys match GDD §7 exactly and the locked ones match plan §0.6 exactly, both read straight from the docs. Every single value was checked against the GDD once by script, and the six compound values by eye. T1.5: resources, jobs, the ten v0.1 buildings, Hamlet and Keep (with the gatehouse restoration and its inscription from primer §6.5), and the starting state, with consistency tests. `npm run check` is green (442 tests).
- **Next:** T1.6 (name collision search), T1.7 (v0.1 text), T1.8 (content integrity test).
- **Open questions:** none.
- **Notes:** the Keep inscription already in `ages.ts` covers that part of T1.7. Building and resource names are inline `name` fields, which T1.6's name check will pick up.
- **Skipped or deferred:** none.

## 2026-10-12 — v0.1: names, text, content integrity
- **Done:** T1.6: every v0.1 name was searched against the influence games, with no collisions (D45). `tests/content/names.ts` lists the checked names with dates, and a test finds every name in the content and fails on any unchecked one. T1.7: descriptions for all ten buildings, Brana's and Pechko's lines for the five v0.1 triggers (4 variants each), and the residents. The Keep inscription was done in T1.5. T1.8: an integrity test that every ID, text key and unlock resolves. The §7 key match is already covered. Each new check was proved to fail on a deliberate break. `npm run check` is green (455 tests).
- **Next:** section B: T1.9 (game state v1), T1.10 (rates, costs and their breakdowns), T1.11 (silver rules).
- **Open questions:** none.
- **Choices to review:** D45 (Proposed), plus the text itself: the building descriptions and lines are in `src/content/text/`.
- **Skipped or deferred:** the "first contract success" lines wait for contracts in v0.2.

## 2026-10-12 — v0.1 section B: state, rules, commands, valuation
- **Done:** D46 (owner approved D45). T1.9: the v1 game state and new-game creation from the GDD starting state. T1.10: housing, job slots, production rates with the bonus buckets, building costs (×1, ×10 and Max), settle cost and the offline cap, each with a breakdown built by the same function. T1.11: silver gets no building or Age bonus; a test shows Keep's +50% leaves it unchanged. T1.12: commands for buying, upgrading, peasants, the Age-up and settings, with 26 refused cases each proven to leave the state untouched. T1.13: best payback and the ● pick, with mixed-cost and housing cases. Tests use the GDD's own numbers (first Farm 46 wood, wood reaches 80 at 3.75 min, Mill L2 210 wood). `npm run check` is green (528 tests).
- **Next:** section C: T1.14 (event-driven `advance`), T1.15 (offline catch-up), T1.16 (offline equivalence and the other time tests).
- **Open questions:** none.
- **Choices to review:** D47 (Proposed).
- **Skipped or deferred:** none.

## 2026-10-12 — v0.1 section C: time
- **Done:** D48 (owner approved D47). T1.14: event-driven `advance`. Resources move in straight lines between events; v0.1's one event is auto-settle (at most one per 30 s, at the moment food reaches the cost, into the first open job in priority order). T1.15: offline catch-up in 60 s chunks with progress steps, the 12 h cap (more with the Bell Tower), time past the cap reported not simulated, and the away summary (time away, time counted, resources, peasants settled). T1.16: the offline equivalence test passes (12 h of 1 s ticks equals one 12 h catch-up, including every settle, under the technical design §6.2 comparison rule), plus chunk-size independence, the backward clock, byte-identical determinism, and cap reporting. `npm run check` is green (542 tests, about 7 s).
- **Next:** section D, saves: T1.17 (storage slots and autosave), T1.18 (export and import codes), T1.19 (migrations and validation).
- **Open questions:** none.
- **Choices to review:** D49 (Proposed).
- **Skipped or deferred:** none.

## 2026-10-12 — v0.1 section D: saves
- **Done:** D50 (owner accepted D49). T1.17: the save envelope, and a channel-namespaced store with main, backup (every 10 min) and quarantine slots, plus autosave (every 30 s and when the page hides) and the persistent-storage request. T1.18: `LH1.` (compressed) and `LH0.` codes with checksums, and the plain JSON save file, with plain-language errors for each failure. T1.19: the migrations framework (empty list, current version 1), hand-written validation (unknown IDs dropped with warnings), the newer-version refusal, and a real v1 fixture. Tests cover the round trip, 10 kinds of corrupted code, unknown IDs, repairs, refusals, slot fallback, live/preview isolation and a full disk. `npm run check` is green (578 tests).
- **Not yet wired in:** autosave, the persistence request and the file download are written but not connected to the app. They have no screen to run in until the shell (T1.20), and the Playwright smoke (T1.38) tests them in a real browser.
- **Next:** section E, the UI: T1.20 (shell), T1.21 (Hold screen), T1.22 (Age screen).
- **Open questions:** none.
- **Choices to review:** D51 (Proposed).
- **Skipped or deferred:** none.

## 2026-10-12 — v0.1 section E, part 1: the first playable screens
- **Done:** D52 (owner accepted D51). T1.20: the shell, with the resource bar (tap for rates, per minute or hour), Hold and More tabs, a bottom-sheet stack (swipe down or ✕ to close), dark and light themes, catch-up progress, the update banner, and the PREVIEW ribbon. Numbers open their breakdowns on long-press or ⓘ. The runtime loads the save, catches up, ticks every second, and autosaves. T1.21: the Hold screen, with the header and Brana's and Pechko's lines, the peasants panel (−, +, fill, auto-settle, next settle cost) and the build list (×1, ×10, Max, costs muted when short, "ready in", ● best buy). T1.22: the Age screen (checklist, costs, unlocks, Become a Keep), and after it the restoration sheet with the Roll of Honor; Citadel shows "Coming in a later milestone". Checked in a phone-sized browser: buying, the first-building line, breakdowns, reload persistence, and a full Age-up (Keep header, inscription, Pechko's line, the Bell Tower appearing). No console errors. `npm run check` is green (581 tests).
- **Blocked:** T1.20a (the pixel font) is split out and marked [?]; see `questions.md` Q1. A system monospace font stands in.
- **Next:** T1.23 (Reports: the last three away sheets), T1.24 (breakdowns everywhere, hover on desktop), T1.25 (More: Save & Data, Settings, About & Credits, install tip), T1.26 (debug panel), T1.27 (diagnostics).
- **Open questions:** Q1 (pixel font).
- **Choices to review:** D53 (Proposed).
- **Skipped or deferred:** the pixel hold scene waits for the art pipeline (T1.29).

## 2026-10-12 — v0.1 section E, part 2: More, debug, diagnostics
- **Done:** T1.23: Reports keep the last three away sheets. T1.24: breakdowns everywhere, on long-press, ⓘ, Enter, or desktop hover; the 900 px sidebar layout and the 1300 px always-open details panel. T1.25: the More menu with Reports, Save & Data (save now, copy and import codes, download and load the file, restore the backup, reset behind two confirmations), Settings (theme, ● hint, rate unit, reduce motion), the install tip (plus a one-time banner) with the iPhone storage note, and About & Credits (build details, debug-used flag). T1.26: the debug panel (`?debug`): time skip through the offline path, add resources, set the seed, unlock Keep, raw state, catch-up timing. T1.27: diagnostics, with errors captured from anywhere, More → Diagnostics, "Copy diagnostics" (build, versions, browser, errors, save code), and a calm crash screen. Checked in a phone-sized and a desktop browser: a 3 h absence gives the away sheet and a report; a copied code imports back; a damaged code is refused with its reason; the debug skip works and marks the save; a thrown error shows in Diagnostics and copies; reset works; hover breakdowns and the desktop layout render. `npm run check` is green (594 tests).
- **Moved:** the debug panel's "run the simulator" button now belongs to T1.35, since it needs the simulator.
- **Fixed:** the plan's v0.1 "Before you start" table pointed at the wrong task numbers for the palette and the art packs (it said T1.26–T1.28; they are T1.28, T1.30 and T1.31).
- **Next:** section F, the art pipeline: T1.28 (palette candidates for you to pick), T1.29 (manifest and `<Sprite>`), T1.30 (the pack list for you to download).
- **Open questions:** Q1 (pixel font).
- **Choices to review:** D53 and D54 (Proposed).
- **Skipped or deferred:** T1.20a (pixel font) is waiting on Q1.

## 2026-10-12 — v0.1 section F, part 1: palette candidates, manifest, pack list
- **Done:** D55 (owner approved D53 and D54, and answered Q1: Kenney Fonts). T1.28 (first half): a swatch page with three free-use 32-color palettes and a Hold mock-up in each, at `/preview/palettes.html`; waiting on the pick (Q2). T1.29: the asset manifest (`src/content/assets.ts`) with a row for every resource icon, building and hold scene; `<Sprite>` with integer scaling and a silhouette placeholder; `tools/gen-placeholders.ts`; a test that every referenced asset has a row and every file exists. The Hold header and build rows now show sprites (placeholders for now). T1.30: `art-src/PACKS-NEEDED.md`, with the four Kenney downloads and step-by-step upload instructions (Q3). `npm run check` is green (597 tests).
- **Waiting on the owner:** Q2 (pick a palette) and Q3 (upload the four zips).
- **Next:** T1.31's recolor tool (the pack processing waits for the uploads), T1.32 (credits and the license test), T1.33 (contact sheet).
- **Choices to review:** D56 (Proposed).

## 2026-10-12 — v0.1 section F, part 2: art tools
- **Done:** T1.31: the recolor tool (OKLab nearest color, faint pixels made transparent), with tests on generated images and a run on a real PNG. T1.32: `docs/credits.md` generated from the manifest and palette, shown in About & Credits, with CI checks: pack art must be CC0 with a URL and credit, every file in `public/assets/` must be in the manifest, and the credits file must be current. T1.33: the contact sheet at `/preview/contact-sheet.html` (16 assets, no broken images). `npm run check` is green (604 tests).
- **Split:** T1.31a (processing the packs) waits on Q2 (palette) and Q3 (uploads), and also covers the font (T1.20a).
- **Next:** section G, the simulator (T1.34–T1.37), while the art inputs are pending.
- **Open questions:** Q2 (palette), Q3 (uploads).
- **Choices to review:** D56 and D57 (Proposed).

## 2026-10-12 — v0.1 section F, part 3: palette and art in
- **Done:** D58 (owner: Zughy 32, packs uploaded, D56 and D57 approved). T1.28: Zughy 32 is recorded in `palette.ts`, the UI is rethemed to it (dark and light), and the candidate page is gone. T1.31a: all four zips checked (each `License.txt` says CC0), with 16 images composed and recolored by recipe: 10 buildings, 4 resource icons, and the Hamlet and Keep hold scenes. They replace the placeholders everywhere, including the resource bar and costs. T1.20a: the Kenney Pixel font for headings and the resource bar. Credits now list the palette, the packs and the font. Checked in the browser: the font loads under the preview path, there are no broken images, and both themes read well. `npm run check` is green (608 tests).
- **Deferred:** the Pixel UI Pack's frames, to the v1.0 art pass (D59). Say if you'd rather have them in v0.1.
- **Next:** section G, the simulator (T1.34–T1.37), then H (T1.38, Playwright).
- **Open questions:** none.
- **Choices to review:** D59 (Proposed).

## 2026-10-12 — Session end: handoff
- **Where things stand:** v0.1 is `in progress`. Sections A–F are done (T1.1–T1.33, plus T1.20a and T1.31a). What's left: **section G** (T1.34 simulator CLI and report, T1.35 policies plus the debug "run policy" button, T1.36 v0.1 checks with `sim/targets.ts` locked, T1.37 tuning pass) and **section H** (T1.38 Playwright smoke plus cross-engine determinism). Then the milestone-end steps (plan §0.3): owner playtest of the preview, then the PR, merge and `v0.1.0` tag.
- **Decisions waiting on the owner:** D59 (Proposed). Everything else up to D58 is decided.
- **Open questions:** none.
- **Branches:** work goes to **`milestone/v0.1`** (owner-approved; every push redeploys the preview at https://jtschick7-cyber.github.io/the-last-hold/preview/). This session also mirrored each push to `claude/v0-0-init-g3mpvm`; a new session uses whatever branch it's assigned, plus `milestone/v0.1`. v0.0 is merged and tagged `v0.0.0`.
- **Hint for the simulator:** while making the save fixture, a scripted Mine purchase at minute 5 was refused (40 food not yet reached after a Cottage and settles). GDD §5.1.4 expects a Mine within 5 minutes under the Opening policy; if T1.36 misses, the GDD's own fix is raising starting wood to 70 in `src/content/start.ts` (tunable, D44). Don't move the target.
- **Practical notes for the next session:**
  - Gate every commit on `npm run check` actually exiting 0 (one push went out red when a piped command hid the failure).
  - Prettier reformats long lines, so scripted find-and-replace edits often silently miss. Assert that the match happened, or use the Edit tool.
  - The session's network blocks kenney.nl, lospec.com, opengameart.org and github.io (the live preview can't be opened from here). GitHub's own API works for this repository, and public repos can be read with `git clone --filter=blob:none --sparse`.
  - For browser checks: `npm run build`, copy `dist/` into a folder served at `/the-last-hold/` (`python3 -m http.server`), and drive it with the global Playwright (`$(npm root -g)/playwright`; browsers in `/opt/pw-browsers`). T1.38 makes this a proper test.
  - To check CI after a push: `curl -s "https://api.github.com/repos/jtschick7-cyber/the-last-hold/actions/runs?head_sha=<sha>"`.
  - Art is rebuilt from the zips in `art-src/`: unzip each into `art-src/packs/<pack>/` (git-ignored), then `npx vite-node tools/build-art.ts`, `tools/gen-credits.ts` and `tools/contact-sheet.ts`.

## 2026-10-12 — v0.1 sections G and H: simulator and browser tests
- **Done:** T1.34: the simulator (`npm run sim`, `sim:check`, `sim:accept`), playing the real game on a virtual clock from Monday 07:00 and Saturday 09:00, with JSON and Markdown reports and a baseline diff. The full suite (4 players × 5 seeds × 2 starts × 14 days) takes about 50 s. T1.35: the Opening, Standard, Light and Heavy players (D60), and a debug-panel button that plays the Standard player for N hours. T1.36: `sim/targets.ts` copies the GDD §6.2–6.3 tables row for row (now locked), with one check per v0.1 row. T1.38: a Playwright smoke test on the real build at phone size (buy, reload, reload offline), and the determinism scenario compared with Node in Chromium and WebKit (D61). `npm run check` is green (640 tests, about 18 s).
- **Fixed:** the ● hint counted the same open job slot for every Cottage while beds already stood empty (D60 point 3).
- **Results (today's numbers):** first Cottage 0 min ✓, 10 peasants 3 h ✓, Heavy Keep 14 h ✓, every engagement check ✓. Missed: first Mine 7.7 min (target 5), Mill level 3 at 5.5 h (target 2–5), Keep 24 h Standard (target 8–14) and 38 h Light (target ≤ 24). Silver is what holds the Keep back.
- **Blocked:** T1.36a (enforcing the checks inside `npm run check`) and T1.37 (tuning) wait on **Q4**. Until then `check` runs the simulator and reports without enforcing; `sim:check` and `sim.yml` enforce and stay red.
- **Next:** answer Q4, then tune (T1.37) and turn enforcement on, then the milestone-end playtest.
- **Choices to review:** D60, D61 (Proposed).
- **Checked in CI:** WebKit can't run in this session; the CI run passed both the smoke test and the determinism suite in Chromium and WebKit.

## 2026-10-12 — v0.1 section G finished: tuning
- **Done:** D62 (owner answered Q4 and approved D60 and D61). The Standard targets are measured on the Opening run; time targets are judged on the Monday start. T1.37: starting wood 50 → 75 and the Keep's silver cost 300 → 250 (GDD updated). The policy's bottleneck rule now counts food that settling will take. Every v0.1 simulator check passes on 5 seeds: first Mine 4.5 min, Mill level 3 at 3 h, 10 peasants at 3 h, Keep at 14 h (Standard), 24 h (Light), 14 h (Heavy). T1.36a: `npm run check` now enforces the fast set. `npm run check` is green (642 tests); the browser tests pass.
- **Watch:** the Standard and Light Keep times sit on the edges of their bands (the Keep can only happen at a check-in). Your playtest is the real test.
- **Next:** milestone end (plan §0.3): every v0.1 task is ticked. You playtest the preview with the v0.1 checklist; when you say it passed, I open the pull request, merge, tag `v0.1.0`, and run `sim:accept`.
- **Open questions:** none. **Choices to review:** D59 (still Proposed).
- **Skipped or deferred:** none.


## 2026-10-12 — Session end: handoff
- **Where things stand:** v0.1 is `in progress` with **every task ticked** (T1.1–T1.38, plus T1.20a, T1.31a and T1.36a). Every v0.1 simulator check passes on 5 seeds, `npm run check` is green (642 tests, about 18 s, now enforcing the fast simulator set), and CI is green, including the Playwright smoke and the determinism suite in Chromium and WebKit. The preview at https://jtschick7-cyber.github.io/the-last-hold/preview/ holds the finished milestone.
- **Waiting on the owner:** the v0.1 playtest (plan v0.1 checklist: play until Keep plus one overnight; about a day of calendar time, an hour or two of play). Also D59 (art choices) is still Proposed.
- **Next session, once the owner says the playtest passed (plan §0.3):** open the pull request from `milestone/v0.1` to `main` with the template (what changed, what to playtest, known issues, deferred: the Pixel UI Pack frames, D59); merge; tag `v0.1.0`; set v0.1 `Status: complete`; run `npm run sim:accept` and commit `sim/baseline.json`; add a decisions row. If the playtest finds problems, fix them on `milestone/v0.1` first; tuning changes `tunable` values only and needs the full `npm run sim:check` green.
- **Practical notes:**
  - A fresh container needs `npm ci` before `npm run check`.
  - Full simulator: `npm run sim:check` (about 50 s). Reports land in `sim/reports/` (git-ignored). `sim/targets.ts` is locked.
  - The simulated player's rules are in `src/core/policies/` (D60, refined in D62). The Standard targets are measured on the Opening run; time targets are judged on the Monday start (D62).
  - Browser tests: `npm run e2e` (Chromium works locally with the preinstalled browsers; WebKit runs only in CI).
  - Watch: the Standard Keep (14 h) and Light Keep (24 h) sit on the edges of their bands, because the Keep can only happen at a check-in. If the playtest says the pace is off, that's the first place to look.
  - To check CI after a push: `curl -s "https://api.github.com/repos/jtschick7-cyber/the-last-hold/actions/runs?head_sha=<sha>"`.

## 2026-10-13 — v0.1 playtest fixes (round 1)
- **Done:** two playtest problems fixed on the v0.1 code. (1) With Auto-settle off there was no way to settle a peasant; there is now a "Settle one" button (D63, Proposed). (2) The "8/9" in the Peasants heading looked like jobs filled; it now shows the peasant count and "· 9 beds", with a line saying why settling is blocked (no free beds, or not enough food). `npm run check` is green; the Chromium browser smoke test passes.
- **Could not reproduce:** the engine settles correctly with Auto-settle on (tested the 8-of-9 case). The owner's screenshots showed Auto-settle off in the 8/9 case, and Auto-settle on at 10/11 with the next peasant costing 80 food, which most likely just meant food was still short.
- **Waiting on the owner:** (a) approve D63, after which I update GDD §5.1.1 and §9.2; (b) the word "Age" (recommendation: "Rank", screens only or everywhere; runner-up "Stage"); (c) iron and silver icons (options picture shared in chat; recommendation: hammer for iron, Tiny Town coin for silver).
- **Skipped or deferred:** the Age rename and the icon swap, both waiting on the owner's choice. GDD not edited (owner gate).
- **Update (same day):** the owner chose **Rank** and **rank up** (D64, Decided). Every screen, button and refusal message now says Rank; code names and the docs still say Age until a docs pass (D64 gives the mapping). Still open: approve D63, and the iron and silver icons.
- **Update:** the owner chose the icons (D65): iron unchanged, silver is now the Tiny Town coin in grey. Open: approve D63.
- **Update:** D63 approved (D66); GDD §5.1.1 and §9.2 updated. Playtest fixes merged into `milestone/v0.1`.

## 2026-10-13 — v0.1 complete
- **Done:** the owner's playtest passed. v0.1 merged to `main` via PR #2, tagged `v0.1.0`, plan status set to complete, `sim:accept` run (baseline in `sim/baseline.json`), decision D68. Playtest fixes shipped in it: Settle one button, clearer Peasants heading (D63/D66), Age renamed Rank on screens and in the docs (D64/D67), grey Tiny Town coin for silver (D65).
- **Next:** v0.2, on branch `milestone/v0.2`. Read the plan's v0.2 section first.
- **Open questions:** none. D59 (art choices) is still Proposed.
- **Skipped or deferred:** Pixel UI Pack frames (D59); the deprecated Node 20 workflow actions can be bumped in a later milestone.

## 2026-10-13 — v0.2 started
- **Done:** `milestone/v0.2` created and the plan set to in progress. T2.1a (the v0.2 content: 8 hunters, 12 monsters with their ability numbers, 15 traits, 6 gear tiers, 5 villages with heads) and T2.3 (name checks, searched on the web). A content test checks everything against the GDD tables, including the location × tier coverage table (§8.3.1).
- **Found:** "Gloam Wolf" is an existing Elder Scrolls Online creature, so the content says "Gaunt Wolf" for now (D69, Proposed). Toma's Speed in the GDD table breaks the GDD's own ±10% rule. Both are in Q6.
- **Waiting on the owner:** Q5 (your real v0.1 save, for T2.4) and Q6. 👤 Hunter and monster portrait reviews come later (T2.23, T2.24).
- **Blocked:** T2.4 (needs the real save) and T2.1b (Barracks and Trophy Hall add building ids, so they wait for the migration).
- **Next:** T2.2 (notices, vow and first-contract scenes, hunter bios), then combat (T2.5–T2.9), which doesn't depend on the save.
- **Skipped or deferred:** clue tags and drops for monsters (v0.3 bestiary); gift reagents for villages (v0.3).
- **Update (same day), combat:** T2.5–T2.9 done. The combat engine lives in `src/core/combat/`. The GDD §5.5.1 golden fight reproduces line for line (tick, rolls, damage, Health), in Node, and, through the cross-engine determinism scenario, in Chromium (WebKit runs in CI). One test per monster ability, five seeded golden fights recorded and frozen (locked), determinism, and the rules version (kept at 1: this is the first combat). `npm run check` is green (731 tests). **D70 (Proposed)** lists the ten places where I read the GDD where it is silent (order inside a monster action, what "every Nth action" counts, Riverhorse timing, rounding); please look it over, because the frozen goldens depend on those readings.
- **Next:** T2.2 (text), then state and board (T2.10–T2.15, which need the migration, so they start with T2.4, waiting on Q5), then odds (T2.16–T2.19).
- **Update (same day), odds:** T2.12a (injury, reward and seed rules, pure) and T2.16 (the odds: 500 simulated fights, margin, injuries, death chance, rewards, and the "Why?" summary math) are done and tested, including a check that real outcomes match the preview within a few points. Odds for a typical party take about 27 ms unthrottled (the GDD budget is 100 ms on a 4× slowed CPU, so about 25 ms); to get there, fights skip building log text when nobody will read it. The real phone-speed check is T2.19. **Q7:** one log line shows the Armor after a hit instead of before it (Draugr's Swell); fixing it changes a locked golden's text, so it's your call.
- **Update (same day), Suggest:** T2.18 done as the GDD words it: every legal party at 50 shared-seed samples, then the top 5 at 500. It works and is tested, but it misses the speed budget, and I could not find an engineering fix: see **Q8** (T2.19 is marked [?] until you answer).
- **Update (2026-10-13), the contract and hunter rules:** with the owner's real save (Q5) the **v1 → v2 migration** is done and tested (T2.4): the owner's Keep save loads, keeps everything, gains Halvar and Zora, and opens the board at once because four Mines stand. Then T2.1b (Barracks, Trophy Hall, with art), T2.10 (the board), T2.11 (launching), T2.12b (rewards, injuries, death, recovery, return after 3 days, all at the timer's end, even offline), T2.13 (roster, candidates, recruiting), T2.14 (gear), T2.15 (Trophy Hall bonus in the trophy bucket). The 12-hour equivalence test (1 s ticks vs one jump vs offline chunks) passes with contracts running. D70 approved; **D72 (Proposed)** lists the ten readings I made in the state rules. `npm run check` is green (801 tests).
- **Balance note for the owner (not a bug):** a party of three level-1 hunters (Halvar, Zora, Ostap) wins about every contract up to the low tiers and then falls off a cliff (for example Draugr tier 4: 0%). Odds will mostly read 0% or 100% until levels and gear soften it. T2.26 tuning will look at this; tuning only moves `tunable` numbers.
- **Still ahead:** UI (T2.20–T2.22), simulator policy and checks (T2.25–T2.26), portraits (T2.23–T2.24), text (T2.2), and Q8 (Suggest speed) for T2.19.
- **Update (same day), screens:** T2.20–T2.22 done. New **Contracts** and **Hunters** tabs (they appear with the first Mine), a **launch sheet** (party, Suggest, odds with ±margin and Why ▸, provisions, the Reckless confirmation), the **fight log** (rolls, collapse, seed and replay), a **Hunters** screen with candidates and locked silhouettes, a hunter sheet with stat breakdowns and gear upgrades, **Hall of the Fallen** under More, and contracts, recoveries and arrivals on the away sheet. The Playwright smoke test now sends hunters, skips an hour and collects. Also fixed: the debug time skip now moves contract and recovery timers with the clock. **D73** (Suggest speed) and **D74** (its two speed-ups) are logged. Still ahead: the odds worker and benchmarks (T2.17, T2.19), simulator policy and checks (T2.25, T2.26), portraits (T2.23, T2.24) and text (T2.2).
- **Update (same day), speed:** T2.17 (odds and Suggest run in a Web Worker, debounced, with a labeled "quick estimate" on the main thread if workers fail) and T2.19 (a benchmark in `bench.yml`, Chromium at 4× slowdown: odds 96 ms against a 100 ms budget, Suggest 324 ms against 300 ms: a small warning, nowhere near the 2× fail line). The debug panel has "Measure odds and Suggest here" so you can read the real numbers on your phone.
- **Update (same day), simulator (T2.25, T2.26):** the simulated player now plays contracts and hunters (D75), and there are six new checks (`sim:check` runs them): first contract, roster of 4, first tier-3 success, odds honesty, bounty share of silver, provisions share. **Results on 5 seeds, both starts:** every v0.1 check still passes (Keep 14 h Standard, 24 h Light, 14 h Heavy); first contract 1.5 min after the first Mine; roster of 4 by 24 h; first tier-3 success at 35 h; **odds honest in every 10-point bucket** (the real win rate within 3.1 points of what the odds said, over about 12,000 fights, including a probe built to cover the whole odds range); bounties 71–73% of silver from the Keep on. To get there I changed two tunable numbers (D76, Proposed): starting food 50 → 80 and `bounty.base` 60 → 72; the GDD is updated. The full suite takes 185 s. **One check can't pass by tuning:** provisions at 20–40% of food income measure about 0.2% (**Q9**, options and a recommendation inside). It is marked "pending Q9", visible in every report, and doesn't fail the run. Also: Suggest now takes three finalists at 200 fights (D73); the odds probe, `sim/honesty.ts`, is new.
- **Still ahead:** portraits (T2.23, T2.24: generator and your review), text (T2.2: notices, vow and first-contract scenes, hunter bios), the milestone's playtest checklist, and v0.2's `sim:accept` at the end.
- **Update (same day), text (T2.2):** 30 contract notices (3 for every place each village can send a contract from, symptoms only, signed by the village head, colder villages terser), two scenes that play once (the first contract sent; the vow at the Keep, led by Halvar and Old Ostap), Brana's first-success line, and the setting primer's public bios on the hunter sheets. Your save, fixture `v2.json`, is now 36 h of the simulated player playing on from your own v0.1 save. **D77 (Proposed)**. **Q10:** "Firstblade" is a Skyrim lore name, so the one Kozly Hollow seed line that uses it is held back until you decide.
