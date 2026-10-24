# OUT-9 — Edits to `docs/technical-design.md` (v1.3 "Keep the Vigil", D538–D551)

Every **Find** was copied from the Project's copy of `docs/technical-design.md` on 2026-10-24. **They were not machine-checked** (only the GDD's were; this document comes inline and is not on disk here), so each is written as a short, distinctive fragment. **If one does not match exactly once, stop and tell the owner.** Edits are in document order. Edit 6 appends the new §21 at the end of the file.

**Names to check in the repo (not in the Project's documents):** the file and function names below (`save/migration-v13.ts`, `vigil.set`, `waveFactor`, `embersMultiplier`, `vigilAvailable`, `src/core/systems/vigil.ts`) are proposals in the repo's existing style. The Last Stand code's real names (the stand-start command, the wave-strength function, `resetForLongNight`, the Embers function) were not visible in the Project's documents; **Claude Code uses the repo's real names and reports any difference in the progress entry; a mismatch is not a stop.** The one thing that must not differ is the rule: each of the two terms lives in exactly one function.

## 1 — §5.2 `GameState`: schema number and the new block

**Find:**
```markdown
// 12 from v1.1 (D502); GameState also gains layout: HoldLayoutState (§19.1)
```

**Replace with:**
```markdown
// 13 from v1.3 (D543); 12 from v1.1 (D502); GameState also gains layout: HoldLayoutState (§19.1) and vigil: VigilState (§21.1)
```

## 2 — §5.2 cycle history: `vigilLevel`

**Find:**
```markdown
*(v0.9: also `standPool: 'base' | 'dross' | null`, below.)*
```

**Replace with:**
```markdown
*(v0.9: also `standPool: 'base' | 'dross' | null`, below. v1.3: the stand's saved inputs also carry an optional `vigilLevel`, §21.1.)*
```

## 3 — §9.4 versioning: the current schema number

**Find:**
```markdown
(currently **12**, from v1.1, D502)
```

**Replace with:**
```markdown
(currently **13**, from v1.3, D543; 12 from v1.1, D502)
```

## 4 — §9.4: the v12 → v13 migration

**Find:**
```markdown
the migration runs within the budget approved under D445's route.
```

**Replace with:**
```markdown
the migration runs within the budget approved under D445's route.

- **v12 → v13** *(v1.3; `save/migration-v13.ts`; fixtures `tests/saves/fixtures/v12-owner.json` (the owner's real save, exported by the owner before the preview build opens it), `v13.json` (that save migrated, not played) and the scripted `v13-played.json`; see §21.6)*:
  - adds `vigil: { on: false, stands: 0 }`;
  - changes nothing else: no stand record gets a `vigilLevel` (absent means 0); sets no flag;
  - **Tests:** each fixture loads, migrates, validates and round-trips (save → load → equal); the migrated save has the empty block and no `vigilLevel` anywhere; `rulesVersion` is still 5; **every golden fight replays line for line, and every recorded fight and stand keeps its result;** the "newer version" guard is tested with the current code refusing schema 14 (v12 code cannot run in the tests); `v13-played.json` loads, validates, round-trips and has three recorded levels 1, 2, 3 and one stand with no `vigilLevel` between; the migration runs in ≤ 100 ms (the benchmark row, GDD §6.5).
```

## 5 — §15 Debug panel: the vigil command

**Find:**
```markdown
### 15.1 Diagnostics *(⚑ new, plan review A18; available in every build, not just debug)*
```

**Replace with:**
```markdown
- **v1.3 (D544):** `debug.vigil.setStands(n)` sets `vigil.stands` and nothing else. A core command through `apply`, marks `debugUsed` as every debug command does; refused for a negative or non-integer `n`. It lets the owner and the tests reach a high level without playing. The switch itself (`vigil.set`) is the real command, not a debug one.

### 15.1 Diagnostics *(⚑ new, plan review A18; available in every build, not just debug)*
```

## 6 — New §21, after §20.7 (append at the end of the file)

**Find:**
```markdown
- **Test timing.** The e2e job has a 15-minute limit (D513) and `npm run check` warns at 90 s and fails at 120 s (D512). The new tests are small; SF.12 re-measures both.
```

**Replace with:**
````markdown
- **Test timing.** The e2e job has a 15-minute limit (D513) and `npm run check` warns at 90 s and fails at 120 s (D512). The new tests are small; SF.12 re-measures both.

## 21. Keep the Vigil: Rising Vigil (v1.3, D538–D551)

**Save schema 12 → 13 (§21.1, §21.6). `rulesVersion` stays 5 (D542). No new random stream (§7.2). No `advance` change: nothing happens over time; the level moves only when a stand is started.** The core does the arithmetic; the UI shows it and never computes it (§4.2). Player-facing strings are in GDD §9.23.

### 21.1 Save state (D543)

```ts
interface VigilState {
  on: boolean      // the switch as the player left it; kept through the Long Night
  stands: number   // stands already fought with the switch On; a non-negative integer
}
// GameState gains:  vigil: VigilState
// the stand's saved inputs gain: vigilLevel?: number   // the level the stand was fought at; absent means 0; an integer ≥ 1 when present
// (stored in the same record that holds standPool, Threat and the seed, which is what a rebuild reads, §5.2)
```

- A new game starts with `{ on: false, stands: 0 }`. `resetForLongNight` copies `vigil` **unchanged** into the new cycle (like `layout`, §19.1); a test proves it.
- The `vigil` block is about 30 bytes; each fought On stand adds about 16 bytes (`"vigilLevel":N`) to its stand record, for ever (no cap). **Save growth ≤ 0.5 KB** for the block plus 20 recorded levels (a unit test, GDD §6.5).
- **Not to be confused with the ending id.** `remembering.endings[].ending` has a value `'vigil'` (Keep the Vigil, §5.2). That is a different thing from `state.vigil` (Rising Vigil). A test proves `remembering.choose('vigil')` leaves `state.vigil` identical (Keep the Vigil changes nothing, D453, D539), and a comment at each says which is which.
- **Why `stands` is stored although it could be derived** from the count of stand records with `vigilLevel > 0` (D549 (8)): the owner approved the block, and the "next level" line and the debug command read it. Validation catches drift: a **warning** (never a refusal, never a repair) when `stands` differs from that count, ignored when `meta.debugUsed` is set.
- The settings key outside the save (§18.1) is **unchanged**: the switch is game state, not an app setting, and it is part of the export code and file.

### 21.2 Derived values and the two terms (D539, D540, D541)

All in one new file, `src/core/systems/vigil.ts` (or the nearest equivalent), built so the number and its `Breakdown` come from the same function (§5.4). Only `+ − × ÷` and comparisons are used, so the portable-math rule (§7.4) is met with no helper.

- `vigilAvailable(state)` = `endingChoosable(state)` (§5.2, The Remembering). Derived, never stored; it never closes again in play (names found and Studied knowledge never go down).
- `vigilLevelFor(state)` = `state.vigil.on && vigilAvailable(state) ? state.vigil.stands + 1 : 0`. This is what a stand started now would be fought at, and what the preview uses.
- `waveFactor(threat, level)` = `1 + balance.threat.waveStrengthPerPoint × threat + balance.vigil.strengthPerLevel × level`, with a `Breakdown` of two lines (Threat, Rising Vigil). It multiplies wave **Health and Might** where the Threat factor does today; the existing rounding to integers (GDD §5.0) is applied exactly where it is today.
- `embersMultiplier(threat, level)` = `1 + balance.embers.threatBonus × threat + balance.vigil.embersPerLevel × level`, with a `Breakdown`.
- **Level 0 is bit for bit the old result.** At `level = 0` the added term is `s × 0 = +0`, and adding `+0` to a double gives the identical double, so the old and new expressions agree exactly; the code also keeps the old call path for level 0 so a reader and a test can see it. A table test over Threat values proves `waveFactor(t, 0)` and `embersMultiplier(t, 0)` equal the old expressions with `===`.
- **Each term is computed in exactly one place.** The stand fight, the practice stands behind the preview, the wave-log rebuild and the Embers payout all call these functions. **Tested as: each of `threat.waveStrengthPerPoint`, `vigil.strengthPerLevel`, `embers.threatBonus` and `vigil.embersPerLevel` is read in exactly one file under `src/core`. If the existing code computes the Threat factor in more than one place and cannot be made one function, stop and ask.**
- If the owner answers Q57 with a compounding step, `waveFactor` becomes `(1 + w × threat) × intPow(1 + s, level)` (or the agreed form), using `intPow` (§7.4); the rest of this section does not change. It needs its own decisions row.

### 21.3 Commands (D544)

- `vigil.set { on: boolean }` through `apply()`. **Turning On is refused** (with a reason) when `vigilAvailable` is false or when this cycle's stand has already started; **turning Off is refused only when this cycle's stand has already started** (the switch is then read-only until the next cycle). Setting it to its current value is accepted and changes nothing. It rolls nothing and sets no flag.
- **Starting the Last Stand** (the existing stand-start command) reads the switch **once, at the moment it starts:** with `vigilAvailable` and `on`, it fixes `L = stands + 1`, increments `stands`, and writes `vigilLevel = L` into the stand's saved inputs, in the same step that fixes the stand's other inputs. Otherwise `L = 0` and nothing is written. Starting twice cannot add two levels (the existing "already started" refusal covers it; a test proves it). If the stand's start and the Long Night apply in one command, the window in which `vigil.set` is refused as "stand started" does not exist; Claude Code confirms in the code and tests that refusal only if it exists.
- The stand's saved inputs carry `L`, so **any later rebuild (a wave log, the Library replay) uses the saved level, never the switch's current state** (CLAUDE.md rule 2 of v1.3).
- `debug.vigil.setStands(n)` — §15.

### 21.4 Determinism and `rulesVersion` (D542)

- **`rulesVersion` stays 5** on the D363 precedent (`standPool` saved with the stand's inputs) and the v0.9 boss effects (new effects only in new kinds of fights). CLAUDE.md says combat math changes bump `rulesVersion`; D542 is the owner-gated reading that this is not a change to old combat math: the level-0 path is untouched and the new term exists only where a saved `vigilLevel ≥ 1` says so.
- **Every golden fight, every recorded fight and every recorded stand replays line for line.** If any does not, stop and ask. The stand's wave list is unchanged by the level (the stand seed fixes it, §7.2).
- No new random stream, no new `RollSource` use; the Orders-style statement "nothing is rolled" holds.

### 21.5 The preview (D544)

The odds worker's `stateSlice` (§10.1) carries `vigil.on`, `vigil.stands` and the gate result; the 100 practice stands use `vigilLevelFor(state)` and the same functions as §21.2, so flipping the switch recomputes expected waves (median with the 10th–90th range), the Embers now (with breakdown) and the Embers-tomorrow estimate (still labeled an estimate). Stale responses are dropped by `requestId` (§10.1), so a quick double flip shows the latest. The 1 s preview budget (GDD §6.5) holds; the odds benchmark rows do not change. With the switch Off, the preview equals the pre-v1.3 preview for any state (a table test).

### 21.6 Migration and fixtures (D543)

`save/migration-v13.ts` is described in §9.4. Fixtures: **`v12-owner.json`** (the owner's real save, exported at KV.1; the preview uses its own storage and cannot touch the live save, so the one-way moment is the merge and the owner exports again just before it), **`v13.json`** (migrated, not played) and **`v13-played.json`** (made in KV.4 with the real commands and `debug.vigil.setStands`: gate open, three On stands, one Off, one more On, so levels 1, 2, 3 and a gap, then the next On stand is level 4). Validation: unknown fields drop with a warning; `stands` a non-negative integer; `vigilLevel` an integer ≥ 1; the count-mismatch warning (§21.1).

### 21.7 The simulator (D546)

- **The probe** (the Dross-Tide stand probe's pattern, §13.3) works on a `structuredClone` of **the Vigilant's state at the check-in where it would start its first endless stand** (Bastion, Standard's stand-timing rule), per Monday seed; not its final state, because after its third stand the Long Night has reset the hold. For each level 0 to 10 it sets `vigil.on` and `stands` and runs the preview's 100 practice stands (`laststand.previewSamples`) with **the same seeds at every level**; waves held is the median of the 100 and Embers the median of total stand Embers (waves part plus trophies). It never touches a real run's state. It runs inside the `vigil` shard and counts in its 4-minute stop. KV.8 reports the curve for both the additive and the compounding step, at two Threat points, with the band at each level; **KV.9 picks `s`** whose median waves lost by level 3 is closest to 3 (pass band 2.5–3.5 in total, 0.5–1.5 per step) and **`e`** whose total Embers at levels 1–3 stay closest to level 0.
- **The Vigilant** (`sim/policies/vigilant.ts`): Standard's decisions at every check-in; after Act VI's stand has been applied it calls `debug.remembering.openGate()` once (declared in its report; marks `debugUsed`), calls `vigil.set { on: true }` before each stand, and plays 3 endless cycles. **Monday seeds only, its own shard `vigil`** (`sim/shards.ts`, the Orderer and Eventer pattern, D351, D445). No other policy issues `vigil.set`, so every other report equals the v1.2 baseline.
- **Judging:** rows A–C (GDD §6.2, Proposed) in `sim/checks/v013.ts`, thresholds from `sim/targets.ts` in their own commit after owner approval. Row A reads the Vigilant; rows B and C read the probe (the Embers tolerance is fixed before the final judging run). "A stand with the switch Off equals level 0" is a unit test (§21.8), not a row. **The probe is judged in `sim.yml` only** (the D464 pattern, §11.2) unless CI `npm run check` stays at 90 s or less on 3 runs with it in.
- **Budget:** the `vigil` shard must stay under 5 minutes per CI job (D320); **if it would pass 4 minutes, stop and ask; never trim seeds or rows.**
- Reported only: the waves-held and Embers curve per level (median of the 5 Monday seeds, with the range).

### 21.8 Tests (D548)

| Area | Tests |
|---|---|
| Save | v12 → v13 on all fixtures; round-trip; the current code refuses schema 14; `vigil` kept across `resetForLongNight`; `stands` mismatch warns, never refuses; the block plus 20 recorded levels ≤ 0.5 KB |
| Level 0 | `waveFactor(t, 0)` and `embersMultiplier(t, 0)` equal the old expressions with `===` for a table of Threat values; every recorded stand and golden fight replays line for line |
| Terms | with `L > 0` the factor and the Embers equal a table worked out independently; the breakdown lines add up to the number; each term has one implementation (a lint or grep test) |
| Commands | `vigil.set` accepted and refused in exactly the listed cases (table); starting a stand reads the switch once; two starts cannot add two levels; `debug.vigil.setStands` marks `debugUsed` and is refused for bad input |
| Rebuild | a stand fought at level 3 and rebuilt from its record gives identical logs; the switch flipped afterwards changes nothing |
| Keep the Vigil | `remembering.choose('vigil')` leaves `state.vigil` identical; Rising Vigil stays available after `remember` |
| Preview | flipping changes the preview exactly as a real stand at that level does; Off equals the pre-v1.3 preview; time within budget |
| UI (Playwright, phone viewport) | no row while the gate is closed; row, status line, confirmation and result lines in each state; buttons ≥ 44 px at 320 and 360 px and every Text size; no sideways scroll at 320 px Largest; contrast in both themes; a routine check-in is 15 taps or fewer |
| Roll | no mark without `vigilLevel`; mark and line with it; no file under `public/assets/` changed |
| Non-coupling | the vigil module and reads of `state.vigil` are on the lint list (imports and property reads, not the word: the ending id `'vigil'` exists); a planted read of `state.vigil` from `src/ui/` fails |
| Off equals level 0 | a stand fought with the switch Off after level 3 equals a level 0 stand: same waves, Embers and wave logs (unit test; true by construction) |
| Strings | the nine strings equal GDD §9.23 word for word (the v1.2 `sound-text.test.ts` pattern) |
| Simulator | rows A–C; the Vigilant's `debugUsed` is reported; every other report equals the v1.2 baseline (`176 of 176 same`) |
| Size | the production build, gzipped (the SF.9 method), ≤ 614,400 bytes; measured at KV.2, KV.3, KV.4, KV.6 and KV.10 and written in the progress entries |

### 21.9 Risks and honest notes

- **The additive step flattens the curve** (waves lost per level shrink); Q57 and KV.8's measured curve decide whether to compound, before KV.9 and before any vigil stand is recorded in a shipped save.
- **Embers have a finite use:** upgrades have maximum levels and stars stop at 5, so extra Embers buy nothing once those are bought (D541). The vigil is a challenge, not a reward track.
- **The download row has 3,892 bytes of room** and my 2–4 KB guess for the code is not measured. KV.2, KV.3, KV.4 and KV.6 measure early so an overrun is found in days, not at the end; the fallback order is in D547.
- **Two things called "vigil".** The ending id and the Rising Vigil block share a word; §21.1 and the tests keep them apart.
- **The Vigilant's gate shortcut** (Q58) proves the mechanics, not that a real player reaches the gate.
- **The stand's wave-strength code may not be one function today;** if it is not, making it one is KV.3, and if that needs a change beyond the stand code, stop and ask.
- **Test timing.** `npm run check` took 86–95 s on v1.2 against a 90 s warning and a 120 s failure; the new tests are small and no simulator test joins the fast set unless measured cheap. KV.10 and KV.11 re-measure, and the e2e shards (D533, D537) must each stay under 5 minutes.
````
