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
