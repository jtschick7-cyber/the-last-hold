# The Last Hold — agent rules for Antigravity sessions

All project rules live in CLAUDE.md. Read it at the start of every session
and follow it exactly. Rules below restate the critical ones.

## Session ritual (every conversation)
1. Read CLAUDE.md, the "Current state" block and last entry of
   docs/progress.md, the current milestone section of
   docs/implementation-plan.md, and docs/questions.md.
2. One task per conversation. Do not continue into a second task.
3. Before finishing: run `npm run check` and confirm it is green (≤ 90 s).

## Owner gates — never do these alone; always stop and ask Jason:
- Merge, tag, or push anything.
- Mark decisions Decided, or edit GDD/technical-design content.
- Add runtime dependencies, change locked constants, golden fixtures,
  or coverage rules.
- Force-push or read lore secrets from git history.

## Discipline
- docs/ is the source of truth; unanswered questions go to docs/questions.md
  with options + recommendation, task marked [?]. Never pick defaults silently.
- Save schema changes need migration + real-save fixture + round-trip test.
- Do not read node_modules/, dist/, dist-preview/, coverage/, test-results/,
  playwright-report/, sim/reports/*.json, sim/shards/, or binary art files
  (art-src zips/packs). They waste context.
- End every session by appending a dated entry to docs/progress.md
  summarizing what changed, and stop.
