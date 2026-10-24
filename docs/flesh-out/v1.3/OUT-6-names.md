# OUT-6 — New proper nouns and collision checks (v1.3 "Keep the Vigil")

**One name to confirm: "Rising Vigil".** No new person, place, creature, item, Order or story name. No story text is written.

| Name | What it is | Check | Status |
|---|---|---|---|
| **Rising Vigil** | The feature's player-facing label (the stand-screen row, GDD §9.23) | Two plain words. "Vigil" is already in the game: *Keep the Vigil* (the ending choice), *Sit the Vigil* (Radmila's combat effect), *The Long Vigil* (a Delve blessing). A web search on 2026-10-24 for `"Rising Vigil" game` returned only *Ascension: Rise of Vigil*, an unrelated deck-building board and card game expansion, and nothing from the games in GDD §2.3 (The Witcher, Elder Scrolls / Skyrim, Warcraft / WoW, Age of Empires, Hades, Dark Souls). None of "rising", "vigil" or "vigilance" is on the avoid list. The earlier search of Q41 (2026-10-21) found only unrelated games called "Vigil". Caution carried from Q41: the search tool is weak for exact phrases, so read this as "no collision found", not "checked everywhere". | **For the owner to confirm at D551.** If a collision is found later, the label is one string in one table (GDD §9.23); the alternative is the plain **"Harder stands"**. |

- **The Vigilant** (the simulator player, GDD §6.1) is a code name for a test player. It is never shown to a player of the game and is not a game name.
- The nine strings in GDD §9.23 are plain sentences, not names. They avoid every avoid-list word (no "kindle", "ash", "hollow", "bonfire", "souls").
- `tests/content/names.ts`: add "Rising Vigil" only if the names test finds it in a `name`, `title`, `epithet`, `place` field or a `properNouns` array (technical design §14); if the label lives only in a string table the test does not read, nothing is added.
- **If a session adds any other proper noun,** it searches the name against GDD §2.3 and, on a collision, stops and asks the owner with alternatives. If it cannot search the web, it adds the name to `docs/questions.md` as an open question and marks the task `[?]`.
