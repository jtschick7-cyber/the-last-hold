# OUT-2a — Edits to `docs/gdd.md` (v1.5 "The Breach", 2026-10-28; revised after the red-team review)

Apply in order. Each **Find** was checked by a script against the Project's copy of `docs/gdd.md` and occurs **exactly once** there, and all 22 edits were applied in order to a copy without any Find being broken by an earlier edit. **If any Find does not match exactly once in the repo's copy, stop and tell the owner; do not guess.** A Replace that begins with the Find text is an insertion: the Find text stays and new text follows or precedes it.

**Also in this docs commit (TB.1):** add the nine `breach.*` keys of §7.15 to `src/content/balance.ts` (so the GDD §7 keys test stays green), with `breach.lanes` and `breach.frontRows` marked `locked` and the rest `tunable` and clearly commented as placeholders; check that §7.15 does not redefine `walls.takenPerLevel` or `watchtower.volleyPerLevel` (it only refers to them, so the keys test sees each key once); and add the `breach` row to plan §0.6 (OUT-4a). **Housekeeping in the same commit:** the §6.2 Descent rows still read "Proposed:" although D577 decided them, and the §6.5 download row lacks v1.4's measured 457,443 bytes; fix both (the owner approves the wording in the docs-commit message). **Strings:** §9.25 lists every new player-facing string (29 strings in the table, in 23 rows). None is story text. All need the owner's approval (D593). **Locked fixtures are not touched by this file.**

**Part-by-part contents:** 1 status line · 2 §3.4 row · 3 screens table row · 4 §5.1.5 (layout no longer decorative for defenses) · 5–6 §5.9.2 rows · 7–8 §5.9.3 · 9 new §5.9.11 · 10 §9.13 line · 11–12 §6.1 · 13 §6.2 rows A–C (Proposed) · 14 §6.5 rows (proposed) · 15–16 §7.6 · 17 new §7.15 constants · 18–19 §8.1 · 20 new §9.25 strings · 21 §10 · 22 judgment calls.

---

## 1 — Status line

**Find:**

````markdown
and accessibility/settings updates (§9.20).
````

**Replace with:**

````markdown
and accessibility/settings updates (§9.20). v1.5 adds the Breach: lanes, cover and the front zone for Walls and Watchtowers in the Last Stand (§5.9.11, §7.15, §9.25; D579–D595).
````

## 2 — §3.4 what exists when: add v1.5

**Find:**

````markdown
once the Remembering gate is open and the hold reaches Bastion (§5.15.10, §9.24) |
````

**Replace with:**

````markdown
once the Remembering gate is open and the hold reaches Bastion (§5.15.10, §9.24) |
| v1.5 | The Breach: each Last Stand wave comes down one of 8 lanes; where Walls and Watchtowers stand in the three rows nearest the Fell Breach decides how well they work in that lane (§5.9.11, §9.25) |
````

## 3 — §9.x screens table: add v1.5 row

**Find:**

````markdown
and "The Descent" on the Library's Remembering shelf (§5.15.10, §9.24) |
````

**Replace with:**

````markdown
and "The Descent" on the Library's Remembering shelf (§5.15.10, §9.24) |
| v1.5 | The Breach: no new screen. A Lanes strip (with a text-list alternative) on the Arrange Hold sheet and on the Last Stand screen, a lane tag on each wave in the wave list, a lane breakdown sheet, a Suggest layout button, one line in the Start confirmation and a header line in stand wave logs (§5.9.11, §9.25) |
````

## 4 — §5.1.5: layout is no longer decorative for defenses

**Find:**

````markdown
- **Decorative in v1.1, ready for v1.5.** In v1.1, where buildings sit on the grid is purely visual: it changes no production rate, cost, Threat rate or fight calculation (`rulesVersion` stays 5). The 8 × 8 coordinate layout format and piece IDs are saved in a fixed schema (`state.layout`, schema 12) so that **v1.5 ("The Breach")** can give wall, watchtower and building positions a tactical role in the Last Stand without migrating `HoldLayoutState` (stand records will store an optional layout snapshot) (D499, D500).
````

**Replace with:**

