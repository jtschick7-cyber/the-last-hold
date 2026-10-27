# OUT-9 — Edits to `docs/technical-design.md` (v1.4 "The Descent", D557–D568; updated 2026-10-27)

Every **Find** below was checked against the Project's copy of `docs/technical-design.md` and occurs **exactly once** in it. **If one does not match exactly once in the repo's copy, stop and tell the owner.** Edits are in document order. Edit 11 updates §21.9 and appends the new §22 at the end of the file.

**Names to check in the repo:** file and function names below (`save/migration-v14.ts`, `save/validate-descent.ts`, `src/core/systems/descent.ts`, `src/core/systems/descent-fight.ts`, `learnedBonus`, `runDescent`, `rebuildDescentLogs`, `suggestDescentOrder`, `descent.start`, `debug.prepareEndgameRoster`, `debug.descent.win`) are proposals in the repo's existing style. The hard architectural rules: `learnedBonus` builds numbers and `Breakdown` in one function; `runDescent` is an isolated fight path so `rulesVersion` stays 5; the 3 stage logs rebuild deterministically from `DescentRecord` on demand (freezing all inputs including bestiary knowledge); and worker previews use `previewInputFor(state)`.

## 1 — §5.2 `GameState`: schema number and the `descent` block

**Find:**
```markdown
// 13 from v1.3 (D543); 12 from v1.1 (D502); GameState also gains layout: HoldLayoutState (§19.1) and vigil: VigilState (§21.1)
```

**Replace with:**
```markdown
// 14 from v1.4 (D562); 13 from v1.3 (D543); 12 from v1.1 (D502); GameState also gains layout: HoldLayoutState (§19.1), vigil: VigilState (§21.1) and descent: DescentState (§22.1)
```

## 2 — §5.2 The Remembering: `EndingRecord` and validation gain `'descent'`

**Find:**
```markdown
interface RememberingState {
  nearSeen: boolean                              // Pechko's near-scene (R-01 or R-02) was closed with Continue
  readyNoted: boolean                            // the "The Remembering is ready" line has been shown (D466)
  endings: EndingRecord[]                        // endings reached, in the order chosen; at most 2 entries
}
interface EndingRecord {
  ending: 'remember' | 'vigil'
  at: number                                     // information only; never compared (D461)
  cycle: number                                  // the cycle number when it was chosen
}
```

**Replace with:**
```markdown
interface RememberingState {
  nearSeen: boolean                              // Pechko's near-scene (R-01 or R-02) was closed with Continue
  readyNoted: boolean                            // the "The Remembering is ready" line has been shown (D466)
  endings: EndingRecord[]                        // endings reached, in the order chosen; at most 3 entries (v1.4, D562)
}
interface EndingRecord {
  ending: 'remember' | 'vigil' | 'descent'       // 'descent' added in v1.4 (D558, D562), recorded on the first win of The Descent
  at: number                                     // information only; never compared (D461)
  cycle: number                                  // the cycle number when it was chosen or first won
}
```

**And find:**
```markdown
- **Validation (array order, not time):** `endings` has at most one `remember` and one `vigil`; ids are known; `cycle` is an integer from 1 to the current cycle number; `at` is a non-negative number and is **not compared**; a `vigil` must come **before** a `remember` in the array;
```

**Replace with:**
```markdown
- **Validation (array order, not time):** `endings` has at most one `remember`, one `vigil` and (from v1.4, D562) one `descent`; ids are known; `cycle` is an integer from 1 to the current cycle number; `at` is a non-negative number and is **not compared**; a `vigil` must come **before** a `remember` in the array, while `descent` may appear at any position (before or after `remember` and `vigil`, D558); `remembering.choose('descent')` is explicitly refused (The Descent is embarked upon via `descent.start`, not `remembering.choose`, S2); if `'descent'` is present in `endings` but `firstWin` is null, or vice-versa, validation logs a warning and reconciles them (S2);
```

## 3 — §7.2 Streams: add the Descent streams

