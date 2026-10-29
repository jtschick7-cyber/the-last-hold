# CLAUDE.md — The Last Hold

## What this project is

An original single-player idle/incremental browser game.
- **The premise:** you're the warden of a ruined frontier fortress. You rebuild it, recruit monster hunters, take contracts, learn the bestiary, and face a voluntary prestige reset called the Long Night.
- **The platform:** a static PWA on GitHub Pages, phone-first, playable offline.
- **Who it's for:** the owner only. The owner doesn't read code. **You build the game, one milestone at a time, from the docs.**

## Session start

Read **targeted slices**, not whole files. The history is archived under `docs/archive/` on purpose; don't open it unless a task points there.

1. **Read this file.**
2. **Read the top of `docs/progress.md`** (the "Current state" block) **and its last entry only.**
3. **Find the current milestone** with a search for the `Status:` lines in `docs/implementation-plan.md`. Read that milestone's section and its first unchecked task that isn't marked `[?]`. Completed milestones are archived in `docs/archive/implementation-plan-v0.0-v0.8.md`.
4. **Read only the GDD and technical-design sections** that milestone lists under "Reads". Look up a decision by its number with a search; never open `docs/decisions.md` whole.
5. **Read `docs/questions.md`** (it holds only open and recent questions): any answered question unblocks a `[?]` task.
6. **Run `npm run check`.** If it's red, fixing it is the first task.

**Lore:** read `docs/setting-primer.md` freely. `docs/lore-secrets.md` is large: read only the section the task names, never the whole file.

## Session end

Append an entry to **`docs/progress.md`**:
- the date;
- what was done;
- what's next;
- open questions;
- anything skipped, deferred, or deprioritized, and why.

Keep it short and plain: **about 1.5 KB at most** (roughly 10 bullets). Put the long story (how a tuning was found, timings, trade-offs) in the pull request or the decisions log, not here. Also keep the "Current state" block at the top of `progress.md` up to date (branch, milestone, last task, next task). When `progress.md` passes about 20 KB, move older entries to `docs/archive/` and leave the last 3.

## Context hygiene

- **When the context is compacted:** preserve the current task, the list of files changed this session, any open questions, and the exact test command.
- **End sessions at task boundaries. One task per session by default** (two only when both are small and in the same files). Don't start a new task with a long context: finish the task (green `npm run check`, `progress.md` updated) and let the next session run the start ritual instead. Don't chain "session N (continued)" tasks.
- **Search before reading.** For big files (`gdd.md`, `decisions.md`, `lore-secrets.md`, the archive), search for the section or decision number, then read just that range.
- Bash output is compressed by a global tool (RTK). If a line-by-line
  comparison (golden fights, save round-trips) needs raw output, say so
  in the session or check the terminal.

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
- **Never seat an Order automatically; only the player's commands change `orders.seats`.**
- The UI never computes game rules.
- From v1.5 only Walls and Watchtower pieces on the grid in the front rows matter in combat, and only through the lane table frozen on the stand's record. Only `src/core/systems/breach.ts` (with the layout modules and the UI) may read `state.layout`; the stand fight, combat, economy, contracts and advance code never do, and nothing in `src/ui/` computes the lane numbers (the UI may read the layout to draw the grid).
- A stand's lane table is saved on its record and is what makes it a version 6 stand; a wave log is rebuilt from the saved table, never the live layout; a record without a table replays under the version 5 rules.
- Nothing in the Last Stand (Start, the preview, a load, the migration) places, moves or trays a piece. v1.1's auto-placement of newly unlocked pieces (purchase, Rank-up, new cycle) is unchanged. Otherwise only the player's own taps change the layout (Auto-arrange, and Use this layout if the owner has said yes to Q61).
- Write no player-facing strings for the Breach beyond the table in GDD §9.25; if a screen needs one, ask.
- Write no player-facing strings for the layout beyond the tables in GDD §9.21 and §9.25; if a screen needs one, ask.
- Sound is UI-only: nothing in `src/core/` imports or reads the sound module or the `sound` setting.
- Sound is never the only signal, nothing plays while the app is hidden, and a sound that cannot play now is skipped, never queued.
- Write no player-facing strings for sound beyond the table in GDD §9.22; if a screen needs one, ask.
- Rising Vigil level 0 takes the old stand path bit for bit: nothing outside the stand code reads `vigil`, and nothing in `src/ui/` computes the vigil factor.
- A stand's vigil level is saved on its record; a wave list, a log or a preview is always rebuilt with the saved level, never the switch's current state.
- Write no player-facing strings for Rising Vigil beyond the table in GDD §9.23; if a screen needs one, ask.
- The Descent runs on its own isolated fight path: nothing in contracts, Delves, events or the Last Stand reads `state.descent`, and nothing in `src/ui/` computes the `What the Hold Learned` bonus (the Descent's fight path is isolated, D561).
- Write the Descent story texts D-01 to D-07 and the three post-Descent resident lines word for word from `lore-secrets.md` §34.11, and write no player-facing strings for the Descent beyond GDD §9.24; if a screen needs one, ask (D560, D563).

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
- No failing test in `npm run check`, `e2e`, `sim` or `bench` may ever be called a "known container or runner problem" unless it is first shown to fail on `main` before the branch's changes (D557).

**Originality and assets**
- **Write the Orders texts word for word from `docs/lore-secrets.md` §33; invent none.**
- **Write The Remembering texts word for word from `docs/lore-secrets.md` §34; invent none.**
- **Before the player taps Remember Them, no text says, asks for or begins the Sent's names.**
- **The ending reads `orders.readWith` and `chaptersRead` only, never current seats or levels.**
- All content is original. Every new proper noun is searched against the influences (GDD §2.3) and added to `tests/content/names.ts`. If you can't search, list the names in `questions.md`; never skip the check.
- **CC0 assets only,** each with a manifest entry. `docs/credits.md` is generated.
- **Redrawn art ships only after the owner has approved its contact sheet or batch.**

**Phone and accessibility (v1.0)**
- **A tappable thing is at least 44 × 44 px** (exceptions: inline text links in prose, the debug panel, and numbers that only respond to a long press; their ⓘ is not exempt).

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
