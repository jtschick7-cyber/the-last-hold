# OUT-2a — Edits to `docs/gdd.md` (v1.2 "Sounds of the Frontier", D519–D527)

Every **Find** below was checked against the copy of `docs/gdd.md` in the Project on 2026-10-23 and occurs **exactly once** in it. **If a Find no longer matches exactly once, stop and tell the owner.** Edits are in document order (E10 is the earlier §1.4 line, placed last for convenience). Strings use straight quotes as in the file.

## E1 — §3 session-loop table: add v1.2

**Find:**
```markdown
| v1.1 | The Hold's Layout: decorative 8 × 8 building placement grid and persistent blueprint (§5.1.5, §9.21) |
```

**Replace with:**
```markdown
| v1.1 | The Hold's Layout: decorative 8 × 8 building placement grid and persistent blueprint (§5.1.5, §9.21) |
| v1.2 | Sounds of the Frontier: seven short sound effects for the big moments, off by default (§9.22) |
```

## E2 — §6.5 budgets: the sound files row and the download-size row

**Find:**
```markdown
| **Hold layout save growth** *(v1.1, D506, M5)* | ≤ 1.5 KB | The whole `layout` block with all 40 pieces placed (checked by a unit test, not the throttled benchmark; measured ~1.1 KB) |
```

**Replace with:**
```markdown
| **Hold layout save growth** *(v1.1, D506, M5)* | ≤ 1.5 KB | The whole `layout` block with all 40 pieces placed (checked by a unit test, not the throttled benchmark; measured ~1.1 KB) |
| **Sound files, total** *(v1.2, D523)* | ≤ 30 KB (target about 24 KB) | All shipped sound files together (1 KB = 1,024 bytes). Checked by a unit test on the files, not the throttled benchmark. **The download row below is the binding limit:** the sound code also counts, so the room for sound is what is left of 600 KB after the code is built |
```

**And find:**
```markdown
(v0.11: 500 KB; v1.0: 506 KB).
```

**Replace with:**
```markdown
(v0.11: 500 KB; v1.0: 506 KB; v1.1: 568 KB, measured as 582,081 bytes; **v1.2 (D523): the row stays; the sounds are capped at 30 KB and the whole build must still measure 600 KB or less**).
```

## E3 — §9.10 More menu: Settings row and the debug panel

**Find:**
```markdown
| Settings *(v1.0, D480, D481; v1.1, D503)* | + Text size (Match phone, Large, Largest); Backup reminder (On, Off); Hold view (Grid, Classic scene, v1.1). These live in a settings key outside the save (§9.20, §9.21) | v1.0 / v1.1 |
```

**Replace with:**
```markdown
| Settings *(v1.0, D480, D481; v1.1, D503; v1.2, D521)* | + Text size (Match phone, Large, Largest); Backup reminder (On, Off); Hold view (Grid, Classic scene, v1.1); Sound (On, Off, default Off, v1.2). These live in a settings key outside the save (§9.20, §9.21, §9.22) | v1.0 / v1.1 / v1.2 |
```

**And find:**
```markdown
does not set `debugUsed` (the one recorded exception to technical design §15).
```

**Replace with:**
```markdown
does not set `debugUsed` (a recorded exception to technical design §15; v1.2 adds a second one, **Play sound**, below).
- **Play sound** *(v1.2, D522)*: one button per sound (Build, Launch, Place, Win, Lose, Fanfare, Nightfall) so the owner can hear each one without reaching its moment. It works only while Sound is On in Settings. It is a **UI-only action in the debug panel, not a core command:** it writes nothing, does not touch the save and does not set `debugUsed`.
```

## E4 — §9.11 What exists when: add v1.2

**Find:**
```markdown
| v1.1 | The Hold's Layout: the live 8 × 8 grid header on the Hold screen, the Arrange Hold sheet (44 px tile buttons, tray, Auto-arrange, Clear, Blueprint ghosts toggle), and the Hold view setting (Grid / Classic scene) (§5.1.5, §9.12, §9.20, §9.21) |
```

**Replace with:**
```markdown
| v1.1 | The Hold's Layout: the live 8 × 8 grid header on the Hold screen, the Arrange Hold sheet (44 px tile buttons, tray, Auto-arrange, Clear, Blueprint ghosts toggle), and the Hold view setting (Grid / Classic scene) (§5.1.5, §9.12, §9.20, §9.21) |
| v1.2 | Sounds of the Frontier: no new screen. One Sound row (On / Off, default Off) in Settings; seven short sounds for 15 moments; a Play sound row in the debug panel (§9.22) |
```

## E5 — §9.20 settings key: add `sound`

