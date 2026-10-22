# OUT-2a — GDD changes for v1.0 "Polish" (exact find-and-replace edits to `docs/gdd.md`; revised after the red-team review)

Apply each edit by searching for the **Find** text (it must occur exactly once, except where E11 says otherwise). If a find text has moved or changed, **stop and tell the owner; do not guess.** I did not read the whole GDD (it is very large); the finds come from lines I read in §0 (header), §3.2, §5.12.12, §8.3, §9 and §10, and from the review's quotes (E12). After applying, run the search in E11.

**What is not changed:** §6 (pacing targets, simulator rows and policies, performance rows). v1.0 adds no game number, formula, save field or simulator row. The size-of-download row is added to §6.5 later, by the D445 route, after the owner approves a measured number (D485 (6)). The judgment-call lists are a historical record (GDD header), so old lines such as "Revisit at v0.4" stay as written.

---

## E0 — Header status line

**Find:**
```
**Status (v0.11 flesh-out 2026-10-21):**
```
**Replace with:**
```
**Status (v1.0 flesh-out 2026-10-21):**
```

## E1 — §9.1 Layout and interaction rules (target width, text size, contrast)

**Find:**
```
**Target size.** The layout is designed for a 360–430 px wide portrait phone and scales up (D02).
```
**Replace with:**
```
**Target size.** The layout is designed for a 360–430 px wide portrait phone and scales up (D02). **From v1.0 every screen must also work at 320 px wide** (D480, §9.20).
```

**Find:**
```
  - Respects the system "reduce motion" and text-size settings.
```
**Replace with:**
```
  - Respects the system "reduce motion" setting; the existing Settings switch adds to it (motion is reduced if either says so). Settings adds a three-step in-app **Text size**; whether the phone's own text-size setting reaches the page depends on the browser (§9.20).
  - **Contrast** (v1.0, D480, D488): normal text reaches 4.5:1 and large text and UI glyph icons 3:1 against their background, in both themes (§9.20).
```

## E2 — §9.10 More menu: the Settings row

**Find:**
```
| Settings | Theme, best-buy hint on/off, rates per min/hour, reduce motion | v0.1 |
```
**Replace with:**
```
| Settings | Theme, best-buy hint on/off, rates per min/hour, reduce motion | v0.1 |
| Settings *(v1.0, D480, D481)* | + Text size (Match phone, Large, Largest); Backup reminder (On, Off). These two live in a settings key outside the save (§9.20) | v1.0 |
```

## E3 — §9.10 Save & Data: last exported

