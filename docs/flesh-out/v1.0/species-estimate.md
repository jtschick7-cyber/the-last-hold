# Study all 16 species: the report-only estimate (v1.0 TV.11, D478, D485 (4), Q46)

Played 2026-10-22, 5 Monday seeds (sim-1 to sim-5), up to 25 cycles, once, locally, by `sim/species-variant.ts`. Not part of `sim.yml`, the baseline or `sim/targets.ts`; nothing here is a row.

Standard plus one rule: among the contracts whose tier is within one of the tier Standard would pick, take the one whose species is not yet Studied (ties in Standard's order), else Standard's choice. **A** sees each contract's true species; **B** sees only the candidate list a player sees (a contract counts as unstudied if any candidate is). The control is plain Standard.

A cycle is counted as the one the check-in began in. Days are game days from the start. The owner's own estimate of about 20 cycles includes the early cycles of their own save, and a real player does not play Standard's schedule; read these as a floor, not a forecast.

| Player | Seed | All 16 Studied | 40 names and Act VI's stand | Ending choosable |
|---|---|---|---|---|
| Standard (control) | 1 | not in 25 cycles | cycle 6, day 20.1 | not in 25 cycles |
| Standard (control) | 2 | not in 25 cycles | cycle 6, day 19.1 | not in 25 cycles |
| Standard (control) | 3 | not in 25 cycles | cycle 6, day 18.6 | not in 25 cycles |
| Standard (control) | 4 | not in 25 cycles | cycle 7, day 20.3 | not in 25 cycles |
| Standard (control) | 5 | not in 25 cycles | cycle 6, day 18.6 | not in 25 cycles |
| A: best case (true species) | 1 | not in 25 cycles | cycle 6, day 19.1 | not in 25 cycles |
| A: best case (true species) | 2 | not in 25 cycles | cycle 6, day 19.3 | not in 25 cycles |
| A: best case (true species) | 3 | not in 25 cycles | cycle 6, day 18.6 | not in 25 cycles |
| A: best case (true species) | 4 | not in 25 cycles | cycle 7, day 20.3 | not in 25 cycles |
| A: best case (true species) | 5 | not in 25 cycles | cycle 6, day 18.6 | not in 25 cycles |
| B: realistic (candidate list) | 1 | not in 25 cycles | cycle 6, day 19.1 | not in 25 cycles |
| B: realistic (candidate list) | 2 | not in 25 cycles | cycle 6, day 18.4 | not in 25 cycles |
| B: realistic (candidate list) | 3 | not in 25 cycles | cycle 6, day 18.4 | not in 25 cycles |
| B: realistic (candidate list) | 4 | not in 25 cycles | cycle 6, day 19.1 | not in 25 cycles |
| B: realistic (candidate list) | 5 | not in 25 cycles | cycle 6, day 18.6 | not in 25 cycles |

| Player | Median cycle, all 16 Studied | Median cycle, names and stand | Median cycle, ending choosable | Seeds that got there |
|---|---|---|---|---|
| Standard (control) | n/a | 6 | n/a | 0 of 5 |
| A: best case (true species) | n/a | 6 | n/a | 0 of 5 |
| B: realistic (candidate list) | n/a | 6 | n/a | 0 of 5 |

Total run time 17.3 minutes.

## What the runs show

- **Nobody reaches all 16 species Studied in 25 cycles (about 60 game days), not even the best case.** The names and Act VI's stand arrive at cycle 6 or 7 in every run, matching the D470 measurement (6, 6, 6, 6, 7), so the species half of the gate is the whole wait.
- **The rule did not help.** A and B are no faster than plain Standard (the control).
- **A one-seed look (sim-1, run once after the table; not repeated across seeds):** Standard has 3 species Studied by day 10 (cycle 3), 10 by day 20 (cycle 7), then stalls at 10 to 12 through cycle 26. Never Studied by then: Draugr, Leshy, Strzyga and Rimewrought (all four only Identified, level 2; Strzyga only level 1 in A). The best case ends no better.
- **So the wait is not about choosing which contract to take.** It looks like those four species rarely or never come up on the board to be fought and Studied, or are only seen at tiers Standard does not send to. This is a reading from one seed, not a measured cause; it needs a look at where those four appear before any fix is chosen.
- **Run time:** 17.3 minutes for 15 runs, more than the 10 minutes D485 (4) allows, so the work stopped for the owner. The table above has no species-count column; a rerun with it would take about as long.