**Find:**
```markdown
`holdView` (added in v1.1, D503), `lastExportAt`, `snoozeUntil`, `firstSeenAt` (set once, on the first run of v1.0). **Reset everything…** clears the three timestamps and keeps `textSize`, `backupReminder` and `holdView`.
```

**Replace with:**
```markdown
`holdView` (added in v1.1, D503), `sound` (added in v1.2, D521), `lastExportAt`, `snoozeUntil`, `firstSeenAt` (set once, on the first run of v1.0). **Reset everything…** clears the three timestamps and keeps `textSize`, `backupReminder`, `holdView` and `sound`.
```

## E6 — new §9.22, after §9.21

**Find:**
```markdown
  - Under reduced motion (§9.20), the grid header and the Arrange Hold sheet show still frames with no transitions or bobbing.
```

**Replace with:**
````markdown
  - Under reduced motion (§9.20), the grid header and the Arrange Hold sheet show still frames with no transitions or bobbing.

### 9.22 Sounds of the Frontier *(v1.2, D519–D528)*

v1.2 changes **no game number, formula, rule or save field** (`rulesVersion` stays 5, save schema stays 12). Sound is a **UI-only layer**: the UI watches what the game already shows and plays a short cue. The core does not know it exists. **Sound is never the only signal:** every moment below already shows on screen.

- **The setting (D521).** More ▸ Settings gets one row, **Sound**, with **[On] [Off]**. Default **Off**. It is stored as `sound` in the settings key outside the save (§9.20). **Reset everything…** keeps it; Paste code, Load file and Restore never touch it. There is no volume control and no categories. Sound is independent of Reduce motion. **The phone's silent switch is respected and never worked around.**
- **Player-facing strings (word for word; no others):**

  | String | Where it shows | Purpose |
  |---|---|---|
  | `Sound` | Settings row label | Names the setting |
  | `[On] [Off]` | Settings row buttons | The switch |
  | `Short sounds for wins, rank-ups and the Long Night. Your phone's silent switch still mutes them.` | Help line under the row | Says what it does and that the silent switch wins |
  | Debug-panel labels (Play sound; Build, Launch, Place, Win, Lose, Fanfare, Nightfall) and the preview-only audition page's labels | Debug panel and preview build only | Not shown to players of the live app; exempt from the string rule |

- **The seven sounds and their 15 moments (D520).** **Anything not listed here is silent.** The sound plays at the trigger named in the last column.

  | Sound (internal id) | Moments | Trigger (the moment the sound plays) |
  |---|---|---|
  | Build (`build`) | Buying a building level or plot; building a new building (Hold screen) | The buy command succeeds (live tap) |
  | Launch (`launch`) | A contract launched | The launch command succeeds |
  | Place (`place`) | A piece placed in Arrange Hold on a completed move or swap | The place command succeeds |
  | Win (`win`) | A contract won; a Delve floor cleared | A contract: it finishes in the live tick while the app is open and visible (not in a catch-up), on any tab. A floor: the first time its result is shown in playback |
  | Lose (`lose`) | A contract lost; a Delve run lost | Same triggers as Win |
  | Fanfare (`fanfare`) | The Hold's own Rank-up; a hunter's rank-up; a Great Beast milestone; a Great Beast kill; a Legendary hunter unlocked; a Delve guardian beaten | A Rank-up: the command succeeds. An event attempt: the first time its result is shown (at the end of playback, or at once if it is skipped or closed early); one sound per attempt. The guardian: the first time its result is shown |
  | Nightfall (`nightfall`) | The Long Night arrives | The first time the Long Night's sheet appears in live play while the app is open and visible (not from a catch-up) |

- **Silent on purpose:** taps and tab changes; the away sheet and anything that happened while the app was hidden or closed or was caught up on return (including a debug time skip); the Remembering and the endings; Auto-arrange, Clear to tray and Move to tray; any other kind of buying (recruiting, Stores); the Last Stand's start and result (the Long Night's arrival excepted); a boss or hunt attempt that earns no milestone, kill or unlock; Leave run.
- **When a sound plays (D520 (5), D522):**
  - One sound per player command (a bulk buy plays once).
  - Each sound is held 150 ms; if several are due within that time, only the strongest plays: Fanfare, Nightfall, Win, Lose, Build, Launch, Place (D522 (10)).
  - Result sounds play when the result is shown on screen while the app is open (a contract result arriving; a Delve floor or run end when playback reaches it), not at Collect.
  - Nothing plays while the app is hidden. What happened while hidden, and what a returning player catches up on, is silent. A sound due while audio is not ready is **skipped, never queued and never replayed.**
  - A result is sounded only the first time it appears: reopening a result sheet or replaying a fight or Delve from a log or the Library plays nothing, and a playback that is skipped or closed early plays at most the one sound for its result (D522 (9)).
  - With Sound Off, no audio is loaded or started.
