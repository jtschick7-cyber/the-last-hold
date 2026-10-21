# OUT-6 — New proper nouns and the collision search (v0.11, 2026-10-21)

**No new person name and no new place.** Everyone in OUT-3 already exists.

| Name | Where used | Search made (2026-10-21) | Result |
|---|---|---|---|
| **The Remembering** | Card title, shelf name, the milestone | "The Remembering" next to Dark Souls, Skyrim, Witcher, Warcraft, Hades, Warhammer | Nothing relevant came back; only the games' own pages. Plain English phrase; not a title I know of in the influences |
| **Remember Them** | Ending name (lore §6) | "Remember Them" ending video game fantasy | Nothing matching; results were *Remember Me* (a different game) and small itch.io games |
| **Keep the Vigil** | Ending name (lore §6) | "Keep the Vigil" ending video game | Nothing matching an ending; results were *Vigil: The Longest Night* and an achievement called "Keeper of the Vigil." A different phrase, but the word *vigil* is in use. Not a collision in my read |
| R-01 to R-11 scene titles ("The line along the wall", "Everything on the table", "The roll", "Later", "The count", "The hearth keeps itself", "It is warm where I am") | Scene titles | Not searched individually | Plain phrases, like the Orders chapter titles (D423) |
| "Studied" / "Creatures known well" | Card text | — | Existing terms |
| Shelf entry titles "The reading", "Later"; the Rime heading "After the ending"; R-04b "The fortieth" | Library, scene | Not searched individually | Plain phrases. **The names test reads every `title` field, so add all of these to `tests/content/names.ts`** |

**For `tests/content/names.ts`:** add the three ending/shelf names with the date 2026-10-21 and the note *"searched, no collision found; search tool weak on exact phrases (Q41)"*, and list the scene titles as plain phrases.

**Also checked against the avoid list (GDD §2.3):** none of the ending names is "keep the fire" or "let it go out"; Keep the Vigil is "not yet," not a rival ending.
