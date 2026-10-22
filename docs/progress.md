# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.0` (from `main` at the v0.11 merge).
- **Milestone:** v1.0 "Polish" (D472–D491), in progress.
- **Last task:** TV.8a drawn (10 monster portraits, 2 sprites); waiting for the owner's approval of the before/after sheets.
- **Next:** TV.8b (the rest of the marked monster-species art, if any), then TV.9a (Great Beasts, guardians, hunters).
- **Open questions:** Q46 (the species estimate, after TV.11); Q41 and Q48 informational.

Earlier entries are in [`docs/archive/progress-2026-10-11-to-15.md`](archive/progress-2026-10-11-to-15.md) (to T8.15) and [`docs/archive/progress-2026-10-15-to-21.md`](archive/progress-2026-10-15-to-21.md) (T8.16 to T11.15). Read only the last entry at session start.

## 2026-10-21 — v0.11 session 17: T11.16 layout checks and budgets
- **Owner answered Q45 (a)** (D469): the row will judge "all 40 names found and Act VI's stand applied by cycle N". T11.15 is open again (measure that, propose N, stop for the owner).
- **Layout (Playwright, production build, `tests/e2e/remembering-layout.spec.ts`):** at 320, 360, 900 and 1300 px: no sideways scroll, and nothing wider than its sheet, with Pechko's scene, the card (not open, open, after Remember Them), R-03, the reading (names 1, 20, 40 and the Unlit's line), every ending card, the Library shelf and the Names view. All 40 names with their village lines are tapped through at 320 and 360 px and each sits inside the sheet. I looked at the screenshots: nothing clips.
- **One real finding, fixed:** the pixel font has no č, ě, ř, š, Š or ž, and eleven of the forty names use them, so the reading's names would have fallen back to another font letter by letter. The reading's name now uses the normal font, bold. (The Names view already did.)
- **Budgets (D445 route), measured, not yet in the GDD or enforced:** reading start (tap on R-03's Continue to the first name painted), 4× CPU slowdown: **15 ms**; v10 → v11 migration of a played v10 save, 4× slowdown: **18.6 ms**. **Proposed rows for you to approve (GDD §6.5):** reading start ≤ 50 ms (the same as an Order sheet opening); v10 → v11 migration ≤ 100 ms (as v9 → v10); `remembering` save growth ≤ 0.5 KB, which is now a unit test (`tests/remembering/save-size.test.ts`; the block is about 150 bytes full). The two timing rows are logged by `bench` and become checks once you approve them.
- **Seen, not mine:** at 360 px the Archive's section tabs ("Bestiary, Library, Accounts, Names") run past the edge, so "Names" is cut off (the row scrolls; the page does not). It has been so since v0.5. I did not change it; it is for the polish pass unless you say otherwise.
- **Known, unchanged:** the older "odds with 3 candidates" row still fails on this container's CPU (D445); it is not part of `npm run check`.
- **Not seen on a real phone**, only emulated (Pixel 7 at 360 and 320 px). No old test edited. Nothing skipped.

## 2026-10-21 — v0.11 session 18: T11.15a measured for the narrower row (D469)
- **Measured** (Standard, 5 Monday seeds, usual run, 52 s): all 40 names found **and** Act VI's stand applied by the end of cycle **6, 6, 6, 6 and 7** (at 446 to 486 hours). Median **6**. The full ending is still never choosable (species, as in Q45).
- **Proposed N = 6** (the median, so the row passes by construction). Four seeds are at 6 and one at 7; a seed that never got there would count as later than any N. Judged in `sim.yml` only, not in `npm run check`.
- **Built (report only):** the run record's `ending` field now also holds the moment names and stand were both reached; the report shows it per seed and the median. No policy, constant, target or baseline changed.
- **Waiting for the owner:** approve N = 6 (or name another). **Then T11.15b:** the row alone in `sim/targets.ts`, with its check, in its own commit. I did not touch `sim/targets.ts`.

## 2026-10-21 — v0.11 session 19: T11.15b the row, and T11.17 the hand-off
- **Owner approved** N = 6 and the three §6.5 rows (D470). **T11.15b:** the row `remembering-reachable` is in `sim/targets.ts` in its own commit, then its check (`sim/checks/v011.ts`, with tests) and the milestone setting. The full suite on this machine (340 s, 55 runs): the row passes (median cycle 6) and nothing else changed; the only ✗ lines are the Saturday runs, which are reported only. GDD §6.2 and §6.5 are updated. The two timing rows are in the benchmark and the layout spec (warn at the budget, fail at 2×): measured 15 to 19 ms each.
- **T11.17:** plan boxes ticked, v0.11 `Status: in progress`, the pull request opened from `milestone/v0.11` with the template. `progress.md` was 90 KB, so older entries moved to `docs/archive/progress-2026-10-15-to-21.md` and the last three stay here.
- **For the playtest:** the plan's checklist is in the PR. To see the ending: debug panel, "Finish Act VI" (plays the real Long Night, the hold resets), then "Open the gate", then Remember Them or Keep the Vigil.
- **Please check CI** on the PR: the sim jobs must each stay under 5 minutes (D320); I could not see them from here.
- **Deferred, by decision:** the Descent and rising difficulty (D448, D453); the species half of the gate is not judged by the simulator (D469); the Archive's section tabs run past the edge at 360 px (since v0.5); Q43 (Wolf name).
- **Nothing skipped, no old test weakened.** Older tests edited this milestone: `tests/orders/opening.test.ts` (lists `v11-played.json`, T11.5) and `tests/remembering/vigil.test.ts` (T11.13); the closing-line tests now assert its absence (T11.3, D465).

## 2026-10-21 — v0.11 milestone end
- **The owner said the playtest passed.** CI on the pull request was green first: every simulator shard under 2 min 10 s (`long` 124 s), the judge 64 s, `check` 85 s, e2e and bench green.
- **Done:** `npm run sim:accept` (5 min 51 s here): the baseline moves to v0.11 and the only differences are the milestone and the new row `remembering-reachable` (passes); every other number is identical. Plan `Status: complete`, D471, the PR merged, tag `v0.11.0`.
- **Next:** the owner decides. v1.0 polish needs a flesh-out; Q43 and the Archive tabs at 360 px are candidates for it.

## 2026-10-22 — v1.0 docs commit
- **Step 0 passed:** tag `v0.11.0` exists and is in `main`; `sim/baseline.json` is the v0.11 one. Branch `milestone/v1.0` made from `main`.
- **The owner said yes** to GDD §9.20, D485–D490 and this commit; D491 added (status Accepted; D472–D490 keep their status cells, no old row edited).
- **Applied:** all 17 GDD find texts (each occurred once) plus the six wolf-name places (E11); OUT-1 rows D472–D490; OUT-5 questions Q46–Q50; OUT-9 as technical design §18; the v1.0 plan section and its small edits; two rules in `CLAUDE.md`. Files are in `docs/flesh-out/v1.0/`.
- **Housekeeping:** Q42 and Q43 closed; v0.11 summary question 10 (Q35) marked closed; plan §0.7 already had the v0.11 actual, so nothing added; `tests/content/names.ts` already lists "Gaunt Wolf", so nothing added.
- **Sweep:** 190 earlier rows still read `Proposed` (D39 to D467 in many ranges, plus D446–D467 which D472 names). All are accepted as built by D472's blanket rule; none was edited.
- **Next:** TV.1. **Skipped:** nothing.

## 2026-10-22 — v1.0 TV.1: the Wolf's name
- **The code was already right:** the monster's display name is "Gaunt Wolf" and its id is `wolf`. No id, save fixture or content file contains "gloam-wolf", so there was no stop.
- **Done:** the GDD's six places were fixed in the docs commit; here I corrected one stale code comment in `src/content/monsters.ts` (it still called the name a pending proposal).
- **Left on purpose:** the history note in `tests/content/names.ts` and the history sentence in GDD judgment call 1 (both say "Gloam Wolf" as the old name); `lore-secrets.md` §19 and the logs are not touched, as the plan says. `names.ts` already lists "Gaunt Wolf".
- **Goldens, logs, fixtures, `sim/baseline.json`:** unchanged, so none needed the display-name exception. `npm run check` is green.
- **Next:** TV.2. **Skipped:** nothing.

## 2026-10-22 — v1.0 TV.2: the art contact sheets
- **Extended `tools/contact-sheet.ts`:** `--sheets` also writes the numbered sheets (the old page is unchanged). New files: `tools/contact-sheet-data.ts` (numbering, plan, hashes), `tools/contact-sheet-numbered.ts` (the sheets), `tools/icon-candidates.ts`.
- **156 generated pictures, numbered 1–156 in id order**, on 13 sheets (portraits 3, battle sprites 4, icons and frames 2, scenes 4) plus one app-icon sheet. 16 px icons at 4× on both theme backgrounds; scene overlays over their base hold scene. PNGs are in `docs/flesh-out/v1.0/contact-sheets/`.
- **App icons:** the current tower and three new candidates (A lit gate, B hearth flame, C bell tower), drawn in code.
- **Marks:** `docs/flesh-out/v1.0/art-marks.md` has the number → id table, marks empty (empty = Keep).
- **Keep test:** `art-src/v0.11-hashes.json` records every manifest PNG and the four home-screen icons; `tests/tools/contact-sheet.test.ts` checks each picture not marked Redraw still matches, and that the sheets list every row exactly once.
- **Stop:** the owner marks Keep/Redraw (about 40 at most) and picks an icon. Nothing was added to the game.

## 2026-10-22 — v1.0 TV.3a: the tap-target sweep (report only)
- **Built:** `tests/e2e/polish-tap-targets.spec.ts`, `polish-tap.ts` (the measuring), `polish-screens.ts` (the screens). A planted 30 px button fails it. It only reports until TV.3b (`TAP_STRICT=1` makes it fail).
- **Screen table:** 72 screens, all reached, 0 walk failures: `docs/flesh-out/v1.0/screen-table.md` (fixture and debug commands per screen; kept out of this file because of its size cap). Findings: `tap-sweep-report.txt`.
- **148 findings, in four kinds:** the ⓘ buttons (126, 10 to 18 px); the six oil pickers on the Last Stand screen (173×19); the Villages disclosure on Contracts (23 px high); at 320 px the bottom bar's "More" tab sticks out past the right edge (when there are 5 tabs).
- **Seen while building, not yet fixed:** at 320 px a brand-new game's page is 353 px wide, so it scrolls sideways. The older layout specs use phone emulation, which widens the window to fit, so they could not see this. The sweep uses a plain window of the exact width.
- **Not covered:** the reminder line on the away sheet (TV.7 builds it); Text size steps (TV.4a).
- **Next:** TV.3b. **Skipped:** nothing.

## 2026-10-22 — v1.0 TV.3b: tap-target findings and the Archive tabs
- **Sweep now strict by default and clean:** 0 findings over 72 screens at 320 and 360 px (was 148). `TAP_STRICT=0` only reports.
- **ⓘ buttons:** a 44 px hit area, glyph and line unchanged (negative margins). It grows to the right so it never covers the number beside it; at a sheet's right edge (Rates, and the skills list on Rank) it grows left (`edge`). The first try (always left) covered short numbers like "74", which the sweep caught.
- **Also fixed:** oil pickers on the Last Stand sheet, the Villages fold-out (44 px high), the bottom bar at 320 px (five tabs fit; smaller type under 400 px wide), the Archive tabs (wrap to two rows).
- **The 353 px page at 320 px:** the hold scene (320 px at 2x) was wider than the page. It now shrinks with its card (full size where there is room; at 320 px it is no longer a whole-number scale). New spec `tests/e2e/polish-widths.spec.ts` (plain windows at 320, 360, 900, 1300 px): no sideways scroll, bar inside the window, four Archive tabs inside the window.
- **Old-test edits (D487):** `polish-screens.ts` no longer clicks past the cut-off Names tab. Nothing loosened.
- `npm run check` green. No rule, number, text, save or golden change.
- **Next:** TV.4a. **Skipped:** nothing.

## 2026-10-22 — v1.0 TV.4a: Text size, the setting and the checks
- **The setting:** More ▸ Settings ▸ Text size (Match phone, Large 115%, Largest 130%). It lives in the new key outside the save (`lasthold:settings` / `lasthold-preview:settings`) with `backupReminder`, `lastExportAt`, `snoozeUntil`, `firstSeenAt`; `firstSeenAt` is stamped on the first run. Save schema stays 11. Code: `src/platform/app-settings.ts` (+ unit tests).
- **Reset everything** keeps Text size and the reminder switch and clears the three times (tested, also in the browser). Saving, backup and loading leave the key alone (tested); Paste code, Load file and Restore never write it.
- **Scaling:** one root variable scales the root font size, so rem-sized body text grows. Pixel-font text, pictures, the bottom tab bar and the resource bar undo it. Checked on all 72 screens at 320 px Largest: nothing pixel-font, no picture and no bar scales (it found two cases, fixed: the badge and the small text inside pixel headings).
- **Match phone today:** the app adds no scaling; its text is sized in rem from the browser's base size, so Android Chrome's own text-size setting should reach it. iPhone home-screen apps generally do not follow it. I could not test either on a real phone.
- **Match phone is unchanged:** 5 named screens (rates, roster, hunter sheet, Bestiary, Library) measure the same as the build just before this task (`tests/e2e/baselines/text-size-match.json`). Not compared with the v0.11 tag itself; TV.3b changed a few boxes after it.
- **Overflow at 320 px Largest (report only):** 151 findings on 72 screens: `docs/flesh-out/v1.0/text-size-report.txt` (the hold scenes' resource labels, the Remembering card, hunter sheet, lists). TV.4b fixes them.
- **Checks:** `npm run check` green; tap sweep 0 findings; width spec passes. Specs: `polish-text-size.spec.ts`, `polish-text.ts`.
- **Owner check now:** Text size looks right on your phone? (preview build). **Skipped:** nothing. No old test edited.
- **Owner's phone check (iPhone, preview build):** Large looks good. At Largest, the Settings sheet's Text size row overlaps its own label (the control wraps over it) and much text wraps to more lines; the owner would not use Largest. TV.4b: stack a settings row's label above its control when they don't fit, and fix the rest of the report.

## 2026-10-22 — v1.0 TV.4b: Text size, the overflow fixed
- **Result:** every one of the 72 screens at 320 px at Largest: no sideways scroll, no text outside its box or the window, no clipped text (was 151 findings by the first scan). All 40 names of the reading fit at Largest (added to `remembering-layout.spec.ts`: each name at 320 px Largest, boxes and the overflow scan). The tap sweep finds 0 at Match phone, Large and Largest (`TAP_TEXT=large|largest` runs it at a step).
- **Fixes (CSS only):** at Large and Largest a row or heading that no longer fits **wraps** instead of squeezing its label (this fixes your Settings overlap, the Peasants rows, candidates, the hunter sheet); breakdown lines drop the value under the label; the Hut and Archive section tabs wrap; long identifiers and the credits text break; ⓘ hit area is now centred on the glyph (about 16 px each side) so it never reaches past the content margin. Match phone layouts are not touched by the wrapping rules.
- **My scan is stricter than the plan's wording** (it tests where the text is drawn against its own box, not just scroll sizes, which the ⓘ hit areas trip by design); it still fails a planted clipped line. Strict by default now (`TEXT_STRICT=0` only reports).
- **Baseline refreshed (D487, caused by the ⓘ change):** `tests/e2e/baselines/text-size-match.json`: only the four resource-label widths on the rates sheet moved (−1.8 px) and one width by 0.1 px.
- `npm run check` green; all other browser specs pass (44). **Skipped:** nothing. Pre-existing layout specs untouched except the added Largest check.

## 2026-10-22 — v1.0 TV.5: reduced motion everywhere
- **Rule now:** motion is reduced if the phone says so **or** the Settings switch is on. **One change you may not expect:** the switch's "Off" no longer beats the phone (before, Off forced motion even when the phone asked for less). "System" and "Off" now behave the same. That is what GDD §9.20 says; the three buttons and the save are unchanged. Tell me if you want Off to keep overriding the phone.
- **CSS:** the only three motions (battle-sprite breathing, the reading's fade, the Delve health-bar slide) each sit behind one gate in their own rule. `tests/lint/motion.test.ts` scans every stylesheet and fails on any other; planted cases fail.
- **JS:** `src/ui/motion/registry.ts` is the one place timers for playback and the reading's pace are made; the same test fails on any `setInterval`, `requestAnimationFrame`, `.animate(` or inline transition elsewhere (the game clock's tick is marked "not motion").
- **Playback keeps its timeline and pace** under reduced motion (before, Delve playback jumped to its end); sprites show their first frame only (no breathing, lunge or hit frame). The reading's pace was already unchanged. Sheets and the Hold scene have no motion.
- **Browser check** (`polish-motion.spec.ts`): `document.getAnimations()` is empty on Hold, a sheet opening, a boss fight playback and the reading with the phone setting, and with the switch; with both off the counts equal the build before TV.5 (0, 0, 5, 1; `baselines/motion-counts.json`), and the playback has not jumped to its end.
- **Old tests:** none asserted the old reduced behaviour, so none edited. `npm run check` green; all 48 other browser specs pass. **Skipped:** nothing.

## 2026-10-22 — v1.0 TV.6 (part 1): contrast measured, stopped for the owner
- **Built:** `polish-contrast.ts` + `polish-contrast.spec.ts`: every screen on the list in both themes at 360 px, (text, background) pairs from computed colours; a planted low-contrast pair fails. Report: `docs/flesh-out/v1.0/contrast-report.txt`. Added two screens to the shared list (a document with Ilse's note, the Rime reader after the ending).
- **Result:** about 1,320 failing pairs, but only seven colour pairs cause nearly all: dark dim text (#a0938e) on cards 4.12:1; light dim text 4.44:1; light red (ember) 3.68–4.15:1; dark orange on selected buttons 3.39:1; dark green 4.37:1; a few opacity-dimmed lines.
- **Why I stopped:** no existing token pair passes, and every fix changes a colour you approved (dim text, red, orange, green). Before/after images are in the thread and in `docs/flesh-out/v1.0/contrast/`; nothing is applied yet. The scan only reports (`CONTRAST_STRICT=1` fails) until then.
- **Also fixed:** the Settings sheet's rows wrap, so "Text size" no longer shrinks to "Tex size" next to its buttons at 360 px (a TV.4a miss; the earlier checks did not include Settings at Match phone).

## 2026-10-22 — v1.0 TV.6 (part 2): contrast fixes applied (owner approved option a)
- **Owner approved** the proposal. Token changes only, all Zughy 32: dark `--c-text-dim` #a0938e → #cfc6b8 (4.12 → 7.24:1 on cards, 3.05 → 5.37 on raised); dark `--c-good` #71aa34 → #b6d53c (4.37 → 7.33); light `--c-text-dim` #5a5353 → #5e3643 (4.44 → 5.96); light `--c-ember` #a93b3b → #7a444a (3.68 → 4.51 on the page, 4.15 → 5.08 on raised); selected-button text `--c-ember` → `--c-warn` (dark 3.39 → 4.92).
- **Result:** strict scan, both themes, 74 screens (the list now includes a document with Ilse's note and the Rime reader), 9,472 text elements: **0 failing pairs** (was ~1,320). Styled cards covered: Rime reader, document reader, Ilse's note, the reading, scene sheets.
- **Scope note:** text in a dimmed row whose control is disabled (ineligible hunters in the hunt party picker) is exempt, as WCAG 1.4.3 says for inactive controls; the scan skips exactly that and a planted case proves it still catches the rest. Light ember passes by 0.01 on the page background; if that is ever touched, #5e3643 is the safer value.
- **Checks:** `npm run check` green; all 75 browser specs pass (tap sweep included). **Skipped:** nothing. Before/after: `docs/flesh-out/v1.0/contrast/`.

## 2026-10-22 — v1.0 TV.7: the backup reminder
- **Built:** `backupReminder(now, settings)` (pure, `src/platform/backup-reminder.ts`): due at 14 whole days from the later of last export and first run, hidden while snoozed or switched off, nothing if the clock is behind. The away sheet shows GDD 9.20's line and its two buttons below the summary (Not now: 7 days; Back up now: opens Save & Data, 1 day). Settings has Backup reminder On/Off; Save & Data shows "Last exported: …" with an Export… button that scrolls to Copy save code.
- **Exports:** only Copy save code (when copied) and Download save file (when started) count. Copy diagnostics, Paste code, Load file, Restore and Import do not.
- **After Reset everything:** firstSeenAt stays cleared (the TV.4a test pins it), so the reminder is silent until the next start stamps it, then counts 14 days from there. No old test edited.
- **Debug:** "Set last export age" (days) in the debug panel writes only the settings key; it also moves the first-run time back so the line can show at once. It does not set debugUsed (browser-tested on a new game).
- **Tests:** table test with a fake clock (13 rows plus buttons, reset, text); a storage test shows the save key is byte-identical after snoozing, exporting and the debug age. In the browser the live game keeps moving, so "same now" is proved at storage level, not by comparing saves. `polish-backup.spec.ts`: line fits at 320 px at Largest, buttons 44 px. Shared loader now pretends first run 20 days ago so the sweeps see the line.
- **Checks:** `npm run check` green (3,058 tests); all browser specs pass. **Skipped:** nothing. Onward does not exist on this away sheet (it has Close); the line never blocks it.

## 2026-10-22 — v1.0 TV.8a: art batch 1, drawn (not yet approved)
- **12 pictures redrawn** (all marked, D492): portraits of Bies, Huldra, Kikimora, Nix, Poludnitsa, Ribbonshade, Rusalka, Strzyga, Upyr, Vodyanoy; sprites of Anvil-wight and Upyr. Ids and sizes unchanged; palette only. Sheets: `docs/flesh-out/v1.0/before-after/tv8a-portraits.png` and `tv8a-sprites.png`. Previous PNGs are in `art-src/previous/`.
- **Per-id:** the eight portraits live in `tools/draw-monster-redraws.ts`, Ribbonshade's in `draw-cursed.ts`, Upyr's edited in place; each is used by its own species only. The Keep hash test passes: nothing else changed.
- **Downed frame:** it was not a dot; dimming turned dark cloth to ink, invisible on a dark ground. Those two sprites now set a flag, dim less and take a slate rim. No other sprite changed.
- **Notes for the owner:** Nix's portrait is a dark horse in profile as marked, but its sprite is pale; Ribbonshade's ribbon is blue as marked, its sprite's is red. Nix is the weakest picture.
- **Tools:** `tools/before-after.ts` makes the sheets; the numbered-sheet frame strips no longer shrink (flex fix). `Canvas.polygon` added. **Skipped:** nothing. TV.8 stays open until approval.