**Find:**
```markdown
| Stand waves (unchanged) | `${gameSeed}:stand:${cycle}`, drawn from the pool named by `CycleRecord.standPool`; the `base` pool draws exactly as before v0.9, so no existing stream or stand shifts |
```

**Replace with:**
```markdown
| Stand waves (unchanged) | `${gameSeed}:stand:${cycle}`, drawn from the pool named by `CycleRecord.standPool`; the `base` pool draws exactly as before v0.9, so no existing stream or stand shifts |
| Descent stage fight (v1.4) | `${gameSeed}:descent:${attempt}:stage:${1\|2\|3}` (`attempt` is `descent.attempts`, 1-based, incremented when `descent.start` runs, D561) |
| Descent preview, sample i (v1.4) | `${gameSeed}:descentodds:${attempt}:${i}:stage:${1\|2\|3}`, a distinct prefix so the preview never reveals the real attempt's rolls and shares dice across marching-order and preparation comparisons (D98, D561) |
```

## 4 — §9.4 Versioning: current schema number

**Find:**
```markdown
(currently **13**, from v1.3, D543; 12 from v1.1, D502)
```

**Replace with:**
```markdown
(currently **14**, from v1.4, D562; 13 from v1.3, D543; 12 from v1.1, D502)
```

## 5 — §9.4: the v13 → v14 migration

**Find:**
```markdown
`v13-played.json` loads, validates, round-trips and has three recorded levels 1, 2, 3 and one stand with no `vigilLevel` between; the migration runs in ≤ 100 ms (the benchmark row, GDD §6.5).
```

**Replace with:**
```markdown
`v13-played.json` loads, validates, round-trips and has three recorded levels 1, 2, 3 and one stand with no `vigilLevel` between; the migration runs in ≤ 100 ms (the benchmark row, GDD §6.5).

- **v13 → v14** *(v1.4; `save/migration-v14.ts`; fixtures `tests/saves/fixtures/v13-owner.json` (the owner's real v1.3 save, exported at TD.1), `v14.json` (that save migrated, not played) and scripted `v14-played.json`; see §22.6)*:
  - adds `descent: { attempts: 0, unlitMet: false, last: null, firstWin: null, unreadResult: false }`;
  - changes nothing else: `remembering.endings`, `vigil`, `layout`, `orders` and all cycle records are untouched;
  - **Tests:** each fixture loads, migrates, validates and round-trips (save → load → equal); migrated save has empty `descent` block; `rulesVersion` is still 5; **every golden fight replays line for line, and every recorded fight and stand keeps its result;** "newer version" guard tested with current code refusing schema 15; `v14-played.json` loads, validates, round-trips, has `'descent'` in `remembering.endings` and rebuilds all 3 stage logs from `descent.firstWin`; migration runs in ≤ 100 ms (the benchmark row, GDD §6.5).
```

## 6 — §10.1 The odds and suggest worker: message protocol

**Find:**
```markdown
- **Protocol:** `{ type: 'odds' | 'suggest', requestId, stateSlice, contract, party?, prep? }` → `{ requestId, result }`. Stale responses are dropped by `requestId`.
```

**Replace with:**
```markdown
- **Protocol:** `{ type: 'odds' | 'suggest' | 'descentPreview', requestId, input: previewInputFor(state), ... }` → `{ requestId, result }` (KV.5 corrected `stateSlice` to `previewInputFor(state)`). Stale responses are dropped by `requestId`.
```

## 7 — §11.2 Benchmarks list: add v1.4 rows

**Find:**
```markdown
| `bench.yml` *(⚑ plan review A10)* | Pull requests, and on demand | Benchmarks. **Warns** at the budget and **fails only at 2×** the budget. Not part of `npm run check`. |
```

**Replace with:**
```markdown
| `bench.yml` *(⚑ plan review A10)* | Pull requests, and on demand | Benchmarks. **Warns** at the budget and **fails only at 2×** the budget. Not part of `npm run check`. Includes `Descent preview` (≤ 1.5 s) and `v13 → v14 migration` (≤ 100 ms) from v1.4 (GDD §6.5, D565). |
```

## 8 — §13.4 Simulator shards: Descent probe

