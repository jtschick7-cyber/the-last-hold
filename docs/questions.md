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


### Q28 — What if "tokens not wasted" still can't pass? (may block T9.17, row 4) — answered
- **What I found:** the row (a full bank at no more than 15% of the Eventer's **unlocked** check-ins, median of the Monday seeds; D367, D386 (4)) is the one most likely to fail. Tokens come at 3 a day. Eleven hunters on a 24 h rest allow at most about 2.75 four-hunter attempts a day, and fewer when contracts keep hunters busy (the Eventer takes Standard's contract decisions). So the bank can drift to full. Check-ins made while events are locked no longer count (the owner's ruling), which removes the largest cause, but the rest remains the limit. All the numbers involved are locked (`boss.partySize`, `boss.tokenInterval`, `boss.tokenMax`, `boss.hunterRest`), so no tunable can fix it.
- **Options:** (a) **Raise the threshold** (say 30%), because a full bank is partly the owner's choice and the badge exists for exactly that. (b) **Let the Eventer send smaller parties** (three hunters) when four are not free; this changes the policy, not the game. (c) **Change a locked value** (a bigger bank, or a shorter rest) through a decisions row.
- **Recommendation:** (b), then (a) if that is not enough. (c) only if the owner wants the real game to change.
- **Blocks:** the *tokens not wasted* row in T9.17. Nothing else.
- **Answer (owner):** (b), then (a) if that is not enough; measure first in T9.17. Logged as D401, 2026-10-21.

### Q29 — The real pool size, once measured (blocks the end of T9.13) — answered
- **What I found:** `boss.poolBase` 24,000 is a sketch from a rough model. The real figure depends on how much damage the simulated party actually deals at tiers 4 and 5.
- **Question:** T9.13 will report the measured median damage per attempt and the pool that makes a visit about 12 attempts. The owner says yes or no to that figure as a decisions row (the value is locked).
- **Options:** (a) accept the measured pool; (b) ask for a longer or shorter visit (say 8 or 20 attempts) and a new pool; (c) keep the sketch.
- **Recommendation:** (a).
- **Blocks:** the final pool in T9.13 and anything calibrated on it.
- **Answer (owner):** (a), 21,000. Logged as D400, 2026-10-21.

### Q30 — `boss.order` uses short keys; the Great Beasts' ids are long (T9.6; not blocking) — answered
- **What I found:** the locked `boss.order` is `[lindworm, barrow-king, mother-of-the-river]` (GDD §7.11, D379), but the technical design fixes the first beast's id as `lindworm-of-velk-fjord`.
- **Options:** (a) keep both and match them by position (what T9.4 does; a test pins it); (b) change the locked value to the full ids through a decisions row.
- **Recommendation:** (a): nothing locked moves.
- **Answer (owner):** (a), 2026-10-21. Nothing locked moves.

### Q31 — The Eventer never goes on a hunt as the rules are written (blocks T9.12's hunt rule, T9.13, T9.17) — answered
- **What I found:** GDD §6.1 (D367) says the Eventer picks the boss "unless a legendary hunter is within reach", meaning one win on the hunt's best track would reach 100 points. The best track pays 32 for a win, and points only come from hunt attempts. From 0 points, no hunt is ever within reach, so the Eventer never starts one. In a 42-day run it made 49 boss attempts and 0 hunt attempts. So "first legendary hunter unlocked by the end of the third cycle" can never pass, and the hunt numbers in T9.13 would go unmeasured by the Eventer.
- **Options:** (a) **Alternate:** after each boss attempt, the next goes to the hunt with the most points (ties in list order), on its best track with a full legal party; no replays. (b) **Hunt first:** within reach means "could finish with at most 4 more wins", so it hunts from the start until all three are unlocked, then bosses only. (c) **Boss first:** boss only until the first boss is defeated, then hunts (a boss-first row stays safe; the hunter row is judged later).
- **Recommendation:** (a): both rows (first boss defeated, first hunter unlocked) get tokens, and the choice is easy to explain. Which fits depends on how many tokens the Eventer really gets; tokens look scarce because hunters are mostly out on contracts (see Q28).
- **Blocks:** the hunt rule in T9.12 (the policy is built to the literal text meanwhile), the Eventer rows in T9.17.
- **Answer (owner):** (a), 2026-10-21.

### Q32 — Boss and quarry numbers after the T9.13 measurement (blocks the end of T9.13) — answered
- **What I found:** see D397 and `docs/flesh-out/v0.9-calibration.md`. The Barrow-King is far harder than the other two in weak states; tracks are all-or-nothing and no quarry strength tried gives 25–90% across states; an unlock takes about 4 attempts.
- **Options:** (a) Apply the softening table (changes GDD §8.13 and the content tests); (b) leave the numbers as written and accept uneven bosses; (c) a different change you name.
- **Recommendation:** (a) for the bosses; for hunts, soften `hunt.trackPoints` to 10/4, 15/6, 22/8 and leave the quarries.
- **Answer (owner):** agree with the recommendations (bosses: apply the softening table; hunts: soften `hunt.trackPoints`, leave the quarries), 2026-10-21. Logged as D398.

### Q33 — The Eventer cannot meet three of the approved event rows as it plays (blocks T9.17)
- **What I measured** (5 Monday seeds, Eventer, current policy; report `sim/reports/2026-10-21T09-59-36-262Z-eventer.md`). Medians:
  - First boss attempt: 9 h after the Citadel (needs 24 h or less). **Passes.**
  - First boss defeated: **cycle 6** in every seed (needs cycle 2 or earlier). **Fails.**
  - First legendary hunter unlocked: **cycle 5** (cycles 4 to 6 by seed; needs cycle 3 or earlier). **Fails.**
  - Full bank at open check-ins: **about 29%** (26% to 30% by seed; needs 15% or less). **Fails.**
  - Silver #6 with boss silver: not yet wired into the check; boss silver looks large next to bounty silver, so it may fail too.
- **Why:** at 85–94 of about 95 open check-ins, fewer than four hunters are free, because the Eventer's contract decisions are Standard's and Standard keeps hunters on contracts. It spends about 1 token in 4 days of play.
- **I tried Q28 (b)** (send three hunters when four are not free): it barely moved anything (first kill cycle 4 to 6, unlocks cycle 4 to 13, full bank about 26%). I reverted it; nothing is committed. No tunable fixes this: the boss pool and hunt points are already measured for the best parties.
- **Options:** (a) **The Eventer is a player who cares about events:** when a token is banked it holds four hunters back from new contracts (a policy change; GDD §6.1 says "Standard's contract decisions", so it changes with your yes). The rows stay as approved. (b) **Keep the Eventer as is and move the rows** to what it reaches: first kill by cycle 6, first unlock by cycle 5, full bank at most 30% (rows move; your yes). (c) Both: the hold-back policy first, then the rows only if it is not enough.
- **Recommendation:** (c). The approved rows say how fast a player who cares about events should see them; a player who never frees a hunter measures the wrong thing. Fix the player first, then measure again, and move a row only if it still does not pass.
- **Blocks:** all of T9.17 (the Eventer rows). The two D383 rows (Act VI lands; the Dross-Tide probe) are still waiting for their own yes.
- **Answer (owner):** (c), 2026-10-21 (hold-back first, then the rows only if it is not enough).
- **Result of the hold-back (a):** tried on 5 Monday seeds. It did not help: first kill cycles 4 to 7 (median 5), first unlock cycles 4 to 13 (median 5), full bank about 32% (23 to 34 of 87 to 94 open check-ins). Reverted, nothing committed. **Why:** a token arrives every 8 h (3 a day), but an attempt of four hunters rests them 24 h, so four hunters can only fund 1 attempt a day. With 8 to 11 hunters that is at most 2 to 3 attempts a day before any contract, and about 12 attempts are needed for a kill. Cycles last about 2.8 days, so a kill takes about 5 cycles even for a player who cares. The pool, the rest and the token interval are locked `boss.*` values, so I did not touch them.
- **Silver #6 with boss silver:** passes. On the cycle-1 stretch the bounty share is 64% to 80% by seed, median 77% (needs 70%); over all cycles it would be about 69%, but later cycles are reported only (D135).
- **My proposal for the three rows (needs your yes, they sit just past what is reached):** first boss defeated by the end of cycle **7** (measured 4 to 7, median 5); first legendary hunter unlocked by the end of cycle **6** (measured median 5); full bank at most **35%** of unlocked check-ins (measured median about 32%). The first-boss-attempt row (24 h) and the silver row stay as approved.
- **Or:** (d) you set a locked `boss.*` value instead (for example `boss.hunterRest` 24 h to 12 h, or a smaller pool), as a decisions row; then I measure again and the rows stay as approved. A rough guide: halving the rest roughly doubles how many attempts four hunters can fund.

### Q34 — The name search found near-matches for two Order names *(asked 2026-10-21; open)*
- **Context:** GDD §2.3 requires a web search for every new proper noun. It was run on 2026-10-21 for the four Order names (results in OUT-6). **"Grey Wives" and "the Quenchers": no match.** **"Thanes' Moot":** "Moot" is also a lore term in Skyrim (the assembly where the Jarls choose the High King, UESP "Lore:Moot"); the GDD allows "thane" and "moot" is an ordinary old English word (folkmoot), and the avoid list does not name it. **"Bell-Watchers":** Dark Souls has a "Bell Keepers" covenant and "Abyss Watchers"; no exact match, and the avoid list targets different elements (souls, kindling, ash, hollows, bonfires), but the two words are close in feel. The chapter and opening titles are plain English phrases and were not searched one by one.
- **Options:** (a) Keep both names (they are in the setting primer and lore §14 already). (b) Rename "Thanes' Moot" to something with "headmen" (the GDD's other allowed word), for example "the Headmen's Moot". (c) Rename "Bell-Watchers" to something plainer, for example "the Bell-Ringers". (d) Both (b) and (c).
- **Recommendation:** (a). Neither is a name from those games, both are the lore's own, and a rename would touch the lore, the primer and the chapter texts. Choose (b) or (c) if "Moot" or "Watchers" reads too close to those games to you.
- **Blocks:** nothing (the names test is green with the dated entries). A rename would be one text change before T10.9.
- **Answer (owner):** *(open)*

### Q35 — The owner's save may not hold some standing counts *(asked 2026-10-21; open)*
- **Context:** the migration backfills standing once, from the save's history, **capped at level 1** (D410, D421). I could not see which counts the save keeps (for example, whether every brew or property revealed is recorded, or only the current Book; the Alchemy skill's XP may count the same things). T10.1 reports exactly which are recoverable before it writes the migration. Anything not recoverable starts at 0.
- **Options:** (a) Accept what is recoverable. Because of the level-1 cap, the result is the same start (level 1) whatever the history, so a gap costs nothing. (b) Ask Claude Code to estimate the missing counts. (c) Use the debug commands to set a starting level you think is fair.
- **Recommendation:** (a). The cap already makes the start level 1; progress from there is live. Use (c) if the start feels off in your playtest.
- **Blocks:** nothing; T10.1 reports the table.
- **Answer (owner):** *(open)*

### Q36 — Art for the Orders *(asked 2026-10-21; open)*
- **Context:** T10.15 needs four order marks, an Orders icon and placeholders for the four opening scenes.
- **Options:** (a) Draw them in code as in v0.9, and you approve them. (b) You supply them. (c) Text-only scenes, with the marks only on the card.
- **Recommendation:** (a), as you chose for v0.9.
- **Blocks:** T10.15 only.
- **Answer (owner):** *(open)*

### Q37 — The Bell-Watchers' sharper "where to look" *(asked 2026-10-21; open)*
- **Context:** the Bell-Watchers' story perk (D411) adds one sentence to a still-missing name's hint, built by a stated rule from the roll: how many springs, from which year to which year, and from which villages (OUT-3 E3). It adds no name and no source, but it tells the player something the Names view does not say today. Once a group is found, the perk shows a remark by Halina or Dana instead.
- **Options:** (a) Keep it as written. (b) Keep only the old hint text, so the Bell-Watchers' perk is the clue-time number alone (and the remarks). (c) Keep it, but give only the villages, not the years.
- **Recommendation:** (a). The players who care about the 40 names are the ones this helps, and it points at no document. Choose (b) if you want the hunt left exactly as it is.
- **Blocks:** T10.10 (the Names sentence). If unanswered, Claude Code builds (a).
- **Answer (owner):** *(open)*
