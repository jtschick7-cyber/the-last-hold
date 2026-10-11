# CLAUDE.md — The Last Hold

## What this project is

An original single-player idle/incremental browser game.
- **The premise:** you're the warden of a ruined frontier fortress. You rebuild it, recruit monster hunters, take contracts, learn the bestiary, and face a voluntary prestige reset called the Long Night.
- **The platform:** a static PWA on GitHub Pages, phone-first, playable offline.
- **Who it's for:** the owner only. They don't write code. **You build it, one milestone at a time, from the docs.**

## Read before you start (every session)

1. **This file.**
2. **`docs/implementation-plan.md`:** find the **current milestone** (the first one not marked complete), then its **first unchecked task**.
3. **The GDD and technical-design sections that milestone lists** under "Reads".
4. **`docs/decisions.md`:** skim the latest rows. Decisions there override older text elsewhere.
5. **Lore:**
   - `docs/setting-primer.md` is fine to read at any time.
   - **Do not open `docs/lore-secrets.md` before v0.5,** and never put its content into the game before v0.5. It holds the story's spoilers.

## Scope rules

- **Work only on the current milestone's tasks.** Don't build ahead, even when it looks easy. Outline-level milestones (v0.4+) need a flesh-out session with the owner first (plan §0.5).
- **If a task is bigger than one session,** split it into sub-tasks in the plan before continuing.
- **If the docs don't answer a design question, ask the owner. Don't guess.** Record the answer in `docs/decisions.md`.

## Hard rules

**Architecture (technical design §4):**
- `src/core/` is pure. **NEVER** import `ui/` or `platform/` from it, or touch browser globals.
- **NEVER** call `Math.random()`, `Date.now()` or `new Date()` in `src/core/`. Time is passed in; randomness comes from `core/rng`.
- **Every player action is a `Command` through `apply()`. Time passes only through `advance()`.** The UI, simulator, and debug panel all use these two.
- The UI never computes game rules. It reads selectors and dispatches commands.

**Content and balance:**
- **Content goes in `src/content/`,** never in code.
- **Every numeric game constant lives in `src/content/balance.ts`,** under the GDD §7 key name.
- **Balance fixes change constants, not formulas.** A constant moved by more than 2× gets a decisions-log row. If no reasonable constant passes a check, stop and ask.

**Saves:**
- **NEVER change the save schema without a migration, a fixture of a real old save, and a round-trip test** (technical design §9.4).

**Determinism:**
- Same seed and same commands must produce identical state.
- The GDD §5.5.1 golden fight must reproduce **line for line**.
- If combat math changes, bump `rulesVersion`.

**Originality and assets:**
- All world, character, and monster content is original.
- Before any new proper noun ships, search it against the influences (GDD §2.3, including the avoid list) and add it to `tests/content/names.ts`.
- **CC0 assets only.** Every asset gets a manifest entry with its license and credit. `docs/credits.md` is generated, never hand-edited.

**Honesty:**
- Every visible number with a formula needs a breakdown that comes from the same function as the number (GDD §5.0).
- Don't claim something works until a test or a run shows it.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run check` | Typecheck + lint + tests + fast simulator checks. **Must be green before every commit.** |
| `npm test -- <pattern>` | Narrow test runs while iterating |
| `npm run sim -- --policy standard --days 14 --seeds 5` | Balance simulator run, with a report in `sim/reports/` |
| `npm run sim:check` | All simulator checks enabled for the current milestone |
| `npm run sim:accept` | Update `sim/baseline.json` (only after the checks pass) |
| `npm run build` | Production build |

## Definition of done (per task)

1. The task's acceptance items are met.
2. Tests are added or updated; `npm run check` is green.
3. No constants outside `balance.ts`; no content outside `src/content/`.
4. If the schema changed: migration + fixture + round-trip test.
5. New proper nouns are collision-checked.
6. Decisions are logged.
7. The task's box is ticked in `docs/implementation-plan.md`.

## Workflow

- Branch `milestone/v0.X`. Commit small and often, using Conventional Commits (`feat:`, `fix:`, `test:`, `balance:`, `docs:`, `chore:`).
- **Test-first for formulas, rules, and saved data.** Run narrow tests while iterating, and `npm run check` before committing.
- **Ending a milestone:** follow plan §0.4. All tasks are ticked; acceptance and simulator checks pass; the owner runs the playtest checklist; statuses and the decisions log are updated; merge, then tag.

## Decisions log format

Append one row to the table in `docs/decisions.md`:

```
| D<next> | YYYY-MM-DD | <what was decided, specific enough to act on> | <who: Owner / Claude proposal> | Decided / Accepted / Proposed |
```

**Never edit or delete an old row.** To reverse a decision, add a new row that says it supersedes the old one.

## Style

- TypeScript strict; no `any` (use `unknown` plus guards at boundaries); named exports only.
- One main concept per file, roughly 300 lines at most.
- Comments explain *why*, and cite the GDD section (`// GDD §5.4.2: provisions paid at launch`).
- **User-facing text follows `docs/setting-primer.md`:** plain, specific, human, and one wrongness at a time.
