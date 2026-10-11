# The Last Hold — Implementation Plan

**Status:** Draft for review.
**Reads with:** `CLAUDE.md` (rules), `gdd.md` (what), `technical-design.md` (how), `decisions.md` (why).
**Depth:** v0.0–v0.3 are in full detail. v0.4–v1.0 are outlines; each gets a **flesh-out session** before it starts (§0.5).
**Markers:** **[JC]** = judgment call. **👤** = a task only the owner can do.

---

## 0. How milestones run

### 0.1 Workflow

1. **One branch per milestone:** `milestone/v0.X`. Pull requests target `main`.
2. **Each session:**
   - Read `CLAUDE.md`, then this file's section for the current milestone, then the GDD and technical-design sections that milestone cites.
   - Pick the **first unchecked task** whose dependencies are done.
   - Work it to **Done** (§0.3), tick its box in this file, and commit.
3. **Tasks are sized for about one session each.** If one turns out bigger, split it here first (add sub-tasks), then continue.
4. **Commit early and often,** using Conventional Commits (`feat:`, `fix:`, `test:`, `balance:`, `docs:`).
5. **When a design question comes up that this plan and the GDD don't answer,** ask the owner. Don't guess. Record the answer in `decisions.md`.

### 0.2 Testing approach (all milestones)

- **Test-first for anything with a formula, a rule, or saved data.** Write the test from the GDD numbers, then make it pass.
- **UI is tested by the Playwright smoke (from v0.2) and the owner's playtest,** not by unit tests of components.
- **During work, run the narrowest relevant tests. Before every commit, run `npm run check`** (typecheck + lint + tests + fast simulator checks).

### 0.3 Definition of done (per task)

- [ ] Acceptance items for the task are met.
- [ ] Tests are added or updated, and `npm run check` is green.
- [ ] No numeric game constants outside `balance.ts`; no content outside `src/content/`.
- [ ] If the save schema changed: a migration, a fixture, and a round-trip test (technical design §9.4).
- [ ] Any new proper noun is collision-checked and added to `tests/content/names.ts`.
- [ ] Decisions made along the way are logged in `decisions.md`.
- [ ] The box is ticked in this file.

### 0.4 Ending a milestone

1. Every task is ticked, and every **acceptance criterion** for the milestone is met.
2. Every **simulator check** for the milestone passes on 5 seeds. `sim/baseline.json` is updated with `npm run sim:accept`.
3. 👤 **The owner runs the playtest checklist** for the milestone. Issues found either get fixed now or get logged as follow-ups.
4. Update the statuses in the GDD and this file, and add a decisions-log row ("vX.Y complete").
5. Merge to `main`, then tag `vX.Y.0`. The deploy workflow publishes it.

### 0.5 Flesh-out sessions (before v0.4 and each later milestone)

A **planning session** with the owner (in chat, not in Claude Code) does four things:
1. Reviews what playtesting taught.
2. Brings the milestone's GDD section to full detail.
3. Expands its section here into tasks with acceptance criteria.
4. Logs the decisions.

Claude Code doesn't start an outline-level milestone until that has happened.

### 0.6 Balance-tuning protocol

- **When a simulator check fails, change constants in `balance.ts`, never formulas.** Commit with `balance:` and include the before/after report diff in the message.
- **A constant moved by more than 2×** gets a decisions-log row (GDD §5).
- **If no reasonable constant passes a check,** stop and raise it with the owner. That's a design problem, not a tuning problem.

### 0.7 Rough size **[JC]**

| Milestone | Estimated Claude Code sessions |
|---|---|
| v0.0 | 1–2 |
| v0.1 | 8–12 |
| v0.2 | 10–14 |
| v0.3 | 8–12 |

These are planning guesses, not commitments.

---

## v0.0 — Bootstrap

**Goal:** an empty, deployable, installable shell with every guard-rail in place. No game logic.
**Reads:** technical design §2–4, §11, §16.

### Tasks

