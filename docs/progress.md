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