**Find:**
```
│ Backup slot: 6m ago  [Restore]   │
```
**Replace with:**
```
│ Backup slot: 6m ago  [Restore]   │
│ Last exported: 9d ago  [Export…] │
```
(34 characters between the bars, like the others. The text reads "Last exported: 9d ago" or "Last exported: not recorded". Times of a day or more read "{d}d ago"; shorter ones use the game's one duration format plus " ago" ("3h 20m ago"); under a minute reads "just now". "[Export…]" opens the Copy save code / Download save file choices above it.)

## E4 — §9.10 Debug panel

**Find:**
```
- `debug.remembering.openGate()` and `debug.remembering.finishActVI()` *(v0.11, D462)*: open the ending's gate, and apply Act VI's stand result.
```
**Replace with:**
```
- `debug.remembering.openGate()` and `debug.remembering.finishActVI()` *(v0.11, D462)*: open the ending's gate, and apply Act VI's stand result.
- **Set last export age** *(v1.0, D486)*: pretend the last export was n days ago, so the backup reminder can be tested. It is a **UI-only action in the debug panel, not a core command:** it writes only the settings key, does not touch the save and does not set `debugUsed` (the one recorded exception to technical design §15).
```

## E5 — §9.11 What exists when

**Find:**
```
the Hearth Hall look after Remember Them (§9.19) |
```
**Replace with:**
```
the Hearth Hall look after Remember Them (§9.19) |
| v1.0 | Polish: no new game screen. The Archive tabs fit (two rows when needed); Text size and Backup reminder in Settings; the backup line on the away sheet; reduced motion, contrast and tap-size fixes everywhere; redrawn art and the app icon (§9.12, §9.20) |
```

## E6 — §9.11 honest scope note

**Find:**
```
- A real art and UX pass is scheduled for v1.0.
```
**Replace with:**
```
- The art and UX pass is v1.0 (§9.12, §9.20).
```

## E7 — §9.12 Art direction: the v1.0 paragraph

**Find:**
```
**Honest note:** the generated monsters (especially the poludnitsa, vodyanoy, huldra and nix) will be the weakest art in the game.
```
**Replace with:**
```
- **v1.0 (D475, D482, D489):** a **contact sheet** of every picture drawn in code (the manifest rows whose source is `generated`; 156 at v0.11) is made first, by extending the existing `tools/contact-sheet.ts`: a few composite images per kind (portraits, monster and hunter sprites, icons, frames, scenes), the number printed under each picture, 16 px icons at 4×, on both theme backgrounds, scene overlays shown over their base hold scene. Two or three **app-icon candidates** are on it. The owner marks each picture **Keep** or **Redraw**; the marks are recorded in `docs/flesh-out/v1.0/art-marks.md`. At most about 40 pictures are redrawn, at most 12 per session; the rest go on the deferred list. A redraw uses a **per-id override**, so a picture marked Keep is byte-identical to its v0.11 PNG (a test checks it). Redraws keep the id, the size (16, 32 or 64 px) and the 32-colour palette and go in through the manifest. The old picture is kept in git and `art-src/previous/` for a one-step revert. Each batch is shown before and after and the owner approves it. Free-pack art (`pack` rows, 49) is not redrawn. The app icon is drawn in code or CC0 in the home-screen sizes (192, 512, maskable 512, apple-touch-icon 180, favicon) and recorded in the manifest (and `credits.md` if CC0).

**Honest note:** the generated monsters (especially the poludnitsa, vodyanoy, huldra and nix) will be the weakest art in the game.
```

## E8 — §9.3 away sheet: the backup line

**Find:**
```
- Contract, injury, and bestiary lines appear only once those systems exist.
```
**Replace with:**
```
- Contract, injury, and bestiary lines appear only once those systems exist.
- **Backup reminder** *(v1.0, D481, D486)*: when due, one line with **[Back up now]** and **[Not now]** sits below the summary lines and above **[Onward]** (§9.20). It never blocks [Onward].
```

## E9 — §9.19 end: add §9.20

**Find:**
```
- **Layout checks (Playwright, phone and 900/1300 px):** no sideways scroll with the card, the reading screen and every ending card open; **all 40 names with their village lines** fit without clipping at the narrowest width.
```
**Replace with** (the same line, then the new section):
```
- **Layout checks (Playwright, phone and 900/1300 px):** no sideways scroll with the card, the reading screen and every ending card open; **all 40 names with their village lines** fit without clipping at the narrowest width.

### 9.20 Polish: accessibility, backup reminder and art *(v1.0, D473–D490)*

v1.0 changes **no game number, formula or save field.** Everything below is presentation and settings.

**Where settings live.** The existing settings (theme, best-buy hint, rates per min/hour, reduce motion) are part of the save and **stay there, unchanged.** v1.0 adds one **settings key outside the save**, namespaced by channel, holding only: `textSize`, `backupReminder`, `lastExportAt`, `snoozeUntil`, `firstSeenAt` (set once, on the first run of v1.0). **Reset everything…** clears the three timestamps and keeps `textSize` and `backupReminder`. **Paste code, Load file and Restore do not touch it.** No schema change (D486).

- **Archive section tabs.** The four tabs (Bestiary, Library, Accounts, Names) are always fully visible from 320 px up, with no sideways scroll. When they do not fit on one row at the current Text size they **wrap to two rows**. The bottom tab bar and the resource bar are **exempt from Text size** (short labels, always one row). If a screen cannot fit at Largest after this, stop and ask.
- **Text size** (Settings): **Match phone** (default), **Large** (115% of the base body size), **Largest** (130%), applied once at the root. It scales **body-font text only.** The pixel font (headings and resource-bar numbers) and every sprite and icon never scale (integer scaling only, §9.12). "Match phone" means the app adds no scaling of its own; whether the phone's own text-size setting reaches the page depends on the browser (Android Chrome follows it; iPhone home-screen apps generally do not), and the tests cover only the three in-app steps. Every screen on the screen list fits at **320 px at Largest** with no clipped text and no sideways scroll; **all 40 names of the reading fit at Largest.** Buttons stay at least 44 × 44 px **at every Text size.**
- **Reduced motion.** Motion is reduced if the phone says so **or** the existing Settings switch is on (the switch stays a plain on/off). Then nothing fades, slides, bobs or flashes: battle sprites show still frames, sheets appear at once, and **fight playback, Delve playback and the reading keep the same timeline and pace with still frames** (as the reading already does, D456). The Hold scene is still. A script over the CSS allows `animation` and `transition` only under the reduced-motion gate, JS-driven motion goes through one registry, and a Playwright check reads `document.getAnimations()`.
- **Contrast.** In both themes, normal text reaches **4.5:1** and large text (18 pt, or 14 pt bold, at its rendered size) and UI glyph icons **3:1**, measured by Playwright from the computed colours on the screen list. The styled cards (the Rime reader's pale-on-dark card, the document reader's parchment card and Ilse's italic note, the reading screen's dark card, the scene sheets) meet the same ratios in both themes; a fix may brighten them, and **if a fix would visibly change an approved look, show before and after and ask.** Fixes use the existing theme tokens; **if no token pair passes, stop and ask.** Multi-colour pixel art and text drawn over the pixel hold scene are not measured; they are looked at in the playtest.
- **Tap targets.** Everything tappable on the screen list is at least 44 × 44 px at 320 and 360 px and at every Text size. Exceptions (as WCAG 2.5.5): inline text links in prose, the debug panel, and numbers that only respond to a long press. The ⓘ icons are not exempt: they keep their look and get a 44 px hit area.
- **Backup reminder** (D481, D486). One line on the away sheet, **below the summary lines and above [Onward]**, never blocking [Onward] or the Contracts "Collect".
  - Shown when the **Backup reminder** setting is On, **14 or more whole days** have passed since the later of `lastExportAt` and `firstSeenAt`, and it is not snoozed. If the clock was set backward (now earlier than that time) nothing shows.
  - Text (word for word; `{n}` is the number of whole days):
    - *You haven't saved a copy of your game outside this browser in the last {n} days. A copy keeps your hold safe if the browser clears its storage.*
  - Buttons: **Back up now** (opens Save & Data and snoozes for 1 day) and **Not now** (snoozes for 7 days).
  - Only **Copy save code** (when the copy succeeds) and **Download save file** (when the download starts) count as an export and set `lastExportAt`. Copy diagnostics, Paste code, Load file, Restore and a cancelled download do not.
  - Settings: **Backup reminder** On / Off. Save & Data shows **Last exported: 9d ago** or **Last exported: not recorded** (E3).
- **Art.** See §9.12 (v1.0). Redrawn pictures change no layout; every size stays.
- **The screen list** (used by the tap sweep, the Text size, contrast and layout checks): Hold (at Hamlet, Keep, Citadel and Bastion); the away sheet (with the reminder); the rates and breakdown sheets; the Rank screen (the Hearth, the Roll of Wardens, the Riftglass shop, "What the ember remembers"); Hunters (roster, candidates); the hunter sheet (talents, slots, alternate traits, letters), the slot picker, Stores and Salvage; Contracts (board, launch sheet, fight log); Bestiary and an entry; the Alchemist's Hut (the 12 × 3 Book grid, Experiment); the Archive (all four tabs, the document reader, the Names view, the Villages panel); the Last Stand screen, the Long Night sheets and the arrival sheet; a Delve (entry, floor playback, doors, blessing, guardian, result); Events (boss sheet and playback, hunt sheet and playback, the Great Beasts shelf, the Rime shelf); the Orders (card, sheets, the seat step, chapter and opening scenes); the Remembering (card in its four forms, Pechko's scene, the reading, the ending cards, the Library shelf); More (Reports, Hall of the Fallen, Save & Data, Settings, About & Credits, Diagnostics). The debug panel is excluded. Claude Code records in the progress entry which fixture or debug command reaches each screen.
- **Layout checks (Playwright, 320, 360, 900, 1300 px):** each of the above, at Match phone and at Largest, in both themes.
```

## E10 — §10 Out of Scope: audio, achievements, the Descent, rising difficulty

**Find:**
```
- Audio: music and sound effects. **[JC: revisit after v1.0. The asset manifest reserves an `audio` section so sound can be added without restructuring.]**
```
**Replace with:**
```
- Audio: music and sound effects. **[Decided D476: after v1.0, as its own small milestone: CC0 sounds only, muted by default with a toggle, no new runtime dependency. The asset manifest reserves an `audio` section so sound can be added without restructuring.]**
```

**Find:**
```
| Achievements | Not in the brief | **[JC: candidate for v1.0 polish; the owner decides at the v1.0 flesh-out]** |
```
**Replace with:**
```
| Achievements | Not in the brief; the owner decided against them (D474) | The in-world records: the Names, the Bestiary, the Library and the Roll of Wardens |
```

**Find:**
```
| The Descent (a third ending) | Deferred (D448) | Its own later flesh-out |
```
**Replace with:**
```
| The Descent (a third ending) | Deferred (D448); after v1.0 (D477) | Its own milestone after v1.0, with its own flesh-out |
```

**Find:**
```
| Rising difficulty for Keep the Vigil (an endless mode) | Deferred (D453) | Keep the Vigil changes nothing for now; its own later flesh-out |
```
**Replace with:**
```
| Rising difficulty for Keep the Vigil (an endless mode) | Deferred (D453); after v1.0 (D477) | Keep the Vigil changes nothing for now; its own milestone after v1.0, with its own flesh-out |
| Screen-reader labels and keyboard focus | Considered for v1.0 and left out (D489) | Not planned; a later accessibility pass if wanted |
```

**Find:**
```
10. **Audio is revisited after v1.0,** with a slot reserved in the asset manifest.
11. **Achievements are a candidate for v1.0 polish.**
```
**Replace with:**
```
10. **Audio comes after v1.0, as its own small milestone,** with a slot reserved in the asset manifest. (D476)
11. **No achievements.** The in-world records do that job. (D474)
12. **v1.0 is one polish milestone with no game-rule change;** the Descent and rising difficulty come after it. (D473, D477)
```

## E11 — The Wolf's name (applies D71, D483)

Each find is a single place. Replace "Gloam Wolf" by "Gaunt Wolf" and nothing else in the line.

| Where | Find | Replace with |
|---|---|---|
| §8.3 stat table | `\| Gloam Wolf \| Beasts & Wilds \| forest, field, river, barrow \| 1–2 \| 120 \| 10 \| 2 \| 14 \| 2 \|` | same with `Gaunt Wolf` |
| §8.3 damage-type table | `\| Gloam Wolf \| 1.0 \| 1.0 \| **1.25** \| 1.0 \| 1.0 \| **1.25** \|` | same with `Gaunt Wolf` |
| §8.3 trait/lore table | `\| Gloam Wolf \| *Hamstring:*` | `\| Gaunt Wolf \| *Hamstring:*` |
| §9.4 contract board mock | `Gloam Wolf · T1 · 12m left` | `Gaunt Wolf · T1 · 12m left` |
| §9.8 Bestiary mock | `[Gloam Wolf] [·]` | `[Gaunt Wolf] [·]` |
| Judgment calls (lore revision), item 1 | `and **Gloam Wolf** replaces Hollow Wolf. (§2.5, §8.3)` | `and **Gaunt Wolf** replaces Hollow Wolf (the first draft said Gloam Wolf; D71 changed it, applied here by D483). (§2.5, §8.3)` |

"Gloam" and "Gaunt" are both five letters, so the boxed mocks stay aligned. The Hidebane Oil row, Stanko's unlock and the Wolf fang row already say "Gaunt Wolf".

**After the GDD edits (Claude Code, task TV.1):** search for `Gloam Wolf` and `Gloam wolf` in **`src/`, `tests/` (except history entries in `tests/content/names.ts`), `art-src/`, `docs/gdd.md`, `docs/setting-primer.md` and `docs/lore-secrets.md` outside §19** and change the display name. **Do not edit `docs/lore-secrets.md` §19** (a word-for-word copy of decision D32, D38) and do not edit `decisions.md`, `docs/archive/`, `docs/flesh-out/`, `docs/questions.md`, `docs/implementation-plan.md` (they may name the old name as history), `CLAUDE.md` or `progress.md`. **Do not change any id.** Display-name-only diffs in goldens, logs, fixtures or `sim/baseline.json` are allowed (D487 (1)); list each file in the progress entry; any other diff stops. If a content id or a save fixture contains "gloam-wolf", stop and ask (a rename would need a migration).

## E12 — §5.12.12: polish promised to v1.0 (D490; the owner said yes to Q49)

**Find:**
```
- Event-only cosmetics, art for the Great Beasts' full portraits and the legendary hunters' animation are polish (v1.0).
```
**Replace with:**
```
- Event-only cosmetics and the legendary hunters' animation are deferred past v1.0 (D490). The Great Beasts' portraits are part of the v1.0 art pass if the owner marks them (D475).
```
(This find text is quoted from the red-team review, line 1261 of the GDD I read; if it differs, stop and tell the owner.)

---

## Check against the sections the owner named

- **§9 (UI):** edited as above (§9.1, §9.3, §9.10, §9.11, §9.12, new §9.20). The Remembering screens (§9.19) are only checked for layout, contrast and text size.
- **§10 (out of scope):** achievements decided no; audio, the Descent and rising difficulty decided "after v1.0"; screen-reader labels and keyboard focus listed as left out; judgment calls 10–12.
- **§6 (simulator rows and budgets):** no new row. All existing rows must still pass and every report must equal the v0.11 baseline (display-name diffs aside, D487). The report-only species variant is outside §6, outside the baseline and outside `sim.yml`. The new size row waits for a measured number and the owner's approval. §3.2 and §6.4 say a routine check-in is 15 taps or fewer; the playtest asks whether that still holds at Largest.
