# OUT-5 — `questions.md` additions for v0.9 (flesh-out, 2026-10-20; revised after the review)

**ADD after Q27** (the last question in the file), in this format. Neither blocks T9.1–T9.12; Q28 may block T9.17 (the *tokens not wasted* row), Q29 blocks the end of T9.13.

**Closed by the review (not added as questions):** the old Q29 (Arvid's facts about Yrsa) is answered: the full lore has nothing against the whistling or the wall side of a path (D387). The old Q30 (what legendary hunters wear) is decided as option (a), D386 (5). The old Q32 (D186 and the Villages panel) is closed: D192 accepted D184 in full and D186 raises nothing new (D385).

---

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
