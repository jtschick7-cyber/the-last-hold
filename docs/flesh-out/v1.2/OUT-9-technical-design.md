# OUT-9 — Edits to `docs/technical-design.md` (v1.2 "Sounds of the Frontier", D519–D528)

Every **Find** was copied from the Project's copy of `docs/technical-design.md` on 2026-10-23 and occurs **exactly once**. **If one does not match exactly once, stop and tell the owner.** Edits are in document order. Edit 5 appends the new §20 at the end of the file.

**Names to check in the repo (not in the Project's documents):** §19.4 names the function Reset everything calls `resetAppSettingsTimestamps`; the code in `src/platform/app-settings.ts` seen in an earlier session calls it `afterReset`, and the `AppSettings`, `parseAppSettings`, `readAppSettings`, `writeAppSettings` and `AssetKind` names also come from that code view, not from a document. **Claude Code uses the repo's actual names and reports any difference in the progress entry; a mismatch is not a stop.** This file does not edit §19.4 (a v1.1 section).

## 1 — §12.4 Credits and license checks: the audio list

**Find:**
```markdown
- `tools/gen-credits.ts` writes `docs/credits.md` from the manifest.
```

**Replace with:**
```markdown
- `tools/gen-credits.ts` writes `docs/credits.md` from the manifest **and, from v1.2, from the audio list (§20.2)**.
```

## 1b — §12.4 the CI file check includes the audio list

**Find:**
```markdown
or if any file in `public/assets/` isn't listed in the manifest.
```

**Replace with:**
```markdown
or if any file in `public/assets/` isn't listed in the manifest **or, for `public/assets/audio/`, in the audio list (§20.2)**.
```

## 2 — §15 Debug panel: Play sound

**Find:**
```markdown
- **Timing readout:** the last Suggest, odds, and catch-up durations, for checking performance on a real phone.
```

**Replace with:**
```markdown
- **Timing readout:** the last Suggest, odds, and catch-up durations, for checking performance on a real phone.
- **Play sound (v1.2, D522 (6)):** one button per sound. A **UI-only action in the debug panel, not a `debug.*` core command**: it writes nothing, does not touch the save and does **not** set `meta.debugUsed` (a second recorded exception to the rule above, after "Set last export age", §18.6). It works only while Sound is On (§20).
```

## 3 — §18.1 settings key: add `sound`

**Find:**
```markdown
**v1.1 adds `holdView` (`'grid' | 'scene'`, default `'grid'`, D503, §19.4).**
```

**Replace with:**
```markdown
**v1.1 adds `holdView` (`'grid' | 'scene'`, default `'grid'`, D503, §19.4). v1.2 adds `sound` (`'on' | 'off'`, default `'off'`, D521, §20.1).**
```

**And find:**
```markdown
keeps `textSize`, `backupReminder` and `holdView` (v1.1).
```

**Replace with:**
```markdown
keeps `textSize`, `backupReminder`, `holdView` (v1.1) and `sound` (v1.2).
```

## 4 — §18.6 Backup reminder: the debug exception wording

**Find:**
```markdown
- **Debug exception (the one recorded exception to §15):**
```

**Replace with:**
```markdown
- **Debug exception (the first recorded exception to §15; v1.2 adds a second, "Play sound", §15, §20.5):**
```

## 5 — New §20, after §19.5 (append at the end of the file)

**Find:**
```markdown
The 8 × 8 coordinate layout format and piece IDs are designed for direct reuse by v1.5. In v1.5, Last Stand records will store an optional layout snapshot without migrating `HoldLayoutState`.
```

**Replace with:**
````markdown
The 8 × 8 coordinate layout format and piece IDs are designed for direct reuse by v1.5. In v1.5, Last Stand records will store an optional layout snapshot without migrating `HoldLayoutState`.

## 20. Sounds of the Frontier (v1.2, D519–D528)

**No change to the core, the save schema (12), the RNG streams, `rulesVersion` (5), the simulator's players or any golden fight.** Sound is a UI-only layer: the UI watches what the game already shows and plays a cue. The core does not know it exists. **Sound is never the only signal.** Player-facing strings are in GDD §9.22.

### 20.1 The setting (D521)

`AppSettings` in `src/platform/app-settings.ts` gains one field:

- `sound: 'on' | 'off'`, default `'off'` (a type `SoundSetting`, a list `SOUND_SETTINGS = ['off', 'on'] as const` in the style of `TEXT_SIZES` and `HOLD_VIEWS`).
- `parseAppSettings`: a missing or unknown value falls back to `'off'`, like the other fields; a broken key never blocks the app.
- The function Reset everything… calls (`afterReset` in the code seen; §19.4 says `resetAppSettingsTimestamps`) keeps `sound`, with `textSize`, `holdView` and `backupReminder`, and clears only the three timestamps.
- Paste code, Load file and Restore never touch the key. The key is not part of the export code or file. A failed write leaves the setting for this session only, as for the other fields.
- Storage keys stay channel-namespaced: `lasthold:settings`, `lasthold-preview:settings`.

### 20.2 Files, the audio list and the cache (D522, D523, D524)

- **Format:** mono MP3, about 48 kbps, one small file per sound, **no loops**: `public/assets/audio/<id>.mp3` for the seven ids `build`, `launch`, `place`, `win`, `lose`, `fanfare`, `nightfall`. Converted by Claude Code at authoring time (generators run at authoring time, §12.3); the committed result ships.
- **The manifest.** `src/content/assets.ts` has **no audio section** (the earlier "reserved" slot was never created; D522 and GDD §10). `AssetKind` is `icon | building | scene | portrait | sprite | frame` and `<Sprite>` renders pictures, so audio does **not** go through `<Sprite>`. v1.2 adds a **separate typed list**, in `src/content/audio.ts` (or the nearest equivalent the repo makes simpler; Claude Code tells the owner if it chooses differently): each row has `id`, `file`, `bytes` (checked by a test against the file), `source: 'pack'`, `pack`, `url`, `license: 'CC0'`, `credit`, `originalFile`. `tools/gen-credits.ts` **and the About & Credits builder (the code behind GDD §9.20's credits screen, which shows the same text as `docs/credits.md`)** read this list as well as the picture manifest (§12.4), so the "credits.md is up to date" test and the About screen agree.
- **Size (D523).** The unit is 1 KB = 1,024 bytes. All files together ≤ 30 KB (target about 24 KB, about 3.8 s). The 600 KB row (614,400 bytes gzipped) is the binding limit for the whole build: **budget = 614,400 − (build without sounds) − 1,024, never more than 30 KB.** MP3 does not shrink under gzip. If the picks do not fit, stop and ask the owner; never change the row.
- **Offline.** The sounds must be in the service worker's precache. Claude Code **checks** that the Workbox `globPatterns` in `vite.config.ts` include `mp3` and adds it if not, and checks that the live worker's `navigateFallbackDenylist` still excludes `/preview/` (§11.3). The offline smoke (§14) fetches one sound path from the cache while offline and checks the status and byte length.
- **The audition build (D524 (2)).** Kenney's packs ship as OGG and the preview is built by CI from the branch, so the candidates are **converted to mono MP3 and committed under `art-src/audition/`** (about 35 small files, never under `public/`). The **preview channel's build step copies `art-src/audition/` and the audition page into its output; the live channel's does not** (the build knows its channel, §11.3). The candidates stay committed under `art-src/` and are never shipped. A test fails if any candidate file or the page reaches the live build or counts toward the 600 KB measurement. They are never listed in the shipped audio list. The page is generated from the committed `docs/flesh-out/v1.2/sound-marks.md` map.

### 20.3 The sound module (UI side, no core import)

A module under `src/platform/sound/` (or the repo's nearest equivalent; it is browser-only, like `clock.ts` and `storage.ts`, §3). **Nothing in `src/core/` may import or read it, or the `sound` setting.** The layer rule (§4.2) already bars `src/core/` from importing platform code; the non-coupling lint list (§19.1) also gains this module and the setting (D525 (5)).

- **A pure mapping:** a table from the 15 moments to the 7 sound ids (GDD §9.22), and a pure function `strongest(candidates)` that returns the winner in the fixed order `fanfare`, `nightfall`, `win`, `lose`, `build`, `launch`, `place`. Both are unit tested without any audio.
- **The player.** Web Audio only: `fetch` the file, `decodeAudioData`, play with an `AudioBufferSourceNode`. **No `<audio>` elements.** One `AudioContext`, created (suspended) when Sound is On and resumed on a `click` or `touchend` (see 20.4). Decoded buffers are kept for the session.
- **With Sound Off:** the page creates no context and fetches and decodes nothing (the service worker still precaches the files at install; they count in the 600 KB). Turning Sound On creates and resumes the context in the same tap (the tap on the switch), then fetches and decodes the files.
- **The 150 ms hold** (owner's choice) is a UI timing constant in this module, not a `balance.ts` constant (D520 (5) (b)). Each requested sound is held 150 ms; the strongest of those requested inside the hold plays and the others are dropped. Tests drive it with a fake clock.
- **Failure is silence:** a file that fails to fetch or decode plays nothing, shows nothing and does not throw. A single failure never stops the other sounds.
- **Test hook (D522 (7)):** the module reads one documented global (for example `window.__lastholdSoundTest`). When a test sets it to a recording fake engine, the module sends `play(id)` calls to it instead of Web Audio. **The fake replaces only the output:** every readiness rule in 20.4 still runs, and tests can set the fake context's state (`running`, `suspended`, `interrupted`) and the page's visibility. It does nothing unless a test sets it.

### 20.4 Readiness and the skip rule (D520, D521, D522)

A sound plays only if all of these hold at the moment it is requested: Sound is On; the context exists and is `running`; the page is visible. Otherwise **it is skipped: never queued and never replayed.**

- **Unlock on iPhone.** Sound already On when the app opens: the context is created suspended and the files are fetched and decoded at once, so the first tap only has to resume it and the sound for that tap can play. Resume on `click` or `touchend`, not `pointerdown` or `touchstart` (recent iOS does not count those as a gesture for audio). After a call, a lock or returning from another app the context may be `suspended` or `interrupted` (treated as paused); the next tap resumes it. Sounds due before it are not replayed.
- **Hidden.** Nothing plays while `document.visibilityState` is `hidden`. What happened while hidden, or while the app was closed (the away sheet's contents), is silent.
- **Where a cue comes from.** The UI watches what the game already shows and plays at the trigger named in GDD §9.22: a command that succeeds (buy, launch, place, Rank-ups); a contract that finishes in the live tick while the app is open and visible, on any tab (never in a catch-up or a debug time skip); a result the first time it is shown (Delve floor, run end, guardian, event attempt; at once if skipped or closed early); the Long Night's sheet the first time it appears in live play. Not at Collect. **Anything not listed is silent.** **If a cue cannot be worked out without changing `src/core/`, stop and ask** (D522 (8)).
- **One sound per player command** (a bulk buy plays once). **A result is sounded only the first time it appears** (a reopened result sheet, a replay from a log or the Library: silent); **Skip during playback plays at most the final result's sound** (D522 (9)).
- **The silent switch** is respected and never worked around: no silent audio element and no other trick.

### 20.5 Debug

The debug panel gets a **Play sound** row (seven buttons). A UI-only action: it writes nothing, does not touch the save and does not set `meta.debugUsed`. It works only while Sound is On (§15).

### 20.6 Tests (D525)

| Area | Tests |
|---|---|
| Settings | Off by default; broken or missing falls back to Off; the Reset function keeps `sound`; Paste / Load / Restore leave it; a failed write |
| Mapping | all 15 moments map to the right sound; `strongest` for every pair in the stated order |
| Rules | not ready, hidden, suspended: nothing queued, nothing replayed; Sound Off: no fetch, no context; decode failure: silence, no throw; the hook does nothing unless set |
| Wiring (Playwright, fake engine, phone viewport) | each of the 15 moments plays its sound once; a bulk buy plays one; the silent list plays none; nothing while hidden; nothing for what happened away; the debug row plays each of the seven without touching the save |
| Files and credits | every shipped file is in the audio list and the reverse; every row has pack, URL, `CC0`, credit; `bytes` equals the file; total ≤ 30 KB; no candidate or audition page in the live build |
| Size | the production build, gzipped, ≤ 614,400 bytes; the measured number and the budget computation are written in the progress entry |
| Offline | the smoke fetches a sound from the cache while offline |
| Decode | every file decodes to a non-empty buffer in Chromium; in WebKit too if headless WebKit can decode MP3 in CI (otherwise the owner's phone is the test, Q55) |
| Non-coupling | the sound module is on the lint list: a planted import from `src/core/` fails |
| Layout | the Settings screen with the Sound row is in `polish-screens.ts` and passes the 44 px, width, Largest, motion and contrast sweeps; the motion counts equal v1.1's; a routine check-in is still 15 taps or fewer |
| Unchanged | all 55 simulator rows; 176 of 176 reports equal the v1.1 baseline; every golden fight and recorded stand replays line for line; schema 12 and `rulesVersion` 5 |

### 20.7 Risks and honest notes

- **iPhone behaviour cannot be proved by CI.** Web Audio needs a tap, follows the silent switch and can be interrupted by calls and locks. The owner's playtest on the real phone is the test (Q55).
- **Code size counts too.** The new module and rows are estimated at 3–6 KB gzipped (an estimate); SF.9 measures.
- **The repo grows by the zips** (D524 (4)); they stay in git history for good.
- **Test timing.** The e2e job has a 15-minute limit (D513) and `npm run check` warns at 90 s and fails at 120 s (D512). The new tests are small; SF.12 re-measures both.
````
