# The balance audit (v1.0 TV.11, D478)

Full suite (`npm run sim:check`, 55 runs, 330 s on this machine), played 2026-10-22 on `milestone/v1.0`.

- **All 55 rows pass.** No row fails, so nothing was retuned and no constant moved.
- **Every player's report equals the v0.11 baseline:** all 176 baseline lines read "same" (Monday and Saturday, Opening, Standard, Light, Heavy, Delver, Eventer, Orderer).
- **Expected, not judged:** the Saturday runs show ✗ lines for the Act documents (reported only, D135); the older "odds with 3 candidates" timing row is not part of this suite (D445).
- **"Reach Bastion, go" (D144, D478 (2)):** Standard (Monday, median of 5) reaches Bastion, with the Last Stand available, at **96 h (day 4.0)**; the row's window is days 3 to 4, so it sits at the late edge. Saturday: 94 h. The best Last Stand is also at 96 h (window days 4 to 5) and the first Long Night at 101.5 h (window days 3 to 5). Looked at, not changed: it passes, and any change is for the owner.

The full report follows.

---

# Simulator report: 2026-10-22T15-33-20-605Z-check

Milestone v0.11 · rulesVersion 5 · full suite · 55 runs in 330.3 s

## Checks

- **✓ pass** first-cottage: First Cottage bought: ≤ 1 min (Opening policy)
  - opening (mon, median of 5): 0.0 min ✓
  - opening (sat, reported only): 0.0 min
- **✓ pass** first-mine: First Mine bought: ≤ 5 min (Opening policy)
  - opening (mon, median of 5): 4.5 min ✓
  - opening (sat, reported only): 4.5 min
- **✓ pass** mill-3: Mill reaches level 3: 2–5 h
  - standard (mon, median of 5): 3.00 h ✓
  - standard (sat, reported only): 4.00 h
- **✓ pass** peasants-10: 10 peasants: 3–6 h
  - standard (mon, median of 5): 3.00 h ✓
  - standard (sat, reported only): 4.00 h
- **✓ pass** keep: Keep reached: 8–14 h (Standard); ≤ 24 h (Light); ≥ 6 h (Heavy)
  - standard (mon, median of 5): 14.00 h ✓
  - standard (sat, reported only): 24.00 h
  - light (mon, median of 5): 24.00 h ✓
  - light (sat, reported only): 27.50 h
  - heavy (mon, median of 5): 14.00 h ✓
  - heavy (sat, reported only): 14.00 h
- **✓ pass** something-to-do: At least 90% of Standard check-ins include a meaningful action
  - mon sim-1: 100% of 22 check-ins ✓
  - mon sim-2: 100% of 22 check-ins ✓
  - mon sim-3: 100% of 22 check-ins ✓
  - mon sim-4: 100% of 21 check-ins ✓
  - mon sim-5: 100% of 22 check-ins ✓
  - sat sim-1: 100% of 21 check-ins ✓
  - sat sim-2: 100% of 20 check-ins ✓
  - sat sim-3: 100% of 20 check-ins ✓
  - sat sim-4: 100% of 20 check-ins ✓
  - sat sim-5: 100% of 22 check-ins ✓
- **✓ pass** no-dry-spells: Never 2 consecutive check-ins with nothing to do
  - mon sim-1: none empty ✓
  - mon sim-2: none empty ✓
  - mon sim-3: none empty ✓
  - mon sim-4: none empty ✓
  - mon sim-5: none empty ✓
  - sat sim-1: none empty ✓
  - sat sim-2: none empty ✓
  - sat sim-3: none empty ✓
  - sat sim-4: none empty ✓
  - sat sim-5: none empty ✓
- **✓ pass** no-walls: No purchase takes more than 3 check-ins of saving; Age-ups up to 5
  - mon sim-1: none ✓
  - mon sim-2: none ✓
  - mon sim-3: none ✓
  - mon sim-4: none ✓
  - mon sim-5: none ✓
  - sat sim-1: none ✓
  - sat sim-2: none ✓
  - sat sim-3: none ✓
  - sat sim-4: none ✓
  - sat sim-5: none ✓
- **✓ pass** no-overflow: Every number stays below 1e300 through 3 simulated cycles
  - largest number over 25 runs: 1.706e+12 ✓
- **✓ pass** first-contract: First contract launched: within 15 min of the first Mine (Hamlet)
  - standard (mon, median of 5): 1.5 min after the Mine ✓
  - standard (sat, reported only): 1.5 min after the Mine
- **✓ pass** roster-4: Roster of 4 hunters: by the end of day 2
  - standard (mon, median of 5): 27.00 h ✓
  - standard (sat, reported only): 32.00 h
- **✓ pass** first-tier-3: First tier-3 success: day 2
  - standard (mon, median of 5): 40.00 h ✓
  - standard (sat, reported only): 51.00 h
- **✓ pass** odds-honest: Across 2,000 contracts, each 10-point odds bucket lands within ±5 points
  - 16079 fights: 6079 contracts played by the simulated player + 10000 from the odds probe (the check asks for 2000 contracts)
  - 0–10%: shown 1.8%, real 2.3% (1200 contracts) ✓
  - 10–20%: shown 15.1%, real 14.7% (900 contracts) ✓
  - 20–30%: shown 24.1%, real 24.3% (1025 contracts) ✓
  - 30–40%: shown 34.9%, real 36.0% (904 contracts) ✓
  - 40–50%: shown 44.8%, real 46.6% (1126 contracts) ✓
  - 50–60%: shown 55.2%, real 52.8% (945 contracts) ✓
  - 60–70%: shown 65.2%, real 66.2% (1226 contracts) ✓
  - 70–80%: shown 75.3%, real 72.8% (800 contracts) ✓
  - 80–90%: shown 85.6%, real 86.7% (761 contracts) ✓
  - 90–100%: shown 99.7%, real 99.6% (7192 contracts) ✓
- **✓ pass** contracts-own-silver: ≥ 70% of silver earned over the Keep phase comes from bounties
  - mon sim-1: 71.9% from bounties (5900 of 8210 silver from the Keep on, cycle 1; first Keep at 14.00 h) ✓ [cycle 1 72%, cycle 2 79%, cycle 3 87%, cycle 4 82%, cycle 5 88%, cycle 6 80%, cycle 7 86%, cycle 8 85%]
  - mon sim-2: 73.1% from bounties (6293 of 8603 silver from the Keep on, cycle 1; first Keep at 14.00 h) ✓ [cycle 1 73%, cycle 2 82%, cycle 3 86%, cycle 4 84%, cycle 5 86%, cycle 6 84%, cycle 7 86%, cycle 8 87%]
  - mon sim-3: 80.4% from bounties (9478 of 11788 silver from the Keep on, cycle 1; first Keep at 14.00 h) ✓ [cycle 1 80%, cycle 2 76%, cycle 3 86%, cycle 4 86%, cycle 5 79%, cycle 6 83%, cycle 7 84%, cycle 8 85%]
  - mon sim-4: 76.5% from bounties (7289 of 9533 silver from the Keep on, cycle 1; first Keep at 14.00 h) ✓ [cycle 1 76%, cycle 2 79%, cycle 3 89%, cycle 4 84%, cycle 5 84%, cycle 6 85%, cycle 7 88%, cycle 8 85%]
  - mon sim-5: 77.3% from bounties (7875 of 10185 silver from the Keep on, cycle 1; first Keep at 14.00 h) ✓ [cycle 1 77%, cycle 2 87%, cycle 3 86%, cycle 4 84%, cycle 5 86%, cycle 6 76%, cycle 7 79%, cycle 8 83%]
  - sat sim-1: 75.2% from bounties (6317 of 8403 silver from the Keep on, cycle 1; first Keep at 24.00 h) ✓ [cycle 1 75%, cycle 2 83%, cycle 3 84%, cycle 4 88%]
  - sat sim-2: 73.5% from bounties (5522 of 7515 silver from the Keep on, cycle 1; first Keep at 24.00 h) ✓ [cycle 1 73%, cycle 2 88%, cycle 3 88%, cycle 4 85%, cycle 5 27%]
  - sat sim-3: 75.3% from bounties (6084 of 8077 silver from the Keep on, cycle 1; first Keep at 24.00 h) ✓ [cycle 1 75%, cycle 2 86%, cycle 3 82%, cycle 4 81%, cycle 5 27%]
  - sat sim-4: 72.7% from bounties (5308 of 7301 silver from the Keep on, cycle 1; first Keep at 24.00 h) ✓ [cycle 1 73%, cycle 2 84%, cycle 3 84%, cycle 4 84%, cycle 5 40%]
  - sat sim-5: 70.6% from bounties (5318 of 7536 silver from the Keep on, cycle 1; first Keep at 24.00 h) ✓ [cycle 1 71%, cycle 2 77%, cycle 3 84%, cycle 4 82%]
