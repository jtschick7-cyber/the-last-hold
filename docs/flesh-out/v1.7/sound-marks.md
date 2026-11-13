# Sound marks (v1.7 audition map and picks)

Number → pack → original file → slot for the three new v1.7 cues (`D608`; continues numbering from `35` in `docs/flesh-out/v1.2/sound-marks.md`, which remains untouched). Read alongside the v1.2 map by `tools/sound-marks.ts`, `tools/audition-page.ts`, `tools/make-audition.ts`, and (at `VB.9`) `tools/make-sounds.ts`.

Candidates were chosen by **name and length only** from the four committed CC0 Kenney packs in `art-src/packs/audio/` (`Impact Sounds`, `Interface Sounds`, `RPG Audio`, `Music Jingles`), avoiding every file already listed in `v1.2/sound-marks.md`. Length limits follow `D524 (2)` and `D608`: Stand brace (`brace`) up to `0.6` s, Discovery (`discover`) up to `0.8` s, and Combat impact (`strike`) up to `0.4` s. Converted to normalized tagless mono MP3s at 48 kbps under `art-src/audition/` (`36.mp3`–`47.mp3`, preview build only; all ten shipped sounds share the `45 KB` cap of `D608`).

| n | slot | pack | file inside the pack | max s |
|---|---|---|---|---|
| 36 | brace | Impact Sounds | `Audio/impactPlank_medium_000.ogg` | 0.6 |
| 37 | brace | Impact Sounds | `Audio/impactPlate_heavy_001.ogg` | 0.6 |
| 38 | brace | RPG Audio | `Audio/beltHandle2.ogg` | 0.6 |
| 39 | brace | RPG Audio | `Audio/doorClose_2.ogg` | 0.6 |
| 40 | discover | Interface Sounds | `Audio/glass_004.ogg` | 0.8 |
| 41 | discover | Interface Sounds | `Audio/confirmation_002.ogg` | 0.8 |
| 42 | discover | Music Jingles | `Audio/Pizzicato jingles/jingles_PIZZI10.ogg` | 0.8 |
| 43 | discover | Music Jingles | `Audio/Steel jingles/jingles_STEEL09.ogg` | 0.8 |
| 44 | strike | Impact Sounds | `Audio/impactPunch_medium_001.ogg` | 0.4 |
| 45 | strike | Impact Sounds | `Audio/impactMetal_light_000.ogg` | 0.4 |
| 46 | strike | RPG Audio | `Audio/chop.ogg` | 0.4 |
| 47 | strike | RPG Audio | `Audio/knifeSlice2.ogg` | 0.4 |

## Pick

**Owner's picks, 2026-11-09** (`11.2 KB` across the three new cues; `39.6 KB` across all ten cues against the `45 KB` cap of `D608`).

One number per slot (or "none of these"), picked by ear (`VB.5`).

| slot | pick |
|---|---|
| brace | 36 |
| discover | 42 |
| strike | 44 |
