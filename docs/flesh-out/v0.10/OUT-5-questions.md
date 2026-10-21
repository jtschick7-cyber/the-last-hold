# OUT-5 — Questions for `docs/questions.md` (Q34 to Q37)

**Append to `docs/questions.md`.** The next free number was Q34. None blocks the docs commit; each says what it blocks. *(Revised after the independent review, 2026-10-21.)*

### Q34 — The name search found near-matches for two Order names *(asked 2026-10-21; open)*
- **Context:** GDD §2.3 requires a web search for every new proper noun. It was run on 2026-10-21 for the four Order names (results in OUT-6). **"Grey Wives" and "the Quenchers": no match.** **"Thanes' Moot":** "Moot" is also a lore term in Skyrim (the assembly where the Jarls choose the High King, UESP "Lore:Moot"); the GDD allows "thane" and "moot" is an ordinary old English word (folkmoot), and the avoid list does not name it. **"Bell-Watchers":** Dark Souls has a "Bell Keepers" covenant and "Abyss Watchers"; no exact match, and the avoid list targets different elements (souls, kindling, ash, hollows, bonfires), but the two words are close in feel. The chapter and opening titles are plain English phrases and were not searched one by one.
- **Options:** (a) Keep both names (they are in the setting primer and lore §14 already). (b) Rename "Thanes' Moot" to something with "headmen" (the GDD's other allowed word), for example "the Headmen's Moot". (c) Rename "Bell-Watchers" to something plainer, for example "the Bell-Ringers". (d) Both (b) and (c).
- **Recommendation:** (a). Neither is a name from those games, both are the lore's own, and a rename would touch the lore, the primer and the chapter texts. Choose (b) or (c) if "Moot" or "Watchers" reads too close to those games to you.
- **Blocks:** nothing (the names test is green with the dated entries). A rename would be one text change before T10.9.
- **Answer (owner):** *(open)*

### Q35 — The owner's save may not hold some standing counts *(asked 2026-10-21; open)*
- **Context:** the migration backfills standing once, from the save's history, **capped at level 1** (D410, D421). I could not see which counts the save keeps (for example, whether every brew or property revealed is recorded, or only the current Book; the Alchemy skill's XP may count the same things). T10.1 reports exactly which are recoverable before it writes the migration. Anything not recoverable starts at 0.
- **Options:** (a) Accept what is recoverable. Because of the level-1 cap, the result is the same start (level 1) whatever the history, so a gap costs nothing. (b) Ask Claude Code to estimate the missing counts. (c) Use the debug commands to set a starting level you think is fair.
- **Recommendation:** (a). The cap already makes the start level 1; progress from there is live. Use (c) if the start feels off in your playtest.
- **Blocks:** nothing; T10.1 reports the table.
- **Answer (owner):** *(open)*

### Q36 — Art for the Orders *(asked 2026-10-21; open)*
- **Context:** T10.15 needs four order marks, an Orders icon and placeholders for the four opening scenes.
- **Options:** (a) Draw them in code as in v0.9, and you approve them. (b) You supply them. (c) Text-only scenes, with the marks only on the card.
- **Recommendation:** (a), as you chose for v0.9.
- **Blocks:** T10.15 only.
- **Answer (owner):** *(open)*

### Q37 — The Bell-Watchers' sharper "where to look" *(asked 2026-10-21; open)*
- **Context:** the Bell-Watchers' story perk (D411) adds one sentence to a still-missing name's hint, built by a stated rule from the roll: how many springs, from which year to which year, and from which villages (OUT-3 E3). It adds no name and no source, but it tells the player something the Names view does not say today. Once a group is found, the perk shows a remark by Halina or Dana instead.
- **Options:** (a) Keep it as written. (b) Keep only the old hint text, so the Bell-Watchers' perk is the clue-time number alone (and the remarks). (c) Keep it, but give only the villages, not the years.
- **Recommendation:** (a). The players who care about the 40 names are the ones this helps, and it points at no document. Choose (b) if you want the hunt left exactly as it is.
- **Blocks:** T10.10 (the Names sentence). If unanswered, Claude Code builds (a).
- **Answer (owner):** *(open)*