- **✓ pass** provisions-matter: From Keep onward, contract provisions take 20–40% of food income
  - mon sim-1: provisions 22.9% of food income in cycle 1 ✓ [cycle 1 23%, cycle 2 25%, cycle 3 38%, cycle 4 19%, cycle 5 30%, cycle 6 15%, cycle 7 17%, cycle 8 28%]
  - mon sim-2: provisions 26.1% of food income in cycle 1 ✓ [cycle 1 26%, cycle 2 21%, cycle 3 22%, cycle 4 20%, cycle 5 25%, cycle 6 16%, cycle 7 29%, cycle 8 14%]
  - mon sim-3: provisions 36.8% of food income in cycle 1 ✓ [cycle 1 37%, cycle 2 8%, cycle 3 28%, cycle 4 20%, cycle 5 9%, cycle 6 23%, cycle 7 16%, cycle 8 12%]
  - mon sim-4: provisions 22.1% of food income in cycle 1 ✓ [cycle 1 22%, cycle 2 25%, cycle 3 35%, cycle 4 25%, cycle 5 19%, cycle 6 17%, cycle 7 29%, cycle 8 16%]
  - mon sim-5: provisions 33.8% of food income in cycle 1 ✓ [cycle 1 34%, cycle 2 25%, cycle 3 52%, cycle 4 25%, cycle 5 20%, cycle 6 20%, cycle 7 17%, cycle 8 9%]
  - sat sim-1: provisions 31.5% of food income in cycle 1 ✓ [cycle 1 32%, cycle 2 11%, cycle 3 35%, cycle 4 21%]
  - sat sim-2: provisions 26.8% of food income in cycle 1 ✓ [cycle 1 27%, cycle 2 20%, cycle 3 27%, cycle 4 21%, cycle 5 4%]
  - sat sim-3: provisions 32.3% of food income in cycle 1 ✓ [cycle 1 32%, cycle 2 17%, cycle 3 20%, cycle 4 12%, cycle 5 3%]
  - sat sim-4: provisions 29.1% of food income in cycle 1 ✓ [cycle 1 29%, cycle 2 14%, cycle 3 21%, cycle 4 18%, cycle 5 3%]
  - sat sim-5: provisions 31.1% of food income in cycle 1 ✓ [cycle 1 31%, cycle 2 8%, cycle 3 18%, cycle 4 52%]
- **✓ pass** first-identified: First species Identified through investigation: ≤ 2 h after the Hunter’s Lodge is built
  - standard (mon, median of 5): 28.8 min after the Lodge ✓
  - standard (sat, reported only): 28.8 min after the Lodge
- **✓ pass** first-studied: First species Studied (4 kills): days 2–3
  - standard (mon, median of 5): 30.00 h ✓
  - standard (sat, reported only): 33.00 h
- **✓ pass** preparation-matters: Matched preparation raises identified odds by ≥ 15 points at equal tier
  - tier 1: no case where preparation has room to matter
  - tier 2: no case where preparation has room to matter
  - tier 3: +65.6 points over 5 cases (34% → 100%) (too few)
  - tier 4: +51.9 points over 16 cases (47% → 99%) ✓
  - tier 5: +48.5 points over 25 cases (51% → 99%) ✓
- **✓ pass** citadel: Citadel reached: day 2
  - standard (mon, median of 5): 48.00 h ✓
  - standard (sat, reported only): 70.00 h
- **✓ pass** bastion: Bastion reached; Last Stand available: days 3–4
  - standard (mon, median of 5): 96.00 h ✓
  - standard (sat, reported only): 94.00 h
- **✓ pass** best-last-stand: Best Last Stand timing (peak Embers per day of cycle): days 4–5
  - standard (mon, median of 5): 96.00 h ✓
  - standard (sat, reported only): 94.00 h
- **✓ pass** first-long-night: First Long Night: days 3–5 (Standard); ≤ 7 days (Light); ≥ 2.5 days (Heavy)
  - standard (mon, median of 5): 101.50 h ✓
  - standard (sat, reported only): 99.50 h
  - light (mon, median of 5): 134.00 h ✓
  - light (sat, reported only): 118.00 h
  - heavy (mon, median of 5): 76.00 h ✓
  - heavy (sat, reported only): 96.00 h
- **✓ pass** later-cycles: Later cycles: each ≥ 15% faster than the first, with a floor of 2 days
  - standard (mon, median of 5): cycle 1: 101.50 h, cycle 2: 75.50 h, cycle 3: 68.50 h, cycle 4: 76.50 h, cycle 5: 67.50 h, cycle 6: 68.50 h, cycle 7: 79.00 h, cycle 8: 53.50 h
  - cycle 2 vs 1: 75.50 h vs 101.50 h (26% faster) ✓
  - cycle 3 vs 1: 68.50 h vs 101.50 h (33% faster) ✓
  - cycle 4 vs 1: 76.50 h vs 101.50 h (25% faster) ✓
  - cycle 5 vs 1: 67.50 h vs 101.50 h (33% faster) ✓
  - cycle 6 vs 1: 68.50 h vs 101.50 h (33% faster) ✓
  - cycle 7 vs 1: 79.00 h vs 101.50 h (22% faster) ✓
  - cycle 8 vs 1: 53.50 h vs 101.50 h (47% faster) ✓
  - standard (sat, reported only): cycle 1: 99.50 h, cycle 2: 76.50 h, cycle 3: 71.00 h
- **✓ pass** first-ruin: First ruin contract won: ≤ 24 h after the Keep
  - standard (mon, median of 5): 14.00 h after the Keep ✓
  - standard (sat, reported only): 23.00 h after the Keep
- **✓ pass** act-1: Act I lands in its cycle: its contract, Rank and stand documents found by the end of cycle 1, and the next warden’s by the start of cycle 2
  - standard (mon, median of 5): D1-01 cycle 1, D1-03 cycle 1, D1-04 cycle 1, D1-06 cycle 1, D1-09 cycle 1, D1-10 cycle 1, D1-07 cycle 2 ✓
  - reported only: D1-02 cycle 2, D1-05 never
  - standard (sat, reported only): D1-01 cycle 1, D1-03 cycle 1, D1-04 cycle 1, D1-06 cycle 1, D1-09 cycle 1, D1-10 cycle 1, D1-07 cycle 2; D1-02 cycle 2, D1-05 never
- **✓ pass** act-2: Act II lands in its cycle: its Rank and stand documents and its first two found in cycle 2, the 2nd to 5th ruin documents by the end of cycle 4, and the next warden’s by the start of cycle 3
  - standard (mon, median of 5): D2-01 cycle 2, D2-02 cycle 2, D2-07 cycle 2, D2-09 cycle 2, D2-03 cycle 3, D2-04 cycle 3, D2-05 cycle 4, D2-06 cycle 4, D2-10 cycle 3 ✓
  - reported only: D2-08 cycle 2
  - standard (sat, reported only): D2-01 cycle 2, D2-02 cycle 2, D2-07 cycle 2, D2-09 cycle 2, D2-03 cycle 3, D2-04 cycle 3, D2-05 cycle 3, D2-06 cycle 4, D2-10 cycle 3; D2-08 cycle 2
- **✓ pass** ribbonshades: All six Ribbonshade names found by the end of cycle 4
  - standard (mon, median of 5): all six by cycle 4 ✓
  - standard (sat, reported only): all six by cycle 3
- **✓ pass** trust-moves: At least one village rises a step in cycle 1
  - standard (mon, median of 5): 2 villages risen by the end of cycle 1 ✓
  - standard (sat, reported only): 3 villages risen
- **✓ pass** first-new-brew: First new brew discovered: ≤ 24 h after the Alchemist’s Hut is built
  - standard (mon, median of 5): 20.0 min after the Hut ✓
  - standard (sat, reported only): 20.0 min after the Hut
- **✓ pass** recipe-book: Recipe book complete (36 of 36 properties) by the end of cycle 3
  - standard (mon, median of 5): 36 of 36 properties by the end of cycle 3 ✓
  - standard (sat, reported only): 36 of 36 properties by the end of cycle 3
- **✓ pass** skills-start: Skills start moving: every warden skill at level ≥ 1 by the end of cycle 1
  - standard (mon, median of 5): end of cycle 1: alchemy 4, smithing 4, lore 4, command 2 ✓
  - standard (sat, reported only): end of cycle 1: alchemy 4, smithing 4, lore 4, command 2
- **✓ pass** skills-pace: Skills pace: at the end of cycle 3, every warden skill is between level 4 and 8
  - standard (mon, median of 5): end of cycle 3: alchemy 4, smithing 6, lore 5, command 4 (want 4–8) ✓
  - standard (sat, reported only): end of cycle 3: alchemy 4, smithing 6, lore 5, command 4 (want 4–8)
- **✓ pass** act-3: Act III lands in its cycle: D3-01 to D3-06 by the end of cycle 3, D3-07 with the next warden (D3-08 reported only)
  - standard (mon, median of 5): D3-01 cycle 3, D3-02 cycle 3, D3-03 cycle 3, D3-04 cycle 3, D3-05 cycle 3, D3-06 cycle 3, D3-07 cycle 4 ✓
  - reported only: D3-08 cycle 3
  - standard (sat, reported only): D3-01 cycle 3, D3-02 cycle 3, D3-03 cycle 3, D3-04 cycle 3, D3-05 cycle 3, D3-06 cycle 3, D3-07 cycle 4; D3-08 cycle 3
