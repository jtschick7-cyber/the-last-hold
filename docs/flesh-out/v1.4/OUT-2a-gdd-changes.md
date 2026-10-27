# OUT-2a — Edits to `docs/gdd.md` (v1.4 "The Descent", D557–D568; updated 2026-10-27)

Every **Find** below (21 of them, in 15 numbered edits) was checked against the Project's copy of `docs/gdd.md` and occurs **exactly once** in it. **If one does not match exactly once in the repo's copy, stop and tell the owner.** Edits are in document order. Edit 5 updates §5.15 and inserts the new §5.15.10, edit 9 inserts the new §7.14, edit 10 adds The Unlit to §8.3, and edit 13 inserts the new §9.24.

New backticked keys in §7.14 (`descent.previewSamples`, `descent.learned.perMasteredSpecies`, `descent.learned.perProperty`, `descent.learned.perSkillLevel`, `descent.learned.perOrderChapter`, `descent.learned.takenPerRelic`, `descent.stageTiers`, `descent.unlitBaseHealth`) must be added to `src/content/balance.ts` in the same commit that applies this file's §7 edits, or the GDD §7 keys test fails in both directions (technical design §5.1). `descent.previewSamples` (100) is **locked** (added to plan §0.6 in `OUT-4a-plan.md`); the other seven are **tunable**. Note that `descent.unlitBaseHealth` sits in `balance.ts` for probe calibration while other monster stats live in `monsters.ts` (an exception to D44, with `monsters.ts` reading it).

## 1 — §3.4 loop table: add v1.4

**Find:**
```markdown
| v1.3 | Keep the Vigil: Rising Vigil, an optional On / Off switch on the Last Stand screen that makes stands harder, one step more each time, once the Remembering gate is open (§5.9.10, §9.23) |
```

**Replace with:**
```markdown
| v1.3 | Keep the Vigil: Rising Vigil, an optional On / Off switch on the Last Stand screen that makes stands harder, one step more each time, once the Remembering gate is open (§5.9.10, §9.23) |
| v1.4 | The Descent: the third ending, a three-stage all-hands relay into the Deep using what the hold learned across every cycle, once the Remembering gate is open and the hold reaches Bastion (§5.15.10, §9.24) |
```

## 2 — §5.9.7 what's kept: the Descent

**Find:**
```markdown
| | Rising Vigil: the switch as left and the count of stands fought with it On (v1.3, §5.9.10) |
```

**Replace with:**
```markdown
| | Rising Vigil: the switch as left and the count of stands fought with it On (v1.3, §5.9.10) |
| | The Descent: attempts made, whether The Unlit has been met, unread result flag, and saved records of first victory and latest attempt (v1.4, §5.15.10) |
```

## 3 — §5.12.8 The Great Beasts shelf: The Unlit

**Find:**
```markdown
- The Archive's Bestiary gets an **optional "Great Beasts" shelf.** A boss or quarry is **Identified** the first time it is fought (its stats, resistances and abilities are shown and preparation can target it) and shows its "What it was" line (lore §8) from then on. It has **no Studied or Mastered levels** and no kill count that matters.
```

**Replace with:**
```markdown
- The Archive's Bestiary gets an **optional "Great Beasts" shelf.** A boss or quarry — and, from v1.4, **The Unlit** once Stage 3 of The Descent is reached (§5.15.10, §8.3, D560) — is **Identified** the first time it is fought (its stats, resistances and abilities are shown and preparation can target it) and shows its "What it was" line (lore §8, §34.11) from then on. It has **no Studied or Mastered levels** and no kill count that matters.
```

## 4 — §5.14.5 The Roll of Wardens: the Descent mark

**Find:**
```markdown
**From v1.3,** a warden whose stand was fought with Rising Vigil at level 1 or more also has a small mark drawn in code and the line *"Rising Vigil, level N."* (§5.9.10, §9.23, D545).
```

**Replace with:**
```markdown
**From v1.3,** a warden whose stand was fought with Rising Vigil at level 1 or more also has a small mark drawn in code and the line *"Rising Vigil, level N."* (§5.9.10, §9.23, D545). **From v1.4,** the warden in office when The Descent is first won also has a small mark drawn in code and the line *"Led the Descent."* (§5.15.10, §9.24, D563).
```

## 5 — §5.15 intro, card forms, §5.15.3, §5.15.7, and new §5.15.10 The Descent

**Find:**
```markdown
**What it is.** The end of the story. After Act VI the player can **Remember Them** (read the Sent's 40 names aloud in the Hearth Hall) or **Keep the Vigil** (not yet; from v1.3 the stand screen also has the optional Rising Vigil switch, §5.9.10). Two endings ship; **The Descent is deferred** (D448). The Orders are **not** a gate and **never change which ending is open** (D447).
```

**Replace with:**
```markdown
**What it is.** The end of the story. After Act VI the player can **Remember Them** (read the Sent's 40 names aloud in the Hearth Hall), **Keep the Vigil** (not yet; from v1.3 the stand screen also has the optional Rising Vigil switch, §5.9.10), or, from v1.4, embark on **The Descent** down into the Deep (§5.15.10, D558). The Orders are **not** a gate and **never change which ending is open** (D447).
```

**And find:**
```markdown
  - *Gate open, nothing chosen:* two buttons, **Remember Them** and **Keep the Vigil**.
  - *After a choice:* the forms of lore §34.2.
```