````markdown
- **Decorative in v1.1; tactical for defenses from v1.5 (D499, D500, D580, D581).** In v1.1 where buildings sit on the grid was purely visual. **From v1.5, where the Walls and Watchtower pieces sit decides how well they work in the Last Stand** (§5.9.11); where every other building sits is still purely visual and changes no production rate, cost, Threat rate or fight calculation. The 8 × 8 coordinate layout format and piece IDs are unchanged: `HoldLayoutState` is **not** migrated (D585). The Last Stand reads the layout once, when Start is pressed, and keeps a small lane table on the stand's record (§5.9.11, technical design §23). **Nothing in the Last Stand (Start, the preview, a load, the migration) places, moves or trays a piece** (D587); v1.1's auto-placement of newly unlocked pieces (on purchase, on Rank-up and at a new cycle, rules 3 to 6 above) is unchanged. Otherwise only the player's own taps change the layout, including Auto-arrange, which rearranges every building and not only defenses.
````

## 5 — §5.9.2 Walls row

**Find:**

````markdown
| **Walls** | 10 in Citadel, 15 in Bastion | The party takes 2% less damage per level (taken%, so the 75% cap applies) |
````

**Replace with:**

````markdown
| **Walls** | 10 in Citadel, 15 in Bastion | The party takes 2% less damage per level (taken%, so the 75% cap applies), **scaled by how well the wave's lane is covered (cover, §5.9.11)**; with full cover in a lane it is exactly 2% per level |
````

## 6 — §5.9.2 Watchtower row

**Find:**

````markdown
| **Watchtower** | 10 / 15 | At tick 1 of each wave, a volley of 20 × level Steel damage that ignores Armor, like a bomb (no oil, trait or knowledge bonus) |
````

**Replace with:**

````markdown
| **Watchtower** | 10 / 15 | At tick 1 of each wave, a volley of 20 × level Steel damage that ignores Armor, like a bomb (no oil, trait or knowledge bonus). **From v1.5 the volley is shared among the towers you have placed in the front rows, and each tower's share reaches the wave's lane by distance (§5.9.11).** |
````

## 7 — §5.9.3: lanes (after the Threat bullet)

**Find:**

````markdown
  - Threat makes every wave stronger (§5.9.1).
````

**Replace with:**

````markdown
  - Threat makes every wave stronger (§5.9.1).
  - **From v1.5 every wave comes down one lane of the Fell Breach** (8 lanes, fixed with the wave list by the stand seed, shown in the wave list from the moment Bastion is reached, even for "?" species), and the layout of the Walls and Watchtower decides how well they work in that lane (§5.9.11). The species of each wave do not change.
````

## 8 — §5.9.3: fight line mentions lane

**Find:**

````markdown
Walls (and the Iron Shutter relic) reduce damage taken.
````

**Replace with:**

````markdown
Walls (by the wave's lane from v1.5, §5.9.11) and the Iron Shutter relic reduce damage taken.
````

## 9 — §5.9.11 (new): insert before §5.10

**Find:**

````markdown
### 5.10 Delves *(v0.7; ⚑ v0.7 flesh-out, D244–D272)*
````

**Replace with:**

````markdown
#### 5.9.11 The Breach: lanes and the front zone *(v1.5; D579–D595)*

From v1.5 the Hold's layout (§5.1.5) decides how well **Walls and Watchtowers** work in the Last Stand. Nothing else in the layout matters in combat (D586). Every number below has a breakdown built by the function that builds the number (§5.0, technical design §23).

- **Lanes (D580).** The Fell Breach has **8 lanes**, the 8 columns `x = 0..7`, shown 1 to 8 from west to east. **Each wave comes down one lane.** The lane of wave n is fixed by the cycle's stand seed with its own dice stream (`${gameSeed}:stand:${cycle}:lane:${n}`, technical design §7.2; n is counted the way the stand's species picks count waves), so **the species of each wave are exactly what they were** and the lane list is fixed at the same moment as the wave list, when Bastion is reached. The stand screen shows each wave's lane from then on, even for "?" species. Which lane a wave takes is the one thing the player cannot change; where the defenses stand is the player's.
- **The front zone and counted pieces (D581).** A wall or watchtower piece **counts** only if it is `active` (§5.1.5) and its tile is in rows `0..2` (`breach.frontRows` = 3, the three rows nearest the Fell Breach). A piece in the Tray, a locked piece, a dormant piece outside the clearing, or a piece in rows 3 to 7 gives nothing. **Nothing is ever placed for the player** (D587): the Last Stand reads the layout as the player left it. Auto-arrange (a button the player taps) puts every building, not only the defenses, on the v1.1 canonical layout (§5.1.5) and is the baseline.
- **Cover of lane c (D581).** `cover(c) = coverOwn × [column c holds a counted piece] + coverNeighbour × [column c−1 holds a counted piece] + coverNeighbour × [column c+1 holds a counted piece]`. **The ruined edge counts as walled:** for column 0 the missing west neighbour and for column 7 the missing east neighbour count as present. With the starting values, own column plus one neighbour is 75% and all three is 100%. A tower counts as a piece here exactly as a wall does.
- **Depth (D581, added at the flesh-out).** Each extra counted piece in the same column adds `breach.depthStep` to that lane's wall cut, up to `breach.depthMax` extra pieces, and only where the column has a piece: `extra(c) = min(depthMax, counted pieces in column c − 1)`, 0 for an empty column. So a second and third piece in a column are worth something, and the grid is never solved by one wall per column.
- **What the Walls do in lane c (D581).**

  ```
  wallCut(c) = walls.takenPerLevel × Walls level × cover(c) × (1 + depthStep × extra(c))
  ```

  It goes into the party's `taken%` bucket with the other taken% items, so the 75% cap (`combat.takenCap`) holds. With full cover and no depth it is exactly today's 2% per level.