- **✓ pass** arvid-letter: Arvid’s level-5 letter (Leif, #34) by the end of cycle 4
  - standard (mon, median of 5): found in cycle 3 ✓
  - standard (sat, reported only): found in cycle 3
- **✓ pass** trust-arc: Trust keeps an arc: no village reaches Sworn before cycle 4 (none Sworn at the end of cycle 3)
  - standard (mon, median of 5): 0 villages Sworn at the end of cycle 3 ✓
  - standard (sat, reported only): 0 villages Sworn at the end of cycle 3
- **✓ pass** act-4: Act IV lands in its cycle: D4-01 to D4-06 and D4-08 by the end of cycle 4, D4-07 with the next warden
  - standard (mon, median of 5): D4-01 cycle 4, D4-02 cycle 4, D4-03 cycle 4, D4-04 cycle 4, D4-05 cycle 4, D4-06 cycle 4, D4-08 cycle 4, D4-07 cycle 5 ✓
  - standard (sat, reported only): D4-01 cycle 4, D4-02 cycle 4, D4-03 cycle 4, D4-04 cycle 4, D4-05 cycle 4, D4-06 cycle 4, D4-08 cycle 4, D4-07 cycle 5
- **✓ pass** first-guardian: First guardian beaten: by the end of cycle 2 (Delver)
  - delver (mon, median of 5): first guardian beaten in cycle 1 ✓
- **✓ pass** idle-only: Idle-only vs Delver: Standard reaches the last of "all content" ≤ 1.3× later than the Delver
  - standard (mon, median of 5): all content at 387.00 h (last: D5-06, D2-06)
  - delver (mon, median of 5): all content at 384.00 h (last: D5-06, D2-06)
  - Standard takes 1.008× the Delver's time (limit 1.3×) ✓
- **✓ pass** act-5: Act V lands in its cycle: D5-01 to D5-06 and D5-08 by the end of cycle 5, D5-07 with the next warden
  - standard (mon, median of 5): D5-01 cycle 5, D5-02 cycle 5, D5-03 cycle 5, D5-04 cycle 5, D5-05 cycle 5, D5-06 cycle 5, D5-08 cycle 5, D5-07 cycle 6 ✓
  - standard (sat, reported only): D5-01 cycle 5, D5-02 cycle 5, D5-03 never (due by 5) ✗, D5-04 never (due by 5) ✗, D5-05 never (due by 5) ✗, D5-06 never (due by 5) ✗, D5-08 never (due by 5) ✗, D5-07 never (due by 6) ✗
- **✓ pass** act-6: Act VI lands in its cycle: D6-01 to D6-06 by the end of cycle 6, D6-07 with the next warden; D6-08 to D6-10 reported only
  - standard (mon, median of 5): D6-01 cycle 6, D6-02 cycle 6, D6-03 cycle 6, D6-04 cycle 6, D6-05 cycle 6, D6-06 cycle 6, D6-07 cycle 7 ✓
  - reported only: D6-08 cycle 6, D6-09 cycle 6, D6-10 cycle 6
  - standard (sat, reported only): D6-01 never (due by 6) ✗, D6-02 never (due by 6) ✗, D6-03 never (due by 6) ✗, D6-04 never (due by 6) ✗, D6-05 never (due by 6) ✗, D6-06 never (due by 6) ✗, D6-07 never (due by 7) ✗; D6-08 never, D6-09 never, D6-10 never
- **✓ pass** dross-tide-stand: The Dross-Tide stand probe: in Act VI-era cycles Standard's stand reaches the Held band (12 or more waves) and the preview's range still agrees with the real result
  - standard (mon, median of 5): 15 Dross-Tide stands; median waves 18 (Held is 12+), real result inside the preview range in 100% (needs 60%) ✓
  - standard (sat, reported only): 0 Dross-Tide stands; median waves 0 (Held is 12+), real result inside the preview range in 0% (needs 60%)
- **✓ pass** first-boss-attempt: First boss attempt: within 24 h of events opening at the Citadel (Eventer)
  - eventer (mon, median of 5): 6.0 h after events opened (needs 24 h) ✓
- **✓ pass** first-boss-kill: First boss defeated: by the end of the 7th cycle from the one events open in, which is cycle 1 (Eventer)
  - eventer (mon, median of 5): first boss defeated cycle 6 (needs 7 or earlier) ✓
- **✓ pass** first-hunter-unlock: First legendary hunter unlocked: by the end of the 6th cycle from the one events open in, which is cycle 1 (Eventer)
  - eventer (mon, median of 5): first legendary hunter cycle 5 (needs 6 or earlier) ✓
- **✓ pass** tokens-not-wasted: Tokens not wasted: a full bank at no more than 35% of the Eventer's unlocked check-ins
  - eventer (mon, median of 5): full bank at 28.9% of unlocked check-ins (needs 35% or less) ✓
- **✓ pass** silver-with-boss: Silver check #6 with boss silver: at least 70% of the Eventer's silver, from the Keep on in cycle 1, comes from bounties (boss silver counts in the total only)
  - eventer (mon, median of 5): 77.3% of cycle-1 silver from bounties, boss silver in the total (needs 70%) ✓
- **✓ pass** late-letters: Late recruits catch up: all five name letters (Ostap at levels 5 and 8; Toma, Sigrun and Arvid at 5) by the end of cycle 5
  - standard (mon, median of 5): ostap level 5 cycle 1, ostap level 8 cycle 4, toma level 5 cycle 3, sigrun level 5 cycle 3, arvid level 5 cycle 3 ✓
  - standard (sat, reported only): ostap level 5 cycle 1, ostap level 8 cycle 4, toma level 5 cycle 2, sigrun level 5 cycle 4, arvid level 5 cycle 3
- **✓ pass** first-wright: First Wright: by the end of cycle 1
  - standard (mon, median of 5): 3 Wrights at the end of cycle 1 ✓
  - standard (sat, reported only): 4 Wrights at the end of cycle 1
- **✓ pass** orders-first-chapter: First chapter in time: chapter 1 of each Order the Orderer seats at its opening plays within 24 h of that Order opening (Orderer)
  - moot (seated at its opening in 5 of 5): median 10.0 h to chapter 1 (needs 24 h) ✓
  - greyWives: not seated at its opening in any run, reported only: median 77.5 h to chapter 1
  - bellWatchers (seated at its opening in 5 of 5): median 2.4 h to chapter 1 (needs 24 h) ✓
  - quenchers (seated at its opening in 5 of 5): median 3.3 h to chapter 1 (needs 24 h) ✓
- **✓ pass** orders-level-4: Every Order reaches level 4 by the end of cycle 6 (Orderer)
  - moot: level 4 in cycle 5 (needs 6 or earlier) ✓
  - greyWives: level 4 in cycle 3 (needs 6 or earlier) ✓
  - bellWatchers: level 4 in cycle 3 (needs 6 or earlier) ✓
  - quenchers: level 4 in cycle 5 (needs 6 or earlier) ✓
- **✓ pass** orders-all-chapters: All 16 chapters have played by the end of cycle 8 (Orderer)
  - orderer (mon, median of 5): all 16 chapters by cycle 5 (needs 8 or earlier) ✓
- **✓ pass** orders-silver: Silver check #6 with Orders: at least 70% of silver from bounties (Orderer)
  - orderer (mon, median of 5): 73.1% of cycle-1 silver from bounties (needs 70%) ✓
- **✓ pass** orders-provisions: Provisions share with the Moot perk counted: 20–40% (Orderer)
  - orderer (mon, median of 5): provisions 26.3% of food income in cycle 1, Moot perk counted (needs 20–40%) ✓
- **✓ pass** orders-stand-rows: Stand rows with the Quenchers' perk: Best Last Stand timing (days 4–5), First Long Night (days 3–5), Act VI lands in its cycle and the Dross-Tide stand probe still pass; Embers per stand with and without the Quenchers are reported (Orderer)
  - best-last-stand: ✓
  -   standard (mon, median of 5): 96.00 h ✓
  - first-long-night: ✓
  -   standard (mon, median of 5): 101.50 h ✓
  - act-6: ✓
  -   standard (mon, median of 5): D6-01 cycle 6, D6-02 cycle 6, D6-03 cycle 6, D6-04 cycle 6, D6-05 cycle 6, D6-06 cycle 6, D6-07 cycle 7 ✓
  - dross-tide-stand: ✓
  -   standard (mon, median of 5): 15 Dross-Tide stands; median waves 18 (Held is 12+), real result inside the preview range in 100% (needs 60%) ✓
  - Embers per stand (reported): with the Quenchers seated 372 (6 stands, mean Threat 18); without 376 (34 stands, mean Threat 20)
- **✓ pass** remembering-reachable: The Remembering is reachable: all 40 names are found and Act VI's stand is applied by the end of cycle 6 (Standard)
  - median cycle 6 against cycle 6
  - sim-1: cycle 6 (40 of 40 names)
  - sim-2: cycle 6 (40 of 40 names)
  - sim-3: cycle 6 (40 of 40 names)
  - sim-4: cycle 7 (40 of 40 names)
  - sim-5: cycle 6 (40 of 40 names)

## Story (reported only)

- standard mon sim-1: cycle 1 Held (14 waves), cycle 2 Triumphant (16 waves), cycle 3 Triumphant (16 waves), cycle 4 Triumphant (17 waves), cycle 5 Triumphant (18 waves), cycle 6 Triumphant (18 waves), cycle 7 Triumphant (17 waves), cycle 8 Triumphant (16 waves); 15 letters, 40 of 40 names, 52 documents; trust at the end: dubno-ford sworn, kozly-hollow sworn, mirograd sworn, velkvik sworn, ravenfell sworn
- standard mon sim-2: cycle 1 Triumphant (15 waves), cycle 2 Triumphant (18 waves), cycle 3 Triumphant (18 waves), cycle 4 Triumphant (18 waves), cycle 5 Triumphant (17 waves), cycle 6 Triumphant (18 waves), cycle 7 Triumphant (18 waves), cycle 8 Triumphant (19 waves); 17 letters, 40 of 40 names, 52 documents; trust at the end: dubno-ford sworn, kozly-hollow sworn, mirograd sworn, velkvik sworn, ravenfell sworn
- standard mon sim-3: cycle 1 Triumphant (16 waves), cycle 2 Held (14 waves), cycle 3 Triumphant (19 waves), cycle 4 Triumphant (18 waves), cycle 5 Triumphant (16 waves), cycle 6 Triumphant (19 waves), cycle 7 Triumphant (17 waves), cycle 8 Triumphant (18 waves); 14 letters, 40 of 40 names, 52 documents; trust at the end: dubno-ford sworn, kozly-hollow sworn, mirograd sworn, velkvik sworn, ravenfell sworn
- standard mon sim-4: cycle 1 Held (14 waves), cycle 2 Triumphant (16 waves), cycle 3 Triumphant (19 waves), cycle 4 Triumphant (18 waves), cycle 5 Triumphant (19 waves), cycle 6 Triumphant (18 waves), cycle 7 Triumphant (18 waves), cycle 8 Triumphant (18 waves); 19 letters, 40 of 40 names, 52 documents; trust at the end: dubno-ford sworn, kozly-hollow sworn, mirograd sworn, velkvik sworn, ravenfell sworn
- standard mon sim-5: cycle 1 Triumphant (16 waves), cycle 2 Triumphant (18 waves), cycle 3 Triumphant (17 waves), cycle 4 Triumphant (19 waves), cycle 5 Triumphant (18 waves), cycle 6 Triumphant (16 waves), cycle 7 Triumphant (16 waves), cycle 8 Triumphant (17 waves); 16 letters, 40 of 40 names, 52 documents; trust at the end: dubno-ford sworn, kozly-hollow sworn, mirograd sworn, velkvik sworn, ravenfell sworn
- standard sat sim-1: cycle 1 Triumphant (18 waves), cycle 2 Triumphant (16 waves), cycle 3 Triumphant (17 waves), cycle 4 Triumphant (19 waves); 16 letters, 33 of 40 names, 35 documents; trust at the end: dubno-ford trusting, kozly-hollow trusting, mirograd sworn, velkvik trusting, ravenfell trusting
- standard sat sim-2: cycle 1 Triumphant (16 waves), cycle 2 Triumphant (18 waves), cycle 3 Triumphant (19 waves), cycle 4 Triumphant (18 waves); 14 letters, 33 of 40 names, 37 documents; trust at the end: dubno-ford trusting, kozly-hollow trusting, mirograd sworn, velkvik sworn, ravenfell trusting
- standard sat sim-3: cycle 1 Triumphant (16 waves), cycle 2 Triumphant (18 waves), cycle 3 Triumphant (19 waves), cycle 4 Triumphant (18 waves); 12 letters, 35 of 40 names, 37 documents; trust at the end: dubno-ford trusting, kozly-hollow trusting, mirograd sworn, velkvik sworn, ravenfell trusting
- standard sat sim-4: cycle 1 Triumphant (16 waves), cycle 2 Triumphant (16 waves), cycle 3 Triumphant (18 waves), cycle 4 Triumphant (17 waves); 14 letters, 32 of 40 names, 33 documents; trust at the end: dubno-ford trusting, kozly-hollow trusting, mirograd sworn, velkvik trusting, ravenfell trusting
- standard sat sim-5: cycle 1 Held (14 waves), cycle 2 Triumphant (16 waves), cycle 3 Triumphant (18 waves); 14 letters, 33 of 40 names, 32 documents; trust at the end: dubno-ford trusting, kozly-hollow hopeful, mirograd trusting, velkvik hopeful, ravenfell hopeful

## Discovery and skills (reported only; skills are alchemy/smithing/lore/command)

- standard mon sim-1: first new brew 20.0 min after the Hut; cycle 1: 30/36 properties, skills 4/4/4/2; cycle 2: 35/36 properties, skills 4/5/4/3; cycle 3: 36/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 5/7/6/5; cycle 6: 36/36 properties, skills 5/8/6/6; cycle 7: 36/36 properties, skills 5/8/6/6; cycle 8: 36/36 properties, skills 5/8/6/6; cycle 9: 36/36 properties, skills 5/8/6/6
- standard mon sim-2: first new brew 20.0 min after the Hut; cycle 1: 33/36 properties, skills 4/4/4/2; cycle 2: 34/36 properties, skills 4/5/4/3; cycle 3: 36/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 4/8/5/5; cycle 6: 36/36 properties, skills 5/8/6/6; cycle 7: 36/36 properties, skills 5/8/6/6; cycle 8: 36/36 properties, skills 5/9/6/6; cycle 9: 36/36 properties, skills 5/9/6/6
- standard mon sim-3: first new brew 5.83 h after the Hut; cycle 1: 33/36 properties, skills 4/4/4/3; cycle 2: 33/36 properties, skills 4/5/4/3; cycle 3: 33/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 4/7/6/5; cycle 6: 36/36 properties, skills 5/8/6/6; cycle 7: 36/36 properties, skills 5/8/6/6; cycle 8: 36/36 properties, skills 5/8/6/6; cycle 9: 36/36 properties, skills 5/8/6/6
- standard mon sim-4: first new brew 5.83 h after the Hut; cycle 1: 33/36 properties, skills 4/4/4/2; cycle 2: 34/36 properties, skills 4/5/4/3; cycle 3: 35/36 properties, skills 4/6/5/4; cycle 4: 35/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 5/8/5/5; cycle 6: 36/36 properties, skills 5/8/6/5; cycle 7: 36/36 properties, skills 5/8/6/6; cycle 8: 36/36 properties, skills 5/9/6/6; cycle 9: 36/36 properties, skills 5/9/6/6
- standard mon sim-5: first new brew 20.0 min after the Hut; cycle 1: 34/36 properties, skills 4/4/4/2; cycle 2: 36/36 properties, skills 4/5/5/4; cycle 3: 36/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 5/7/6/5; cycle 6: 36/36 properties, skills 5/8/6/6; cycle 7: 36/36 properties, skills 5/8/6/6; cycle 8: 36/36 properties, skills 5/8/6/6; cycle 9: 36/36 properties, skills 5/8/6/6
- standard sat sim-1: first new brew 20.0 min after the Hut; cycle 1: 33/36 properties, skills 4/4/4/3; cycle 2: 35/36 properties, skills 4/5/5/4; cycle 3: 35/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 4/7/5/5
- standard sat sim-2: first new brew 20.0 min after the Hut; cycle 1: 35/36 properties, skills 4/3/4/2; cycle 2: 35/36 properties, skills 4/5/5/4; cycle 3: 35/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 4/7/5/5
- standard sat sim-3: first new brew 12.33 h after the Hut; cycle 1: 33/36 properties, skills 4/4/4/3; cycle 2: 36/36 properties, skills 4/5/5/4; cycle 3: 36/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 4/7/5/5
- standard sat sim-4: first new brew 8.33 h after the Hut; cycle 1: 34/36 properties, skills 4/4/4/2; cycle 2: 34/36 properties, skills 4/5/5/4; cycle 3: 36/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5; cycle 5: 36/36 properties, skills 4/7/5/5
- standard sat sim-5: first new brew 20.0 min after the Hut; cycle 1: 34/36 properties, skills 4/4/4/2; cycle 2: 35/36 properties, skills 4/5/4/3; cycle 3: 36/36 properties, skills 4/6/5/4; cycle 4: 36/36 properties, skills 4/7/5/5

## Delves (reported only)

- delver mon sim-1: 10 runs, guardian beaten in 10, median 7 floors a run; 55.6 Riftglass a week (52 held, bought: Late hours 2); 5 of 6 relics; first guardian in cycle 1 (60.00 h)
- delver mon sim-2: 10 runs, guardian beaten in 10, median 7 floors a run; 55.6 Riftglass a week (52 held, bought: Late hours 2); 5 of 6 relics; first guardian in cycle 1 (60.00 h)
- delver mon sim-3: 12 runs, guardian beaten in 12, median 7 floors a run; 65.5 Riftglass a week (24 held, bought: Chosen start, Late hours 2); 6 of 6 relics; first guardian in cycle 1 (60.00 h)
- delver mon sim-4: 12 runs, guardian beaten in 12, median 7 floors a run; 64.1 Riftglass a week (24 held, bought: Chosen start, Late hours 2); 5 of 6 relics; first guardian in cycle 1 (60.00 h)
- delver mon sim-5: 10 runs, guardian beaten in 10, median 7 floors a run; 57.0 Riftglass a week (52 held, bought: Late hours 2); 5 of 6 relics; first guardian in cycle 1 (60.00 h)

## Hunter depth (reported only; items are Fine/Rare/Heroic per cycle)

- standard mon sim-1: cycle 1: 0 stars, 3 Wrights, items 1/0/0; cycle 2: 1 stars, 5 Wrights, items 5/3/0; cycle 3: 1 stars, 9 Wrights, items 2/2/0; cycle 4: 1 stars, 11 Wrights, items 1/1/0; cycle 5: 4 stars, 11 Wrights, items 3/0/0; cycle 6: 7 stars, 11 Wrights, items 3/2/0; cycle 7: 10 stars, 11 Wrights, items 2/2/1; cycle 8: 11 stars, 11 Wrights, items 1/1/0; cycle 9: 11 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5)
- standard mon sim-2: cycle 1: 0 stars, 3 Wrights, items 3/0/0; cycle 2: 0 stars, 6 Wrights, items 2/2/0; cycle 3: 0 stars, 9 Wrights, items 3/1/0; cycle 4: 1 stars, 11 Wrights, items 0/1/0; cycle 5: 4 stars, 11 Wrights, items 3/4/0; cycle 6: 4 stars, 11 Wrights, items 3/1/1; cycle 7: 7 stars, 11 Wrights, items 3/0/0; cycle 8: 10 stars, 11 Wrights, items 3/1/0; cycle 9: 10 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5)
- standard mon sim-3: cycle 1: 0 stars, 4 Wrights, items 4/2/1; cycle 2: 0 stars, 5 Wrights, items 2/1/1; cycle 3: 0 stars, 9 Wrights, items 5/0/0; cycle 4: 0 stars, 11 Wrights, items 3/2/0; cycle 5: 2 stars, 11 Wrights, items 3/4/0; cycle 6: 5 stars, 11 Wrights, items 1/1/0; cycle 7: 7 stars, 11 Wrights, items 2/1/0; cycle 8: 7 stars, 11 Wrights, items 6/1/0; cycle 9: 7 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5)
- standard mon sim-4: cycle 1: 0 stars, 3 Wrights, items 3/0/1; cycle 2: 0 stars, 5 Wrights, items 3/0/0; cycle 3: 0 stars, 8 Wrights, items 2/1/2; cycle 4: 0 stars, 10 Wrights, items 7/1/0; cycle 5: 2 stars, 11 Wrights, items 3/1/0; cycle 6: 5 stars, 11 Wrights, items 0/2/0; cycle 7: 9 stars, 11 Wrights, items 6/1/1; cycle 8: 11 stars, 11 Wrights, items 3/0/1; cycle 9: 11 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5)
- standard mon sim-5: cycle 1: 0 stars, 3 Wrights, items 3/1/0; cycle 2: 0 stars, 7 Wrights, items 2/1/3; cycle 3: 0 stars, 9 Wrights, items 1/0/0; cycle 4: 1 stars, 11 Wrights, items 4/1/0; cycle 5: 3 stars, 11 Wrights, items 2/2/2; cycle 6: 3 stars, 11 Wrights, items 1/0/0; cycle 7: 5 stars, 11 Wrights, items 3/2/1; cycle 8: 7 stars, 11 Wrights, items 1/1/1; cycle 9: 7 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5)
- standard sat sim-1: cycle 1: 0 stars, 4 Wrights, items 4/1/0; cycle 2: 0 stars, 6 Wrights, items 3/3/0; cycle 3: 0 stars, 8 Wrights, items 2/1/0; cycle 4: 2 stars, 10 Wrights, items 3/1/0; cycle 5: 2 stars, 10 Wrights, items 0/0/0; Legendaries: none
- standard sat sim-2: cycle 1: 0 stars, 3 Wrights, items 5/0/0; cycle 2: 1 stars, 6 Wrights, items 4/1/0; cycle 3: 1 stars, 10 Wrights, items 2/2/0; cycle 4: 3 stars, 11 Wrights, items 1/0/0; cycle 5: 3 stars, 11 Wrights, items 1/1/0; Legendaries: none
- standard sat sim-3: cycle 1: 0 stars, 4 Wrights, items 4/2/1; cycle 2: 0 stars, 8 Wrights, items 4/1/1; cycle 3: 0 stars, 10 Wrights, items 5/0/1; cycle 4: 0 stars, 10 Wrights, items 4/1/0; cycle 5: 0 stars, 10 Wrights, items 0/0/0; Legendaries: none
- standard sat sim-4: cycle 1: 0 stars, 3 Wrights, items 3/0/1; cycle 2: 1 stars, 5 Wrights, items 4/0/0; cycle 3: 1 stars, 8 Wrights, items 0/1/2; cycle 4: 1 stars, 10 Wrights, items 6/1/1; cycle 5: 1 stars, 10 Wrights, items 0/0/0; Legendaries: none
- standard sat sim-5: cycle 1: 0 stars, 4 Wrights, items 3/1/0; cycle 2: 0 stars, 6 Wrights, items 2/1/2; cycle 3: 0 stars, 9 Wrights, items 1/0/0; cycle 4: 1 stars, 11 Wrights, items 3/1/0; Legendaries: none
- delver mon sim-1: cycle 1: 0 stars, 3 Wrights, items 2/0/0; cycle 2: 0 stars, 6 Wrights, items 6/3/0; cycle 3: 0 stars, 9 Wrights, items 4/1/0; cycle 4: 1 stars, 10 Wrights, items 2/2/0; cycle 5: 2 stars, 11 Wrights, items 2/0/0; cycle 6: 2 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5); Delve XP 2770
- delver mon sim-2: cycle 1: 0 stars, 3 Wrights, items 3/1/0; cycle 2: 0 stars, 5 Wrights, items 2/2/0; cycle 3: 0 stars, 9 Wrights, items 4/2/0; cycle 4: 2 stars, 10 Wrights, items 1/0/0; cycle 5: 4 stars, 11 Wrights, items 5/3/0; cycle 6: 4 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5); Delve XP 2770
- delver mon sim-3: cycle 1: 0 stars, 5 Wrights, items 4/3/1; cycle 2: 1 stars, 8 Wrights, items 8/1/1; cycle 3: 1 stars, 11 Wrights, items 8/0/1; cycle 4: 1 stars, 11 Wrights, items 5/0/0; cycle 5: 1 stars, 11 Wrights, items 3/6/0; cycle 6: 1 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5); Delve XP 3460
- delver mon sim-4: cycle 1: 0 stars, 3 Wrights, items 3/0/2; cycle 2: 0 stars, 5 Wrights, items 3/1/0; cycle 3: 0 stars, 9 Wrights, items 3/2/2; cycle 4: 0 stars, 11 Wrights, items 7/1/1; cycle 5: 2 stars, 11 Wrights, items 3/0/0; cycle 6: 4 stars, 11 Wrights, items 0/4/0; Legendaries: yrsas-thole (cycle 5); Delve XP 3440
- delver mon sim-5: cycle 1: 0 stars, 3 Wrights, items 4/1/0; cycle 2: 0 stars, 6 Wrights, items 2/2/3; cycle 3: 0 stars, 8 Wrights, items 2/1/0; cycle 4: 0 stars, 10 Wrights, items 3/1/0; cycle 5: 1 stars, 11 Wrights, items 2/2/1; cycle 6: 1 stars, 11 Wrights, items 0/0/0; Legendaries: yrsas-thole (cycle 5); Delve XP 2820