- [ ] **T0.1 Scaffold.** Vite + TypeScript + Preact + signals. Strict `tsconfig` (with `noUncheckedIndexedAccess`). Create the folder structure from technical design §3, with `.gitkeep` files where folders are empty. Node 22 (`.nvmrc`). Pin exact dependency versions.
- [ ] **T0.2 Scripts.** `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`, `sim` (stub that exits 0), `check` (typecheck + lint + test + sim:check).
- [ ] **T0.3 Lint guard-rails.** ESLint flat config + Prettier.
  - Layer import rules (technical design §4.2).
  - A custom rule banning `Math.random`, `Date.now`, and `new Date` inside `src/core/`.
  - Named exports only.
  - **Test:** fixture files that break each rule must fail lint (checked through the ESLint Node API in a Vitest test).
- [ ] **T0.4 PWA shell.** vite-plugin-pwa (generateSW), the manifest, a placeholder icon, and base path `/the-last-hold/`. A "The Last Hold — v0.0.0" screen showing the build version. The update banner (technical design §11.1).
- [ ] **T0.5 CI.** `.github/workflows/ci.yml` runs check + build on every push and pull request.
- [ ] **T0.6 Deploy.** `.github/workflows/deploy.yml` deploys to GitHub Pages on push to `main`.
- [ ] **T0.7 README.** What the project is, how to run it, and links into `docs/`.

### Acceptance criteria

1. CI is green on `main`.
2. The Pages URL loads the shell.
3. 👤 The owner installs it to their phone's Home Screen, and it opens offline (airplane mode) after the first load.
4. The lint guard-rail tests prove each banned pattern fails.

**Simulator checks:** none.

**👤 Playtest checklist:**
- [ ] Installs on the phone.
- [ ] Opens in airplane mode.
- [ ] Version shows.

**Out of scope:** any game content or state.

---

## v0.1 — The Hold

**Goal:** the idle economy from Hamlet to Keep, playable on a phone, saving reliably, with offline progress, a debug panel, a working simulator, and the art pipeline.
**Reads:** GDD §1–5.2, §6, §7.1–7.2, §9 (v0.1 screens), §10; technical design §5–9, §12–15; `setting-primer.md` §5–7.

### A. Foundations

- [ ] **T1.1 RNG.** `core/rng`: sfc32, cyrb128 seeding, stream derivation (technical design §7.2), and `RollSource` with `seeded` and `scripted`. **Tests:** golden outputs for 3 seeds; `scripted` throws if it runs out of rolls or isn't fully consumed.
- [ ] **T1.2 Formatting.** `core/format`: numbers and durations (technical design §8). **Tests:** a full boundary table.
- [ ] **T1.3 Balance file.** `content/balance.ts` with every v0.1 key from GDD §7.1–7.2. Add the lint rule against numeric literals in `core/systems/`.
- [ ] **T1.4 v0.1 content.** Resources, jobs, buildings (GDD §5.1.2, including the Silver Seam max of 2), Ages (Hamlet, Keep, plus the Roll of Honor restoration text), and the starting state (GDD §5.1.4).
- [ ] **T1.5 v0.1 text.** Building blurbs; Brana and Pechko lines for every trigger in primer §6.2 (3–5 variants each); the Keep inscription (primer §6.5). Follow the primer's voice rules.
- [ ] **T1.6 Name check.** Collision-search every v0.1 proper noun (Stanholm, Gloamreach, Hearth Hall, Pechko, Brana Kolar, Emberwrights, building names) and create `tests/content/names.ts`. Log any collision in `decisions.md` and **ask the owner** for replacements.

### B. State, selectors, commands

- [ ] **T1.7 State v1.** `GameState` with **only the v0.1 fields** (later fields arrive through migrations), plus `createNewGame(seed, now)`.
- [ ] **T1.8 Breakdown and selectors.** The `Breakdown` type; selectors for rates, costs (n includes starting buildings, D30), housing, job slots, and the offline cap, each with its breakdown. **Tests:** every GDD §7.1 formula, with numbers taken from the GDD.
- [ ] **T1.9 Silver rules.** Silver-digger output takes only the relic and event buckets; at most 2 Seams (D30). **Tests:** Keep's +50% does not change silver income.
- [ ] **T1.10 Commands.**
  - `build.buy` (×1, ×10, Max, using the bulk and max-affordable formulas), `build.upgrade`.
  - `peasants.assign / unassign / fill`, `peasants.priority.set`, `peasants.autoSettle.set`.
  - `age.up`, `settings.*`.
  - **Tests:** refused commands never change state.
