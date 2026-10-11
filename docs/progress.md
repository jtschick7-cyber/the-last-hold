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
