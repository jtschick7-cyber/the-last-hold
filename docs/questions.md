# Open questions for the owner

Claude Code adds a question here when a task is blocked and the owner isn't available (CLAUDE.md, "Working with the owner"). The blocked task is marked `[?]` in the plan.

**Format:**

### Q<n> — <short title> (blocks T<x.y>) — open | answered
- **Question:**
- **Options:** (a) … (b) …
- **Recommendation:**
- **Answer (owner):** (a), 2026-10-12. The download steps are in `art-src/PACKS-NEEDED.md`, together with the art packs.

---

Answered questions Q1–Q25 are in [`docs/archive/questions-answered.md`](archive/questions-answered.md).

### Q26 — Where does "Command XP per Delve floor" live in `balance.ts`? (blocks the Command XP part of T8.11; T8.3 goes on without that one key)
- **What I found:** the flesh-out names the constant `skill.xp.command.delveFloor` (GDD §5.10.7, §7.10). But `skill.xp.command` already exists as **one** constant, `{ contractPerTier 2, wave 1 }` (GDD §7.8, D237), and the test that matches `balance.ts` against GDD §7 needs every key to be exactly one constant. A key can't be both a constant and a folder.
- **Options:**
  (a) **Add it as a field of the existing constant:** `skill.xp.command` = { contractPerTier 2, wave 1, delveFloor 1 }. The GDD §7.8 row gains `delveFloor 1`, and §7.10 points to it. No test changes and no code reads change; the reading `skill.xp.command.delveFloor` in §5.10.7 then names that field.
  (b) Split the constant in three: `skill.xp.command.contractPerTier`, `.wave`, `.delveFloor`. The GDD §7.8 row changes and the code that reads the Command table changes.
  (c) Loosen the key test so a constant may also have sub-keys. This touches a test helper, which I would not do on my own.
- **Recommendation:** (a): smallest change, nothing else moves, same numbers.
- **Blocks:** the Command XP line of T8.11 (marked `[?]`) and one row of GDD §7.10, which is left out for now. Nothing else.
- **Answer (owner):** (a), 2026-10-15 (D345).


### Q27 — What is "a rank-up" line on the away sheet and results? (T8.13b; not blocking)
- **What I found:** GDD §9.16 lists "one line each for loot, auto-salvage, a Legendary found, a rank-up, and yard catch-up" on the away sheet and results. Loot, auto-salvage, Legendary and yard lines are built (they come from things that happen while you are away). But a hunter's rank only changes when **you** press Rank up (GDD §5.11.3), so nothing can "rank up" while you are away, and there is no line to show.
- **Options:**
  (a) **A "can rank up" line on the away sheet**, worked out from the save when you come back: *"Zora can rank up to Wright."* Not saved, so it is never stale; shown once per return, not in the results list.
  (b) **Skip it.** The Hunters tab already shows a talent-point badge, and the hunter sheet shows Rank up with its reason. Rank-ups are your own action, so no line is needed.
  (c) A line on a contract's result when that win is the one that made a hunter qualify (needs one more saved field on the result).
- **Recommendation:** (b) for now; (a) if you'd like the nudge.
- **Blocks:** only the "rank-up" part of the line list in T8.13b. Everything else in it is built.
- **Answer (owner):** (b), 2026-10-15 (D349). No rank-up line; GDD §9.16 and the plan's T8.13b line list are read without it.