- **What the Watchtowers do in lane c (D582).** Today's total volley (`watchtower.volleyPerLevel` × Watchtower level) is **shared among the counted towers**, the towers you have placed in the front rows. A counted tower's share for lane c is `towerReach[d]`, where d is the distance in columns from its column to c: full (1) in its own column, half (0.5) one column away, a quarter (0.25) two away, nothing beyond.

  ```
  volley(c) = floor( volleyPerLevel × Watchtower level × volleyScale × Σ over counted towers of towerReach[d] ÷ number of counted towers )
  ```

  The volley is **0 when no tower counts** (and at Watchtower level 0). It is worked in whole numbers so hand-worked tables and the code agree: reach in quarters, the scale in hundredths, multiplied first, divided once, rounded down (technical design §23.2). It is Steel damage at tick 1 that ignores Armor and takes the species' Steel resistance, after the potions and before the bombs, as today (D120). A tower in the Tray gives nothing and does not dilute the others. Because the divisor is the placed towers, an upgrade at Watchtower level 8 or 15 never makes a lane weaker; the cost is that one well-placed tower already gives the full volley in its own lane, so extra placed towers spread the cover and never add damage to one lane.
- **Freezing (D584, D585, D591).** The preview and the Lanes strip follow the layout live. **When Start is pressed** the core builds the **lane table** from the layout (for each of the 8 lanes: the number of counted pieces in its column, the columns of the counted towers, the `breach.*` numbers used) and saves it with the stand's inputs; the table is what makes the stand a version 6 stand. It adds about 200 bytes per cycle, for ever. Any later rebuild of a wave log uses the saved table, never the layout as it is then. Starting stays final.
- **Old stands (D584).** A stand recorded before v1.5 has no lane table: it replays under the version 5 rules, line for line. A stand started below Bastion (the arrival stand) has no lanes and takes the version 5 path too. A v6 stand whose Walls and Watchtower levels are 0 equals the v5 stand for the same inputs, and so does one with Watchtower level 0, no depth and full cover in every lane. No contract, Delve, event, boss, hunt or Descent fight reads any of this.
- **What ignores layout (D586).** The Descent, contracts, Delves, events, bosses, hunts, Rising Vigil's level steps, the Embers formula and the Threat rate (which still slows by Walls and Watchtower **level**, §5.9.1). Layout changes only how many waves a stand holds, **and what follows from the waves follows from layout too:** the Embers paid, the relic milestones, the band (Held, Triumphant), trust, Orders standing, Command XP and the residents' lines. The Long Night keeps the layout as now (D502).
- **Existing players (D587).** Every save already holds the canonical layout from the v12 migration, so it starts with every unlocked defense on the grid and counts. A changed layout counts as it stands. **Auto-arrange** is the one-tap fix, and it rearranges every building, not only defenses (a decorative layout is wiped); **Use this layout** (only if Q61 is yes) moves only defenses. The Lanes strip shows the cover before Start. The Start confirmation says how many defenses are in the Tray and give nothing; it never places them.
- **Honest limits.** (1) Wall segments unlock slowly (4 at Walls level 1, then one more at levels 3, 5, 7, 9, 11, 13 and 15, 11 in all), so a Bastion stand with a low Walls level cannot cover every lane whatever the layout; the baseline shift (D589) is reported, not hidden. (2) The numbers are tunable placeholders until the owner approves the calibration table (§6.2, D583). (3) Suggest layout is a fast fixed rule, not a search: it can be beaten by a thoughtful layout, which is intended. (4) Economy buildings on front-row tiles can be moved off them, so a player can make room for a third piece in a column; Suggest uses only free tiles and never moves another building. (5) Suggest weighs cover and tower reach equally: a fixed design choice, not tuned.
- **Suggest layout (D588, D590).** A button on the Arrange Hold sheet, shown from Bastion on and never disabled there. It reads the lanes of the first `breach.suggestWaves` waves, counts how many waves come down each lane, and builds a layout one piece at a time: at each step it adds the one wall or tower piece, on one free front-row tile that holds no other building, that raises the weighted total of `cover × (1 + depthStep × extra)` plus tower reach the most (ties: the smaller row, then the smaller column), until every owned defense is placed; if the Auto-arrange defense positions score higher, it returns those instead, so it never scores below Auto-arrange. **It shows the result and its preview and places nothing by itself.** Whether the player may apply it with one tap is Q61 (asked in the first message of the build thread; the button is built only if yes). The simulated Tactician (§6.1) uses the same rule.
- **Debug.** `debug.breach.freeze` (a core command, marks `debugUsed`) shows the lane table a stand would freeze now (technical design §15). Tests use real seeds with known lanes.
- **Deferred, not cut (with reasons).** The inner ward and buildings taking damage (buildings take no damage, D108, so there is nothing to protect without a new rule); per-wave monster traits tied to lanes (a new rule set); any story text. See §10.

