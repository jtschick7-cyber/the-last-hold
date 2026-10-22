# Prompt for Claude chat: the post-v1.0 flesh-out session

Paste everything below the line as your first message in a new Claude chat, with the documents listed in `attach-list.md` attached.

---

You are helping me (the owner of "The Last Hold") run the **flesh-out session for what comes after v1.0**. I don't read code. Talk to me in plain language, short and concrete. This is a planning session in chat, not a coding session. Claude Code will build from what we produce.

**The game.** An original single-player idle/incremental browser game (phone-first static PWA on GitHub Pages, playable offline). I'm the warden of a ruined frontier fortress: I rebuild it, recruit monster hunters, take contracts, learn the bestiary, and face a voluntary reset called the Long Night. **v1.0 "Polish" is finished, merged to `main` and tagged `v1.0.0`** (bigger tap targets, Text size, reduced motion, contrast, a backup reminder, redrawn art, a balance audit). I play on an iPhone. Save schema is 11, `rulesVersion` is 5, the last decision is D497, the last question is Q50.

**What the attached files are.** The plan (`implementation-plan.md`: §0.4 is the flesh-out process, §0.6 the locked constants; the v1.0 section shows the finished shape), the design (`gdd.md`), the progress log, open questions, the v1.0 summary, an extract of the decisions log (D472 to D497, plus D448 and D453), an extract of the lore about the endings (spoilers), the setting primer, and the original brief. The v1.0 plan and decision rows are attached as examples of the format I expect.

**What is waiting, by my earlier decisions** (each is on the visible deferred list):
- **Audio** as its own small milestone: CC0 sounds only, muted by default with a toggle, no new runtime dependency (D476).
- **The Descent** (a third ending: one final battle in the Deep) in its own milestone (D448, D477).
- **A rising-difficulty "Keep the Vigil"** (an endless mode), in its own milestone (D453, D477).
- Smaller items: event-only cosmetics and the legendary hunters' animation (D490); screen-reader labels and keyboard focus (D489); the four species (Draugr, Leshy, Strzyga, Rimewrought) that rarely arrive after each Long Night (Q46; I chose only a card line, D493); the name searches Q41 and Q48; the older "odds with 3 candidates" timing row that fails on slow machines (D445).
- Nothing says any of these is wanted next. **Part of this session is deciding what, if anything, comes next, and in what order.** Playing on for a while before building more is a fair answer.

**Your job, in this order** (plan §0.4):
1. **Review what playtesting taught.** Ask me, a few questions at a time, what felt too slow, too fast, confusing, or like a chore, now that v1.0 is out. Read `progress.md` and `questions.md` first so you don't ask what is already answered.
2. **Scope what comes next.** Walk me through the waiting items **one or two at a time**, each with options and **your recommendation**; never choose silently. For each, say what it would cost (rough task and session count), what it risks (saves, balance, determinism, the simulator rows, the 600 KB download row in GDD §6.5, the 5-minute CI limit per job), and whether it needs new story text or new art (which I must approve). Then propose the order and the milestone names or numbers.
3. **Bring the GDD sections to full detail** for whatever we decide, with my approval. Check against GDD §9 (UI), §10 (out of scope), §6 (simulator rows and performance budgets), and the endings in GDD §5 and the lore extract.
4. **Expand the plan** into tasks with a "Before you start" box, "Reads" per task, acceptance criteria, simulator checks (if any), a playtest checklist, and owner tasks, in the same shape as the v1.0 plan (`OUT-4a-plan.md`). One task should fit one Claude Code session; say which tasks need a stop-and-ask.
5. **Log the decisions** as new rows starting at **D498**, status `Proposed` until I say yes. Questions go in as **Q51** and up. List any new proper nouns for `tests/content/names.ts`, searched against the influences (GDD §2.3).
6. **The sweep.** List every decisions row from D472 on that still reads `Proposed` and ask me for each. No row stays `Proposed` across two milestones.

**Rules you must respect** (they come from the repo's `CLAUDE.md`):
- **Owner gates:** you may propose but I decide: merging and tagging, marking a decision `Decided`, changing design content in the GDD or technical design, adding a runtime dependency, changing a `locked` constant, `sim/targets.ts`, golden fixtures or coverage rules, force-pushing or deleting branches.
- **Balance fixes change `tunable` constants only, never formulas.** If no reasonable value passes a check, we stop and ask.
- **Saves:** any schema change needs a migration, a fixture of a real old save, and a round-trip test. Storage keys stay namespaced by channel.
- **Determinism:** same seed and commands give identical state; the golden fights replay line for line; combat math changes bump `rulesVersion`. A new ending or an endless mode that changes combat or the Long Night is a rules change; say so plainly.
- **The ending reads `orders.readWith` and `chaptersRead` only,** never current seats or levels. Before the player taps Remember Them, no text says, asks for or begins the Sent's names. Any new ending text is written only when I ask, and listed for my read.
- **Originality and assets:** all content original; CC0 assets only, each with a manifest entry (for audio, the manifest's `audio` slot is reserved); redrawn or new art ships only after I approve its contact sheet or batch.
- **Phone and accessibility:** every tappable thing is at least 44 × 44 px; the pixel font, sprites and the two bars do not scale with Text size.
- **The UI never computes game rules;** every visible number with a formula has a breakdown built by the same function.
- **Never drop a requirement silently.** Anything we defer or cut goes on a visible list with the reason.

**What to hand me at the end** (as separate downloadable files, named like the v1.0 set): `OUT-1-decisions.md` (rows D498+), `OUT-2a-gdd-changes.md` (exact find-and-replace edits to `gdd.md`), `OUT-3` only if there are texts, `OUT-4a-plan.md` (the new section(s) of the plan), `OUT-5-questions.md`, `OUT-6-names.md` (new names and what was searched), `OUT-9-technical-design.md` only if technical design changes, a short summary for me, and `claude-code-prompt-<milestone>.md` to paste into Claude Code (it must start with the step that checks v1.0 is merged and tagged `v1.0.0`, and ask me to confirm I've read the flesh-out before anything is applied).

Please start by reading the attached files, then tell me in a few lines what you understand the state of the game to be, list the `Proposed` rows that need my sweep, and ask me your first round of playtest-review questions.
