# OUT-6 — New proper nouns and collision checks (v1.2 "Sounds of the Frontier")

**None.**

- The milestone adds no person, place, creature, item, Order or story name. No story text is written.
- The seven sound ids (`build`, `launch`, `place`, `win`, `lose`, `fanfare`, `nightfall`) and their player-facing labels (Build, Launch, Place, Win, Lose, Fanfare, Nightfall) are plain words, used only inside the debug panel and in code, not as names in the setting. "Nightfall" is an everyday word for the Long Night's sound, not a name of anything in the game.
- The milestone title "Sounds of the Frontier" and the Sound row's strings are plain phrases. The title was set by D476 and D499 and appears in the plan and the decisions log; it is not a proper noun for `tests/content/names.ts`.
- The Kenney pack names (Interface Sounds, Impact Sounds, RPG Audio, Music Jingles) are credits for the licence file, not game names. They appear only in `docs/credits.md` and the audio list.
- **If a session adds any other proper noun,** it searches the name against GDD §2.3 and, on a collision, stops and asks the owner with alternatives.
