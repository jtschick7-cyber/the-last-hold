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

### Q33 — The Eventer cannot meet three of the approved event rows as it plays (blocks T9.17) *(answered)*
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

### Q34 — The name search found near-matches for two Order names *(asked 2026-10-21; answered)*
- **Context:** GDD §2.3 requires a web search for every new proper noun. It was run on 2026-10-21 for the four Order names (results in OUT-6). **"Grey Wives" and "the Quenchers": no match.** **"Thanes' Moot":** "Moot" is also a lore term in Skyrim (the assembly where the Jarls choose the High King, UESP "Lore:Moot"); the GDD allows "thane" and "moot" is an ordinary old English word (folkmoot), and the avoid list does not name it. **"Bell-Watchers":** Dark Souls has a "Bell Keepers" covenant and "Abyss Watchers"; no exact match, and the avoid list targets different elements (souls, kindling, ash, hollows, bonfires), but the two words are close in feel. The chapter and opening titles are plain English phrases and were not searched one by one.
- **Options:** (a) Keep both names (they are in the setting primer and lore §14 already). (b) Rename "Thanes' Moot" to something with "headmen" (the GDD's other allowed word), for example "the Headmen's Moot". (c) Rename "Bell-Watchers" to something plainer, for example "the Bell-Ringers". (d) Both (b) and (c).
- **Recommendation:** (a). Neither is a name from those games, both are the lore's own, and a rename would touch the lore, the primer and the chapter texts. Choose (b) or (c) if "Moot" or "Watchers" reads too close to those games to you.
- **Blocks:** nothing (the names test is green with the dated entries). A rename would be one text change before T10.9.
- **Answer (owner):** agree with the recommendation (a), 2026-10-21 (D427).

### Q35 — The owner's save may not hold some standing counts *(asked 2026-10-21; closed)*
- **Context:** the migration backfills standing once, from the save's history, **capped at level 1** (D410, D421). I could not see which counts the save keeps (for example, whether every brew or property revealed is recorded, or only the current Book; the Alchemy skill's XP may count the same things). T10.1 reports exactly which are recoverable before it writes the migration. Anything not recoverable starts at 0.
- **Options:** (a) Accept what is recoverable. Because of the level-1 cap, the result is the same start (level 1) whatever the history, so a gap costs nothing. (b) Ask Claude Code to estimate the missing counts. (c) Use the debug commands to set a starting level you think is fair.
- **Recommendation:** (a). The cap already makes the start level 1; progress from there is live. Use (c) if the start feels off in your playtest.
- **Blocks:** nothing; T10.1 reports the table.
- **Answer (owner):** closed 2026-10-21 in the v0.11 docs commit: T10.1 reported its table (D467).

### Q36 — Art for the Orders *(asked 2026-10-21; answered)*
- **Context:** T10.15 needs four order marks, an Orders icon and placeholders for the four opening scenes.
- **Options:** (a) Draw them in code as in v0.9, and you approve them. (b) You supply them. (c) Text-only scenes, with the marks only on the card.
- **Recommendation:** (a), as you chose for v0.9.
- **Blocks:** T10.15 only.
- **Answer (owner):** agree with the recommendation (a), 2026-10-21 (D427).

### Q37 — The Bell-Watchers' sharper "where to look" *(asked 2026-10-21; answered)*
- **Context:** the Bell-Watchers' story perk (D411) adds one sentence to a still-missing name's hint, built by a stated rule from the roll: how many springs, from which year to which year, and from which villages (OUT-3 E3). It adds no name and no source, but it tells the player something the Names view does not say today. Once a group is found, the perk shows a remark by Halina or Dana instead.
- **Options:** (a) Keep it as written. (b) Keep only the old hint text, so the Bell-Watchers' perk is the clue-time number alone (and the remarks). (c) Keep it, but give only the villages, not the years.
- **Recommendation:** (a). The players who care about the 40 names are the ones this helps, and it points at no document. Choose (b) if you want the hunt left exactly as it is.
- **Blocks:** T10.10 (the Names sentence). If unanswered, Claude Code builds (a).
- **Answer (owner):** agree with the recommendation (a), 2026-10-21 (D427).

## v0.11 questions *(from the v0.11 flesh-out, 2026-10-21)*

**Q38 — Is Keep the Vigil offered only when the ending is open?** *(Blocks: T11.5. Opened 2026-10-21.)*
Lore §6 says Keep the Vigil is available "any time." In D459 (1) I read it as: **only when Remember Them is also open**, because before then it would change nothing (playing on is the same thing).
Options: (a) only when open (my recommendation); (b) offered from the moment Pechko's near-scene has played, so the choice is always there, even when nothing is missing.
Status: **Answered (a)**, owner, 2026-10-21 (D460).

