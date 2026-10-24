# OUT-4a — Edits to `docs/implementation-plan.md` (v1.3 "Keep the Vigil", D538–D551)

Every **Find** below was copied from the Project's copy of `docs/implementation-plan.md` on 2026-10-24 and, as far as the Project's text can be searched, occurs **exactly once** in it. **These Finds were not machine-checked** (only the GDD's were; the plan comes inline and is not on disk here). **If one does not match exactly once, stop and tell the owner.** Edits A–C replace the v1.3 section (heading, status line, scope paragraph). Edits D–F are small and independent. D, E and F use short Finds on purpose, because earlier milestone-end edits may have touched the longer lines around them.

## A — The v1.3 heading

**Find:**
```markdown
### v1.3 — Keep the Vigil *(outline: needs a flesh-out session first, §0.4)*
```

**Replace with:**
```markdown
### v1.3 — Keep the Vigil
```

## B — The v1.3 status line

**Find:**
```markdown
**Status:** not started *(scheduled by D453, D477, D499)*
```

**Replace with:**
```markdown
**Status:** not started *(scheduled by D453, D477, D499; fleshed out 2026-10-24; decisions D538–D551; files in `docs/flesh-out/v1.3/`)*
```

## C — The v1.3 scope paragraph, replaced by the full section

**Find:**
```markdown
**Scope:** rising-difficulty endless mode after Act VI (D453, D477). Once the gate is open and the player chooses (or enables) rising vigil cycles, each subsequent Long Night steps up the vigil pressure and wave scaling, with in-world Roll of Wardens marks and an endless-mode simulator check that fits inside the 5-minute CI limit (policy to be specified in its flesh-out, N11). Gated strictly behind post-Act VI play so Cycles 1–6 golden fights and simulator baselines never change.
```

**Replace with:**
````markdown
**Scope:** **Rising Vigil**: an **On / Off switch on the Last Stand screen**, shown only when the Remembering gate is open (GDD §5.9.10, §9.23, D539). Each stand fought with it On is one level harder than the last On stand: wave **Health and Might × (1 + 0.0061 × Threat + s × level)**, a small Embers bonus per level, **no cap, one lever, steady steps** (D540, D541). Off is exactly an ordinary stand and the level is kept. **Save schema 12 → 13** (a small `vigil` block and an optional `vigilLevel` on each cycle record, D543); **`rulesVersion` stays 5** because the level is saved on the stand's record and level 0 takes the old path bit for bit (D542). One new command, `vigil.set`; one row on the stand screen; a drawn mark and a plain line on the Roll of Wardens; **no new art, no story text, no sound** (D545). Simulator: a probe, a new player (the Vigilant) in its own `vigil` shard, and three Proposed rows A–C (D546; a fourth is a unit test). **The download row stays at 600 KB; 3,892 bytes are left, and the vigil code must fit in them or the milestone stops and asks** (D547). No stand fought before the gate is open, Delves, events, contracts, Threat rates, band thresholds, relic milestones or any other player's baseline changes.

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v1.2 must be **merged to `main`, tagged `v1.2.0` and accepted** (`docs/progress.md`: pull request #19 merged, merge commit `0a41df8`, the owner tagged `v1.2.0`, playtest passed, D530). **Also check that the CI changes of D533–D537 (four e2e shards, `--fully-parallel`, the install retries, the apt setting) are on `main`:** progress.md shows them on branch `ci/e2e-shards` and says "Still to see on CI". **If they are not on `main`, KV.1 opens that branch as its own pull request, with the owner's yes. If a shard is still over 5 minutes, the D537 fallback (a longer limit for the e2e shards) is the owner's call.** v1.3 adds the stand screen and the Roll to the sweeps, which makes e2e longer. Check that `git tag` lists `v1.2.0`, that `main` contains the v1.2 merge and the CI changes, that `sim/baseline.json` is the accepted one, and that the latest CI run on `main` has **every job under 5 minutes** (D320). **If anything else is not so, stop and tell the owner. Do not branch from `milestone/v1.2`.** *(Until the docs commit, this box is read from `docs/flesh-out/v1.3/OUT-4a-plan.md`.)*
1. **Branch.** Work on `milestone/v1.3`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v1.3`. Push after every task; the preview build follows this branch.
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the v1.3 flesh-out files, and ask whether they have **read `OUT-1` to `OUT-9` — especially GDD §5.9.10 and §9.23 (the switch, the level, the strings), the readings in D549, the size rule in D547 and the two questions Q57 and Q58 — and say yes.** **Do not apply the files or build anything until they answer yes** (or say what to change; then change the files first). When they say yes, add **D551** (`OUT-1`) with the date. D551 moves the status cells of D538–D550 to `Decided`. **No old row's cell is touched.**
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**
   - copy the files into `docs/flesh-out/v1.3/` and the summary into `docs/flesh-out/v1.3-summary.md`;
   - `OUT-1` rows → `docs/decisions.md` (**no old row's text is edited**; D538 is the sweep; D551 once the owner has said yes); `OUT-2a` → `docs/gdd.md` (every Find text must occur exactly once; if one has moved, stop and tell the owner); `OUT-4a` → this plan; `OUT-5` → `docs/questions.md`; `OUT-6` → `docs/flesh-out/v1.3/OUT-6-names.md`; `OUT-9` → `docs/technical-design.md` (edits plus the new §21);
   - **add three standing rules to `CLAUDE.md`:**
     1. *"Rising Vigil level 0 takes the old stand path bit for bit: nothing outside the stand code reads `vigil`, and nothing in `src/ui/` computes the vigil factor."*
     2. *"A stand's vigil level is saved on its record; a wave list, a log or a preview is always rebuilt with the saved level, never the switch's current state."*
     3. *"Write no player-facing strings for Rising Vigil beyond the table in GDD §9.23; if a screen needs one, ask."*
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.
   - [ ] **Docs commit:** flesh-out files applied.
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. About 210 old rows still read `Proposed` in their cells; they are **not stops** (D385, D472, D498, D528, D531, D532 cover them, and old rows are never edited). D538–D550 are written `Proposed`, and D551 moves their cells to `Decided` when the owner says yes without exceptions. **A `Proposed` row from D519 up that D538 and D551 do not name: list it in the progress entry and ask the owner; do not edit it.**
5. **Constants and rules.** v1.3 adds exactly **two tunable constants** (`vigil.strengthPerLevel`, `vigil.embersPerLevel`, GDD §7.13) and changes none. They start as **marked placeholders** (a guess with no measurement behind it, added in KV.3) and are replaced in KV.9 by measured values the owner approves; the milestone cannot be accepted with a placeholder in place. **`rulesVersion` stays 5** (D542). **If any golden fight changes, or any recorded fight or stand changes its result, stop and ask.** No locked constant, no simulator target and no golden fixture is changed except by the owner's rows in KV.9 (the three new simulator rows, in their own commit).
6. **The simulator.** Every existing player's report **equals the v1.2 baseline** (`176 of 176 same`); only the Vigilant (new, `vigil` shard, Monday seeds only) is new, plus the probe (inside that shard). **No other player issues `vigil.set`.** **Known and expected, not stops:** the Saturday runs show ✗ lines (reported only, D135), and benchmark warnings above 1× budget on slow CI runners (D445). **If any CI job goes over 5 min, or the `vigil` shard would go over 4 min, stop and ask** (D320, D546). Never trim seeds or rows. The probe is judged in `sim.yml` only (D546 (4)), unless CI `check` stays at 90 s or less on 3 runs with it in.
7. **Saves.** Schema **12 → 13** (D543). **Tests first.** The migration needs a real old-save fixture: **`v12-owner.json` is the owner's real save, exported by the owner at KV.1** (owner task, below). The preview build uses its own storage (`lasthold-preview:`) and can never read or migrate the live save; **the one-way moment is the merge and the live deploy**, so the owner exports again just before the merge as a fresh rollback point. To playtest with their own save, the owner imports its code into the preview. Add `v13.json` and `v13-played.json`. A round-trip test loads each fixture, migrates, validates and re-saves equal. **`resetForLongNight` must keep `vigil`** (a test). **If anything else turns out to need a save change, stop and ask.**
8. **Strings and names.** Rising Vigil adds exactly the strings in GDD §9.23 (D545). One name to confirm in OUT-6: "Rising Vigil" (the word "Vigil" is already in the game). **A new proper noun not in OUT-6: search it against GDD §2.3, and on a collision stop and ask, with alternatives.**
9. **Size (D547).** The row is 614,400 bytes; v1.2 measured **610,508**, so **3,892 bytes** are left. My guess for the code is 2–4 KB gzipped (not measured), so this is a coin flip. **Method: the v1.2 SF.9 method (the sum of per-file gzip -9 of `dist`, 1 KB = 1,024 bytes), the same every time.** **Measure at KV.2, KV.3, KV.4, KV.6 and KV.10 and write each number in the progress entry.** If the first overrun appears, apply the fallback order (1) drop the drawn Roll mark and keep the line; (2) shorten the help line; (3) keep the debug command out of the live build if possible; (4) as a last resort, propose a measured new row for the owner to approve. **Never change the row.** The size-row question for v1.4 (story texts and Deep battle art cannot fit under 600 KB anyway) is raised at the v1.4 flesh-out.
10. **Pre-authorised old-test edits (D548).** Allowed, each listed in the progress entry, nothing loosened, **made in the task that needs them** (KV.10 checks the list is complete): (1) schema number 12 → 13 where tests state it; (2) the three new fixtures added to the save tests' fixture list; (3) the stand screen with the Rising Vigil row (On and Off) and the Roll of Wardens appended to `polish-screens.ts` and the checks that read it; (4) the vigil module and reads of `state.vigil` added to the non-coupling lint list (it checks imports and property reads, not the word, because the ending id `'vigil'` exists); (5) the new screen keys appended to the motion and contrast baselines; (6) existing tests that list every command, debug command or fixture name (for example the "played" list in `opening.test.ts`) gain the new entries. Any other edit to an existing test stops and asks.
11. **Stop and ask the owner** if any golden fight or existing simulator report changes; if technical design in the repo contradicts OUT-9; if the build is over 614,400 bytes; if the `vigil` shard would pass 4 min or any CI job passes 5 min; if the stand's wave strength is computed in more than one place and cannot be made one function; if the Standard player's stand result changes at all with the gate closed; if the Rising Vigil row cannot reach 44 × 44 px at 320 px at Largest; if `vigilLevel` cannot be carried into a rebuilt wave log without a core change beyond the stand code; or if Q57 has not been answered when KV.9 starts.
12. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D538–D551, GDD §5.9.3, §5.9.4, §5.9.10, §7.6, §7.13, §9.23, §6.5, `docs/flesh-out/v1.3-summary.md`, technical design §21.
- KV.1: `tests/saves/fixtures/`, `docs/progress.md`, `.github/workflows/`. KV.2: `src/core/save/` (migrations, validate), technical design §5.2, §9.4, `tests/saves/`; the v11 → v12 migration as the pattern.
- KV.3: `src/core/` Last Stand code (wave strength, Embers, the Threat factor), `src/content/balance.ts`, technical design §5.1, §5.4, §7.4; `tests/content/` (the GDD §7 keys test); the golden-fight and recorded-stand tests.
- KV.4: the stand-start command, `resetForLongNight`, `src/core/commands/`, the Remembering debug commands (D462), technical design §5.2, §15.
- KV.5: `src/platform/worker/` (the odds worker), GDD §5.9.3 (the preview), §6.5. KV.6, KV.7: the Last Stand screen, the stand result sheet, the Roll of Wardens screen; GDD §9.13, §9.23; `tests/e2e/polish-screens.ts`; v1.2's `sound-text.test.ts` as the strings-test pattern.
- KV.8, KV.9: `sim/` (players, shards, checks, `sim/shards.ts`, `sim.yml`), `sim/policies/orderer.ts` as the pattern, `sim/checks/v011.ts`, the Dross-Tide stand probe.
- KV.10, KV.11: `vite.config.ts`, `tests/e2e/`, the polish sweeps, `.github/workflows/`.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Read GDD §5.9.10 and §9.23 with their nine strings, D549, D547, Q57 and Q58, and say yes, or say what to change (Claude Code waits). This is D551, and it records your answer to Q58 | Box step 2 |
| **At KV.1** | If the CI changes (D533–D537) are not on `main`, say yes or no to opening branch `ci/e2e-shards` as its own pull request; if a shard is still over 5 minutes, the D537 fallback (a longer limit for e2e) is your call | Box step 0 |
| **At KV.1** | **Export your real save** from the live game (Claude Code tells you the exact steps in plain words) and upload it to the branch as `tests/saves/fixtures/v12-owner.json`, with the branch selector on `milestone/v1.3`. The preview build uses its own storage and cannot touch your live save; the one-way moment is the merge | D543, box step 7 |
| After KV.6 | Read the nine strings as they appear on the stand screen (or on screenshots) and say yes, or what to change | D545 |
| **After KV.8** | Look at the curve Claude Code reports: waves held and Embers at each level, for **both** the additive and the compounding step, at two Threat points. **Answer Q57** (keep the additive step, or compound). This must happen before KV.9 | D540, D549 (1), Q57 |
| **After KV.9** | Say **yes or no** to the two constants (`s`, `e`), the Embers tolerance and rows A–C (each in its own commit) | D540, D541, D546 |
| **Just before the merge** | **Export your save again** (a fresh rollback point; schema 13 is one-way on the live app) | D543 (7) |
| At the end | Playtest on your iPhone (checklist below); then say go for `sim:accept`, merge and tag `v1.3.0` | below |

#### Tasks

Each task is one Claude Code session; most milestones finish in fewer sessions than tasks. Tests come first for rules and saved data (§0.2). Every task ends with `npm run check` green and a short progress entry, with the size number where the box says so (step 9). Tick the box when its acceptance criteria all hold. **KV.1 comes first. KV.2 and KV.3 may run in either order. KV.4 needs both. KV.5 needs KV.3. KV.6 and KV.7 need KV.4. KV.8 needs KV.3 and KV.4 (it uses the core, not the preview or the screens). KV.9 needs KV.8 and the owner's answer to Q57. The waits are the owner's save export (KV.1) and the owner's reading of the curve (after KV.8). The e2e sweeps get longer as the stand screen and the Roll join them (D548); every shard must stay under 5 minutes.**

- [ ] **KV.1 Docs commit, CI precondition, branch and the owner's save** *(docs, fixtures)*. Check the preconditions (box step 0); if the CI changes are not on `main`, ask the owner and open `ci/e2e-shards` as its own pull request. Create `milestone/v1.3`, ask for the owner gate (D551, which also records the answer to Q58), apply the flesh-out files and the three `CLAUDE.md` rules in their own docs commit, and ask the owner to export their save (owner task). **Report in the progress entry whether the owner's real save has the Remembering gate open** (if not, the owner will see Rising Vigil only through the debug commands for a long while: Q46 says about 20–25 cycles to Study all 16 species). **Acceptance:** `npm run check` green; the progress entry lists the precondition checks (tag, merge, CI shard times), the files applied and the gate state of the owner's save; `v12-owner.json` is in `tests/saves/fixtures/` once the owner has uploaded it. **Stop** for the owner's upload; KV.3 does not need it.
- [ ] **KV.2 Save schema 13 and the migration** *(core/save; tests first)*. Technical design §5.2 and §9.4 (OUT-9): add `vigil: { on: false, stands: 0 }` to the state and an optional `vigilLevel` to the stand's saved inputs; add `save/migration-v13.ts`; add validation (D543 (6)); make `resetForLongNight` keep the block; create `v13.json` (the owner's save migrated, not played). **`v13-played.json` is made in KV.4**, with the real commands, once they exist. **Acceptance (tests first):** every fixture, including `v12-owner.json`, loads, migrates, validates and round-trips (save → load → equal); the migrated save has the empty block and no `vigilLevel` anywhere; `resetForLongNight` keeps the block unchanged; the validation warning for a count mismatch fires and never refuses a load; the "newer version" guard test uses the current code refusing schema 14; **every golden fight replays line for line and every recorded fight and stand keeps its result**; the migration runs in ≤ 100 ms (the benchmark row, D547); the block plus 20 recorded levels measures ≤ 0.5 KB (a unit test). Old-test edits D548 (1), (2), (6) listed. **Size:** write the number (box step 9).
- [ ] **KV.3 The two constants and the two factor functions** *(core, content; tests first; a pure refactor)*. Add `vigil.strengthPerLevel` and `vigil.embersPerLevel` to `src/content/balance.ts`, each marked `tunable` with a clearly commented placeholder (a guess, no measurement); GDD §7.13 already lists the keys. Then make the wave-strength factor `1 + w × Threat + s × L` and the Embers multiplier `1 + b × Threat + e × L` each live in **exactly one function**, built together with their breakdown lines (GDD §5.0; the Embers line is additive, `+{y}% on the waves part`, and adds up with the Threat line). The stand fight, the practice stands, the preview, the wave-log rebuild and the Embers payout all call them. **Acceptance (tests first):** the GDD §7 keys test passes in both directions; at level 0 every wave's Health, Might and every Embers figure equals the old code's, for a table of Threat values and for every recorded stand (`===`); with `L > 0` the factor and the Embers equal a table worked out independently in the test; the breakdown's lines add up to the number; **each of `threat.waveStrengthPerPoint`, `vigil.strengthPerLevel`, `embers.threatBonus` and `vigil.embersPerLevel` is read in exactly one file under `src/core`** (a test); every golden fight and recorded stand replays line for line; `rulesVersion` is 5. **Size:** write the number. **Stop and ask** if the wave strength cannot be made one function without a change beyond the stand code.
- [ ] **KV.4 The command, the level, the debug command and the played fixture** *(core; tests first)*. `vigil.set { on }` through `apply()` (refused when turning On with the gate closed or this cycle's stand started; Off always allowed before the stand starts; Claude Code confirms whether the "stand started" window exists, D544 (6)); the stand-start command reads the switch once and fixes `L = stands + 1`, adds 1 to `stands` and saves `vigilLevel` with the stand's saved inputs; a rebuilt wave list or log uses the saved level; level 0 uses the old path; `debug.vigil.setStands(n)` (a core command, marks `debugUsed`, refused for bad input); the vigil module and `state.vigil` reads on the non-coupling lint list (the lint checks **imports of the vigil module and property reads of `state.vigil`**, not the word "vigil", because the ending id `'vigil'` already exists, D548 (4)); then create `v13-played.json` with the real commands (gate open, three On stands, one Off, one more On). **Acceptance (tests first):** `vigil.set` accepted and refused in exactly the listed cases (table); starting a stand twice cannot add two levels; a stand started On and rebuilt from its record gives identical logs, and flipping the switch afterwards changes nothing (the rebuild test reads only the stand-inputs object); `remembering.choose('vigil')` leaves `state.vigil` identical and Rising Vigil stays available after `remember`; a planted read of `state.vigil` from `src/ui/` fails the lint; `v13-played.json` loads, validates and round-trips; every golden fight and recorded stand replays line for line. Old-test edit D548 (4) listed. **Size:** write the number.
- [ ] **KV.5 The preview and tomorrow's estimate** *(platform/worker)*. The odds worker's `stateSlice` carries the switch and the level the stand would have; the preview (expected waves with range, Embers now with breakdown, Embers tomorrow as an estimate) is recomputed when the switch flips, from the KV.3 functions. **Acceptance:** a unit test: the request carries the level, and the preview equals a real stand's preview at that level (same seeds, same samples), the Rising Vigil line appears in the Embers breakdown; the preview with the switch Off equals the pre-v1.3 preview for a table of states; the preview time stays within the existing budget (GDD §6.5, 1 s; the odds benchmark rows unchanged); "Embers tomorrow" is still labeled an estimate. *(At level 1 the median waves may not visibly move; the test therefore checks the request and the breakdown line, not a change in the median.)*
- [ ] **KV.6 The stand-screen row and the lines** *(ui)*. GDD §9.23: the Rising Vigil row (label, [On] [Off], help line, status line) shown only when the gate is open; the Embers breakdown line; the confirmation line; the result line. **The nine strings word for word, nothing else, and no new sheet.** A content test makes the nine strings equal GDD §9.23 (the v1.2 `sound-text.test.ts` pattern). **Acceptance (Playwright, phone viewport, using `debug.vigil.setStands` and the Remembering debug commands):** with the gate closed the stand screen is unchanged, defined as: no vigil test id is present and the existing stand-screen specs pass untouched; with it open the row shows and flipping it calls `vigil.set`; the status line reads right in each state; the confirmation and the result carry their lines only when On; buttons ≥ 44 × 44 px at 320 and 360 px and at every Text size; the help line wraps with no sideways scroll at 320 px at Largest; contrast passes in both themes; **no tap, sheet, confirmation or animation was added to any routine flow** and a routine check-in is still 15 taps or fewer. Old-test edit D548 (3) listed. **Size:** write the number. **Owner task:** read the strings as built.
- [ ] **KV.7 The Roll of Wardens tally** *(ui)*. For a warden whose stand's saved inputs have `vigilLevel ≥ 1`: a small mark drawn in code (no new picture file, no manifest row) and the line *"Rising Vigil, level {n}."* **Acceptance:** a warden with no `vigilLevel` shows exactly what it showed before; a warden with level 3 shows the mark and *"Rising Vigil, level 3."*; the Roll screen passes the 44 px, width, Largest, motion and contrast sweeps (D548 (3), (5)); no file under `public/assets/` changed. If the build is tight, the mark goes first (D547 fallback order).
- [ ] **KV.8 The probe, the Vigilant and the shard: measure only** *(sim)*. Build the probe exactly as D546 (1) defines it (the Vigilant's clone at its first endless stand, levels 0 to 10, the preview's 100 practice stands with the same seeds at every level); the Vigilant player (`sim/policies/vigilant.ts`, `vigil` shard, Monday seeds only, the declared `debug.remembering.openGate()` shortcut); a **grid of values for `s` and `e`** with **placeholder constants unchanged**. **Report, in the progress entry and in `docs/flesh-out/v1.3/vigil-curve.md`:** waves held and total Embers per level (median over the 100 samples, per seed and across the 5 Monday seeds, with the range), for **both** the additive step and the compounding step, at two Threat points, with the band (Broken / Held / Triumphant) at each level. **Acceptance:** the Vigilant reaches levels 1, 2, 3 on every Monday seed; waves held never rise with the level on the report; the report shows `debugUsed` for the Vigilant and says why; every other player's report equals the v1.2 baseline (`176 of 176 same`); the `vigil` shard, probe included, finishes in ≤ 4 minutes (else **stop and ask**, never trim); the probe's cost on `npm run check` is measured and, unless CI `check` stays at 90 s or less on 3 runs with the probe in, it is judged in `sim.yml` only. **Owner task:** read the curve and answer Q57. **Stop** for the owner.
- [ ] **KV.9 Set the constants, the rows and the docs** *(sim, content, docs)*. If Q57 was answered "compound", change the two factor functions and their tests in this task, with a new decisions row (before any vigil stand is recorded in a shipped save). Pick `s` by the D546 (1) rule (median waves lost by level 3 closest to 3) and `e` (total Embers at levels 1 to 3 closest to level 0); replace the placeholders; fix the Embers tolerance **before** the final judging run; re-run. Propose rows A–C (GDD §6.2) **in their own commit** (`sim/targets.ts`) after the owner approves; row D is a unit test. **In the same commit as the values, update the docs:** GDD §7.13 (the values; delete the placeholder note), §5.9.10 and the §6.2 rows (drop "Proposed:"), and add a decisions row for the values. **Acceptance:** the Vigilant reaches levels 1, 2, 3 on every Monday seed (row A); row B and row C pass at the chosen values; a unit test proves a stand with the switch Off equals a level 0 stand; no placeholder constant remains; every other player's report equals the v1.2 baseline. **Owner task:** say yes or no to the values, the tolerance and the rows. **Stop** for the owner.
- [ ] **KV.10 Budgets, size and the old-test list** *(measure)*. Measure the production build by the SF.9 method and write the number; the migration timing; the save growth; check that the D548 edit list in the progress entries is complete and that nothing was loosened. **Acceptance:** the production build is **≤ 614,400 bytes gzipped** and the number is written down; **if it is over, apply the D547 fallback order, then stop and ask** with the numbers, never change the row; migration ≤ 100 ms; save growth ≤ 0.5 KB; `npm run check` time is written down (warn at 90 s, fail at 120 s, D512).
- [ ] **KV.11 Determinism, simulator, e2e, docs and hand-off** *(wrap-up)*. Run `npm run check`, the full simulator suite and the e2e suite (4 shards, each under 5 minutes); run the production build locally and check it opens a v12 save (the owner's `v12-owner.json`) and a v13 save, with the gate closed and open (Claude Code cannot open the live preview; the owner does that at the playtest). Update `docs/progress.md` (including the v1.2 actual and a v1.3 actual for plan §0.7); tick the plan boxes; open the pull request from `milestone/v1.3` to `main` with the plain-language template and the playtest checklist below. **Acceptance:** all existing simulator rows and rows A–C pass on the 5 seeds, every other player's report equals the v1.2 baseline (`176 of 176 same`), every golden fight and recorded stand replays line for line (`rulesVersion` is 5), schema is 13, no placeholder constant remains, the production build is ≤ 600 KB gzipped (614,400 bytes) with the number written down, no CI job is over 5 minutes. Wait for the owner's "playtest passed" before `sim:accept`, the merge and the `v1.3.0` tag; remind the owner to export their save just before the merge.

#### Out of scope for v1.3 *(visible deferred list, with the reason)*

| Item | Reason |
|---|---|
| A cap or ceiling on the level | The owner chose no end (D539, D550) |
| A header line in wave logs and Library replays naming the vigil level | A new string; ask the owner if wanted (outside red-team N4). Bigger monster numbers in a replay of a vigil stand show with no mention of the level until then |
| Compensation for the Triumphant, trust and skill-XP slowdown at high levels | Stated as a limit (GDD §5.9.10, D549 (10)); a design change if wanted |
| A second lever (an extra tier, Armor, new wave kinds) | Harder to read and to balance; one lever was chosen (D540) |
| In-world Roll lines or story text for the vigil | Needs lore; the owner chose a plain tally (D545) |
| New art for the vigil | The owner chose none (D545) |
| A sound for the vigil | The endings are silent and the switch is a settings-style tap (D550) |
| A new Embers sink (something to spend extra Embers on) | A new feature; Embers have a finite use today, which is stated (D541) |
| Any change to Delves, contracts, events, Threat rates, band thresholds, relic milestones or cycles 1 to 6 | Not part of v1.3 (D539) |
| Keep the Vigil on the ending card doing anything | It still changes nothing (D453, D539) |
| The Descent | v1.4 (D448, D477, D499) |
| Tactical placement in the Last Stand | v1.5 — The Breach (D499, D500) |
| Event-only cosmetics, legendary hunters' animation, screen-reader labels | Deferred (D490, D489) |

#### Simulator rows *(all Proposed; measured in KV.8, fixed and approved in KV.9, added to `sim/targets.ts` in their own commit)*

| Row | Judged on | Player |
|---|---|---|
| **A** The level rises by exactly 1 per On stand (levels 1, 2, 3 and `stands` = 3) | The Vigilant's 3 real endless cycles, every Monday seed | Vigilant |
| **B** More vigil never holds more waves | The probe (D546 (1)): per Monday seed, the median waves over 100 practice stands never rise from level L to L+1, L = 0 to 10; `sim.yml` only unless cheap | Probe |
| **C** Total Embers at levels 1 to 3 within a tolerance of level 0 | The probe, median of the 5 Monday seeds; the tolerance is fixed and approved before the final judging run | Probe |

*A stand with the switch Off equals a level 0 stand: a unit test (true by construction), not a row.*

All 55 existing rows must pass and every other player's report must equal the v1.2 baseline (`176 of 176 same`). No other simulator policy issues `vigil.set`.

#### Owner playtest checklist *(on your iPhone; send screenshots of anything wrong)*

- **Export before the merge:** did you export your save just before the merge, as a fresh rollback point? (Schema 13 is one-way on the live app; the preview uses its own storage and cannot touch it. To test with your own save, import its code into the preview.)
- **Gate closed:** with a save that has not opened the gate, does the Last Stand screen look exactly as before, with no Rising Vigil row?
- **Gate open:** use the debug panel to open the gate (the Remembering debug commands, D462). Does the Rising Vigil row appear above Start, with On and Off buttons you can hit with your thumb? Does the help line read right?
- **Flip it:** turn it On and Off a few times. Does the preview change each time (expected waves, Embers now, Embers tomorrow)? Does the Embers breakdown (long-press) show the Rising Vigil line and add up?
- **An On stand:** start a stand with it On. Does the confirmation say *"Rising Vigil is on at level 1."*? Does the result say *"Fought with Rising Vigil at level 1."*? Is the Roll of Wardens line *"Rising Vigil, level 1."* with its small mark?
- **Off after On:** next cycle, leave it Off. Is the stand an ordinary stand? Does the screen say *"Next level when on: 2"*?
- **Carry on:** turn it On again. Is it level 2? Did the switch stay as you left it across the Long Night?
- **How it feels:** use the debug panel to set the level up (set stands to 3, then 6). Does each step feel steady? Does it lose about one wave per level early on, and how does it feel later (Q57 is already answered; tell me if it feels wrong)? Do the Embers feel fair at levels 1 to 3?
- **After Remember Them:** choose Remember Them (on a spare save). Is the switch still there and still working? Does Keep the Vigil on the ending card still change nothing?
- **Largest text:** set Text size to Largest. Send a screenshot of the stand screen with the row. Can you hit On and Off easily at 320 px width?
- **Offline and reload:** reload the app, then airplane mode and reload. Is the switch and the level still as you left them?
- **Daily check-in speed:** is a normal check-in still 15 taps or fewer?
- **Looks wrong on my phone:** send screenshots.
- **Anything that felt like a chore.**
````

## D — The plan header "Depth" line

**Find:**
```markdown
v1.3–v1.5 are at outline level.
```

**Replace with:**
```markdown
v1.3 is fleshed out (2026-10-24, D538–D551; in full detail below). v1.4–v1.5 are at outline level.
```

## E — §0.7 size table: add v1.3

**Find:**
```markdown
| v1.2 | 12 (SF.1–SF.12) | 8–11 **[JC]** |
```

**Replace with:**
```markdown
| v1.2 | 12 (SF.1–SF.12) | 8–11 **[JC]** |
| v1.3 | 11 (KV.1–KV.11) | 8–10 **[JC]** |
```

## F — Judgment call 17

**Find:**
```markdown
The estimate is a guess: the weight is two owner waits (the upload, the listening) and the size measurement, not the code.
```

**Replace with:**
```markdown
The estimate is a guess: the weight is two owner waits (the upload, the listening) and the size measurement, not the code.
17. **v1.3 is 11 tasks (KV.1–KV.11) over an estimated 8–10 sessions:** Rising Vigil, an On / Off switch on the Last Stand screen once the Remembering gate is open; one lever (wave Health and Might), a small Embers bonus, steady steps, no cap; save schema 13; `rulesVersion` stays 5; a probe and a new Vigilant player in their own shard; the download row stays at 600 KB with only 3,892 bytes of room (D538–D551). The estimate is a guess: the weight is the measuring task (KV.9), two owner waits (the save export, the reading of the curve) and the size check, not the code.
```
