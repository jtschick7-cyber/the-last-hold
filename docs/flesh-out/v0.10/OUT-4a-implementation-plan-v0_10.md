# OUT-4a — Implementation plan, v0.10 section

**Apply to `docs/implementation-plan.md` in the docs commit, except the §0.6 row, which is OUT-4b and waits for T10.2.** *(Revised after the independent review, 2026-10-21.)* Changes:
1. Replace the whole `### v0.10 — Orders` section (the stub under v0.9) with the section below.
2. In `### v1.0 — Polish` replace the scope line with: *"an art and UX pass; a full balance pass; achievements (a candidate). Endings moved to v0.11 (D415)."*
3. Add the `### v0.11 — The Remembering` outline (end of this file) between v0.10 and v1.0.
4. Add the v0.10 row and sizing note to §0.7 (end of this file).
5. In §0.1 (milestone status) set v0.10 to "fleshed out" with the date and decisions D407–D425.

---

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
   - [ ] **Docs commit:** flesh-out files applied.
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

- [ ] **T10.1 — Save v10: the `orders` state and the migration** *(core/save)*
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

- [ ] **T10.2 — Constants and the locked row** *(content/balance.ts, docs)*
  - Add GDD §7.12 (OUT-2b) and the §7.4 pointer; add every `orders.*` key to `balance.ts` and the constants test, with its locked or tunable mark; add the §0.6 row (OUT-4b) to this plan; move any constants T10.1 hard-coded.
  - *Acceptance:* 1. The constants test fails if a locked value changes. 2. `step × 4 ≤ orders.perkCeiling` is a test for all four perks. 3. No constant is written anywhere but `balance.ts`.

- [ ] **T10.3 — Standing hooks, part 1: contracts, stands and Delves** *(core/systems/orders.ts)*
  - Per-source counts for **all four Orders from v10 on, opened or not.** Standing = `start` + Σ count × weight + Triumphant stands × chunk; level = the higher of the derived level and the saved high-water level. Hooks: a contract won (any village → Moot; Kozly Hollow → Quenchers), a **Triumphant** stand (to every Order), a Delve floor whose result paid at least 1 Riftglass (window `orders.delveWindow`, cap `orders.delveWeeklyCap`, on the event clock). Register Delve standing as a Delve reward with an idle source (Kozly Hollow contracts) in the Delve-optional content test (D20, D271).
  - *Acceptance:* 1. Each source adds exactly its weight once, including when it happens inside `advance` during a catch-up. 2. The Delve cap holds across a window; a floor in a Cold Comfort run, or one that paid nothing, adds nothing; a new window starts after `orders.delveWindow`. 3. A Triumphant stand adds the chunk to all four Orders. 4. Standing and level never drop, including after the weights are lowered in a test. 5. The Delve-optional test passes with the new reward listed. 6. **No existing result changes** (golden fights, recorded stands).

- [ ] **T10.4 — Standing hooks, part 2: alchemy and the Archive; the Long Night** *(core/systems/orders.ts)*
  - Hooks: a brew finished, an experiment finished, a property revealed (Grey Wives); a document, a hunter letter and a name found (Bell-Watchers). The Long Night keeps counts, `start`, flags and the high-water level. A boss attempt and a hunt add nothing.
  - *Acceptance:* 1. Each source adds exactly its weight once. 2. The Long Night keeps everything. 3. Events add nothing (a test over a boss attempt and a hunt). 4. **No existing result changes.**

- [ ] **T10.5 — Seats, the third seat and swaps** *(core/systems/orders.ts, commands)*
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

### §0.7 additions

Table row: `| v0.10 | 19 (T10.1–T10.19) | 10–14 |`

*Sizing note (v0.10 flesh-out):* v0.9 had 19 tasks and v0.10 also has 19, with **no new combat machinery** (no fight formula changes), one new system with simple rules (standing, seats), sixteen short scene texts and one new simulator player. The big risks are not size but **tuning the sketches** (T10.18) and **the backfill of the owner's save** (T10.1). Estimated 10–14 sessions. *(Claude Code adds v0.9's actual count from `docs/progress.md` at the docs commit, as it did for v0.8.)*