**Replace with:**
```markdown
  - *Gate open, nothing chosen:* **Remember Them**, **The Descent** *(from v1.4, §5.15.10)*, and **Keep the Vigil**.
  - *Vigil chosen (Remember Them & Descent unchosen):* **Remember Them** and **The Descent**.
  - *Remember Them chosen (Descent not won):* warm-hearth text (lore §34.2) with **The Descent** below.
  - *Descent won (Remember Them unchosen):* *"The Unlit was scattered in the Deep."* and **Fight the Descent again**, alongside **Remember Them** (and **Keep the Vigil** if unchosen).
  - *Both Remember Them and Descent won:* warm-hearth text, *"The Unlit was scattered in the Deep."*, points to Library shelf "The Remembering", and offers **Fight the Descent again** (§9.24, D563).
```

**And find:**
```markdown
- **Keep the Vigil** is offered only when the gate is open (D459 (1)). It plays R-10 once, is recorded once, and **changes nothing in the game.** It adds **no** difficulty by itself. From v1.3 the stand screen has a separate optional switch, **Rising Vigil** (§5.9.10, D539): it is available once the gate is open, whichever ending has been chosen, and Keep the Vigil does not turn it on. After it, the card shows only Remember Them.
```

**Replace with:**
```markdown
- **Keep the Vigil** is offered only when the gate is open (D459 (1)). It plays R-10 once, is recorded once, and **changes nothing in the game.** It adds **no** difficulty by itself. From v1.3 the stand screen has a separate optional switch, **Rising Vigil** (§5.9.10, D539): it is available once the gate is open, whichever ending has been chosen, and Keep the Vigil does not turn it on. After it, the card shows **Remember Them** and **The Descent** (from v1.4, D558).
```

**And find:**
```markdown
**5.15.7 What it never does.**
- It adds no combat, no random stream, no new resource, no gate on any other system.
```

**Replace with:**
```markdown
**5.15.7 What it never does.**
- Remember Them and Keep the Vigil add no combat, no random stream, no new resource, and no gate on any other system. (The Descent runs on its own isolated fight path with dedicated random streams; §5.15.10, D561).
```

**And find:**
```markdown
**5.15.9 After the ending the game carries on (D463).** The Long Night, stands, Pechko's stand line, the new-warden sheet and the Dross-Tide waves are unchanged. The hearth keeping itself is a story fact (R-09), not a rule change.
```

**Replace with:**
````markdown
**5.15.9 After the ending the game carries on (D463).** The Long Night, stands, Pechko's stand line, the new-warden sheet and the Dross-Tide waves are unchanged. The hearth keeping itself is a story fact (R-09), not a rule change.

**5.15.10 The Descent *(v1.4; ⚑ v1.4 flesh-out, D557–D568)*.**

The third ending (`lore-secrets.md` §6, §34.11, D448, D477, D499): taking the fight down into the Deep for one final all-hands relay battle using everything learned across every cycle. A costly, heroic victory: the Unlit is scattered, not ended.

