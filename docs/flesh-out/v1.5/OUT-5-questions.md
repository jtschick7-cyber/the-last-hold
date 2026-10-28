# OUT-5 — Edits to `docs/questions.md` (v1.5 "The Breach", 2026-10-28)

Every **Find** was checked against the Project's copy of `docs/questions.md` and occurs **exactly once**. If one does not match exactly once in the repo's copy, stop and tell the owner.

## 1 — Close Q59 (its answer line still reads pending; D577 answered it)

**Find:**
```markdown
- **Answer (owner):** *(pending for the constants and rows)*
```

**Replace with:**
```markdown
- **Answer (owner):** (a), 2026-10-28 (D577): `descent.stageTiers` [7, 8, 9], `descent.unlitBaseHealth` 4,500, rows A and B. Row A judges the maxed roster. Closed in the v1.5 sweep.
```

## 2 — Append the v1.5 section at the end of `docs/questions.md`

**Find:**
```markdown
- **Answer (owner):** the owner pasted the approved wording of D-01 to D-07 and the three resident lines on 2026-10-28 (option b). It is now `lore-secrets.md` §34.11, unchanged (D570). **Answered, closed.**
```

**Replace with:**
```markdown
- **Answer (owner):** the owner pasted the approved wording of D-01 to D-07 and the three resident lines on 2026-10-28 (option b). It is now `lore-secrets.md` §34.11, unchanged (D570). **Answered, closed.**

## v1.5 questions *(from the v1.5 flesh-out, 2026-10-28)*

### Q61 — May the player tap "Use this layout" after Suggest layout? *(opened 2026-10-28; asked in the first message of the build thread, with Q62; blocks the last part of TB.8b)*
- **Context:** the owner agreed that **Suggest layout** shows a proposed arrangement and its preview and **places nothing by itself** (D588). With 10 to 14 defense pieces, following the suggestion by hand takes about 20 to 30 taps. A separate button the player taps would apply it in one command. That is a player choice, not an automatic placement, but it is a change from "never places".
- **Options:** (a) **Yes: add an explicit "Use this layout" button** (one atomic command, `layout.setDefenses`: it lifts every defense in the front rows that is not in the suggestion to the Tray, then places the suggested defenses; it moves only walls and towers and is shown with what will move; recommended). (b) **No:** the suggestion is shown on the grid as highlighted target tiles and the player moves pieces by hand. (c) Yes, but behind a confirmation sheet.
- **Recommendation:** (a). It moves only defenses, only on the player's tap, and the lanes strip shows the result before Start.
- **Blocks:** the "Use this layout" button and the `layout.setDefenses` command at the end of TB.8b (built only if yes; if no, neither exists). The Tactician simulator uses `layout.unplace` and `layout.place` either way. It also decides what the CLAUDE.md rule about changing the layout says.
- **Answer (owner):** *(pending)*

### Q62 — The golden test's version number (a locked file) *(opened 2026-10-28; asked in the first message of the build thread; blocks TB.5)*
- **Context:** `rulesVersion` goes from 5 to 6 (D584). The golden-fight test file asserts the version number; in v0.8 it moved from 4 to 5 while every fight line stayed identical (D337 (9)). This milestone needs the same one-line move, 5 to 6. Golden fixtures are an owner gate (CLAUDE.md).
- **Options:** (a) **Approve the one-line version edit, every fight line unchanged** (recommended). (b) Keep the golden file at 5 and add the version 6 assertion in a new file. (c) Other.
- **Recommendation:** (a): the same change as in v0.8, with a test that every golden fight still replays line for line.
- **Blocks:** TB.5 (rulesVersion 6).
- **Answer (owner):** *(pending)*

### Q63 — Approve the lane calibration table, the constants and the three rows *(opened 2026-10-28; answered after TB.12 reports the Breach probe, before TB.13)*
- **Context:** the `breach.*` tunables start as values to be confirmed (`breach.volleyScale` is a pure placeholder, D583). TB.12's `npm run sim:breach -- …` sweeps them and reports, in `docs/flesh-out/v1.5/breach-calibration.md`: waves held (median, 10th–90th) for Auto-arrange, the Tactician and the bad layout, beside the same state under the v5 rules, at the Citadel and Bastion, over the 5 Monday seeds, plus how far each existing stand row moves.
- **Question:** do you approve the proposed values and the three rows (A: Auto-arrange within 1 wave of today and at least 12; B: Tactician at least 1 wave more than Auto-arrange; C: bad layout at least 2 waves fewer)?
- **Options:** (a) approve (recommended once the table lands in those bands); (b) pick another point from the grid; (c) change a row's wording.
- **Recommendation:** (a).
- **Blocks:** TB.13 (setting the constants, recording the v6 stand goldens, committing the rows).
- **Answer (owner):** *(pending)*
```