## Events (reported only; the Eventer)

- eventer mon sim-1: opened 51.00 h; 24 tokens spent; 44 open check-ins, 12 full bank, 40 blocked; first boss attempt 57.00 h, first boss defeated cycle 6, unlocked stoneback (cycle 5); cycle 1: 3 boss (median damage 1172, 0 marks, 0 silver), hunt points 30; cycle 2: 2 boss (median damage 7986, 1 marks, 1118.2080000000003 silver), hunt points 30; cycle 3: 2 boss (median damage 2522, 1 marks, 1118.2080000000003 silver), hunt points 30; cycle 4: 1 boss (median damage 2429, 0 marks, 0 silver), hunt points 8; cycle 5: 2 boss (median damage 1664, 0 marks, 0 silver), hunt points 2; cycle 6: 4 boss (median damage 2201, 2 marks, 4659.200000000001 silver), hunt points 44
- eventer mon sim-2: opened 51.00 h; 21 tokens spent; 41 open check-ins, 13 full bank, 37 blocked; first boss attempt 57.00 h, first boss defeated cycle 6, unlocked stoneback (cycle 6); cycle 1: 4 boss (median damage 2230, 1 marks, 1304.5760000000005 silver), hunt points 0; cycle 2: 2 boss (median damage 5887, 1 marks, 1118.2080000000003 silver), hunt points 30; cycle 3: 2 boss (median damage 2660, 0 marks, 0 silver), hunt points 30; cycle 4: 1 boss (median damage 2948, 1 marks, 1304.5760000000005 silver), hunt points 8; cycle 5: 1 boss (median damage 2878, 0 marks, 0 silver), hunt points 8; cycle 6: 3 boss (median damage 1428, 1 marks, 3354.6240000000007 silver), hunt points 24
- eventer mon sim-3: opened 51.00 h; 22 tokens spent; 39 open check-ins, 12 full bank, 35 blocked; first boss attempt 57.00 h, first boss defeated cycle 6, unlocked stoneback (cycle 6); cycle 1: 3 boss (median damage 1295, 0 marks, 0 silver), hunt points 22; cycle 2: 1 boss (median damage 446, 0 marks, 0 silver), hunt points 8; cycle 3: 2 boss (median damage 3967, 1 marks, 1118.2080000000003 silver), hunt points 30; cycle 4: 2 boss (median damage 4303, 1 marks, 1118.2080000000003 silver), hunt points 30; cycle 5: 1 boss (median damage 723, 0 marks, 0 silver), hunt points 8; cycle 6: 4 boss (median damage 3742, 2 marks, 4472.832000000001 silver), hunt points 24
- eventer mon sim-4: opened 48.00 h; 27 tokens spent; 45 open check-ins, 13 full bank, 42 blocked; first boss attempt 48.00 h, first boss defeated cycle 6, unlocked stoneback (cycle 5); cycle 1: 3 boss (median damage 964, 0 marks, 0 silver), hunt points 30; cycle 2: 1 boss (median damage 541, 0 marks, 0 silver), hunt points 8; cycle 3: 2 boss (median damage 2441, 0 marks, 0 silver), hunt points 30; cycle 4: 2 boss (median damage 2943, 1 marks, 1304.5760000000005 silver), hunt points 30; cycle 5: 4 boss (median damage 1950, 1 marks, 1304.5760000000005 silver), hunt points 24; cycle 6: 4 boss (median damage 2679, 2 marks, 4659.200000000001 silver), hunt points 44
- eventer mon sim-5: opened 51.00 h; 22 tokens spent; 39 open check-ins, 9 full bank, 35 blocked; first boss attempt 57.00 h, first boss defeated cycle 6, unlocked likho (cycle 4); cycle 1: 2 boss (median damage 3429, 0 marks, 0 silver), hunt points 44; cycle 2: 1 boss (median damage 1734, 1 marks, 1304.5760000000005 silver), hunt points 15; cycle 3: 2 boss (median damage 4044, 0 marks, 0 silver), hunt points 30; cycle 4: 2 boss (median damage 3050, 1 marks, 1304.5760000000005 silver), hunt points 11; cycle 5: 2 boss (median damage 2983, 1 marks, 1304.5760000000005 silver), hunt points 8; cycle 6: 4 boss (median damage 3197, 1 marks, 3354.6240000000007 silver), hunt points 30

