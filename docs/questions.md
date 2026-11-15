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

### Q53 — Which clips make the seven sounds? *(opened 2026-10-23; blocks SF.9)*
- **Context:** Claude cannot hear. The sounds are picked by ear (D524). SF.4 builds an audition page (preview build only) with about 5 candidate clips per sound from the four Kenney packs (Interface Sounds, Impact Sounds, RPG Audio, Music Jingles).
- **Question:** for each of Build, Launch, Place, Win, Lose, Fanfare and Nightfall, which candidate do you pick, or "none of these"?
- **Options:** (a) pick from the candidates (recommended); (b) "none of these" for a slot, then Claude Code offers a second round of about 5 from the same packs; (c) allow one CC0 clip from another site for that slot, each source separately approved (D524 (1)).
- **Recommendation:** (a). Plan about 15 minutes of listening.
- **Blocks:** SF.9 (converting and shipping). SF.5–SF.8 do not wait for it.
- **Answer (owner):** (a), 2026-10-23 (SF.5): Build 2, Launch 10, Place 13, Win 18, Lose 21, Fanfare 28, Nightfall 31 (`docs/flesh-out/v1.2/sound-marks.md`). Closed in the v1.4 sweep (D557).

### Q54 — Will the picked sounds fit under 600 KB with the new code? *(opened 2026-10-23; resolved in SF.9)*
- **Context:** v1.1 measured 582,081 bytes (568 KB). The row is 614,400 bytes, so 32,319 bytes (about 31.6 KB) are left for the sound files **and** the new sound code (estimated 3–6 KB gzipped; not measured). The sound files are capped at 30 KB (D523).
- **Question (asked only if the picks do not fit):** SF.9 measures the build without sounds, computes the budget (`614,400 − that − 1,024`, at most 30 KB) and converts the picks. If they do not fit: (a) use fewer or shorter sounds (recommended); (b) pick shorter candidates for the longest slots; (c) propose a new measured size row for a later decision (not in v1.2). **The row is never changed silently.**
- **Status:** **Resolved 2026-10-23 (SF.9):** the seven sounds total 29,150 bytes and the production build measured 610,463 bytes gzipped at SF.9 (610,508 bytes at SF.12), inside the 614,400-byte row. Closed in the v1.4 sweep (D557).

### Q55 — Does Safari on your iPhone decode and play the files? *(opened 2026-10-23; answered at the playtest)*
- **Context:** Web Audio on iPhone needs a tap to start, follows the silent switch, and can stop after a call or a lock (D522 (3)). Headless tests cannot prove the real phone's behaviour. CI's WebKit may not decode MP3 (SF.10 says so if it cannot).
- **Question:** at the playtest, do all seven sounds play on your iPhone (live volume, silent switch respected, resume after leaving the app)?
- **Options:** (a) yes, all good; (b) one or more fail: Claude Code is told which and what happened, and the fix is a follow-up task (for example another file format for that device) with the owner's yes.
- **Status:** **Answered (a), 2026-10-23 (D530, D531):** after the ambient audio-session fix (D529), all seven sounds played on the owner's iPhone and respected the silent switch. Closed in the v1.4 sweep (D557).

