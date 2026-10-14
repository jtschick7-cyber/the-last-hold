# The Last Hold — Implementation Plan

**Status:** Revised after the plan review (D34–D36). Awaiting owner approval.
**Reads with:** `CLAUDE.md` (the workflow, definition of done, and owner gates live there, not here), `gdd.md` (what), `technical-design.md` (how), `decisions.md` (why).
**Depth:** v0.0–v0.5 are in full detail (v0.5 fleshed out 2026-10-14, D144–D169). v0.6 and later are outlines; each gets a **flesh-out session** before it starts (§0.4).
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
| Events | `boss.*`, `riftglass.bankWeeks` |

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

Estimates, not commitments. If a task proves bigger than a session, split it here first.

### 0.8 Optional extras

G9 (Records screen, CSV/JSON export) was **not taken** (D31). Nothing is scheduled for it.

---

## v0.0 — Bootstrap

**Status:** complete

**Goal:** an empty, deployable, installable shell, with every guard-rail and the preview channel in place. No game logic.
**Reads:** technical design §2–4, §7.4 (the ban list only), §9.1 (namespacing), §11.

**Before you start 👤**

| Owner task | Needed by |
|---|---|
| ~~Put the docs and `CLAUDE.md` in the repo~~ **Done.** `lore-secrets.md` stays out until v0.5 (D36). | T0.0 |
| Enable GitHub Pages with Source = GitHub Actions (repo Settings → Pages) | T0.6 |
| Let milestone branches deploy: repo Settings → Environments → `github-pages` → Deployment branches and tags → add the rule `milestone/*` (Pages only allows `main` by default) | T0.6 |
| Create the branch `milestone/v0.0` from the v0.0 work branch, or allow Claude Code to push it (previews deploy only from `milestone/*`) | T0.6 |

### Tasks

- [x] **T0.0 👤 Docs in the repo.** `gdd.md`, `technical-design.md`, `implementation-plan.md`, `decisions.md`, `setting-primer.md`, and `CLAUDE.md` are committed; `lore-secrets.md` is excluded (D36).
- [x] **T0.1 Scaffold.**
  - Vite + TypeScript + Preact + signals.
  - Strict `tsconfig` with `noUncheckedIndexedAccess`.
  - The folder structure (technical design §3); Node 22 (`.nvmrc`); exact dependency versions.
- [x] **T0.2 Scripts.** `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`, `sim` (a stub that exits 0), `check`.
- [x] **T0.3 Lint guard-rails.**
  - Layer import rules.
  - The full `core/` ban list (technical design §4.2, §7.4).
  - The numeric-literal rule with its allowlist (0, 1, −1, 2, 100, array indices; test files exempt).
  - Named exports only.
  - **Test:** fixture files that break each rule must fail lint (checked through the ESLint Node API).
- [x] **T0.4 PWA shell.**
  - vite-plugin-pwa with base `/the-last-hold/`.
  - A **build channel** (`live` or `preview`) that sets the storage namespace, the manifest name and scope, and a PREVIEW ribbon (technical design §11.3).
  - A version and commit screen; the update banner.
- [x] **T0.5 CI.** `ci.yml` (check + build). Empty stubs for `sim.yml` and `bench.yml`.
- [x] **T0.6 Deploy with preview.**
  - `deploy.yml` builds the latest `main` at the root and the latest `milestone/*` at `/preview/`, as one Pages artifact.
  - The live service worker's `navigateFallbackDenylist` excludes `/preview/`.
  - *First deploy succeeded on 2026-10-11: a placeholder page at the root (main has no app until v0.0 merges) and `milestone/v0.0` at `/preview/`.*
- [x] **T0.7 Repo hygiene.**
  - README.
  - `.github/pull_request_template.md`.
  - Check that `.claude/settings.json` (the lore deny rule) is in place.
  - Initialize `docs/progress.md` and `docs/questions.md` if they're missing.

### Acceptance criteria

1. CI is green.
2. The live URL and `/preview/` both load; each shows its channel and version.
3. **Isolation test:** a value saved in the preview is not visible in live, and vice versa. Each has its own install name.
4. The lint guard-rail tests prove each banned pattern fails.

**👤 Playtest checklist**
- [x] **On iPhone, install to the Home Screen before playing.** The installed app keeps its own storage, separate from Safari. Use export and import to move a save between them (from v0.1).
- [x] Install **both** live and preview. Each opens in airplane mode after its first load.
- [x] The version and the PREVIEW ribbon show correctly.

**Out of scope:** any game content or state.

---

## v0.1 — The Hold

**Status:** complete

**Goal:** the idle economy from Hamlet to Keep, playable on a phone, saving reliably, with offline progress, a debug panel, diagnostics, a working simulator, and the art pipeline.
**Reads:** GDD §1–5.2, §6, §7.1–7.2, §9 (the v0.1 screens), §10; technical design §4–9, §11–15; `setting-primer.md` §5–7.

**Before you start 👤**

| Owner task | Needed by | When |
|---|---|---|
| Approve any replacement names | T1.6 | When T1.6 raises them in `questions.md` |
| **Pick the palette** from the rendered candidates | T1.28 | When T1.28 posts the swatch page |
| **Download the CC0 packs** from the exact list T1.30 gives you (pack names, links, licenses) into `art-src/packs/<pack>/` | T1.31 | **One session ahead:** T1.30 delivers the list a session before T1.31 needs the files |

### A. Foundations