## Orders (reported only; the Orderer)

- orderer mon sim-1: 8 Long Nights, 16 of 16 chapters (all by c5); third seat c5; silver from bounties 83%, provisions 19%; Delve floors counted for the Quenchers 74; stands with the Quenchers 1: mean Embers 382, mean Threat 22; without 7: mean Embers 363, mean Threat 21; seats by cycle c2 Thanes' Moot+Grey Wives, c3 Grey Wives+Bell-Watchers, c4 Thanes' Moot+Grey Wives, c5 Thanes' Moot+Grey Wives, c6 Thanes' Moot+Grey Wives+Bell-Watchers, c7 Thanes' Moot+Grey Wives+Bell-Watchers, c8 Thanes' Moot+Grey Wives+Bell-Watchers, c9 Thanes' Moot+Grey Wives+Bell-Watchers. Thanes' Moot: opened c1, chapter 1 10.00 h after opening; L1 c1 L2 c2 L3 c3 L4 c6; last chapter c5. Grey Wives: opened c1, chapter 1 77.50 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c2. Bell-Watchers: opened c1, chapter 1 2.40 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c2. the Quenchers: opened c5, chapter 1 3.65 h after opening; L1 c1 L2 c2 L3 c3 L4 c5; last chapter c5
- orderer mon sim-2: 8 Long Nights, 16 of 16 chapters (all by c5); third seat c5; silver from bounties 84%, provisions 20%; Delve floors counted for the Quenchers 60; stands with the Quenchers 1: mean Embers 323, mean Threat 20; without 7: mean Embers 399, mean Threat 18; seats by cycle c2 Thanes' Moot+Grey Wives, c3 Thanes' Moot+Bell-Watchers, c4 Thanes' Moot+Grey Wives, c5 Thanes' Moot+Grey Wives, c6 Thanes' Moot+Grey Wives+Bell-Watchers, c7 Thanes' Moot+Grey Wives+Bell-Watchers, c8 Thanes' Moot+Grey Wives+Bell-Watchers, c9 Thanes' Moot+Grey Wives+Bell-Watchers. Thanes' Moot: opened c1, chapter 1 10.00 h after opening; L1 c1 L2 c2 L3 c3 L4 c5; last chapter c5. Grey Wives: opened c1, chapter 1 77.50 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c3. Bell-Watchers: opened c1, chapter 1 2.40 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c2. the Quenchers: opened c5, chapter 1 3.65 h after opening; L1 c1 L2 c2 L3 c3 L4 c5; last chapter c5
- orderer mon sim-3: 8 Long Nights, 16 of 16 chapters (all by c5); third seat c5; silver from bounties 83%, provisions 16%; Delve floors counted for the Quenchers 60; stands with the Quenchers 2: mean Embers 394, mean Threat 15; without 6: mean Embers 362, mean Threat 22; seats by cycle c2 Thanes' Moot+Grey Wives, c3 Thanes' Moot+Grey Wives, c4 Thanes' Moot+Bell-Watchers, c5 Thanes' Moot+Grey Wives, c6 Thanes' Moot+Grey Wives+the Quenchers, c7 Thanes' Moot+Grey Wives+Bell-Watchers, c8 Thanes' Moot+Grey Wives+Bell-Watchers, c9 Thanes' Moot+Grey Wives+Bell-Watchers. Thanes' Moot: opened c1, chapter 1 10.00 h after opening; L1 c1 L2 c2 L3 c3 L4 c6; last chapter c5. Grey Wives: opened c1, chapter 1 75.00 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c3. Bell-Watchers: opened c1, chapter 1 2.40 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c3. the Quenchers: opened c5, chapter 1 2.30 h after opening; L1 c1 L2 c2 L3 c4 L4 c6; last chapter c5
- orderer mon sim-4: 8 Long Nights, 16 of 16 chapters (all by c5); third seat c5; silver from bounties 85%, provisions 15%; Delve floors counted for the Quenchers 60; stands with the Quenchers 1: mean Embers 372, mean Threat 20; without 7: mean Embers 364, mean Threat 21; seats by cycle c2 Thanes' Moot+Grey Wives, c3 Thanes' Moot+Bell-Watchers, c4 Thanes' Moot+Grey Wives, c5 Thanes' Moot+Grey Wives, c6 Thanes' Moot+Grey Wives+Bell-Watchers, c7 Thanes' Moot+Grey Wives+Bell-Watchers, c8 Thanes' Moot+Grey Wives+Bell-Watchers, c9 Thanes' Moot+Grey Wives+Bell-Watchers. Thanes' Moot: opened c1, chapter 1 10.00 h after opening; L1 c1 L2 c2 L3 c3 L4 c5; last chapter c5. Grey Wives: opened c1, chapter 1 53.50 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c3. Bell-Watchers: opened c1, chapter 1 2.40 h after opening; L1 c1 L2 c1 L3 c1 L4 c2; last chapter c2. the Quenchers: opened c5, chapter 1 3.30 h after opening; L1 c1 L2 c2 L3 c3 L4 c5; last chapter c5
- orderer mon sim-5: 8 Long Nights, 16 of 16 chapters (all by c5); third seat c5; silver from bounties 83%, provisions 17%; Delve floors counted for the Quenchers 60; stands with the Quenchers 1: mean Embers 366, mean Threat 17; without 7: mean Embers 392, mean Threat 20; seats by cycle c2 Thanes' Moot+Grey Wives, c3 Grey Wives+Bell-Watchers, c4 Thanes' Moot+Grey Wives, c5 Thanes' Moot+Grey Wives, c6 Thanes' Moot+Grey Wives+Bell-Watchers, c7 Thanes' Moot+Grey Wives+Bell-Watchers, c8 Thanes' Moot+Grey Wives+Bell-Watchers, c9 Thanes' Moot+Grey Wives+Bell-Watchers. Thanes' Moot: opened c1, chapter 1 10.00 h after opening; L1 c1 L2 c2 L3 c3 L4 c5; last chapter c5. Grey Wives: opened c1, chapter 1 77.50 h after opening; L1 c1 L2 c1 L3 c1 L4 c3; last chapter c2. Bell-Watchers: opened c1, chapter 1 2.40 h after opening; L1 c1 L2 c1 L3 c1 L4 c2; last chapter c2. the Quenchers: opened c5, chapter 1 2.15 h after opening; L1 c1 L2 c2 L3 c3 L4 c5; last chapter c5

