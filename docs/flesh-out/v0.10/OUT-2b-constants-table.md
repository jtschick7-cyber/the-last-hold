# OUT-2b — GDD §7.12 Orders (constants table)

**Held for T10.2.** Do not add this to `docs/gdd.md` in the docs commit. T10.2 adds it as **§7.12**, writes `balance.ts` and the constants test to match, and adds the one-line pointer to §7.4. (Same pattern as §7.11 at T9.2.)

### 7.12 Orders *(v0.10, D407–D425)*

**`locked`** keys change only through a decisions row the owner approves (plan §0.6). Everything else here is **tunable**, and every number marked *sketch* is a first estimate that the Orderer (GDD §6.1) measures in T10.17 and T10.18. A tunable moved by more than 2× gets a Proposed row (§0.6). **There is no new bonus bucket (§5.0):** every perk below is its **own named factor** on one time, cost or rate, applied after the existing buckets and shown as its own line in the breakdown.

| Formula | Expression | Constants (key = starting value) | § |
|---|---|---|---|
| Seats at the start | seats a save has until the third opens | `orders.seatsStart` = 2 **(locked)** | 5.13.3 |
| Seats, most | the most seats there ever are | `orders.seatsMax` = 3 **(locked)** | 5.13.3 |
| Third seat | opens once, kept for good, when this many Orders are at level 4 **and** the Quenchers have opened (checked after every level change, at the Quenchers' opening, and on load) | `orders.thirdSeatTopOrders` = 2 **(locked)** | 5.13.3 |
| Levels | levels per Order; one chapter per level | `orders.levels` = 4 **(locked)** | 5.13.2 |
| The opposed pair | the two Orders whose last chapters differ by whether the other is seated, and each waits until the other has opened | `orders.opposed` = [moot, quenchers] **(locked)** | 5.13.6 |
| Perk ceiling | no Order's number perk may exceed this at level 4; a test checks `step × 4 ≤ ceiling` | `orders.perkCeiling` = 0.20 **(locked)** | 5.13.5 |
| Moot standing | per contract won, any village | `orders.standing.moot` = { contract: 1 } | 5.13.2 |
| Grey Wives standing | per brew finished, per experiment finished, per property revealed | `orders.standing.greyWives` = { brew: 1, experiment: 3, property: 10 } | 5.13.2 |
| Bell-Watchers standing | per document found, per hunter letter found, per name found | `orders.standing.bellWatchers` = { document: 5, letter: 5, name: 10 } | 5.13.2 |
| Quenchers standing | per Kozly Hollow contract won; per Delve floor whose result paid Riftglass | `orders.standing.quenchers` = { kozlyContract: 2, delveFloor: 1 } | 5.13.2 |
| Delve window | a window starts at the first counted floor and lasts this long on the event clock | `orders.delveWindow` = 7 days | 5.13.2 |
| Delve weekly cap | the most standing Delve floors add in one window | `orders.delveWeeklyCap` = 20 *(sketch)* | 5.13.2 |
| Triumphant stand | standing added to **every Order** (open or not) by each Triumphant stand | `orders.triumphantChunk` = 25 *(sketch)* | 5.13.2 |
| Level thresholds | standing needed for levels 1 to 4 | `orders.levelThresholds` = { moot: [10, 40, 100, 200], greyWives: [30, 100, 250, 500], bellWatchers: [25, 75, 160, 300], quenchers: [20, 60, 140, 260] } *(sketch)* | 5.13.2 |
| Migration cap | a save migrated from v9 starts each Order **no higher than** this level (its backfilled standing is capped at that level's threshold) | `orders.backfillCapLevel` = 1 | 5.13.2 |
| Swap cooldown | after a seat change mid-cycle, the next change waits this long on the event clock (`eventNow`); a new warden's arrival clears it | `orders.swapCooldown` = 24 h | 5.13.4 |
| Moot perk | contract provisions food × (1 − step × level) | `orders.perk.moot.foodStep` = 0.03 (level 4: −12%) | 5.13.5 |
| Grey Wives perk | brew and experiment time × (1 − step × level), fixed when queued | `orders.perk.greyWives.timeStep` = 0.04 (level 4: −16%) | 5.13.5 |
| Bell-Watchers perk | clue time × (1 − step × level), fixed when the clue starts | `orders.perk.bellWatchers.clueStep` = 0.04 (level 4: −16%) | 5.13.5 |
| Quenchers perk | the hourly Rank Threat rate × (1 − step × level) | `orders.perk.quenchers.threatStep` = 0.03 (level 4: −12%) | 5.13.5 |

**Level names (text, not constants):** Neighbour, Friend, Ally, Kin (levels 1 to 4), the same for every Order. They are different words from village trust (Cold, Wary, Hopeful, Trusting, Sworn) so the Villages panel never shows one word for two things.

**Notes**
- **Not constants but saved state:** each Order's `opened` flag, the per-source counts, `start` (the migration's capped backfill), the high-water level, the seats, whether the third seat has opened, the time of the last seat change (event clock), chapters read, and for each chapter the Orders that were seated when it was read (D419). Standing and level are **derived**.
- **Counting starts at v10 for all four Orders, opened or not** (D410). A save migrated from v9 gets one backfill at the migration, capped at `orders.backfillCapLevel`; nothing is ever backfilled again.
- **Where each perk bites:**
  - *Moot:* the food paid as **contract provisions** at launch (§5.4 step 4; the per-hunter food, after the existing rules such as Toma's Thrifty). A contract already launched keeps what it paid.
  - *Grey Wives:* brew time (§5.7) and experiment time (§5.8.3, after the Copper Still), **fixed at the moment the brew or experiment is queued;** one already in the kettle queue keeps the time it was queued with.
  - *Bell-Watchers:* the clue timer on an investigation (§5.6.3), fixed when the clue starts.
  - *Quenchers:* the **hourly Rank rate** of Threat (§5.9.1: Keep 0.5, Citadel 1, Bastion 1 per hour). Threat from failed contracts and every other source is unchanged. No fight number changes; `rulesVersion` stays 5. **A lower Threat also lowers the Embers a stand pays** (Threat adds 0.7% per point to the payout, §5.9.4): easier waves, a smaller payout. This is the Quenchers' cost and the Order sheet says so.
- **A Delve floor counts when that floor's result paid at least 1 Riftglass.** It is decided floor by floor from the result, so a run that runs out of allowance mid-run counts only the floors that paid. Delve standing is a Delve reward with an idle source (Kozly Hollow contracts), so the D20 / D271 "Delve-optional" content test passes.
- **Standing per command, not per tick:** each source adds standing in the command or event that does the thing (including events inside `advance` such as a contract resolving), so nothing is added on a timer.
- **No randomness:** Orders use no random streams (technical design §7.2).
- **Tunable content values (not constants):** the chapter, opening-scene and perk texts (OUT-3), which are word for word and change only through the owner.
