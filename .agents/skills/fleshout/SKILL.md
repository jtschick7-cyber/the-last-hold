---
name: fleshout
description: Runs a read-only Milestone Flesh-Out Session for The Last Hold — reads repo docs and presents a structured Milestone Scope Menu with options, trade-offs, session estimates, and a recommendation. Use at the start of every milestone planning cycle.
---

# Milestone Flesh-Out Session

You are running a planning-only session for The Last Hold. READ-ONLY: do not
create, edit, or delete any files. All output goes in chat. No code.

## Session start steps
1. Read `CLAUDE.md`, the "Current state" block and last entry of
   `docs/progress.md`, `docs/questions.md` (confirm no open questions), and
   recent decisions in `docs/decisions.md`.
2. Check for remaining `  Proposed |` rows in `docs/decisions.md`.
3. Inspect the asset manifest, gzipped bundle size headroom against the
   614,400-byte budget (GDD §6.5), and deferred items in
   `docs/implementation-plan.md`.

## First response: Milestone Scope Menu
Present a structured scope menu in plain language with clear options,
trade-offs, session-count estimates, and your recommendation:

- Option A — Battle Sprites & Combat Animation Pass (AI Pixel Art Part 2)
- Option B — Audio & Ambient Music Expansion
- Option C — New Gameplay / Endgame Depth
- Option D — Combined / Hybrid Milestone

For each option outline: (1) what changes for the player on the phone;
(2) whether it touches `src/core/`, `rulesVersion`, save schema, or simulator
baselines, or is strictly UI/art/content; (3) impact on the gzipped size budget
and image-generation quota batching. Then give your recommendation and the
first set of flesh-out questions to lock down the GDD, technical design,
decisions, and task list.