## The Remembering (reported only; Standard)

- standard mon sim-1: names and stand: cycle 6, at 482.00 h; never within the run (8 Long Nights); at the end 40 of 40 names, 10 of 16 species Studied (missing: draugr, leshy, strzyga, gloam-moths, anvil-wight, rimewrought), Act VI's stand applied
- standard mon sim-2: names and stand: cycle 6, at 458.00 h; never within the run (8 Long Nights); at the end 40 of 40 names, 7 of 16 species Studied (missing: poludnitsa, vodyanoy, draugr, leshy, strzyga, nix, gloam-moths, anvil-wight, rimewrought), Act VI's stand applied
- standard mon sim-3: names and stand: cycle 6, at 446.00 h; never within the run (8 Long Nights); at the end 40 of 40 names, 9 of 16 species Studied (missing: poludnitsa, vodyanoy, draugr, leshy, strzyga, anvil-wight, rimewrought), Act VI's stand applied
- standard mon sim-4: names and stand: cycle 7, at 486.00 h; never within the run (8 Long Nights); at the end 40 of 40 names, 10 of 16 species Studied (missing: draugr, bies, leshy, strzyga, anvil-wight, rimewrought), Act VI's stand applied
- standard mon sim-5: names and stand: cycle 6, at 446.00 h; never within the run (8 Long Nights); at the end 40 of 40 names, 10 of 16 species Studied (missing: draugr, leshy, strzyga, nix, anvil-wight, rimewrought), Act VI's stand applied
- standard sat sim-1: names and stand: never; never within the run (4 Long Nights); at the end 33 of 40 names, 5 of 16 species Studied (missing: upyr, rusalka, poludnitsa, draugr, bies, leshy, strzyga, nix, gloam-moths, anvil-wight, rimewrought), Act VI's stand not applied
- standard sat sim-2: names and stand: never; never within the run (4 Long Nights); at the end 33 of 40 names, 6 of 16 species Studied (missing: upyr, poludnitsa, vodyanoy, draugr, leshy, strzyga, nix, gloam-moths, anvil-wight, rimewrought), Act VI's stand not applied
- standard sat sim-3: names and stand: never; never within the run (4 Long Nights); at the end 35 of 40 names, 5 of 16 species Studied (missing: poludnitsa, vodyanoy, draugr, bies, leshy, strzyga, huldra, nix, gloam-moths, anvil-wight, rimewrought), Act VI's stand not applied
- standard sat sim-4: names and stand: never; never within the run (4 Long Nights); at the end 32 of 40 names, 6 of 16 species Studied (missing: rusalka, vodyanoy, draugr, bies, leshy, strzyga, nix, gloam-moths, anvil-wight, rimewrought), Act VI's stand not applied
- standard sat sim-5: names and stand: never; never within the run (3 Long Nights); at the end 33 of 40 names, 6 of 16 species Studied (missing: rusalka, poludnitsa, vodyanoy, draugr, leshy, strzyga, nix, gloam-moths, anvil-wight, rimewrought), Act VI's stand not applied
- Monday median cycle, names and Act VI's stand: 6 (cycles 6, 6, 6, 6, 7)
- Monday median cycle, ending choosable: never (5 seeds, 5 never)

## All content (reported only; the Idle-only row judges the medians)