### 5.10 Delves *(v0.7; ⚑ v0.7 flesh-out, D244–D272)*
````

## 10 — §9.13 Last Stand screen: lanes

**Find:**

````markdown
a **Rising Vigil** row sits above Start (§9.23).
````

**Replace with:**

````markdown
a **Rising Vigil** row sits above Start (§9.23). **From v1.5** each wave in the wave list carries its lane (*Lane {n}*), a **Lanes** strip with its text-list alternative sits above the party slots, and Start's confirmation adds the Tray line (§9.25).
````

## 11 — §6.1 table: Tactician row

**Find:**

````markdown
| The v1.3 Rising Vigil rows only. **Monday seeds only.** |
````

**Replace with:**

````markdown
| The v1.3 Rising Vigil rows only. **Monday seeds only.** |
| **Tactician** (`tactician`, *from v1.5*, D589) | Same as Standard | None. Before each stand it applies the Suggest layout rule (§5.9.11) with `layout.place` commands and issues no other layout command | The v1.5 Breach rows only. **Monday seeds only.** |
````

## 12 — §6.1 bullets: Breach bullet

**Find:**

````markdown
- **Vigil** *(Vigilant only, v1.3, D546; v1.4 Descent probe, D564)*: plays like Standard on the Monday seeds only until Act VI's stand has been applied, then calls `debug.remembering.openGate()` once (which marks `debugUsed`; the report says so), switches Rising Vigil On with `vigil.set` before each stand, and plays **3 endless cycles** (levels 1, 2 and 3). It is the only player that issues `vigil.set`; every other player's baseline does not change. Its shard is `vigil` (technical design §13). **From v1.4 (D564),** the `vigil` shard also runs the **Descent probe** (100 practice runs per Monday seed on a clone of the gate-open state with a prepared endgame roster) without changing any player's run or baseline; on-demand parameter sweeps run via `npm run sim:descent -- ...` (S8).
````

**Replace with:**

