# OUT-2a — Edits to `docs/gdd.md` (v1.3 "Keep the Vigil", D538–D551)

Every **Find** below (23 of them, in 18 numbered edits) was **machine-checked on 2026-10-24 against the Project's copy of `docs/gdd.md` and occurs exactly once** in it (the check counted occurrences of each Find string, including line breaks). **If one does not match exactly once in the repo's copy, stop and tell the owner.** Edits are in document order. Edit 3 inserts the new §5.9.10, edit 13 the new §7.13 and edit 16 the new §9.23.

New backticked keys in §7.13 (`vigil.strengthPerLevel`, `vigil.embersPerLevel`) must be added to `src/content/balance.ts` in the same commit that applies this file's §7 edits, or the GDD §7 keys test fails in both directions (technical design §5.1). They are marked **tunable**; neither is a locked constant.

## 1 — §3 loop table: add v1.3

**Find:**
```markdown
| v1.2 | Sounds of the Frontier: seven short sound effects for the big moments, off by default (§9.22) |
```

**Replace with:**
```markdown
| v1.2 | Sounds of the Frontier: seven short sound effects for the big moments, off by default (§9.22) |
| v1.3 | Keep the Vigil: Rising Vigil, an optional On / Off switch on the Last Stand screen that makes stands harder, one step more each time, once the Remembering gate is open (§5.9.10, §9.23) |
```

## 2 — §5.9.3 The Last Stand: a pointer from the wave rules

**Find:**
```markdown
  - Threat makes every wave stronger (§5.9.1).
```

**Replace with:**
```markdown
  - Threat makes every wave stronger (§5.9.1).
  - **From v1.3, once the Remembering gate is open (D539),** the player may switch on **Rising Vigil**, which makes every wave stronger by a further step per level (§5.9.10). With the switch Off, nothing here changes.
```

## 3 — New §5.9.10 Rising Vigil, before §5.10

**Find:**
```markdown
### 5.10 Delves *(v0.7; ⚑ v0.7 flesh-out, D244–D272)*
```

**Replace with:**
````markdown
#### 5.9.10 Rising Vigil *(v1.3; ⚑ v1.3 flesh-out, D538–D551)*

An optional switch for a player who has finished the story and wants harder stands. It is the rising difficulty that Keep the Vigil left for later (D453, D477, D499). Nothing here is needed to finish the game, and no stand fought before the gate is open changes.