**Q39 — Is there a species that appears only in the Last Stand, never in a contract?** *(Closed 2026-10-21 by the red-team review, D461.)*
GDD §5.9.3 and §8.3.1 say the base Last Stand pool is exactly the contract species, and the Dross-Tide is excluded. There is no stand-only species. T11.2 asserts this in a test instead of stopping to ask.
Status: **Closed.**

**Q40 — Approve the three ★ lines in OUT-3.** *(Blocks: the docs commit. Opened 2026-10-21.)*
The Unlit's answer after the fortieth name ("Forty. Known, every one. I can put the count down."), Pechko's line about the stove keeping itself (R-09), and the warm final rime (R-11) are the freshest text in this milestone. They waited for your yes in the first message of the thread (the D460 gate).
Status: **Answered: yes**, owner, 2026-10-21 (D460).

**Q41 — Name searches I could not fully settle.** *(Informational. Opened 2026-10-21; closed 2026-10-22.)*
My search tool returned nothing that matches "Remember Them" or "Keep the Vigil" as a game ending, and nothing for "The Remembering" next to the games in GDD §2.3. It also returned unrelated games called "Vigil" and "Remember Me." The search tool is weak for exact phrases, so please treat this as "no collision found," not "checked everywhere." Details in OUT-6.
Status: **Closed (accepted by the owner, 2026-10-22, D505).**

**Q42 — The Hearth Hall look: who draws it, and which scenes?** *(Blocks: T11.12. Opened 2026-10-21.)*
D457 says it is drawn in code. If you would rather supply art, say so before T11.12; otherwise Claude Code draws it, shows a screenshot, and you approve (as with the Orders art, D434).
Options: (a) code-drawn, you approve (my recommendation); (b) you supply art.
Status: **Closed** 2026-10-22: the frost and lamp art is built and was approved in the v0.11 playtest (v1.0 flesh-out).

**Q43 — "Gaunt Wolf" or "Gloam Wolf"?** *(Informational. Opened 2026-10-21, from the review.)*
Lore and GDD §8.5 say "Gaunt Wolf"; GDD §8.3 says "Gloam Wolf". Not blocking v0.11, but the Bestiary and the gate's species list use whichever the content files hold; please pick one for the polish pass.
Status: **Answered: Gaunt Wolf**, owner, 2026-10-21 (D483; the name was already settled in D71). Applied in TV.1.

**Q44 — Housekeeping in the docs commit (no owner action).** Close Q35 (T10.1 reported its table) and mark Q33 answered. Both are recorded in D467.
Status: **Done** in the v0.11 docs commit (D467).

**Q45 — The reachability row: the Standard player never makes the ending choosable.** *(Blocks: T11.15. Opened 2026-10-21.)*
I measured the 5 Monday Standard seeds (plan T11.15a, run to the usual cap: 8 Long Nights, about 6 weeks). **In all five, the ending never becomes choosable.** The 40 names are all found (by cycle 6) and Act VI's stand is applied (end of cycle 6) in every seed. What is missing is the species half of the gate: only 7 to 10 of the 16 contract species are Studied. The ones missing in most seeds are Draugr, Leshy, Strzyga, Anvil-wight and Rimewrought (also Poludnitsa, Vodyanoy, Nix, Bies and Gloam-moths in some). The plan and D464 say to stop here: the run is not lengthened, and the row cannot pass as planned.
This is partly the Standard player (it takes the highest tier and the longest-waiting contract, and never goes looking for a species it lacks), and partly a question for you about real play: how many cycles should it take to Study all 16?
Options:
(a) **Judge the part Standard does reach (my recommendation).** The row says: all 40 names found and Act VI's stand applied by cycle N (N from the measurement; the names come in cycle 6, the stand ends it, so N is about 6). The species half stays proved by the content test (every species has an ordinary source, T11.2). Nothing else changes; every report equals the v0.10 baseline. It is honest but weaker: it does not prove a player can Study all 16.
(b) **Teach Standard to look for species it lacks.** A new rule: when two contracts are close, prefer one whose species is not yet Studied. This models a player who wants the ending, but it changes how Standard plays, so its report (and perhaps other rows) will differ from the v0.10 baseline, which D464 says must not happen. I would re-measure everything and ask you again.
(c) **No simulator row.** Rely on the content test and your own playtest (the debug panel opens the gate).
I have **not** touched the plan's row, `sim/targets.ts` or any baseline. What I did add is report-only: the Standard report now says when the ending first becomes choosable, or what the hold lacked at the end of the run (names, species and which ones, the stand).
Status: **Answered (a)** by the owner, 2026-10-21 (D469). T11.15b proposes N for the narrower row.

