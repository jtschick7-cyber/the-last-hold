# OUT-4a — Edits to `docs/implementation-plan.md` (v1.2 "Sounds of the Frontier", D519–D528)

Every **Find** below was copied from the Project's copy of `docs/implementation-plan.md` on 2026-10-23 and occurs **exactly once** in it. **If one does not match exactly once, stop and tell the owner.** Edits A–C replace the v1.2 section (heading, status line, scope paragraph). Edits D–F are small and independent.

## A — The v1.2 heading

**Find:**
```markdown
### v1.2 — Sounds of the Frontier *(outline: needs a flesh-out session first, §0.4)*
```

**Replace with:**
```markdown
### v1.2 — Sounds of the Frontier
```

## B — The v1.2 status line

**Find:**
```markdown
**Status:** not started *(scheduled by D476, D499)*
```

**Replace with:**
```markdown
**Status:** not started *(scheduled by D476, D499; fleshed out 2026-10-23; decisions D519–D528; files in `docs/flesh-out/v1.2/`)*
```

## C — The v1.2 scope paragraph, replaced by the full section

**Find:**
```markdown
**Scope:** CC0 sound effects and optional ambient/UI cues, **muted by default** with a toggle in `More ▸ Settings` (stored in the external settings key `lasthold:settings`, no save schema change); **no new runtime dependency** (uses the browser's built-in Web Audio / HTMLAudioElement); populates the reserved `audio` section in `src/content/assets.ts` and records every CC0 source in `docs/credits.md`; respects reduced-motion / background-tab state (never plays while the app is hidden); stays within the `≤ 600 KB` gzipped download budget in GDD §6.5 (or proposes a measured size row for the owner's approval). No game-rule or simulator change.
```

**Replace with:**
````markdown
**Scope:** **seven short sound effects for 15 moments**, **off by default**, with one **Sound** On/Off in `More ▸ Settings` (field `sound` in the settings key outside the save, `lasthold:settings`; **save schema stays 12, `rulesVersion` stays 5**). The sounds: Build, Launch, Place, Win, Lose, Fanfare, Nightfall (GDD §9.22, D520). **Web Audio only, mono MP3, no loops, no volume control, no new runtime dependency** (D522). The phone's silent switch is respected and never worked around. Nothing plays while the app is hidden; a sound that cannot play now is skipped, never queued; anything not on the list of 15 moments is silent (D520, D521, D522). All sounds together **≤ 30 KB** (target about 24 KB); **the whole build must still measure ≤ 600 KB gzipped** (D523). CC0 only, from four Kenney packs, picked by the owner by ear from an audition sheet in the preview build (D524). The game's core, the simulator and every golden fight are untouched. Also in this milestone, done first: moving the dated test saves into the future (D526) and a retry on CI's browser-install step (D527).

#### Before you start *(read this box first)*

