# OUT-9 — Technical design additions for v1.0 (append-only; revised after the red-team review)

**Where it goes.** Append the section below to `docs/technical-design.md` as the **new §18**, placed **before** the closing "Judgment calls in the technical design" (the document already has §16 "Coding conventions" and §17 "Risks and honest notes"). I could not see the technical design myself; the review did, and this version follows it. **Claude Code may not add design content of its own** (D467 (2)); if the repo contradicts this section in a way this section does not already say to check, **stop and ask the owner** instead of choosing. Paths are proposals that follow the repo's layout; if a convention exists, follow it.

---

## §18. v1.0 polish *(D473–D490)*

**No change to the core, the save schema (11), the RNG streams, `rulesVersion` (5) or the simulator's players.**

### 18.1 Settings: what stays, what is new
- The existing settings (theme, best-buy hint, rate unit, reduce motion) are part of `GameState` (`settings: Settings`, §5.2) and stay there, unchanged. **Reduce motion stays a boolean.**
- v1.0 adds one **settings key outside the save**, written by `src/platform/` and namespaced by channel like the other storage keys (§9.1): `lasthold:settings` and `lasthold-preview:settings`. It holds **only**: `textSize` (`'match' | 'large' | 'largest'`, default `'match'`), `backupReminder` (boolean, default on), `lastExportAt`, `snoozeUntil` and `firstSeenAt` (timestamps; `firstSeenAt` is set once, on the first run of v1.0).
- **Reset everything…** clears the three timestamps and keeps `textSize` and `backupReminder`. **Paste code, Load file and Restore do not touch this key.** The key is not part of the export code or file.
- The platform layer supplies the clock; the core is untouched (§4.2).

### 18.2 Text size
- Three steps (Match phone 100%, Large 115%, Largest 130% of the base body size) applied once, through one root variable, to **body-font text only.** The pixel font and all sprites and icons never scale (integer scaling, §10). The bottom tab bar and the resource bar are exempt. "Match phone" adds no scaling of its own; whether the system text size reaches the page depends on the browser, and the tests cover only the in-app steps.

### 18.3 Reduced motion
- Motion is reduced if the system says so (`prefers-reduced-motion`) **or** the existing boolean is on. One function combines them.
- **CSS:** a check script fails if `animation` or `transition` appears outside the reduced-motion gate selector. **JS motion** (fight and Delve playback, the reading, sprite frame swaps, sheet motion) goes through one registry (`src/ui/motion.ts` or the repo's equivalent), which a unit test enforces. **Playwright:** `document.getAnimations()` is empty on the named screens when motion is reduced and at least the v0.11 count when it is not. Under reduced motion playback keeps its timeline and pace with still frames.

### 18.4 Contrast check
- A Playwright check opens the screen list (GDD §9.20) in both themes, derives (text, background) and (UI glyph icon, background) pairs from the computed `color` and `background-color`, and fails below 4.5:1 for normal text and 3:1 for large text (18 pt, or 14 pt bold, at its rendered size) and UI glyph icons. Multi-colour pixel art and text over the pixel hold scene are not measured. The styled cards (Rime reader, document reader, reading screen, scene sheets) are on the list. Fixes use the existing theme tokens (§10).

### 18.5 Tap-target sweep
- `tests/e2e/polish-tap-targets.spec.ts` visits the screen list at 320 and 360 px and at each Text size and fails for any tappable element under 44 × 44 px, except inline text links in prose, the debug panel and long-press-only numbers. The ⓘ icons get a 44 px hit area with their visual size unchanged. No other allow-list entry is permitted without the owner's yes.

### 18.6 Backup reminder
- A pure function `backupReminder(now, settings)` returns nothing or the number of whole days to show: it is due when the switch is on, `now` is not earlier than the reference time, 14 or more whole days have passed since the later of `lastExportAt` and `firstSeenAt`, and `now` is past `snoozeUntil`. The UI only shows what it returns. A table test with a fake clock covers it.
- Only **Copy save code** (when the copy succeeds) and **Download save file** (when the download starts) set `lastExportAt`. Copy diagnostics, Paste code, Load file and Restore do not.
- **Debug exception (the one recorded exception to §15):** "Set last export age" is a **UI-only action in the debug panel, not a `debug.*` core command.** It writes only the settings key, does not touch the save and does **not** set `meta.debugUsed`.

### 18.7 Art tooling
- **Extend the existing `tools/contact-sheet.ts`** (§12.3): numbering stable by id, composite sheets per kind, 16 px icons at 4×, both theme backgrounds, scene overlays over their base scene; it is run by hand and is not part of the build. It covers the manifest rows whose `source` is **`generated`** (not `pack`).
- A redraw uses a **per-id override** (a template or parts used only by that id) so shared templates do not change pictures marked Keep. A test compares every Keep picture with the recorded hash of its v0.11 PNG (`art-src/v0.11-hashes.json`).
- **No runtime fallback is added:** the manifest row keeps its single `file` field and `<Sprite>` is unchanged (it still falls back to its silhouette placeholder for a missing file). The previous PNG is kept in git and in `art-src/previous/` for a one-step revert. The existing CI test that every file in `public/assets/` is in the manifest (§12.4) stays.
- Icons: the PWA manifest lists 192, 512 and a maskable 512; the page has an `apple-touch-icon` link (180 px) and a favicon; the preview build's icon has a visible corner mark.

### 18.8 The report-only species variant
- A script under `sim/tools/` (not in the folder `sim.yml` runs), with its own `package.json` entry (`sim:species-report`). It is Standard plus one rule (D485 (4)): among the contracts whose tier is within one of the tier Standard would pick, take the one whose species is not yet Studied (ties in Standard's order), else Standard's choice. It runs twice, labelled: (A) best case, true species; (B) realistic, the candidate list only. Same Monday seeds, up to 25 cycles, once. It reports days and cycles and its reports are copied to `docs/flesh-out/v1.0/` because `sim/reports/` is git-ignored (§13.2). A test asserts that `sim.yml`, the baseline and `sim/targets.ts` do not reference it.

### 18.9 Release checks
- **Extend** the existing tests, do not add competing ones: the offline reload smoke (§14: load the production build, wait for the service worker, go offline, reload, run N named commands, check the state), the credits/manifest test (§12.4), and the version shown in About & Credits (§11.2). The production build's download size is measured and a size row is proposed to the owner (D445 route).