- **On an iPhone, sound needs a tap.** Tapping the Sound switch starts audio. If Sound is already On when the app opens, the first tap anywhere starts it. After a call, a lock or returning from another app, the next tap resumes it. If a sound file cannot load, nothing plays and nothing is shown.
- **The files (D522, D523, D524).** Seven short mono MP3 files (about 48 kbps), **no loops.** All together at most **30 KB**, aiming at about 24 KB (about 3.8 s). CC0 only, from the Kenney packs Interface Sounds, Impact Sounds, RPG Audio and Music Jingles, or one separately approved CC0 clip; each has a manifest row with its pack, URL, licence and credit, and `docs/credits.md` is generated from them. The owner picks each sound by ear from an audition sheet in the preview build.
- **Layout and checks.** No tap, sheet, confirmation or animation is added to any routine flow (the Sound row adds two buttons in Settings only); a routine check-in stays at 15 taps or fewer. The Sound row is a tappable thing of at least 44 × 44 px at 320 and 360 px and at every Text size, and meets the contrast ratios of §9.20 in both themes.
- **Deferred, not cut (with reasons).** An ambience loop and music (they do not fit the 600 KB row; they would need a new measured row); volume and categories (one On/Off is enough); cues for the Remembering and the endings (silence is deliberate there); sound on taps (too noisy for a check-in game); sound for other kinds of buying and for Auto-arrange.
````

## E7 — §10 Out of Scope: the Audio line

**Find:**
```markdown
- Audio: music and sound effects. **[Decided D476, D499: scheduled as milestone v1.2 "Sounds of the Frontier": CC0 sounds only, muted by default with a toggle, no new runtime dependency. The asset manifest reserves an `audio` section so sound can be added without restructuring.]**
```

**Replace with:**
```markdown
- Audio: **short sound effects are in v1.2 (§9.22); ambience loops, music, volume and categories stay out.** **[Decided D476, D499, D520–D524: milestone v1.2 "Sounds of the Frontier": CC0 sounds only, off by default with a switch in Settings, no new runtime dependency. The manifest's `audio` section was never created; v1.2 adds a separate audio list (technical design §20.2). Music and loops need a new measured size row and wait for a later milestone.]**
```

## E8 — Judgment calls in §9–10, item 10

**Find:**
```markdown
10. **Audio comes after v1.0, as its own small milestone,** with a slot reserved in the asset manifest. (D476)
```

**Replace with:**
```markdown
10. **Audio comes after v1.0, as its own small milestone** (v1.2, short sound effects only, off by default). The "reserved slot" in the asset manifest did not exist; v1.2 adds a separate audio list. (D476, D520, D522)
```

## E9 — Judgment calls at the end of `docs/gdd.md`

**Find:**
```markdown
6. **Live odds benchmark budgets are set to 120 ms (identified) and 150 ms (3 candidates, 500 samples/candidate)** to provide clean headroom on throttled CI runners without failing on CPU noise (D505, M6).
```

**Replace with:**
```markdown
6. **Live odds benchmark budgets are set to 120 ms (identified) and 150 ms (3 candidates, 500 samples/candidate)** to provide clean headroom on throttled CI runners without failing on CPU noise (D505, M6).

## Judgment calls added in the v1.2 flesh-out (D519–D528)

1. **Sound is UI-only and short effects only:** seven sounds, 15 moments, no loops, no music, no volume (D520, D521).
2. **Off by default, one switch, and the phone's silent switch wins** (never worked around) (D521).
3. **A sound that cannot play now is skipped, never queued or replayed;** nothing plays while hidden; what was missed while away is silent (D520, D522).
4. **One sound per command; the strongest of several within 150 ms; result sounds at the moment the result is shown** (D520 (5)).
5. **Web Audio only, mono MP3, precached for offline play** (D522).
6. **The 600 KB row stays; the sounds are capped at 30 KB; the whole build is the binding limit** because the new code also counts (D523).
7. **The owner picks each sound by ear from an audition sheet in the preview build;** Claude cannot hear (D524).
8. **A Play sound row in the debug panel** is the second UI-only debug exception (D522 (6)).
```

## E10 — §1 Vision & Pillars, non-goals line: audio

**Find:**
```markdown
- Multiplayer, leaderboards, monetization, audio (out of scope for now).
```

**Replace with:**
```markdown
- Multiplayer, leaderboards, monetization. *(Audio was out of scope for v1.0; short sound effects arrive in v1.2, §9.22; music and loops stay out.)*
```