- [ ] **T1.11 Valuation.** `core/systems/valuation.ts`: best payback (GDD §5.1.2, D30) and the ● hint selector. **Tests:** worked examples with mixed costs; housing with and without free job slots.

### C. Time

- [ ] **T1.12 Event-driven `advance`.** Linear integration plus settle events (technical design §6.2), with the fixed tie order.
- [ ] **T1.13 Offline catch-up.** Cap, backward-clock guard, 60 s chunks with yields, and the away summary diff.
- [ ] **T1.14 Required tests.**
  - **Offline equivalence:** 12 h of live ticks equals one 12 h catch-up.
  - **Backward clock.**
  - **Determinism:** same seed and commands → identical state.
  - **Cap reporting:** the "away / counted" text.

### D. Saves

- [ ] **T1.15 Envelope and storage.** Main, backup (every 10 min), and quarantine slots; autosave every 30 s, after commands, and on hide or pagehide; the `persist()` request.
- [ ] **T1.16 Export and import.** The `LH1.` code (deflate-raw + base64url + FNV checksum), with an `LH0.` fallback; download and load of the save file; clear errors.
- [ ] **T1.17 Migrations framework.** An empty migration list, a v1 fixture, validation guards, and the newer-version refusal. **Tests:** round-trip, corrupted codes, unknown IDs dropped with a warning.

### E. UI (GDD §9, v0.1 screens)

- [ ] **T1.18 Shell.** Resource bar (tap for the rates sheet); tab bar showing only **Hold** and **More**; the sheet stack; tokens and themes (dark by default, light in Settings); the CC0 pixel font for headings and numbers.
- [ ] **T1.19 Hold screen.** Hold scene header; peasants panel (assign, fill, priority, auto-settle, idle warning); build list (×1 / ×10 / Max, muted unaffordable rows with a "ready in" time, the ● hint).
- [ ] **T1.20 Age screen.** Requirements checklist, costs, unlocks, and the restored part of the hold. Citadel shows "Coming in a later milestone" with no progress bar.
- [ ] **T1.21 Away sheet and Reports.** Last 3 sheets kept.
- [ ] **T1.22 Breakdown sheet.** Long-press (and hover on desktop) on any number with a breakdown; ⓘ markers.
- [ ] **T1.23 More menu.** Save & Data, Settings, About & Credits (version, `debugUsed` flag, credits).
- [ ] **T1.24 Debug panel** (`?debug`). Time skip through the real offline path; add resources; set seed; unlock an Age; raw state view; run a simulator policy for N hours; timing readout.
- [ ] **T1.25 Install tip and update banner** (technical design §9.1, §11.1).

### F. Art pipeline (technical design §12)

- [ ] **T1.26 Palette.** Propose 2–3 candidate 32-color palettes published for free use, as a rendered swatch page. 👤 **The owner picks one.** Record it in `palette.ts` and `credits.md`.
- [ ] **T1.27 Manifest and `<Sprite>`.** Placeholder fallback; `tools/gen-placeholders.ts`.
- [ ] **T1.28 Recolor tool and the first packs.** `tools/recolor.ts` (OKLab nearest color).
  - 👤 **Pack sourcing:** Claude Code sessions may not be able to download from asset sites, because network access is often limited to package registries. If downloads fail, **the owner downloads the chosen CC0 packs** into `art-src/packs/<pack>/`, together with their license file.
  - v0.1 needs: hold-scene tiles, resource icons, building icons, UI frames.
- [ ] **T1.29 Credits.** `tools/gen-credits.ts` generates `docs/credits.md`; a CI license test checks every pack asset.
- [ ] **T1.30 Contact sheet tool** (technical design §12.3), for the owner's art review.

### G. Simulator (technical design §13)