0. **Precondition (check, do not assume).** v1.1 must be **merged to `main`, tagged `v1.1.0` and accepted** (`docs/progress.md` says the playtest passed on 2026-10-23, D516; the merge of pull request #18 and the tag waited for the owner's go-ahead). Check that `git tag` lists `v1.1.0`, that `main` contains the v1.1 merge, and that `sim/baseline.json` is the accepted one. **If any of these is not so, stop and tell the owner. Do not branch from `milestone/v1.1`.** *(Until the docs commit, this box is read from `docs/flesh-out/v1.2/OUT-4a-plan.md`.)*
1. **Branch.** Work on `milestone/v1.2`. If it doesn't exist, create it from the current `main` and push it with `git push -u origin milestone/v1.2`. Push after every task; the preview build follows this branch.
2. **Owner gate before anything is applied.** In your first message, tell the owner in plain words that you will apply the v1.2 flesh-out files, and ask whether they have **read `OUT-1` to `OUT-9` — especially GDD §9.22 (the 15 moments and their triggers), the three approved strings, the readings in D520 (5), the zips change in D524 (4) and the size rule in D523 — and say yes.** **Do not apply the files or build anything until they answer yes** (or say what to change; then change the files first). When they say yes, add **D528** (`OUT-1`) with the date. D528 moves the status cells of D519–D527 to `Decided`. **No old row's cell is touched** (about 210 old rows still read `Proposed` and are covered by D385, D472 and D498).
3. **Apply the flesh-out files first, in their own docs commit, before building anything:**
   - copy the files into `docs/flesh-out/v1.2/` and the summary into `docs/flesh-out/v1.2-summary.md`;
   - `OUT-1` rows → `docs/decisions.md` (**no old row's text is edited**; D519 is the sweep; D528 once the owner has said yes); `OUT-2a` → `docs/gdd.md` (every Find text must occur exactly once; if one has moved, stop and tell the owner); `OUT-4a` → this plan; `OUT-5` → `docs/questions.md`; `OUT-6` → `docs/flesh-out/v1.2/OUT-6-names.md`; `OUT-9` → `docs/technical-design.md` (edits plus the new §20);
   - **add three standing rules to `CLAUDE.md`:**
     1. *"Sound is UI-only: nothing in `src/core/` imports or reads the sound module or the `sound` setting (`rulesVersion` stays 5, save schema stays 12)."*
     2. *"Sound is never the only signal, nothing plays while the app is hidden, and a sound that cannot play now is skipped, never queued."*
     3. *"Write no player-facing strings for sound beyond the table in GDD §9.22; if a screen needs one, ask."*
   - `npm run check` must stay green after the docs commit. Add a short progress entry and tick the box below.
   - [ ] **Docs commit:** flesh-out files applied.
4. **Check the sweep.** Search `docs/decisions.md` for `| Proposed |`. About 210 old rows still read `Proposed` in their cells; they are **not stops**: D385, D472 and D498 accept them as built, and old rows are never edited. D519–D527 are written `Proposed` and D528 (the D508 pattern) moves their cells to `Decided` when the owner says yes without exceptions. **A `Proposed` row from D519 up that D528 does not name: list it in the progress entry and ask the owner; do not edit it.**
5. **Constants and rules.** v1.2 adds **no `balance.ts` constant** and changes **none.** The 300 ms same-moment window and the sound timings are UI timings in the sound module, not game constants (D520 (5) (b)). `rulesVersion` stays **5.** Save schema stays **12.** **If any golden fight changes, or any recorded fight or stand changes its result, stop and ask.**
6. **The simulator.** Every player's report **equals the v1.1 baseline** (`176 of 176 same`); no simulator policy plays sound; **no new simulator row.** **Known and expected, not stops:** the Saturday runs show ✗ lines (reported only, D135), and benchmark warnings above 1× budget on slow CI runners (D445). **If any CI job goes over 5 min, stop and ask** (D320). Never trim seeds or rows.
7. **Saves.** No save change. The `sound` field lives in the settings key (`lasthold:settings`, `lasthold-preview:settings`, D486). **If anything turns out to need a save change, stop and ask.**
8. **Sound rules (D520–D524).** Seven sounds, 15 moments, exactly as in GDD §9.22. **If a moment's cue cannot be worked out from what the UI already shows without changing `src/core/`, stop and ask** (D522 (8)). **No sound task starts before the owner has uploaded the packs** (D524 (3)).
9. **Sources and licences.** CC0 only. The four Kenney packs are Interface Sounds, Impact Sounds, RPG Audio and Music Jingles. Any clip from another site needs the owner's separate yes for that source. Every shipped sound is a manifest row (pack, URL, `CC0`, credit, original file name); `docs/credits.md` is generated.
10. **Size rules (D523).** The unit is 1 KB = 1,024 bytes. The row is 614,400 bytes. Measure the build **without sounds** first (SF.9); the sound budget is `614,400 − that − 1,024`, never more than 30 KB. **If the owner's picks do not fit, stop and ask; never change the row.**
11. **Pre-authorised old-test edits (D525, D526).** Allowed, each listed in the progress entry, nothing loosened: (1) extend `app-settings.test.ts` for `sound`; (2) add the Settings screen with the Sound row to the contrast, motion and tap-sweep baselines (`polish-screens.ts` and the checks that read it); (3) extend the offline smoke to fetch a sound from the cache; (4) teach the credits / manifest tests about the audio list; (5) add the sound module to the non-coupling lint list; (6) the offset change to the real-date fields of `v9.json` and `v12-played.json` and the new check script (D526); (7) one scenario added to `smoke.spec.ts` (Sound On, one build, the fake engine records `build`). Any other edit to an existing test stops and asks.
12. **Strings and names.** Sound adds exactly the three strings in GDD §9.22; the debug-panel labels and the preview-only audition page's labels are exempt from the string rule (listed in §9.22). No new proper noun (OUT-6). No new proper noun (OUT-6). The sounds' internal ids are plain words, not names. **A new proper noun not in OUT-6: search it against GDD §2.3, and on a collision stop and ask, with alternatives.**
13. **Stop and ask the owner** if any golden fight or simulator report changes; if technical design in the repo contradicts OUT-9; if a cue needs a core change (item 8); if the picks do not fit (item 10); if a pack zip is over GitHub's 25 MB web-upload limit; if the container has no audio converter and none can be installed without a new npm dependency (D522 (2)); if the Sound row cannot reach 44 × 44 px at 320 px at Largest; or if a Pages / service-worker setting stops the `.mp3` files being cached.
14. **Talk to the owner in plain language, no code.**

#### Reads *(files each task needs; read these, not the whole repo)*

- Every task: `docs/decisions.md` D519–D528, GDD §9.22, §6.5, `docs/flesh-out/v1.2-summary.md`, technical design §20.
- SF.1: `tests/saves/fixtures/`, `src/core/save/` (to classify time fields), technical design §5.2, §6.2. SF.2: `.github/workflows/ci.yml`, D512, D513.
- SF.3: `art-src/PACKS-NEEDED.md` (the v0.1 note, for the style; the new note goes in `art-src/packs/audio/`). SF.4: technical design §11.3, §12.1–§12.4; `src/content/assets.ts`; `deploy.yml`; `tools/contact-sheet.ts` (the pattern); `docs/flesh-out/v1.0/art-marks.md` (the marks pattern).
- SF.5: `src/platform/app-settings.ts`, `tests/**/app-settings.test.ts`, technical design §18.1; GDD §9.20, §9.22.
- SF.6, SF.7, SF.8: technical design §20; the UI files that show the 15 moments (Hold screen purchases and Rank-up, contract launch and finish, Delve floors and runs, hunter rank-up, event attempts, Long Night sheet, Arrange Hold).
- SF.9, SF.10: technical design §11.1, §12.4, §20.2; `vite.config.ts` (PWA / Workbox settings); `tests/e2e/smoke.spec.ts`.
- SF.11: `tests/e2e/polish-screens.ts`, `polish-tap-targets.spec.ts`, `polish-widths.spec.ts`, `polish-text-size.spec.ts`, `polish-motion.spec.ts`, `polish-contrast.spec.ts`.

#### 👤 Owner tasks

| When | What | Where it's from |
|---|---|---|
| **First message of the thread** | Read GDD §9.22, the three strings and D520–D524, and say yes, or say what to change (Claude Code waits). This is D528 | Box step 2 |
| **After SF.3** | In GitHub, **switch the branch selector to `milestone/v1.2`**, open `art-src/packs/audio/`, **download the four Kenney zips** (links in `PACKS-NEEDED.md`: Interface Sounds, Impact Sounds, RPG Audio, Music Jingles) and **upload the zips there** ("Add file ▸ Upload files"). Open each link once to confirm it works. Tell Claude Code when done | D524 (3), (4) |
| If asked, during SF.4 | Say yes or no to any clip from outside the four packs (each source separately) | D524 (1) |
| **After SF.4** | **Listen to the audition page** on the preview build (about 15 minutes, about 35 clips, about 5 per sound) and tell Claude Code your pick for each of the seven sounds, or "none of these". Claude Code writes your answer to `docs/flesh-out/v1.2/sound-marks.md` | D524 (2) |
| After SF.9 | Hear the seven real sounds with the debug **Play sound** row on the preview, and approve them (or send back which to change) | D522 (6) |
| After SF.2 | Say yes or no to the CI retry once several CI runs have shown it | D527 |
| At the end | Playtest on your iPhone (checklist below); then say go for `sim:accept`, merge and tag `v1.2.0` | below |

#### Tasks

Each task is one Claude Code session; most milestones finish in fewer sessions than tasks. Tests come first for rules and saved data (§0.2). Every task ends with `npm run check` green and a short progress entry. Tick the box when its acceptance criteria all hold. **SF.1 and SF.2 come first because a test save goes stale on 2026-10-26 and CI hangs about one run in three; after that nothing sound-related starts until the packs are uploaded (D524 (3)). SF.5–SF.8 do not need the owner's picks and may run while the owner listens; SF.9 needs them.**

- [ ] **SF.1 Move the dated test saves** *(fixtures; D526)*. First list, for `tests/saves/fixtures/v9.json` and `v12-played.json`, **exactly which fields are wall-clock epoch milliseconds** and which are event-clock values (`events.clock.value`, `tokens.at`, rests, cooldowns); write the table in the progress entry. Add one offset to the real-date fields only, far into the future. Add a script that loads old and new, subtracts the offset from the listed fields and asserts the two are deeply equal. **Scan every fixture** for dates within the next year and list them. **Acceptance:** every fixture loads, migrates, validates and round-trips; every golden fight and recorded stand replays line for line; the equality script passes; the progress entry lists the fields, the offset and the changed files. **Stop and ask** if a field cannot be classed with certainty (the fallback is to pin the affected tests' clock, which needs its own D525 line).
- [ ] **SF.2 CI: retry the browser install** *(`.github/workflows/ci.yml` only; D527)*. Add a time limit and up to three tries to the one step that installs the test browsers. **Acceptance:** only that step in that file changed; no test and no pass rule changed. The progress entry records the following CI runs' results as they come (it is judged over several runs, not proven in advance).
- [ ] **SF.3 The packs note** *(docs)*. Write `art-src/packs/audio/PACKS-NEEDED.md` (this also creates the folder on the branch, so the owner's web upload has somewhere to land) in the v0.1 style: the four Kenney packs with the links **copied from the pack pages** (the container may not be able to open kenney.nl; the owner opens each once), the licence (CC0), what to download (the zip of each), the instruction to **switch the branch selector to `milestone/v1.2` first**, how to upload, and what to do if a zip is over GitHub's 25 MB limit. **Stop** for the owner to upload (owner task). **Acceptance:** the note names all four packs with links copied from their pages, says zips and the branch switch, and the folder exists on the branch; nothing else is changed.
- [ ] **SF.4 Convert, shortlist and the audition page** *(tools, preview build only)*. Unpack the zips into a git-ignored folder. Pick about **5 candidate clips per sound** (about 35) by name, length and category, within the length guidance of D524 (2) (Fanfare and Nightfall from Music Jingles and RPG Audio; Place, Build, Launch from Impact Sounds and Interface Sounds). The packs are mostly OGG, which an iPhone may not play: **convert the candidates to mono MP3 now, with the loudness evening, short fades and tag stripping of D524 (2), and commit them under `art-src/audition/`** (small). **If the container has no converter, stop and ask (Q56): this blocks SF.4, not a later task.** Build the audition page: the candidates by number and slot, each with a play button of at least 44 × 44 px, each clip's length and estimated size, and a running total against the budget; it is generated from the committed `docs/flesh-out/v1.2/sound-marks.md` map (number → pack → original file name → slot; picks empty). The **preview channel** copies `art-src/audition/` and the page into its build; the **live channel does not** (technical design §20.2). **Acceptance:** a test fails if any candidate file or the page reaches the live build or counts toward the 600 KB measurement; Playwright at the phone viewport: every button ≥ 44 px and every candidate decodes in Chromium; the page matches `sound-marks.md`. **Stop** for the owner's picks (owner task).
- [ ] **SF.5 The setting and the Sound row** *(platform, ui)*. Add `sound: 'on' | 'off'` (default `'off'`; a broken value falls back to `'off'`) to the app settings (technical design §20.1); keep it through Reset everything (use the function Reset everything calls: §19.4 names it `resetAppSettingsTimestamps`, the code may call it `afterReset`; use the code's name and report the difference). Add the **Sound** row to `More ▸ Settings` with the three strings of GDD §9.22, word for word, and 44 × 44 px buttons. **Acceptance (D525 (1)):** unit tests: Off by default; a broken or missing value falls back to Off; Reset everything keeps `sound`; Paste code, Load file and Restore leave it alone; a failed write leaves the setting for this session only; the other fields behave exactly as before; the row shows the exact strings; **no sound is played yet**.
- [ ] **SF.6 The sound module** *(platform / ui; `src/platform/sound/` or the repo's nearest equivalent)*. Technical design §20.3–§20.4: the pure table from the 15 moments to the 7 ids; the strongest-wins function; the player that creates the audio context (suspended) and fetches and decodes the files **only when Sound is On**, plays with Web Audio buffer sources (no `<audio>`), and never queues; resume on `click` or `touchend`; the readiness rules (Sound On, unlocked, running, page visible; otherwise skip); the 150 ms hold; the global test hook whose fake **replaces only the output** (readiness rules still run; tests can set the fake context's state and the page's visibility); failure is silence. **Acceptance:** unit tests with a fake clock for the mapping (all 15 moments to the right sound), the strongest-wins rule (all pairs, by the stated order), the 150 ms hold, the skip rules (not ready, hidden, suspended, interrupted: nothing queued, nothing replayed), Sound Off (the page fetches and decodes nothing), a file that fails to decode (silence, no throw), and the hook (does nothing unless a test sets it); the layer rule (technical design §4.2) already bars `src/core/` from importing platform code, and a test proves nothing in `src/core/` references the sound module or the setting (D525 (5)).
- [ ] **SF.7 Wiring, part 1: the Hold, Arrange Hold, contracts, the silent list, the debug row** *(ui)*. Call the player from the UI at the trigger named for each moment in GDD §9.22: buy, new building, the Hold's Rank-up, launch, place, a contract's win or loss (when it finishes in the live tick while the app is open and visible; a catch-up and a debug time skip are silent). Add the debug **Play sound** row (seven buttons; UI-only; works only while Sound is On; does not set `debugUsed`). **First, record in the progress entry which fixture or debug command reaches each moment** (the v1.0 screen-list precedent). **Acceptance (Playwright with the fake engine, phone viewport):** each of these moments produces exactly its sound once; a bulk buy produces one; two moments inside 150 ms produce the stronger; the silent list produces none (taps, tabs, the away sheet, Auto-arrange, Clear to tray, Move to tray, recruiting, Stores, anything not on the list); with Sound Off the page requests nothing (the service worker's precache is not counted); with the page hidden nothing plays; coming back from away plays nothing; the debug row plays each of the seven without touching the save or `debugUsed`. **Stop and ask** if a trigger is not one single event in the UI or needs a core change.
- [ ] **SF.8 Wiring, part 2: Delves, events, hunter rank, the Long Night** *(ui)*. The same for: a Delve floor cleared, a run lost and the guardian (the first time the result is shown in playback), a hunter's rank-up, a Great Beast milestone, kill and a Legendary hunter unlocked (the first time the attempt's result is shown; at once if skipped or closed early; one sound per attempt), and the Long Night (the first time its sheet appears in live play while the app is open and visible). Record the fixture or debug command that reaches each moment. **Acceptance (Playwright, fake engine):** each moment produces exactly its sound once; reopening a result sheet or replaying from a log or the Library produces none; a playback skipped or closed early produces at most the one sound for its result; a boss or hunt attempt with no milestone, kill or unlock, the Last Stand's start and result (the Long Night excepted) and Leave run produce none; the whole e2e job stays within its 15-minute limit (D513). **Stop and ask** if a trigger is not one single event in the UI or needs a core change.
- [ ] **SF.9 Measure, convert and ship the owner's picks** *(tools, content)*. First **measure the production build without sounds** (gzipped, in bytes) and write the number in the progress entry; compute the budget by D523 (3): `614,400 − that − 1,024`, at most 30 KB. Then convert the owner's seven picks from the candidates' sources to **mono MP3 at about 48 kbps** (evened loudness, short fades, tags stripped, leading padding trimmed where the tool allows; no loops). Add `public/assets/audio/*.mp3`, the audio list and its manifest rows (technical design §20.2), and generate `docs/credits.md`; the About & Credits builder reads the audio list too. **Acceptance:** seven files within the combined cap (30 KB, and within the budget just computed); each has a manifest row with pack, URL, `CC0`, credit and original name; tests fail for a file not in the manifest, a row with no file, a missing credit and a credit with no row, and the sound packs agree both ways with the credits (D525 (4)); a test fails above 30 KB in total; the production build measures **≤ 614,400 bytes gzipped** and the number is in the progress entry; **if the picks do not fit, stop and ask** with the numbers and the options (fewer or shorter sounds), and never change the row. **Owner task:** hear the seven on the preview and approve.
- [ ] **SF.10 Offline and decoding** *(build, tests)*. Check that the build's precache patterns include `.mp3` and add the pattern if not (Workbox `globPatterns` in `vite.config.ts`; technical design §11.1, §20.2). Extend the offline smoke (D525 (3)): after the service worker is ready, go offline, reload, fetch one sound path from the cache and check the response and the byte length. Add a decode test: every shipped file decodes in Chromium, and in WebKit too if Playwright's headless WebKit can decode MP3 in CI (if it cannot, say so in the progress entry and leave WebKit to the owner's playtest, Q55). **Acceptance:** the smoke passes offline; every file decodes to a non-empty buffer in Chromium; the preview's service worker scope still excludes the live app (`navigateFallbackDenylist`, §11.3). **Stop and ask** if `.mp3` cannot be cached or served.
- [ ] **SF.11 Layout and accessibility sweeps** *(tests)*. Add the Settings screen with the Sound row to `tests/e2e/polish-screens.ts` (D525 (2)) and run the 44 px tap sweep, the width checks at 320 / 360 / 900 / 1300 px, the 320 px Largest text check, reduced motion and contrast, in both themes and at every Text size. **Acceptance:** 0 findings in every suite; the Sound row and its help line fit at 320 px at Largest with no sideways scroll; **no tap, sheet, confirmation or animation was added to any routine flow** (the Sound row adds two buttons in Settings only; the motion counts equal v1.1's); the playtest checks that a routine check-in is still 15 taps or fewer.
- [ ] **SF.12 Determinism, simulator, smoke and docs** *(wrap-up)*. Run `npm run check` and the full simulator suite. Run the production build locally and check it opens a v1.1 save with Sound Off (Claude Code cannot open the live preview; the owner does that at the playtest). Re-measure the production build (≤ 600 KB) and `npm run check` time (warn at 90 s, fail at 120 s, D512). Update `docs/progress.md` (including the v1.1 actual and a v1.2 actual for plan §0.7); tick the plan boxes; open the pull request from `milestone/v1.2` to `main` with the plain-language template and the playtest checklist below. **Acceptance:** all 55 simulator rows pass on the 5 seeds, every player's report equals the v1.1 baseline (`176 of 176 same`), every golden fight and recorded stand replays line for line (`rulesVersion` is 5), schema is 12, the production build is ≤ 600 KB gzipped with the number written down. Wait for the owner's "playtest passed" before `sim:accept`, the merge and the `v1.2.0` tag.

#### Out of scope for v1.2 *(visible deferred list, with the reason)*

| Item | Reason |
|---|---|
| Ambience loop and music | About 100–600 KB; does not fit the 600 KB row; would need a new measured row (D520 (6), D523 (5)) |
| Volume control and sound categories | One On/Off is enough (D521) |
| Sound for the Remembering and the endings | Silence is deliberate there (D520 (4)) |
| Sound on taps and tab changes | Too noisy for a check-in game (D520 (4)) |
| Sound for recruiting, Stores and other buying; for Auto-arrange, Clear to tray, Move to tray | Not one of the 15 moments (D520 (4)) |
| Sound while the app is hidden or for what happened while away | Fixed rule (D521 (7)) |
| Working around the phone's silent switch | Never (D521 (5)) |
| Tactical placement in the Last Stand | v1.5 — The Breach (D499, D500) |
| Rising difficulty | v1.3 — Keep the Vigil (D453, D477, D499) |
| The Descent | v1.4 (D448, D477, D499) |
| Event-only cosmetics, legendary hunters' animation, screen-reader labels | Deferred (D490, D489) |
| Any game rule, number, save or combat change | Not part of v1.2 (`rulesVersion` stays 5, schema stays 12) |

#### Simulator rows

No new simulator row. All 55 existing rows must pass and every player's report must equal the v1.1 baseline (`176 of 176 same`). No simulator policy plays or requests sound.

#### Owner playtest checklist *(on your iPhone; send screenshots of anything wrong)*

- **Sound is Off by default:** open the preview with your v1.1 save. Does More ▸ Settings show Sound: Off? Does the game stay silent?
- **Turn Sound On, then build something:** do you hear Build? Does the help line read right?
- **The silent switch:** flip your phone's silent switch (the side switch). Is the game silent? Flip it back: does sound return?
- **Phone volume:** do the sounds follow the phone's volume buttons, and are they a sensible loudness?
- **Leave and return:** switch to another app and back; lock the phone and unlock; take or fake a call. Does sound come back after your first tap? Is nothing played for what happened while you were away?
- **Offline:** turn on airplane mode, reload the app, and trigger a sound. Does it still play?
- **Each of the seven sounds:** use the debug **Play sound** row for Build, Launch, Place, Win, Lose, Fanfare and Nightfall. Does each sound right for its job? Can you tell Win from Fanfare, and Lose from Nightfall?
- **The 15 moments in real play:** buy and build; launch and finish a contract (win and lose); clear a Delve floor and lose a run; a hunter rank-up; a Great Beast milestone or kill; a Legendary hunter; the Long Night arriving; place a piece in Arrange Hold. Does each play the right sound once, and nothing plays for taps, tabs, Auto-arrange or the Remembering?
- **Several at once:** a bulk buy, or a result and a Rank-up together. Does it stay tidy (one sound)?
- **Reset keeps Sound:** use Reset everything… (on a spare save). Is Sound still how you left it? Does pasting a save code leave it alone?
- **Cold start:** close the app completely, open it with Sound On. Is the very first sound after the first tap heard?
- **Music in another app:** play music in another app, then open the game. Does the music keep playing and do game sounds still come?
- **The Hold's Rank-up** (debug panel): do you hear Fanfare?
- **Largest text:** set Text size to Largest. Send a screenshot of More ▸ Settings. Can you hit the Sound buttons easily?
- **Daily check-in speed:** is a normal check-in still 15 taps or fewer?
- **Do the sounds annoy you?** Too loud, too long, too many? Which one would you cut?
- **Looks wrong on my phone:** send screenshots.
- **Anything that felt like a chore.**
````

## D — The plan header "Depth" line

**Find:**
```markdown
**Depth:** v0.0–v1.1 are in full detail (v1.0 completed 2026-10-22, D472–D497; v1.1 fleshed out 2026-10-22, D498–D508). v1.2–v1.5 are at outline level.
```

**Replace with:**
```markdown
**Depth:** v0.0–v1.2 are in full detail (v1.0 completed 2026-10-22, D472–D497; v1.1 completed 2026-10-23, D498–D518; v1.2 fleshed out 2026-10-23, D519–D528). v1.3–v1.5 are at outline level.
```

## E — §0.7 size table: add v1.2

**Find:**
```markdown
| v1.1 | 15 (TL.1–TL.13, with TL.5 in 3 parts) | 12–16 |
```

**Replace with:**
```markdown
| v1.1 | 15 (TL.1–TL.13, with TL.5 in 3 parts) | 12–16 |
| v1.2 | 12 (SF.1–SF.12) | 8–11 **[JC]** |
```

## F — Judgment call 16

**Find:**
```markdown
followed by outlines for v1.2 (Audio), v1.3 (Keep the Vigil), v1.4 (The Descent) and v1.5 (The Breach) (D499–D508).
```

**Replace with:**
```markdown
followed by outlines for v1.2 (Audio), v1.3 (Keep the Vigil), v1.4 (The Descent) and v1.5 (The Breach) (D499–D508).
16. **v1.2 is 12 tasks (SF.1–SF.12) over an estimated 8–11 sessions:** seven short sound effects for 15 moments, off by default, UI-only (no core, save or simulator change), Web Audio only; the sounds are capped at 30 KB and the whole build must stay at or under 600 KB; the owner picks by ear from an audition sheet; nothing sound-related starts until the owner has uploaded the four Kenney packs as zips (D519–D528). The estimate is a guess: the weight is two owner waits (the upload, the listening) and the size measurement, not the code.
```
