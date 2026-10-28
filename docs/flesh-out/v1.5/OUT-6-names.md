# OUT-6 — New proper nouns (v1.5 "The Breach", 2026-10-28)

**No new proper noun.** The milestone adds plain words only. Each is listed here so the §2.3 collision check (against the influences in GDD §2.3: The Witcher, Elder Scrolls / Skyrim, Warcraft, Age of Empires, Warhammer 40K / Tacticus, Hades, and Dark Souls as a not-an-influence avoid list) is a recorded decision and not an assumption. **None was web-searched in this planning session**; Claude Code's session that can search runs the checks at TB.1 and writes the date into `tests/content/names.ts`. A session that cannot search marks the task `[?]` and adds the unchecked words to `docs/questions.md` (the test stays red, never skipped). A collision: stop and ask, with alternatives.

| Word | Where it shows | Kind | Note |
|---|---|---|---|
| Lanes / Lane {n} | Strip, list, breakdown, wave list | Plain word | Generic. "Lane" is a common word; a possible collision with game terms (for example MOBA "lanes") is about usage, not a name, but is listed for the check |
| Cover | Strip, breakdown | Plain word | Generic (a combat word in many games); no named mechanic is copied |
| Reach | Breakdown | Plain word | Generic |
| Stacked | Breakdown line | Plain word | Generic |
| Suggest layout / Use this layout | Buttons | UI phrase | Follows the existing "Suggest" buttons |
| Arrange Hold (button on the Last Stand screen) | Last Stand screen | Existing v1.1 sheet name | Already cleared in v1.1; unchanged |
| The Fell Breach | Already in use (v1.1) | Place name | Cleared in v1.1; unchanged. The milestone title "The Breach" is a plan name, not shown to the player |
| `tactician` | Simulator player id only | Internal id | Never shown to the player; a generic word |

Content test: `tests/content/names.ts` scans names, titles, epithets, places, short names and proper nouns. No entry is required for generic words; the dated notes above go in as generic.