**Find:**
```markdown
- No new player; Standard, Light, Heavy, Opening, the Delver, the Eventer and the Orderer never choose an ending.
```

**Replace with:**
```markdown
- No new player; Standard, Light, Heavy, Opening, the Delver, the Eventer and the Orderer never choose an ending.

#### The Descent (v1.4)

- The Descent probe runs inside the `vigil` shard (`sim.yml` only, D564, §22.7). Parameter sweeps run on-demand via `npm run sim:descent -- ...` (S8). No simulator policy issues `descent.start` in its main run, so every existing report equals the v1.3 baseline (`192 of 192 same`).
```

## 9 — §14 Testing strategy: content validation and Descent row

**Find:**
```markdown
| **Content validation** | IDs, coverage, recipes, assets, names (§5.1) | v0.1 |
```

**Replace with:**
```markdown
| **Content validation** | IDs, coverage, recipes, assets, names (§5.1; scans `name`, `title`, `epithet`, `place`, `shortName`, `properNouns` against avoid list) | v0.1 |
| **The Descent** | Isolated 3-stage engine, reserve step-ins, frozen `DescentRecord` log rebuilding, Deep exclusion, proper nouns, story texts word-for-word against `lore-secrets.md §34.11` | v1.4 |
```

## 10 — §15 Debug panel: the Descent commands

**Find:**
```markdown
- **v1.3 (D544):** `debug.vigil.setStands(n)` sets `vigil.stands` and nothing else. A core command through `apply`, marks `debugUsed` as every debug command does; refused for a negative or non-integer `n`. It lets the owner and the tests reach a high level without playing. The switch itself (`vigil.set`) is the real command, not a debug one.
```

**Replace with:**
```markdown
- **v1.3 (D544):** `debug.vigil.setStands(n)` sets `vigil.stands` and nothing else. A core command through `apply`, marks `debugUsed` as every debug command does; refused for a negative or non-integer `n`. It lets the owner and the tests reach a high level without playing. The switch itself (`vigil.set`) is the real command, not a debug one.
- **v1.4 (D563, M5, M10):** `debug.prepareEndgameRoster()` builds a strong endgame state (14 hunters at level 10 with gear, recipes 36/36, skills 40/40, chapters 16/16, relics, consumables). `debug.descent.win()` opens the Remembering gate if closed, equips the endgame roster if needed, and runs real attempts with real seeds until a genuine win occurs, populating `descent.firstWin`, `descent.last`, `descent.unlitMet` and appending `'descent'` to `remembering.endings`. A core command through `apply`, marks `debugUsed`; it guarantees `rebuildDescentLogs` replays an honest win line for line.
```

## 11 — §21.9 Timing and New §22

**Find:**
```markdown
- **Test timing.** `npm run check` took 86–95 s on v1.2 against a 90 s warning and a 120 s failure; the new tests are small and no simulator test joins the fast set unless measured cheap. KV.10 and KV.11 re-measure, and the e2e shards (D533, D537) must each stay under 5 minutes.
```

