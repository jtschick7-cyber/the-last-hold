# Sound marks (v1.2 audition map and picks)

Number → pack → original file → slot. This file is the map the audition page is built from (`tools/audition-page.ts`) and the converter reads (`tools/audio-convert.ts`). The owner writes one pick per slot in the **Pick** list at the bottom; an empty pick means not chosen yet (Q53).

Candidates were chosen by **name and length only** (Claude cannot hear): the length limit per slot is the guidance of D524 (2) (Build, Launch, Place up to 0.4 s; Win and Lose up to 0.8 s; Fanfare and Nightfall up to 1.2 s). A longer clip is cut at the limit with a short fade out. All converted to mono MP3 at 48 kbps with evened loudness (`art-src/audition/`, preview build only).

| n | slot | pack | file inside the pack | max s |
|---|---|---|---|---|
| 1 | build | Impact Sounds | `Audio/impactWood_heavy_000.ogg` | 0.4 |
| 2 | build | Impact Sounds | `Audio/impactWood_medium_002.ogg` | 0.4 |
| 3 | build | Impact Sounds | `Audio/impactMetal_heavy_001.ogg` | 0.4 |
| 4 | build | Impact Sounds | `Audio/impactMetal_light_002.ogg` | 0.4 |
| 5 | build | RPG Audio | `Audio/metalLatch.ogg` | 0.4 |
| 6 | launch | Interface Sounds | `Audio/confirmation_001.ogg` | 0.4 |
| 7 | launch | Interface Sounds | `Audio/maximize_001.ogg` | 0.4 |
| 8 | launch | Interface Sounds | `Audio/open_002.ogg` | 0.4 |
| 9 | launch | RPG Audio | `Audio/beltHandle1.ogg` | 0.4 |
| 10 | launch | RPG Audio | `Audio/drawKnife1.ogg` | 0.4 |
| 11 | place | Impact Sounds | `Audio/impactSoft_medium_001.ogg` | 0.4 |
| 12 | place | Impact Sounds | `Audio/impactWood_light_000.ogg` | 0.4 |
| 13 | place | Interface Sounds | `Audio/drop_003.ogg` | 0.4 |
| 14 | place | Interface Sounds | `Audio/drop_004.ogg` | 0.4 |
| 15 | place | RPG Audio | `Audio/bookPlace1.ogg` | 0.4 |
| 16 | win | Music Jingles | `Audio/8-Bit jingles/jingles_NES07.ogg` | 0.8 |
| 17 | win | Music Jingles | `Audio/Hit jingles/jingles_HIT09.ogg` | 0.8 |
| 18 | win | Music Jingles | `Audio/Pizzicato jingles/jingles_PIZZI11.ogg` | 0.8 |
| 19 | win | Music Jingles | `Audio/Sax jingles/jingles_SAX13.ogg` | 0.8 |
| 20 | win | Music Jingles | `Audio/Steel jingles/jingles_STEEL08.ogg` | 0.8 |
| 21 | lose | Interface Sounds | `Audio/error_003.ogg` | 0.8 |
| 22 | lose | Impact Sounds | `Audio/impactSoft_heavy_001.ogg` | 0.8 |
| 23 | lose | Impact Sounds | `Audio/impactPunch_heavy_000.ogg` | 0.8 |
| 24 | lose | RPG Audio | `Audio/doorClose_4.ogg` | 0.8 |
| 25 | lose | Music Jingles | `Audio/Sax jingles/jingles_SAX10.ogg` | 0.8 |
| 26 | fanfare | Music Jingles | `Audio/8-Bit jingles/jingles_NES13.ogg` | 1.2 |
| 27 | fanfare | Music Jingles | `Audio/Hit jingles/jingles_HIT15.ogg` | 1.2 |
| 28 | fanfare | Music Jingles | `Audio/Pizzicato jingles/jingles_PIZZI03.ogg` | 1.2 |
| 29 | fanfare | Music Jingles | `Audio/Sax jingles/jingles_SAX03.ogg` | 1.2 |
| 30 | fanfare | Music Jingles | `Audio/Steel jingles/jingles_STEEL13.ogg` | 1.2 |
| 31 | nightfall | Impact Sounds | `Audio/impactBell_heavy_000.ogg` | 1.2 |
| 32 | nightfall | Impact Sounds | `Audio/impactBell_heavy_002.ogg` | 1.2 |
| 33 | nightfall | Impact Sounds | `Audio/impactBell_heavy_003.ogg` | 1.2 |
| 34 | nightfall | RPG Audio | `Audio/creak2.ogg` | 1.2 |
| 35 | nightfall | RPG Audio | `Audio/doorOpen_1.ogg` | 1.2 |

## Pick

One number per slot (or "none of these").

| slot | pick |
|---|---|
| build | |
| launch | |
| place | |
| win | |
| lose | |
| fanfare | |
| nightfall | |
