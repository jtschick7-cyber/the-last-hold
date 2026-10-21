# OUT-4a — Plan section for v0.11 (replaces the outline in `docs/implementation-plan.md`)

Replace the block from `### v0.11 — The Remembering *(outline only…` up to (not including) `### v1.0 — Polish` with the text below. Also apply the three small edits at the end.

---

### v0.11 — The Remembering

**Status:** not started *(fleshed out 2026-10-21; decisions D446–D467; files in `docs/flesh-out/v0.11/`)*

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
   - [ ] **Docs commit:** flesh-out files applied.
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

- [ ] **T11.1 Save v11: the `remembering` block.** `nearSeen`, `readyNoted` and `endings`; the v10 → v11 migration (empty block); validation (array order; rules in OUT-9); fixtures per OUT-8 (`v11-played.json` is built later in T11.5, once the commands exist); round-trip tests. **Acceptance:** both v10 fixtures load, migrate, validate and round-trip; the migrated block is empty; `orders` is identical across the migration step; schema 12 is refused by v11 code; the golden fights are unchanged.
- [ ] **T11.2 The gate and the content tests.** `rememberingGate(state)` (derived; reads the **stored knowledge level**), `actVIStandApplied`, `endingChoosable`. Content tests, extending the existing required-content tests (v0.7, v0.9, v0.10): every name and every contract species has a source that is not an Order, a Delve or an event; the contract-species list is pinned (changing it needs a decisions row); the base stand pool equals the contract species. **Acceptance:** closed with 39 names; closed with one species at 3 kills; open with all; never stored; a planted Order-only source fails.
- [ ] **T11.3 Remove the closing line.** Remove the Act VI closing line from the Long Night flow, the away sheet and every live doc text (OUT-2a B1–B5, OUT-3 small edits 1 and 2); a cycle with no act skips the step; Act VI's testament still plays. Older tests that assert the line are changed to assert **its absence** (D465), each listed in the progress entry. **Acceptance:** a story-less cycle's Long Night shows no closing line; a search of `src/` and the shipped content strings finds none; in `docs/`, the line appears only in the decisions log, `docs/archive/`, `docs/flesh-out/` and OUT-2a's find texts; Act VI's stand still shows D6-06.
- [ ] **T11.4 Pechko's near-scene, the card (pre-choice forms) and the ready line.** R-01 / R-02 when `rememberingNearPending`, in the load order of technical design §6.2, on the live path after the stand as well as on load; `remembering.seeNear()` on Continue only (the ✕ leaves it waiting); the card in its not-open and open forms with live counts and the Names and Bestiary links; the ready line (`noteReady`). **Acceptance:** the scene plays once and picks R-01 or R-02 by the gate; a save already past Act VI's stand gets it once on the next Hold visit; no bar, no percentage, no badge; "Names found" equals the Names view; "Creatures known well" equals the number of contract species whose Bestiary entry shows Studied or Mastered; the ready line shows once, only after the scene.
- [ ] **T11.5 The choice and the debug commands.** `remembering.choose('remember' | 'vigil')`; recording; refusal unless `endingChoosable`; Remember Them once; Keep the Vigil once, only when the gate is open, none after Remember Them; `debug.remembering.openGate()` and `debug.remembering.finishActVI()` (D462); the scripted `v11-played.json` and its script. **Acceptance:** every refusal case has a test (before Act VI's stand, gate closed, twice, `vigil` after `remember`); the pre-choice card forms (not open, open) are correct; commands go through `apply()`; `v11-played.json` loads, validates and round-trips.
- [ ] **T11.6 Keep the Vigil.** R-10 once on choosing; the Library entry "Later". **Acceptance:** a before/after state diff outside `remembering` is empty **at the same `now`, excluding** `meta.lastSeen`, the clock high-water marks and the `events.clock` fold-in; the entry replays.
- [ ] **T11.7 The reading.** R-03, the reading screen (automatic, tap, Skip, reduced motion), the roll table from the same data as the Names view, the Unlit's line; pace in `src/ui/remembering/timing.ts`. **Acceptance (fake timers):** 40 names in year order at the set interval; a tap shows the next at once; Skip jumps to the last frame; the table equals lore §20; the screen fits at phone width.
- [ ] **T11.8 Orders in the ending.** `endingOrderCards(state)` (derived from `chaptersRead`, `readWith` and whether the Quenchers have opened): R-05 to R-08 and Věra's fallback in the fixed order. **Acceptance:** a table test over every case (none read; only one; all; Moot A and B; Quenchers A and B; Quenchers never opened); **changing current seats or levels changes nothing;** an unfinished Order is silent.
- [ ] **T11.9 The ending sequence.** R-04, R-04b (only if Sigrun is on the roster), the Order cards, R-09, then the card in its "After Remember Them" form; the whole sequence as one stack played from the card and replayed from the Library. **Acceptance:** the order is R-03, reading, R-04, R-04b, Order cards, R-09, R-11; Skip on the reading does not skip the rest; an interrupted ending replays whole from the Library.
- [ ] **T11.10 R-11 and the Roll of Wardens mark.** R-11 as the last card (derived from `endings`, not a found document) and under "After the ending" on the Rime shelf with Ilse's note; the Roll mark on the warden in office. **Acceptance:** across the whole ending `orders` (standing, counts, seats, levels, `readWith`) and `skills` are unchanged and no document is filed (a test); the Roll mark is on the right warden.
- [ ] **T11.11 Resident lines.** The eight lines of lore §34.7, shown only once Remember Them is recorded. **Stop and ask first** if there is no idle rotation of resident lines to add them to (primer §6.2 has triggered lines only; Ilse has none): the options are to attach them to existing triggered lines or to build a small rotation. **Acceptance:** none shows before; each shows after; no existing line is removed.
- [ ] **T11.12 The Hearth Hall look.** Frost gone and a lamp in the window, drawn in code, shown only once Remember Them is recorded. **Stop and ask first** if the Hearth Hall scene shows no frost now, or about which versions (by Rank, and the v0.7 cosmetics) get the lamp. **Acceptance:** the preview shows both states in every version agreed; the owner approves (owner task).
- [ ] **T11.13 The Library shelf "The Remembering".** Not shown until an entry is reached; "The reading" (whole sequence) and "Later"; R-11 on the Rime shelf. **Acceptance:** each entry replays; the shelf hides when empty; **the card's four forms** (not open, open, after Vigil, after Remember Them) are all correct, including after-choice forms with the gate artificially closed.
- [ ] **T11.14 The text content test.** Lore §34.10: string equality for every text; forbidden words (case rule for "the Hollow"); relative years; the 40 names only in the reading and the Names view; the allowed people list; the Orders-card cases; no side effects. **Acceptance:** a planted bad text fails each check.
- [ ] **T11.15 The reachability row (two sessions).** **(a)** Measure when `endingChoosable` first holds for Standard (5 Monday seeds; the Monday Standard runs already play on to the Dross-Tide stands, D403, so the ending is probably seen without extending runs; if not, do **not** extend them without asking, D320); add the one report field; propose **N = the measured median** with the numbers; stop for the owner. **(b)** After the owner approves N, commit the row alone. **Acceptance:** the row passes at the approved N by construction; a seed that never gets there counts as later than any N; the other players' reports equal the v0.10 baseline apart from the new field; the row is in `sim.yml` only.
- [ ] **T11.16 Layout checks and budgets.** Playwright at phone and the 900/1300 px breakpoints: no sideways scroll with the card, the reading and every ending card open; **all 40 names with their village lines fit.** Budgets by the D445 route: measure (reading start = tap to the first name painted; v10 → v11 migration), propose §6.5 rows for the owner to approve, and a unit test that save growth is ≤ 0.5 KB.
- [ ] **T11.17 Docs, progress and the playtest hand-off.** `progress.md`, the plan boxes, the PR (template), the playtest checklist; `sim:accept` only after the owner says the playtest passed.

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

## Three small edits to the rest of the plan

1. **§0.7 Size:** add the row `| v0.11 | 17 (T11.1–T11.17; T11.15 in two parts) | 9–12 |` and a sizing note: *"Sizing note (v0.11 flesh-out): seventeen tasks, no combat machinery and no new system with rules beyond one derived gate and one small save block; the weight is in the texts, the screens and one new simulator row. The risks are the reachability cycle N (measured, so it passes by construction, but the owner must be willing to accept it) and the two stop-and-asks (the resident rotation and the Hearth Hall frost)."*
2. **§0.5 Story pace, line 49:** replace the bullet that begins `- **An unwritten act**` (it quotes the closing line) with `- **A cycle with no act** closes with nothing in that step (D455). Every act is written.`
3. **v1.0 — Polish:** change the scope line to `**Scope:** an art and UX pass; a full balance pass; achievements (a candidate; the owner decides); the questions in `docs/flesh-out/v0.11-summary.md` ("For v1.0"). Endings are in v0.11 (D415, D448).`