**Replace with:**
```markdown
- **Test timing.** `npm run check` took 86–95 s on v1.2 against a 90 s warning and a 120 s failure; the new tests are small and no simulator test joins the fast set unless measured cheap. KV.10 and KV.11 re-measure, and the e2e shards (D533, D537, D552) must each stay under 8 minutes.

## 22. The Descent (v1.4, D557–D568)

**Save schema 13 → 14 (§22.1, §22.6). `rulesVersion` stays 5 on an isolated fight path (D561). Two new random stream prefixes (`descent`, `descentodds`, §7.2). No `advance` change: the Descent is resolved at once when `descent.start` runs and played back in the UI.** The core does all arithmetic and builds the `What the Hold Learned` breakdown in one function; the UI shows it and never computes it (§4.2). Story texts are sourced from `lore-secrets.md §34.11` (M7) and UI strings are in GDD §9.24.

### 22.1 Save state (D562, M3, M4, S9)

~~~ts
interface DescentStageSummary {
  stage: 1 | 2 | 3
  won: boolean
  ticks: number
  downedIds: HunterId[]          // hunters downed during this stage
  steppedInIds: HunterId[]       // reserve hunters who stepped in during or before this stage
}

interface DescentRecord {
  attempt: number                // 1-based attempt number (part of stage seeds)
  cycle: number                  // cycle number when fought (used by Roll of Wardens for firstWin)
  warden: string | null          // warden's name at the time
  seed: string                   // `${gameSeed}:descent:${attempt}`
  order: HunterSnapshot[]        // full marching order at launch (front 6 first, then reserve up to 8)
  prep: PrepSnapshot             // oil and potion per hunter in marching order
  bombs: Record<ConsumableId, number> // bomb stores at launch (up to 2 thrown per stage)
  learned: { mightAndHealth: number; taken: number } // frozen learned bonus (Might & Health in stat%, taken in taken%)
  delveRelics: DelveRelicId[]    // owned combat Delve relics at launch (Spindle Whorl, Cold Iron Nail, Rift Lantern, Salt Ring)
  bestiaryKnowledge: Record<MonsterId, number> // frozen knowledge level (0 | 1 | 2 | 3 | 4) for all monsters in the 3 stages: unlit-breath, forgotten, dross-tide, anvil-wight, rimewrought, unlit (M3)
  stageTiers: [number, number, number] // frozen stage tiers
  unlitBaseHealth: number        // frozen Unlit base Health
  alchemy: number                // frozen Alchemy skill level
  rulesVersion: number           // 5
  outcome: 'win' | 'loss'
  stagesCleared: 0 | 1 | 2 | 3
  standingCount: number          // hunters still standing at end
  downedCount: number            // total hunters downed across attempt
  stages: DescentStageSummary[]  // 1 to 3 entries
}

interface DescentState {
  attempts: number               // monotone counter, 0 at start
  unlitMet: boolean              // true once Stage 3 reached (win or lose); shows The Unlit on Great Beasts shelf
  last: DescentRecord | null     // latest attempt (win or loss)
  firstWin: DescentRecord | null // first winning Descent, kept forever for Roll mark and Library replay
  unreadResult: boolean          // true while a completed Descent result has not yet been viewed/dismissed (S9)
}
~~~

- A new game starts with `descent: { attempts: 0, unlitMet: false, last: null, firstWin: null, unreadResult: false }`. `resetForLongNight` copies `descent` **unchanged** into the new cycle; a test proves it.
- `EndingRecord.ending` (§5.2) widens to `'remember' | 'vigil' | 'descent'`, and `remembering.endings` holds up to 3 entries (`vigil` before `remember`, `descent` at any position). On first victory (`outcome === 'win'` and `!firstWin`), `'descent'` is appended to `remembering.endings` and `firstWin` is set; later victories update `last` and leave `firstWin` and `remembering.endings` unchanged.
- **No raw log lines are stored.** `rebuildDescentLogs(record)` re-runs the 3 stages deterministically from `DescentRecord` alone. Because `bestiaryKnowledge` freezes knowledge levels for every stage monster (including contract smiths Anvil-wight and Rimewrought), subsequent kills or masteries cannot cause replay drift (M3). A unit test verifies this determinism.
- **Save growth:** measured in TD.4b from real full 14-hunter records; proposed GDD §6.5 row uses the D445/D469 measured-row pattern (sketch ≤ 4 KB for `firstWin` + `last`, M4).

### 22.2 Availability, eligibility and the `What the Hold Learned` bonus (D558, D559, M1, M6, S6)

All in `src/core/systems/descent.ts`, built so every visible number and its `Breakdown` come from the same function (§5.4).

- **Availability:** `descentAvailable(state)` = `endingChoosable(state)` (§5.2: all 40 names found, all 16 contract species Studied, and Act VI's stand applied) **AND** `state.rank >= HoldRank.Bastion` (S6: door at foot of Bastion stair restored only at Bastion, GDD §5.1.3). Available before or after Remember Them or Keep the Vigil.
- **Hunter eligibility (`eligibleForDescent(state)`):** every owned hunter (`state.hunters`, active and reserve, up to 14 including unlocked legendary hunters) **except** hunters currently away on a running contract (`state.running`) or inside a paused Delve (`state.delve.run`). Injury recovery timers and event rest timers do **not** block the Descent (the all-hands rule, like Last Stand, D110, D558). Starting the Descent never finishes running contracts or aborts a paused Delve (D567 (1)).
- **`suggestDescentOrder(state)`:** orders all eligible owned hunters with at least one Vanguard and one Mender in the front 6 (highest levels first, ties by roster order), and the remaining eligible hunters (up to 8) in the reserve line by level descending.
- **`learnedBonus(state)`:** computes the party's Descent bonus and its `Breakdown` tree in one function (GDD §5.0, §5.15.10, §7.14, M1):
  - `masteredCount` = count of 16 contract species at Mastered (`level === 4`);
  - `propertiesCount` = count of revealed properties in `state.book` (0–36);
  - `skillLevels` = sum of 4 warden skill levels (`alchemy + smithing + lore + command`, 0–40);
  - `chaptersRead` = sum of `state.orders.chaptersRead` across the 4 Orders (0–16);
  - `relicsCount` = `state.relics.length + state.delve.relics.length` (0–12);
  - `mightAndHealth` = `perMasteredSpecies × masteredCount + perProperty × propertiesCount + perSkillLevel × skillLevels + perOrderChapter × chaptersRead` (placed in the **`stat%`** bucket for hunter Might and hunter max Health; scaling attacks, Mender heals which use `1.5 × Might_eff`, and Silver/Rune sub-hits which use `Might_eff`, M1);
  - `taken` = `takenPerRelic × relicsCount` (placed in the **`taken%`** bucket, inside the 75% cap, in the Descent only).
- **Existing effects that apply vs do not apply (D559, M6):**
  - *Apply:* combat Delve relics owned (**Spindle Whorl** `+5%` Might in `stat%`; **Cold Iron Nail** `−5%` damage taken in `taken%`; **Rift Lantern** `+10` points recovery between stages; **Salt Ring** `−10%` max Health on Deep monsters: Unlit's Breath, Forgotten, Dross-Tide, The Unlit; GDD §8.10a, D261); Deep bestiary Studied/Mastered damage bonuses (`knowledge%`) vs Unlit's Breath, Forgotten and Dross-Tide in Stages 1–2; contract bestiary Studied/Mastered damage bonuses (`knowledge%`) vs Anvil-wight and Rimewrought in Stage 2; hunter gear, traits, talents, keepsakes and use-skills.
  - *Do NOT apply:* Walls (Hold only), Watchtower volley (Hold only), Iron Shutter (Last Stand only), Delve blessings (Delves only), and location traits (D115, D254).
- **What the Descent does NOT give or count (D558, M6):** gives no hunter XP or yard XP; no Command, Lore, Smithing or Alchemy skill XP; no bestiary kills or Deep knowledge; no first-time Delve relic triggers; no trophies, no Riftglass; no Orders standing or village trust; no Threat, act counters, or contracts-won stats; adds nothing to event "recent" list.

### 22.3 The isolated 3-stage relay engine (`runDescent`, D558, D560, D561, D567)

In `src/core/systems/descent-fight.ts`. Runs **only** for the Descent (`descent.start`, preview, and `rebuildDescentLogs`); no contract, Delve floor, event attempt or Last Stand calls it, so **`rulesVersion` stays 5** and every golden fight and recorded stand replays line for line.

1. **Stages:**
   - **Stage 1 (The Crack):** 2-monster group (`['unlit-breath', 'forgotten']`) at tier `stageTiers[0]`. While the gate is open, all 16 contract species are Studied, so The Forgotten's `Nameless` bonus is `+0%`.
   - **Stage 2 (The Sealed Stair):** 3-monster group (`['dross-tide', 'anvil-wight', 'rimewrought']`) at tier `stageTiers[1]`.
   - **Stage 3 (Below the Seal):** 1 monster (`['unlit']`) at tier `stageTiers[2]`.
   - Monsters scale from base tier (`unlit-breath`, `forgotten`, `dross-tide` base tier 2; `anvil-wight` 3; `rimewrought` 4; `unlit` 5) by `monster.statGrowth` (1.35) and `monster.armorGrowth` (1.15) (§7.4). When **Salt Ring** is owned, Deep monsters (`unlit-breath`, `forgotten`, `dross-tide`, `unlit`) have `× 0.90` max Health.
2. **Deep exclusion rule for The Unlit (M2):** `unlit` is flagged `descentOnly: true` (or excluded from Delve guardian pools, Deep bestiary `state.delve.deep`, contract species list, and The Forgotten's count). Tests verify that Delve guardian and floor draws for fixed seeds are byte-identical before and after `unlit` is added.
3. **Group combat and targeting (S15):** Stages 1 and 2 use v0.7 group combat rules (GDD §5.10.4, D251): Vanguard and Mender (when attacking) hit front standing monster; Striker hits lowest-Health standing monster. At tick 1 of each stage, up to 2 bombs from stores are thrown automatically: weak-to front monster in content order, then next monsters, then one Saltburst, then one Poppy Smoke. Mid-stage reserve step-in does not re-throw bombs.
4. **The Unlit (`unlit`, Stage 3, D560, S14):**
   - Base stats at tier 5: Health `balance.descent.unlitBaseHealth` (sits in `balance.ts`, read by `monsters.ts`), Might 42, Armor 12, Speed 10, Atk 1, family `deep`; resistances Steel 0.75, Silver 1.25, Fire 1.5, Frost 0, Rune 1.5, Venom 0.
   - *First Cold:* on each action, every standing hunter loses `round(0.03 × maxHealth × (1 − min(0.75, taken%)))` Health as Frost damage (ignoring Armor; halved after resistances for Halvar's `Smoke-Lunged`, min 1) and loses 15 turn meter.
   - *Heavy Dark:* on every 3rd action, attacks every standing hunter (direct attack; Armor applies) and inflicts `Chill` (50% less healing received for next 2 actions, `status%`, refreshes; cleared by Herdis's `Shepherd's Crook`).
   - A **Saltburst** cancels first trigger of either ability and blocks abilities for 3 actions (§5.7).