### Q56 — The container may have no audio converter *(opened 2026-10-23; may block SF.4, which converts the audition candidates)*
- **Context:** the files are converted to mono MP3 while authoring (D522 (2)). Claude Code's container may lack a converter (such as ffmpeg). The audition candidates must be converted to MP3 at SF.4 (the packs ship as OGG, which an iPhone may not play), so the question comes up there, not later.
- **Options:** (a) install a system converter in the container (no change to the repo; recommended); (b) the owner converts on their computer with a tool Claude Code names, and uploads the files; (c) a new npm dev dependency for encoding (needs the owner's yes; it never ships to the player).
- **Recommendation:** (a), then (b). (c) only with the owner's yes.
- **Answer (owner):** *(not needed)* **Resolved 2026-10-23 (SF.4):** the container has ffmpeg with an MP3 encoder, so option (a) was not even needed; nothing was installed.

## v1.3 questions *(from the v1.3 flesh-out, 2026-10-24)*

### Q57 — Steady additive steps or compounding steps? *(opened 2026-10-24; answered after KV.8 reports the curve, before KV.9)*
- **Context:** you chose "steady steps and no ceiling" (D539, D540). The wave strength is `1 + 0.0061 × Threat + s × level`. Each level adds the **same amount** to that number, so each new level is a **smaller percentage jump** than the last, and the **waves held fall more slowly** as the level climbs: about one wave lost at level 1, less at level 6, still less later (roughly logarithmic; my estimate, not measured). The strength never stops rising, but a player who just keeps switching it On will see the *waves held* drop in smaller and smaller steps.
- **Question:** is that the feel you want, or should each level be the **same percentage** harder than the one before (compounding, `intPow(1 + s, level)`, which loses about one wave at every level)?
- **Options:** (a) keep steady additive steps, as chosen (recommended until the numbers are in); (b) compounding steps. There is no "decide after the playtest": switching after any vigil stand has been recorded in a save changes how those stands replay, which is a combat math change (a `rulesVersion` bump or a formula id on the record).
- **Recommendation:** (a) for now. KV.8 measures waves held and Embers for every level on the simulator probe, for both steps, at two Threat points, and reports the curve; you answer after seeing the numbers and before KV.9. Switching to (b) at that point changes one formula and one constant (it needs a new decisions row).
- **Blocks:** KV.9. **Answer (owner):** (a) steady additive steps, 2026-10-24 (D554, after the KV.8 curve in `docs/flesh-out/v1.3/vigil-curve.md`). Closed in the v1.4 sweep (D557).

### Q58 — The simulated Vigilant opens the gate with a debug shortcut *(opened 2026-10-24; answered at the docs commit, D551)*
- **Context:** the simulated Standard player never makes the ending choosable (Q45, D469): it does not look for the contract species it lacks. So the new player, the Vigilant, cannot play to the gate honestly. To test the vigil mechanics at all, it plays like Standard to Act VI's stand and then calls the debug command `debug.remembering.openGate()` once (D462), which marks the run as `debugUsed`. The report says so.
- **What this does and does not prove:** it proves the switch, the levels, the saves and the difficulty curve behave. It does **not** prove a real player reaches the gate; the existing reachability row already covers names and Act VI's stand (the species half is covered by a content test).
- **A second change from what you approved:** you approved the probe "in the fast set". The fast set is inside `npm run check`, which already takes 86–95 s against a 90 s warning and a 120 s failure. The plan therefore judges the probe in `sim.yml` only (the D464 pattern), unless CI `check` stays at 90 s or less on 3 runs with it in (KV.8 measures).
- **Options:** (a) accept both (recommended); (b) keep the probe in the fast set regardless and move something else out (a different tradeoff, needs a new row); (c) write a second simulated player that really studies every species to reach the gate (a bigger shard, likely over the 4-minute stop-and-ask).
- **Recommendation:** (a).
- **Answer (owner):** (a), accepted with the yes at D551 on 2026-10-24.

## v1.4 questions *(from the v1.4 flesh-out, 2026-10-25; updated 2026-10-27)*

### Q59 — Calibrated values for `descent.stageTiers` and `descent.unlitBaseHealth` *(opened 2026-10-25; answered after TD.8b reports the Descent probe, before TD.9)*
- **Context:** `descent.stageTiers` (sketch `[5, 6, 7]`) and `descent.unlitBaseHealth` (sketch `4,500` at base tier 5 in `balance.ts`, read by `monsters.ts`) start as clearly marked placeholders (GDD §7.14, §8.3, D560, D564). In TD.8b, the on-demand parameter calibration tool (`npm run sim:descent -- ...`, S8) runs the Descent probe across the 5 Monday seeds (100 practice runs per seed). A shared builder (`sim/descent-roster.ts` / `core/debug`, M5, M10) constructs two explicit reference profiles: (a) *minimal gate-open* (16 species Studied, 0 Mastered, 0 chapters, natural roster/relics); and (b) *maxed endgame* (all 14 hunters owned at Master Wright level 10, 5 stars, 5 talents, Wright gear, 16/16 Mastered species, 36/36 recipe properties, 40/40 skills, 16/16 Order chapters, 12 relics, matching consumables). It measures win rate, median stages cleared, median hunters downed (with 10th–90th range), and Stage 3 remaining Health across a grid of stage tiers and Unlit base Health values, plus comparisons with `What the Hold Learned` zeroed and an unprepared Hamlet starter party (M9). Also confirms gating at Bastion rank in the current cycle (S6) and free, instant retries on defeat with consumables spent (S7).
- **Question:** after reading the TD.8b calibration table in `docs/flesh-out/v1.4/descent-calibration.md`, do you approve the proposed calibrated values for `descent.stageTiers` and `descent.unlitBaseHealth`, and the two simulator rows:
  - **Row A (`descent-victory`):** gate-open full roster wins with win rate between **50% and 85%** (median of the 5 Monday seeds) and median hunters downed strictly between **2 and 8** across the 3 stages (*"a costly, heroic victory"*);
  - **Row B (`descent-learned-matters`):** party with `What the Hold Learned` bonus achieves win rate **≥ 25 percentage points higher** (or ≥ 2 fewer hunters downed) than the identical party with the learned bonus zeroed, and an unprepared Hamlet starter party loses in Stage 1?
- **Options:** (a) approve the proposed calibrated values and rows A and B (recommended once TD.8b shows they land in the 50%–85% win rate and 2–8 downed band on the chosen profile); (b) pick a harder or easier point from the TD.8b grid; (c) adjust the `descent.learned.*` tunable steps too.
- **Recommendation:** (a).
- **Blocks:** TD.9 (setting the calibrated constants and committing rows A and B to `sim/targets.ts`).
- **Partly answered (owner, 2026-10-28):** Row A judges the **maxed endgame** roster; the minimal gate-open roster is reported only. Still open: the constants themselves and the two rows' final wording (below).
- **TD.8b proposal (for the owner's yes or no):** `descent.stageTiers` **[7, 8, 9]** and `descent.unlitBaseHealth` **4,500**. Maxed roster: wins 82%, median 6 hunters downed (inside both Row A bands); learned bonus zeroed: 0% (Row B, far above 25 points); Hamlet starter: 0 stages cleared (loses in Stage 1). Caveat: 82% is close to the 85% ceiling, and the minimal roster wins 0% there. A finer sweep around this point is available if you want more margin.
- **Answer (owner):** (a), 2026-10-28 (D577): `descent.stageTiers` [7, 8, 9], `descent.unlitBaseHealth` 4,500, rows A and B. Row A judges the maxed roster. Closed in the v1.5 sweep.

### Q60 — The approved wording of the Descent story texts is not in the repo *(opened 2026-10-28; blocks the story-text part of TD.3 and `lore-secrets.md` §34.11)*
- **Context:** the plan asks TD.1 to put the approved texts D-01 to D-07 and the three post-Descent resident lines (Pechko, Brana, Ilse) into `lore-secrets.md` §34.11, word for word. The v1.4 flesh-out folder has no lore file (no `OUT-3`, which v0.11 had). The only wording in it is one-line descriptions of each card in `OUT-2a-gdd-changes.md` (for example D-01 "Pechko at the Bastion stair with the thirty-nine faded ribbons") and the first few words of each resident line, cut off with "...". CLAUDE.md says to invent none, so I did not write §34.11. Everything else in TD.1 is applied.
- **Options:** (a) **Recommended:** you upload the missing lore file (the full approved texts) to `docs/flesh-out/v1.4/OUT-3-lore-secrets-descent.md` on `milestone/v1.4`; I apply it as §34.11 in a small docs commit and tick the rest. (b) You paste the seven texts and three lines into this thread. (c) I draft the texts from the one-line descriptions, in the style of §34, for you to approve word by word before they count as canon (slower, and it is new writing, not the approved text).
- **Blocks:** the story-text part of TD.3 (`src/content/story/descent.ts` and its tests); `lore-secrets.md` §34.11. Everything else in TD.3 and TD.4 onward does not wait for it.
- **Answer (owner):** the owner pasted the approved wording of D-01 to D-07 and the three resident lines on 2026-10-28 (option b). It is now `lore-secrets.md` §34.11, unchanged (D570). **Answered, closed.**

## v1.5 questions *(from the v1.5 flesh-out, 2026-10-28)*

### Q61 — May the player tap "Use this layout" after Suggest layout? *(opened 2026-10-28; asked in the first message of the build thread, with Q62; blocks the last part of TB.8b)*
- **Context:** the owner agreed that **Suggest layout** shows a proposed arrangement and its preview and **places nothing by itself** (D588). With 10 to 14 defense pieces, following the suggestion by hand takes about 20 to 30 taps. A separate button the player taps would apply it in one command. That is a player choice, not an automatic placement, but it is a change from "never places".
- **Options:** (a) **Yes: add an explicit "Use this layout" button** (one atomic command, `layout.setDefenses`: it lifts every defense in the front rows that is not in the suggestion to the Tray, then places the suggested defenses; it moves only walls and towers and is shown with what will move; recommended). (b) **No:** the suggestion is shown on the grid as highlighted target tiles and the player moves pieces by hand. (c) Yes, but behind a confirmation sheet.
- **Recommendation:** (a). It moves only defenses, only on the player's tap, and the lanes strip shows the result before Start.
- **Blocks:** the "Use this layout" button and the `layout.setDefenses` command at the end of TB.8b (built only if yes; if no, neither exists). The Tactician simulator uses `layout.unplace` and `layout.place` either way. It also decides what the CLAUDE.md rule about changing the layout says.
- **Answer (owner):** (a), 2026-10-28 (D595): yes. "Use this layout" is allowed: one atomic command, `layout.setDefenses`, moving only walls and towers and only on the player's tap. Built at the end of TB.8b. **Answered, closed.**

### Q62 — The golden test's version number (a locked file) *(opened 2026-10-28; asked in the first message of the build thread; blocks TB.5)*
- **Context:** `rulesVersion` goes from 5 to 6 (D584). The golden-fight test file asserts the version number; in v0.8 it moved from 4 to 5 while every fight line stayed identical (D337 (9)). This milestone needs the same one-line move, 5 to 6. Golden fixtures are an owner gate (CLAUDE.md).
- **Options:** (a) **Approve the one-line version edit, every fight line unchanged** (recommended). (b) Keep the golden file at 5 and add the version 6 assertion in a new file. (c) Other.
- **Recommendation:** (a): the same change as in v0.8, with a test that every golden fight still replays line for line.
- **Blocks:** TB.5 (rulesVersion 6).
- **Answer (owner):** (a), 2026-10-28 (D595): approved. The golden test's version number may move from 5 to 6 as a one-line edit with every fight line unchanged; this is the only golden-file edit approved. **Answered, closed.**

### Q63 — Approve the lane calibration table, the constants and the three rows *(opened 2026-10-28; answered after TB.12 reports the Breach probe, before TB.13)*
- **Context:** the `breach.*` tunables start as values to be confirmed (`breach.volleyScale` is a pure placeholder, D583). TB.12's `npm run sim:breach -- …` sweeps them and reports, in `docs/flesh-out/v1.5/breach-calibration.md`: waves held (median, 10th–90th) for Auto-arrange, the Tactician and the bad layout, beside the same state under the v5 rules, at the Citadel and Bastion, over the 5 Monday seeds, plus how far each existing stand row moves.
- **Question:** do you approve the proposed values and the three rows (A: Auto-arrange within 1 wave of today and at least 12; B: Tactician at least 1 wave more than Auto-arrange; C: bad layout at least 2 waves fewer)?
- **Options:** (a) approve (recommended once the table lands in those bands); (b) pick another point from the grid; (c) change a row's wording.
- **Recommendation:** (a).
- **Blocks:** TB.13 (setting the constants, recording the v6 stand goldens, committing the rows).
- **TB.12 result (2026-10-29):** the table is `docs/flesh-out/v1.5/breach-calibration.md`. Row A passes (Auto-arrange holds 15 to 17 waves, within 0.15 of today). **Rows B and C cannot pass with any breach tunable:** at the first stand the Tactician is level with Auto-arrange (never 1 wave more), and the bad layout loses at most 1.5 waves (never 2), because the whole defense is worth only about 2 waves at that stand. The only proposed value change is `breach.volleyScale` 1 → 3 (restores today's average volley).
- **New options for rows B and C:** (a) **Keep row A; change B to "the Tactician holds at least as many waves as Auto-arrange" and C to "the bad layout holds at least 1 wave fewer at the max level point"** (recommended: both pass today with the measured numbers, and they still catch a Suggest rule that is worse than Auto-arrange or a layout that stops mattering); (b) keep B and C as written and make defenses count for more (needs a change to an approved value such as `walls.takenPerLevel`, which moves every old stand row and the saved baseline); (c) drop B and C and keep row A only.
- **Answer (owner):** (a) for rows B and C, and yes to `volleyScale` 3, 2026-10-29 (D598).

### Q64 — Approve the four v1.5 performance rows (GDD §6.5) *(opened 2026-10-29, at TB.14; D445 route)*
- **Context:** the four rows are marked "proposed" in GDD §6.5. Measured here on a 4× slowed CPU (best of three): Lanes strip render 1.2 ms (budget 16 ms); Suggest layout 3.0 ms (budget 20 ms); v14 → v15 migration of a played save 16.7 ms (budget 100 ms); the lane table on one stand record is under 400 bytes (a unit test; budget 0.4 KB). The Last Stand preview with the lane table: 753 ms (budget 1 s, unchanged). Production build 467,553 bytes gzipped (row 614,400).
- **Question:** make the four rows final as written?
- **Options:** (a) yes, as written (recommended: every measured number is far inside its budget); (b) tighten a budget; (c) change a row.
- **Recommendation:** (a).
- **Blocks:** nothing now; TB.15 drops "proposed" from the rows.
- **Answer (owner):** (a), yes as written, 2026-10-29 (D599).


## After v1.5 *(opened 2026-10-29; for the v1.6 flesh-out to settle first)*

### Q65 — Two CI times are close to their limits *(opened 2026-10-29, after the v1.5 merge; answered and closed 2026-11-04)*
- **Context:** CI on the v1.5 merge commit (`c6cc249`) passed, and the deploy succeeded. Two times are close to their limits: (1) **e2e shard 3 of 5** took **7 min 44 s** as a whole job (6 min 41 s of that is the tests). The ceiling is 8 minutes (D552), and the plan's stop-and-ask line is 7 min 30 s. It holds the long contrast, motion and tap-size sweeps. The plan does not say whether the 7:30 line counts the whole job or only the test step. (2) **`npm run check`** took **1 min 53 s** on CI against a 90 s warning and a 120 s fail line (112 to 118 s in the build container). The other four e2e shards took 2:00 to 3:44. The simulator workflow took 3 min 14 s in total.
- **Question:** what should the v1.6 flesh-out do before these reach the limits?
- **Options:** (a) **Rebalance the shards** so shard 3 loses a long sweep to a lighter shard, and set out in D552's terms which time the 7:30 line counts (recommended). (b) Add a sixth shard. (c) Leave as is and raise the warning lines. (d) Other.
- **Recommendation:** (a) for the shards. For `check`, find what is slow in it before raising any line; do not raise it silently.
- **Blocks:** nothing now.
- **Answer (owner):** (b), 2026-11-04 (D603): `.github/workflows/ci.yml` now runs 6 parallel e2e shards (`matrix.shard: [1, 2, 3, 4, 5, 6]`, `--shard=${{ matrix.shard }}/6`), which separates `polish-contrast.spec.ts` (shard 3 of 6, 35 tests) from `polish-motion.spec.ts` and `polish-tap-targets.spec.ts` (shard 4 of 6, 33 tests) and splits `polish-text-size.spec.ts` across shards 4 and 5 (34 tests in shard 5). No test files are edited and no limits are loosened: the 8-minute job ceiling (D552) and 7 min 30 s warning line (counting the whole job, as D552 states) remain intact, as do the 90 s warning and 120 s fail thresholds for `npm run check`. **Answered, closed.**

## v1.7 questions *(opened 2026-11-10)*

### Q66 — The "packs to half" size test fails once the art ships already packed (blocks the green `npm run check` in VB.8) — answered
- **What I found:** `tests/tools/png-pack.test.ts` › *every picture the game ships* asserts that packing every PNG under `public/` and `art-src/icons-preview/` makes the total less than **50 %** of what it is now (the comment says "about 300 KB down to about 120 KB"). That only holds while there is unpacked art left to shrink. The v1.7 strips are packed before they ship, so each deploy raises the ratio. I proved it is the Batch 3 deploy: with the 10 procedural Batch 3 strips put back, the test passes; with the 10 approved strips deployed it fails with `expected 131003 to be less than 121883` (ratio about 0.54). Batch 4 will push it higher. Every other check in that file still holds (identical pixels, never larger, and "no picture in the live build is larger than the packer can make it").
- **Question:** how should that one size assertion change? I will not edit it without your yes (CLAUDE.md: never weaken a test).
- **Options:** (a) **Replace the 50 % ratio with an absolute cap** on the packed total (measured after Batch 4 plus about 5 % headroom). It still catches a build that ships art bigger than it should be, and does not depend on how much unpacked art is left. (b) Loosen the ratio (for example 0.65). (c) Count only files that are not yet packed. (d) Remove the assertion; the per-file "as small as the packer can make it" test already covers packing.
- **Recommendation:** (a).
- **Blocks:** the green `npm run check` that closes `VB.8` (and, because the failing test is already live with Batch 3 deployed, any later task's check until it is answered).
- **Answer (owner):** (a), 2026-11-10: replace the 50 % ratio with an absolute cap on the packed total. The value is set at the VB.8 deploy (measured after Batch 4 plus about 5 % headroom) and logged as a decisions row.


## v1.8 questions *(opened 2026-11-13)*

### Q67 — How may `production.ts` and `threat.ts` consume scalar modifiers from `layout-tactics.ts` under the `READERS` / `BANNED` coupling guard? *(blocks `T18.3`)*
- **What I found:** `tests/lint/breach-coupling.test.ts` and `tests/layout/layout.test.ts` match every non-`READERS` file in `src/core/` against `/\blayout\b|hold-layout|layout-state|layout-catalog|state\.layout/i`. Because `-` is a word boundary, importing scalar helpers from `src/core/systems/layout-tactics.ts` inside `production.ts` or `threat.ts` triggers `\blayout\b`. At the same time, every caller (`sim/advance.ts` — which is itself one of the `5` `BANNED` modules — `settle-event.ts`, `RatesSheet.tsx`, `ThreatMeter.tsx`, `economy.test.ts`, `threat.test.ts`) calls `productionRate(state, r)` and `threatRate(state)` with `state` alone, and `TD §4.1` forbids storing derived scalars on `state`. `D624 (d)` only pre-authorises adding `layout-tactics.ts` to `READERS`, so changing the test regex needs owner approval.
- **Options:**
  - **(a) Recommended:** Update the regex in `breach-coupling.test.ts` and `layout.test.ts` to ban direct layout reads (`state.layout`, `hold-layout`, `layout-state`, `layout-catalog`, `systems/layout['"]`) while allowing `production.ts`, `threat.ts`, and `alchemy/brewing.ts` to import pure scalar getters from `layout-tactics.ts` (keeping `layout-tactics.ts` + `breach.ts` as the only readers of `state.layout`, and keeping all `5` `BANNED` modules failing on `state.layout` reads).
  - **(b)** Require callers to pass tactical scalars into `productionRate` / `threatRate` manually (still leaves `sim/advance.ts` unable to import `layout-tactics.ts` unless `advance.ts` is exempted too).
  - **(c)** Cache derived tactical scalars in a non-layout state block updated on `apply()` (breaks unit tests that mutate `s.buildings` / `s.layout` directly without `apply()` and stores derived data on `GameState`).
- **Recommendation:** **(a)**.
- **Answer (owner):** (a), 2026-11-13: update the regex in `breach-coupling.test.ts` and `layout.test.ts` to ban direct layout reads while allowing `production.ts`, `threat.ts`, and `alchemy/brewing.ts` to import pure scalar getters from `layout-tactics.ts`, keeping the `5` `BANNED` modules failing on `state.layout` reads.

### Q68 — How do tactical production multipliers interact with `D30` (`SILVER_BUCKETS`) and the `§5.0` modifier buckets? *(blocks `T18.3`)*
- **What I found:** `GDD §5.0` lists `7` buckets (`building`, `age`, `trophy`, `knowledge`, `ember`, `relic`, `event`), and `src/content/buckets.ts` (`D30` / `G1`) restricts Silver to `SILVER_BUCKETS = ['relic', 'event']` (`economy.test.ts:90`). Yet `GDD §5.1.5` and `D619` specify `silver-seam-1..2` beside `smithy` (`layout.adjSilver`) and `layout.wardedBonus` on Warded economy plots. Placing `adjSilver` in `building` would cause `applyBuckets(..., SILVER_BUCKETS)` to drop it.
- **Options:**
  - **(a) Recommended:** Apply district adjacency and Warded uplift as a separate named post-bucket tactical factor in `productionRate` (just like Orders perks in `GDD §5.0` / `§7.12` add no bucket), so `BUCKET_IDS` and `SILVER_BUCKETS` stay intact and Silver receives only `adjSilver` + Warded Silver Seam uplift (never `building`/`age`/etc. or non-silver bonuses).
  - **(b)** Add an 8th `'tactical'` bucket to `BUCKET_IDS` and include it in `SILVER_BUCKETS = ['relic', 'event', 'tactical']`.
  - **(c)** Keep Silver unchanged (`SILVER_BUCKETS = ['relic', 'event']` excludes `adjSilver`, making `adjSilver` apply elsewhere or unused).
- **Recommendation:** **(a)**.
- **Answer (owner):** (a), 2026-11-13: apply district adjacency and Warded uplift as a separate named post-bucket tactical factor in `productionRate`, leaving `BUCKET_IDS` and `SILVER_BUCKETS` intact while letting `adjSilver` + Warded Silver Seams lift Silver.

### Q69 — Exact target formulas for `layout.adjCottage`, `layout.adjBrew`, and `layout.adjTrophy` *(blocks `T18.3`)*
- **What we found:** `GDD §5.1.5`, `TD §25.2`, and `v1.8-summary.md` specify these `3` adjacency pairs and key names, but not their exact formulas (which are locked once written, `CLAUDE.md` line 95):
  - `adjCottage`: `cottage-1..3` beside `hearth-hall` or in `bell-tower` `3 × 3` ring (*"Hearth/Bell warmth"*). `economy.test.ts` checks `housing(s)` (`3 + 2/cottage`).
  - `adjBrew`: `herb-garden-1..3` beside `alchemist` (*"deterministic herb/brew uplift"*). `tests/alchemy/alchemy.test.ts` checks `herbGarden.interval` (`10 min` integer herbs) and `brewMs` (`hut()` places Hut ≥ 1).
  - `adjTrophy`: `trophy-hall` beside `hearth-hall` or `barracks`. `tests/contracts/flow.test.ts:508` uses `keepRich()` + `build.buy` (`trophy-hall`) — which triggers `autoPlaceUnlocked` — and asserts `productionRate(40 trophies) / productionRate(0 trophies) === 1.2` (`0.5% × 40`).
- **Options:**
  - **(a) Recommended:** `adjCottage` = `+adjCottage` per warm cottage (counted once per cottage `0..3`) to non-silver production (`food`, `wood`, `iron`), keeping `housing()` integer; `adjBrew` = brew & experiment time cut (`× (1 − min(cap, linkedGardens × adjBrew))`, matching Copper Still / Grey Wives, `10 min` Herb Garden interval unchanged); `adjTrophy` = flat `+adjTrophy` to non-silver production (`food`, `wood`, `iron`) when `trophy-hall` touches `hearth-hall` or `barracks` (`1×` link bonus, leaving the `0.5%` trophy scaling unchanged so `flow.test.ts` holds).
  - **(b)** `adjCottage` grants integer/floor bonus housing beds; `adjBrew` speeds both `brewMs` and `herbGarden.interval`; `adjTrophy` multiplies `trophyHall.perTrophy`.
  - **(c)** Other formula combination specified by owner.
- **Recommendation:** **(a)**.
- **Answer (owner):** (a), 2026-11-13: `adjCottage` adds per warm cottage (`0..3`) to non-silver production; `adjBrew` cuts brew and experiment time multiplicatively (`× (1 − cut)`); `adjTrophy` adds flat `+adjTrophy` to non-silver production when linked to Hearth Hall or Barracks.

### Q70 — North-Reach `Warded` flood details, `wardedThreatCut` / `wardedBonus` formulas, and temporary `§7.16` placeholder values *(blocks `T18.3`)*
- **What I found:** `TD §25.2` specifies `O(8 × 12)` BFS from open `y = 0` tiles blocked orthogonally by active `wall-*`/`watchtower-*` pieces, slowing Threat when `hearth-hall` is Warded (`layout.wardedThreatCut`) and lifting Warded economy plots (`layout.wardedBonus`), with placeholder constants in `GDD §7.16` + `balance.ts` until `T18.12` calibration.
- **Options:**
  - **(a) Recommended:** Flood across all `8 × 12` tiles starting from unblocked `y = 0` (`hearth-hall` is Warded iff all `4` of its `2 × 2` tiles are unreached); `wardedThreatCut` multiplies hourly Threat as `rankRate × (1 − defenseSlow) × (1 − wardedThreatCut) × perkFactor`; `wardedBonus` adds `+wardedBonus` per active Warded plot of that resource (`farm-1..3` for Food, `woodcutter-1..3` for Wood, `mine-1..3` for Iron, `silver-seam-1..2` for Silver); initial `§7.16` placeholders (`tunable` until `T18.12`): `adjFood/Wood/Iron/Silver/Brew/Trophy/wardedBonus = 0.05`, `adjCottage = 0.03`, `wardedThreatCut = 0.10`.
  - **(b)** Add `wardedThreatCut` additively inside `defenses slow` (capped at `1`) and apply `wardedBonus` once across all resources when `hearth-hall` is Warded.
  - **(c)** Other constants or Warded flood boundary (e.g., flood only inside active `CLEARING_BOUNDS`, with out-of-clearing tiles treated as blocked or open).
- **Recommendation:** **(a)**.
- **Answer (owner):** (a), 2026-11-13: full `8 × 12` BFS from unblocked `y = 0` (`hearth-hall` Warded iff all `4` tiles unreached), multiplicative `wardedThreatCut = 0.10`, per-Warded-plot `wardedBonus = 0.05`, `adjCottage = 0.03`, remaining `adj* = 0.05` placeholders until `T18.12`.

### Q71 — Updating pre-v1.8 `tests/stand/layout-isolation.test.ts` (not listed in `D624`) *(blocks `T18.3` green `npm run check`)*
- **What I found:** `tests/stand/layout-isolation.test.ts` (`Plan TB.5`, v1.5 rule 1: *"the layout moves nothing outside the Last Stand"*) loads `v15.json`, runs 5 days of contracts with and without `layout.clear`, strips `plain.layout`, and asserts `expect(cleared).toEqual(kept)`. All `258` other test files (`4,108` tests), `typecheck`, `lint`, and `format:check` pass, while `layout-isolation.test.ts` now fails **only** on `resources.{food, wood, iron, silver}` (`21.14M` vs `19.64M` food, etc.) because `T18.3` (`D619`, `D625`) intentionally wires Hold tactical income and Threat bonuses into `productionRate` and `threatRate`. Every non-economy, non-threat field (contracts, fights, Delves, events, hunters, items, logs) remained bit-for-bit identical. `D624 (a)–(g)` did not explicitly list `tests/stand/layout-isolation.test.ts` among pre-authorised test edits.
- **Options:**
  - **(a) Recommended:** Update `tests/stand/layout-isolation.test.ts` to exempt `resources` and `threat` from `toEqual` (`D619` relaxes v1.5's economy/Threat ban while preserving non-economy isolation) AND add explicit `1.0×` floor assertions verifying `cleared.resources <= kept.resources` for each resource and `cleared.threat >= kept.threat`, plus note the `TB.5` relaxation in `D625` / `D626`.
  - **(b)** Compare `layout.clear` against an explicitly unlinked/un-warded Bastion layout inside `tests/stand/layout-isolation.test.ts` so full-state `toEqual` (including `resources` and `threat`) stays equal at `1.0×`, plus a linked check covering contracts/logs/delves equality.
  - **(c)** Leave `tests/stand/layout-isolation.test.ts` unchanged (impossible while `T18.3` connects tactical income to `productionRate`).
- **Recommendation:** **(a)**.
- **Answer (owner):** (a), 2026-11-13: update `tests/stand/layout-isolation.test.ts` to omit `resources` and `threat` from strict `toEqual` while asserting `cleared.resources <= kept.resources` and `cleared.threat >= kept.threat` (`1.0×` floor) alongside bit-identical contracts, fights, Delves, events, and logs.

### Q72 — Exact `rulesVersion === 7` Breach formulas (`rampartBonus`, `screenedBonus`, `sectorBonus`), `LaneTable` compatibility & `§7.15` placeholders *(blocks `T18.4`)*
- **What I found:** `GDD §5.9.11`, `TD §25.2`–`§25.3`, and `D619`–`D620` define the qualitative rules and key names (`breach.rampartBonus`, `breach.screenedBonus`, `breach.sectorBonus`) for `v7` Bastion stands, leaving `4` formula/representation choices unspecified (and `GDD §7.15` currently has no placeholder rows for these keys):
  1. **Connected Ramparts (`rampartBonus`):** `TD §25.2` mentions *"connected-wall flag/count per lane (`wallConnectionMask > 0`)"*. In `v6`, `wallCut(t, wallsLevel, col)` multiplies `wallLevel × wallsPercent × (cover + extra)`. Should `rampartBonus` reward a connected lane boolean (`>= 1` linked front wall in `c`) or stack per connected wall tile, and apply to `(cover + extra)` multiplicatively (`(cover + extra) × (1 + rampartBonus)`) or additively to `cover`?
  2. **Watchtower *Screened Volley* (`screenedBonus`):** For a counted active `watchtower-*` in `y = 0..4`, does `(x, y - 1)` require an active `wall-*` that is itself connected to another active wall (`wallConnectionMask > 0`, rewarding a linked rampart line) or ANY active `wall-*` directly north (`y - 1`), and does `screenedBonus` scale that screened tower's `reach[dist]` weight multiplicatively (`× (1 + screenedBonus)`) in exact hundredths integer math inside `laneVolley`?
  3. **Sector Support (`sectorBonus`):** Active `barracks` / `lodge` tiles grant Sector Support across `[x - 1, x, x + 1]`. Neither `GDD §5.9.11` nor `TD §25.2`–`§25.3` specifies which wave combat stat `sectorBonus` modifies (`standTaken` / `wallCut` / `volley` vs hunter Might in `combat/fight.ts`), whether `barracks` and `lodge` stack up to `2×` vs cap at `1×` per lane, or whether placing `barracks`/`lodge` anywhere in the active clearing (`y = 0..11`) qualifies.
  4. **`LaneTable` & `§7.15` placeholders:** Making `v7` fields (`rampartBonus`, `screenedBonus`, `sectorBonus`, `rampartCols`, `screened`, `sectorCols`) optional on `LaneTable` / `LaneNumbers` (populated only on new `RULES_VERSION >= 7` Bastion stands) keeps all saved `v5`/`v6` stands and fixtures valid and bit-identical.
- **Options:**
  - **(a) Recommended:**
    - **Ramparts:** Boolean per lane (`rampartCols[col]` is true iff lane `col` holds `>= 1` active front `wall-*` in `y = 0..4` with `wallConnectionMask > 0`); multiplies wall factor `(cover + extra)` by `(1 + rampartBonus)` (`1.0×` when isolated or `0`, matching `v6` floor).
    - **Screened Volley:** A counted front `watchtower-*` at `(x, y)` in `y = 0..4` is screened iff `(x, y - 1)` holds an active `wall-*` with `wallConnectionMask > 0`; scales that tower's `reach` contribution by `(1 + screenedBonus)` using exact integer arithmetic before `Math.floor` in `laneVolley`.
    - **Sector Support:** Any active `barracks` and/or `lodge` anywhere in the active clearing (`y = 0..11`) grants `0 | 1 | 2` distinct support tiers to `[x - 1, x, x + 1]` (`0` = none, `1` = one type, `2` = both); bolsters `v7` wave defense directly in `stand/engine.ts` + `breach.ts` without touching `combat/fight.ts` by cutting `partyTaken × (1 - sector × sectorBonus)` and scaling `volley × (1 + sector × sectorBonus)` (so even lanes with `0` walls benefit from Sector Support while non-stand combat stays untouched).
    - **`LaneTable` & `§7.15` placeholders:** Store optional `v7` fields only on `RULES_VERSION >= 7` Bastion tables so `v5`/`v6`/Arrival/golden fights remain bit-identical, and set gentle `tunable` placeholders `rampartBonus = 0.15`, `screenedBonus = 0.25`, `sectorBonus = 0.05` until `T18.12` calibration.
  - **(b)** Stack `rampartBonus` per connected wall tile (`add` to `cover` uncapped), count ANY active `wall-*` at `(x, y - 1)` (even unlinked 1×1) as screening a Watchtower, and cap `Sector Support` at `1×` per lane modifying only `wallCut` + `volley` (no effect on empty lanes) or hunter Might inside `combat/fight.ts`.
  - **(c)** Other formula combination specified by owner.
- **Recommendation:** **(a)**.
- **Answer (owner):** (a), 2026-11-13: boolean `rampartCols` (`wallConnectionMask > 0` in `y = 0..4`) multiplies `(cover + extra)` by `(1 + rampartBonus)`; Screened Volley on counted front `watchtower-*` with connected north wall (`wallConnectionMask > 0`) at `(x, y - 1)` scales its `reach` weight by `(1 + screenedBonus)` in exact integer math; `barracks`/`lodge` (`0 | 1 | 2` distinct active types covering `x ± 1` across the active clearing) scale `volley × (1 + sector × sectorBonus)` and cut `partyTaken × (1 - sector × sectorBonus)` in `stand/engine.ts` + `breach.ts`; optional `v7` fields keep `v5`/`v6`/Arrival/golden fights bit-identical; placeholders `0.15 / 0.25 / 0.05` until `T18.12`.

### Q73 — `PresetSlot` storage format (`≤ 2.0 KB` `GDD §6.5` ceiling), `applyPreset` rules & `"mid-flight Stand"` guard *(blocks `T18.4`)*
- **What I found:** Measuring `tests/saves/fixtures/v16-played.json` (`34` pieces placed) shows `state.layout.placed` alone is `873 B` (`903 B` total `layout`). Storing `2` full presets in the same `{ placed: Partial<Record<HoldPieceId, GridCoord>> }` object shape alongside `40` placed pieces produces **`2,685 B` at 34 pieces (~`3.1 KB` at 40 pieces)**, exceeding **`GDD §6.5`'s `≤ 2.0 KB` (`2,048 B`) ceiling**. Also, `stand.make` (`src/core/commands/stand.ts`) resolves synchronously in one command and resets the cycle, so `GameState` currently has no asynchronous "Stand replay/resolution mid-flight" flag. Finally, `TD §25.1` does not specify what `layout.applyPreset` does with pieces unlocked after the preset was saved or out-of-clearing coords when applied in an earlier Rank.
- **Options:**
  - **(a) Recommended:** Keep `GDD §6.5`'s `≤ 2.0 KB` cap intact by storing each `PresetSlot` compactly (e.g., ordered array of `PIECES` catalog pairs `[x, y] | null` or packed tuple list `[pieceIndex, x, y][]`, ~`250 B` per full 40-piece preset -> `~1.55 KB` total for active 40 pieces + 2 full presets); use `slot: 0 | 1` on `layout.savePreset` / `layout.applyPreset`; refuse `applyPreset` on `null` slot; on `applyPreset`, restore saved coords cleanly (clamping an out-of-clearing `hearth-hall` to valid `hallAnchorBounds` if applied in an earlier Rank, keeping outer 1×1 pieces as `dormant-ring` blueprints, and calling `autoPlaceUnlocked(state)` for any newly-unlocked pieces omitted from the preset); and apply the synchronous architecture directly (no synthetic `GameState` in-flight flag needed in core unless the UI/LongNight preview adds one later).
  - **(b)** Store `PresetSlot` as readable `{ placed: Partial<Record<HoldPieceId, GridCoord>> }` JSON matching `HoldLayoutState.placed` and bump `GDD §6.5` + `tests/layout/save-size.test.ts` ceiling from `≤ 2.0 KB` to `≤ 3.5 KB` (requires owner approval for `GDD §6.5` edit).
  - **(c)** Other `PresetSlot` schema, `applyPreset` behavior, or explicit `lastStand` seen-gate restriction (`lastCycle?.stand?.seen === false`).
- **Recommendation:** **(a)** (preserves `GDD §6.5` `≤ 2.0 KB` ceiling without a cap bump; or **(b)** if human-readable preset JSON is preferred over compact `[x, y]` encoding).
- **Answer (owner):** (a), 2026-11-13: compact `PresetSlot` (`[x, y] | null` catalog tuples keeping 40 pieces + 2 presets `≤ 2.0 KB`), `slot: 0 | 1`, `applyPreset` clamps out-of-clearing `hearth-hall` into active bounds, keeps `dormant-ring` blueprints, and calls `autoPlaceUnlocked(state)`; synchronous `stand.make` needs no extra `GameState` flag.

### Q74 — `v16` save & fixture compatibility when adding `HoldLayoutState.presets` *(blocks `T18.4`)*
- **What I found:** `T18.2` already bumped `SCHEMA_VERSION` to `16` and generated `tests/saves/fixtures/v16.json` and `tests/saves/fixtures/v16-played.json` without a `presets` key in `state.layout`, while `validate-layout.ts` strictly validates `state.layout` keys.
- **Options:**
  - **(a) Recommended:** Keep `SCHEMA_VERSION = 16` and existing `v16.json` / `v15-owner.json` untouched; update `layoutFrom` in `validate-layout.ts` to default missing `o.presets` silently to `[null, null]` (0 warnings, preserving clean loading of all `T18.2` `v16` saves/fixtures) while validating non-empty `presets` strictly; update `newLayoutState()`, `canonicalLayout()`, and `v15ToV16` (`migration-v16.ts`) to emit `presets: [null, null]`; and either leave `v16-played.json` as-is or regenerate `v16-played.json` via `scripts/make-v16-fixtures.ts` to exercise saved `presets` and a `rulesVersion 7` Stand.
  - **(b)** Same `validate-layout.ts` default `[null, null]`, and explicitly regenerate both `v16.json` and `v16-played.json` now so every `v16` fixture explicitly serializes `presets` (note `v16.json == v15-owner` check in `v16-migration.test.ts` remains true because `v15ToV16` emits `presets: [null, null]`).
  - **(c)** Bump `SCHEMA_VERSION` `16 → 17` with a `v16ToV17` migration just for `presets`.
- **Recommendation:** **(a)** (or **(b)** if regenerated fixtures are desired right away alongside `T18.4` tests).
- **Answer (owner):** (a), 2026-11-13: keep `SCHEMA_VERSION = 16` and existing `v16.json` / `v15-owner.json` untouched; default omitted `o.presets` silently to `[null, null]` in `validate-layout.ts` and emit `presets: [null, null]` in `newLayoutState()`, `canonicalLayout()`, and `v15ToV16`.

### Q75 — Exact behavior of 3-mode `autoArrange` and `suggestLayout` (`'balanced' | 'economy' | 'fortress'`) *(blocks `T18.4`)*
- **What I found:** `TD §25.1` upgrades `autoArrange` and `suggestLayout` to accept `'balanced' | 'economy' | 'fortress'`, without defining what each mode moves or optimizes:
- **Options:**
  - **(a) Recommended:**
    - Keep `mode?: LayoutArrangeMode` (`'balanced' | 'economy' | 'fortress'`) optional and defaulting to `'balanced'` on `{ type: 'layout.autoArrange'; mode?: ... }`, `autoArrange(state, mode)`, and `suggestLayout(state, mode)` so all existing callers, sim policies, and tests remain compatible until `T18.6` / `T18.12`.
    - **`autoArrange(state, mode)`:** `'balanced'` applies `CANONICAL_LAYOUT` (with existing out-of-clearing fallback); `'economy'` deterministically places unlocked economy districts first inside the active clearing to maximize AoE adjacency links (`farm+mill`, `woodcutter+sawpit`, `mine/silver+smithy`, `herb+alchemist`, `cottage+hearth/bell`, `trophy+hearth/barracks`) and places defenses to enclose `hearth-hall` + economy plots in `Warded` reach; `'fortress'` deterministically places unlocked `wall-*` and `watchtower-*` across north rows `0..4` first to maximize Breach cover + linked Ramparts + Screened Volleys + `hearthWarded` seal + `barracks`/`lodge` Sector Support behind key lanes, then links economy pieces behind them.
    - **`suggestLayout(state, mode)`:** Preserves the defense-only `setDefenses` contract (`wall-*` & `watchtower-*` moves only, leaving civilian buildings in place) and tunes the Breach scoring objective: `'fortress'` maximizes `v7` Breach survival + Screened Volleys + Sector overlap; `'economy'` prioritizes enclosing `hearth-hall` & economy plots in `Warded` reach, then Breach score; `'balanced'` optimizes `v7` Breach wave survival (`layoutScore` over `suggestWaves`) with a small `Warded` tie-breaker.
  - **(b)** Allow `suggestLayout` in `'economy'` / `'balanced'` to rearrange civilian buildings too (breaks `setDefenses`'s defense-only guarantee used by `tactician.ts` and `tests/layout/set-defenses.test.ts`), or replace `CANONICAL_LAYOUT` for `'balanced'`.
  - **(c)** Other per-mode placement rules specified by owner.
- **Recommendation:** **(a)**.
- **Answer (owner):** (a), 2026-11-13: optional `mode` defaulting to `'balanced'` (`CANONICAL_LAYOUT` parity); `'economy'` and `'fortress'` deterministic constructive placers in `autoArrange`; defense-only `setDefenses` contract preserved in `suggestLayout` with mode-tuned objectives.

---

### Q76 — T18.6 Preset bar & 3-mode selector copy and tap semantics (`GDD §9.21` / `CLAUDE.md` line 82)
- **Context:** `D621` defines `Slot 1` / `Slot 2` and `Balanced` / `Economy` / `Fortress`, and `T18.6` builds the 2-slot Preset bar and mode selector in `src/ui/sheets/ArrangeHoldSheet.tsx`. However, `CLAUDE.md` forbids introducing player-facing Layout strings beyond `GDD §9.21` / `§9.25` / `§9.26` / `v1.8-summary.md` without approval, and `GDD §9.21` update is scheduled in `T18.7`. Exact button wording, empty-slot behavior, overwrite behavior, and mode-tap behavior also need confirmation.
- **Options:**
  - **(a)** Approve the exact inline strings and non-destructive UX for `T18.6` (with `GDD §9.21` formally reconciled in `T18.7`):
    - **Preset bar** (section label `Presets`; `≥ 44 × 44 px` controls): two rows/groups `Slot 1` and `Slot 2`, showing `Empty` when `presets[i] === null` or saved piece count (`{n} placed`) when populated, with `Save` (1-tap save/overwrite into `presets[i]`) and `Apply` (disabled when empty; applies `presets[i]` via `layout.applyPreset`).
    - **Mode selector** (`Layout mode` or segmented group without extra prose): 3-option segmented selector `Balanced` / `Economy` / `Fortress` (`aria-pressed`, defaulting to `Balanced`), which selects the priority mode passed to both `Auto-arrange` and `Suggest layout` without immediately resetting the yard when tapping a mode pill.
  - **(b)** Have tapping `Balanced` / `Economy` / `Fortress` immediately run `layout.autoArrange` (destructive 1-tap rearrange), use `Load` instead of `Apply`, or require a second confirm tap before overwriting a saved Preset slot.
  - **(c)** Pause `T18.6` UI copy completely until `T18.7` updates `GDD §9.21` first.
- **Recommendation:** **(a)** (safe non-destructive mode selection, clean 1-tap `Save` / `Apply`, minimal labels aligned with `D621`).

---

### Q77 — T18.6 Tactical overlay scope, colorblind-safe cues, and status copy (`HoldGrid` vs `ArrangeHoldSheet`)
- **Context:** `T18.6` requires "colorblind-safe AoE adjacency links/badges, `Warded`/`Exposed` perimeter shading, `Screened` tower mark" in `ArrangeHoldSheet.tsx` (Reduce Motion compliant), while keeping `HoldGrid.tsx` at `256 × 384 px` non-interactive card scale. `GDD §5.1.5` defines `Warded` / `Exposed` / `Screened`, while `GDD §9.21` does not yet list overlay status strings.
- **Options:**
  - **(a)** Keep `HoldGrid.tsx` (`HoldScreen` card header) visually clean without tactical/AoE editor badges (showing only the `8 × 12` yard, placed structures, gates, Hearth Hall / Breach / Lanes edge, and active Cosmetics), and render always-on non-interactive (`pointerEvents: 'none'`) colorblind-safe overlays inside `ArrangeHoldSheet`: distinct SVG link/shape markers + high-contrast badges for `AdjacencyLink` pairs, hatched/bordered perimeter band for `Warded` vs `Exposed` Hearth Hall status, shield/chevron mark on `Screened` watchtowers (all static under Reduce Motion), plus a concise tactical status line using approved terms (`Warded` / `Exposed`, `{links} linked`, `{screened} Screened`) and active synergy note in the selected-piece banner.
  - **(b)** Also add an `Overlays: On/Off` toggle in `ArrangeHoldSheet` and/or show `Warded` / `Screened` / AoE badges on the compact `HoldScreen` `HoldGrid` card.
- **Recommendation:** **(a)** (`HoldGrid` stays uncluttered at `256 × 384 px`; `ArrangeHoldSheet` gets legible shape+luminance cues with minimal chrome).

---

### Q78 — Updating pre-v1.8 Playwright `8 × 8` / `8×6` / `(3, 3)` pins & `360 px` internal-scroll width math
- **Context:** Two Playwright specs outside `D624 (a)–(g)` assert pre-v1.8 `8 × 8` values that will break when `HoldGrid` and `ArrangeHoldSheet` move to `8 × 12`:
  1. `tests/e2e/hold-grid.spec.ts:26` expects `64` `[data-tile]` cells (`8 × 12` has `96`).
  2. `tests/e2e/arrange-hold.spec.ts` expects `/^Citadel · 8×6 open/` (`D618` Citadel is `8×10 open`), `64` `[data-tile]` cells (`96`), and clicks `(3, 3)` expecting `hearth-hall` (`v15ToV16` shifts `v12-played`'s `hearth-hall` to `(3, 6)`).
  Additionally, at `360 px` viewport, `.sheet` (`1 px` border) + `.body` (`padding: 0 var(--space-3)` = `16 px` each side) leaves `326 px < 352 px` (`8 × 44 px`), which forces horizontal scroll inside `[data-internal-scroll]` even at `360 px`. Giving the grid scroller `marginInline: calc(-1 * var(--space-3))` makes its inner width `358 px >= 352 px` (zero horizontal scroll at `360–390 px`, including `Largest` text size) while preserving `≥ 44 × 44 px` tile targets and internal scroll at `320 px`.
- **Options:**
  - **(a)** Approve updating those pre-v1.8 pins in `tests/e2e/hold-grid.spec.ts` and `tests/e2e/arrange-hold.spec.ts` (`96` tiles, `8×10 open`, `(3, 6)` on `v12-played`) alongside `D624`, and permit `marginInline: calc(-1 * var(--space-3))` on `[data-internal-scroll="true"]` in `ArrangeHoldSheet` so `360–390 px` has zero horizontal scroll while keeping `44 × 44 px` tiles.
  - **(b)** Shrink mobile tile size below `44 px` at `360 px` (Note: violates `T18.6` / `CLAUDE.md` `≥ 44 × 44 px` tap target rule).
- **Recommendation:** **(a)** (preserves `≥ 44 × 44 px` tap targets, achieves zero scroll at `360–390 px`, and aligns existing E2E assertions with `D618`).
- **Answer (owner):** `Q76` (a), `Q77` (a), `Q78` (a), 2026-11-13: approved Preset bar (`Presets`, `Slot 1`/`Slot 2`, `Empty`/`{n} placed`, 1-tap `Save`/`Apply`), non-destructive `Balanced`/`Economy`/`Fortress` mode selector, always-on colorblind-safe overlays + status copy in `ArrangeHoldSheet` (clean `HoldGrid`), updated `8 × 12` Playwright pins, and `marginInline: calc(-1 * var(--space-3))` for `360–390 px` zero-scroll fit.

## Q79 (T18.7, 2026-11-14) — `Hold Look` drawer/sheet entry points, locked state & player-facing strings (`GDD §9.26`)
- **Where:** `HoldScreen.tsx`, `ArrangeHoldControls.tsx`, new `HoldLookSheet.tsx`, `docs/gdd.md §9.26`
- **Context:** `T18.7` builds the **Hold Look** drawer/sheet wired to `layout.toggleCosmetic` for the `6` permanent Courtyard Marks (`src/content/courtyard-marks.ts`) and `4` bought Riftglass cosmetics (`COSMETIC_IDS`). `holdLookView` (`src/core/systems/cosmetics.ts`) already exposes all `6` marks and `4` shop items with `unlocked` and `visible` state, while `GDD §9.26` currently has prose only and no locked string table rows (`CLAUDE.md` forbids inventing player-facing strings without owner sign-off).
- **Options:**
  - **(a)** Place a `"Hold Look ▸"` trigger in BOTH `HoldScreen` (wrapping cleanly beside `Rank ▸` / `Layout ▸` at `320 px Largest`) AND inside `ArrangeHoldControls` on the `Arrange Hold` sheet, opening the stacked `"Hold Look"` sheet (`openSheet('Hold Look', ...)`). Use these locked `GDD §9.26` strings:
    - Entry button: `"Hold Look ▸"`
    - Sheet title: `"Hold Look"`
    - Intro line: `"Show or hide earned Courtyard Marks and bought Hold accents across the Grid and Scene."`
    - Section headings: `"Courtyard Marks"` and `"Riftglass Shop"`
    - Row sub-lines: `"Earned · {source}"` / `"Locked · {source}"` (resolved from `courtyardMarkDef(id).source` Great Beast / Hunt name) for Courtyard Marks, and `"Bought in Riftglass shop"` / `"Buy in the Riftglass shop (Rank ▸)"` for `COSMETIC_IDS`
    - Toggle buttons (`≥ 44 × 44 px`, `aria-pressed`): `"Shown"` / `"Hidden"` (with static `"Locked"` badge on unowned rows)
  - **(b)** Place `"Hold Look ▸"` inside `ArrangeHoldSheet` only (leaving `HoldScreen` with two buttons), hide unowned marks/shop items, and show `"No Courtyard Marks earned yet."` / `"Nothing bought in the Riftglass shop yet."` when empty.
  - **(c)** Use `"On"` / `"Off"` toggle buttons (matching Settings `§9.22`) instead of `"Shown"` / `"Hidden"` inside `Hold Look`.
- **Recommendation:** **(a)** — gives one-tap access from both Hold and `Arrange Hold`, makes the 6 Courtyard Mark chase targets visible before unlock, uses unambiguous `"Shown"` / `"Hidden"` labels for visual layers, and fits `320 px Largest` text cleanly.
- **Answer (owner):** (a), 2026-11-14: approved `"Hold Look ▸"` in both `HoldScreen` and `ArrangeHoldControls`, stacked `"Hold Look"` sheet (`Courtyard Marks` and `Riftglass Shop` sections), locked §9.26 strings (`"Shown"` / `"Hidden"`, `"Locked"`, `"Earned · {source}"` / `"Locked · {source}"`, `"Bought in Riftglass shop"` / `"Buy in the Riftglass shop (Rank ▸)"`), and `≥ 44 × 44 px` wrap layout at `320 px Largest`.

## Q80 (T18.7, 2026-11-14) — Pre-`T18.10`/`T18.11` Courtyard Mark & Shop Cosmetic visual accents on `HoldGrid` and `HoldScene`
- **Where:** `HoldGrid.tsx`, `HoldScene.tsx`
- **Context:** Currently `HoldGrid.tsx` renders only bought visible shop cosmetics and leaves `v.courtyardMarks` unrendered, while `HoldScene.tsx` reads `game().delve.shop.cosmetics` directly (ignoring `visibleShopCosmetics` / `layout.toggleCosmetic`) and renders no Courtyard Marks. The Zughy-32 pixel-art PNGs for Courtyard Marks are authored later in `T18.10` and deployed into `public/assets/` + `src/content/assets.ts` in `T18.11` (`D623`), so `assets.ts` has no Courtyard Mark sprite IDs in `T18.7`.
- **Options:**
  - **(a)** In `T18.7`, wire BOTH `HoldGrid.tsx` and `HoldScene.tsx` to `visibleShopCosmetics(s)` (fixing `HoldScene` shop cosmetic toggling immediately) AND render visible `visibleCourtyardMarks(s)` on both `HoldGrid` (yard apron / wall border anchors) and `HoldScene` (mirrored foreground/ridge positions) using crisp, static Zughy-palette inline SVG heraldry accents (`aria-hidden="true"`, `data-courtyard-mark={id}`, zero CSS animation for Reduce Motion), designed so `T18.11` swaps/layers the final pixel PNGs in cleanly.
  - **(b)** Emit `data-courtyard-mark` attributes only on `HoldGrid` / `HoldScene` without visible Courtyard Mark artwork until `T18.11`.
- **Recommendation:** **(a)** — delivers real, Reduce-Motion-compliant visual toggles across both `HoldGrid` and `HoldScene` in `T18.7` and lets Playwright E2E verify visibility parity before `T18.10`/`T18.11` pixel PNGs ship.
- **Answer (owner):** (a), 2026-11-14: wire both `HoldGrid` and `HoldScene` to `visibleShopCosmetics(s)` and render `visibleCourtyardMarks(s)` on both using crisp, static Zughy-palette inline SVG heraldry emblems (`data-courtyard-mark={id}`, zero CSS animations), ready for `T18.11` pixel PNG layering/swap.

## Q81 (T18.7, 2026-11-14) — `Breakdown` (`Rates`, `Threat`, `Hut`), `StandSheet` / `WaveLogView` `v7` tactical lines & Screened wording
- **Where:** `layout-tactics.ts`, `brewing.ts`, `HutSheet.tsx`, `breach.ts`, `StandSheet.tsx`, `LanesStrip.tsx`, `LongNightSheets.tsx`, `docs/gdd.md §9.26`
- **Context:** `production.ts` and `threat.ts` already emit `tacticalProductionFactor` (`"Hold tactics"`, `"Mill links ({n})"`, `"Sawpit links ({n})"`, `"Smithy links ({n})"`, `"Warm Cottages ({n})"`, `"Trophy Hall link"`, `"Warded plots ({n})"`) and `tacticalThreatFactor` (`"Warded Hearth Hall"`), visible via `RatesSheet` and `ThreatMeter`. However:
  1. `brewing.ts` applies `tacticalBrewCut(s)` (`Alchemist's Hut` adjacent to `Herb Garden`), while `HutSheet.tsx` shows experiment time as plain text with no `Explained` / `<Num>` breakdown.
  2. `breach.ts` emits `"Connected rampart (+{p}%)"` and `"Sector support (+{p}%)"` inside `wallCut` / `volley` breakdowns, and sets `key: 'breach.screenedBonus'` on screened Watchtowers without a player-facing `Screened` label or note.
  3. `StandSheet` (`StandView`) only reveals `v7` tactical lines after tapping an individual lane in `LanesStrip`, and `WaveLogView` (`LongNightSheets.tsx`) currently renders only `w.breach.header` (`Lane {n} · cover {p}%`), omitting `w.breach.wallCut.breakdown` and `w.breach.volley.breakdown`. Meanwhile `tests/content/breach-text-all.test.ts` locks `GDD §9.25` strictly at 23 rows / 29 strings, so new `v7` tactical strings belong in `GDD §9.26` (`D624 (f)`), keeping `§9.25` and `BREACH_TEXT` frozen.
- **Options:**
  - **(a)** Surface full single-source `Breakdown` and `v7` tactical lines across all four views:
    1. Keep & lock `production()` / `threatRate()` labels (`"Hold tactics"`, `"{Building} links ({n})"`, `"Warm Cottages ({n})"`, `"Trophy Hall link"`, `"Warded plots ({n})"`, `"Warded Hearth Hall"`) in `GDD §9.26`.
    2. Add `brewMsBreakdown(state)` / `experimentMsBreakdown(state)` in `brewing.ts` (`"Hold tactics"` → `"Alchemist links ({n})"` / `"Copper Still"`) and wrap Hut brew/experiment durations in `<Num>` in `HutSheet.tsx`.
    3. Give screened Watchtowers a player-facing `note: 'Screened'` in `breach.ts`, derive concise per-lane / summary `v7` tactical indicators (`Screened`, `Rampart +{p}%`, `Sector +{p}%`) from `LaneView` for `StandSheet` / `LanesStrip` List view, and show `w.breach.wallCut.breakdown` + `w.breach.volley.breakdown` in `WaveLogView` (`LongNightSheets.tsx`) under a compact `"Defenses"` section (keeping `[data-testid="wave-log-header"]` intact and `v5`/`v6` wave logs unchanged).
  - **(b)** Leave `HutSheet` plain (scope resource `Breakdown` to `RatesSheet` and `ThreatMeter` only), add `note: 'Screened'` on screened Watchtowers in `breach.ts`, and render `w.breach.wallCut.breakdown` + `w.breach.volley.breakdown` in `WaveLogView` without adding inline `v7` tags onto `StandSheet` / `LanesStrip` List rows.
- **Recommendation:** **(a)** — gives players transparent single-source breakdown parity for every `v1.8` tactical modifier (`Rates`, `Threat`, `Hut`, `StandSheet`, and `WaveLogView`).
- **Answer (owner):** (a), 2026-11-14: lock `Rates`/`Threat` breakdown strings in §9.26; add `brewMsBreakdown`/`experimentMsBreakdown` (`brewDuration`/`experimentDuration` in `brewing.ts`) + Hut `<Num>` breakdowns; add player-facing `Screened` nested tower note on Watchtower children, `LaneInfo` `v7` indicators in `StandSheet`/`LanesStrip`, and `w.breach.wallCut.breakdown` + `w.breach.volley.breakdown` in `WaveLogView` (keeping `[data-testid="wave-log-header"]`, `lane-{n}`, `lane-line-{n}`, and `v5`/`v6` records intact).

## Q82 (T18.7, 2026-11-14) — Owner Gate: Reconciling `docs/gdd.md §9.21` and `§9.26` String Tables (`AGENTS.md` / `CLAUDE.md`)
- **Where:** `docs/gdd.md §9.21`, `docs/gdd.md §9.26`, `tests/content/breach-text-all.test.ts` (`D624 (f)`), new `tests/content/v18-text.test.ts`
- **Context:** `GDD §9.21` still contains the `v1.1` `8 × 8` mockups/table without `T18.6`'s approved `Q76 (a)`/`Q77 (a)`/`Q78 (a)` labels (`"Adjacency"`, `"Ward"`, `"Preset: Economy"`, `"Preset: Defense"`, `"Preset: Balanced"`, `"Normal"`, `"Swap"`, `"Bench / Clear"`, `Banners (Gatehouse)`, `Bell (Watchtower)`, `Lanterns (Wall)`), and `GDD §9.26` has prose only with no markdown string table yet. Editing `docs/gdd.md` design/UI tables is an owner gate (`AGENTS.md` / `CLAUDE.md`). Once `Q79`–`Q81` are decided, `D624 (f)` pre-authorizes updating `tests/content/breach-text-all.test.ts`'s end slice to `\n### 9.26` so `§9.25` stays frozen at 23 rows while `§9.26` gets its locked table.
- **Options:**
  - **(a)** Authorize `T18.7` to update `docs/gdd.md §9.21` (`8 × 12` layout copy & mockups + `T18.6` `Q76 (a)`/`Q77 (a)`/`Q78 (a)` strings) and populate `docs/gdd.md §9.26`'s markdown table with the exact strings approved in `Q79`–`Q81`, keeping `§9.25` untouched, updating `tests/content/breach-text-all.test.ts` per `D624 (f)`, and adding a `§9.21` / `§9.26` word-for-word content lock test (`tests/content/v18-text.test.ts`).
  - **(b)** Keep `docs/gdd.md` untouched in `T18.7` and provide drafted `§9.21` / `§9.26` tables in `docs/progress.md` for manual owner entry before adding text-lock tests.
- **Recommendation:** **(a)** — lets the `T18.7` implementation session close the full GDD + UI + text-lock loop cleanly in one commit under explicit owner sign-off.
- **Answer (owner):** (a), 2026-11-14: authorized updating `docs/gdd.md §9.21` and populating `docs/gdd.md §9.26` table (leaving `§9.25` untouched), updating `tests/content/breach-text-all.test.ts` end delimiter to `\n### 9.26` (`D624 (f)`), and adding `tests/content/v18-text.test.ts`.

## Q83 (T18.10, 2026-11-15) — Courtyard Mark PNG dimensions & unified vs. dual `HoldGrid` / `HoldScene` sprites
- **Where:** `tools/grid-v18-batch3.ts` (new), `tools/contact-sheet-v18.ts`, `src/ui/widgets/CourtyardMarkAccents.tsx`, `src/content/assets.ts`
- **Context:** `T18.10` authors Batch 3 (`#25`–`#32`): remaining plot variants (`herb-garden` `1..3`, `silver-seam` `1..2`) plus all `6` Event Courtyard Marks (`fjord-bone-standard`, `barrow-brazier`, `river-reed-basin`, `stoneback-cairn`, `kettle-barrow-wreath`, `watch-fire-sconce`) with `HoldGrid` overlays and matching `HoldScene` visual accents in 100% Zughy-32. `docs/` and `src/content/assets.ts` do not specify PNG pixel dimensions or whether `HoldGrid` and `HoldScene` share one sprite or use separate sprites. Currently `CourtyardMarkAccents.tsx` places ~`16 × 18` inline SVGs at `GRID_ANCHORS` (`256 × 384`, where `[236, 184]` and `[230, 358]` leave `20 px` to the right edge and `26 px` to the bottom edge) and `SCENE_ANCHORS` (`160 × 64`, `y = 34..44`, currently with fractional `scale = 0.9`, while `GDD §9.12` requires `16 px` / `32 px` / `64 px` assets and integer scaling only).
- **Options:**
  - **(a) Single unified `16 × 16 px` Zughy-32 PNG per mark (`6` PNGs total):** Crisp `16 × 16` emblem shared at `1×` native integer scale on both `HoldGrid` (`GRID_ANCHORS`: `236 + 16 = 252 ≤ 256`, `358 + 16 = 374 ≤ 384`) and `HoldScene` (`SCENE_ANCHORS` at `scale = 1`: `44 + 16 = 60 ≤ 64`), complying with `GDD §9.12` without shifting anchors or introducing fractional scaling.
  - **(b) Dedicated dual sprites per mark (`12` PNGs across `#27`–`#32`):** A `16 × 16 px` (or `24 × 24 px` apron badge, shifting outer `GRID_ANCHORS` inward `4–8 px`) `HoldGrid` overlay paired with a dedicated `16 × 16 px` (or `12 × 12 px`) `HoldScene` foreground accent, shown side-by-side in each Contact Sheet 3 cell.
  - **(c) `16 × 16 px` `HoldGrid` PNGs + `160 × 64 px` per-`AgeId` `HoldScene` full-canvas overlays (`6 + 24 = 30` PNGs):** Mirrors `COSMETIC_IDS` (`scenes/cosmetics/<age>-<id>.png`) so marks adapt per age silhouette, at roughly `5×` file count and larger bundle size.
- **Recommendation:** **(a)** — matches `GDD §9.12` (`16 px` emblem scale), gives clean `1×` integer alignment on both `HoldGrid` (`256 × 384`) and `HoldScene` (`160 × 64`), removes `scale = 0.9` in `T18.11` with zero anchor layout churn, and keeps Batch 3 weight minimal.
- **Answer (owner):** (a), 2026-11-15: approved single unified `16 × 16 px` Zughy-32 PNG per Courtyard Mark (`6` PNGs total) shared at `1×` native integer scale on both `HoldGrid` and `HoldScene`.

## Q84 (T18.10, 2026-11-15) — `HoldScene` accent crop, staging path in `art-src/v1.8-staging/`, and `T18.11` deploy path
- **Where:** `art-src/v1.8-staging/`, `docs/flesh-out/v1.8/art-marks.md`, `src/ui/widgets/CourtyardMarkAccents.tsx`, future `public/assets/` (`T18.11`)
- **Context:** `T18.10` stages packed Batch 3 PNGs in `art-src/v1.8-staging/` while leaving shipped `public/assets/grid/` and `public/assets/scenes/` untouched until `T18.11`. Existing `art-src/v1.8-staging/` files sit flat at the root (`cosmetic-*.png`, `<building>-1..3.png`) matching `public/assets/grid/`. On `HoldScene` (`160 × 64`), the grass foreground starts at `GROUND = 48` (`y = 48..63`) while `SCENE_ANCHORS` sit along the fence/meadow band at `y = 34..44`.
- **Options:**
  - **(a) Unified standalone emblem staged flat at `art-src/v1.8-staging/courtyard-mark-<id>.png` (`6` files; deployed to `public/assets/grid/courtyard-mark-<id>.png` in `T18.11`), rendered uncropped at `HoldScene` `SCENE_ANCHORS` (`y = 34..44`, `scale = 1`):** Renders each Courtyard Mark as a crisp self-contained landmark (`1 px` `C.wine` outline, no baked grass/sky crop), keeps `art-src/v1.8-staging/` flat alongside `cosmetic-*.png`, and avoids creating a new `public/assets/` directory.
  - **(b) Dedicated `HoldScene` ground-cropped accent (`art-src/v1.8-staging/courtyard-mark-<id>-grid.png` + `art-src/v1.8-staging/courtyard-mark-<id>-scene.png`, `12` files; deployed to `public/assets/grid/` and `public/assets/scenes/marks/` in `T18.11`):** Pairs an uncropped `HoldGrid` badge with a meadow-grounded `HoldScene` silhouette anchored cleanly to `y = 48..63`.
  - **(c) Unified `art-src/v1.8-staging/courtyard-mark-<id>.png` (`6` files) deployed to `public/assets/marks/<id>.png` in `T18.11`:** Separates dual-surface Courtyard Marks on disk from `public/assets/grid/`.
- **Recommendation:** **(a)** — stays consistent with `art-src/v1.8-staging/cosmetic-*.png`, keeps `public/assets/` structure flat (`grid/`), and preserves readable top-to-bottom silhouettes across both dark `HoldGrid` and lighter `HoldScene` grounds (`Q83 (a)`). (If `Q83 (b)` is selected, `(b)` pairs directly with it.)
- **Answer (owner):** (a), 2026-11-15: approved flat staging at `art-src/v1.8-staging/courtyard-mark-<id>.png` (`6` files; deploying to `public/assets/grid/courtyard-mark-<id>.png` in `T18.11`) anchored uncropped at `HoldScene` `SCENE_ANCHORS` (`scale = 1`).

## Q85 (T18.10, 2026-11-15) — `src/content/assets.ts` asset ID mapping & manifest integration timing for Courtyard Marks
- **Where:** `src/content/assets.ts`, `tests/tools/layout-grid-art.test.ts`, `docs/flesh-out/v1.8/art-marks.md`, `tools/contact-sheet-v18.ts`
- **Context:** Contact Sheet 3 (`docs/flesh-out/v1.8/art-marks.md` & `tools/grid-v18-batch3.ts`) labels each subject by its canonical asset ID (mirroring `grid.cosmetic.*`, `grid.strip.*`, `grid.barracks` in Batches 1–2). `src/content/assets.ts` currently has zero Courtyard Mark entries (`gridCosmeticId`, `gridStripId`, `cosmeticId`), and `tests/tools/layout-grid-art.test.ts` asserts `assetById.keys()` with prefix `'grid.'` has length `83` (shipped `src/content/assets.ts` and `public/assets/` stay untouched until `T18.11`).
- **Options:**
  - **(a) Map each mark to `courtyardMarkAssetId(id) = courtyard-mark.<id>` (kind `'icon'`, `'grid/courtyard-mark-<id>.png'` under `Q84 (a)` or `'marks/<id>.png'` under `Q84 (c)`), keeping `src/content/assets.ts` untouched until `T18.11`:** Distinct `courtyard-mark.*` namespace reflects dual `HoldGrid` + `HoldScene` usage and preserves the locked `83`-asset `grid.*` tile manifest invariant cleanly.
  - **(b) Map each mark under `grid.*` (`grid.mark.<id>` or `grid.courtyard-mark.<id>` when unified; paired `grid.mark.<id>` + `scene.mark.<id>` if split per `Q83 (b)` / `Q84 (b)`), updating `layout-grid-art.test.ts` (`83 → 89` `grid.*` entries, `D624 (f)`) in `T18.11`:** Matches `grid.cosmetic.<id>` in `src/content/assets.ts`.
- **Recommendation:** **(a)** — cleanly distinguishes dual-surface Courtyard Marks (`courtyard-mark.<id>`) from `83` grid map tiles/overlays while keeping `src/content/assets.ts` and `public/assets/` frozen during `T18.10` staging.
- **Answer (owner):** (a), 2026-11-15: approved `courtyard-mark.<id>` ID mapping (`courtyardMarkAssetId(id)`, kind `'icon'`, `'grid/courtyard-mark-<id>.png'`), keeping `src/content/assets.ts` and `public/assets/` untouched until `T18.11`.

### Q86 (T18.12, 2026-11-15) — Final `v1.8` `layout.*`, `breach.*`, `vigil.embersPerLevel`, and `sim:accept` calibration for `T18.13`
- **Context:** `T18.12` upgraded simulator placement/policies and measured `npm run sim:breach` plus 65-run `npm run sim:check` sweeps without changing `src/content/balance.ts`, `sim/baseline.json`, or `sim/targets.ts`:
  - `breach.{rampartBonus: 0.15, screenedBonus: 0.25, sectorBonus: 0.05}` passes all three Breach checks (`breach-auto-holds`, `breach-tactician-not-worse`, `breach-bad-costs`) with no `> 2×` jump needed.
  - `1.0×` `layout.*` placeholders (`adj*: 0.025, adjCottage: 0.015, wardedThreatCut: 0.05`) pass `58/63` `sim:check` checks (`5` fails: `contracts-own-silver`, `provisions-matter`, `recipe-book`, `tokens-not-wasted` `37.5%`, `vigil-embers-level` `9.1%` gap) and shift `bastion` timing `96.00 h -> 86.00 h` (`-10.00 h`).
  - Temporary `0.8×` round `layout.*` (`adj*: 0.02, adjCottage: 0.01, wardedThreatCut: 0.04`) passes `60/63` `sim:check` checks (`contracts-own-silver`, `recipe-book`, `tokens-not-wasted` `28.6%`, and all Breach checks pass; misses `provisions-matter` `16.5–18.9%`, `silver-with-boss` `69.9%`, `vigil-embers-level` `9.6%` gap) and preserves `bastion: 96.00 h` across `standard`, `delver`, `eventer`, `vigilant`, `tactician` (`best-last-stand` `96.00 h -> 99.00 h`).
- **Options:**
  - **(a) Keep `breach.*` at `0.15 / 0.25 / 0.05`, adopt `0.8×` round `layout.*` (`adjFood/Wood/Iron/Silver/Brew/Trophy/wardedBonus: 0.02`, `adjCottage: 0.01`, `wardedThreatCut: 0.04` — or trim `adjFood`/`adjSilver` slightly to `0.015` if keeping strict pre-`v1.8` `provisions-matter`/`silver-with-boss` bands), retune `vigil.embersPerLevel` (`0.26 -> ~0.22`) in `T18.13`, and re-record `sim/baseline.json` (`D624`) + confirm `sim/targets.ts` handling in `T18.13`:** Preserves the `96.00 h` `bastion` benchmark pace across all 5 standard profiles, resolves `contracts-own-silver`/`recipe-book`/`tokens-not-wasted` immediately, and stays well inside `< 2×` tuning bounds.
  - **(b) Keep all `T18.3` / `T18.4` placeholders (`0.15 / 0.25 / 0.05` and `0.025 / 0.015 / 0.05`) unchanged, retune `vigil.embersPerLevel` in `T18.13`, and accept the `-10.00 h` `bastion` shift plus updated `sim/targets.ts` / `sim/baseline.json` bands:** Retains slightly stronger courtyard adjacency (`2.5%`/link) at the cost of a faster Bastion pace and broader Cycle 1 target adjustments.
  - **(c) Cut `layout.*` further (`~0.5×`, `0.0125 / 0.0075 / 0.025`) in `T18.13`:** Not recommended — fast `sim:check` showed `0.5×` shifts `standard/mon` & `opening/mon` `bastion` by `-24.00 h` (`96.00 h -> 72.00 h`) via Breach/economy interaction.
- **Recommendation:** **(a)** — adopt `breach.{rampartBonus: 0.15, screenedBonus: 0.25, sectorBonus: 0.05}` and `layout.*` `0.8×` round (`0.02 / 0.01 / 0.04`), with optional minor `adjFood`/`adjSilver` trim (`0.015`) + `vigil.embersPerLevel` retune in `T18.13` before `npm run sim:accept`.
- **Answer (owner):** [open]