- [ ] **T1.31 Simulator CLI and report.** Virtual clock, 5 seeds, JSON and Markdown reports, baseline diff, `sim:accept`.
- [ ] **T1.32 Policies.** Opening, Standard, Light, Heavy (hold-only), using the shared valuation.
- [ ] **T1.33 v0.1 checks** (listed below), with thresholds in `sim/targets.ts` that mirror GDD §6.2–6.3.
- [ ] **T1.34 Tuning pass.** Adjust `balance.ts` until every v0.1 check passes (§0.6). Record moves of more than 2×.

### v0.1 acceptance criteria

1. From a fresh game, a player can reach Keep. The Age-up applies the Keep grants and shows the Roll of Honor.
2. **Every number on screen with a formula** opens a breakdown that matches the engine.
3. Closing the app for any time up to 12 h and reopening shows a correct away sheet. Time beyond the cap is reported.
4. A save survives a reload, an export code moves a save to another browser, and a corrupted code is refused with a reason.
5. The game works offline after installation.
6. Every required test in T1.1–T1.17 passes, and `npm run check` is green.
7. Every v0.1 simulator check passes.

### v0.1 simulator checks (GDD §6.2–6.3)

| Check | Target |
|---|---|
| First Cottage (Opening policy) | ≤ 1 min |
| First Mine (Opening policy) | ≤ 5 min. If missed, raise starting wood to 70 (D30). |
| Mill level 3 | 2–5 h |
| 10 peasants | 3–6 h |
| **Keep** | **8–14 h** (Standard, median); ≤ 24 h (Light); ≥ 6 h (Heavy) |
| Something to do | ≥ 90% of Standard check-ins |
| No dry spells | Never 2 empty check-ins in a row |
| No walls | ≤ 3 check-ins of saving per purchase (≤ 5 for Age-ups) |
| No overflow | All values < 1e300 over 14 days |

### v0.1 owner playtest checklist 👤

- [ ] Play 2–3 real days on the phone, with normal check-ins.
- [ ] A routine check-in takes 15 taps or fewer.
- [ ] Numbers are readable, and long-press breakdowns make sense.
- [ ] The away sheet after a night is right.
- [ ] Export the save code on the phone, import it on desktop, then continue on the phone.
- [ ] Screenshot pass: anything that "looks wrong on my phone" (GDD §9.11).
- [ ] Contact sheet review: palette and placeholders.
- [ ] Gut check: does the next goal always feel visible?

**Out of scope for v0.1:** hunters, contracts, combat, the bestiary, alchemy, Citadel and later Ages, the Long Night, and any `lore-secrets.md` content.

---

## v0.2 — Hunters & contracts

**Goal:** contracts from Hamlet onward, a hunter roster with an active/reserve split, transparent turn-meter combat, rewards that feed the Hold, and odds you can trust.
**Reads:** GDD §3.3, §4, §5.0 (combat), §5.3–5.5, §6 (v0.2 rows), §6.5, §7.3–7.4, §8.1–8.3, §8.5, §9.4–9.7; technical design §5.2–5.3, §7, §10.1, §14; `setting-primer.md` §3, §5, §6.3, §6.6–6.7.

### A. Content and state

- [ ] **T2.1 Content.**
  - The 8 hunters (stats, traits, unlocks, recruit prices, story-hunter flags), plus v0.2 traits and gear tiers.
  - All **12 monsters** (stats, resistances, abilities), each known and identified for free in v0.2.
  - Villages with heads and trust (silent), Barracks, Trophy Hall, and every v0.2 balance key.
- [ ] **T2.2 Text.**
  - Village contract notices: **3+ per village × location**, with the primer §6.7 seeds at ≤ 1 in 10.
  - The first-contract and vow scenes (primer §6.6).
  - Hunter bios.
- [ ] **T2.3 Name check** for the new proper nouns (hunters, village heads, Gloam Wolf).
- [ ] **T2.4 Migration v1 → v2.** Hunters, roster, board, running contracts, results, stats, and fight refs. Includes a fixture from a real v0.1 save.

### B. Combat (GDD §5.0, §5.5)

