# The Last Hold — Implementation Plan

**Status:** Revised after the plan review (D34–D36). Awaiting owner approval.
**Reads with:** `CLAUDE.md` (the workflow, definition of done, and owner gates live there, not here), `gdd.md` (what), `technical-design.md` (how), `decisions.md` (why).
**Depth:** v0.0–v0.8 are in full detail (v0.8 fleshed out 2026-10-15, D300–D328). v0.9 and later are outlines; each gets a **flesh-out session** before it starts (§0.4).
**Markers:** **[JC]** = judgment call. **👤** = owner task. **[?]** = task blocked on an owner question (see `docs/questions.md`).

---

## 0. How milestones run

The per-session workflow, definition of done, and owner gates are in **`CLAUDE.md`**. This section covers only what's specific to milestones.

### 0.1 Milestone status

Every milestone heading is followed by a **`Status:`** line: `not started`, `in progress`, or `complete`.
- The **current milestone** is the first one that isn't `complete`.
- Claude Code sets a milestone to `in progress` when it starts the milestone's first task.
- **Only the owner's go-ahead sets `complete`** (§0.3).

### 0.2 Testing approach

- **Test-first** for formulas, rules, and saved data. Tests take their numbers from the GDD.
- **UI** is covered by the Playwright smoke (from v0.1) and the owner's playtest, not by component unit tests.
- **`npm run check`** (90 s or less; technical design §11.2) before every commit. The full simulator suite and the benchmarks run in their own CI jobs (technical design §11.2).

### 0.3 Ending a milestone

1. Every task is ticked (no `[?]` left). Every acceptance criterion is met. **All simulator checks pass on 5 seeds** (`sim.yml`).
2. **The preview build** (technical design §11.3) holds the finished milestone. 👤 **The owner installs it and runs the playtest checklist.**
3. Claude Code opens the pull request using the plain-language template: what changed, what to playtest, known issues, deferred or skipped.
4. 👤 **The owner says the playtest passed.** Only then does Claude Code merge, tag `vX.Y.0`, set `Status: complete`, run `sim:accept`, and add a decisions row (owner gates, CLAUDE.md).

### 0.4 Flesh-out sessions (before v0.4 and every later milestone)

