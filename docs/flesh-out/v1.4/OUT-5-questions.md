# OUT-5 — Edits to `docs/questions.md` (v1.4 "The Descent" flesh-out, 2026-10-25; updated 2026-10-27)

Every **Find** below (5 of them, in 5 numbered edits) was checked against the Project's copy of `docs/questions.md` and occurs **exactly once** in it. **If one does not match exactly once in the repo's copy, stop and tell the owner.** Edits 1–4 close leftover v1.2 and v1.3 lines (`Q53`, `Q54`, `Q55`, `Q57`) per the sweep in D557; Edit 5 appends the v1.4 section (`Q59`) at the end of `docs/questions.md`.

*(Also in the TD.1 docs commit, per D557 (2): clear the stale `Q53–Q56 (v1.2 leftovers)` note from the "Current state" header at the top of `docs/progress.md`.)*

## 1 — Close Q53 (the seven sound picks)

**Find:**
```markdown
- **Blocks:** SF.9 (converting and shipping). SF.5–SF.8 do not wait for it.
- **Answer (owner):** *(pending)*
```

**Replace with:**
```markdown
- **Blocks:** SF.9 (converting and shipping). SF.5–SF.8 do not wait for it.
- **Answer (owner):** (a), 2026-10-23 (SF.5): Build 2, Launch 10, Place 13, Win 18, Lose 21, Fanfare 28, Nightfall 31 (`docs/flesh-out/v1.2/sound-marks.md`). Closed in the v1.4 sweep (D557).
```

## 2 — Close Q54 (whether the picked sounds fit under 600 KB)

**Find:**
```markdown
- **Status:** **Open until SF.9.** Claude Code writes the numbers in the progress entry.
```

**Replace with:**
```markdown
- **Status:** **Resolved 2026-10-23 (SF.9):** the seven sounds total 29,150 bytes and the production build measured 610,463 bytes gzipped at SF.9 (610,508 bytes at SF.12), inside the 614,400-byte row. Closed in the v1.4 sweep (D557).
```

## 3 — Close Q55 (whether iPhone Safari decodes and plays the files)

**Find:**
```markdown
- **Status:** **Open until the playtest.**
```

**Replace with:**
```markdown
- **Status:** **Answered (a), 2026-10-23 (D530, D531):** after the ambient audio-session fix (D529), all seven sounds played on the owner's iPhone and respected the silent switch. Closed in the v1.4 sweep (D557).
```

## 4 — Close Q57 (steady additive steps vs. compounding steps)

**Find:**
```markdown
- **Blocks:** KV.9. **Answer (owner):** *(pending; the curve is in `docs/flesh-out/v1.3/vigil-curve.md`, reported by KV.8)*
```

**Replace with:**
```markdown
- **Blocks:** KV.9. **Answer (owner):** (a) steady additive steps, 2026-10-24 (D554, after the KV.8 curve in `docs/flesh-out/v1.3/vigil-curve.md`). Closed in the v1.4 sweep (D557).
```

## 5 — Append the v1.4 section at the end of `docs/questions.md`

**Find:**
```markdown
- **Recommendation:** (a).
- **Answer (owner):** (a), accepted with the yes at D551 on 2026-10-24.
```

**Replace with:**
```markdown
- **Recommendation:** (a).
- **Answer (owner):** (a), accepted with the yes at D551 on 2026-10-24.

## v1.4 questions *(from the v1.4 flesh-out, 2026-10-25; updated 2026-10-27)*

### Q59 — Calibrated values for `descent.stageTiers` and `descent.unlitBaseHealth` *(opened 2026-10-25; answered after TD.8b reports the Descent probe, before TD.9)*
- **Context:** `descent.stageTiers` (sketch `[5, 6, 7]`) and `descent.unlitBaseHealth` (sketch `4,500` at base tier 5 in `balance.ts`, read by `monsters.ts`) start as clearly marked placeholders (GDD §7.14, §8.3, D560, D564). In TD.8b, the on-demand parameter calibration tool (`npm run sim:descent -- ...`, S8) runs the Descent probe across the 5 Monday seeds (100 practice runs per seed). A shared builder (`sim/descent-roster.ts` / `core/debug`, M5, M10) constructs two explicit reference profiles: (a) *minimal gate-open* (16 species Studied, 0 Mastered, 0 chapters, natural roster/relics); and (b) *maxed endgame* (all 14 hunters owned at Master Wright level 10, 5 stars, 5 talents, Wright gear, 16/16 Mastered species, 36/36 recipe properties, 40/40 skills, 16/16 Order chapters, 12 relics, matching consumables). It measures win rate, median stages cleared, median hunters downed (with 10th–90th range), and Stage 3 remaining Health across a grid of stage tiers and Unlit base Health values, plus comparisons with `What the Hold Learned` zeroed and an unprepared Hamlet starter party (M9). Also confirms gating at Bastion rank in the current cycle (S6) and free, instant retries on defeat with consumables spent (S7).
- **Question:** after reading the TD.8b calibration table in `docs/flesh-out/v1.4/descent-calibration.md`, do you approve the proposed calibrated values for `descent.stageTiers` and `descent.unlitBaseHealth`, and the two simulator rows:
  - **Row A (`descent-victory`):** gate-open full roster wins with win rate between **50% and 85%** (median of the 5 Monday seeds) and median hunters downed strictly between **2 and 8** across the 3 stages (*"a costly, heroic victory"*);
  - **Row B (`descent-learned-matters`):** party with `What the Hold Learned` bonus achieves win rate **≥ 25 percentage points higher** (or ≥ 2 fewer hunters downed) than the identical party with the learned bonus zeroed, and an unprepared Hamlet starter party loses in Stage 1?
- **Options:** (a) approve the proposed calibrated values and rows A and B (recommended once TD.8b shows they land in the 50%–85% win rate and 2–8 downed band on the chosen profile); (b) pick a harder or easier point from the TD.8b grid; (c) adjust the `descent.learned.*` tunable steps too.
- **Recommendation:** (a).
- **Blocks:** TD.9 (setting the calibrated constants and committing rows A and B to `sim/targets.ts`).
- **Answer (owner):** *(pending; asked with the calibration table after TD.8b)*
```