5. **All-hands relay and reserve step-in (D558 (3), D567 (2), S1):**
   - First up to 6 hunters in `order` start Stage 1 in front line; remaining up to 8 wait in reserve queue in order.
   - **Between-stage recovery and step-in:** when Stage 1 or 2 is won, standing front-line hunters recover 20% max Health (+10 points with Rift Lantern), and downed slots are filled in slot order by next waiting reserves at full Health.
   - **Mid-stage step-in:** if all standing front-line hunters are downed during a stage while reserves wait, next waiting reserves (up to 6) immediately step in at base turn meter 0 (start-of-fight meter traits like *Up Before the Wolves* setting meter to 100/full and *Yrsa's Thole* to 50 applied to that base as they enter; S1), taking slots in queue order. Start-of-fight potions and buffs apply from entry and last for the remainder of that stage. Bombs are not re-thrown. The stage continues against monsters' current Health, meters and statuses within the 400-tick limit.
   - **Preparation & trait scopes (M6):** 1 oil and 1 potion per hunter in marching order (potions fire once in the Descent); "once per fight" traits (*Hold the Stair*, *Sit the Vigil*, *Ferryman's Coin*, *The Barley Knot*, *The Other Hand*, *Stopping Root*, *Rattle the Pots*) fire once per Descent per hunter.

### 22.4 Commands and the preview (D561, D563, S10)

- `descent.start { order: HunterId[]; prep: PrepInput }` through `apply()`:
  - **Refused** when `!descentAvailable(state)`, when hold is below Bastion rank, when `order` is empty or has duplicates, when any hunter in `order` is unavailable (on contract or in Delve), or when `prep` references missing store items.
  - Spends oils, potions and bombs thrown across stages from `state.stores`.
  - Increments `state.descent.attempts`, runs `runDescent`, sets `state.descent.last = record`, `unreadResult = true`, and if Stage 3 reached sets `state.descent.unlitMet = true`.
  - If `record.outcome === 'win'`, records `{ ending: 'descent', at: now, cycle: state.cycle.number }` once in `state.remembering.endings` and sets `state.descent.firstWin = record` if `firstWin` was `null`.
  - Causes no hunter deaths, no injuries, no recovery timers, no event rest, no Long Night reset, and leaves `vigil`, `orders` and `skills` untouched.
- `debug.prepareEndgameRoster()` and `debug.descent.win()` — §15.
- **Preview in the odds worker (§10.1, S10):** `{ type: 'descentPreview', requestId, input: previewInputFor(state), order, prep }` runs `balance.descent.previewSamples` (100) 3-stage practice runs using seeds `${gameSeed}:descentodds:${attempts + 1}:${i}:stage:${1|2|3}`. Returns win chance (with `±margin`), expected stage reached/outcome, median hunters downed (with 10th–90th percentile range), and `Why?` summary. Budget: **≤ 1.5 s** on 4× CPU-throttled profile (GDD §6.5, D565).

### 22.5 Art and the v1.4 contact sheet (D565, S12, Nice-to-have 8)

- Five code-generated PNGs in 32-colour Zughy palette, registered in `src/content/assets.ts`:
  - `portrait.monster.unlit` (`64 × 64 px`, `portraits/monsters/unlit.png`);
  - `sprite.monster.unlit` (`32 × 32 px` frames, `160 × 32 px` 5-frame strip, `sprites/monsters/unlit.png`);
  - `scene.descent.stage-1`, `scene.descent.stage-2`, `scene.descent.stage-3` (`160 × 64 px`, `scenes/descent-stage-1..3.png`).
- Roll of Wardens mark for *"Led the Descent."* is drawn in code as inline SVG (no PNG file).
- `tools/contact-sheet-numbered.ts` (`--descent-sheets`) outputs numbered contact sheet (pictures 1–5 in its own sequence) on both theme backgrounds to `docs/flesh-out/v1.4/contact-sheets/` and writes `docs/flesh-out/v1.4/art-marks.md`. Shipped hashes frozen in `art-src/v1.4-hashes.json` (S12).
- `vite.config.ts` keeps `icons/` unpacked so `sw.js` never lists duplicate hashes (D553, D557).

### 22.6 Migration and fixtures (D562, M4, M5)

`save/migration-v14.ts` is described in §9.4. Fixtures: **`v13-owner.json`** (owner's real v1.3 save, exported at TD.1), **`v14.json`** (migrated, not played) and **`v14-played.json`** (made in TD.4b using `debug.prepareEndgameRoster()` and `debug.descent.win()`, which runs real seeded attempts until a genuine win occurs). Validation (`save/validate-descent.ts`): `attempts` non-negative integer; `unlitMet` boolean; `unreadResult` boolean; `last` and `firstWin` valid `DescentRecord` objects or `null`; unknown content ids drop with warning.

### 22.7 The simulator (D564, M8, M9, M10, S8)

- **The Descent probe** runs inside existing `vigil` shard (`sim.yml` only, D564).
- On-demand calibration sweeps run via `npm run sim:descent -- ...` (S8, the v1.3 KV.9 pattern), while CI `sim.yml` judges only the fixed calibrated constants.
- Per Monday seed, shared builder `buildEndgameRoster(state)` (`sim/descent-roster.ts`, M10) constructs test profiles:
  - *minimal gate-open:* 16 species Studied, 0 Mastered, 0 chapters, natural roster/relics;
  - *maxed endgame:* all 14 hunters owned at Master Wright level 10, 5 stars, 5 talents, Wright gear, 16/16 Mastered species, 36/36 recipe properties, 40/40 skills, 16/16 Order chapters, 12 relics, matching consumables.
- **Calibration (TD.8b → TD.9; M9):** TD.8b measures grid of `descent.stageTiers` and `descent.unlitBaseHealth` and writes `docs/flesh-out/v1.4/descent-calibration.md`. TD.9 sets owner-approved values so gate-open full roster wins with win rate **50% to 85%** and **2 to 8 hunters downed**, and adds **Row A (`descent-victory`)** and **Row B (`descent-learned-matters`)** to `sim/targets.ts` in their own commit (`sim/checks/v14.ts`).
- **Zero baseline drift:** no simulator policy issues `descent.start` in its main run, so every existing player's report equals the v1.3 baseline (`192 of 192 same`).

### 22.8 Tests (D566, M2, M3, M4, S16)

| Area | Tests |
|---|---|
| Save | v13 → v14 on all fixtures (`v13-owner.json`, `v14.json`, `v14-played.json`); round-trip; current code refuses schema 15; `descent` kept across `resetForLongNight`; `remembering.endings` accepts `'descent'` in any order with `'remember'` and `'vigil'`; `Descent save growth` measured from real records (sketch ≤ 4 KB, M4) |
| Learned bonus | `learnedBonus(state)` and `Breakdown` tree match across table of states (0 to max); Might in `stat%` (scales heals and sub-hits), max Health in `stat%`, damage taken in `taken%`; every contributor line adds up to total |
| Fight engine | Stage 1 (2 monsters), Stage 2 (3 monsters), Stage 3 (`unlit`); `First Cold` (3% Frost drain + 15 meter knockback; halved for `Smoke-Lunged`) and `Heavy Dark` (sweeps all standing + `Chill` healing cut; cleared by `Shepherd's Crook`); Saltburst cancels first trigger and blocks for 3 actions; between-stage 20% recovery (+10% with Rift Lantern); between-stage and mid-stage reserve step-ins (base meter 0, meter traits applied to base, slot ordering, entry buffs, bombs not re-thrown); Salt Ring −10% Health on Deep monsters; **every golden fight and recorded stand replays line for line (`rulesVersion` is 5)** |
| Deep exclusion | `unlit` flagged `descentOnly: true`; Delve floor and guardian draws for fixed seeds byte-identical before and after adding `unlit`; stand pools, gate species and Forgotten count unchanged (M2) |
| Commands & rebuild | `descent.start` refused when gate closed, hold below Bastion, with unavailable hunters or bad inputs; win records `'descent'` once, sets `firstWin` and `last`, sets `unlitMet`, causes no injuries/deaths/Long Night, and leaves `vigil`, `orders` and `skills` untouched; `rebuildDescentLogs` reproduces all 3 stage logs line for line from `DescentRecord` alone, proven immune to subsequent state changes (M3) |
| Preview & bench | 100 practice runs in odds worker match `runDescent` on same seeds; `Descent preview` ≤ 1.5 s and `v13 → v14 migration` ≤ 100 ms in `bench.spec.ts` |
| Art & offline | 5 new PNGs use only 32-colour palette and match sizes; `v1.0-hashes.json` and `v1.1-hashes.json` pass byte-identical; `art-src/v1.4-hashes.json` tested; `sw.js` has no duplicate paths or hashes and offline reload passes on production build (`smoke.spec.ts`, `png-pack.test.ts`, D557) |
| Texts & names | D-01 to D-07, 3 resident lines and §9.24 strings equal `lore-secrets.md §34.11` and GDD word for word, with no avoid-list words and no Sent names; new proper nouns in `tests/content/names.ts` (allowing `unlit` as patron and monster) |
| Non-coupling | nothing in `src/ui/` computes `learnedBonus`; nothing in contracts, Delves, events or Last Stand reads `state.descent` (planted read fails) |
| UI (Playwright, phone viewport) | no Descent button while gate closed or hold below Bastion; button, sheet, marching order (Suggest, tap-to-swap, unavailable reason), breakdown sheet, preview, full win and loss playback, sound cues, interrupted playback reload, Roll mark, Library replay, Great Beasts shelf; 0 findings in 44 px tap, width (320/360/900/1300 px), Largest text at 320 px, motion and contrast sweeps; routine check-in ≤ 15 taps |
| Simulator | Rows A and B pass in `sim.yml`; `vigil` shard ≤ 4 min; every existing report equals v1.3 baseline (`192 of 192 same`) |
| Size | production build ≤ 614,400 bytes gzipped (SF.9 method), measured at TD.2, TD.4b, TD.5, TD.7b and TD.10 |
```
