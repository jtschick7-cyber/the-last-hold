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
| Hunter depth | `stores.cap`, `star.max`, `keepsake.slots`, `talent.points`, `talent.tierStars`, `rank.wrightLevel`, `rank.masterLevel`, `yard.capRank` (D325) |

*The `hunt.*` constants (`hunt.unlockPoints`, `hunt.trackPoints`, `hunt.trackTiers`, `hunt.xpPerTier`, `hunt.lossXpShare`, `hunt.replayReagents`, D380) are **tunable.** `boss.poolBase` starts as a sketch and is replaced only by a decisions row the owner approves (T9.13).*

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

Estimates, not commitments. If a task proves bigger than a session, split it here first.

**Actuals [JC].** Counted from `docs/progress.md` (one entry ≈ one session; flesh-out and planning entries excluded). Entries overcount real sessions, because several early milestones were written up task by task within one day, so read these as upper bounds: v0.0 2, v0.1 17, v0.2 6, v0.3 6, v0.4 15, v0.5 7, v0.6 5 (3 numbered build sessions), v0.7 8 (4 numbered build sessions). Every milestone from v0.2 on came in under its estimate except v0.4 (15 entries against 10–14), and v0.4's entries were mostly one per task. The v0.8 flesh-out sets the estimates for v0.8 and later from these actuals. v0.8 9 (4 numbered build sessions).