- [ ] **T2.5 Turn meter.** Ticks, the act-at-100 rule, the tie order, and the 400-tick limit.
- [ ] **T2.6 Attack resolution.** Roll order, the combat buckets, Armor on direct attacks only, taken% (capped at 75%, applied after Armor), immunity, rounding, crits, targeting weights, Mender healing (lowest %, self included), and Silver sub-hits.
- [ ] **T2.7 Monster abilities.** All 12, as restated for the turn meter in GDD §8.3. Statuses refresh unless stacking.
- [ ] **T2.8 Golden test, GDD §5.5.1.** Reproduce it **line for line** through a scripted `RollSource`. **This test is required, and it gates the milestone.**
- [ ] **T2.9 More combat tests.** Seeded golden fights (record 5, then freeze them); a determinism test; one test per ability; a `rulesVersion` constant.

### C. Contracts and roster

- [ ] **T2.10 Board.**
  - Opens when the first Mine is built (G6); a refill every 2 h, up to 6.
  - Tier unlocks (3 successes) and the tier mix; barrow contracts from T2; generation by location and tier, with **content tests that every generated cell has ≥ 1 species**.
  - **Decline.**
- [ ] **T2.11 Launch.** Party rules (at most 2 in Hamlet), provisions paid at launch, the Reckless rule with a per-hunter death-chance confirmation, and the fight seed.
- [ ] **T2.12 Completion events in `advance`.** Rewards at completion: bounty × `ageMult`, trophies, and XP. Also injuries (Bruised, Wounded, Grievous), death (story hunters downgraded), recovery events, dead hunters returning after 3 days, and the results list.
- [ ] **T2.13 Roster.** Active/reserve with caps (Hamlet 3, Keep 3 + Barracks), candidates from unlock conditions, fixed prices, swap rules, and level-ups (Health and Might only).
- [ ] **T2.14 Gear.** In-place upgrades by Smithy level.
- [ ] **T2.15 Trophy Hall.** Cumulative trophies this cycle, with silver excluded.

### D. Odds and suggest (GDD §6.5)

- [ ] **T2.16 Odds.** 500 samples with the margin, expected injuries, death chance, expected rewards, and the "Why?" summary (per 100 ticks).
- [ ] **T2.17 Worker.** The odds and suggest worker, a debounced protocol, and the main-thread fallback labeled "quick estimate".
- [ ] **T2.18 Suggest.** Two-stage search with common seeds.
- [ ] **T2.19 Benchmarks.** Suggest ≤ 75 ms and odds ≤ 25 ms on CI (the one-quarter proxy), plus the debug timing readout.

### E. UI

- [ ] **T2.20 Contracts tab.** Board, running and ready-to-collect sections, Decline, the launch sheet (party pickers, Suggest, live odds, provisions, Reckless styling), and the fight log (tick stamps, show rolls, seed and replay, collapse by 50 ticks, and the "older rules" label).
- [ ] **T2.21 Hunters tab.** Active roster, reserve, candidates, locked silhouettes with their unlock text, hunter detail (stats with breakdowns, traits, gear upgrades, record, bio), and the Hall of the Fallen.
- [ ] **T2.22 Away sheet additions.** Contract results, injuries, recoveries.
- [ ] **T2.23 Playwright smoke.** Phone viewport: load → buy a Cottage → reload → state persists → offline reload works.

### F. Art

- [ ] **T2.24 Portrait generator.** Portraits for the 8 hunters, plus a contact sheet. 👤 **Owner review.**
- [ ] **T2.25 Monster generator.** Portraits and battle sprites for the 12 species, plus a contact sheet. 👤 **Owner review.** Placeholders are acceptable wherever the owner rejects a result.

### G. Simulator

- [ ] **T2.26 Contract policy.** Launches the highest expected-value contract with the suggested party; never Reckless; pays provisions.
- [ ] **T2.27 v0.2 checks and tuning** (listed below).

### v0.2 acceptance criteria

1. The §5.5.1 golden test passes **exactly**.
2. A player can run contracts from Hamlet onward, build a roster with a reserve, and lose a non-story hunter only on a confirmed Reckless contract.
3. Every fight log can be replayed from its seed and matches the original.
4. The displayed odds are honest (simulator check 5).
5. The Playwright smoke and every v0.1 check still pass.
6. Performance benchmarks are within budget.

