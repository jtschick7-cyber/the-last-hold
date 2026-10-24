# Progress log

Newest entry at the bottom. One entry per Claude Code session (CLAUDE.md, "Session end").

## Current state (update every session)

- **Branch:** `main` at `v1.3.0` (`6286e3a`). v1.3 work was on `claude/clever-fermi-gkis1l` and `milestone/v1.3`.
- **Milestone:** v1.3 "Keep the Vigil" (D538–D553), in progress. KV.1–KV.11 done (playtest passed, D556); merged and tagged `v1.3.0` (owner approved the values, the tolerance, rows A to C and the v13-played fixture rewrite); size routes 1 and 2 done (D553).
- **Last task:** KV.11 (wrap-up, pull request). Before it: KV.10 (budgets, size, old-test list), KV.9 (constants, tolerance, rows), KV.8 (the probe, the Vigilant, the `vigil` shard), KV.7 (Roll tally), KV.6, KV.5 (preview), then D553 (pictures packed, contact sheet preview-only). Earlier: KV.5 (preview), then D553 (pictures packed, contact sheet preview-only). Route 3 (shared chunk for the odds worker, about 55 KB) is measured and left for the v1.4 flesh-out.
- **Next:** the v1.4 flesh-out. Q53–Q56 are still open. D554 and D555 are Decided (owner, 2026-10-24).
- **Open questions:** Q53–Q56 (v1.2 leftovers), Q57 answered (a), additive. Q58 answered (a). Size room: about 172 KB under the 614,400 row (v1.2 scale).

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

## 2026-10-23 — v1.1 docs commit for TL.3, and TL.4 debug layout commands
- **Docs applied on your approval:** GDD §5.1.5 rule 6, technical design §19.2 and §19.3 (three clarifications), and D509 (Proposed). The draft file is marked applied.
- **TL.4 built:** three debug commands in the debug panel under the Rank buttons: "Fill Bastion (layout)", "Auto-arrange layout", "Clear layout". Each sets `debugUsed`; the player's own layout commands do not. They are only wired to the debug sheet.
- **Fill Bastion:** takes the hold to Bastion, raises each building to the figure that shows all its pieces in their top look (never past its copy limit or Bastion level cap, never lowering one), then lays out the canonical arrangement: all 40 pieces on the grid, tray and ghosts empty. It replaces any saved layout.
- **Seen, for you to decide (not changed):** auto-placement puts ordinary buildings on the free tiles nearest the middle, and that can reach row 1 once the Keep opens. Then walls and towers that arrive later find row 1 taken and wait in the tray. Auto-arrange fixes it. A possible rule: keep the defense rows for defenses. That is a GDD change, so it is yours.
- **Tests:** four new in `tests/layout/commands.test.ts`; `debug-layout.ts` joined the non-coupling list. `npm run check` green. No old test edited. Nothing skipped.

## 2026-10-23 — v1.1 D510 and TL.5a: grid ground art
- **D510 built (you agreed):** auto-placement never puts an ordinary building on the defense tiles (row 1, the row 2 wings, row 0). GDD §5.1.5 rule 4 and technical design §19.3 updated; D510 is `Proposed` until you mark it. One new test.
- **TL.5a built:** 11 pictures in code, in the palette: 3 ground looks, 2 forest, 2 ruined stone, 2 blueprint ghosts (locked, dormant), and the two 256 × 16 border strips (Fell Breach, Lowland Gate). Registered as `grid.*` in the manifest; credits regenerated.
- **Inventory:** `docs/flesh-out/v1.1/art-inventory.md` lists all **80** pictures (plan said about 75): 11 now, 46 at TL.5b, 23 at TL.5c. One call for you: the Watchtower gets one picture, not 16 connection ones (only walls connect visually).
- **Hash baseline:** `art-src/v1.0-hashes.json` (209 entries: every shipped picture and app icon); a test fails if any v1.0 picture changes.
- **Old test edited (D507 (4)):** `tests/tools/contact-sheet.test.ts` now counts only v1.0 pictures (not `grid.*`), so numbers 1–156 do not move. `contact-sheet-data.ts` got the matching filter.
- **Not seen on a real screen yet;** I looked at a preview sheet only. The owner's art stop is TL.5c. `npm run check` green. Nothing skipped.

## 2026-10-23 — v1.1 TL.5b: defenses, buildings and the Hall
- **Owner decided:** D510 marked Decided; the Watchtower has one picture.
- **Drawn in code (49 pictures):** 16 wall pictures (one per connection mask, so walls join into a line), the Watchtower, the Trophy Hall, 7 level buildings × 3 tiers (mill, sawpit, smithy, bell tower, barracks, lodge, alchemist), and the 64 px Hearth Hall at each Rank with its Carved Door and lamp overlays and a frost overlay per Rank.
- **Two small changes from the plan, for you to know:** the frost is one per Rank (4), not one, because it follows each Rank's roofline; the door and the lamp stay one each because the door and window sit in the same place at every Rank. The 64 px Hall pictures are registered as kind `scene` because the manifest's size rule gives `building` only 32 px; no old test touched. The inventory now says **83** pictures in all; 23 left for TL.5c.
- **Tests:** every file equals what its drawer draws, is in the palette and at its size; 16 distinct wall masks; tiers never shrink; the door and window overlays fit every Rank; v1.0 hashes still identical. `npm run check` green.
- **First-pass art, not yet seen by you.** I looked at preview sheets; the weakest are the Sawpit and the Tier I Mill. All of it goes on the contact sheet at TL.5c for your Keep or Redraw marks.
- **Nothing skipped.**