- [x] **T1.1 RNG.** `core/rng`: sfc32, cyrb128, streams, `RollSource` (`seeded`, `scripted`). **Tests:** goldens for 3 seeds; `scripted` throws if it runs out or isn't fully consumed.
- [x] **T1.2 Portable math.** `core/math`: `intPow` and `maxAffordable` (search). **Tests:** both match `Math.pow` and the GDD log formula over a table of cases (computed in the tests only) (technical design §7.4).
- [x] **T1.3 Formatting.** Numbers and durations (technical design §8), with suffixes chosen by thresholds. **Tests:** the full boundary table.
- [x] **T1.4 Balance file.** `content/balance.ts` with every v0.1 key, each marked `tunable` or `locked` per §0.6.
- [x] **T1.5 v0.1 content.** Resources, jobs, buildings (Silver Seam max 2), Ranks (Hamlet, Keep, plus the restoration text), and the starting state (GDD §5.1.4).
- [x] **T1.6 Names.** Collision-search every v0.1 proper noun. Create `tests/content/names.ts` and the name-finding test (technical design §14). Any collision or unchecked name goes to `questions.md` as `[?]`.
- [x] **T1.7 v0.1 text.** Building blurbs; Brana and Pechko lines for every primer §6.2 trigger (3–5 variants each); the Keep inscription.
- [x] **T1.8 Content integrity test.** IDs, text keys and unlocks resolve; **the GDD §7 key list equals the `balance.ts` keys** (technical design §5.1).

### B. State, selectors, commands

- [x] **T1.9 State v1.** `GameState` with only the v0.1 fields; `createNewGame(seed, now)`.
- [x] **T1.10 Breakdowns and selectors.** Rates, costs (n includes starting buildings), housing, slots, and the offline cap, each with a breakdown. **Tests:** every GDD §7.1 formula, using the GDD's numbers.
- [x] **T1.11 Silver rules.** Silver-digger output gets only the relic and event buckets. **Test:** Keep's +50% doesn't change silver.
- [x] **T1.12 Commands.**
  - `build.buy` (×1, ×10, Max), `build.upgrade`.
  - `peasants.*`, `age.up`, `settings.*`.
  - **Tests:** refused commands never change state.
- [x] **T1.13 Valuation.** Best payback and the ● selector (GDD §5.1.2). **Tests:** mixed-cost and housing cases.

### C. Time

- [x] **T1.14 Event-driven `advance`.** Settle events and the tie order (technical design §6.2).
- [x] **T1.15 Offline catch-up.** Cap, backward clock, chunks with yields, the away summary.
- [x] **T1.16 Required tests.**
  - **Offline equivalence**, with the comparison rule from technical design §6.2.
  - Backward clock; determinism; cap reporting.

### D. Saves

- [x] **T1.17 Envelope and storage.** Namespaced keys (live or preview); main, backup, and quarantine slots; autosave; the `persist()` request.
- [x] **T1.18 Export and import.** `LH1.` and `LH0.` codes, the save file, clear errors.
- [x] **T1.19 Migrations framework.** An empty list, the v1 fixture, validation, the newer-version refusal. **Tests:** round-trip; corrupted codes; unknown IDs.

### E. UI