### v0.2 simulator checks

| Check | Target |
|---|---|
| All v0.1 checks | Still pass, with contracts enabled |
| First contract | Within 15 min of the first Mine |
| Roster of 4 | By the end of day 2 |
| First tier-3 success | Day 2 |
| Odds honesty | Within ±5 points per 10-point bucket over 2,000 contracts |
| Silver share | ≥ 70% from bounties, cumulative over the Keep phase (14 days) |
| Provisions | 20–40% of food income from Keep onward |

### v0.2 owner playtest checklist 👤

- [ ] Launch a contract in under 5 taps with Suggest.
- [ ] The odds feel believable, and "Why?" explains them.
- [ ] Fight logs are readable at a glance; "show rolls" makes sense.
- [ ] Injuries and recovery timers feel fair, not punishing.
- [ ] Hunter portraits: keep, regenerate, or placeholder?
- [ ] Screenshot pass.

**Out of scope for v0.2:** investigation, unknown monsters, preparation, alchemy, the bestiary screen, Arvid, letters, and the Long Night.

---

## v0.3 — Bestiary & preparation

**Goal:** contracts against unknown monsters, clue-based investigation, a bestiary that makes later play faster, and preparation that clearly matters.
**Reads:** GDD §5.6–5.7, §6 (v0.3 rows), §7.5, §8.3.1, §8.4, §8.6–8.7, §9.8–9.9; `setting-primer.md` §6.4.

### Tasks

- [ ] **T3.1 New hunters (flesh-out).** 👤 **Define the 2 new v0.3 hunters with the owner** (GDD §8.5: a Wolf-friend Striker with Venom; a Tracker Mender). Then add their content, recruit prices, and generated portraits.
- [ ] **T3.2 Content.**
  - Knowledge levels; the clue library (all **20 tags × 3+ texts**); 12 ingredients; 9 consumables with recipes.
  - Hunter's Lodge, Alchemist's Hut, Herb Garden; village gift reagents; monster drops; v0.3 traits (Herbwise, Wolf-friend, Tracker).
- [ ] **T3.3 Text.** A bestiary blurb plus a **"What it was" line** for all 12 species (primer §6.4).
- [ ] **T3.4 Migration v2 → v3.** Bestiary, stores, queues. Includes a fixture from a real v0.2 save.
- [ ] **T3.5 Full coverage test** (GDD §8.3.1): ≥ 2 species per cell where investigation applies, distinct tag sets, and the generator rejecting unsolvable picks.
- [ ] **T3.6 Unknown-monster contracts.** Candidate lists, 3 clues, and reveal timers as `advance` events. Lodge slots; Studied halving; Mastered arriving pre-identified; the Tracker trait.
- [ ] **T3.7 Knowledge.** Sighted, Identified, Studied, Mastered transitions; kill counts; knowledge bonuses.
- [ ] **T3.8 Alchemy brewing.** A queue per Hut level, 10 min per brew, and the Herb Garden production event.
- [ ] **T3.9 Preparation in combat.**
  - Oil, potion, and bomb slots, consumed at launch.
  - Potion triggers; bombs at tick 1 or on trigger (no Armor).
  - Saltburst cancels; Spoil destroys unused potions; Herbwise.
  - The well-prepared bonus (×1.5 bounty, +1 trophy).
  - **Tests for each.**
- [ ] **T3.10 Odds with uncertainty.** Averaging over the remaining candidates, labeled; oil effect shown per candidate; Suggest at 20 samples per candidate; benchmarks still in budget.
- [ ] **T3.11 UI.**
  - Bestiary grid and entry sheets (silhouette until Identified, "What it was", last 5 encounters).
  - Investigation on the board and launch sheet; preparation pickers with "unprepared would be X%".
  - The Alchemist's Hut screen; stores and reagents.
- [ ] **T3.12 Simulator.** The policy brews, equips matching preparation, and investigates; v0.3 checks and tuning.

### v0.3 acceptance criteria