A planning session in chat (not in Claude Code), with the owner, before the milestone starts:
1. Review what playtesting taught.
2. Bring the milestone's GDD section to full detail, with owner approval.
3. Expand this plan's section into tasks, a "Before you start" box, acceptance criteria, and simulator checks.
4. Log the decisions.
5. Sweep the decisions log: every `Proposed` row gets an owner yes/no. No row stays `Proposed` across two milestones. *(Claude lists the open `Proposed` rows for the owner at each flesh-out; the yes/no is the owner's.)*

Claude Code doesn't start an outline-level milestone until its flesh-out is done.

### 0.5 Story pace (P4)

- **Acts I and II** are written in the **v0.5 flesh-out**.
- After that, writing stays **at least one act ahead** of the owner's current cycle. Each later flesh-out checks this.
- **An unwritten act** closes the cycle with *"The story continues in a later version."* When it ships, it unlocks in the current cycle (`lore-secrets.md`, D34).

### 0.6 Balance tuning: locked and tunable constants (A15)

- **Tuning changes only `tunable` constants in `balance.ts`, never formulas.** Commit with `balance:` and include the before-and-after report diff.
- A tunable constant moved by more than 2× gets a "Proposed" decisions row.
- If no reasonable tunable value passes a check, **stop and write it to `docs/questions.md`.** That's a design problem.

**`locked` constants** (design decisions; changed only through a decisions row the owner approves) **[JC]**:

| Area | Locked keys |
|---|---|
| Offline | `offline.baseCap`, `offline.ceiling` |
| Contracts | `contract.recklessBelow`, `injury.deathChance`, `board.interval`, `board.cap`, `contract.partySize`, `contract.hamletPartyMax`, `contract.unlockSuccesses`, `contract.ageTierCap`, `prep.wellPreparedBounty` |
| Economy | `silverSeam.max` |
| Combat | `combat.meterThreshold`, `combat.maxTicks`, `combat.takenCap`, `odds.samples`, `suggest.*` |
| Roster | `roster.hamletCap`, `roster.ageBonus`, `barracks.maxLevel` |
| Knowledge | `knowledge.studiedKills`, `knowledge.masteredKills` |
| Death and Long Night | `death.returnDaysBeforeLongNight`, `longNightArrival.emberCapShare`, `laststand.partyMax` (D107) |
| Simulated player | `value.weights` (they define the simulated player, so tuning them would game the checks) |
| Events | `boss.partySize`, `boss.tokenInterval`, `boss.tokenMax`, `boss.hunterRest`, `boss.openAge`, `boss.order`, `boss.poolBase`, `boss.baseTier`, `boss.passTierStep`, `boss.milestones`, `boss.silverBounties`, `boss.reagents`, `boss.itemChance`, `boss.itemRarityWeights`, `boss.xpPerTier`, `boss.previewSamples` (the whole `boss.*` namespace, D370–D379), `riftglass.bankWeeks` |
| Delves | `delve.partySize`, `delve.floors`, `delve.doors`, `delve.offers`, `delve.unlitDoorsPerRun`, `riftglass.weeklyCap` (D268) |
| Skills | `skill.maxLevel` (D217) |
| Orders | `orders.seatsStart`, `orders.seatsMax`, `orders.thirdSeatTopOrders`, `orders.levels`, `orders.opposed`, `orders.perkCeiling` (D412, D418) |
| Hunter depth | `stores.cap`, `star.max`, `keepsake.slots`, `talent.points`, `talent.tierStars`, `rank.wrightLevel`, `rank.masterLevel`, `yard.capRank` (D325) |

*The `hunt.*` constants (`hunt.unlockPoints`, `hunt.trackPoints`, `hunt.trackTiers`, `hunt.xpPerTier`, `hunt.lossXpShare`, `hunt.replayReagents`, D380) are **tunable.** `boss.poolBase` starts as a sketch and is replaced only by a decisions row the owner approves (T9.13).*

*The `orders.*` standing weights, `orders.levelThresholds`, `orders.delveWindow`, `orders.delveWeeklyCap`, `orders.triumphantChunk`, `orders.backfillCapLevel`, `orders.swapCooldown` and the four `orders.perk.*` steps are **tunable** (D418). The thresholds, weights, chunk and cap start as sketches the Orderer measures at T10.17 and T10.18.*

Also locked: **`sim/targets.ts`**, the **golden fixtures**, and the **coverage rules**. Everything else in `balance.ts` is tunable.

### 0.7 Size (A16)

**A task must fit in one session; most sessions finish 2–4 tasks.**

| Milestone | Tasks | Estimated sessions **[JC]** |
|---|---|---|
| v0.0 | 8 | 1–2 |
| v0.1 | 38 | 12–16 |
| v0.2 | 26 | 12–16 |
| v0.3 | 12 | 8–12 |
| v0.4 | 16 | 10–14 |
| v0.5 | 17 | 12–16 |
| v0.6 | 14 | 10–14 |
| v0.7 | 17 (T7.1–T7.16, T7.13 in two parts) | 13–17 |
| v0.8 | 19 (T8.1–T8.18, T8.13 in two parts) | 15–19 |
| v0.9 | 19 (T9.1–T9.19) | 10–15 |
| v0.10 | 19 (T10.1–T10.19) | 10–14 |

Estimates, not commitments. If a task proves bigger than a session, split it here first.

**Actuals [JC].** Counted from `docs/progress.md` (one entry ≈ one session; flesh-out and planning entries excluded). Entries overcount real sessions, because several early milestones were written up task by task within one day, so read these as upper bounds: v0.0 2, v0.1 17, v0.2 6, v0.3 6, v0.4 15, v0.5 7, v0.6 5 (3 numbered build sessions), v0.7 8 (4 numbered build sessions). Every milestone from v0.2 on came in under its estimate except v0.4 (15 entries against 10–14), and v0.4's entries were mostly one per task. The v0.8 flesh-out sets the estimates for v0.8 and later from these actuals. v0.8 9 (4 numbered build sessions).

*Sizing note (v0.9 flesh-out):* v0.6 took 5 entries for 14 tasks and v0.7 took 8 for 17 (about half an entry a task), v0.8 estimated 15–19 for 19 tasks. v0.9 has 19 tasks but less new machinery than v0.8 (no new item system; a few new combat effects that appear only in event fights) and more content (Act VI's ten texts, nine content rows). Estimated 10–15 sessions. **v0.8's actual count, added at the v0.9 docs commit from `docs/progress.md` and its archive:** 9 entries over 4 numbered build sessions (the docs-only entry excluded), against 15–19 estimated. That is well under the estimate, so 10–15 for v0.9 is likely an upper bound; the estimate is left as the flesh-out set it, and the owner can lower it.

*Sizing note (v0.10 flesh-out):* v0.9 had 19 tasks and v0.10 also has 19, with **no new combat machinery** (no fight formula changes), one new system with simple rules (standing, seats), sixteen short scene texts and one new simulator player. The big risks are not size but **tuning the sketches** (T10.18) and **the backfill of the owner's save** (T10.1). Estimated 10–14 sessions. **v0.9's actual count, added at the v0.10 docs commit from `docs/progress.md`:** 21 entries over 6 numbered build sessions (the docs-only entry excluded), against 10–15 estimated; entries overcount real sessions, so read it as an upper bound.

### 0.8 Optional extras

G9 (Records screen, CSV/JSON export) was **not taken** (D31). Nothing is scheduled for it.

---

## v0.0 – v0.4 — complete (archived)

Task lists, acceptance criteria, simulator checks and playtest checklists for v0.0 to v0.4 are in [`docs/archive/implementation-plan-v0.0-v0.8.md`](archive/implementation-plan-v0.0-v0.8.md). Each ended `Status: complete`.

---

## v0.5 and later (outline: each needs a flesh-out session first, §0.4)

Order revised by P2 and P3 (D35): **the Long Night comes before alchemy discovery**, and it's split into mechanics and story.

### v0.5 – v0.8 — complete (archived)

Moved to [`docs/archive/implementation-plan-v0.0-v0.8.md`](archive/implementation-plan-v0.0-v0.8.md): v0.5 (Long Night: Act I), v0.6 (alchemy discovery), v0.7 (Delves), v0.8 (hunter depth). Each ended `Status: complete`. Their tasks, acceptance criteria and playtest checklists are there.

### v0.9 — Events

**Status:** complete *(fleshed out 2026-10-20, revised after an independent review; decisions D357–D387; files in `docs/flesh-out/v0.9/`)*

**Scope:** world bosses (banked tokens, 24 h rest, a shared pool, milestone rewards) and three Legendary Hunts (self-started, three tracks each, points that carry over, a legendary hunter at the end of each); reserve hunters take part (D279). **Act VI, The Unlit, is written** (lore §31): ten documents, a new Rime type, the names #1–3, three closing scenes; nobody in it says the names aloud. **The Dross-Tide joins the Last Stand's waves in every stand made once Act VI has begun, with no wave guaranteed** (D363, D386). D315 is answered: attendees earn hunter XP; yard XP stays contracts-only; the boss kill pays one item.

#### Before you start *(read this box first)*

1. **Branch.** Work on `milestone/v0.9`. If it doesn't exist, create it from the current `main` (the v0.8.0 merge) and push it with `git push -u origin milestone/v0.9`. Push after every task; the preview build follows this branch.
2. **Apply the flesh-out files first, in their own docs commit, before building anything:**
   - copy the files into `docs/flesh-out/v0.9/` and the summary into `docs/flesh-out/v0.9-summary.md`;
   - OUT-1 rows → `docs/decisions.md` (**no old row is edited; the sweep is the single row D385**); OUT-2a → `docs/gdd.md` (**OUT-2b, the §7.11 table and the §7.4 pointer, waits for T9.2**); OUT-3 → `docs/lore-secrets.md`; OUT-4a → this plan, **except the §0.6 row**; OUT-5 → `docs/questions.md`; OUT-9 → `docs/technical-design.md`;
   - OUT-8 (`v8-owner.json`) is the fixture for T9.1.
   - `npm run check` must stay green after the docs commit. Add a short progress entry. Tick `- [x]` the docs commit in the checklist below as it is done.
   - [x] **Docs commit** (2026-10-20): flesh-out files applied. (OUT-4a said to tick a docs-commit box in a checklist; the plan has none, so this line is that box.)
3. **Locked constants.** The whole `boss.*` namespace is locked (§0.6). Build them at the values in GDD §7.11 and **never change one without an owner-approved decisions row.** `boss.poolBase` is a sketch; T9.13 returns the real figure as a row. The `hunt.*` constants and `events.recentKeep` are tunable.
4. **Determinism gates.** `rulesVersion` stays **5**. If **any golden fight changes, or any recorded fight or stand changes its result, stop and ask** (D308, D344 (1)). The new combat effects (Radmila's *Sit the Vigil*; Fjord Roar and Weir-Pull pushing hunters' meters back; Ill Luck; a boss whose Health is the shared pool) appear only in fights that include a boss, a quarry or Radmila; each gets a test.
5. **The simulator.** Standard, Light, Heavy, Opening and the Delver issue **no event commands**; their reports **before Act VI's content equal the v0.8 baseline**. From cycle 6, Act VI's documents and the Dross-Tide stands change what they see, so those baselines are re-recorded once at T9.12 and the old rows re-judged (they are expected to pass; if one fails, stop and ask). New rows go in `sim/targets.ts` in **their own commit, after the owner has approved them** (T9.17). **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows.
6. **Names.** The new proper names are in OUT-6. A session that can search the web checks them against GDD §2.3 and adds them to `tests/content/names.ts` with the date; one that can't marks the task `[?]` and adds the unchecked names to `docs/questions.md` (the test stays red, never skipped). **A collision: stop and ask, with alternatives.**
7. **Story rules.** Write **only the Act VI texts in OUT-3, word for word.** Delves carry no plot: no document, name or Legendary comes from a Delve or an event. Act VI carries exactly the names #1–3 and no other, and **no Act VI text says the names aloud or asks for them to be said** (D386).
8. **Stop and ask the owner** if no reasonable tunable passes a check, if a required name or document turns out event-only, or if the technical design Appendix 1 in the repo contradicts OUT-9. Never move a row or a locked constant.
9. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D357–D387, GDD §5.12, §7.11, `docs/flesh-out/v0.9-summary.md`.
- T9.1, T9.3, T9.6, T9.8: technical design §5.2, §6.2, §7.2, §9.4. T9.5, T9.7: GDD §5.5, §6.5, §9.5 and technical design §5.3. T9.9: GDD §5.9.3, §8.3.1. T9.10, T9.11: `lore-secrets.md` §31 and GDD §5.14. T9.12, T9.17: GDD §6.1–§6.3. T9.14–T9.16: GDD §9.17 and the setting primer §6.4.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| After T9.4 | Look at the Great Beasts, quarries, tracks and hunters (stats are sketches) | GDD §8.13, §8.14 |
| After T9.13 | Say yes or no to the measured pool row (Q29) | Q29 |
| Before T9.17 commits the rows | Approve the simulator rows, including the two proposed (D383) | GDD §6.2 |
| After T9.16 | Supply or approve the art: three hunter portraits and battle sprites, six creatures, icons for Rime and tokens | art notes in GDD §8.5, §9.17 |
| At the end | Playtest (checklist below) | below |

#### Tasks

Each task is one Claude Code session; **most milestones finish in fewer sessions than tasks, since two small tasks can share one** (the progress entries record this). Tests come first for formulas, rules and saved data (§0.2). Every task ends with `npm run check` green and a short progress entry. Tick the box when its acceptance criteria all hold.

- [x] **T9.1 — Save v9: the `events` state and `standPool`** *(core/save)*
  - Add `EventsState` and `CycleRecord.standPool` (technical design §5.2), the v8 → v9 migration (`save/migration-v9.ts`), validation, and the load-path `openEvents(state, now)`.
  - Fixtures: `tests/saves/fixtures/v8-owner.json` (OUT-8, **copied unchanged**) and `v9.json` (that save migrated and played 72 h under a fixed seed).
  - *Acceptance:*
    1. The fixture loads, migrates, validates and round-trips.
    2. After the load path the owner's save has events open, an empty bank, `standPool: 'base'` on cycle 19 and `cycles[18].stand` still null.
    3. Unknown ids drop with a warning.
    4. **Every golden fight replays line for line; every recorded fight and stand keeps its result** (D344 (1)).

- [x] **T9.2 — The constants** *(GDD §7.11, plan §0.6, `balance.ts`)*
  - Apply OUT-2b (the §7.11 table and the §7.4 pointer) and OUT-4b (the §0.6 locked row) with the `balance.ts` keys that read them. `tests/content/balance.test.ts` must match.
  - *Acceptance:* 1. Every `boss.*`, `hunt.*` key and `events.recentKeep` exists once with the §7.11 value. 2. `boss.*` keys are marked locked. 3. The key test passes. 4. No numeric literal in `core/systems/` outside the allowlist.

- [x] **T9.3 — Tokens, rest, eligibility and debug commands** *(core/systems/events.ts)*
  - **Also (moved from T9.1, D388):** the load-path clamps that need the constants: `tokens.count` to 0–`boss.tokenMax`, `points` to 0–`hunt.unlockPoints`, `boss.tier` to null or 3–12, `paid` to 0–4, and dropping a `rest` entry already in the past.
  - The token bank and rest as functions of stored timestamps, the monotone `events.clock` and `now` (technical design §5.2, §6.2): selectors with breakdowns, spend, `openEvents`, the eligibility selector (not on a contract, in a Delve, recovering or resting).
  - **Debug commands in core** (each sets `debugUsed`): add a token, fill the bank, end all rests, **start Act VI** (`debug.startAct`, so the playtest does not wait for Act V's stand).
  - *Acceptance:* 1. A 30 h jump equals a 12 + 12 + 6 h sequence. 2. A spend equals ticking to it. 3. A clock set back changes no remaining time, and set back then forward gives no free time. 4. A full bank restarts the clock on a spend; a part-full bank keeps its progress. 5. A resting hunter can still take a contract; a hunter on a contract is not eligible. 6. Locked check-ins never count toward the bank-full badge.

- [x] **T9.4 — Content: Great Beasts, quarries, hunts and the legendary hunters** *(content/)*
  - **Also apply the three use-skill rows to GDD §8.5b** (Torch Held High, Take the Eye, Sit the Vigil; text in `flesh-out/v0.9/OUT-2a`, Part E). They were held back from the docs commit because `tests/content/v08-content.test.ts` counts the §8.5b rows against the code, so they go in with the content and an updated test (like OUT-2b with T9.2).
  - The rows of GDD §8.13, §8.14, §8.5 (three hunters, three traits) and §8.5b (three use-skills): stats, resistances, abilities, "What it was" lines and hunter's-notebook lines, the nine tracks and restrictions, the unlock lines, placeholder sprites with the manifest fallback.
  - *Acceptance:* 1. Every track has at least 4 legal hunters among the starting eleven. 2. Every Great Beast and quarry has a resistance row, a "What it was" and a notebook line. 3. No required name or bestiary entry is event-only. 4. The Act VI Names column is #1–3. 5. The names are in `tests/content/names.ts`, or the task is `[?]` (see the box).

- [x] **T9.5 — The fight engine for events** *(core/systems/combat)*
  - A boss as a `MonsterInstance` with Health equal to the pool at launch, scaled by the visit's tier (an optional field on the monster record); family for oils, traits and banes (D369); no location traits; the three use-skills and traits; the new effects of box item 4, with the Hold the Stair → Sit the Vigil order (Arvid's moved hit first); snapshots carry the new fields only when present.
  - *Acceptance:* 1. Every golden fight replays line for line, and every recorded fight and stand keeps its result (**stop and ask otherwise**). 2. Sit the Vigil works once per fight and only for another hunter. 3. The pool never rises. 4. `rulesVersion` stays 5. 5. Each new effect has a test.

- [x] **T9.6 — Boss attempts** *(core/systems/boss.ts, commands)*
  - `boss.attempt`: eligibility, one token, rest, seeded fight, net damage to the pool, milestones paid once per visit and in order, silver (not bounty silver), reagents, the kill item (the loot rules, Stores cap, salvage), hunter XP, the next visit after a kill, the visit tier fixed at the first attempt, the second pass one tier higher, `last` result, `recent` fight refs (kept `events.recentKeep`).
  - *Acceptance:* 1. The seeded fight replays. 2. The same inputs twice give the same pool. 3. The tier does not change on a Rank-up mid-visit. 4. A kill starts the next visit. 5. An attempt that crosses two milestones pays both. 6. A Long Night keeps the visit. 7. No Embers or trophies are paid. 8. Event wins touch no contract counter (D387).

- [x] **T9.7 — Boss preview and Suggest for events** *(odds worker)*
  - The expected-damage preview (100 practice fights, `boss.previewSamples`) with Why?; Suggest for events with shared dice and a stop rule (first party that clears a damage floor).
  - **Performance budgets (proposals; measure first, then ask the owner to set them as §6.5 rows):** the preview inside the existing odds-worker budget scaled by its sample count; Suggest for a boss within a stated time on the reference phone, with up to 14 eligible hunters.
  - *Acceptance:* 1. The preview's range holds the real result about as often as it says. 2. The measured timings are in the progress entry and proposed as §6.5 rows. 3. Suggest never picks an ineligible hunter.

- [x] **T9.8 — Hunts** *(core/systems/hunt.ts, commands)*
  - `hunt.attempt`: the track's restriction, one token, rest, the fight at the track's tier, no location traits, win and loss points, XP, carry-over, the unlock at `hunt.unlockPoints`, replays (XP and one reagent, no points).
  - **Arrival (D362, D386):** the legendary hunter joins free, active or reserve, at the highest level within the Rank's cap, wearing first-tier Common pieces made for them; a **Wright if the level is 5 or more, else an Apprentice**; hidden from the Hunters tab until unlocked.
  - *Acceptance:* 1. A restriction admits exactly the legal hunters. 2. Points cap at the total. 3. The unlock happens once. 4. An unlocked hunt pays no points. 5. A Long Night keeps points and unlocked hunts. 6. The odds panel matches the real win rate (§6.3 #5 pattern). 7. Arrival at level 4 gives an Apprentice; at level 5 a Wright.

- [x] **T9.9 — The Dross-Tide in the Last Stand** *(core/systems/stand)*
  - `standPool` set when the wave list is fixed (`dross` if Act VI has begun in the save); the wave pool adds the Dross-Tide for `dross` with no wave guaranteed; shown by name; stand kills count nowhere; the preview uses the same pool.
  - *Acceptance:* 1. **Every `base` stand replays exactly as before.** 2. A `dross` stand differs only by the Dross-Tide. 3. No bestiary entry, knowledge level or drop appears from it. 4. A save that begins Act VI after its pool was fixed keeps `base`. 5. **Stop and ask if any recorded stand changes its result.**

- [x] **T9.10 — Act VI machinery** *(core/story)*
  - Act VI starts with the next warden or on load (D246); the condition "Act VI begins"; the Rank, village and "nth contract" conditions with the Act VI documents; the Rime type; the arrival lines; the away-sheet Rime line; the Accounts event "What the cold wants" and the added lines; after Act VI the cycles carry no act.
  - *Acceptance:* 1. A save in a story-less cycle starts Act VI on load with fresh counters. 2. A save in Act V's cycle reaches it with the next warden. 3. D6-10 waits for Sigrun. 4. No ruin, family or Delve condition appears. 5. **No Act VI text beyond OUT-3 is written.**

- [x] **T9.11 — Act VI texts** *(content/story)*
  - The ten documents D6-01 to D6-10, Ilse's notes, the Accounts excerpts and the names #1–3, **word for word from OUT-3**.
  - *Acceptance:* 1. The Names column is exactly #1–3, each once. 2. None of the avoid-list words appears (*ash, cinder, kindle, hollow* other than Kozly Hollow, *tithe, bonfire, throne, souls*, "fed/feeding" as imagery). 3. No relative counts of years. 4. **No text says, asks for or begins the names.** 5. Every document found from its condition in a scripted run. 6. The Names view shows #1–3 correctly. 7. Content test: the texts match OUT-3 exactly.

- [x] **T9.12 — The Eventer policy and the events shard** *(sim/)*
  - `sim/policies/eventer.ts` (GDD §6.1): token spending, party choice, boss-or-hunt, track choice, never replays, locked check-ins ignored, runs until all content; `sim/shards.ts` gains the `events` shard; report fields.
  - *Acceptance:* 1. The Eventer plays a 3-cycle run in 60 s or less. 2. Standard, Light, Heavy, Opening and the Delver **issue no event commands**, and their reports **before Act VI equal the v0.8 baseline**. 3. Their baselines from cycle 6 are re-recorded once, and the 41 old rows re-judged on them. 4. The events shard stays within 5 min.

- [x] **T9.13 — Calibrate the pool and the hunt tunables** *(owner decision at the end)*
  - With the Eventer, and a **one-off measurement script that plays all nine tracks** with the best legal party (the Eventer plays only its preferred track), measure the median damage per attempt at tiers 4 and 5 and the nine win rates. Tune `hunt.*` and the Great Beast and quarry content values. **Propose `boss.poolBase` so a visit takes about 12 attempts, as a new decisions row.**
  - *Targets are proposals the owner approves with the row, not approved rows:* a first visit of about 9–15 attempts; a hunt unlock in about 6–8; track win rates of about 25–90%.
  - *Acceptance:* 1. A written report of the measured numbers is in the progress entry. 2. The proposed row is in `docs/decisions.md`. 3. The task stays `[?]` until the owner approves the pool row (Q29).

- [x] **T9.14 — Screens, part 1: the Events card, boss and party** *(ui/)*
  - GDD §9.17: the Events card, the badge (only while open), the one-time scene, the boss sheet, the party picker with reasons, preparation, the preview panel, the empty states.
  - *Acceptance:* 1. Every number has a breakdown. 2. A routine boss attempt takes 15 taps or fewer from the Hold screen. 3. The card reads correctly before the Citadel. 4. The layout works at 360 px and at the 900/1300 px breakpoints.

- [x] **T9.15 — Screens, part 2: playback, results, hunts and shelves** *(ui/)*
  - Playback with Skip and Log, the result sheets, the away-sheet full-bank line, the hunt list and track sheets with odds, the unlock sheet, the hunter sheet's rest line, the Great Beasts shelf, the Rime shelf and reader, the last result.
  - *Acceptance:* 1. A locked track shows its restriction and reason. 2. The unlock sheet says active or reserve correctly. 3. The Rime reader is pale text on a dark card. 4. A Great Beast is Identified on first fight and shows no levels. 5. An unlocked legendary hunter appears in the Hunters tab; a locked one does not.

- [x] **T9.16 — Art** *(assets/)* *(drawn in code at the owner's choice; art approved by the owner 2026-10-21)*
  - Battle sprites and portraits for the three hunters and six creatures, icons for the Rime shelf and tokens; the manifest fallback stays for anything missing. Owner supplies or approves the art.
  - *Acceptance:* every new entry has art or a manifest fallback; the owner has seen the placeholders and the real art.

- [x] **T9.17 — Simulator rows** *(sim/targets.ts, own commit; sim/checks/v09.ts)*
  - The owner-approved rows of GDD §6.2 (table below) and the two proposed (D383), **Act VI lands in its cycle** and **the Dross-Tide stand probe**. No existing stand row reaches Act VI cycles, so the probe is the check on those stands.
  - *Acceptance:* 1. All rows pass on the **median of the 5 Monday seeds**. 2. The old rows pass on the re-recorded baselines. 3. **If no reasonable tunable passes a row, stop and write it to `docs/questions.md`** (Q28).

- [x] **T9.18 — Tune and baseline** *(tunables only)*
  - Tuning commits start with `balance:` and include the report diff. A tunable moved by more than 2× gets a Proposed row. Do not run `sim:accept` until the owner passes the playtest (§0.3).
  - *Acceptance:* all simulator checks pass on 5 seeds; no `boss.*` constant changed except by an approved row.

- [x] **T9.19 — Smoke and the preview build** *(wrap-up)*
  - The Playwright smoke covers one boss attempt and one hunt attempt on the phone viewport; the preview build holds the finished milestone; `docs/progress.md` and `flesh-out/v0.9-summary.md` are current.
  - *Acceptance:* the preview build installs and opens the owner's save with events on.

#### Out of scope for v0.9

Orders rewards from events (v0.10); a boss shop or Boss marks; more bosses or hunts; letters for the legendary hunters; The Remembering and any ending (D24.10); Delve trophies or bestiary kills from events; event-only cosmetics and animation (v1.0); changing any `rulesVersion`.

#### Simulator rows (for the owner's approval; GDD §6.2)

| Row | Judged on | Threshold |
|---|---|---|
| First boss attempt | median of the 5 Monday seeds, Eventer | within 24 h of the Citadel |
| First boss defeated | same | by the end of the 7th cycle from the one events open in (D404; was the second) |
| First legendary hunter unlocked | same | by the end of the 6th cycle from the one events open in (D404; was the third) |
| Tokens not wasted | median of the 5 Monday seeds, Eventer | a full bank at no more than 35% of **unlocked** check-ins (D404; was 15%) |
| Silver check #6 with boss silver | median of the 5 Monday seeds | at least 70% of silver from bounties (boss silver counts in the total only) |
| *Proposed:* Act VI lands in its cycle | median, Standard | D6-01 to D6-06 by the end of cycle 6; D6-07 with the next warden; D6-08 to D6-10 reported only |
| *Proposed:* Dross-Tide stand probe | median, Standard | the Act VI-era stand reaches Held (12+ waves) and the preview range agrees |
| *Content test (not a row)* | — | no required content is event-only |

#### What to playtest *(owner checklist, at the end of the milestone)*

- **Your save's arrival:** nothing about your hunters, items or Legendary changed; the Events scene plays once; the bank starts at 0 and reads correctly. (Use the debug commands to fill it.)
- **The Events card:** easy to find on the Hold screen under the Rift card? Does the full-bank badge on the Hold tab help or nag?
- **A boss attempt:** is "who to spend on which attempt" a real choice? Does the preview agree with what happened? Is the playback worth watching, and is Skip enough?
- **Rest:** is it clear who is resting and when they're back? Does resting from events but still taking contracts feel right?
- **Milestones and the kill item:** do the rewards feel worth the rest?
- **A hunt:** are the restrictions clear? Is a loss worth a few points? Did unlocking a legendary hunter feel like an event?
- **The legendary hunters:** do their portraits, lines and use-skills feel distinct?
- **Act VI** (needs the next warden): the frost on the floor, the Rime shelf and reader, the three names, the three closing scenes, the testament. *You are in Act IV: use the debug command to start Act VI.*
- **The Dross-Tide** in an Act VI stand (late): named in the wave list when it appears; no wave is guaranteed.
- **Anything that felt like a chore.**

### v0.10 — Orders

**Status:** not started *(fleshed out 2026-10-21; decisions D407–D425; files in `docs/flesh-out/v0.10/`)*

**Scope:** the four Orders (Thanes' Moot, Grey Wives, Bell-Watchers, the Quenchers): standing from play already done (counted for all four from v10 on, with one capped backfill at the migration), four levels each, **limited seats** (two, and a third once two Orders are at level 4 and the Quenchers have come), seat changes free at a new warden and on a 24 h event-clock cooldown mid-cycle, a number perk and a story or knowledge perk per level (seated only), sixteen chapters (four per Order, two with two endings), four opening scenes, the Orders card, Order sheets and Library shelf, and **the Orderer** simulator player. **No silver, fight number or gate comes from an Order; `rulesVersion` stays 5.** The final act is **not** here: it is v0.11 (D415).

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v0.9 must be **merged to `main`, tagged `v0.9.0` and accepted** (`docs/progress.md` says it was, on 2026-10-21). Check that `git tag` lists `v0.9.0`, that `main` contains the v0.9 merge, and that `sim/baseline.json` is the accepted one. **If any of these is not so, stop and tell the owner. Do not branch from `milestone/v0.9`.**
1. **Branch.** Work on `milestone/v0.10`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v0.10`. Push after every task; the preview build follows this branch.
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the flesh-out files, and ask whether they have **read OUT-3 (the sixteen chapters, the four opening scenes and the perk texts) and the "readings made without asking" in the summary, and say yes.** **Do not apply the files or build anything until they answer yes** (or say which to change; then change the files first). When they say yes, add **D425** (OUT-1) with the date.
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**
   - copy the files into `docs/flesh-out/v0.10/` and the summary into `docs/flesh-out/v0.10-summary.md`;
   - OUT-1 rows → `docs/decisions.md` (**no old row is edited; the sweep is the single row D407**; D425 once the owner has said yes); OUT-2a → `docs/gdd.md` (**OUT-2b, the §7.12 table and the §7.4 pointer, waits for T10.2**); OUT-3 → `docs/lore-secrets.md` (§33 and the three small edits); OUT-4a → this plan, **except the §0.6 row (OUT-4b, T10.2)**; OUT-5 → `docs/questions.md`; OUT-9 → `docs/technical-design.md`;
   - **add two standing rules to `CLAUDE.md`:** *"Never seat an Order automatically; only the player's commands change `orders.seats`."* and *"Write the Orders texts word for word from `docs/lore-secrets.md` §33; invent none."*;
   - OUT-8 describes the save fixture for T10.1.
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.
   - [x] **Docs commit** (2026-10-21): flesh-out files applied.
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. Every row from **D358 to D406** found must be named in D407; every row from **D408** up is a new v0.10 row; rows below D358 belong to D385 and are not checked. **If any other row is found, list it in the progress entry and ask the owner; do not edit it.**
5. **Locked constants.** The `orders.*` keys in OUT-4b are locked (§0.6); build them at the values in GDD §7.12 and **never change one without an owner-approved decisions row.** Everything else in §7.12 is tunable. The weights, thresholds, `orders.triumphantChunk` and `orders.delveWeeklyCap` are **sketches** the Orderer measures (T10.17, T10.18).
6. **Determinism gates.** `rulesVersion` stays **5**. If **any golden fight changes, or any recorded fight or stand changes its result, stop and ask** (D308, D344 (1)). Orders add **no random stream** and **no fight formula**. Orders do touch `advance` (standing is added inside it; the Quenchers' Threat factor works over time), so a **time-away equivalence test** runs with the Quenchers seated (T10.7).
7. **The simulator.** Standard, Light, Heavy, Opening, the Delver and the Eventer **never seat an Order**; their reports **equal the v0.9 baseline** (standing accrues in their state but nothing reads it). Only the new **Orderer** seats. New rows go in `sim/targets.ts` in **their own commit, after the owner has approved them** (T10.18). **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows.
8. **Names.** The four Order names were searched on 2026-10-21 (OUT-6, Q34). Add them, the chapter and opening titles and the level names to `tests/content/names.ts` **with that date and the note from OUT-6**; the chapter and opening titles are plain phrases and were not individually searched. **A new proper noun not in OUT-6: search it against GDD §2.3, and on a collision stop and ask, with alternatives.** *(No new person name exists.)* `npm run check` stays green: every name the test needs is listed.
9. **Story rules.** Write **only the texts in OUT-3, word for word.** **No text says, asks for or begins the Sent's names** (D386, D423). Nothing required is Order-only: no name, document, bestiary entry or Legendary comes from an Order (lore §8).
10. **Stop and ask the owner** if no reasonable tunable passes a check, if a required name or document turns out Order-only, or if technical design Appendix 1 in the repo contradicts OUT-9. Never move a row or a locked constant.
11. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D407–D425, GDD §5.13, §7.12, `docs/flesh-out/v0.10-summary.md`.
- T10.1, T10.5, T10.6: technical design §5.2, §6.2, §7.2, §9.4. T10.3, T10.4: GDD §5.4, §5.6.3, §5.7, §5.8, §5.10, §5.9.3, §5.14. T10.7: GDD §5.4 step 4, §5.6.3, §5.7, §5.8.3, §5.9.1, §5.9.4 and §5.0. T10.8–T10.11: `lore-secrets.md` §14, §20, §33 and GDD §5.14. T10.13–T10.14: GDD §9.18, §9.14, §9.17. T10.17–T10.18: GDD §6.1–§6.3.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Read OUT-3 and the readings, and say yes, or say what to change (Claude Code waits) | OUT-3, summary |
| **Before T10.1** | Export your save from the live game (More → Save & Data → Export) now that v0.9 is live, and put it where Claude Code asks (if you skip this, T10.1 builds the fixture from your 2026-10-20 save, `v8-owner.json`, by running the shipped v8 → v9 migration) | OUT-8 |
| After T10.5 | Open the "Seat your Orders" step on the preview and check the seat lines read clearly | GDD §5.13.3, §5.13.4 |
| Before T10.18 commits the rows | Approve the simulator rows | GDD §6.2 |
| After T10.14 | Supply or approve the art: four order marks and the Orders icon, and placeholders for the four opening scenes | art notes in GDD §9.18 |
| At the end | Playtest (checklist below) | below |

#### Tasks

Each task is one Claude Code session; **most milestones finish in fewer sessions than tasks.** Tests come first for formulas, rules and saved data (§0.2). Every task ends with `npm run check` green and a short progress entry. Tick the box when its acceptance criteria all hold.

- [x] **T10.1 — Save v10: the `orders` state and the migration** *(core/save)*
  - Add `OrdersState` (technical design §5.2 as revised by OUT-9), validation, and the v9 → v10 migration (`save/migration-v10.ts`) with its **one-time backfill capped at `orders.backfillCapLevel`** (it uses the weights and thresholds from `balance.ts`; if T10.2 has not run, read them from GDD §7.12 as constants in the migration test and move them at T10.2).
  - **Before writing the backfill, write a table in the progress entry:** for each standing source (GDD §5.13.2), where the save holds it and whether it is recoverable. Anything not recoverable starts at 0 and the migration lists it by name in its warnings.
  - Fixtures: `tests/saves/fixtures/v9-owner.json` (OUT-8, **copied unchanged**) and `v10.json` (that save migrated, **not played**).
  - *Acceptance:*
    1. The fixture loads, migrates, validates and round-trips (save → load → equal).
    2. Every Order's `start` equals the independent recount of the sources, **capped at the level-1 threshold;** the migration adds no `opened` flag and queues no scene (that is T10.6).
    3. The warnings name every source the save could not recover.
    4. Unknown ids drop with a warning.
    5. **Every golden fight replays line for line; every recorded fight and stand keeps its result** (D344 (1)).
    6. The migration is measured on the fixture and the time is in the progress entry.

- [x] **T10.2 — Constants and the locked row** *(content/balance.ts, docs)*
  - Add GDD §7.12 (OUT-2b) and the §7.4 pointer; add every `orders.*` key to `balance.ts` and the constants test, with its locked or tunable mark; add the §0.6 row (OUT-4b) to this plan; move any constants T10.1 hard-coded.
  - *Acceptance:* 1. The constants test fails if a locked value changes. 2. `step × 4 ≤ orders.perkCeiling` is a test for all four perks. 3. No constant is written anywhere but `balance.ts`.

- [x] **T10.3 — Standing hooks, part 1: contracts, stands and Delves** *(core/systems/orders.ts)*
  - Per-source counts for **all four Orders from v10 on, opened or not.** Standing = `start` + Σ count × weight + Triumphant stands × chunk; level = the higher of the derived level and the saved high-water level. Hooks: a contract won (any village → Moot; Kozly Hollow → Quenchers), a **Triumphant** stand (to every Order), a Delve floor whose result paid at least 1 Riftglass (window `orders.delveWindow`, cap `orders.delveWeeklyCap`, on the event clock). Register Delve standing as a Delve reward with an idle source (Kozly Hollow contracts) in the Delve-optional content test (D20, D271).
  - *Acceptance:* 1. Each source adds exactly its weight once, including when it happens inside `advance` during a catch-up. 2. The Delve cap holds across a window; a floor in a Cold Comfort run, or one that paid nothing, adds nothing; a new window starts after `orders.delveWindow`. 3. A Triumphant stand adds the chunk to all four Orders. 4. Standing and level never drop, including after the weights are lowered in a test. 5. The Delve-optional test passes with the new reward listed. 6. **No existing result changes** (golden fights, recorded stands).

- [x] **T10.4 — Standing hooks, part 2: alchemy and the Archive; the Long Night** *(core/systems/orders.ts)*
  - Hooks: a brew finished, an experiment finished, a property revealed (Grey Wives); a document, a hunter letter and a name found (Bell-Watchers). The Long Night keeps counts, `start`, flags and the high-water level. A boss attempt and a hunt add nothing.
  - *Acceptance:* 1. Each source adds exactly its weight once. 2. The Long Night keeps everything. 3. Events add nothing (a test over a boss attempt and a hunt). 4. **No existing result changes.**

- [x] **T10.5 — Seats, the third seat and swaps** *(core/systems/orders.ts, commands)*
  - Commands `orders.seat`, `orders.unseat`, `orders.swap`, `orders.setSeats` (the new-warden step), per OUT-9; two seats at the start, the third seat per D412; the 24 h cooldown on `eventNow`; the cooldown clears at a new warden; seating into a free seat at an Order's opening does not start the cooldown.
  - *Acceptance:* 1. Seats never exceed two before the third opens, three after. 2. **The third seat opens exactly once whichever condition comes last, and a test covers every order of events:** level 4 reached, then the Quenchers open; the Quenchers open, then level 4; two Orders already at level 4 when a save loads and the Quenchers open in the catch-up. 3. A change inside the cooldown is refused with the time left. 4. A rewound device clock gives no free change. 5. The new-warden step changes seats with no cooldown and carries previous seats over by default. 6. Unseating loses no standing, level or chapter.

- [ ] **T10.6 — Opening the Orders and the load path** *(core/story, core/save)*
  - `openOrders(state, now)`: the four triggers (first Keep, first Alchemist's Hut, Ilse's arrival, D5-08 found), each once and for good; the opening scene queued (`openingQueue`); the one-time `seatStepPending` for a migrated save; the third-seat check; **the load order: migrate, catch up, open Orders, check the third seat.** An opening scene's button is "Seat it" only if a seat is free, else "Continue"; **nothing seats itself** (D422).
  - *Acceptance:* 1. Each opens exactly once, at its trigger or on load for a save already past it, **in a table-driven test where the expected openings are worked out from the fixture itself,** not hard-coded for one act. 2. The Quenchers cannot open before D5-08, and a D5-08 found during a catch-up opens them on that load. 3. A new game opens the Moot at the first Keep with no Sending, Deep or "onward" word on screen. 4. No save is seated by a load, an opening or a migration. 5. A contract that finishes in the catch-up is counted once.

- [ ] **T10.7 — The number perks** *(core/systems)*
  - Four named factors: contract provisions food (§5.4 step 4), brew and experiment time (§5.7, §5.8.3; fixed when queued), clue time (§5.6.3; fixed when started), the hourly Threat rate (§5.9.1). Each is its own breakdown line, applied after the buckets, **seated only.** The stand preview uses the seated factor and recomputes at a seat change.
  - *Acceptance:* 1. With no Order seated every result equals v0.9 exactly (a replay test over the fixtures). 2. Each factor equals `1 − step × level`. 3. A brew or experiment already queued, a clue already running and a launched contract keep what they started with. 4. The Threat factor touches only the hourly Rank rate, not Threat from failed contracts. 5. **A time-away equivalence test with the Quenchers seated:** one long `advance` equals many short ones. 6. **No fight formula or `rulesVersion` changes; every golden fight replays line for line.** 7. Each perk shows its breakdown line and disappears when the Order is unseated. 8. The preview's "tomorrow" estimate changes when a seat changes.

- [ ] **T10.8 — Chapters** *(core/story/orders)*
  - **Playable** chapters are worked out from the state (no stored queue): the Order is open and seated, level ≥ the chapter's number, the previous chapter is read, and its condition holds (OUT-3 Part B, including the two holds); order Moot, Grey Wives, Bell-Watchers, Quenchers, then chapter number. `orders.readChapter(order)` reads that Order's next chapter. The variant for the Moot's and Quenchers' chapter 4; the seated set recorded per chapter in the fixed order (D419); the Library shelf entries.
  - *Acceptance:* 1. An unseated Order's due chapter waits and plays when seated, and does not block another Order's. 2. Chapter 4 of the Moot waits until the Quenchers have opened, then plays variant A only if they are seated then, else B; the same for the Quenchers. 3. A chapter plays once; reading again is from the Library and changes nothing. 4. The recorded seats equal the seats at the reading. 5. No chapter adds a name, document, bestiary entry or Legendary. 6. A chapter that becomes playable without any command (a weight raised in tuning, then a load) is still found. 7. The migrated fixture, once seated, plays its chapters one at a time and not more than level 1 allows.

- [ ] **T10.9 — The texts, part 1: the test harness, the Moot and the Grey Wives** *(content/story)*
  - The Part F harness (OUT-3: the automated checks), then the eight Moot and Grey Wives chapters, the Moot's and Grey Wives' opening scenes, E1 and E2 (including the elder's notes), **word for word from OUT-3.**
  - *Acceptance:* 1. The harness passes on these texts and **fails on a planted bad text** for each automated check (forbidden word, relative year, a roll name, an unknown person, an opening-scene word). 2. The texts equal OUT-3. 3. E2's hints are encoded as `{brew, claim}` and match GDD §8.6.

- [ ] **T10.10 — The texts, part 2: the Bell-Watchers and the Quenchers; names** *(content/story, tests)*
  - The eight Bell-Watchers and Quenchers chapters, their two opening scenes, E3 (the rule, with a generator and the fallback remarks) and E4. Add the Order names, titles and level names to `tests/content/names.ts` with the OUT-6 date and notes.
  - *Acceptance:* 1. The harness passes on all texts. 2. E3's generated sentences equal the table for the full groups and for fixtures with one, two and all-but-one names found. 3. Every E4 excerpt is a substring of its chapter. 4. The names test is green. 5. **No text says, asks for or begins the names** (the phrase and name checks).

- [ ] **T10.11 — Where the perk texts show** *(ui and core/story)*
  - The heads' lines at the end of notices and the Villages panel's "What the heads say about you" (Moot); the Book hint or elder's note (Grey Wives); the Names view's extra sentence or remark (Bell-Watchers); the Accounts addition (Quenchers). All **seated only.**
  - *Acceptance:* 1. Each shows only while its Order is seated and at or above its level. 2. The Names sentence appears only for names still missing, equals the rule's output, and a remark appears when the group is found. 3. The Accounts addition appears only once "What the hearth leaves" exists in the save. 4. The Book hint appears while its brew is unknown, the elder's note once it is known. 5. An unseated Order shows none.

- [ ] **T10.12 — Debug commands** *(debug panel)*
  - `orders.open <order>`, `orders.addStanding <order> <n>`, `orders.setLevel <order> <n>`, `orders.openThird`, `orders.clearCooldown`, `orders.playChapter <order> <n>`, `orders.reset`. Debug builds and the debug panel only; they set `debugUsed`.
  - *Acceptance:* 1. Each command works from the panel and is covered by a test. 2. None is reachable in a normal build without the debug panel.

- [ ] **T10.13 — Screens, part 1: the card, the badge and the seat step** *(ui/)*
  - GDD §9.18: the Orders card and its position, the combined Hold-tab badge, the "Seat your Orders" step (new-warden sheet and the load sheet), the seat and cooldown lines, the opening scene's buttons.
  - *Acceptance:* 1. The card is hidden before any Order opens, and sits after the Events card, or after the last card when there is none. 2. The seat lines read exactly as in GDD §5.13.3 in all four states (third closed or open; with or without an Order in a seat). 3. The cooldown reads "Can change in 9 h 20 m" and counts down. 4. A routine seat change takes 6 taps or fewer from the Hold screen. 5. A Playwright check at 360, 900 and 1300 px finds no sideways scroll (`scrollWidth ≤ innerWidth`) with the card and the step open. 6. The badge is shown exactly while a chapter is playable or an Order with a due chapter is unseated (a state test), and not otherwise.

- [ ] **T10.14 — Screens, part 2: Order sheets, chapters and the shelf** *(ui/)*
  - The Order sheet (breakdown, "Brought from before the Orders", levels and perks, chapters with why they wait, Seat/Unseat/Swap), the chapter scene sheet with its variant and Close/Next, the Library's Orders shelf with the "read with …" line, the Villages panel entry.
  - *Acceptance:* 1. Every number has a breakdown. 2. The current level's perk shows as the real number, and the Quenchers' line says "easier waves, smaller Embers". 3. A waiting chapter reads "A chapter waits for a seat." and says what it waits for. 4. The shelf appears only after the first chapter is read. 5. Unseating shows "You keep your standing and chapters." 6. No sideways scroll at 360, 900 and 1300 px.

- [ ] **T10.15 — Art** *(assets/)*
  - Four order marks and an Orders icon, and placeholders for the four opening scenes; the manifest fallback stays for anything missing. Owner supplies or approves.
  - *Acceptance:* every new entry has art or a manifest fallback; the owner has seen the placeholders and the real art.

- [ ] **T10.16 — A scripted full run, the played fixture and the smoke** *(tests)*
  - A deterministic test from the migrated fixture to every chapter read (using the debug commands), writing `tests/saves/fixtures/v10-played.json` (that save played 72 h under a fixed seed); the Playwright smoke steps for one seat change and one chapter on the phone viewport.
  - *Acceptance:* 1. The scripted run reads all sixteen chapters in order with the right variants. 2. The smoke passes on the phone viewport. 3. The run is repeatable (same seed, same state).

- [ ] **T10.17 — The Orderer policy and its shard** *(sim/)*
  - `sim/policies/orderer.ts` (GDD §6.1), `sim/shards.ts` gains the `orders` shard (Monday seeds only), report fields (first-open times, chapter-1 times, level times, chapter times, the shares, the stand results with the perk on and off, Embers per stand).
  - *Acceptance:* 1. The Orderer plays a 3-cycle run in 60 s or less. 2. Standard, Light, Heavy, Opening, the Delver and the Eventer **never seat an Order** and their reports equal the v0.9 baseline. 3. The orders shard stays within 5 min. 4. The Orderer taps "Seat it" at an opening when a seat is free, takes the third seat the moment it opens, never swaps mid-cycle, and its Delve runs exercise the Delve source and its window.

- [ ] **T10.18 — Simulator rows** *(sim/targets.ts, own commit; sim/checks/v010.ts)*
  - The six owner-approved rows of GDD §6.2 (table below). Measure first with the sketches; if a row fails, tune **only tunables** (the failing Order's thresholds and weights first; the Triumphant chunk last, since it moves every Order) and re-measure.
  - *Acceptance:* 1. All rows pass on the **median of the 5 Monday seeds.** 2. The old rows pass on the old baselines, unchanged. 3. **If no reasonable tunable passes a row, stop and write it to `docs/questions.md`.** 4. The stand-rows row reports Embers per stand with and without the Quenchers' perk.

- [ ] **T10.19 — Tune, smoke and the preview build** *(tunables only, wrap-up)*
  - Tuning commits start with `balance:` and include the report diff. A tunable moved by more than 2× gets a Proposed row. Do not run `sim:accept` until the owner passes the playtest (§0.3). The preview build holds the finished milestone; `docs/progress.md` and `flesh-out/v0.10-summary.md` are current. Measure the proposed performance budgets and ask the owner to set them as §6.5 rows.
  - *Acceptance:* 1. All simulator checks pass on 5 seeds. 2. No locked constant changed except by an approved row. 3. The preview build installs and opens a fresh copy of `v10.json` with the Orders opened by the load path; **the owner's own save is not assumed to still hold its scenes (they may have been seen on an earlier preview).** 4. The measured timings are in the progress entry.

#### Out of scope for v0.10

The Remembering and any ending (v0.11, D415); any silver, fight or gate effect from an Order; events adding standing; a seat cost or fee; a fifth Order; new names or lore beyond OUT-3; Order-only required content; achievements; changing any `rulesVersion`.

#### Simulator rows *(for the owner's approval; GDD §6.2)*

| Row | Judged on | Threshold |
|---|---|---|
| First chapter in time | median of the 5 Monday seeds, Orderer | chapter 1 of each Order plays within 24 h of its Order opening |
| Every Order reaches level 4 | same | by the end of cycle 6 |
| All 16 chapters have played | same | by the end of cycle 8 |
| Silver check #6 with Orders | same | at least 70% of silver from bounties |
| Provisions share with the Moot perk | same | in 20–40% |
| Stand rows with the Quenchers perk | same | "Best Last Stand timing", "First Long Night", "Act VI lands in its cycle" and the Dross-Tide probe still pass |
| *Content test (not a row)* | — | no required content is Order-only; the texts equal OUT-3 |

#### What to playtest *(owner checklist, at the end of the milestone)*

- **Your save's arrival:** the Moot, Grey Wives and Bell-Watchers open one at a time with their scenes; the "Seat your Orders" sheet appears once; each Order starts at the bottom (level 1) with a "brought from before" line; nothing about hunters, items, Legendary, events or the story changed. Does the starting level feel fair for what you have done? (Use the debug commands to move it.)
- **The Orders card:** easy to find? Does the badge help or nag? Are the seat lines clear?
- **Choosing seats:** is it a real choice? Is the cooldown clear ("Can change in …")? Did it feel bad to unseat anything?
- **The perks:** can you see each number where it acts (provisions, brews, clues, Threat)? Do the story perks (heads' lines, the Book hint or elder's note, the Names sentence or remark, the Accounts voices) feel worth having? **Do the Grey Wives' and Bell-Watchers' perks still matter once your Book is full and your names are found?**
- **The Quenchers' trade:** does "easier waves, smaller Embers" read clearly, and would you seat them?
- **The chapters:** do they read as people, not a quest log? Is the wrongness quiet enough? Does waiting for a seat feel fair?
- **The two endings:** with both the Moot and the Quenchers seated, and with only one, do the last chapters feel different? (Use the debug commands; in a real game the Moot's chapter 4 waits for the Quenchers.)
- **The Library's Orders shelf:** easy to re-read?
- **Looks wrong on my phone:** send screenshots.
- **Anything that felt like a chore.**

---

### v0.11 — The Remembering *(outline only; needs its own flesh-out, §0.4)*

**Status:** not started *(needs a flesh-out)* *(D415)*

- **Scope:** The Remembering and the ending of the story; the Act VI closing line "The story continues in a later version" is removed.
- **Reads from v0.10:** which Orders were seated when each chapter was read (D419), each Order's level, the opening threshold of each chapter 4.
- **Rules carried in:** nobody says, asks for or begins the Sent's names before The Remembering (D386); the 40 names are all findable without an Order (lore §8); the Quenchers give the final choice a stake in the present (lore §14).
- **Open questions for its flesh-out:** the shape of the ending(s); how seated Orders change what the player hears; whether anything of The Remembering needs a save at all.

---

### v1.0 — Polish

**Status:** not started *(needs a flesh-out)*

- **Scope:** an art and UX pass; a full balance pass; achievements (a candidate). Endings moved to v0.11 (D415).

---

## Judgment calls in the implementation plan (revised)

1. **One branch per milestone, played on the preview build;** merge and tag only after the owner's go-ahead.
2. **The locked constants list** in §0.6, including the valuation weights.
3. **Sizing:** a task fits one session, and most sessions finish 2–4 tasks. Estimates: v0.1 12–16, v0.2 12–16, v0.3 8–12 sessions.
4. **The pack list** is delivered as `art-src/PACKS-NEEDED.md`, one session ahead.
5. **The seeded golden fights** recorded in T2.9 become locked fixtures.
6. **Only one preview exists at a time:** the most recently pushed milestone branch.
7. **Citadel and Bastion ship in v0.4 with neutral text;** their inscriptions arrive in v0.5.
8. **v0.5 is 17 tasks over 12–16 sessions;** T5.1 may split into mechanics and story content.
9. **Arvid ships in v0.5 but can't arrive until Act III is written;** a debug action tests him.
10. **v0.6 is 14 tasks (T6.1–T6.13, with T6.9 in two parts) over 10–14 sessions;** T6.1 may split into mechanics and story content.
11. **v0.7 is 17 tasks (T7.1–T7.16, T7.13 in two parts) over 13–17 sessions;** Act IV is the first task; the battle-sprite contact sheet goes to the owner one session before the Delve screens.
12. **v0.8 is 19 tasks (T8.1–T8.18, T8.13 in two parts) over 15–19 sessions;** Act V is the first task; the simulator splits into parallel CI jobs with a 5-minute limit per job (D320).
13. **v0.9:** Claude's readings the owner approved or may change are D369 and D387 (events: attendance, families, new combat effects and their order, event wins versus contract counters, silver, clock, performance, empty states, renames); the owner's rulings are D386. The `boss.*` numbers are sketches; the pool is returned as a row at T9.13.