- **Availability (D539).** The switch is on the Last Stand screen (§9.23) and is shown **only when the Remembering gate is open** (`endingChoosable`, §5.15.1: 40 names found, every contract species Studied, Act VI's stand applied). It stays available after Remember Them. **Keep the Vigil on the ending card still plays R-10 once and changes nothing** (§5.15.3); it does not turn Rising Vigil on. While the gate is closed the stand screen is exactly as before.
- **The level (D539).** A stand's level `L` is the number of stands already fought with the switch On, **plus one** for the stand being started. The first On stand is level 1. A level counts **only when a stand is started with the switch On.** With the switch Off the stand is an ordinary stand (level 0, the old rules to the last digit), and the level is **kept**: the next On stand carries on from where the last On stand left off. The switch stays as the player left it across the Long Night. There is no cap and no end.
- **What a level does to the waves (D540).** One lever only: the Health and Might of every wave.

  ```
  waveFactor = 1 + 0.0061 × Threat + s × L            (Health and Might of every wave; 0.0061 is threat.waveStrengthPerPoint)
  ```

  `s` is `vigil.strengthPerLevel` (§7.13, tunable). **The wave list, the tiers, Armor, the Watchtower, Walls, bombs, the party and the 400-tick limit do not change.** The step is the same at every level (steady, additive). **Target (owner): about one wave fewer held per level, measured on the simulated Vigilant's gate-open stand** (the Standard player never opens the gate, so it cannot be the reference). The value of `s` is measured in KV.8 on the simulator probe, chosen in KV.9 by the rule in §6.2 and approved by the owner. The Threat part and the level part add; they do not multiply each other.
- **What a level does to the Embers (D541).**

  ```
  Embers = floor( rankMult × wavesPart × (1 + 0.007 × Threat + e × L)  +  1 × trophies earned this cycle )
  ```

  `e` is `vigil.embersPerLevel` (§7.13, tunable). **Target (owner): at levels 1 to 3 a stand pays about as many total Embers (waves part plus trophies) as a level 0 stand** (the bonus makes up for the wave the level costs). The term multiplies the waves part only, not the trophies. The breakdown of the Embers (§5.0, §5.9.4) gets a "Rising Vigil" line, in additive terms that add up with the Threat line, from the same function that builds the number.
- **When the stand starts (D544).** The command that starts the stand reads the switch. With the gate open and the switch On it fixes `L = stands + 1`, adds 1 to the count of stands fought On, and saves the level with the stand's saved inputs (`vigilLevel`, the same record that holds `standPool`; technical design §21). The stand's saved inputs carry it, so **a wave log rebuilt later uses the same strength, and every earlier stand, golden fight and recorded fight replays line for line** (`rulesVersion` stays 5, D542). The switch can be flipped any time before the stand starts; a flip needs no confirmation, Start is the final step (§5.9.3).
- **The preview (D544).** Expected waves, the Embers now (with the breakdown) and the estimate of tomorrow's Embers are worked out again when the switch flips, with the level the stand would have. The labels for the estimate do not change.
- **The Roll of Wardens (D545).** A warden whose stand was fought at level 1 or more has, beside the stand's band, a small mark drawn in code and the line *"Rising Vigil, level N."* No story text, no new picture file.
- **What it never touches (D539).** Contracts, Delves, events, Threat rates, the band thresholds (Broken ≤ 11, Held 12–14, Triumphant ≥ 15), the relic milestones (`relics.waveMilestones`), Orders standing sources, trust and the Remembering's records. A Triumphant stand at any level counts for trust and Orders standing as a Triumphant stand does today (D549 (7)).
- **Honest limits.** (1) A steady additive step means each new level costs fewer waves than the one before (the waves held fall more slowly as the level climbs, though the strength never stops rising); a compounding step is the alternative (Q57, answered before KV.9). (2) Embers have a finite use: warden upgrades have maximum levels and stars stop at 5, so once those are bought, extra Embers buy nothing. Rising Vigil is a challenge, not a reward track (D541). (3) Fewer waves held means fewer Triumphant stands (15 or more). A Triumphant stand is worth 10 contracts of trust for every village (§5.14.8) and `orders.triumphantChunk` of standing for every Order (§5.13.2), so a player whose trust or Orders are not full is slowed by a high level (D549 (10)). (4) Command skill XP is earned per wave held, so fewer waves means less of it. (5) The vigil term does not grow with Threat, so it matters less the later in the cycle the stand is fought. (6) Fixed-damage sources (the Watchtower's volley, bombs) get relatively weaker, and the Dross-Tide's hit-everyone effect relatively stronger. (7) Each stand fought On adds about 16 bytes to the save, for ever, since there is no cap. (8) If the pinned contract-species list ever changes (D461) the gate could close; the row then hides with the switch still On, which is harmless (level 0).
- **The simulator (D546).** A probe runs a throwaway stand at levels 0 to N; one player, the Vigilant, plays three endless cycles (§6.1, §6.2). Every other player never touches the switch, so their reports do not change.

### 5.10 Delves *(v0.7; ⚑ v0.7 flesh-out, D244–D272)*
````

## 4 — §5.9.4 Embers: the formula and a bullet

**Find:**
```markdown
Embers    = floor( rankMult × wavesPart × (1 + 0.007 × Threat)  +  1 × trophies earned this cycle )
```

**Replace with:**
```markdown
Embers    = floor( rankMult × wavesPart × (1 + 0.007 × Threat + e × L)  +  1 × trophies earned this cycle )
```

**And find:**
```markdown
- In normal play the stand is only open in Bastion, so `rankMult` is 1. The lower values matter only for the arrival (§5.9.8).
```

**Replace with:**
```markdown
- In normal play the stand is only open in Bastion, so `rankMult` is 1. The lower values matter only for the arrival (§5.9.8).
- `L` is the stand's Rising Vigil level (§5.9.10): **0** unless the Remembering gate is open and the switch was On when the stand started, so every stand before v1.3, and every stand with the switch Off, pays exactly as before. `e` is `vigil.embersPerLevel` (§7.13).
```

## 5 — §5.9.7 what's kept: the vigil

**Find:**
```markdown
| | The Hold's layout blueprint: placed coordinates for every building, plot and defense piece, and the blueprint-ghost setting (v1.1, §5.1.5) |
```

**Replace with:**
```markdown
| | The Hold's layout blueprint: placed coordinates for every building, plot and defense piece, and the blueprint-ghost setting (v1.1, §5.1.5) |
| | Rising Vigil: the switch as left and the count of stands fought with it On (v1.3, §5.9.10) |
```

## 6 — §5.14.5 The Roll of Wardens: the vigil mark

**Find:**
```markdown
The current warden's line reads *"…keeping the hearth"*.
```

**Replace with:**
```markdown
The current warden's line reads *"…keeping the hearth"*. **From v1.3,** a warden whose stand was fought with Rising Vigil at level 1 or more also has a small mark drawn in code and the line *"Rising Vigil, level N."* (§5.9.10, §9.23, D545).
```

## 7 — §5.15 intro: a pointer to Rising Vigil, "not yet" kept

The intro's *"(not yet)"* is **kept** on purpose: it is the §2.3 reason Keep the Vigil is not a rival ending (§5.15.7). The edit only adds the pointer to Rising Vigil. *(An earlier draft of this edit called "not yet" stale and replaced it; an outside review caught that.)*

**Find:**
```markdown
**Keep the Vigil** (not yet)
```

**Replace with:**
```markdown
**Keep the Vigil** (not yet; from v1.3 the stand screen also has the optional Rising Vigil switch, §5.9.10)
```

## 8 — §5.15.3 Keep the Vigil: no longer "a later flesh-out"

**Find:**
```markdown
It adds **no** difficulty (rising difficulty is a later flesh-out, §10).
```

**Replace with:**
```markdown
It adds **no** difficulty by itself. From v1.3 the stand screen has a separate optional switch, **Rising Vigil** (§5.9.10, D539): it is available once the gate is open, whichever ending has been chosen, and Keep the Vigil does not turn it on.
```

## 9 — §6.1 Player model: the Vigilant

**Find:**
```markdown
| The v0.10 Orders rows only. **Monday seeds only.** |
```

**Replace with:**
```markdown
| The v0.10 Orders rows only. **Monday seeds only.** |
| **Vigilant** (`vigilant`, *from v1.3*, D546) | Same as Standard | None. After Act VI's stand it opens the gate with `debug.remembering.openGate()` (a declared shortcut: Standard never opens the gate, Q45) and switches Rising Vigil On | The v1.3 Rising Vigil rows only. **Monday seeds only.** |
```

**And find:**
```markdown
Every other player never seats an Order, so their baselines do not change (D417).
```

**Replace with:**
```markdown
Every other player never seats an Order, so their baselines do not change (D417).

- **Vigil** *(Vigilant only, v1.3, D546)*: plays like Standard on the Monday seeds only until Act VI's stand has been applied, then calls `debug.remembering.openGate()` once (which marks `debugUsed`; the report says so), switches Rising Vigil On with `vigil.set` before each stand, and plays **3 endless cycles** (levels 1, 2 and 3). It is the only player that issues `vigil.set`; every other player's baseline does not change. Its shard is `vigil` (technical design §13).
```

## 10 — §6.2 Targets: the Rising Vigil rows (Proposed)

**Find:**
```markdown
Judged only in `sim.yml`, not in the fast set. | v0.11 |
```

**Replace with:**
```markdown
Judged only in `sim.yml`, not in the fast set. | v0.11 |
| *Proposed:* The vigil level rises by exactly 1 per On stand *(D546 A)* | Over the Vigilant's 3 real endless cycles the saved levels are 1, 2, 3 and `stands` is 3 (Vigilant, every Monday seed) | v1.3 |
| *Proposed:* More vigil never holds more waves *(D546 B)* | On the probe, per Monday seed, the median waves held over the preview's 100 practice stands (`laststand.previewSamples`, the same seeds at every level) at level L+1 are never more than at level L, for L from 0 to 10. The probe state is a clone of the Vigilant at the check-in where it would start its first endless stand (Bastion, Standard's stand-timing rule). Judged only in `sim.yml` unless CI `npm run check` stays at 90 s or less on 3 runs with it in | v1.3 |
| *Proposed:* Embers at levels 1 to 3 stay level with level 0 *(D546 C)* | On the probe, the median total Embers (waves part plus trophies) at each of levels 1 to 3 are within a tolerance of level 0 (the tolerance is measured in KV.8, fixed and approved by the owner before the final judging run in KV.9; median of the 5 Monday seeds) | v1.3 |

*A fourth idea, "a stand with the switch Off equals a level 0 stand", is true by construction and is a unit test (technical design §21.8), not a row (D546 (5)).*
```

## 11 — §6.5 Performance budgets: new rows, the shard and the download row

**Find:**
```markdown
| **Download size** *(v1.0, D494)* | ≤ 600 KB |
```

**Replace with:**
```markdown
| **v12 → v13 migration** *(v1.3, D547)* | ≤ 100 ms | A played v12 save, on the load path (the throttled benchmark) |
| **Vigil save growth** *(v1.3, D547)* | ≤ 0.5 KB | The whole `vigil` block plus 20 recorded `vigilLevel` values (checked by a unit test, not the throttled benchmark). Each stand fought On adds about 16 bytes for ever; there is no cap |
| **Download size** *(v1.0, D494)* | ≤ 600 KB |
```

**And find:**
```markdown
**v1.2 (D523): the row stays; the sounds are capped at 30 KB and the whole build must still measure 600 KB or less**)
```

**Replace with:**
```markdown
**v1.2 (D523): the row stays; the sounds are capped at 30 KB and the whole build must still measure 600 KB or less; measured 610,508 bytes**; **v1.3 (D547): the row stays; 3,892 bytes are left for the vigil code (a rough guess of 2–4 KB gzipped, not measured); if the build is over 614,400 bytes, stop and ask, never change the row**)
```

**And find:**
```markdown
| **Simulator: the Orderer shard** *(v0.10, D445)* | ≤ 5 min per CI job *(D320)* | The `orders` shard, Monday seeds only |
```

**Replace with:**
```markdown
| **Simulator: the Orderer shard** *(v0.10, D445)* | ≤ 5 min per CI job *(D320)* | The `orders` shard, Monday seeds only |
| **Simulator: the Vigilant shard** *(v1.3, D546)* | ≤ 5 min per CI job *(D320)*; stop and ask if it would pass 4 min | The `vigil` shard, Monday seeds only |
```

## 12 — §7.6: the wave-strength row and the Embers formula

**Find:**
```markdown
| Wave strength from Threat | Health and Might × (1 + w × Threat) |
```

**Replace with:**
```markdown
| Wave strength from Threat (and, from v1.3, Rising Vigil) | Health and Might × (1 + w × Threat + s × L), L = the stand's Rising Vigil level (0 unless the switch was On, §5.9.10, §7.13) |
```

**And find:**
```markdown
`floor(rankMult × Σ_(n ≤ waves) p × g^(n−1) × (1 + b × Threat) + q × trophies)`
```

**Replace with:**
```markdown
`floor(rankMult × Σ_(n ≤ waves) p × g^(n−1) × (1 + b × Threat + e × L) + q × trophies)`
```

## 13 — New §7.13 Rising Vigil, before §8

**Find:**
```markdown
---

## 8. Starter Content
```

**Replace with:**
````markdown
### 7.13 Rising Vigil *(v1.3, D538–D551)*

Every constant here is **tunable**. Neither is a sketch the owner has accepted as a number: both are measured in KV.9 on the probe and approved by the owner in their own row.

| Formula | Expression | Constants | § |
|---|---|---|---|
| Wave strength per vigil level | Health and Might × (1 + w × Threat + s × L), w = `threat.waveStrengthPerPoint` (§7.6) | `vigil.strengthPerLevel` = *set in KV.9 (target: about one wave fewer held per level on the Vigilant's gate-open stand)* | 5.9.10 |
| Embers per vigil level | the Embers multiplier (1 + b × Threat + e × L), b = `embers.threatBonus` (§7.6) | `vigil.embersPerLevel` = *set in KV.9 (target: Embers at levels 1 to 3 about level with level 0)* | 5.9.10 |
| The level | L = stands already fought with the switch On + 1, for an On stand; 0 for an Off stand | — (no cap) | 5.9.10 |

*Until KV.9 sets them, balance.ts holds clearly marked placeholder values (0.25 each, a guess with no measurement behind it) so the code and the keys test can run; the placeholder is replaced, not tuned, and the milestone cannot be accepted with a placeholder still in place.*

---

## 8. Starter Content
````

## 14 — §9.11 What exists when: v1.3

**Find:**
```markdown
a Play sound row in the debug panel (§9.22) |
```

**Replace with:**
```markdown
a Play sound row in the debug panel (§9.22) |
| v1.3 | Keep the Vigil: no new screen. One Rising Vigil row (On / Off) on the Last Stand screen once the Remembering gate is open, two extra lines in the stand preview, one in the confirmation and one in the result, and a mark and a line on the Roll of Wardens (§5.9.10, §9.23) |
```

## 15 — §9.13: a pointer on the Last Stand screen

**Find:**
```markdown
**Start**, with a confirmation that says the Long Night follows.
```

**Replace with:**
```markdown
**Start**, with a confirmation that says the Long Night follows. **From v1.3,** once the Remembering gate is open, a **Rising Vigil** row sits above Start (§9.23).
```

## 16 — New §9.23 Rising Vigil, before §10

**Find:**
```markdown
---

## 10. Out of Scope
```

**Replace with:**
````markdown
### 9.23 Rising Vigil *(v1.3, D538–D551)*

v1.3 adds **no new screen**. It adds one row to the Last Stand screen (§9.13) and a few lines to sheets that already exist. Rising Vigil changes **no number for a player who leaves it Off** (§5.9.10).

- **The row.** Label **Rising Vigil**, then **[On] [Off]**, then a help line, then one status line. It sits above **Start** and is **shown only when the Remembering gate is open** (§5.15.1); while the gate is closed there is no row and no hint of one. The default is Off. The state is saved in the game (technical design §21), not in the settings key.
- **Status line.** When On: *"This stand: vigil level {n}"*. When Off and at least one On stand has been fought: *"Next level when on: {n}"* (n = stands fought On + 1). Otherwise nothing. The level is a count, not a number with a formula.
- **In the preview.** Expected waves, Embers now and Embers tomorrow are worked out again as soon as the switch flips. The wave strength has no breakdown sheet on this screen today (§9.13), and v1.3 adds none; it shows through the expected waves. The existing Embers breakdown sheet (long-press, §5.0) gets one line, *"Rising Vigil: +{y}% on the waves part"*, in additive terms with the Threat line so the lines add up to the multiplier (`y` = `e × L` as a whole percent of the base 1, rounded down; built by the same function that builds the number).
- **In the confirmation and the result.** The confirmation that says the Long Night follows adds *"Rising Vigil is on at level {n}."* when On. The stand's result sheet adds *"Fought with Rising Vigil at level {n}."*
- **On the Roll of Wardens.** For a warden whose stand was fought at level 1 or more, a small mark drawn in code and *"Rising Vigil, level {n}."*
- **Player-facing strings (nine, word for word, approved by the owner at D551; no others):**

  | String | Where it shows |
  |---|---|
  | `Rising Vigil` | Row label |
  | `On` / `Off` | Row buttons |
  | `On: every wave is stronger, one step more for each stand you make with it on, and the Embers rise to make up for it. Off: an ordinary stand. Your level is kept.` | Help line under the row |
  | `This stand: vigil level {n}` | Status line, when On |
  | `Next level when on: {n}` | Status line, when Off and stands > 0 |
  | `Rising Vigil: +{y}% on the waves part` | Embers breakdown line |
  | `Rising Vigil is on at level {n}.` | Confirmation, when On |
  | `Fought with Rising Vigil at level {n}.` | Result sheet, when the stand was fought On |
  | `Rising Vigil, level {n}.` | Roll of Wardens line |

- **Layout and checks.** No new tap, sheet, confirmation or animation in any routine flow; **a routine check-in stays at 15 taps or fewer.** The two buttons are tappable things of at least 44 × 44 px at 320 and 360 px and at every Text size; the help line wraps with no sideways scroll at 320 px at Largest; the row meets the contrast ratios of §9.20 in both themes. The stand screen with the row (On and Off) and the Roll of Wardens are added to the screen list the sweeps read (D548).
- **Debug.** `debug.vigil.setStands(n)` (a core command, marks `debugUsed`) reaches a high level without playing; the switch itself is the real command (technical design §15, §21).
- **Deferred, not cut (with reasons).** A cap or ceiling (owner chose none); a second lever such as an extra tier or Armor (harder to read and balance); in-world Roll lines (needs lore; the owner chose a plain tally); new art (the owner chose none); a sound for the vigil (the endings are silent); a new Embers sink (a new feature).

---

## 10. Out of Scope
````

## 17 — §10: the rising-difficulty row

**Find:**
```markdown
| Rising difficulty for Keep the Vigil (an endless mode) | Deferred (D453, D477); scheduled as v1.3 (D499) | Milestone v1.3 "Keep the Vigil", with its own flesh-out |
```

**Replace with:**
```markdown
| Rising difficulty for Keep the Vigil (an endless mode) | Deferred (D453, D477); scheduled as v1.3 (D499); **fleshed out 2026-10-24 as Rising Vigil, an optional switch on the stand screen (D538–D551, §5.9.10, §9.23)** | Milestone v1.3 "Keep the Vigil" |
```

## 18 — Judgment calls added in the v1.3 flesh-out

**Find:**
```markdown
8. **A Play sound row in the debug panel** is the second UI-only debug exception (D522 (6)).
```

**Replace with:**
```markdown
8. **A Play sound row in the debug panel** is the second UI-only debug exception (D522 (6)).

## Judgment calls added in the v1.3 flesh-out (D538–D551)

1. **Rising Vigil is a switch, not a mode or a forced step:** On or Off before each stand, once the gate is open; Keep the Vigil on the ending card still changes nothing (D539).
2. **One lever, steady additive steps, no ceiling:** wave Health and Might only (D540).
3. **A small Embers bonus per level, so levels 1 to 3 pay about the same as level 0;** Embers have a finite use, which is said plainly (D541).
4. **The level-0 path is bit for bit the old one; `rulesVersion` stays 5** because the level is saved on the stand's record (D542, the D363 precedent).
5. **Save schema 13:** a small `vigil` block and an optional `vigilLevel` on cycle records, kept through the Long Night (D543).
6. **The row is shown only when the gate is open, and flipping it needs no confirmation** (D544, D549).
7. **A plain Roll tally, a drawn mark and no new art or story text** (D545).
8. **The Vigilant opens the gate with a declared debug shortcut, in its own shard; the probe is judged in `sim.yml` only** (D546, D549).
9. **The download row stays at 600 KB; the vigil code must fit in what is left (3,892 bytes at v1.2), or the milestone stops and asks** (D547).
```