1. Every generated contract cell meets the coverage rules (the content test).
2. Investigation always narrows to exactly one species once all 3 clues are revealed.
3. Preparation visibly changes the odds ("unprepared would be"), and the simulator confirms the effect.
4. The bestiary and knowledge levels persist and speed up later contracts.
5. Every v0.1 and v0.2 check still passes.

### v0.3 simulator checks

| Check | Target |
|---|---|
| Preparation matters | Matched preparation raises the odds by **≥ 15 points** at equal tier |
| First Identified via investigation | ≤ 2 h after the Hunter's Lodge is built |
| First Studied | Days 2–3 |
| All earlier checks | Pass |

### v0.3 owner playtest checklist 👤

- [ ] Investigating feels like studying a case, not waiting on a timer.
- [ ] Choosing preparation is a real decision, and the odds swing makes sense.
- [ ] The bestiary is pleasant to browse, and the "What it was" lines land.
- [ ] Brewing doesn't feel like a chore.
- [ ] Screenshot pass; monster art review.

**Out of scope for v0.3:** alchemy discovery, skills through use, the Long Night, and any `lore-secrets.md` content.

---

## v0.4 – v1.0 (outline: each needs a flesh-out session first, §0.5)

| Milestone | Scope (from the GDD) | Depends on | Open questions to settle at flesh-out |
|---|---|---|---|
| **v0.4 Alchemy discovery & skills through use** | Hidden ingredient effects, experiments, recipe book; warden skills (Alchemy, Smithing, Lore, Command) | v0.3 | Hunter use-skills? How many effects? Do v0.3 fixed recipes become discovered? |
| **v0.5 The Long Night** | Citadel and Bastion; Threat; Last Stand; Embers; relics; resets; the v0.5 arrival (G8); naming wardens; the Roll of Wardens; Act I; the Archivist; Ilse; Arvid's content; hunter letters at levels 5 and 10; village trust displayed; **from here Claude Code reads `lore-secrets.md`** | v0.4 | Payout curve; rank partial reset; Last Stand wave design; Act I document texts (written then) |
| **v0.6 Delves** | ~5-minute runs, 6 floors plus a guardian, two patron doors per floor, 6 patrons (the Unlit after Act V), the Riftglass allowance, multi-monster combat | v0.5 | Do injuries carry back? Allowance size; blessing pools; group targeting rules |
| **v0.7 Hunter depth** | Ranks, stars, talent trees, loot rarity, an item inventory replacing in-place gear | v0.5 | Talent trees per role; loot sources; the inventory UI on a phone |
| **v0.8 Events** | World bosses (banked tokens, 24 h rest) and Legendary Hunts (self-started, carry-over), with reserve hunters | v0.7 | Boss roster (lore §14); hunt tracks; legendary hunters |
| **v0.9 Orders** | Thanes' Moot, Grey Wives, Bell-Watchers, Quenchers; reputation; questlines; Acts continue | v0.8 | Exclusivity; persistence; quest structure; the final act's timing (D24.10) |
| **v1.0 Polish** | Art and UX pass, full balance pass, achievements (candidate), endings if the final act is scheduled here | v0.9 | Which art to replace; what "done" means |

**Story acts are content, not milestones.** Each act's documents get written in the flesh-out session of the milestone in which a typical player will reach that act.

---

## Judgment calls in the implementation plan

1. **One branch per milestone;** the plan file doubles as the task checklist.
2. **Tasks sized for about one session;** split them here before starting if they're bigger.
3. **Test-first for formulas, rules, and saved data;** UI covered by the smoke test and the owner's playtest.
4. **Tuning changes constants only;** if no reasonable constant passes a check, raise it as a design problem.
5. **Session estimates:** v0.0 1–2, v0.1 8–12, v0.2 10–14, v0.3 8–12.
6. **All 12 monsters exist from v0.2,** identified for free until v0.3.
7. **Owner tasks:** palette choice, CC0 pack downloads if Claude Code can't fetch them, art reviews, defining the 2 v0.3 hunters, and playtests.
8. **The coverage test is split:** ≥ 1 species per cell in v0.2, the full rules in v0.3.
9. **Acts are scheduled by the flesh-out sessions,** not fixed to milestones.
