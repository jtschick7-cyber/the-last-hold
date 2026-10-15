# OUT-7 — Summary for the owner (v0.8 flesh-out, 2026-10-15)

## Instructions for the Claude Code thread

1. **Branch.** Work on `milestone/v0.8`. If it doesn't exist, create it from the current `main`, the v0.7.0 merge commit `f19c3cb` (*Merge v0.7 Delves, Act IV and the simulated Delver (#9)*), and push it with `git push -u origin milestone/v0.8`. Push after every task; the preview build follows this branch.
2. **Apply the flesh-out files as-is first, in their own docs commit, before building anything.**
   - Copy `OUT-1` to `OUT-9` into `docs/flesh-out/v0.8/`, and this summary into `docs/flesh-out/v0.8-summary.md`.
   - Then apply them:
     - OUT-1 rows → `docs/decisions.md`;
     - OUT-2 → `docs/gdd.md`, **except section L (§7.10)**;
     - OUT-3 → `docs/lore-secrets.md`;
     - OUT-4 → `docs/implementation-plan.md`, **except the §0.6 locked row**;
     - OUT-5 → `docs/questions.md`;
     - OUT-9 → `docs/technical-design.md`.
   - GDD §7.10 and the plan's §0.6 row go in with **T8.3**, because `tests/content/balance.test.ts` compares them with `balance.ts`. This is the order v0.7 used.
   - OUT-8 is the save fixture for T8.5.
   - `npm run check` must stay green after the docs commit. Add a short progress entry.
3. **Don't open a pull request unless the owner asks. Don't merge, and don't tag** (the owner tags).
4. **Start** from the CLAUDE.md "Session start" steps, then the first unchecked v0.8 task (T8.1, Act V).
5. **Standing instructions agreed in this session:**
   - **If any simulator CI job goes over 5 minutes, stop and ask** (the limit applies to each job, D320). Never trim seeds or rows.
   - If any golden fight or recorded fight changes, stop and ask (`rulesVersion` 5, D308).
   - A name collision in the T8.4 search: stop and ask, with alternatives.
   - If no reasonable tunable values pass a check: stop and ask. Never move a row or a locked constant.
   - Act VI is outlined only. **Don't write Act VI texts**; they come at the v0.9 flesh-out (D303).
   - Delves carry no plot: no document, name or Legendary from a Delve.
   - Talk to the owner in plain language, no code.
6. **Still open:**
   - Every v0.8 decision is settled: D300–D327 are Decided, and D328 was accepted by the owner (D329, Q25 a).
   - D221–D227 (v0.6 readings) were also accepted (D329). Nothing in the v0.8 rows is Proposed.
   - **Still open from earlier milestones:** when the final act ships (D24.10, decided at v0.10); Act VI's texts and the Dross-Tide in the Last Stand (v0.9 flesh-out, D303).
   - Proposed rows that Claude Code adds during the build stay Proposed until the owner says otherwise.

---

## What we decided (D300–D329)

**Act V, The Hearthblade, is written** (lore §30).
- Yrsa's letters from the Deep come up, one at a time, through the crack behind Pechko's stove: ordinary conditions, no Delving needed.
- They tell where she went after the Night and give four names (#4–7) cut into the old hearth's ring. The reveal is that the fire grows the cold.
- Pechko admits he knew about the pit, and Kozly Hollow's young start talking about shutting *your* hearth.
- The Unlit's door opens after Act V's stand.
- **Act VI** is outlined (the Unlit; the three oldest names); its texts come at v0.9.
- **Your save:** if you make cycle 19's stand before v0.8 reaches the preview, Act V starts on load in cycle 20.

**Items.**
- Your gear becomes Common items with the same numbers.
- The Smithy crafts and **reworks** items one tier up at today's prices, keeping their bonus lines.
- Contract wins drop loot (15–35% by tier): Fine, Rare or Heroic, with 1–3 bonus lines.
- Stores holds 40, with Salvage.
- Everything resets at the Long Night except **Legendaries**.

**Legendaries.** Six, never random, each found once at a milestone (a whole family Mastered, or Act V's stand: **Yrsa's Thole**) and kept forever in a new **keepsake** slot. Your save likely gets **Wolf-Tooth String** on arrival.

**Ranks and stars.**
- **Wright** at highest level 5 (+20 trophies) and **Master-Wright** at 10 (+60). Ranks never get lost to the Long Night.
- **Stars** cost **Embers** and trophies, so your 481 Embers have a use again. Each star adds 1 point of growth per level and opens talent tiers.
- Your save arrives with seven Wrights.

**Use-skills and talents.**
- Every hunter gets a personal use-skill at Wright (for example, Arvid's Hold the Stair).
- Every role gets 9 talents in 3 branches, with free respec.
- The combat rules version goes to 5; golden fights must not change.

**The yard.** Every hunter not on a contract earns 25% of its XP, up to your third-highest hunter's level. Arvid, Sigrun and Toma should reach level 5 in about a cycle, which brings their three name letters.

**Delves.** Hunter XP, Command skill XP and one guardian item, **only while the run pays Riftglass**, so nothing can be farmed. Still no trophies, bestiary kills or Legendaries.

**Saves.** Schema v8 from today's save code. The family-counter bug gets fixed. The "older rules version" note shows only when a replay really differs.

**Simulator.**
- The job splits into parallel CI jobs, **5 minutes each**.
- New rows: Act V in its cycle, late recruits' letters by cycle 5, first Wright in cycle 1, and a bigger "all content" for the Delve-optional check.
- The simulated players get rules for items, ranks, stars, talents and Legendaries; the Delver now uses its Re-roll.

**Leftovers.**
- Done in v0.8: the Delver's Re-roll, the Arvid card test, the nine brew icons, and the move off Node 20.
- WebKit-in-CI is closed as an issue.
- The Pixel UI frames stay in v1.0.

**Size.** 19 tasks over about 15–19 sessions, with Act V first.

## Still open
- Nothing for v0.8. You accepted the write-up details (Q25 a) and the v0.6 readings D221–D227 (D329).
- **Later:** Act VI's texts and the Dross-Tide (v0.9); the final act's timing (v0.10).

## What to playtest later
- **Your save's arrival:** gear unchanged, seven Wrights, Wolf-Tooth String.
- **Loot and the picker:** is "is this better?" obvious?
- **Ranks and stars:** easy to find and clearly priced? Do stars make your Embers worth something?
- **Use-skills:** do they show in logs? Did one change a fight?
- **The yard:** do the late recruits catch up?
- **Delves:** do they feel worth a run again?
- **Act V:** letters at the crack, the Unlit's door.
- **The new art.**