## v1.0 questions *(from the v1.0 flesh-out, 2026-10-21)*

### Q46 — What to do about the time it takes to Study all 16 species *(opened 2026-10-21; blocks nothing, answered after TV.11)*
- **What I found:** the 40 names and Act VI's stand arrive by cycle 6 in the simulator (D470). The owner estimates about **20 cycles** to Study all 16 contract species in their own play (a count that includes the early cycles of their own save). So the species half of the ending's gate is the long half. v1.0 is an audit, so nothing is changed (D478).
- **What happens next:** TV.11 runs a report-only variant of Standard that prefers unstudied species and reports days and cycles for all 16 Studied: once as a **best case** (it sees each contract's true species) and once as a **realistic** case (it sees only the candidate list a player sees).
- **Options (after the estimate):** (a) **Leave it.** The ending is a long-term goal, and the card shows what is missing. (b) **Ease it with a change to the Studied rule.** This is bigger than it sounds: `knowledge.studiedKills` is locked and also drives the Studied damage bonus, half clue time, the six Delve relics' idle sources ("every X species Studied", GDD §8.10a), the Forgotten's Nameless count and every row that depends on them, so it needs a decisions row and a re-run of the whole simulator. (c) **A small UI help** (the Remembering card or the Bestiary names the species still missing). This needs new player-facing text and a GDD edit, which v1.0's rule against new strings forbids without a decisions row, so it would be a new row and, at most, a small extra task. (d) Something you name.
- **Recommendation:** decide after the estimate. If both variants also take far longer than cycle 6, (c) is the lightest fix; if the realistic case is close to your 20, (a).
- **Blocks:** nothing in v1.0.
- **Result of TV.11 (2026-10-22):** none of the 15 runs (plain Standard, A, B; 5 seeds; 25 cycles) gets all 16 Studied, and the rule does not help. A one-seed look: 10 of 16 by day 20, then stuck at 10 to 12; Draugr, Leshy, Strzyga and Rimewrought stay Identified. See `docs/flesh-out/v1.0/species-estimate.md`.
- **The short look (2026-10-22):** the four missing species are rare on the board (0 to 8 contracts in 12 cycles, against about 90 for the Wolf): each Long Night resets to tier 1 and they only come at tier 3 or 4 up, in one place each. About 25 cycles or more for Standard, which fits the owner's about 20. A new option (d): change how often high tiers or those species come up (board generation or tier ranges); a design change.
- **Answer (owner):** (c), 2026-10-22 (D493). Built and shipped in v1.0 (*"Not yet known well: …"* on the Remembering card). Closed in the v1.1 flesh-out (2026-10-22, D505): the owner confirmed the long-term chase felt satisfying in play and no spawn-rate change is wanted.

### Q47 — Where do the settings live? *(opened 2026-10-21; answered by the review)*
- **Answer from the review:** the existing settings (theme, best-buy hint, rate unit, reduce motion) are **inside the save** (technical design §5.2). Ruling D486 (Proposed): they stay as they are, with no schema change; Text size and the Backup reminder go in a new settings key outside the save; Reduce motion stays a boolean read as "phone or switch".
- **Status:** **Answered (a)** by D486, pending the owner's yes (D491).

### Q48 — The "Gaunt Wolf" name search *(informational; opened 2026-10-21; closed 2026-10-22)*
- **Context:** the name "Gaunt Wolf" was settled in **D71** (the v0.5 flesh-out) and is already used in lore-secrets, Acts IV and VI, the Hidebane Oil row and Stanko's unlock; v1.0 only makes GDD §8.3, §9.4 and §9.8 agree (D483). I do not know whether D71's search considered that "Gaunt" is also a Warhammer 40,000 name (Commissar Ibram Gaunt, and "-gaunt" units); GDD §2.3's 40K rule, as I read it, bans named chapters, legions and characters, and "Gaunt Wolf" is none of those. My own search found nothing that matches a game creature, but the tool is weak for exact phrases.
- **Options:** (a) Keep "Gaunt Wolf". (b) Use another name (it is a display-name change only).
- **Answer (owner):** (a) Keep "Gaunt Wolf", closed 2026-10-22 (D505).

### Q49 — Two polish items earlier documents promised to v1.0 *(opened 2026-10-21; asks for a yes or no)*
- **What I found:** GDD §5.12.12 says "Event-only cosmetics, art for the Great Beasts' full portraits and the legendary hunters' animation are polish (v1.0)", and the v0.9 plan says the same. Neither was in the v1.0 scope you approved.
- **Proposal (D490):** the Great Beasts' portraits are part of the art pass if you mark them; **event-only cosmetics and the legendary hunters' animation are deferred past v1.0** because they are new content, and the GDD line is edited to say so (OUT-2a E12).
- **Options:** (a) Defer them as proposed (my recommendation). (b) Add them to v1.0, which would add tasks and probably 2–4 sessions. (c) Cut them for good.
- **Answer (owner):** **(a) yes, defer them as proposed,** 2026-10-21 (D490).

### Q50 — Two practical questions for the art and the icon *(asked and answered 2026-10-21)*
- (1) **Which phone do you play on, iPhone or Android?** **Answer: iPhone.** So the apple-touch-icon matters, the "export your save code before removing or re-adding the app" warning applies, and the phone's own text-size setting is **not** expected to reach the game (iPhone home-screen apps generally do not follow it), which makes the in-app Text size the real control. TV.4a still checks what the build does today.
- (2) **How can you view the contact sheets?** **Answer: in the conversation,** if Claude Code provides them there. Claude Code therefore **shows every contact sheet and before/after sheet in the conversation** (and also commits them to `docs/flesh-out/v1.0/contact-sheets/`); if its tool cannot show images, it stops and tells the owner.
- **Status:** **Answered**, owner, 2026-10-21.

### Closed or answered by this flesh-out
- **Q42 (Hearth Hall look):** closed; the frost and lamp art is built and was approved in the v0.11 playtest.
- **Q43 (Gaunt or Gloam Wolf):** **Answered: Gaunt Wolf**, owner, 2026-10-21 (D483; the name was already settled in D71).
- **Q35:** already closed in D467; the v0.11 summary's question 10 is stale.
- **Q41, Q46, Q48:** closed 2026-10-22 in the v1.1 flesh-out (D505).
- **Q47:** closed as answered by D486 in v1.0; settings key expanded in v1.1 with `holdView` (D503).

## v1.1 questions *(from the v1.1 flesh-out, 2026-10-22)*

No open questions at the end of the v1.1 flesh-out. Any question Claude Code hits during v1.1 starts at **Q51**. *(Q51 and Q52 were raised during v1.1; both are closed.)*

### Q51 — Your real save has the Moot Order seated; two old Orders tests assume nothing is ever seated *(opened 2026-10-23; blocks TL.1 going green)*
- **Context:** `v11-owner.json`, `v12.json` and `v12-played.json` (added under D507 (1)) come from your real save, where the Moot is seated. `tests/orders/perks.test.ts` ("Orders at level 4 but unseated change nothing") expects every fixture to have no seat, and `tests/orders/opening.test.ts` lists by name which fixtures are "played". Neither edit is on D507's list, so I stopped.
- **Options:** (a) **Recommended:** edit just those two tests. The perks test clears the seat on its copy before it checks "unseated", which is what it says it checks; the opening test's list gains the three new files. Nothing is loosened and no other fixture is affected. (b) Unseat the Moot in the three new fixtures. Then they are no longer your real save. (c) Leave the tests failing until you decide.
- **Answer (owner):** (a), 2026-10-23. Done in TL.1.
- **Status:** **Answered.**

### Q52 — Piece counts in the v1.1 docs are off by one *(informational; opened 2026-10-23)*
- **Context:** GDD §5.1.5 and D501 say "39 pieces (42 tiles), 22 open tiles". The listed pieces are the 2 × 2 Hearth Hall plus 39 one-tile pieces: **40 pieces, 43 tiles, 21 open tiles**. Every coordinate and unlock is unambiguous, so I built what is listed and my tests assert 40 / 43 / 21. I did not edit the GDD (owner gate). The save-size test fills all 40 pieces (about 1.1 KB, under the 1.5 KB limit).
- **Options:** (a) Correct the numbers in the GDD, D501 and the plan when you next approve doc edits. (b) Leave as is.
- **Status:** **Closed (informational).** TL.8: the Arrange Hold sheet's subtitle shows the true total, **40** (`{placed}/40 placed`), not the table's 39. One number in one place; **Answered 2026-10-23: 40 is approved (D511).** **Closed 2026-10-23: the doc numbers were corrected by D514 (GDD, plan) and D515 (technical design §19.2); D501's row stays as written, per the log's rule.**

## v1.2 questions *(from the v1.2 flesh-out, 2026-10-23)*

### Q53 — Which clips make the seven sounds? *(opened 2026-10-23; answered 2026-10-23)*
- **Context:** Claude cannot hear. The sounds are picked by ear (D524). SF.4 builds an audition page (preview build only) with about 5 candidate clips per sound from the four Kenney packs (Interface Sounds, Impact Sounds, RPG Audio, Music Jingles).
- **Question:** for each of Build, Launch, Place, Win, Lose, Fanfare and Nightfall, which candidate do you pick, or "none of these"?
- **Options:** (a) pick from the candidates (recommended); (b) "none of these" for a slot, then Claude Code offers a second round of about 5 from the same packs; (c) allow one CC0 clip from another site for that slot, each source separately approved (D524 (1)).
- **Recommendation:** (a). Plan about 15 minutes of listening.
- **Blocks:** SF.9 (converting and shipping). SF.5–SF.8 do not wait for it.
- **Answer (owner, 2026-10-23):** (a). Picks: Build 2, Launch 10, Place 13, Win 18, Lose 21, Fanfare 28, Nightfall 31 (recorded in `docs/flesh-out/v1.2/sound-marks.md`). The owner then heard the seven real files on the preview and approved them.

### Q54 — Will the picked sounds fit under 600 KB with the new code? *(opened 2026-10-23; resolved 2026-10-23 in SF.9)*
- **Context:** v1.1 measured 582,081 bytes (568 KB). The row is 614,400 bytes, so 32,319 bytes (about 31.6 KB) are left for the sound files **and** the new sound code (estimated 3–6 KB gzipped; not measured). The sound files are capped at 30 KB (D523).
- **Question (asked only if the picks do not fit):** SF.9 measures the build without sounds, computes the budget (`614,400 − that − 1,024`, at most 30 KB) and converts the picks. If they do not fit: (a) use fewer or shorter sounds (recommended); (b) pick shorter candidates for the longest slots; (c) propose a new measured size row for a later decision (not in v1.2). **The row is never changed silently.**
- **Status:** **Resolved in SF.9: they fit.** Build without sounds 583,076 bytes gzipped; budget 30,300 bytes; the seven files total 29,150 bytes; the production build with sounds is 610,508 bytes against the row of 614,400 (about 3.9 KB left). Numbers are in the SF.9 and SF.12 progress entries. The row was not changed.

### Q55 — Does Safari on your iPhone decode and play the files? *(opened 2026-10-23; answered at the playtest 2026-10-23)*
- **Context:** Web Audio on iPhone needs a tap to start, follows the silent switch, and can stop after a call or a lock (D522 (3)). Headless tests cannot prove the real phone's behaviour. CI's WebKit may not decode MP3 (SF.10 says so if it cannot).
- **Question:** at the playtest, do all seven sounds play on your iPhone (live volume, silent switch respected, resume after leaving the app)?
- **Options:** (a) yes, all good; (b) one or more fail: Claude Code is told which and what happened, and the fix is a follow-up task (for example another file format for that device) with the owner's yes.
- **Status:** **Answered (owner, 2026-10-23): the playtest passed on the iPhone.** The sounds play, and the first build did not respect the silent switch; the fix (declare the audio ambient, D529, decided in D531) was confirmed working by the owner. Headless WebKit decoding was not tested in CI (left to the phone, SF.10).

### Q56 — The container may have no audio converter *(opened 2026-10-23; may block SF.4, which converts the audition candidates)*
- **Context:** the files are converted to mono MP3 while authoring (D522 (2)). Claude Code's container may lack a converter (such as ffmpeg). The audition candidates must be converted to MP3 at SF.4 (the packs ship as OGG, which an iPhone may not play), so the question comes up there, not later.
- **Options:** (a) install a system converter in the container (no change to the repo; recommended); (b) the owner converts on their computer with a tool Claude Code names, and uploads the files; (c) a new npm dev dependency for encoding (needs the owner's yes; it never ships to the player).
- **Recommendation:** (a), then (b). (c) only with the owner's yes.
- **Answer (owner):** *(not needed)* **Resolved 2026-10-23 (SF.4):** the container has ffmpeg with an MP3 encoder, so option (a) was not even needed; nothing was installed.