- standard mon sim-1: all content at 411.00 h (last: D5-06)
- standard mon sim-2: all content at 387.00 h (last: D5-06)
- standard mon sim-3: all content at 384.00 h (last: D5-06)
- standard mon sim-4: all content at 482.70 h (last: D2-06)
- standard mon sim-5: all content at 387.00 h (last: D5-06)
- standard sat sim-1: all content at never (last: D5-02)
- standard sat sim-2: all content at never (last: D5-03)
- standard sat sim-3: all content at never (last: D5-04)
- standard sat sim-4: all content at never (last: D2-04)
- standard sat sim-5: all content at never (last: D4-06)
- delver mon sim-1: all content at 384.00 h (last: D5-06)
- delver mon sim-2: all content at 384.00 h (last: D5-06)
- delver mon sim-3: all content at 408.00 h (last: D5-06)
- delver mon sim-4: all content at 414.20 h (last: D2-06)
- delver mon sim-5: all content at 374.00 h (last: D5-06)

## Times to each moment (median over seeds)

| Run | first-cottage | first-mine | mill-3 | peasants-10 | keep | first-contract | roster-4 | first-tier-3 | hunters-lodge | first-identified | first-studied | citadel | bastion | best-last-stand | first-long-night | first-ruin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| opening/mon | 0.0 min | 4.5 min | 3.00 h | 3.00 h | 14.00 h | 6.0 min | 27.00 h | 40.00 h | 14.00 h | 14.48 h | 30.00 h | 48.00 h | 96.00 h | 96.00 h | 101.50 h | 28.00 h |
| opening/sat | 0.0 min | 4.5 min | 4.00 h | 4.00 h | 24.00 h | 6.0 min | 32.00 h | 51.00 h | 24.00 h | 24.48 h | 33.00 h | 70.00 h | 94.00 h | 94.00 h | 99.50 h | 47.00 h |
| standard/mon | 0.0 min | 4.5 min | 3.00 h | 3.00 h | 14.00 h | 6.0 min | 27.00 h | 40.00 h | 14.00 h | 14.48 h | 30.00 h | 48.00 h | 96.00 h | 96.00 h | 101.50 h | 28.00 h |
| standard/sat | 0.0 min | 4.5 min | 4.00 h | 4.00 h | 24.00 h | 6.0 min | 32.00 h | 51.00 h | 24.00 h | 24.48 h | 33.00 h | 70.00 h | 94.00 h | 94.00 h | 99.50 h | 47.00 h |
| light/mon | 0.0 min | 5.50 h | 14.00 h | 5.53 h | 24.00 h | 14.00 h | 48.00 h | 64.00 h | 29.50 h | 30.46 h | 72.50 h | 62.00 h | 110.00 h | 120.00 h | 134.00 h | 64.00 h |
| light/sat | 0.0 min | 3.50 h | 12.00 h | 3.53 h | 27.50 h | 12.00 h | 46.00 h | 62.00 h | 27.50 h | 28.46 h | 70.50 h | 70.00 h | 99.50 h | 108.00 h | 118.00 h | 61.00 h |
| heavy/mon | 0.0 min | 2.00 h | 4.00 h | 2.03 h | 14.00 h | 4.00 h | 24.00 h | 30.00 h | 14.00 h | 14.48 h | 17.00 h | 48.00 h | 72.00 h | 72.00 h | 76.00 h | 25.00 h |
| heavy/sat | 0.0 min | 2.00 h | 4.00 h | 2.03 h | 14.00 h | 4.00 h | 24.00 h | 36.00 h | 14.00 h | 14.48 h | 23.00 h | 46.00 h | 86.00 h | 86.00 h | 96.00 h | 25.00 h |
| delver/mon | 0.0 min | 4.5 min | 3.00 h | 3.00 h | 14.00 h | 6.0 min | 27.00 h | 40.00 h | 14.00 h | 14.48 h | 30.00 h | 48.00 h | 96.00 h | 99.00 h | 101.50 h | 28.00 h |
| eventer/mon | 0.0 min | 4.5 min | 3.00 h | 3.00 h | 14.00 h | 6.0 min | 27.00 h | 40.00 h | 14.00 h | 14.48 h | 30.00 h | 48.00 h | 96.00 h | 96.00 h | 101.50 h | 28.00 h |
| orderer/mon | 0.0 min | 4.5 min | 3.00 h | 3.00 h | 14.00 h | 6.0 min | 27.00 h | 40.00 h | 14.00 h | 14.46 h | 30.00 h | 48.00 h | 86.00 h | 96.00 h | 101.50 h | 28.00 h |

## Income and peaks (first seed of each run)

| Run | food made | wood made | iron made | silver made | peak peasants | largest number |
|---|---|---|---|---|---|---|
| opening/mon | 2.75e+7 | 1.52e+7 | 2.89e+6 | 3.87e+4 | 75 | 1.71e+12 |
| opening/sat | 2.98e+7 | 1.31e+7 | 3.15e+6 | 4.08e+4 | 78 | 1.71e+12 |
| standard/mon | 6.02e+7 | 3.13e+7 | 8.04e+6 | 7.97e+4 | 76 | 1.71e+12 |
| standard/sat | 2.98e+7 | 1.31e+7 | 3.15e+6 | 4.08e+4 | 78 | 1.71e+12 |
| light/mon | 3.52e+7 | 1.31e+7 | 3.78e+6 | 3.71e+4 | 78 | 1.71e+12 |
| light/sat | 3.70e+7 | 1.17e+7 | 3.28e+6 | 3.73e+4 | 79 | 1.71e+12 |
| heavy/mon | 3.11e+7 | 1.34e+7 | 4.23e+6 | 5.01e+4 | 74 | 1.71e+12 |
| heavy/sat | 2.93e+7 | 1.30e+7 | 4.72e+6 | 4.76e+4 | 73 | 1.71e+12 |
| delver/mon | 3.81e+7 | 1.57e+7 | 4.21e+6 | 4.26e+4 | 77 | 1.71e+12 |
| eventer/mon | 4.19e+7 | 2.13e+7 | 5.96e+6 | 5.92e+4 | 75 | 1.71e+12 |
| orderer/mon | 5.52e+7 | 3.08e+7 | 7.86e+6 | 7.79e+4 | 75 | 1.71e+12 |

## Against the baseline

Baseline: milestone v0.11, rulesVersion 5.