- **Availability and Bastion rank gating (D558).** Opens at the same gate as Remember Them and Keep the Vigil (`endingChoosable`, §5.15.1: all 40 names found, every contract species Studied, and Act VI's stand applied) and requires **Hold Rank Bastion in the current cycle** (D-01/D-07 and §5.1.3: the door at the foot of the Bastion stair is restored only at Bastion, preventing post-reset balance swings and lore mismatches). Can be embarked upon before or after Remember Them or Keep the Vigil. Nothing locks after any ending (D453): a save can record `'remember'`, `'vigil'` and `'descent'` in any order. Remember Them, Keep the Vigil and Rising Vigil (§5.9.10) behave exactly as before; Rising Vigil never scales the Descent, and the Descent never changes `state.vigil`.
- **All-hands relay and reserve replacement (D558, D567 (2)).** The player brings every available owned hunter (active and reserve, up to 14 hunters including unlocked legendary hunters, §8.5, §5.12.7) in a chosen **marching order**: up to **6** start in the **front line** (`laststand.partyMax`, locked) and up to **8** wait in the **reserve line**. Injured or event-resting hunters may join (as in the Last Stand, D110); hunters currently away on a running contract or in a paused Delve are marked unavailable with reason in the picker until their contract is collected or the Delve ends, so starting the Descent never aborts a contract or a Delve (D567 (1)).
- **Reserve step-in rules (D558, D567 (2)):**
  1. *Between stages:* standing hunters keep their Health and recover `laststand.recoverBetween` (20% of max Health, or 30% with the **Rift Lantern**) before Stage 2 and before Stage 3. Downed hunters stay down for the rest of the attempt. Any downed front-line slot is filled in slot order by the next waiting hunter from the reserve line at full Health.
  2. *Mid-stage:* if all currently standing front-line hunters are downed *during* a stage while reserve hunters still wait, the next waiting reserve hunters (up to 6) immediately step into the front line in that stage at base turn meter 0 (with start-of-fight meter traits such as *Up Before the Wolves* setting meter to 100/full and *Yrsa's Thole* to 50 applied to that base as they enter). Stepped-in hunters fill slots starting from slot 0 in queue order. Start-of-fight potions and buffs apply from entry and last for the remainder of that stage. Bombs are *not* re-thrown. The stage continues against the monsters' current Health, meters and statuses within the 400-tick limit.
- **The three stages (D558, D560).**
  1. **Stage 1 — The Crack:** a 2-monster group (**Unlit's Breath** + **the Forgotten**, §8.3, D252) at tier `descent.stageTiers[0]` (§7.14). While the gate is open, all 16 contract species are Studied, so The Forgotten's *Nameless* bonus is +0%.
  2. **Stage 2 — The Sealed Stair:** a 3-monster group (**The Dross-Tide** + **Anvil-wight** + **Rimewrought**, §8.3, D158, D252) at tier `descent.stageTiers[1]`.
  3. **Stage 3 — Below the Seal:** **The Unlit** alone (`unlit`, §8.3, D560) at tier `descent.stageTiers[2]`. Marked `descentOnly: true` (excluded from Delve guardian pools, Deep bestiary `state.delve.deep`, contract species list, and The Forgotten's count).
  - Group targeting in Stages 1 and 2 uses the v0.7 group combat rules (§5.10.4, D251). The Deep guardians in Stages 1 and 2 use full base stats scaled by the stage's tier (§7.4, without `delve.memberHealth`, `delve.memberMight` or `delve.guardianHealth`).
- **"Everything learned across every cycle": modifier buckets (D559, §5.0, §7.14).** In the Descent only, the party receives an inspectable **What the Hold Learned** bonus built in one function together with its `Breakdown` tree:
  1. **Hunter Might (`stat%`):** applied to `Might_eff`, scaling standard attacks, Mender heals (`1.5 × Might_eff`), and Silver/Rune sub-hits (`Might_eff`).
  2. **Hunter max Health (`stat%`):** applied to hunter max Health.
  - Might and Health receive the identical sum:
    - *Mastered species:* `+1%` per Mastered contract species (`descent.learned.perMasteredSpecies`, up to `+16%` at 16/16).
    - *Recipe book:* `+0.25%` per revealed property (`descent.learned.perProperty`, up to `+9%` at 36/36).
    - *Warden skills:* `+0.5%` per total warden skill level across Alchemy, Smithing, Lore and Command (`descent.learned.perSkillLevel`, up to `+20%` at 40/40).
    - *Orders chapters read:* `+0.5%` per Order chapter read across the four Orders (`descent.learned.perOrderChapter`, up to `+8%` at 16/16).
    - Total up to **+53%** in `stat%`.
  3. **Damage taken (`taken%`):** `−1%` damage taken (`descent.learned.takenPerRelic`, inside the 75% cap) per owned Hold or Delve relic (up to `−12%` at 12/12).
- **Existing effects that apply vs do not apply (D559, D567):**
  - *Apply:* combat Delve relics owned (**Spindle Whorl** `+5%` Might in `stat%`, **Cold Iron Nail** `−5%` damage taken in `taken%`, **Rift Lantern** `+10` points recovery between stages, **Salt Ring** `−10%` max Health on Deep monsters: Unlit's Breath, Forgotten, Dross-Tide, The Unlit; §8.10a, D261); Deep bestiary Studied/Mastered damage bonuses (`knowledge%`) vs Unlit's Breath, Forgotten and Dross-Tide; contract bestiary Studied/Mastered damage bonuses (`knowledge%`) vs Anvil-wight and Rimewrought; hunter gear, traits, talents, keepsakes and use-skills.
  - *Do NOT apply:* Walls (Hold only), Watchtower volley (Hold only), Iron Shutter (Last Stand only), Delve blessings (Delves only), and location traits (D115, D254).
- **Preparation and scopes (D559, D567):**
  - Each hunter in the marching order may carry 1 oil and 1 potion for the whole Descent (spent at launch; potions fire once across the 3 stages as in Last Stand, D120). Wright's Oil matches Cursed members in Stage 2.
  - Up to `prep.bombSlots` (2) bombs per stage are thrown automatically at tick 1 from stores (weak-to front monster in content order, then next monsters, then one Saltburst, then one Poppy Smoke, §5.8.5, §5.9.3). Mid-stage step-in does not re-throw bombs.
  - "Once per fight" and "first action/attack/hit in a fight" effects (*Hold the Stair*, *Sit the Vigil*, *Ferryman's Coin*, *The Barley Knot*, *The Other Hand*, *Stopping Root*, *Rattle the Pots*) are **once per Descent per hunter**.
- **Win and loss (D558, D563).** Winning Stage 3 wins the Descent: `'descent'` is recorded once in `remembering.endings`, the warden in office when it is first won gets a Roll of Wardens mark and line (*"Led the Descent."*), and the ending sequence and all 3 stage fight logs are saved for replay on the Library shelf **"The Remembering"**. Winning or losing causes **no hunter deaths, no injuries, no recovery timers, no event rest and no Long Night reset**. On a loss (all hunters downed or 400-tick stage limit), spent consumables are lost from stores and the player can retry immediately whenever ready (retries are free and instant); after winning, the player can replay the sequence from the Library or fight the Descent again from the card. Winning does not remove Hearth Hall frost or light the window lamp (that look belongs to Remember Them, D457, D567 (5)).
- **What the Descent does NOT give or count (D558, D567):**
  - No hunter XP or yard XP.
  - No Command, Lore, Smithing or Alchemy skill XP.
  - No bestiary kills or Deep knowledge (Stage 1–2 kills give 0 bestiary kills and do not advance levels).
  - No Delve relic first-defeat triggers (does not award Bell Clapper, Salt Ring or Horn Spoon).
  - No trophies, no Riftglass.
  - No Orders standing or village trust.
  - No Threat change, no act counters, and no contracts-won stats.
  - Adds nothing to the event "recent" list.
- **Story texts (D560; word for word, approved by the owner; single canonical source is `lore-secrets.md §34.11`):**
  - **D-01 (Before the march):** Pechko at the Bastion stair with the thirty-nine faded ribbons.
  - **D-02 (Stage 1 card — The Crack):** The air smelling of wet iron and old snow.
  - **D-03 (Stage 2 card — The Sealed Stair):** The steps in the old order's measure.
  - **D-04 (Stage 3 card — Below the Seal):** Dry, still floor; rime on the wall writing *YOU BROUGHT THEM ALL.*
  - **D-05 (Victory card — when Stage 3 falls):** The cold breaking apart like thin ice, scattered small.
  - **D-06 (Aftermath card — Hearth Hall):** Brana counting hunters at the door, Pechko's kettle line.
  - **D-07 (Defeat card — all hunters downed):** The Bastion door shutting, Pechko with blankets and hot water.
  - **Post-Descent resident lines:** Pechko (*"The crack behind the stove is quiet today..."*), Brana (*"Everyone who went down that stair gets the first cut of the roast..."*), Ilse (*"I wrote down who went down the stair..."*). When both Remember Them and Descent are won, resident lines rotate across ordinary, post-Remember-Them and post-Descent pools.
````

## 6 — §6.1 Player model: the Descent probe in the `vigil` shard

**Find:**
```markdown
- **Vigil** *(Vigilant only, v1.3, D546)*: plays like Standard on the Monday seeds only until Act VI's stand has been applied, then calls `debug.remembering.openGate()` once (which marks `debugUsed`; the report says so), switches Rising Vigil On with `vigil.set` before each stand, and plays **3 endless cycles** (levels 1, 2 and 3). It is the only player that issues `vigil.set`; every other player's baseline does not change. Its shard is `vigil` (technical design §13).
```

**Replace with:**
```markdown
- **Vigil** *(Vigilant only, v1.3, D546; v1.4 Descent probe, D564)*: plays like Standard on the Monday seeds only until Act VI's stand has been applied, then calls `debug.remembering.openGate()` once (which marks `debugUsed`; the report says so), switches Rising Vigil On with `vigil.set` before each stand, and plays **3 endless cycles** (levels 1, 2 and 3). It is the only player that issues `vigil.set`; every other player's baseline does not change. Its shard is `vigil` (technical design §13). **From v1.4 (D564),** the `vigil` shard also runs the **Descent probe** (100 practice runs per Monday seed on a clone of the gate-open state with a prepared endgame roster) without changing any player's run or baseline; on-demand parameter sweeps run via `npm run sim:descent -- ...` (S8).
```

## 7 — §6.2 Targets: the Descent rows (Proposed)

**Find:**
```markdown
| Embers at levels 1 to 3 stay level with level 0 *(D546 C, D554)* | On the probe, at the stand's own Threat, the median total Embers (waves part plus trophies) at each of levels 1 to 3 are within **5%** of level 0 (median of the 5 Monday seeds; measured 1.5%, 0.3% and 2.1% off at the chosen values; fixed before the final judging run). Twice that Threat is reported, not judged (9.8% off at its worst). | v1.3 |
```

**Replace with:**
```markdown
| Embers at levels 1 to 3 stay level with level 0 *(D546 C, D554)* | On the probe, at the stand's own Threat, the median total Embers (waves part plus trophies) at each of levels 1 to 3 are within **5%** of level 0 (median of the 5 Monday seeds; measured 1.5%, 0.3% and 2.1% off at the chosen values; fixed before the final judging run). Twice that Threat is reported, not judged (9.8% off at its worst). | v1.3 |
| *Proposed:* The Descent is winnable and costly at the gate *(D564 A)* | On the Descent probe (inside the `vigil` shard, `sim.yml` only; a clone of the gate-open state with a full endgame roster, 100 practice runs per Monday seed), the win rate is between **50% and 85%** (median of the 5 Monday seeds), and the median hunters downed across the 3 stages is between **2 and 8** (inclusive, *"a costly, heroic victory"*) | v1.4 |
| *Proposed:* What the hold learned matters in the Descent *(D564 B)* | On the Descent probe (same 100 practice seeds per Monday seed), the party with its `What the Hold Learned` bonus achieves a win rate **≥ 25 percentage points higher** (or ≥ 2 fewer hunters downed) than the identical party with the learned bonus zeroed, and an unprepared Hamlet starter party loses in Stage 1 | v1.4 |
```

## 8 — §6.5 Performance budgets: new rows and the download note

**Find:**
```markdown
| **v12 → v13 migration** *(v1.3, D547)* | ≤ 100 ms | A played v12 save, on the load path (the throttled benchmark) |
| **Vigil save growth** *(v1.3, D547)* | ≤ 0.5 KB | The whole `vigil` block plus 20 recorded `vigilLevel` values (checked by a unit test, not the throttled benchmark). Each stand fought On adds about 16 bytes for ever; there is no cap |
```

**Replace with:**
```markdown
| **v12 → v13 migration** *(v1.3, D547)* | ≤ 100 ms | A played v12 save, on the load path (the throttled benchmark) |
| **Vigil save growth** *(v1.3, D547)* | ≤ 0.5 KB | The whole `vigil` block plus 20 recorded `vigilLevel` values (checked by a unit test, not the throttled benchmark). Each stand fought On adds about 16 bytes for ever; there is no cap |
| **Descent preview** *(v1.4, D565)* | ≤ 1.5 s on a mid-range phone | 100 three-stage practice runs (`descent.previewSamples`), in the odds worker |
| **v13 → v14 migration** *(v1.4, D565)* | ≤ 100 ms | A played v13 save, on the load path (the throttled benchmark) |
| **Descent save growth** *(v1.4, D565)* | *Proposed (sketch ≤ 4 KB)* | The whole `descent` block with full 14-hunter `firstWin` and `last` populated (measured in TD.4b from real records; D445/D469 measured-row pattern) |
```

**And find:**
```markdown
**D553: the build packs every picture as an indexed PNG without changing a pixel and the live build no longer carries the contact sheet, which took the same build from about 612,000 to about 442,000 bytes on this scale (room about 172 KB)**). Measured at the milestone end; not a test in `npm run check` |
```

**Replace with:**
```markdown
**D553: the build packs every picture as an indexed PNG without changing a pixel — leaving `icons/` unpacked so `sw.js` never lists duplicate hashes — and the live build no longer carries the contact sheet, measuring 449,810 bytes in the container after the icon fix (room about 164 KB); v1.4 (D565): the 600 KB row stays, and v1.4's code, texts and 5 packed PNGs fit well inside it**). Measured at the milestone end; not a test in `npm run check` |
```

## 9 — New §7.14 The Descent, before §8

**Find:**
```markdown
| The level | L = stands already fought with the switch On + 1, for an On stand; 0 for an Off stand | — (no cap) | 5.9.10 |
```

**Replace with:**
```markdown
| The level | L = stands already fought with the switch On + 1, for an On stand; 0 for an Off stand | — (no cap) | 5.9.10 |

### 7.14 The Descent *(v1.4, D557–D568)*

`descent.previewSamples` is **locked** (plan §0.6). Every other constant here is **tunable**. `descent.stageTiers` and `descent.unlitBaseHealth` start as clearly marked placeholders and are calibrated in the v1.4 calibration on the Descent probe and approved by the owner in their own commit (D564).

| Formula | Expression | Constants | § |
|---|---|---|---|
| Learned Might bonus | `+perMastered × masteredContractSpecies + perProperty × revealedProperties + perSkill × totalSkillLevels + perChapter × orderChaptersRead` (in `stat%` applied to `Might_eff`, scaling attacks, Mender heals and Silver/Rune sub-hits, in the Descent only) | `descent.learned.perMasteredSpecies` = 0.01, `descent.learned.perProperty` = 0.0025, `descent.learned.perSkillLevel` = 0.005, `descent.learned.perOrderChapter` = 0.005 | 5.0, 5.15.10 |
| Learned max Health bonus | same sum as Might (`stat%`, in the Descent only) | shares the constants above | 5.0, 5.15.10 |
| Learned damage-taken cut | `−takenPerRelic × ownedHoldAndDelveRelics` (in `taken%`, inside the 75% cap, in the Descent only) | `descent.learned.takenPerRelic` = 0.01 | 5.0, 5.15.10 |
| Stage tiers | tiers of Stages 1, 2 and 3 (scaled from each monster's base tier as §7.4) | `descent.stageTiers` = [5, 6, 7] *(calibrated in TD.9)* | 5.15.10 |
| The Unlit's base Health | base Health at base tier 5 before tier scaling (and × 0.90 when the Salt Ring is owned; sits in `balance.ts`, read by `monsters.ts`) | `descent.unlitBaseHealth` = 4500 *(calibrated in TD.9)* | 5.15.10, 8.3 |
| Between stages | standing hunters recover `laststand.recoverBetween` (0.20) of max Health (+ 0.10 with Rift Lantern) | — (reuses `laststand.recoverBetween`, §7.6) | 5.15.10 |
| Descent preview | 100 three-stage practice runs in the odds worker | `descent.previewSamples` = 100 **(locked)** | 5.15.10, 6.5 |
```

## 10 — §8.3 Monsters: add The Unlit

**Find:**
```markdown
| The Dross-Tide *(v0.7)* | Deep | Delve guardian | 2+ (any) | 320 | 16 | 10 | 6 | 1 |
```

**Replace with:**
```markdown
| The Dross-Tide *(v0.7)* | Deep | Delve guardian | 2+ (any) | 320 | 16 | 10 | 6 | 1 |
| The Unlit *(v1.4)* | Deep | The Descent (Stage 3, `descentOnly`) | 5+ (base 5) | `descent.unlitBaseHealth` (4,500) | 42 | 12 | 10 | 1 |
```

**And find:**
```markdown
| The Dross-Tide | 0.75 | 1.0 | 0.5 | **1.25** | **1.5** | 0 |
```

**Replace with:**
```markdown
| The Dross-Tide | 0.75 | 1.0 | 0.5 | **1.25** | **1.5** | 0 |
| The Unlit | 0.75 | **1.25** | **1.5** | 0 | **1.5** | 0 |
```

**And find:**
```markdown
| The Dross-Tide | *Settling:* every 3rd action, its attack hits every standing hunter (each hit rolled and resolved as a direct attack; Armor applies) | — | river pearl | Original: dross given a shape |
```

**Replace with:**
```markdown
| The Dross-Tide | *Settling:* every 3rd action, its attack hits every standing hunter (each hit rolled and resolved as a direct attack; Armor applies) | — | river pearl | Original: dross given a shape |
| The Unlit | *First Cold:* on each of its actions, every standing hunter loses 3% of max Health as Frost damage (ignoring Armor; `taken%` applies; halved for Halvar's `Smoke-Lunged`) and has their turn meter knocked back 15. *Heavy Dark:* every 3rd action, its attack hits every standing hunter (each hit rolled and resolved as a direct attack; Armor applies) and inflicts `Chill` (cuts healing received by 50% for their next 2 actions, `status%`, refreshes; cleared by Herdis's `Shepherd's Crook`). Saltburst cancels the first trigger of either and blocks abilities for 3 actions | — | — | Original: the cold beneath the seal (`lore-secrets.md` §6, §12, §34.11). Once Stage 3 is reached, it appears on the Bestiary's Great Beasts shelf (§5.12.8) with *"What it was"*: *"What was under the hill before the first fire was lit. It has no name of its own; the order named it for what it lacked."* and *"Hunter's notebook"*: *"Drains everyone's warmth and pace on every turn, and every third blow sweeps the whole line. Bring fire, rune-work, and every hunter you have."* Flagged `descentOnly: true` (excluded from Delve guardian pools, `state.delve.deep`, contract species list and Nameless) |
```

## 11 — §9.11 What exists when: add v1.4

**Find:**
```markdown
| v1.3 | Keep the Vigil: no new screen. One Rising Vigil row (On / Off) on the Last Stand screen once the Remembering gate is open, two extra lines in the stand preview, one in the confirmation and one in the result, and a mark and a line on the Roll of Wardens (§5.9.10, §9.23) |
```

**Replace with:**
```markdown
| v1.3 | Keep the Vigil: no new screen. One Rising Vigil row (On / Off) on the Last Stand screen once the Remembering gate is open, two extra lines in the stand preview, one in the confirmation and one in the result, and a mark and a line on the Roll of Wardens (§5.9.10, §9.23) |
| v1.4 | The Descent: The Descent button on The Remembering card once the gate is open and the hold reaches Bastion, the Descent sheet (marching order for up to 14 hunters, What the Hold Learned breakdown, preparation, 3-stage preview), 3-stage playback and story cards D-01 to D-07, result sheet, Roll of Wardens mark, and "The Descent" on the Library's Remembering shelf (§5.15.10, §9.24) |
```

## 12 — §9.12 Art direction: add v1.4

**Find:**
```markdown
- **v1.1 (D504):** 32 px grid tiles and sprites (and 64 px for the 2 × 2 Hearth Hall), code-generated in the 32-colour palette and registered in the manifest: clearing ground tiles, locked forest and ruined-wall border tiles, the Fell Breach (north) and Lowland Gate (south) border strips, connected Wall segments (straight, corner, T, cross, end), Watchtower, 3 visual level tiers for level buildings, 3 visual density tiers for count-building plots, dormant blueprint foundation ghosts, and grid versions of the four Riftglass cosmetics and the Act VI frost / post-Remembering lamp. A numbered contact sheet goes to the owner first; any redraws ship in batches of at most 12 after the owner approves before/after sheets (the v1.0 rule, D475).
```

**Replace with:**
```markdown
- **v1.1 (D504):** 32 px grid tiles and sprites (and 64 px for the 2 × 2 Hearth Hall), code-generated in the 32-colour palette and registered in the manifest: clearing ground tiles, locked forest and ruined-wall border tiles, the Fell Breach (north) and Lowland Gate (south) border strips, connected Wall segments (straight, corner, T, cross, end), Watchtower, 3 visual level tiers for level buildings, 3 visual density tiers for count-building plots, dormant blueprint foundation ghosts, and grid versions of the four Riftglass cosmetics and the Act VI frost / post-Remembering lamp. A numbered contact sheet goes to the owner first; any redraws ship in batches of at most 12 after the owner approves before/after sheets (the v1.0 rule, D475).
- **v1.4 (D565):** 5 code-generated pictures in the 32-colour palette, registered in the manifest: `portrait.monster.unlit` (64 × 64 px), `sprite.monster.unlit` (32 × 32 px frames, 160 × 32 px 5-frame battle sprite strip), and three 160 × 64 px Deep stage banners (`scene.descent.stage-1` *The Crack*, `scene.descent.stage-2` *The Sealed Stair*, `scene.descent.stage-3` *Below the Seal*). The Roll of Wardens mark for *"Led the Descent."* is drawn in code as an inline SVG (no PNG file). All 5 PNGs go on a numbered v1.4 contact sheet (1–5) shown to the owner in the conversation first; existing v1.0 and v1.1 PNG hashes stay byte-identical; approved hashes frozen in `art-src/v1.4-hashes.json`.
```

## 13 — §9.19 Library shelf and new §9.24 The Descent, before §10

**Find:**
```markdown
- **The Library shelf "The Remembering"** (the Rime pattern): "The reading" (replays the whole sequence, 5.15.3; Skip on the reading only) and "Later" (R-10). R-11 also sits on the Rime shelf under "After the ending."
```

**Replace with:**
```markdown
- **The Library shelf "The Remembering"** (the Rime pattern): "The reading" (replays the whole sequence, 5.15.3; Skip on the reading only), "Later" (R-10), and, from v1.4 once The Descent is won, "The Descent" (replays D-01 to D-06 and opens the 3 stage fight logs, §9.24). R-11 also sits on the Rime shelf under "After the ending."
```

**And find:**
```markdown
- **Deferred, not cut (with reasons).** A cap or ceiling (owner chose none); a second lever such as an extra tier or Armor (harder to read and balance); in-world Roll lines (needs lore; the owner chose a plain tally); new art (the owner chose none); a sound for the vigil (the endings are silent); a new Embers sink (a new feature).

---

## 10. Out of Scope
```

**Replace with:**
```markdown
- **Deferred, not cut (with reasons).** A cap or ceiling (owner chose none); a second lever such as an extra tier or Armor (harder to read and balance); in-world Roll lines (needs lore; the owner chose a plain tally); new art (the owner chose none); a sound for the vigil (the endings are silent); a new Embers sink (a new feature).

### 9.24 The Descent *(v1.4, D557–D568)*

- **On The Remembering card (Hold screen, §9.19):**
  - While the gate is closed or the hold is below Bastion rank, The Descent button does not appear.
  - Card forms for every ending combination (S3):
    1. *Gate open, nothing chosen:* **Remember Them**, **The Descent**, and **Keep the Vigil**.
    2. *Vigil chosen:* **Remember Them** and **The Descent**.
    3. *Remember Them chosen (Descent not won):* warm-hearth text with **The Descent** below.
    4. *Descent won (Remember Them unchosen):* *"The Unlit was scattered in the Deep."* and **Fight the Descent again**, alongside **Remember Them** (and **Keep the Vigil** if unchosen).
    5. *Both Remember Them and Descent won:* warm-hearth text, *"The Unlit was scattered in the Deep."*, points to Library shelf "The Remembering", and offers **Fight the Descent again**.
- **The Descent sheet** (opens from **The Descent** / **Fight the Descent again**):
  - **Header & stages:** title `The Descent`, subtitle `Three stages in the Deep · all hands`, and the three stages with their banners (`scene.descent.stage-1..3`), names and monsters: `Stage 1: The Crack — Unlit's Breath & The Forgotten`, `Stage 2: The Sealed Stair — The Dross-Tide, Anvil-wight & Rimewrought`, `Stage 3: Below the Seal — The Unlit`.
  - **What the Hold Learned:** summary line `What the hold learned: +{m}% Might and Health · −{t}% damage taken` with an ⓘ / long-press breakdown sheet listing the five contributors (Mastered species, recipe book properties, warden skills, Orders chapters read, relics owned) and the active Delve relics (§5.15.10).
  - **Marching order:** two rows of slots for all available owned hunters (up to 14): `Front line (up to 6)` and `Reserve line (steps in as hunters fall)`. **Suggest** orders all available owned hunters with at least one Vanguard and one Mender in the front 6 (highest levels first, ties in roster order). Tapping two slots swaps their positions in the marching order.
  - **Unavailable hunters:** heading `Unavailable hunters` listing hunters currently away on a contract or in a paused Delve with their reason (*"On a contract"*, *"In a Delve"*).
  - **Preparation:** one oil and one potion per hunter in the marching order; bombs shown as `Thrown automatically from stores (up to 2 per stage)`.
  - **Preview** (100 practice runs in the odds worker): `Win chance: {p}% ±{m}%`, `Expected stage reached: Stage {s} · {d} hunters downed (likely {d1} to {d2})` (or `Expected outcome: Victory (Stage 3 cleared) · {d} hunters downed (likely {d1} to {d2})` when median clears Stage 3), and **Why?** summary (`Why: based on 100 practice runs with your marching order and preparation.`).
  - **Start the Descent:** launches `descent.start` (no Reckless warning and no Long Night warning, because nobody dies and the cycle does not reset).
- **Playback and result:**
  - Plays **D-01** (scene sheet, Continue) → **D-02** and Stage 1 fight playback (32 px battle sprites over `scene.descent.stage-1`, with **Skip** and **Log**, showing reserve step-ins in the log) → if won, **D-03** and Stage 2 playback → if won, **D-04** and Stage 3 playback (against The Unlit) → on victory **D-05** and **D-06** (or on defeat **D-07**) → the **result sheet** (`Victory — The Unlit is scattered.` or `Driven back at Stage {s}.`, summary `Hunters standing: {a} · Fallen on the stair: {d}`, and per-stage fight log buttons: `Stage 1 log`, `Stage 2 log`, `Stage 3 log`).
  - Sound cues (when Sound is On, §9.22, D567 (6)): clearing Stage 1 or 2 plays `win`, beating Stage 3 plays `fanfare`, and losing plays `lose`; story cards D-01 to D-07 are silent.
  - Closing mid-playback preserves `descent.last` and sets `unreadResult: true`, offering "View Descent result" upon returning (S9).
- **Roll of Wardens and Library:**
  - For the warden in office when The Descent is first won (`descent.firstWin.cycle`), the Roll of Wardens shows a small mark drawn in code (inline SVG) and *"Led the Descent."*
  - The Library shelf **"The Remembering"** gains **"The Descent"**, which replays D-01 to D-06 and opens the 3 stage fight logs rebuilt from `descent.firstWin`.
- **Player-facing strings (word for word, approved by the owner at D568; story texts D-01 to D-07 and the 3 resident lines are in `lore-secrets.md §34.11`):**

  | String | Where it shows |
  |---|---|
  | `The Descent` | Button on The Remembering card (before first win), sheet title, and Library shelf entry |
  | `Fight the Descent again` | Button on The Remembering card (after first win) |
  | `The Unlit was scattered in the Deep.` | Line on The Remembering card once `'descent'` is recorded |
  | `Three stages in the Deep · all hands` | Descent sheet subtitle |
  | `Stage 1: The Crack` / `Stage 2: The Sealed Stair` / `Stage 3: Below the Seal` | Stage headings on the sheet, playback and logs |
  | `What the hold learned: +{m}% Might and Health · −{t}% damage taken` | Summary line on the Descent sheet |
  | `Mastered species (+{p}%): +{m}%` | Line in What the Hold Learned breakdown sheet |
  | `Recipe book properties (+{p}%): +{m}%` | Line in What the Hold Learned breakdown sheet |
  | `Warden skill levels (+{p}%): +{m}%` | Line in What the Hold Learned breakdown sheet |
  | `Order chapters read (+{p}%): +{m}%` | Line in What the Hold Learned breakdown sheet |
  | `Owned relics (−{p}% taken): −{t}%` | Line in What the Hold Learned breakdown sheet |
  | `Active Delve relics:` | Section heading in What the Hold Learned breakdown sheet |
  | `Front line (up to 6)` / `Reserve line (steps in as hunters fall)` | Marching-order section labels |
  | `Unavailable hunters` | Heading for hunters away on a contract or in a Delve |
  | `On a contract` / `In a Delve` | Availability status text in marching-order picker |
  | `Thrown automatically from stores (up to 2 per stage)` | Bombs note on the Descent sheet |
  | `Win chance: {p}% ±{m}%` | Preview win-probability line |
  | `Expected stage reached: Stage {s} · {d} hunters downed (likely {d1} to {d2})` | Preview line when median outcome does not clear Stage 3 |
  | `Expected outcome: Victory (Stage 3 cleared) · {d} hunters downed (likely {d1} to {d2})` | Preview line when median outcome wins |
  | `Why: based on 100 practice runs with your marching order and preparation.` | Preview explanation line under Why? |
  | `Start the Descent` | Launch button on the Descent sheet |
  | `Stage 1 log` / `Stage 2 log` / `Stage 3 log` | Per-stage fight log buttons on the result sheet |
  | `Victory — The Unlit is scattered.` | Result sheet heading on a win |
  | `Driven back at Stage {s}.` | Result sheet heading on a loss |
  | `Hunters standing: {a} · Fallen on the stair: {d}` | Result sheet summary line |
  | `Led the Descent.` | Roll of Wardens line for the warden of the first victory |

- **Layout and checks.** No new tap, sheet or animation in any routine flow; **a routine check-in stays at 15 taps or fewer.** Every button and slot in the Descent sheet is at least 44 × 44 px at 320 and 360 px and at every Text size; no sideways scroll at 320 px at Largest; contrast passes in both themes. The Remembering card (with The Descent button), the Descent sheet and the Roll of Wardens are in `polish-screens.ts` (D566).
- **Debug.** `debug.prepareEndgameRoster()` builds a strong endgame state (14 hunters at level 10 with gear, recipes 36/36, skills 40/40, chapters 16/16, relics, consumables). `debug.descent.win()` (a core command, marks `debugUsed`) opens the gate, prepares the endgame roster if needed, and runs real attempts until an honest victory occurs so the post-Descent state, Roll mark and Library replay can be inspected and rebuilt line for line.

---

## 10. Out of Scope
```

## 14 — §10 Out of Scope: update the Descent row

**Find:**
```markdown
| The Descent (a third ending) | Deferred (D448, D477); scheduled as v1.4 (D499) | Milestone v1.4 "The Descent", with its own flesh-out |
```

**Replace with:**
```markdown
| The Descent (a third ending) | Deferred (D448, D477); scheduled as v1.4 (D499); **fleshed out 2026-10-25 as a three-stage all-hands relay in the Deep (D557–D568, §5.15.10, §9.24)** | Milestone v1.4 "The Descent" |
```

## 15 — Judgment calls added in the v1.4 flesh-out

**Find:**
```markdown
9. **The download row stays at 600 KB; the vigil code must fit in what is left (3,892 bytes at v1.2), or the milestone stops and asks** (D547).
```

**Replace with:**
```markdown
9. **The download row stays at 600 KB; the vigil code must fit in what is left (3,892 bytes at v1.2), or the milestone stops and asks** (D547).

## Judgment calls added in the v1.4 flesh-out (D557–D568)

1. **The Descent opens at the Remembering gate (`endingChoosable`) and is gated at Hold Rank Bastion in the current cycle, coexisting with Remember Them, Keep the Vigil and Rising Vigil** (D558).
2. **A three-stage all-hands relay in the Deep:** up to 6 hunters in the front line and up to 8 waiting in the reserve line, stepping in as hunters fall (between stages and mid-stage); Stages 1 and 2 use the v0.7 group combat rules with the Deep guardians and Cursed smiths, and Stage 3 is The Unlit alone (`unlit`, flagged `descentOnly`, D558, D560).
3. **"Everything learned across every cycle" is an inspectable `What the Hold Learned` bonus:** hunter Might in `stat%` (scaling attacks, heals and sub-hits), hunter max Health in `stat%`, and relic damage reduction in `taken%`, plus combat Delve relics and Deep knowledge active in the Deep (D559).
4. **No hunter deaths, injuries, skill/bestiary/relic progress or Long Night reset on a win or a loss:** defeat allows immediate free retry with consumables spent; victory records `'descent'`, marks the Roll of Wardens (*"Led the Descent."*), and saves the story sequence and all 3 stage fight logs on the Library shelf (D558, D563).
5. **Isolated Descent fight path so `rulesVersion` stays 5**, and **save schema 14** with a migration, real-save fixture, frozen bestiary knowledge on `DescentRecord`, and round-trip test (D561, D562).
6. **Five generated pixel-art pictures gated by a numbered contact sheet,** fitting inside the existing 600 KB (614,400-byte) download row and protected by `art-src/v1.4-hashes.json` (D565).
7. **Hard rule on failing tests:** no failing test may ever be called a container or runner problem unless first shown to fail on `main` before the branch's changes, plus a milestone-end production offline-reload and `sw.js` duplicate-hash check (D557).
```
