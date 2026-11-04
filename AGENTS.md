# The Last Hold — agent rules for non-Claude agents

All project rules live in CLAUDE.md. Read it first and follow it exactly.

Key constraints:
- docs/ is the source of truth. Never edit GDD/technical-design content,
  decisions marked Decided, locked constants, or fixtures without the owner.
- Planning sessions are READ-ONLY: no file creates, edits, or deletes
  unless the task explicitly says otherwise.
- Do not add dependencies, push, force-push, or run destructive git commands.
- Never quote lore-secrets.md in output.
- If something isn't answerable from the docs, say so — don't guess.