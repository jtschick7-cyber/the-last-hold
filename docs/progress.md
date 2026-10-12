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
- **Done:** D50 (owner accepted D49). T1.17: the save envelope, and a channel-namespaced store with main, backup (every 10 min) and quarantine slots, plus autosave (every 30 s and when the page hides) and the persistent-storage request. T1.18: `LH1.` (compressed) and `LH0.` codes with checksums, and the plain JSON save file, with plain-language errors for each failure. T1.19: the migrations framework (empty list, current version 1), hand-written validation (unknown IDs dropped with warnings), the newer-version refusal, and a real v1 fixture. Tests cover the round trip, 10 kinds of corrupted code, unknown IDs, repairs, refusals, slot fallback, live/preview isolation and a full disk. `npm run check` is green (582 tests).
- **Not yet wired in:** autosave, the persistence request and the file download are written but not connected to the app. They have no screen to run in until the shell (T1.20), and the Playwright smoke (T1.38) tests them in a real browser.
- **Next:** section E, the UI: T1.20 (shell), T1.21 (Hold screen), T1.22 (Age screen).
- **Open questions:** none.
- **Choices to review:** D51 (Proposed).
- **Skipped or deferred:** none.
