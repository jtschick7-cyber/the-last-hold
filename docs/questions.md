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


### Q28 — What if "tokens not wasted" still can't pass? (may block T9.17, row 4) — open
- **What I found:** the row (a full bank at no more than 15% of the Eventer's **unlocked** check-ins, median of the Monday seeds; D367, D386 (4)) is the one most likely to fail. Tokens come at 3 a day. Eleven hunters on a 24 h rest allow at most about 2.75 four-hunter attempts a day, and fewer when contracts keep hunters busy (the Eventer takes Standard's contract decisions). So the bank can drift to full. Check-ins made while events are locked no longer count (the owner's ruling), which removes the largest cause, but the rest remains the limit. All the numbers involved are locked (`boss.partySize`, `boss.tokenInterval`, `boss.tokenMax`, `boss.hunterRest`), so no tunable can fix it.
- **Options:** (a) **Raise the threshold** (say 30%), because a full bank is partly the owner's choice and the badge exists for exactly that. (b) **Let the Eventer send smaller parties** (three hunters) when four are not free; this changes the policy, not the game. (c) **Change a locked value** (a bigger bank, or a shorter rest) through a decisions row.
- **Recommendation:** (b), then (a) if that is not enough. (c) only if the owner wants the real game to change.
- **Blocks:** the *tokens not wasted* row in T9.17. Nothing else.
- **Answer (owner):**

### Q29 — The real pool size, once measured (blocks the end of T9.13) — open
- **What I found:** `boss.poolBase` 24,000 is a sketch from a rough model. The real figure depends on how much damage the simulated party actually deals at tiers 4 and 5.
- **Question:** T9.13 will report the measured median damage per attempt and the pool that makes a visit about 12 attempts. The owner says yes or no to that figure as a decisions row (the value is locked).
- **Options:** (a) accept the measured pool; (b) ask for a longer or shorter visit (say 8 or 20 attempts) and a new pool; (c) keep the sketch.
- **Recommendation:** (a).
- **Blocks:** the final pool in T9.13 and anything calibrated on it.
- **Answer (owner):**

### Q30 — `boss.order` uses short keys; the Great Beasts' ids are long (T9.6; not blocking)
- **What I found:** the locked `boss.order` is `[lindworm, barrow-king, mother-of-the-river]` (GDD §7.11, D379), but the technical design fixes the first beast's id as `lindworm-of-velk-fjord`.
- **Options:** (a) keep both and match them by position (what T9.4 does; a test pins it); (b) change the locked value to the full ids through a decisions row.
- **Recommendation:** (a): nothing locked moves.
- **Answer (owner):**

### Q31 — The Eventer never goes on a hunt as the rules are written (blocks T9.12's hunt rule, T9.13, T9.17) — answered
- **What I found:** GDD §6.1 (D367) says the Eventer picks the boss "unless a legendary hunter is within reach", meaning one win on the hunt's best track would reach 100 points. The best track pays 32 for a win, and points only come from hunt attempts. From 0 points, no hunt is ever within reach, so the Eventer never starts one. In a 42-day run it made 49 boss attempts and 0 hunt attempts. So "first legendary hunter unlocked by the end of the third cycle" can never pass, and the hunt numbers in T9.13 would go unmeasured by the Eventer.
- **Options:** (a) **Alternate:** after each boss attempt, the next goes to the hunt with the most points (ties in list order), on its best track with a full legal party; no replays. (b) **Hunt first:** within reach means "could finish with at most 4 more wins", so it hunts from the start until all three are unlocked, then bosses only. (c) **Boss first:** boss only until the first boss is defeated, then hunts (a boss-first row stays safe; the hunter row is judged later).
- **Recommendation:** (a): both rows (first boss defeated, first hunter unlocked) get tokens, and the choice is easy to explain. Which fits depends on how many tokens the Eventer really gets; tokens look scarce because hunters are mostly out on contracts (see Q28).
- **Blocks:** the hunt rule in T9.12 (the policy is built to the literal text meanwhile), the Eventer rows in T9.17.
- **Answer (owner):** (a), 2026-10-21.
