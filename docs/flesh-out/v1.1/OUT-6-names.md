# OUT-6 — Proper nouns and collision check (v1.1 "The Hold's Layout", 2026-10-22, revised after red-team review)

## Proper nouns checked in v1.1 (S15)

`v1.1` adds no new characters, creatures, villages, Orders, relics, Legendaries, or brews.

Two landmark terms and one milestone title are introduced for the grid boundaries and roadmap:
- **The Fell Breach** (north grid border / defense front): derived from the existing setting band *The Fells* (`setting-primer.md` §2: "the night the sky went black over the fells"; "the dark comes down from the fells in the Last Stand"). Web search against GDD §2.3 influences (Witcher, Skyrim, WoW, 40K, Dark Souls): no collision found for a game location or creature.
- **Lowland Gate** (south grid border / village road): derived from the existing setting band *The Lowlands* (`setting-primer.md` §2: "where the lowland river meets the first fells"). Web search against GDD §2.3: generic compound, no collision found.
- **The Breach** (milestone v1.5 title, D499): plain English noun, no collision.

All other UI labels use plain English terms:
- **Arrange Hold**, **Blueprint ghosts**, **Auto-arrange**, **Clear to tray**, **Hold view** (plain UI labels).
- Roadmap milestones: **The Hold's Layout** (`v1.1`), **Sounds of the Frontier** (`v1.2`), **Keep the Vigil** (`v1.3`, already in `tests/content/names.ts` from `v0.11`), **The Descent** (`v1.4`, already in `lore-secrets.md` §6).

## Changes to `tests/content/names.ts`

Add "The Fell Breach" and "Lowland Gate" to the landmark table in `tests/content/names.ts` with the 2026-10-22 check date. `npm run check` stays green.

## Closed name questions (D505)

- **Q41** (*Remember Them*, *Keep the Vigil*, *The Remembering*): closed as accepted by the owner (2026-10-22).  
- **Q48** (*Gaunt Wolf*): closed as accepted by the owner (2026-10-22).