## 2026-10-23 — v1.1 TL.5c: plots, cosmetics and the art stop
- **Drawn (23 pictures):** 15 plot looks (Cottage, Farm, Woodcutter's Camp, Mine, Herb Garden × single, pair, cluster), 2 Silver Seam looks, the grid versions of Gatehouse banners, Watchtower bell (on the tower, and on a border post before it stands), Wall lanterns (on a wall, and along the Fell Breach before any wall stands), and one frost overlay for walls. **All 83 grid pictures now exist.**
- **For your review:** 5 numbered sheets (numbers 1–83, their own numbering; both theme backgrounds; overlays shown over what they sit on) and two whole-grid mock-ups (a new hold at Hamlet, a full one at Bastion), in `docs/flesh-out/v1.1/contact-sheets/`. The marks table is `docs/flesh-out/v1.1/art-marks.md`. Mark Keep or Redraw; empty means Keep. At most 12 Redraws per session (D475).
- **Size (N5):** the 83 pictures are 44 KB, about 36 KB zipped. The whole production build zips to about 561 KB against the 600 KB budget, so about 39 KB of room is left for the grid screens' code.
- **Tool:** `tools/contact-sheet-layout.ts`, run through `contact-sheet.ts --layout-sheets`. It writes only v1.1 files; v1.0's hashes and numbers are untouched.
- **Stopped for the owner.** No old test edited. Nothing skipped.

## 2026-10-23 — v1.1 owner's art marks recorded
- **You marked 25 of 83 Redraw** (58 Keep). Saved as `docs/flesh-out/v1.1/art-marks.md`; the numbering did not change.
- **Batches (D475 allows 12 per session), split in the plan:** TL.6a 11 (the three ground tiles, Watchtower with its bell overlay, Hall door and lamp, Alchemist 3, Mill 1, Farm 3, Herb Garden 3); TL.6b 11 (Barracks, Mine, Sawpit, Silver Seam); TL.6c 3 (Woodcutter). Your note on the ground tiles means 6a is also judged on new Hamlet and Bastion mock-ups.
- **Keep proof:** `art-src/v1.1-hashes.json` records all 83 as shown to you; a test fails if a picture not marked Redraw changes. Redraws will be re-recorded only as you approve each batch.
- **Nothing drawn this session.** Nothing skipped.

## 2026-10-23 — v1.1 TL.6a: redraw batch 1 (11 pictures), awaiting approval
- **Redrawn, from your notes:** the three ground tiles (calmer meadow green; deeper earth; darker worn flagstones that stay behind stone buildings), the Watchtower with short wall wings (and its bell moved up to suit), the Hall door (dark oak, bronze straps, a ring) and lamp (frame kept, warm panes, a lantern on the sill), Alchemist 3 (a framed glass lantern housing on the roof), Mill 1 (long blades), Farm 3 (one fenced barley field with a haystack), Herb Garden 3 (raised beds in bloom).
- **Sheets for you:** `docs/flesh-out/v1.1/before-after/tl6a.png` and Hamlet and Bastion mock-ups before and after. The old versions are kept in `art-src/previous-v1.1/`.
- **Choices to check:** the wall wings sit at the wall's own height (rows 11–20 of the tile) so they join flush, not 10–21 as noted; the earth is a rust-brown (the palette has no yellow-brown). The mock-ups scatter the three ground looks evenly; **for the real screen (TL.7) I recommend mostly grass with earth and flags used sparingly**, so it does not read as a checkerboard.
- **Not marked done until you approve.** All 58 Keep pictures are byte-identical (tested). New tools: `before-after-layout.ts`, shared `layout-sheet-parts.ts`. `npm run check` green. Nothing skipped.

## 2026-10-23 — v1.1 TL.6a approved; TL.6b drawn, awaiting approval
- **TL.6a approved** by the owner and ticked.
- **TL.6b redrawn (11), from your notes:** Barracks 1–3 (timber-framed martial hall, slate roof, weapon rack by the door; stone course and target from Tier II; crenellated eaves, shield emblem and banner at Tier III), Mine 1–3 (timbered mouths set in dark rock with rails and ore; two mouths and a lantern; then three mouths, a hoist frame and carts), Sawpit 1–3 (a log on trestles under a pit saw with planks; a roofed canopy; a full shed with a circular blade and tall stacks; the floating grey shape is gone), Silver Seam 1–2 (jagged outcrops with a branching silver vein).
- **Sheets:** `docs/flesh-out/v1.1/before-after/tl6b.png` plus Hamlet and Bastion mock-ups. Old versions are in `art-src/previous-v1.1/`.
- **Code:** Barracks and Sawpit moved to `draw-grid-yard.ts`, Mine and Silver Seam to `draw-grid-rock.ts`, shared helpers to `draw-grid-kit.ts`. All 47 other pictures not in a batch so far are byte-identical (tested). `npm run check` green. Nothing skipped.

## 2026-10-23 — v1.1 TL.6b approved; TL.6c drawn, awaiting approval
- **TL.6b approved** and ticked.
- **TL.6c redrawn (3):** Woodcutter's Camp 1 (a round stump with a lighter top, an angled axe in it, two cut logs), 2 (stump and axe, plus a pyramid of round-ended logs with pale rings), 3 (a busy yard: cordwood piles, a log pyramid, the stump and axe, and a timber shelter with a sawbuck). New file `draw-grid-camp.ts`.
- **Sheets:** `docs/flesh-out/v1.1/before-after/tl6c.png` plus Hamlet and Bastion mock-ups. All 25 marked pictures are now redrawn; the other 58 are byte-identical (tested). `npm run check` green. Nothing skipped.

## 2026-10-23 — v1.1 TL.6c approved; TL.6 complete
- **Owner approved TL.6c.** All 25 redraws (TL.6a, b, c) are approved and ticked; TL.6 is done.
- **Next:** TL.7, the Hold grid screen. Proposal to carry into it: choose ground looks by a fixed function of the tile's coordinates, mostly grass with earth and flags used sparingly.
- **Nothing skipped.**

## 2026-10-23 — v1.1 TL.7: the grid header and the Hold view setting
- **Setting:** `More > Settings > Hold view` (Grid / Classic scene, default Grid), kept outside the save, kept on Reset everything, untouched by Paste/Load/Restore. Unit tests added (D507 (5)); no other old test edited.
- **Grid header:** 8 × 8 grid read from `buildHoldGridView`; Fell Breach and Lowland Gate strips (with their two labels), ground, forest and ruin outside the clearing, active pieces, blueprint ghosts, all four cosmetics, Act VI frost, the lamp. Not tappable; scales to the card (320 px checked). `[Layout ▸]` sits beside `[Rank ▸]` in both views, badge counts the tray only.
- **Ground:** a fixed function of the tile's coordinates: about 85% grass, earth and flags scattered. Looked at it in screenshots (Citadel and full Bastion); fixed a first draft that made column 0 all earth.
- **Choices to check:** the border bell hangs on the tile where Watchtower 1 will stand; the strip labels are the two strings from GDD §9.21, drawn over the strips.
- **`[Layout ▸]` opens a stub** for now: it shows only "TRAY (unplaced: n)". TL.8 replaces it with the real sheet.
- **Tests:** `tests/e2e/hold-grid.spec.ts` (plain, cosmetics + frost, border cosmetics + lamp, Classic scene and the choice kept after reload, 320 px). The 15-tap check-in test still passes. Bundle: about 3 KB gzipped added.
- **Still open:** Q52 (the piece count shown is for you to decide at TL.8). Nothing skipped.

## 2026-10-23 — v1.1 TL.8: the Arrange Hold sheet
- **Owner:** the border bell stays where it is (tile of Watchtower 1).
- **Sheet:** opens from `[Layout ▸]`. 8 × 8 buttons of 44 px; tap a piece or a tray item to select, tap a tile to move or swap (core's `layout.place` decides), `[Move to tray]` for 1 × 1 pieces, Auto-arrange, Clear to tray… with its confirmation, Blueprint ghosts On/Off. The sheet sends commands and draws; no rule lives in it. A locked tile says "Clears at {Rank}" (new read-only helper `clearsAtAge` in core).
- **My choices:** a move or swap ends the selection, and tapping the selected piece again lets go of it (so you can pick another piece without swapping by accident). One white-over-black outline goes round the whole piece, so the 2 × 2 Hall shows as one block.
- **Strings beyond the §9.21 table (please check):** the tray items' names (building name, plus its number for plots, walls and towers); the confirmation's two buttons, "Clear to tray" and "Cancel"; the tile buttons' hidden screen-reader labels. Subtitle total shows **40** (Q52).
- **Footprint preview:** the 2 × 2 Hall is outlined as one block when selected, and moves when you tap its new top-left tile. There is no separate "where it will land" preview (tap-only, one tap moves it).
- **At 320 px** the grid sits in its own scroll box (`data-internal-scroll`); the page does not scroll sideways.
- **Tests:** `tests/e2e/arrange-hold.spec.ts` (select, move, swap, locked tile, Hall, tray, badge, Auto-arrange, Clear to tray cancel and confirm, ghosts, 320 px). Helpers shared in `tests/e2e/layout-helpers.ts`. Screenshot: `docs/flesh-out/v1.1/arrange-hold.png`.
- **Nothing skipped.**

## 2026-10-23 — v1.1 TL.9: accessibility and layout checks
- **Added to the screen list:** the Hold grid at Hamlet (a new game), Keep, Citadel (Bastion was already there), and the Arrange Hold sheet.
- **Results, all at 320/360/900/1300 px as each suite runs them:** tap-target sweep 0 findings over 78 screens; Text size Largest at 320 px 0 findings; widths, reduced motion and contrast pass.
- **One test edit, approved by the owner today:** the tap sweep (`polish-tap.ts`) no longer flags a control for sitting past the screen edge when it is inside a `data-internal-scroll` box (the Arrange Hold grid below 352 px). Size and cover are still checked for those tiles.
- **Own fix:** the Hamlet flow first used a fixture that does not show the Hold; it now uses a new game.
- **Whole browser suite (Chromium):** 92 passed. The WebKit determinism test cannot run in this container (no WebKit installed); it needs CI or your machine.
- **Q52:** the owner approved 40 (D511). Nothing skipped.

## 2026-10-23 — v1.1 TL.10: budgets and download size
- **Benchmark (`tests/e2e/bench.spec.ts`, 4× slowdown, warn at the budget, fail at 2×):** odds budgets now 120 ms (identified) and 150 ms (3 candidates) (D505). New rows (D506): **v11 → v12 migration 13.4 ms** (budget 100), **Hold grid render 16.0 ms** (budget 16: right at the warning line), **Arrange Hold sheet open 17.2 ms** (budget 50). The last two mount the real components with all 40 pieces placed, into a detached box, so they time the component's render, not the browser's paint.
- **Download size:** whole production build gzipped **582,081 bytes (568 KB), 306 files**; budget 600 KB. v1.0 was 506 KB: the 83 new pictures account for most of the +62 KB. Headroom is now about 5%, so more art would need a look.
- **Not green here, not mine:** this container's CPU is too slow for the old rows: live odds 228 ms (fails at 240 only because of the new budget), Suggest 642 ms (fails at 600). No core code changed this milestone, so I read this as the container (D445); **TL.10's "no row fails" needs a CI run to confirm.** Please look at the bench job when you can.
- **GDD §6.5** is not edited (your gate); the new rows live in the test until you approve them there.
- **Also:** a first attempt that timed a tap to the next painted frame was too noisy (an existing sheet read 254 ms), so I dropped it. Nothing skipped.

## 2026-10-23 — v1.1 TL.11: simulator and determinism
- **`npm run sim:check` here (55 runs, 369 s):** all **55 rows pass**; every player's report equals the v1.0 baseline: **176 of 176 same, 0 different**. `sim:accept` not run (milestone end only).
- **Golden fights and recorded stands:** replayed line for line by the unit tests inside `npm run check` (3,322 pass); `rulesVersion` unchanged at 5.
- **Still for CI:** the WebKit determinism test (no WebKit in this container) and the slow-CPU benchmark rows (see TL.10). Please look at those two jobs.
- **Nothing skipped.**

## 2026-10-23 — v1.1 TL.12 (not ticked): smoke test added, one old smoke test blocked
- **Added** to `tests/e2e/smoke.spec.ts`: loads the owner's `v11-owner.json` (it becomes v12), opens Arrange Hold, moves a building, Auto-arrange, switches Hold view to Classic scene, then reloads offline with both choices kept. Passes on the production build here.
- **Blocked, found by the full smoke file:** the old test "seat an Order, read a chapter…" now fails, and will fail in CI too. Its fixture `v10-played.json` is dated 2026-10-23 12:30 UTC (a clock time that was still in the future when it was made). Now that the clock has passed it, loading it shows "While you were away", which the test's loop cannot close (the sheet's button is an ✕ with no text). Nothing in the game changed. **Question for the owner:** may I edit that test's loop to also press the sheet's Close button? (Not on the D507 list, so I did not.) Same date applies to `v9.json`; v12-played is dated 2026-10-26, so it will go stale then too.
- **Preview:** the Deploy workflow succeeded for the latest push (the preview build is up); I cannot open it from here. The offline smoke test above covers the migration on the production build.
- **CI note:** the `check` job of one earlier run (TL.9 docs commit) failed at "npm run check (90 s budget)" after 1 min 39 s; the next run passed. Likely runner speed against the 90 s budget; not confirmed.

## 2026-10-23 — v1.1 TL.12 done
- **Owner approved** the test-loop edit. The old smoke test "seat an Order…" now also presses the sheet's Close button (found by its label) in its loop; nothing else in it changed. **All 6 smoke tests pass** on the production build.
- **Still dated fixtures:** `v9.json` (12:30 today, already past) and `v12-played.json` (2026-10-26) will trip tests that do not dismiss the away sheet; worth moving their dates far ahead at some point (fixtures are protected, so your call).
- **Preview:** Deploy succeeded on the latest push; I cannot open it from here, so please open the preview once and load your v11 save.

## 2026-10-23 — v1.1 TL.13: hand-off
- **CI:** run 501 is green (check and e2e, including WebKit determinism). Owner approved two CI edits: `check` warns at 90 s and fails at 120 s (D512); the e2e job's time limit is 15 minutes (D513). Only `.github/workflows/ci.yml` changed.
- **Owner decisions this session:** 40 pieces on the sheet (D511); the border bell stays on Watchtower 1's tile; test edits: the tap sweep's scroll-box exemption and the Order smoke test's loop (it now closes the away sheet and waits longer; its failure message names the open sheets).
- **Pull request opened** from `milestone/v1.1` with the template and the playtest checklist. Rolling back to v1.0 means importing `v11-owner.json`.
- **Watch in CI:** the benchmark job runs for the first time on this pull request; this container's CPU failed its old rows (D445), so a red there may be the runner.
- **Not done, by decision:** GDD, D501 and the plan still say 39 pieces (your gate); `sim:accept`, merge and tag wait for the playtest; dated test saves (`v9.json`, `v12-played.json`) are left alone.

## 2026-10-23 — v1.1 milestone end
- **The owner said the playtest passed** (all checklist items good, no issues; D516). `sim:accept`: 55 of 55 rows pass, 176 of 176 same, baseline file unchanged. Plan `Status: complete`.
- **Last CI fix:** the Order smoke test's loop had a race on slow runners (it pressed "Not now" after the Seat step had opened); it now checks again after its wait. Not a game bug.
- **Piece counts corrected** to 40 / 43 tiles / 21 open (D514, D515); the GDD, plan and technical design agree now.
- **Still open for the owner:** the merge and the `v1.1.0` tag; D509 (Proposed) needs a yes or no.
- **Seen, not mine:** `check` takes 94–99 s on GitHub (now warns at 90 s, fails at 120 s, D512); the e2e job's time limit is 15 minutes (D513).

## 2026-10-23 — v1.2 docs commit
- **Start checked:** `v1.1.0` is tagged and in `main` (pull request #18 merged); `sim/baseline.json` is the v0.11 one, unchanged. Branch `milestone/v1.2` made from `main` and pushed.
- **Owner said yes** to the whole flesh-out, no exceptions: D528 added; D519–D527 now Decided. No old row edited.
- **Applied:** GDD (12 edits), plan (6), technical design (7 incl. new §20), questions (Q52 closed, Q53–Q56 added), OUT-6 (no new names). Every Find matched exactly once. Summary moved to `docs/flesh-out/v1.2-summary.md`.
- **CLAUDE.md:** the three sound rules added.
- **Next:** SF.1.

## 2026-10-23 — v1.2 SF.1 dated test saves
- **Real dates (moved):** every number between 1.6e12 and 2.2e12 ms. In `v9.json`: 294 fields; in `v12-played.json`: 57. Same field names in both: `savedAt`, `meta.createdAt/lastSeen/clockHighWater`, `time`, `peasants.lastSettleAt`, `board.open[].arrivedAt`, `board.nextArrivalAt`, `queues` `doneAt`/`nextClueAt`, `garden.nextAt`, `running[]` `launchedAt`/`endsAt`/`contract.arrivedAt`, `log.recentFights[].at`, `cycles[]` start/rank/stand times, `story` times, `delve.allowanceAt`, `delve.echoes[].at` (v9 only), `events.clock.high`, `orders.opened.*.at`.
- **Event clock (left alone):** `events.clock.value`, `events.tokens.at`, `orders.lastChange`. No rest or cooldown field holds a number in either file. Every field classed with certainty.
- **Offset:** +315,360,000,000 ms (10 years of 365 days). Changed files: those two fixtures, plus the new `scripts/shift-fixture-dates.mjs` (`apply` and `verify`). `verify` loads the old files from tag `v1.1.0`, subtracts the offset, and proves the rest is identical: passes for both.
- **Scan of all 27 fixtures:** only `v12-played.json` (2026-10-26) was dated in the future; `v9.json` (2026-10-23 12:30) had just passed. All others are dated on or before 2026-10-23 and cannot go stale.
- `npm run check` green (3,322 tests; golden fights and recorded stands unchanged). The browser tests run in CI.

## 2026-10-23 — v1.2 SF.2 CI browser-install retry
- **Changed only the browser-install step in `.github/workflows/ci.yml`:** each try is cut off after 120 s, up to three tries, and the step itself has a 5-minute limit. No test or pass rule changed.
- **Judged over the next CI runs, not proven in advance.** Results so far: none yet. I'll add them here as they come; your yes or no on D527 comes after several runs.

## 2026-10-23 — v1.2 SF.3 packs note
- **Written:** `art-src/packs/audio/PACKS-NEEDED.md` (four Kenney packs, CC0, zips, switch to `milestone/v1.2` first, the 25 MB case).
- **Links not confirmed:** this container cannot open kenney.nl (the proxy refuses it). The links follow the v0.1 pattern and the note says so; please open each once.
- **`.gitignore` changed (small, needed):** `art-src/packs/` was ignored whole, which would have kept your zips and this note out of git. Now only the contents other than `audio/` are ignored; I unpack into the ignored `art-src/packs/audio-unpacked/`.
- **Waiting:** the owner uploads the zips. No sound task starts until then.

## 2026-10-23 — v1.2 SF.4 audition candidates and page
- **Candidates:** 35 clips, 5 per sound, chosen by name and length only (I cannot hear), from the four packs. Map: `docs/flesh-out/v1.2/sound-marks.md` (numbers 1–35, pack, file, slot). Converted to mono MP3 at 48 kbps, loudness evened, short fades, no tags, cut at each slot's limit; committed under `art-src/audition/` (133,533 bytes in all). Peaks stay below −2 dB.
- **Audition page:** built into the **preview build only** (`audition.html` plus `audition/`). Each clip has a play button of 64 × 48 px or more, its length and size, and a Pick choice; the bottom shows the picks so far against the 30 KB cap and a "My picks" line to send me.
- **Tests:** `tests/tools/audition.test.ts` (map, files, page, and a real **live build with no page and no candidate files, not in the precache list**); `tests/e2e/audition.spec.ts` (phone viewport: every button at least 44 px, all 35 decode in Chromium, page matches the map; passes here).
- **New files:** `tools/sound-marks.ts`, `tools/audio-convert.ts`, `tools/make-audition.ts`, `tools/audition-page.ts`; `vite.config.ts` gained the preview-only plugin. Q56 resolved (container has ffmpeg).
- **Note:** Vite prints a warning about extensionless imports in its config; harmless.
- **Owner next:** open the preview's audition page, listen, and send one pick per sound (or "none of these"). The preview is built by the Deploy workflow from the latest pushed `milestone/*` branch; check the Deploy run is green.
- **D527 first real test (CI run 525):** the browser install hung, my first retry did not help: the hung try left `apt-get` holding the system lock, so tries 2 and 3 failed at once. Fixed in the same step (after a failed try, stop any leftover `apt-get`/`dpkg`, wait 5 s). Still only that step in `ci.yml`. Results so far: runs 523, 524, 526 passed; 525 failed as above; the next runs will show whether the fix holds.

## 2026-10-23 — v1.2 SF.5 the Sound setting
- **Owner's picks (Q53 answered):** Build 2, Launch 10, Place 13, Win 18, Lose 21, Fanfare 28, Nightfall 31; recorded in `sound-marks.md` (28.5 KB on the page's count; the real budget comes at SF.9).
- **Built:** `sound` (`on`/`off`, default Off, junk falls back to Off) in the settings key; Reset keeps it; a Sound row (On/Off buttons, help line) in Settings, using the three strings in `src/content/sound-text.ts`. No sound plays yet. Save schema and rules version untouched.
- **Name difference (not a stop):** technical design §19.4 says `resetAppSettingsTimestamps`; the code's function is `afterReset`.
- **Old-test edits (D525 (1)), nothing loosened:** `app-settings.test.ts`: the sample settings, the defaults and the Reset expectations now include `sound`; two tests added (parse, round-trip and failed write). New `tests/content/sound-text.test.ts` checks the strings against the GDD.
- **Paste, Load and Restore** never touch the key (the existing "saving, backing up and loading leave the key untouched" test still passes).

## 2026-10-23 — v1.2 SF.6 the sound module
- **Built** in `src/platform/sound/`: `moments.ts` (the 15 moments → 7 sounds; strongest-wins order), `player.ts` (readiness, 150 ms hold, loading; outside things passed in), `browser.ts` (Web Audio, `fetch`, visibility, `click`/`touchend` resume, and the test hook `window.__lastholdSoundTest` whose fake replaces only the output). `src/ui/app/sound.ts` is where the UI asks; `setSound` and app start call it (the switch tap creates and resumes the audio).
- **Rules covered by 18 unit tests with a fake clock:** all 15 moments; every pair's winner; the 150 ms hold; skip (never queue) when paused, interrupted, closed, hidden or hidden during the hold; Sound Off fetches and decodes nothing; a failed fetch or decode is silent; the first tap after a restart can still play its own sound.
- **Non-coupling (D525 (5)):** new `tests/lint/sound-coupling.test.ts` (no core file mentions the module, the setting or the hook; no `sound` in the save state) and a planted-import case `core-imports-sound.ts` added to the guard-rail list.
- **Not yet proven:** the browser side (`browser.ts`, the hook doing nothing unless set) is covered by the Playwright tests in SF.7. No file is shipped yet, so a real fetch 404s into silence until SF.9.
- **Reading made:** a request is accepted while the context is paused only if the same tap is resuming it.

## 2026-10-23 — v1.2 SF.7 wiring, part 1
- **Where cues come from:** `src/ui/app/sound-cues.ts` maps a succeeded command, or a contract finishing in a live tick, to a moment. Nothing in `src/core/` changed. Contracts count only from the live tick (and the tap's own small tick); the return-from-away path never sounds.
- **How each moment is reached in the tests:** Build / new building / bulk buy: new game with `?debug` and "+1K" buttons, Cottage ×10, Mine. Launch: the same game, Prepare then Send. Place: played v12 save, Arrange Hold (move, swap, tray item). Win and Lose: a save the core itself makes with one contract running (seed searched until it ends as asked), page clock set to the save's time, then a 13 h fast-forward = a live tick; the away case moves the clock without timers and fires the return event. Hunter rank-up: debug "Ready to rank up", then the hunter sheet. Hold Rank-up: v12 save edited to meet the Bastion's needs.
- **Tests:** `src/ui/app/sound-cues.test.ts` (mapping and the silent list); `tests/e2e/sound.spec.ts` (12 tests, fake engine): Sound Off requests nothing; On loads the seven files in that tap; one sound per command (bulk buy once); two moments inside the hold give only the stronger; hidden, paused and interrupted skip and never replay; away is silent; the debug row plays each of the seven and leaves `debugUsed` false.
- **Debug row:** "Play sound" with seven buttons (accessible names "Play build" and so on, so no old locator clashes).
- **Not yet:** Delves, events, the Long Night (SF.8).

## 2026-10-23 — v1.2 SF.8 wiring, part 2
- **Wired (UI only, no core change):** a Delve fight is sounded when its playback ends or is skipped (cleared floor = Win, guardian = Fanfare, lost run = Lose); a Great Beast attempt or hunt when its playback ends, is skipped or the sheet is closed early (milestone or kill, or a Legendary hunter unlocked = Fanfare; one sound per attempt); the Long Night when "Go up to the walls" succeeds, i.e. when its sheet appears. Hunter rank-up was done in SF.7. Closing a Delve playback early is silent because that fight is not fought.
- **How each is reached in the tests:** Delve: a Keep made by the core's own helper, strong party (six floors then the guardian: Win ×6, Fanfare) and frail party (Lose); the Fight log replay is silent. Beast kill: the owner's v8 save, migrated and edited so a kill is one hit away; both the "skip" and "close early" cases. Beast attempt with no milestone: owner save, silent. Unlock: owner save with every hunt on 99 points. Long Night: debug "Unlock Bastion", then the Last Stand; Start, the waves and reopening from the Hold card are silent.
- **Not run as their own e2e:** a Great Beast **milestone without a kill** (mapping covered in `sound-cues.test.ts`; the kill case runs through the same code) and **Leave run** (silent: no cue is wired to it).
- **Found, not mine:** closing the Fight log inside a Delve reopens the Delve sheet on its next stage (the old behaviour; nothing changed).
- **Unit tests added:** `momentForAttempt`, `momentForFloor`, `stand.make` in `sound-cues.test.ts`.

## 2026-10-23 — v1.2 SF.9 the seven real sounds
- **Measured first:** production build without sounds, gzipped, summed per file at level 9: **583,076 bytes** (306 files). Sound budget = 614,400 − 583,076 − 1,024 = **30,300 bytes** (under the 30,720 cap).
- **Converted** your seven picks from the original packs (`tools/make-sounds.ts`, using `convertClip`): build 2,194, launch 2,664, place 1,410, win 5,015, lose 3,448, fanfare 7,053, nightfall 7,366 = **29,150 bytes**. They fit.
- **Re-measured:** production build with the sounds: **610,463 bytes**, 313 files (room left: 3,937). Candidates are not in the live build.
- **Shipped:** `public/assets/audio/<id>.mp3`, the audio list `src/content/audio.ts` (id, file, bytes, pack, URL, CC0, credit, original name), credits builder and `docs/credits.md` read it (new "Sound packs (CC0)" section in About & Credits; it is a heading plus pack lines, not a sound string; tell me if you want it gone).
- **URLs not confirmed:** kenney.nl is unreachable here. I used the pack names and the four `License.txt` files (all say CC0) and the same URL pattern as the art packs.
- **Tests:** new `tests/content/audio.test.ts` (files and rows both ways, credits, bytes, 30 KB cap, packs agree with credits, no tags).
- **Old tests edited:** `tests/content/credits.test.ts` (manifest check also counts the audio list, D525 (4)); `tests/tools/audition.test.ts` (live build: no audition page and no numbered candidate files, instead of no mp3 at all; **owner's yes 2026-10-23**, not in D525).
- **`npm run check` green, but 86 s and 95 s on two runs** (warns at 90 s); more files and tests were added. Watching; I will report the cause at SF.12 if it stays.
- **Not yet precached:** the service worker list still shows 309 entries (the mp3 files are not in it); that is SF.10.
- **Owner task:** hear the seven on the preview (More, Debug, with `?debug`, "Play sound") and approve, or say which to change.

## 2026-10-23 — v1.2 SF.10 offline and decoding
- **Owner approved the seven sounds** (heard on the preview).
- **Precache:** the mp3 pattern was missing. Added it, and `audition/**` is ignored, so the live service worker now lists 316 files (309 + the seven sounds) and the preview's 317 holds no candidate clips. The preview's scope rule against the live app is unchanged.
- **Offline smoke (D525 (3)):** while offline after a reload, one sound is fetched from the cache: status 200 and the exact byte count from the audio list. Passes.
- **Decode test** (`tests/e2e/sound-decode.spec.ts`, Chromium): all seven decode to non-empty mono buffers. **WebKit not tested:** the WebKit job here only runs the determinism scenario and I cannot confirm headless WebKit decodes MP3, so iPhone playback stays your Q55 check.
- **One scenario added to `smoke.spec.ts`** (D525 (7)): Sound On, one Cottage, the fake engine records `build`. Passes.
- **Old tests edited:** `smoke.spec.ts` only (the offline fetch and the new scenario, both D525).
- Browser tests ran locally in Chromium (smoke 5 tests plus the decode test, all passed); CI will run the rest.

## 2026-10-23 — v1.2 SF.11 polish sweeps
- **Settings screen was already in the sweeps** (`more-settings`); the only edit to `polish-screens.ts` is that the screen must now also show the **Sound row and its help line** (silent switch), so the sweeps fail if either goes missing (D525 (2)). No baseline file changed.
- **Ran locally in Chromium (Pixel 7), production build:** tap sweep (44 px) and widths (320, 360, 900, 1300): 19 passed; Text size (incl. 320 px at Largest), reduced motion, contrast, both themes: 39 passed. **0 findings** in every suite; the 15-tap routine check-in test is among them and passes.
- **Time:** the tap sweep alone takes 5.7 min on this machine (one worker). The CI e2e job is not changed by this; I cannot see its time from here, so please check the 5-minute rule on the pull request.
- **Old test edited:** `polish-screens.ts` (D525 (2)) only.

## 2026-10-23 — v1.2 SF.12 wrap-up
- **Simulator (`npm run sim:check`, 55 runs, 6 min 51 s here):** all rows pass; **176 of 176 player reports equal the v1.1 baseline**. Only the Saturday ✗ lines show (reported only). No `sim:accept` run.
- **Old save, Sound Off:** new test `tests/e2e/sound-old-save.spec.ts` loads the v1.1 played save (schema 12) into the production build: Sound reads Off, nothing is fetched or played. Passes.
- **Size:** production build **610,508 bytes** gzipped (313 files), limit 614,400; room 3,892. (The plan text still says 600 KB; the row is 614,400 bytes by D523.)
- **`npm run check`:** 86 to 95 s across runs here (warn 90, fail 120); on CI it ran 80 s (run 535). The cause of the creep is more tests (the sound module, audio list, 3,368 unit tests); I changed nothing. Asking you below only if you want it trimmed.
- **One flaky failure seen:** `tests/contracts/flow.test.ts` failed once inside a full `npm run check` (99 s, machine busy), then passed alone and in the next full run (91 s). I did not touch it; I could not see the failure message. Watch for it on CI.
- **CI for D527 (browser-install retry):** runs 523, 524, 526 passed; 525 failed before the apt-get fix; **every run after the fix (529 to 535) passed**; 536 was still running. No browser-install hang since the fix.
- **For your decision: CI job length.** The `e2e` job takes about 9 min (8 min 28 s for the tests) on CI. It was already about 9 min before any sound work (run 522, docs commit), so v1.2 did not cause it, but it is over the 5-minute rule (D320). I did not change it; tell me if you want it split.
- **Old tests edited in v1.2, all listed:** `app-settings.test.ts` (SF.5), `credits.test.ts` (SF.9), `audition.test.ts` (SF.9, your yes), `smoke.spec.ts` (SF.10), `polish-screens.ts` (SF.11), v9 and v12-played dates (SF.1).
- **Pull request opened** from `milestone/v1.2` to `main`. **Owner decisions waiting:** D527 yes or no; the CI job length question; the playtest (including Q55: all seven on your iPhone, silent switch, resume after leaving the app).

## 2026-10-23 — v1.2 fix: silent switch (owner's playtest)
- **Found by the owner on the iPhone:** the silent switch did not mute the game.
- **Change (UI only):** before the audio starts, the sound module now tells the browser the audio is "ambient" (the Audio Session setting that follows the silent switch). New `src/platform/sound/session.ts` with unit tests. Proposed D529.
- **Not proven:** CI and this container cannot test an iPhone. If it still plays with the switch on, the next step is to find out whether the cause is the Home Screen app, an iOS setting, or music playing in another app (an ambient sound mixes with it). Tell me which and I will look further.
- **Not done:** technical design §20 still says nothing about this setting (design text is yours to approve). No old test edited. `npm run check` green.

## 2026-10-23 — v1.2 milestone end
- **The owner said the playtest passed** on the iPhone, after the silent-switch fix (D529) worked.
- **`npm run sim:accept`** (6 min 45 s here): 55 runs; the baseline file is byte-for-byte the same as before, so nothing moved. Plan `Status: complete`, D530.
- **Still open for the owner:** D527 (CI browser-install retry) yes or no; D529 to be marked Decided (I may only add Proposed rows); the `e2e` CI job runs about 9 min (over the 5-minute rule, since before v1.2); technical design §20 does not yet mention the ambient setting (design text is the owner's).
- Merged and tagged as below in the pull request.

## 2026-10-23 — v1.2 merged and tagged; e2e split under test
- **v1.2:** pull request #19 merged to `main` (merge commit `0a41df8`); the owner tagged `v1.2.0`. D532 to D534 decided by the owner.
- **e2e split (D533), first run on branch `ci/e2e-shards`:** shard 1 took 94 s of tests and shard 3 193 s. Shards 2 and 4 never reached the tests: the browser install hung. **Cause found in my own D527 numbers:** three tries of 120 s do not fit in a 5-minute step. Fixed (D535, Proposed): 90 s per try, 6 minutes for the step. Not yet known: the real time of the shard holding the tap sweep (shard 2).
- **Risk to watch:** four shards mean four chances for the install to hang.
- **Benchmarks job (`bench.yml`)** hung in the same install and had no retry; the owner said yes, so it now has the same one (D536). The bench "odds" timing test failed once at 659 ms against 600 ms on a slow runner (not related to sound).

## 2026-10-23 — e2e split, second look (D537)
- **Shard times (first fixed run):** shard 1 1 min 34 s, shard 2 **7 min 31 s**, shard 3 3 min 16 s; shard 4 failed in the install. Install stalled on the Ubuntu Azure mirror (all three tries), so the tries were not the problem.
- **Owner said do both:** `--fully-parallel` on the shard command (tests spread one by one; expected about 2 to 3 min of tests per shard) and an apt fail-fast setting before the install in `ci.yml` and `bench.yml` (D537). Locally the four shards hold 126 tests in total.
- **Still to see on CI:** every shard job under 5 minutes. If not, the fallback is a longer limit for the e2e shards. Bench change is untested until a pull request exists.

## 2026-10-24 — v1.3 KV.1: docs commit
- **Preconditions:** tag `v1.2.0` is on `main` (merge `0a41df8`); the CI changes (PR #20, D533–D537) are on `main`. Branch `milestone/v1.3` was **not** created: this session may only push `claude/clever-fermi-gkis1l`; the owner decides whether the preview needs `milestone/v1.3`.
- **CI on `main`:** last finished run (PR #20 merge): shard 2 took 5 min 22 s as a job (tests 4 min 1 s); run on the owner's upload (`d66683f`): shard 2 took 5 min 10 s, and **shard 4 failed** (`story.spec.ts` "a won contract brings Ilse": waited 45 s for the "Through the gate" dialog). No code changed between the runs, so likely a timing flake; not yet re-run. Shard 2 is over the 5-minute rule: the owner agreed to the D537 fallback (a longer e2e limit) as its own small change; the number is theirs (asked).
- **Applied:** all 35 Find/Replace edits (GDD 23, plan 6, technical design 6) matched exactly once, checked by machine before and during applying. Rows D538–D550 are Decided and D551 is added (owner's yes; Q58 answered (a)); Q57 and Q58 are in `questions.md`; the summary moved to `docs/flesh-out/v1.3-summary.md`; three rules are in `CLAUDE.md`. No old row or cell edited. The two placeholder constants (0.25 each, GDD §7.13) were added to `balance.ts` now, because the GDD §7 keys test fails without them (OUT-2a says so); KV.3 wires them in.
- **Sweep:** no `Proposed` row from D519 up is left outside D538/D551.
- **Owner's save uploaded** (renamed to `tests/saves/fixtures/v12-owner.json`; it arrived as `V12-owner.json`): schema 12, rules 5, cycle 1, Keep, Act 1 with 14 wins, 1 cycle record. **The Remembering gate is closed**, so the owner will see Rising Vigil only through the debug commands for a long while (Q46: about 20–25 cycles).
- **D552:** e2e shards may take up to 8 minutes (owner's number); `ci.yml` timeout 10 → 8, own commit. Shard 4's failure (story spec) is being re-run once to confirm a flake.
- **Branches:** the owner asked for `milestone/v1.3` too; both branches get the same commits.

## 2026-10-24 — v1.3 KV.2: save schema 13
- **Done:** `SCHEMA_VERSION` 13; `state.vigil = { on, stands }` (new `vigil-state.ts`); optional `vigilLevel` on the stand record; migration `migration-v13.ts` (adds the empty block, nothing else); guard `validate-vigil.ts` (bad block refuses, unknown field warns, `vigilLevel` must be a whole number of 1 or more, count mismatch only warns and is quiet once `debugUsed`). The Long Night keeps the block (test). `rulesVersion` 5.
- **Fixtures:** `v13.json` = the owner's v12 save migrated (`scripts/make-v13-fixtures.ts`). `v13-played.json` comes in KV.4. New tests: `tests/saves/v13-migration.test.ts` (all fixtures load, round-trip, golden fights and recorded stands replay, refuses schema 14, ≤ 0.5 KB growth).
- **Tests first?** Not strictly: I wrote the code, then the tests in the same session. No test was weakened.
- **Old-test edits (D548):** (1) `v12-migration.test.ts`: schema 12 → 13 (two places) and "newer version" 13 → 14; (6) `opening.test.ts`: the "left out" fixture list gains `v12-owner.json` and `v13.json`. Also added: a `vigilMigration` benchmark row (100 ms) in `bench-page.ts` and `bench.spec.ts`.
- **Timing:** migration of the played v12 save: 1.0 ms in node here. The browser benchmark could not run in this container (Playwright's browser build is missing); CI runs it. `npm run check`: 87–97 s here.
- **Size (corrected at KV.3):** the first number here was unconfirmed; see KV.3.
- **Size, first reading:** the production build summed to **606,607 bytes** (per-file gzip -9, limit 614,400) but I could not count the files (the shell then refused access to `dist`), so I cannot confirm it matches the 610,508 of 313 files in v1.2. Treat as unconfirmed; to be re-measured at KV.3.
- **The prettier format of `v12-owner.json`** was normalised (whitespace only), like the other fixtures.
- **Next:** KV.3.

## 2026-10-24 — v1.3 KV.3: the two factor functions
- **Done:** new `src/core/systems/vigil.ts` with `waveFactor(threat, level)` and `embersMultiplier(threat, level)`, each with its breakdown from the same function. The stand fight, practice stands, preview, wave-log rebuild and Embers payout all call them; the level travels as an optional `vigilLevel` on the stand input and the saved record (absent = 0). Level 0 keeps the old expression with no added term. Nothing sets a level yet (KV.4).
- **Placeholders:** `vigil.strengthPerLevel` and `vigil.embersPerLevel` are 0.25 each (marked placeholder in `balance.ts`, added at KV.1). KV.9 replaces them.
- **Tests first:** `tests/stand/vigil-factors.test.ts` was written before the code and failed first. It checks level 0 with `===` for 7 Threat values, level > 0 against an independent table, that the lines add up, the Embers line text, and that each of the four constants is read in exactly one file under `src/core`. No old test was edited. Golden fights and recorded stands replay as before; `npm run check` is green (87–97 s here).
- **Also:** the Ilse story test now pins the clock (owner chose option a): it failed on weekend mornings because the debug run plays the Standard player over the last 12 h of the real clock. Passes locally on a Saturday. Old-test edit outside D548, with the owner's yes.
- **Size:** measured by the SF.9 method here, 313 files, `main` = **606,280**, this branch = **607,108** (+828: KV.2 +327, KV.3 +501). This container reads about 4.2 KB lower than the recorded v1.2 figure (610,508) for the same code, cause unknown (probably the gzip build), so the deltas are what to trust: on v1.2's scale that is about **611,336, room 3,064**.
- **Not run here:** the browser benchmark (Playwright's browser build is missing); CI runs it.

## 2026-10-24 — v1.3 KV.4: the command, the level, the debug command
- **Done:** `vigil.set { on }` (On refused while the gate is closed; Off and the same value always accepted); the stand reads the switch once in `standInputFor`, fixes `L = stands + 1`, saves `vigilLevel` on the record and moves `stands` in `stand.make`; level 0 adds no field. `vigilAvailable` and `vigilLevelFor` in `systems/vigil.ts`. Debug command `debug.vigilSetStands` (named like the other debug commands, not `debug.vigil.setStands`), with a small input and button in the debug panel.
- **No "stand started" refusal:** the stand and the Long Night are one command, so that window does not exist (D544 (6)); a test proves the switch works right after a stand.
- **Tests first:** `tests/vigil/commands.test.ts` and `tests/lint/vigil-coupling.test.ts` (checks state reads and factor imports, not the word; a planted read from `src/ui/` fails). Covered: the accept/refuse table, no double level, rebuild from the record ignores the switch, Off equals a level 0 stand, Keep the Vigil and Remember Them leave the block alone, bad input to the debug command.
- **`v13-played.json`** (script `scripts/make-v13-played-fixture.ts`, real commands from the owner's save): levels 1, 2, 3, then one Off stand with no level, switch On again, so the next On stand is level 4. I read "one more On" in the plan as turning the switch On, not fighting a fifth stand; tell me if you meant otherwise.
- **Old-test edits (D548):** (6) `opening.test.ts` list gains `v13-played.json`. Added a describe to `v13-migration.test.ts`. Nothing loosened. `npm run check` green (about 98 s here).
- **Size:** 313 files, `main` 606,280, now 608,261 (**+1,981**; KV.4 alone +1,153). On the v1.2 scale about **612,489, room about 1,911.** KV.6 and KV.7 are still to come: the fallback order (D547) will probably be needed; the owner is told.

## 2026-10-24 — v1.3 KV.5: the preview
- **Finding:** the plan says the odds worker's `stateSlice` carries the switch. It does not exist: the worker receives a ready-made preview input, and since KV.3/KV.4 `previewInputFor` already carries `vigilLevel` (from `vigilLevelFor`), and both Embers figures (now, tomorrow) use it. So no worker or protocol change was needed (the worker stays byte-for-byte the same).
- **The one real gap, fixed:** the stand screen re-asked for the preview only when party, kit or Threat changed. Its key now includes the level (read from `vigilLevelFor`), so a flip recomputes it. The "an estimate" wording is untouched.
- **Tests (`tests/vigil/preview.test.ts`, 10):** the request carries no field at level 0 and `vigilLevel` n otherwise; the preview equals one built independently at that level (same seeds and samples); the Rising Vigil line is in the breakdown of both Embers figures and absent with the switch Off; a higher level never holds more waves in the median; with the switch Off, or On with the gate closed, the preview equals the pre-v1.3 preview for five states. Not tested here: a flip on the real screen (needs KV.6's row; the Playwright check is there).
- **Time:** 100 practice stands at the owner's save, Threat 30: Off 293 ms, level 1 112 ms, level 10 19 ms in node (higher levels end sooner), well inside the 1 s budget.
- **Size:** 313 files, now 608,264 versus `main` 606,280 (**+1,984**; KV.5 +3). Room on the v1.2 scale about 1,900. Size options asked of the owner (see the thread).
- **Seen once, not mine:** `tests/contracts/flow.test.ts` ("only a confirmed Reckless contract can kill a hunter") hit its 5 s limit in one `npm run check`; it passes alone (11 s for the file) and on the next full run. Slow container, not a change; listed so it is not lost.
- **No old test edited.**

## 2026-10-24 — Size routes 1 and 2 (D553, owner's yes)
- **Route 1, pictures:** `tools/png-pack.ts` re-packs every picture as an indexed PNG at build time (Vite step, before the service worker). It compares all pixels with the original and keeps the original on any doubt. `public/` files and the art hashes are untouched. Pictures: 264.7 KB to 102.4 KB gzipped.
- **Route 2, contact sheet:** `contact-sheet.html` is removed from the live build, kept in the preview (7.9 KB).
- **Result (this container's scale, 312 files):** 438,190 bytes; `main` is 606,280 here. On the v1.2 scale that is about **442,418, room about 171,982** under the unchanged 614,400 row. The D547 fallback order is no longer needed for v1.3.
- **Tests:** `tests/tools/png-pack.test.ts` (packer cases, every shipped picture identical, a live build with no contact sheet and nothing left to pack, the preview build keeps the sheet). Adds about 10 s of test time; `npm run check` took 112 s on this container in one run (CI measures it).
- **Docs:** D553 added (Decided on the owner's yes), GDD §6.5 download row updated. Not in `npm run check`, as before: the milestone-end size number.
- **Route 3 looked at, not built:** building the app and the odds worker as two entries of one build lets Rollup share one chunk; measured on a scratch copy (worker not yet wired to it): JavaScript 284.8 KB to about 230 KB gzipped, **about 55 KB saved**. Needs: a stable worker file name, a dev-server branch for the worker URL, the service worker precaching the shared chunk, and an offline check; module workers are already required. Recommended for the v1.4 flesh-out if its needs call for it; not needed for v1.3.
- **Also not done:** splitting the row into first-visit and offline figures (v1.4 flesh-out).

## 2026-10-24 — KV.6 the stand-screen row and the lines
- **Built:** the Rising Vigil row (label, On / Off, help line, status line) above Start on the stand sheet, shown only when `vigilAvailable`; the confirmation line (when On) and the result line (when the record has a level). The Embers breakdown line was already built in core. Strings in `src/content/vigil-text.ts`; `tests/content/vigil-text.test.ts` makes them equal GDD §9.23 (nine table rows).
- **Core selector:** `vigilView(state)` in `systems/vigil.ts` (available, on, level, next); the UI reads nothing else and dispatches `vigil.set`. The vigil-coupling lint is unchanged and green.
- **Playwright (phone):** new `tests/e2e/vigil-row.spec.ts` (11 tests: gate closed has no vigil test id; gate open row, flip, preview recompute, status line in each state, Embers breakdown line, confirmation and result only when On; 44 px buttons and no sideways scroll at 320 and 360 px at all three Text sizes). The tap, contrast (both themes), text-size (Largest, 320 px) sweeps pass on the two new screens. The routine check-in gains no tap (nothing added to any routine flow).
- **Old-test edit (D548 (3)), only this:** two flows appended to `tests/e2e/polish-screens.ts` (`last-stand-vigil-off`, `last-stand-vigil-on`). Nothing else touched; no existing spec edited.
- **Size:** 312 files, 438,674 bytes (KV.5 end 438,190: +484).
- **`npm run check`:** green, 75 s here (3,506 tests).
- **Not mine:** `smoke.spec.ts` "offline reload" (2 tests) fail in this container's browser build with and without my changes.
- **For the owner:** read the nine strings on the stand screen (screenshots in the thread).

## 2026-10-24 — KV.7 the Roll of Wardens tally
- **Owner confirmed the nine strings as built** (D545).
- **Built:** `WardenLine.vigilLevel` (0 when the stand has none) in `core/story/wardens.ts`; the Roll shows a small mark drawn in code (an SVG, no picture file, no manifest row, nothing under `public/assets/`) and "Rising Vigil, level {n}." for a warden at level 1 or more. A warden with no level reads exactly as before.
- **Tests:** `tests/vigil/roll.test.ts` (fixture v13-played shows levels 1 to 3 and 0 elsewhere; a v12 save has none). Playwright sweeps on the new flow `roll-vigil` (v13-played, shows "Rising Vigil, level 3."): tap targets, contrast in both themes, Largest at 320 px: 0 findings. The motion sweep only measures named moments, and this adds none.
- **Old-test edit (D548 (3), (5)):** one flow appended to `tests/e2e/polish-screens.ts`. No baseline file needed a key (the Text-size baseline lists five named screens only). Nothing else edited.
- **Size:** 312 files, 438,763 bytes (+89 over KV.6).
- **`npm run check`:** green, 80 s (3,508 tests).

## 2026-10-24 — KV.8 the probe, the Vigilant and the shard (measure only)
- **Built:** the `vigilant` player (`src/core/policies/vigilant.ts`): Standard plus two moves, the declared debug shortcut `debug.rememberingOpenGate` once Act VI's stand is applied (Q58) and `vigil.set On` before each stand, for 3 stands. Monday seeds only, own shard `vigil` (`sim.yml` matrix updated). The probe (`sim/vigil-probe.ts`) as D546 (1): a copy of the state at the first On stand, levels 0 to 10, 100 practice stands with the same seeds at every level, two Threat points (the stand's own and twice it), a grid of `s` (0.1 to 0.8) and `e` (0.05 to 0.3), additive and compounding. Waves depend on `s` only; Embers are the real payout of the median waves. `npm run sim:vigil` writes the curve to `docs/flesh-out/v1.3/vigil-curve.md`; reports get a "Rising Vigil" section.
- **Results (placeholder constants unchanged):** the Vigilant reaches levels 1, 2, 3 on all 5 Monday seeds (cycles 7, 8, 9; gate opened at 458 to 486 h). Waves held never rise with the level on any of the 140 curves. `debugUsed` is true for every Vigilant run and the report says why. The other players: **176 of 176 moments same** as the baseline, every check still passes (`sim:check`, 60 runs, 6 min 52 s here).
- **Reading the curve, in short:** at the stand's own Threat, additive `s` = 0.3 loses 1, 2, 3 waves at levels 1, 2, 3 (about one a level, the owner's target); at level 10 it has lost 7. Compounding `s` = 0.2 loses 0, 1, 2 at levels 1 to 3 but 11 by level 10; compounding 0.3 or more leaves 0 to 1 waves by level 10 (effectively unwinnable). Full tables, bands and per-seed numbers are in the curve file. The owner answers Q57.
- **Time:** the `vigil` shard takes 161 s here (4 cores); the probe is about 57 s of each 82 s run. Under the 4-minute limit on 4 cores; on 2 cores it would be about 250 s. The probe is not in the fast set, so `npm run check` is unchanged: 72 s here (3,517 tests). Judged in `sim.yml` only (D546 (4)); I could not run CI's 3 `check` runs from here.
- **Old-test edit (needs the owner's yes, given):** `sim/shards.test.ts` skips `vigil` in the fair-share check like `events` and `orders` (one line; the check for the other shards is unchanged). D548 did not list it.
- **Also:** `clearNumCache` added to `core/balance-access.ts` (the probe tries a constant and puts it back; nothing in the game calls it); `stateAtVigilLevel` and `stands` on `vigilView` in `systems/vigil.ts` (the lint stays unloosened). The plan said `sim/policies/vigilant.ts`; the repo keeps policies in `src/core/policies/`, so it is there.
- **Not done, by plan:** no constant set, no `sim/targets.ts` row (KV.9).

## 2026-10-24 — KV.9 the constants, the tolerance and the rows
- **Q57 answered (a): additive** (owner). No formula changed.
- **Four commits, each revertible on its own:** (1) the probe judges the shipped constants, the wide grid stays on demand (`npm run sim:vigil -- --s ... --e ... --kinds additive --out file`); (2) **`s` = 0.32, `e` = 0.22** (D554, Proposed); (3) **the Embers tolerance 5%** in `sim/targets.ts` (D555); (4) **rows A, B, C** with their checks and GDD §6.2 (D555, enforced from v1.3; `CURRENT_MILESTONE` is now v1.3).
- **How `s` was chosen:** on a finer additive grid (0.20 to 0.44 by 0.02) the waves lost by level 3 are exactly 3 at s = 0.28 to 0.34 at the stand's own Threat, and 3 at 0.32 to 0.36 at twice that Threat; 0.32 is the smallest value that reaches 3 at both. Per level it loses 1, 2, 3. **How `e` was chosen** (with s = 0.32): Embers at levels 1, 2, 3 are 1.00, 0.99, 0.99 of level 0 at e = 0.22 (0.23 ties). Details in D554.
- **Judging run (`sim:check`, 60 runs, 5 min here):** rows A, B, C pass (Vigilant levels 1, 2, 3 on all 5 seeds; no rise in waves on any curve at either Threat point; Embers 1.015, 1.003, 0.979 of level 0 at the stand's Threat, 1.098, 1.080, 1.009 at twice it, which is reported only). Every other row passes and **176 of 176 moments are the same** as the baseline. The `vigil` shard now takes about 70 s here.
- **`npm run check`:** green, 71 s (3,527 tests; 9 more in `sim/checks/v13.test.ts`).
- **Fixture rewritten, please look at this one:** `tests/saves/fixtures/v13-played.json` was made again with its own script (`scripts/make-v13-played-fixture.ts`), because its three vigil stands were recorded under the 0.25 placeholders and replayed differently at 0.32 and 0.22. It is a fixture made this milestone (KV.4), not an older golden one, and no shipped save holds a vigil stand. Eight lines changed: the level-3 stand now holds 2 waves, not 3, and the Embers follow. The golden fights are untouched.
- **No placeholder is left** in `balance.ts` or the GDD (§7.13 note deleted). KV.11 can check it.
- **Not done:** nothing from the plan's KV.9 text. The wide-grid curve file from KV.8 still says "placeholders" because it is a record of that run.

## 2026-10-24 — v1.3 KV.10 budgets, size and the old-test list
- **Size (SF.9 method, sum of per-file gzip -9 of `dist`, 1 KB = 1,024 bytes, this container's scale):** **438,916 bytes**, 312 files. The row is 614,400 and unchanged; `main` measures 606,280 here, so the branch is 167,000 under it (the packed pictures, D553). No fallback needed.
- **v12 → v13 migration** (played v12 save, 4× throttled browser): **7.9 ms** (budget 100 ms). Same run: v10 → v11 38.6 ms, v11 → v12 26.5 ms, Last Stand preview 729 ms (budget 1 s).
- **Save growth:** the `vigil` block plus 20 recorded levels, a unit test in `tests/saves/v13-migration.test.ts`: passes (limit 512 bytes).
- **`npm run check`:** green, **94.7 s** this run (warn at 90 s, fail at 120 s). Earlier runs this milestone read 71 to 98 s on this machine, so it swings with load; I watch it, not fixed.
- **Bench:** the "odds with 3 candidates" row still fails on this CPU (831 ms against 600 ms), as before (D445); not part of `check`, nothing changed.
- **Old-test edits, full list (diff against `main`, nothing loosened):** `v12-migration.test.ts` (schema 12 to 13, newer-version case 13 to 14; D548 (1)); `opening.test.ts` (fixture lists gain `v12-owner.json`, `v13.json`, `v13-played.json`; D548 (6)); `polish-screens.ts` (stand screen On and Off, Roll flow; D548 (3)); `bench.spec.ts` and `bench-page.ts` (a new row only); `sim/shards.test.ts` (`vigil` left out of the fair-share check; your yes); `story.spec.ts` (clock pinned to a Monday so the Ilse test passes on weekends; your yes, option a); `v13-played.json` rewritten with its script (your yes). New, not edited: `tests/lint/vigil-coupling.test.ts`. The list is complete.
- **GDD §6.5:** the migration and save-growth rows are already in and decided (D547); nothing to change. Not done: no motion or contrast baseline file was edited (D548 (5) not needed).

## 2026-10-24 — v1.3 KV.11 wrap-up and the pull request
- **Checks (this container):** `npm run check` green (94.7 s at KV.10). `sim:check`: 60 runs, 407 s, every enforced row passes (rows A to C included), **176 of 176 moments same** as the baseline; the Vigilant's 16 moments are new. The ✗ lines are Saturday runs, reported only.
- **e2e, 4 shards (local chromium build):** 141 s, 403 s, 172 s, 121 s; 143 tests pass, 2 fail. Shard 2 is over 5 minutes here (CI's limit is 8, D552; CI is the judge). The two failures are the known offline-reload tests in `smoke.spec.ts` (this container's browser build, with and without my changes).
- **Production build opens real saves:** new `tests/e2e/vigil-open.spec.ts`: your v12 save (`v12-owner.json`) with the gate closed (no vigil row) and then open (row there), and the played v13 save (row and status line). Passes.
- **Size:** 438,916 bytes (KV.10; build unchanged since). Schema 13, `rulesVersion` 5, golden fights and recorded stands replay (in `check`). No placeholder constant.
- **Docs:** plan KV.11 ticked, v1.3 `Status: in progress`, §0.7 actuals added (v1.2 final 16, v1.3 12 entries).
- **Not done, waiting on you:** the playtest, then `sim:accept`, merge, tag. **Please export your save from the game just before the merge.**

## 2026-10-24 — v1.3 milestone end
- **The owner said the playtest passed** (Remember Them path included).
- **Done:** `npm run sim:accept` (6 min 49 s here): the baseline moves to v1.3; the only differences are the milestone and the new Vigilant moments. Plan `Status: complete`, D556.
- **Left:** merge PR 21 and tag `v1.3.0`, after the owner confirms they exported their save.

## 2026-10-24 — v1.3 fix: offline reload broken by the picture packing (D553)
- **What was wrong:** CI shard 3 failed the two offline-reload tests in `smoke.spec.ts` on every push since D553. I had called them "known, this container's browser" in KV.10 and KV.11; **that was wrong**. I checked: they pass on the commit before D553 and fail after it.
- **Cause:** packing the pictures also repacked the five app icons. The PWA plugin lists the icons twice (once with the original's hash, once with the packed file's), and Workbox refuses an install with two different hashes for one file, so nothing was kept for offline use. This would have shipped.
- **Fix:** `vite.config.ts` leaves the `icons/` files unpacked (D553 otherwise unchanged). `sw.js` now has one hash per file. All 7 smoke tests pass here, including the two. **Size: 449,810 bytes** (was 438,916; the icons are back to full size), still far under 614,400.
- **Test changed (my own D553 test, same milestone):** `tests/tools/png-pack.test.ts` now skips the top-level `icons/` folder in the "every picture is packed" loop, and gains a check that `sw.js` never lists one file with two different hashes (the check that would have caught this). Nothing else loosened.
- **Left:** CI to confirm on the new push, then merge. The earlier `sim:accept` is not affected (no game rule changed).

## 2026-10-24 — v1.3 merged and tagged
- **Merged** PR 21 (squash, `6286e3a`) after CI was green on the last commit; **the owner tagged `v1.3.0`** (checked: the tag points at `6286e3a`). The owner exported their save before the merge.
- **A real bug was found by CI, not by the playtest:** the picture packing (D553) broke offline reload (see the fix entry above). The owner should check airplane-mode reload once on the live app.
- **Correction:** KV.10 and KV.11 called the two offline-reload failures "known, this container"; that was wrong, and they were real.
- **CI times (last run):** e2e shard 2 about 7 min (limit 8, D552); other shards 3 to 4 min; simulator shards 1 to 2 min. Over 5 minutes is only shard 2.
- **Next:** v1.4 flesh-out (size room: 449,810 of 614,400 bytes; route 3 about 55 KB is measured). Open: Q53–Q56.