| Run | Moment | Baseline | Now | Change |
|---|---|---|---|---|
| opening/mon | first-cottage | 0.0 min | 0.0 min | same |
| opening/mon | first-mine | 4.5 min | 4.5 min | same |
| opening/mon | mill-3 | 3.00 h | 3.00 h | same |
| opening/mon | peasants-10 | 3.00 h | 3.00 h | same |
| opening/mon | keep | 14.00 h | 14.00 h | same |
| opening/mon | first-contract | 6.0 min | 6.0 min | same |
| opening/mon | roster-4 | 27.00 h | 27.00 h | same |
| opening/mon | first-tier-3 | 40.00 h | 40.00 h | same |
| opening/mon | hunters-lodge | 14.00 h | 14.00 h | same |
| opening/mon | first-identified | 14.48 h | 14.48 h | same |
| opening/mon | first-studied | 30.00 h | 30.00 h | same |
| opening/mon | citadel | 48.00 h | 48.00 h | same |
| opening/mon | bastion | 96.00 h | 96.00 h | same |
| opening/mon | best-last-stand | 96.00 h | 96.00 h | same |
| opening/mon | first-long-night | 101.50 h | 101.50 h | same |
| opening/mon | first-ruin | 28.00 h | 28.00 h | same |
| opening/sat | first-cottage | 0.0 min | 0.0 min | same |
| opening/sat | first-mine | 4.5 min | 4.5 min | same |
| opening/sat | mill-3 | 4.00 h | 4.00 h | same |
| opening/sat | peasants-10 | 4.00 h | 4.00 h | same |
| opening/sat | keep | 24.00 h | 24.00 h | same |
| opening/sat | first-contract | 6.0 min | 6.0 min | same |
| opening/sat | roster-4 | 32.00 h | 32.00 h | same |
| opening/sat | first-tier-3 | 51.00 h | 51.00 h | same |
| opening/sat | hunters-lodge | 24.00 h | 24.00 h | same |
| opening/sat | first-identified | 24.48 h | 24.48 h | same |
| opening/sat | first-studied | 33.00 h | 33.00 h | same |
| opening/sat | citadel | 70.00 h | 70.00 h | same |
| opening/sat | bastion | 94.00 h | 94.00 h | same |
| opening/sat | best-last-stand | 94.00 h | 94.00 h | same |
| opening/sat | first-long-night | 99.50 h | 99.50 h | same |
| opening/sat | first-ruin | 47.00 h | 47.00 h | same |
| standard/mon | first-cottage | 0.0 min | 0.0 min | same |
| standard/mon | first-mine | 4.5 min | 4.5 min | same |
| standard/mon | mill-3 | 3.00 h | 3.00 h | same |
| standard/mon | peasants-10 | 3.00 h | 3.00 h | same |
| standard/mon | keep | 14.00 h | 14.00 h | same |
| standard/mon | first-contract | 6.0 min | 6.0 min | same |
| standard/mon | roster-4 | 27.00 h | 27.00 h | same |
| standard/mon | first-tier-3 | 40.00 h | 40.00 h | same |
| standard/mon | hunters-lodge | 14.00 h | 14.00 h | same |
| standard/mon | first-identified | 14.48 h | 14.48 h | same |
| standard/mon | first-studied | 30.00 h | 30.00 h | same |
| standard/mon | citadel | 48.00 h | 48.00 h | same |
| standard/mon | bastion | 96.00 h | 96.00 h | same |
| standard/mon | best-last-stand | 96.00 h | 96.00 h | same |
| standard/mon | first-long-night | 101.50 h | 101.50 h | same |
| standard/mon | first-ruin | 28.00 h | 28.00 h | same |
| standard/sat | first-cottage | 0.0 min | 0.0 min | same |
| standard/sat | first-mine | 4.5 min | 4.5 min | same |
| standard/sat | mill-3 | 4.00 h | 4.00 h | same |
| standard/sat | peasants-10 | 4.00 h | 4.00 h | same |
| standard/sat | keep | 24.00 h | 24.00 h | same |
| standard/sat | first-contract | 6.0 min | 6.0 min | same |
| standard/sat | roster-4 | 32.00 h | 32.00 h | same |
| standard/sat | first-tier-3 | 51.00 h | 51.00 h | same |
| standard/sat | hunters-lodge | 24.00 h | 24.00 h | same |
| standard/sat | first-identified | 24.48 h | 24.48 h | same |
| standard/sat | first-studied | 33.00 h | 33.00 h | same |
| standard/sat | citadel | 70.00 h | 70.00 h | same |
| standard/sat | bastion | 94.00 h | 94.00 h | same |
| standard/sat | best-last-stand | 94.00 h | 94.00 h | same |
| standard/sat | first-long-night | 99.50 h | 99.50 h | same |
| standard/sat | first-ruin | 47.00 h | 47.00 h | same |
| light/mon | first-cottage | 0.0 min | 0.0 min | same |
| light/mon | first-mine | 5.50 h | 5.50 h | same |
| light/mon | mill-3 | 14.00 h | 14.00 h | same |
| light/mon | peasants-10 | 5.53 h | 5.53 h | same |
| light/mon | keep | 24.00 h | 24.00 h | same |
| light/mon | first-contract | 14.00 h | 14.00 h | same |
| light/mon | roster-4 | 48.00 h | 48.00 h | same |
| light/mon | first-tier-3 | 64.00 h | 64.00 h | same |
| light/mon | hunters-lodge | 29.50 h | 29.50 h | same |
| light/mon | first-identified | 30.46 h | 30.46 h | same |
| light/mon | first-studied | 72.50 h | 72.50 h | same |
| light/mon | citadel | 62.00 h | 62.00 h | same |
| light/mon | bastion | 110.00 h | 110.00 h | same |
| light/mon | best-last-stand | 120.00 h | 120.00 h | same |
| light/mon | first-long-night | 134.00 h | 134.00 h | same |
| light/mon | first-ruin | 64.00 h | 64.00 h | same |
| light/sat | first-cottage | 0.0 min | 0.0 min | same |
| light/sat | first-mine | 3.50 h | 3.50 h | same |
| light/sat | mill-3 | 12.00 h | 12.00 h | same |
| light/sat | peasants-10 | 3.53 h | 3.53 h | same |
| light/sat | keep | 27.50 h | 27.50 h | same |
| light/sat | first-contract | 12.00 h | 12.00 h | same |
| light/sat | roster-4 | 46.00 h | 46.00 h | same |
| light/sat | first-tier-3 | 62.00 h | 62.00 h | same |
| light/sat | hunters-lodge | 27.50 h | 27.50 h | same |
| light/sat | first-identified | 28.46 h | 28.46 h | same |
| light/sat | first-studied | 70.50 h | 70.50 h | same |
| light/sat | citadel | 70.00 h | 70.00 h | same |
| light/sat | bastion | 99.50 h | 99.50 h | same |
| light/sat | best-last-stand | 108.00 h | 108.00 h | same |
| light/sat | first-long-night | 118.00 h | 118.00 h | same |
| light/sat | first-ruin | 61.00 h | 61.00 h | same |
| heavy/mon | first-cottage | 0.0 min | 0.0 min | same |
| heavy/mon | first-mine | 2.00 h | 2.00 h | same |
| heavy/mon | mill-3 | 4.00 h | 4.00 h | same |
| heavy/mon | peasants-10 | 2.03 h | 2.03 h | same |
| heavy/mon | keep | 14.00 h | 14.00 h | same |
| heavy/mon | first-contract | 4.00 h | 4.00 h | same |
| heavy/mon | roster-4 | 24.00 h | 24.00 h | same |
| heavy/mon | first-tier-3 | 30.00 h | 30.00 h | same |
| heavy/mon | hunters-lodge | 14.00 h | 14.00 h | same |
| heavy/mon | first-identified | 14.48 h | 14.48 h | same |
| heavy/mon | first-studied | 17.00 h | 17.00 h | same |
| heavy/mon | citadel | 48.00 h | 48.00 h | same |
| heavy/mon | bastion | 72.00 h | 72.00 h | same |
| heavy/mon | best-last-stand | 72.00 h | 72.00 h | same |
| heavy/mon | first-long-night | 76.00 h | 76.00 h | same |
| heavy/mon | first-ruin | 25.00 h | 25.00 h | same |
| heavy/sat | first-cottage | 0.0 min | 0.0 min | same |
| heavy/sat | first-mine | 2.00 h | 2.00 h | same |
| heavy/sat | mill-3 | 4.00 h | 4.00 h | same |
| heavy/sat | peasants-10 | 2.03 h | 2.03 h | same |
| heavy/sat | keep | 14.00 h | 14.00 h | same |
| heavy/sat | first-contract | 4.00 h | 4.00 h | same |
| heavy/sat | roster-4 | 24.00 h | 24.00 h | same |
| heavy/sat | first-tier-3 | 36.00 h | 36.00 h | same |
| heavy/sat | hunters-lodge | 14.00 h | 14.00 h | same |
| heavy/sat | first-identified | 14.48 h | 14.48 h | same |
| heavy/sat | first-studied | 23.00 h | 23.00 h | same |
| heavy/sat | citadel | 46.00 h | 46.00 h | same |
| heavy/sat | bastion | 86.00 h | 86.00 h | same |
| heavy/sat | best-last-stand | 86.00 h | 86.00 h | same |
| heavy/sat | first-long-night | 96.00 h | 96.00 h | same |
| heavy/sat | first-ruin | 25.00 h | 25.00 h | same |
| delver/mon | first-cottage | 0.0 min | 0.0 min | same |
| delver/mon | first-mine | 4.5 min | 4.5 min | same |
| delver/mon | mill-3 | 3.00 h | 3.00 h | same |
| delver/mon | peasants-10 | 3.00 h | 3.00 h | same |
| delver/mon | keep | 14.00 h | 14.00 h | same |
| delver/mon | first-contract | 6.0 min | 6.0 min | same |
| delver/mon | roster-4 | 27.00 h | 27.00 h | same |
| delver/mon | first-tier-3 | 40.00 h | 40.00 h | same |
| delver/mon | hunters-lodge | 14.00 h | 14.00 h | same |
| delver/mon | first-identified | 14.48 h | 14.48 h | same |
| delver/mon | first-studied | 30.00 h | 30.00 h | same |
| delver/mon | citadel | 48.00 h | 48.00 h | same |
| delver/mon | bastion | 96.00 h | 96.00 h | same |
| delver/mon | best-last-stand | 99.00 h | 99.00 h | same |
| delver/mon | first-long-night | 101.50 h | 101.50 h | same |
| delver/mon | first-ruin | 28.00 h | 28.00 h | same |
| eventer/mon | first-cottage | 0.0 min | 0.0 min | same |
| eventer/mon | first-mine | 4.5 min | 4.5 min | same |
| eventer/mon | mill-3 | 3.00 h | 3.00 h | same |
| eventer/mon | peasants-10 | 3.00 h | 3.00 h | same |
| eventer/mon | keep | 14.00 h | 14.00 h | same |
| eventer/mon | first-contract | 6.0 min | 6.0 min | same |
| eventer/mon | roster-4 | 27.00 h | 27.00 h | same |
| eventer/mon | first-tier-3 | 40.00 h | 40.00 h | same |
| eventer/mon | hunters-lodge | 14.00 h | 14.00 h | same |
| eventer/mon | first-identified | 14.48 h | 14.48 h | same |
| eventer/mon | first-studied | 30.00 h | 30.00 h | same |
| eventer/mon | citadel | 48.00 h | 48.00 h | same |
| eventer/mon | bastion | 96.00 h | 96.00 h | same |
| eventer/mon | best-last-stand | 96.00 h | 96.00 h | same |
| eventer/mon | first-long-night | 101.50 h | 101.50 h | same |
| eventer/mon | first-ruin | 28.00 h | 28.00 h | same |
| orderer/mon | first-cottage | 0.0 min | 0.0 min | same |
| orderer/mon | first-mine | 4.5 min | 4.5 min | same |
| orderer/mon | mill-3 | 3.00 h | 3.00 h | same |
| orderer/mon | peasants-10 | 3.00 h | 3.00 h | same |
| orderer/mon | keep | 14.00 h | 14.00 h | same |
| orderer/mon | first-contract | 6.0 min | 6.0 min | same |
| orderer/mon | roster-4 | 27.00 h | 27.00 h | same |
| orderer/mon | first-tier-3 | 40.00 h | 40.00 h | same |
| orderer/mon | hunters-lodge | 14.00 h | 14.00 h | same |
| orderer/mon | first-identified | 14.46 h | 14.46 h | same |
| orderer/mon | first-studied | 30.00 h | 30.00 h | same |
| orderer/mon | citadel | 48.00 h | 48.00 h | same |
| orderer/mon | bastion | 86.00 h | 86.00 h | same |
| orderer/mon | best-last-stand | 96.00 h | 96.00 h | same |
| orderer/mon | first-long-night | 101.50 h | 101.50 h | same |
| orderer/mon | first-ruin | 28.00 h | 28.00 h | same |