````markdown
- **Vigil** *(Vigilant only, v1.3, D546; v1.4 Descent probe, D564)*: plays like Standard on the Monday seeds only until Act VI's stand has been applied, then calls `debug.remembering.openGate()` once (which marks `debugUsed`; the report says so), switches Rising Vigil On with `vigil.set` before each stand, and plays **3 endless cycles** (levels 1, 2 and 3). It is the only player that issues `vigil.set`; every other player's baseline does not change. Its shard is `vigil` (technical design §13). **From v1.4 (D564),** the `vigil` shard also runs the **Descent probe** (100 practice runs per Monday seed on a clone of the gate-open state with a prepared endgame roster) without changing any player's run or baseline; on-demand parameter sweeps run via `npm run sim:descent -- ...` (S8).
- **Breach** *(v1.5, D589)*: every policy except the Tactician calls `layout.autoArrange` at every Bastion check-in before the stand-timing preview and again right before Start, and issues no other layout command, so **Auto-arrange is the baseline layout**. The Tactician (Monday seeds only, its own shard `breach`) plays like Standard and at the same moments builds the Suggest layout for that cycle's lanes: `layout.unplace` for every defense, then `layout.place` in Suggest's order. It exercises the whole command path on a real 3-cycle run and is reported only; no row judges it. A probe in the `breach` shard runs the preview's 100 practice stands (`laststand.previewSamples`, the same seeds) on a clone of Standard's state at its first stand check-in, once with the Auto-arrange layout, once with the Tactician's and once with a deliberately bad layout (every defense lifted to the Tray, then the tiles (0,0), (0,1), (0,2), (1,0), (1,1), (1,2) filled in that order, towers first and then walls in catalog order, skipping tiles that hold another building; the rest stay in the Tray), and reports waves held for each beside the same state under the version 5 rules. **Every moment up to a player's first version 6 stand equals the v1.4 baseline; everything after it moves** (waves held change Embers, Hearth upgrades, cycle length, relics, band, trust, Orders standing and Command XP). The baselines are re-recorded once at TB.11, every row re-judged and the moved moments listed (the v0.9 T9.12 pattern). Calibration sweeps run on demand with `npm run sim:breach -- ...` (the v1.3 KV.9 and v1.4 TD.8b pattern).
````

## 13 — §6.2 targets: rows A–C (Proposed)

**Find:**

````markdown
and an unprepared Hamlet starter party loses in Stage 1 | v1.4 |
````

**Replace with:**

