# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `milestone/v1.1` (from `main` at the v1.0 merge, tag `v1.0.0`).
- **Milestone:** v1.1 "The Hold's Layout" (D498–D508), in progress.
- **Last task:** TL.3 (layout commands, blueprint protection, auto-placement, Long Night).
- **Next:** TL.4 (debug layout commands).
- **Open questions:** Q52 (piece counts in the docs are off by one; informational).

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
- **Owner review:** all passed except Nix. Nix's portrait now has a shimmering water mane; the owner also asked for the Nix and Ribbonshade sprites to match, so rows 148 and 150 in `art-marks.md` are now Redraw (14 pictures in TV.8a, 2 over the 12 cap, at the owner's direction). Nix sprite: dark river horse; Ribbonshade sprite: blue stitched ribbon, singed hood. Sheet: `tv8a-nix-ribbon.png`. Check green; no old test edited.

## 2026-10-22 — v1.0 TV.9a: art batch 2, part a (drawn, not yet approved)
- **Plan for TV.9 (31 pictures marked):** 9a = 4 creature portraits, 6 hunter portraits, 2 creature sprites (12). 9b = 5 hunter portraits + 7 hunter sprites. 9c = the other 7 hunter sprites. No guardian is marked.
- **Drawn:** Barrow-King (bronze crown, mail and fur), Likho, Mara (wider shroud, reaching hand), Stoneback (brow, mossy shoulders); Arvid (beard over the chin into braids, runed axe), Bjarna (barbed rime-spear, connected braid), Gest (pine torch), Halvar (charcoal-burner's axe), Herdis (crook, headband, fewer frost flecks), Ostap (beard); sprites Mara (downed frame rimmed) and Mother of the River (reed crown, gown). Sheets in `docs/flesh-out/v1.0/before-after/tv9a-*.png`.
- **Per-id:** creature art edited in place (each function is one creature's); hunters through `tools/draw-hunter-redraws.ts`, keyed by the hunter's own portrait object, so the shared drawing and unmarked hunters are unchanged (Keep hash test passes).
- **Found:** the shared drawing hides the eyes under caps (Arvid, Gest, Halvar, Ostap); the redraws draw them back. Not changed for hunters not marked.
- **Check green; no old test edited. Skipped:** nothing. TV.9a stays open until approval.
- **Owner review of 9a:** all pass except Likho, Bjarna, Halvar's and Arvid's axes and Herdis's crook. Second pass: Likho redrawn (gaunt angular face, ragged strands, crooked mouth of jagged fangs); Bjarna's braid is now a three-strand plait with a blue tie, joined to a lock under the hood; both axes have sharp edges, points and toes; Herdis's crook is a big open hook. Check green.
- **TV.9a approved** by the owner after one last tweak: Bjarna's braid about 20% thinner (7 to 6 px, tail 5 to 4).


## 2026-10-22 — v1.0 TV.9b: art batch 2, part b (drawn, not yet approved)
- **12 pictures:** portraits Radek (blade-up spade, tapered, silver-shod edge), Radmila (braid joined to the hair on the left, marsh-wife shawl and broad shoulders, apron with a silver spoon; no satchel), Ragnhild (eyes back, floating braid gone, bone needle through the cap), Sigrun (hair framing the face, dark leather forge-apron, bandaged half-hand), Toma (half-beard joined across the chin, copper kettle with spout); sprites (downed frame only) of Radek, Radmila, Ragnhild, Sigrun, Stanko, Toma, Vesna. Sheets: `docs/flesh-out/v1.0/before-after/tv9b-*.png`.
- **Downed pose:** the body was dimmed to ink and vanished, leaving head and weapon apart (the "gap"). These seven now use the TV.8a rim (set per hunter id in `tools/sprite-hunters.ts`, `REDRAWN_DOWNED`); the weapon already turned with the body. 9c adds its seven ids. All other frames and sprites are byte-identical.
- **Per-id:** portraits in `tools/draw-hunter-redraws.ts` (keyed by the hunter's own portrait object).
- **Docs typo fixed:** rows 128 to 140 of `art-marks.md` had an extra empty cell, so the Keep hash test did not read them as Redraw. Removed the cell; no mark changed.
- **Check green; no old test edited. Skipped:** nothing. TV.9 stays open until 9b is approved and 9c is done.
- **Owner review of 9b:** all pass except Radek's spade and Radmila's braid. Second pass: the spade is bigger (rounded shoulders, pointed tip, silver edge, ridge, socket); the braid is about 30% thinner (plait 4 to 5 px wide instead of 7 to 8). Sheet: `tv9b-pass2.png`. Check green.
- **Radmila's braid, third pass:** the lock overlaps the hair and the plait leans toward the neck, so it touches the head all the way (no gap). Radek's spade approved. Sheet: `tv9b-pass3.png`.
- **Radmila's braid, fourth pass:** the lock now runs up into the hair above the headband, closing the gap the owner circled. Sheet: `tv9b-pass4.png`.

## 2026-10-22 — v1.0 TV.9c: art batch 2, part c (drawn, not yet approved)
- **TV.9b approved** (after passes on Radek's spade and Radmila's braid, joined to the hair).
- **7 pictures:** sprites (downed frame only) of Arvid, Bjarna, Gest, Halvar, Herdis, Ostap, Zora, with the same rim as 9b; `REDRAWN_DOWNED` in `tools/sprite-hunters.ts` now holds all 14 hunters. Idle, lunge and hit frames are byte-identical. Sheet: `docs/flesh-out/v1.0/before-after/tv9c-sprites.png`.
- **Check green; no old test edited. Skipped:** nothing. No guardian is marked. TV.9 box ticks on approval; TV.8's is ticked now.

## 2026-10-22 — v1.0 TV.10a: art batch 3, part a: icons (drawn, not yet approved)
- **TV.9 approved** (plan box ticked). **TV.10 plan:** 10a = 12 icons (this); 10b = 8 scenes (104, 106 to 109, 114, 116, 117); 10c = the app-icon files (192, 512, maskable, 180, favicon) with the preview corner mark; the app icon stays the tower.
- **12 icons:** the three Bombs (wide clay body, band, bright fuse spark) and three Oils (slim vials), Coffin Silver (metal rim, skull stamp), Yrsa's Thole (one black-oak peg, rope loop), the three Delve frames (Faint notched corners; Warm and Bright corner diamonds, so Faint now differs from Common), the Star (legs taper). Sheet: `docs/flesh-out/v1.0/before-after/tv10a-icons.png`.
- **Per-id:** each change is inside that icon's own function, or a new vial helper used by the three oils only; the potions and other flasks are unchanged (hash test passes).
- **Docs typo fixed again:** ten more rows of `art-marks.md` (the sibling rows) had a stray empty cell, so the hash test did not read them as Redraw. Removed it; no mark changed.
- **Check green; no old test edited. Skipped:** nothing. TV.10 stays open.

## 2026-10-22 — v1.0 TV.10b: art batch 3, part b: scenes (drawn, not yet approved)
- **TV.10a approved.** **8 scenes:** Hamlet bell (own wooden post and crossbeam); the four frost looks (clean rime: caps on roofs and trees with a few icicles, broken lines on ledges and sills, the foot of the walls, the grass edge and the path edges; no random speckle); Bell-Watchers (stone gatehouse arch, bronze bell on an iron hook, no white line); Moot (five chairs behind the table, bread on it, the empty sixth chair at the head); Quenchers (glowing coals, flagstone seams and the crack, Bohdan's cold grey stone on the hearthstone; the brown box is gone). Sheet: `docs/flesh-out/v1.0/before-after/tv10b-scenes.png`.
- **Per-id:** the Hamlet bell only changes for the hamlet; the other ages' bells are byte-identical. The frost code is shared by all four ages (all four are marked). Order scenes edited in place.
- **Tool:** `tools/before-after.ts` now shows look and cosmetic overlays on top of their hold scene, and scenes at their real height.
- **Seen, not changed:** the Quenchers' stone is small (5 px); the Moot's sixth chair stands at the right end (the table is seen from the front, so "the head" is a side).
- **Check green; no old test edited. Skipped:** nothing. TV.10 stays open (10c: app-icon files).

## 2026-10-22 — v1.0 TV.10c: app icon files and the preview corner mark (not yet approved)
- **TV.10b approved.** The app icon stays the tower; no candidate used (D492). `tools/make-icons.ts` now writes the live set (192, 512, maskable 512, apple-touch 180, and a new favicon 32) to `public/icons/` and the marked set to `art-src/icons-preview/`. The four existing live files are byte-identical.
- **Corner mark:** a cyan triangle with a pale edge in the top-right corner (inside a maskable icon's safe zone). The preview build copies the marked set over the icons after the bundle is written and before the service worker is built (`previewIcons` in `vite.config.ts`), so the live bundle never holds it. Checked by building both channels: preview `dist` icons equal the marked files; live equal `public/icons`.
- **Page:** the favicon link now points to `favicon-32.png`; the apple-touch-icon link was already there; the built manifest lists 192, 512 and the maskable 512. New test `tests/tools/app-icons.test.ts` (sizes, no mark in live, mark inside the safe zone, links, manifest). Sheet: `tv10c-icons.png`.
- **Note for the playtest:** iOS does not refresh a home-screen icon, so the preview install must be removed and re-added to show the mark (after exporting the save code, D489 (4)). Could not check on a real phone.
- **Check green (3,066 tests); no old test edited. Skipped:** nothing.

## 2026-10-22 — v1.0 TV.11: the balance audit and the species estimate (stopped for the owner)
- **TV.10 approved** (box ticked). **Audit:** full suite, 55 runs, 330 s: **all 55 rows pass**, every player equals the v0.11 baseline (176 of 176 "same"). Nothing retuned. Bastion with the stand available is at 96 h (day 4.0), the late edge of days 3 to 4; reported only. Report: `docs/flesh-out/v1.0/balance-audit.md`.
- **Species variant (report-only):** `sim/species-variant.ts` and `sim/species-order.ts`, with tests (`sim/species-order.test.ts`: nothing judged names it; the rule). Core change: an optional contract-order hook in the policy memory, unused by every player (reports unchanged). Control, A and B, 5 seeds, 25 cycles: **none reaches all 16 Studied**, so the ending never becomes choosable; names and stand at cycle 6 to 7 as in D470. Report: `docs/flesh-out/v1.0/species-estimate.md`.
- **One-seed look:** Standard has 10 of 16 Studied by day 20, then stalls at 10 to 12; Draugr, Leshy, Strzyga and Rimewrought stay at Identified. The variant's rule does not help. Cause not measured.
- **Stop:** the 15 runs took 17.3 min (limit 10, D485 (4)). Q46 stays open with this result.
- **Check:** the full check was green before the variant was added; run again at the end of TV.12. **Skipped:** TV.11 box not ticked (waiting for the owner).
- **The short look (owner's go):** the four missing species (Draugr, Leshy, Strzyga, Rimewrought) are rare on the board: 0 to 8 contracts in 12 cycles against about 90 for the Wolf, because each Long Night resets the hold to tier 1 and these only come at tier 3 or 4 up, in one place each; nearly all that arrive are launched and won. Rough estimate: about 25 cycles or more for Standard to Study all 16 (fits the owner's about 20). The rule could not help. Details in `species-estimate.md`.

## 2026-10-22 — v1.0 TV.11 finished: Q46 answered (c), the card line built (D493)
- **Owner chose (c) and approved the wording** "Not yet known well: Draugr, Leshy." The Remembering card (not-open form only) now names the contract species met (Identified or better) but not yet Studied, in the Bestiary's order; absent when there is none. Worked out from the state each time (new field `missing` on the card view, so the existing `counts` and their test are unchanged); no save change, no rule or number changed. GDD §5.15.2 line updated; D493 stays Proposed.
- **Tests:** new `tests/remembering/missing-line.test.ts` (wording, absent, only Identified-and-not-Studied, open form clears it, after-choice forms). Browser: remembering-layout, widths, contrast and tap-target specs all pass (32).
- **TV.11 box ticked.** Audit and species files are in `docs/flesh-out/v1.0/`. **No old test edited. Skipped:** nothing. The rest of Q46 (the four rare species) is left as is.

## 2026-10-22 — v1.0 TV.12: release checks
- **(a) Offline smoke, extended** (`smoke.spec.ts`): after the offline reload, still offline, it opens the debug page, gives +1K wood and +1K food, buys two more Cottages and reloads offline: ×3 is still there. Passes with the other four smoke tests.
- **(b) Credits:** new test in `credits.test.ts`: the pack list in `docs/credits.md` and the manifest's `pack` rows agree in both directions (names and image counts), and every pack row has a credit. Passes.
- **(c) Old saves:** `saves.test.ts` now also checks that its name filter leaves no `.json` fixture out and that `v11-played.json` is in. All 25 fixtures load, migrate, validate and round-trip.
- **(d) Benchmark** (4× slowdown, this container; three runs): every row inside 2× except "odds with 3 candidates" (229 to 245 ms against 200), which fails as expected (D445). That failure stops the test before the later rows, so I read them from the first run, where nothing failed early: Orders card 0.1 ms, sheet 0.1, standing 0.0, v9→v10 18 ms, v10→v11 17 ms, boss preview 63, boss Suggest 495, hunt odds 756, hunt Suggest 1416, Last Stand preview 566; reading start 16 ms. Plain odds read 210 ms once (over 2×) and 178 and 186 ms twice: CPU noise.
- **Size, proposed (D494):** gzip of every file ≤ **600 KB**. v0.11 500 KB, v1.0 506 KB (+1.3%). Not enforced; **yours to approve.**
- **(e) Version:** About this build already shows Version (technical design 11.2). Nothing added.
- **Old tests:** only extended, none weakened. **Skipped:** nothing.

## 2026-10-22 — v1.0 TV.13: docs and the playtest hand-off
- **Owner approved the 600 KB row** (D495, Decided; GDD §6.5 has it as a measured row, not a check in `npm run check`).
- **Plan:** TV.12 and TV.13 ticked; v1.0 `Status: in progress` (playtest pending). Playtest checklist is in the plan and copied into the PR.
- **Pull request** opened from `milestone/v1.0` to `main` with the template. Not merged, not tagged.
- **Not done on purpose:** `sim:accept`, merge and tag wait for the owner's "playtest passed" (the audit in TV.11 already showed every report equal to the v0.11 baseline, so the baseline should only move its milestone label).
- **Please check CI** on the PR (each simulator job under 5 min, D320; WebKit determinism; e2e). I could not see them from here.
- **Deferred, by decision:** audio, the Descent, rising difficulty (D476, D477); event cosmetics and legendary hunters' animation (D490); screen-reader labels (D489); Q41 and Q48 name searches; the four rare species' slow arrival (Q46).
- **Skipped:** nothing. No old test edited.

## 2026-10-22 — v1.0 TV.13 (2): CI found two font-dependent checks (D496)
- **Playtest passed** (owner). `sim:accept` ran: the baseline is byte-identical to v0.11 (no new rows), so nothing to commit.
- **CI e2e failed on 2 of 81 tests** (first run was an apt 403 on the runner). Cause: the body text uses the system font; CI's font is wider than this machine's. (1) "Match phone is unchanged" compared widths recorded here. (2) At Largest, the tab "Contracts (1)" spilled out of its 64 px tab on 13 screens, and the credits text by about 3 px.
- **Reproduced** locally with DejaVu Sans as the system font (same numbers as CI).
- **Fix (owner chose a):** tab labels wrap (`overflow-wrap`), credits `break-spaces`; the Match baseline file holds a font fingerprint (`_font`) and the width comparison runs only on that font (the scaling checks always run). Weaker on CI by design, with the owner's yes.
- **Checked:** all 80 browser tests pass with the wider font; same suite with this machine's font run before the push. `npm run check` green.
- **Skipped:** nothing. No old test edited besides `polish-text-size.spec.ts` (mine, TV.4a) and its baseline file (one key added).

## 2026-10-22 — v1.0 milestone end
- **The owner said the playtest passed.** `sim:accept`: baseline identical to v0.11 (nothing to commit).
- **CI on the final code:** `check`, `e2e` (80 browser tests), simulator shards, judge, deploy all green. `bench` red on the known row "odds with 3 candidates" (207, then 225 ms against 200; D445). The owner agreed to merge anyway (D497). No limit changed.
- **Merged** PR 17 from `milestone/v1.0`. **The owner tags `v1.0.0` by hand.**
- **Deferred, by decision:** audio, the Descent, rising difficulty, event cosmetics and legendary hunters' animation, screen-reader labels, Q41 and Q48, the rare species' slow arrival (Q46).

## 2026-10-23 — v1.1 docs commit
- **Owner said yes to D508** (D498–D507 accepted as written, no exceptions) and confirmed the `v11-owner.json` export. I marked D498–D507 Decided on that basis.
- **Preconditions checked:** `v1.0.0` is tagged and on `main`; baseline is the accepted v1.0 one. Branch `milestone/v1.1` made from `main`.
- **Applied:** decisions D498–D508; 16 exact GDD edits (all matched once); questions (Q41, Q46, Q48 closed); plan v1.1 + outlines v1.2–v1.5; technical design §19 plus schema 12 and `holdView` in §5.2/§9.4/§18; two names; two CLAUDE.md rules. Flesh-out files are in `docs/flesh-out/v1.1/`.
- **Old `Proposed` rows:** many older rows still read Proposed; D472's blanket rule and D498 cover them. I did not edit any.
- **Not done:** `v11-owner.json` file itself is not in the repo yet (needed at TL.1).

## 2026-10-23 — v1.1 TL.1: save v12 and the layout catalog
- **Built:** schema 12 with `state.layout` (placed coordinates, ghosts flag); the v11 to v12 migration (canonical layout for migrated saves, Hearth Hall only for a new game); the layout guard (bounds, Hall anchor 2..4, overlaps in catalog order, unknown keys dropped, all with warnings).
- **Where things live:** the piece list, unlock levels, Rank clearings and canonical layout are data in `src/content/hold-layout.ts` (the lint rule bans number tables in `core/systems/`); `src/core/systems/layout-catalog.ts` holds the reads.
- **Fixtures:** your real save as `v11-owner.json`; `v12.json` (it after migration); `v12-played.json` (72 h of Standard play). Made by `scripts/make-v12-fixtures.ts`.
- **Checked:** every fixture loads with no warnings and round-trips; golden fights and recorded stands replay; schema 13 refused; layout block about 1.1 KB (limit 1.5 KB). `npm run check` green.
- **Old tests edited (D507 (1), and Q51 with your yes):** `v11-migration.test.ts` (schema number, newer-version case); `perks.test.ts` (unseats the copies first, since your Moot is seated); `opening.test.ts` (list of played saves gains three files). Nothing loosened.
- **Docs off by one (Q52):** the docs say 39 pieces, 42 tiles, 22 open; the listed pieces are 40, 43 and 21. I built the list as written; the GDD is untouched (your gate).
- **Env:** the installed formatter was older than the project asks for; ran `npm ci`. Not a repo change.

## 2026-10-23 — v1.1 TL.2: piece states, looks and the grid view
- **Built** (`src/core/systems/layout.ts`): the four exclusive piece states; the look of each piece (level-building tiers, plot densities; the thresholds are data in `content/hold-layout.ts`); the 16 wall connection masks; and the memoized grid view (active pieces, ghosts, tray, frost/lamp look, where each cosmetic shows).
- **Non-coupling (S11):** a test scans all of `src/core` and fails if any file outside a short list mentions the layout. The list is the state, the save and the layout's own files. TL.3 must add the command and Long Night files to it on purpose.
- **Checked:** every piece unlocks at its threshold and not one before; state counts at each Rank (13, 32, 36, 40 active with everything built and the canonical layout); Citadel defenses all active at Citadel, row 0 waits for Bastion; 16 masks; memoizing sees in-place changes. `npm run check` green (3,194 tests).
- **Note for TL.7/TL.8:** the view gives `activeCount` and `pieceCount` (40). The sheet's subtitle string says "total = 39"; that is the Q52 off-by-one, so the number to show is for you to decide.
- **Note:** pieces whose saved place is inside the clearing but under another piece are not possible by the guard or by TL.3's rules; the view does not handle them.
- **No old test edited.**

## 2026-10-23 — v1.1 TL.3: layout commands and auto-placement
- **Built:** the five commands (`layout.place`, `unplace`, `autoArrange`, `clear`, `setShowGhosts`) and `autoPlaceUnlocked`. Moves, swaps and the Hearth Hall's 2..4 limit work as the docs say; refusals change nothing. The order data is in `content/hold-layout.ts`.
- **Hooks:** buying and upgrading place only pieces that this action just unlocked (a piece you sent to the tray stays there); a Rank-up wakes ring pieces and places the tray; a new game and the start of a new cycle place the starting Farm and Camp. The Long Night keeps the saved layout exactly (tested).
- **Choices to check:** (1) a blueprint tile also counts as taken when finding a free tile, so an automatic placement never sits on a built-later piece's saved spot; (2) a defense with no open defense tile (row 0 before Bastion) waits in the tray, it does not take an inner tile; (3) refusal reasons are short technical strings, not player text.
- **Tests:** new `tests/layout/commands.test.ts` (move, swap, Hall, locked rings, blueprint protection, Rank-up, Long Night, layout-only changes). The non-coupling list gained `commands/apply.ts`, `commands/layout.ts`, `commands/types.ts`, `long-night/reset.ts`, `systems/layout-place.ts`. `npm run check` green; golden fights and stands unchanged.
- **Two of this milestone's own tests changed** (not in D507's list; they asserted the old new-game state, which you told me to change): `v12-migration.test.ts` (new game now has the Farm and Camp placed) and `layout.test.ts` (grid view of a new game). Nothing loosened.
- **Docs note:** GDD M3 says a new game places "the Hearth Hall only"; I followed your instruction that the Farm and Camp end up placed. The GDD is untouched.
- **Next:** TL.4. **Skipped:** nothing.
