# Prompt for Claude chat: the v1.0 flesh-out session

Paste everything below the line as your first message in a new Claude chat, with the documents listed in `attach-list.md` attached.

---

You are helping me (the owner of "The Last Hold") run the **flesh-out session for v1.0 "Polish"**, the last outline milestone. I don't read code. Talk to me in plain language, short and concrete. This is a planning session in chat, not a coding session. Claude Code will build from what we produce.

**The game.** An original single-player idle/incremental browser game (phone-first static PWA on GitHub Pages, playable offline). I'm the warden of a ruined frontier fortress: I rebuild it, recruit monster hunters, take contracts, learn the bestiary, and face a voluntary reset called the Long Night. Milestone v0.11 "The Remembering" (the ending) is finished, merged to `main` and tagged `v0.11.0`. Save schema is 11, `rulesVersion` is 5, the last decision is D471, the last question is Q45.

**What the attached files are.** The plan (`implementation-plan.md`: §0.4 is the flesh-out process, §0.6 the locked constants, the v1.0 outline is at the end), the design (`gdd.md`), the progress log, open questions, the v0.11 summary (it ends with ten questions "For v1.0"), an extract of the decisions log, an inventory of every picture in the game (which are code-drawn placeholders), the setting primer, and the original brief. One earlier flesh-out's plan and decision rows are attached as examples of the format I expect.

**Your job, in this order** (plan §0.4):
1. **Review what playtesting taught.** Ask me, a few questions at a time, what felt too slow, too fast, confusing, or like a chore across v0.1 to v0.11. Read `progress.md` and `questions.md` first so you don't ask what is already answered.
2. **Scope v1.0.** The outline says: an art and UX pass; a full balance pass; achievements (a candidate; I decide); the ten questions in `v0.11-summary.md` "For v1.0". Walk me through those ten questions, **one or two at a time**, each with options and **your recommendation**. Never choose silently. Then propose whether v1.0 is one milestone or should be split (for example v0.12 polish, v1.0 release), with a rough task count and the risks. The Descent and a rising-difficulty Keep the Vigil are currently out of scope (D448, D453); I will say whether they come before v1.0, after it, or never.
3. **Bring the GDD section to full detail** for whatever we decide, with my approval. Check against GDD §9 (UI), §10 (out of scope, including the audio and achievements notes) and §6 (simulator rows and performance budgets).
4. **Expand the plan** into tasks with a "Before you start" box, "Reads" per task, acceptance criteria, simulator checks (if any), a playtest checklist, and owner tasks, in the same shape as the v0.11 plan (`OUT-4a-plan.md`). One task should fit one Claude Code session; say which tasks need a stop-and-ask.
5. **Log the decisions** as new rows starting at **D472**, status `Proposed` until I say yes. Questions go in as **Q46** and up. List any new proper nouns for `tests/content/names.ts`.
6. **The sweep.** List every decisions row that is still open for a yes or no (see the extract: D446, D459 and D461 to D467 are the v0.11 rows not yet individually accepted) and ask me for each. No row stays `Proposed` across two milestones.

**Rules you must respect** (they come from the repo's `CLAUDE.md`):
- **Owner gates:** you may propose but I decide: merging and tagging, marking a decision `Decided`, changing design content in the GDD or technical design, adding a runtime dependency, changing a `locked` constant, `sim/targets.ts`, golden fixtures or coverage rules, force-pushing or deleting branches.
- **Balance fixes change `tunable` constants only, never formulas.** If no reasonable value passes a check, we stop and ask.
- **Saves:** any schema change needs a migration, a fixture of a real old save, and a round-trip test. Storage keys stay namespaced by channel.
- **Determinism:** same seed and commands give identical state; the golden fights replay line for line; combat math changes bump `rulesVersion`.
- **Originality and assets:** all content original; CC0 assets only, each with a manifest entry; every new proper noun checked against the influences (GDD §2.3).
- **The UI never computes game rules;** every visible number with a formula has a breakdown built by the same function.
- **Texts:** follow the setting primer (plain, specific, human, one wrongness at a time). If v1.0 needs new story or ending text, write it only when I ask, and list it for my read.
- **Never drop a requirement silently.** Anything we defer or cut goes on a visible list with the reason.

**What to hand me at the end** (as separate downloadable files, named like the v0.11 set): `OUT-1-decisions.md` (rows D472+), `OUT-2a-gdd-changes.md` (exact find-and-replace edits to `gdd.md`), `OUT-3` only if there are texts, `OUT-4a-plan.md` (the v1.0 section of the plan), `OUT-5-questions.md`, `OUT-6-names.md` (new names and what was searched), `OUT-9-technical-design.md` only if technical design changes, a short `v1.0-summary.md` for me, and `claude-code-prompt-v1.0.md` to paste into Claude Code (it must start with the step that checks v0.11 is merged and tagged, and ask me to confirm I've read the flesh-out before anything is applied).

Please start by reading the attached files, then tell me in a few lines what you understand the state of the game to be, list the `Proposed` rows that need my sweep, and ask me your first round of playtest-review questions.