````markdown
and an unprepared Hamlet starter party loses in Stage 1 | v1.4 |
| *Proposed:* Auto-arrange holds as many waves as before *(D589 A)* | On the Breach probe (inside the `breach` shard, `sim.yml` only), the Auto-arrange layout holds **12 or more waves** (median of the 5 Monday seeds, Standard's first stand) and within **1 wave** of the same state under the version 5 rules | v1.5 |
| *Proposed:* A thoughtful layout beats Auto-arrange *(D589 B)* | On the same probe and seeds, the Tactician's layout holds **at least 1 wave more** than Auto-arrange (median of the 5 Monday seeds) | v1.5 |
| *Proposed:* A bad layout costs waves *(D589 C)* | On the same probe and seeds, the deliberately bad layout holds **at least 2 waves fewer** than Auto-arrange (median of the 5 Monday seeds) | v1.5 |
````

## 14 — §6.5 budgets: v1.5 rows (Proposed)

**Find:**

````markdown
| **Download size** *(v1.0, D494)* | ≤ 600 KB |
````

**Replace with:**

````markdown
| **Lanes strip render** *(v1.5, D590; proposed)* | ≤ 16 ms (one frame) | The 8-box strip, from the view built in `core` |
| **Suggest layout** *(v1.5, D590; proposed)* | ≤ 20 ms | The fixed rule in `core`, on the throttled profile (not run in the worker) |
| **v14 → v15 migration** *(v1.5, D590; proposed)* | ≤ 100 ms | A played v14 save, on the load path (the throttled benchmark) |
| **Lane table save growth** *(v1.5, D590; proposed)* | ≤ 0.4 KB per stand record | The lane table on one stand record, with 3 towers (checked by a unit test, not the throttled benchmark); the Last Stand preview budget (≤ 1 s) is unchanged and now includes the lanes |
| **Download size** *(v1.0, D494)* | ≤ 600 KB |
````

## 15 — §7.6 Walls row

**Find:**

````markdown
| Walls | party taken% −x per level in the stand (75% cap, `combat.takenCap`) | `walls.takenPerLevel` = 0.02 | 5.9.2 |
````

**Replace with:**

````markdown
| Walls | party taken% −x per level in the stand, × the wave's lane cover and depth (75% cap, `combat.takenCap`); with full cover and no depth, −x per level (v1.5, §7.15) | `walls.takenPerLevel` = 0.02 | 5.9.2, 5.9.11 |
````

## 16 — §7.6 Watchtower row

**Find:**

````markdown
| Watchtower | at tick 1 of each wave, v × level Steel damage, ignores Armor | `watchtower.volleyPerLevel` = 20 | 5.9.2 |
````

**Replace with:**

````markdown
| Watchtower | at tick 1 of each wave, v × level × volleyScale Steel damage, shared among the placed towers and reaching the wave's lane by distance, ignores Armor (v1.5, §7.15) | `watchtower.volleyPerLevel` = 20 | 5.9.2, 5.9.11 |
````

## 17 — §7.15 (new): The Breach constants

**Find:**

````markdown
| Descent preview | 100 three-stage practice runs in the odds worker | `descent.previewSamples` = 100 **(locked)** | 5.15.10, 6.5 |
````

**Replace with:**

````markdown
| Descent preview | 100 three-stage practice runs in the odds worker | `descent.previewSamples` = 100 **(locked)** | 5.15.10, 6.5 |

### 7.15 The Breach *(v1.5, D579–D595)*

`breach.lanes` and `breach.frontRows` are **locked** (plan §0.6). Every other constant here is **tunable** and starts as a **marked placeholder** (`coverOwn`, `coverNeighbour`, `depthStep`, `depthMax`, `towerReach`, `volleyScale` and `suggestWaves` alike): a value to be confirmed or replaced at TB.12 and TB.13, after the owner approves the calibration table (Q63, D583). `breach.volleyScale` is a pure placeholder: at 1 an average tower is weaker than today's, so expect it to rise. A tunable moved by more than 2× needs its own Proposed row (plan §0.6). A unit test checks `coverOwn + 2 × coverNeighbour = 1`. `towerReach` stays in multiples of 0.25 and `volleyScale` in hundredths, so the volley can be worked in whole numbers (§5.9.11).

| Formula | Expression | Constants | § |
|---|---|---|---|
| Lanes | wave n takes lane `floor(roll × lanes)`, one roll from `${gameSeed}:stand:${cycle}:lane:${n}` | `breach.lanes` = 8 **(locked)** | 5.9.11 |
| Front zone | a counted piece is `active` with row `y` < frontRows | `breach.frontRows` = 3 **(locked)** | 5.9.11 |
| Cover | `coverOwn` for a piece in the column plus `coverNeighbour` for each neighbouring column with a piece (the ruined edge counts as walled) | `breach.coverOwn` = 0.5 *(placeholder)*, `breach.coverNeighbour` = 0.25 *(placeholder)* | 5.9.11 |
| Depth | `extra = min(depthMax, counted pieces in the column − 1)`; the wall cut × (1 + depthStep × extra) | `breach.depthStep` = 0.25 *(placeholder)*, `breach.depthMax` = 2 *(placeholder)* | 5.9.11 |
| Wall cut in a lane | the Walls constant of §7.6 × Walls level × cover × (1 + depthStep × extra), in taken% (75% cap) | none new (the Walls constant is in §7.6) | 5.9.2, 5.9.11 |
| Tower reach | a counted tower's share for a lane d columns away | `breach.towerReach` = [1, 0.5, 0.25] *(placeholder)* (own column, 1 away, 2 away; nothing beyond) | 5.9.11 |
| Volley in a lane | floor(the volley per level of §7.6 × Watchtower level × volleyScale × Σ reach ÷ counted towers); 0 when no tower counts; whole-number arithmetic | `breach.volleyScale` = 1 *(placeholder)* | 5.9.2, 5.9.11 |
| Suggest layout and the Lanes strip | the lanes of the first N waves (tuning N changes the strip's dots too) | `breach.suggestWaves` = 12 *(placeholder)* | 5.9.11, 9.25 |

````

## 18 — §8.1 Walls row text

**Find:**

````markdown
In the Last Stand, the party takes 2% less damage per level; each level slows Threat by 2%
````

**Replace with:**

````markdown
In the Last Stand, the party takes 2% less damage per level, scaled by the wave's lane cover (§5.9.11); each level slows Threat by 2%
````

## 19 — §8.1 Watchtower row text

**Find:**

````markdown
At the start of each wave, a volley of 20 × level Steel damage that ignores Armor; each level slows Threat by 2%
````

**Replace with:**

````markdown
At the start of each wave, a volley of 20 × level Steel damage that ignores Armor, shared among the placed towers and reaching the wave's lane by distance (§5.9.11); each level slows Threat by 2%
````

## 20 — §9.25 (new): insert before §10

**Find:**

````markdown
---

## 10. Out of Scope
````

**Replace with:**

````markdown
### 9.25 The Breach *(v1.5, D579–D595)*

v1.5 adds **no new screen**. It adds a Lanes strip to two screens that already exist (the Arrange Hold sheet, §9.21, and the Last Stand screen, §9.13), a lane tag on each wave, and a few lines to sheets that already exist. It changes nothing for the Hold's other buildings.

- **The Lanes strip (D588).** Shown **from Bastion on and not before** (no lanes exist before it; nothing appears and no string is needed). Above the 8 × 8 grid on the Arrange Hold sheet, and above the party slots on the Last Stand screen: **8 labelled boxes** (*Lane 1* to *Lane 8*, west to east) in **two rows of four below 600 px wide and one row of eight above it**, each showing the lane's cover as a percentage and a **dot for each of the next `breach.suggestWaves` waves** that come down that lane (tuning that constant changes the dots). Boxes grow taller at Largest text rather than scrolling. **Tap a lane** and a breakdown sheet opens (the Cover lines, the Stacked line, the Walls and volley results). On the Arrange Hold sheet the pieces that cover that lane are also lit on the grid, with an outline and a corner mark (never colour alone) and no pulse under reduced motion. The strip updates as pieces move. **On the Last Stand screen the strip is a read-only view** (the breakdown shows numbers only, since there is no grid there), and the **Arrange Hold** button under it opens the sheet to act on what the strip says; the preview recomputes whenever a piece moves.
- **The text alternative (D588).** A **Strip / List** switch shows the same information as eight text lines (*Lane 3: cover 75%, tower reach 50%, waves 2 and 7*). Nothing is drag-only: the grid keeps v1.1's tap-select and tap-swap.
- **Suggest layout (D588).** On the Arrange Hold sheet only. It shows the suggested arrangement as lit target tiles (outline and corner mark) and its preview line. It **places nothing**. A separate **Use this layout** button exists only if the owner answers Q61 yes; it would apply the suggestion in one tap, on the player's tap only.
- **In the wave list.** Each wave shows its lane (*Lane {n}*) from the moment Bastion is reached, even for "?" species.
- **In the Start confirmation.** If any unlocked wall or tower is in the Tray, the confirmation that says the Long Night follows adds the Tray line. Nothing is placed.
- **In a stand wave log.** A header line, *Lane {n} · cover {p}%*, for stands fought from v1.5. An older stand's log has none.
- **Player-facing strings (29 strings in 23 rows, word for word; no others; each is listed for the owner's approval):**

  | String | Where it shows |
  |---|---|
  | `Lanes` | Heading of the Lanes strip and of the text list |
  | `Lane {n}` | Strip box label (n = 1 to 8, west to east); tag on each wave in the wave list; title of the lane breakdown sheet |
  | `{p}% cover` | Line in each strip box |
  | `Strip` / `List` | Buttons that switch the Lanes view |
  | `Tap a lane to see what covers it.` | Hint under the strip |
  | `Lane {n}: cover {p}%, tower reach {r}%, waves {w}` | One line per lane in the text list |
  | `{a}` / `{a} and {b}` / `{a}, {b} and {c}` (and so on, *and* before the last) / `none in the first {k}` | The forms {w} takes: the waves (their numbers) that come down the lane |
  | `Only walls and towers in the three rows nearest the Fell Breach count.` | Help line under the Lanes strip |
  | `No walls or towers on the front rows yet. Only the ruined edge gives cover.` | Empty state, when no piece counts (the edge lanes still show their 25% cover) |
  | `Own column: +{p}%` | Line in the lane breakdown sheet |
  | `West neighbour: +{p}%` / `East neighbour: +{p}%` | Line in the lane breakdown sheet |
  | `Ruined edge counts as wall: +{p}%` | Line in the lane breakdown sheet, for column 1 (west) or column 8 (east) |
  | `Cover: {p}%` | Total line in the lane breakdown sheet |
  | `Stacked pieces: +{p}% on the wall cut` | Line in the lane breakdown sheet, when a column holds more than one counted piece |
  | `Walls: −{t}% damage taken in this lane` | Result line in the lane breakdown sheet and the Walls line of a stand fight's breakdown, built by the same function |
  | `Tower in column {x}: {p}% of its share` | One line per counted tower in the lane breakdown sheet |
  | `Watchtower volley in this lane: {v}` | Result line in the lane breakdown sheet |
  | `Suggest layout` | Button on the Arrange Hold sheet (shown from Bastion on, never disabled there, so no disabled string is needed) |
  | `Suggested: about {n} waves (now about {m}).` | Line under the suggested layout, from the preview |
  | `Use this layout` | Button; **only if the owner answers Q61 yes**, otherwise not built |
  | `{n} defenses are in the Tray and give nothing.` / `1 defense is in the Tray and gives nothing.` | Line in the Start confirmation, when at least one unlocked wall or tower is in the Tray |
  | `Lane {n} · cover {p}%` | Header line of a stand wave log (new stands only) |
  | `Arrange Hold` | Button under the Lanes strip on the Last Stand screen; opens the Arrange Hold sheet |

- **Layout and checks.** No new tap, sheet, confirmation or animation in any routine flow; **a routine check-in stays at 15 taps or fewer** (the strip is part of two screens the player already opens, and Start has no extra tap). Every lane box, switch button, Suggest button and the Arrange Hold button is a tappable thing of at least 44 × 44 px at 320, 360, 375 and 390 px and at every Text size, and the page never scrolls sideways at 320 px at Largest (the sweeps also run at 375 and 390 px). Contrast passes in both themes (§9.20). The Last Stand screen and the Arrange Hold sheet, both with the strip, are added to the screen list the sweeps read (D593).
- **Debug.** `debug.breach.freeze` (a core command, marks `debugUsed`; technical design §15).
- **Deferred, not cut (with reasons).** The inner ward and buildings taking damage (no damage to buildings, D108); per-wave monster traits tied to lanes (a new rule set); story text (the owner supplies it if wanted); a dedicated Lanes sheet (the strip and the breakdown sheet are enough); a sound for the Breach (not one of the 15 moments, §9.22).

---

## 10. Out of Scope
````

## 21 — §10 out of scope: the Breach row

**Find:**

````markdown
| Tactical building placement in the Last Stand ("The Breach") | Split from decorative placement (D499, D500) | Milestone v1.5 "The Breach", reusing v1.1's saved 8 × 8 layout format without another save migration, with its own flesh-out |
````

**Replace with:**

````markdown
| Tactical building placement in the Last Stand ("The Breach") | Split from decorative placement (D499, D500); **fleshed out 2026-10-28 as lanes, cover and the front zone for Walls and Watchtowers only (D579–D595, §5.9.11, §9.25)** | Milestone v1.5 "The Breach" |
| An inner ward (protection for key buildings) and buildings taking damage | Buildings take no damage (D108); protecting them needs a new damage rule (D580) | Not planned |
| Per-wave monster traits tied to lanes | A new rule set with its own balance (D580) | Not planned |
````

## 22 — Judgment calls: v1.5 list (append at end of file)

**Find:**

````markdown
7. **Hard rule on failing tests:** no failing test may ever be called a container or runner problem unless first shown to fail on `main` before the branch's changes, plus a milestone-end production offline-reload and `sw.js` duplicate-hash check (D557).
````

**Replace with:**

````markdown
7. **Hard rule on failing tests:** no failing test may ever be called a container or runner problem unless first shown to fail on `main` before the branch's changes, plus a milestone-end production offline-reload and `sw.js` duplicate-hash check (D557).

## Judgment calls added in the v1.5 flesh-out (D579–D595)

1. **Only defenses (Walls and Watchtowers) get a combat meaning from position;** the inner ward and buildings taking damage are deferred (D580).
2. **Each Last Stand wave comes down one of 8 lanes** from its own dice stream, so species picks do not change; lanes show in the wave list from Bastion (D580).
3. **Cover, depth and tower reach** (own column 50% plus 25% per neighbour with the ruined edge counted; +25% per extra piece in a column up to two; towers share today's volley by distance 1, 0.5, 0.25) with only pieces on the grid in the three rows nearest the Fell Breach counted, and **nothing ever placed for the player** (D581, D582, D587).
4. **Gentle at first, calibrated later:** a careless layout loses a wave or two and a good one gains a wave or two; every `breach.*` number except the lane count and front rows is a tunable placeholder until the owner approves a table (D583).
5. **`rulesVersion` 5 → 6 on a dual path, save schema 14 → 15,** `HoldLayoutState` unchanged, a derived lane table frozen on the stand record when Start is pressed; old stands replay under version 5 line for line; new version 6 goldens are owner-approved additions (D584, D585, D591, D592).
6. **The Descent, contracts, Delves, events, bosses, hunts, Rising Vigil's level steps, the Embers formula and the Threat rate ignore layout** (D586).
7. **A tap-based Lanes strip with a text-list alternative and a Suggest layout button that places nothing,** and a Tactician simulator player with three Proposed rows; the baseline moves once (D588, D589).
8. **Performance and size** proposals are measured, then approved by the owner (D590).
````