- [x] **T1.20 Shell.** Resource bar and rates sheet; tabs **Hold** and **More** only; sheet stack; themes.
- [x] **T1.20a Pixel font.** The CC0 pixel font for headings and the resource bar (split from T1.20: no CC0 font source is reachable from Claude Code's sessions; see `questions.md` Q1). Done 2026-10-12: Kenney Pixel (CC0), from the owner's upload.
- [x] **T1.21 Hold screen.** Peasants panel, build list (×1 / ×10 / Max, "ready in", the ● hint), and the hold header.
- [x] **T1.22 Rank screen.** Checklist, costs, unlocks, the restored part of the hold. Citadel shows "Coming in a later milestone".
- [x] **T1.23 Away sheet and Reports** (the last 3 sheets).
- [x] **T1.24 Breakdown sheet.** Long-press and hover; ⓘ markers.
- [x] **T1.25 More menu.** Save & Data; Settings; About & Credits (version, channel, commit, `debugUsed`); and the **install tip, including the iPhone storage note** (technical design §9.1).
- [x] **T1.26 Debug panel** (`?debug`). Time skip through the offline path, add resources, seed, Rank unlock, raw state, timing readout. *(The "simulator run" button moved to T1.35, since it needs the simulator.)*
- [x] **T1.27 Diagnostics** (technical design §15.1). The error capture list, **More → Diagnostics**, "Copy diagnostics", and the crash fallback screen.

### F. Art pipeline

- [x] **T1.28 Palette.** Render 2–3 free-use 32-color candidates as a swatch page. 👤 **The owner picks one.** Record it in `palette.ts` and `credits.md`.
- [x] **T1.29 Manifest and `<Sprite>`.** Placeholder fallback; `gen-placeholders`.
- [x] **T1.30 Pack list for the owner.** Write `art-src/PACKS-NEEDED.md` with the exact CC0 packs, links, licenses, and target folders for v0.1 (hold-scene tiles, resource icons, building icons, UI frames). Post it to `questions.md` **one session before T1.31**.
- [x] **T1.31 Recolor tool.** `tools/recolor.ts` (OKLab nearest color) and `tools/recolor-cli.ts`, tested on generated images.
- [x] **T1.31a Process the packs.** Unpack the owner's uploads, check each `License.txt`, recolor to the chosen palette, add manifest rows, and add the Kenney font (T1.20a). Done 2026-10-12 with recipes in `tools/art-recipes.ts`; the Pixel UI Pack's frames are kept for the v1.0 art pass (D59).
- [x] **T1.32 Credits.** Generate `credits.md`; add the CI license test.
- [x] **T1.33 Contact sheet tool.**

### G. Simulator

- [x] **T1.34 Simulator CLI and report.** Virtual clock, seeds, JSON and Markdown, baseline diff, `sim:accept`, and the **fast set** for `check` (technical design §11.2).
- [x] **T1.35 Policies.** Opening, Standard, Light, Heavy, using the shared valuation. Then add the debug panel's "run the Standard policy for N hours" button (moved from T1.26). *(Rules: D60.)*
- [x] **T1.36 v0.1 checks**, with `sim/targets.ts` locked. *(Written and tested; they run in `sim:check` and `sim.yml`. Enforcing them inside `npm run check` is T1.36a.)*
- [x] **T1.36a Enforce the fast set in `check`** (`sim:check -- --fast`), once T1.37 makes the checks pass.
- [x] **T1.37 Tuning pass.** `tunable` constants only (§0.6). *(D62: starting wood 75, Keep silver 250; every v0.1 check passes on 5 seeds.)*

### H. Browser tests

- [x] **T1.38 Playwright.** *(D61; WebKit runs in CI.)*
  - **Smoke** (phone viewport): load → buy a Cottage → reload → state persists → offline reload works.
  - Run the **determinism suite in WebKit and Chromium** (technical design §14).

### v0.1 acceptance criteria

1. A fresh game can reach Keep. The Rank-up applies the Keep grants and shows the Roll of Honor.
2. Every on-screen number that has a formula opens a breakdown that matches the engine.
3. Reopening after up to 12 h shows a correct away sheet; time beyond the cap is reported.
4. A save survives a reload; an export code moves it between browsers; corrupted codes are refused with a reason; preview and live saves never mix.
5. An error anywhere shows in Diagnostics, and "Copy diagnostics" works.
6. The game works offline after installation.
7. `npm run check` is green in 90 s or less. The Playwright smoke and the cross-engine determinism tests pass.
8. Every v0.1 simulator check passes on 5 seeds.

### v0.1 simulator checks (GDD §6.2–6.3)

| Check | Target |
|---|---|
| First Cottage (Opening) | ≤ 1 min |
| First Mine (Opening) | ≤ 5 min. If missed, raise starting wood (D30); that's a tunable. Now 75 (D62). |
| Mill level 3 | 2–5 h |
| 10 peasants | 3–6 h |
| **Keep** | **8–14 h** (Standard, median); ≤ 24 h (Light); ≥ 6 h (Heavy) |
| Something to do | ≥ 90% of Standard check-ins |
| No dry spells | Never 2 empty check-ins in a row |
| No walls | ≤ 3 check-ins of saving (≤ 5 for Rank-ups) |
| No overflow | < 1e300 over 14 days |

### v0.1 owner playtest checklist 👤 (on the preview build)

- [ ] **Play until Keep, plus one overnight.**
- [ ] A routine check-in takes 15 taps or fewer.
- [ ] Numbers are readable; long-press breakdowns make sense.
- [ ] The away sheet after the overnight is right.
- [ ] Export from the phone → import on desktop → back to the phone.
- [ ] Screenshot pass ("looks wrong on my phone").
- [ ] Contact sheet: palette and placeholders.
- [ ] The next goal always feels visible.

**Out of scope:** hunters, contracts, combat, the bestiary, alchemy, Citadel and later, the Long Night, and any story secrets.

---

## v0.2 — Hunters & contracts

**Status:** complete

**Goal:** contracts from Hamlet onward, an active and reserve roster, transparent turn-meter combat, rewards that feed the Hold, and honest odds.
**Reads:** GDD §3.3, §4, §5.0, §5.3–5.5, §6 (v0.2 rows), §6.5, §7.3–7.4, §8.1–8.3, §8.5, §9.4–9.7; technical design §5.2–5.3, §7, §10.1, §14; `setting-primer.md` §3, §5, §6.3, §6.6–6.7.

**Before you start 👤**

| Owner task | Needed by |
|---|---|
| **Export your real v0.1 save** (Copy diagnostics or the save code) and paste it into a session | T2.4 (the migration fixture) |
| Review the hunter portraits | T2.23 |
| Review the monster portraits | T2.24 |

### A. Content and state

- [x] **T2.1a Content.** 8 hunters (prices, story-hunter flags), traits, gear tiers; all **12 monsters** (identified for free in v0.2); villages with heads (trust kept silent). The balance keys this needs were already in `balance.ts` from v0.1; per-item numbers live in the content files (D44).
- [x] **T2.1b Barracks and Trophy Hall** as buildings. They add building ids, which changes the saved state, so they go in together with the migration (T2.4, Q5).
- [x] **T2.2 Text.** Notices (3+ per village × location; seeds at most 1 in 10); the vow and first-contract scenes; hunter bios.
- [x] **T2.3 Names** for the new proper nouns (hunters, villages and heads, monsters, abilities, traits, gear). Searched 2026-10-13; one collision found (Gloam Wolf, Q6). Names for the notices and scenes (T2.2) get checked when that text is written.
- [x] **T2.4 Migration v1 → v2,** using the **owner's real v0.1 save** as the fixture. `[?]` until it's provided (Q5).

### B. Combat

- [x] **T2.5 Turn meter.**
- [x] **T2.6 Attack resolution.** Buckets, Armor on direct attacks only, taken%, immunity, rounding, crits, targeting, Mender, Silver sub-hits (portable math only).
- [x] **T2.7 All 12 monster abilities.**
- [x] **T2.8 Golden test, GDD §5.5.1, line for line.** **This test gates the milestone.** It runs in Node, WebKit, and Chromium.
- [x] **T2.9 More combat tests.** Seeded goldens (record 5, then freeze them; they're locked), determinism, one test per ability, `rulesVersion`.

### C. Contracts and roster

- [x] **T2.10 Board.** Opens at the first Mine; refill; tier unlocks and mix; barrow from T2; every generated cell has ≥ 1 species; Decline.
- [x] **T2.11 Launch.** Party rules, provisions, the Reckless confirmation with death chances, the fight seed.
- [x] **T2.12a Reward and injury rules** (pure, in `core/contracts/`): bounty, provisions, trophies, XP, injury outcomes and recovery times, the death roll, seeds.
- [x] **T2.12b Completion events.** Rewards at completion, injuries, death (story hunters downgraded), recovery, return after 3 days, results. Needs the saved state (T2.4).
- [x] **T2.13 Roster.** Active and reserve, caps, candidates, prices, swaps, level-ups (Health and Might only).
- [x] **T2.14 Gear** upgrades in place.
- [x] **T2.15 Trophy Hall** (cumulative, silver excluded).

### D. Odds and suggest

- [x] **T2.16 Odds.** 500 samples, margin, injuries, death chance, rewards, "Why?" per 100 ticks.
- [x] **T2.17 Worker.** Protocol, debounce, main-thread fallback labeled "quick estimate".
- [x] **T2.18 Suggest.** Two-stage search with common seeds. Built exactly as the GDD says; it misses the speed budget (Q8).
- [x] **T2.19 Benchmarks** (D73 answered Q8). Measured at a 4× slowdown: odds 96 ms (budget 100), Suggest 324 ms (budget 300): a small warning, well under the 2× fail line. in `bench.yml`: warn at the budget, fail at 2×. The debug timing readout too.

### E. UI and tests

- [x] **T2.20 Contracts tab.** Board, running and collect sections, Decline, the launch sheet, the fight log (ticks, rolls, seed and replay, collapse, the older-rules label).
- [x] **T2.21 Hunters tab.** Active, reserve, candidates, locked silhouettes, detail, gear, Hall of the Fallen.
- [x] **T2.22 Away sheet** additions; **extend the Playwright smoke:** launch a contract → skip time → collect.

### F. Art

- [x] **T2.23 Portrait generator.** The 8 hunters plus a contact sheet. 👤 Review *(built, D78; owner review pending: keep, regenerate or placeholder)*.
- [x] **T2.24 Monster portraits.** The 12 species plus a contact sheet *(built, D78; owner review pending)*. 👤 Review; placeholders where rejected. **No battle sprites** (built when a screen needs them, v0.7 Delves) *(A17)*.

### G. Simulator

- [x] **T2.25 Contract policy.** Highest expected value, suggested party, never Reckless, pays provisions.
- [x] **T2.26 v0.2 checks and tuning** (tunables only). Done. The provisions check (20–40% of food income) was pending Q9 while provisions were flat (about 0.2%); the owner chose income-scaled provisions (D81) and the tunable values in D82, and the check is now enforced like the others.

### v0.2 acceptance criteria

1. The §5.5.1 golden test passes **exactly**, in all three engines.
2. Contracts run from Hamlet. The roster has a reserve. A non-story hunter can die only on a confirmed Reckless contract.
3. Every fight log replays from its seed and matches the original.
4. The odds are honest (simulator check), and every v0.1 check still passes.
5. The benchmarks are under 2× the budget (CI), and within budget on the owner's phone (debug readout).

### v0.2 simulator checks

| Check | Target |
|---|---|
| All v0.1 checks | Still pass |
| First contract | Within 15 min of the first Mine |
| Roster of 4 | By the end of day 2 |
| First tier-3 success | Day 2 |
| Odds honesty | Within ±5 points per bucket over 2,000 contracts |
| Silver share | ≥ 70% from bounties, cumulative over the Keep phase (14 days) |
| Provisions | 20–40% of food income from Keep onward |

### v0.2 owner playtest checklist 👤 (on the preview build)

- [ ] Launch a contract in under 5 taps with Suggest.
- [ ] The odds feel believable, and "Why?" explains them.
- [ ] Fight logs read at a glance; "show rolls" makes sense.
- [ ] Injuries feel fair.
- [ ] Portraits: keep, regenerate, or placeholder.
- [ ] Odds and Suggest feel instant (check the debug timing readout).
- [ ] Screenshot pass.

**Out of scope:** investigation, preparation, alchemy, the bestiary screen, Arvid, letters, the Long Night.

---

## v0.3 — Bestiary & preparation

**Status:** complete

**Goal:** contracts against unknown monsters, clue-based investigation, a bestiary that speeds up later play, and preparation that clearly matters.
**Reads:** GDD §5.6–5.7, §6 (v0.3 rows), §7.5, §8.3.1, §8.4, §8.6–8.7, §9.8–9.9; `setting-primer.md` §6.4.

**Before you start 👤**

| Owner task | Needed by | When |
|---|---|---|
| **Define the 2 new hunters** (a Wolf-friend Striker with Venom; a Tracker Mender) **in a chat session** | T3.1 | **Before v0.3 starts**, not mid-milestone |
| **Export your real v0.2 save** | T3.4 | Before T3.4 |
| Review the new portraits | T3.1 | — |

### Tasks

- [x] **T3.1 New hunters** (Q12 answered: Stanko Sleepless and Herdis Strayfinder, D101). Add the 2 hunters from the owner's chat-session definitions: content, prices, generated portraits.
- [x] **T3.2a Content.** Knowledge levels; the clue library (20 tags × 3+ texts); 12 ingredients; 9 consumables; gift reagents; drops. (The v0.3 traits were already in the v0.2 content.)
- [x] **T3.2b Buildings.** Hunter's Lodge, Alchemist's Hut, Herb Garden. These add building ids to the saved state, so they wait for the migration (T3.4), as the Barracks did in v0.2.
- [x] **T3.3 Text.** A bestiary blurb plus a "What it was" line for all 12 species.
- [x] **T3.4 Migration v2 → v3,** using the owner's real v0.2 save.
- [x] **T3.5 Full coverage test** (GDD §8.3.1; the rules are locked).
- [x] **T3.6 Unknown-monster contracts.** Candidates, clues as `advance` events, Lodge slots, Studied halving, Mastered auto-identify, Tracker.
- [x] **T3.7 Knowledge.** Level transitions, kills, bonuses.
- [x] **T3.8 Alchemy brewing.** Queues and the Herb Garden event.
- [x] **T3.9 Preparation in combat.** Slots, potions, bombs, Saltburst, Spoil, Herbwise, the well-prepared bonus, each with tests.
- [x] **T3.10 Odds with uncertainty.** (Also switches contract generation to post unknown monsters, D89 point 7; until then every contract arrives identified.) Averaging over candidates; oil effects per candidate; Suggest at 20 samples per candidate; benchmarks.
- [x] **T3.11 UI.** The bestiary; investigation; preparation pickers with "unprepared would be X%"; the Alchemist's Hut.
- [x] **T3.12 Simulator.** The policy brews, prepares, and investigates; v0.3 checks; tuning.

### v0.3 acceptance criteria

1. Every generated cell meets the coverage rules.
2. Three clues always identify exactly one species.
3. Preparation visibly changes the odds, and the simulator confirms it (≥ 15 points).
4. Knowledge persists and speeds up later contracts.
5. Every earlier check passes.

### v0.3 simulator checks

| Check | Target |
|---|---|
| Preparation matters | ≥ 15 points at equal tier |
| First Identified via investigation | ≤ 2 h after the Lodge |
| First Studied | Days 2–3 |
| All earlier checks | Pass |

### v0.3 owner playtest checklist 👤 (on the preview build)

- [x] Investigating feels like studying a case.
- [x] Preparation is a real decision.
- [x] The bestiary is pleasant to browse, and the "What it was" lines land.
- [x] Brewing isn't a chore.
- [x] Screenshot pass and monster art review.

**Out of scope:** alchemy discovery, skills, the Long Night, story secrets.

---

## v0.4 — The Long Night: mechanics

**Status:** complete *(fleshed out 2026-10-13, D106–D115; playtest passed 2026-10-14, D141)*

**Goal:** the cycle loop. Citadel and Bastion, Threat, a Last Stand you choose the moment for, Embers and warden upgrades, relics, and a Long Night that resets the hold and keeps what matters, plus the first Long Night for saves from before v0.4. Mechanics only: the text stays neutral (`setting-primer.md` §6.8).
**Reads:** GDD §4.1, §5.1.2–5.1.3, §5.3.7, §5.4.1–5.4.2, §5.9, §6 (v0.4 rows, §6.1 policy, §6.3, §6.5), §7.1, §7.3–7.4, §7.6, §8.1, §8.9–8.10, §9.11, §9.13; technical design §5.2–5.3, §7.2, §9.4, §10.1, §13; `setting-primer.md` §6.5, §6.8.

**Before you start 👤**

| Owner task | Needed by | When |
|---|---|---|
| **Export your real v0.3 save** (More → Save & Data → Copy save code) and paste it into a session | T4.3 (the migration fixture) and T4.10 (the arrival test) | Before T4.3 |
| Decide any name collisions the search finds | T4.2 | When asked |
| Review the new art (Walls, Watchtower, the Citadel and Bastion scenes, Embers, Threat and relic icons) | T4.12 | — |

### A. Content and state

- [x] **T4.1 Content.** Citadel and Bastion (requirements, costs, grants, restoration text, no inscription); Walls and Watchtower; the 8 warden upgrades (GDD §8.9) and the 6 relics (§8.10); every new balance key from GDD §7.1, §7.3, §7.4 and §7.6, marked tunable or locked (locked: `laststand.partyMax`, and the new `contract.ageTierCap` entries, D106). New Rank and building ids change the saved state, so wiring them in waits for T4.3, as in v0.2 and v0.3.
- [x] **T4.2 Names.** Collision search (GDD §2.3) for Warm Hearth, Full Larder, Young Families, Seasoned Hunters, Drill Yard, Village Goodwill, Swift Roads, Long Watch, The Hearth, Plough-Share, Mason's Plumb, Tally Stick, Bone Whistle, Copper Still, Iron Shutter and Forge Hall; add them to `tests/content/names.ts`. Citadel, Bastion, Walls, Watchtower, Threat, Last Stand, Long Night and Embers go in as generic or already checked. Any collision: stop and ask, with alternatives. *Done: three collided and were renamed Kept Coals, Old Hands and Late Lantern; The Hearth kept (D116).*
- [x] **T4.3 Migration v3 → v4** (D113), using the **owner's real v0.3 save** as the fixture, with a round-trip test; the parts in technical design §5.2. *(Split, D117:)*
  - [x] **T4.3a** Citadel, Bastion, Walls and Watchtower join the Rank and building lists (placeholder art until T4.12; Walls and Watchtower blurbs). A level cap missing for a Rank carries the last earlier one (Barracks 5 in every Rank, GDD §8.1). Until T4.13 the simulated player stops at the Keep (D118), so the v0.3 checks measure what they did before.
  - [x] **T4.3b** Schema v4: Threat, Embers, upgrades, relics, the arrival flag and the cycle history; the migration; `v3-owner.json` (the owner's save code of 2026-10-13) and `v4.json` (that save played 72 h by the simulated player); tests in `tests/saves/v4-migration.test.ts`.

### B. Ranks, Threat and defenses

- [x] **T4.4 Citadel and Bastion.** Requirements and costs; the age-bucket bonuses; level caps for buildings and hunters (a carried level above the cap is kept); the roster bonus; bounty multipliers; provisions minutes; tier cap 5; the restoration sheets.
- [x] **T4.5 Threat and defenses.** Rates by Rank inside `advance()` (the offline cap applies); contract spikes and reductions; the floor at 0; Walls and Watchtower as buildings, slowing the rate; breakdowns. Threat counts only once any arrival is done.

### C. The Last Stand

- [x] **T4.6 Stand engine.** The seeded wave list, fixed at Bastion; escalation past tier 5; strength from Threat; one wave at a time through the fight engine with Health carried over, **with contract fights and every golden fight unchanged** (`rulesVersion` stays 1; if a golden changes, stop and ask); recovery between waves; the Watchtower volley and bombs at tick 1; Walls and Iron Shutter as taken%; potions once per stand; location traits off; the tick limit ends the stand; no injuries or deaths; wave logs rebuilt from the saved inputs.
- [x] **T4.7 Preview, payout and relics.** 100 practice stands in the worker (range, Embers now and per day, Threat and Embers tomorrow as an estimate); the payout formula with its breakdown; relic milestones; the preview-honesty test (D114); the benchmark (≤ 1 s at 4× slowdown; warn at the budget, fail at 2×).

### D. The Long Night

- [x] **T4.8 Reset.** Everything in GDD §5.9.7, in this order: running contracts finish, the stand, conversion, the reset, the new cycle. Levels kept; dead hunters as candidates; the cycle history entry. Tested row by row against the "resets / kept" table.
- [x] **T4.9 Warden upgrades and relic effects.** The Hearth (buying, costs, max levels, no re-spending); each upgrade's effect (ember bucket, starting state, levels kept, XP, bounties, durations, offline cap within the 24 h ceiling); each relic's effect (relic bucket; none touches silver).
- [x] **T4.10 The v0.4 arrival** *(done last, after T4.15, D127)*. The arrival flag, sheet and stand (Threat 0, no defenses, the save's Rank multiplier, the capped trophies part); the debug action; a test that takes the owner's save through migration, arrival and reset. `[?]` until the save is provided.

### E. UI

- [x] **T4.11a Hold-side screens.** The Threat meter and breakdown; Citadel and Bastion on the Rank screen; Walls and Watchtower; The Hearth, with upgrades and relics.
- [x] **T4.11b The stand and the Long Night.** The stand screen (wave list with "?", six slots and the suggestion, preparation pickers, preview, confirmation); the four Long Night sheets; wave logs; the arrival sheet. **Extend the Playwright smoke:** debug to Bastion → stand → new cycle.

### F. Art

- [x] **T4.12 Art.** *(Built; the owner's review is in the playtest.)* Icons for Walls, Watchtower, Embers, Threat and the 6 relics; the Citadel and Bastion hold scenes (Tiny Town tiles, the D59 method). 👤 Review.

### G. Simulator

- [x] **T4.13 Policy rules** (GDD §6.1, D114; first lift the D118 hold at the Keep in `src/core/policies/goals.ts`, and keep the Rank-up silver aside only once the Rank-up's requirements are met, or the Citadel's 1,000 silver stops all recruiting): Rank-ups to Citadel and Bastion; v0.3 buildings first; a Tracker kept home; defenses; the stand rule (Standard, Light and Heavy); Embers cheapest first; the default three each cycle.
- [x] **T4.14 Checks.** *(Citadel and Bastion join the fast set in T4.15's commit, once tuning puts them on target: before that they would turn `npm run check` red, D130.)* Citadel; Bastion; best Last Stand (practice stands to day 7); first Long Night (Standard, Light, Heavy); later cycles (≥ 15% faster, 2-day floor; against the first cycle, D134); overflow through 3 cycles (the `sim/targets.ts` row change the owner approved in D114); engagement checks over all of cycle 1; the economy checks over every stretch from the Keep in every cycle (from D135, cycle 1 judged, later cycles reported). Citadel and Bastion join the fast set; runs are 14 days.
- [x] **T4.15 Tuning** (tunables only) against every check, then set `longNightArrival.cycle1MedianEmbers` from the tuned simulator (decisions row with the value). If no reasonable values pass (the "later cycles" check is the known risk, GDD §5.9.5), stop and ask.

### v0.4 acceptance criteria

1. Citadel and Bastion arrive on their targets, with neutral restorations and no inscriptions.
2. Threat rises, falls and explains itself; only the stand and the payout read it.
3. The Last Stand runs wave by wave with readable logs; its preview is honest (test) and within budget.
4. The Long Night resets and keeps exactly what GDD §5.9.7 says, tested on the owner's save.
5. Warden upgrades and relics work and persist, and later cycles are faster.
6. An old save gets the arrival exactly once, with the capped trophies part.
7. Contract fights and every golden fight are unchanged (`rulesVersion` 1).
8. Every earlier check passes.

### v0.4 simulator checks

| Check | Target |
|---|---|
| Citadel reached | Day 2 (24–48 h) |
| Bastion reached; Last Stand available | Days 3–4 (48–96 h, D137) |
| Best Last Stand timing (peak Embers per day of cycle) | Days 4–5 |
| First Long Night | Days 3–5 (Standard); ≤ 7 days (Light); ≥ 2.5 days (Heavy) |
| Later cycles | Each ≥ 15% faster than the first, floor 2 days (D134) |
| No overflow | Through 3 cycles |
| Engagement checks 1–3 | Over all of cycle 1, up to the stand |
| Bounty and provisions shares | Every stretch from the Keep, in every cycle |
| All earlier checks | Pass |

### v0.4 owner playtest checklist 👤 (on the preview build)

- [x] Citadel and Bastion feel like new chapters, not just bigger numbers.
- [x] Threat is easy to read, and the pressure feels fair rather than punishing.
- [x] The stand screen makes "stand now or wait a day" a real, readable choice.
- [x] The stand's wave logs make sense.
- [x] The Long Night sheets are clear and short.
- [x] Cycle 2 feels faster, and the upgrades feel worth buying.
- [x] Your old save's arrival went smoothly.
- [x] Screenshot pass and new art review.

**Out of scope:** the story (Act I, documents, inscriptions); warden naming and the Roll of Wardens display; relics for hunters and relic slots; re-spending Embers; contract tiers above 5; paying resources to lower Threat.

---

## v0.5 and later (outline: each needs a flesh-out session first, §0.4)

Order revised by P2 and P3 (D35): **the Long Night comes before alchemy discovery**, and it's split into mechanics and story.

### v0.5 — The Long Night: Act I and the story systems

**Status:** in progress *(fleshed out 2026-10-14, D144–D169)*

**Goal:** the story arrives. Acts I and II, documents and Ilse's Archive, the forty names, warden naming and the Roll of Wardens, hunter letters, village trust on screen, the stand's band, the Citadel and Bastion inscriptions; and the mechanics the story needs: ruin contracts with four Cursed creatures, Rune damage, the Wright's Blade and Arvid Netmender. Existing saves start Act I at once (D149).
**Reads:** GDD §5.1.3 (restores), §5.3.4, §5.3.6, §5.4.1, §5.4.3, §5.6.1, §5.9.3, §5.9.7, §5.14, §6.1–6.3 and §6.5 (v0.5 lines), §7.7, §8.2–§8.6, §9.11, §9.14, the v0.5 judgment calls; `lore-secrets.md` §8, §10–§12, §15, §20–§25; `setting-primer.md` (voice); technical design §5.2, §7.2, §9.4, §13.

**Before you start 👤**

| Owner task | Needed by | When |
|---|---|---|
| ~~Restore `lore-secrets.md` and `outline.md`~~ | — | Done 2026-10-14 (D36, D38) |
| **Export your real v0.4 save** (More → Save & Data → Copy save code) and paste it into a session | T5.3 (the migration fixture) and T5.10 (the arrival test) | Before T5.3 |
| Decide any name collisions the search finds | T5.2 | When asked |
| Approve the 17 drafted letters and the warden-name list | T5.12 | When asked |
| Review the new art (the four Cursed creatures, Arvid, the Wright's Blade, the Archive icons) | T5.13 | In the playtest |

### A. Content and state

- [x] **T5.1 Content and keys.** *(Split, as planned: T5.1a mechanics content, T5.1b story content.)*
  - [x] **T5.1a Keys and mechanics content.**
    - The v0.5 keys from GDD §7.7 into `balance.ts`, all tunable, and the §7.7 rows rewritten into the `key` = value form in the same commit (D166).
    - The four Cursed creatures (stats, resistances, abilities, clue tags and texts, drops) and the ruin row of the coverage table, checked against the GDD in `tests/content/v05-content.test.ts` (the live coverage test covers ruins once they join the board, T5.4).
    - The ruin tag on Kozly Hollow, Velkvik and Ravenfell; the Wright's Blade (was "Runed Blade", D170); Arvid Netmender and his two traits. Outside the saved-state id lists until their wiring tasks (D171).
  - [x] **T5.1b Story content.** *(In `src/content/story/`; readings in D172.)*
    - Story content in `src/content/`: acts, every Act I and II document with its condition and text, the forty names with their sources and hints, the five name-bearing letters (and slots for the other 17), the residents' band lines, the trust text, the inscriptions, and the warden-name list.
    - A test against the GDD and `lore-secrets.md` tables.
  - Wiring that changes saved state waits for T5.3.
- [x] **T5.2 Names.** Collision search (GDD §2.3) for every new proper noun:
  - the 36 new roll names;
  - Věra, Dana Lisová, Master Hrafn, Hallvard, Master Bielik, and the four non-Sent apprentices on the Mirograd roll;
  - Kamenfell and the warden-name list.
  Ribbonshade, Anvil-wight, Gloam-moths, Rimewrought, Arvid Netmender, Shield-companion and Old Wright are already clear (D154, D158). Add all of them to `tests/content/names.ts`. Any collision: stop and ask, with alternatives. *Done: "Runed Blade" became the Wright's Blade (D170); the owner set the rule for people's names and roll #20 became Torgils Torkelsson (D173); 11 warden names with any influence namesake were dropped.*
- [x] **T5.3 Migration v4 → v5**, using the **owner's real v0.4 save** as the fixture, with a round-trip test. New saved state:
  - the act per cycle and its counters;
  - documents found (with cycle and how);
  - names found and the Ribbonshade count;
  - each hunter's highest level ever and the letters read;
  - trust progress per village;
  - warden names per cycle;
  - Ilse's arrival;
  - the v0.5 arrival flag;
  - unread-item badges.
  Technical design §5.2 updated in the same commit. *Done with the owner's save code of 2026-10-14 (`v4-owner.json`); readings in D174.*

### B. Ruins, the Cursed and Rune

- [x] **T5.4 Ruins and the Cursed.** *(Readings in D176; `rulesVersion` 3, owner-approved, D175.)*
  - Ruin contracts from the Keep at tier 2 and up; clue generation for the new tags.
  - The four abilities in the fight engine: Lightless (hit chance), Seal-burn (Fire back to a direct attacker, no Armor), Re-forge (Saltburst cancels it), Unthawed (first Fire hit, stat%).
  - The creatures join the Last Stand's waves at their tiers.
  - **Contract fights and every golden fight unchanged.** If a golden changes, stop and ask; bump `rulesVersion` only with the owner's OK.
- [x] **T5.5 Rune.** *(Readings in D177.)*
  - The Wright's Blade: Citadel and Smithy 8; the Rune sub-hit on its own log line; the breakdowns.
  - Arvid's traits (Shield-companion as taken%, within the 75% cap; Old Wright).
  - Arvid's unlock: when Act III begins. He can't arrive in v0.5, so a debug action adds him for testing.

### C. Story systems

- [x] **T5.6 Acts and documents.** *(Readings in D178; the row-by-row test is `tests/story/documents.test.ts`.)*
  - One act per cycle; counters per act; an unwritten act closes with "The story continues in a later version."
  - In Act II, fell villages' ruin notices end "…up at the old Kamenfell outpost." (moved here from T5.4, D176).
  - Every condition kind (§5.14.2), and delivery: contract results, Rank-up sheets, the stand result, scenes.
  - Documents stay obtainable in later cycles.
  - **A test for every Act I and Act II document's condition,** row by row against `lore-secrets.md` §21–§22.
- [x] **T5.7 Names and Ribbonshades.** *(Readings in D179; the gate test is `tests/story/names.test.ts`.)*
  - A name is found with its source. Ribbonshades give the six names in their fixed order, Jaro's first, with the scene and Halina's note; after six, a ribbon with no name.
  - **The true-ending gate test:** all 40 names have exactly one source, and none is Delve-only, event-only or missable (`lore-secrets.md` §8).
- [ ] **T5.8 Trust.**
  - Contract progress, steps (`trust.stepContracts`), a step from each Triumphant stand, carry-over, never down.
  - Notices read the trust level; trust-gated documents; the breakdown; the away-sheet line.
- [ ] **T5.9 Wardens, bands and letters.**
  - The band from waves held.
  - Warden names (24 characters, Suggest) and the Roll of Wardens data (years formula, worn first line).
  - Letters at levels 5 and 8 from the highest level ever reached.
  - Inscriptions on the Citadel and Bastion restorations.
- [ ] **T5.10 The v0.5 arrival** (D149).
  - For a pre-v0.5 save, after any v0.4 arrival: Ilse's arrival scene, which finds the documents already behind the save; naming the earlier wardens; Act I starts.
  - A debug action.
  - A test that takes the owner's real v0.4 save through migration and the arrival.

### D. UI

- [ ] **T5.11a The Archive.**
  - The tab renames when Ilse arrives.
  - Bestiary, Library (with the letters shelf), Accounts, Names; the reader; badges.
- [ ] **T5.11b Story across the game.**
  - Scene sheets; the Villages panel; Letters on the hunter sheet; warden naming; the Roll of Wardens; inscriptions on the Rank sheets; bands on the stand screen and result sheet; the Long Night order (§5.14.9); away-sheet lines.
  - **Extend the Playwright smoke:** debug → a won contract → Ilse arrives → open a document in the Archive; and stand → band → naming the new warden.
  - Screenshot pass.

### E. Writing

- [ ] **T5.12 Letters and lists.** 👤 Draft the 17 letters without names (`lore-secrets.md` §23 voice) and the warden-name list, for the owner's approval.

### F. Art

- [ ] **T5.13 Art** (the D59 method).
  - Portraits for the four Cursed creatures (a new family template) and Arvid (the portrait generator, from his look in GDD §8.5).
  - Icons for the Wright's Blade, the ribbon and the document types (letter, journal, ledger, testament).
  - 👤 Review.

### G. Simulator

- [ ] **T5.14 Policy rules** (GDD §6.1, D167): refill the active roster from the reserve whenever there's room (highest levels first); buy the Wright's Blade like any gear; report bands, letters reached, trust levels and names found per cycle.
- [ ] **T5.15 Checks and speed.**
  - The v0.5 rows in `sim/targets.ts` (owner-approved, D168; their own commit); the milestone becomes v0.5.
  - **The suite runs in parallel,** one run per core (D169), with a test that the parallel report matches a sequential one.
  - Full suite ≤ 5 min in CI.
- [ ] **T5.16 Tuning** (tunables only) against every check; likely levers are the ruin creatures' numbers and the trust steps. If no reasonable values pass, stop and ask.

### v0.5 acceptance criteria

1. Act I and Act II run in their cycles; every document arrives on its condition and stays obtainable (tests, row by row).
2. A pre-v0.5 save meets Ilse on load, names its earlier wardens, and starts Act I, tested on the owner's real v0.4 save.
3. All 40 names have exactly one source, none missable (test); the Names view shows found and missing names with hints.
4. Trust rises, never falls, and explains itself; it changes no numbers.
5. Ruin contracts, the four Cursed creatures, the Wright's Blade and Arvid work, with breakdowns and readable logs.
6. Every stand has a band; the Roll of Wardens shows every warden.
7. Contract fights for v0.4 species and every golden fight are unchanged.
8. Every earlier check passes; the full suite runs in ≤ 5 min.

### v0.5 simulator checks

| Check | Target |
|---|---|
| Act I lands in its cycle | Every Act I document with a contract, Rank or stand condition (D1-01, -03, -04, -06, -09, -10) found by the end of cycle 1; D1-07 at the next warden. D1-02 and D1-05 reported only |
| Act II lands in its cycle | D2-01 to D2-07, D2-09 and D2-10 found in cycle 2; D2-08 (Sigrun) reported only |
| Ruins show up | First ruin contract won ≤ 24 h after the Keep |
| Ribbonshade names | All six found by the end of cycle 3 |
| Trust moves | At least one village rises a step in cycle 1 |
| All earlier checks | Pass |
| Suite time | ≤ 5 min in CI (parallel, D169) |

Standard, Monday start, 5 seeds (median), as in §0.3. Reported, not judged: stand bands, letters reached, trust per cycle.

### v0.5 owner playtest checklist 👤 (on the preview build)

- [ ] Ilse's arrival and the Archive feel like the story arriving, not a menu.
- [ ] Act I's documents read well, arrive at sensible moments, and each has one wrongness, not more.
- [ ] Your save started Act I smoothly, and naming your earlier wardens felt right.
- [ ] The Names view makes you want to find the next one; the hints are fair.
- [ ] Ruins and the Cursed feel different from the folklore monsters; the Wright's Blade feels worth it.
- [ ] Trust is easy to read; the band on your stand felt fair.
- [ ] The Roll of Wardens and the inscriptions land.
- [ ] Screenshot pass and new art review.
- [ ] (If you reach it) Act II and Sigrun's confession.

**Out of scope:** Acts III–VI and their documents (Act III is written at the v0.6 flesh-out); Arvid arriving in play; the Deep family (D161); Ember-echoes (Delves, v0.7); trust rewards (v0.10); hunter relics.

### v0.6 — Alchemy discovery & skills through use

**Status:** not started *(needs a flesh-out)*

- **Scope:** hidden ingredient effects, experiments, the recipe book; warden skills (Alchemy, Smithing, Lore, Command; they persist).
- **Open questions:** hunter use-skills; how many effects; whether v0.3's fixed recipes become discovered recipes.

### v0.7 — Delves

**Status:** not started *(needs a flesh-out)*

- **Scope:** about 5-minute runs, 6 floors plus a guardian, two patron doors per floor, six patrons (the Unlit after Act V), the Riftglass allowance, multi-monster combat, **battle sprites**.
- **Open questions:** whether injuries carry back; allowance size; blessing pools; group targeting.

### v0.8 — Hunter depth

**Status:** not started *(needs a flesh-out)*

- **Scope:** ranks, stars, talent trees, loot rarity, an item inventory.

### v0.9 — Events

**Status:** not started *(needs a flesh-out)*

- **Scope:** world bosses (banked tokens, 24 h rest) and Legendary Hunts (self-started, with carry-over); reserve hunters take part.

### v0.10 — Orders

**Status:** not started *(needs a flesh-out)*

- **Scope:** the Thanes' Moot, Grey Wives, Bell-Watchers, and Quenchers; reputation and questlines.
- **Open question:** when the final act ships (D24.10).

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