*Sizing note (v0.9 flesh-out):* v0.6 took 5 entries for 14 tasks and v0.7 took 8 for 17 (about half an entry a task), v0.8 estimated 15–19 for 19 tasks. v0.9 has 19 tasks but less new machinery than v0.8 (no new item system; a few new combat effects that appear only in event fights) and more content (Act VI's ten texts, nine content rows). Estimated 10–15 sessions. **v0.8's actual count, added at the v0.9 docs commit from `docs/progress.md` and its archive:** 9 entries over 4 numbered build sessions (the docs-only entry excluded), against 15–19 estimated. That is well under the estimate, so 10–15 for v0.9 is likely an upper bound; the estimate is left as the flesh-out set it, and the owner can lower it.

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

**Status:** not started *(fleshed out 2026-10-20, revised after an independent review; decisions D357–D387; files in `docs/flesh-out/v0.9/`)*

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

- [ ] **T9.8 — Hunts** *(core/systems/hunt.ts, commands)* `[ ]`
  - `hunt.attempt`: the track's restriction, one token, rest, the fight at the track's tier, no location traits, win and loss points, XP, carry-over, the unlock at `hunt.unlockPoints`, replays (XP and one reagent, no points).
  - **Arrival (D362, D386):** the legendary hunter joins free, active or reserve, at the highest level within the Rank's cap, wearing first-tier Common pieces made for them; a **Wright if the level is 5 or more, else an Apprentice**; hidden from the Hunters tab until unlocked.
  - *Acceptance:* 1. A restriction admits exactly the legal hunters. 2. Points cap at the total. 3. The unlock happens once. 4. An unlocked hunt pays no points. 5. A Long Night keeps points and unlocked hunts. 6. The odds panel matches the real win rate (§6.3 #5 pattern). 7. Arrival at level 4 gives an Apprentice; at level 5 a Wright.

- [ ] **T9.9 — The Dross-Tide in the Last Stand** *(core/systems/stand)*
  - `standPool` set when the wave list is fixed (`dross` if Act VI has begun in the save); the wave pool adds the Dross-Tide for `dross` with no wave guaranteed; shown by name; stand kills count nowhere; the preview uses the same pool.
  - *Acceptance:* 1. **Every `base` stand replays exactly as before.** 2. A `dross` stand differs only by the Dross-Tide. 3. No bestiary entry, knowledge level or drop appears from it. 4. A save that begins Act VI after its pool was fixed keeps `base`. 5. **Stop and ask if any recorded stand changes its result.**

- [ ] **T9.10 — Act VI machinery** *(core/story)*
  - Act VI starts with the next warden or on load (D246); the condition "Act VI begins"; the Rank, village and "nth contract" conditions with the Act VI documents; the Rime type; the arrival lines; the away-sheet Rime line; the Accounts event "What the cold wants" and the added lines; after Act VI the cycles carry no act.
  - *Acceptance:* 1. A save in a story-less cycle starts Act VI on load with fresh counters. 2. A save in Act V's cycle reaches it with the next warden. 3. D6-10 waits for Sigrun. 4. No ruin, family or Delve condition appears. 5. **No Act VI text beyond OUT-3 is written.**

- [ ] **T9.11 — Act VI texts** *(content/story)*
  - The ten documents D6-01 to D6-10, Ilse's notes, the Accounts excerpts and the names #1–3, **word for word from OUT-3**.
  - *Acceptance:* 1. The Names column is exactly #1–3, each once. 2. None of the avoid-list words appears (*ash, cinder, kindle, hollow* other than Kozly Hollow, *tithe, bonfire, throne, souls*, "fed/feeding" as imagery). 3. No relative counts of years. 4. **No text says, asks for or begins the names.** 5. Every document found from its condition in a scripted run. 6. The Names view shows #1–3 correctly. 7. Content test: the texts match OUT-3 exactly.

- [ ] **T9.12 — The Eventer policy and the events shard** *(sim/)*
  - `sim/policies/eventer.ts` (GDD §6.1): token spending, party choice, boss-or-hunt, track choice, never replays, locked check-ins ignored, runs until all content; `sim/shards.ts` gains the `events` shard; report fields.
  - *Acceptance:* 1. The Eventer plays a 3-cycle run in 60 s or less. 2. Standard, Light, Heavy, Opening and the Delver **issue no event commands**, and their reports **before Act VI equal the v0.8 baseline**. 3. Their baselines from cycle 6 are re-recorded once, and the 41 old rows re-judged on them. 4. The events shard stays within 5 min.

- [ ] **T9.13 — Calibrate the pool and the hunt tunables** `[?]` *(owner decision at the end)*
  - With the Eventer, and a **one-off measurement script that plays all nine tracks** with the best legal party (the Eventer plays only its preferred track), measure the median damage per attempt at tiers 4 and 5 and the nine win rates. Tune `hunt.*` and the Great Beast and quarry content values. **Propose `boss.poolBase` so a visit takes about 12 attempts, as a new decisions row.**
  - *Targets are proposals the owner approves with the row, not approved rows:* a first visit of about 9–15 attempts; a hunt unlock in about 6–8; track win rates of about 25–90%.
  - *Acceptance:* 1. A written report of the measured numbers is in the progress entry. 2. The proposed row is in `docs/decisions.md`. 3. The task stays `[?]` until the owner approves the pool row (Q29).

- [ ] **T9.14 — Screens, part 1: the Events card, boss and party** *(ui/)*
  - GDD §9.17: the Events card, the badge (only while open), the one-time scene, the boss sheet, the party picker with reasons, preparation, the preview panel, the empty states.
  - *Acceptance:* 1. Every number has a breakdown. 2. A routine boss attempt takes 15 taps or fewer from the Hold screen. 3. The card reads correctly before the Citadel. 4. The layout works at 360 px and at the 900/1300 px breakpoints.

- [ ] **T9.15 — Screens, part 2: playback, results, hunts and shelves** *(ui/)*
  - Playback with Skip and Log, the result sheets, the away-sheet full-bank line, the hunt list and track sheets with odds, the unlock sheet, the hunter sheet's rest line, the Great Beasts shelf, the Rime shelf and reader, the last result.
  - *Acceptance:* 1. A locked track shows its restriction and reason. 2. The unlock sheet says active or reserve correctly. 3. The Rime reader is pale text on a dark card. 4. A Great Beast is Identified on first fight and shows no levels. 5. An unlocked legendary hunter appears in the Hunters tab; a locked one does not.

- [ ] **T9.16 — Art** *(assets/)* `[?]`
  - Battle sprites and portraits for the three hunters and six creatures, icons for the Rime shelf and tokens; the manifest fallback stays for anything missing. Owner supplies or approves the art.
  - *Acceptance:* every new entry has art or a manifest fallback; the owner has seen the placeholders and the real art.

- [ ] **T9.17 — Simulator rows** `[?]` *(sim/targets.ts, own commit; sim/checks/v09.ts)*
  - The owner-approved rows of GDD §6.2 (table below) and the two proposed (D383), **Act VI lands in its cycle** and **the Dross-Tide stand probe**. No existing stand row reaches Act VI cycles, so the probe is the check on those stands.
  - *Acceptance:* 1. All rows pass on the **median of the 5 Monday seeds**. 2. The old rows pass on the re-recorded baselines. 3. **If no reasonable tunable passes a row, stop and write it to `docs/questions.md`** (Q28).

- [ ] **T9.18 — Tune and baseline** *(tunables only)*
  - Tuning commits start with `balance:` and include the report diff. A tunable moved by more than 2× gets a Proposed row. Do not run `sim:accept` until the owner passes the playtest (§0.3).
  - *Acceptance:* all simulator checks pass on 5 seeds; no `boss.*` constant changed except by an approved row.

- [ ] **T9.19 — Smoke and the preview build** *(wrap-up)*
  - The Playwright smoke covers one boss attempt and one hunt attempt on the phone viewport; the preview build holds the finished milestone; `docs/progress.md` and `flesh-out/v0.9-summary.md` are current.
  - *Acceptance:* the preview build installs and opens the owner's save with events on.

#### Out of scope for v0.9

Orders rewards from events (v0.10); a boss shop or Boss marks; more bosses or hunts; letters for the legendary hunters; The Remembering and any ending (D24.10); Delve trophies or bestiary kills from events; event-only cosmetics and animation (v1.0); changing any `rulesVersion`.

#### Simulator rows (for the owner's approval; GDD §6.2)

| Row | Judged on | Threshold |
|---|---|---|
| First boss attempt | median of the 5 Monday seeds, Eventer | within 24 h of the Citadel |
| First boss defeated | same | by the end of the second cycle after events open (the opening cycle is cycle 1) |
| First legendary hunter unlocked | same | by the end of the third cycle after events open (the opening cycle is cycle 1) |
| Tokens not wasted | median of the 5 Monday seeds, Eventer | a full bank at no more than 15% of **unlocked** check-ins (Q28 if it fails) |
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

**Status:** not started *(needs a flesh-out)*

- **Scope:** the Thanes' Moot, Grey Wives, Bell-Watchers, and Quenchers; reputation and questlines.
- **Open question:** when the final act ships (D24.10) (still open after the v0.7 flesh-out, D279; still open after the v0.8 flesh-out). Act V's D5-08 seeds the Quenchers from Kozly Hollow.

### v1.0 — Polish

**Status:** not started *(needs a flesh-out)*

- **Scope:** an art and UX pass; a full balance pass; achievements (a candidate); endings, if the final act lands here.

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
