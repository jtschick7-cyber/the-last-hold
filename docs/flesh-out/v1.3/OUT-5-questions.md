# OUT-5 — Edits to `docs/questions.md` (v1.3 flesh-out, 2026-10-24)

This file is an **append**, not a Find / Replace, so there is nothing to match. Add the text below to the very end of `docs/questions.md`, with one blank line before it.

Q53–Q55 are already answered or resolved in the Project's copy of `docs/questions.md` (the owner's picks, 610,508 bytes, the iPhone playtest), so nothing is closed here.

**Append at the end of the file:**

````markdown

## v1.3 questions *(from the v1.3 flesh-out, 2026-10-24)*

### Q57 — Steady additive steps or compounding steps? *(opened 2026-10-24; answered after KV.8 reports the curve, before KV.9)*
- **Context:** you chose "steady steps and no ceiling" (D539, D540). The wave strength is `1 + 0.0061 × Threat + s × level`. Each level adds the **same amount** to that number, so each new level is a **smaller percentage jump** than the last, and the **waves held fall more slowly** as the level climbs: about one wave lost at level 1, less at level 6, still less later (roughly logarithmic; my estimate, not measured). The strength never stops rising, but a player who just keeps switching it On will see the *waves held* drop in smaller and smaller steps.
- **Question:** is that the feel you want, or should each level be the **same percentage** harder than the one before (compounding, `intPow(1 + s, level)`, which loses about one wave at every level)?
- **Options:** (a) keep steady additive steps, as chosen (recommended until the numbers are in); (b) compounding steps. There is no "decide after the playtest": switching after any vigil stand has been recorded in a save changes how those stands replay, which is a combat math change (a `rulesVersion` bump or a formula id on the record).
- **Recommendation:** (a) for now. KV.8 measures waves held and Embers for every level on the simulator probe, for both steps, at two Threat points, and reports the curve; you answer after seeing the numbers and before KV.9. Switching to (b) at that point changes one formula and one constant (it needs a new decisions row).
- **Blocks:** KV.9. **Answer (owner):** *(pending; asked with the curve after KV.8)*

### Q58 — The simulated Vigilant opens the gate with a debug shortcut *(opened 2026-10-24; answered at the docs commit, D551)*
- **Context:** the simulated Standard player never makes the ending choosable (Q45, D469): it does not look for the contract species it lacks. So the new player, the Vigilant, cannot play to the gate honestly. To test the vigil mechanics at all, it plays like Standard to Act VI's stand and then calls the debug command `debug.remembering.openGate()` once (D462), which marks the run as `debugUsed`. The report says so.
- **What this does and does not prove:** it proves the switch, the levels, the saves and the difficulty curve behave. It does **not** prove a real player reaches the gate; the existing reachability row already covers names and Act VI's stand (the species half is covered by a content test).
- **A second change from what you approved:** you approved the probe "in the fast set". The fast set is inside `npm run check`, which already takes 86–95 s against a 90 s warning and a 120 s failure. The plan therefore judges the probe in `sim.yml` only (the D464 pattern), unless CI `check` stays at 90 s or less on 3 runs with it in (KV.8 measures).
- **Options:** (a) accept both (recommended); (b) keep the probe in the fast set regardless and move something else out (a different tradeoff, needs a new row); (c) write a second simulated player that really studies every species to reach the gate (a bigger shard, likely over the 4-minute stop-and-ask).
- **Recommendation:** (a).
- **Answer (owner):** *(pending; part of the yes at D551)*
````
