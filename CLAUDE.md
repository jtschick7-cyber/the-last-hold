# CLAUDE.md — The Last Hold

## What this project is

An original single-player idle/incremental browser game.
- **The premise:** you're the warden of a ruined frontier fortress. You rebuild it, recruit monster hunters, take contracts, learn the bestiary, and face a voluntary prestige reset called the Long Night.
- **The platform:** a static PWA on GitHub Pages, phone-first, playable offline.
- **Who it's for:** the owner only. The owner doesn't read code. **You build the game, one milestone at a time, from the docs.**

## Session start

1. **Read this file.**
2. **Read `docs/progress.md`:** where the last session stopped.
3. **Read `docs/implementation-plan.md`:** the current milestone (the first whose `Status:` isn't `complete`) and its first unchecked task that isn't marked `[?]`.
4. **Read the GDD and technical-design sections** that milestone lists under "Reads".
5. **Read `docs/questions.md`:** any answered questions unblock `[?]` tasks.
6. **Run `npm run check`.** If it's red, fixing it is the first task.

**Lore:** read `docs/setting-primer.md` freely. The story's secrets aren't in the repo until v0.5. **Never look for them in git history** (owner gates, below).

## Session end

Append an entry to **`docs/progress.md`**:
- the date;
- what was done;
- what's next;
- open questions;
- anything skipped, deferred, or deprioritized, and why.

Keep it short and plain.

## Context hygiene

- **When the context is compacted:** preserve the current task, the list of files changed this session, any open questions, and the exact test command.
- **End sessions at task boundaries.** Don't start a new task with a long context: finish the task (green `npm run check`, `progress.md` updated) and let the next session run the start ritual instead.

## Working with the owner

- **Ask questions with options and a recommendation.** Confirm assumptions; never choose silently.
- **When the owner isn't there to answer:**
  1. Write the question to `docs/questions.md`, with the options, your recommendation, and the task it blocks.
  2. Mark that task `[?]` in the plan.
  3. Move on to the next task that doesn't depend on it.
  4. **Never pick a default silently.**
- **Report what was done and what wasn't.** List anything deferred, skipped, or deprioritized where the owner will see it: `progress.md` and the pull request. **Never drop a requirement silently.**
- **Plain language.** No code in explanations unless the owner asks.
- **Pull requests use the template:** what changed, what to playtest, known issues, deferred or skipped.

## Owner gates: never do these on your own

- Merge a milestone or tag a release. **Only after the owner says the playtest passed.**
- Mark a decision `Decided`. You may add `Proposed` rows.
- Change design content in `docs/gdd.md` or `docs/technical-design.md`. You may tick boxes, split tasks, update statuses, and fix typos.
- Add a runtime dependency.
- Change a `locked` constant (plan §0.6), `sim/targets.ts`, golden fixtures, or coverage rules.
- Force-push, rewrite history, or delete branches.
- Read story-secret files from git history, or add them back. The owner restores them at v0.5.

## Scope rules

- **Work only on the current milestone's tasks.** Don't build ahead. Outline milestones (v0.4+) need a flesh-out session first (plan §0.4).
- **If a task is bigger than one session,** split it into sub-tasks in the plan before continuing.
- **If the docs don't answer a design question,** ask (see "Working with the owner"). Don't guess.

## Hard rules

**Architecture (technical design §4, §7.4)**
- `src/core/` is pure. Never import `ui/` or `platform/` from it, and never touch browser globals.
- **Banned in `src/core/`:** `Math.random`, `Date.now`, `new Date`, `performance.now`, `crypto.getRandomValues`, `Math.pow`, `**`, and the transcendental `Math` functions (`exp`, `log*`, trig, `cbrt`, `hypot`, `fround`). Use `core/math` (`intPow`, `maxAffordable`) and `core/rng`. Lint enforces this.
- **Every player action is a `Command` through `apply()`. Time passes only through `advance()`.** The UI, the simulator, and the debug panel all use these.
- The UI never computes game rules.

**Content and balance**
- Content lives in `src/content/`. Shared numeric constants live in `src/content/balance.ts`, under their GDD §7 key, marked `tunable` or `locked`. Per-item numbers (hunter stats, monster stats, and the like) live in their content files (D44).
- **Balance fixes change `tunable` constants only, never formulas.** If no reasonable value passes, stop and ask.

**Saves**
- **Never change the save schema without a migration, a fixture of a real old save, and a round-trip test.**
- Storage keys are always namespaced by channel. Preview and live saves must never mix.

**Determinism**
- Same seed and same commands give identical state, in every browser engine.
- The GDD §5.5.1 golden fight reproduces **line for line**.
- Combat math changes bump `rulesVersion`.

**Tests**
- **Never weaken a test to make it pass.** Golden tests, simulator thresholds, and coverage rules are fixed. A failure means a bug, or a question for the owner.
- Don't claim something works until a test or a run shows it.

**Originality and assets**
- All content is original. Every new proper noun is searched against the influences (GDD §2.3) and added to `tests/content/names.ts`. If you can't search, list the names in `questions.md`; never skip the check.
- **CC0 assets only,** each with a manifest entry. `docs/credits.md` is generated.

**Honesty in the game**
- Every visible number with a formula has a breakdown built by the same function that builds the number.

**Docs in sync**
- When an approved decision changes a doc, update the doc **in the same commit**. The decisions log records why.

## Definition of done (per task)

1. The task's acceptance items are met.
2. Tests are added or updated; `npm run check` is green, in **90 s or less**.
3. No constants outside `balance.ts`; no content outside `src/content/`; no locked values changed.
4. If the schema changed: a migration, a real-save fixture, and a round-trip test.
5. New proper nouns are collision-checked and in `names.ts`.
6. Decisions are logged (`Proposed` unless the owner decided), and any affected doc is updated.
7. The box is ticked in `docs/implementation-plan.md`.

## Workflow

- Use branch `milestone/v0.X`. Every push updates the **preview build**, which the owner playtests.
- Commit small and often, using Conventional Commits (`feat:`, `fix:`, `test:`, `balance:`, `docs:`, `chore:`).
- **Test-first** for formulas, rules, and saved data. Use narrow test runs while iterating, and `npm run check` before every commit.
- **Milestone end:** follow plan §0.3. The owner playtests the preview → says it passed → then you merge, tag, and update statuses.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run check` | Typecheck + lint + tests + fast simulator checks (≤ 90 s). Green before every commit. |
| `npm test -- <pattern>` | Narrow test runs |
| `npm run sim -- --policy standard --days 14 --seeds 5` | A simulator run, reported to `sim/reports/` |
| `npm run sim:check` | The full simulator checks for the current milestone (also run in CI) |
| `npm run sim:accept` | Update `sim/baseline.json`. **Milestone end only, after the checks pass.** |
| `npm run build` | Production build |

## Decisions log format

Append one row to the table in `docs/decisions.md`:

```
| D<next> | YYYY-MM-DD | <what was decided, specific enough to act on> | <Owner / Claude proposal> | Decided / Accepted / Proposed |
```

Never edit or delete an old row. To reverse one, add a new row that supersedes it. **Older rows may use pre-D35 milestone numbers; read them through D35's mapping.**

## Style

- TypeScript strict. No `any`. Named exports only. One main concept per file, roughly 300 lines at most.
- Comments explain *why* and cite the GDD (`// GDD §5.4.2: provisions paid at launch`).
- User-facing text follows `docs/setting-primer.md`: plain, specific, human, and one wrongness at a time.
