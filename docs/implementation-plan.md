# The Last Hold — Implementation Plan

**Status:** Revised after the plan review (D34–D36). Awaiting owner approval.
**Reads with:** `CLAUDE.md` (the workflow, definition of done, and owner gates live there, not here), `gdd.md` (what), `technical-design.md` (how), `decisions.md` (why).
**Depth:** v0.0–v1.2 are in full detail (v1.0 completed 2026-10-22, D472–D497; v1.1 completed 2026-10-23, D498–D518; v1.2 fleshed out 2026-10-23, D519–D528). v1.3–v1.5 are at outline level.
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
- **A cycle with no act** closes with nothing in that step (D455). Every act is written.

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
| v0.11 | 17 (T11.1–T11.17; T11.15 in two parts) | 9–12 |
| v1.0 | 15 (TV.1–TV.13; TV.3 and TV.4 in two parts; art batches split) | 14–18 (17–21 after D492: 63 pictures to redraw) |
| v1.1 | 15 (TL.1–TL.13, with TL.5 in 3 parts) | 12–16 |
| v1.2 | 12 (SF.1–SF.12) | 8–11 **[JC]** |

*Actual (v0.11):* 19 progress entries, one task per session (the plan's 9–12 assumed two small tasks a session).

*Sizing note (v0.11 flesh-out):* seventeen tasks, no combat machinery and no new system with rules beyond one derived gate and one small save block; the weight is in the texts, the screens and one new simulator row. The risks are the reachability cycle N (measured, so it passes by construction, but the owner must be willing to accept it) and the two stop-and-asks (the resident rotation and the Hearth Hall frost). **v0.10's actual count:** 20 progress entries (the docs-only entry excluded) over 3 numbered sessions, against 10–14 estimated.

*Sizing note (v1.0 flesh-out):* fifteen tasks, no game rules and no save change. v0.11 ran one task per session, and three art waits are in the middle, so the estimate is 14–18 sessions. The weight is in the art (three batches, each waiting for the owner) and in the accessibility sweeps. The risks are the art taste (mitigated by the contact sheets, the Keep test and the one-step revert), the text-size fit at 320 px, and a failing audit row.

*Actual (v1.0):* 17 progress entries (docs commit through milestone end, including 6 art-review passes).

*Sizing note (v1.1 flesh-out, revised after red-team review):* 15 tasks (TL.1–TL.13, with TL.5 in three parts), estimated at 12–16 sessions. No combat or economy rules change; the weight is in the 39-piece grid state/migration, the Arrange Hold tap-to-swap UI, and the ~75 new 32 px grid art assets split across TL.5a/b/c with one owner stop at TL.5c, plus TL.6 if any tile is marked Redraw.

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

**Status:** complete *(fleshed out 2026-10-21; decisions D407–D425; files in `docs/flesh-out/v0.10/`)*

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

- [x] **T10.6 — Opening the Orders and the load path** *(core/story, core/save)*
  - `openOrders(state, now)`: the four triggers (first Keep, first Alchemist's Hut, Ilse's arrival, D5-08 found), each once and for good; the opening scene queued (`openingQueue`); the one-time `seatStepPending` for a migrated save; the third-seat check; **the load order: migrate, catch up, open Orders, check the third seat.** An opening scene's button is "Seat it" only if a seat is free, else "Continue"; **nothing seats itself** (D422).
  - *Acceptance:* 1. Each opens exactly once, at its trigger or on load for a save already past it, **in a table-driven test where the expected openings are worked out from the fixture itself,** not hard-coded for one act. 2. The Quenchers cannot open before D5-08, and a D5-08 found during a catch-up opens them on that load. 3. A new game opens the Moot at the first Keep with no Sending, Deep or "onward" word on screen. 4. No save is seated by a load, an opening or a migration. 5. A contract that finishes in the catch-up is counted once.

- [x] **T10.7 — The number perks** *(core/systems)*
  - Four named factors: contract provisions food (§5.4 step 4), brew and experiment time (§5.7, §5.8.3; fixed when queued), clue time (§5.6.3; fixed when started), the hourly Threat rate (§5.9.1). Each is its own breakdown line, applied after the buckets, **seated only.** The stand preview uses the seated factor and recomputes at a seat change.
  - *Acceptance:* 1. With no Order seated every result equals v0.9 exactly (a replay test over the fixtures). 2. Each factor equals `1 − step × level`. 3. A brew or experiment already queued, a clue already running and a launched contract keep what they started with. 4. The Threat factor touches only the hourly Rank rate, not Threat from failed contracts. 5. **A time-away equivalence test with the Quenchers seated:** one long `advance` equals many short ones. 6. **No fight formula or `rulesVersion` changes; every golden fight replays line for line.** 7. Each perk shows its breakdown line and disappears when the Order is unseated. 8. The preview's "tomorrow" estimate changes when a seat changes.

- [x] **T10.8 — Chapters** *(core/story/orders)*
  - **Playable** chapters are worked out from the state (no stored queue): the Order is open and seated, level ≥ the chapter's number, the previous chapter is read, and its condition holds (OUT-3 Part B, including the two holds); order Moot, Grey Wives, Bell-Watchers, Quenchers, then chapter number. `orders.readChapter(order)` reads that Order's next chapter. The variant for the Moot's and Quenchers' chapter 4; the seated set recorded per chapter in the fixed order (D419); the Library shelf entries.
  - *Acceptance:* 1. An unseated Order's due chapter waits and plays when seated, and does not block another Order's. 2. Chapter 4 of the Moot waits until the Quenchers have opened, then plays variant A only if they are seated then, else B; the same for the Quenchers. 3. A chapter plays once; reading again is from the Library and changes nothing. 4. The recorded seats equal the seats at the reading. 5. No chapter adds a name, document, bestiary entry or Legendary. 6. A chapter that becomes playable without any command (a weight raised in tuning, then a load) is still found. 7. The migrated fixture, once seated, plays its chapters one at a time and not more than level 1 allows.

- [x] **T10.9 — The texts, part 1: the test harness, the Moot and the Grey Wives** *(content/story)*
  - The Part F harness (OUT-3: the automated checks), then the eight Moot and Grey Wives chapters, the Moot's and Grey Wives' opening scenes, E1 and E2 (including the elder's notes), **word for word from OUT-3.**
  - *Acceptance:* 1. The harness passes on these texts and **fails on a planted bad text** for each automated check (forbidden word, relative year, a roll name, an unknown person, an opening-scene word). 2. The texts equal OUT-3. 3. E2's hints are encoded as `{brew, claim}` and match GDD §8.6.

- [x] **T10.10 — The texts, part 2: the Bell-Watchers and the Quenchers; names** *(content/story, tests)*
  - The eight Bell-Watchers and Quenchers chapters, their two opening scenes, E3 (the rule, with a generator and the fallback remarks) and E4. Add the Order names, titles and level names to `tests/content/names.ts` with the OUT-6 date and notes.
  - *Acceptance:* 1. The harness passes on all texts. 2. E3's generated sentences equal the table for the full groups and for fixtures with one, two and all-but-one names found. 3. Every E4 excerpt is a substring of its chapter. 4. The names test is green. 5. **No text says, asks for or begins the names** (the phrase and name checks).

- [x] **T10.11 — Where the perk texts show** *(ui and core/story)*
  - The heads' lines at the end of notices and the Villages panel's "What the heads say about you" (Moot); the Book hint or elder's note (Grey Wives); the Names view's extra sentence or remark (Bell-Watchers); the Accounts addition (Quenchers). All **seated only.**
  - *Acceptance:* 1. Each shows only while its Order is seated and at or above its level. 2. The Names sentence appears only for names still missing, equals the rule's output, and a remark appears when the group is found. 3. The Accounts addition appears only once "What the hearth leaves" exists in the save. 4. The Book hint appears while its brew is unknown, the elder's note once it is known. 5. An unseated Order shows none.

- [x] **T10.12 — Debug commands** *(debug panel)*
  - `orders.open <order>`, `orders.addStanding <order> <n>`, `orders.setLevel <order> <n>`, `orders.openThird`, `orders.clearCooldown`, `orders.playChapter <order> <n>`, `orders.reset`. Debug builds and the debug panel only; they set `debugUsed`.
  - *Acceptance:* 1. Each command works from the panel and is covered by a test. 2. None is reachable in a normal build without the debug panel.

- [x] **T10.13 — Screens, part 1: the card, the badge and the seat step** *(ui/)*
  - GDD §9.18: the Orders card and its position, the combined Hold-tab badge, the "Seat your Orders" step (new-warden sheet and the load sheet), the seat and cooldown lines, the opening scene's buttons.
  - *Acceptance:* 1. The card is hidden before any Order opens, and sits after the Events card, or after the last card when there is none. 2. The seat lines read exactly as in GDD §5.13.3 in all four states (third closed or open; with or without an Order in a seat). 3. The cooldown reads "Can change in 9 h 20 m" and counts down. 4. A routine seat change takes 6 taps or fewer from the Hold screen. 5. A Playwright check at 360, 900 and 1300 px finds no sideways scroll (`scrollWidth ≤ innerWidth`) with the card and the step open. 6. The badge is shown exactly while a chapter is playable or an Order with a due chapter is unseated (a state test), and not otherwise.

- [x] **T10.14 — Screens, part 2: Order sheets, chapters and the shelf** *(ui/)*
  - The Order sheet (breakdown, "Brought from before the Orders", levels and perks, chapters with why they wait, Seat/Unseat/Swap), the chapter scene sheet with its variant and Close/Next, the Library's Orders shelf with the "read with …" line, the Villages panel entry.
  - *Acceptance:* 1. Every number has a breakdown. 2. The current level's perk shows as the real number, and the Quenchers' line says "easier waves, smaller Embers". 3. A waiting chapter reads "A chapter waits for a seat." and says what it waits for. 4. The shelf appears only after the first chapter is read. 5. Unseating shows "You keep your standing and chapters." 6. No sideways scroll at 360, 900 and 1300 px.

- [x] **T10.15 — Art** *(assets/)* *(approved by the owner, D434)*
  - Four order marks and an Orders icon, and placeholders for the four opening scenes; the manifest fallback stays for anything missing. Owner supplies or approves.
  - *Acceptance:* every new entry has art or a manifest fallback; the owner has seen the placeholders and the real art.

- [x] **T10.16 — A scripted full run, the played fixture and the smoke** *(tests)*
  - A deterministic test from the migrated fixture to every chapter read (using the debug commands), writing `tests/saves/fixtures/v10-played.json` (that save played 72 h under a fixed seed); the Playwright smoke steps for one seat change and one chapter on the phone viewport.
  - *Acceptance:* 1. The scripted run reads all sixteen chapters in order with the right variants. 2. The smoke passes on the phone viewport. 3. The run is repeatable (same seed, same state).

- [x] **T10.17 — The Orderer policy and its shard** *(sim/)*
  - `sim/policies/orderer.ts` (GDD §6.1), `sim/shards.ts` gains the `orders` shard (Monday seeds only), report fields (first-open times, chapter-1 times, level times, chapter times, the shares, the stand results with the perk on and off, Embers per stand).
  - *Acceptance:* 1. The Orderer plays a 3-cycle run in 60 s or less. 2. Standard, Light, Heavy, Opening, the Delver and the Eventer **never seat an Order** and their reports equal the v0.9 baseline. 3. The orders shard stays within 5 min. 4. The Orderer taps "Seat it" at an opening when a seat is free, takes the third seat the moment it opens, never swaps mid-cycle, and its Delve runs exercise the Delve source and its window.

- [x] **T10.18 — Simulator rows** *(sim/targets.ts, own commit; sim/checks/v010.ts)*
  - The six owner-approved rows of GDD §6.2 (table below). Measure first with the sketches; if a row fails, tune **only tunables** (the failing Order's thresholds and weights first; the Triumphant chunk last, since it moves every Order) and re-measure.
  - *Acceptance:* 1. All rows pass on the **median of the 5 Monday seeds.** 2. The old rows pass on the old baselines, unchanged. 3. **If no reasonable tunable passes a row, stop and write it to `docs/questions.md`.** 4. The stand-rows row reports Embers per stand with and without the Quenchers' perk.

- [x] **T10.19 — Tune, smoke and the preview build** *(tunables only, wrap-up)*
  - Tuning commits start with `balance:` and include the report diff. A tunable moved by more than 2× gets a Proposed row. Do not run `sim:accept` until the owner passes the playtest (§0.3). The preview build holds the finished milestone; `docs/progress.md` and `flesh-out/v0.10-summary.md` are current. Measure the proposed performance budgets and ask the owner to set them as §6.5 rows.
  - *Acceptance:* 1. All simulator checks pass on 5 seeds. 2. No locked constant changed except by an approved row. 3. The preview build installs and opens a fresh copy of `v10.json` with the Orders opened by the load path; **the owner's own save is not assumed to still hold its scenes (they may have been seen on an earlier preview).** 4. The measured timings are in the progress entry.

#### Out of scope for v0.10

The Remembering and any ending (v0.11, D415); any silver, fight or gate effect from an Order; events adding standing; a seat cost or fee; a fifth Order; new names or lore beyond OUT-3; Order-only required content; achievements; changing any `rulesVersion`.

#### Simulator rows *(for the owner's approval; GDD §6.2)*

| Row | Judged on | Threshold |
|---|---|---|
| First chapter in time | median of the 5 Monday seeds, Orderer | chapter 1 of each Order the Orderer seats at its opening plays within 24 h of its Order opening (D440) |
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

### v0.11 — The Remembering

**Status:** complete *(playtest passed 2026-10-21, D471; fleshed out 2026-10-21; decisions D446–D471; files in `docs/flesh-out/v0.11/`)*

**Scope:** the end of the story. The gate (all 40 names found and every contract species Studied, worked out each time, never stored); Pechko's near-scene and the quiet **Remembering card**; the choice **Remember Them** or **Keep the Vigil**; the automatic, skippable **reading of the 40 names**; the Unlit's answer; the Orders' lines in the ending (from what was read, D419); the Quenchers' lit window or Věra's fallback; the after-ending text and the one look change (frost gone, a lamp in the window); the Library shelf "The Remembering"; **the removal of the Act VI closing line**; save schema 11 (one small block). **The Descent and any rising difficulty are out of scope** (D448, D453).

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v0.10 must be **merged to `main`, tagged `v0.10.0` and accepted** (`docs/progress.md` says it was). Check that `git tag` lists `v0.10.0`, that `main` contains the v0.10 merge, and that `sim/baseline.json` is the accepted one. **If any of these is not so, stop and tell the owner. Do not branch from `milestone/v0.10`.** *(Until the docs commit, this box is read from `docs/flesh-out/v0.11/OUT-4a-plan.md`.)*
1. **Branch.** Work on `milestone/v0.11`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v0.11`. Push after every task; the preview build follows this branch.
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the flesh-out files, and ask whether they have **read OUT-3 (the ending's texts, including the lines marked ★) and the readings in D459 and D461–D467 / the summary, and say yes.** **Do not apply the files or build anything until they answer yes** (or say which to change; then change the files first). When they say yes, add **D460** (OUT-1) with the date.
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**
   - copy the files into `docs/flesh-out/v0.11/` and the summary into `docs/flesh-out/v0.11-summary.md`;
   - OUT-1 rows → `docs/decisions.md` (**no old row is edited; the sweep is the single row D446**; D460 once the owner has said yes); OUT-2a → `docs/gdd.md` (including B11); OUT-3 → `docs/lore-secrets.md` (§34 and the small edits, which replace, not append to, the lines that quote the closing line); OUT-4a → this plan; OUT-5 → `docs/questions.md`; OUT-9 → `docs/technical-design.md`;
   - **add three standing rules to `CLAUDE.md`:** *"Write The Remembering texts word for word from `docs/lore-secrets.md` §34; invent none."*, *"Before the player taps Remember Them, no text says, asks for or begins the Sent's names."* and *"The ending reads `orders.readWith` and `chaptersRead` only, never current seats or levels."*;
   - **housekeeping:** add the v0.10 actual count to plan §0.7 (about 19 entries over 3 numbered sessions, as earlier flesh-outs did); update the plan header's stale "Depth" line; close Q35; mark Q33 answered;
   - OUT-6 lists the names for `tests/content/names.ts`.
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.
   - [x] **Docs commit:** flesh-out files applied.
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. Rows D358–D445 are covered by D446 (with D407, D425, D427, D431, D433, D439 and D444); every row from **D447** up is a new v0.11 row. **If any other `Proposed` row from D357 up is found, list it in the progress entry and ask the owner; do not edit it.**
5. **Constants.** v0.11 adds **no game constant** and changes **none.** `knowledge.studiedKills` stays as it is (locked); the gate only *reads* the stored knowledge level. The reading's pace is a UI presentation timing in `src/ui/remembering/timing.ts`, outside `balance.ts`, by D464 (4). `rulesVersion` stays **5**.
6. **Determinism gates.** `rulesVersion` stays **5.** If **any golden fight changes, or any recorded fight or stand changes its result, stop and ask.** v0.11 adds **no random stream, no fight formula and no change to `advance`.**
7. **The simulator.** Standard, Light, Heavy, Opening, the Delver, the Eventer and the Orderer **never choose an ending;** their reports **equal the v0.10 baseline**, except that **Standard's report gains one new field** (the first cycle in which the ending is choosable); the baseline check ignores that one field and nothing else (D464). The new row goes in `sim/targets.ts` **in its own commit, after the owner has approved N.** It is judged **only in `sim.yml`,** not in the fast set inside `npm run check`. **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows. Tuning is out of scope: if the owner rejects the measured N, or three or more seeds never reach the ending, **stop and write the question to `docs/questions.md`.**
8. **Names.** OUT-6 lists what is new and what was searched. Add them, the shelf entry titles and the Rime heading to `tests/content/names.ts` **with the date and note from OUT-6.** **A new proper noun not in OUT-6: search it against GDD §2.3, and on a collision stop and ask, with alternatives.** *(No new person name exists.)*
9. **Story rules.** Write **only the texts in OUT-3, word for word.** **Before the player taps Remember Them, no text says, asks for or begins the Sent's names** (D386, D467). Nothing required is Order-only, Delve-only, event-only or missable (lore §8).
10. **Save rule.** Schema 11 needs a **migration, a fixture of a real old save, and a round-trip test** (CLAUDE.md). The fixtures are `v10.json`, `v10-played.json` and the new scripted `v11-played.json` (OUT-8). **No owner export is needed.**
11. **Stop and ask the owner** if a required name or document turns out Order-only, if technical design in the repo contradicts OUT-9, if the resident idle rotation or the Hearth Hall frost does not exist as OUT-3 assumes (T11.11, T11.12), or if no tunable passes a check.
12. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D446–D467, GDD §5.15, `docs/flesh-out/v0.11-summary.md`, lore §34.
- T11.1: technical design §5.2, §6.2, §9.4. T11.2: GDD §5.6.2, §5.9.3, §5.14.4, §8.3.1, lore §8, §20. T11.3: GDD §5.9.7, §5.9.9, §5.14. T11.4: GDD §9.14, §9.18, §9.19, technical design §6.2, §10. T11.5–T11.6: technical design §5.2, §15. T11.7–T11.10: GDD §9.19 and lore §34; T11.8: also lore §33 Part B and technical design §5.2 (`readWith`). T11.12: GDD §9.12. T11.15: GDD §6.1–§6.3, technical design §11.2, §13. T11.16: GDD §6.5.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Read OUT-3 (especially the ★ lines) and the readings, and say yes, or say what to change (Claude Code waits) | OUT-3, summary |
| To see the ending on the preview | Use the debug panel: *finishActVI*, then the near-scene plays; *openGate* opens the gate (D462) | GDD §5.15, technical design §15 |
| After T11.12 | Approve the look of the Hearth Hall after Remember Them (frost gone, a lamp in the window) | GDD §5.15.6 |
| After T11.15a | Approve the measured N and the simulator row | GDD §6.2 |
| After T11.16 | Approve the new performance-budget rows (D445 route) | GDD §6.5 |
| At the end | Playtest (checklist below) | below |

#### Tasks

- [x] **T11.1 Save v11: the `remembering` block.** `nearSeen`, `readyNoted` and `endings`; the v10 → v11 migration (empty block); validation (array order; rules in OUT-9); fixtures per OUT-8 (`v11-played.json` is built later in T11.5, once the commands exist); round-trip tests. **Acceptance:** both v10 fixtures load, migrate, validate and round-trip; the migrated block is empty; `orders` is identical across the migration step; schema 12 is refused by v11 code; the golden fights are unchanged.
- [x] **T11.2 The gate and the content tests.** `rememberingGate(state)` (derived; reads the **stored knowledge level**), `actVIStandApplied`, `endingChoosable`. Content tests, extending the existing required-content tests (v0.7, v0.9, v0.10): every name and every contract species has a source that is not an Order, a Delve or an event; the contract-species list is pinned (changing it needs a decisions row); the base stand pool equals the contract species. **Acceptance:** closed with 39 names; closed with one species at 3 kills; open with all; never stored; a planted Order-only source fails.
- [x] **T11.3 Remove the closing line.** Remove the Act VI closing line from the Long Night flow, the away sheet and every live doc text (OUT-2a B1–B5, OUT-3 small edits 1 and 2); a cycle with no act skips the step; Act VI's testament still plays. Older tests that assert the line are changed to assert **its absence** (D465), each listed in the progress entry. **Acceptance:** a story-less cycle's Long Night shows no closing line; a search of `src/` and the shipped content strings finds none; in `docs/`, the line appears only in the decisions log, `docs/archive/`, `docs/flesh-out/` and OUT-2a's find texts; Act VI's stand still shows D6-06.
- [x] **T11.4 Pechko's near-scene, the card (pre-choice forms) and the ready line.** R-01 / R-02 when `rememberingNearPending`, in the load order of technical design §6.2, on the live path after the stand as well as on load; `remembering.seeNear()` on Continue only (the ✕ leaves it waiting); the card in its not-open and open forms with live counts and the Names and Bestiary links; the ready line (`noteReady`). **Acceptance:** the scene plays once and picks R-01 or R-02 by the gate; a save already past Act VI's stand gets it once on the next Hold visit; no bar, no percentage, no badge; "Names found" equals the Names view; "Creatures known well" equals the number of contract species whose Bestiary entry shows Studied or Mastered; the ready line shows once, only after the scene.
- [x] **T11.5 The choice and the debug commands.** `remembering.choose('remember' | 'vigil')`; recording; refusal unless `endingChoosable`; Remember Them once; Keep the Vigil once, only when the gate is open, none after Remember Them; `debug.remembering.openGate()` and `debug.remembering.finishActVI()` (D462); the scripted `v11-played.json` and its script. **Acceptance:** every refusal case has a test (before Act VI's stand, gate closed, twice, `vigil` after `remember`); the pre-choice card forms (not open, open) are correct; commands go through `apply()`; `v11-played.json` loads, validates and round-trips.
- [x] **T11.6 Keep the Vigil.** R-10 once on choosing; the Library entry "Later". **Acceptance:** a before/after state diff outside `remembering` is empty **at the same `now`, excluding** `meta.lastSeen`, the clock high-water marks and the `events.clock` fold-in; the entry replays.
- [x] **T11.7 The reading.** R-03, the reading screen (automatic, tap, Skip, reduced motion), the roll table from the same data as the Names view, the Unlit's line; pace in `src/ui/remembering/timing.ts`. **Acceptance (fake timers):** 40 names in year order at the set interval; a tap shows the next at once; Skip jumps to the last frame; the table equals lore §20; the screen fits at phone width.
- [x] **T11.8 Orders in the ending.** `endingOrderCards(state)` (derived from `chaptersRead`, `readWith` and whether the Quenchers have opened): R-05 to R-08 and Věra's fallback in the fixed order. **Acceptance:** a table test over every case (none read; only one; all; Moot A and B; Quenchers A and B; Quenchers never opened); **changing current seats or levels changes nothing;** an unfinished Order is silent.
- [x] **T11.9 The ending sequence.** R-04, R-04b (only if Sigrun is on the roster), the Order cards, R-09, then the card in its "After Remember Them" form; the whole sequence as one stack played from the card and replayed from the Library. **Acceptance:** the order is R-03, reading, R-04, R-04b, Order cards, R-09, R-11; Skip on the reading does not skip the rest; an interrupted ending replays whole from the Library.
- [x] **T11.10 R-11 and the Roll of Wardens mark.** R-11 as the last card (derived from `endings`, not a found document) and under "After the ending" on the Rime shelf with Ilse's note; the Roll mark on the warden in office. **Acceptance:** across the whole ending `orders` (standing, counts, seats, levels, `readWith`) and `skills` are unchanged and no document is filed (a test); the Roll mark is on the right warden.
- [x] **T11.11 Resident lines.** The eight lines of lore §34.7, shown only once Remember Them is recorded. **Stop and ask first** if there is no idle rotation of resident lines to add them to (primer §6.2 has triggered lines only; Ilse has none): the options are to attach them to existing triggered lines or to build a small rotation. **Acceptance:** none shows before; each shows after; no existing line is removed.
- [x] **T11.12 The Hearth Hall look** *(the owner approved the look)*. Frost gone and a lamp in the window, drawn in code, shown only once Remember Them is recorded. **Stop and ask first** if the Hearth Hall scene shows no frost now, or about which versions (by Rank, and the v0.7 cosmetics) get the lamp. **Acceptance:** the preview shows both states in every version agreed; the owner approves (owner task).
- [x] **T11.13 The Library shelf "The Remembering".** Not shown until an entry is reached; "The reading" (whole sequence) and "Later"; R-11 on the Rime shelf. **Acceptance:** each entry replays; the shelf hides when empty; **the card's four forms** (not open, open, after Vigil, after Remember Them) are all correct, including after-choice forms with the gate artificially closed.
- [x] **T11.14 The text content test.** Lore §34.10: string equality for every text; forbidden words (case rule for "the Hollow"); relative years; the 40 names only in the reading and the Names view; the allowed people list; the Orders-card cases; no side effects. **Acceptance:** a planted bad text fails each check.
- [x] **T11.15 The reachability row (two sessions).** *(Done: Standard never reaches the species half of the gate; the owner chose Q45 (a), D469, and approved N = 6, D470. The row judges all 40 names found and Act VI's stand applied by cycle 6.)* **(a)** Measure when `endingChoosable` first holds for Standard (5 Monday seeds; the Monday Standard runs already play on to the Dross-Tide stands, D403, so the ending is probably seen without extending runs; if not, do **not** extend them without asking, D320); add the one report field; propose **N = the measured median** with the numbers; stop for the owner. **(b)** After the owner approves N, commit the row alone. **Acceptance:** the row passes at the approved N by construction; a seed that never gets there counts as later than any N; the other players' reports equal the v0.10 baseline apart from the new field; the row is in `sim.yml` only.
- [x] **T11.16 Layout checks and budgets** *(the owner approved the §6.5 rows, D470)*. Playwright at phone and the 900/1300 px breakpoints: no sideways scroll with the card, the reading and every ending card open; **all 40 names with their village lines fit.** Budgets by the D445 route: measure (reading start = tap to the first name painted; v10 → v11 migration), propose §6.5 rows for the owner to approve, and a unit test that save growth is ≤ 0.5 KB.
- [x] **T11.17 Docs, progress and the playtest hand-off.** `progress.md`, the plan boxes, the PR (template), the playtest checklist; `sim:accept` only after the owner says the playtest passed.

#### Out of scope for v0.11

The Descent; rising difficulty or any endless mode (D453); any balance change; new combat; new resources; new Orders; achievements (v1.0 decides); audio.

#### Simulator rows

| Row | Target | Players |
|---|---|---|
| *Proposed:* The Remembering is reachable *(D458, D464)* | The ending is choosable (gate open and Act VI's stand applied) by the end of cycle **N** = the measured median (T11.15), median of the 5 Monday seeds; the other seeds reported. Judged in `sim.yml` only. | Standard |
| Existing rows | unchanged; **all other players' reports equal the v0.10 baseline** (Standard's new field aside) | all |

Content tests: lore §34.10, and "every name and every contract species has a source that is not an Order, a Delve or an event" (T11.2).

#### Owner playtest checklist

- **Not ready:** use *finishActVI* in the debug panel. Does Pechko's scene say what is missing without nagging? Do the card's two lines feel quiet?
- **The gate:** use *openGate*. Is the ready line and the card's ready form clear? Does Keep the Vigil feel like "not yet" and not a punishment?
- **The reading:** is the pace right? Does a tap speed it up? Does Skip land well? Does the Unlit's line (★) feel like an answer?
- **The aftermath:** do Marta, the eldest Grey Wife, Halina and Bohdan sound like themselves? Does Sigrun's card (★) land? Does Pechko's line about the stove (★) feel right? Does the lit window land? Does the warm Rime (★) close it well?
- **Replay:** open the Library shelf and replay the whole ending.
- **Orders re-check (D447):** do the Orders still feel fair after a few cycles? Do the ending lines change with what you read, and not with what is seated now?
- **After:** the lamp in the window, the Rime, the new resident lines, the Roll mark. Does the game still feel the same to play (Long Night, stands, waves unchanged)?
- **Looks wrong on my phone:** send screenshots.
- **Anything that felt like a chore.**

---

### v1.0 — Polish

**Status:** complete *(playtest passed 2026-10-22, D497; fleshed out 2026-10-21; decisions D472–D497; files in `docs/flesh-out/v1.0/`)*

**Scope:** the 1.0 release. **No game rule, number, formula, story text or save field changes.** An art pass (a Keep/Redraw contact sheet, then redraws of what the owner marks, about 40 at most, and an app icon the owner picks); a UX and accessibility pass (the Archive tabs at 320 px, a Text size setting, reduced motion everywhere, contrast in both themes, 44 px tap targets); a backup reminder; the Wolf's name (Gaunt Wolf, applying D71); a balance **audit** (no retune) with a report-only estimate of how long it takes to Study all 16 species; release checks. Decided **out**: achievements (D474), audio (D476), the Descent and rising difficulty (D477), any Orders change (D479).

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v0.11 must be **merged to `main`, tagged `v0.11.0` and accepted** (`docs/progress.md` says it was). Check that `git tag` lists `v0.11.0`, that `main` contains the v0.11 merge, and that `sim/baseline.json` is the one recorded at v0.11. **If any of these is not so, stop and tell the owner. Do not branch from `milestone/v0.11`.** *(Until the docs commit, this box is read from `docs/flesh-out/v1.0/OUT-4a-plan.md`.)*
1. **Branch.** Work on `milestone/v1.0`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v1.0`. Push after every task; the preview build follows this branch.
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the flesh-out files, and ask whether they have **read OUT-2a (especially §9.20 and the backup-reminder line) and D485–D490, and say yes.** **Do not apply the files or build anything until they answer yes** (or say which to change; then change the files first). When they say yes, add **D491** (OUT-1) with the date.
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**
   - copy the files into `docs/flesh-out/v1.0/` (the owner's copies may carry a numeric suffix such as `OUT-1-decisions_3.md`; accept that and rename them to the plain names) and the summary into `docs/flesh-out/v1.0-summary.md`; copy the art inventory there too;
   - OUT-1 rows → `docs/decisions.md` (**no old row is edited**; D472 is the sweep; D491 once the owner has said yes); OUT-2a → `docs/gdd.md` (every Find text must occur exactly once; if one has moved, stop and tell the owner); OUT-4a → this plan; OUT-5 → `docs/questions.md`; OUT-9 → append to `docs/technical-design.md` as the new §18 (see OUT-9);
   - **add two standing rules to `CLAUDE.md`:** *"Redrawn art ships only after the owner has approved its contact sheet or batch."* and *"A tappable thing is at least 44 × 44 px (exceptions: inline text links in prose, the debug panel, and numbers that only respond to a long press; their ⓘ is not exempt)."*;
   - **housekeeping:** **check** that plan §0.7 already has the v0.11 actual ("19 progress entries, one task per session") and add nothing if it does; close Q42 and Q43; mark the v0.11 summary's question 10 (Q35) closed;
   - OUT-6 lists names (none new).
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.
   - [x] **Docs commit:** flesh-out files applied.
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. D472 accepts every row **up to D471** that still reads `Proposed` (blanket rule): **list what you find** (for example in D388–D406 and D434–D445) in the progress entry and change nothing. Every row from **D473** up is a new v1.0 row. A `Proposed` row from D472 up that is not in this flesh-out: list it and ask the owner.
5. **Constants and rules.** v1.0 adds **no game constant** and changes **none.** `rulesVersion` stays **5.** Save schema stays **11** (the new settings are in their own key outside the save, D486). **If any golden fight changes, or any recorded fight or stand changes its result, stop and ask** (a diff that is only "Gloam Wolf" → "Gaunt Wolf" is allowed, D487 (1)). Balance fixes (if the audit finds a failing row) change tunable constants only, never formulas; a locked constant needs a decisions row.
6. **The simulator.** Every player's report **equals the v0.11 baseline** (display-name diffs aside) and no field is added. No new row. The report-only species variant (TV.11) is a separate script, **not in `sim.yml`, not in the baseline and not a row** (D478). **Known and expected, not stops:** the Saturday runs show ✗ lines (reported only, D135), and the older "odds with 3 candidates" timing row fails on this container's CPU (D445). **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows.
7. **Names.** No new proper noun (OUT-6). The one change is the display name "Gaunt Wolf" (D71, D483); ids stay. **A new proper noun not in OUT-6: search it against GDD §2.3, and on a collision stop and ask, with alternatives.**
8. **Texts.** v1.0 has **no story text.** The only new player-facing strings are the backup-reminder line and its buttons, the Settings labels and the "Last exported" line, word for word in GDD §9.20 and E3. Write no others; if a screen needs a new string, ask.
9. **Save rule.** No schema change is planned. The existing settings (theme, best-buy hint, rate unit, reduce motion) live **inside the save** and stay as they are; Text size and the Backup reminder live in the new settings key outside the save (D486). Storage keys stay namespaced by channel. **If anything turns out to need a save change, stop and ask** (schema 12 would need a migration, a fixture of a real v11 save and a round-trip test).
10. **Art rules.** CC0 or code-drawn only; every picture is a manifest row; every `pack` source is in `credits.md`; the palette (32 colours) and sizes (16/32/64 px) stay. **At most 12 pictures per session.** A redraw is a **per-id override**; **a picture marked Keep must be byte-identical to its v0.11 PNG.** The old picture is kept in git and `art-src/previous/` for a one-step revert (no runtime fallback). **Nothing redrawn ships before the owner approves its batch.** `pack` art (49 rows) is not redrawn.
11. **Pre-authorised old-test edits (D487).** Allowed, each listed in the progress entry, nothing loosened: display-name-only diffs in goldens, logs, fixtures and the baseline; tightened or updated layout specs and snapshot refreshes **caused by a listed TV task**; reduced-motion assertions updated to "phone or switch". Any other old-test edit stops and asks.
12. **Stop and ask the owner** if anything needs a save change; if an id or fixture contains "gloam-wolf" (TV.1); if no theme token pair passes a contrast check, or a fix would visibly change an approved look (TV.6); if a control cannot reach 44 px (TV.3b); if a screen cannot fit at Largest after the tab wrap and the exemptions (TV.4b); if any audit row fails with no tunable that passes (TV.11); or if technical design in the repo contradicts OUT-9 beyond what OUT-9 itself says to check.
13. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D472–D491, GDD §9.20, `docs/flesh-out/v1.0-summary.md`.
- TV.1: GDD §8.3, the content files and tests that name the wolf, `tests/content/names.ts`. TV.2: GDD §9.12, `src/content/assets.ts`, technical design §12, `tools/contact-sheet.ts`, `tools/draw-*.ts`, `tools/gen-*.ts`, the art inventory. TV.3a–b: GDD §9.1, §9.14 (Archive), the screen list. TV.4a–b: GDD §9.1, §9.10, §9.20. TV.5: GDD §9.12, §9.19, technical design §18. TV.6: GDD §9.1, §9.14, §9.17, §9.19, technical design §10. TV.7: GDD §9.3, §9.10, §9.20, technical design §9.1, §15. TV.8–TV.10: GDD §9.12, `docs/flesh-out/v1.0/art-marks.md`. TV.11: GDD §6.1–§6.3, §5.9.3, technical design §11.2, §13. TV.12: GDD §6.5, technical design §11.2, §12.4, §14.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Read OUT-2a §9.20 (the backup line) and D485–D490, and say yes, or say what to change (Claude Code waits) | OUT-2a, OUT-1 |
| After TV.2 | **Mark the contact sheets:** reply with the picture numbers to Redraw (about 40 at most; everything else is Keep) and pick an app icon (or keep the current one). Claude Code writes your answer to `art-marks.md` | D475 |
| After each art part (TV.8a…TV.10) | Approve the before/after sheet of that part (or send back what to change) | D475 |
| After TV.4a | Tell Claude Code whether the Text size steps look right on your phone (a preview-build check) | D488 |
| After TV.6, if asked | Approve any contrast fix that changes an approved look | D488 (8) |
| After TV.11 | Read the balance report and the species estimate; answer Q46 | D478 |
| After TV.12 | Approve the proposed download-size row (D445 route) | GDD §6.5 |
| At the end | Playtest on your real phone (checklist below), send screenshots of anything that looks wrong; then say go for the merge and the tag `v1.0.0` | below |

#### The screen list *(used by TV.3, TV.4, TV.6 and the layout checks; GDD §9.20)*

Hold (Hamlet, Keep, Citadel, Bastion) · away sheet (with the reminder) · rates and breakdown sheets · Rank screen (Hearth, Roll of Wardens, Riftglass shop, "What the ember remembers") · Hunters (roster, candidates) · hunter sheet (talents, slots, alternate traits, letters), slot picker, Stores and Salvage · Contracts (board, launch sheet, fight log) · Bestiary and an entry · Alchemist's Hut (the 12 × 3 Book grid, Experiment) · Archive (all four tabs, document reader, Names, Villages) · Last Stand screen, Long Night sheets, arrival sheet · a Delve (entry, floor playback, doors, blessing, guardian, result) · Events (boss sheet and playback, hunt sheet and playback, Great Beasts shelf, Rime shelf) · Orders (card, sheets, seat step, chapter and opening scenes) · Remembering (card in four forms, Pechko's scene, the reading, ending cards, Library shelf) · More (Reports, Hall of the Fallen, Save & Data, Settings, About & Credits, Diagnostics). Debug excluded. **The first task that uses the list (TV.3a) writes into `progress.md`, for each screen, the fixture and the debug commands that reach it** (for example `v11-played.json`); later tasks reuse that table.

#### Tasks

- [x] **TV.1 Housekeeping and the Wolf's name.** Apply the display-name change by OUT-2a E11 (content and tests; ids unchanged). Check that `tests/content/names.ts` already lists "Gaunt Wolf" (D71); **add nothing if it does.** **Acceptance:** a search for "Gloam Wolf" in `src/`, `tests/` (except history in `names.ts`), `art-src/`, `docs/gdd.md`, `docs/setting-primer.md` and `docs/lore-secrets.md` outside §19 finds nothing; the Bestiary, the contract board, the fight log and the Archive show "Gaunt Wolf"; every save fixture still loads, validates and round-trips; the golden fights, recorded logs and `sim/baseline.json` differ from v0.11 only by the display name, if at all, and each such file is listed in the progress entry (D487); the gate's pinned contract-species list still passes. **Stop and ask** if an id or fixture contains "gloam-wolf".
- [x] **TV.2 The art contact sheets and app-icon candidates.** **Extend** the existing `tools/contact-sheet.ts` (do not replace it). Composite sheets per kind (portraits, monster and hunter sprites, icons, frames, scenes), the number printed under each picture, 16 px icons at 4×, on both theme backgrounds, scene overlays over their base hold scene; the weakest four species (poludnitsa, vodyanoy, huldra, nix) and the Great Beasts are on it like everything else (the owner's marks decide). Also 2–3 app-icon candidates beside the current icon, drawn in code. Write the number → id map to `docs/flesh-out/v1.0/art-marks.md` (marks empty) and record the hash of every v0.11 PNG for the Keep test (`art-src/v0.11-hashes.json`). Nothing is added to the game. **Acceptance:** a test counts the manifest rows whose source is `generated` and the sheets list each exactly once, with stable numbers (sorted by id); the existing contact-sheet use still works; the sheets are **shown to the owner in the conversation** (the owner can view images there, Q50) and also committed to `docs/flesh-out/v1.0/contact-sheets/`; **if your tool cannot show images in the conversation, stop and tell the owner.** The owner plays on an **iPhone** (Q50): the apple-touch-icon candidates matter most. **Stop** for the owner's marks (owner task).
- [x] **TV.3a The tap-target sweep: build and report.** Write the screen-list table (fixture and commands per screen) into `progress.md`; add `tests/e2e/polish-tap-targets.spec.ts`, which visits every screen on the list at 320 and 360 px and at each Text size once TV.4a exists, applies the exceptions in GDD §9.20, and lists every tappable thing under 44 × 44 px. **Acceptance:** the table covers every screen on the list; the sweep runs and **reports** its findings (no fixes in this task); a planted 30 px button fails it.
- [x] **TV.3b Fix the findings and the Archive tabs.** Fix every finding from TV.3a (ⓘ icons get a 44 px hit area, visual size unchanged) and make the Archive section tabs fully visible from 320 px, wrapping to two rows when needed. **Acceptance (DOM checks, not screenshots):** the four tabs are all visible (inside the viewport) at 320, 360, 900 and 1300 px; for the page `scrollWidth ≤ innerWidth`; the sweep finds nothing under 44 px. **Stop and ask** if a control cannot reach 44 px.
- [x] **TV.4a Text size: the setting and the checks.** The new settings key (GDD §9.20; fields `textSize`, `backupReminder`, `lastExportAt`, `snoozeUntil`, `firstSeenAt`), the Text size control, scaling applied once at the root to body-font text only, and a note in `progress.md` on what "Match phone" does on this build today (D488 (3)). Checks on the whole screen list at 320 px at Largest **report** overflow (no fixes here). **Acceptance:** unit tests for the key's storage, defaults and namespacing, and for Reset everything (keeps `textSize` and `backupReminder`, clears the three timestamps) and Paste code / Load file / Restore (key untouched); at **Match phone**, computed font sizes and box sizes on N named screens equal the v0.11 build's; pixel-font text and sprites do not scale at any step; the save format is unchanged (the v11 fixtures load and round-trip; schema stays 11).
- [x] **TV.4b Text size: fix the overflow.** Fix what TV.4a reported, including the reading (**all 40 names fit at Largest**, the longest lines first), the Hut Book grid, the talent columns and the launch sheet. **Acceptance (DOM checks):** on every screen on the list at 320 px at Largest, `scrollWidth ≤ innerWidth` for the page, and `scrollWidth ≤ clientWidth` and `scrollHeight ≤ clientHeight` for text elements with no intended scroll; the tap sweep still finds nothing under 44 px at every step; the pre-existing layout specs still pass (tightened, never loosened, D487). **Stop and ask** if a screen cannot fit at Largest after the tab wrap and the exemptions.
- [x] **TV.5 Reduced motion everywhere.** Motion is reduced if the phone says so or the existing switch is on. A script over the CSS allows `animation` and `transition` only under the gate; one registry for JS-driven motion (fight and Delve playback, the reading, sprite frames, sheets); playback keeps its timeline and pace with still frames. **Acceptance:** the CSS script fails on a planted ungated `transition`; a unit test of the registry fails on motion created outside it; a Playwright run with the phone setting emulated and with the switch on gives an empty `document.getAnimations()` on the named screens (Hold, a fight playback, the reading, a sheet opening); with both off, `getAnimations()` on those screens is at least the v0.11 count; the reading tests' assertions are updated to "phone or switch" (D487 (4)).
- [x] **TV.6 Contrast.** A Playwright check derives (text, background) and (UI glyph icon, background) pairs from computed colours on the screen list in both themes, including each styled card (Rime reader, document reader and Ilse's note, reading screen, scene sheets). Fix failures with existing theme tokens. **Acceptance:** the check passes in both themes (4.5:1 normal text; 3:1 large text at its rendered size, and UI glyph icons); the fixes are listed in the progress entry with before/after ratios; a planted low-contrast pair fails. **Stop and ask** if no token pair passes, or if a fix would visibly change an approved look (show before/after).
- [x] **TV.7 The backup reminder.** The pure function `backupReminder(now, settings)` (technical design §18), the away-sheet line with its two buttons, the Settings switch, "Last exported" in Save & Data, and the UI-only debug action to set the last export age (D486 (4)). **Acceptance (table test with a fake clock):** nothing before 14 whole days from the later of `lastExportAt` and `firstSeenAt`; the line at 14 days with the right count; "Not now" hides it for 7 days; "Back up now" opens Save & Data and hides it for 1 day; Copy save code (copied) and Download save file (started) reset it, while Copy diagnostics, a cancelled download, Paste code, Load file and Restore do not; the switch off hides it; a clock set backward shows nothing; [Onward] and the Contracts "Collect" work with the line showing; **the save is unchanged by showing, snoozing or exporting, compared at the same `now` with `savedAt`, `meta.lastSeen`, the clock high-water marks and the `events.clock` fold-in excluded** (as in v0.11, D462); the debug action does not set `debugUsed`; the line is on the away sheet below the summary and above [Onward] at 320 px at Largest.
- [x] **TV.8 Art batch 1: monsters** *(split into TV.8a, TV.8b… so that no part has more than 12 pictures; each part ends with the owner's approval).* Redraw the marked contract-species portraits and sprites by per-id override. **Acceptance:** every picture marked Keep is byte-identical to its v0.11 PNG (the hash test); every redrawn picture keeps its id and size, uses only palette colours and has a manifest row; every file in `public/assets/` is in the manifest (the existing CI test); a before/after sheet is shown to the owner; nothing ships until the owner approves. If nothing in this batch is marked, skip it and say so.
- [x] **TV.9 Art batch 2: Great Beasts, guardians, hunters** *(split in the same way).* The same for the marked creature, guardian and hunter portraits and sprites. Same acceptance.
- [x] **TV.10 Art batch 3: icons, frames, scenes and the app icon** *(split in the same way).* The same for marked icons, frames and scenes, and the chosen app icon: 192, 512, maskable 512, the **apple-touch-icon (180)** and the favicon; the preview build's icon carries a visible corner mark (D489 (5)). **Acceptance:** as TV.8; the built web manifest lists the icon entries (sizes, purpose `maskable`), the files exist at those pixel sizes, and the `apple-touch-icon` link is present in the built page.
- [x] **TV.11 The balance audit and the species estimate.** Run the full simulator (`sim.yml`'s suite) and write a report that puts **every row** against its target and every player's report against the v0.11 baseline (the Saturday ✗ lines and the older "odds with 3 candidates" row are expected and not judged). Add to it the "reach Bastion, go" report (when the stand first becomes available against the day-3 target, D478 (2)). Then run the **report-only variant** exactly as D485 (4) defines it, twice (A best case, B realistic), 5 Monday seeds, up to 25 cycles, once, locally; report for each seed the days and the cycle in which all 16 species are Studied and in which the ending becomes choosable, beside the cycle-6 numbers for the names and the stand; copy the report into `docs/flesh-out/v1.0/`. **Acceptance:** all rows pass and every report equals the baseline; the variant's script is referenced by none of `sim.yml`, the baseline or `sim/targets.ts` (a test); its reports are in the repo folder. **Stop and ask** if any row fails with no tunable that passes, or the variant takes more than 10 minutes. **Stop** for the owner after the report (owner task, Q46).
- [x] **TV.12 Release checks.** (a) **Extend** the existing offline-reload smoke (technical design §14): load the production build, wait for the service worker, go offline, reload, run N named commands and check the state. (b) **Extend** the credits/manifest test (§12.4): every `pack` row has a credit and every credit has a row. (c) The old-save check: every fixture, including `v11-played.json`, loads and round-trips. (d) The benchmark checks every §6.5 row (the older "odds with 3 candidates" row is expected to fail on this container, D445); the download size of the production build is measured against v0.11 and a size row is **proposed** for the owner (D445 route), not enforced. (e) The version shows in About & Credits (technical design §11.2); check it, add nothing if it does. **Acceptance:** each of (a)–(e) is reported in the progress entry; the proposed size row is listed with its number.
- [x] **TV.13 Docs, progress and the playtest hand-off.** `progress.md`, the plan boxes, the PR (template), the playtest checklist; `sim:accept` only after the owner says the playtest passed; the merge and the `v1.0.0` tag only on the owner's go-ahead.

#### Out of scope for v1.0 *(visible deferred list, with the reason)*

| Item | Reason |
|---|---|
| Achievements | Decided no (D474); the in-world records do that job |
| Audio | After v1.0, its own milestone (D476) |
| The Descent | After v1.0, its own milestone and flesh-out (D477) |
| Rising difficulty / endless Keep the Vigil | After v1.0, its own milestone and flesh-out (D477) |
| Any Orders change | None wanted (D479) |
| Event-only cosmetics and the legendary hunters' animation | Promised "polish (v1.0)" in GDD §5.12.12; deferred past v1.0 because they are new content (D490; the owner said yes to Q49) |
| Art beyond the cap (about 40) | Not yet marked; the owner decides after the contact sheets |
| Any balance change from the species estimate | Waits for the estimate and the owner's answer (Q46) |
| Screen-reader labels and keyboard focus | Considered and left out (D489) |
| Q41 and Q48 (name searches) | Informational |
| New game rules, new story, new combat, new resources, a new save field | Not part of a polish release |

#### Simulator rows

No new row. All existing rows must pass and every report must equal the v0.11 baseline (display-name diffs aside). The report-only species variant is outside the baseline and outside `sim.yml` (D478).

#### Owner playtest checklist *(on your real phone; send screenshots of anything wrong)*

- **Archive tabs:** are all four tabs visible, including Names? Try it in both themes and at Largest.
- **Text size:** try Match phone, Large and Largest on the Hold, Hunters, Contracts, Archive, a sheet and the reading. Does anything clip, overlap or become hard to tap? **Is a routine check-in still 15 taps or fewer at Largest?**
- **Reduced motion:** turn it on in Settings (and, if you can, in your phone's settings), then watch a fight, the Hold and the reading. Is everything still? Does it keep its pace? Turn it off: is everything back?
- **Contrast:** read the Hold, a contract, a letter, a Rime entry and the reading in the light and the dark theme. Is anything hard to read? Is anything that was changed worse-looking?
- **Tap targets:** is any button hard to hit with your thumb?
- **Backup reminder:** use the debug panel's "set last export age" to 15 days; open the game. Is the line clear and quiet, below the summary and above Onward? Does "Not now" hide it? Does "Back up now" open Save & Data? Does exporting clear it? Is the Settings switch right?
- **Art:** do the redrawn pictures look better than before? **If you play on an iPhone: export your save code before removing or re-adding the app** (iOS does not refresh a home-screen icon, and a re-added app has fresh storage). Does the new app icon look right on your home screen? Can you tell the preview build's icon from the real one?
- **The Wolf:** is it "Gaunt Wolf" everywhere?
- **Everything else:** does the game still play and feel the same (Long Night, stands, waves, the ending)?
- **Looks wrong on my phone:** send screenshots.
- **Anything that felt like a chore.**

---

### v1.1 — The Hold's Layout

**Status:** complete *(playtest passed 2026-10-23, D516; fleshed out 2026-10-22; revised after red-team review; decisions D498–D508; files in `docs/flesh-out/v1.1/`)*

**Scope:** decorative free placement of buildings on an **8 × 8 grid** (`0..7 × 0..7`) with **the Fell Breach** on the north edge and **the Lowland Gate** on the south edge; Rank clearings (`4 × 4` Hamlet → `6 × 6` Keep → `8 × 6` Citadel → `8 × 8` Bastion); **40 placeable pieces (43 tiles)** (`2 × 2` Hearth Hall centerpiece anchored in `2..4 × 2..4`, 8 `1 × 1` unique/level buildings with 3 visual tiers, 17 `1 × 1` count-building plots with 3 density tiers, 3 Watchtowers, 11 auto-connecting Wall segments with row 1 Citadel defenses and row 0 Bastion defenses); **blueprint persistence across the Long Night** ("The stones remember", save schema **12**, with normative piece states `locked`, `active`, `dormant-ring`, `tray`); the live grid header on the Hold screen (with a `Grid` / `Classic scene` switch in Settings); the tap-only **Arrange Hold** sheet (`44 × 44 px` tile buttons, Tray, Auto-arrange, Clear, Blueprint ghosts toggle); code-generated 32 px grid art (and 64 px Hearth Hall) in three phased batches gated by a numbered contact sheet; and tuning the live odds benchmark budget rows (identified ≤ 120 ms, 3-candidate ≤ 150 ms per candidate) so slow CI runners pass cleanly (D505, M6). **No game rule, production rate, Threat rate or combat math changes (`rulesVersion` stays 5).** Designed so **v1.5 ("The Breach")** reuses `state.layout` without another save migration.

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v1.0 must be **merged to `main`, tagged `v1.0.0` and accepted** (`docs/progress.md` says it was merged on 2026-10-22, D497). Check that `git tag` lists `v1.0.0`, that `main` contains the v1.0 merge, and that `sim/baseline.json` is the accepted one. **If `v1.0.0` is not yet tagged or `main` does not hold the merge, stop and tell the owner. Do not branch from `milestone/v1.0`.**  
1. **Branch.** Work on `milestone/v1.1`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v1.1`. Push after every task; the preview build follows this branch.  
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the revised v1.1 flesh-out files, and ask whether they have **read `OUT-1` to `OUT-9` (especially GDD §5.1.5 and §9.21, the roadmap D499, and the technical design §19) and say yes.** **Do not apply the files or build anything until they answer yes** (or say what to change; then change the files first). When they say yes, add **D508** (`OUT-1`) with the date.  
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**  
   - copy the files into `docs/flesh-out/v1.1/` and the summary into `docs/flesh-out/v1.1-summary.md`;  
   - `OUT-1` rows → `docs/decisions.md` (**no old row is edited**; D498 is the sweep; D508 once the owner has said yes); `OUT-2a` → `docs/gdd.md` (every Find text must occur exactly once; if one has moved, stop and tell the owner); `OUT-4a` → this plan; `OUT-5` → `docs/questions.md` (closes Q41, Q46, Q48); `OUT-6` → `docs/flesh-out/v1.1/OUT-6-names.md`; `OUT-9` → append to `docs/technical-design.md` as the new §19 and update the schema number in §5.2 / §9.4 and settings key list in §18;  
   - **add two standing rules to `CLAUDE.md`:**  
     1. *"In v1.1, `state.layout` is decorative only: no production rate, cost, Threat rate or fight calculation reads it (`rulesVersion` stays 5)."*  
     2. *"Write no player-facing strings for the layout beyond the table in GDD §9.21; if a screen needs one, ask."*  
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.  
   - [x] **Docs commit:** flesh-out files applied.  
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. D498 confirms D472–D494 and D496 as Decided as built; D472's blanket rule covers all rows up to D471. Every row from **D499** up is a new v1.1 row. **If any other `Proposed` row is found, list it in the progress entry and ask the owner; do not edit it.**  
5. **Constants and rules.** v1.1 adds **no `balance.ts` game constant** and changes **none.** `rulesVersion` stays **5.** Save schema moves from **11 to 12** (`state.layout`, D502). **If any golden fight changes, or any recorded fight or stand changes its result, stop and ask.**  
6. **The simulator.** Every player's report **equals the v1.0 baseline** (byte-for-byte in the judged metrics; no simulator policy issues layout commands in v1.1). No new simulator row. **Known and expected, not stops:** the Saturday runs show ✗ lines (reported only, D135), and benchmark timing warnings above 1× budget on slow CI runners (D445, M6). **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows.  
7. **Saves.** Schema 12 requires a migration (`save/migration-v12.ts`), a fixture of the owner's real live v1.0 save (`v11-owner.json`, exported before TL.1, S10), migrated fixtures (`v12.json` and `v12-played.json`), and a round-trip test. The `Hold view` setting (`Grid` / `Classic scene`) lives in the external settings key (`lasthold:settings`, D486, D503), not in the save.  
8. **Art rules.** Code-generated in the 32-colour Zughy palette (`32 × 32 px` tiles/sprites, `64 × 64 px` for the `2 × 2` Hearth Hall), registered in `src/content/assets.ts`. Existing v1.0 PNGs must match `art-src/v1.0-hashes.json` byte-for-byte (S3). **Show the numbered contact sheet (`TL.5c`) in the conversation first** and wait for the owner's marks (`docs/flesh-out/v1.1/art-marks.md`). Any redraws (`TL.6`) are capped at **12 pictures per session** with before/after sheets approved by the owner.  
9. **Pre-authorised old-test edits (D507, M7).** Allowed, each listed in the progress entry, nothing loosened: (1) updating save schema version from `11` to `12` and adding `v11-owner.json`, `v12.json` and `v12-played.json` in `tests/saves/`; (2) updating the odds budget constants in `tests/bench/` (identified 120 ms, 3-candidate 150 ms per D505); (3) setting `holdView: 'scene'` in the shared test loader for old specs expecting the pixel hold scene (or updating them for the grid header); (4) scoping v1.0's `contact-sheet.test.ts` to the v1.0 manifest ID list so v1.1 assets number independently; (5) extending `app-settings.test.ts` for the `holdView` field; (6) adding a narrow container-level scroll exemption (`data-internal-scroll`) for Arrange Hold in `polish-widths` and `polish-text-size` at 320 px; (7) appending new screen keys to motion-counts and contrast baselines. Any other old-test edit stops and asks.  
10. **Stop and ask the owner** if any golden fight or simulator report changes; if technical design in the repo contradicts OUT-9 (S9); if a tile button in Arrange Hold cannot reach `44 × 44 px` or causes page-level horizontal scroll at `320 px` at Largest; if your tool cannot show the `TL.5c` contact sheet in the conversation; or if the production gzipped download size exceeds `600 KB`.  
11. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D498–D508, GDD §5.1.5, §9.21, `docs/flesh-out/v1.1-summary.md`, technical design §19.  
- TL.1: technical design §5.2, §9.4, §18, §19; `src/core/save/`; `tests/saves/`.  
- TL.2, TL.3, TL.4: GDD §5.1.2, §5.1.3, §5.1.5, §5.9.2, §5.9.7, §8.1; technical design §19.  
- TL.5a, TL.5b, TL.5c, TL.6: GDD §9.12; `src/content/assets.ts`; `tools/contact-sheet.ts`; `tools/contact-sheet-numbered.ts`; `tools/before-after.ts`.  
- TL.7, TL.8: GDD §9.2, §9.10, §9.20, §9.21; `src/platform/app-settings.ts`; `src/ui/`.  
- TL.9: `tests/e2e/polish-screens.ts`, `polish-tap-targets.spec.ts`, `polish-widths.spec.ts`, `polish-text-size.spec.ts`, `polish-motion.spec.ts`, `polish-contrast.spec.ts`.  
- TL.10, TL.11: GDD §6.5; `tests/bench/`; `sim/`.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Confirm you have read the revised v1.1 flesh-out (`OUT-1` to `OUT-9`) and say yes (or say what to change; Claude Code waits) | Box step 2, D508 |
| **Before TL.1** | Export your live save code from your iPhone and provide it as `v11-owner.json` | S10 |
| After TL.5c | **Mark the v1.1 grid art contact sheet:** reply with any picture numbers to Redraw (everything else is Keep). Claude Code writes your marks to `docs/flesh-out/v1.1/art-marks.md` | D504, S2 |
| After TL.6 (if any marked) | Approve the before/after sheet for any redrawn grid tiles/sprites | D504 |
| After TL.8 | Optional quick look on the preview build: check how the Hold grid and Arrange Hold sheet feel on your iPhone | GDD §9.21 |
| At the end | Playtest on your iPhone (checklist below); then say go for `sim:accept`, merge and tag `v1.1.0` | below |

#### Tasks

- [x] **TL.1 Save v12: `HoldLayoutState`, catalog foundations and the `v11 → v12` migration.** Create `src/core/systems/layout-catalog.ts` containing the 40 piece definitions, footprints, `clearingBounds`, and `CANONICAL_LAYOUT` (with row 1 Citadel defenses and row 0 Bastion defenses; M1, S1). Add `HoldLayoutState` (`placed`, `showGhosts`) to `GameState` (technical design §19). Implement the `v11 → v12` migration (`src/core/save/migration-v12.ts`) that populates `CANONICAL_LAYOUT` and `showGhosts: true`. Implement deterministic validation (bounds `0..7`, `hearth-hall` anchor inside `2..4 × 2..4` [M4], overlaps resolved in catalog order by moving displaced pieces to Tray [S13], unknown keys dropped with warnings). Create `tests/saves/fixtures/v12.json` (from `v11-owner.json` migrated, S10) and `v12-played.json` (played 72 h under a fixed seed). Add the unit test `tests/layout/save-size.test.ts` proving the full 39-piece layout JSON is `≤ 1.5 KB` (measured ~1.1 KB, M5). **Acceptance:** all save fixtures load, migrate, validate and round-trip; schema 13 is refused by v12 code; `layout` save growth is `≤ 1.5 KB`; every golden fight and recorded stand replays line for line.  
- [x] **TL.2 Selectors, piece states and non-coupling verification.** Build `src/core/systems/layout.ts` (pure TypeScript): `getPieceStatus(state, pieceId)` returning the four mutually exclusive states (`locked`, `active`, `dormant-ring`, `tray`; M2), visual tier and plot density derivation, `wallConnectionMask(grid, x, y)` (4-bit N/E/S/W mask for adjacent active walls or watchtowers), and `buildHoldGridView(state)` (memoized, N6) returning active pieces, dormant blueprint foundation ghosts, tray pieces, and cosmetic/frost/lamp flags. Add a static lint check ensuring no selector or function in `economy.ts`, `combat.ts`, `stand.ts`, `contracts.ts`, or `advance.ts` imports or reads `state.layout` (S11). **Acceptance:** table-driven unit tests cover every unlock threshold, Rank clearings, 16 wall connection masks, mutually exclusive states across all Ranks; lint test verifies zero combat/economy coupling.  
- [x] **TL.3 Layout commands, blueprint protection, auto-placement and Long Night.** Implement commands `layout.place(pieceId, x, y)` (target must be inside current clearing; 1 × 1 pieces swap or displace to tray; 2 × 2 Hearth Hall moving within `2..4 × 2..4` swaps displaced pieces into vacated hall tiles or tray), `layout.unplace(pieceId)` (refused for Hearth Hall), `layout.autoArrange()`, `layout.clear()` (clears 1 × 1 pieces to tray and deletes blueprint coordinates, keeping Hearth Hall), and `layout.setShowGhosts(boolean)`. Implement `autoPlaceUnlocked(state)`: blueprint coordinates are never overwritten automatically (M2); newly unlocked pieces wake up at their saved blueprint if free and in clearing, stay `dormant-ring` if outer ring, or go to `tray` if occupied. If unplaced, auto-place using deterministic distance-from-center spiral order (S6). Hook into `buyBuilding`, `upgradeBuilding`, `rankUp` (wakes dormant-ring pieces and places tray items, M2), new game creation (`hearth-hall` only, M3), and cycle start after Long Night (wakes starting buildings, M3). Verify `state.layout.placed` persists untouched across Long Night (`longNight.ts`). **Acceptance:** unit tests verify move, swap, 2 × 2 Hearth Hall restricted to `2..4 × 2..4` (M4), refusal on locked rings, blueprint protection, rankUp placement, and Long Night persistence.  
- [x] **TL.4 Debug commands for layout.** Add `debug.layout.autoArrange()`, `debug.layout.clear()`, and `debug.layout.fillBastion()` (unlocks Bastion with sample building levels/counts so every piece can be inspected on the grid in one tap; sets `debugUsed`, N4) to the debug panel. **Acceptance:** unit tests cover each debug command; none is reachable without the debug panel.  
- [x] **TL.5a Grid art inventory, ground & border tiles, and hash baseline.** Create `tools/draw-layout-grid.ts` and write `docs/flesh-out/v1.1/art-inventory.md` listing all ~75 new assets with IDs, sizes, and states (S2). Record `art-src/v1.0-hashes.json` of all PNGs as shipped in v1.0 (S3). Generate ground clearing tiles, locked pine forest and ruined stone border tiles, Fell Breach (north) and Lowland Gate (south) header strips, and blueprint foundation ghost outlines in the 32-colour palette. Register rows in `src/content/assets.ts`. **Acceptance:** every asset uses only the 32-colour palette; `v1.0-hashes.json` test passes byte-identical on all v1.0 PNGs; manifest rows validate.  
- [x] **TL.5b Grid art: defenses, level buildings, and 2 × 2 Hearth Hall.** Generate the 16 wall connection mask sprites (`wall-conn-*.png`), Watchtower sprites, the 7 level buildings across 3 visual tiers, the Unique Trophy Hall, and the 64 × 64 px Hearth Hall across all 4 Ranks plus Carved Door, frost, and lamp overlays (S2). Register in `src/content/assets.ts`. **Acceptance:** all sprites conform to palette and size constraints; manifest entries validate; Keep test passes.  
- [x] **TL.5c Grid art: count plots, cosmetics, contact sheet and owner marks stop.** *(Built 2026-10-23; the owner's Keep/Redraw marks are still to come, in `docs/flesh-out/v1.1/art-marks.md`.)* Generate the 17 count-building plot density tiers (`1–4` single, `5–14` pair, `15+` cluster; 2 for Silver Seams) and grid cosmetic overlays (Gatehouse banners, Wall lanterns, Watchtower bell; S7). Extend `tools/contact-sheet-numbered.ts` (`--layout-sheets`) to output a numbered contact sheet of all new v1.1 grid assets on both theme backgrounds to `docs/flesh-out/v1.1/contact-sheets/` and write `docs/flesh-out/v1.1/art-marks.md`. Measure asset download size impact against the 600 KB budget (N5). **Acceptance:** contact sheet is **shown to the owner in the conversation** and committed. **Stop** for the owner's Keep/Redraw marks.  
- [x] **TL.6 Grid art redraws** *(split on 2026-10-23: the owner marked 25 Redraw in `docs/flesh-out/v1.1/art-marks.md`; at most 12 per session, D475, so three batches).* Each batch: redraw those pictures only, keep every other picture byte-identical (`art-src/v1.1-hashes.json`), show a before/after sheet in the conversation, and ship after the owner approves it.
  - [x] **TL.6a (11):** *(approved by the owner 2026-10-23)* `grid.ground.earth`, `.flags`, `.grass` (26–28); `grid.watchtower` (80) and `grid.cosmetic.bell-tower` (12) together; `grid.hearth-hall.door` (31) and `.lamp` (38); `grid.alchemist.3` (3); `grid.mill.1` (45); `grid.farm.3` (20); `grid.herb-garden.3` (41).
  - [x] **TL.6b (11):** *(approved by the owner 2026-10-23)* `grid.barracks.1–3` (4–6); `grid.mine.1–3` (48–50); `grid.sawpit.1–3` (53–55); `grid.silver-seam.1–2` (56–57).
  - [x] **TL.6c (3):** *(approved by the owner 2026-10-23)* `grid.woodcutter.1–3` (81–83).
  **Acceptance (each):** the Keep hash test passes; the owner approves the before/after sheet. The ground redraws (26–28) change how everything looks, so batch A is judged on a new Hamlet and Bastion mock-up too.
- [x] **TL.7 Hold screen live grid header and `Hold view` setting.** Add `holdView: 'grid' | 'scene'` (default `'grid'`) to `src/platform/app-settings.ts` (kept on Reset everything, untouched by Paste/Load/Restore, S4). Add the **Hold view** control in `More ▸ Settings`. Build the live 8 × 8 grid header on the Hold screen (GDD §9.21): Fell Breach and Lowland Gate headers, Rank clearing, active pieces, dormant blueprint ghosts, cosmetics across Ranks (S7), Act VI frost / lamp, and `[Layout ▸]` button (`≥ 44 × 44 px`, with badge counting only unplaced items in `tray`; M2). Header scales smoothly and is non-interactive (S5). Add data-attributes for Playwright test assertions (S11). **Acceptance:** unit tests cover `holdView` storage and load; Playwright verifies both views render all cosmetics, frost, and lamp states; routine check-in stays ≤ 15 taps.  
- [x] **TL.8 The Arrange Hold sheet.** Build `ArrangeHoldSheet` (GDD §9.21): 8 × 8 grid of `44 × 44 px` tile buttons, high-contrast selection outline (N9), tap-to-select, tap-to-move/swap, 2 × 2 Hearth Hall footprint preview, info bar with `[Move to tray]`, Tray of unplaced unlocked pieces, `[Auto-arrange]`, `[Clear to tray…]` (with confirmation dialog), and `Blueprint ghosts: [On] [Off]`. Strictly enforce strings from the GDD §9.21 table (S8). When container width is `< 352 px` (320 px check width, N3), wrap tile grid in a self-contained horizontal scroll container (`data-internal-scroll="true"`, M7) so the page never scrolls horizontally. **Acceptance:** Playwright tests verify selecting, moving, swapping, Hearth Hall movement, tray interactions, Auto-arrange, Clear to tray, and ghosts toggle.  
- [x] **TL.9 Accessibility and layout checks across all widths and Text sizes.** Add the Hold screen in Grid view (Hamlet through Bastion) and the Arrange Hold sheet to `tests/e2e/polish-screens.ts`. Run the 44 px tap-target sweep (`polish-tap-targets.spec.ts`), width checks at 320/360/900/1300 px (`polish-widths.spec.ts`), 320 px Largest text-size overflow check (`polish-text-size.spec.ts`), reduced motion (`polish-motion.spec.ts`), and contrast check (`polish-contrast.spec.ts`). **Acceptance:** 0 findings across all suites at every width, theme, and Text size. **Stop and ask** if any control cannot reach 44 px or text clips at Largest.  
- [x] **TL.10 Performance budgets and download size.** In `tests/bench/`, update the live odds budget constants to 120 ms (identified) and 150 ms (3 candidates, 500 samples/candidate) (D505, M6). Add the new throttled benchmark checks: **Hold grid render ≤ 16 ms**, **Arrange Hold sheet open ≤ 50 ms**, and **v11 → v12 migration ≤ 100 ms** (D506). Measure production gzipped download size against `≤ 600 KB` (D494, D495). **Acceptance:** no benchmark row fails (≤ 2× limit; warnings logged in `progress.md`, M6); gzipped production build is `≤ 600 KB`.  
- [x] **TL.11 Simulator and determinism verification.** Run `npm run check` and the full simulator suite (`sim.yml`). **Acceptance:** all 55 simulator rows pass on the 5 seeds, every player's report equals the v1.0 baseline (`176 of 176 same`), and every golden fight and recorded stand replays line for line (`rulesVersion` is 5).  
- [x] **TL.12 Playwright smoke and preview build.** Extend `tests/e2e/smoke.spec.ts` to open Arrange Hold, move a building on the grid, tap Auto-arrange, toggle `Hold view` in Settings, and reload offline (S11). Push `milestone/v1.1` and verify the preview build loads `v11-owner.json` and migrates to `v12`. **Acceptance:** all smoke tests pass; preview build is verified.  
- [x] **TL.13 Docs, progress and playtest hand-off.** Update `docs/progress.md`, tick the plan boxes, open the pull request from `milestone/v1.1` to `main` using the plain-language template and playtest checklist below. Note that rolling back to v1.0 requires importing `v11-owner.json` (S10). Wait for the owner's "playtest passed" before running `sim:accept`, merging, and tagging `v1.1.0`.

#### Out of scope for v1.1 *(visible deferred list, with the reason)*

| Item | Reason |
|---|---|
| Tactical building placement in the Last Stand | Scheduled as milestone **v1.5 — The Breach** (D499, D500); v1.1 is decorative and sets up the saved 8 × 8 layout format so v1.5 needs no save migration (stand snapshot will be added in v1.5, S12) |
| Audio | Scheduled as milestone **v1.2 — Sounds of the Frontier** (D476, D499) |
| Rising difficulty / endless Keep the Vigil | Scheduled as milestone **v1.3 — Keep the Vigil** (D453, D477, D499) |
| The Descent (third ending) | Scheduled as milestone **v1.4 — The Descent** (D448, D477, D499) |
| Event-only cosmetics and legendary hunters' animation | Deferred (D490, D505) |
| Screen-reader labels and keyboard focus | Deferred (D489, D505) |
| Any game-rule, production, Threat or combat change | Not part of v1.1 (`rulesVersion` stays 5) |

#### Simulator rows

No new simulator row. All 55 existing rows must pass and every player's report must equal the v1.0 baseline.

#### Owner playtest checklist *(on your iPhone; send screenshots of anything wrong)*

- **Export first (S10):** did you export your save code before opening the preview build? (Schema 12 is one-way).  
- **Your save's arrival:** does your v1.0 save open straight into the Hold grid with your buildings arranged cleanly? Are Citadel walls visible in row 1? Are all your hunters, items, Orders, Embers and endings untouched?  
- **Visual progression:** use the debug panel (or play through Ranks) to look at Hamlet (`4 × 4`), Keep (`6 × 6`), Citadel (`8 × 6`) and Bastion (`8 × 8`). Does the settlement feel like it is expanding toward the Fell Breach as you Rank up? Do the `2 × 2` Hearth Hall, connected Walls, Watchtowers, count-building plots and cosmetics look good?  
- **Arrange Hold sheet:** tap **[Layout ▸]**. Is tap-to-select and tap-to-move/swap easy with your thumb? Try moving the `2 × 2` Hearth Hall, moving a building to the Tray, **Auto-arrange**, **Clear to tray**, and **Blueprint ghosts On/Off**.  
- **The Long Night ("The stones remember"):** after a Long Night, do your saved blueprint outlines stay in place, and do buildings pop back into their saved spots as you rebuild them without overwriting your layout?  
- **Hold view setting:** in `More ▸ Settings`, switch **Hold view** between `Grid` and `Classic scene`. Do both views work cleanly?  
- **Daily check-in speed:** is a normal check-in still 15 taps or fewer?  
- **Looks wrong on my phone:** send screenshots.  
- **Anything that felt like a chore.**

---

### v1.2 — Sounds of the Frontier

**Status:** not started *(scheduled by D476, D499; fleshed out 2026-10-23; decisions D519–D528; files in `docs/flesh-out/v1.2/`)*

**Scope:** **seven short sound effects for 15 moments**, **off by default**, with one **Sound** On/Off in `More ▸ Settings` (field `sound` in the settings key outside the save, `lasthold:settings`; **save schema stays 12, `rulesVersion` stays 5**). The sounds: Build, Launch, Place, Win, Lose, Fanfare, Nightfall (GDD §9.22, D520). **Web Audio only, mono MP3, no loops, no volume control, no new runtime dependency** (D522). The phone's silent switch is respected and never worked around. Nothing plays while the app is hidden; a sound that cannot play now is skipped, never queued; anything not on the list of 15 moments is silent (D520, D521, D522). All sounds together **≤ 30 KB** (target about 24 KB); **the whole build must still measure ≤ 600 KB gzipped** (D523). CC0 only, from four Kenney packs, picked by the owner by ear from an audition sheet in the preview build (D524). The game's core, the simulator and every golden fight are untouched. Also in this milestone, done first: moving the dated test saves into the future (D526) and a retry on CI's browser-install step (D527).

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v1.1 must be **merged to `main`, tagged `v1.1.0` and accepted** (`docs/progress.md` says the playtest passed on 2026-10-23, D516; the merge of pull request #18 and the tag waited for the owner's go-ahead). Check that `git tag` lists `v1.1.0`, that `main` contains the v1.1 merge, and that `sim/baseline.json` is the accepted one. **If any of these is not so, stop and tell the owner. Do not branch from `milestone/v1.1`.** *(Until the docs commit, this box is read from `docs/flesh-out/v1.2/OUT-4a-plan.md`.)*
1. **Branch.** Work on `milestone/v1.2`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v1.2`. Push after every task; the preview build follows this branch.
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the v1.2 flesh-out files, and ask whether they have **read `OUT-1` to `OUT-9` — especially GDD §9.22 (the 15 moments and their triggers), the three approved strings, the readings in D520 (5), the zips change in D524 (4) and the size rule in D523 — and say yes.** **Do not apply the files or build anything until they answer yes** (or say what to change; then change the files first). When they say yes, add **D528** (`OUT-1`) with the date. D528 moves the status cells of D519–D527 to `Decided`. **No old row's cell is touched** (about 210 old rows still read `Proposed` and are covered by D385, D472 and D498).
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**
   - copy the files into `docs/flesh-out/v1.2/` and the summary into `docs/flesh-out/v1.2-summary.md`;
   - `OUT-1` rows → `docs/decisions.md` (**no old row's text is edited**; D519 is the sweep; D528 once the owner has said yes); `OUT-2a` → `docs/gdd.md` (every Find text must occur exactly once; if one has moved, stop and tell the owner); `OUT-4a` → this plan; `OUT-5` → `docs/questions.md`; `OUT-6` → `docs/flesh-out/v1.2/OUT-6-names.md`; `OUT-9` → `docs/technical-design.md` (edits plus the new §20);
   - **add three standing rules to `CLAUDE.md`:**
     1. *"Sound is UI-only: nothing in `src/core/` imports or reads the sound module or the `sound` setting (`rulesVersion` stays 5, save schema stays 12)."*
     2. *"Sound is never the only signal, nothing plays while the app is hidden, and a sound that cannot play now is skipped, never queued."*
     3. *"Write no player-facing strings for sound beyond the table in GDD §9.22; if a screen needs one, ask."*
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.
   - [x] **Docs commit** (2026-10-23): flesh-out files applied.
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. About 210 old rows still read `Proposed` in their cells; they are **not stops**: D385, D472 and D498 accept them as built, and old rows are never edited. D519–D527 are written `Proposed` and D528 (the D508 pattern) moves their cells to `Decided` when the owner says yes without exceptions. **A `Proposed` row from D519 up that D528 does not name: list it in the progress entry and ask the owner; do not edit it.**
5. **Constants and rules.** v1.2 adds **no `balance.ts` constant** and changes **none.** The 300 ms same-moment window and the sound timings are UI timings in the sound module, not game constants (D520 (5) (b)). `rulesVersion` stays **5.** Save schema stays **12.** **If any golden fight changes, or any recorded fight or stand changes its result, stop and ask.**
6. **The simulator.** Every player's report **equals the v1.1 baseline** (`176 of 176 same`); no simulator policy plays sound; **no new simulator row.** **Known and expected, not stops:** the Saturday runs show ✗ lines (reported only, D135), and benchmark warnings above 1× budget on slow CI runners (D445). **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows.
7. **Saves.** No save change. The `sound` field lives in the settings key (`lasthold:settings`, `lasthold-preview:settings`, D486). **If anything turns out to need a save change, stop and ask.**
8. **Sound rules (D520–D524).** Seven sounds, 15 moments, exactly as in GDD §9.22. **If a moment's cue cannot be worked out from what the UI already shows without changing `src/core/`, stop and ask** (D522 (8)). **No sound task starts before the owner has uploaded the packs** (D524 (3)).
9. **Sources and licences.** CC0 only. The four Kenney packs are Interface Sounds, Impact Sounds, RPG Audio and Music Jingles. Any clip from another site needs the owner's separate yes for that source. Every shipped sound is a manifest row (pack, URL, `CC0`, credit, original file name); `docs/credits.md` is generated.
10. **Size rules (D523).** The unit is 1 KB = 1,024 bytes. The row is 614,400 bytes. Measure the build **without sounds** first (SF.9); the sound budget is `614,400 − that − 1,024`, never more than 30 KB. **If the owner's picks do not fit, stop and ask; never change the row.**
11. **Pre-authorised old-test edits (D525, D526).** Allowed, each listed in the progress entry, nothing loosened: (1) extend `app-settings.test.ts` for `sound`; (2) add the Settings screen with the Sound row to the contrast, motion and tap-sweep baselines (`polish-screens.ts` and the checks that read it); (3) extend the offline smoke to fetch a sound from the cache; (4) teach the credits / manifest tests about the audio list; (5) add the sound module to the non-coupling lint list; (6) the offset change to the real-date fields of `v9.json` and `v12-played.json` and the new check script (D526); (7) one scenario added to `smoke.spec.ts` (Sound On, one build, the fake engine records `build`). Any other edit to an existing test stops and asks.
12. **Strings and names.** Sound adds exactly the three strings in GDD §9.22; the debug-panel labels and the preview-only audition page's labels are exempt from the string rule (listed in §9.22). No new proper noun (OUT-6). No new proper noun (OUT-6). The sounds' internal ids are plain words, not names. **A new proper noun not in OUT-6: search it against GDD §2.3, and on a collision stop and ask, with alternatives.**
13. **Stop and ask the owner** if any golden fight or simulator report changes; if technical design in the repo contradicts OUT-9; if a cue needs a core change (item 8); if the picks do not fit (item 10); if a pack zip is over GitHub's 25 MB web-upload limit; if the container has no audio converter and none can be installed without a new npm dependency (D522 (2)); if the Sound row cannot reach 44 × 44 px at 320 px at Largest; or if a Pages / service-worker setting stops the `.mp3` files being cached.
14. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D519–D528, GDD §9.22, §6.5, `docs/flesh-out/v1.2-summary.md`, technical design §20.
- SF.1: `tests/saves/fixtures/`, `src/core/save/` (to classify time fields), technical design §5.2, §6.2. SF.2: `.github/workflows/ci.yml`, D512, D513.
- SF.3: `art-src/PACKS-NEEDED.md` (the v0.1 note, for the style; the new note goes in `art-src/packs/audio/`). SF.4: technical design §11.3, §12.1–§12.4; `src/content/assets.ts`; `deploy.yml`; `tools/contact-sheet.ts` (the pattern); `docs/flesh-out/v1.0/art-marks.md` (the marks pattern).
- SF.5: `src/platform/app-settings.ts`, `tests/**/app-settings.test.ts`, technical design §18.1; GDD §9.20, §9.22.
- SF.6, SF.7, SF.8: technical design §20; the UI files that show the 15 moments (Hold screen purchases and Rank-up, contract launch and finish, Delve floors and runs, hunter rank-up, event attempts, Long Night sheet, Arrange Hold).
- SF.9, SF.10: technical design §11.1, §12.4, §20.2; `vite.config.ts` (PWA / Workbox settings); `tests/e2e/smoke.spec.ts`.
- SF.11: `tests/e2e/polish-screens.ts`, `polish-tap-targets.spec.ts`, `polish-widths.spec.ts`, `polish-text-size.spec.ts`, `polish-motion.spec.ts`, `polish-contrast.spec.ts`.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Read GDD §9.22, the three strings and D520–D524, and say yes, or say what to change (Claude Code waits). This is D528 | Box step 2 |
| **After SF.3** | In GitHub, **switch the branch selector to `milestone/v1.2`**, open `art-src/packs/audio/`, **download the four Kenney zips** (links in `PACKS-NEEDED.md`: Interface Sounds, Impact Sounds, RPG Audio, Music Jingles) and **upload the zips there** ("Add file ▸ Upload files"). Open each link once to confirm it works. Tell Claude Code when done | D524 (3), (4) |
| If asked, during SF.4 | Say yes or no to any clip from outside the four packs (each source separately) | D524 (1) |
| **After SF.4** | **Listen to the audition page** on the preview build (about 15 minutes, about 35 clips, about 5 per sound) and tell Claude Code your pick for each of the seven sounds, or "none of these". Claude Code writes your answer to `docs/flesh-out/v1.2/sound-marks.md` | D524 (2) |
| After SF.9 | Hear the seven real sounds with the debug **Play sound** row on the preview, and approve them (or send back which to change) | D522 (6) |
| After SF.2 | Say yes or no to the CI retry once several CI runs have shown it | D527 |
| At the end | Playtest on your iPhone (checklist below); then say go for `sim:accept`, merge and tag `v1.2.0` | below |

#### Tasks

Each task is one Claude Code session; most milestones finish in fewer sessions than tasks. Tests come first for rules and saved data (§0.2). Every task ends with `npm run check` green and a short progress entry. Tick the box when its acceptance criteria all hold. **SF.1 and SF.2 come first because a test save goes stale on 2026-10-26 and CI hangs about one run in three; after that nothing sound-related starts until the packs are uploaded (D524 (3)). SF.5–SF.8 do not need the owner's picks and may run while the owner listens; SF.9 needs them.**

- [x] **SF.1 Move the dated test saves** *(fixtures; D526)*. First list, for `tests/saves/fixtures/v9.json` and `v12-played.json`, **exactly which fields are wall-clock epoch milliseconds** and which are event-clock values (`events.clock.value`, `tokens.at`, rests, cooldowns); write the table in the progress entry. Add one offset to the real-date fields only, far into the future. Add a script that loads old and new, subtracts the offset from the listed fields and asserts the two are deeply equal. **Scan every fixture** for dates within the next year and list them. **Acceptance:** every fixture loads, migrates, validates and round-trips; every golden fight and recorded stand replays line for line; the equality script passes; the progress entry lists the fields, the offset and the changed files. **Stop and ask** if a field cannot be classed with certainty (the fallback is to pin the affected tests' clock, which needs its own D525 line).
- [x] **SF.2 CI: retry the browser install** *(`.github/workflows/ci.yml` only; D527)*. Add a time limit and up to three tries to the one step that installs the test browsers. **Acceptance:** only that step in that file changed; no test and no pass rule changed. The progress entry records the following CI runs' results as they come (it is judged over several runs, not proven in advance).
- [x] **SF.3 The packs note** *(docs)*. Write `art-src/packs/audio/PACKS-NEEDED.md` (this also creates the folder on the branch, so the owner's web upload has somewhere to land) in the v0.1 style: the four Kenney packs with the links **copied from the pack pages** (the container may not be able to open kenney.nl; the owner opens each once), the licence (CC0), what to download (the zip of each), the instruction to **switch the branch selector to `milestone/v1.2` first**, how to upload, and what to do if a zip is over GitHub's 25 MB limit. **Stop** for the owner to upload (owner task). **Acceptance:** the note names all four packs with links copied from their pages, says zips and the branch switch, and the folder exists on the branch; nothing else is changed.
- [ ] **SF.4 Convert, shortlist and the audition page** *(tools, preview build only)*. Unpack the zips into a git-ignored folder. Pick about **5 candidate clips per sound** (about 35) by name, length and category, within the length guidance of D524 (2) (Fanfare and Nightfall from Music Jingles and RPG Audio; Place, Build, Launch from Impact Sounds and Interface Sounds). The packs are mostly OGG, which an iPhone may not play: **convert the candidates to mono MP3 now, with the loudness evening, short fades and tag stripping of D524 (2), and commit them under `art-src/audition/`** (small). **If the container has no converter, stop and ask (Q56): this blocks SF.4, not a later task.** Build the audition page: the candidates by number and slot, each with a play button of at least 44 × 44 px, each clip's length and estimated size, and a running total against the budget; it is generated from the committed `docs/flesh-out/v1.2/sound-marks.md` map (number → pack → original file name → slot; picks empty). The **preview channel** copies `art-src/audition/` and the page into its build; the **live channel does not** (technical design §20.2). **Acceptance:** a test fails if any candidate file or the page reaches the live build or counts toward the 600 KB measurement; Playwright at the phone viewport: every button ≥ 44 px and every candidate decodes in Chromium; the page matches `sound-marks.md`. **Stop** for the owner's picks (owner task).
- [ ] **SF.5 The setting and the Sound row** *(platform, ui)*. Add `sound: 'on' | 'off'` (default `'off'`; a broken value falls back to `'off'`) to the app settings (technical design §20.1); keep it through Reset everything (use the function Reset everything calls: §19.4 names it `resetAppSettingsTimestamps`, the code may call it `afterReset`; use the code's name and report the difference). Add the **Sound** row to `More ▸ Settings` with the three strings of GDD §9.22, word for word, and 44 × 44 px buttons. **Acceptance (D525 (1)):** unit tests: Off by default; a broken or missing value falls back to Off; Reset everything keeps `sound`; Paste code, Load file and Restore leave it alone; a failed write leaves the setting for this session only; the other fields behave exactly as before; the row shows the exact strings; **no sound is played yet**.
- [ ] **SF.6 The sound module** *(platform / ui; `src/platform/sound/` or the repo's nearest equivalent)*. Technical design §20.3–§20.4: the pure table from the 15 moments to the 7 ids; the strongest-wins function; the player that creates the audio context (suspended) and fetches and decodes the files **only when Sound is On**, plays with Web Audio buffer sources (no `<audio>`), and never queues; resume on `click` or `touchend`; the readiness rules (Sound On, unlocked, running, page visible; otherwise skip); the 150 ms hold; the global test hook whose fake **replaces only the output** (readiness rules still run; tests can set the fake context's state and the page's visibility); failure is silence. **Acceptance:** unit tests with a fake clock for the mapping (all 15 moments to the right sound), the strongest-wins rule (all pairs, by the stated order), the 150 ms hold, the skip rules (not ready, hidden, suspended, interrupted: nothing queued, nothing replayed), Sound Off (the page fetches and decodes nothing), a file that fails to decode (silence, no throw), and the hook (does nothing unless a test sets it); the layer rule (technical design §4.2) already bars `src/core/` from importing platform code, and a test proves nothing in `src/core/` references the sound module or the setting (D525 (5)).
- [ ] **SF.7 Wiring, part 1: the Hold, Arrange Hold, contracts, the silent list, the debug row** *(ui)*. Call the player from the UI at the trigger named for each moment in GDD §9.22: buy, new building, the Hold's Rank-up, launch, place, a contract's win or loss (when it finishes in the live tick while the app is open and visible; a catch-up and a debug time skip are silent). Add the debug **Play sound** row (seven buttons; UI-only; works only while Sound is On; does not set `debugUsed`). **First, record in the progress entry which fixture or debug command reaches each moment** (the v1.0 screen-list precedent). **Acceptance (Playwright with the fake engine, phone viewport):** each of these moments produces exactly its sound once; a bulk buy produces one; two moments inside 150 ms produce the stronger; the silent list produces none (taps, tabs, the away sheet, Auto-arrange, Clear to tray, Move to tray, recruiting, Stores, anything not on the list); with Sound Off the page requests nothing (the service worker's precache is not counted); with the page hidden nothing plays; coming back from away plays nothing; the debug row plays each of the seven without touching the save or `debugUsed`. **Stop and ask** if a trigger is not one single event in the UI or needs a core change.
- [ ] **SF.8 Wiring, part 2: Delves, events, hunter rank, the Long Night** *(ui)*. The same for: a Delve floor cleared, a run lost and the guardian (the first time the result is shown in playback), a hunter's rank-up, a Great Beast milestone, kill and a Legendary hunter unlocked (the first time the attempt's result is shown; at once if skipped or closed early; one sound per attempt), and the Long Night (the first time its sheet appears in live play while the app is open and visible). Record the fixture or debug command that reaches each moment. **Acceptance (Playwright, fake engine):** each moment produces exactly its sound once; reopening a result sheet or replaying from a log or the Library produces none; a playback skipped or closed early produces at most the one sound for its result; a boss or hunt attempt with no milestone, kill or unlock, the Last Stand's start and result (the Long Night excepted) and Leave run produce none; the whole e2e job stays within its 15-minute limit (D513). **Stop and ask** if a trigger is not one single event in the UI or needs a core change.
- [ ] **SF.9 Measure, convert and ship the owner's picks** *(tools, content)*. First **measure the production build without sounds** (gzipped, in bytes) and write the number in the progress entry; compute the budget by D523 (3): `614,400 − that − 1,024`, at most 30 KB. Then convert the owner's seven picks from the candidates' sources to **mono MP3 at about 48 kbps** (evened loudness, short fades, tags stripped, leading padding trimmed where the tool allows; no loops). Add `public/assets/audio/*.mp3`, the audio list and its manifest rows (technical design §20.2), and generate `docs/credits.md`; the About & Credits builder reads the audio list too. **Acceptance:** seven files within the combined cap (30 KB, and within the budget just computed); each has a manifest row with pack, URL, `CC0`, credit and original name; tests fail for a file not in the manifest, a row with no file, a missing credit and a credit with no row, and the sound packs agree both ways with the credits (D525 (4)); a test fails above 30 KB in total; the production build measures **≤ 614,400 bytes gzipped** and the number is in the progress entry; **if the picks do not fit, stop and ask** with the numbers and the options (fewer or shorter sounds), and never change the row. **Owner task:** hear the seven on the preview and approve.
- [ ] **SF.10 Offline and decoding** *(build, tests)*. Check that the build's precache patterns include `.mp3` and add the pattern if not (Workbox `globPatterns` in `vite.config.ts`; technical design §11.1, §20.2). Extend the offline smoke (D525 (3)): after the service worker is ready, go offline, reload, fetch one sound path from the cache and check the response and the byte length. Add a decode test: every shipped file decodes in Chromium, and in WebKit too if Playwright's headless WebKit can decode MP3 in CI (if it cannot, say so in the progress entry and leave WebKit to the owner's playtest, Q55). **Acceptance:** the smoke passes offline; every file decodes to a non-empty buffer in Chromium; the preview's service worker scope still excludes the live app (`navigateFallbackDenylist`, §11.3). **Stop and ask** if `.mp3` cannot be cached or served.
- [ ] **SF.11 Layout and accessibility sweeps** *(tests)*. Add the Settings screen with the Sound row to `tests/e2e/polish-screens.ts` (D525 (2)) and run the 44 px tap sweep, the width checks at 320 / 360 / 900 / 1300 px, the 320 px Largest text check, reduced motion and contrast, in both themes and at every Text size. **Acceptance:** 0 findings in every suite; the Sound row and its help line fit at 320 px at Largest with no sideways scroll; **no tap, sheet, confirmation or animation was added to any routine flow** (the Sound row adds two buttons in Settings only; the motion counts equal v1.1's); the playtest checks that a routine check-in is still 15 taps or fewer.
- [ ] **SF.12 Determinism, simulator, smoke and docs** *(wrap-up)*. Run `npm run check` and the full simulator suite. Run the production build locally and check it opens a v1.1 save with Sound Off (Claude Code cannot open the live preview; the owner does that at the playtest). Re-measure the production build (≤ 600 KB) and `npm run check` time (warn at 90 s, fail at 120 s, D512). Update `docs/progress.md` (including the v1.1 actual and a v1.2 actual for plan §0.7); tick the plan boxes; open the pull request from `milestone/v1.2` to `main` with the plain-language template and the playtest checklist below. **Acceptance:** all 55 simulator rows pass on the 5 seeds, every player's report equals the v1.1 baseline (`176 of 176 same`), every golden fight and recorded stand replays line for line (`rulesVersion` is 5), schema is 12, the production build is ≤ 600 KB gzipped with the number written down. Wait for the owner's "playtest passed" before `sim:accept`, the merge and the `v1.2.0` tag.

#### Out of scope for v1.2 *(visible deferred list, with the reason)*

| Item | Reason |
|---|---|
| Ambience loop and music | About 100–600 KB; does not fit the 600 KB row; would need a new measured row (D520 (6), D523 (5)) |
| Volume control and sound categories | One On/Off is enough (D521) |
| Sound for the Remembering and the endings | Silence is deliberate there (D520 (4)) |
| Sound on taps and tab changes | Too noisy for a check-in game (D520 (4)) |
| Sound for recruiting, Stores and other buying; for Auto-arrange, Clear to tray, Move to tray | Not one of the 15 moments (D520 (4)) |
| Sound while the app is hidden or for what happened while away | Fixed rule (D521 (7)) |
| Working around the phone's silent switch | Never (D521 (5)) |
| Tactical placement in the Last Stand | v1.5 — The Breach (D499, D500) |
| Rising difficulty | v1.3 — Keep the Vigil (D453, D477, D499) |
| The Descent | v1.4 (D448, D477, D499) |
| Event-only cosmetics, legendary hunters' animation, screen-reader labels | Deferred (D490, D489) |
| Any game rule, number, save or combat change | Not part of v1.2 (`rulesVersion` stays 5, schema stays 12) |

#### Simulator rows

No new simulator row. All 55 existing rows must pass and every player's report must equal the v1.1 baseline (`176 of 176 same`). No simulator policy plays or requests sound.

#### Owner playtest checklist *(on your iPhone; send screenshots of anything wrong)*

- **Sound is Off by default:** open the preview with your v1.1 save. Does More ▸ Settings show Sound: Off? Does the game stay silent?
- **Turn Sound On, then build something:** do you hear Build? Does the help line read right?
- **The silent switch:** flip your phone's silent switch (the side switch). Is the game silent? Flip it back: does sound return?
- **Phone volume:** do the sounds follow the phone's volume buttons, and are they a sensible loudness?
- **Leave and return:** switch to another app and back; lock the phone and unlock; take or fake a call. Does sound come back after your first tap? Is nothing played for what happened while you were away?
- **Offline:** turn on airplane mode, reload the app, and trigger a sound. Does it still play?
- **Each of the seven sounds:** use the debug **Play sound** row for Build, Launch, Place, Win, Lose, Fanfare and Nightfall. Does each sound right for its job? Can you tell Win from Fanfare, and Lose from Nightfall?
- **The 15 moments in real play:** buy and build; launch and finish a contract (win and lose); clear a Delve floor and lose a run; a hunter rank-up; a Great Beast milestone or kill; a Legendary hunter; the Long Night arriving; place a piece in Arrange Hold. Does each play the right sound once, and nothing plays for taps, tabs, Auto-arrange or the Remembering?
- **Several at once:** a bulk buy, or a result and a Rank-up together. Does it stay tidy (one sound)?
- **Reset keeps Sound:** use Reset everything… (on a spare save). Is Sound still how you left it? Does pasting a save code leave it alone?
- **Cold start:** close the app completely, open it with Sound On. Is the very first sound after the first tap heard?
- **Music in another app:** play music in another app, then open the game. Does the music keep playing and do game sounds still come?
- **The Hold's Rank-up** (debug panel): do you hear Fanfare?
- **Largest text:** set Text size to Largest. Send a screenshot of More ▸ Settings. Can you hit the Sound buttons easily?
- **Daily check-in speed:** is a normal check-in still 15 taps or fewer?
- **Do the sounds annoy you?** Too loud, too long, too many? Which one would you cut?
- **Looks wrong on my phone:** send screenshots.
- **Anything that felt like a chore.**

---

### v1.3 — Keep the Vigil *(outline: needs a flesh-out session first, §0.4)*

**Status:** not started *(scheduled by D453, D477, D499)*

**Scope:** rising-difficulty endless mode after Act VI (D453, D477). Once the gate is open and the player chooses (or enables) rising vigil cycles, each subsequent Long Night steps up the vigil pressure and wave scaling, with in-world Roll of Wardens marks and an endless-mode simulator check that fits inside the 5-minute CI limit (policy to be specified in its flesh-out, N11). Gated strictly behind post-Act VI play so Cycles 1–6 golden fights and simulator baselines never change.

---

### v1.4 — The Descent *(outline: needs a flesh-out session first, §0.4)*

**Status:** not started *(scheduled by D448, D477, D499)*

**Scope:** the third ending (`lore-secrets.md` §6, D448, D477): taking the fight down into the Deep for one final multi-stage or all-hands battle using everything learned across every cycle (the Unlit is scattered, not ended; a costly, heroic victory). Includes the ending's story texts (approved by the owner before building), Deep battle art, Library replay, and a reachability/victory check in `sim.yml`.

---

### v1.5 — The Breach *(outline: needs a flesh-out session first, §0.4)*

**Status:** not started *(scheduled by D499, D500)*

**Scope:** tactical building placement in the Last Stand ("Version 2"). Reuses `v1.1`'s saved `8 × 8` `state.layout` format (`0..7 × 0..7` with row `0` as the Fell Breach) **without migrating `HoldLayoutState`** (stand records will store an optional layout snapshot, S12). Gives position on the grid a clear, inspectable combat meaning in the Last Stand (such as Wall coverage across the north Breach columns, Watchtower firing lanes/arcs, and inner-ward protection for key buildings), with full in-game formula breakdowns (§5.0), updated Last Stand preview and Suggest workers within the §6.5 time budget, a layout rule for simulated players (`Auto-arrange` as the baseline tactical layout), and a `rulesVersion` bump to **6** with updated stand fixtures.

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
14. **v1.0 is one milestone of 15 tasks (TV.1–TV.13) over 14–18 sessions;** it changes no game rule; the art redraw is capped at about 40 pictures, 12 per session, and waits for the owner's marks.
15. **v1.1 is 15 tasks (TL.1–TL.13, TL.5 in three parts) over 12–16 sessions,** introducing decorative 8 × 8 building placement (schema 12) with Citadel defenses in row 1 and Bastion defenses in row 0, designed for reuse by v1.5 ("The Breach"), followed by outlines for v1.2 (Audio), v1.3 (Keep the Vigil), v1.4 (The Descent) and v1.5 (The Breach) (D499–D508).
16. **v1.2 is 12 tasks (SF.1–SF.12) over an estimated 8–11 sessions:** seven short sound effects for 15 moments, off by default, UI-only (no core, save or simulator change), Web Audio only; the sounds are capped at 30 KB and the whole build must stay at or under 600 KB; the owner picks by ear from an audition sheet; nothing sound-related starts until the owner has uploaded the four Kenney packs as zips (D519–D528). The estimate is a guess: the weight is two owner waits (the upload, the listening) and the size measurement, not the code.
